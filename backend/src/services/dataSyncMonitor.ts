/**
 * 数据同步监控服务
 * 监控统计缓存同步状态，检测异常并自动修复
 */

import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { createStatisticsCache } from '../utils/statisticsCache';

export interface SyncAlert {
  id: string;
  timestamp: string;
  type: 'DATA_LAG' | 'LOW_DATA_VOLUME' | 'MISSING_FIELD_DATA' | 'DATA_INCONSISTENCY' | 'CACHE_UNAVAILABLE' | 'SYNC_FAILURE';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data?: any;
  resolved: boolean;
}

export interface SyncMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  alertsGenerated: number;
  lastCheck: string | null;
  consecutiveFailures: number;
}

export interface SyncStatus {
  isHealthy: boolean;
  lastUpdated: string;
  dataLag: number;
  fieldStats: Record<string, number>;
  cacheSource: string;
  variance: number;
  alerts: SyncAlert[];
}

export class DataSyncMonitor {
  private alerts: SyncAlert[] = [];
  private metrics: SyncMetrics = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    alertsGenerated: 0,
    lastCheck: null,
    consecutiveFailures: 0
  };

  private readonly alertThresholds = {
    dataLag: 10 * 60 * 1000, // 10分钟
    syncFailure: 3, // 连续3次失败
    lowDataVolume: 50, // 数据量低于50条
    dataVariance: 50 // 字段间数据量差异超过50
  };

  constructor(private env: Env) {}

  /**
   * 生成告警
   */
  private generateAlert(
    type: SyncAlert['type'],
    message: string,
    severity: SyncAlert['severity'] = 'MEDIUM',
    data?: any
  ): SyncAlert {
    const alert: SyncAlert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      severity,
      data,
      resolved: false
    };

    this.alerts.push(alert);
    this.metrics.alertsGenerated++;

    console.warn(`🚨 [DataSyncMonitor] 告警生成: ${message}`, { type, severity, data });

    // 保持最近100个告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return alert;
  }

  /**
   * 检查数据同步状态
   */
  async checkSyncStatus(questionnaireId: string = 'employment-survey-2024'): Promise<SyncStatus> {
    console.log(`🔍 [DataSyncMonitor] 检查数据同步状态: ${questionnaireId}`);
    
    this.metrics.totalChecks++;
    this.metrics.lastCheck = new Date().toISOString();

    try {
      const db = createDatabaseService(this.env);
      const statisticsCache = createStatisticsCache(db);

      // 1. 获取统计数据
      const cachedData = await statisticsCache.getCachedStatistics(questionnaireId);
      
      if (!cachedData) {
        this.generateAlert(
          'CACHE_UNAVAILABLE',
          '统计缓存数据不可用',
          'HIGH'
        );
        
        this.metrics.failedChecks++;
        this.metrics.consecutiveFailures++;
        
        return {
          isHealthy: false,
          lastUpdated: '',
          dataLag: 0,
          fieldStats: {},
          cacheSource: 'none',
          variance: 0,
          alerts: this.getActiveAlerts()
        };
      }

      const statistics = cachedData.statistics;
      const lastUpdated = cachedData.lastUpdated;

      // 2. 检查数据延迟
      const dataLag = Date.now() - new Date(lastUpdated).getTime();
      
      if (dataLag > this.alertThresholds.dataLag) {
        this.generateAlert(
          'DATA_LAG',
          `数据延迟过大: ${Math.round(dataLag / 1000 / 60)} 分钟`,
          'HIGH',
          { dataLag, lastUpdated }
        );
      }

      // 3. 检查关键字段数据量
      const keyFields = ['age-range', 'gender', 'work-location-preference', 'education-level'];
      const fieldStats: Record<string, number> = {};

      for (const field of keyFields) {
        const fieldData = statistics[field];
        if (fieldData) {
          fieldStats[field] = fieldData.totalResponses;

          // 检查数据量是否过低
          if (fieldData.totalResponses < this.alertThresholds.lowDataVolume) {
            this.generateAlert(
              'LOW_DATA_VOLUME',
              `字段 ${field} 数据量过低: ${fieldData.totalResponses} 条`,
              'MEDIUM',
              { field, totalResponses: fieldData.totalResponses }
            );
          }
        } else {
          fieldStats[field] = 0;
          this.generateAlert(
            'MISSING_FIELD_DATA',
            `字段 ${field} 缺少统计数据`,
            'HIGH',
            { field }
          );
        }
      }

      // 4. 检查数据一致性
      const responseCounts = Object.values(fieldStats);
      const maxCount = Math.max(...responseCounts);
      const minCount = Math.min(...responseCounts);
      const variance = maxCount - minCount;

      if (variance > this.alertThresholds.dataVariance) {
        this.generateAlert(
          'DATA_INCONSISTENCY',
          `关键字段数据量差异过大: 最大${maxCount}, 最小${minCount}, 差异${variance}`,
          'HIGH',
          { fieldStats, variance }
        );
      }

      // 重置连续失败计数
      this.metrics.consecutiveFailures = 0;
      this.metrics.successfulChecks++;

      const isHealthy = dataLag <= this.alertThresholds.dataLag && 
                       variance <= this.alertThresholds.dataVariance &&
                       Math.min(...responseCounts) >= this.alertThresholds.lowDataVolume;

      console.log(`✅ [DataSyncMonitor] 同步状态检查完成`, {
        isHealthy,
        dataLag: Math.round(dataLag / 1000 / 60),
        variance,
        fieldStats
      });

      return {
        isHealthy,
        lastUpdated,
        dataLag,
        fieldStats,
        cacheSource: 'cache',
        variance,
        alerts: this.getActiveAlerts()
      };

    } catch (error) {
      this.metrics.failedChecks++;
      this.metrics.consecutiveFailures++;

      console.error(`❌ [DataSyncMonitor] 同步状态检查失败:`, error);

      // 连续失败告警
      if (this.metrics.consecutiveFailures >= this.alertThresholds.syncFailure) {
        this.generateAlert(
          'SYNC_FAILURE',
          `连续 ${this.metrics.consecutiveFailures} 次同步检查失败`,
          'CRITICAL',
          { error: error.message, consecutiveFailures: this.metrics.consecutiveFailures }
        );
      }

      return {
        isHealthy: false,
        lastUpdated: '',
        dataLag: 0,
        fieldStats: {},
        cacheSource: 'error',
        variance: 0,
        alerts: this.getActiveAlerts()
      };
    }
  }

  /**
   * 尝试自动修复同步问题
   */
  async attemptAutoRepair(questionnaireId: string = 'employment-survey-2024'): Promise<boolean> {
    console.log(`🔧 [DataSyncMonitor] 尝试自动修复同步问题: ${questionnaireId}`);

    try {
      const db = createDatabaseService(this.env);
      const statisticsCache = createStatisticsCache(db);

      // 强制更新统计缓存
      const updateResult = await statisticsCache.updateQuestionnaireStatistics(questionnaireId);

      if (updateResult.success) {
        console.log(`✅ [DataSyncMonitor] 自动修复成功`, updateResult);
        
        // 标记相关告警为已解决
        this.resolveAlerts(['CACHE_UNAVAILABLE', 'DATA_LAG', 'SYNC_FAILURE']);
        
        return true;
      } else {
        console.error(`❌ [DataSyncMonitor] 自动修复失败`, updateResult.errors);
        return false;
      }

    } catch (error) {
      console.error(`❌ [DataSyncMonitor] 自动修复异常:`, error);
      return false;
    }
  }

  /**
   * 解决告警
   */
  private resolveAlerts(types: SyncAlert['type'][]): void {
    this.alerts.forEach(alert => {
      if (types.includes(alert.type) && !alert.resolved) {
        alert.resolved = true;
        console.log(`✅ [DataSyncMonitor] 告警已解决: ${alert.message}`);
      }
    });
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): SyncAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * 获取监控指标
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取所有告警
   */
  getAllAlerts(): SyncAlert[] {
    return [...this.alerts];
  }

  /**
   * 清理旧告警
   */
  cleanupOldAlerts(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
  }
}

// 全局监控实例
let globalMonitor: DataSyncMonitor | null = null;

/**
 * 获取全局监控实例
 */
export function getDataSyncMonitor(env: Env): DataSyncMonitor {
  if (!globalMonitor) {
    globalMonitor = new DataSyncMonitor(env);
  }
  return globalMonitor;
}

/**
 * 定时监控任务处理器
 */
export async function handleSyncMonitoringTask(env: Env): Promise<void> {
  const monitor = getDataSyncMonitor(env);
  
  try {
    const status = await monitor.checkSyncStatus();
    
    // 如果不健康且有连续失败，尝试自动修复
    if (!status.isHealthy && monitor.getMetrics().consecutiveFailures >= 2) {
      console.log(`🔧 [DataSyncMonitor] 检测到同步问题，尝试自动修复`);
      await monitor.attemptAutoRepair();
    }
    
    // 清理旧告警
    monitor.cleanupOldAlerts();
    
  } catch (error) {
    console.error(`❌ [DataSyncMonitor] 监控任务执行失败:`, error);
  }
}

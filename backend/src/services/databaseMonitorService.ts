/**
 * 数据库监测服务
 * 提供数据库健康监控、数据流转监测和管理功能
 */

import type { DatabaseService } from '../db';

// 数据流转状态接口
export interface DataFlowStatus {
  stage: string;
  tableName: string;
  recordCount: number;
  lastUpdate: string;
  status: 'healthy' | 'warning' | 'error';
  processingTime: number;
  errorMessage?: string;
}

// 表健康状态接口
export interface TableHealth {
  tableName: string;
  recordCount: number;
  qualityScore: number;
  lastUpdate: string;
  growthRate: number;
  issues: string[];
  status: 'healthy' | 'warning' | 'error';
}

// 同步任务状态接口
export interface SyncTaskStatus {
  taskId: string;
  taskName: string;
  sourceTable: string;
  targetTable: string;
  lastRun: string;
  nextRun: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  duration: number;
  recordsProcessed: number;
  errorMessage?: string;
}

// 告警信息接口
export interface AlertInfo {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
  source: string;
}

// 监控配置接口
export interface MonitorConfig {
  refreshInterval: number;
  qualityThreshold: number;
  processingTimeThreshold: number;
  autoRepair: boolean;
  alertChannels: string[];
}

export class DatabaseMonitorService {
  constructor(private db: DatabaseService) {}

  /**
   * 获取数据库总览信息
   */
  async getOverview() {
    try {
      // 获取所有表的基本信息
      const tables = await this.db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      // 统计健康表数量
      const healthyTables = await this.getHealthyTableCount();
      
      // 获取活跃告警数量
      const activeAlerts = await this.getActiveAlertCount();
      
      // 获取同步任务数量
      const syncTaskCount = await this.getSyncTaskCount();

      return {
        totalTables: tables.length,
        healthyTables: healthyTables,
        activeAlerts: activeAlerts,
        syncTasks: syncTaskCount,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取数据库总览失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据流转状态
   */
  async getDataFlowStatus(): Promise<DataFlowStatus[]> {
    try {
      const flows: DataFlowStatus[] = [];

      // 测试数据阶段
      const testData = await this.getTableStatus('test_story_data', '测试数据');
      if (testData) flows.push(testData);

      // 原始数据阶段
      const rawData = await this.getTableStatus('raw_story_submissions', '原始数据');
      if (rawData) flows.push(rawData);

      // 有效数据阶段
      const validData = await this.getTableStatus('valid_stories', '有效数据');
      if (validData) flows.push(validData);

      // 统计缓存阶段
      const statsData = await this.getTableStatus('participation_stats', '统计缓存');
      if (statsData) flows.push(statsData);

      return flows;
    } catch (error) {
      console.error('获取数据流转状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取表健康状态
   */
  async getTableHealthStatus(): Promise<TableHealth[]> {
    try {
      const healthData: TableHealth[] = [];
      
      // 主要业务表
      const mainTables = [
        'universal_questionnaire_responses',
        'valid_heart_voices',
        'valid_stories',
        'raw_story_submissions',
        'raw_heart_voices'
      ];

      for (const tableName of mainTables) {
        try {
          const health = await this.analyzeTableHealth(tableName);
          if (health) {
            healthData.push(health);
          }
        } catch (error) {
          console.error(`分析表 ${tableName} 健康状态失败:`, error);
          // 继续处理其他表
        }
      }

      return healthData;
    } catch (error) {
      console.error('获取表健康状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取同步任务状态
   */
  async getSyncTaskStatus(): Promise<SyncTaskStatus[]> {
    try {
      // 模拟同步任务状态（实际项目中应该从任务调度系统获取）
      return [
        {
          taskId: 'sync-test-to-raw',
          taskName: '测试数据到原始数据同步',
          sourceTable: 'test_story_data',
          targetTable: 'raw_story_submissions',
          lastRun: new Date(Date.now() - 3600000).toISOString(),
          nextRun: new Date(Date.now() + 3600000).toISOString(),
          status: 'success',
          duration: 45000,
          recordsProcessed: 25
        },
        {
          taskId: 'sync-raw-to-valid',
          taskName: '原始数据审核同步',
          sourceTable: 'raw_story_submissions',
          targetTable: 'valid_stories',
          lastRun: new Date(Date.now() - 1800000).toISOString(),
          nextRun: new Date(Date.now() + 1800000).toISOString(),
          status: 'pending',
          duration: 0,
          recordsProcessed: 0
        },
        {
          taskId: 'sync-stats-update',
          taskName: '统计数据更新',
          sourceTable: 'valid_stories',
          targetTable: 'participation_stats',
          lastRun: new Date(Date.now() - 900000).toISOString(),
          nextRun: new Date(Date.now() + 900000).toISOString(),
          status: 'failed',
          duration: 0,
          recordsProcessed: 0,
          errorMessage: '统计计算服务连接超时'
        }
      ];
    } catch (error) {
      console.error('获取同步任务状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警信息
   */
  async getAlerts(): Promise<AlertInfo[]> {
    try {
      // 实际项目中应该从告警系统获取
      const alerts: AlertInfo[] = [];

      // 检查数据质量告警
      const qualityAlerts = await this.checkDataQualityAlerts();
      alerts.push(...qualityAlerts);

      // 检查同步延迟告警
      const syncAlerts = await this.checkSyncDelayAlerts();
      alerts.push(...syncAlerts);

      return alerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('获取告警信息失败:', error);
      throw error;
    }
  }

  /**
   * 触发同步任务
   */
  async triggerSyncTask(taskId: string) {
    try {
      console.log(`触发同步任务: ${taskId}`);
      
      // 实际项目中应该调用任务调度系统
      // 这里模拟触发过程
      
      return {
        taskId,
        status: 'triggered',
        message: '同步任务已触发',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('触发同步任务失败:', error);
      throw error;
    }
  }

  /**
   * 重新同步所有数据
   */
  async resyncAllData() {
    try {
      console.log('开始重新同步所有数据');
      
      // 实际项目中应该按顺序触发所有同步任务
      const tasks = ['sync-test-to-raw', 'sync-raw-to-valid', 'sync-stats-update'];
      const results = [];
      
      for (const taskId of tasks) {
        const result = await this.triggerSyncTask(taskId);
        results.push(result);
      }
      
      return {
        message: '所有数据重新同步已触发',
        tasks: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('重新同步所有数据失败:', error);
      throw error;
    }
  }

  /**
   * 刷新统计缓存
   */
  async refreshStatisticsCache() {
    try {
      console.log('开始刷新统计缓存');
      
      // 重新计算统计数据
      const questionnaireStat = await this.db.queryFirst(`
        SELECT COUNT(*) as count FROM universal_questionnaire_responses
      `);
      
      const storiesStat = await this.db.queryFirst(`
        SELECT COUNT(*) as count FROM valid_stories
      `);
      
      const voicesStat = await this.db.queryFirst(`
        SELECT COUNT(*) as count FROM valid_heart_voices
      `);
      
      return {
        message: '统计缓存刷新完成',
        stats: {
          questionnaires: questionnaireStat?.count || 0,
          stories: storiesStat?.count || 0,
          voices: voicesStat?.count || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('刷新统计缓存失败:', error);
      throw error;
    }
  }

  /**
   * 执行数据质量检查
   */
  async performQualityCheck() {
    try {
      console.log('开始执行数据质量检查');
      
      const issues = [];
      
      // 检查重复数据
      const duplicates = await this.checkDuplicateData();
      if (duplicates.length > 0) {
        issues.push(...duplicates);
      }
      
      // 检查数据完整性
      const integrity = await this.checkDataIntegrity();
      if (integrity.length > 0) {
        issues.push(...integrity);
      }
      
      return {
        message: '数据质量检查完成',
        issues: issues,
        score: Math.max(0, 100 - issues.length * 10),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('数据质量检查失败:', error);
      throw error;
    }
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData() {
    try {
      console.log('开始清理测试数据');
      
      // 实际项目中应该谨慎执行删除操作
      const testTables = ['test_story_data', 'test_questionnaire_data'];
      const results = [];
      
      for (const table of testTables) {
        try {
          const result = await this.db.execute(`DELETE FROM ${table} WHERE quality_score < 60`);
          results.push({
            table,
            deletedRows: result.meta?.changes || 0
          });
        } catch (error) {
          console.error(`清理表 ${table} 失败:`, error);
        }
      }
      
      return {
        message: '测试数据清理完成',
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('清理测试数据失败:', error);
      throw error;
    }
  }

  // 私有辅助方法
  private async getTableStatus(tableName: string, stage: string): Promise<DataFlowStatus | null> {
    try {
      // 检查表是否存在
      const tableExists = await this.db.queryFirst(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `, [tableName]);

      if (!tableExists) {
        return null;
      }

      // 获取记录数
      const countResult = await this.db.queryFirst(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = countResult?.count || 0;

      // 模拟处理时间和状态
      const processingTime = Math.floor(Math.random() * 200) + 50;
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      let errorMessage: string | undefined;

      // 根据记录数和表名判断状态
      if (recordCount === 0) {
        status = 'warning';
        errorMessage = '暂无数据';
      } else if (tableName === 'participation_stats' && recordCount < 4) {
        status = 'error';
        errorMessage = '统计数据不完整';
      }

      return {
        stage,
        tableName,
        recordCount,
        lastUpdate: new Date().toISOString(),
        status,
        processingTime,
        errorMessage
      };
    } catch (error) {
      console.error(`获取表 ${tableName} 状态失败:`, error);
      return {
        stage,
        tableName,
        recordCount: 0,
        lastUpdate: new Date().toISOString(),
        status: 'error',
        processingTime: 0,
        errorMessage: '查询失败'
      };
    }
  }

  private async analyzeTableHealth(tableName: string): Promise<TableHealth | null> {
    try {
      // 检查表是否存在
      const tableExists = await this.db.queryFirst(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `, [tableName]);

      if (!tableExists) {
        return null;
      }

      // 获取记录数
      const countResult = await this.db.queryFirst(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = countResult?.count || 0;

      // 模拟质量评分和增长率
      const qualityScore = Math.floor(Math.random() * 20) + 80; // 80-100
      const growthRate = (Math.random() - 0.5) * 20; // -10% to +10%

      // 分析问题
      const issues: string[] = [];
      if (qualityScore < 85) {
        issues.push('数据质量评分偏低');
      }
      if (growthRate < -5) {
        issues.push('数据增长率下降');
      }
      if (recordCount === 0) {
        issues.push('表中无数据');
      }

      // 确定状态
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (issues.length > 2 || qualityScore < 80) {
        status = 'error';
      } else if (issues.length > 0 || qualityScore < 90) {
        status = 'warning';
      }

      return {
        tableName,
        recordCount,
        qualityScore,
        lastUpdate: new Date().toISOString(),
        growthRate,
        issues,
        status
      };
    } catch (error) {
      console.error(`分析表 ${tableName} 健康状态失败:`, error);
      return null;
    }
  }

  private async getHealthyTableCount(): Promise<number> {
    // 模拟健康表数量计算
    return 8;
  }

  private async getActiveAlertCount(): Promise<number> {
    // 模拟活跃告警数量计算
    return 2;
  }

  private async getSyncTaskCount(): Promise<number> {
    // 模拟同步任务数量计算
    return 3;
  }

  private async checkDataQualityAlerts(): Promise<AlertInfo[]> {
    // 模拟数据质量告警检查
    return [
      {
        id: 'alert-001',
        level: 'warning',
        message: '心声数据质量评分下降到88分',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        resolved: false,
        source: 'data_quality_monitor'
      }
    ];
  }

  private async checkSyncDelayAlerts(): Promise<AlertInfo[]> {
    // 模拟同步延迟告警检查
    return [
      {
        id: 'alert-002',
        level: 'error',
        message: '统计数据更新失败，影响首页显示',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        resolved: false,
        source: 'sync_monitor'
      }
    ];
  }

  private async checkDuplicateData(): Promise<string[]> {
    // 模拟重复数据检查
    return [];
  }

  private async checkDataIntegrity(): Promise<string[]> {
    // 模拟数据完整性检查
    return ['部分记录缺少必填字段'];
  }

  async getPerformanceMetrics() {
    // 模拟性能指标
    return {
      queryResponseTime: Math.floor(Math.random() * 100) + 50,
      connectionCount: Math.floor(Math.random() * 10) + 5,
      cacheHitRate: Math.floor(Math.random() * 20) + 80,
      timestamp: new Date().toISOString()
    };
  }

  async updateMonitorConfig(config: Partial<MonitorConfig>) {
    // 模拟配置更新
    console.log('更新监控配置:', config);
    return { success: true, timestamp: new Date().toISOString() };
  }

  async getMonitorConfig(): Promise<MonitorConfig> {
    // 模拟获取配置
    return {
      refreshInterval: 30,
      qualityThreshold: 80,
      processingTimeThreshold: 5000,
      autoRepair: false,
      alertChannels: ['email', 'system']
    };
  }

  async performHealthCheck() {
    // 模拟健康检查
    return {
      status: 'healthy',
      checks: {
        database: 'healthy',
        tables: 'healthy',
        sync: 'warning',
        performance: 'healthy'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 数据库监测服务
 * 提供数据库健康监控、数据流转监测和管理功能的API调用
 */

import type { AxiosInstance } from 'axios';
import { apiClient } from './api';

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

// 数据库总览接口
export interface DatabaseOverview {
  totalTables: number;
  healthyTables: number;
  activeAlerts: number;
  syncTasks: number;
  lastUpdate: string;
}

// 性能指标接口
export interface PerformanceMetrics {
  queryResponseTime: number;
  connectionCount: number;
  cacheHitRate: number;
  timestamp: string;
}

// 健康检查结果接口
export interface HealthCheckResult {
  status: string;
  checks: {
    database: string;
    tables: string;
    sync: string;
    performance: string;
  };
  timestamp: string;
}

class DatabaseMonitorService {
  private api: AxiosInstance;

  constructor() {
    this.api = apiClient;
  }

  /**
   * 获取数据库总览信息
   */
  async getOverview(): Promise<DatabaseOverview> {
    try {
      const response = await this.api.get('/database-monitor/overview');
      return response.data.data;
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
      const response = await this.api.get('/database-monitor/data-flow');
      return response.data.data;
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
      const response = await this.api.get('/database-monitor/table-health');
      return response.data.data;
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
      const response = await this.api.get('/database-monitor/sync-tasks');
      return response.data.data;
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
      const response = await this.api.get('/database-monitor/alerts');
      return response.data.data;
    } catch (error) {
      console.error('获取告警信息失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发同步任务
   */
  async triggerSyncTask(taskId: string): Promise<any> {
    try {
      const response = await this.api.post(`/database-monitor/sync-tasks/${taskId}/trigger`);
      return response.data.data;
    } catch (error) {
      console.error('触发同步任务失败:', error);
      throw error;
    }
  }

  /**
   * 数据修复工具
   */
  async performRepairAction(action: string): Promise<any> {
    try {
      const response = await this.api.post(`/database-monitor/repair/${action}`);
      return response.data.data;
    } catch (error) {
      console.error('数据修复操作失败:', error);
      throw error;
    }
  }

  /**
   * 重新同步所有数据
   */
  async resyncAllData(): Promise<any> {
    return this.performRepairAction('resync-all');
  }

  /**
   * 刷新统计缓存
   */
  async refreshStatisticsCache(): Promise<any> {
    return this.performRepairAction('refresh-stats');
  }

  /**
   * 执行数据质量检查
   */
  async performQualityCheck(): Promise<any> {
    return this.performRepairAction('quality-check');
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData(): Promise<any> {
    return this.performRepairAction('cleanup-test');
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await this.api.get('/database-monitor/performance');
      return response.data.data;
    } catch (error) {
      console.error('获取性能指标失败:', error);
      throw error;
    }
  }

  /**
   * 更新监控配置
   */
  async updateMonitorConfig(config: Partial<MonitorConfig>): Promise<any> {
    try {
      const response = await this.api.put('/database-monitor/config', config);
      return response.data.data;
    } catch (error) {
      console.error('更新监控配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取监控配置
   */
  async getMonitorConfig(): Promise<MonitorConfig> {
    try {
      const response = await this.api.get('/database-monitor/config');
      return response.data.data;
    } catch (error) {
      console.error('获取监控配置失败:', error);
      throw error;
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await this.api.get('/database-monitor/health');
      return response.data.data;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  /**
   * 获取完整监控数据（用于页面初始化）
   */
  async getFullMonitoringData(): Promise<{
    overview: DatabaseOverview;
    dataFlow: DataFlowStatus[];
    tableHealth: TableHealth[];
    syncTasks: SyncTaskStatus[];
    alerts: AlertInfo[];
    performance: PerformanceMetrics;
  }> {
    try {
      const [
        overview,
        dataFlow,
        tableHealth,
        syncTasks,
        alerts,
        performance
      ] = await Promise.all([
        this.getOverview(),
        this.getDataFlowStatus(),
        this.getTableHealthStatus(),
        this.getSyncTaskStatus(),
        this.getAlerts(),
        this.getPerformanceMetrics()
      ]);

      return {
        overview,
        dataFlow,
        tableHealth,
        syncTasks,
        alerts,
        performance
      };
    } catch (error) {
      console.error('获取完整监控数据失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const databaseMonitorService = new DatabaseMonitorService();

// 导出类型和服务
export default databaseMonitorService;
export type {
  DataFlowStatus,
  TableHealth,
  SyncTaskStatus,
  AlertInfo,
  MonitorConfig,
  DatabaseOverview,
  PerformanceMetrics,
  HealthCheckResult
};

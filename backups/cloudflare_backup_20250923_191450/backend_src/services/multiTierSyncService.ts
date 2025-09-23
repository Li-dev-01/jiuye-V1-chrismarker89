/**
 * 多级专用表同步服务
 * 实现主表到业务专用表、统计缓存表、视图缓存表的多层同步
 */

import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface SyncConfig {
  syncName: string;
  sourceTable: string;
  targetTable: string;
  syncType: 'realtime' | 'scheduled' | 'threshold';
  syncFrequency: number; // 秒
  batchSize: number;
  changeThreshold: number;
  isEnabled: boolean;
}

export interface SyncTask {
  id?: number;
  taskType: string;
  sourceTable: string;
  targetTable: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: string;
  batchSize: number;
  processedRecords?: number;
  successRecords?: number;
  failedRecords?: number;
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface SyncMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  lastSyncTime: string;
  pendingChanges: number;
}

export class MultiTierSyncService {
  private db: DatabaseService;
  private env: Env;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env.DB!);
  }

  /**
   * 启动同步服务
   */
  async startSyncService(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 同步服务已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('🚀 启动多级专用表同步服务');

    // 立即执行一次同步
    await this.executeScheduledSync();

    // 设置定时同步 (每分钟检查一次)
    this.syncInterval = setInterval(async () => {
      await this.executeScheduledSync();
    }, 60 * 1000);

    console.log('✅ 同步服务启动成功');
  }

  /**
   * 停止同步服务
   */
  stopSyncService(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ 同步服务已停止');
  }

  /**
   * 执行定时同步
   */
  private async executeScheduledSync(): Promise<void> {
    try {
      // 1. 获取需要执行的同步配置
      const configs = await this.getActiveSyncConfigs();
      
      for (const config of configs) {
        if (await this.shouldExecuteSync(config)) {
          await this.executeSyncConfig(config);
        }
      }

      // 2. 处理同步任务队列
      await this.processTaskQueue();

      // 3. 清理过期缓存
      await this.cleanupExpiredCache();

    } catch (error) {
      console.error('❌ 定时同步执行失败:', error);
    }
  }

  /**
   * 获取活跃的同步配置
   */
  private async getActiveSyncConfigs(): Promise<SyncConfig[]> {
    const configs = await this.db.query<SyncConfig>(`
      SELECT * FROM sync_configuration 
      WHERE is_enabled = 1 AND sync_type = 'scheduled'
      ORDER BY sync_name
    `);

    return configs;
  }

  /**
   * 判断是否应该执行同步
   */
  private async shouldExecuteSync(config: SyncConfig): Promise<boolean> {
    const now = Date.now();
    const lastSyncTime = config.last_sync_time ? new Date(config.last_sync_time).getTime() : 0;
    const timeSinceLastSync = now - lastSyncTime;

    // 检查时间间隔
    if (timeSinceLastSync < config.syncFrequency * 1000) {
      return false;
    }

    // 检查变更阈值
    if (config.syncType === 'threshold' && config.pending_changes < config.changeThreshold) {
      return false;
    }

    return true;
  }

  /**
   * 执行同步配置
   */
  private async executeSyncConfig(config: SyncConfig): Promise<void> {
    console.log(`🔄 执行同步: ${config.syncName}`);
    
    const startTime = Date.now();
    let processedRecords = 0;
    let successRecords = 0;
    let failedRecords = 0;
    let errorMessage = '';

    try {
      // 根据同步类型执行不同的同步逻辑
      switch (config.syncName) {
        case 'analytics_to_realtime_stats':
          ({ processedRecords, successRecords, failedRecords } = await this.syncAnalyticsToRealtimeStats());
          break;
        case 'analytics_to_aggregated':
          ({ processedRecords, successRecords, failedRecords } = await this.syncAnalyticsToAggregated());
          break;
        case 'stats_to_dashboard':
          ({ processedRecords, successRecords, failedRecords } = await this.syncStatsToDashboard());
          break;
        case 'stats_to_visualization':
          ({ processedRecords, successRecords, failedRecords } = await this.syncStatsToVisualization());
          break;
        default:
          console.log(`⚠️ 未知的同步配置: ${config.syncName}`);
          return;
      }

      // 更新同步配置状态
      await this.updateSyncConfigStatus(config.syncName, true);

    } catch (error) {
      console.error(`❌ 同步失败 ${config.syncName}:`, error);
      errorMessage = error instanceof Error ? error.message : '同步执行失败';
      await this.updateSyncConfigStatus(config.syncName, false);
    }

    // 记录同步日志
    await this.logSyncExecution({
      syncConfigId: config.id,
      executionType: 'scheduled',
      sourceTable: config.sourceTable,
      targetTable: config.targetTable,
      status: errorMessage ? 'failed' : 'success',
      recordsProcessed: processedRecords,
      recordsSuccess: successRecords,
      recordsFailed: failedRecords,
      executionTimeMs: Date.now() - startTime,
      errorMessage
    });
  }

  /**
   * 同步分析表到实时统计表
   */
  private async syncAnalyticsToRealtimeStats(): Promise<{ processedRecords: number; successRecords: number; failedRecords: number }> {
    console.log('📊 同步分析表到实时统计表');

    let processedRecords = 0;
    let successRecords = 0;
    let failedRecords = 0;

    try {
      // 1. 年龄分布统计
      const ageStats = await this.db.query(`
        SELECT 
          age_range,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage
        FROM analytics_responses 
        WHERE is_test_data = 1 AND age_range IS NOT NULL
        GROUP BY age_range
      `);

      for (const stat of ageStats) {
        await this.upsertRealtimeStat({
          statKey: `age_distribution_${stat.age_range}`,
          statCategory: 'demographics',
          countValue: stat.count,
          percentageValue: stat.percentage,
          timeWindow: '5min',
          totalSampleSize: await this.getTotalSampleSize()
        });
        processedRecords++;
        successRecords++;
      }

      // 2. 就业状态统计
      const employmentStats = await this.db.query(`
        SELECT 
          employment_status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage
        FROM analytics_responses 
        WHERE is_test_data = 1 AND employment_status IS NOT NULL
        GROUP BY employment_status
      `);

      for (const stat of employmentStats) {
        await this.upsertRealtimeStat({
          statKey: `employment_status_${stat.employment_status}`,
          statCategory: 'employment',
          countValue: stat.count,
          percentageValue: stat.percentage,
          timeWindow: '5min',
          totalSampleSize: await this.getTotalSampleSize()
        });
        processedRecords++;
        successRecords++;
      }

      // 3. 教育水平统计
      const educationStats = await this.db.query(`
        SELECT 
          education_level,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage
        FROM analytics_responses 
        WHERE is_test_data = 1 AND education_level IS NOT NULL
        GROUP BY education_level
      `);

      for (const stat of educationStats) {
        await this.upsertRealtimeStat({
          statKey: `education_level_${stat.education_level}`,
          statCategory: 'education',
          countValue: stat.count,
          percentageValue: stat.percentage,
          timeWindow: '5min',
          totalSampleSize: await this.getTotalSampleSize()
        });
        processedRecords++;
        successRecords++;
      }

      console.log(`✅ 实时统计同步完成: 处理 ${processedRecords} 条记录`);

    } catch (error) {
      console.error('❌ 实时统计同步失败:', error);
      failedRecords = processedRecords - successRecords;
      throw error;
    }

    return { processedRecords, successRecords, failedRecords };
  }

  /**
   * 同步分析表到聚合统计表
   */
  private async syncAnalyticsToAggregated(): Promise<{ processedRecords: number; successRecords: number; failedRecords: number }> {
    console.log('📈 同步分析表到聚合统计表');

    let processedRecords = 0;
    let successRecords = 0;
    let failedRecords = 0;

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. 日统计 - 年龄分布
      const dailyAgeStats = await this.db.query(`
        SELECT 
          age_range,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM analytics_responses 
            WHERE is_test_data = 1 AND date(submitted_at) = date('now')
          ), 2) as percentage
        FROM analytics_responses 
        WHERE is_test_data = 1 AND date(submitted_at) = date('now') AND age_range IS NOT NULL
        GROUP BY age_range
      `);

      for (const stat of dailyAgeStats) {
        await this.upsertAggregatedStat({
          dimension: 'age',
          dimensionValue: stat.age_range,
          count: stat.count,
          percentage: stat.percentage,
          periodType: 'daily',
          periodDate: today,
          sampleSize: await this.getDailySampleSize()
        });
        processedRecords++;
        successRecords++;
      }

      // 2. 日统计 - 就业状态
      const dailyEmploymentStats = await this.db.query(`
        SELECT 
          employment_status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM analytics_responses 
            WHERE is_test_data = 1 AND date(submitted_at) = date('now')
          ), 2) as percentage
        FROM analytics_responses 
        WHERE is_test_data = 1 AND date(submitted_at) = date('now') AND employment_status IS NOT NULL
        GROUP BY employment_status
      `);

      for (const stat of dailyEmploymentStats) {
        await this.upsertAggregatedStat({
          dimension: 'employment',
          dimensionValue: stat.employment_status,
          count: stat.count,
          percentage: stat.percentage,
          periodType: 'daily',
          periodDate: today,
          sampleSize: await this.getDailySampleSize()
        });
        processedRecords++;
        successRecords++;
      }

      console.log(`✅ 聚合统计同步完成: 处理 ${processedRecords} 条记录`);

    } catch (error) {
      console.error('❌ 聚合统计同步失败:', error);
      failedRecords = processedRecords - successRecords;
      throw error;
    }

    return { processedRecords, successRecords, failedRecords };
  }

  /**
   * 同步统计表到仪表板缓存
   */
  private async syncStatsToDashboard(): Promise<{ processedRecords: number; successRecords: number; failedRecords: number }> {
    console.log('📊 同步统计表到仪表板缓存');

    try {
      // 获取最新的统计数据
      const dashboardData = await this.generateDashboardData();
      
      // 更新仪表板缓存
      await this.upsertDashboardCache({
        cacheKey: 'main_dashboard',
        dashboardType: 'public',
        widgetData: JSON.stringify(dashboardData),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分钟过期
      });

      return { processedRecords: 1, successRecords: 1, failedRecords: 0 };

    } catch (error) {
      console.error('❌ 仪表板缓存同步失败:', error);
      return { processedRecords: 1, successRecords: 0, failedRecords: 1 };
    }
  }

  /**
   * 同步统计表到可视化缓存
   */
  private async syncStatsToVisualization(): Promise<{ processedRecords: number; successRecords: number; failedRecords: number }> {
    console.log('📈 同步统计表到可视化缓存');

    try {
      // 获取可视化数据
      const visualizationData = await this.generateVisualizationData();
      
      // 更新可视化缓存
      await this.upsertVisualizationCache({
        cacheKey: 'analytics_charts',
        visualizationType: 'chart',
        pageContext: 'analytics',
        chartData: JSON.stringify(visualizationData),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15分钟过期
      });

      return { processedRecords: 1, successRecords: 1, failedRecords: 0 };

    } catch (error) {
      console.error('❌ 可视化缓存同步失败:', error);
      return { processedRecords: 1, successRecords: 0, failedRecords: 1 };
    }
  }

  /**
   * 处理同步任务队列
   */
  private async processTaskQueue(): Promise<void> {
    const pendingTasks = await this.db.query<SyncTask>(`
      SELECT * FROM sync_task_queue 
      WHERE status = 'pending' AND scheduled_at <= datetime('now')
      ORDER BY priority ASC, scheduled_at ASC
      LIMIT 10
    `);

    for (const task of pendingTasks) {
      await this.executeTask(task);
    }
  }

  /**
   * 执行单个同步任务
   */
  private async executeTask(task: SyncTask): Promise<void> {
    try {
      // 更新任务状态为运行中
      await this.db.execute(`
        UPDATE sync_task_queue 
        SET status = 'running', started_at = datetime('now')
        WHERE id = ?
      `, [task.id]);

      // 执行任务逻辑 (根据任务类型)
      // 这里可以扩展更多任务类型的处理逻辑

      // 更新任务状态为完成
      await this.db.execute(`
        UPDATE sync_task_queue 
        SET status = 'completed', completed_at = datetime('now'),
            success_records = ?, processed_records = ?
        WHERE id = ?
      `, [1, 1, task.id]);

    } catch (error) {
      console.error(`❌ 任务执行失败 ${task.id}:`, error);
      
      // 更新任务状态为失败
      await this.db.execute(`
        UPDATE sync_task_queue 
        SET status = 'failed', completed_at = datetime('now'),
            error_message = ?, retry_count = retry_count + 1
        WHERE id = ?
      `, [error instanceof Error ? error.message : '任务执行失败', task.id]);
    }
  }

  /**
   * 清理过期缓存
   */
  private async cleanupExpiredCache(): Promise<void> {
    try {
      // 清理过期的仪表板缓存
      await this.db.execute(`
        DELETE FROM dashboard_cache 
        WHERE expires_at < datetime('now')
      `);

      // 清理过期的可视化缓存
      await this.db.execute(`
        DELETE FROM enhanced_visualization_cache 
        WHERE expires_at < datetime('now')
      `);

      // 清理过期的实时统计
      await this.db.execute(`
        DELETE FROM realtime_stats 
        WHERE time_window = '1min' AND window_end < datetime('now', '-1 hour')
      `);

    } catch (error) {
      console.error('❌ 缓存清理失败:', error);
    }
  }

  // 辅助方法
  private async getTotalSampleSize(): Promise<number> {
    const result = await this.db.queryFirst<{ count: number }>(`
      SELECT COUNT(*) as count FROM analytics_responses WHERE is_test_data = 1
    `);
    return result?.count || 0;
  }

  private async getDailySampleSize(): Promise<number> {
    const result = await this.db.queryFirst<{ count: number }>(`
      SELECT COUNT(*) as count FROM analytics_responses 
      WHERE is_test_data = 1 AND date(submitted_at) = date('now')
    `);
    return result?.count || 0;
  }

  private async upsertRealtimeStat(data: any): Promise<void> {
    await this.db.execute(`
      INSERT OR REPLACE INTO realtime_stats (
        stat_key, stat_category, count_value, percentage_value, 
        time_window, window_start, window_end, total_sample_size,
        last_updated, data_source
      ) VALUES (?, ?, ?, ?, ?, datetime('now', '-5 minutes'), datetime('now'), ?, datetime('now'), 'analytics_responses')
    `, [
      data.statKey, data.statCategory, data.countValue, data.percentageValue,
      data.timeWindow, data.totalSampleSize
    ]);
  }

  private async upsertAggregatedStat(data: any): Promise<void> {
    await this.db.execute(`
      INSERT OR REPLACE INTO aggregated_stats (
        dimension, dimension_value, count, percentage, 
        period_type, period_date, period_start, period_end,
        sample_size, last_calculated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      data.dimension, data.dimensionValue, data.count, data.percentage,
      data.periodType, data.periodDate, data.periodDate + ' 00:00:00', data.periodDate + ' 23:59:59',
      data.sampleSize
    ]);
  }

  private async upsertDashboardCache(data: any): Promise<void> {
    await this.db.execute(`
      INSERT OR REPLACE INTO dashboard_cache (
        cache_key, dashboard_type, widget_data, expires_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `, [data.cacheKey, data.dashboardType, data.widgetData, data.expiresAt]);
  }

  private async upsertVisualizationCache(data: any): Promise<void> {
    await this.db.execute(`
      INSERT OR REPLACE INTO enhanced_visualization_cache (
        cache_key, visualization_type, page_context, chart_data, expires_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [data.cacheKey, data.visualizationType, data.pageContext, data.chartData, data.expiresAt]);
  }

  private async generateDashboardData(): Promise<any> {
    // 生成仪表板数据的逻辑
    return {
      totalResponses: await this.getTotalSampleSize(),
      todayResponses: await this.getDailySampleSize(),
      topEmploymentStatus: await this.getTopEmploymentStatus(),
      ageDistribution: await this.getAgeDistribution()
    };
  }

  private async generateVisualizationData(): Promise<any> {
    // 生成可视化数据的逻辑
    return {
      charts: {
        ageDistribution: await this.getAgeDistribution(),
        employmentStatus: await this.getEmploymentDistribution(),
        educationLevel: await this.getEducationDistribution()
      }
    };
  }

  private async getTopEmploymentStatus(): Promise<string> {
    const result = await this.db.queryFirst<{ employment_status: string }>(`
      SELECT employment_status FROM analytics_responses 
      WHERE is_test_data = 1 AND employment_status IS NOT NULL
      GROUP BY employment_status 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    `);
    return result?.employment_status || 'unknown';
  }

  private async getAgeDistribution(): Promise<any[]> {
    return await this.db.query(`
      SELECT age_range, COUNT(*) as count 
      FROM analytics_responses 
      WHERE is_test_data = 1 AND age_range IS NOT NULL
      GROUP BY age_range 
      ORDER BY count DESC
    `);
  }

  private async getEmploymentDistribution(): Promise<any[]> {
    return await this.db.query(`
      SELECT employment_status, COUNT(*) as count 
      FROM analytics_responses 
      WHERE is_test_data = 1 AND employment_status IS NOT NULL
      GROUP BY employment_status 
      ORDER BY count DESC
    `);
  }

  private async getEducationDistribution(): Promise<any[]> {
    return await this.db.query(`
      SELECT education_level, COUNT(*) as count 
      FROM analytics_responses 
      WHERE is_test_data = 1 AND education_level IS NOT NULL
      GROUP BY education_level 
      ORDER BY count DESC
    `);
  }

  private async updateSyncConfigStatus(syncName: string, success: boolean): Promise<void> {
    await this.db.execute(`
      UPDATE sync_configuration 
      SET last_sync_time = datetime('now'),
          pending_changes = CASE WHEN ? THEN 0 ELSE pending_changes END
      WHERE sync_name = ?
    `, [success, syncName]);
  }

  private async logSyncExecution(data: any): Promise<void> {
    await this.db.execute(`
      INSERT INTO sync_execution_logs (
        sync_config_id, execution_type, source_table, target_table,
        status, records_processed, records_success, records_failed,
        execution_time_ms, error_message, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      data.syncConfigId, data.executionType, data.sourceTable, data.targetTable,
      data.status, data.recordsProcessed, data.recordsSuccess, data.recordsFailed,
      data.executionTimeMs, data.errorMessage
    ]);
  }

  /**
   * 获取同步状态摘要
   */
  async getSyncMetrics(): Promise<SyncMetrics> {
    const result = await this.db.queryFirst<SyncMetrics>(`
      SELECT 
        COUNT(*) as totalTasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedTasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedTasks,
        AVG(CASE WHEN execution_time_ms > 0 THEN execution_time_ms END) as averageExecutionTime,
        MAX(completed_at) as lastSyncTime,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingChanges
      FROM sync_execution_logs
      WHERE started_at > datetime('now', '-1 day')
    `);

    return result || {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      lastSyncTime: '',
      pendingChanges: 0
    };
  }

  /**
   * 手动触发同步
   */
  async triggerManualSync(syncName: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.db.queryFirst<SyncConfig>(`
        SELECT * FROM sync_configuration WHERE sync_name = ? AND is_enabled = 1
      `, [syncName]);

      if (!config) {
        return { success: false, message: '同步配置不存在或已禁用' };
      }

      await this.executeSyncConfig(config);
      return { success: true, message: '手动同步执行成功' };

    } catch (error) {
      console.error('❌ 手动同步失败:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '手动同步执行失败' 
      };
    }
  }
}

// 全局同步服务实例
let globalSyncService: MultiTierSyncService | null = null;

/**
 * 获取全局同步服务实例
 */
export function getMultiTierSyncService(env: Env): MultiTierSyncService {
  if (!globalSyncService) {
    globalSyncService = new MultiTierSyncService(env);
  }
  return globalSyncService;
}

/**
 * 定时同步任务处理器 (用于Cloudflare Workers Cron)
 */
export async function handleMultiTierSyncTask(env: Env): Promise<void> {
  const syncService = getMultiTierSyncService(env);
  
  try {
    // 执行一次同步检查
    await syncService.executeScheduledSync();
    console.log('✅ 多级同步任务执行完成');
    
  } catch (error) {
    console.error('❌ 多级同步任务执行失败:', error);
  }
}

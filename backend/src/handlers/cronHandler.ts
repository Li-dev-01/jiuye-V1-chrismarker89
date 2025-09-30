/**
 * Cloudflare Workers 定时任务处理器
 * 处理多级同步服务的定时任务
 */

import { MultiTierSyncService } from '../services/multiTierSyncService';
import { PerformanceMonitorService } from '../services/performanceMonitorService';
import { AutoCacheOptimizer } from '../../scripts/autoCacheOptimization';
import { createDatabaseService } from '../db';
import type { Env } from '../types/api';

export interface CronEvent {
  cron: string;
  type: 'cron';
  scheduledTime: number;
}

export class CronHandler {
  private env: Env;
  private syncService: MultiTierSyncService;
  private performanceMonitor: PerformanceMonitorService;
  private cacheOptimizer: AutoCacheOptimizer;

  constructor(env: Env) {
    this.env = env;
    const db = createDatabaseService(env);
    this.syncService = new MultiTierSyncService(db.db);
    this.performanceMonitor = new PerformanceMonitorService(db.db);
    this.cacheOptimizer = new AutoCacheOptimizer(db.db);
  }

  /**
   * 处理定时任务事件
   */
  async handleCronEvent(event: CronEvent): Promise<void> {
    const { cron, scheduledTime } = event;
    const scheduledDate = new Date(scheduledTime);
    
    console.log(`🕐 执行定时任务: ${cron} at ${scheduledDate.toISOString()}`);

    try {
      switch (cron) {
        case '*/5 * * * *':
          await this.handleRealTimeSync();
          break;
        case '*/10 * * * *':
          await this.handleAggregatedSync();
          break;
        case '*/15 * * * *':
          await this.handleDashboardSync();
          break;
        case '*/30 * * * *':
          await this.handleExportSync();
          break;
        case '0 * * * *':
          await this.handleSocialInsightsSync();
          break;
        case '0 */6 * * *':
          await this.handleCacheOptimization();
          break;
        case '0 8 * * *':
          await this.handleDataConsistencyCheck();
          break;
        case '0 2 * * *':
          await this.handleDataQualityMonitoring();
          break;
        case '0 0 * * 0':
          await this.handleWeeklyMaintenance();
          break;
        default:
          console.warn(`未知的定时任务: ${cron}`);
      }
    } catch (error) {
      console.error(`定时任务执行失败 ${cron}:`, error);
      await this.recordCronError(cron, error);
    }
  }

  /**
   * 实时统计同步 (每5分钟)
   */
  private async handleRealTimeSync(): Promise<void> {
    console.log('🔄 执行实时统计同步...');
    
    const results = await Promise.allSettled([
      this.syncService.executeSync('analytics_to_realtime'),
      this.syncService.executeSync('main_to_analytics')
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ 实时同步完成: ${successCount}/${results.length} 成功`);
  }

  /**
   * 聚合统计同步 (每10分钟)
   */
  private async handleAggregatedSync(): Promise<void> {
    console.log('📊 执行聚合统计同步...');
    
    const results = await Promise.allSettled([
      this.syncService.executeSync('realtime_to_aggregated'),
      this.syncService.executeSync('analytics_to_admin')
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ 聚合同步完成: ${successCount}/${results.length} 成功`);
  }

  /**
   * 仪表板缓存同步 (每15分钟)
   */
  private async handleDashboardSync(): Promise<void> {
    console.log('📈 执行仪表板缓存同步...');
    
    const results = await Promise.allSettled([
      this.syncService.executeSync('aggregated_to_dashboard'),
      this.syncService.executeSync('dashboard_to_visualization')
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ 仪表板同步完成: ${successCount}/${results.length} 成功`);
  }

  /**
   * 导出数据同步 (每30分钟)
   */
  private async handleExportSync(): Promise<void> {
    console.log('📤 执行导出数据同步...');
    
    const result = await this.syncService.executeSync('analytics_to_export');
    console.log(`✅ 导出同步完成: ${result.success ? '成功' : '失败'}`);
  }



  /**
   * 自动缓存优化 (每6小时)
   */
  private async handleCacheOptimization(): Promise<void> {
    console.log('⚡ 执行自动缓存优化...');
    
    const result = await this.cacheOptimizer.runAutoOptimization();
    console.log(`✅ 缓存优化完成: 应用 ${result.applied.length} 个建议`);
  }

  /**
   * 数据一致性检查 (每天上午8点)
   */
  private async handleDataConsistencyCheck(): Promise<void> {
    console.log('🔍 执行数据一致性检查...');
    
    try {
      // 检查各级表的数据一致性
      const consistencyResults = await this.syncService.checkDataConsistency();
      
      // 如果发现不一致，触发修复同步
      if (!consistencyResults.isConsistent) {
        console.warn('⚠️ 发现数据不一致，触发修复同步...');
        await this.syncService.repairDataInconsistency(consistencyResults.issues);
      }
      
      console.log(`✅ 数据一致性检查完成: ${consistencyResults.isConsistent ? '一致' : '已修复'}`);
    } catch (error) {
      console.error('数据一致性检查失败:', error);
    }
  }

  /**
   * 数据质量监控和清理 (每天凌晨2点)
   */
  private async handleDataQualityMonitoring(): Promise<void> {
    console.log('🧹 执行数据质量监控和清理...');
    
    try {
      // 清理过期的性能指标
      await this.performanceMonitor.cleanupOldMetrics(30);
      
      // 清理过期的缓存数据
      await this.syncService.cleanupExpiredCache();
      
      // 更新数据质量报告
      await this.syncService.generateDataQualityReport();
      
      console.log('✅ 数据质量监控和清理完成');
    } catch (error) {
      console.error('数据质量监控失败:', error);
    }
  }

  /**
   * 周维护任务 (每周日凌晨)
   */
  private async handleWeeklyMaintenance(): Promise<void> {
    console.log('🔧 执行周维护任务...');
    
    try {
      // 更新性能基准
      await this.updatePerformanceBaselines();
      
      // 优化数据库索引
      await this.optimizeDatabaseIndexes();
      
      // 生成周报告
      await this.generateWeeklyReport();
      
      console.log('✅ 周维护任务完成');
    } catch (error) {
      console.error('周维护任务失败:', error);
    }
  }

  /**
   * 更新性能基准
   */
  private async updatePerformanceBaselines(): Promise<void> {
    const db = createDatabaseService(this.env);
    
    // 计算过去一周的平均性能指标
    const weeklyMetrics = await db.query(`
      SELECT 
        endpoint,
        AVG(response_time) as avg_response_time,
        AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
        AVG(CASE WHEN error_count > 0 THEN 1.0 ELSE 0.0 END) * 100 as error_rate
      FROM performance_metrics 
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY endpoint
      HAVING COUNT(*) >= 50
    `);

    // 更新基准数据
    for (const metric of weeklyMetrics) {
      await db.execute(`
        INSERT OR REPLACE INTO performance_baselines 
        (endpoint, baseline_response_time, baseline_cache_hit_rate, baseline_error_rate, measurement_period, is_active)
        VALUES (?, ?, ?, ?, '7d', 1)
      `, [
        metric.endpoint,
        metric.avg_response_time,
        metric.cache_hit_rate,
        metric.error_rate
      ]);
    }
  }

  /**
   * 优化数据库索引
   */
  private async optimizeDatabaseIndexes(): Promise<void> {
    const db = createDatabaseService(this.env);
    
    // 分析查询模式并优化索引
    await db.execute('ANALYZE');
    console.log('数据库索引优化完成');
  }

  /**
   * 生成周报告
   */
  private async generateWeeklyReport(): Promise<void> {
    const summary = await this.performanceMonitor.getPerformanceSummary('7d');
    const optimizationHistory = await this.cacheOptimizer.getOptimizationHistory(50);
    
    console.log('📊 周报告生成完成:', {
      totalRequests: summary.totalRequests,
      avgResponseTime: summary.averageResponseTime,
      cacheHitRate: summary.cacheHitRate,
      optimizationsApplied: optimizationHistory.length
    });
  }

  /**
   * 记录定时任务错误
   */
  private async recordCronError(cron: string, error: any): Promise<void> {
    try {
      const db = createDatabaseService(this.env);
      await db.execute(`
        INSERT INTO cron_execution_log (cron_pattern, status, error_message, executed_at)
        VALUES (?, 'error', ?, datetime('now'))
      `, [cron, error.toString()]);
    } catch (logError) {
      console.error('记录定时任务错误失败:', logError);
    }
  }
}

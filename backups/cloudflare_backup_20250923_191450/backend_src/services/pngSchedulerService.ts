/**
 * PNG生成调度服务
 * 定时处理PNG生成队列，支持每小时600份的处理需求
 */

import { PngQueueService } from './pngQueueService';
import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface SchedulerConfig {
  enabled: boolean;
  batchSize: number;
  intervalMinutes: number; // 处理间隔（分钟）
  maxConcurrentTasks: number;
  enableStats: boolean;
  cleanupDays: number; // 清理多少天前的任务
}

export interface ProcessingStats {
  startTime: string;
  endTime: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  processingTimeMs: number;
  averageTaskTime: number;
  errors: string[];
}

export class PngSchedulerService {
  private pngQueueService: PngQueueService;
  private db: DatabaseService;
  private config: SchedulerConfig;
  private isProcessing: boolean = false;
  private lastProcessingTime: Date | null = null;

  constructor(env: Env, config: Partial<SchedulerConfig> = {}) {
    this.pngQueueService = new PngQueueService(env);
    this.db = new DatabaseService(env.DB!);
    this.config = {
      enabled: true,
      batchSize: 10, // 每批处理10个任务
      intervalMinutes: 5, // 每5分钟处理一次
      maxConcurrentTasks: 3,
      enableStats: true,
      cleanupDays: 7,
      ...config
    };
  }

  /**
   * 启动定时处理器
   */
  async startScheduler(): Promise<void> {
    if (!this.config.enabled) {
      console.log('📅 PNG调度器已禁用');
      return;
    }

    console.log(`📅 PNG调度器启动，处理间隔: ${this.config.intervalMinutes}分钟，批量大小: ${this.config.batchSize}`);
    
    // 立即执行一次
    await this.processQueue();
    
    // 设置定时器
    setInterval(async () => {
      await this.processQueue();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  /**
   * 处理队列
   */
  async processQueue(): Promise<ProcessingStats> {
    if (this.isProcessing) {
      console.log('⏳ PNG队列正在处理中，跳过本次执行');
      return this.createEmptyStats();
    }

    this.isProcessing = true;
    const startTime = new Date();
    
    try {
      console.log('🔄 开始处理PNG生成队列...');
      
      const result = await this.pngQueueService.processBatch();
      
      const endTime = new Date();
      const processingTimeMs = endTime.getTime() - startTime.getTime();
      
      const stats: ProcessingStats = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalProcessed: result.processed,
        successful: result.successful,
        failed: result.failed,
        processingTimeMs,
        averageTaskTime: result.processed > 0 ? processingTimeMs / result.processed : 0,
        errors: result.errors
      };

      // 记录统计信息
      if (this.config.enableStats) {
        await this.recordStats(stats);
      }

      // 更新最后处理时间
      this.lastProcessingTime = endTime;

      console.log(`✅ PNG队列处理完成: ${result.successful}/${result.processed} 成功, 耗时: ${processingTimeMs}ms`);
      
      return stats;

    } catch (error) {
      console.error('PNG队列处理失败:', error);
      const endTime = new Date();
      
      return {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        processingTimeMs: endTime.getTime() - startTime.getTime(),
        averageTaskTime: 0,
        errors: [error instanceof Error ? error.message : '处理失败']
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 记录处理统计信息
   */
  private async recordStats(stats: ProcessingStats): Promise<void> {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const hour = now.getHours();

      // 更新或插入小时统计
      await this.db.execute(`
        INSERT INTO png_generation_stats (
          date, hour, total_generated, heart_voice_generated, story_generated, 
          failed_count, avg_processing_time, max_processing_time
        ) VALUES (?, ?, ?, 0, 0, ?, ?, ?)
        ON CONFLICT(date, hour) DO UPDATE SET
          total_generated = total_generated + ?,
          failed_count = failed_count + ?,
          avg_processing_time = (avg_processing_time + ?) / 2,
          max_processing_time = MAX(max_processing_time, ?),
          updated_at = CURRENT_TIMESTAMP
      `, [
        date, hour, stats.successful, stats.failed, 
        stats.averageTaskTime / 1000, stats.processingTimeMs / 1000,
        stats.successful, stats.failed,
        stats.averageTaskTime / 1000, stats.processingTimeMs / 1000
      ]);

      // 记录详细日志
      if (stats.totalProcessed > 0) {
        await this.db.execute(`
          INSERT INTO png_generation_logs (
            content_type, content_id, action, message, processing_time, generated_cards
          ) VALUES ('system', 0, 'batch_processed', ?, ?, ?)
        `, [
          `批量处理: ${stats.successful}/${stats.totalProcessed} 成功`,
          stats.processingTimeMs / 1000,
          stats.successful
        ]);
      }

    } catch (error) {
      console.error('记录PNG生成统计失败:', error);
    }
  }

  /**
   * 创建空统计对象
   */
  private createEmptyStats(): ProcessingStats {
    const now = new Date().toISOString();
    return {
      startTime: now,
      endTime: now,
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      processingTimeMs: 0,
      averageTaskTime: 0,
      errors: []
    };
  }

  /**
   * 手动触发队列处理
   */
  async triggerProcessing(): Promise<ProcessingStats> {
    console.log('🎯 手动触发PNG队列处理');
    return await this.processQueue();
  }

  /**
   * 获取调度器状态
   */
  getSchedulerStatus(): {
    enabled: boolean;
    isProcessing: boolean;
    lastProcessingTime: string | null;
    config: SchedulerConfig;
  } {
    return {
      enabled: this.config.enabled,
      isProcessing: this.isProcessing,
      lastProcessingTime: this.lastProcessingTime?.toISOString() || null,
      config: this.config
    };
  }

  /**
   * 更新调度器配置
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('PNG调度器配置已更新:', this.config);
  }

  /**
   * 停止调度器
   */
  stopScheduler(): void {
    this.config.enabled = false;
    console.log('📅 PNG调度器已停止');
  }

  /**
   * 清理旧任务和统计数据
   */
  async performCleanup(): Promise<{
    deletedTasks: number;
    deletedStats: number;
    deletedLogs: number;
  }> {
    try {
      console.log('🧹 开始清理PNG生成相关数据...');

      // 清理旧的队列任务
      const deletedTasks = await this.pngQueueService.cleanupOldTasks(this.config.cleanupDays);

      // 清理旧的统计数据（保留30天）
      const statsResult = await this.db.execute(`
        DELETE FROM png_generation_stats 
        WHERE date < date('now', '-30 days')
      `);
      const deletedStats = statsResult.meta.changes || 0;

      // 清理旧的日志数据（保留7天）
      const logsResult = await this.db.execute(`
        DELETE FROM png_generation_logs 
        WHERE created_at < datetime('now', '-7 days')
      `);
      const deletedLogs = logsResult.meta.changes || 0;

      console.log(`🧹 清理完成: 任务${deletedTasks}个, 统计${deletedStats}个, 日志${deletedLogs}个`);

      return {
        deletedTasks,
        deletedStats,
        deletedLogs
      };

    } catch (error) {
      console.error('清理PNG数据失败:', error);
      return {
        deletedTasks: 0,
        deletedStats: 0,
        deletedLogs: 0
      };
    }
  }

  /**
   * 获取处理性能统计
   */
  async getPerformanceStats(days: number = 7): Promise<{
    totalProcessed: number;
    averagePerHour: number;
    peakHour: { hour: number; count: number };
    successRate: number;
    averageProcessingTime: number;
  }> {
    try {
      const stats = await this.db.queryFirst(`
        SELECT 
          SUM(total_generated) as total_processed,
          SUM(failed_count) as total_failed,
          AVG(avg_processing_time) as avg_processing_time,
          COUNT(DISTINCT date) as days_count
        FROM png_generation_stats 
        WHERE date >= date('now', '-${days} days')
      `);

      const peakHour = await this.db.queryFirst(`
        SELECT hour, SUM(total_generated) as count
        FROM png_generation_stats 
        WHERE date >= date('now', '-${days} days')
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
      `);

      const totalProcessed = stats?.total_processed || 0;
      const totalFailed = stats?.total_failed || 0;
      const daysCount = stats?.days_count || 1;

      return {
        totalProcessed,
        averagePerHour: totalProcessed / (daysCount * 24),
        peakHour: {
          hour: peakHour?.hour || 0,
          count: peakHour?.count || 0
        },
        successRate: totalProcessed > 0 ? (totalProcessed / (totalProcessed + totalFailed)) * 100 : 0,
        averageProcessingTime: stats?.avg_processing_time || 0
      };

    } catch (error) {
      console.error('获取性能统计失败:', error);
      return {
        totalProcessed: 0,
        averagePerHour: 0,
        peakHour: { hour: 0, count: 0 },
        successRate: 0,
        averageProcessingTime: 0
      };
    }
  }
}

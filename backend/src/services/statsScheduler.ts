/**
 * 统计数据定时调度器
 * 每分钟更新一次问卷统计缓存
 */

import { QuestionnaireStatsService } from './questionnaireStatsService';
// import { createDatabaseService } from '../utils/database';

export class StatsScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private statsService: QuestionnaireStatsService | null = null;

  constructor(private env: any) {
    // 重新启用统计服务
    try {
      const { createDatabaseService } = require('../utils/database');
      this.statsService = new QuestionnaireStatsService(createDatabaseService(env));
      console.log('✅ 统计服务初始化成功');
    } catch (error) {
      console.error('❌ 统计服务初始化失败:', error);
    }
  }

  /**
   * 启动定时任务
   */
  start(): void {
    if (this.isRunning) {
      console.log('📊 统计调度器已在运行中');
      return;
    }

    console.log('🚀 启动问卷统计定时调度器');
    this.isRunning = true;

    // 立即执行一次
    this.updateStats();

    // 每分钟执行一次
    this.intervalId = setInterval(() => {
      this.updateStats();
    }, 60 * 1000); // 60秒

    console.log('✅ 统计调度器启动成功，更新频率：每60秒');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('📊 统计调度器未在运行');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 统计调度器已停止');
  }

  /**
   * 获取运行状态
   */
  getStatus(): { isRunning: boolean; nextUpdate?: string } {
    return {
      isRunning: this.isRunning,
      nextUpdate: this.isRunning ? new Date(Date.now() + 60000).toISOString() : undefined
    };
  }

  /**
   * 手动触发统计更新
   */
  async triggerUpdate(): Promise<void> {
    console.log('🔄 手动触发统计更新');
    await this.updateStats();
  }

  /**
   * 执行统计更新
   */
  private async updateStats(): Promise<void> {
    if (!this.statsService) {
      console.error('❌ 统计服务未初始化');
      return;
    }

    try {
      const startTime = Date.now();
      
      // 更新主问卷统计
      await this.statsService.updateStatsCache('employment-survey-2024');
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ 统计更新完成，耗时: ${duration}ms`);

      // 记录性能指标
      this.logPerformanceMetrics(duration);

    } catch (error) {
      console.error('❌ 统计更新失败:', error);
      
      // 可以在这里添加错误通知机制
      // 比如发送邮件、Slack通知等
    }
  }

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(duration: number): void {
    const metrics = {
      timestamp: new Date().toISOString(),
      duration,
      status: duration < 5000 ? 'good' : duration < 10000 ? 'warning' : 'slow'
    };

    console.log('📈 性能指标:', metrics);

    // 如果更新时间过长，记录警告
    if (duration > 10000) {
      console.warn('⚠️ 统计更新耗时过长，可能需要优化查询性能');
    }
  }
}

/**
 * 全局统计调度器实例
 */
let globalStatsScheduler: StatsScheduler | null = null;

/**
 * 获取或创建全局调度器实例
 */
export function getStatsScheduler(env: any): StatsScheduler {
  if (!globalStatsScheduler) {
    globalStatsScheduler = new StatsScheduler(env);
  }
  return globalStatsScheduler;
}

/**
 * 启动全局统计调度器
 */
export function startGlobalStatsScheduler(env: any): void {
  const scheduler = getStatsScheduler(env);
  scheduler.start();
}

/**
 * 停止全局统计调度器
 */
export function stopGlobalStatsScheduler(): void {
  if (globalStatsScheduler) {
    globalStatsScheduler.stop();
  }
}

/**
 * Cloudflare Workers 环境下的调度器
 * 使用 Cron Triggers 实现定时任务
 */
export async function handleScheduledEvent(env: any): Promise<void> {
  console.log('⏰ Cron 触发器执行统计更新');

  try {
    // 重新启用统计更新
    const { createDatabaseService } = require('../utils/database');
    const statsService = new QuestionnaireStatsService(createDatabaseService(env));
    await statsService.updateStatsCache('employment-survey-2024');

    console.log('✅ Cron 统计更新完成');
  } catch (error) {
    console.error('❌ Cron 统计更新失败:', error);
    // 不抛出错误，避免影响其他定时任务
    console.log('继续执行其他定时任务...');
  }
}

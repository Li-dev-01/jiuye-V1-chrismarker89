/**
 * PNG自动触发服务
 * 当内容通过审核迁移到有效表时自动触发PNG生成
 */

import { PngQueueService } from './pngQueueService';
import type { Env } from '../types/api';

export interface TriggerConfig {
  enableAutoTrigger: boolean;
  heartVoicePriority: number;
  storyPriority: number;
  delaySeconds: number; // 延迟触发时间（避免立即处理）
}

export class PngTriggerService {
  private pngQueueService: PngQueueService;
  private config: TriggerConfig;

  constructor(env: Env, config: Partial<TriggerConfig> = {}) {
    this.pngQueueService = new PngQueueService(env);
    this.config = {
      enableAutoTrigger: true,
      heartVoicePriority: 2, // 心声优先级较高
      storyPriority: 3,      // 故事优先级中等
      delaySeconds: 30,      // 30秒后开始处理
      ...config
    };
  }

  /**
   * 当心声通过审核时触发PNG生成
   */
  async onHeartVoiceApproved(heartVoiceId: number, heartVoiceUuid: string): Promise<{
    success: boolean;
    taskId?: number;
    message?: string;
    error?: string;
  }> {
    if (!this.config.enableAutoTrigger) {
      return { 
        success: true, 
        message: '自动触发已禁用' 
      };
    }

    try {
      console.log(`🎯 心声审核通过，触发PNG生成: ${heartVoiceId}`);

      const result = await this.pngQueueService.addTask(
        'heart_voice',
        heartVoiceId,
        heartVoiceUuid,
        this.config.heartVoicePriority
      );

      if (result.success) {
        console.log(`✅ 心声PNG生成任务已添加到队列: ${heartVoiceId}, 任务ID: ${result.taskId}`);
        return {
          success: true,
          taskId: result.taskId,
          message: `心声PNG生成任务已添加到队列`
        };
      } else {
        console.error(`❌ 添加心声PNG生成任务失败: ${heartVoiceId}, 错误: ${result.error}`);
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      console.error('心声PNG生成触发失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '触发失败'
      };
    }
  }

  /**
   * 当故事通过审核时触发PNG生成
   */
  async onStoryApproved(storyId: number, storyUuid: string): Promise<{
    success: boolean;
    taskId?: number;
    message?: string;
    error?: string;
  }> {
    if (!this.config.enableAutoTrigger) {
      return { 
        success: true, 
        message: '自动触发已禁用' 
      };
    }

    try {
      console.log(`🎯 故事审核通过，触发PNG生成: ${storyId}`);

      const result = await this.pngQueueService.addTask(
        'story',
        storyId,
        storyUuid,
        this.config.storyPriority
      );

      if (result.success) {
        console.log(`✅ 故事PNG生成任务已添加到队列: ${storyId}, 任务ID: ${result.taskId}`);
        return {
          success: true,
          taskId: result.taskId,
          message: `故事PNG生成任务已添加到队列`
        };
      } else {
        console.error(`❌ 添加故事PNG生成任务失败: ${storyId}, 错误: ${result.error}`);
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      console.error('故事PNG生成触发失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '触发失败'
      };
    }
  }

  /**
   * 批量触发PNG生成（用于历史数据处理）
   */
  async batchTriggerForExistingContent(): Promise<{
    success: boolean;
    heartVoicesAdded: number;
    storiesAdded: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      heartVoicesAdded: 0,
      storiesAdded: 0,
      errors: [] as string[]
    };

    try {
      // 获取所有已审核但未生成PNG的心声
      const heartVoices = await this.pngQueueService['db'].query(`
        SELECT v.id, v.data_uuid 
        FROM valid_heart_voices v
        LEFT JOIN png_cards p ON p.content_type = 'heart_voice' AND p.content_id = v.id
        WHERE v.audit_status = 'approved' AND p.id IS NULL
        LIMIT 100
      `);

      // 获取所有已审核但未生成PNG的故事
      const stories = await this.pngQueueService['db'].query(`
        SELECT v.id, v.data_uuid 
        FROM valid_stories v
        LEFT JOIN png_cards p ON p.content_type = 'story' AND p.content_id = v.id
        WHERE v.audit_status = 'approved' AND p.id IS NULL
        LIMIT 100
      `);

      // 批量添加心声任务
      for (const heartVoice of heartVoices) {
        try {
          const result = await this.onHeartVoiceApproved(heartVoice.id, heartVoice.data_uuid);
          if (result.success) {
            results.heartVoicesAdded++;
          } else {
            results.errors.push(`心声${heartVoice.id}: ${result.error}`);
          }
        } catch (error) {
          results.errors.push(`心声${heartVoice.id}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      // 批量添加故事任务
      for (const story of stories) {
        try {
          const result = await this.onStoryApproved(story.id, story.data_uuid);
          if (result.success) {
            results.storiesAdded++;
          } else {
            results.errors.push(`故事${story.id}: ${result.error}`);
          }
        } catch (error) {
          results.errors.push(`故事${story.id}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      console.log(`🔄 批量触发PNG生成完成: 心声${results.heartVoicesAdded}个, 故事${results.storiesAdded}个, 错误${results.errors.length}个`);

      if (results.errors.length > 0) {
        results.success = false;
      }

      return results;

    } catch (error) {
      console.error('批量触发PNG生成失败:', error);
      return {
        success: false,
        heartVoicesAdded: 0,
        storiesAdded: 0,
        errors: [error instanceof Error ? error.message : '批量处理失败']
      };
    }
  }

  /**
   * 获取触发器配置
   */
  getConfig(): TriggerConfig {
    return { ...this.config };
  }

  /**
   * 更新触发器配置
   */
  updateConfig(newConfig: Partial<TriggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('PNG触发器配置已更新:', this.config);
  }

  /**
   * 检查内容是否需要生成PNG
   */
  async needsPngGeneration(
    contentType: 'heart_voice' | 'story',
    contentId: number
  ): Promise<boolean> {
    try {
      // 检查是否已有PNG卡片
      const existingCard = await this.pngQueueService['db'].queryFirst(`
        SELECT id FROM png_cards 
        WHERE content_type = ? AND content_id = ?
        LIMIT 1
      `, [contentType, contentId]);

      if (existingCard) {
        return false; // 已有PNG，不需要生成
      }

      // 检查是否已在队列中
      const queueTask = await this.pngQueueService['db'].queryFirst(`
        SELECT id FROM png_generation_queue 
        WHERE content_type = ? AND content_id = ? AND status IN ('pending', 'processing')
        LIMIT 1
      `, [contentType, contentId]);

      return !queueTask; // 不在队列中才需要生成

    } catch (error) {
      console.error('检查PNG生成需求失败:', error);
      return true; // 出错时默认需要生成
    }
  }

  /**
   * 获取触发器统计信息
   */
  async getTriggerStats(): Promise<{
    totalTriggered: number;
    heartVoicesTriggered: number;
    storiesTriggered: number;
    pendingTasks: number;
    failedTasks: number;
  }> {
    try {
      const stats = await this.pngQueueService.getQueueStats();
      
      const triggerStats = await this.pngQueueService['db'].queryFirst(`
        SELECT 
          COUNT(*) as total_triggered,
          SUM(CASE WHEN content_type = 'heart_voice' THEN 1 ELSE 0 END) as heart_voices_triggered,
          SUM(CASE WHEN content_type = 'story' THEN 1 ELSE 0 END) as stories_triggered
        FROM png_generation_queue
      `);

      return {
        totalTriggered: triggerStats?.total_triggered || 0,
        heartVoicesTriggered: triggerStats?.heart_voices_triggered || 0,
        storiesTriggered: triggerStats?.stories_triggered || 0,
        pendingTasks: stats.pending,
        failedTasks: stats.failed
      };

    } catch (error) {
      console.error('获取触发器统计失败:', error);
      return {
        totalTriggered: 0,
        heartVoicesTriggered: 0,
        storiesTriggered: 0,
        pendingTasks: 0,
        failedTasks: 0
      };
    }
  }
}

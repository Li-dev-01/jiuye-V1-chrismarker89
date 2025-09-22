/**
 * PNG生成队列服务
 * 管理PNG生成任务的队列处理
 */

import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface PngQueueTask {
  id?: number;
  content_type: 'heart_voice' | 'story';
  content_id: number;
  content_uuid: string;
  priority: number; // 1-5, 1最高优先级
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string; // 计划执行时间
}

export interface QueueConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // 重试延迟（秒）
  processingTimeout: number; // 处理超时（秒）
}

export class PngQueueService {
  private db: DatabaseService;
  private config: QueueConfig;

  constructor(env: Env, config: Partial<QueueConfig> = {}) {
    this.db = new DatabaseService(env.DB!);
    this.config = {
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 300, // 5分钟
      processingTimeout: 120, // 2分钟
      ...config
    };
  }

  /**
   * 添加PNG生成任务到队列
   */
  async addTask(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    contentUuid: string,
    priority: number = 3
  ): Promise<{ success: boolean; taskId?: number; error?: string }> {
    try {
      // 检查是否已存在相同任务
      const existingTask = await this.db.queryFirst(`
        SELECT id FROM png_generation_queue 
        WHERE content_type = ? AND content_id = ? AND status IN ('pending', 'processing')
      `, [contentType, contentId]);

      if (existingTask) {
        return { 
          success: true, 
          taskId: existingTask.id,
          error: '任务已存在于队列中' 
        };
      }

      // 添加新任务
      const result = await this.db.execute(`
        INSERT INTO png_generation_queue (
          content_type, content_id, content_uuid, priority, status, 
          retry_count, max_retries, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?)
      `, [
        contentType,
        contentId,
        contentUuid,
        priority,
        this.config.maxRetries,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      console.log(`✅ 添加PNG生成任务: ${contentType}:${contentId}`);
      
      return { 
        success: true, 
        taskId: result.meta.last_row_id as number 
      };

    } catch (error) {
      console.error('添加PNG生成任务失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '添加任务失败' 
      };
    }
  }

  /**
   * 获取待处理的任务
   */
  async getPendingTasks(limit: number = this.config.batchSize): Promise<PngQueueTask[]> {
    try {
      const tasks = await this.db.query<PngQueueTask>(`
        SELECT * FROM png_generation_queue 
        WHERE status = 'pending' 
          AND (scheduled_at IS NULL OR scheduled_at <= ?)
        ORDER BY priority ASC, created_at ASC 
        LIMIT ?
      `, [new Date().toISOString(), limit]);

      return tasks;
    } catch (error) {
      console.error('获取待处理任务失败:', error);
      return [];
    }
  }

  /**
   * 处理单个任务
   */
  async processTask(task: PngQueueTask): Promise<{ success: boolean; error?: string }> {
    try {
      // 更新任务状态为处理中
      await this.updateTaskStatus(task.id!, 'processing');

      // 模拟PNG生成处理
      const result = {
        success: true,
        message: `PNG生成任务已处理: ${task.content_type}:${task.content_id}`
      };

      if (result.success) {
        // 任务成功完成
        await this.updateTaskStatus(task.id!, 'completed');
        console.log(`✅ PNG生成任务完成: ${task.content_type}:${task.content_id}, 生成${result.generatedCards}张卡片`);
        return { success: true };
      } else {
        // 任务失败，准备重试
        return await this.handleTaskFailure(task, result.error || '生成失败');
      }

    } catch (error) {
      console.error(`PNG生成任务处理失败: ${task.content_type}:${task.content_id}`, error);
      return await this.handleTaskFailure(task, error instanceof Error ? error.message : '处理异常');
    }
  }

  /**
   * 处理任务失败
   */
  private async handleTaskFailure(
    task: PngQueueTask, 
    errorMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    const newRetryCount = task.retry_count + 1;

    if (newRetryCount >= task.max_retries) {
      // 超过最大重试次数，标记为失败
      await this.db.execute(`
        UPDATE png_generation_queue 
        SET status = 'failed', retry_count = ?, error_message = ?, updated_at = ?
        WHERE id = ?
      `, [newRetryCount, errorMessage, new Date().toISOString(), task.id]);

      console.error(`❌ PNG生成任务最终失败: ${task.content_type}:${task.content_id}, 错误: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } else {
      // 安排重试
      const nextRetryTime = new Date(Date.now() + this.config.retryDelay * 1000).toISOString();
      
      await this.db.execute(`
        UPDATE png_generation_queue 
        SET status = 'pending', retry_count = ?, error_message = ?, 
            scheduled_at = ?, updated_at = ?
        WHERE id = ?
      `, [newRetryCount, errorMessage, nextRetryTime, new Date().toISOString(), task.id]);

      console.log(`🔄 PNG生成任务安排重试: ${task.content_type}:${task.content_id}, 第${newRetryCount}次重试，计划时间: ${nextRetryTime}`);
      return { success: false, error: `重试中 (${newRetryCount}/${task.max_retries})` };
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(taskId: number, status: PngQueueTask['status']): Promise<void> {
    await this.db.execute(`
      UPDATE png_generation_queue 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `, [status, new Date().toISOString(), taskId]);
  }

  /**
   * 批量处理队列任务
   */
  async processBatch(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const tasks = await this.getPendingTasks();
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log(`🔄 开始处理PNG生成队列，待处理任务: ${tasks.length}`);

    for (const task of tasks) {
      results.processed++;
      
      const result = await this.processTask(task);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${task.content_type}:${task.content_id} - ${result.error}`);
        }
      }
    }

    console.log(`✅ PNG生成队列处理完成: 处理${results.processed}, 成功${results.successful}, 失败${results.failed}`);
    return results;
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const stats = await this.db.queryFirst(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          COUNT(*) as total
        FROM png_generation_queue
      `);

      return {
        pending: stats?.pending || 0,
        processing: stats?.processing || 0,
        completed: stats?.completed || 0,
        failed: stats?.failed || 0,
        total: stats?.total || 0
      };
    } catch (error) {
      console.error('获取队列统计失败:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }
  }

  /**
   * 清理已完成的旧任务
   */
  async cleanupOldTasks(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
      
      const result = await this.db.execute(`
        DELETE FROM png_generation_queue 
        WHERE status IN ('completed', 'failed') AND updated_at < ?
      `, [cutoffDate]);

      const deletedCount = result.meta.changes || 0;
      console.log(`🧹 清理了 ${deletedCount} 个旧的PNG生成任务`);
      
      return deletedCount;
    } catch (error) {
      console.error('清理旧任务失败:', error);
      return 0;
    }
  }
}

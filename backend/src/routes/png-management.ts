/**
 * PNG管理路由
 * 提供PNG生成队列的管理和监控功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { PngQueueService } from '../services/pngQueueService';
import { PngTriggerService } from '../services/pngTriggerService';
import { PngSchedulerService } from '../services/pngSchedulerService';

export function createPngManagementRoutes() {
  const pngManagement = new Hono<{ Bindings: Env }>();

  // PNG队列状态查询
  pngManagement.get('/queue/status', async (c) => {
    try {
      const queueService = new PngQueueService(c.env);
      const stats = await queueService.getQueueStats();

      return c.json({
        success: true,
        data: {
          queue: stats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取PNG队列状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取队列状态失败'
      }, 500);
    }
  });

  // 手动触发队列处理
  pngManagement.post('/queue/process', async (c) => {
    try {
      const schedulerService = new PngSchedulerService(c.env);
      const result = await schedulerService.triggerProcessing();

      return c.json({
        success: true,
        data: result,
        message: '队列处理已触发'
      });

    } catch (error) {
      console.error('手动触发队列处理失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '触发队列处理失败'
      }, 500);
    }
  });

  // 批量触发历史数据PNG生成
  pngManagement.post('/trigger/batch', async (c) => {
    try {
      const triggerService = new PngTriggerService(c.env);
      const result = await triggerService.batchTriggerForExistingContent();

      return c.json({
        success: result.success,
        data: {
          heartVoicesAdded: result.heartVoicesAdded,
          storiesAdded: result.storiesAdded,
          totalAdded: result.heartVoicesAdded + result.storiesAdded,
          errors: result.errors
        },
        message: `批量触发完成: 心声${result.heartVoicesAdded}个, 故事${result.storiesAdded}个`
      });

    } catch (error) {
      console.error('批量触发PNG生成失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '批量触发失败'
      }, 500);
    }
  });

  // 手动添加PNG生成任务
  pngManagement.post('/queue/add', async (c) => {
    try {
      const { contentType, contentId, priority = 3 } = await c.req.json();

      if (!contentType || !contentId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少必要参数: contentType, contentId'
        }, 400);
      }

      if (!['heart_voice', 'story'].includes(contentType)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'contentType 必须是 heart_voice 或 story'
        }, 400);
      }

      const queueService = new PngQueueService(c.env);
      
      // 生成UUID（简化版本）
      const contentUuid = `manual-${contentType}-${contentId}-${Date.now()}`;
      
      const result = await queueService.addTask(contentType, contentId, contentUuid, priority);

      return c.json({
        success: result.success,
        data: {
          taskId: result.taskId,
          contentType,
          contentId,
          priority
        },
        message: result.success ? 'PNG生成任务已添加' : result.error
      });

    } catch (error) {
      console.error('添加PNG生成任务失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '添加任务失败'
      }, 500);
    }
  });

  // 获取PNG生成统计
  pngManagement.get('/stats', async (c) => {
    try {
      const days = parseInt(c.req.query('days') || '7');
      const schedulerService = new PngSchedulerService(c.env);
      const triggerService = new PngTriggerService(c.env);

      const [performanceStats, triggerStats] = await Promise.all([
        schedulerService.getPerformanceStats(days),
        triggerService.getTriggerStats()
      ]);

      return c.json({
        success: true,
        data: {
          performance: performanceStats,
          trigger: triggerStats,
          period: `${days} days`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('获取PNG统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取统计失败'
      }, 500);
    }
  });

  // 获取调度器状态
  pngManagement.get('/scheduler/status', async (c) => {
    try {
      const schedulerService = new PngSchedulerService(c.env);
      const status = schedulerService.getSchedulerStatus();

      return c.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('获取调度器状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取调度器状态失败'
      }, 500);
    }
  });

  // 更新调度器配置
  pngManagement.put('/scheduler/config', async (c) => {
    try {
      const config = await c.req.json();
      const schedulerService = new PngSchedulerService(c.env);
      
      schedulerService.updateConfig(config);

      return c.json({
        success: true,
        data: schedulerService.getSchedulerStatus(),
        message: '调度器配置已更新'
      });

    } catch (error) {
      console.error('更新调度器配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新配置失败'
      }, 500);
    }
  });

  // 清理旧数据
  pngManagement.post('/cleanup', async (c) => {
    try {
      const schedulerService = new PngSchedulerService(c.env);
      const result = await schedulerService.performCleanup();

      return c.json({
        success: true,
        data: result,
        message: `清理完成: 任务${result.deletedTasks}个, 统计${result.deletedStats}个, 日志${result.deletedLogs}个`
      });

    } catch (error) {
      console.error('清理数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理失败'
      }, 500);
    }
  });

  // 获取队列任务列表
  pngManagement.get('/queue/tasks', async (c) => {
    try {
      const status = c.req.query('status') || 'pending';
      const limit = parseInt(c.req.query('limit') || '50');
      
      const queueService = new PngQueueService(c.env);
      
      let tasks;
      if (status === 'pending') {
        tasks = await queueService.getPendingTasks(limit);
      } else {
        // 获取其他状态的任务
        tasks = await queueService['db'].query(`
          SELECT * FROM png_generation_queue 
          WHERE status = ? 
          ORDER BY updated_at DESC 
          LIMIT ?
        `, [status, limit]);
      }

      return c.json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
          status,
          limit
        }
      });

    } catch (error) {
      console.error('获取队列任务失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取任务列表失败'
      }, 500);
    }
  });

  // 重试失败的任务
  pngManagement.post('/queue/retry/:taskId', async (c) => {
    try {
      const taskId = parseInt(c.req.param('taskId'));
      const queueService = new PngQueueService(c.env);

      // 重置任务状态为pending
      await queueService['db'].execute(`
        UPDATE png_generation_queue 
        SET status = 'pending', retry_count = 0, error_message = NULL, 
            scheduled_at = NULL, updated_at = ?
        WHERE id = ? AND status = 'failed'
      `, [new Date().toISOString(), taskId]);

      return c.json({
        success: true,
        message: '任务已重置为待处理状态'
      });

    } catch (error) {
      console.error('重试任务失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '重试任务失败'
      }, 500);
    }
  });

  return pngManagement;
}

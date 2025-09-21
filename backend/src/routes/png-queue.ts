/**
 * PNG队列管理路由（简化版）
 * 提供PNG生成队列的基本管理功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';

export function createPngQueueRoutes() {
  const pngQueue = new Hono<{ Bindings: Env }>();

  // 获取队列状态
  pngQueue.get('/status', async (c) => {
    try {
      const db = c.env.DB;

      // 获取队列统计
      const stats = await db.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          COUNT(*) as total
        FROM png_generation_queue
      `).first();

      return c.json({
        success: true,
        data: {
          queue: {
            pending: stats?.pending || 0,
            processing: stats?.processing || 0,
            completed: stats?.completed || 0,
            failed: stats?.failed || 0,
            total: stats?.total || 0
          },
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

  // 添加PNG生成任务
  pngQueue.post('/add', async (c) => {
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

      const db = c.env.DB;

      // 检查是否已存在相同任务
      const existingTask = await db.prepare(`
        SELECT id FROM png_generation_queue 
        WHERE content_type = ? AND content_id = ? AND status IN ('pending', 'processing')
      `).bind(contentType, contentId).first();

      if (existingTask) {
        return c.json({
          success: true,
          data: {
            taskId: existingTask.id,
            contentType,
            contentId,
            message: '任务已存在于队列中'
          }
        });
      }

      // 生成UUID
      const contentUuid = `manual-${contentType}-${contentId}-${Date.now()}`;

      // 添加新任务
      const result = await db.prepare(`
        INSERT INTO png_generation_queue (
          content_type, content_id, content_uuid, priority, status, 
          retry_count, max_retries, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', 0, 3, ?, ?)
      `).bind(
        contentType,
        contentId,
        contentUuid,
        priority,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      console.log(`✅ 添加PNG生成任务: ${contentType}:${contentId}`);

      return c.json({
        success: true,
        data: {
          taskId: result.meta.last_row_id,
          contentType,
          contentId,
          priority
        },
        message: 'PNG生成任务已添加'
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

  // 获取队列任务列表
  pngQueue.get('/tasks', async (c) => {
    try {
      const status = c.req.query('status') || 'pending';
      const limit = parseInt(c.req.query('limit') || '20');

      const db = c.env.DB;

      const tasks = await db.prepare(`
        SELECT * FROM png_generation_queue 
        WHERE status = ? 
        ORDER BY priority ASC, created_at ASC 
        LIMIT ?
      `).bind(status, limit).all();

      return c.json({
        success: true,
        data: {
          tasks: tasks.results,
          count: tasks.results.length,
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

  // 手动处理单个任务
  pngQueue.post('/process/:taskId', async (c) => {
    try {
      const taskId = parseInt(c.req.param('taskId'));
      const db = c.env.DB;

      // 获取任务信息
      const task = await db.prepare(`
        SELECT * FROM png_generation_queue WHERE id = ?
      `).bind(taskId).first();

      if (!task) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '任务不存在'
        }, 404);
      }

      // 更新任务状态为处理中
      await db.prepare(`
        UPDATE png_generation_queue 
        SET status = 'processing', updated_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), taskId).run();

      // 这里应该调用实际的PNG生成服务
      // 暂时模拟处理成功
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 更新任务状态为完成
      await db.prepare(`
        UPDATE png_generation_queue 
        SET status = 'completed', updated_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), taskId).run();

      console.log(`✅ PNG生成任务处理完成: ${task.content_type}:${task.content_id}`);

      return c.json({
        success: true,
        data: {
          taskId,
          contentType: task.content_type,
          contentId: task.content_id,
          status: 'completed'
        },
        message: '任务处理完成'
      });

    } catch (error) {
      console.error('处理PNG生成任务失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '任务处理失败'
      }, 500);
    }
  });

  // 批量触发历史数据PNG生成
  pngQueue.post('/trigger-batch', async (c) => {
    try {
      const db = c.env.DB;
      let heartVoicesAdded = 0;
      let storiesAdded = 0;
      const errors: string[] = [];

      // 获取所有已审核但未生成PNG的心声
      const heartVoices = await db.prepare(`
        SELECT v.id, v.data_uuid 
        FROM valid_heart_voices v
        LEFT JOIN png_cards p ON p.content_type = 'heart_voice' AND p.content_id = v.id
        WHERE v.audit_status = 'approved' AND p.id IS NULL
        LIMIT 50
      `).all();

      // 获取所有已审核但未生成PNG的故事
      const stories = await db.prepare(`
        SELECT v.id, v.data_uuid 
        FROM valid_stories v
        LEFT JOIN png_cards p ON p.content_type = 'story' AND p.content_id = v.id
        WHERE v.audit_status = 'approved' AND p.id IS NULL
        LIMIT 50
      `).all();

      // 批量添加心声任务
      for (const heartVoice of heartVoices.results) {
        try {
          await db.prepare(`
            INSERT OR IGNORE INTO png_generation_queue (
              content_type, content_id, content_uuid, priority, status, 
              retry_count, max_retries, created_at, updated_at
            ) VALUES (?, ?, ?, 2, 'pending', 0, 3, ?, ?)
          `).bind(
            'heart_voice',
            heartVoice.id,
            heartVoice.data_uuid,
            new Date().toISOString(),
            new Date().toISOString()
          ).run();
          heartVoicesAdded++;
        } catch (error) {
          errors.push(`心声${heartVoice.id}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      // 批量添加故事任务
      for (const story of stories.results) {
        try {
          await db.prepare(`
            INSERT OR IGNORE INTO png_generation_queue (
              content_type, content_id, content_uuid, priority, status, 
              retry_count, max_retries, created_at, updated_at
            ) VALUES (?, ?, ?, 3, 'pending', 0, 3, ?, ?)
          `).bind(
            'story',
            story.id,
            story.data_uuid,
            new Date().toISOString(),
            new Date().toISOString()
          ).run();
          storiesAdded++;
        } catch (error) {
          errors.push(`故事${story.id}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      console.log(`🔄 批量触发PNG生成完成: 心声${heartVoicesAdded}个, 故事${storiesAdded}个, 错误${errors.length}个`);

      return c.json({
        success: errors.length === 0,
        data: {
          heartVoicesAdded,
          storiesAdded,
          totalAdded: heartVoicesAdded + storiesAdded,
          errors
        },
        message: `批量触发完成: 心声${heartVoicesAdded}个, 故事${storiesAdded}个`
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

  return pngQueue;
}

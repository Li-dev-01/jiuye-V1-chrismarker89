/**
 * PNG测试路由
 * 简单的测试路由，验证PNG功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';

export function createPngTestRoutes() {
  const pngTest = new Hono<{ Bindings: Env }>();

  // 测试路由
  pngTest.get('/hello', async (c) => {
    return c.json({
      success: true,
      message: 'PNG测试路由工作正常！',
      timestamp: new Date().toISOString()
    });
  });

  // 队列状态
  pngTest.get('/queue-status', async (c) => {
    try {
      const db = c.env.DB;

      const stats = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM png_generation_queue
      `).first();

      return c.json({
        success: true,
        data: {
          total: stats?.total || 0,
          pending: stats?.pending || 0,
          completed: stats?.completed || 0,
          failed: stats?.failed || 0
        }
      });

    } catch (error) {
      console.error('获取队列状态失败:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : '获取状态失败'
      }, 500);
    }
  });

  // PNG下载功能（需要A+B半匿名用户权限）
  pngTest.get('/download/:contentType/:contentId/:theme?', async (c) => {
    try {
      const contentType = c.req.param('contentType');
      const contentId = parseInt(c.req.param('contentId'));
      const theme = c.req.param('theme') || 'gradient';

      // 验证内容类型
      if (!['heart_voice', 'story'].includes(contentType)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的内容类型'
        }, 400);
      }

      // 检查用户权限
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: false,
          error: 'Unauthorized',
          message: '需要A+B半匿名用户权限才能下载PNG'
        }, 401);
      }

      // 验证是否为半匿名用户token
      const token = authHeader.replace('Bearer ', '');

      // 简化的权限验证（实际应该验证JWT token）
      if (!token.includes('semi_anonymous')) {
        return c.json({
          success: false,
          error: 'Forbidden',
          message: '只有A+B半匿名用户才能下载PNG'
        }, 403);
      }

      const db = c.env.DB;

      // 查找PNG卡片
      const pngCard = await db.prepare(`
        SELECT * FROM png_cards
        WHERE content_type = ? AND content_id = ? AND theme = ?
      `).bind(contentType, contentId, theme).first();

      if (!pngCard) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: 'PNG卡片不存在，请先生成'
        }, 404);
      }

      // 记录下载日志
      await db.prepare(`
        INSERT INTO png_downloads (
          card_id, user_id, ip_address, user_agent, downloaded_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        pngCard.card_id,
        'semi_anonymous_user',
        c.req.header('CF-Connecting-IP') || 'unknown',
        c.req.header('User-Agent') || 'unknown',
        new Date().toISOString()
      ).run();

      // 返回下载URL
      return c.json({
        success: true,
        data: {
          downloadUrl: pngCard.download_url,
          cardId: pngCard.card_id,
          contentType,
          contentId,
          theme,
          filename: `${contentType}-${contentId}-${theme}.png`
        },
        message: 'PNG下载链接获取成功'
      });

    } catch (error) {
      console.error('PNG下载失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: 'PNG下载失败'
      }, 500);
    }
  });

  // 生成测试PNG卡片
  pngTest.post('/generate-test-png', async (c) => {
    try {
      const { contentType, contentId, theme = 'gradient' } = await c.req.json();

      if (!['heart_voice', 'story'].includes(contentType)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的内容类型'
        }, 400);
      }

      const db = c.env.DB;

      // 检查内容是否存在
      const tableName = contentType === 'heart_voice' ? 'valid_heart_voices' : 'valid_stories';
      const content = await db.prepare(`
        SELECT id, data_uuid FROM ${tableName} WHERE id = ?
      `).bind(contentId).first();

      if (!content) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '内容不存在'
        }, 404);
      }

      // 生成模拟PNG卡片记录
      const cardId = `${contentType}-${contentId}-${theme}-${Date.now()}`;
      const r2Key = `png-cards/${cardId}.png`;
      const downloadUrl = `https://employment-survey-storage.r2.cloudflarestorage.com/${r2Key}`;

      // 插入PNG卡片记录
      await db.prepare(`
        INSERT INTO png_cards (
          content_type, content_id, card_id, r2_key, download_url, theme, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        contentType,
        contentId,
        cardId,
        r2Key,
        downloadUrl,
        theme,
        new Date().toISOString()
      ).run();

      console.log(`✅ 生成测试PNG卡片: ${contentType}:${contentId}, 主题: ${theme}`);

      return c.json({
        success: true,
        data: {
          cardId,
          contentType,
          contentId,
          theme,
          downloadUrl,
          r2Key
        },
        message: '测试PNG卡片生成成功'
      });

    } catch (error) {
      console.error('生成测试PNG失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '生成测试PNG失败'
      }, 500);
    }
  });

  return pngTest;
}

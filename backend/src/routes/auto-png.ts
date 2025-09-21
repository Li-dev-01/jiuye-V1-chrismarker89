/**
 * 自动PNG生成API路由
 * 处理A表到B表迁移时的自动PNG生成
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';
import { AutoPngService } from '../services/autoPngService';

const autoPng = new Hono<{ Bindings: Env; Variables: AuthContext }>();

/**
 * @swagger
 * /api/images/auto-generate/trigger/heart-voices/{id}:
 *   post:
 *     tags: [Auto PNG]
 *     summary: 触发心声PNG自动生成
 *     description: 当心声从A表迁移到B表时触发PNG生成
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 心声ID
 *     responses:
 *       200:
 *         description: PNG生成成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
autoPng.post('/trigger/heart-voice/:id', async (c) => {
  try {
    const heartVoiceId = parseInt(c.req.param('id'));
    
    if (!heartVoiceId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声ID无效'
      }, 400);
    }

    const autoPngService = new AutoPngService(c.env);
    const result = await autoPngService.generatePngForNewHeartVoice(heartVoiceId);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Generation Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        heartVoiceId,
        generatedCards: result.generatedCards
      },
      message: `成功为心声 ${heartVoiceId} 生成 ${result.generatedCards} 张PNG卡片`
    });

  } catch (error) {
    console.error('触发心声PNG生成失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/images/auto-generate/trigger/story/{id}:
 *   post:
 *     tags: [Auto PNG]
 *     summary: 触发故事PNG自动生成
 *     description: 当故事从A表迁移到B表时触发PNG生成
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 故事ID
 *     responses:
 *       200:
 *         description: PNG生成成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
autoPng.post('/trigger/story/:id', async (c) => {
  try {
    const storyId = parseInt(c.req.param('id'));
    
    if (!storyId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '故事ID无效'
      }, 400);
    }

    const autoPngService = new AutoPngService(c.env);
    const result = await autoPngService.generatePngForNewStory(storyId);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Generation Failed',
        message: result.error
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        storyId,
        generatedCards: result.generatedCards
      },
      message: `成功为故事 ${storyId} 生成 ${result.generatedCards} 张PNG卡片`
    });

  } catch (error) {
    console.error('触发故事PNG生成失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/images/auto-generate/batch-generate:
 *   post:
 *     tags: [Auto PNG]
 *     summary: 批量生成PNG卡片
 *     description: 为现有的心声和故事批量生成PNG卡片
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [heart_voice, story, both]
 *               limit:
 *                 type: integer
 *                 default: 50
 *     responses:
 *       200:
 *         description: 批量生成成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
autoPng.post('/batch-generate', authMiddleware, async (c) => {
  try {
    const { contentType = 'both', limit = 50 } = await c.req.json();

    const autoPngService = new AutoPngService(c.env);
    const results: any[] = [];

    if (contentType === 'heart_voice' || contentType === 'both') {
      const heartVoiceResult = await autoPngService.batchGeneratePng('heart_voice', limit);
      results.push({
        type: 'heart_voice',
        ...heartVoiceResult
      });
    }

    if (contentType === 'story' || contentType === 'both') {
      const storyResult = await autoPngService.batchGeneratePng('story', limit);
      results.push({
        type: 'story',
        ...storyResult
      });
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
    const allErrors = results.flatMap(r => r.errors);

    return c.json({
      success: true,
      data: {
        totalProcessed,
        totalGenerated,
        results,
        errors: allErrors
      },
      message: `批量生成完成：处理 ${totalProcessed} 项，生成 ${totalGenerated} 张PNG卡片`
    });

  } catch (error) {
    console.error('批量生成PNG失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/images/auto-generate/stats:
 *   get:
 *     tags: [Auto PNG]
 *     summary: 获取PNG生成统计
 *     description: 获取PNG卡片生成和下载的统计信息
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *       500:
 *         description: 服务器内部错误
 */
autoPng.get('/stats', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    // 获取PNG卡片统计
    const cardStats = await db.query(`
      SELECT 
        content_type,
        theme,
        COUNT(*) as count,
        SUM(download_count) as total_downloads
      FROM png_cards 
      GROUP BY content_type, theme
    `);

    // 获取总体统计
    const totalStats = await db.queryFirst(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(download_count) as total_downloads,
        COUNT(DISTINCT content_id) as unique_contents
      FROM png_cards
    `);

    // 获取最近7天的下载统计
    const recentDownloads = await db.query(`
      SELECT 
        DATE(downloaded_at) as date,
        COUNT(*) as downloads
      FROM png_downloads 
      WHERE downloaded_at >= datetime('now', '-7 days')
      GROUP BY DATE(downloaded_at)
      ORDER BY date DESC
    `);

    return c.json({
      success: true,
      data: {
        cardStats,
        totalStats,
        recentDownloads,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取PNG统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

export function createAutoPngRoutes() {
  return autoPng;
}

export { autoPng };

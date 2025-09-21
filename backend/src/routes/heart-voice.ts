/**
 * 心声系统路由
 * 处理用户心声数据的提交和管理
 */

import { Hono } from 'hono';
import { createDatabaseService } from '../db';
import { HeartVoiceService } from '../services/heartVoiceService';
import type { Env } from '../types/api';

const heartVoice = new Hono();

/**
 * @swagger
 * /api/heart-voices/submit:
 *   post:
 *     tags: [Heart Voice]
 *     summary: 提交心声内容
 *     description: 提交用户心声数据（公开接口，无需认证）
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 心声内容
 *                 example: "求职过程中遇到了很多困难..."
 *               source:
 *                 type: string
 *                 description: 心声来源
 *                 example: "questionnaire"
 *               sourceId:
 *                 type: string
 *                 description: 来源ID
 *                 example: "enhanced-intelligent-employment-survey-2024"
 *               metadata:
 *                 type: object
 *                 description: 元数据
 *                 properties:
 *                   submissionType:
 *                     type: string
 *                     example: "anonymous"
 *                   userId:
 *                     type: string
 *                     example: "anon_123456"
 *                   anonymousNickname:
 *                     type: string
 *                     example: "求职小白"
 *                   category:
 *                     type: string
 *                     example: "employment-feedback"
 *     responses:
 *       200:
 *         description: 心声提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "心声提交成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 123
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
heartVoice.post('/submit', async (c) => {
  console.log('Heart voice submit endpoint hit');
  try {
    const body = await c.req.json();
    const {
      questionnaireId,
      questionnaireResponseId,
      userId,
      content,
      category,
      submissionType,
      anonymousNickname
    } = body || {};

    // 基础验证
    if (!questionnaireId || !userId || !content) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声数据不完整：缺少必要字段'
      }, 400);
    }

    if (content.trim().length === 0) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声内容不能为空'
      }, 400);
    }

    if (content.length > 2000) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声内容不能超过2000个字符'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const heartVoiceService = new HeartVoiceService(db);

    // 准备心声数据
    const heartVoiceData = {
      questionnaireId,
      questionnaireResponseId,
      userId,
      content: content.trim(),
      category: category || 'employment-feedback',
      submissionType: submissionType || 'anonymous',
      anonymousNickname,
      ipAddress: c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown'
    };

    // 使用心声服务创建记录
    const heartVoiceId = await heartVoiceService.createHeartVoice(heartVoiceData);

    return c.json({
      success: true,
      message: '心声提交成功',
      data: {
        id: heartVoiceId,
        questionnaireId,
        userId,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('心声提交失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

/**
 * @swagger
 * /api/heart-voices/statistics:
 *   get:
 *     tags: [Heart Voice]
 *     summary: 获取心声统计数据
 *     description: 获取心声数据的统计信息（公开接口）
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 心声分类
 *         example: "employment-feedback"
 *     responses:
 *       200:
 *         description: 统计数据获取成功
 *       500:
 *         description: 服务器内部错误
 */
heartVoice.get('/statistics', async (c) => {
  try {
    const questionnaireId = c.req.query('questionnaireId');
    const db = createDatabaseService(c.env as Env);
    const heartVoiceService = new HeartVoiceService(db);

    // 获取统计数据
    const statistics = await heartVoiceService.getStatistics(questionnaireId);

    return c.json({
      success: true,
      data: {
        ...statistics,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取心声统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

// 获取心声列表
heartVoice.get('/list', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const category = c.req.query('category');
    const questionnaireId = c.req.query('questionnaireId');
    const userId = c.req.query('userId');

    const db = createDatabaseService(c.env as Env);
    const heartVoiceService = new HeartVoiceService(db);

    const result = await heartVoiceService.getHeartVoices({
      page,
      limit,
      category,
      questionnaireId,
      userId,
      isPublic: true,
      status: 'active'
    });

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取心声列表失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

// 踩心声API
heartVoice.post('/:id/dislike', async (c) => {
  try {
    const heartVoiceId = parseInt(c.req.param('id'));
    const userId = c.req.header('X-User-ID') || 'anonymous';
    const ipAddress = c.req.header('CF-Connecting-IP') ||
                     c.req.header('X-Forwarded-For') ||
                     'unknown';

    if (!heartVoiceId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声ID无效'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    // 检查是否已经踩过
    const existingDislike = await db.queryFirst(`
      SELECT id FROM heart_voice_dislikes
      WHERE voice_id = ? AND user_id = ?
    `, [heartVoiceId, userId]);

    if (existingDislike) {
      return c.json({
        success: false,
        error: 'Already Disliked',
        message: '您已经踩过这个心声了'
      }, 400);
    }

    // 添加踩记录
    await db.execute(`
      INSERT INTO heart_voice_dislikes (voice_id, user_id, ip_address)
      VALUES (?, ?, ?)
    `, [heartVoiceId, userId, ipAddress]);

    // 更新踩数量
    await db.execute(`
      UPDATE valid_heart_voices
      SET dislike_count = dislike_count + 1
      WHERE id = ?
    `, [heartVoiceId]);

    return c.json({
      success: true,
      message: '踩成功',
      data: {
        heartVoiceId,
        action: 'dislike'
      }
    });

  } catch (error) {
    console.error('踩心声失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

// 获取PNG卡片下载链接
heartVoice.get('/:id/png/:theme?', async (c) => {
  try {
    const heartVoiceId = parseInt(c.req.param('id'));
    const theme = c.req.param('theme') || 'gradient';

    if (!heartVoiceId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '心声ID无效'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    // 查找现有的PNG卡片
    const existingCard = await db.queryFirst(`
      SELECT card_id, download_url, r2_key
      FROM png_cards
      WHERE content_type = 'heart_voice' AND content_id = ? AND theme = ?
    `, [heartVoiceId, theme]);

    if (existingCard) {
      // 记录下载
      await db.execute(`
        INSERT INTO png_downloads (card_id, content_type, content_id, user_id, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        existingCard.card_id,
        'heart_voice',
        heartVoiceId,
        c.req.header('X-User-ID') || 'anonymous',
        c.req.header('CF-Connecting-IP') || 'unknown',
        c.req.header('User-Agent') || 'unknown'
      ]);

      // 更新下载计数
      await db.execute(`
        UPDATE png_cards
        SET download_count = download_count + 1
        WHERE card_id = ?
      `, [existingCard.card_id]);

      return c.json({
        success: true,
        data: {
          downloadUrl: existingCard.download_url,
          cardId: existingCard.card_id,
          theme
        }
      });
    } else {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '该主题的PNG卡片不存在，请先生成'
      }, 404);
    }

  } catch (error) {
    console.error('获取PNG下载链接失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '服务器内部错误，请稍后重试'
    }, 500);
  }
});

export function createHeartVoiceRoutes() {
  return heartVoice;
}

export { heartVoice };

/**
 * 心声路由
 * 提供心声相关的API端点
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { PngTriggerService } from '../services/pngTriggerService';

// 内容清理函数 - 移除分类标识符
function cleanContent(content: string): string {
  if (!content) return '';

  // 移除开头的分类标识符，如 [reflection]、[gratitude]、[suggestion] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
}

export function createHeartVoicesRoutes() {
  const heartVoices = new Hono<{ Bindings: Env }>();

  // 获取心声列表
  heartVoices.get('/', async (c) => {
    try {
      console.log('获取心声列表...');
      
      // 获取查询参数
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const category = c.req.query('category');
      const sortBy = c.req.query('sortBy') || 'approved_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      
      console.log('查询参数:', { page, pageSize, category, sortBy, sortOrder });
      
      const db = c.env.DB;
      
      // 计算偏移量
      const offset = (page - 1) * pageSize;
      
      // 构建查询条件
      let whereClause = "audit_status = 'approved'";
      const params: any[] = [];

      if (category) {
        whereClause += " AND category = ?";
        params.push(category);
      }

      // 先尝试最简单的查询
      const sql = `
        SELECT
          id,
          data_uuid,
          user_id,
          content,
          approved_at,
          audit_status,
          png_status,
          like_count,
          dislike_count,
          view_count
        FROM valid_heart_voices
        WHERE audit_status = 'approved'
        ORDER BY approved_at desc
        LIMIT ? OFFSET ?
      `;

      console.log('执行SQL:', sql);
      console.log('参数:', [...params, pageSize, offset]);

      // 获取心声列表 - 简化参数
      const voicesResult = await db.prepare(sql).bind(pageSize, offset).all();

      const voices = voicesResult.results;

      // 获取总数 - 简化查询
      const countSql = `
        SELECT COUNT(*) as total
        FROM valid_heart_voices
        WHERE audit_status = 'approved'
      `;

      console.log('执行计数SQL:', countSql);

      const totalResult = await db.prepare(countSql).first();
      
      const total = totalResult?.total || 0;
      
      console.log(`找到 ${voices.length} 条心声，总计 ${total} 条`);
      
      // 格式化数据 - 简化版本
      const formattedVoices = voices.map((voice: any) => ({
        id: voice.id,
        uuid: voice.data_uuid,
        userId: voice.user_id,
        content: cleanContent(voice.content),
        category: '求职感悟', // 临时硬编码
        emotionScore: 3,
        tags: [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: false,
        likeCount: voice.like_count || 0,
        dislikeCount: voice.dislike_count || 0,
        viewCount: voice.view_count || 0,
        createdAt: voice.approved_at || new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }));
      
      return c.json({
        success: true,
        data: {
          voices: formattedVoices,
          total: total,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(Number(total) / pageSize)
        },
        message: '心声列表获取成功'
      });
      
    } catch (error) {
      console.error('获取心声列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取心声列表失败'
      }, 500);
    }
  });

  // 获取单个心声详情
  heartVoices.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('获取心声详情:', id);
      
      const db = c.env.DB;

      const voice = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          content,
          category,
          emotion_score,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count
        FROM valid_heart_voices
        WHERE id = ? AND audit_status = 'approved'
      `).bind(id).first();
      
      if (!voice) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '心声不存在'
        }, 404);
      }
      
      const formattedVoice = {
        id: voice.id,
        uuid: voice.data_uuid,
        userId: voice.user_id,
        content: cleanContent(voice.content),
        category: voice.category,
        emotionScore: voice.emotion_score,
        tags: voice.tags ? JSON.parse(String(voice.tags)) : [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: false,
        likeCount: voice.like_count || 0,
        dislikeCount: voice.dislike_count || 0,
        createdAt: voice.created_at,
        publishedAt: voice.created_at
      };
      
      return c.json({
        success: true,
        data: formattedVoice,
        message: '心声详情获取成功'
      });
      
    } catch (error) {
      console.error('获取心声详情失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取心声详情失败'
      }, 500);
    }
  });

  // 创建心声
  heartVoices.post('/', async (c) => {
    try {
      const body = await c.req.json();
      console.log('创建心声:', body);
      
      const { content, category, emotion_score, tags, user_id } = body;
      
      // 验证必填字段
      if (!content || !category || !emotion_score || !user_id) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少必填字段'
        }, 400);
      }
      
      const db = c.env.DB;
      
      // 生成UUID
      const data_uuid = crypto.randomUUID();
      
      // 插入到原始心声表
      const rawResult = await db.prepare(`
        INSERT INTO raw_heart_voices (
          data_uuid, user_id, content, category, emotion_score, tags, submitted_at, raw_status
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'completed')
      `).bind(data_uuid, user_id, content, category, emotion_score, JSON.stringify(tags || [])).run();

      const rawId = rawResult.meta.last_row_id;

      // 直接插入到有效心声表（自动审核通过）
      const validResult = await db.prepare(`
        INSERT INTO valid_heart_voices (
          raw_id, data_uuid, user_id, content, category, emotion_score, tags,
          approved_at, audit_status, like_count, view_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'approved', 0, 0)
      `).bind(rawId, data_uuid, user_id, content, category, emotion_score, JSON.stringify(tags || [])).run();

      const validId = validResult.meta.last_row_id;

      // 触发PNG生成
      try {
        const pngTriggerService = new PngTriggerService(c.env);
        await pngTriggerService.onHeartVoiceApproved(validId as number, data_uuid);
        console.log(`✅ 心声PNG生成已触发: ${validId}`);
      } catch (error) {
        console.error('触发心声PNG生成失败:', error);
        // 不影响心声创建的成功响应
      }

      return c.json({
        success: true,
        data: {
          id: validId,
          uuid: data_uuid,
          message: '心声创建成功'
        },
        message: '心声创建成功'
      });
      
    } catch (error) {
      console.error('创建心声失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建心声失败'
      }, 500);
    }
  });

  // 获取用户心声列表
  heartVoices.get('/user/:userId', async (c) => {
    try {
      const userId = c.req.param('userId');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const sortBy = c.req.query('sortBy') || 'created_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';

      console.log('获取用户心声列表:', { userId, page, pageSize, sortBy, sortOrder });

      const db = c.env.DB;
      const offset = (page - 1) * pageSize;

      // 获取总数
      const countResult = await db.prepare(`
        SELECT COUNT(*) as total
        FROM valid_heart_voices
        WHERE user_id = ? AND audit_status = 'approved'
      `).bind(userId).first();

      const total = countResult?.total || 0;

      // 获取心声列表
      const voices = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          content,
          category,
          emotion_score,
          tags,
          approved_at as created_at,
          like_count,
          view_count,
          'approved' as status
        FROM valid_heart_voices
        WHERE user_id = ? AND audit_status = 'approved'
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `).bind(userId, pageSize, offset).all();

      // 格式化数据
      const formattedVoices = (Array.isArray(voices) ? voices : (voices as any).results || []).map((voice: any) => ({
        id: voice.id,
        uuid: voice.data_uuid,
        userId: voice.user_id,
        content: cleanContent(voice.content),
        category: voice.category,
        emotionScore: voice.emotion_score,
        tags: voice.tags ? JSON.parse(voice.tags) : [],
        created_at: voice.created_at,
        likeCount: voice.like_count || 0,
        viewCount: voice.view_count || 0,
        status: voice.status
      }));

      return c.json({
        success: true,
        data: {
          items: formattedVoices,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(Number(total) / pageSize)
          }
        }
      });

    } catch (error) {
      console.error('获取用户心声列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户心声列表失败'
      }, 500);
    }
  });

  // 点赞心声
  heartVoices.post('/:id/like', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('点赞心声:', id);

      const db = c.env.DB;

      // 增加点赞数
      await db.prepare(`
        UPDATE valid_heart_voices
        SET like_count = like_count + 1
        WHERE id = ?
      `).bind(id).run();

      return c.json({
        success: true,
        message: '点赞成功'
      });

    } catch (error) {
      console.error('点赞失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '点赞失败'
      }, 500);
    }
  });

  // 踩心声
  heartVoices.post('/:id/dislike', async (c) => {
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

  // 获取心声PNG卡片下载链接
  heartVoices.get('/:id/png/:theme?', async (c) => {
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
      console.error('获取心声PNG下载链接失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  return heartVoices;
}

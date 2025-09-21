/**
 * 故事路由
 * 提供故事相关的API端点
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
// PNG相关服务已移除

// 内容清理函数 - 移除分类标识符
function cleanContent(content: string): string {
  if (!content) return '';

  // 移除开头的分类标识符，如 [growth]、[interview]、[career_change] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
}

export function createStoriesRoutes() {
  const stories = new Hono<{ Bindings: Env }>();

  // 获取故事列表
  stories.get('/', async (c) => {
    try {
      console.log('获取故事列表...');
      
      // 获取查询参数
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const category = c.req.query('category');
      const sortBy = c.req.query('sortBy') || 'approved_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      const published = c.req.query('published') !== 'false'; // 默认只显示已发布的
      
      console.log('查询参数:', { page, pageSize, category, sortBy, sortOrder, published });
      
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

      // 获取故事列表 - 简化查询
      const storyResult = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          approved_at,
          audit_status,
          png_status,
          like_count,
          dislike_count,
          view_count
        FROM valid_stories
        WHERE audit_status = 'approved'
        ORDER BY approved_at desc
        LIMIT ? OFFSET ?
      `).bind(pageSize, offset).all();

      const storyList = storyResult.results;

      // 获取总数 - 简化查询
      const totalResult = await db.prepare(`
        SELECT COUNT(*) as total
        FROM valid_stories
        WHERE audit_status = 'approved'
      `).first();
      
      const total = totalResult?.total || 0;
      
      console.log(`找到 ${storyList.length} 条故事，总计 ${total} 条`);
      
      // 格式化数据 - 简化版本
      const formattedStories = storyList.map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 100) + '...',
        category: '求职经历', // 临时硬编码
        tags: [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: false,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }));
      
      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          total: total,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(Number(total) / pageSize)
        },
        message: '故事列表获取成功'
      });
      
    } catch (error) {
      console.error('获取故事列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取故事列表失败'
      }, 500);
    }
  });

  // 获取单个故事详情
  stories.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('获取故事详情:', id);
      
      const db = c.env.DB;

      // 增加浏览量
      await db.prepare(`
        UPDATE valid_stories
        SET view_count = view_count + 1
        WHERE id = ?
      `).bind(id).run();

      const story = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count
        FROM valid_stories
        WHERE id = ? AND audit_status = 'approved'
      `).bind(id).first();
      
      if (!story) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '故事不存在'
        }, 404);
      }
      
      const formattedStory = {
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(String(story.content)).substring(0, 100) + '...',
        category: story.category,
        tags: story.tags ? JSON.parse(String(story.tags)) : [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: false,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: story.created_at,
        publishedAt: story.created_at
      };
      
      return c.json({
        success: true,
        data: formattedStory,
        message: '故事详情获取成功'
      });
      
    } catch (error) {
      console.error('获取故事详情失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取故事详情失败'
      }, 500);
    }
  });

  // 创建故事
  stories.post('/', async (c) => {
    try {
      const body = await c.req.json();
      console.log('创建故事:', body);
      
      const { title, content, category, tags, user_id } = body;
      
      // 验证必填字段
      if (!title || !content || !category || !user_id) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少必填字段'
        }, 400);
      }
      
      const db = c.env.DB;

      // 生成UUID
      const data_uuid = crypto.randomUUID();

      // 插入到原始故事表
      const rawResult = await db.prepare(`
        INSERT INTO raw_story_submissions (
          data_uuid, user_id, title, content, category, tags, submitted_at, raw_status
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'completed')
      `).bind(data_uuid, user_id, title, content, category, JSON.stringify(tags || [])).run();

      const rawId = rawResult.meta.last_row_id;

      // 直接插入到有效故事表（自动审核通过）
      const validResult = await db.prepare(`
        INSERT INTO valid_stories (
          raw_id, data_uuid, user_id, title, content, category, tags,
          approved_at, audit_status, like_count, view_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'approved', 0, 0)
      `).bind(rawId, data_uuid, user_id, title, content, category, JSON.stringify(tags || [])).run();

      const validId = validResult.meta.last_row_id;

      // PNG生成功能已移除

      return c.json({
        success: true,
        data: {
          id: validId,
          uuid: data_uuid,
          message: '故事创建成功'
        },
        message: '故事创建成功'
      });
      
    } catch (error) {
      console.error('创建故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建故事失败'
      }, 500);
    }
  });

  // 点赞故事
  stories.post('/:id/like', async (c) => {
    try {
      const id = c.req.param('id');
      console.log('点赞故事:', id);

      const db = c.env.DB;

      // 增加点赞数
      await db.prepare(`
        UPDATE valid_stories
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

  // 踩故事
  stories.post('/:id/dislike', async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const userId = c.req.header('X-User-ID') || 'anonymous';
      const ipAddress = c.req.header('CF-Connecting-IP') ||
                       c.req.header('X-Forwarded-For') ||
                       'unknown';

      if (!storyId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '故事ID无效'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 检查是否已经踩过
      const existingDislike = await db.queryFirst(`
        SELECT id FROM story_dislikes
        WHERE story_id = ? AND user_id = ?
      `, [storyId, userId]);

      if (existingDislike) {
        return c.json({
          success: false,
          error: 'Already Disliked',
          message: '您已经踩过这个故事了'
        }, 400);
      }

      // 添加踩记录
      await db.execute(`
        INSERT INTO story_dislikes (story_id, user_id, ip_address)
        VALUES (?, ?, ?)
      `, [storyId, userId, ipAddress]);

      // 更新踩数量
      await db.execute(`
        UPDATE valid_stories
        SET dislike_count = dislike_count + 1
        WHERE id = ?
      `, [storyId]);

      return c.json({
        success: true,
        message: '踩成功',
        data: {
          storyId,
          action: 'dislike'
        }
      });

    } catch (error) {
      console.error('踩故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 获取故事PNG卡片下载链接（暂时禁用权限验证）
  stories.get('/:id/png/:theme?', async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const theme = c.req.param('theme') || 'gradient';

      if (!storyId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '故事ID无效'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找现有的PNG卡片
      const existingCard = await db.queryFirst(`
        SELECT card_id, download_url, r2_key
        FROM png_cards
        WHERE content_type = 'story' AND content_id = ? AND theme = ?
      `, [storyId, theme]);

      if (existingCard) {
        // 记录下载
        await db.execute(`
          INSERT INTO png_downloads (card_id, content_type, content_id, user_id, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          existingCard.card_id,
          'story',
          storyId,
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
      console.error('获取故事PNG下载链接失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 获取精选故事
  stories.get('/featured', async (c) => {
    try {
      console.log('获取精选故事...');
      
      const pageSize = parseInt(c.req.query('pageSize') || '6');
      
      const db = c.env.DB;

      // 获取点赞数最多的故事作为精选
      const featuredResult = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count
        FROM valid_stories
        WHERE audit_status = 'approved'
        ORDER BY like_count DESC, view_count DESC
        LIMIT ?
      `).bind(pageSize).all();

      const featuredStories = featuredResult.results;
      
      const formattedStories = featuredStories.map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 100) + '...',
        category: story.category,
        tags: story.tags ? JSON.parse(story.tags) : [],
        isAnonymous: true,
        authorName: '匿名用户',
        status: 'approved',
        isFeatured: true,
        isPublished: true,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        createdAt: story.created_at,
        publishedAt: story.created_at
      }));
      
      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          total: formattedStories.length
        },
        message: '精选故事获取成功'
      });
      
    } catch (error) {
      console.error('获取精选故事失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取精选故事失败'
      }, 500);
    }
  });

  // 获取用户故事列表
  stories.get('/user/:userId', async (c) => {
    try {
      const userId = c.req.param('userId');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const sortBy = c.req.query('sortBy') || 'created_at';
      const sortOrder = c.req.query('sortOrder') || 'desc';

      console.log('获取用户故事列表:', { userId, page, pageSize, sortBy, sortOrder });

      const db = c.env.DB;
      const offset = (page - 1) * pageSize;

      // 获取总数
      const countResult = await db.prepare(`
        SELECT COUNT(*) as total
        FROM valid_stories
        WHERE user_id = ? AND audit_status = 'approved'
      `).bind(userId).first();

      const total = countResult?.total || 0;

      // 获取故事列表
      const storiesResult = await db.prepare(`
        SELECT
          id,
          data_uuid,
          user_id,
          title,
          content,
          category,
          tags,
          approved_at as created_at,
          like_count,
          dislike_count,
          view_count,
          'approved' as status
        FROM valid_stories
        WHERE user_id = ? AND audit_status = 'approved'
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `).bind(userId, pageSize, offset).all();

      const userStories = storiesResult || [];

      // 格式化数据
      const formattedStories = (Array.isArray(userStories) ? userStories : (userStories as any).results || []).map((story: any) => ({
        id: story.id,
        uuid: story.data_uuid,
        userId: story.user_id,
        title: cleanContent(story.title),
        content: cleanContent(story.content),
        summary: cleanContent(story.content).substring(0, 200) + '...',
        category: story.category,
        tags: story.tags ? JSON.parse(story.tags) : [],
        created_at: story.created_at,
        likeCount: story.like_count || 0,
        dislikeCount: story.dislike_count || 0,
        viewCount: story.view_count || 0,
        status: story.status
      }));

      return c.json({
        success: true,
        data: {
          stories: formattedStories,
          items: formattedStories, // 兼容前端期望的格式
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(Number(total) / pageSize)
          }
        }
      });

    } catch (error) {
      console.error('获取用户故事列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户故事列表失败'
      }, 500);
    }
  });

  return stories;
}

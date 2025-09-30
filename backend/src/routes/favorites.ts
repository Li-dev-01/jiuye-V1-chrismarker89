/**
 * 收藏功能API路由
 * 提供用户收藏故事的后端支持
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';

const favorites = new Hono<{ Bindings: Env }>();

// 应用认证中间件到所有收藏路由
favorites.use('*', authMiddleware);

/**
 * 创建收藏表（如果不存在）
 */
async function ensureFavoritesTableExists(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_uuid TEXT NOT NULL,
        story_id TEXT NOT NULL,
        story_title TEXT NOT NULL,
        story_summary TEXT,
        story_category TEXT,
        story_author TEXT,
        story_published_at TEXT,
        favorited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- 确保同一用户不能重复收藏同一故事
        UNIQUE(user_uuid, story_id)
      )
    `).run();

    console.log('收藏表检查/创建完成');
  } catch (error) {
    console.error('创建收藏表失败:', error);
  }
}

/**
 * 添加收藏
 * POST /api/favorites
 */
favorites.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const body = await c.req.json();
    const { storyId, title, summary, category, authorName, publishedAt } = body;

    if (!storyId || !title) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '故事ID和标题不能为空'
      }, 400);
    }

    const db = c.env.DB;
    await ensureFavoritesTableExists(db);

    // 检查是否已收藏
    const existingFavorite = await db.prepare(`
      SELECT id FROM user_favorites 
      WHERE user_uuid = ? AND story_id = ?
    `).bind(user.uuid, storyId).first();

    if (existingFavorite) {
      return c.json({
        success: false,
        error: 'Already Favorited',
        message: '已经收藏过这个故事了'
      }, 400);
    }

    // 添加收藏
    const result = await db.prepare(`
      INSERT INTO user_favorites 
      (user_uuid, story_id, story_title, story_summary, story_category, story_author, story_published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.uuid,
      storyId,
      title,
      summary || '',
      category || 'general',
      authorName || '匿名用户',
      publishedAt || new Date().toISOString()
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        storyId,
        favoritedAt: new Date().toISOString()
      },
      message: '收藏成功'
    });

  } catch (error) {
    console.error('添加收藏失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '添加收藏失败'
    }, 500);
  }
});

/**
 * 取消收藏
 * DELETE /api/favorites/:storyId
 */
favorites.delete('/:storyId', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const storyId = c.req.param('storyId');
    const db = c.env.DB;
    await ensureFavoritesTableExists(db);

    // 删除收藏
    const result = await db.prepare(`
      DELETE FROM user_favorites 
      WHERE user_uuid = ? AND story_id = ?
    `).bind(user.uuid, storyId).run();

    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '收藏记录不存在'
      }, 404);
    }

    return c.json({
      success: true,
      message: '取消收藏成功'
    });

  } catch (error) {
    console.error('取消收藏失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '取消收藏失败'
    }, 500);
  }
});

/**
 * 获取用户收藏列表
 * GET /api/favorites
 */
favorites.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const category = c.req.query('category');
    const keyword = c.req.query('keyword');

    const db = c.env.DB;
    await ensureFavoritesTableExists(db);

    // 构建查询条件
    let whereClause = 'user_uuid = ?';
    const params: any[] = [user.uuid];

    if (category) {
      whereClause += ' AND story_category = ?';
      params.push(category);
    }

    if (keyword) {
      whereClause += ' AND (story_title LIKE ? OR story_summary LIKE ? OR story_author LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 获取总数
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM user_favorites WHERE ${whereClause}
    `).bind(...params).first();

    const total = countResult?.total || 0;

    // 获取收藏列表
    const offset = (page - 1) * pageSize;
    const favorites = await db.prepare(`
      SELECT 
        id,
        story_id,
        story_title,
        story_summary,
        story_category,
        story_author,
        story_published_at,
        favorited_at
      FROM user_favorites 
      WHERE ${whereClause}
      ORDER BY favorited_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    return c.json({
      success: true,
      data: {
        favorites: favorites.results || [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      message: '获取收藏列表成功'
    });

  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取收藏列表失败'
    }, 500);
  }
});

/**
 * 检查故事是否已收藏
 * GET /api/favorites/check/:storyId
 */
favorites.get('/check/:storyId', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.uuid) {
      return c.json({
        success: true,
        data: { isFavorited: false },
        message: '用户未登录'
      });
    }

    const storyId = c.req.param('storyId');
    const db = c.env.DB;
    await ensureFavoritesTableExists(db);

    const favorite = await db.prepare(`
      SELECT id FROM user_favorites 
      WHERE user_uuid = ? AND story_id = ?
    `).bind(user.uuid, storyId).first();

    return c.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id || null
      },
      message: '检查收藏状态成功'
    });

  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '检查收藏状态失败'
    }, 500);
  }
});

/**
 * 清空用户所有收藏
 * DELETE /api/favorites
 */
favorites.delete('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = c.env.DB;
    await ensureFavoritesTableExists(db);

    const result = await db.prepare(`
      DELETE FROM user_favorites WHERE user_uuid = ?
    `).bind(user.uuid).run();

    return c.json({
      success: true,
      data: {
        deletedCount: result.meta.changes
      },
      message: `清空收藏成功，共删除 ${result.meta.changes} 条记录`
    });

  } catch (error) {
    console.error('清空收藏失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '清空收藏失败'
    }, 500);
  }
});

export default favorites;

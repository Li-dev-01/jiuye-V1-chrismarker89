/**
 * Google OAuth白名单管理API
 * 仅超级管理员可以访问
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { generateUUID } from '../utils/uuid';
import { authMiddleware } from '../middleware/auth';

const googleWhitelist = new Hono<{ Bindings: Env }>();

// 应用认证中间件
googleWhitelist.use('*', authMiddleware);

// 超级管理员权限检查中间件
const superAdminOnly = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user || user.role !== 'super_admin') {
    return c.json({
      success: false,
      error: 'Forbidden',
      message: '仅超级管理员可以访问此功能'
    }, 403);
  }
  
  await next();
};

googleWhitelist.use('*', superAdminOnly);

/**
 * 获取白名单列表
 */
googleWhitelist.get('/', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    
    const whitelist = await db.queryAll(`
      SELECT 
        id,
        email,
        role,
        display_name as displayName,
        status,
        created_at as createdAt,
        last_used as lastUsed,
        created_by as createdBy
      FROM google_oauth_whitelist 
      ORDER BY created_at DESC
    `);

    return c.json({
      success: true,
      data: whitelist,
      message: '获取白名单成功'
    });

  } catch (error: any) {
    console.error('Get whitelist error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取白名单失败'
    }, 500);
  }
});

/**
 * 添加白名单条目
 */
googleWhitelist.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { email, role, displayName } = body;
    const user = c.get('user');

    if (!email || !role) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '邮箱和角色不能为空'
      }, 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '邮箱格式不正确'
      }, 400);
    }

    // 验证角色
    const validRoles = ['admin', 'reviewer', 'super_admin'];
    if (!validRoles.includes(role)) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的角色'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    
    // 检查邮箱是否已存在
    const existing = await db.queryFirst(
      'SELECT id FROM google_oauth_whitelist WHERE email = ?',
      [email]
    );

    if (existing) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: '该邮箱已在白名单中'
      }, 409);
    }

    // 添加到白名单
    const id = generateUUID('whitelist');
    const now = new Date().toISOString();

    await db.execute(`
      INSERT INTO google_oauth_whitelist (
        id, email, role, display_name, status, created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, email, role, displayName || null, 'active', now, user.id]);

    return c.json({
      success: true,
      data: { id, email, role, displayName, status: 'active', createdAt: now },
      message: '添加白名单成功'
    });

  } catch (error: any) {
    console.error('Add whitelist error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '添加白名单失败'
    }, 500);
  }
});

/**
 * 更新白名单条目
 */
googleWhitelist.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { role, displayName, status } = body;

    if (!role) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '角色不能为空'
      }, 400);
    }

    const validRoles = ['admin', 'reviewer', 'super_admin'];
    if (!validRoles.includes(role)) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的角色'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    
    // 检查条目是否存在
    const existing = await db.queryFirst(
      'SELECT id FROM google_oauth_whitelist WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '白名单条目不存在'
      }, 404);
    }

    // 更新条目
    await db.execute(`
      UPDATE google_oauth_whitelist 
      SET role = ?, display_name = ?, status = ?, updated_at = ?
      WHERE id = ?
    `, [role, displayName || null, status || 'active', new Date().toISOString(), id]);

    return c.json({
      success: true,
      message: '更新白名单成功'
    });

  } catch (error: any) {
    console.error('Update whitelist error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '更新白名单失败'
    }, 500);
  }
});

/**
 * 删除白名单条目
 */
googleWhitelist.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = createDatabaseService(c.env as Env);
    
    // 检查条目是否存在
    const existing = await db.queryFirst(
      'SELECT id FROM google_oauth_whitelist WHERE id = ?',
      [id]
    );

    if (!existing) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '白名单条目不存在'
      }, 404);
    }

    // 删除条目
    await db.execute('DELETE FROM google_oauth_whitelist WHERE id = ?', [id]);

    return c.json({
      success: true,
      message: '删除白名单成功'
    });

  } catch (error: any) {
    console.error('Delete whitelist error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '删除白名单失败'
    }, 500);
  }
});

/**
 * 检查邮箱是否在白名单中（内部API）
 */
googleWhitelist.get('/check/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = createDatabaseService(c.env as Env);
    
    const entry = await db.queryFirst(`
      SELECT email, role, status 
      FROM google_oauth_whitelist 
      WHERE email = ? AND status = 'active'
    `, [email]);

    return c.json({
      success: true,
      data: {
        isWhitelisted: !!entry,
        role: entry?.role || null
      }
    });

  } catch (error: any) {
    console.error('Check whitelist error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '检查白名单失败'
    }, 500);
  }
});

export { googleWhitelist };

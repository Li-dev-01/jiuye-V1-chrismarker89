/**
 * 管理员白名单管理API
 * 功能：
 * 1. Gmail白名单CRUD
 * 2. 角色权限管理
 * 3. 2FA启用/禁用
 * 4. 登录验证
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

const adminWhitelist = new Hono<{ Bindings: Env }>();

// 验证超级管理员权限中间件
const requireSuperAdmin = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未授权' }, 401);
  }

  const token = authHeader.substring(7);
  // TODO: 验证token并检查是否为super_admin
  // 这里简化处理，实际应该验证JWT token

  await next();
};

/**
 * 获取白名单用户列表
 */
adminWhitelist.get('/', requireSuperAdmin, async (c) => {
  try {
    const db = createDatabaseService(c.env.DB);
    
    const users = await db.all(`
      SELECT 
        id, email, role, permissions, allow_password_login as allowPasswordLogin,
        username, is_active as isActive, two_factor_enabled as twoFactorEnabled,
        created_by as createdBy, created_at as createdAt, 
        last_login_at as lastLoginAt, notes
      FROM admin_whitelist
      ORDER BY created_at DESC
    `);

    return c.json({
      success: true,
      users: users.map(user => ({
        ...user,
        permissions: JSON.parse(user.permissions || '[]')
      }))
    });
  } catch (error: any) {
    console.error('Get whitelist error:', error);
    return c.json({
      success: false,
      message: '获取用户列表失败'
    }, 500);
  }
});

/**
 * 添加白名单用户
 */
adminWhitelist.post('/', requireSuperAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const {
      email,
      role,
      permissions,
      allowPasswordLogin,
      username,
      password,
      isActive,
      notes
    } = body;

    // 验证必填字段
    if (!email || !role || !permissions) {
      return c.json({
        success: false,
        message: '缺少必填字段'
      }, 400);
    }

    // 验证Gmail邮箱
    if (!email.endsWith('@gmail.com')) {
      return c.json({
        success: false,
        message: '只允许Gmail邮箱'
      }, 400);
    }

    // 如果允许密码登录，必须提供用户名和密码
    if (allowPasswordLogin && (!username || !password)) {
      return c.json({
        success: false,
        message: '启用密码登录需要提供用户名和密码'
      }, 400);
    }

    const db = createDatabaseService(c.env.DB);

    // 检查邮箱是否已存在
    const existing = await db.get(
      'SELECT id FROM admin_whitelist WHERE email = ?',
      [email]
    );

    if (existing) {
      return c.json({
        success: false,
        message: '该邮箱已存在'
      }, 400);
    }

    // 如果提供了用户名，检查是否重复
    if (username) {
      const existingUsername = await db.get(
        'SELECT id FROM admin_whitelist WHERE username = ?',
        [username]
      );

      if (existingUsername) {
        return c.json({
          success: false,
          message: '该用户名已存在'
        }, 400);
      }
    }

    // 加密密码
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // 插入数据
    const result = await db.run(`
      INSERT INTO admin_whitelist (
        email, role, permissions, allow_password_login,
        username, password_hash, is_active, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      email,
      role,
      JSON.stringify(permissions),
      allowPasswordLogin ? 1 : 0,
      username || null,
      passwordHash,
      isActive ? 1 : 0,
      notes || null,
      'super_admin' // TODO: 从token中获取当前用户
    ]);

    return c.json({
      success: true,
      message: '添加成功',
      userId: result.lastID
    });
  } catch (error: any) {
    console.error('Add whitelist user error:', error);
    return c.json({
      success: false,
      message: '添加失败'
    }, 500);
  }
});

/**
 * 更新白名单用户
 */
adminWhitelist.put('/:id', requireSuperAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const {
      role,
      permissions,
      allowPasswordLogin,
      username,
      password,
      isActive,
      notes
    } = body;

    const db = createDatabaseService(c.env.DB);

    // 检查用户是否存在
    const user = await db.get(
      'SELECT id FROM admin_whitelist WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }

    // 构建更新SQL
    const updates: string[] = [];
    const params: any[] = [];

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (permissions) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(permissions));
    }

    if (typeof allowPasswordLogin === 'boolean') {
      updates.push('allow_password_login = ?');
      params.push(allowPasswordLogin ? 1 : 0);
    }

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (typeof isActive === 'boolean') {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await db.run(
      `UPDATE admin_whitelist SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return c.json({
      success: true,
      message: '更新成功'
    });
  } catch (error: any) {
    console.error('Update whitelist user error:', error);
    return c.json({
      success: false,
      message: '更新失败'
    }, 500);
  }
});

/**
 * 删除白名单用户
 */
adminWhitelist.delete('/:id', requireSuperAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const db = createDatabaseService(c.env.DB);

    // 检查是否为超级管理员（不允许删除）
    const user = await db.get(
      'SELECT role FROM admin_whitelist WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }

    if (user.role === 'super_admin') {
      return c.json({
        success: false,
        message: '不允许删除超级管理员'
      }, 403);
    }

    await db.run('DELETE FROM admin_whitelist WHERE id = ?', [userId]);

    return c.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('Delete whitelist user error:', error);
    return c.json({
      success: false,
      message: '删除失败'
    }, 500);
  }
});

/**
 * 启用2FA
 */
adminWhitelist.post('/:id/enable-2fa', requireSuperAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const db = createDatabaseService(c.env.DB);

    // 获取用户信息
    const user = await db.get(
      'SELECT email FROM admin_whitelist WHERE id = ?',
      [userId]
    );

    if (!user) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }

    // 生成2FA密钥
    const secret = speakeasy.generateSecret({
      name: `就业调研系统 (${user.email})`,
      issuer: '就业调研系统'
    });

    // 生成二维码
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // 生成备用恢复码
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // 保存到数据库
    await db.run(`
      UPDATE admin_whitelist 
      SET two_factor_enabled = 1,
          two_factor_secret = ?,
          backup_codes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [secret.base32, JSON.stringify(backupCodes), userId]);

    return c.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return c.json({
      success: false,
      message: '启用2FA失败'
    }, 500);
  }
});

/**
 * 禁用2FA
 */
adminWhitelist.post('/:id/disable-2fa', requireSuperAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const db = createDatabaseService(c.env.DB);

    await db.run(`
      UPDATE admin_whitelist 
      SET two_factor_enabled = 0,
          two_factor_secret = NULL,
          backup_codes = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId]);

    return c.json({
      success: true,
      message: '已禁用2FA'
    });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    return c.json({
      success: false,
      message: '禁用2FA失败'
    }, 500);
  }
});

/**
 * 验证2FA代码
 */
adminWhitelist.post('/verify-2fa', async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({
        success: false,
        message: '缺少必填字段'
      }, 400);
    }

    const db = createDatabaseService(c.env.DB);

    // 获取用户2FA密钥
    const user = await db.get(
      'SELECT two_factor_secret, backup_codes FROM admin_whitelist WHERE email = ?',
      [email]
    );

    if (!user || !user.two_factor_secret) {
      return c.json({
        success: false,
        message: '2FA未启用'
      }, 400);
    }

    // 验证TOTP代码
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2 // 允许前后2个时间窗口
    });

    if (verified) {
      return c.json({
        success: true,
        message: '验证成功'
      });
    }

    // 检查是否为备用恢复码
    const backupCodes = JSON.parse(user.backup_codes || '[]');
    if (backupCodes.includes(code)) {
      // 使用后移除该恢复码
      const newBackupCodes = backupCodes.filter((c: string) => c !== code);
      await db.run(
        'UPDATE admin_whitelist SET backup_codes = ? WHERE email = ?',
        [JSON.stringify(newBackupCodes), email]
      );

      return c.json({
        success: true,
        message: '验证成功（使用备用码）'
      });
    }

    return c.json({
      success: false,
      message: '验证码错误'
    }, 400);
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    return c.json({
      success: false,
      message: '验证失败'
    }, 500);
  }
});

export default adminWhitelist;


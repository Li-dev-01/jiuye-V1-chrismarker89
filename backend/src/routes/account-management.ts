/**
 * 账户管理API
 * 超级管理员用于管理邮箱和角色账号
 */

import { Hono } from 'hono';
import { createDatabaseService } from '../db';
import type { Env } from '../types/api';

const accountManagement = new Hono<{ Bindings: Env }>();

/**
 * 获取所有邮箱和角色账号
 */
accountManagement.get('/accounts', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    // 获取所有邮箱
    const emails = await db.query(`
      SELECT id, email, is_active, two_factor_enabled, created_by, created_at, last_login_at, notes
      FROM email_whitelist
      ORDER BY created_at DESC
    `);

    // 获取所有角色账号
    const accounts = await db.query(`
      SELECT id, email, role, username, display_name, permissions, 
             allow_password_login, is_active, created_at, last_login_at
      FROM role_accounts
      ORDER BY email, role
    `);

    // 按邮箱分组
    const emailMap = new Map();
    
    for (const email of emails) {
      emailMap.set(email.email, {
        ...email,
        accounts: []
      });
    }

    for (const account of accounts) {
      if (emailMap.has(account.email)) {
        emailMap.get(account.email).accounts.push({
          id: account.id,
          role: account.role,
          username: account.username,
          displayName: account.display_name,
          permissions: JSON.parse(account.permissions || '[]'),
          allowPasswordLogin: account.allow_password_login,
          isActive: account.is_active,
          createdAt: account.created_at,
          lastLoginAt: account.last_login_at
        });
      }
    }

    return c.json({
      success: true,
      data: {
        emails: Array.from(emailMap.values())
      }
    });

  } catch (error: any) {
    console.error('Get accounts error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取账号列表失败'
    }, 500);
  }
});

/**
 * 创建角色账号
 * 
 * 请求体：
 * {
 *   "email": "user@gmail.com",
 *   "role": "admin",
 *   "displayName": "Admin User",
 *   "permissions": ["manage_content", "view_analytics"],
 *   "allowPasswordLogin": true,
 *   "username": "admin_user",  // 可选
 *   "password": "password123"  // 如果allowPasswordLogin=true则必填
 * }
 */
accountManagement.post('/accounts', async (c) => {
  try {
    const body = await c.req.json();
    const { email, role, displayName, permissions, allowPasswordLogin, username, password, notes } = body;

    // 验证必填字段
    if (!email || !role) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '邮箱和角色是必填项'
      }, 400);
    }

    // 验证角色
    if (!['reviewer', 'admin', 'super_admin'].includes(role)) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的角色'
      }, 400);
    }

    // 验证邮箱格式
    if (!email.includes('@')) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的邮箱格式'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 1. 检查邮箱是否在白名单中，如果不在则添加
    let emailWhitelist = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE email = ?
    `, [email]);

    if (!emailWhitelist) {
      // 添加邮箱到白名单
      await db.execute(`
        INSERT INTO email_whitelist (email, is_active, is_verified, created_by, created_at, updated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [email, 1, 1, 'super_admin', now, now, notes || '']);

      emailWhitelist = await db.queryFirst(`
        SELECT id, email FROM email_whitelist WHERE email = ?
      `, [email]);
    }

    // 2. 检查该邮箱是否已有该角色的账号
    const existingAccount = await db.queryFirst(`
      SELECT id FROM role_accounts WHERE email = ? AND role = ?
    `, [email, role]);

    if (existingAccount) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: `该邮箱已有${getRoleDisplayName(role)}账号`
      }, 409);
    }

    // 3. 生成用户名（如果未提供）
    const finalUsername = username || generateUsername(email, role);

    // 4. 处理密码（如果允许密码登录）
    let passwordHash = null;
    if (allowPasswordLogin) {
      if (!password) {
        return c.json({
          success: false,
          error: 'Invalid Request',
          message: '允许密码登录时必须提供密码'
        }, 400);
      }
      // TODO: 实际应该使用bcrypt等加密
      passwordHash = `hash_${password}`;
    }

    // 5. 创建角色账号
    await db.execute(`
      INSERT INTO role_accounts (
        email, role, username, display_name, permissions,
        allow_password_login, password_hash, is_active,
        created_by, created_at, updated_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      email,
      role,
      finalUsername,
      displayName || `${getRoleDisplayName(role)} User`,
      JSON.stringify(permissions || getDefaultPermissions(role)),
      allowPasswordLogin ? 1 : 0,
      passwordHash,
      1,
      'super_admin',
      now,
      now,
      notes || ''
    ]);

    // 6. 获取创建的账号
    const newAccount = await db.queryFirst(`
      SELECT id, email, role, username, display_name, permissions, 
             allow_password_login, is_active, created_at
      FROM role_accounts
      WHERE email = ? AND role = ?
    `, [email, role]);

    // 7. 记录审计日志
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'super_admin',
      'super_admin',
      'create_account',
      email,
      role,
      newAccount.id,
      JSON.stringify({ displayName, permissions, allowPasswordLogin }),
      1,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      now
    ]);

    return c.json({
      success: true,
      data: {
        account: {
          id: newAccount.id,
          email: newAccount.email,
          role: newAccount.role,
          username: newAccount.username,
          displayName: newAccount.display_name,
          permissions: JSON.parse(newAccount.permissions || '[]'),
          allowPasswordLogin: newAccount.allow_password_login,
          isActive: newAccount.is_active,
          createdAt: newAccount.created_at
        }
      },
      message: `成功创建${getRoleDisplayName(role)}账号`
    });

  } catch (error: any) {
    console.error('Create account error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '创建账号失败'
    }, 500);
  }
});

/**
 * 删除角色账号
 */
accountManagement.delete('/accounts/:id', async (c) => {
  try {
    const accountId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);

    // 获取账号信息
    const account = await db.queryFirst(`
      SELECT id, email, role, username FROM role_accounts WHERE id = ?
    `, [accountId]);

    if (!account) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '账号不存在'
      }, 404);
    }

    // 删除账号
    await db.execute(`
      DELETE FROM role_accounts WHERE id = ?
    `, [accountId]);

    // 记录审计日志
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'super_admin',
      'super_admin',
      'delete_account',
      account.email,
      account.role,
      accountId,
      JSON.stringify({ username: account.username }),
      1,
      new Date().toISOString()
    ]);

    return c.json({
      success: true,
      message: '账号删除成功'
    });

  } catch (error: any) {
    console.error('Delete account error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '删除账号失败'
    }, 500);
  }
});

/**
 * 删除邮箱及其所有角色账号
 */
accountManagement.delete('/emails/:id', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取邮箱信息
    const emailRecord = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailRecord) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 获取该邮箱下的所有角色账号
    const accounts = await db.query(`
      SELECT id, role, username FROM role_accounts WHERE email = ?
    `, [emailRecord.email]);

    // 删除所有角色账号
    await db.execute(`
      DELETE FROM role_accounts WHERE email = ?
    `, [emailRecord.email]);

    // 删除邮箱
    await db.execute(`
      DELETE FROM email_whitelist WHERE id = ?
    `, [emailId]);

    // 记录审计日志
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email,
        details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'super_admin',
      'super_admin',
      'delete_email',
      emailRecord.email,
      JSON.stringify({
        deletedAccounts: accounts.length,
        accountDetails: accounts.map(a => ({ id: a.id, role: a.role, username: a.username }))
      }),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: `邮箱 ${emailRecord.email} 及其 ${accounts.length} 个角色账号已删除`
    });

  } catch (error: any) {
    console.error('Delete email error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '删除邮箱失败'
    }, 500);
  }
});

/**
 * 切换邮箱状态（停用/启用）
 */
accountManagement.put('/emails/:id/toggle-status', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { isActive } = body;
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取邮箱信息
    const emailRecord = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailRecord) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 更新邮箱状态
    await db.execute(`
      UPDATE email_whitelist SET is_active = ?, updated_at = ? WHERE id = ?
    `, [isActive ? 1 : 0, now, emailId]);

    // 同时更新该邮箱下的所有角色账号状态
    await db.execute(`
      UPDATE role_accounts SET is_active = ?, updated_at = ? WHERE email = ?
    `, [isActive ? 1 : 0, now, emailRecord.email]);

    // 记录审计日志
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email,
        details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'super_admin',
      'super_admin',
      isActive ? 'enable_email' : 'disable_email',
      emailRecord.email,
      JSON.stringify({ isActive }),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: `邮箱已${isActive ? '启用' : '停用'}`
    });

  } catch (error: any) {
    console.error('Toggle email status error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '更新邮箱状态失败'
    }, 500);
  }
});

/**
 * 切换角色账号状态（停用/启用）
 */
accountManagement.put('/accounts/:id/toggle-status', async (c) => {
  try {
    const accountId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { isActive } = body;
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取账号信息
    const account = await db.queryFirst(`
      SELECT id, email, role, username FROM role_accounts WHERE id = ?
    `, [accountId]);

    if (!account) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '账号不存在'
      }, 404);
    }

    // 更新账号状态
    await db.execute(`
      UPDATE role_accounts SET is_active = ?, updated_at = ? WHERE id = ?
    `, [isActive ? 1 : 0, now, accountId]);

    // 记录审计日志
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'super_admin',
      'super_admin',
      isActive ? 'enable_account' : 'disable_account',
      account.email,
      account.role,
      accountId,
      JSON.stringify({ username: account.username, isActive }),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: `账号已${isActive ? '启用' : '停用'}`
    });

  } catch (error: any) {
    console.error('Toggle account status error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '更新账号状态失败'
    }, 500);
  }
});

// ============================================
// 辅助函数
// ============================================

function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'reviewer': '审核员',
    'admin': '管理员',
    'super_admin': '超级管理员'
  };
  return roleNames[role] || role;
}

function generateUsername(email: string, role: string): string {
  const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
  const rolePrefix = role.replace('_', '');
  return `${rolePrefix}_${emailPrefix}`;
}

function getDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'reviewer': ['review_content', 'view_dashboard'],
    'admin': ['manage_content', 'view_analytics', 'manage_api'],
    'super_admin': ['all']
  };
  return permissionMap[role] || [];
}

export default accountManagement;


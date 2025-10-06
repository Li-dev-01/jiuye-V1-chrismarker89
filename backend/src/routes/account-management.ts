/**
 * 账户管理API
 * 超级管理员用于管理邮箱和角色账号
 */

import { Hono } from 'hono';
import { createDatabaseService } from '../db';
import type { Env } from '../types/api';
import { simpleAuthMiddleware, requireRole } from '../middleware/simpleAuth';

const accountManagement = new Hono<{ Bindings: Env }>();

// 添加认证中间件：所有路由都需要超级管理员权限
accountManagement.use('*', simpleAuthMiddleware);
accountManagement.use('*', requireRole('super_admin'));

/**
 * 获取所有邮箱和角色账号
 */
accountManagement.get('/accounts', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    // 获取所有邮箱
    const emails = await db.query(`
      SELECT id, email, is_active, two_factor_bound, two_factor_enabled, created_by, created_at, last_login_at, notes
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
        id: email.id,
        email: email.email,
        isActive: Boolean(email.is_active),
        twoFactorBound: Boolean(email.two_factor_bound), // 是否已绑定
        twoFactorEnabled: Boolean(email.two_factor_enabled), // 是否已启用
        createdBy: email.created_by || '',
        createdAt: email.created_at,
        lastLoginAt: email.last_login_at,
        notes: email.notes || '',
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
          allowPasswordLogin: Boolean(account.allow_password_login),
          isActive: Boolean(account.is_active),
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

      // 验证密码强度
      if (password.length < 8) {
        return c.json({
          success: false,
          error: 'Invalid Request',
          message: '密码长度至少为8位'
        }, 400);
      }

      // 使用简单的哈希（Cloudflare Workers 环境限制）
      // 注意：这是临时方案，生产环境应该使用 bcrypt 或 Web Crypto API
      passwordHash = await hashPassword(password);
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
    const operator = c.get('user'); // 从认证上下文获取操作者信息
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
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
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
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
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email,
        details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
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
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email,
        details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
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
 * 启用2FA
 */
accountManagement.post('/accounts/:id/enable-2fa', async (c) => {
  try {
    const accountId = parseInt(c.req.param('id'));
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

    // 生成2FA密钥（32个字符的base32字符串）
    const { generateBase32Secret, generateQRCodeURL, generateBackupCodes, hashBackupCode } = await import('../utils/totp');
    const secret = generateBase32Secret(32);

    // 生成QR码URL（用于Google Authenticator等应用）
    const qrCodeUrl = generateQRCodeURL(secret, account.username, '就业调查系统');

    // 生成备用代码
    const backupCodes = generateBackupCodes(10, 8);

    // 更新邮箱白名单的2FA设置
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_enabled = 1, two_factor_secret = ?, updated_at = ?
      WHERE email = ?
    `, [secret, now, account.email]);

    // 存储备用代码（哈希后）
    for (const code of backupCodes) {
      const codeHash = await hashBackupCode(code);
      await db.execute(`
        INSERT INTO two_factor_backup_codes (email, code_hash, created_at)
        VALUES (?, ?, ?)
      `, [account.email, codeHash, now]);
    }

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'enable_2fa',
      account.email,
      account.role,
      accountId,
      JSON.stringify({ username: account.username }),
      1,
      now
    ]);

    return c.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeUrl,
        backupCodes // 返回备用代码（仅此一次显示）
      },
      message: '2FA已启用，请妥善保存备用代码'
    });

  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '启用2FA失败'
    }, 500);
  }
});

/**
 * 禁用2FA
 */
accountManagement.post('/accounts/:id/disable-2fa', async (c) => {
  try {
    const accountId = parseInt(c.req.param('id'));
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

    // 更新邮箱白名单的2FA设置
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = ?
      WHERE email = ?
    `, [now, account.email]);

    // 删除所有备用代码
    await db.execute(`
      DELETE FROM two_factor_backup_codes WHERE email = ?
    `, [account.email]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'disable_2fa',
      account.email,
      account.role,
      accountId,
      JSON.stringify({ username: account.username }),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: '2FA已禁用'
    });

  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '禁用2FA失败'
    }, 500);
  }
});

/**
 * 绑定2FA - 第一步：生成密钥和QR码
 */
accountManagement.post('/emails/:id/bind-2fa', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);

    // 获取邮箱信息
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 获取该邮箱的第一个角色账号（用于生成 QR 码）
    const account = await db.queryFirst(`
      SELECT id, username FROM role_accounts WHERE email = ? LIMIT 1
    `, [emailWhitelist.email]);

    if (!account) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '该邮箱没有关联的角色账号'
      }, 404);
    }

    // 生成2FA密钥
    const { generateBase32Secret, generateQRCodeURL, generateBackupCodes } = await import('../utils/totp');
    const secret = generateBase32Secret(32);

    // 生成QR码URL
    const qrCodeUrl = generateQRCodeURL(secret, account.username, '就业调查系统');

    // 生成备用代码
    const backupCodes = generateBackupCodes(10, 8);
    const now = new Date().toISOString();

    // 将密钥和备用代码临时存储到数据库（等待验证）
    // 先删除旧的待验证记录
    await db.execute(`
      DELETE FROM two_factor_pending WHERE email_id = ?
    `, [emailId]);

    // 插入新的待验证记录
    await db.execute(`
      INSERT INTO two_factor_pending (email_id, email, secret, backup_codes, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime(?, '+10 minutes'))
    `, [emailId, emailWhitelist.email, secret, JSON.stringify(backupCodes), now, now]);

    return c.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeUrl,
        backupCodes
      },
      message: '请扫描二维码并输入验证码以完成绑定'
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '启用2FA失败',
      details: error.message || String(error)
    }, 500);
  }
});

/**
 * 验证2FA绑定 - 第二步：验证验证码并完成绑定（但不启用）
 */
accountManagement.post('/emails/:id/verify-2fa-binding', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const { code } = await c.req.json();
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    if (!code || code.length !== 6) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '请输入6位验证码'
      }, 400);
    }

    // 从数据库获取临时存储的密钥
    const pendingData = await db.queryFirst(`
      SELECT email_id, email, secret, backup_codes, expires_at
      FROM two_factor_pending
      WHERE email_id = ? AND datetime(expires_at) > datetime('now')
    `, [emailId]);

    console.log('[VERIFY_2FA] Pending data:', pendingData);

    if (!pendingData) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '2FA设置已过期，请重新开始'
      }, 404);
    }

    const { secret, backup_codes, email } = pendingData;
    const backupCodes = JSON.parse(backup_codes);

    console.log('[VERIFY_2FA] Secret:', secret);
    console.log('[VERIFY_2FA] Code:', code);
    console.log('[VERIFY_2FA] Backup codes count:', backupCodes.length);

    // 验证 TOTP 代码
    const { verifyTOTP, hashBackupCode } = await import('../utils/totp');

    let isValid = false;
    try {
      // 注意：verifyTOTP 的参数顺序是 (code, secret)
      isValid = await verifyTOTP(code, secret);
      console.log('[VERIFY_2FA] Verification result:', isValid);
    } catch (error) {
      console.error('[VERIFY_2FA] Verification error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '验证失败，请重试',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '验证码错误，请重试'
      }, 401);
    }

    // 验证成功，将备用代码哈希后存储
    const backupCodesHashes: string[] = [];
    for (const backupCode of backupCodes) {
      const codeHash = await hashBackupCode(backupCode);
      backupCodesHashes.push(codeHash);
    }

    // 更新邮箱白名单的2FA设置（标记为已绑定，但不启用）
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_bound = 1, two_factor_secret = ?, backup_codes = ?, updated_at = ?
      WHERE id = ?
    `, [secret, JSON.stringify(backupCodesHashes), now, emailId]);

    // 删除临时数据
    await db.execute(`
      DELETE FROM two_factor_pending WHERE email_id = ?
    `, [emailId]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'bind_2fa',
      email,
      'email',
      emailId,
      JSON.stringify({ verified: true }),
      1,
      now
    ]);

    return c.json({
      success: true,
      data: {
        backupCodes
      },
      message: '2FA绑定成功！请妥善保存备用代码'
    });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '验证失败',
      details: error.message || String(error)
    }, 500);
  }
});

/**
 * 启用2FA（要求已绑定）
 */
accountManagement.post('/emails/:id/enable-2fa', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取邮箱信息
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email, two_factor_bound FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    if (!emailWhitelist.two_factor_bound) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '请先绑定2FA'
      }, 400);
    }

    // 启用2FA
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_enabled = 1, updated_at = ?
      WHERE id = ?
    `, [now, emailId]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'enable_2fa',
      emailWhitelist.email,
      'email',
      emailId,
      JSON.stringify({}),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: '2FA已启用'
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '启用2FA失败',
      details: error.message || String(error)
    }, 500);
  }
});

/**
 * 禁用2FA（但保留绑定）
 */
accountManagement.post('/emails/:id/disable-2fa', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取邮箱信息
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 禁用2FA（但保留绑定和密钥）
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_enabled = 0, updated_at = ?
      WHERE id = ?
    `, [now, emailId]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'disable_2fa',
      emailWhitelist.email,
      'email',
      emailId,
      JSON.stringify({}),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: '2FA已禁用'
    });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '禁用2FA失败'
    }, 500);
  }
});

/**
 * 解绑2FA（完全移除）
 */
accountManagement.post('/emails/:id/unbind-2fa', async (c) => {
  try {
    const emailId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取邮箱信息
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email FROM email_whitelist WHERE id = ?
    `, [emailId]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 完全移除2FA（清空所有相关数据）
    await db.execute(`
      UPDATE email_whitelist
      SET two_factor_bound = 0, two_factor_enabled = 0, two_factor_secret = NULL, backup_codes = NULL, updated_at = ?
      WHERE id = ?
    `, [now, emailId]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'unbind_2fa',
      emailWhitelist.email,
      'email',
      emailId,
      JSON.stringify({}),
      1,
      now
    ]);

    return c.json({
      success: true,
      message: '2FA已解绑'
    });
  } catch (error: any) {
    console.error('Unbind 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '解绑2FA失败'
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
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
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
  const timestamp = Date.now().toString().slice(-6); // 添加时间戳避免冲突
  return `${rolePrefix}_${emailPrefix}_${timestamp}`;
}

function getDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'reviewer': ['review_content', 'view_dashboard'],
    'admin': ['manage_content', 'view_analytics', 'manage_api'],
    'super_admin': ['all']
  };
  return permissionMap[role] || [];
}

/**
 * 密码哈希函数
 * 使用 Web Crypto API（Cloudflare Workers 支持）
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // 使用 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `sha256_${hashHex}`;
}

/**
 * 验证密码
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

/**
 * 生成TOTP密钥（Base32编码）
 */
async function generateTOTPSecret(): Promise<string> {
  const { generateBase32Secret } = await import('../utils/totp');
  return generateBase32Secret(32);
}

/**
 * 激活角色账号（切换到该角色）
 * 生成新的 token，允许超级管理员以该角色身份登录
 */
accountManagement.post('/accounts/:id/activate', async (c) => {
  try {
    const accountId = parseInt(c.req.param('id'));
    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 获取账号信息
    const account = await db.queryFirst(`
      SELECT id, email, role, username, is_active FROM role_accounts WHERE id = ?
    `, [accountId]);

    if (!account) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '账号不存在'
      }, 404);
    }

    if (!account.is_active) {
      return c.json({
        success: false,
        error: 'Forbidden',
        message: '该账号已被禁用'
      }, 403);
    }

    // 生成新的 token（使用简化认证系统的格式）
    const tokenPayload = {
      username: account.username,
      email: account.email,
      role: account.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24小时过期
    };

    // 使用 JWT 签名
    const secret = c.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(tokenPayload));
    const signature = btoa(`${header}.${payload}.${secret}`); // 简化的签名
    const token = `${header}.${payload}.${signature}`;

    // 更新最后登录时间
    await db.execute(`
      UPDATE role_accounts SET last_login_at = ? WHERE id = ?
    `, [now, accountId]);

    await db.execute(`
      UPDATE email_whitelist SET last_login_at = ? WHERE email = ?
    `, [now, account.email]);

    // 记录审计日志
    const operator = c.get('user');
    await db.execute(`
      INSERT INTO account_audit_logs (
        operator_email, operator_role, action, target_email, target_role,
        target_account_id, details, success, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      operator?.username || 'unknown',
      operator?.role || 'super_admin',
      'activate_role',
      account.email,
      account.role,
      accountId,
      JSON.stringify({ username: account.username }),
      1,
      now
    ]);

    return c.json({
      success: true,
      data: {
        token,
        role: account.role,
        username: account.username,
        email: account.email
      },
      message: `已切换到 ${account.role} 角色`
    });

  } catch (error: any) {
    console.error('Activate account error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '激活角色失败'
    }, 500);
  }
});

/**
 * 获取审计日志列表
 */
accountManagement.get('/audit-logs', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);

    // 获取查询参数
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '50');
    const action = c.req.query('action');
    const targetEmail = c.req.query('targetEmail');
    const operatorEmail = c.req.query('operatorEmail');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }

    if (targetEmail) {
      whereConditions.push('target_email LIKE ?');
      params.push(`%${targetEmail}%`);
    }

    if (operatorEmail) {
      whereConditions.push('operator_email LIKE ?');
      params.push(`%${operatorEmail}%`);
    }

    if (startDate) {
      whereConditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 查询总数
    const countResult = await db.queryFirst(`
      SELECT COUNT(*) as total FROM account_audit_logs ${whereClause}
    `, params);

    const total = countResult?.total || 0;

    // 查询日志列表
    const logs = await db.query(`
      SELECT
        id, operator_email, operator_role, action,
        target_email, target_role, target_account_id,
        details, success, created_at
      FROM account_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    return c.json({
      success: true,
      data: {
        logs: logs.map((log: any) => ({
          id: log.id,
          operatorEmail: log.operator_email,
          operatorRole: log.operator_role,
          action: log.action,
          targetEmail: log.target_email,
          targetRole: log.target_role,
          targetAccountId: log.target_account_id,
          details: log.details ? JSON.parse(log.details) : null,
          success: Boolean(log.success),
          createdAt: log.created_at
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取审计日志失败'
    }, 500);
  }
});

/**
 * 获取审计日志统计信息
 */
accountManagement.get('/audit-logs/stats', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    const days = parseInt(c.req.query('days') || '7');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 按操作类型统计
    const actionStats = await db.query(`
      SELECT action, COUNT(*) as count
      FROM account_audit_logs
      WHERE created_at >= ?
      GROUP BY action
      ORDER BY count DESC
    `, [startDate]);

    // 按操作者统计
    const operatorStats = await db.query(`
      SELECT operator_email, COUNT(*) as count
      FROM account_audit_logs
      WHERE created_at >= ?
      GROUP BY operator_email
      ORDER BY count DESC
      LIMIT 10
    `, [startDate]);

    // 成功/失败统计
    const successStats = await db.query(`
      SELECT success, COUNT(*) as count
      FROM account_audit_logs
      WHERE created_at >= ?
      GROUP BY success
    `, [startDate]);

    // 每日统计
    const dailyStats = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM account_audit_logs
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate]);

    return c.json({
      success: true,
      data: {
        actionStats: actionStats.map((s: any) => ({
          action: s.action,
          count: s.count
        })),
        operatorStats: operatorStats.map((s: any) => ({
          operatorEmail: s.operator_email,
          count: s.count
        })),
        successStats: successStats.map((s: any) => ({
          success: Boolean(s.success),
          count: s.count
        })),
        dailyStats: dailyStats.map((s: any) => ({
          date: s.date,
          count: s.count
        }))
      }
    });

  } catch (error: any) {
    console.error('Get audit logs stats error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取审计日志统计失败'
    }, 500);
  }
});

export default accountManagement;


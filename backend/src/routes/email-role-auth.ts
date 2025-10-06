/**
 * 邮箱与角色账号认证系统
 * 核心概念：一个邮箱可以对应多个角色账号
 */

import { Hono } from 'hono';
import { createDatabaseService } from '../db';
import type { Env } from '../types/api';

const emailRoleAuth = new Hono<{ Bindings: Env }>();

// Google OAuth配置
const GOOGLE_CLIENT_ID = '23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = (env: Env) => env.GOOGLE_CLIENT_SECRET;

/**
 * 验证Google OAuth token并获取用户信息
 */
async function verifyGoogleToken(accessToken: string): Promise<any> {
  const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);

  if (!response.ok) {
    throw new Error('Failed to verify Google token');
  }

  return await response.json();
}

/**
 * 使用授权码交换访问令牌
 */
async function exchangeCodeForToken(code: string, redirectUri: string, clientSecret: string): Promise<any> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[EMAIL_ROLE_AUTH] Token exchange failed:', error);
    throw new Error('Failed to exchange code for token');
  }

  return await response.json();
}

/**
 * Google OAuth回调 - 邮箱与角色账号版本
 * 
 * 流程：
 * 1. 用户在登录页面选择角色（reviewer/admin/super_admin）
 * 2. 点击Google登录
 * 3. Google OAuth验证邮箱
 * 4. 后端检查该邮箱是否在白名单中
 * 5. 检查该邮箱是否有对应角色的账号
 * 6. 如果有 → 登录该角色账号
 * 7. 如果没有 → 返回错误"您没有该角色权限"
 */
emailRoleAuth.post('/google/callback', async (c) => {
  try {
    console.log('[EMAIL_ROLE_AUTH] 🚀 Google OAuth callback started');

    const body = await c.req.json();
    const { code, redirectUri, role } = body; // role是用户选择的角色

    console.log('[EMAIL_ROLE_AUTH] 📋 Request params:', {
      hasCode: !!code,
      redirectUri,
      role
    });

    if (!code || !role) {
      console.error('[EMAIL_ROLE_AUTH] ❌ Missing required parameters');
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    // 验证角色
    if (!['reviewer', 'admin', 'super_admin'].includes(role)) {
      console.error('[EMAIL_ROLE_AUTH] ❌ Invalid role:', role);
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的角色'
      }, 400);
    }

    // 获取Google Client Secret
    const clientSecret = GOOGLE_CLIENT_SECRET(c.env as Env);
    console.log('[EMAIL_ROLE_AUTH] 🔑 Client secret configured:', !!clientSecret);

    if (!clientSecret) {
      console.error('[EMAIL_ROLE_AUTH] ❌ Google Client Secret not configured');
      return c.json({
        success: false,
        error: 'Configuration Error',
        message: 'Google OAuth配置不完整，请联系系统管理员'
      }, 500);
    }

    console.log('[EMAIL_ROLE_AUTH] 🔄 Exchanging code for token...');

    // 交换授权码获取访问令牌
    const tokenData = await exchangeCodeForToken(code, redirectUri, clientSecret);

    console.log('[EMAIL_ROLE_AUTH] ✅ Token exchange successful');

    // 使用访问令牌获取用户信息
    const googleUser = await verifyGoogleToken(tokenData.access_token);

    console.log('[EMAIL_ROLE_AUTH] 📧 Google user email:', googleUser.email);

    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 1. 检查邮箱是否在白名单中
    console.log('[EMAIL_ROLE_AUTH] 🔍 Checking email whitelist for:', googleUser.email);

    const emailWhitelist = await db.queryFirst(`
      SELECT id, email, is_active, two_factor_enabled
      FROM email_whitelist
      WHERE email = ? AND is_active = 1
    `, [googleUser.email]);

    console.log('[EMAIL_ROLE_AUTH] 📋 Whitelist check result:', {
      found: !!emailWhitelist,
      email: googleUser.email
    });

    if (!emailWhitelist) {
      console.error('[EMAIL_ROLE_AUTH] ❌ Email not in whitelist:', googleUser.email);
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '您的邮箱不在白名单中，请联系超级管理员'
      }, 403);
    }

    // 2. 检查该邮箱是否有对应角色的账号
    console.log('[EMAIL_ROLE_AUTH] 🔍 Checking role account for:', {
      email: googleUser.email,
      role
    });

    const roleAccount = await db.queryFirst(`
      SELECT id, email, role, username, display_name, permissions, is_active
      FROM role_accounts
      WHERE email = ? AND role = ? AND is_active = 1
    `, [googleUser.email, role]);

    console.log('[EMAIL_ROLE_AUTH] 📋 Role account check result:', {
      found: !!roleAccount,
      email: googleUser.email,
      role
    });

    if (!roleAccount) {
      console.error('[EMAIL_ROLE_AUTH] ❌ No role account found:', {
        email: googleUser.email,
        role
      });
      return c.json({
        success: false,
        error: 'Forbidden',
        message: `您的邮箱没有${getRoleDisplayName(role)}权限，请联系超级管理员`
      }, 403);
    }

    // 3. 准备会话数据
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天有效期

    console.log('[EMAIL_ROLE_AUTH] 🔐 Creating login session...');
    console.log('[EMAIL_ROLE_AUTH] 📋 2FA status:', {
      enabled: emailWhitelist.two_factor_enabled,
      email: googleUser.email
    });

    // 4. 更新最后登录时间
    await db.execute(`
      UPDATE email_whitelist
      SET last_login_at = ?
      WHERE email = ?
    `, [now, googleUser.email]);

    await db.execute(`
      UPDATE role_accounts
      SET last_login_at = ?
      WHERE id = ?
    `, [now, roleAccount.id]);

    // 5. 创建登录会话
    // ✅ 无论是否启用2FA，都创建有效会话（让用户先登录）
    // 如果启用了2FA，标记会话需要验证（但不阻止登录）

    await db.execute(`
      INSERT INTO login_sessions (
        session_id, email, role, account_id, login_method,
        ip_address, user_agent, created_at, expires_at, is_active, requires_2fa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      googleUser.email,
      role,
      roleAccount.id,
      'google_oauth',
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      now,
      expiresAt,
      1, // ✅ 会话立即激活
      emailWhitelist.two_factor_enabled ? 1 : 0 // 标记是否需要2FA（但不阻止登录）
    ]);

    console.log('[EMAIL_ROLE_AUTH] ✅ Login session created:', {
      sessionId,
      email: googleUser.email,
      role,
      requires2FA: emailWhitelist.two_factor_enabled
    });

    // 6. 记录登录尝试
    await db.execute(`
      INSERT INTO login_attempts (
        email, role, ip_address, user_agent, success, login_method, attempted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      googleUser.email,
      role,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      1,
      'google_oauth',
      now
    ]);

    // 7. 返回登录成功信息
    // ✅ 始终返回成功，如果启用了2FA，前端可以根据 requires2FA 标志显示提示
    return c.json({
      success: true,
      data: {
        user: {
          accountId: roleAccount.id,
          email: roleAccount.email,
          role: roleAccount.role,
          username: roleAccount.username,
          displayName: roleAccount.display_name,
          permissions: JSON.parse(roleAccount.permissions || '[]'),
          googleLinked: true,
          requires2FA: emailWhitelist.two_factor_enabled // ✅ 告诉前端是否需要2FA（但不阻止登录）
        },
        session: {
          sessionId,
          expiresAt,
          requires2FA: emailWhitelist.two_factor_enabled
        }
      },
      message: emailWhitelist.two_factor_enabled
        ? `欢迎，${roleAccount.display_name}！您的账户已启用2FA，访问敏感操作时需要验证。`
        : `欢迎，${roleAccount.display_name}！`
    });

  } catch (error: any) {
    console.error('[EMAIL_ROLE_AUTH] ❌ OAuth callback error:', error);
    console.error('[EMAIL_ROLE_AUTH] ❌ Error stack:', error.stack);
    console.error('[EMAIL_ROLE_AUTH] ❌ Error message:', error.message);

    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Google登录失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});

/**
 * 验证会话
 */
emailRoleAuth.post('/verify-session', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少会话ID'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 查找会话
    const session = await db.queryFirst(`
      SELECT ls.*, ra.email, ra.role, ra.username, ra.display_name, ra.permissions
      FROM login_sessions ls
      JOIN role_accounts ra ON ls.account_id = ra.id
      WHERE ls.session_id = ? AND ls.is_active = 1 AND ls.expires_at > ?
    `, [sessionId, now]);

    if (!session) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '会话无效或已过期'
      }, 401);
    }

    // 返回用户信息
    return c.json({
      success: true,
      data: {
        user: {
          accountId: session.account_id,
          email: session.email,
          role: session.role,
          username: session.username,
          displayName: session.display_name,
          permissions: JSON.parse(session.permissions || '[]'),
          googleLinked: true
        },
        session: {
          sessionId: session.session_id,
          expiresAt: session.expires_at
        }
      },
      message: '会话验证成功'
    });

  } catch (error: any) {
    console.error('Session verification error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '会话验证失败'
    }, 500);
  }
});

/**
 * 获取邮箱的所有角色账号
 */
emailRoleAuth.get('/accounts/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = createDatabaseService(c.env as Env);

    // 检查邮箱是否在白名单中
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email, is_active
      FROM email_whitelist
      WHERE email = ?
    `, [email]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '邮箱不存在'
      }, 404);
    }

    // 获取该邮箱的所有角色账号
    const accounts = await db.query(`
      SELECT id, email, role, username, display_name, permissions, 
             allow_password_login, is_active, created_at, last_login_at
      FROM role_accounts
      WHERE email = ?
      ORDER BY 
        CASE role
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'reviewer' THEN 3
        END
    `, [email]);

    return c.json({
      success: true,
      data: {
        email: emailWhitelist.email,
        isActive: emailWhitelist.is_active,
        accounts: accounts.map((acc: any) => ({
          id: acc.id,
          role: acc.role,
          username: acc.username,
          displayName: acc.display_name,
          permissions: JSON.parse(acc.permissions || '[]'),
          allowPasswordLogin: acc.allow_password_login,
          isActive: acc.is_active,
          createdAt: acc.created_at,
          lastLoginAt: acc.last_login_at
        }))
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
 * 验证 2FA 代码并完成登录
 */
emailRoleAuth.post('/verify-2fa', async (c) => {
  try {
    const body = await c.req.json();
    const { tempSessionId, code, useBackupCode } = body;

    if (!tempSessionId || !code) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const now = new Date().toISOString();

    // 1. 查找临时会话
    const tempSession = await db.queryFirst(`
      SELECT session_id, email, role, account_id, requires_2fa, expires_at
      FROM login_sessions
      WHERE session_id = ? AND requires_2fa = 1 AND is_active = 0
    `, [tempSessionId]);

    if (!tempSession) {
      return c.json({
        success: false,
        error: 'Invalid Session',
        message: '会话不存在或已过期'
      }, 404);
    }

    // 2. 检查会话是否过期
    if (new Date(tempSession.expires_at) < new Date()) {
      await db.execute(`
        DELETE FROM login_sessions WHERE session_id = ?
      `, [tempSessionId]);

      return c.json({
        success: false,
        error: 'Session Expired',
        message: '会话已过期，请重新登录'
      }, 401);
    }

    // 3. 获取邮箱的 2FA 设置
    const emailWhitelist = await db.queryFirst(`
      SELECT email, two_factor_enabled, two_factor_secret
      FROM email_whitelist
      WHERE email = ?
    `, [tempSession.email]);

    if (!emailWhitelist || !emailWhitelist.two_factor_enabled) {
      return c.json({
        success: false,
        error: 'Invalid Configuration',
        message: '2FA 未启用'
      }, 400);
    }

    // 4. 验证 2FA 代码
    let isValid = false;

    if (useBackupCode) {
      // 验证备用代码
      const { verifyBackupCode } = await import('../utils/totp');

      // 查询所有未使用的备用代码
      const backupCodes = await db.query(`
        SELECT id, code_hash FROM two_factor_backup_codes
        WHERE email = ? AND is_used = 0
      `, [tempSession.email]);

      // 逐个验证
      for (const backupCode of backupCodes) {
        if (await verifyBackupCode(code, backupCode.code_hash)) {
          isValid = true;

          // 标记备用代码为已使用
          await db.execute(`
            UPDATE two_factor_backup_codes
            SET is_used = 1, used_at = ?
            WHERE id = ?
          `, [now, backupCode.id]);

          break;
        }
      }
    } else {
      // 验证 TOTP 代码
      isValid = await verifyTOTPCode(code, emailWhitelist.two_factor_secret);
    }

    // 5. 记录验证尝试
    await db.execute(`
      INSERT INTO two_factor_verifications (
        email, method_used, is_successful, failure_reason,
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      tempSession.email,
      useBackupCode ? 'backup_code' : 'totp',
      isValid ? 1 : 0,
      isValid ? null : '验证码错误',
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      now
    ]);

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Invalid Code',
        message: '验证码错误，请重试'
      }, 401);
    }

    // 6. 验证成功，激活会话
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时

    await db.execute(`
      INSERT INTO login_sessions (
        session_id, email, role, account_id, login_method,
        ip_address, user_agent, created_at, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      tempSession.email,
      tempSession.role,
      tempSession.account_id,
      'google_oauth_2fa',
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown',
      now,
      expiresAt,
      1
    ]);

    // 7. 删除临时会话
    await db.execute(`
      DELETE FROM login_sessions WHERE session_id = ?
    `, [tempSessionId]);

    // 8. 更新最后登录时间
    await db.execute(`
      UPDATE email_whitelist SET last_login_at = ? WHERE email = ?
    `, [now, tempSession.email]);

    await db.execute(`
      UPDATE role_accounts SET last_login_at = ? WHERE id = ?
    `, [now, tempSession.account_id]);

    // 9. 生成 JWT token
    const token = await generateJWTToken({
      email: tempSession.email,
      role: tempSession.role,
      sessionId: sessionId
    }, c.env as Env);

    return c.json({
      success: true,
      data: {
        token,
        sessionId,
        email: tempSession.email,
        role: tempSession.role
      },
      message: '登录成功'
    });

  } catch (error: any) {
    console.error('[EMAIL_ROLE_AUTH] Verify 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '验证失败，请稍后重试'
    }, 500);
  }
});

// ============================================
// 辅助函数
// ============================================

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'reviewer': '审核员',
    'admin': '管理员',
    'super_admin': '超级管理员'
  };
  return roleNames[role] || role;
}

/**
 * 验证 TOTP 代码
 */
async function verifyTOTPCode(code: string, secret: string): Promise<boolean> {
  // 导入 TOTP 验证函数
  const { verifyTOTP } = await import('../utils/totp');

  // 验证代码（允许前后1个时间窗口，即前后30秒）
  return await verifyTOTP(code, secret, 1, 30);
}

/**
 * 生成 JWT Token
 */
async function generateJWTToken(payload: any, env: Env): Promise<string> {
  const jwtSecret = env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24小时
  }));
  const signature = btoa(`${header}.${payloadStr}.${jwtSecret}`);

  return `${header}.${payloadStr}.${signature}`;
}

export default emailRoleAuth;


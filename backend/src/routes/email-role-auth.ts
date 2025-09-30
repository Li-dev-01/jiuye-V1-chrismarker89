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
    const body = await c.req.json();
    const { code, redirectUri, role } = body; // role是用户选择的角色

    if (!code || !role) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
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

    // 获取Google Client Secret
    const clientSecret = GOOGLE_CLIENT_SECRET(c.env as Env);
    if (!clientSecret) {
      console.error('[EMAIL_ROLE_AUTH] Google Client Secret not configured');
      return c.json({
        success: false,
        error: 'Configuration Error',
        message: 'Google OAuth配置不完整'
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
    const emailWhitelist = await db.queryFirst(`
      SELECT id, email, is_active, two_factor_enabled
      FROM email_whitelist
      WHERE email = ? AND is_active = 1
    `, [googleUser.email]);

    if (!emailWhitelist) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '您的邮箱不在白名单中，请联系超级管理员'
      }, 403);
    }

    // 2. 检查该邮箱是否有对应角色的账号
    const roleAccount = await db.queryFirst(`
      SELECT id, email, role, username, display_name, permissions, is_active
      FROM role_accounts
      WHERE email = ? AND role = ? AND is_active = 1
    `, [googleUser.email, role]);

    if (!roleAccount) {
      return c.json({
        success: false,
        error: 'Forbidden',
        message: `您的邮箱没有${getRoleDisplayName(role)}权限，请联系超级管理员`
      }, 403);
    }

    // 3. 更新最后登录时间
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

    // 4. 创建登录会话
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时

    await db.execute(`
      INSERT INTO login_sessions (
        session_id, email, role, account_id, login_method,
        ip_address, user_agent, created_at, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      1
    ]);

    // 5. 记录登录尝试
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

    // 6. 返回登录成功信息
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
          googleLinked: true
        },
        session: {
          sessionId,
          expiresAt
        }
      },
      message: `欢迎，${roleAccount.display_name}！`
    });

  } catch (error: any) {
    console.error('Email-Role OAuth callback error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Google登录失败，请稍后重试'
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

export default emailRoleAuth;


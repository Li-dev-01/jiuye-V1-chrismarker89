// 简化认证路由 - 专为reviewer-admin-dashboard设计
import { Hono } from 'hono';
import type { Env } from '../types/api';
import { successResponse, errorResponse, jsonResponse } from '../utils/response';

const simpleAuth = new Hono<{ Bindings: Env }>();

// 简化的用户数据库（生产环境应该使用真实数据库）
const SIMPLE_USERS = {
  // 审核员
  'reviewerA': {
    id: 'reviewer_001',
    username: 'reviewerA',
    password: 'admin123', // 生产环境应该使用哈希密码
    role: 'reviewer',
    name: '审核员A',
    permissions: ['review_content', 'view_dashboard']
  },
  'reviewerB': {
    id: 'reviewer_002',
    username: 'reviewerB',
    password: 'admin123',
    role: 'reviewer',
    name: '审核员B',
    permissions: ['review_content', 'view_dashboard']
  },
  
  // 管理员
  'admin': {
    id: 'admin_001',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: '管理员',
    permissions: ['review_content', 'view_dashboard', 'manage_users', 'view_analytics']
  },
  'admin1': {
    id: 'admin_002',
    username: 'admin1',
    password: 'admin123',
    role: 'admin',
    name: '管理员1',
    permissions: ['review_content', 'view_dashboard', 'manage_users', 'view_analytics']
  },
  
  // 超级管理员
  'superadmin': {
    id: 'super_admin_001',
    username: 'superadmin',
    password: 'admin123',
    role: 'super_admin',
    name: '超级管理员',
    permissions: ['review_content', 'view_dashboard', 'manage_users', 'view_analytics', 'system_admin']
  }
};

// 简化的JWT签名密钥（生产环境应该使用环境变量）
const JWT_SECRET = 'simple_auth_secret_key_2024';

// 超简化的Token系统 - 避免复杂的JWT实现
function createSimpleToken(payload: any): string {
  const tokenData = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期（毫秒）
  };

  // 简单的base64编码 + 签名
  const dataStr = JSON.stringify(tokenData);
  const encodedData = Buffer.from(dataStr).toString('base64url');
  const signature = Buffer.from(`${encodedData}.${JWT_SECRET}`).toString('base64url');

  return `${encodedData}.${signature}`;
}

function verifySimpleToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid token format');
    }

    const [encodedData, signature] = parts;

    // 验证签名
    const expectedSignature = Buffer.from(`${encodedData}.${JWT_SECRET}`).toString('base64url');
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // 解析数据
    const dataStr = Buffer.from(encodedData, 'base64url').toString();
    const tokenData = JSON.parse(dataStr);

    // 检查过期时间
    if (tokenData.exp && tokenData.exp < Date.now()) {
      throw new Error('Token expired');
    }

    return tokenData;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// 简化登录端点
simpleAuth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, userType } = body;

    console.log(`[SIMPLE_AUTH] Login attempt: ${username}, userType: ${userType}`);

    // 验证必需字段
    if (!username || !password) {
      return jsonResponse(errorResponse('用户名和密码不能为空', 400));
    }

    // 查找用户
    const user = SIMPLE_USERS[username];
    if (!user) {
      console.log(`[SIMPLE_AUTH] User not found: ${username}`);
      return jsonResponse(errorResponse('用户名或密码错误', 401));
    }

    // 验证密码
    if (user.password !== password) {
      console.log(`[SIMPLE_AUTH] Invalid password for user: ${username}`);
      return jsonResponse(errorResponse('用户名或密码错误', 401));
    }

    // 验证用户类型（如果指定）
    if (userType && user.role !== userType) {
      console.log(`[SIMPLE_AUTH] Role mismatch: expected ${userType}, got ${user.role}`);
      return jsonResponse(errorResponse('用户角色不匹配', 403));
    }

    // 创建简化token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      permissions: user.permissions
    };

    const token = createSimpleToken(tokenPayload);

    console.log(`[SIMPLE_AUTH] Login successful: ${username}, role: ${user.role}`);

    // 返回成功响应
    return jsonResponse(successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        userType: user.role, // 兼容前端
        name: user.name,
        permissions: user.permissions
      }
    }, '登录成功'));

  } catch (error: any) {
    console.error('[SIMPLE_AUTH] Login error:', error);
    return jsonResponse(errorResponse('登录失败，请稍后重试', 500));
  }
});

// 简化验证端点
simpleAuth.post('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(errorResponse('缺少认证token', 401));
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    console.log(`[SIMPLE_AUTH] Verifying token: ${token.substring(0, 20)}...`);

    // 检查是否为新的 sessionId 格式（以 "session_" 开头）
    if (token.startsWith('session_')) {
      console.log(`[SIMPLE_AUTH] Detected sessionId format, using email-role auth verification`);

      const db = createDatabaseService(c.env as Env);
      const now = new Date().toISOString();

      // 查找会话
      const session = await db.queryFirst(`
        SELECT ls.*, ra.email, ra.role, ra.username, ra.display_name, ra.permissions
        FROM login_sessions ls
        JOIN role_accounts ra ON ls.account_id = ra.id
        WHERE ls.session_id = ? AND ls.is_active = 1 AND ls.expires_at > ?
      `, [token, now]);

      if (!session) {
        console.error('[SIMPLE_AUTH] Session not found or expired');
        return jsonResponse(errorResponse('会话无效或已过期', 401));
      }

      console.log(`[SIMPLE_AUTH] Session verification successful: ${session.username}`);

      // 返回用户信息
      return jsonResponse(successResponse({
        user: {
          id: session.account_id,
          accountId: session.account_id,
          username: session.username,
          role: session.role,
          userType: session.role, // 兼容前端
          name: session.display_name,
          displayName: session.display_name,
          email: session.email,
          permissions: JSON.parse(session.permissions || '[]')
        }
      }, '验证成功'));
    }

    // 旧的 JWT token 验证逻辑
    const payload = verifySimpleToken(token);

    console.log(`[SIMPLE_AUTH] Token verification successful: ${payload.username}`);

    // 返回用户信息
    return jsonResponse(successResponse({
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        userType: payload.role, // 兼容前端
        name: payload.name,
        permissions: payload.permissions
      }
    }, '验证成功'));

  } catch (error: any) {
    console.error('[SIMPLE_AUTH] Verification error:', error);
    return jsonResponse(errorResponse('token验证失败', 401));
  }
});

// 获取当前用户信息
simpleAuth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(errorResponse('缺少认证token', 401));
    }

    const token = authHeader.substring(7);

    // 检查是否为新的 sessionId 格式
    if (token.startsWith('session_')) {
      console.log(`[SIMPLE_AUTH] /me - Detected sessionId format`);

      const db = createDatabaseService(c.env as Env);
      const now = new Date().toISOString();

      // 查找会话
      const session = await db.queryFirst(`
        SELECT ls.*, ra.email, ra.role, ra.username, ra.display_name, ra.permissions
        FROM login_sessions ls
        JOIN role_accounts ra ON ls.account_id = ra.id
        WHERE ls.session_id = ? AND ls.is_active = 1 AND ls.expires_at > ?
      `, [token, now]);

      if (!session) {
        console.error('[SIMPLE_AUTH] /me - Session not found or expired');
        return jsonResponse(errorResponse('会话无效或已过期', 401));
      }

      return jsonResponse(successResponse({
        user: {
          id: session.account_id,
          accountId: session.account_id,
          username: session.username,
          role: session.role,
          userType: session.role,
          name: session.display_name,
          displayName: session.display_name,
          email: session.email,
          permissions: JSON.parse(session.permissions || '[]')
        }
      }, '获取用户信息成功'));
    }

    // 旧的 JWT token 验证逻辑
    const payload = verifySimpleToken(token);

    return jsonResponse(successResponse({
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        userType: payload.role,
        name: payload.name,
        permissions: payload.permissions
      }
    }, '获取用户信息成功'));

  } catch (error: any) {
    console.error('[SIMPLE_AUTH] Get user info error:', error);
    return jsonResponse(errorResponse('获取用户信息失败', 401));
  }
});

export default simpleAuth;

// 简化认证中间件 - 专为reviewer-admin-dashboard设计
import type { Context, Next } from 'hono';
import type { Env } from '../types/api';
// 移除不需要的导入

// 简化的JWT验证函数（与simpleAuth.ts保持一致）
const JWT_SECRET = 'simple_auth_secret_key_2024';

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

// 角色权限层级定义
const ROLE_HIERARCHY = {
  'reviewer': 1,
  'admin': 2,
  'super_admin': 3
};

// 简化认证中间件
export async function simpleAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[SIMPLE_AUTH_MIDDLEWARE] Missing or invalid Authorization header');
      return c.json({ success: false, message: '缺少认证token' }, 401);
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    console.log(`[SIMPLE_AUTH_MIDDLEWARE] Verifying token: ${token.substring(0, 20)}...`);

    // 检查是否为新的 sessionId 格式（以 "session_" 开头）
    if (token.startsWith('session_')) {
      console.log(`[SIMPLE_AUTH_MIDDLEWARE] Detected sessionId format, using email-role auth verification`);

      const db = c.env.DB;
      const now = new Date().toISOString();

      // 查找会话
      const session = await db.prepare(`
        SELECT ls.*, ra.email, ra.role, ra.username, ra.display_name, ra.permissions
        FROM login_sessions ls
        JOIN role_accounts ra ON ls.account_id = ra.id
        WHERE ls.session_id = ? AND ls.is_active = 1 AND ls.expires_at > ?
      `).bind(token, now).first();

      if (!session) {
        console.error('[SIMPLE_AUTH_MIDDLEWARE] Session not found or expired');
        return c.json({ success: false, message: '会话无效或已过期' }, 401);
      }

      console.log(`[SIMPLE_AUTH_MIDDLEWARE] Session verification successful: ${session.username}, role: ${session.role}`);

      // 将用户信息添加到上下文
      c.set('user', {
        id: session.account_id,
        accountId: session.account_id,
        username: session.username,
        role: session.role,
        name: session.display_name,
        displayName: session.display_name,
        email: session.email,
        permissions: JSON.parse(session.permissions || '[]')
      });

      return next();
    }

    // 旧的 JWT token 验证逻辑
    const payload = verifySimpleToken(token);

    console.log(`[SIMPLE_AUTH_MIDDLEWARE] Token verification successful: ${payload.username}, role: ${payload.role}`);

    // 将用户信息添加到上下文
    c.set('user', {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
      name: payload.name,
      permissions: payload.permissions
    });

    return next();

  } catch (error: any) {
    console.error('[SIMPLE_AUTH_MIDDLEWARE] Authentication failed:', error.message);
    return c.json({ success: false, message: '认证失败' }, 401);
  }
}

// 角色权限验证中间件
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        console.log('[SIMPLE_AUTH_MIDDLEWARE] No user in context');
        return c.json({ success: false, message: '用户信息缺失' }, 401);
      }

      const userRole = user.role;
      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

      // 检查用户角色是否在允许的角色列表中，或者用户角色等级是否足够高
      const hasPermission = allowedRoles.some(role => {
        const requiredLevel = ROLE_HIERARCHY[role] || 0;
        return userRole === role || userRoleLevel >= requiredLevel;
      });

      if (!hasPermission) {
        console.log(`[SIMPLE_AUTH_MIDDLEWARE] Access denied: user role ${userRole}, required roles: ${allowedRoles.join(', ')}`);
        return c.json({ success: false, message: '权限不足' }, 403);
      }

      console.log(`[SIMPLE_AUTH_MIDDLEWARE] Access granted: user role ${userRole}`);
      return next();

    } catch (error: any) {
      console.error('[SIMPLE_AUTH_MIDDLEWARE] Role check failed:', error.message);
      return c.json({ success: false, message: '权限验证失败' }, 500);
    }
  };
}

// 权限验证中间件
export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json({ success: false, message: '用户信息缺失' }, 401);
      }

      const userPermissions = user.permissions || [];

      // 检查用户是否拥有所需权限
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        console.log(`[SIMPLE_AUTH_MIDDLEWARE] Permission denied: user permissions ${userPermissions.join(', ')}, required: ${requiredPermissions.join(', ')}`);
        return c.json({ success: false, message: '权限不足' }, 403);
      }

      console.log(`[SIMPLE_AUTH_MIDDLEWARE] Permission granted: ${requiredPermissions.join(', ')}`);
      return next();

    } catch (error: any) {
      console.error('[SIMPLE_AUTH_MIDDLEWARE] Permission check failed:', error.message);
      return c.json({ success: false, message: '权限验证失败' }, 500);
    }
  };
}

// 可选认证中间件（允许匿名访问，但如果有token则验证）
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        // 检查是否为新的 sessionId 格式
        if (token.startsWith('session_')) {
          const db = c.env.DB;
          const now = new Date().toISOString();

          const session = await db.prepare(`
            SELECT ls.*, ra.email, ra.role, ra.username, ra.display_name, ra.permissions
            FROM login_sessions ls
            JOIN role_accounts ra ON ls.account_id = ra.id
            WHERE ls.session_id = ? AND ls.is_active = 1 AND ls.expires_at > ?
          `).bind(token, now).first();

          if (session) {
            c.set('user', {
              id: session.account_id,
              accountId: session.account_id,
              username: session.username,
              role: session.role,
              name: session.display_name,
              displayName: session.display_name,
              email: session.email,
              permissions: JSON.parse(session.permissions || '[]')
            });
            console.log(`[SIMPLE_AUTH_MIDDLEWARE] Optional auth successful (session): ${session.username}`);
          }
        } else {
          // 旧的 JWT token 验证
          const payload = verifySimpleToken(token);
          c.set('user', {
            id: payload.userId,
            username: payload.username,
            role: payload.role,
            name: payload.name,
            permissions: payload.permissions
          });
          console.log(`[SIMPLE_AUTH_MIDDLEWARE] Optional auth successful: ${payload.username}`);
        }
      } catch (error) {
        console.log(`[SIMPLE_AUTH_MIDDLEWARE] Optional auth failed, continuing as anonymous: ${error.message}`);
      }
    }

    return next();

  } catch (error: any) {
    console.error('[SIMPLE_AUTH_MIDDLEWARE] Optional auth middleware error:', error.message);
    return next(); // 继续执行，允许匿名访问
  }
}

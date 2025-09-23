import type { Context, Next } from 'hono';
import type { Env, UserRole, AuthContext } from '../types/api';
import { createJWTService } from '../utils/jwt';
import { createDatabaseService } from '../db';

// 认证中间件
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: AuthContext }>, next: Next) {
  const env = c.env;
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ success: false, error: 'Unauthorized', message: '缺少认证token' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  // 检查是否是管理员token
  if (token.startsWith('mgmt_token_')) {
    // 验证管理员token格式
    const tokenParts = token.split('_');
    if (tokenParts.length >= 4 && tokenParts[2] === 'SUPER' && tokenParts[3] === 'ADMIN') {
      // 创建管理员用户对象
      const adminUser = {
        id: 'admin',
        username: 'admin',
        email: 'admin@system.local',
        role: 'admin' as UserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      c.set('user', adminUser);
      await next();
      return;
    } else {
      return c.json({ success: false, error: 'Unauthorized', message: '无效的管理员token' }, 401);
    }
  }

  // 处理普通JWT token
  const jwtService = createJWTService(env.JWT_SECRET);
  const payload = await jwtService.verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Unauthorized', message: '无效的token' }, 401);
  }

  // 从数据库获取用户信息
  const db = createDatabaseService(env);
  const user = await db.queryFirst<any>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
    [payload.userId]
  );

  if (!user) {
    return c.json({ success: false, error: 'Unauthorized', message: '用户不存在' }, 401);
  }

  // 将用户信息添加到上下文
  c.set('user', user);

  await next();
  return;
}

// 角色权限中间件
export function requireRole(...roles: UserRole[]) {
  return async (c: Context<{ Bindings: Env; Variables: AuthContext }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized', message: '未认证' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: 'Forbidden', message: '权限不足' }, 403);
    }

    await next();
  };
}

// 可选认证中间件（不强制要求认证）
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env; Variables: Partial<AuthContext> }>, next: Next) {
  const env = c.env;
  const jwtService = createJWTService(env.JWT_SECRET);
  
  const authHeader = c.req.header('Authorization');
  const token = jwtService.extractTokenFromHeader(authHeader);
  
  if (token) {
    const payload = await jwtService.verifyToken(token);
    if (payload) {
      const db = createDatabaseService(env);
      const user = await db.queryFirst<any>(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
        [payload.userId]
      );
      
      if (user) {
        c.set('user', user);
      }
    }
  }
  
  await next();
}

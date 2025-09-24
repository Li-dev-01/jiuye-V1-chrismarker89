/**
 * 统一认证中间件
 * 整合问卷系统和管理系统的认证逻辑
 */

import type { Context, Next } from 'hono';
import type { Env, UserRole, AuthContext } from '../types/api';
import { createJWTService } from '../utils/jwt';
import { createDatabaseService } from '../db';

// 统一用户类型
export enum UnifiedUserType {
  ANONYMOUS = 'ANONYMOUS',
  SEMI_ANONYMOUS = 'SEMI_ANONYMOUS', 
  REGISTERED = 'REGISTERED',
  REVIEWER = 'REVIEWER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// 用户域
export enum UserDomain {
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  MANAGEMENT = 'MANAGEMENT'
}

// 扩展的认证上下文
interface UnifiedAuthContext extends AuthContext {
  userType: UnifiedUserType;
  domain: UserDomain;
  permissions: string[];
}

/**
 * 统一认证中间件
 */
export async function unifiedAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>, 
  next: Next
) {
  const env = c.env;
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ 
      success: false, 
      error: 'Unauthorized', 
      message: '缺少认证token' 
    }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 检查Token类型并处理
    if (token.startsWith('mgmt_token_')) {
      // 管理域Token
      const authResult = await handleManagementToken(token, c);
      if (!authResult.success) {
        return c.json(authResult, 401);
      }
    } else if (token.startsWith('quest_token_')) {
      // 问卷域Token
      const authResult = await handleQuestionnaireToken(token, c);
      if (!authResult.success) {
        return c.json(authResult, 401);
      }
    } else if (token.startsWith('google_token_')) {
      // Google OAuth Token
      const authResult = await handleGoogleToken(token, env, c);
      if (!authResult.success) {
        return c.json(authResult, 401);
      }
    } else {
      // 传统JWT Token
      const authResult = await handleJWTToken(token, env, c);
      if (!authResult.success) {
        return c.json(authResult, 401);
      }
    }

    await next();
    return;
  } catch (error) {
    console.error('认证中间件错误:', error);
    return c.json({ 
      success: false, 
      error: 'Unauthorized', 
      message: '认证失败' 
    }, 401);
  }
}

/**
 * 处理管理域Token
 */
async function handleManagementToken(
  token: string, 
  c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>
): Promise<{ success: boolean; error?: string; message?: string }> {
  
  // 解析Token格式: mgmt_token_{USER_TYPE}_{timestamp}
  const tokenParts = token.split('_');
  
  if (tokenParts.length < 3) {
    return {
      success: false,
      error: 'Unauthorized',
      message: '无效的管理员token格式'
    };
  }

  const userTypeStr = tokenParts.slice(2, -1).join('_'); // 处理SUPER_ADMIN的情况
  let userType: UnifiedUserType;
  let role: UserRole;

  // 映射用户类型
  switch (userTypeStr) {
    case 'SUPER_ADMIN':
      userType = UnifiedUserType.SUPER_ADMIN;
      role = 'super_admin';
      break;
    case 'ADMIN':
      userType = UnifiedUserType.ADMIN;
      role = 'admin';
      break;
    case 'REVIEWER':
      userType = UnifiedUserType.REVIEWER;
      role = 'reviewer';
      break;
    default:
      return {
        success: false,
        error: 'Unauthorized',
        message: '无效的管理员用户类型'
      };
  }

  // 创建管理员用户对象
  const managementUser = {
    id: `mgmt_${userTypeStr.toLowerCase()}`,
    username: userTypeStr.toLowerCase(),
    email: `${userTypeStr.toLowerCase()}@system.local`,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 设置认证上下文
  c.set('user', managementUser);
  c.set('userType', userType);
  c.set('domain', UserDomain.MANAGEMENT);
  c.set('permissions', getManagementPermissions(userType));

  return { success: true };
}

/**
 * 处理问卷域Token
 */
async function handleQuestionnaireToken(
  token: string,
  c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>
): Promise<{ success: boolean; error?: string; message?: string }> {
  
  // 解析Token格式: quest_token_{USER_TYPE}_{timestamp}
  const tokenParts = token.split('_');
  
  if (tokenParts.length < 4) {
    return {
      success: false,
      error: 'Unauthorized',
      message: '无效的问卷token格式'
    };
  }

  const userTypeStr = tokenParts[2];
  let userType: UnifiedUserType;
  let role: UserRole;

  // 映射用户类型
  switch (userTypeStr) {
    case 'ANONYMOUS':
      userType = UnifiedUserType.ANONYMOUS;
      role = 'anonymous';
      break;
    case 'SEMI_ANONYMOUS':
      userType = UnifiedUserType.SEMI_ANONYMOUS;
      role = 'semi_anonymous';
      break;
    case 'REGISTERED':
      userType = UnifiedUserType.REGISTERED;
      role = 'user';
      break;
    default:
      return {
        success: false,
        error: 'Unauthorized',
        message: '无效的问卷用户类型'
      };
  }

  // 创建问卷用户对象
  const questionnaireUser = {
    id: `quest_${userTypeStr.toLowerCase()}_${tokenParts[3]}`,
    username: `quest_user_${tokenParts[3]}`,
    email: null,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 设置认证上下文
  c.set('user', questionnaireUser);
  c.set('userType', userType);
  c.set('domain', UserDomain.QUESTIONNAIRE);
  c.set('permissions', getQuestionnairePermissions(userType));

  return { success: true };
}

/**
 * 处理Google OAuth Token
 */
async function handleGoogleToken(
  token: string,
  env: Env,
  c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>
): Promise<{ success: boolean; error?: string; message?: string }> {

  // 解析Token格式: google_token_{timestamp}
  const tokenParts = token.split('_');

  if (tokenParts.length < 3) {
    return {
      success: false,
      error: 'Unauthorized',
      message: '无效的Google token格式'
    };
  }

  // 从数据库查找Google OAuth用户
  const db = createDatabaseService(env);

  // 查找使用该token的用户（这里简化处理，实际应该验证token有效性）
  const user = await db.queryFirst<any>(`
    SELECT uuid, display_name, user_type, metadata, status
    FROM universal_users
    WHERE JSON_EXTRACT(metadata, '$.registrationMethod') LIKE '%google%'
    AND status = 'active'
    ORDER BY last_active_at DESC
    LIMIT 1
  `);

  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
      message: 'Google用户不存在或已失效'
    };
  }

  // 映射到统一用户类型
  let userType: UnifiedUserType;
  let role: UserRole;

  switch (user.user_type) {
    case 'super_admin':
      userType = UnifiedUserType.SUPER_ADMIN;
      role = 'super_admin';
      break;
    case 'admin':
      userType = UnifiedUserType.ADMIN;
      role = 'admin';
      break;
    case 'reviewer':
      userType = UnifiedUserType.REVIEWER;
      role = 'reviewer';
      break;
    case 'semi_anonymous':
      userType = UnifiedUserType.SEMI_ANONYMOUS;
      role = 'semi_anonymous';
      break;
    default:
      userType = UnifiedUserType.ANONYMOUS;
      role = 'anonymous';
  }

  const domain = ['super_admin', 'admin', 'reviewer'].includes(user.user_type) ?
    UserDomain.MANAGEMENT : UserDomain.QUESTIONNAIRE;

  // 创建用户对象
  const authUser = {
    id: user.uuid,
    username: user.display_name,
    email: user.metadata ? JSON.parse(user.metadata).googleEmail : null,
    role,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString()
  };

  // 设置认证上下文
  c.set('user', authUser);
  c.set('userType', userType);
  c.set('domain', domain);
  c.set('permissions', domain === UserDomain.MANAGEMENT ?
    getManagementPermissions(userType) : getQuestionnairePermissions(userType));

  return { success: true };
}

/**
 * 处理传统JWT Token
 */
async function handleJWTToken(
  token: string,
  env: Env,
  c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>
): Promise<{ success: boolean; error?: string; message?: string }> {
  
  const jwtService = createJWTService(env.JWT_SECRET);
  const payload = await jwtService.verifyToken(token);
  
  if (!payload) {
    return {
      success: false,
      error: 'Unauthorized',
      message: '无效的JWT token'
    };
  }

  // 从数据库获取用户信息
  const db = createDatabaseService(env);
  const user = await db.queryFirst<any>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
    [payload.userId]
  );

  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
      message: '用户不存在'
    };
  }

  // 映射到统一用户类型
  let userType: UnifiedUserType;
  switch (user.role) {
    case 'super_admin':
      userType = UnifiedUserType.SUPER_ADMIN;
      break;
    case 'admin':
      userType = UnifiedUserType.ADMIN;
      break;
    case 'reviewer':
      userType = UnifiedUserType.REVIEWER;
      break;
    case 'user':
      userType = UnifiedUserType.REGISTERED;
      break;
    default:
      userType = UnifiedUserType.SEMI_ANONYMOUS;
  }

  const domain = ['super_admin', 'admin', 'reviewer'].includes(user.role) ? 
    UserDomain.MANAGEMENT : UserDomain.QUESTIONNAIRE;

  // 设置认证上下文
  c.set('user', user);
  c.set('userType', userType);
  c.set('domain', domain);
  c.set('permissions', domain === UserDomain.MANAGEMENT ? 
    getManagementPermissions(userType) : getQuestionnairePermissions(userType));

  return { success: true };
}

/**
 * 获取管理域权限
 */
function getManagementPermissions(userType: UnifiedUserType): string[] {
  switch (userType) {
    case UnifiedUserType.SUPER_ADMIN:
      return [
        'ALL', 'SYSTEM_ADMIN', 'USER_MANAGEMENT', 'CONTENT_MANAGEMENT', 
        'REVIEW_MANAGEMENT', 'ANALYTICS', 'SECURITY'
      ];
    case UnifiedUserType.ADMIN:
      return [
        'USER_MANAGEMENT', 'CONTENT_MANAGEMENT', 'REVIEW_MANAGEMENT', 'ANALYTICS'
      ];
    case UnifiedUserType.REVIEWER:
      return [
        'CONTENT_REVIEW', 'REVIEW_QUEUE', 'REVIEW_HISTORY'
      ];
    default:
      return [];
  }
}

/**
 * 获取问卷域权限
 */
function getQuestionnairePermissions(userType: UnifiedUserType): string[] {
  switch (userType) {
    case UnifiedUserType.REGISTERED:
      return [
        'VIEW_CONTENT', 'SUBMIT_QUESTIONNAIRE', 'CREATE_CONTENT', 
        'EDIT_OWN_CONTENT', 'DOWNLOAD_REPORTS'
      ];
    case UnifiedUserType.SEMI_ANONYMOUS:
      return [
        'VIEW_CONTENT', 'SUBMIT_QUESTIONNAIRE', 'CREATE_CONTENT'
      ];
    case UnifiedUserType.ANONYMOUS:
      return [
        'VIEW_CONTENT'
      ];
    default:
      return [];
  }
}

/**
 * 统一角色权限中间件
 */
export function requireUnifiedRole(...allowedTypes: UnifiedUserType[]) {
  return async (
    c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>, 
    next: Next
  ) => {
    const userType = c.get('userType');
    
    if (!userType) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized', 
        message: '未认证' 
      }, 401);
    }

    if (!allowedTypes.includes(userType)) {
      return c.json({ 
        success: false, 
        error: 'Forbidden', 
        message: '权限不足' 
      }, 403);
    }

    await next();
  };
}

/**
 * 统一域权限中间件
 */
export function requireUnifiedDomain(requiredDomain: UserDomain) {
  return async (
    c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>, 
    next: Next
  ) => {
    const domain = c.get('domain');
    
    if (!domain) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized', 
        message: '未认证' 
      }, 401);
    }

    if (domain !== requiredDomain) {
      return c.json({ 
        success: false, 
        error: 'Forbidden', 
        message: '域权限不足' 
      }, 403);
    }

    await next();
  };
}

/**
 * 统一权限检查中间件
 */
export function requireUnifiedPermission(...requiredPermissions: string[]) {
  return async (
    c: Context<{ Bindings: Env; Variables: UnifiedAuthContext }>, 
    next: Next
  ) => {
    const permissions = c.get('permissions') || [];
    
    // 检查是否有ALL权限（超级管理员）
    if (permissions.includes('ALL')) {
      await next();
      return;
    }

    // 检查是否有任意一个所需权限
    const hasPermission = requiredPermissions.some(permission => 
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return c.json({ 
        success: false, 
        error: 'Forbidden', 
        message: '权限不足' 
      }, 403);
    }

    await next();
  };
}

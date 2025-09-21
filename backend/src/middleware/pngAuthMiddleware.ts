/**
 * PNG下载权限验证中间件
 * 实现严格的A+B半匿名用户权限控制
 */

import type { Context, Next } from 'hono';
import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  sessionId?: string;
  identityHash?: string;
  authMethod: 'semi_anonymous' | 'jwt' | 'admin' | 'none';
  denialReason?: string;
}

export interface PngAuthContext {
  contentType: 'heart_voice' | 'story';
  contentId: number;
  theme: string;
  userInfo?: {
    userId: string;
    sessionId: string;
    identityHash: string;
    authMethod: string;
  };
}

/**
 * PNG下载权限验证中间件
 */
export function createPngAuthMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: { pngAuth?: PngAuthContext } }>, next: Next) => {
    const startTime = Date.now();
    
    try {
      // 提取请求参数
      const path = c.req.path;
      let contentType: 'heart_voice' | 'story';

      if (path.includes('/stories/')) {
        contentType = 'story';
      } else if (path.includes('/heart-voices/')) {
        contentType = 'heart_voice';
      } else {
        contentType = 'story'; // 默认值
      }

      const contentId = parseInt(c.req.param('id') || '0');
      const theme = c.req.param('theme') || 'gradient';

      // 验证参数
      if (!['heart_voice', 'story'].includes(contentType) || !contentId) {
        await logAuthAttempt(c.env, {
          contentType: contentType || 'unknown',
          contentId: contentId || 0,
          theme,
          authResult: 'denied',
          authMethod: 'none',
          denialReason: '无效的请求参数',
          responseTimeMs: Date.now() - startTime,
          ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
          userAgent: c.req.header('User-Agent') || 'unknown'
        });

        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的请求参数'
        }, 400);
      }

      // 执行权限验证
      const authResult = await validatePngAccess(c, contentType, contentId, theme);

      // 记录验证日志
      await logAuthAttempt(c.env, {
        contentType,
        contentId,
        theme,
        authResult: authResult.isValid ? 'granted' : 'denied',
        authMethod: authResult.authMethod,
        denialReason: authResult.denialReason || undefined,
        responseTimeMs: Date.now() - startTime,
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        identityHash: authResult.identityHash,
        ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown'
      });

      if (!authResult.isValid) {
        return c.json({
          success: false,
          error: 'Forbidden',
          message: authResult.denialReason || '权限不足，需要A+B半匿名用户权限'
        }, 403);
      }

      // 将用户信息添加到上下文
      c.set('pngAuth', {
        contentType,
        contentId,
        theme,
        userInfo: {
          userId: authResult.userId!,
          sessionId: authResult.sessionId!,
          identityHash: authResult.identityHash!,
          authMethod: authResult.authMethod
        }
      } as PngAuthContext);

      await next();

    } catch (error) {
      console.error('PNG权限验证中间件错误:', error);
      
      await logAuthAttempt(c.env, {
        contentType: 'unknown',
        contentId: 0,
        theme: 'unknown',
        authResult: 'error',
        authMethod: 'none',
        denialReason: error instanceof Error ? error.message : '验证过程出错',
        responseTimeMs: Date.now() - startTime,
        ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown'
      });

      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '权限验证失败'
      }, 500);
    }
  };
}

/**
 * 验证PNG访问权限
 */
async function validatePngAccess(
  c: Context<{ Bindings: Env; Variables: { pngAuth?: PngAuthContext } }>,
  contentType: 'heart_voice' | 'story',
  contentId: number,
  theme: string
): Promise<AuthValidationResult> {
  
  // 1. 检查Authorization头部
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return {
      isValid: false,
      authMethod: 'none',
      denialReason: '缺少Authorization头部'
    };
  }

  // 2. 解析Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      authMethod: 'none',
      denialReason: '无效的Authorization格式'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  // 3. 验证A+B半匿名用户token
  const semiAnonymousResult = await validateSemiAnonymousToken(c.env, token);
  if (semiAnonymousResult.isValid) {
    return semiAnonymousResult;
  }

  // 4. 验证JWT token（备用方案）
  const jwtResult = await validateJwtToken(c.env, token);
  if (jwtResult.isValid) {
    return jwtResult;
  }

  // 5. 检查管理员权限（特殊情况）
  const adminResult = await validateAdminToken(c.env, token);
  if (adminResult.isValid) {
    return adminResult;
  }

  return {
    isValid: false,
    authMethod: 'none',
    denialReason: '无效的认证token'
  };
}

/**
 * 验证A+B半匿名用户token
 */
async function validateSemiAnonymousToken(
  env: Env,
  token: string
): Promise<AuthValidationResult> {
  try {
    const db = new DatabaseService(env.DB!);

    // 查找半匿名用户会话
    const session = await db.queryFirst(`
      SELECT 
        session_id,
        user_id,
        identity_a_hash,
        identity_b_hash,
        expires_at,
        is_active
      FROM semi_anonymous_sessions 
      WHERE session_id = ? AND is_active = 1 AND expires_at > datetime('now')
    `, [token]);

    if (!session) {
      return {
        isValid: false,
        authMethod: 'semi_anonymous',
        denialReason: 'A+B半匿名用户会话无效或已过期'
      };
    }

    // 生成身份哈希
    const identityHash = `${session.identity_a_hash}-${session.identity_b_hash}`;

    return {
      isValid: true,
      userId: session.user_id,
      sessionId: session.session_id,
      identityHash,
      authMethod: 'semi_anonymous'
    };

  } catch (error) {
    console.error('验证A+B半匿名用户token失败:', error);
    return {
      isValid: false,
      authMethod: 'semi_anonymous',
      denialReason: '验证A+B半匿名用户身份失败'
    };
  }
}

/**
 * 验证JWT token
 */
async function validateJwtToken(
  env: Env,
  token: string
): Promise<AuthValidationResult> {
  try {
    // 这里应该实现JWT验证逻辑
    // 暂时返回无效
    return {
      isValid: false,
      authMethod: 'jwt',
      denialReason: 'JWT验证暂未实现'
    };
  } catch (error) {
    return {
      isValid: false,
      authMethod: 'jwt',
      denialReason: 'JWT验证失败'
    };
  }
}

/**
 * 验证管理员token
 */
async function validateAdminToken(
  env: Env,
  token: string
): Promise<AuthValidationResult> {
  try {
    // 检查是否为管理员token
    const adminToken = env.ADMIN_TOKEN;
    if (adminToken && token === adminToken) {
      return {
        isValid: true,
        userId: 'admin',
        sessionId: 'admin-session',
        identityHash: 'admin',
        authMethod: 'admin'
      };
    }

    return {
      isValid: false,
      authMethod: 'admin',
      denialReason: '无效的管理员token'
    };
  } catch (error) {
    return {
      isValid: false,
      authMethod: 'admin',
      denialReason: '管理员验证失败'
    };
  }
}

/**
 * 记录权限验证日志
 */
async function logAuthAttempt(
  env: Env,
  logData: {
    contentType: string;
    contentId: number;
    theme: string;
    authResult: 'granted' | 'denied' | 'error';
    authMethod: string;
    denialReason?: string;
    responseTimeMs: number;
    userId?: string;
    sessionId?: string;
    identityHash?: string;
    ipAddress: string;
    userAgent: string;
  }
): Promise<void> {
  try {
    const db = new DatabaseService(env.DB!);

    await db.execute(`
      INSERT INTO png_auth_logs (
        content_type, content_id, theme, auth_result, auth_method,
        denial_reason, response_time_ms, user_id, session_id, identity_hash,
        ip_address, user_agent, download_granted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      logData.contentType,
      logData.contentId,
      logData.theme,
      logData.authResult,
      logData.authMethod,
      logData.denialReason || null,
      logData.responseTimeMs,
      logData.userId || null,
      logData.sessionId || null,
      logData.identityHash || null,
      logData.ipAddress,
      logData.userAgent,
      logData.authResult === 'granted' ? 1 : 0
    ]);

  } catch (error) {
    console.error('记录PNG权限日志失败:', error);
  }
}

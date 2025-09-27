/**
 * 问卷用户认证系统 - 独立API路由
 * 专门处理问卷用户的A+B认证和匿名认证
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { generateUUID, generateABIdentityHash, generateDeviceFingerprint } from '../utils/uuid';

// 问卷用户类型
interface QuestionnaireUser {
  id?: number;
  uuid: string;
  identity_hash?: string;
  display_name?: string;
  user_type: 'anonymous' | 'semi_anonymous';
  permissions: string;
  profile: string;
  metadata: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

// 问卷会话类型
interface QuestionnaireSession {
  session_id: string;
  user_uuid: string;
  session_token: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export function createQuestionnaireAuthRoutes() {
  console.log('🔧 Creating questionnaire auth routes...');
  const auth = new Hono<{ Bindings: Env }>();

  // 测试端点
  auth.get('/test', async (c) => {
    console.log('📝 Test endpoint called');
    return c.json({
      success: true,
      message: 'Questionnaire auth routes are working!',
      timestamp: new Date().toISOString()
    });
  });

  // 获取客户端IP
  function getClientIP(c: any): string {
    return c.req.header('CF-Connecting-IP') ||
           c.req.header('X-Forwarded-For') ||
           c.req.header('X-Real-IP') ||
           '127.0.0.1';
  }

  // 记录认证日志
  async function logQuestionnaireAuthEvent(
    db: any,
    userUuid: string | null,
    userType: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await db.execute(
      `INSERT INTO questionnaire_auth_logs (
        user_uuid, user_type, action, ip_address, user_agent,
        device_fingerprint, success, error_message, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userUuid,
        userType || '',
        action || '',
        ipAddress || '',
        userAgent || '',
        null, // device_fingerprint
        success ? 1 : 0,
        errorMessage || null,
        null, // metadata
        new Date().toISOString()
      ]
    );
  }

  // 创建问卷用户会话
  async function createQuestionnaireSession(
    db: any,
    user: QuestionnaireUser,
    deviceInfo: any,
    userAgent: string = '',
    ipAddress: string = ''
  ): Promise<QuestionnaireSession> {
    const sessionId = generateUUID('session');
    const sessionToken = generateUUID('token');
    const deviceFingerprint = await generateDeviceFingerprint(deviceInfo);
    
    // 会话超时：24小时
    const timeout = 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + timeout * 1000).toISOString();

    const session: QuestionnaireSession = {
      session_id: sessionId,
      user_uuid: user.uuid,
      session_token: sessionToken,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
      is_active: true,
      created_at: new Date().toISOString()
    };

    await db.execute(
      `INSERT INTO questionnaire_sessions (
        session_id, user_uuid, session_token, device_fingerprint,
        ip_address, user_agent, device_info, expires_at, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.session_id, session.user_uuid, session.session_token,
        session.device_fingerprint, session.ip_address, session.user_agent,
        JSON.stringify(deviceInfo), session.expires_at, session.is_active ? 1 : 0,
        session.created_at
      ]
    );

    return session;
  }

  /**
   * 半匿名用户认证 (A+B组合)
   */
  auth.post('/semi-anonymous', async (c) => {
    try {
      const body = await c.req.json();
      const { identityA, identityB, deviceInfo } = body;

      // 验证A+B格式
      if (!identityA || !/^\d{11}$/.test(identityA)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'A值必须是11位数字'
        }, 400);
      }

      if (!identityB || !/^(\d{4}|\d{6})$/.test(identityB)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'B值必须是4位或6位数字'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 生成身份哈希
      const identityHash = await generateABIdentityHash(identityA, identityB);

      // 查找现有用户
      let user = await db.queryFirst<QuestionnaireUser>(
        'SELECT * FROM questionnaire_users WHERE identity_hash = ?',
        [identityHash]
      );

      if (!user) {
        // 创建新的半匿名用户
        const userUuid = generateUUID('semi_anonymous');
        const now = new Date().toISOString();

        const userData = {
          uuid: userUuid,
          user_type: 'semi_anonymous',
          identity_hash: identityHash,
          display_name: `问卷用户_${userUuid.slice(-8)}`,
          permissions: JSON.stringify([
            'browse_content',
            'submit_questionnaire',
            'manage_own_content'
          ]),
          profile: JSON.stringify({
            language: 'zh-CN',
            timezone: 'Asia/Shanghai'
          }),
          metadata: JSON.stringify({
            loginCount: 0,
            contentStats: { totalSubmissions: 0 }
          }),
          status: 'active',
          created_at: now,
          updated_at: now,
          last_active_at: now
        };

        await db.execute(
          `INSERT INTO questionnaire_users (
            uuid, user_type, identity_hash, display_name, permissions, 
            profile, metadata, status, created_at, updated_at, last_active_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.uuid, userData.user_type, userData.identity_hash,
            userData.display_name, userData.permissions,
            userData.profile, userData.metadata, userData.status,
            userData.created_at, userData.updated_at, userData.last_active_at
          ]
        );

        user = { ...userData, permissions: JSON.parse(userData.permissions) } as any;
      } else {
        // 更新登录信息
        const currentMetadata = JSON.parse(user.metadata || '{}');
        currentMetadata.loginCount = (currentMetadata.loginCount || 0) + 1;
        
        await db.execute(
          'UPDATE questionnaire_users SET last_active_at = ?, metadata = ? WHERE uuid = ?',
          [new Date().toISOString(), JSON.stringify(currentMetadata), user.uuid]
        );

        user.permissions = JSON.parse(user.permissions as any);
      }

      // 创建会话
      const session = await createQuestionnaireSession(
        db, user, deviceInfo, 
        c.req.header('User-Agent') || '', 
        getClientIP(c)
      );

      // 记录认证日志
      await logQuestionnaireAuthEvent(
        db, user.uuid, user.user_type, 'login', 
        getClientIP(c), c.req.header('User-Agent') || '', true
      );

      return c.json({
        success: true,
        data: { user, session },
        message: '半匿名登录成功'
      });

    } catch (error) {
      console.error('问卷半匿名认证失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败，请稍后重试'
      }, 500);
    }
  });

  /**
   * 匿名用户认证
   */
  auth.post('/anonymous', async (c) => {
    try {
      const body = await c.req.json();
      const { deviceInfo } = body;

      const db = createDatabaseService(c.env as Env);
      const deviceFingerprint = await generateDeviceFingerprint(deviceInfo);

      // 创建新的匿名用户
      const userUuid = generateUUID('anonymous');
      const now = new Date().toISOString();

      const userData = {
        uuid: userUuid,
        user_type: 'anonymous',
        display_name: `匿名用户_${userUuid.slice(-8)}`,
        permissions: JSON.stringify(['browse_content', 'submit_questionnaire']),
        profile: JSON.stringify({ language: 'zh-CN', timezone: 'Asia/Shanghai' }),
        metadata: JSON.stringify({ loginCount: 0, deviceFingerprint }),
        status: 'active',
        created_at: now,
        updated_at: now,
        last_active_at: now
      };

      await db.execute(
        `INSERT INTO questionnaire_users (
          uuid, user_type, display_name, permissions, 
          profile, metadata, status, created_at, updated_at, last_active_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.uuid, userData.user_type, userData.display_name, userData.permissions,
          userData.profile, userData.metadata, userData.status,
          userData.created_at, userData.updated_at, userData.last_active_at
        ]
      );

      const user = { ...userData, permissions: JSON.parse(userData.permissions) } as any;

      // 创建会话
      const session = await createQuestionnaireSession(
        db, user, deviceInfo, 
        c.req.header('User-Agent') || '', 
        getClientIP(c)
      );

      // 记录认证日志
      await logQuestionnaireAuthEvent(
        db, user.uuid, user.user_type, 'login', 
        getClientIP(c), c.req.header('User-Agent') || '', true
      );

      return c.json({
        success: true,
        data: { user, session },
        message: '匿名登录成功'
      });

    } catch (error) {
      console.error('问卷匿名认证失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败，请稍后重试'
      }, 500);
    }
  });

  /**
   * 用户登出
   */
  auth.post('/logout', async (c) => {
    try {
      const body = await c.req.json();
      const { sessionToken } = body;

      if (!sessionToken) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少会话令牌'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找会话
      const session = await db.queryFirst(
        'SELECT * FROM questionnaire_sessions WHERE session_token = ?',
        [sessionToken]
      );

      if (session) {
        // 标记会话为非活跃
        await db.execute(
          'UPDATE questionnaire_sessions SET is_active = 0 WHERE session_token = ?',
          [sessionToken]
        );

        // 记录登出日志
        await logQuestionnaireAuthEvent(
          db, session.user_uuid, 'questionnaire_user', 'logout', 
          getClientIP(c), c.req.header('User-Agent') || '', true
        );
      }

      return c.json({
        success: true,
        data: null,
        message: '登出成功'
      });

    } catch (error) {
      console.error('问卷用户登出失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '登出失败，请稍后重试'
      }, 500);
    }
  });

  return auth;
}

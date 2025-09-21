/**
 * UUID用户管理系统路由
 * 处理统一用户认证、会话管理和内容关联
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { createJWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { generateUUID, generateABIdentityHash, generateDeviceFingerprint } from '../utils/uuid';

// UUID系统类型定义
interface UniversalUser {
  uuid: string;
  userType: 'anonymous' | 'semi_anonymous' | 'reviewer' | 'admin' | 'super_admin';
  identityHash?: string;
  username?: string;
  displayName?: string;
  role?: string;
  permissions: string[];
  profile: any;
  metadata: any;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

interface UserSession {
  sessionId: string;
  userUuid: string;
  sessionToken: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export function createUUIDRoutes() {
  const uuid = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  // =====================================================
  // 认证相关路由
  // =====================================================

  // 半匿名用户认证
  uuid.post('/auth/semi-anonymous', async (c) => {
    try {
      const body = await c.req.json();
      const { identityA, identityB, deviceInfo } = body;

      // 验证A+B格式
      if (!identityA || !identityB) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'A值和B值不能为空'
        }, 400);
      }

      if (!/^\d{11}$/.test(identityA)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'A值必须是11位数字'
        }, 400);
      }

      if (!/^(\d{4}|\d{6})$/.test(identityB)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'B值必须是4位或6位数字'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 生成身份哈希
      console.log('[STEP 1] 开始生成身份哈希');
      const identityHash = await generateABIdentityHash(identityA, identityB);
      console.log('[STEP 1] 身份哈希生成完成:', identityHash);

      // 查找现有用户
      console.log('[STEP 2] 开始查询现有用户');
      let user;
      try {
        user = await db.queryFirst<UniversalUser>(
          'SELECT * FROM universal_users WHERE identity_hash = ?',
          [identityHash]
        );
        console.log('[STEP 2] 用户查询完成:', user ? '找到用户' : '未找到用户');
      } catch (error) {
        console.error('[STEP 2] 用户查询失败:', error);
        return c.json({
          success: false,
          error: 'Database Error',
          message: '用户查询失败',
          debug: `Step 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, 500);
      }

      if (!user) {
        console.log('[STEP 3] 开始创建新用户');
        // 创建新的半匿名用户
        const userUuid = generateUUID('semi_anonymous');
        const now = new Date().toISOString();
        console.log('[STEP 3] 用户UUID和时间戳生成完成:', { userUuid, now });

        const userData = {
          uuid: userUuid,
          userType: 'semi_anonymous',
          identityHash,
          displayName: `半匿名用户_${userUuid.slice(-8)}`,
          role: 'semi_anonymous',
          permissions: JSON.stringify([
            'browse_content',
            'submit_questionnaire',
            'manage_own_content',
            'download_content',
            'delete_own_content'
          ]),
          profile: JSON.stringify({
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            notifications: { email: false, push: false, sms: false },
            privacy: { showProfile: false, allowTracking: false, dataRetention: 30 }
          }),
          metadata: JSON.stringify({
            loginCount: 0,
            contentStats: {
              totalSubmissions: 0,
              approvedSubmissions: 0,
              rejectedSubmissions: 0,
              downloads: 0
            },
            securityFlags: {
              isSuspicious: false,
              failedLoginAttempts: 0,
              twoFactorEnabled: false
            }
          }),
          status: 'active',
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now
        };

        console.log('[STEP 3] 用户数据准备完成，开始插入数据库');
        console.log('[STEP 3] 插入参数:', [
          userData.uuid, userData.userType, userData.identityHash,
          userData.displayName, userData.role, userData.permissions,
          userData.profile, userData.metadata, userData.status,
          userData.createdAt, userData.updatedAt, userData.lastActiveAt
        ]);

        try {
          await db.execute(
            `INSERT INTO universal_users (
              uuid, user_type, identity_hash, display_name, role, permissions,
              profile, metadata, status, created_at, updated_at, last_active_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userData.uuid, userData.userType, userData.identityHash,
              userData.displayName, userData.role, userData.permissions,
              userData.profile, userData.metadata, userData.status,
              userData.createdAt, userData.updatedAt, userData.lastActiveAt
            ]
          );
          console.log('[STEP 3] 用户插入成功');
        } catch (error) {
          console.error('[STEP 3] 用户插入失败:', error);
          return c.json({
            success: false,
            error: 'Database Error',
            message: '用户创建失败',
            debug: `Step 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }, 500);
        }

        user = { ...userData, permissions: JSON.parse(userData.permissions) };
      } else {
        // 更新登录信息
        const currentMetadata = JSON.parse(user.metadata || '{}');
        currentMetadata.loginCount = (currentMetadata.loginCount || 0) + 1;

        await db.execute(
          'UPDATE universal_users SET last_active_at = ?, metadata = ? WHERE uuid = ?',
          [new Date().toISOString(), JSON.stringify(currentMetadata), user.uuid]
        );

        user.permissions = JSON.parse(user.permissions as any);
      }

      // 创建会话
      console.log('[STEP 4] 开始创建用户会话');
      console.log('[STEP 4] 会话参数检查:', {
        user: user ? { uuid: user.uuid, userType: user.userType } : null,
        deviceInfo: deviceInfo,
        userAgent: c.req.header('User-Agent') || '',
        clientIP: getClientIP(c)
      });
      let session;
      try {
        session = await createUserSession(db, user, deviceInfo, c.req.header('User-Agent') || '', getClientIP(c));
        console.log('[STEP 4] 会话创建成功');
      } catch (error) {
        console.error('[STEP 4] 会话创建失败:', error);
        return c.json({
          success: false,
          error: 'Database Error',
          message: '会话创建失败',
          debug: `Step 4 failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, 500);
      }

      // 记录认证日志
      console.log('[STEP 5] 开始记录认证日志');
      try {
        await logAuthEvent(db, user.uuid, (user as any).user_type || user.userType, 'login', getClientIP(c), c.req.header('User-Agent') || '', true);
        console.log('[STEP 5] 认证日志记录成功');
      } catch (error) {
        console.error('[STEP 5] 认证日志记录失败:', error);
        return c.json({
          success: false,
          error: 'Database Error',
          message: '日志记录失败',
          debug: `Step 5 failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, 500);
      }

      return c.json({
        success: true,
        data: { user, session },
        message: '半匿名登录成功'
      });

    } catch (error: any) {
      console.error('Semi-anonymous auth error:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      });
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败，请稍后重试',
        debug: error?.message || 'Unknown error'
      }, 500);
    }
  });

  // 全匿名用户认证
  uuid.post('/auth/anonymous', async (c) => {
    try {
      const body = await c.req.json();
      const { deviceInfo } = body;

      const db = createDatabaseService(c.env as Env);
      const deviceFingerprint = await generateDeviceFingerprint(deviceInfo);

      // 为简化起见，每次都创建新的匿名用户
      // 在生产环境中，可以根据设备指纹查找现有用户

      // 创建新的匿名用户
      const userUuid = generateUUID('anonymous');
        const now = new Date().toISOString();

        const userData = {
          uuid: userUuid,
          userType: 'anonymous',
          displayName: `匿名用户_${userUuid.slice(-8)}`,
          role: 'anonymous',
          permissions: JSON.stringify(['browse_content', 'submit_questionnaire']),
          profile: JSON.stringify({
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            notifications: { email: false, push: false, sms: false },
            privacy: { showProfile: false, allowTracking: false, dataRetention: 1 }
          }),
          metadata: JSON.stringify({
            loginCount: 0,
            contentStats: {
              totalSubmissions: 0,
              approvedSubmissions: 0,
              rejectedSubmissions: 0,
              downloads: 0
            },
            securityFlags: {
              isSuspicious: false,
              failedLoginAttempts: 0,
              twoFactorEnabled: false
            }
          }),
          status: 'active',
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now
        };

        await db.execute(
          `INSERT INTO universal_users (
            uuid, user_type, display_name, role, permissions, 
            profile, metadata, status, created_at, updated_at, last_active_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.uuid, userData.userType, userData.displayName,
            userData.role, userData.permissions, userData.profile,
            userData.metadata, userData.status, userData.createdAt,
            userData.updatedAt, userData.lastActiveAt
          ]
        );

        const user = { ...userData, permissions: JSON.parse(userData.permissions) };

      // 创建会话
      const session = await createUserSession(db, user as any, deviceInfo, c.req.header('User-Agent') || '', getClientIP(c));

      // 记录认证日志
      await logAuthEvent(db, user.uuid, user.userType, 'login', getClientIP(c), c.req.header('User-Agent') || '', true);

      return c.json({
        success: true,
        data: { user, session },
        message: '匿名登录成功'
      });

    } catch (error: any) {
      console.error('Anonymous auth error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败，请稍后重试'
      }, 500);
    }
  });

  // 管理员认证
  uuid.post('/auth/admin', async (c) => {
    try {
      const body = await c.req.json();
      const { username, password, userType = 'admin', deviceInfo } = body;

      if (!username || !password) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '用户名和密码不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找用户
      const user = await db.queryFirst<UniversalUser>(
        'SELECT * FROM universal_users WHERE username = ? AND user_type IN (?, ?, ?)',
        [username, 'admin', 'super_admin', 'reviewer']
      );

      if (!user) {
        await logAuthEvent(db, null, userType as any, 'failed_attempt', getClientIP(c), c.req.header('User-Agent'), false, '用户不存在');
        return c.json({
          success: false,
          error: 'Authentication Failed',
          message: '用户名或密码错误'
        }, 401);
      }

      // 验证密码
      const isPasswordValid = await PasswordService.verifyPassword(password, (user as any).password_hash!);
      if (!isPasswordValid) {
        await logAuthEvent(db, user.uuid, user.userType, 'failed_attempt', getClientIP(c), c.req.header('User-Agent'), false, '密码错误');
        return c.json({
          success: false,
          error: 'Authentication Failed',
          message: '用户名或密码错误'
        }, 401);
      }

      // 更新登录信息
      const currentMetadata = JSON.parse(user.metadata || '{}');
      currentMetadata.loginCount = (currentMetadata.loginCount || 0) + 1;

      await db.execute(
        'UPDATE universal_users SET last_active_at = ?, metadata = ? WHERE uuid = ?',
        [new Date().toISOString(), JSON.stringify(currentMetadata), user.uuid]
      );

      user.permissions = JSON.parse(user.permissions as any);

      // 创建会话
      const session = await createUserSession(db, user, deviceInfo, c.req.header('User-Agent') || '', getClientIP(c));

      // 记录认证日志
      await logAuthEvent(db, user.uuid, user.userType, 'login', getClientIP(c), c.req.header('User-Agent') || '', true);

      return c.json({
        success: true,
        data: { user, session },
        message: '登录成功'
      });

    } catch (error: any) {
      console.error('Admin auth error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败，请稍后重试'
      }, 500);
    }
  });

  // 验证会话
  uuid.post('/auth/validate', async (c) => {
    try {
      const body = await c.req.json();
      const { sessionToken } = body;

      if (!sessionToken) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '会话令牌不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找会话和用户
      const result = await db.queryFirst<any>(
        `SELECT s.*, u.* FROM user_sessions s 
         JOIN universal_users u ON s.user_uuid = u.uuid 
         WHERE s.session_token = ? AND s.expires_at > NOW() AND s.is_active = TRUE`,
        [sessionToken]
      );

      if (!result) {
        return c.json({
          success: false,
          error: 'Invalid Session',
          message: '会话无效或已过期'
        }, 401);
      }

      const user: UniversalUser = {
        uuid: result.uuid,
        userType: result.user_type,
        identityHash: result.identity_hash,
        username: result.username,
        displayName: result.display_name,
        role: result.role,
        permissions: JSON.parse(result.permissions),
        profile: JSON.parse(result.profile),
        metadata: JSON.parse(result.metadata),
        status: result.status,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        lastActiveAt: result.last_active_at
      };

      const session: UserSession = {
        sessionId: result.session_id,
        userUuid: result.user_uuid,
        sessionToken: result.session_token,
        deviceFingerprint: result.device_fingerprint,
        ipAddress: result.ip_address,
        userAgent: result.user_agent,
        expiresAt: result.expires_at,
        isActive: result.is_active,
        createdAt: result.created_at
      };

      // 更新最后活跃时间
      await db.execute(
        'UPDATE universal_users SET last_active_at = ? WHERE uuid = ?',
        [new Date().toISOString(), user.uuid]
      );

      return c.json({
        success: true,
        data: { user, session },
        message: '会话验证成功'
      });

    } catch (error: any) {
      console.error('Session validation error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '会话验证失败'
      }, 500);
    }
  });

  // 用户登出
  uuid.post('/auth/logout', async (c) => {
    try {
      const body = await c.req.json();
      const { sessionToken } = body;

      if (!sessionToken) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '会话令牌不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找会话
      const session = await db.queryFirst<any>(
        'SELECT user_uuid, user_type FROM user_sessions s JOIN universal_users u ON s.user_uuid = u.uuid WHERE s.session_token = ?',
        [sessionToken]
      );

      // 使会话失效
      await db.execute(
        'UPDATE user_sessions SET is_active = FALSE WHERE session_token = ?',
        [sessionToken]
      );

      if (session) {
        // 记录登出日志
        await logAuthEvent(db, session.user_uuid, session.user_type, 'logout', getClientIP(c), c.req.header('User-Agent'), true);
      }

      return c.json({
        success: true,
        data: null,
        message: '登出成功'
      });

    } catch (error: any) {
      console.error('Logout error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '登出失败'
      }, 500);
    }
  });

  // =====================================================
  // 问卷相关路由（不需要认证）
  // =====================================================

  // 测试端点
  uuid.get('/test-questionnaire', async (c) => {
    return c.json({
      success: true,
      message: '问卷路由工作正常'
    });
  });

  // 简单的问卷测试端点（不需要认证）
  uuid.post('/test-submit', async (c) => {
    return c.json({
      success: true,
      message: '问卷提交测试成功',
      data: { timestamp: new Date().toISOString() }
    });
  });

  // 超简单的测试端点
  uuid.post('/simple-test', async (c) => {
    console.log('简单测试端点被调用');
    return c.text('OK');
  });

  // 提交问卷（UUID用户系统）
  uuid.post('/questionnaire', async (c) => {
    try {
      console.log('问卷提交请求开始');
      const body = await c.req.json();
      console.log('请求体解析完成:', body);
      const {
        personalInfo,
        educationInfo,
        employmentInfo,
        jobSearchInfo,
        employmentStatus,
        sessionToken
      } = body;

      // 验证必填字段
      console.log('开始验证必填字段');
      if (!personalInfo || !educationInfo || !employmentInfo || !jobSearchInfo || !employmentStatus) {
        console.log('验证失败，缺少必填字段');
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '所有问卷部分都必须填写'
        }, 400);
      }
      console.log('字段验证通过');

      console.log('创建数据库服务');
      const db = createDatabaseService(c.env as Env);
      console.log('数据库服务创建完成');
      let userUuid = null;

      // 如果提供了会话令牌，验证用户身份（简化版本）
      console.log('检查会话令牌:', sessionToken);
      if (sessionToken) {
        // 在MockDatabase环境中，暂时跳过复杂的会话验证
        // 在生产环境中，这里应该验证会话令牌
        userUuid = 'temp-user-uuid'; // 临时用户UUID
        console.log('设置临时用户UUID:', userUuid);
      }

      // 生成问卷ID
      console.log('生成问卷ID');
      const questionnaireId = `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('问卷ID生成完成:', questionnaireId);

      // 插入问卷数据到传统表（保持兼容性）
      console.log('开始插入问卷数据');
      const result = await db.execute(
        `INSERT INTO questionnaire_responses
         (user_id, personal_info, education_info, employment_info, job_search_info, employment_status, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userUuid, // 使用UUID而不是传统user_id
          JSON.stringify(personalInfo),
          JSON.stringify(educationInfo),
          JSON.stringify(employmentInfo),
          JSON.stringify(jobSearchInfo),
          JSON.stringify(employmentStatus),
          'pending',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log('问卷数据插入完成:', result);

      if (!result.success) {
        throw new Error('Failed to insert questionnaire');
      }

      // 获取插入的问卷ID
      const insertedId = result.meta?.last_row_id || questionnaireId;
      console.log('获取插入ID:', insertedId);

      // 如果用户已登录，创建用户内容映射
      if (userUuid) {
        console.log('开始创建用户内容映射');
        await db.execute(
          `INSERT INTO user_content_mappings (user_uuid, content_type, content_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userUuid,
            'questionnaire',
            insertedId.toString(),
            'pending',
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        console.log('用户内容映射创建完成');
      } else {
        console.log('跳过用户内容映射（无用户UUID）');
      }

      // 记录认证日志（暂时注释掉以调试）
      // if (userUuid) {
      //   await logAuthEvent(db, userUuid, null, 'questionnaire_submit', getClientIP(c), c.req.header('User-Agent'), true, `问卷提交: ${insertedId}`);
      // }

      // 获取完整的问卷数据
      console.log('构建返回数据');
      const questionnaire = {
        id: insertedId,
        userUuid,
        personalInfo,
        educationInfo,
        employmentInfo,
        jobSearchInfo,
        employmentStatus,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('返回成功响应');
      return c.json({
        success: true,
        data: { id: insertedId, userUuid },
        message: '问卷提交成功'
      });

    } catch (error: any) {
      console.error('Questionnaire submission error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '问卷提交失败，请稍后重试'
      }, 500);
    }
  });

  // 获取用户的问卷列表
  uuid.get('/questionnaire/user/:userUuid', async (c) => {
    try {
      const userUuid = c.req.param('userUuid');
      const db = createDatabaseService(c.env as Env);

      // 验证用户权限（简化版本）
      // 在实际应用中，这里应该验证当前用户是否有权限查看指定用户的问卷

      // 获取用户的问卷映射
      const mappings = await db.query<any>(
        'SELECT content_id, status, created_at FROM user_content_mappings WHERE user_uuid = ? AND content_type = ?',
        [userUuid, 'questionnaire']
      );

      if (mappings.length === 0) {
        return c.json({
          success: true,
          data: [],
          message: '暂无问卷数据'
        });
      }

      // 获取问卷详情
      const questionnaireIds = mappings.map(m => m.content_id);
      const placeholders = questionnaireIds.map(() => '?').join(',');

      const questionnaires = await db.query<any>(
        `SELECT * FROM questionnaire_responses WHERE id IN (${placeholders})`,
        questionnaireIds
      );

      // 合并映射状态
      const result = questionnaires.map(q => {
        const mapping = mappings.find(m => m.content_id === q.id);
        return {
          ...q,
          mappingStatus: mapping?.status,
          mappingCreatedAt: mapping?.created_at
        };
      });

      return c.json({
        success: true,
        data: result,
        message: '获取问卷列表成功'
      });

    } catch (error: any) {
      console.error('Get user questionnaires error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷列表失败'
      }, 500);
    }
  });

  // 获取单个问卷详情
  uuid.get('/questionnaire/:id', async (c) => {
    try {
      const questionnaireId = c.req.param('id');
      const db = createDatabaseService(c.env as Env);

      const questionnaire = await db.queryFirst<any>(
        'SELECT * FROM questionnaire_responses WHERE id = ?',
        [questionnaireId]
      );

      if (!questionnaire) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '问卷不存在'
        }, 404);
      }

      // 获取用户内容映射信息
      const mapping = await db.queryFirst<any>(
        'SELECT * FROM user_content_mappings WHERE content_id = ? AND content_type = ?',
        [questionnaireId, 'questionnaire']
      );

      const result = {
        ...questionnaire,
        mapping: mapping || null
      };

      return c.json({
        success: true,
        data: result,
        message: '获取问卷详情成功'
      });

    } catch (error: any) {
      console.error('Get questionnaire error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷详情失败'
      }, 500);
    }
  });

  // =====================================================
  // 需要认证的路由（如果有的话）
  // =====================================================

  // 其他需要认证的路由可以在这里添加
  // uuid.use('*', authMiddleware);

  return uuid;
}

// 辅助函数
async function createUserSession(
  db: any,
  user: UniversalUser,
  deviceInfo: any,
  userAgent: string = '',
  ipAddress: string = ''
): Promise<UserSession> {
  console.log('[createUserSession] 开始创建会话，参数检查:', {
    user: user ? { uuid: user.uuid, userType: user.userType } : 'null',
    deviceInfo: deviceInfo,
    userAgent: userAgent,
    ipAddress: ipAddress
  });

  const sessionId = generateUUID('session');
  const sessionToken = generateUUID('token');
  const deviceFingerprint = await generateDeviceFingerprint(deviceInfo);

  console.log('[createUserSession] UUID和指纹生成完成:', {
    sessionId,
    sessionToken,
    deviceFingerprint
  });

  // 会话超时配置（秒）
  const timeouts = {
    anonymous: 24 * 60 * 60,      // 24小时
    semi_anonymous: 24 * 60 * 60, // 24小时
    reviewer: 60 * 60,            // 1小时
    admin: 60 * 60,               // 1小时
    super_admin: 60 * 60          // 1小时
  };

  const timeout = timeouts[user.userType] || 3600;
  const expiresAt = new Date(Date.now() + timeout * 1000).toISOString();

  const session: UserSession = {
    sessionId,
    userUuid: user.uuid,
    sessionToken,
    deviceFingerprint,
    ipAddress,
    userAgent,
    expiresAt,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  console.log('[createUserSession] 会话对象创建完成:', session);

  const insertParams = [
    session.sessionId, session.userUuid, session.sessionToken,
    session.deviceFingerprint, session.ipAddress, session.userAgent,
    deviceInfo ? JSON.stringify(deviceInfo) : null, session.expiresAt, session.isActive ? 1 : 0,
    session.createdAt
  ];

  console.log('[createUserSession] 插入参数:', insertParams);

  await db.execute(
    `INSERT INTO user_sessions (
      session_id, user_uuid, session_token, device_fingerprint,
      ip_address, user_agent, device_info, expires_at, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    insertParams
  );

  console.log('[createUserSession] 数据库插入成功');
  return session;
}

async function logAuthEvent(
  db: any,
  userUuid: string | null,
  userType: string,
  action: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  console.log('[logAuthEvent] 参数检查:', {
    userUuid,
    userType,
    action,
    ipAddress,
    userAgent,
    success,
    errorMessage
  });

  const params = [
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
  ];

  console.log('[logAuthEvent] 最终参数:', params);

  await db.execute(
    `INSERT INTO auth_logs (
      user_uuid, user_type, action, ip_address, user_agent,
      device_fingerprint, success, error_message, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );
}

function getClientIP(c: any): string {
  return c.req.header('CF-Connecting-IP') || 
         c.req.header('X-Forwarded-For') || 
         c.req.header('X-Real-IP') || 
         '127.0.0.1';
}

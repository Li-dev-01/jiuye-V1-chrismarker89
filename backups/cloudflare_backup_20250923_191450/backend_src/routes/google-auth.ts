/**
 * Google OAuth认证路由
 * 处理问卷用户的便捷注册和管理员的白名单登录
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { generateUUID } from '../utils/uuid';
import { LoginRecordService } from '../services/loginRecordService';

const googleAuth = new Hono<{ Bindings: Env }>();

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
    console.error('Token exchange failed:', error);
    throw new Error('Failed to exchange code for token');
  }

  return await response.json();
}

/**
 * 从数据库获取白名单条目
 */
async function getWhitelistEntry(db: any, email: string) {
  return await db.queryFirst(`
    SELECT email, role, status, display_name
    FROM google_oauth_whitelist
    WHERE email = ? AND status = 'active'
  `, [email]);
}

/**
 * 从UUID生成A值（11位数字）- 增强防撞库算法
 */
function generateIdentityAFromUuid(uuid: string): string {
  // 使用UUID + 邮箱哈希 + 时间戳生成更复杂的A值
  const numericPart = uuid.replace(/[^0-9]/g, '');
  const timestamp = Date.now().toString();
  const combined = numericPart + timestamp;

  // 使用哈希确保唯一性和复杂性
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }

  // 生成11位数字，确保不以0开头
  const absHash = Math.abs(hash).toString();
  const paddedHash = absHash.padEnd(11, '0').substring(0, 11);

  // 确保第一位不是0（防止被误认为10位数字）
  return paddedHash.charAt(0) === '0' ? '1' + paddedHash.substring(1) : paddedHash;
}

/**
 * 从UUID生成B值（4位数字）- 增强防撞库算法
 */
function generateIdentityBFromUuid(uuid: string): string {
  // 使用UUID的多个部分生成更复杂的B值
  const parts = uuid.split('-');
  let bValue = '';

  for (let i = 0; i < Math.min(parts.length, 4); i++) {
    const part = parts[i];
    let partHash = 0;
    for (let j = 0; j < part.length; j++) {
      partHash += part.charCodeAt(j);
    }
    bValue += (partHash % 10).toString();
  }

  // 确保是4位数字
  return bValue.padEnd(4, '0').substring(0, 4);
}

/**
 * 为管理员生成用户名（基于邮箱和角色）
 */
function generateAdminUsername(email: string, role: string): string {
  const emailPrefix = email.split('@')[0];
  const rolePrefix = role.replace('_', '');
  return `${rolePrefix}_${emailPrefix}`.toLowerCase();
}

/**
 * 为管理员生成密码（基于邮箱和UUID）
 */
function generateAdminPassword(email: string, uuid: string): string {
  // 生成复杂但可预测的密码
  const emailHash = email.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);

  const uuidPart = uuid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  const timestamp = Math.floor(Date.now() / 1000000); // 简化时间戳

  return `Admin${Math.abs(emailHash)}${uuidPart}${timestamp}`.substring(0, 16);
}

/**
 * 生成密码哈希
 */
function generatePasswordHash(password: string): string {
  // 简单的哈希实现，生产环境应使用更安全的方法
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 更新白名单条目的最后使用时间
 */
async function updateLastUsed(db: any, email: string) {
  await db.execute(`
    UPDATE google_oauth_whitelist
    SET last_used = CURRENT_TIMESTAMP
    WHERE email = ?
  `, [email]);
}

/**
 * 问卷用户Google登录 - 自动生成半匿名身份
 */
googleAuth.post('/questionnaire', async (c) => {
  try {
    const body = await c.req.json();
    const { googleUser, userType } = body;

    if (!googleUser || !googleUser.email) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: 'Google用户信息不完整'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const loginRecordService = new LoginRecordService(db);
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    // 检查是否已存在该Google邮箱的用户
    const existingUser = await db.queryFirst(
      'SELECT * FROM universal_users WHERE metadata LIKE ? AND user_type = ?',
      [`%"googleEmail":"${googleUser.email}"%`, 'semi_anonymous']
    );

    let user;
    const now = new Date().toISOString();

    if (existingUser) {
      // 用户已存在，更新登录时间
      await db.execute(
        'UPDATE universal_users SET last_active_at = ? WHERE uuid = ?',
        [now, existingUser.uuid]
      );
      user = existingUser;
    } else {
      // 创建新的半匿名用户
      const userUuid = generateUUID('semi_anonymous');
      const displayName = `Google用户_${userUuid.slice(-8)}`;
      
      const userData = {
        uuid: userUuid,
        user_type: 'semi_anonymous',
        display_name: displayName,
        permissions: JSON.stringify(['browse_content', 'submit_questionnaire']),
        profile: JSON.stringify({ 
          language: 'zh-CN', 
          timezone: 'Asia/Shanghai',
          googleLinked: true
        }),
        metadata: JSON.stringify({ 
          loginCount: 1,
          googleEmail: googleUser.email,
          googleName: googleUser.name,
          googlePicture: googleUser.picture,
          registrationMethod: 'google_oauth'
        }),
        status: 'active',
        created_at: now,
        updated_at: now,
        last_active_at: now
      };

      await db.execute(
        `INSERT INTO universal_users (
          uuid, user_type, display_name, permissions, profile, metadata, 
          status, created_at, updated_at, last_active_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.uuid, userData.user_type, userData.display_name,
          userData.permissions, userData.profile, userData.metadata,
          userData.status, userData.created_at, userData.updated_at, userData.last_active_at
        ]
      );

      user = userData;
    }

    // 记录登录事件
    await loginRecordService.recordLogin({
      userUuid: user.uuid,
      userType: user.user_type,
      loginMethod: 'google_oauth',
      loginStatus: 'success',
      ipAddress,
      userAgent,
      googleEmail: googleUser.email,
      metadata: {
        deviceInfo: body.deviceInfo || {},
        isNewUser: !existingUser,
        googleId: googleUser.id
      }
    });

    // 创建会话
    const sessionId = generateUUID('session');
    const sessionData = {
      sessionId,
      userUuid: user.uuid,
      userType: user.user_type,
      loginMethod: 'google_oauth',
      deviceInfo: body.deviceInfo || {},
      ipAddress,
      userAgent,
      createdAt: now,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时
    };

    return c.json({
      success: true,
      data: {
        user: {
          uuid: user.uuid,
          userType: user.user_type,
          displayName: user.display_name,
          permissions: JSON.parse(user.permissions),
          profile: JSON.parse(user.profile)
        },
        session: sessionData
      },
      message: 'Google登录成功，已自动创建匿名身份'
    });

  } catch (error: any) {
    console.error('Google questionnaire auth error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Google登录失败，请稍后重试'
    }, 500);
  }
});

/**
 * 管理员Google登录 - 白名单验证
 */
googleAuth.post('/management', async (c) => {
  try {
    const body = await c.req.json();
    const { googleUser } = body;

    if (!googleUser || !googleUser.email) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: 'Google用户信息不完整'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const loginRecordService = new LoginRecordService(db);
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    // 检查邮箱是否在白名单中
    const whitelistEntry = await getWhitelistEntry(db, googleUser.email);

    if (!whitelistEntry) {
      // 记录失败的登录尝试
      await loginRecordService.recordLogin({
        userUuid: 'unknown',
        userType: 'unknown',
        loginMethod: 'google_oauth_admin',
        loginStatus: 'failed',
        ipAddress,
        userAgent,
        googleEmail: googleUser.email,
        failureReason: 'Email not in whitelist',
        metadata: {
          deviceInfo: body.deviceInfo || {},
          googleId: googleUser.id
        }
      });

      return c.json({
        success: false,
        error: 'Access Denied',
        message: '您的邮箱不在管理员白名单中'
      }, 403);
    }

    // 更新最后使用时间
    await updateLastUsed(db, googleUser.email);

    // 检测异常登录
    const anomalyDetection = await loginRecordService.detectAnomalousLogin('temp_admin', ipAddress);

    // 检查或创建管理员用户
    let adminUser = await db.queryFirst(
      'SELECT * FROM universal_users WHERE metadata LIKE ? AND user_type = ?',
      [`%"googleEmail":"${googleUser.email}"%`, whitelistEntry.role]
    );

    const now = new Date().toISOString();

    if (!adminUser) {
      // 创建新的管理员用户
      const userUuid = generateUUID(whitelistEntry.role);
      
      const userData = {
        uuid: userUuid,
        user_type: whitelistEntry.role,
        display_name: googleUser.name || `${whitelistEntry.role}_${userUuid.slice(-8)}`,
        permissions: JSON.stringify(getPermissionsByRole(whitelistEntry.role)),
        profile: JSON.stringify({ 
          language: 'zh-CN', 
          timezone: 'Asia/Shanghai',
          googleLinked: true
        }),
        metadata: JSON.stringify({ 
          loginCount: 1,
          googleEmail: googleUser.email,
          googleName: googleUser.name,
          googlePicture: googleUser.picture,
          registrationMethod: 'google_oauth_admin'
        }),
        status: 'active',
        created_at: now,
        updated_at: now,
        last_active_at: now
      };

      await db.execute(
        `INSERT INTO universal_users (
          uuid, user_type, display_name, permissions, profile, metadata, 
          status, created_at, updated_at, last_active_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.uuid, userData.user_type, userData.display_name,
          userData.permissions, userData.profile, userData.metadata,
          userData.status, userData.created_at, userData.updated_at, userData.last_active_at
        ]
      );

      adminUser = userData;
    } else {
      // 更新登录时间
      await db.execute(
        'UPDATE universal_users SET last_active_at = ? WHERE uuid = ?',
        [now, adminUser.uuid]
      );
    }

    // 记录管理员登录事件
    await loginRecordService.recordLogin({
      userUuid: adminUser.uuid,
      userType: adminUser.user_type,
      loginMethod: 'google_oauth_admin',
      loginStatus: 'success',
      ipAddress,
      userAgent,
      googleEmail: googleUser.email,
      metadata: {
        deviceInfo: body.deviceInfo || {},
        isNewUser: !existingAdminUser,
        googleId: googleUser.id,
        role: whitelistEntry.role,
        anomalyDetection
      }
    });

    // 创建管理员会话
    const sessionId = generateUUID('admin_session');
    const sessionData = {
      sessionId,
      userUuid: adminUser.uuid,
      userType: adminUser.user_type,
      role: whitelistEntry.role,
      loginMethod: 'google_oauth_admin',
      deviceInfo: body.deviceInfo || {},
      ipAddress,
      userAgent,
      createdAt: now,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8小时
    };

    return c.json({
      success: true,
      data: {
        user: {
          uuid: adminUser.uuid,
          userType: adminUser.user_type,
          role: whitelistEntry.role,
          displayName: adminUser.display_name,
          permissions: JSON.parse(adminUser.permissions),
          profile: JSON.parse(adminUser.profile)
        },
        session: sessionData
      },
      message: `欢迎，${whitelistEntry.role}！`
    });

  } catch (error: any) {
    console.error('Google management auth error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Google管理员登录失败，请稍后重试'
    }, 500);
  }
});

/**
 * Google OAuth回调处理
 * 处理授权码交换和用户信息获取
 */
googleAuth.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    const { code, redirectUri, userType = 'questionnaire' } = body;

    if (!code) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少授权码'
      }, 400);
    }

    const clientSecret = GOOGLE_CLIENT_SECRET(c.env as Env);
    if (!clientSecret) {
      return c.json({
        success: false,
        error: 'Configuration Error',
        message: 'Google OAuth配置不完整'
      }, 500);
    }

    // 交换授权码获取访问令牌
    const tokenData = await exchangeCodeForToken(code, redirectUri, clientSecret);

    // 使用访问令牌获取用户信息
    const googleUser = await verifyGoogleToken(tokenData.access_token);

    // 根据用户类型处理不同的登录逻辑
    if (userType === 'questionnaire') {
      return await handleQuestionnaireUserCallback(c, googleUser);
    } else if (userType === 'management') {
      return await handleManagementUserCallback(c, googleUser);
    } else {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '无效的用户类型'
      }, 400);
    }

  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return c.json({
      success: false,
      error: 'OAuth Error',
      message: error.message || 'OAuth回调处理失败'
    }, 500);
  }
});

/**
 * 处理问卷用户回调
 */
async function handleQuestionnaireUserCallback(c: any, googleUser: any) {
  const db = createDatabaseService(c.env as Env);
  const now = new Date().toISOString();

  // 检查是否已存在该Google用户对应的半匿名用户
  const existingUser = await db.queryFirst(`
    SELECT uuid, display_name, metadata, status
    FROM universal_users
    WHERE user_type = 'semi_anonymous'
    AND JSON_EXTRACT(metadata, '$.googleEmail') = ?
  `, [googleUser.email]);

  if (existingUser) {
    // 更新最后活跃时间和登录次数
    const metadata = JSON.parse(existingUser.metadata || '{}');
    metadata.loginCount = (metadata.loginCount || 0) + 1;
    metadata.lastGoogleLogin = now;

    await db.execute(`
      UPDATE universal_users
      SET last_active_at = ?, metadata = ?
      WHERE uuid = ?
    `, [now, JSON.stringify(metadata), existingUser.uuid]);

    // 从用户UUID生成A+B组合（用于前端登录）
    const identityA = generateIdentityAFromUuid(existingUser.uuid);
    const identityB = generateIdentityBFromUuid(existingUser.uuid);

    return c.json({
      success: true,
      data: {
        identityA,
        identityB,
        user: {
          uuid: existingUser.uuid,
          userType: 'semi_anonymous',
          displayName: existingUser.display_name,
          status: existingUser.status,
          googleLinked: true
        }
      },
      message: 'Google登录成功，欢迎回来！'
    });
  }

  // 创建新的半匿名用户
  const userUuid = generateUUID('semi_anonymous');
  const displayName = `匿名用户_${userUuid.slice(-8)}`;

  const userData = {
    uuid: userUuid,
    user_type: 'semi_anonymous',
    display_name: displayName,
    permissions: JSON.stringify(['browse_content', 'submit_questionnaire', 'manage_own_content']),
    profile: JSON.stringify({
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      googleLinked: true
    }),
    metadata: JSON.stringify({
      loginCount: 1,
      googleEmail: googleUser.email,
      googleName: googleUser.name,
      googlePicture: googleUser.picture,
      registrationMethod: 'google_oauth',
      createdAt: now
    }),
    status: 'active',
    created_at: now,
    updated_at: now,
    last_active_at: now
  };

  await db.execute(`
    INSERT INTO universal_users (
      uuid, user_type, display_name, permissions, profile, metadata,
      status, created_at, updated_at, last_active_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userData.uuid, userData.user_type, userData.display_name,
    userData.permissions, userData.profile, userData.metadata,
    userData.status, userData.created_at, userData.updated_at, userData.last_active_at
  ]);

  // 从用户UUID生成A+B组合（用于前端登录）
  const identityA = generateIdentityAFromUuid(userData.uuid);
  const identityB = generateIdentityBFromUuid(userData.uuid);

  return c.json({
    success: true,
    data: {
      identityA,
      identityB,
      user: {
        uuid: userData.uuid,
        userType: 'semi_anonymous',
        displayName: userData.display_name,
        status: userData.status,
        googleLinked: true
      }
    },
    message: 'Google登录成功，已自动创建您的匿名身份！'
  });
}

/**
 * 处理管理员用户回调
 */
async function handleManagementUserCallback(c: any, googleUser: any) {
  const db = createDatabaseService(c.env as Env);

  // 检查邮箱是否在白名单中
  const whitelistEntry = await getWhitelistEntry(db, googleUser.email);
  if (!whitelistEntry) {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: '您的邮箱不在管理员白名单中，请联系超级管理员'
    }, 403);
  }

  // 更新白名单最后使用时间
  await updateLastUsed(db, googleUser.email);

  const now = new Date().toISOString();

  // 检查是否已存在该管理员用户
  const existingUser = await db.queryFirst(`
    SELECT uuid, display_name, user_type, metadata, status
    FROM universal_users
    WHERE user_type IN ('admin', 'reviewer', 'super_admin')
    AND JSON_EXTRACT(metadata, '$.googleEmail') = ?
  `, [googleUser.email]);

  if (existingUser) {
    // 更新最后活跃时间和登录次数
    const metadata = JSON.parse(existingUser.metadata || '{}');
    metadata.loginCount = (metadata.loginCount || 0) + 1;
    metadata.lastGoogleLogin = now;

    await db.execute(`
      UPDATE universal_users
      SET last_active_at = ?, metadata = ?
      WHERE uuid = ?
    `, [now, JSON.stringify(metadata), existingUser.uuid]);

    return c.json({
      success: true,
      data: {
        role: whitelistEntry.role,
        user: {
          uuid: existingUser.uuid,
          userType: existingUser.user_type,
          role: whitelistEntry.role,
          displayName: existingUser.display_name,
          status: existingUser.status,
          googleLinked: true
        }
      },
      message: `欢迎回来，${whitelistEntry.role}！`
    });
  }

  // 创建新的管理员用户
  const userUuid = generateUUID(whitelistEntry.role);

  // 为管理员生成固定的用户名和密码（基于邮箱）
  const adminUsername = generateAdminUsername(googleUser.email, whitelistEntry.role);
  const adminPassword = generateAdminPassword(googleUser.email, userUuid);

  const userData = {
    uuid: userUuid,
    user_type: whitelistEntry.role,
    display_name: googleUser.name || `${whitelistEntry.role}_${userUuid.slice(-8)}`,
    permissions: JSON.stringify(getPermissionsByRole(whitelistEntry.role)),
    profile: JSON.stringify({
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      googleLinked: true
    }),
    metadata: JSON.stringify({
      loginCount: 1,
      googleEmail: googleUser.email,
      googleName: googleUser.name,
      googlePicture: googleUser.picture,
      registrationMethod: 'google_oauth_admin',
      whitelistRole: whitelistEntry.role,
      createdAt: now,
      // 存储生成的用户名密码（加密）
      generatedCredentials: {
        username: adminUsername,
        passwordHash: generatePasswordHash(adminPassword)
      }
    }),
    status: 'active',
    created_at: now,
    updated_at: now,
    last_active_at: now
  };

  await db.execute(`
    INSERT INTO universal_users (
      uuid, user_type, display_name, permissions, profile, metadata,
      status, created_at, updated_at, last_active_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userData.uuid, userData.user_type, userData.display_name,
    userData.permissions, userData.profile, userData.metadata,
    userData.status, userData.created_at, userData.updated_at, userData.last_active_at
  ]);

  return c.json({
    success: true,
    data: {
      role: whitelistEntry.role,
      user: {
        uuid: userData.uuid,
        userType: userData.user_type,
        role: whitelistEntry.role,
        displayName: userData.display_name,
        status: userData.status,
        googleLinked: true
      }
    },
    message: `欢迎，${whitelistEntry.role}！账号已创建成功`
  });
}

/**
 * 根据角色获取权限列表
 */
function getPermissionsByRole(role: string): string[] {
  switch (role) {
    case 'super_admin':
      return ['all_permissions'];
    case 'admin':
      return ['manage_users', 'manage_content', 'view_analytics', 'system_config'];
    case 'reviewer':
      return ['review_content', 'view_submissions'];
    default:
      return ['browse_content'];
  }
}

export { googleAuth };

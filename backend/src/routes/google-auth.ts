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
const GOOGLE_CLIENT_ID = '947246726899-e2nuehhp0ngdcecaj67i1dbrevdu308o.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = (env: Env) => env.GOOGLE_CLIENT_SECRET;

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

/**
 * 统一用户创建API路由
 * 支持3种用户创建模式的统一接口
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { UnifiedUserIdService, type UserCreationMode } from '../services/unifiedUserIdService';
import { PasswordService } from '../utils/password';
import { createJWTService } from '../utils/jwt';

export function createUnifiedUserCreationRoutes() {
  const userCreation = new Hono<{ Bindings: Env }>();

  // =====================================================
  // 1. 手动创建用户
  // =====================================================
  userCreation.post('/manual', async (c) => {
    try {
      const { username, email, password, displayName } = await c.req.json();

      if (!username && !email) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '用户名或邮箱为必填项'
        }, 400);
      }

      if (!password) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '密码为必填项'
        }, 400);
      }

      const db = createDatabaseService(c.env);
      const userIdService = new UnifiedUserIdService(c.env.DB);
      const passwordService = new PasswordService();

      // 生成用户ID
      const idResult = await userIdService.generateUserId({
        creationMode: 'manual',
        userInput: username,
        email
      });

      if (!idResult.success) {
        return c.json({
          success: false,
          error: 'ID Generation Error',
          message: idResult.error
        }, 400);
      }

      // 加密密码
      const passwordHash = await passwordService.hashPassword(password);

      // 创建用户记录
      const userData = {
        uuid: idResult.uuid,
        user_type: 'semi_anonymous',
        username: idResult.userId,
        email: email || null,
        password_hash: passwordHash,
        display_name: displayName || idResult.userId,
        role: 'user',
        permissions: JSON.stringify(['browse_content', 'submit_questionnaire', 'manage_own_content']),
        profile: JSON.stringify({ language: 'zh-CN' }),
        metadata: JSON.stringify({ 
          creation_source: 'manual_registration',
          registration_ip: c.req.header('CF-Connecting-IP') || 'unknown'
        }),
        creation_mode: 'manual',
        id_generation_source: 'user_input',
        status: 'active'
      };

      const result = await db.insertUser(userData);

      if (!result.success) {
        return c.json({
          success: false,
          error: 'Database Error',
          message: result.error
        }, 500);
      }

      // 添加认证方式记录
      await c.env.DB.prepare(`
        INSERT INTO user_auth_methods (user_uuid, auth_type, auth_identifier, is_primary, is_active)
        VALUES (?, 'password', ?, 1, 1)
      `).bind(idResult.uuid, email || username).run();

      return c.json({
        success: true,
        data: {
          uuid: idResult.uuid,
          userId: idResult.userId,
          displayName: userData.display_name,
          creationMode: 'manual'
        },
        message: '用户创建成功'
      });

    } catch (error) {
      console.error('手动创建用户失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '用户创建失败'
      }, 500);
    }
  });

  // =====================================================
  // 2. Google OAuth用户创建
  // =====================================================
  userCreation.post('/google-oauth', async (c) => {
    try {
      const { googleId, email, name, picture } = await c.req.json();

      if (!googleId || !email) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: 'Google ID和邮箱为必填项'
        }, 400);
      }

      const db = createDatabaseService(c.env);
      const userIdService = new UnifiedUserIdService(c.env.DB);

      // 检查是否已存在
      const existingUser = await c.env.DB.prepare(`
        SELECT uuid FROM universal_users WHERE google_id = ?
      `).bind(googleId).first();

      if (existingUser) {
        return c.json({
          success: false,
          error: 'User Exists',
          message: 'Google账号已关联用户'
        }, 409);
      }

      // 生成用户ID
      const idResult = await userIdService.generateUserId({
        creationMode: 'google_oauth',
        googleId,
        email
      });

      if (!idResult.success) {
        return c.json({
          success: false,
          error: 'ID Generation Error',
          message: idResult.error
        }, 400);
      }

      // 创建用户记录
      const userData = {
        uuid: idResult.uuid,
        user_type: 'semi_anonymous',
        username: idResult.userId,
        email,
        google_id: googleId,
        display_name: name || email.split('@')[0],
        role: 'user',
        permissions: JSON.stringify(['browse_content', 'submit_questionnaire', 'manage_own_content']),
        profile: JSON.stringify({ 
          language: 'zh-CN',
          avatar: picture,
          google_verified: true
        }),
        metadata: JSON.stringify({ 
          creation_source: 'google_oauth',
          google_id: googleId,
          registration_ip: c.req.header('CF-Connecting-IP') || 'unknown'
        }),
        creation_mode: 'google_oauth',
        id_generation_source: 'google_oauth',
        status: 'active'
      };

      const result = await db.insertUser(userData);

      if (!result.success) {
        return c.json({
          success: false,
          error: 'Database Error',
          message: result.error
        }, 500);
      }

      // 添加认证方式记录
      await c.env.DB.prepare(`
        INSERT INTO user_auth_methods (user_uuid, auth_type, auth_identifier, is_primary, is_active)
        VALUES (?, 'google_oauth', ?, 1, 1)
      `).bind(idResult.uuid, googleId).run();

      return c.json({
        success: true,
        data: {
          uuid: idResult.uuid,
          userId: idResult.userId,
          displayName: userData.display_name,
          email,
          creationMode: 'google_oauth'
        },
        message: 'Google用户创建成功'
      });

    } catch (error) {
      console.error('Google OAuth用户创建失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: 'Google用户创建失败'
      }, 500);
    }
  });

  // =====================================================
  // 3. 自动注册用户（1-9前缀）
  // =====================================================
  userCreation.post('/auto-register', async (c) => {
    try {
      const { preferredPrefix, identityA, identityB } = await c.req.json();

      const db = createDatabaseService(c.env);
      const userIdService = new UnifiedUserIdService(c.env.DB);

      // 生成用户ID
      const idResult = await userIdService.generateUserId({
        creationMode: 'auto_register',
        preferredPrefix,
        metadata: { identityA, identityB }
      });

      if (!idResult.success) {
        return c.json({
          success: false,
          error: 'ID Generation Error',
          message: idResult.error
        }, 400);
      }

      // 生成身份哈希（如果提供了A+B身份）
      let identityHash = null;
      if (identityA && identityB) {
        const { generateABIdentityHash } = await import('../utils/uuid');
        identityHash = generateABIdentityHash(identityA, identityB);
      }

      // 创建用户记录
      const userData = {
        uuid: idResult.uuid,
        user_type: 'semi_anonymous',
        username: idResult.userId,
        identity_hash: identityHash,
        display_name: `用户_${idResult.prefix}_${idResult.userId.split('_')[1]}`,
        role: 'semi_anonymous',
        permissions: JSON.stringify(['browse_content', 'submit_questionnaire']),
        profile: JSON.stringify({ language: 'zh-CN' }),
        metadata: JSON.stringify({ 
          creation_source: 'auto_register',
          prefix_used: idResult.prefix,
          generation_method: idResult.generationMethod,
          collision_count: idResult.collisionCount,
          registration_ip: c.req.header('CF-Connecting-IP') || 'unknown'
        }),
        creation_mode: 'auto_register',
        user_id_prefix: idResult.prefix,
        id_generation_source: 'system_generated',
        status: 'active'
      };

      const result = await db.insertUser(userData);

      if (!result.success) {
        return c.json({
          success: false,
          error: 'Database Error',
          message: result.error
        }, 500);
      }

      // 添加认证方式记录
      if (identityHash) {
        await c.env.DB.prepare(`
          INSERT INTO user_auth_methods (user_uuid, auth_type, auth_identifier, is_primary, is_active)
          VALUES (?, 'ab_identity', ?, 1, 1)
        `).bind(idResult.uuid, identityHash).run();
      }

      return c.json({
        success: true,
        data: {
          uuid: idResult.uuid,
          userId: idResult.userId,
          displayName: userData.display_name,
          prefix: idResult.prefix,
          creationMode: 'auto_register',
          identityHash
        },
        message: '自动注册用户创建成功'
      });

    } catch (error) {
      console.error('自动注册用户创建失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '自动注册用户创建失败'
      }, 500);
    }
  });

  // =====================================================
  // 4. 获取前缀使用统计
  // =====================================================
  userCreation.get('/prefix-stats', async (c) => {
    try {
      const userIdService = new UnifiedUserIdService(c.env.DB);
      const stats = await userIdService.getPrefixUsageStats();

      return c.json({
        success: true,
        data: stats,
        message: '前缀使用统计获取成功'
      });

    } catch (error) {
      console.error('获取前缀统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取前缀统计失败'
      }, 500);
    }
  });

  // =====================================================
  // 5. 获取用户创建统计
  // =====================================================
  userCreation.get('/creation-stats', async (c) => {
    try {
      const userIdService = new UnifiedUserIdService(c.env.DB);
      const stats = await userIdService.getUserCreationStats();

      return c.json({
        success: true,
        data: stats,
        message: '用户创建统计获取成功'
      });

    } catch (error) {
      console.error('获取用户创建统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户创建统计失败'
      }, 500);
    }
  });

  return userCreation;
}

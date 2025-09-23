/**
 * 双因素认证API路由
 * 处理2FA设置、验证等功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import { authMiddleware } from '../middleware/auth';

const twoFactorAuth = new Hono<{ Bindings: Env }>();

// 应用认证中间件
twoFactorAuth.use('*', authMiddleware);

/**
 * 获取用户2FA状态
 */
twoFactorAuth.get('/status', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const status = await twoFactorService.getTwoFactorStatus(user.uuid);

    return c.json({
      success: true,
      data: status,
      message: '获取2FA状态成功'
    });

  } catch (error: any) {
    console.error('Get 2FA status error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取2FA状态失败'
    }, 500);
  }
});

/**
 * 设置双因素认证
 */
twoFactorAuth.post('/setup', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const { method, phoneNumber, emailAddress } = body;

    if (!method) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '请选择认证方式'
      }, 400);
    }

    // 验证方法特定的参数
    if (method === 'sms' && !phoneNumber) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '短信认证需要提供手机号码'
      }, 400);
    }

    if (method === 'email' && !emailAddress) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '邮箱认证需要提供邮箱地址'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const result = await twoFactorService.setupTwoFactor({
      userUuid: user.uuid,
      method,
      phoneNumber,
      emailAddress
    });

    if (result.success) {
      return c.json({
        success: true,
        data: {
          secretKey: result.secretKey,
          backupCodes: result.backupCodes,
          qrCodeUrl: result.qrCodeUrl
        },
        message: '2FA设置初始化成功'
      });
    } else {
      return c.json({
        success: false,
        error: 'Setup Failed',
        message: '2FA设置失败'
      }, 500);
    }

  } catch (error: any) {
    console.error('Setup 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '2FA设置失败'
    }, 500);
  }
});

/**
 * 验证双因素认证代码
 */
twoFactorAuth.post('/verify', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const { code, verificationType } = body;

    if (!code) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '请输入验证码'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const result = await twoFactorService.verifyTwoFactor({
      userUuid: user.uuid,
      code,
      method: 'totp', // 这里应该从用户设置中获取
      verificationType: verificationType || 'settings_change',
      ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown'
    });

    return c.json({
      success: result.success,
      data: result.isSetupComplete ? { isSetupComplete: true } : null,
      message: result.message
    });

  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '2FA验证失败'
    }, 500);
  }
});

/**
 * 禁用双因素认证
 */
twoFactorAuth.post('/disable', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const success = await twoFactorService.disableTwoFactor(user.uuid);

    if (success) {
      return c.json({
        success: true,
        message: '双因素认证已禁用'
      });
    } else {
      return c.json({
        success: false,
        error: 'Disable Failed',
        message: '禁用2FA失败'
      }, 500);
    }

  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '禁用2FA失败'
    }, 500);
  }
});

/**
 * 重新生成备用代码
 */
twoFactorAuth.post('/regenerate-backup-codes', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const newCodes = await twoFactorService.regenerateBackupCodes(user.uuid);

    if (newCodes) {
      return c.json({
        success: true,
        data: newCodes,
        message: '备用代码已重新生成'
      });
    } else {
      return c.json({
        success: false,
        error: 'Regenerate Failed',
        message: '重新生成备用代码失败'
      }, 500);
    }

  } catch (error: any) {
    console.error('Regenerate backup codes error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '重新生成备用代码失败'
    }, 500);
  }
});

/**
 * 检查是否需要2FA验证（内部API）
 */
twoFactorAuth.post('/check-requirement', async (c) => {
  try {
    const body = await c.req.json();
    const { userUuid, actionType } = body;

    if (!userUuid || !actionType) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    const required = await twoFactorService.requiresTwoFactor(userUuid, actionType);

    return c.json({
      success: true,
      data: { required },
      message: '2FA需求检查完成'
    });

  } catch (error: any) {
    console.error('Check 2FA requirement error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '2FA需求检查失败'
    }, 500);
  }
});

/**
 * 获取2FA验证历史
 */
twoFactorAuth.get('/verification-history', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '10');
    
    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);
    
    const history = await db.queryAll(`
      SELECT 
        id, verification_type as verificationType, method_used as methodUsed,
        is_successful as isSuccessful, failure_reason as failureReason,
        ip_address as ipAddress, created_at as createdAt
      FROM two_factor_verifications 
      WHERE user_uuid = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [user.uuid, limit]);

    return c.json({
      success: true,
      data: history,
      message: '获取2FA验证历史成功'
    });

  } catch (error: any) {
    console.error('Get 2FA history error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取2FA验证历史失败'
    }, 500);
  }
});

export { twoFactorAuth };

/**
 * 访问控制中间件
 * 在用户登录和关键操作时检查IP访问控制和时间限制
 */

import { createDatabaseService } from '../db';
import { IPAccessControlService } from '../services/ipAccessControlService';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';

/**
 * IP访问控制中间件
 */
export const ipAccessControlMiddleware = async (c: any, next: any) => {
  try {
    const ipAddress = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     c.req.header('X-Real-IP') || 
                     'unknown';
    
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const user = c.get('user');
    
    // 确定用户类型和功能类型
    const userType = user?.user_type || 'anonymous';
    const functionType = determineFunctionType(c.req.url, c.req.method);
    
    const db = createDatabaseService(c.env);
    const ipService = new IPAccessControlService(db);
    
    // 检查IP访问权限
    const accessResult = await ipService.checkAccess({
      ipAddress,
      userType,
      userUuid: user?.uuid,
      functionType,
      userAgent,
      timestamp: new Date().toISOString(),
      location: await getLocationFromIP(ipAddress) // 可以集成第三方IP地理位置服务
    });
    
    // 如果访问被阻止
    if (!accessResult.allowed && accessResult.action === 'block') {
      return c.json({
        success: false,
        error: 'Access Denied',
        message: accessResult.reason,
        code: 'IP_ACCESS_DENIED'
      }, 403);
    }
    
    // 如果是警告级别，记录但允许继续
    if (accessResult.action === 'warn') {
      console.warn(`IP Access Warning: ${accessResult.reason}`, {
        ipAddress,
        userType,
        userUuid: user?.uuid,
        functionType
      });
    }
    
    // 将访问检查结果添加到上下文
    c.set('accessCheck', accessResult);
    
    await next();
    
  } catch (error) {
    console.error('IP access control middleware error:', error);
    // 在出错时允许继续，但记录错误
    await next();
  }
};

/**
 * 双因素认证检查中间件
 */
export const twoFactorAuthMiddleware = async (c: any, next: any) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.uuid) {
      await next();
      return;
    }
    
    const functionType = determineFunctionType(c.req.url, c.req.method);
    
    // 只对特定操作要求2FA
    const requiresAuth = ['admin_action', 'settings_change'].includes(functionType);
    
    if (!requiresAuth) {
      await next();
      return;
    }
    
    const db = createDatabaseService(c.env);
    const twoFactorService = new TwoFactorAuthService(db);
    
    // 检查是否需要2FA
    const required = await twoFactorService.requiresTwoFactor(user.uuid, functionType);
    
    if (required) {
      // 检查请求头中是否包含2FA验证
      const twoFactorCode = c.req.header('X-2FA-Code');
      
      if (!twoFactorCode) {
        return c.json({
          success: false,
          error: 'Two Factor Required',
          message: '此操作需要双因素认证',
          code: 'TWO_FACTOR_REQUIRED'
        }, 401);
      }
      
      // 验证2FA代码
      const verifyResult = await twoFactorService.verifyTwoFactor({
        userUuid: user.uuid,
        code: twoFactorCode,
        method: 'totp', // 应该从用户设置中获取
        verificationType: functionType,
        ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
        userAgent: c.req.header('User-Agent') || 'unknown'
      });
      
      if (!verifyResult.success) {
        return c.json({
          success: false,
          error: 'Two Factor Failed',
          message: verifyResult.message,
          code: 'TWO_FACTOR_INVALID'
        }, 401);
      }
    }
    
    await next();
    
  } catch (error) {
    console.error('Two factor auth middleware error:', error);
    // 在出错时允许继续，但记录错误
    await next();
  }
};

/**
 * 访问时间限制中间件
 */
export const timeRestrictionMiddleware = async (c: any, next: any) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.uuid) {
      await next();
      return;
    }
    
    const db = createDatabaseService(c.env);
    
    // 获取适用的时间策略
    const policies = await db.queryAll(`
      SELECT 
        id, policy_name as policyName, allowed_hours as allowedHours,
        timezone, violation_action as violationAction
      FROM access_time_policies 
      WHERE is_active = 1 
        AND (user_types LIKE ? OR specific_users LIKE ?)
    `, [
      `%"${user.user_type}"%`,
      `%"${user.uuid}"%`
    ]);
    
    for (const policy of policies) {
      const allowedHours = JSON.parse(policy.allowedHours);
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM
      
      const daySchedule = allowedHours[dayOfWeek];
      if (!daySchedule || daySchedule.length === 0) {
        if (policy.violationAction === 'block') {
          return c.json({
            success: false,
            error: 'Time Restricted',
            message: `今天(${dayOfWeek})不允许访问`,
            code: 'TIME_RESTRICTION'
          }, 403);
        }
        continue;
      }
      
      let timeAllowed = false;
      for (const timeRange of daySchedule) {
        const [startTime, endTime] = timeRange.split('-');
        if (currentTime >= startTime && currentTime <= endTime) {
          timeAllowed = true;
          break;
        }
      }
      
      if (!timeAllowed && policy.violationAction === 'block') {
        return c.json({
          success: false,
          error: 'Time Restricted',
          message: `当前时间(${currentTime})不允许访问，允许时间: ${daySchedule.join(', ')}`,
          code: 'TIME_RESTRICTION'
        }, 403);
      }
    }
    
    await next();
    
  } catch (error) {
    console.error('Time restriction middleware error:', error);
    // 在出错时允许继续，但记录错误
    await next();
  }
};

/**
 * 组合访问控制中间件
 */
export const accessControlMiddleware = async (c: any, next: any) => {
  // 按顺序执行各种访问控制检查
  await ipAccessControlMiddleware(c, async () => {
    await timeRestrictionMiddleware(c, async () => {
      await twoFactorAuthMiddleware(c, next);
    });
  });
};

/**
 * 确定功能类型
 */
function determineFunctionType(url: string, method: string): string {
  if (url.includes('/auth/') || url.includes('/login')) {
    return 'login';
  }
  
  if (url.includes('/admin/') && method !== 'GET') {
    return 'admin_action';
  }
  
  if (url.includes('/user/') && (method === 'PUT' || method === 'POST' || method === 'DELETE')) {
    return 'settings_change';
  }
  
  if (url.includes('/api/')) {
    return 'api_access';
  }
  
  return 'general_access';
}

/**
 * 从IP地址获取地理位置信息
 */
async function getLocationFromIP(ipAddress: string): Promise<any> {
  // 简化实现，实际项目中可以集成第三方IP地理位置服务
  if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    return {
      country: 'Local',
      region: 'Private Network',
      city: 'Local'
    };
  }
  
  // 这里可以调用真实的IP地理位置API
  // 例如：ipapi.co, ipgeolocation.io, maxmind等
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown'
  };
}

/**
 * 速率限制中间件
 */
export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (c: any, next: any) => {
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    
    // 清理过期的记录
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
    
    // 获取或创建IP记录
    let ipData = requests.get(ipAddress);
    if (!ipData) {
      ipData = { count: 0, resetTime: now + windowMs };
      requests.set(ipAddress, ipData);
    }
    
    // 检查是否超过限制
    if (ipData.count >= maxRequests) {
      return c.json({
        success: false,
        error: 'Rate Limit Exceeded',
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT'
      }, 429);
    }
    
    // 增加计数
    ipData.count++;
    
    await next();
  };
};

/**
 * 用户登录历史API
 * 提供用户查看自己登录记录的接口
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { LoginRecordService } from '../services/loginRecordService';
import { authMiddleware } from '../middleware/auth';

const userLoginHistory = new Hono<{ Bindings: Env }>();

// 应用认证中间件
userLoginHistory.use('*', authMiddleware);

/**
 * 获取当前用户的登录历史
 */
userLoginHistory.get('/', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);
    const loginRecordService = new LoginRecordService(db);

    // 获取登录历史
    const history = await db.queryAll(`
      SELECT 
        id,
        login_time as loginTime,
        ip_address as ipAddress,
        ip_city as ipCity,
        ip_region as ipRegion,
        ip_country as ipCountry,
        device_type as deviceType,
        browser_name as browserName,
        os_name as osName,
        login_method as loginMethod,
        login_status as loginStatus,
        is_suspicious as isSuspicious,
        risk_score as riskScore,
        user_agent as userAgent
      FROM login_records 
      WHERE user_uuid = ? 
      ORDER BY login_time DESC 
      LIMIT ? OFFSET ?
    `, [user.uuid, limit, offset]);

    // 获取最后登录信息
    const lastLogin = await loginRecordService.getUserLastLogin(user.uuid);

    // 获取统计信息
    const stats = await db.queryFirst(`
      SELECT 
        COUNT(*) as totalLogins,
        COUNT(CASE WHEN login_status = 'success' THEN 1 END) as successfulLogins,
        COUNT(CASE WHEN login_status = 'failed' THEN 1 END) as failedLogins,
        COUNT(CASE WHEN is_suspicious = 1 THEN 1 END) as suspiciousLogins,
        COUNT(DISTINCT ip_address) as uniqueIps,
        COUNT(DISTINCT device_fingerprint) as uniqueDevices
      FROM login_records 
      WHERE user_uuid = ?
    `, [user.uuid]);

    // 获取最近30天的登录趋势
    const loginTrend = await db.queryAll(`
      SELECT 
        DATE(login_time) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN login_status = 'success' THEN 1 END) as successful
      FROM login_records 
      WHERE user_uuid = ? AND login_time > datetime('now', '-30 days')
      GROUP BY DATE(login_time)
      ORDER BY date DESC
    `, [user.uuid]);

    return c.json({
      success: true,
      data: {
        history,
        lastLogin,
        stats,
        loginTrend,
        pagination: {
          limit,
          offset,
          total: stats?.totalLogins || 0
        }
      },
      message: '获取登录历史成功'
    });

  } catch (error: any) {
    console.error('Get login history error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取登录历史失败'
    }, 500);
  }
});

/**
 * 获取登录记录详情
 */
userLoginHistory.get('/:recordId', async (c) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');

    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);

    // 获取登录记录详情
    const record = await db.queryFirst(`
      SELECT 
        id,
        login_time as loginTime,
        logout_time as logoutTime,
        session_duration as sessionDuration,
        ip_address as ipAddress,
        ip_country as ipCountry,
        ip_region as ipRegion,
        ip_city as ipCity,
        ip_isp as ipIsp,
        user_agent as userAgent,
        device_type as deviceType,
        browser_name as browserName,
        browser_version as browserVersion,
        os_name as osName,
        os_version as osVersion,
        device_fingerprint as deviceFingerprint,
        login_method as loginMethod,
        login_status as loginStatus,
        is_suspicious as isSuspicious,
        risk_score as riskScore,
        security_flags as securityFlags,
        google_email as googleEmail,
        oauth_scope as oauthScope,
        failure_reason as failureReason,
        metadata
      FROM login_records 
      WHERE id = ? AND user_uuid = ?
    `, [recordId, user.uuid]);

    if (!record) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '登录记录不存在'
      }, 404);
    }

    // 解析JSON字段
    try {
      record.metadata = record.metadata ? JSON.parse(record.metadata) : {};
      record.securityFlags = record.securityFlags ? JSON.parse(record.securityFlags) : {};
    } catch (e) {
      console.warn('Failed to parse JSON fields:', e);
    }

    return c.json({
      success: true,
      data: record,
      message: '获取登录记录详情成功'
    });

  } catch (error: any) {
    console.error('Get login record detail error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取登录记录详情失败'
    }, 500);
  }
});

/**
 * 标记可疑登录
 */
userLoginHistory.post('/:recordId/report', async (c) => {
  try {
    const user = c.get('user');
    const recordId = c.req.param('recordId');
    const body = await c.req.json();
    const { reason } = body;

    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);

    // 验证记录是否属于当前用户
    const record = await db.queryFirst(`
      SELECT id FROM login_records WHERE id = ? AND user_uuid = ?
    `, [recordId, user.uuid]);

    if (!record) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '登录记录不存在'
      }, 404);
    }

    // 更新记录为可疑
    await db.execute(`
      UPDATE login_records 
      SET is_suspicious = 1, 
          risk_score = CASE WHEN risk_score < 80 THEN 80 ELSE risk_score END,
          security_flags = json_set(
            COALESCE(security_flags, '{}'), 
            '$.userReported', 1,
            '$.reportReason', ?,
            '$.reportTime', ?
          )
      WHERE id = ?
    `, [reason || '用户举报', new Date().toISOString(), recordId]);

    // 记录安全事件
    await db.execute(`
      INSERT INTO security_events (
        id, event_type, user_uuid, description, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `security_${Date.now()}`,
      'suspicious_login_reported',
      user.uuid,
      '用户举报可疑登录',
      JSON.stringify({
        recordId,
        reason,
        reportedAt: new Date().toISOString()
      }),
      new Date().toISOString()
    ]);

    return c.json({
      success: true,
      message: '已标记为可疑登录，感谢您的反馈'
    });

  } catch (error: any) {
    console.error('Report suspicious login error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '标记可疑登录失败'
    }, 500);
  }
});

/**
 * 获取登录统计图表数据
 */
userLoginHistory.get('/stats/chart', async (c) => {
  try {
    const user = c.get('user');
    const days = parseInt(c.req.query('days') || '30');

    if (!user || !user.uuid) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '用户未登录'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);

    // 获取登录趋势数据
    const loginTrend = await db.queryAll(`
      SELECT 
        DATE(login_time) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN login_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN login_status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN is_suspicious = 1 THEN 1 END) as suspicious
      FROM login_records 
      WHERE user_uuid = ? AND login_time > datetime('now', '-' || ? || ' days')
      GROUP BY DATE(login_time)
      ORDER BY date ASC
    `, [user.uuid, days]);

    // 获取设备类型分布
    const deviceDistribution = await db.queryAll(`
      SELECT 
        device_type,
        COUNT(*) as count
      FROM login_records 
      WHERE user_uuid = ? AND login_time > datetime('now', '-' || ? || ' days')
      GROUP BY device_type
    `, [user.uuid, days]);

    // 获取登录方式分布
    const methodDistribution = await db.queryAll(`
      SELECT 
        login_method,
        COUNT(*) as count
      FROM login_records 
      WHERE user_uuid = ? AND login_time > datetime('now', '-' || ? || ' days')
      GROUP BY login_method
    `, [user.uuid, days]);

    return c.json({
      success: true,
      data: {
        loginTrend,
        deviceDistribution,
        methodDistribution
      },
      message: '获取统计数据成功'
    });

  } catch (error: any) {
    console.error('Get login stats error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取统计数据失败'
    }, 500);
  }
});

export { userLoginHistory };

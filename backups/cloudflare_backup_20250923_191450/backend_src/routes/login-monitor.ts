/**
 * 登录监控API路由
 * 监控用户登录活动、检测异常登录、生成安全报告
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';
import { securityValidation, validatePathParams, validateRequestBody, validateQueryParams, commonValidationRules } from '../middleware/validation';
import { securityCheck } from '../middleware/security';

const loginMonitor = new Hono<{ Bindings: Env }>();

// 应用安全中间件
loginMonitor.use('*', securityCheck);
loginMonitor.use('*', securityValidation);
loginMonitor.use('*', authMiddleware);

// 管理员权限检查中间件
const adminOnly = async (c: any, next: any) => {
  const user = c.get('user');

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({
      success: false,
      error: 'Forbidden',
      message: '仅管理员可以访问此功能'
    }, 403);
  }

  await next();
};

loginMonitor.use('*', adminOnly);

/**
 * 获取登录记录
 */
loginMonitor.get('/records', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const status = c.req.query('status');
    const timeRange = c.req.query('timeRange') || '24h';
    const userId = c.req.query('userId');

    // 模拟登录记录数据
    const records = Array.from({ length: pageSize }, (_, i) => ({
      id: i + 1,
      userId: userId || `user_${Math.floor(Math.random() * 1000)}`,
      username: `user${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: {
        country: '中国',
        region: ['北京', '上海', '广州', '深圳'][Math.floor(Math.random() * 4)],
        city: ['朝阳区', '浦东新区', '天河区', '南山区'][Math.floor(Math.random() * 4)]
      },
      device: {
        type: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        os: ['Windows 10', 'iOS 15', 'Android 12'][Math.floor(Math.random() * 3)],
        browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
      },
      status: status || ['success', 'failed', 'blocked'][Math.floor(Math.random() * 3)],
      loginTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      sessionDuration: Math.floor(Math.random() * 7200), // 秒
      riskScore: Math.random(),
      riskFactors: Math.random() > 0.7 ? ['unusual_location', 'new_device'] : [],
      mfaUsed: Math.random() > 0.5,
      notes: Math.random() > 0.8 ? '检测到异常登录模式' : ''
    }));

    return c.json({
      success: true,
      data: {
        items: records,
        pagination: {
          page,
          pageSize,
          total: 5000,
          totalPages: Math.ceil(5000 / pageSize)
        },
        summary: {
          totalLogins: 5000,
          successfulLogins: 4650,
          failedLogins: 280,
          blockedLogins: 70,
          averageSessionDuration: 1850,
          uniqueUsers: 1250,
          uniqueIPs: 890
        }
      },
      message: '登录记录获取成功'
    });
  } catch (error) {
    console.error('获取登录记录失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取登录记录失败'
    }, 500);
  }
});

/**
 * 获取登录告警
 */
loginMonitor.get('/alerts', async (c) => {
  try {
    const severity = c.req.query('severity');
    const status = c.req.query('status');

    const alerts = [
      {
        id: 1,
        type: 'suspicious_login',
        severity: 'high',
        title: '可疑登录检测',
        description: '检测到来自异常地理位置的登录尝试',
        userId: 'user_123',
        username: 'john_doe',
        ip: '192.168.1.100',
        location: '未知地区',
        timestamp: '2024-01-01T12:00:00Z',
        status: 'active',
        actions: ['block_ip', 'notify_user', 'require_mfa'],
        riskScore: 0.85,
        evidence: [
          '登录地点与历史记录相差超过1000公里',
          '使用了未知设备',
          '登录时间异常（凌晨2点）'
        ]
      },
      {
        id: 2,
        type: 'brute_force',
        severity: 'critical',
        title: '暴力破解攻击',
        description: '检测到针对多个账户的暴力破解尝试',
        ip: '10.0.0.50',
        targetAccounts: ['user_123', 'user_456', 'user_789'],
        attemptCount: 156,
        timestamp: '2024-01-01T11:30:00Z',
        status: 'mitigated',
        actions: ['auto_ban', 'alert_admin', 'block_subnet'],
        riskScore: 0.95,
        evidence: [
          '短时间内尝试多个账户',
          '使用字典攻击模式',
          'IP地址来自已知恶意网段'
        ]
      },
      {
        id: 3,
        type: 'account_takeover',
        severity: 'high',
        title: '账户接管尝试',
        description: '检测到可能的账户接管行为',
        userId: 'user_456',
        username: 'jane_smith',
        ip: '203.0.113.50',
        timestamp: '2024-01-01T10:15:00Z',
        status: 'investigating',
        actions: ['lock_account', 'notify_user', 'manual_review'],
        riskScore: 0.78,
        evidence: [
          '密码修改后立即从新地点登录',
          '修改了关键个人信息',
          '异常的API调用模式'
        ]
      }
    ];

    // 过滤告警
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }

    return c.json({
      success: true,
      data: filteredAlerts,
      summary: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
        investigating: alerts.filter(a => a.status === 'investigating').length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      },
      message: '登录告警获取成功'
    });
  } catch (error) {
    console.error('获取登录告警失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取登录告警失败'
    }, 500);
  }
});

/**
 * 获取登录监控图表数据
 */
loginMonitor.get('/charts', async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '7d';
    const chartType = c.req.query('type') || 'all';
    
    const chartData = {
      loginTrends: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        successful: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 20) + 5,
        blocked: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString()
      })),
      
      locationDistribution: [
        { location: '北京', count: 1250, percentage: 35.2, risk: 'low' },
        { location: '上海', count: 890, percentage: 25.1, risk: 'low' },
        { location: '广州', count: 567, percentage: 16.0, risk: 'low' },
        { location: '深圳', count: 423, percentage: 11.9, risk: 'low' },
        { location: '未知地区', count: 120, percentage: 3.4, risk: 'high' },
        { location: '其他', count: 300, percentage: 8.4, risk: 'medium' }
      ],
      
      deviceTypes: [
        { device: 'Desktop', count: 2100, percentage: 59.2, risk: 'low' },
        { device: 'Mobile', count: 1200, percentage: 33.8, risk: 'low' },
        { device: 'Tablet', count: 250, percentage: 7.0, risk: 'medium' }
      ],
      
      riskScoreDistribution: [
        { range: '0.0-0.2', count: 2800, label: '低风险', color: '#52c41a' },
        { range: '0.2-0.5', count: 450, label: '中低风险', color: '#faad14' },
        { range: '0.5-0.8', count: 200, label: '中高风险', color: '#fa8c16' },
        { range: '0.8-1.0', count: 100, label: '高风险', color: '#f5222d' }
      ],
      
      timePatterns: {
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          loginCount: Math.floor(Math.random() * 200) + 50,
          riskLevel: i >= 22 || i <= 6 ? 'high' : 'low'
        })),
        weekly: Array.from({ length: 7 }, (_, i) => ({
          day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
          loginCount: Math.floor(Math.random() * 800) + 200,
          riskLevel: i >= 5 ? 'medium' : 'low'
        }))
      },
      
      failureReasons: [
        { reason: '密码错误', count: 180, percentage: 64.3 },
        { reason: 'MFA验证失败', count: 45, percentage: 16.1 },
        { reason: '账户锁定', count: 30, percentage: 10.7 },
        { reason: 'IP被封禁', count: 15, percentage: 5.4 },
        { reason: '其他', count: 10, percentage: 3.5 }
      ]
    };

    // 根据请求的图表类型返回相应数据
    if (chartType !== 'all') {
      return c.json({
        success: true,
        data: chartData[chartType] || {},
        message: `${chartType}图表数据获取成功`
      });
    }

    return c.json({
      success: true,
      data: chartData,
      message: '登录监控图表数据获取成功'
    });
  } catch (error) {
    console.error('获取登录监控图表数据失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取登录监控图表数据失败'
    }, 500);
  }
});

/**
 * 更新告警状态
 */
loginMonitor.put('/alerts/:alertId',
  validatePathParams({ alertId: commonValidationRules.numericId }),
  validateRequestBody({
    status: {
      type: 'safe-string',
      pattern: /^(active|investigating|resolved|false_positive)$/,
      required: true
    },
    notes: { type: 'string', maxLength: 1000, required: false },
    assignedTo: { type: 'string', maxLength: 100, required: false }
  }),
  async (c) => {
  try {
    const alertId = c.req.param('alertId');
    const { status, notes, assignedTo } = c.get('validatedBody');

    return c.json({
      success: true,
      data: {
        alertId: parseInt(alertId),
        status,
        notes,
        assignedTo,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current_admin@example.com'
      },
      message: '告警状态更新成功'
    });
  } catch (error) {
    console.error('更新告警状态失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '更新告警状态失败'
    }, 500);
  }
});

export { loginMonitor };
export default loginMonitor;

/**
 * IP访问控制API路由
 * 管理IP白名单、黑名单和访问时间限制
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { IPAccessControlService } from '../services/ipAccessControlService';
import { authMiddleware } from '../middleware/auth';
import { securityValidation, validatePathParams, validateRequestBody, validateQueryParams, commonValidationRules } from '../middleware/validation';
import { securityCheck } from '../middleware/security';

const ipAccessControl = new Hono<{ Bindings: Env }>();

// 应用安全中间件
ipAccessControl.use('*', securityCheck);
ipAccessControl.use('*', securityValidation);
ipAccessControl.use('*', authMiddleware);

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

ipAccessControl.use('*', adminOnly);

/**
 * 获取IP访问规则列表
 */
ipAccessControl.get('/rules', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    const ipService = new IPAccessControlService(db);
    
    const rules = await ipService.getIPRules();
    
    return c.json({
      success: true,
      data: rules,
      message: '获取IP访问规则成功'
    });

  } catch (error: any) {
    console.error('Get IP rules error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取IP访问规则失败'
    }, 500);
  }
});

/**
 * 添加IP访问规则
 */
ipAccessControl.post('/rules', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');
    
    const {
      ruleType, ipAddress, ipRange, countryCode, region,
      description, rulePriority, isActive, appliesToUserTypes,
      appliesToFunctions, expiresAt
    } = body;

    if (!ruleType || !description) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '规则类型和描述不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const ipService = new IPAccessControlService(db);
    
    const ruleId = await ipService.addIPRule({
      ruleType,
      ipAddress,
      ipRange,
      countryCode,
      region,
      description,
      rulePriority: rulePriority || 100,
      isActive: isActive !== false,
      appliesToUserTypes: appliesToUserTypes || [],
      appliesToFunctions: appliesToFunctions || [],
      createdBy: user.id,
      expiresAt
    });

    return c.json({
      success: true,
      data: { id: ruleId },
      message: '添加IP访问规则成功'
    });

  } catch (error: any) {
    console.error('Add IP rule error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '添加IP访问规则失败'
    }, 500);
  }
});

/**
 * 更新IP访问规则
 */
ipAccessControl.put('/rules/:id', async (c) => {
  try {
    const ruleId = c.req.param('id');
    const body = await c.req.json();
    
    const {
      ruleType, ipAddress, ipRange, countryCode, region,
      description, rulePriority, isActive, appliesToUserTypes,
      appliesToFunctions, expiresAt
    } = body;

    const db = createDatabaseService(c.env as Env);
    
    // 检查规则是否存在
    const existing = await db.queryFirst(
      'SELECT id FROM ip_access_rules WHERE id = ?',
      [ruleId]
    );

    if (!existing) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'IP访问规则不存在'
      }, 404);
    }

    // 更新规则
    await db.execute(`
      UPDATE ip_access_rules 
      SET rule_type = ?, ip_address = ?, ip_range = ?, country_code = ?,
          region = ?, description = ?, rule_priority = ?, is_active = ?,
          applies_to_user_types = ?, applies_to_functions = ?, expires_at = ?
      WHERE id = ?
    `, [
      ruleType, ipAddress, ipRange, countryCode, region, description,
      rulePriority, isActive, JSON.stringify(appliesToUserTypes || []),
      JSON.stringify(appliesToFunctions || []), expiresAt, ruleId
    ]);

    return c.json({
      success: true,
      message: '更新IP访问规则成功'
    });

  } catch (error: any) {
    console.error('Update IP rule error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '更新IP访问规则失败'
    }, 500);
  }
});

/**
 * 删除IP访问规则
 */
ipAccessControl.delete('/rules/:id', async (c) => {
  try {
    const ruleId = c.req.param('id');
    const db = createDatabaseService(c.env as Env);
    const ipService = new IPAccessControlService(db);
    
    await ipService.deleteIPRule(ruleId);

    return c.json({
      success: true,
      message: '删除IP访问规则成功'
    });

  } catch (error: any) {
    console.error('Delete IP rule error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '删除IP访问规则失败'
    }, 500);
  }
});

/**
 * 获取访问时间策略列表
 */
ipAccessControl.get('/time-policies', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    
    const policies = await db.queryAll(`
      SELECT 
        id, policy_name as policyName, description, user_types as userTypes,
        specific_users as specificUsers, allowed_hours as allowedHours,
        timezone, emergency_override as emergencyOverride,
        violation_action as violationAction, max_violations_per_day as maxViolationsPerDay,
        is_active as isActive, created_by as createdBy, created_at as createdAt
      FROM access_time_policies 
      ORDER BY created_at DESC
    `);

    const formattedPolicies = policies.map(policy => ({
      ...policy,
      userTypes: JSON.parse(policy.userTypes || '[]'),
      specificUsers: JSON.parse(policy.specificUsers || '[]'),
      allowedHours: JSON.parse(policy.allowedHours || '{}')
    }));

    return c.json({
      success: true,
      data: formattedPolicies,
      message: '获取访问时间策略成功'
    });

  } catch (error: any) {
    console.error('Get time policies error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取访问时间策略失败'
    }, 500);
  }
});

/**
 * 获取统计数据
 */
ipAccessControl.get('/stats', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    
    // 获取规则统计
    const ruleStats = await db.queryFirst(`
      SELECT 
        COUNT(*) as totalRules,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeRules,
        COUNT(CASE WHEN rule_type = 'whitelist' THEN 1 END) as whitelistRules,
        COUNT(CASE WHEN rule_type = 'blacklist' THEN 1 END) as blacklistRules
      FROM ip_access_rules
    `);

    // 获取近期违规统计
    const violationStats = await db.queryFirst(`
      SELECT COUNT(*) as recentViolations
      FROM access_violations 
      WHERE created_at > datetime('now', '-7 days')
    `);

    const stats = {
      ...ruleStats,
      recentViolations: violationStats?.recentViolations || 0
    };

    return c.json({
      success: true,
      data: stats,
      message: '获取统计数据成功'
    });

  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取统计数据失败'
    }, 500);
  }
});

/**
 * 获取访问违规记录
 */
ipAccessControl.get('/violations', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const db = createDatabaseService(c.env as Env);
    
    const violations = await db.queryAll(`
      SELECT 
        id, violation_type as violationType, user_uuid as userUuid,
        ip_address as ipAddress, user_agent as userAgent, description,
        rule_triggered as ruleTriggered, severity, action_taken as actionTaken,
        is_resolved as isResolved, resolved_by as resolvedBy,
        resolved_at as resolvedAt, resolution_notes as resolutionNotes,
        created_at as createdAt
      FROM access_violations 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return c.json({
      success: true,
      data: violations,
      message: '获取访问违规记录成功'
    });

  } catch (error: any) {
    console.error('Get violations error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取访问违规记录失败'
    }, 500);
  }
});

/**
 * 检查IP访问权限（内部API）
 */
ipAccessControl.post('/check-access', async (c) => {
  try {
    const body = await c.req.json();
    const {
      ipAddress, userType, userUuid, functionType, userAgent, location
    } = body;

    if (!ipAddress || !userType || !functionType) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const ipService = new IPAccessControlService(db);
    
    const result = await ipService.checkAccess({
      ipAddress,
      userType,
      userUuid,
      functionType,
      userAgent,
      timestamp: new Date().toISOString(),
      location
    });

    return c.json({
      success: true,
      data: result,
      message: '访问权限检查完成'
    });

  } catch (error: any) {
    console.error('Check access error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '访问权限检查失败'
    }, 500);
  }
});

export { ipAccessControl };

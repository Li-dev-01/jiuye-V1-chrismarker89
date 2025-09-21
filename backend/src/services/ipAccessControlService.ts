/**
 * IP访问控制服务
 * 处理IP白名单、黑名单、地理位置限制等访问控制逻辑
 */

import { generateUUID } from '../utils/uuid';

export interface IPAccessRule {
  id: string;
  ruleType: 'whitelist' | 'blacklist' | 'greylist';
  ipAddress?: string;
  ipRange?: string;
  countryCode?: string;
  region?: string;
  description: string;
  rulePriority: number;
  isActive: boolean;
  appliesToUserTypes: string[];
  appliesToFunctions: string[];
  timeRestrictions?: any;
  createdBy: string;
  expiresAt?: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  ruleTriggered?: string;
  action: 'allow' | 'block' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessContext {
  ipAddress: string;
  userType: string;
  userUuid?: string;
  functionType: string; // 'login', 'api_access', 'admin_action'
  userAgent?: string;
  timestamp: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export class IPAccessControlService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 检查IP访问权限
   */
  async checkAccess(context: AccessContext): Promise<AccessCheckResult> {
    try {
      // 1. 获取适用的访问规则
      const rules = await this.getApplicableRules(context);
      
      // 2. 按优先级排序规则
      rules.sort((a, b) => a.rulePriority - b.rulePriority);
      
      // 3. 逐一检查规则
      for (const rule of rules) {
        const result = await this.evaluateRule(rule, context);
        if (result.action !== 'allow') {
          // 记录违规
          await this.recordViolation(context, rule, result);
          return result;
        }
      }
      
      // 4. 检查时间限制
      const timeCheck = await this.checkTimeRestrictions(context);
      if (!timeCheck.allowed) {
        await this.recordViolation(context, null, timeCheck);
        return timeCheck;
      }
      
      // 5. 默认允许访问
      return {
        allowed: true,
        reason: 'Access granted',
        action: 'allow',
        severity: 'low'
      };
      
    } catch (error) {
      console.error('Access check error:', error);
      return {
        allowed: false,
        reason: 'Access check failed',
        action: 'block',
        severity: 'high'
      };
    }
  }

  /**
   * 获取适用的访问规则
   */
  private async getApplicableRules(context: AccessContext): Promise<any[]> {
    const rules = await this.db.queryAll(`
      SELECT 
        id, rule_type as ruleType, ip_address as ipAddress, ip_range as ipRange,
        country_code as countryCode, region, description, rule_priority as rulePriority,
        is_active as isActive, applies_to_user_types as appliesToUserTypes,
        applies_to_functions as appliesToFunctions, time_restrictions as timeRestrictions,
        created_by as createdBy, expires_at as expiresAt
      FROM ip_access_rules 
      WHERE is_active = 1 
        AND (expires_at IS NULL OR expires_at > ?)
        AND (applies_to_user_types LIKE ? OR applies_to_user_types = '[]')
        AND (applies_to_functions LIKE ? OR applies_to_functions = '[]')
      ORDER BY rule_priority ASC
    `, [
      new Date().toISOString(),
      `%"${context.userType}"%`,
      `%"${context.functionType}"%`
    ]);

    return rules.map(rule => ({
      ...rule,
      appliesToUserTypes: JSON.parse(rule.appliesToUserTypes || '[]'),
      appliesToFunctions: JSON.parse(rule.appliesToFunctions || '[]'),
      timeRestrictions: rule.timeRestrictions ? JSON.parse(rule.timeRestrictions) : null
    }));
  }

  /**
   * 评估单个规则
   */
  private async evaluateRule(rule: any, context: AccessContext): Promise<AccessCheckResult> {
    // 检查IP地址匹配
    if (rule.ipAddress && rule.ipAddress !== context.ipAddress) {
      return { allowed: true, reason: 'IP not matched', action: 'allow', severity: 'low' };
    }

    // 检查IP范围匹配
    if (rule.ipRange && !this.isIPInRange(context.ipAddress, rule.ipRange)) {
      return { allowed: true, reason: 'IP range not matched', action: 'allow', severity: 'low' };
    }

    // 检查地理位置匹配
    if (rule.countryCode && context.location?.country !== rule.countryCode) {
      return { allowed: true, reason: 'Country not matched', action: 'allow', severity: 'low' };
    }

    // 更新规则命中统计
    await this.updateRuleHitCount(rule.id);

    // 根据规则类型返回结果
    switch (rule.ruleType) {
      case 'whitelist':
        return {
          allowed: true,
          reason: `IP whitelisted: ${rule.description}`,
          ruleTriggered: rule.id,
          action: 'allow',
          severity: 'low'
        };

      case 'blacklist':
        return {
          allowed: false,
          reason: `IP blacklisted: ${rule.description}`,
          ruleTriggered: rule.id,
          action: 'block',
          severity: 'high'
        };

      case 'greylist':
        return {
          allowed: true,
          reason: `IP greylisted: ${rule.description}`,
          ruleTriggered: rule.id,
          action: 'warn',
          severity: 'medium'
        };

      default:
        return { allowed: true, reason: 'Unknown rule type', action: 'allow', severity: 'low' };
    }
  }

  /**
   * 检查时间限制
   */
  private async checkTimeRestrictions(context: AccessContext): Promise<AccessCheckResult> {
    const policies = await this.db.queryAll(`
      SELECT 
        id, policy_name as policyName, allowed_hours as allowedHours,
        timezone, violation_action as violationAction
      FROM access_time_policies 
      WHERE is_active = 1 
        AND (user_types LIKE ? OR specific_users LIKE ?)
    `, [
      `%"${context.userType}"%`,
      context.userUuid ? `%"${context.userUuid}"% ` : '%'
    ]);

    for (const policy of policies) {
      const allowedHours = JSON.parse(policy.allowedHours);
      const now = new Date(context.timestamp);
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM

      const daySchedule = allowedHours[dayOfWeek];
      if (!daySchedule || daySchedule.length === 0) {
        return {
          allowed: false,
          reason: `Access not allowed on ${dayOfWeek}`,
          ruleTriggered: policy.id,
          action: policy.violationAction === 'warn' ? 'warn' : 'block',
          severity: 'medium'
        };
      }

      let timeAllowed = false;
      for (const timeRange of daySchedule) {
        const [startTime, endTime] = timeRange.split('-');
        if (currentTime >= startTime && currentTime <= endTime) {
          timeAllowed = true;
          break;
        }
      }

      if (!timeAllowed) {
        return {
          allowed: false,
          reason: `Access not allowed at ${currentTime} on ${dayOfWeek}`,
          ruleTriggered: policy.id,
          action: policy.violationAction === 'warn' ? 'warn' : 'block',
          severity: 'medium'
        };
      }
    }

    return {
      allowed: true,
      reason: 'Time restrictions passed',
      action: 'allow',
      severity: 'low'
    };
  }

  /**
   * 记录访问违规
   */
  private async recordViolation(
    context: AccessContext, 
    rule: any, 
    result: AccessCheckResult
  ): Promise<void> {
    const violationId = generateUUID('violation');
    
    await this.db.execute(`
      INSERT INTO access_violations (
        id, violation_type, user_uuid, ip_address, user_agent,
        description, rule_triggered, severity, action_taken
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      violationId,
      this.getViolationType(result),
      context.userUuid || null,
      context.ipAddress,
      context.userAgent || null,
      result.reason,
      result.ruleTriggered || null,
      result.severity,
      result.action
    ]);
  }

  /**
   * 更新规则命中统计
   */
  private async updateRuleHitCount(ruleId: string): Promise<void> {
    await this.db.execute(`
      UPDATE ip_access_rules 
      SET hit_count = hit_count + 1, last_hit_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [ruleId]);
  }

  /**
   * 检查IP是否在指定范围内
   */
  private isIPInRange(ip: string, range: string): boolean {
    // 简化的CIDR检查实现
    // 实际项目中应该使用专业的IP地址库
    try {
      if (!range.includes('/')) {
        return ip === range;
      }

      const [network, prefixLength] = range.split('/');
      const prefix = parseInt(prefixLength);
      
      // 这里应该实现真正的CIDR匹配逻辑
      // 为了演示，我们只做简单的前缀匹配
      const networkParts = network.split('.');
      const ipParts = ip.split('.');
      
      const bytesToCheck = Math.floor(prefix / 8);
      for (let i = 0; i < bytesToCheck; i++) {
        if (networkParts[i] !== ipParts[i]) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('IP range check error:', error);
      return false;
    }
  }

  /**
   * 获取违规类型
   */
  private getViolationType(result: AccessCheckResult): string {
    if (result.reason.includes('blacklist')) return 'ip_blocked';
    if (result.reason.includes('time')) return 'time_restricted';
    if (result.reason.includes('location')) return 'location_blocked';
    return 'suspicious_activity';
  }

  /**
   * 添加IP访问规则
   */
  async addIPRule(rule: Omit<IPAccessRule, 'id'>): Promise<string> {
    const ruleId = generateUUID('ip_rule');
    
    await this.db.execute(`
      INSERT INTO ip_access_rules (
        id, rule_type, ip_address, ip_range, country_code, region,
        description, rule_priority, is_active, applies_to_user_types,
        applies_to_functions, created_by, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ruleId, rule.ruleType, rule.ipAddress, rule.ipRange,
      rule.countryCode, rule.region, rule.description, rule.rulePriority,
      rule.isActive, JSON.stringify(rule.appliesToUserTypes),
      JSON.stringify(rule.appliesToFunctions), rule.createdBy, rule.expiresAt
    ]);

    return ruleId;
  }

  /**
   * 获取IP访问规则列表
   */
  async getIPRules(filters?: any): Promise<any[]> {
    let query = `
      SELECT 
        id, rule_type as ruleType, ip_address as ipAddress, ip_range as ipRange,
        country_code as countryCode, region, description, rule_priority as rulePriority,
        is_active as isActive, applies_to_user_types as appliesToUserTypes,
        applies_to_functions as appliesToFunctions, created_by as createdBy,
        created_at as createdAt, expires_at as expiresAt, hit_count as hitCount,
        last_hit_at as lastHitAt
      FROM ip_access_rules 
      ORDER BY rule_priority ASC, created_at DESC
    `;

    const rules = await this.db.queryAll(query);
    
    return rules.map(rule => ({
      ...rule,
      appliesToUserTypes: JSON.parse(rule.appliesToUserTypes || '[]'),
      appliesToFunctions: JSON.parse(rule.appliesToFunctions || '[]')
    }));
  }

  /**
   * 删除IP访问规则
   */
  async deleteIPRule(ruleId: string): Promise<void> {
    await this.db.execute('DELETE FROM ip_access_rules WHERE id = ?', [ruleId]);
  }
}



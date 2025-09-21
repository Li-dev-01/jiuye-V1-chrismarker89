/**
 * 自动化安全响应服务
 * 基于规则的自动安全响应和事件处理
 */

import { generateUUID } from '../utils/uuid';

export interface SecurityEvent {
  eventId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userUuid?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  details: any;
  timestamp: string;
}

export interface ResponseRule {
  id: string;
  ruleName: string;
  description: string;
  triggerConditions: any;
  triggerThreshold: number;
  responseActions: string[];
  escalationRules?: any;
  appliesToUserTypes: string[];
  appliesToThreatTypes: string[];
  isActive: boolean;
  priority: number;
}

export interface ResponseAction {
  actionType: string;
  parameters: any;
  executedAt: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface AutomatedResponse {
  responseId: string;
  eventId: string;
  ruleId: string;
  actions: ResponseAction[];
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  executionTime: number;
  escalated: boolean;
  manualReviewRequired: boolean;
}

export class AutomatedResponseService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 处理安全事件
   */
  async handleSecurityEvent(event: SecurityEvent): Promise<AutomatedResponse | null> {
    try {
      // 1. 查找适用的响应规则
      const applicableRules = await this.findApplicableRules(event);
      
      if (applicableRules.length === 0) {
        console.log(`No applicable rules found for event ${event.eventId}`);
        return null;
      }

      // 2. 按优先级排序规则
      applicableRules.sort((a, b) => a.priority - b.priority);

      // 3. 执行第一个匹配的规则
      const rule = applicableRules[0];
      const response = await this.executeRule(event, rule);

      // 4. 记录响应结果
      await this.recordResponse(response);

      // 5. 检查是否需要升级
      if (response.failedActions > 0 || this.shouldEscalate(event, rule, response)) {
        await this.escalateEvent(event, response);
      }

      return response;

    } catch (error) {
      console.error('Automated response error:', error);
      return null;
    }
  }

  /**
   * 查找适用的响应规则
   */
  private async findApplicableRules(event: SecurityEvent): Promise<ResponseRule[]> {
    const rules = await this.db.queryAll(`
      SELECT 
        id, rule_name as ruleName, description, trigger_conditions as triggerConditions,
        trigger_threshold as triggerThreshold, response_actions as responseActions,
        escalation_rules as escalationRules, applies_to_user_types as appliesToUserTypes,
        applies_to_threat_types as appliesToThreatTypes, is_active as isActive,
        priority
      FROM automated_response_rules 
      WHERE is_active = 1
      ORDER BY priority ASC
    `);

    const applicableRules: ResponseRule[] = [];

    for (const rule of rules) {
      const parsedRule: ResponseRule = {
        ...rule,
        triggerConditions: JSON.parse(rule.triggerConditions || '{}'),
        responseActions: JSON.parse(rule.responseActions || '[]'),
        escalationRules: JSON.parse(rule.escalationRules || '{}'),
        appliesToUserTypes: JSON.parse(rule.appliesToUserTypes || '[]'),
        appliesToThreatTypes: JSON.parse(rule.appliesToThreatTypes || '[]')
      };

      if (await this.ruleMatches(event, parsedRule)) {
        applicableRules.push(parsedRule);
      }
    }

    return applicableRules;
  }

  /**
   * 检查规则是否匹配事件
   */
  private async ruleMatches(event: SecurityEvent, rule: ResponseRule): Promise<boolean> {
    // 检查威胁类型匹配
    if (rule.appliesToThreatTypes.length > 0 && 
        !rule.appliesToThreatTypes.includes(event.eventType)) {
      return false;
    }

    // 检查严重程度阈值
    const severityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const eventSeverity = severityLevels[event.severity];
    const ruleSeverity = severityLevels[rule.triggerConditions.minSeverity || 'low'];
    
    if (eventSeverity < ruleSeverity) {
      return false;
    }

    // 检查特定条件
    const conditions = rule.triggerConditions;
    
    // IP地址条件
    if (conditions.ipPatterns) {
      const ipMatches = conditions.ipPatterns.some((pattern: string) => 
        this.matchesPattern(event.ipAddress, pattern)
      );
      if (!ipMatches) return false;
    }

    // 用户类型条件
    if (rule.appliesToUserTypes.length > 0 && event.userUuid) {
      // 这里需要查询用户类型，简化处理
      // 实际实现中应该查询用户数据库
    }

    // 频率条件
    if (conditions.frequency) {
      const recentEvents = await this.getRecentEvents(
        event.eventType, 
        event.ipAddress, 
        conditions.frequency.timeWindow
      );
      
      if (recentEvents < conditions.frequency.threshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * 执行响应规则
   */
  private async executeRule(event: SecurityEvent, rule: ResponseRule): Promise<AutomatedResponse> {
    const responseId = generateUUID('response');
    const startTime = Date.now();
    const actions: ResponseAction[] = [];

    for (const actionType of rule.responseActions) {
      const action = await this.executeAction(actionType, event, rule);
      actions.push(action);
    }

    const executionTime = Date.now() - startTime;
    const successfulActions = actions.filter(a => a.success).length;
    const failedActions = actions.length - successfulActions;

    return {
      responseId,
      eventId: event.eventId,
      ruleId: rule.id,
      actions,
      totalActions: actions.length,
      successfulActions,
      failedActions,
      executionTime,
      escalated: false,
      manualReviewRequired: this.requiresManualReview(event, rule, actions)
    };
  }

  /**
   * 执行单个响应动作
   */
  private async executeAction(
    actionType: string, 
    event: SecurityEvent, 
    rule: ResponseRule
  ): Promise<ResponseAction> {
    const executedAt = new Date().toISOString();
    
    try {
      let result: any = null;

      switch (actionType) {
        case 'block_ip':
          result = await this.blockIP(event.ipAddress);
          break;
          
        case 'block_session':
          if (event.sessionId) {
            result = await this.blockSession(event.sessionId);
          }
          break;
          
        case 'require_2fa':
          if (event.userUuid) {
            result = await this.require2FA(event.userUuid);
          }
          break;
          
        case 'alert_admin':
          result = await this.alertAdmin(event, rule);
          break;
          
        case 'log_incident':
          result = await this.logIncident(event, rule);
          break;
          
        case 'quarantine_user':
          if (event.userUuid) {
            result = await this.quarantineUser(event.userUuid);
          }
          break;
          
        case 'increase_monitoring':
          result = await this.increaseMonitoring(event);
          break;
          
        case 'send_notification':
          result = await this.sendNotification(event, rule);
          break;
          
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      return {
        actionType,
        parameters: { event, rule },
        executedAt,
        success: true,
        result
      };

    } catch (error: any) {
      return {
        actionType,
        parameters: { event, rule },
        executedAt,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 响应动作实现
   */
  private async blockIP(ipAddress: string): Promise<any> {
    // 添加IP到黑名单
    const ruleId = generateUUID('ip_rule');
    
    await this.db.execute(`
      INSERT INTO ip_access_rules (
        id, rule_type, ip_address, description, rule_priority,
        is_active, applies_to_user_types, applies_to_functions,
        created_by, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ruleId, 'blacklist', ipAddress, 'Auto-blocked by security system',
      1, true, JSON.stringify(['all']), JSON.stringify(['all']),
      'automated_system', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    ]);

    return { ruleId, action: 'IP blocked for 24 hours' };
  }

  private async blockSession(sessionId: string): Promise<any> {
    // 标记会话为已阻止
    await this.db.execute(`
      UPDATE user_sessions 
      SET status = 'blocked', blocked_at = CURRENT_TIMESTAMP 
      WHERE session_id = ?
    `, [sessionId]);

    return { sessionId, action: 'Session blocked' };
  }

  private async require2FA(userUuid: string): Promise<any> {
    // 强制用户启用2FA
    await this.db.execute(`
      UPDATE universal_users 
      SET requires_2fa = 1, 2fa_required_at = CURRENT_TIMESTAMP 
      WHERE uuid = ?
    `, [userUuid]);

    return { userUuid, action: '2FA required' };
  }

  private async alertAdmin(event: SecurityEvent, rule: ResponseRule): Promise<any> {
    // 创建管理员警报
    const alertId = generateUUID('alert');
    
    await this.db.execute(`
      INSERT INTO admin_alerts (
        id, alert_type, severity, title, description, 
        event_data, rule_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alertId, 'security_incident', event.severity,
      `Security Event: ${event.eventType}`,
      `Automated response triggered for ${event.eventType}`,
      JSON.stringify(event), JSON.stringify(rule),
      'new', new Date().toISOString()
    ]);

    return { alertId, action: 'Admin alert created' };
  }

  private async logIncident(event: SecurityEvent, rule: ResponseRule): Promise<any> {
    // 记录安全事件
    const incidentId = generateUUID('incident');
    
    await this.db.execute(`
      INSERT INTO security_incidents (
        id, incident_type, severity, description, 
        event_data, response_data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      incidentId, event.eventType, event.severity,
      `Security incident: ${event.eventType}`,
      JSON.stringify(event), JSON.stringify(rule),
      'logged', new Date().toISOString()
    ]);

    return { incidentId, action: 'Incident logged' };
  }

  private async quarantineUser(userUuid: string): Promise<any> {
    // 隔离用户账号
    await this.db.execute(`
      UPDATE universal_users 
      SET status = 'quarantined', quarantined_at = CURRENT_TIMESTAMP 
      WHERE uuid = ?
    `, [userUuid]);

    return { userUuid, action: 'User quarantined' };
  }

  private async increaseMonitoring(event: SecurityEvent): Promise<any> {
    // 增加对特定IP或用户的监控
    const monitorId = generateUUID('monitor');
    
    await this.db.execute(`
      INSERT INTO enhanced_monitoring (
        id, target_type, target_value, monitoring_level,
        start_time, end_time, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      monitorId, 'ip', event.ipAddress, 'high',
      new Date().toISOString(),
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      'automated_system'
    ]);

    return { monitorId, action: 'Enhanced monitoring enabled' };
  }

  private async sendNotification(event: SecurityEvent, rule: ResponseRule): Promise<any> {
    // 发送通知（邮件、短信等）
    // 这里简化处理，实际应该集成通知服务
    console.log(`Security notification: ${event.eventType} detected`);
    
    return { action: 'Notification sent' };
  }

  /**
   * 辅助方法
   */
  private matchesPattern(value: string, pattern: string): boolean {
    // 简化的模式匹配
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(value);
    }
    return value === pattern;
  }

  private async getRecentEvents(
    eventType: string, 
    ipAddress: string, 
    timeWindow: number
  ): Promise<number> {
    const since = new Date(Date.now() - timeWindow * 60 * 1000).toISOString();
    
    const result = await this.db.queryFirst(`
      SELECT COUNT(*) as count
      FROM security_events 
      WHERE event_type = ? AND ip_address = ? AND created_at > ?
    `, [eventType, ipAddress, since]);

    return result?.count || 0;
  }

  private requiresManualReview(
    event: SecurityEvent, 
    rule: ResponseRule, 
    actions: ResponseAction[]
  ): boolean {
    // 高严重程度事件需要人工审查
    if (event.severity === 'critical') return true;
    
    // 如果有动作失败，需要人工审查
    if (actions.some(a => !a.success)) return true;
    
    // 特定规则要求人工审查
    if (rule.escalationRules?.requiresManualReview) return true;
    
    return false;
  }

  private shouldEscalate(
    event: SecurityEvent, 
    rule: ResponseRule, 
    response: AutomatedResponse
  ): boolean {
    // 检查升级条件
    if (response.failedActions > response.totalActions / 2) return true;
    if (event.severity === 'critical') return true;
    if (rule.escalationRules?.autoEscalate) return true;
    
    return false;
  }

  private async escalateEvent(event: SecurityEvent, response: AutomatedResponse): Promise<void> {
    // 升级事件处理
    await this.db.execute(`
      UPDATE automated_responses 
      SET escalated = 1, manual_review_required = 1 
      WHERE id = ?
    `, [response.responseId]);

    // 创建升级记录
    const escalationId = generateUUID('escalation');
    await this.db.execute(`
      INSERT INTO event_escalations (
        id, event_id, response_id, escalation_reason,
        escalated_at, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      escalationId, event.eventId, response.responseId,
      'Automated response failed or high severity',
      new Date().toISOString(), 'pending'
    ]);
  }

  private async recordResponse(response: AutomatedResponse): Promise<void> {
    // 记录自动响应结果
    await this.db.execute(`
      INSERT INTO automated_responses (
        id, event_id, rule_id, total_actions, successful_actions,
        failed_actions, execution_time, escalated, manual_review_required,
        actions_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      response.responseId, response.eventId, response.ruleId,
      response.totalActions, response.successfulActions, response.failedActions,
      response.executionTime, response.escalated, response.manualReviewRequired,
      JSON.stringify(response.actions), new Date().toISOString()
    ]);

    // 更新规则执行统计
    await this.db.execute(`
      UPDATE automated_response_rules 
      SET execution_count = execution_count + 1,
          success_count = success_count + ?,
          last_executed = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [response.successfulActions > 0 ? 1 : 0, response.ruleId]);
  }

  /**
   * 获取响应统计
   */
  async getResponseStats(): Promise<any> {
    const stats = await this.db.queryFirst(`
      SELECT 
        COUNT(*) as totalResponses,
        COUNT(CASE WHEN escalated = 1 THEN 1 END) as escalatedResponses,
        COUNT(CASE WHEN manual_review_required = 1 THEN 1 END) as manualReviewRequired,
        AVG(execution_time) as avgExecutionTime,
        AVG(successful_actions * 1.0 / total_actions) as successRate
      FROM automated_responses
      WHERE created_at > datetime('now', '-30 days')
    `);

    return stats;
  }
}



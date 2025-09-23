// 安全监控和告警服务
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'blocked_request' | 'suspicious_activity' | 'rate_limit_exceeded' | 'malicious_ip' | 'bot_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientIP: string;
  userAgent: string;
  riskScore: number;
  reasons: string[];
  requestData: any;
  blocked: boolean;
}

export interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  suspiciousRequests: number;
  topThreats: Array<{ ip: string; count: number; lastSeen: string }>;
  hourlyStats: Array<{ hour: string; requests: number; blocked: number }>;
  countryStats: Array<{ country: string; requests: number; blocked: number }>;
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 10000; // 保留最近10000个事件
  private static readonly ALERT_THRESHOLDS = {
    high_risk_requests_per_minute: 10,
    blocked_requests_per_hour: 100,
    unique_malicious_ips_per_hour: 20
  };

  // 记录安全事件
  static logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.events.push(securityEvent);

    // 保持事件数量在限制内
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // 检查是否需要发送告警
    this.checkAlertConditions(securityEvent);

    // 记录到控制台
    this.logToConsole(securityEvent);

    return securityEvent;
  }

  // 生成事件ID
  private static generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 记录到控制台
  private static logToConsole(event: SecurityEvent): void {
    const emoji = this.getSeverityEmoji(event.severity);
    const action = event.blocked ? '🚫 BLOCKED' : '⚠️  FLAGGED';
    
    console.log(`${emoji} ${action} [${event.type.toUpperCase()}] ${event.clientIP} (Score: ${event.riskScore})`);
    console.log(`   Reasons: ${event.reasons.join(', ')}`);
    console.log(`   User-Agent: ${event.userAgent.substring(0, 100)}...`);
    console.log(`   Time: ${event.timestamp}`);
    console.log('---');
  }

  // 获取严重程度表情符号
  private static getSeverityEmoji(severity: SecurityEvent['severity']): string {
    switch (severity) {
      case 'low': return '🟡';
      case 'medium': return '🟠';
      case 'high': return '🔴';
      case 'critical': return '💀';
      default: return '⚪';
    }
  }

  // 检查告警条件
  private static checkAlertConditions(event: SecurityEvent): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    // 检查每分钟高风险请求数
    const highRiskInLastMinute = this.events.filter(e => 
      new Date(e.timestamp) > oneMinuteAgo && e.riskScore >= 70
    ).length;

    if (highRiskInLastMinute >= this.ALERT_THRESHOLDS.high_risk_requests_per_minute) {
      this.sendAlert('high_risk_spike', {
        message: `High risk requests spike: ${highRiskInLastMinute} in last minute`,
        count: highRiskInLastMinute,
        threshold: this.ALERT_THRESHOLDS.high_risk_requests_per_minute
      });
    }

    // 检查每小时阻止请求数
    const blockedInLastHour = this.events.filter(e => 
      new Date(e.timestamp) > oneHourAgo && e.blocked
    ).length;

    if (blockedInLastHour >= this.ALERT_THRESHOLDS.blocked_requests_per_hour) {
      this.sendAlert('blocked_requests_spike', {
        message: `Blocked requests spike: ${blockedInLastHour} in last hour`,
        count: blockedInLastHour,
        threshold: this.ALERT_THRESHOLDS.blocked_requests_per_hour
      });
    }

    // 检查恶意IP数量
    const maliciousIPs = new Set(
      this.events
        .filter(e => new Date(e.timestamp) > oneHourAgo && e.reasons.includes('known_malicious'))
        .map(e => e.clientIP)
    );

    if (maliciousIPs.size >= this.ALERT_THRESHOLDS.unique_malicious_ips_per_hour) {
      this.sendAlert('malicious_ip_spike', {
        message: `Malicious IP spike: ${maliciousIPs.size} unique IPs in last hour`,
        count: maliciousIPs.size,
        threshold: this.ALERT_THRESHOLDS.unique_malicious_ips_per_hour,
        ips: Array.from(maliciousIPs)
      });
    }
  }

  // 发送告警
  private static sendAlert(type: string, data: any): void {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    // 记录告警到控制台
    console.log('🚨 SECURITY ALERT 🚨');
    console.log(`Type: ${type}`);
    console.log(`Message: ${data.message}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));
    console.log('========================');

    // 这里可以集成更多告警渠道：
    // - 发送邮件
    // - 发送到Slack/Discord
    // - 发送到监控系统
    // - 写入数据库
  }

  // 获取安全统计信息
  static getSecurityStats(): SecurityStats {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const recentEvents = this.events.filter(e => new Date(e.timestamp) > oneDayAgo);
    
    // 计算基础统计
    const totalRequests = recentEvents.length;
    const blockedRequests = recentEvents.filter(e => e.blocked).length;
    const suspiciousRequests = recentEvents.filter(e => e.riskScore >= 50 && !e.blocked).length;

    // 计算威胁TOP列表
    const ipCounts = new Map<string, { count: number; lastSeen: string }>();
    recentEvents.forEach(event => {
      if (event.riskScore >= 70) {
        const existing = ipCounts.get(event.clientIP) || { count: 0, lastSeen: event.timestamp };
        ipCounts.set(event.clientIP, {
          count: existing.count + 1,
          lastSeen: event.timestamp > existing.lastSeen ? event.timestamp : existing.lastSeen
        });
      }
    });

    const topThreats = Array.from(ipCounts.entries())
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 计算每小时统计
    const hourlyStats = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 3600000);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      const hourEvents = recentEvents.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= hourStart && eventTime < hourEnd;
      });

      hourlyStats.push({
        hour: hourStart.toISOString().substr(11, 5), // HH:MM format
        requests: hourEvents.length,
        blocked: hourEvents.filter(e => e.blocked).length
      });
    }

    // 计算国家统计（如果有地理信息）
    const countryStats: Array<{ country: string; requests: number; blocked: number }> = [];

    return {
      totalRequests,
      blockedRequests,
      suspiciousRequests,
      topThreats,
      hourlyStats,
      countryStats
    };
  }

  // 获取最近的安全事件
  static getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .slice(-limit)
      .reverse(); // 最新的在前面
  }

  // 清理旧事件
  static cleanupOldEvents(): void {
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.events = this.events.filter(e => new Date(e.timestamp) > oneDayAgo);
  }

  // 获取特定IP的事件历史
  static getIPHistory(ip: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(e => e.clientIP === ip)
      .slice(-limit)
      .reverse();
  }

  // 检查IP是否在黑名单中
  static isIPBlacklisted(ip: string): boolean {
    const recentEvents = this.events.filter(e => 
      e.clientIP === ip && 
      new Date(e.timestamp) > new Date(Date.now() - 3600000) // 最近1小时
    );

    // 如果最近1小时内被阻止超过5次，则加入黑名单
    const blockedCount = recentEvents.filter(e => e.blocked).length;
    return blockedCount >= 5;
  }
}

// 定期清理旧事件
setInterval(() => {
  SecurityMonitor.cleanupOldEvents();
}, 3600000); // 每小时清理一次

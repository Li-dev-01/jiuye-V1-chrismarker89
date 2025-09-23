/**
 * 威胁情报集成服务
 * 集成外部威胁情报源，提供实时威胁检测
 */

import { generateUUID } from '../utils/uuid';

export interface ThreatIndicator {
  value: string;
  type: 'ip' | 'domain' | 'email' | 'hash' | 'url';
  threatType: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  description: string;
  sourceName: string;
  sourceReliability: 'high' | 'medium' | 'low' | 'unknown';
  firstSeen?: string;
  lastSeen?: string;
  expiresAt?: string;
  relatedCampaigns?: string[];
  attackTechniques?: string[];
  targetSectors?: string[];
  countryCode?: string;
  region?: string;
  asn?: number;
}

export interface ThreatCheckResult {
  isThreat: boolean;
  threatLevel: string;
  confidenceScore: number;
  threatTypes: string[];
  sources: string[];
  description: string;
  recommendedActions: string[];
  details: any;
}

export interface ThreatIntelligenceSource {
  name: string;
  url: string;
  apiKey?: string;
  reliability: 'high' | 'medium' | 'low';
  updateInterval: number; // 分钟
  isActive: boolean;
  lastUpdate?: string;
}

export class ThreatIntelligenceService {
  private db: any;
  private sources: ThreatIntelligenceSource[];

  constructor(db: any) {
    this.db = db;
    this.sources = this.initializeSources();
  }

  /**
   * 初始化威胁情报源
   */
  private initializeSources(): ThreatIntelligenceSource[] {
    return [
      {
        name: 'AbuseIPDB',
        url: 'https://api.abuseipdb.com/api/v2/check',
        reliability: 'high',
        updateInterval: 60,
        isActive: true
      },
      {
        name: 'VirusTotal',
        url: 'https://www.virustotal.com/vtapi/v2/ip-address/report',
        reliability: 'high',
        updateInterval: 120,
        isActive: true
      },
      {
        name: 'ThreatCrowd',
        url: 'https://www.threatcrowd.org/searchApi/v2/ip/report/',
        reliability: 'medium',
        updateInterval: 180,
        isActive: true
      },
      {
        name: 'Internal_Blacklist',
        url: 'internal',
        reliability: 'high',
        updateInterval: 5,
        isActive: true
      }
    ];
  }

  /**
   * 检查IP地址威胁情报
   */
  async checkIPThreat(ipAddress: string): Promise<ThreatCheckResult> {
    try {
      // 1. 检查本地威胁情报数据库
      const localThreats = await this.checkLocalThreatDB(ipAddress, 'ip');
      
      // 2. 如果本地没有数据或数据过期，查询外部源
      let externalThreats: ThreatIndicator[] = [];
      if (localThreats.length === 0 || this.isDataStale(localThreats[0])) {
        externalThreats = await this.queryExternalSources(ipAddress, 'ip');
        
        // 更新本地数据库
        for (const threat of externalThreats) {
          await this.updateLocalThreatDB(threat);
        }
      }

      // 3. 合并和分析威胁数据
      const allThreats = [...localThreats, ...externalThreats];
      return this.analyzeThreatData(allThreats);

    } catch (error) {
      console.error('IP threat check error:', error);
      return this.getDefaultThreatResult();
    }
  }

  /**
   * 检查域名威胁情报
   */
  async checkDomainThreat(domain: string): Promise<ThreatCheckResult> {
    try {
      const localThreats = await this.checkLocalThreatDB(domain, 'domain');
      
      let externalThreats: ThreatIndicator[] = [];
      if (localThreats.length === 0 || this.isDataStale(localThreats[0])) {
        externalThreats = await this.queryExternalSources(domain, 'domain');
        
        for (const threat of externalThreats) {
          await this.updateLocalThreatDB(threat);
        }
      }

      const allThreats = [...localThreats, ...externalThreats];
      return this.analyzeThreatData(allThreats);

    } catch (error) {
      console.error('Domain threat check error:', error);
      return this.getDefaultThreatResult();
    }
  }

  /**
   * 批量威胁检查
   */
  async batchThreatCheck(indicators: Array<{value: string, type: string}>): Promise<Map<string, ThreatCheckResult>> {
    const results = new Map<string, ThreatCheckResult>();
    
    // 并行处理多个指标
    const promises = indicators.map(async (indicator) => {
      let result: ThreatCheckResult;
      
      switch (indicator.type) {
        case 'ip':
          result = await this.checkIPThreat(indicator.value);
          break;
        case 'domain':
          result = await this.checkDomainThreat(indicator.value);
          break;
        default:
          result = this.getDefaultThreatResult();
      }
      
      return { key: indicator.value, result };
    });

    const resolvedResults = await Promise.all(promises);
    resolvedResults.forEach(({ key, result }) => {
      results.set(key, result);
    });

    return results;
  }

  /**
   * 查询本地威胁情报数据库
   */
  private async checkLocalThreatDB(indicator: string, type: string): Promise<ThreatIndicator[]> {
    const threats = await this.db.queryAll(`
      SELECT 
        indicator_value as value, indicator_type as type, threat_type as threatType,
        threat_level as threatLevel, confidence_score as confidenceScore,
        description, source_name as sourceName, source_reliability as sourceReliability,
        first_seen as firstSeen, last_seen as lastSeen, expires_at as expiresAt,
        related_campaigns as relatedCampaigns, attack_techniques as attackTechniques,
        target_sectors as targetSectors, country_code as countryCode,
        region, asn
      FROM threat_intelligence 
      WHERE indicator_value = ? AND indicator_type = ? AND is_active = 1
      ORDER BY confidence_score DESC
    `, [indicator, type]);

    return threats.map(threat => ({
      ...threat,
      relatedCampaigns: JSON.parse(threat.relatedCampaigns || '[]'),
      attackTechniques: JSON.parse(threat.attackTechniques || '[]'),
      targetSectors: JSON.parse(threat.targetSectors || '[]')
    }));
  }

  /**
   * 查询外部威胁情报源
   */
  private async queryExternalSources(indicator: string, type: string): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];

    for (const source of this.sources) {
      if (!source.isActive) continue;

      try {
        let sourceThreat: ThreatIndicator | null = null;

        switch (source.name) {
          case 'AbuseIPDB':
            if (type === 'ip') {
              sourceThreat = await this.queryAbuseIPDB(indicator);
            }
            break;
          case 'VirusTotal':
            sourceThreat = await this.queryVirusTotal(indicator, type);
            break;
          case 'ThreatCrowd':
            sourceThreat = await this.queryThreatCrowd(indicator, type);
            break;
          case 'Internal_Blacklist':
            sourceThreat = await this.queryInternalBlacklist(indicator, type);
            break;
        }

        if (sourceThreat) {
          threats.push(sourceThreat);
        }

      } catch (error) {
        console.error(`Error querying ${source.name}:`, error);
      }
    }

    return threats;
  }

  /**
   * 查询AbuseIPDB
   */
  private async queryAbuseIPDB(ipAddress: string): Promise<ThreatIndicator | null> {
    // 模拟AbuseIPDB API调用
    // 实际实现中需要使用真实的API密钥和请求
    
    // 简化的模拟响应
    if (this.isPrivateIP(ipAddress)) {
      return null;
    }

    // 模拟一些已知的恶意IP
    const knownMaliciousIPs = [
      '192.0.2.1', '198.51.100.1', '203.0.113.1'
    ];

    if (knownMaliciousIPs.includes(ipAddress)) {
      return {
        value: ipAddress,
        type: 'ip',
        threatType: 'malicious_ip',
        threatLevel: 'high',
        confidenceScore: 0.9,
        description: 'Reported for malicious activity',
        sourceName: 'AbuseIPDB',
        sourceReliability: 'high',
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        attackTechniques: ['brute_force', 'scanning']
      };
    }

    return null;
  }

  /**
   * 查询VirusTotal
   */
  private async queryVirusTotal(indicator: string, type: string): Promise<ThreatIndicator | null> {
    // 模拟VirusTotal API调用
    // 实际实现中需要使用真实的API密钥
    
    // 简化的模拟逻辑
    if (type === 'ip' && indicator.startsWith('10.')) {
      return {
        value: indicator,
        type: 'ip',
        threatType: 'suspicious_ip',
        threatLevel: 'medium',
        confidenceScore: 0.6,
        description: 'Detected by multiple engines',
        sourceName: 'VirusTotal',
        sourceReliability: 'high'
      };
    }

    return null;
  }

  /**
   * 查询ThreatCrowd
   */
  private async queryThreatCrowd(indicator: string, type: string): Promise<ThreatIndicator | null> {
    // 模拟ThreatCrowd API调用
    return null;
  }

  /**
   * 查询内部黑名单
   */
  private async queryInternalBlacklist(indicator: string, type: string): Promise<ThreatIndicator | null> {
    // 检查内部维护的黑名单
    const internalBlacklist = [
      '192.168.1.100', // 示例内部黑名单IP
      'malicious.example.com' // 示例恶意域名
    ];

    if (internalBlacklist.includes(indicator)) {
      return {
        value: indicator,
        type: type as any,
        threatType: 'internal_blacklist',
        threatLevel: 'high',
        confidenceScore: 1.0,
        description: 'Internal security blacklist',
        sourceName: 'Internal_Blacklist',
        sourceReliability: 'high'
      };
    }

    return null;
  }

  /**
   * 分析威胁数据
   */
  private analyzeThreatData(threats: ThreatIndicator[]): ThreatCheckResult {
    if (threats.length === 0) {
      return this.getDefaultThreatResult();
    }

    // 计算综合威胁评分
    const maxThreatLevel = this.getMaxThreatLevel(threats);
    const avgConfidence = threats.reduce((sum, t) => sum + t.confidenceScore, 0) / threats.length;
    const threatTypes = [...new Set(threats.map(t => t.threatType))];
    const sources = [...new Set(threats.map(t => t.sourceName))];

    // 生成推荐行动
    const recommendedActions = this.generateRecommendedActions(maxThreatLevel, threatTypes);

    return {
      isThreat: true,
      threatLevel: maxThreatLevel,
      confidenceScore: avgConfidence,
      threatTypes,
      sources,
      description: this.generateThreatDescription(threats),
      recommendedActions,
      details: {
        threatCount: threats.length,
        highConfidenceThreats: threats.filter(t => t.confidenceScore > 0.8).length,
        latestThreat: threats.sort((a, b) => 
          new Date(b.lastSeen || b.firstSeen || '').getTime() - 
          new Date(a.lastSeen || a.firstSeen || '').getTime()
        )[0]
      }
    };
  }

  /**
   * 更新本地威胁情报数据库
   */
  private async updateLocalThreatDB(threat: ThreatIndicator): Promise<void> {
    const threatId = generateUUID('threat');
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT OR REPLACE INTO threat_intelligence (
        id, threat_type, indicator_value, indicator_type, threat_level,
        confidence_score, description, source_name, source_reliability,
        first_seen, last_seen, expires_at, related_campaigns,
        attack_techniques, target_sectors, country_code, region, asn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      threatId, threat.threatType, threat.value, threat.type, threat.threatLevel,
      threat.confidenceScore, threat.description, threat.sourceName, threat.sourceReliability,
      threat.firstSeen || now, threat.lastSeen || now, threat.expiresAt,
      JSON.stringify(threat.relatedCampaigns || []),
      JSON.stringify(threat.attackTechniques || []),
      JSON.stringify(threat.targetSectors || []),
      threat.countryCode, threat.region, threat.asn
    ]);
  }

  /**
   * 辅助方法
   */
  private isDataStale(threat: ThreatIndicator): boolean {
    if (!threat.lastSeen) return true;
    
    const lastUpdate = new Date(threat.lastSeen);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate > 24; // 24小时后认为数据过期
  }

  private isPrivateIP(ip: string): boolean {
    return ip.startsWith('192.168.') || 
           ip.startsWith('10.') || 
           ip.startsWith('172.') ||
           ip === '127.0.0.1';
  }

  private getMaxThreatLevel(threats: ThreatIndicator[]): string {
    const levelPriority = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    let maxLevel = 'low';
    let maxPriority = 0;
    
    for (const threat of threats) {
      const priority = levelPriority[threat.threatLevel] || 0;
      if (priority > maxPriority) {
        maxPriority = priority;
        maxLevel = threat.threatLevel;
      }
    }
    
    return maxLevel;
  }

  private generateRecommendedActions(threatLevel: string, threatTypes: string[]): string[] {
    const actions: string[] = [];
    
    switch (threatLevel) {
      case 'critical':
        actions.push('block_immediately', 'alert_admin', 'investigate_incident');
        break;
      case 'high':
        actions.push('block_access', 'require_verification', 'monitor_closely');
        break;
      case 'medium':
        actions.push('increase_monitoring', 'require_2fa', 'log_activity');
        break;
      case 'low':
        actions.push('log_activity', 'periodic_review');
        break;
    }
    
    // 基于威胁类型添加特定行动
    if (threatTypes.includes('malicious_ip')) {
      actions.push('add_to_blacklist');
    }
    
    if (threatTypes.includes('botnet_member')) {
      actions.push('check_for_automation');
    }
    
    return [...new Set(actions)];
  }

  private generateThreatDescription(threats: ThreatIndicator[]): string {
    if (threats.length === 1) {
      return threats[0].description;
    }
    
    const sources = [...new Set(threats.map(t => t.sourceName))];
    const types = [...new Set(threats.map(t => t.threatType))];
    
    return `Detected by ${sources.length} source(s): ${sources.join(', ')}. Threat types: ${types.join(', ')}.`;
  }

  private getDefaultThreatResult(): ThreatCheckResult {
    return {
      isThreat: false,
      threatLevel: 'low',
      confidenceScore: 0,
      threatTypes: [],
      sources: [],
      description: 'No threats detected',
      recommendedActions: [],
      details: {}
    };
  }

  /**
   * 定期更新威胁情报
   */
  async updateThreatIntelligence(): Promise<void> {
    console.log('Starting threat intelligence update...');
    
    // 获取需要更新的指标
    const staleIndicators = await this.db.queryAll(`
      SELECT DISTINCT indicator_value, indicator_type
      FROM threat_intelligence 
      WHERE last_seen < datetime('now', '-24 hours')
      LIMIT 100
    `);

    // 批量更新
    for (const indicator of staleIndicators) {
      try {
        const threats = await this.queryExternalSources(
          indicator.indicator_value, 
          indicator.indicator_type
        );
        
        for (const threat of threats) {
          await this.updateLocalThreatDB(threat);
        }
        
        // 避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error updating ${indicator.indicator_value}:`, error);
      }
    }
    
    console.log('Threat intelligence update completed');
  }
}



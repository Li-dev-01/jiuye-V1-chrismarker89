/**
 * 机器学习异常检测服务
 * 基于用户行为模式检测异常活动
 */

import { generateUUID } from '../utils/uuid';

export interface UserBehaviorPattern {
  userUuid: string;
  loginFrequencyPattern: any;
  activeHoursPattern: any;
  locationPattern: any;
  devicePattern: any;
  avgSessionDuration: number;
  typicalLoginInterval: number;
  commonIpAddresses: string[];
  commonUserAgents: string[];
  patternConfidence: number;
  sampleCount: number;
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  anomalyType: string;
  anomalyScore: number;
  confidenceLevel: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedFeatures: any;
  baselineFeatures: any;
  deviationMetrics: any;
  recommendedActions: string[];
}

export interface SessionContext {
  userUuid: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceInfo?: any;
  behaviorData?: any;
}

export class AnomalyDetectionService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 检测用户行为异常
   */
  async detectAnomalies(context: SessionContext): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    try {
      // 获取用户行为模式
      const userPattern = await this.getUserBehaviorPattern(context.userUuid);
      
      if (!userPattern || userPattern.sampleCount < 5) {
        // 样本不足，只进行基础检测
        return await this.performBasicAnomalyDetection(context);
      }

      // 1. 登录时间异常检测
      const timeAnomaly = await this.detectTimeAnomaly(context, userPattern);
      if (timeAnomaly.isAnomalous) {
        anomalies.push(timeAnomaly);
      }

      // 2. 位置异常检测
      const locationAnomaly = await this.detectLocationAnomaly(context, userPattern);
      if (locationAnomaly.isAnomalous) {
        anomalies.push(locationAnomaly);
      }

      // 3. 设备异常检测
      const deviceAnomaly = await this.detectDeviceAnomaly(context, userPattern);
      if (deviceAnomaly.isAnomalous) {
        anomalies.push(deviceAnomaly);
      }

      // 4. 行为模式异常检测
      if (context.behaviorData) {
        const behaviorAnomaly = await this.detectBehaviorAnomaly(context, userPattern);
        if (behaviorAnomaly.isAnomalous) {
          anomalies.push(behaviorAnomaly);
        }
      }

      // 5. 速度异常检测（不可能的旅行）
      const velocityAnomaly = await this.detectVelocityAnomaly(context, userPattern);
      if (velocityAnomaly.isAnomalous) {
        anomalies.push(velocityAnomaly);
      }

      // 记录检测结果
      for (const anomaly of anomalies) {
        await this.recordAnomalyDetection(context, anomaly);
      }

      return anomalies;

    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * 检测登录时间异常
   */
  private async detectTimeAnomaly(
    context: SessionContext, 
    pattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const loginTime = new Date(context.loginTime);
    const hour = loginTime.getHours();
    const dayOfWeek = loginTime.getDay();

    const activeHours = pattern.activeHoursPattern || {};
    const typicalHours = activeHours[dayOfWeek] || [];

    // 计算时间异常分数
    let timeScore = 0;
    if (typicalHours.length > 0) {
      const isTypicalHour = typicalHours.some((range: any) => 
        hour >= range.start && hour <= range.end
      );
      
      if (!isTypicalHour) {
        timeScore = 0.8; // 非典型时间登录
      }
    }

    // 检查登录间隔
    const lastLogin = await this.getLastLoginTime(context.userUuid);
    let intervalScore = 0;
    
    if (lastLogin) {
      const interval = loginTime.getTime() - new Date(lastLogin).getTime();
      const intervalHours = interval / (1000 * 60 * 60);
      
      if (intervalHours < 0.5) {
        intervalScore = 0.6; // 登录过于频繁
      } else if (intervalHours > 24 * 7) {
        intervalScore = 0.3; // 长时间未登录
      }
    }

    const anomalyScore = Math.max(timeScore, intervalScore);
    const isAnomalous = anomalyScore > 0.5;

    return {
      isAnomalous,
      anomalyType: 'unusual_login_time',
      anomalyScore,
      confidenceLevel: pattern.patternConfidence,
      severity: anomalyScore > 0.8 ? 'high' : anomalyScore > 0.6 ? 'medium' : 'low',
      detectedFeatures: { hour, dayOfWeek, intervalHours: lastLogin ? 
        (loginTime.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60) : null },
      baselineFeatures: { typicalHours, typicalInterval: pattern.typicalLoginInterval },
      deviationMetrics: { timeScore, intervalScore },
      recommendedActions: isAnomalous ? ['verify_identity', 'require_2fa'] : []
    };
  }

  /**
   * 检测位置异常
   */
  private async detectLocationAnomaly(
    context: SessionContext, 
    pattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const currentLocation = context.location;
    const commonLocations = pattern.locationPattern || {};
    const commonIPs = pattern.commonIpAddresses || [];

    let locationScore = 0;
    let ipScore = 0;

    // 检查IP地址
    if (!commonIPs.includes(context.ipAddress)) {
      ipScore = 0.7; // 新IP地址
    }

    // 检查地理位置
    if (currentLocation && currentLocation.country) {
      const knownCountries = Object.keys(commonLocations);
      if (!knownCountries.includes(currentLocation.country)) {
        locationScore = 0.9; // 新国家
      } else if (currentLocation.city) {
        const countryData = commonLocations[currentLocation.country] || {};
        const knownCities = countryData.cities || [];
        if (!knownCities.includes(currentLocation.city)) {
          locationScore = 0.6; // 新城市
        }
      }
    }

    const anomalyScore = Math.max(locationScore, ipScore);
    const isAnomalous = anomalyScore > 0.5;

    return {
      isAnomalous,
      anomalyType: 'unusual_location',
      anomalyScore,
      confidenceLevel: pattern.patternConfidence,
      severity: anomalyScore > 0.8 ? 'high' : anomalyScore > 0.6 ? 'medium' : 'low',
      detectedFeatures: { 
        ipAddress: context.ipAddress, 
        location: currentLocation 
      },
      baselineFeatures: { 
        commonIPs: commonIPs.slice(0, 5), // 只返回前5个常用IP
        commonLocations: Object.keys(commonLocations) 
      },
      deviationMetrics: { locationScore, ipScore },
      recommendedActions: isAnomalous ? ['verify_location', 'require_2fa', 'monitor_session'] : []
    };
  }

  /**
   * 检测设备异常
   */
  private async detectDeviceAnomaly(
    context: SessionContext, 
    pattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const currentUserAgent = context.userAgent;
    const commonUserAgents = pattern.commonUserAgents || [];

    let deviceScore = 0;

    // 简单的User-Agent匹配
    const isKnownDevice = commonUserAgents.some(ua => 
      this.calculateUserAgentSimilarity(currentUserAgent, ua) > 0.8
    );

    if (!isKnownDevice) {
      deviceScore = 0.7; // 新设备
    }

    // 检查设备指纹（如果有）
    if (context.deviceInfo) {
      const devicePattern = pattern.devicePattern || {};
      const currentFingerprint = this.generateBasicFingerprint(context.deviceInfo);
      const knownFingerprints = devicePattern.fingerprints || [];
      
      const isKnownFingerprint = knownFingerprints.some((fp: string) => 
        this.calculateFingerprintSimilarity(currentFingerprint, fp) > 0.9
      );

      if (!isKnownFingerprint) {
        deviceScore = Math.max(deviceScore, 0.8);
      }
    }

    const anomalyScore = deviceScore;
    const isAnomalous = anomalyScore > 0.5;

    return {
      isAnomalous,
      anomalyType: 'unusual_device',
      anomalyScore,
      confidenceLevel: pattern.patternConfidence,
      severity: anomalyScore > 0.8 ? 'high' : anomalyScore > 0.6 ? 'medium' : 'low',
      detectedFeatures: { 
        userAgent: currentUserAgent,
        deviceInfo: context.deviceInfo 
      },
      baselineFeatures: { 
        commonUserAgents: commonUserAgents.slice(0, 3),
        devicePattern: pattern.devicePattern 
      },
      deviationMetrics: { deviceScore },
      recommendedActions: isAnomalous ? ['verify_device', 'require_2fa', 'add_to_trusted'] : []
    };
  }

  /**
   * 检测行为模式异常
   */
  private async detectBehaviorAnomaly(
    context: SessionContext, 
    pattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    // 这里可以实现更复杂的行为分析
    // 例如：鼠标移动模式、键盘时序、导航行为等
    
    const behaviorScore = 0; // 简化实现
    const anomalyScore = behaviorScore;
    const isAnomalous = anomalyScore > 0.5;

    return {
      isAnomalous,
      anomalyType: 'unusual_behavior',
      anomalyScore,
      confidenceLevel: pattern.patternConfidence,
      severity: 'low',
      detectedFeatures: context.behaviorData || {},
      baselineFeatures: {},
      deviationMetrics: { behaviorScore },
      recommendedActions: []
    };
  }

  /**
   * 检测速度异常（不可能的旅行）
   */
  private async detectVelocityAnomaly(
    context: SessionContext, 
    pattern: UserBehaviorPattern
  ): Promise<AnomalyDetectionResult> {
    const lastLogin = await this.getLastLoginWithLocation(context.userUuid);
    
    if (!lastLogin || !lastLogin.location || !context.location) {
      return {
        isAnomalous: false,
        anomalyType: 'velocity_anomaly',
        anomalyScore: 0,
        confidenceLevel: 0,
        severity: 'low',
        detectedFeatures: {},
        baselineFeatures: {},
        deviationMetrics: {},
        recommendedActions: []
      };
    }

    // 计算地理距离和时间差
    const distance = this.calculateDistance(
      lastLogin.location,
      context.location
    );
    
    const timeDiff = (new Date(context.loginTime).getTime() - 
                     new Date(lastLogin.loginTime).getTime()) / (1000 * 60 * 60); // 小时

    // 计算理论最大速度（假设飞机速度 900 km/h）
    const maxPossibleSpeed = 900; // km/h
    const requiredSpeed = distance / timeDiff;

    let velocityScore = 0;
    if (requiredSpeed > maxPossibleSpeed) {
      velocityScore = Math.min(requiredSpeed / maxPossibleSpeed, 1.0);
    }

    const anomalyScore = velocityScore;
    const isAnomalous = anomalyScore > 0.8; // 需要超过理论速度的80%才认为异常

    return {
      isAnomalous,
      anomalyType: 'velocity_anomaly',
      anomalyScore,
      confidenceLevel: 0.9, // 地理计算相对可靠
      severity: anomalyScore > 0.9 ? 'critical' : 'high',
      detectedFeatures: { 
        currentLocation: context.location,
        distance,
        timeDiff,
        requiredSpeed 
      },
      baselineFeatures: { 
        lastLocation: lastLogin.location,
        maxPossibleSpeed 
      },
      deviationMetrics: { velocityScore },
      recommendedActions: isAnomalous ? ['block_session', 'require_verification', 'alert_admin'] : []
    };
  }

  /**
   * 基础异常检测（用于新用户）
   */
  private async performBasicAnomalyDetection(context: SessionContext): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // 检查威胁情报
    const threatCheck = await this.checkThreatIntelligence(context.ipAddress);
    if (threatCheck.isAnomalous) {
      anomalies.push(threatCheck);
    }

    return anomalies;
  }

  /**
   * 检查威胁情报
   */
  private async checkThreatIntelligence(ipAddress: string): Promise<AnomalyDetectionResult> {
    const threat = await this.db.queryFirst(`
      SELECT threat_type, threat_level, confidence_score, description
      FROM threat_intelligence 
      WHERE indicator_value = ? AND indicator_type = 'ip' AND is_active = 1
    `, [ipAddress]);

    if (threat) {
      const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'low': 'low',
        'medium': 'medium', 
        'high': 'high',
        'critical': 'critical'
      };

      return {
        isAnomalous: true,
        anomalyType: 'known_threat',
        anomalyScore: threat.confidence_score,
        confidenceLevel: threat.confidence_score,
        severity: severityMap[threat.threat_level] || 'medium',
        detectedFeatures: { ipAddress, threatType: threat.threat_type },
        baselineFeatures: { description: threat.description },
        deviationMetrics: { threatLevel: threat.threat_level },
        recommendedActions: ['block_ip', 'alert_admin', 'investigate']
      };
    }

    return {
      isAnomalous: false,
      anomalyType: 'threat_check',
      anomalyScore: 0,
      confidenceLevel: 1.0,
      severity: 'low',
      detectedFeatures: {},
      baselineFeatures: {},
      deviationMetrics: {},
      recommendedActions: []
    };
  }

  /**
   * 获取用户行为模式
   */
  private async getUserBehaviorPattern(userUuid: string): Promise<UserBehaviorPattern | null> {
    const pattern = await this.db.queryFirst(`
      SELECT 
        user_uuid as userUuid,
        login_frequency_pattern as loginFrequencyPattern,
        active_hours_pattern as activeHoursPattern,
        location_pattern as locationPattern,
        device_pattern as devicePattern,
        avg_session_duration as avgSessionDuration,
        typical_login_interval as typicalLoginInterval,
        common_ip_addresses as commonIpAddresses,
        common_user_agents as commonUserAgents,
        pattern_confidence as patternConfidence,
        sample_count as sampleCount
      FROM user_behavior_patterns 
      WHERE user_uuid = ?
    `, [userUuid]);

    if (!pattern) return null;

    return {
      ...pattern,
      loginFrequencyPattern: JSON.parse(pattern.loginFrequencyPattern || '{}'),
      activeHoursPattern: JSON.parse(pattern.activeHoursPattern || '{}'),
      locationPattern: JSON.parse(pattern.locationPattern || '{}'),
      devicePattern: JSON.parse(pattern.devicePattern || '{}'),
      commonIpAddresses: JSON.parse(pattern.commonIpAddresses || '[]'),
      commonUserAgents: JSON.parse(pattern.commonUserAgents || '[]')
    };
  }

  /**
   * 记录异常检测结果
   */
  private async recordAnomalyDetection(
    context: SessionContext, 
    anomaly: AnomalyDetectionResult
  ): Promise<void> {
    const recordId = generateUUID('anomaly');
    
    await this.db.execute(`
      INSERT INTO anomaly_detections (
        id, user_uuid, session_id, anomaly_type, anomaly_score,
        confidence_level, severity, detected_features, baseline_features,
        deviation_metrics, ip_address, user_agent, location_info,
        device_info, auto_action_taken
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recordId, context.userUuid, context.sessionId, anomaly.anomalyType,
      anomaly.anomalyScore, anomaly.confidenceLevel, anomaly.severity,
      JSON.stringify(anomaly.detectedFeatures), JSON.stringify(anomaly.baselineFeatures),
      JSON.stringify(anomaly.deviationMetrics), context.ipAddress, context.userAgent,
      JSON.stringify(context.location || {}), JSON.stringify(context.deviceInfo || {}),
      JSON.stringify(anomaly.recommendedActions)
    ]);
  }

  /**
   * 辅助方法
   */
  private async getLastLoginTime(userUuid: string): Promise<string | null> {
    const result = await this.db.queryFirst(`
      SELECT login_time 
      FROM login_records 
      WHERE user_uuid = ? AND login_status = 'success'
      ORDER BY login_time DESC 
      LIMIT 1 OFFSET 1
    `, [userUuid]);
    
    return result?.login_time || null;
  }

  private async getLastLoginWithLocation(userUuid: string): Promise<any> {
    const result = await this.db.queryFirst(`
      SELECT login_time as loginTime, ip_country, ip_region, ip_city
      FROM login_records 
      WHERE user_uuid = ? AND login_status = 'success' AND ip_country IS NOT NULL
      ORDER BY login_time DESC 
      LIMIT 1 OFFSET 1
    `, [userUuid]);
    
    if (!result) return null;
    
    return {
      loginTime: result.loginTime,
      location: {
        country: result.ip_country,
        region: result.ip_region,
        city: result.ip_city
      }
    };
  }

  private calculateUserAgentSimilarity(ua1: string, ua2: string): number {
    // 简化的相似度计算
    const tokens1 = ua1.toLowerCase().split(/[\s\/\(\)]+/);
    const tokens2 = ua2.toLowerCase().split(/[\s\/\(\)]+/);
    
    const intersection = tokens1.filter(token => tokens2.includes(token));
    const union = [...new Set([...tokens1, ...tokens2])];
    
    return intersection.length / union.length;
  }

  private generateBasicFingerprint(deviceInfo: any): string {
    // 简化的设备指纹生成
    const features = [
      deviceInfo.screenResolution,
      deviceInfo.colorDepth,
      deviceInfo.timezone,
      deviceInfo.language
    ].filter(Boolean);
    
    return features.join('|');
  }

  private calculateFingerprintSimilarity(fp1: string, fp2: string): number {
    return fp1 === fp2 ? 1.0 : 0.0;
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // 简化的距离计算（实际应该使用Haversine公式）
    // 这里返回一个模拟值
    if (loc1.country !== loc2.country) {
      return 5000; // 不同国家假设5000km
    } else if (loc1.city !== loc2.city) {
      return 500; // 不同城市假设500km
    }
    return 0;
  }
}



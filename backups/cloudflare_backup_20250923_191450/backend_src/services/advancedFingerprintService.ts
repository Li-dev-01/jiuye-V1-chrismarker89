/**
 * 高级设备指纹识别服务
 * 提供多维度的设备指纹识别和分析
 */

import { generateUUID } from '../utils/uuid';

export interface DeviceFingerprintData {
  // 基础指纹
  basicFingerprint: string;
  
  // 高级指纹特征
  canvasFingerprint?: string;
  webglFingerprint?: string;
  audioFingerprint?: string;
  fontFingerprint?: string;
  
  // 硬件特征
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  timezoneOffset: number;
  languageSettings: string[];
  
  // 浏览器特征
  pluginsList: string[];
  extensionsDetected: string[];
  browserFeatures: any;
  
  // 网络特征
  connectionType?: string;
  effectiveBandwidth?: number;
  rttEstimate?: number;
  
  // 行为特征
  mouseMovementPattern?: any;
  keyboardTimingPattern?: any;
  scrollBehaviorPattern?: any;
}

export interface FingerprintAnalysisResult {
  fingerprintId: string;
  riskScore: number;
  isSuspicious: boolean;
  anomalyFlags: string[];
  similarFingerprints: string[];
  clusterId?: string;
  confidenceLevel: number;
  recommendations: string[];
  details: {
    stabilityScore: number;
    uniquenessScore: number;
    consistencyScore: number;
    behaviorScore: number;
  };
}

export interface FingerprintCluster {
  clusterId: string;
  fingerprints: string[];
  commonFeatures: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousPatterns: string[];
  createdAt: string;
  lastUpdated: string;
}

export class AdvancedFingerprintService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 分析设备指纹
   */
  async analyzeFingerprint(
    userUuid: string,
    sessionId: string,
    fingerprintData: DeviceFingerprintData
  ): Promise<FingerprintAnalysisResult> {
    try {
      // 1. 生成综合指纹ID
      const fingerprintId = this.generateFingerprintId(fingerprintData);
      
      // 2. 检查是否为已知指纹
      const existingFingerprint = await this.getExistingFingerprint(fingerprintId);
      
      // 3. 分析指纹特征
      const analysis = await this.performFingerprintAnalysis(
        fingerprintData, 
        existingFingerprint,
        userUuid
      );
      
      // 4. 查找相似指纹
      const similarFingerprints = await this.findSimilarFingerprints(fingerprintData);
      
      // 5. 聚类分析
      const clusterId = await this.performClusterAnalysis(fingerprintId, fingerprintData);
      
      // 6. 保存或更新指纹记录
      await this.saveFingerprint(userUuid, sessionId, fingerprintId, fingerprintData, analysis);
      
      return {
        fingerprintId,
        riskScore: analysis.riskScore,
        isSuspicious: analysis.riskScore > 0.7,
        anomalyFlags: analysis.anomalyFlags,
        similarFingerprints: similarFingerprints.map(f => f.id),
        clusterId,
        confidenceLevel: analysis.confidenceLevel,
        recommendations: this.generateRecommendations(analysis),
        details: {
          stabilityScore: analysis.stabilityScore,
          uniquenessScore: analysis.uniquenessScore,
          consistencyScore: analysis.consistencyScore,
          behaviorScore: analysis.behaviorScore
        }
      };

    } catch (error) {
      console.error('Fingerprint analysis error:', error);
      throw error;
    }
  }

  /**
   * 生成指纹ID
   */
  private generateFingerprintId(data: DeviceFingerprintData): string {
    // 使用关键特征生成稳定的指纹ID
    const keyFeatures = [
      data.screenResolution,
      data.colorDepth.toString(),
      data.pixelRatio.toString(),
      data.timezoneOffset.toString(),
      data.languageSettings.sort().join(','),
      data.canvasFingerprint || '',
      data.webglFingerprint || '',
      data.audioFingerprint || ''
    ].join('|');

    // 简化的哈希函数（实际应该使用更强的哈希算法）
    return this.simpleHash(keyFeatures);
  }

  /**
   * 获取现有指纹记录
   */
  private async getExistingFingerprint(fingerprintId: string): Promise<any> {
    return await this.db.queryFirst(`
      SELECT 
        id, user_uuid, basic_fingerprint, fingerprint_stability,
        change_frequency, risk_score, is_suspicious, anomaly_flags,
        first_seen, last_seen, created_at
      FROM advanced_device_fingerprints 
      WHERE basic_fingerprint = ?
      ORDER BY last_seen DESC
      LIMIT 1
    `, [fingerprintId]);
  }

  /**
   * 执行指纹分析
   */
  private async performFingerprintAnalysis(
    data: DeviceFingerprintData,
    existing: any,
    userUuid: string
  ): Promise<any> {
    const analysis = {
      riskScore: 0,
      anomalyFlags: [] as string[],
      confidenceLevel: 0.8,
      stabilityScore: 1.0,
      uniquenessScore: 0.5,
      consistencyScore: 1.0,
      behaviorScore: 0.5
    };

    // 1. 稳定性分析
    if (existing) {
      const daysSinceFirst = (Date.now() - new Date(existing.first_seen).getTime()) / (1000 * 60 * 60 * 24);
      analysis.stabilityScore = Math.min(daysSinceFirst / 30, 1.0); // 30天达到最大稳定性
      
      if (existing.change_frequency > 5) {
        analysis.anomalyFlags.push('high_change_frequency');
        analysis.riskScore += 0.3;
      }
    } else {
      analysis.stabilityScore = 0.1; // 新指纹稳定性低
      analysis.anomalyFlags.push('new_fingerprint');
      analysis.riskScore += 0.2;
    }

    // 2. 唯一性分析
    const uniquenessScore = await this.calculateUniqueness(data);
    analysis.uniquenessScore = uniquenessScore;
    
    if (uniquenessScore < 0.1) {
      analysis.anomalyFlags.push('common_fingerprint');
      analysis.riskScore += 0.4; // 过于常见的指纹可能是伪造的
    } else if (uniquenessScore > 0.9) {
      analysis.anomalyFlags.push('highly_unique_fingerprint');
      analysis.riskScore += 0.1; // 过于独特也可能有问题
    }

    // 3. 一致性检查
    const consistencyScore = await this.checkConsistency(data, userUuid);
    analysis.consistencyScore = consistencyScore;
    
    if (consistencyScore < 0.5) {
      analysis.anomalyFlags.push('inconsistent_features');
      analysis.riskScore += 0.3;
    }

    // 4. 行为模式分析
    if (data.mouseMovementPattern || data.keyboardTimingPattern) {
      const behaviorScore = this.analyzeBehaviorPatterns(data);
      analysis.behaviorScore = behaviorScore;
      
      if (behaviorScore < 0.3) {
        analysis.anomalyFlags.push('suspicious_behavior');
        analysis.riskScore += 0.4;
      }
    }

    // 5. 技术特征检查
    this.checkTechnicalAnomalies(data, analysis);

    // 6. 计算最终风险评分
    analysis.riskScore = Math.min(analysis.riskScore, 1.0);

    return analysis;
  }

  /**
   * 计算指纹唯一性
   */
  private async calculateUniqueness(data: DeviceFingerprintData): Promise<number> {
    // 检查相似指纹的数量
    const similarCount = await this.db.queryFirst(`
      SELECT COUNT(*) as count
      FROM advanced_device_fingerprints 
      WHERE screen_resolution = ? 
        AND color_depth = ? 
        AND pixel_ratio = ?
        AND timezone_offset = ?
    `, [data.screenResolution, data.colorDepth, data.pixelRatio, data.timezoneOffset]);

    const totalFingerprints = await this.db.queryFirst(`
      SELECT COUNT(*) as count FROM advanced_device_fingerprints
    `);

    if (totalFingerprints.count === 0) return 0.5;

    // 返回唯一性评分（0-1，1表示完全唯一）
    return 1 - (similarCount.count / totalFingerprints.count);
  }

  /**
   * 检查一致性
   */
  private async checkConsistency(data: DeviceFingerprintData, userUuid: string): Promise<number> {
    // 获取用户的历史指纹
    const userFingerprints = await this.db.queryAll(`
      SELECT screen_resolution, color_depth, timezone_offset, language_settings
      FROM advanced_device_fingerprints 
      WHERE user_uuid = ?
      ORDER BY last_seen DESC
      LIMIT 5
    `, [userUuid]);

    if (userFingerprints.length === 0) return 1.0;

    let consistencyScore = 0;
    let checks = 0;

    for (const fp of userFingerprints) {
      // 检查屏幕分辨率一致性
      if (fp.screen_resolution === data.screenResolution) consistencyScore += 0.25;
      
      // 检查颜色深度一致性
      if (fp.color_depth === data.colorDepth) consistencyScore += 0.25;
      
      // 检查时区一致性
      if (Math.abs(fp.timezone_offset - data.timezoneOffset) <= 60) consistencyScore += 0.25;
      
      // 检查语言设置一致性
      const fpLanguages = JSON.parse(fp.language_settings || '[]');
      const commonLanguages = data.languageSettings.filter(lang => fpLanguages.includes(lang));
      if (commonLanguages.length > 0) consistencyScore += 0.25;
      
      checks++;
    }

    return checks > 0 ? consistencyScore / checks : 1.0;
  }

  /**
   * 分析行为模式
   */
  private analyzeBehaviorPatterns(data: DeviceFingerprintData): number {
    let behaviorScore = 0.5; // 默认中等评分

    // 分析鼠标移动模式
    if (data.mouseMovementPattern) {
      const mousePattern = data.mouseMovementPattern;
      
      // 检查是否过于规律（可能是机器人）
      if (mousePattern.variance && mousePattern.variance < 0.1) {
        behaviorScore -= 0.3;
      }
      
      // 检查移动速度是否合理
      if (mousePattern.avgSpeed && (mousePattern.avgSpeed < 10 || mousePattern.avgSpeed > 1000)) {
        behaviorScore -= 0.2;
      }
    }

    // 分析键盘时序模式
    if (data.keyboardTimingPattern) {
      const keyPattern = data.keyboardTimingPattern;
      
      // 检查打字节奏是否自然
      if (keyPattern.avgInterval && keyPattern.avgInterval < 50) {
        behaviorScore -= 0.3; // 打字过快可能是自动化
      }
    }

    // 分析滚动行为
    if (data.scrollBehaviorPattern) {
      const scrollPattern = data.scrollBehaviorPattern;
      
      // 检查滚动模式是否自然
      if (scrollPattern.smoothness && scrollPattern.smoothness > 0.9) {
        behaviorScore -= 0.2; // 过于平滑可能是程序控制
      }
    }

    return Math.max(0, Math.min(1, behaviorScore));
  }

  /**
   * 检查技术异常
   */
  private checkTechnicalAnomalies(data: DeviceFingerprintData, analysis: any): void {
    // 检查不合理的屏幕分辨率
    const [width, height] = data.screenResolution.split('x').map(Number);
    if (width < 800 || height < 600 || width > 7680 || height > 4320) {
      analysis.anomalyFlags.push('unusual_screen_resolution');
      analysis.riskScore += 0.2;
    }

    // 检查颜色深度
    if (![8, 16, 24, 32].includes(data.colorDepth)) {
      analysis.anomalyFlags.push('unusual_color_depth');
      analysis.riskScore += 0.1;
    }

    // 检查像素比
    if (data.pixelRatio < 0.5 || data.pixelRatio > 4) {
      analysis.anomalyFlags.push('unusual_pixel_ratio');
      analysis.riskScore += 0.1;
    }

    // 检查插件数量
    if (data.pluginsList.length === 0) {
      analysis.anomalyFlags.push('no_plugins_detected');
      analysis.riskScore += 0.2;
    } else if (data.pluginsList.length > 50) {
      analysis.anomalyFlags.push('too_many_plugins');
      analysis.riskScore += 0.1;
    }

    // 检查语言设置
    if (data.languageSettings.length === 0) {
      analysis.anomalyFlags.push('no_languages_detected');
      analysis.riskScore += 0.1;
    }

    // 检查Canvas指纹
    if (data.canvasFingerprint && data.canvasFingerprint.length < 10) {
      analysis.anomalyFlags.push('suspicious_canvas_fingerprint');
      analysis.riskScore += 0.2;
    }
  }

  /**
   * 查找相似指纹
   */
  private async findSimilarFingerprints(data: DeviceFingerprintData): Promise<any[]> {
    // 查找具有相似特征的指纹
    return await this.db.queryAll(`
      SELECT id, basic_fingerprint, risk_score, user_uuid
      FROM advanced_device_fingerprints 
      WHERE screen_resolution = ? 
        AND color_depth = ?
        AND ABS(pixel_ratio - ?) < 0.1
        AND ABS(timezone_offset - ?) < 120
      ORDER BY risk_score DESC
      LIMIT 10
    `, [data.screenResolution, data.colorDepth, data.pixelRatio, data.timezoneOffset]);
  }

  /**
   * 执行聚类分析
   */
  private async performClusterAnalysis(
    fingerprintId: string, 
    data: DeviceFingerprintData
  ): Promise<string | undefined> {
    // 简化的聚类实现
    // 实际项目中可以使用更复杂的机器学习聚类算法
    
    const clusterKey = `${data.screenResolution}_${data.colorDepth}_${Math.floor(data.pixelRatio)}`;
    const clusterId = this.simpleHash(clusterKey);
    
    // 检查聚类是否存在
    const existingCluster = await this.db.queryFirst(`
      SELECT cluster_id FROM advanced_device_fingerprints WHERE cluster_id = ?
    `, [clusterId]);
    
    if (!existingCluster) {
      // 创建新聚类记录（这里简化处理）
      console.log(`Created new fingerprint cluster: ${clusterId}`);
    }
    
    return clusterId;
  }

  /**
   * 保存指纹记录
   */
  private async saveFingerprint(
    userUuid: string,
    sessionId: string,
    fingerprintId: string,
    data: DeviceFingerprintData,
    analysis: any
  ): Promise<void> {
    const recordId = generateUUID('fingerprint');
    const now = new Date().toISOString();

    // 检查是否已存在
    const existing = await this.getExistingFingerprint(fingerprintId);
    
    if (existing) {
      // 更新现有记录
      await this.db.execute(`
        UPDATE advanced_device_fingerprints 
        SET last_seen = ?, change_frequency = change_frequency + 1,
            risk_score = ?, is_suspicious = ?, anomaly_flags = ?
        WHERE basic_fingerprint = ?
      `, [
        now, analysis.riskScore, analysis.riskScore > 0.7,
        JSON.stringify(analysis.anomalyFlags), fingerprintId
      ]);
    } else {
      // 创建新记录
      await this.db.execute(`
        INSERT INTO advanced_device_fingerprints (
          id, user_uuid, session_id, basic_fingerprint, canvas_fingerprint,
          webgl_fingerprint, audio_fingerprint, font_fingerprint,
          screen_resolution, color_depth, pixel_ratio, timezone_offset,
          language_settings, plugins_list, extensions_detected, browser_features,
          connection_type, effective_bandwidth, rtt_estimate,
          mouse_movement_pattern, keyboard_timing_pattern, scroll_behavior_pattern,
          fingerprint_stability, risk_score, is_suspicious, anomaly_flags,
          cluster_id, first_seen, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recordId, userUuid, sessionId, fingerprintId,
        data.canvasFingerprint, data.webglFingerprint, data.audioFingerprint, data.fontFingerprint,
        data.screenResolution, data.colorDepth, data.pixelRatio, data.timezoneOffset,
        JSON.stringify(data.languageSettings), JSON.stringify(data.pluginsList),
        JSON.stringify(data.extensionsDetected), JSON.stringify(data.browserFeatures),
        data.connectionType, data.effectiveBandwidth, data.rttEstimate,
        JSON.stringify(data.mouseMovementPattern), JSON.stringify(data.keyboardTimingPattern),
        JSON.stringify(data.scrollBehaviorPattern), analysis.stabilityScore,
        analysis.riskScore, analysis.riskScore > 0.7, JSON.stringify(analysis.anomalyFlags),
        await this.performClusterAnalysis(fingerprintId, data), now, now
      ]);
    }
  }

  /**
   * 生成建议
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.riskScore > 0.8) {
      recommendations.push('block_session', 'require_additional_verification');
    } else if (analysis.riskScore > 0.6) {
      recommendations.push('increase_monitoring', 'require_2fa');
    } else if (analysis.riskScore > 0.4) {
      recommendations.push('monitor_behavior', 'log_activities');
    }

    if (analysis.anomalyFlags.includes('new_fingerprint')) {
      recommendations.push('verify_device_ownership');
    }

    if (analysis.anomalyFlags.includes('suspicious_behavior')) {
      recommendations.push('check_for_automation');
    }

    return recommendations;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 获取指纹统计信息
   */
  async getFingerprintStats(): Promise<any> {
    const stats = await this.db.queryFirst(`
      SELECT 
        COUNT(*) as totalFingerprints,
        COUNT(DISTINCT user_uuid) as uniqueUsers,
        COUNT(CASE WHEN is_suspicious = 1 THEN 1 END) as suspiciousFingerprints,
        AVG(risk_score) as avgRiskScore,
        COUNT(DISTINCT cluster_id) as totalClusters
      FROM advanced_device_fingerprints
    `);

    return stats;
  }

  /**
   * 获取用户的设备指纹历史
   */
  async getUserFingerprintHistory(userUuid: string, limit: number = 10): Promise<any[]> {
    return await this.db.queryAll(`
      SELECT 
        id, basic_fingerprint, screen_resolution, risk_score,
        is_suspicious, anomaly_flags, first_seen, last_seen
      FROM advanced_device_fingerprints 
      WHERE user_uuid = ?
      ORDER BY last_seen DESC
      LIMIT ?
    `, [userUuid, limit]);
  }
}



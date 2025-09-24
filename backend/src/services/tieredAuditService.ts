/**
 * 分级审核服务
 * 实现三级分级审核系统，根据平台状态动态调整审核严格程度
 * 集成AI辅助审核功能，专门针对就业平台内容安全
 */

import { getRecommendedModelConfig } from '../utils/aiModelChecker';
import { CloudflareEmploymentSafetyChecker, ContentSafetyResult } from '../utils/employmentContentSafety';

// AI审核配置
interface AIAuditConfig {
  enabled: boolean;
  workerUrl: string;
  timeout: number;
  fallbackToRules: boolean;
  confidenceThreshold: number;
}

const AI_AUDIT_CONFIG: AIAuditConfig = {
  enabled: true,
  workerUrl: 'https://ai-content-moderator.your-domain.workers.dev',
  timeout: 5000, // 5秒超时
  fallbackToRules: true,
  confidenceThreshold: 0.7
};

// 分级审核配置
export const AUDIT_LEVELS = {
  level1: {
    name: '一级审核 (宽松)',
    description: '正常运营期，注重用户体验',
    rule_strictness: 0.8,
    ai_threshold: 0.3,
    manual_review_ratio: 0.05,
    enabled_categories: ['POL', 'POR', 'VIO', 'PRI']
  },
  level2: {
    name: '二级审核 (标准)',
    description: '内容质量下降，平衡审核',
    rule_strictness: 1.0,
    ai_threshold: 0.5,
    manual_review_ratio: 0.15,
    enabled_categories: ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS']
  },
  level3: {
    name: '三级审核 (严格)',
    description: '恶意攻击期，严格把控',
    rule_strictness: 1.2,
    ai_threshold: 0.7,
    manual_review_ratio: 0.30,
    enabled_categories: ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH']
  }
} as const;

// 审核规则库
export const AUDIT_RULES = {
  POL: [
    { rule_id: 'POL-001', pattern: '习近平|李克强|中央政府|国家主席', severity: 'high' },
    { rule_id: 'POL-002', pattern: '反[政正]府|推翻制度|颠覆国家', severity: 'high' },
    { rule_id: 'POL-003', pattern: '台独|港独|疆独|藏独', severity: 'high' }
  ],
  POR: [
    { rule_id: 'POR-001', pattern: '性交|裸照|黄片|做爱|性爱', severity: 'high' },
    { rule_id: 'POR-002', pattern: '色情|淫秽|三级片|成人电影', severity: 'high' },
    { rule_id: 'POR-003', pattern: '约炮|一夜情|援交|包养', severity: 'medium' }
  ],
  VIO: [
    { rule_id: 'VIO-001', pattern: '杀人|血腥|爆炸|持刀|持枪', severity: 'medium' },
    { rule_id: 'VIO-002', pattern: '自杀|跳楼|割腕|上吊', severity: 'high' },
    { rule_id: 'VIO-003', pattern: '恐怖主义|炸弹|袭击|暴力', severity: 'high' }
  ],
  ADV: [
    { rule_id: 'ADV-001', pattern: '微信号|QQ号|VX|电话|手机', severity: 'medium' },
    { rule_id: 'ADV-002', pattern: '加我|联系我|私聊|扫码', severity: 'low' },
    { rule_id: 'ADV-003', pattern: '代购|刷单|兼职|赚钱', severity: 'medium' }
  ],
  PRI: [
    { rule_id: 'PRI-001', pattern: '\\d{18}|\\d{15}', severity: 'high' },
    { rule_id: 'PRI-002', pattern: '1[3-9]\\d{9}', severity: 'high' },
    { rule_id: 'PRI-003', pattern: '\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}', severity: 'high' }
  ],
  DIS: [
    { rule_id: 'DIS-001', pattern: '垃圾|傻逼|废物|白痴|智障', severity: 'low' },
    { rule_id: 'DIS-002', pattern: '滚蛋|去死|操你|草你', severity: 'medium' },
    { rule_id: 'DIS-003', pattern: '歧视|仇恨|种族|性别', severity: 'medium' }
  ],
  OTH: [
    { rule_id: 'OTH-001', pattern: '测试|test|spam|垃圾信息', severity: 'low' },
    { rule_id: 'OTH-002', pattern: '刷屏|灌水|复制粘贴', severity: 'low' }
  ]
} as const;

// 类型定义
export interface AuditViolation {
  rule_id: string;
  category: string;
  matched_text: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  position: number;
}

export interface AuditResult {
  passed: boolean;
  action: 'approve' | 'reject' | 'ai_review' | 'manual_review' | 'ai_and_rules_flagged' | 'ai_approved' | string;
  requires_manual: boolean;
  confidence: number;
  reason: string;
  risk_score: number;
  violations: AuditViolation[];
  audit_level: string;
  audit_type?: 'rule_based' | 'ai_assisted' | 'hybrid';
  ai_analysis?: AIAuditResult;
}

export interface AIAuditResult {
  riskScore: number;
  confidence: number;
  recommendation: 'approve' | 'review' | 'reject';
  safetyResult?: ContentSafetyResult; // 详细的安全检测结果
  details: {
    classification: any;
    sentiment: any;
    safety: any;
    semantic?: any;
    employmentRelevance?: any;
  };
  processingTime: number;
  modelVersions: {
    classification: string;
    sentiment: string;
    safety: string;
    employmentSafety?: string;
  };
  audit_type: 'ai_assisted';
  cached?: boolean;
}

export interface AuditStats {
  total_submissions: number;
  violation_count: number;
  spam_count: number;
  manual_review_count: number;
  unique_ips: Set<string>;
}

// 全局状态管理
export class TieredAuditManager {
  private currentLevel: keyof typeof AUDIT_LEVELS = 'level1';
  private env: any; // Cloudflare Workers环境，包含AI绑定
  private stats: AuditStats = {
    total_submissions: 0,
    violation_count: 0,
    spam_count: 0,
    manual_review_count: 0,
    unique_ips: new Set()
  };

  constructor(env?: any) {
    this.env = env;
  }

  /**
   * 文本预处理
   */
  private preprocessText(text: string): string {
    if (!text) return '';
    
    // 全角半角转换
    text = text.replace(/（/g, '(').replace(/）/g, ')').replace(/，/g, ',');
    
    // 去除干扰字符
    text = text.replace(/[\s\-_\*\.\u200b\u200c\u200d]+/g, '');
    
    // 数字字母替换
    const replacements: Record<string, string> = {
      '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's',
      '6': 'g', '7': 't', '8': 'b', '9': 'g'
    };
    
    for (const [num, letter] of Object.entries(replacements)) {
      text = text.replace(new RegExp(num, 'g'), letter);
    }
    
    return text.toLowerCase();
  }

  /**
   * 规则匹配
   */
  private matchRule(content: string, rule: any): AuditViolation[] {
    const violations: AuditViolation[] = [];

    try {
      // 使用简单的字符串匹配和正则表达式
      const patterns = rule.pattern.split('|');

      for (const pattern of patterns) {
        // 先尝试简单字符串匹配
        const lowerContent = content.toLowerCase();
        const lowerPattern = pattern.toLowerCase();

        let index = lowerContent.indexOf(lowerPattern);
        while (index !== -1) {
          violations.push({
            rule_id: rule.rule_id,
            category: rule.rule_id.split('-')[0],
            matched_text: content.substring(index, index + pattern.length),
            severity: rule.severity,
            confidence: 0.9,
            position: index
          });

          // 查找下一个匹配
          index = lowerContent.indexOf(lowerPattern, index + 1);
        }

        // 如果包含正则表达式特殊字符，也尝试正则匹配
        if (pattern.includes('\\d') || pattern.includes('[') || pattern.includes(']')) {
          try {
            const regex = new RegExp(pattern, 'gi');
            let match;

            while ((match = regex.exec(content)) !== null) {
              violations.push({
                rule_id: rule.rule_id,
                category: rule.rule_id.split('-')[0],
                matched_text: match[0],
                severity: rule.severity,
                confidence: 0.8,
                position: match.index
              });

              // 防止无限循环
              if (regex.lastIndex === match.index) {
                regex.lastIndex++;
              }
            }
          } catch (regexError) {
            console.error('正则表达式错误:', pattern, regexError);
          }
        }
      }
    } catch (error) {
      console.error('规则匹配错误:', rule.pattern, error);
    }

    return violations;
  }

  /**
   * 应用级别规则
   */
  private applyLevelRules(content: string, contentType: string): AuditViolation[] {
    const violations: AuditViolation[] = [];
    const config = AUDIT_LEVELS[this.currentLevel];
    
    for (const category of config.enabled_categories) {
      const rules = AUDIT_RULES[category as keyof typeof AUDIT_RULES];
      if (!rules) continue;
      
      for (const rule of rules) {
        const matches = this.matchRule(content, rule);
        violations.push(...matches);
      }
    }
    
    return violations;
  }

  /**
   * 计算风险分数
   */
  private calculateRiskScore(violations: AuditViolation[], strictness: number = 1.0): number {
    if (!violations.length) return 0.0;
    
    const severityWeights = { high: 1.0, medium: 0.6, low: 0.3 };
    let totalScore = 0.0;
    
    for (const violation of violations) {
      const weight = severityWeights[violation.severity] || 0.5;
      totalScore += weight * violation.confidence;
    }
    
    return Math.min(1.0, totalScore * strictness);
  }

  /**
   * 做出审核决策
   */
  private makeDecision(riskScore: number, violations: AuditViolation[]): any {
    const config = AUDIT_LEVELS[this.currentLevel];
    
    // 高危违规直接拒绝
    const highSeverityViolations = violations.filter(v => v.severity === 'high');
    if (highSeverityViolations.length > 0) {
      return {
        passed: false,
        action: 'reject',
        requires_manual: false,
        confidence: 0.95,
        reason: 'high_severity_violation'
      };
    }
    
    // 根据风险分数和AI阈值决策
    if (riskScore >= config.ai_threshold) {
      return {
        passed: false,
        action: 'ai_review',
        requires_manual: false,
        confidence: 0.7,
        reason: 'ai_review_required'
      };
    }
    
    // 强制人工审核比例
    if (Math.random() < config.manual_review_ratio) {
      return {
        passed: false,
        action: 'manual_review',
        requires_manual: true,
        confidence: 0.5,
        reason: 'random_manual_review'
      };
    }
    
    // 通过
    return {
      passed: true,
      action: 'approve',
      requires_manual: false,
      confidence: 0.9,
      reason: 'auto_approved'
    };
  }

  /**
   * 更新统计
   */
  private updateStats(decision: any, violations: AuditViolation[], userIP?: string): void {
    this.stats.total_submissions += 1;
    
    if (violations.length > 0) {
      this.stats.violation_count += 1;
    }
    
    if (decision.requires_manual) {
      this.stats.manual_review_count += 1;
    }
    
    if (userIP) {
      this.stats.unique_ips.add(userIP);
    }
    
    // 检查是否为垃圾内容
    const spamCategories = ['ADV', 'OTH'];
    if (violations.some(v => spamCategories.includes(v.category))) {
      this.stats.spam_count += 1;
    }
    
    // 检查是否需要自动切换级别
    this.checkAutoLevelSwitch();
  }

  /**
   * 检查自动级别切换
   */
  private checkAutoLevelSwitch(): void {
    const violationRate = this.stats.violation_count / Math.max(this.stats.total_submissions, 1);
    
    // 升级条件
    if (this.currentLevel === 'level1') {
      if (violationRate > 0.15 || this.stats.spam_count > 50 || this.stats.manual_review_count > 100) {
        this.currentLevel = 'level2';
        console.log('自动切换到level2:', this.stats);
      }
    } else if (this.currentLevel === 'level2') {
      if (violationRate > 0.25 || this.stats.spam_count > 100) {
        this.currentLevel = 'level3';
        console.log('自动切换到level3:', this.stats);
      }
    }
    
    // 降级条件（简化版）
    if (violationRate < 0.05 && this.stats.total_submissions > 100) {
      if (this.currentLevel === 'level3') {
        this.currentLevel = 'level2';
        console.log('自动降级到level2:', this.stats);
      } else if (this.currentLevel === 'level2') {
        this.currentLevel = 'level1';
        console.log('自动降级到level1:', this.stats);
      }
    }
  }

  /**
   * 检查内容 - 集成AI辅助审核
   */
  public async checkContent(content: string, contentType: string = 'story', userIP?: string): Promise<AuditResult> {
    // 预处理内容
    const processedContent = this.preprocessText(content);

    // 并行执行规则审核和AI审核
    const [ruleBasedResult, aiResult] = await Promise.all([
      this.performRuleBasedAudit(processedContent, contentType, userIP),
      this.performAIAudit(content, contentType, userIP)
    ]);

    // 智能决策融合
    const finalResult = this.mergeAuditResults(ruleBasedResult, aiResult);

    // 更新统计
    this.updateStats(finalResult, finalResult.violations, userIP);

    return finalResult;
  }

  /**
   * 执行基于规则的审核
   */
  private performRuleBasedAudit(content: string, contentType: string, userIP?: string): AuditResult {
    // 应用当前级别的规则
    const violations = this.applyLevelRules(content, contentType);

    // 计算风险分数
    const config = AUDIT_LEVELS[this.currentLevel];
    const riskScore = this.calculateRiskScore(violations, config.rule_strictness);

    // 做出决策
    const decision = this.makeDecision(riskScore, violations);

    return {
      passed: decision.passed,
      action: decision.action,
      requires_manual: decision.requires_manual,
      confidence: decision.confidence,
      reason: decision.reason,
      risk_score: riskScore,
      violations: violations,
      audit_level: this.currentLevel,
      audit_type: 'rule_based'
    };
  }

  /**
   * 执行AI辅助审核 - 增强版，集成就业平台专用安全检测
   */
  private async performAIAudit(content: string, contentType: string, userIP?: string): Promise<AIAuditResult | null> {
    if (!AI_AUDIT_CONFIG.enabled) {
      return null;
    }

    try {
      const startTime = Date.now();

      // 如果有AI绑定，使用本地AI检测
      if (this.env?.AI) {
        return await this.performLocalAIAudit(content, contentType, userIP);
      }

      // 否则使用远程AI Worker
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_AUDIT_CONFIG.timeout);

      const response = await fetch(`${AI_AUDIT_CONFIG.workerUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          contentType,
          metadata: {
            ip: userIP,
            timestamp: new Date().toISOString()
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI audit failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          ...result.data,
          audit_type: 'ai_assisted',
          cached: result.cached || false,
          processingTime: Date.now() - startTime
        };
      } else {
        throw new Error(result.error || 'AI audit failed');
      }

    } catch (error) {
      console.warn('AI审核失败，使用规则审核:', error);

      // 记录AI审核失败
      this.stats.ai_failures = (this.stats.ai_failures || 0) + 1;

      return null;
    }
  }

  /**
   * 本地AI审核 - 使用Cloudflare Workers AI
   */
  private async performLocalAIAudit(content: string, contentType: string, userIP?: string): Promise<AIAuditResult | null> {
    try {
      const startTime = Date.now();

      // 获取推荐的AI模型配置
      const { models, availabilityReport } = await getRecommendedModelConfig(this.env.AI);

      // 创建就业平台专用安全检测器
      const safetyChecker = new CloudflareEmploymentSafetyChecker(this.env.AI, models);

      // 执行安全检测
      const safetyResult = await safetyChecker.checkContent(content, contentType);

      const processingTime = Date.now() - startTime;

      // 构建AI审核结果
      const aiResult: AIAuditResult = {
        riskScore: safetyResult.riskScore,
        confidence: safetyResult.confidence,
        recommendation: safetyResult.recommendation,
        safetyResult: safetyResult,
        details: {
          classification: {
            categories: safetyResult.categories,
            violations: safetyResult.violations
          },
          sentiment: {
            score: safetyResult.categories.harassment > 0.5 ? 'negative' : 'neutral'
          },
          safety: {
            isSafe: safetyResult.isSafe,
            violations: safetyResult.violations,
            categories: safetyResult.categories
          },
          semantic: {
            relevance: 1 - safetyResult.categories.offtopic
          },
          employmentRelevance: {
            score: 1 - safetyResult.categories.offtopic,
            isRelevant: safetyResult.categories.offtopic < 0.5
          }
        },
        processingTime,
        modelVersions: {
          classification: models.textClassification || 'unknown',
          sentiment: models.sentimentAnalysis || 'unknown',
          safety: models.primarySafety || 'unknown',
          employmentSafety: models.employmentContentAnalysis || 'unknown'
        },
        audit_type: 'ai_assisted',
        cached: false
      };

      console.log(`[AI_AUDIT] Local AI audit completed in ${processingTime}ms, risk score: ${safetyResult.riskScore}`);

      return aiResult;

    } catch (error) {
      console.error('[AI_AUDIT] Local AI audit failed:', error);
      return null;
    }
  }

  /**
   * 融合审核结果
   */
  private mergeAuditResults(ruleResult: AuditResult, aiResult: AIAuditResult | null): AuditResult {
    // 如果AI不可用，使用规则结果
    if (!aiResult) {
      return {
        ...ruleResult,
        reason: ruleResult.reason + '_ai_unavailable'
      };
    }

    // 如果AI置信度太低，主要依赖规则审核
    if (aiResult.confidence < AI_AUDIT_CONFIG.confidenceThreshold) {
      return {
        ...ruleResult,
        ai_analysis: aiResult,
        reason: ruleResult.reason + '_low_ai_confidence'
      };
    }

    // 智能决策融合逻辑
    const combinedRiskScore = this.calculateCombinedRiskScore(ruleResult.risk_score, aiResult.riskScore);

    // 如果AI和规则都认为有风险，提高严格度
    if (ruleResult.risk_score > 0.5 && aiResult.riskScore > 0.5) {
      return {
        passed: false,
        action: 'ai_and_rules_flagged',
        requires_manual: true,
        confidence: Math.min(ruleResult.confidence + aiResult.confidence, 1.0),
        reason: 'high_risk_consensus',
        risk_score: combinedRiskScore,
        violations: ruleResult.violations,
        audit_level: this.currentLevel,
        audit_type: 'hybrid',
        ai_analysis: aiResult
      };
    }

    // 如果AI和规则意见分歧，触发人工审核
    if (Math.abs(ruleResult.risk_score - aiResult.riskScore) > 0.4) {
      return {
        passed: false,
        action: 'manual_review',
        requires_manual: true,
        confidence: 0.5,
        reason: 'ai_rule_disagreement',
        risk_score: combinedRiskScore,
        violations: ruleResult.violations,
        audit_level: this.currentLevel,
        audit_type: 'hybrid',
        ai_analysis: aiResult
      };
    }

    // 如果AI推荐通过且规则风险较低，自动通过
    if (aiResult.recommendation === 'approve' && ruleResult.risk_score < 0.3) {
      return {
        passed: true,
        action: 'ai_approved',
        requires_manual: false,
        confidence: aiResult.confidence,
        reason: 'ai_low_risk',
        risk_score: combinedRiskScore,
        violations: [],
        audit_level: this.currentLevel,
        audit_type: 'hybrid',
        ai_analysis: aiResult
      };
    }

    // 默认使用更严格的结果
    const useAIResult = aiResult.riskScore > ruleResult.risk_score;

    if (useAIResult) {
      return {
        passed: aiResult.recommendation === 'approve',
        action: `ai_${aiResult.recommendation}`,
        requires_manual: aiResult.recommendation === 'review',
        confidence: aiResult.confidence,
        reason: 'ai_primary_decision',
        risk_score: combinedRiskScore,
        violations: ruleResult.violations,
        audit_level: this.currentLevel,
        audit_type: 'hybrid',
        ai_analysis: aiResult
      };
    } else {
      return {
        ...ruleResult,
        risk_score: combinedRiskScore,
        ai_analysis: aiResult,
        audit_type: 'hybrid'
      };
    }
  }

  /**
   * 计算组合风险分数
   */
  private calculateCombinedRiskScore(ruleScore: number, aiScore: number): number {
    // 加权平均，AI权重稍高
    const ruleWeight = 0.4;
    const aiWeight = 0.6;

    return Math.min(ruleScore * ruleWeight + aiScore * aiWeight, 1.0);
  }

  /**
   * 获取当前级别
   */
  public getCurrentLevel() {
    return {
      current_level: this.currentLevel,
      config: {
        config_name: AUDIT_LEVELS[this.currentLevel].name,
        description: AUDIT_LEVELS[this.currentLevel].description,
        rule_strictness: AUDIT_LEVELS[this.currentLevel].rule_strictness,
        ai_threshold: AUDIT_LEVELS[this.currentLevel].ai_threshold,
        manual_review_ratio: AUDIT_LEVELS[this.currentLevel].manual_review_ratio,
        enabled_categories: AUDIT_LEVELS[this.currentLevel].enabled_categories
      },
      auto_switch: true
    };
  }

  /**
   * 切换级别
   */
  public switchLevel(newLevel: keyof typeof AUDIT_LEVELS): boolean {
    if (!AUDIT_LEVELS[newLevel]) {
      return false;
    }
    
    const oldLevel = this.currentLevel;
    this.currentLevel = newLevel;
    
    console.log(`审核级别切换: ${oldLevel} -> ${newLevel}`);
    return true;
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    const violationRate = this.stats.violation_count / Math.max(this.stats.total_submissions, 1);
    
    return {
      current_level: this.currentLevel,
      current_hour_stats: {
        total_submissions: this.stats.total_submissions,
        violation_count: this.stats.violation_count,
        violation_rate: Math.round(violationRate * 1000) / 10, // 转换为百分比
        spam_count: this.stats.spam_count,
        manual_review_count: this.stats.manual_review_count,
        unique_ips: this.stats.unique_ips.size
      },
      level_configs: AUDIT_LEVELS
    };
  }
}

// 创建全局实例
export const tieredAuditManager = new TieredAuditManager();

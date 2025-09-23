/**
 * 分级审核服务
 * 实现三级分级审核系统，根据平台状态动态调整审核严格程度
 */

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
  action: 'approve' | 'reject' | 'ai_review' | 'manual_review';
  requires_manual: boolean;
  confidence: number;
  reason: string;
  risk_score: number;
  violations: AuditViolation[];
  audit_level: string;
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
  private stats: AuditStats = {
    total_submissions: 0,
    violation_count: 0,
    spam_count: 0,
    manual_review_count: 0,
    unique_ips: new Set()
  };

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
   * 检查内容
   */
  public checkContent(content: string, contentType: string = 'story', userIP?: string): AuditResult {
    // 预处理内容
    const processedContent = this.preprocessText(content);
    
    // 应用当前级别的规则
    const violations = this.applyLevelRules(processedContent, contentType);
    
    // 计算风险分数
    const config = AUDIT_LEVELS[this.currentLevel];
    const riskScore = this.calculateRiskScore(violations, config.rule_strictness);
    
    // 做出决策
    const decision = this.makeDecision(riskScore, violations);
    
    // 更新统计
    this.updateStats(decision, violations, userIP);
    
    return {
      passed: decision.passed,
      action: decision.action,
      requires_manual: decision.requires_manual,
      confidence: decision.confidence,
      reason: decision.reason,
      risk_score: riskScore,
      violations: violations,
      audit_level: this.currentLevel
    };
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

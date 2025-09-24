/**
 * 前端即时内容过滤器
 * 在用户输入时进行实时检查，提供即时反馈
 */

export interface ContentFilterResult {
  isValid: boolean;
  violations: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FilterRule {
  type: 'profanity' | 'adult' | 'spam' | 'length';
  pattern: string | RegExp;
  message: string;
  suggestion?: string;
}

export class FrontendContentFilter {
  private rules: FilterRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // 辱骂/粗口词汇 - 即时检测
    const profanityWords = [
      '傻逼', '白痴', '蠢货', '智障', '脑残',
      '操', '草', '妈的', '他妈的', '去死',
      '滚', '狗屎', '混蛋', '王八蛋', '贱人',
      '婊子', '妓女', '鸡', '屌', '逼',
      'fuck', 'shit', 'damn', 'bitch', 'asshole'
    ];

    // 色情/成人内容关键词
    const adultWords = [
      '性爱', '做爱', '性交', '自慰', '手淫',
      '色情', '黄色', '裸体', '性器官', '阴茎',
      '阴道', '乳房', '胸部', '屁股', '性感',
      '约炮', '一夜情', '援交', '卖淫', '嫖娼'
    ];

    // 垃圾信息模式
    const spamPatterns = [
      /(.)\1{4,}/g,                    // 重复字符 aaaa
      /[0-9]{11,}/g,                   // 长数字串(手机号等)
      /(微信|QQ|电话|联系).{0,5}[0-9]/g, // 联系方式
      /(加我|私聊|详聊)/g,              // 私下联系
      /(赚钱|兼职|代理|加盟)/g,         // 商业推广
    ];

    // 构建规则
    profanityWords.forEach(word => {
      this.rules.push({
        type: 'profanity',
        pattern: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        message: `内容包含不当词汇"${word}"`,
        suggestion: '请使用文明用语描述您的就业经历'
      });
    });

    adultWords.forEach(word => {
      this.rules.push({
        type: 'adult',
        pattern: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        message: `内容包含不适宜词汇"${word}"`,
        suggestion: '请分享与就业、职业发展相关的内容'
      });
    });

    spamPatterns.forEach((pattern, index) => {
      this.rules.push({
        type: 'spam',
        pattern: pattern,
        message: '内容可能包含垃圾信息',
        suggestion: '请专注分享真实的就业经历和经验'
      });
    });

    // 长度检查
    this.rules.push({
      type: 'length',
      pattern: '',
      message: '内容长度不符合要求',
      suggestion: '故事内容应在50-2000字之间'
    });
  }

  /**
   * 检查内容是否符合规范
   */
  checkContent(content: string): ContentFilterResult {
    const violations: string[] = [];
    const suggestions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 基础检查
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        violations: ['内容不能为空'],
        suggestions: ['请输入您的就业故事'],
        riskLevel: 'low'
      };
    }

    // 长度检查
    const trimmedContent = content.trim();
    if (trimmedContent.length < 50) {
      violations.push('内容过短，至少需要50个字符');
      suggestions.push('请详细描述您的就业经历');
    } else if (trimmedContent.length > 2000) {
      violations.push('内容过长，最多2000个字符');
      suggestions.push('请精简您的故事内容');
    }

    // 规则检查
    for (const rule of this.rules) {
      if (rule.type === 'length') continue; // 长度已单独检查

      let matches: RegExpMatchArray | null = null;
      
      if (rule.pattern instanceof RegExp) {
        matches = content.match(rule.pattern);
      } else if (typeof rule.pattern === 'string' && rule.pattern) {
        matches = content.includes(rule.pattern) ? [rule.pattern] : null;
      }

      if (matches) {
        violations.push(rule.message);
        if (rule.suggestion) {
          suggestions.push(rule.suggestion);
        }

        // 根据违规类型设置风险级别
        if (rule.type === 'profanity' || rule.type === 'adult') {
          riskLevel = 'high';
        } else if (rule.type === 'spam' && riskLevel !== 'high') {
          riskLevel = 'medium';
        }
      }
    }

    // 去重建议
    const uniqueSuggestions = Array.from(new Set(suggestions));

    return {
      isValid: violations.length === 0,
      violations,
      suggestions: uniqueSuggestions,
      riskLevel
    };
  }

  /**
   * 实时检查 - 用于输入时的即时反馈
   */
  realtimeCheck(content: string): {
    hasIssues: boolean;
    message?: string;
    type?: 'warning' | 'error';
  } {
    // 只检查严重违规（辱骂、色情）
    const seriousRules = this.rules.filter(rule => 
      rule.type === 'profanity' || rule.type === 'adult'
    );

    for (const rule of seriousRules) {
      if (rule.pattern instanceof RegExp && content.match(rule.pattern)) {
        return {
          hasIssues: true,
          message: '检测到不当内容，请修改后再提交',
          type: 'error'
        };
      }
    }

    // 长度警告
    if (content.length > 1800) {
      return {
        hasIssues: true,
        message: `内容较长 (${content.length}/2000)，建议精简`,
        type: 'warning'
      };
    }

    return { hasIssues: false };
  }

  /**
   * 获取内容建议
   */
  getContentSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    if (content.length < 100) {
      suggestions.push('可以详细描述求职过程中的具体经历');
    }

    if (!content.includes('工作') && !content.includes('就业') && !content.includes('求职')) {
      suggestions.push('建议突出与就业相关的内容');
    }

    if (content.split('。').length < 3) {
      suggestions.push('可以分段描述，让故事更有条理');
    }

    return suggestions;
  }

  /**
   * 敏感词替换建议
   */
  getSanitizedContent(content: string): string {
    let sanitized = content;

    // 替换常见的轻微不当词汇
    const replacements: Record<string, string> = {
      '傻逼': '不合理',
      '白痴': '不专业',
      '蠢货': '不合适',
      '垃圾': '不好',
      '狗屎': '糟糕',
      '操': '糟',
      '草': '糟'
    };

    for (const [bad, good] of Object.entries(replacements)) {
      const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitized = sanitized.replace(regex, good);
    }

    return sanitized;
  }
}

// 导出单例实例
export const contentFilter = new FrontendContentFilter();

// React Hook for easy integration
export function useContentFilter() {
  return {
    checkContent: (content: string) => contentFilter.checkContent(content),
    realtimeCheck: (content: string) => contentFilter.realtimeCheck(content),
    getSuggestions: (content: string) => contentFilter.getContentSuggestions(content),
    getSanitized: (content: string) => contentFilter.getSanitizedContent(content)
  };
}

/**
 * 增强版问卷数据生成器
 * 基于新的问卷定义格式生成测试数据
 */

import { getQuestionnaireDefinition, convertResponseForStatistics } from '../config/questionnaireDefinitions';
import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

export interface QuestionnaireGenerationConfig {
  questionnaireId: string;
  count: number;
  includeMetadata?: boolean;
  randomSeed?: number;
  distributionWeights?: Record<string, Record<string, number>>;
}

export interface GeneratedQuestionnaireData {
  questionnaireId: string;
  sectionResponses: Array<{
    sectionId: string;
    questionResponses: Array<{
      questionId: string;
      value: any;
      timestamp: number;
    }>;
  }>;
  metadata: {
    submittedAt: number;
    completionTime: number;
    userAgent: string;
    version: string;
    submissionType: string;
    userId?: string;
    isCompleted: boolean;
    ipAddress: string;
  };
}

export class EnhancedQuestionnaireDataGenerator {
  private questionnaire: UniversalQuestionnaire;
  private config: QuestionnaireGenerationConfig;

  constructor(config: QuestionnaireGenerationConfig) {
    this.config = config;
    const questionnaire = getQuestionnaireDefinition(config.questionnaireId);
    if (!questionnaire) {
      throw new Error(`Questionnaire not found: ${config.questionnaireId}`);
    }
    this.questionnaire = questionnaire;
  }

  /**
   * 生成批量问卷数据
   */
  generateBatch(): GeneratedQuestionnaireData[] {
    const results: GeneratedQuestionnaireData[] = [];
    
    for (let i = 0; i < this.config.count; i++) {
      results.push(this.generateSingle());
    }
    
    return results;
  }

  /**
   * 生成单个问卷数据
   */
  private generateSingle(): GeneratedQuestionnaireData {
    const sectionResponses = this.questionnaire.sections.map(section => ({
      sectionId: section.id,
      questionResponses: section.questions.map(question => ({
        questionId: question.id,
        value: this.generateQuestionValue(question),
        timestamp: Date.now() - Math.random() * 1000 * 60 * 5 // 5分钟内随机时间
      }))
    }));

    const metadata = {
      submittedAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30, // 30天内随机时间
      completionTime: Math.floor(Math.random() * 600) + 120, // 2-12分钟
      userAgent: this.getRandomUserAgent(),
      version: this.questionnaire.metadata.version || '2.0.0',
      submissionType: this.getRandomSubmissionType(),
      userId: Math.random() > 0.7 ? `user_${Math.random().toString(36).substr(2, 9)}` : undefined,
      isCompleted: true,
      ipAddress: this.generateRandomIP()
    };

    return {
      questionnaireId: this.config.questionnaireId,
      sectionResponses,
      metadata
    };
  }

  /**
   * 为问题生成随机值
   */
  private generateQuestionValue(question: any): any {
    const weights = this.config.distributionWeights?.[question.id];

    switch (question.type) {
      case 'radio':
        if (question.options && question.options.length > 0) {
          return this.getWeightedRandomOption(question.options, weights);
        }
        return null;

      case 'checkbox':
        if (question.options && question.options.length > 0) {
          const selectedCount = Math.floor(Math.random() * Math.min(3, question.options.length)) + 1;
          const selected = [];
          const shuffled = [...question.options].sort(() => Math.random() - 0.5);
          for (let i = 0; i < selectedCount; i++) {
            selected.push(shuffled[i].value);
          }
          return selected;
        }
        return [];

      case 'text':
        return this.generateRandomText(question.id);

      case 'textarea':
        return this.generateRandomLongText(question.id);

      case 'number':
        return Math.floor(Math.random() * 100) + 1;

      case 'range':
        const min = question.min || 1;
        const max = question.max || 10;
        return Math.floor(Math.random() * (max - min + 1)) + min;

      default:
        return null;
    }
  }

  /**
   * 根据权重选择选项
   */
  private getWeightedRandomOption(options: any[], weights?: Record<string, number>): string {
    if (!weights) {
      return options[Math.floor(Math.random() * options.length)].value;
    }

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
      const weight = weights[option.value] || 1;
      random -= weight;
      if (random <= 0) {
        return option.value;
      }
    }

    return options[0].value;
  }

  /**
   * 生成随机文本
   */
  private generateRandomText(questionId: string): string {
    const textSamples: Record<string, string[]> = {
      'anonymous-nickname': ['小明', '小红', '小李', '小王', '小张', '小刘', '小陈', '小杨'],
      'company-name': ['阿里巴巴', '腾讯', '百度', '字节跳动', '美团', '滴滴', '京东', '网易'],
      'position-title': ['软件工程师', '产品经理', '数据分析师', '运营专员', '设计师', '测试工程师'],
      'default': ['测试数据', '示例内容', '随机文本', '样本数据']
    };

    const samples = textSamples[questionId] || textSamples['default'];
    return samples[Math.floor(Math.random() * samples.length)];
  }

  /**
   * 生成随机长文本
   */
  private generateRandomLongText(questionId: string): string {
    const longTextSamples = [
      '我觉得当前的就业环境比较严峻，但是通过努力学习和提升技能，还是能找到合适的工作机会。',
      '希望能够在一个有发展前景的公司工作，学习更多的专业知识，为社会做出贡献。',
      '求职过程中遇到了一些困难，但是通过不断调整策略和提升自己，最终找到了满意的工作。',
      '建议政府和企业能够提供更多的就业机会和培训项目，帮助大学生更好地适应职场。'
    ];

    return longTextSamples[Math.floor(Math.random() * longTextSamples.length)];
  }

  /**
   * 获取随机用户代理
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * 获取随机提交类型
   */
  private getRandomSubmissionType(): string {
    const types = ['anonymous', 'quick-register', 'login-submit'];
    const weights = [0.6, 0.3, 0.1]; // 60% 匿名, 30% 快捷注册, 10% 登录提交
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }
    
    return types[0];
  }

  /**
   * 生成随机IP地址
   */
  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  /**
   * 获取生成统计信息
   */
  getGenerationStats() {
    return {
      questionnaireId: this.config.questionnaireId,
      questionnaireName: this.questionnaire.title,
      sectionsCount: this.questionnaire.sections.length,
      questionsCount: this.questionnaire.sections.reduce((total, section) => total + section.questions.length, 0),
      estimatedDataSize: this.config.count * 2, // KB per response estimate
      generationConfig: this.config
    };
  }
}

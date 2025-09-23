/**
 * 配置驱动的问卷数据生成器
 * 基于问卷配置自动生成符合结构的测试数据
 */

import type { UniversalQuestionnaire, Question } from '../types/universal-questionnaire';

// 数据模板
const dataTemplates = {
  // 学历分布（基于真实统计）
  'education-level': {
    'high-school': 0.05,
    'junior-college': 0.15,
    'bachelor': 0.50,
    'master': 0.25,
    'phd': 0.05
  },
  
  // 专业领域分布
  'major-field': {
    'engineering': 0.35,
    'science': 0.15,
    'medicine': 0.08,
    'agriculture': 0.03,
    'management': 0.12,
    'economics': 0.10,
    'law': 0.05,
    'education': 0.04,
    'literature': 0.06,
    'history': 0.01,
    'philosophy': 0.01,
    'art': 0.05
  },
  
  // 毕业时间分布
  'graduation-year': {
    '2024': 0.40,
    '2023': 0.30,
    '2022': 0.15,
    '2021': 0.10,
    '2020': 0.03,
    'before-2020': 0.02
  },
  
  // 性别分布
  'gender': {
    'male': 0.52,
    'female': 0.47,
    'prefer-not-say': 0.01
  },
  
  // 年龄段分布
  'age-range': {
    'under-20': 0.05,
    '20-22': 0.35,
    '23-25': 0.40,
    '26-28': 0.15,
    '29-35': 0.04,
    'over-35': 0.01
  },
  
  // 本科及以上院校类型分布
  'university-tier-undergraduate': {
    '985': 0.08,
    '211': 0.12,
    'double-first-class': 0.15,
    'regular-public': 0.50,
    'private': 0.10,
    'research-institute': 0.02,
    'overseas': 0.02,
    'other': 0.01
  },

  // 专科院校类型分布
  'university-tier-vocational': {
    'public-vocational': 0.60,
    'private-vocational': 0.25,
    'technical-college': 0.08,
    'vocational-university': 0.05,
    'adult-education': 0.02
  },
  
  // 就业状态分布
  'current-status': {
    'fulltime': 0.45,
    'parttime': 0.08,
    'internship': 0.12,
    'freelance': 0.05,
    'unemployed': 0.15,
    'student': 0.10,
    'preparing': 0.05
  },
  
  // 工作满意度分布
  'job-satisfaction': {
    '5': 0.15,
    '4': 0.35,
    '3': 0.30,
    '2': 0.15,
    '1': 0.05
  },
  
  // 薪资分布
  'current-salary': {
    'below-3k': 0.05,
    '3k-5k': 0.15,
    '5k-8k': 0.25,
    '8k-12k': 0.30,
    '12k-20k': 0.20,
    '20k-30k': 0.04,
    'above-30k': 0.01
  },
  
  // 期望薪资分布
  'salary-expectation': {
    'below-4k': 0.02,
    '4k-6k': 0.08,
    '6k-8k': 0.20,
    '8k-12k': 0.35,
    '12k-18k': 0.25,
    '18k-25k': 0.08,
    'above-25k': 0.02
  },
  
  // 工作地点偏好分布
  'work-location-preference': {
    'tier1': 0.40,
    'new-tier1': 0.30,
    'tier2': 0.20,
    'tier3': 0.08,
    'hometown': 0.15,
    'flexible': 0.12
  },

  // 公司规模分布（条件显示：仅全职工作时）
  'company-size': {
    'startup': 0.15,
    'small': 0.25,
    'medium': 0.30,
    'large': 0.20,
    'giant': 0.08,
    'government': 0.02
  },

  // 工作行业分布（条件显示：仅全职工作时）
  'work-industry': {
    'internet-tech': 0.25,
    'finance': 0.15,
    'education': 0.12,
    'healthcare': 0.08,
    'manufacturing': 0.15,
    'real-estate': 0.05,
    'government': 0.08,
    'media': 0.04,
    'retail': 0.03,
    'logistics': 0.03,
    'other': 0.02
  },

  // 工作地点分布（条件显示：仅全职工作时）
  'work-location': {
    'tier1': 0.35,
    'new-tier1': 0.30,
    'tier2': 0.25,
    'tier3': 0.08,
    'overseas': 0.02
  },

  // 失业时长分布
  'unemployment-duration': {
    'less-than-1-month': 0.20,
    '1-3-months': 0.30,
    '3-6-months': 0.25,
    '6-12-months': 0.15,
    'more-than-1-year': 0.10
  },

  // 求职困难程度感知
  'difficulty-perception': {
    'very-easy': 0.02,
    'easy': 0.08,
    'moderate': 0.35,
    'difficult': 0.40,
    'very-difficult': 0.15
  },

  // 面试经历
  'interview-experience': {
    'none': 0.10,
    '1-3': 0.25,
    '4-10': 0.35,
    '11-20': 0.20,
    'more-than-20': 0.10
  },

  // 工作模式偏好
  'work-mode-preference': {
    'onsite': 0.45,
    'remote': 0.20,
    'hybrid': 0.35
  },

  // 加班接受度
  'overtime-acceptance': {
    'never': 0.15,
    'occasionally': 0.40,
    'regularly': 0.30,
    'frequently': 0.12,
    'always': 0.03
  },

  // 专业满意度
  'major-satisfaction': {
    '5': 0.20,
    '4': 0.35,
    '3': 0.30,
    '2': 0.12,
    '1': 0.03
  },

  // 转行意向
  'career-change-intention': {
    'never': 0.25,
    'considered': 0.45,
    'planning': 0.20,
    'in-progress': 0.08,
    'completed': 0.02
  },

  // 技能自信度
  'skill-confidence': {
    '5': 0.15,
    '4': 0.35,
    '3': 0.35,
    '2': 0.12,
    '1': 0.03
  },

  // 问卷体验评价
  'survey-experience': {
    '5': 0.40,
    '4': 0.35,
    '3': 0.20,
    '2': 0.04,
    '1': 0.01
  },

  // 求职困难（多选）
  'job-hunting-difficulties': [
    'market-competition',
    'skill-mismatch',
    'lack-experience',
    'insufficient-skills',
    'resume-issues',
    'interview-problems',
    'information-gap',
    'location-limits',
    'salary-mismatch',
    'psychological-pressure'
  ],

  // 在校年级分布
  'current-grade': {
    'freshman': 0.20,
    'sophomore': 0.25,
    'junior': 0.25,
    'senior': 0.20,
    'graduate-1': 0.05,
    'graduate-2': 0.03,
    'graduate-3': 0.02
  },

  // 职业规划分布
  'career-planning': {
    'direct-employment': 0.40,
    'continue-study': 0.25,
    'study-abroad': 0.08,
    'entrepreneurship': 0.05,
    'civil-service': 0.15,
    'undecided': 0.07
  }
};

// 多选题模板
const multiSelectTemplates = {
  'job-hunting-difficulties': [
    'market-competition',
    'skill-mismatch', 
    'lack-experience',
    'insufficient-skills',
    'resume-issues',
    'interview-problems',
    'information-gap',
    'location-limits',
    'salary-mismatch',
    'psychological-pressure'
  ],
  
  'job-search-channels': [
    'online-platforms',
    'social-recruitment',
    'campus-recruitment',
    'company-website',
    'referral',
    'headhunter',
    'government-service',
    'social-media'
  ],
  
  'preferred-industries': [
    'internet-tech',
    'finance',
    'education',
    'healthcare',
    'manufacturing',
    'real-estate',
    'government',
    'media',
    'retail',
    'logistics',
    'energy',
    'agriculture'
  ],
  
  'work-priorities': [
    'salary',
    'career-development',
    'work-life-balance',
    'company-culture',
    'job-stability',
    'learning-opportunity',
    'location',
    'industry-prospect',
    'social-status',
    'personal-interest'
  ],
  
  'employment-pressure-source': [
    'family-expectation',
    'peer-comparison',
    'economic-burden',
    'social-status',
    'career-uncertainty',
    'skill-inadequacy',
    'market-competition',
    'age-anxiety'
  ]
};

// 文本内容模板
const textTemplates = {
  'employment-environment-observation': [
    '当前就业市场竞争激烈，企业对人才要求越来越高，需要不断提升自己的专业技能。',
    '疫情对就业市场产生了较大影响，很多行业都在调整，但新兴行业也在快速发展。',
    '感觉现在的招聘更注重实际能力和项目经验，学历只是敲门砖。',
    '互联网行业虽然薪资较高，但工作压力也很大，需要权衡利弊。',
    '政府对大学生就业的支持政策很多，但还需要更好地落实到位。'
  ],
  
  'suggestions-for-improvement': [
    '建议学校加强与企业的合作，提供更多实习机会，让学生提前了解职场。',
    '希望政府能够出台更多支持大学生创业的政策，鼓励创新创业。',
    '企业应该给应届生更多机会，不要过分要求工作经验。',
    '建议完善就业指导服务，帮助学生更好地规划职业发展。',
    '希望社会能够减少对就业的焦虑情绪，给年轻人更多时间成长。'
  ],
  
  'additional-comments': [
    '希望这个调查能够真正反映大学生的就业现状，为政策制定提供参考。',
    '感谢提供这样的平台让我们表达自己的想法和建议。',
    '希望未来的就业环境能够更加公平公正，给每个人平等的机会。',
    '建议定期进行这样的调查，跟踪就业状况的变化趋势。',
    '希望调查结果能够公开透明，让更多人了解真实情况。'
  ]
};

export class QuestionnaireDataGenerator {
  private questionnaire: UniversalQuestionnaire;
  
  constructor(questionnaire: UniversalQuestionnaire) {
    this.questionnaire = questionnaire;
  }
  
  /**
   * 生成单个问卷响应数据
   */
  generateSingleResponse(): any {
    const sectionResponses = [];
    const allResponses = new Map<string, any>(); // 存储所有响应，用于条件判断

    for (const section of this.questionnaire.sections) {
      // 检查section级别的条件
      if (section.condition && !this.checkCondition(section.condition, allResponses.get(section.condition.dependsOn))) {
        continue; // 跳过不满足条件的section
      }

      const questionResponses = [];

      for (const question of section.questions) {
        const response = this.generateQuestionResponse(question, allResponses);
        if (response !== null) {
          questionResponses.push({
            questionId: question.id,
            value: response
          });
          // 存储响应用于后续条件判断
          allResponses.set(question.id, response);
        }
      }

      // 只有当section有问题响应时才添加
      if (questionResponses.length > 0) {
        sectionResponses.push({
          sectionId: section.id,
          questionResponses
        });
      }
    }

    return {
      sectionResponses,
      submittedAt: new Date().toISOString(),
      isCompleted: Math.random() > 0.1, // 90% 完成率
      timeSpent: Math.floor(Math.random() * 600) + 180 // 3-13分钟
    };
  }
  
  /**
   * 生成单个问题的响应
   */
  private generateQuestionResponse(question: Question, allResponses?: Map<string, any>): any {
    // 检查条件逻辑
    if (question.condition && allResponses) {
      const dependentValue = allResponses.get(question.condition.dependsOn);
      if (!this.checkCondition(question.condition, dependentValue)) {
        return null; // 不满足条件，不生成响应
      }
    }

    // 根据required字段决定是否回答
    if (!question.required && Math.random() > 0.8) {
      return null; // 20% 概率不回答非必填题
    }

    switch (question.type) {
      case 'radio':
      case 'select':
        return this.generateSingleChoice(question);

      case 'checkbox':
        return this.generateMultipleChoice(question);

      case 'textarea':
        return this.generateTextResponse(question);

      default:
        return null;
    }
  }

  /**
   * 检查条件是否满足
   */
  private checkCondition(condition: any, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return true;
    }
  }
  
  /**
   * 生成单选题响应
   */
  private generateSingleChoice(question: Question): string {
    const template = dataTemplates[question.id as keyof typeof dataTemplates];
    
    if (template) {
      return this.weightedRandomChoice(template as Record<string, number>);
    }
    
    // 如果没有模板，随机选择一个选项
    if (question.options && question.options.length > 0) {
      const randomIndex = Math.floor(Math.random() * question.options.length);
      return question.options[randomIndex].value;
    }
    
    return '';
  }
  
  /**
   * 生成多选题响应
   */
  private generateMultipleChoice(question: Question): string[] {
    const template = multiSelectTemplates[question.id as keyof typeof multiSelectTemplates];
    
    if (template) {
      const maxSelections = question.config?.maxSelections || 3;
      const minSelections = question.config?.minSelections || 1;
      
      const selectionCount = Math.floor(Math.random() * (maxSelections - minSelections + 1)) + minSelections;
      
      const shuffled = [...template].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, selectionCount);
    }
    
    // 如果没有模板，随机选择选项
    if (question.options && question.options.length > 0) {
      const maxSelections = Math.min(question.config?.maxSelections || 3, question.options.length);
      const selectionCount = Math.floor(Math.random() * maxSelections) + 1;
      
      const shuffled = [...question.options].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, selectionCount).map(option => option.value);
    }
    
    return [];
  }
  
  /**
   * 生成文本响应
   */
  private generateTextResponse(question: Question): string {
    const template = textTemplates[question.id as keyof typeof textTemplates];
    
    if (template) {
      const randomIndex = Math.floor(Math.random() * template.length);
      return template[randomIndex];
    }
    
    return `这是对问题"${question.title}"的回答。`;
  }
  
  /**
   * 加权随机选择
   */
  private weightedRandomChoice(weights: Record<string, number>): string {
    const items = Object.keys(weights);
    const weightValues = Object.values(weights);
    
    const totalWeight = weightValues.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weightValues[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  /**
   * 批量生成问卷响应数据
   */
  generateBatch(count: number): any[] {
    const responses = [];
    
    for (let i = 0; i < count; i++) {
      responses.push(this.generateSingleResponse());
    }
    
    return responses;
  }
}

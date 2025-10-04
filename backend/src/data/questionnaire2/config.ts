/**
 * 问卷2独立配置系统
 * 完全独立的配置管理，与问卷1无任何依赖关系
 */

import { questionnaire2Definition } from './definition';
import type { UniversalQuestionnaire } from '../../types/universal-questionnaire';

// 问卷2专用注册表
export const QUESTIONNAIRE_V2_REGISTRY: Record<string, UniversalQuestionnaire> = {
  'questionnaire-v2-2024': questionnaire2Definition,
  'employment-survey-v2': questionnaire2Definition, // 兼容性别名
  'intelligent-employment-survey': questionnaire2Definition, // 兼容性别名
};

// 问卷2默认ID
export const DEFAULT_QUESTIONNAIRE_V2_ID = 'questionnaire-v2-2024';

// 问卷2版本信息
export interface QuestionnaireV2Version {
  id: string;
  version: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  systemVersion: 'v2';
}

export const QUESTIONNAIRE_V2_VERSIONS: QuestionnaireV2Version[] = [
  {
    id: 'questionnaire-v2-2024',
    version: '2.0.0',
    title: '2025年智能就业调查（第二版）',
    description: '基于经济压力和生活态度的智能问卷系统，提供个性化的调研体验',
    isActive: true,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
    systemVersion: 'v2'
  }
];

/**
 * 问卷2配置管理类
 */
export class QuestionnaireV2ConfigManager {
  private registry = QUESTIONNAIRE_V2_REGISTRY;
  private versions = QUESTIONNAIRE_V2_VERSIONS;

  /**
   * 获取问卷2定义
   */
  getDefinition(questionnaireId: string): UniversalQuestionnaire | null {
    return this.registry[questionnaireId] || null;
  }

  /**
   * 验证问卷2 ID是否有效
   */
  isValidId(questionnaireId: string): boolean {
    return questionnaireId in this.registry;
  }

  /**
   * 获取所有可用的问卷2 ID
   */
  getAvailableIds(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * 获取问卷2版本信息
   */
  getVersion(questionnaireId: string): QuestionnaireV2Version | null {
    return this.versions.find(v => v.id === questionnaireId) || null;
  }

  /**
   * 获取所有问卷2版本
   */
  getAllVersions(): QuestionnaireV2Version[] {
    return [...this.versions];
  }

  /**
   * 验证问卷2响应数据格式
   */
  validateResponseData(
    questionnaireId: string, 
    responseData: any
  ): { isValid: boolean; errors: string[] } {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) {
      return { isValid: false, errors: ['Invalid questionnaire V2 ID'] };
    }

    const errors: string[] = [];

    // 验证新格式数据结构（sectionResponses数组格式）
    if (!responseData.sectionResponses || !Array.isArray(responseData.sectionResponses)) {
      errors.push('Missing or invalid sectionResponses array');
    }

    if (!responseData.metadata) {
      errors.push('Missing metadata');
    }

    // 验证每个section的响应
    if (responseData.sectionResponses) {
      for (const sectionResponse of responseData.sectionResponses) {
        if (!sectionResponse.sectionId) {
          errors.push('Missing sectionId in section response');
        }

        if (!sectionResponse.questionResponses || !Array.isArray(sectionResponse.questionResponses)) {
          errors.push(`Invalid questionResponses for section ${sectionResponse.sectionId}`);
        }

        // 验证问题响应
        if (sectionResponse.questionResponses) {
          for (const questionResponse of sectionResponse.questionResponses) {
            if (!questionResponse.questionId) {
              errors.push(`Missing questionId in section ${sectionResponse.sectionId}`);
            }
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 获取问卷2的所有问题ID
   */
  getQuestionIds(questionnaireId: string): string[] {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) return [];

    const questionIds: string[] = [];
    for (const section of questionnaire.sections) {
      for (const question of section.questions) {
        questionIds.push(question.id);
      }
    }
    return questionIds;
  }

  /**
   * 获取问题的选项值
   */
  getQuestionOptions(questionnaireId: string, questionId: string): string[] {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) return [];

    for (const section of questionnaire.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question && question.options) {
        return question.options.map(option => option.value);
      }
    }
    return [];
  }

  /**
   * 数据格式转换：将问卷2数据转换为统计友好格式
   */
  convertResponseForStatistics(
    questionnaireId: string,
    responseData: any
  ): Record<string, any> {
    const flatData: Record<string, any> = {};

    // 处理新格式数据（sectionResponses数组格式）
    if (responseData.sectionResponses && Array.isArray(responseData.sectionResponses)) {
      for (const sectionResponse of responseData.sectionResponses) {
        if (sectionResponse.questionResponses) {
          for (const questionResponse of sectionResponse.questionResponses) {
            flatData[questionResponse.questionId] = questionResponse.value;
          }
        }
      }
    }

    return flatData;
  }

  /**
   * 获取问卷2系统信息
   */
  getSystemInfo() {
    return {
      systemVersion: 'v2',
      systemName: '智能问卷系统',
      description: '基于经济压力和生活态度的智能问卷系统，提供个性化的调研体验',
      supportedFeatures: [
        'economic-pressure-analysis',
        'employment-confidence-index',
        'branch-logic',
        'smart-navigation',
        'real-time-validation',
        'camelCase-snake_case-conversion'
      ],
      dataFormat: 'structured-array',
      apiPrefix: '/universal-questionnaire',
      databaseTable: 'universal_questionnaire_responses'
    };
  }

  /**
   * 获取经济类问题列表
   */
  getEconomicQuestions(questionnaireId: string): string[] {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) return [];

    const economicQuestions: string[] = [];
    const economicKeywords = [
      'debt', 'salary', 'economic', 'financial', 'confidence', 
      'pressure', 'income', 'loan', 'burden', 'huabei', 'credit-card'
    ];

    for (const section of questionnaire.sections) {
      for (const question of section.questions) {
        const isEconomic = economicKeywords.some(keyword => 
          question.id.includes(keyword) || 
          question.title.includes('经济') ||
          question.title.includes('负债') ||
          question.title.includes('贷款') ||
          question.title.includes('压力') ||
          question.title.includes('信心') ||
          question.title.includes('花呗')
        );
        
        if (isEconomic) {
          economicQuestions.push(question.id);
        }
      }
    }

    return economicQuestions;
  }

  /**
   * 获取分支逻辑配置
   */
  getBranchLogicConfig(questionnaireId: string): Record<string, any> {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) return {};

    const branchConfig: Record<string, any> = {};

    for (const section of questionnaire.sections) {
      if (section.condition) {
        branchConfig[section.id] = section.condition;
      }

      for (const question of section.questions) {
        if (question.branchLogic) {
          branchConfig[question.id] = question.branchLogic;
        }
      }
    }

    return branchConfig;
  }
}

// 导出单例实例
export const questionnaireV2ConfigManager = new QuestionnaireV2ConfigManager();

// 便捷函数导出
export const getQuestionnaireV2Definition = (id: string) => 
  questionnaireV2ConfigManager.getDefinition(id);

export const isValidQuestionnaireV2Id = (id: string) => 
  questionnaireV2ConfigManager.isValidId(id);

export const getAvailableQuestionnaireV2Ids = () => 
  questionnaireV2ConfigManager.getAvailableIds();

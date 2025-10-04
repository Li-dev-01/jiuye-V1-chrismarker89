/**
 * 问卷1独立配置系统
 * 完全独立的配置管理，与问卷2无任何依赖关系
 */

import { questionnaire1Definition } from './definition';
import type { UniversalQuestionnaire } from '../../types/universal-questionnaire';

// 问卷1专用注册表
export const QUESTIONNAIRE_V1_REGISTRY: Record<string, UniversalQuestionnaire> = {
  'questionnaire-v1-2024': questionnaire1Definition,
  'employment-survey-v1': questionnaire1Definition, // 兼容性别名
};

// 问卷1默认ID
export const DEFAULT_QUESTIONNAIRE_V1_ID = 'questionnaire-v1-2024';

// 问卷1版本信息
export interface QuestionnaireV1Version {
  id: string;
  version: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  systemVersion: 'v1';
}

export const QUESTIONNAIRE_V1_VERSIONS: QuestionnaireV1Version[] = [
  {
    id: 'questionnaire-v1-2024',
    version: '1.0.0',
    title: '2025年大学生就业调查（第一版）',
    description: '传统问卷系统，专注于基础就业信息收集',
    isActive: true,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
    systemVersion: 'v1'
  }
];

/**
 * 问卷1配置管理类
 */
export class QuestionnaireV1ConfigManager {
  private registry = QUESTIONNAIRE_V1_REGISTRY;
  private versions = QUESTIONNAIRE_V1_VERSIONS;

  /**
   * 获取问卷1定义
   */
  getDefinition(questionnaireId: string): UniversalQuestionnaire | null {
    return this.registry[questionnaireId] || null;
  }

  /**
   * 验证问卷1 ID是否有效
   */
  isValidId(questionnaireId: string): boolean {
    return questionnaireId in this.registry;
  }

  /**
   * 获取所有可用的问卷1 ID
   */
  getAvailableIds(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * 获取问卷1版本信息
   */
  getVersion(questionnaireId: string): QuestionnaireV1Version | null {
    return this.versions.find(v => v.id === questionnaireId) || null;
  }

  /**
   * 获取所有问卷1版本
   */
  getAllVersions(): QuestionnaireV1Version[] {
    return [...this.versions];
  }

  /**
   * 验证问卷1响应数据格式
   */
  validateResponseData(
    questionnaireId: string, 
    responseData: any
  ): { isValid: boolean; errors: string[] } {
    const questionnaire = this.getDefinition(questionnaireId);
    if (!questionnaire) {
      return { isValid: false, errors: ['Invalid questionnaire V1 ID'] };
    }

    const errors: string[] = [];

    // 验证基本结构
    if (!responseData.personalInfo) {
      errors.push('Missing personalInfo');
    }

    if (!responseData.educationInfo) {
      errors.push('Missing educationInfo');
    }

    if (!responseData.employmentInfo) {
      errors.push('Missing employmentInfo');
    }

    // 验证必填字段
    if (responseData.personalInfo) {
      const required = ['name', 'gender', 'age', 'phone', 'email'];
      for (const field of required) {
        if (!responseData.personalInfo[field]) {
          errors.push(`Missing required field: personalInfo.${field}`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 获取问卷1的所有问题ID
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
   * 数据格式转换：将问卷1数据转换为统计友好格式
   */
  convertResponseForStatistics(
    questionnaireId: string,
    responseData: any
  ): Record<string, any> {
    const flatData: Record<string, any> = {};

    // 处理问卷1的传统数据格式
    if (responseData.personalInfo) {
      Object.assign(flatData, responseData.personalInfo);
    }
    if (responseData.educationInfo) {
      Object.assign(flatData, responseData.educationInfo);
    }
    if (responseData.employmentInfo) {
      Object.assign(flatData, responseData.employmentInfo);
    }
    if (responseData.jobSearchInfo) {
      Object.assign(flatData, responseData.jobSearchInfo);
    }

    return flatData;
  }

  /**
   * 获取问卷1系统信息
   */
  getSystemInfo() {
    return {
      systemVersion: 'v1',
      systemName: '传统问卷系统',
      description: '专注于基础就业信息收集的传统问卷系统',
      supportedFeatures: [
        'basic-demographics',
        'employment-status',
        'job-search-info',
        'traditional-validation'
      ],
      dataFormat: 'traditional-nested',
      apiPrefix: '/questionnaire',
      databaseTable: 'questionnaire_responses'
    };
  }
}

// 导出单例实例
export const questionnaireV1ConfigManager = new QuestionnaireV1ConfigManager();

// 便捷函数导出
export const getQuestionnaireV1Definition = (id: string) => 
  questionnaireV1ConfigManager.getDefinition(id);

export const isValidQuestionnaireV1Id = (id: string) => 
  questionnaireV1ConfigManager.isValidId(id);

export const getAvailableQuestionnaireV1Ids = () => 
  questionnaireV1ConfigManager.getAvailableIds();

/**
 * 统一问卷定义管理
 * 确保前后端使用相同的问卷配置
 */

import { enhancedIntelligentQuestionnaire } from '../data/enhancedIntelligentQuestionnaire';
import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

// 问卷定义注册表
export const QUESTIONNAIRE_REGISTRY: Record<string, UniversalQuestionnaire> = {
  'employment-survey-2024': enhancedIntelligentQuestionnaire,
  'enhanced-intelligent-employment-survey-2024': enhancedIntelligentQuestionnaire,
};

// 默认问卷ID
export const DEFAULT_QUESTIONNAIRE_ID = 'employment-survey-2024';

// 问卷版本管理
export interface QuestionnaireVersion {
  id: string;
  version: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const QUESTIONNAIRE_VERSIONS: QuestionnaireVersion[] = [
  {
    id: 'employment-survey-2024',
    version: '2.0.0',
    title: '2025年智能就业调查（升级版）',
    description: '基于心理学和数据科学原则设计的智能问卷，提供个性化的调研体验',
    isActive: true,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z'
  }
];

/**
 * 获取问卷定义
 */
export function getQuestionnaireDefinition(questionnaireId: string): UniversalQuestionnaire | null {
  return QUESTIONNAIRE_REGISTRY[questionnaireId] || null;
}

/**
 * 验证问卷ID是否有效
 */
export function isValidQuestionnaireId(questionnaireId: string): boolean {
  return questionnaireId in QUESTIONNAIRE_REGISTRY;
}

/**
 * 获取所有可用的问卷ID
 */
export function getAvailableQuestionnaireIds(): string[] {
  return Object.keys(QUESTIONNAIRE_REGISTRY);
}

/**
 * 获取问卷版本信息
 */
export function getQuestionnaireVersion(questionnaireId: string): QuestionnaireVersion | null {
  return QUESTIONNAIRE_VERSIONS.find(v => v.id === questionnaireId) || null;
}

/**
 * 验证问卷响应数据格式
 */
export function validateQuestionnaireResponse(
  questionnaireId: string, 
  responseData: any
): { isValid: boolean; errors: string[] } {
  const questionnaire = getQuestionnaireDefinition(questionnaireId);
  if (!questionnaire) {
    return { isValid: false, errors: ['Invalid questionnaire ID'] };
  }

  const errors: string[] = [];

  // 验证基本结构
  if (!responseData.sectionResponses || !Array.isArray(responseData.sectionResponses)) {
    errors.push('Missing or invalid sectionResponses');
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
 * 获取问卷的所有问题ID
 */
export function getQuestionnaireQuestionIds(questionnaireId: string): string[] {
  const questionnaire = getQuestionnaireDefinition(questionnaireId);
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
export function getQuestionOptions(questionnaireId: string, questionId: string): string[] {
  const questionnaire = getQuestionnaireDefinition(questionnaireId);
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
 * 数据格式转换：将新格式转换为统计友好格式
 */
export function convertResponseForStatistics(
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
  // 处理旧格式数据（sectionResponses对象格式）
  else if (responseData.sectionResponses && typeof responseData.sectionResponses === 'object') {
    // 导入字段映射管理器
    const { FieldMappingManager } = require('../utils/fieldMappingManager');
    const fieldMappingManager = new FieldMappingManager();

    // 将旧格式数据展平
    const oldFormatData: Record<string, any> = {};
    for (const [sectionKey, sectionData] of Object.entries(responseData.sectionResponses)) {
      if (sectionData && typeof sectionData === 'object') {
        Object.assign(oldFormatData, sectionData);
      }
    }

    // 应用字段映射
    const mappedData = fieldMappingManager.applyMapping(oldFormatData);
    Object.assign(flatData, mappedData);
  }

  return flatData;
}

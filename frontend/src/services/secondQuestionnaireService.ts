/**
 * 第二问卷服务 - 完全独立的前端服务
 * 负责camelCase与snake_case转换，与第一问卷服务完全隔离
 */

import axios from 'axios';

// 第二问卷响应数据接口（前端使用camelCase）
export interface SecondQuestionnaireResponse {
  questionnaireId: string;
  participantGroup: 'freshGraduate' | 'juniorProfessional' | 'seniorProfessional';
  basicDemographics: Record<string, any>;
  employmentStatus: Record<string, any>;
  unemploymentReasons: Record<string, any>;
  jobSearchBehavior: Record<string, any>;
  psychologicalState: Record<string, any>;
  supportNeeds: Record<string, any>;
  groupSpecificData?: Record<string, any>;
  userExperienceRating?: number;
  technicalFeedback?: string;
  startedAt?: string;
  responseTimeSeconds?: number;
  sessionId?: string;
}

// 问卷定义接口
export interface SecondQuestionnaireDefinition {
  id: string;
  title: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    condition?: {
      dependsOn: string;
      operator: string;
      value: string;
    };
    questions: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      required: boolean;
      options?: Array<{
        value: string;
        label: string;
        description?: string;
      }>;
      config?: Record<string, any>;
    }>;
  }>;
  config: Record<string, any>;
  metadata: Record<string, any>;
}

// 响应列表接口
export interface SecondQuestionnaireResponseList {
  responses: Array<{
    id: string;
    questionnaireId: string;
    participantGroup: string;
    userExperienceRating?: number;
    submittedAt: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class SecondQuestionnaireService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:8787' : 'https://employment-survey-api-prod.chrismarker89.workers.dev');
  
  /**
   * 获取第二问卷定义
   */
  async getQuestionnaireDefinition(): Promise<SecondQuestionnaireDefinition> {
    try {
      console.log('🔍 获取第二问卷定义...');
      console.log('🌐 API Base URL:', this.baseUrl);

      const apiUrl = `${this.baseUrl}/api/universal-questionnaire/questionnaires/questionnaire-v2-2024`;
      console.log('📡 请求URL:', apiUrl);

      // 直接使用axios，避免双重baseURL问题
      const response = await axios.get(apiUrl, {
        timeout: 10000, // 10秒超时
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📊 响应状态:', response.status);
      console.log('📊 响应数据结构:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        dataType: typeof response.data?.data,
        sectionsCount: response.data?.data?.sections?.length
      });

      const definition = response.data.data;

      if (!definition) {
        throw new Error('API返回的数据格式不正确：缺少data字段');
      }

      if (!definition.sections || !Array.isArray(definition.sections)) {
        throw new Error('API返回的数据格式不正确：缺少sections数组');
      }

      console.log('✅ 第二问卷定义获取成功:', definition.id);
      console.log('📊 章节数量:', definition.sections.length);

      // 检查是否包含经济类问题
      let economicQuestionsCount = 0;
      definition.sections.forEach((section: any) => {
        section.questions?.forEach((question: any) => {
          if (question.id.includes('debt') ||
              question.id.includes('salary') ||
              question.id.includes('economic') ||
              question.id.includes('financial') ||
              question.id.includes('confidence') ||
              question.id.includes('family-support')) {
            economicQuestionsCount++;
          }
        });
      });

      console.log('💰 经济类问题数量:', economicQuestionsCount);

      return definition;

    } catch (error: any) {
      console.error('❌ 获取第二问卷定义失败:');
      console.error('📊 错误类型:', error.constructor.name);
      console.error('📊 错误消息:', error.message);

      if (error.response) {
        console.error('📊 HTTP状态:', error.response.status);
        console.error('📊 响应数据:', error.response.data);
      } else if (error.request) {
        console.error('📊 请求失败:', error.request);
      } else {
        console.error('📊 配置错误:', error.message);
      }

      throw error;
    }
  }
  
  /**
   * 提交第二问卷响应
   */
  async submitResponse(responseData: SecondQuestionnaireResponse): Promise<any> {
    try {
      console.log('提交第二问卷响应...', {
        questionnaireId: responseData.questionnaireId,
        participantGroup: responseData.participantGroup
      });

      // 构建符合统一API格式的数据（使用camelCase，让API中间件自动转换）
      // 直接使用所有响应数据，不按预定义章节分组
      const allQuestionResponses = Object.entries(responseData.basicDemographics || {})
        .concat(Object.entries(responseData.employmentStatus || {}))
        .concat(Object.entries(responseData.unemploymentReasons || {}))
        .concat(Object.entries(responseData.jobSearchBehavior || {}))
        .concat(Object.entries(responseData.psychologicalState || {}))
        .concat(Object.entries(responseData.supportNeeds || {}))
        .map(([questionId, value]) => ({ questionId, value }));

      const apiData = {
        questionnaireId: responseData.questionnaireId,
        sectionResponses: [
          {
            sectionId: 'second-questionnaire-responses',
            questionResponses: allQuestionResponses
          }
        ],
        metadata: {
          participantGroup: responseData.participantGroup,
          startedAt: responseData.startedAt || new Date().toISOString(),
          responseTimeSeconds: responseData.responseTimeSeconds || 0,
          userExperienceRating: responseData.userExperienceRating,
          technicalFeedback: responseData.technicalFeedback,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          deviceInfo: {
            platform: navigator.platform,
            language: navigator.language
          }
        }
      };

      console.log('发送API数据:', apiData);

      // 直接使用axios，避免双重baseURL问题
      const response = await axios.post(`${this.baseUrl}/api/universal-questionnaire/submit`, apiData);
      const result = response.data.data;

      console.log('第二问卷提交成功:', result);
      return result;
      
    } catch (error) {
      console.error('第二问卷提交失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取问卷响应详情
   */
  async getResponseById(responseId: string): Promise<any> {
    try {
      console.log('获取第二问卷响应详情:', responseId);

      // 使用统一的ApiService
      const result = await ApiService.get<any>(`${this.baseUrl}/api/universal-questionnaire/responses/${responseId}`);

      console.log('获取响应详情成功:', result);
      return result;

    } catch (error) {
      console.error('获取第二问卷响应详情失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户的问卷响应列表
   */
  async getUserResponses(page: number = 1, pageSize: number = 20): Promise<SecondQuestionnaireResponseList> {
    try {
      console.log('获取用户第二问卷响应列表...', { page, pageSize });

      // 使用统一的ApiService，参数会自动转换为snake_case
      const result = await ApiService.get<SecondQuestionnaireResponseList>(`${this.baseUrl}/api/universal-questionnaire/responses`, {
        params: { page, pageSize }
      });

      console.log('获取响应列表成功:', result);
      return result;

    } catch (error) {
      console.error('获取用户第二问卷响应列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 验证问卷响应数据
   */
  validateResponseData(responseData: Partial<SecondQuestionnaireResponse>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // 验证必填字段
    const requiredFields = [
      'questionnaireId',
      'participantGroup',
      'basicDemographics',
      'employmentStatus',
      'unemploymentReasons',
      'jobSearchBehavior',
      'psychologicalState',
      'supportNeeds'
    ];
    
    for (const field of requiredFields) {
      if (!responseData[field as keyof SecondQuestionnaireResponse]) {
        errors.push(`缺少必填字段: ${field}`);
      }
    }
    
    // 验证participantGroup值
    const validGroups = ['freshGraduate', 'juniorProfessional', 'seniorProfessional'];
    if (responseData.participantGroup && !validGroups.includes(responseData.participantGroup)) {
      errors.push('无效的参与者分组');
    }
    
    // 验证用户体验评分
    if (responseData.userExperienceRating !== undefined) {
      if (responseData.userExperienceRating < 1 || responseData.userExperienceRating > 10) {
        errors.push('用户体验评分必须在1-10之间');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 构建问卷响应数据
   */
  buildResponseData(
    participantGroup: string,
    responses: Record<string, any>,
    metadata: {
      startedAt: string;
      responseTimeSeconds: number;
      userExperienceRating?: number;
      technicalFeedback?: string;
    }
  ): SecondQuestionnaireResponse {
    // 简化数据结构，直接使用所有响应数据
    const responseData: SecondQuestionnaireResponse = {
      questionnaireId: 'questionnaire-v2-2024',
      participantGroup: this.mapParticipantGroup(participantGroup || 'fresh_graduate'),
      basicDemographics: responses, // 将所有响应数据放在这里
      employmentStatus: {},
      unemploymentReasons: {},
      jobSearchBehavior: {},
      psychologicalState: {},
      supportNeeds: {},
      groupSpecificData: {},
      startedAt: metadata.startedAt,
      responseTimeSeconds: metadata.responseTimeSeconds,
      userExperienceRating: metadata.userExperienceRating,
      technicalFeedback: metadata.technicalFeedback
    };

    return responseData;
  }
  
  /**
   * 转换为questionResponses格式
   */
  private convertToQuestionResponses(responses: Record<string, any>): Array<{questionId: string, value: any}> {
    return Object.entries(responses).map(([questionId, value]) => ({
      questionId,
      value
    }));
  }

  /**
   * 映射参与者分组
   */
  private mapParticipantGroup(group: string): 'freshGraduate' | 'juniorProfessional' | 'seniorProfessional' {
    const mapping: Record<string, 'freshGraduate' | 'juniorProfessional' | 'seniorProfessional'> = {
      'fresh_graduate': 'freshGraduate',
      'junior_professional': 'juniorProfessional',
      'senior_professional': 'seniorProfessional'
    };
    
    return mapping[group] || 'freshGraduate';
  }
  
  /**
   * 提取章节数据
   */
  private extractSectionData(responses: Record<string, any>, sectionPrefix: string): Record<string, any> {
    const sectionData: Record<string, any> = {};
    
    Object.keys(responses).forEach(key => {
      if (key.startsWith(sectionPrefix) || this.isSectionQuestion(key, sectionPrefix)) {
        sectionData[key] = responses[key];
      }
    });
    
    return sectionData;
  }
  
  /**
   * 提取群体特定数据
   */
  private extractGroupSpecificData(participantGroup: string, responses: Record<string, any>): Record<string, any> {
    const groupSections: Record<string, string> = {
      'fresh_graduate': 'fresh-graduate-details',
      'junior_professional': 'junior-professional-details',
      'senior_professional': 'senior-professional-details'
    };
    
    const sectionPrefix = groupSections[participantGroup];
    if (!sectionPrefix) return {};
    
    return this.extractSectionData(responses, sectionPrefix);
  }
  
  /**
   * 判断是否为特定章节的问题
   */
  private isSectionQuestion(questionId: string, sectionPrefix: string): boolean {
    // 根据问题ID判断是否属于特定章节
    const sectionQuestions: Record<string, string[]> = {
      'common-demographics': ['age-range', 'education-level', 'unemployment-duration'],
      'psychological-support-analysis': ['emotional_state', 'support_needs'],
      'user-experience-feedback': ['questionnaire_experience_rating', 'interaction_preference']
    };
    
    return sectionQuestions[sectionPrefix]?.includes(questionId) || false;
  }
}

// 导出单例实例
export const secondQuestionnaireService = new SecondQuestionnaireService();

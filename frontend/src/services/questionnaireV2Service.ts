/**
 * 问卷2独立服务
 * 完全独立的前端服务，与问卷1无任何依赖关系
 * 专用于智能问卷系统
 */

import axios from 'axios';

// 获取API基础URL
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 开发环境默认配置
  if (import.meta.env.DEV) {
    return 'http://localhost:53389';
  }
  
  // 生产环境默认配置
  return '';
};

const baseUrl = getBaseUrl();

// 问卷2 API 配置
const questionnaireV2Api = axios.create({
  baseURL: `${baseUrl}/api/questionnaire-v2`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 问卷2数据类型定义
export interface QuestionnaireV2QuestionResponse {
  questionId: string;
  value: any;
  timestamp: number;
}

export interface QuestionnaireV2SectionResponse {
  sectionId: string;
  questionResponses: QuestionnaireV2QuestionResponse[];
  completedAt: number;
  timeSpent: number;
}

export interface QuestionnaireV2Metadata {
  startTime: number;
  endTime: number;
  totalTimeSpent: number;
  deviceInfo?: any;
  browserInfo?: any;
  completionPath?: string[];
  branchingDecisions?: Record<string, any>;
}

export interface QuestionnaireV2Request {
  questionnaireId: string;
  sectionResponses: QuestionnaireV2SectionResponse[];
  metadata: QuestionnaireV2Metadata;
}

export interface QuestionnaireV2Response {
  id: string;
  questionnaire: any;
  systemVersion: 'v2';
}

export interface QuestionnaireV2Definition {
  id: string;
  title: string;
  description: string;
  sections: any[];
  config: any;
  metadata: any;
}

export interface QuestionnaireV2SystemInfo {
  systemVersion: 'v2';
  systemName: string;
  description: string;
  supportedFeatures: string[];
  dataFormat: string;
  apiPrefix: string;
  databaseTable: string;
}

/**
 * 数据转换工具类
 */
export class QuestionnaireV2DataConverter {
  /**
   * 将camelCase转换为snake_case
   */
  static camelToSnake(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.camelToSnake(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = this.camelToSnake(value);
    }
    return result;
  }

  /**
   * 将snake_case转换为camelCase
   */
  static snakeToCamel(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.snakeToCamel(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = this.snakeToCamel(value);
    }
    return result;
  }
}

/**
 * 问卷2服务类
 */
export class QuestionnaireV2Service {
  private api = questionnaireV2Api;

  /**
   * 获取问卷2定义
   */
  async getDefinition(questionnaireId: string): Promise<QuestionnaireV2Definition> {
    try {
      console.log(`[QuestionnaireV2Service] 获取问卷2定义: ${questionnaireId}`);
      
      const response = await this.api.get(`/questionnaires/${questionnaireId}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV2Service] 问卷2定义获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷2定义失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV2Service] 获取问卷2定义失败:`, error);
      throw error;
    }
  }

  /**
   * 提交问卷2响应
   */
  async submitResponse(requestData: QuestionnaireV2Request): Promise<QuestionnaireV2Response> {
    try {
      console.log(`[QuestionnaireV2Service] 提交问卷2响应:`, requestData);
      
      // 转换为snake_case格式
      const snakeCaseData = QuestionnaireV2DataConverter.camelToSnake(requestData);
      console.log(`[QuestionnaireV2Service] 转换后的数据:`, snakeCaseData);
      
      const response = await this.api.post('/submit', snakeCaseData);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV2Service] 问卷2提交成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '提交问卷2失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV2Service] 提交问卷2失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷2响应列表
   */
  async getResponses(page: number = 1, pageSize: number = 10, status?: string) {
    try {
      console.log(`[QuestionnaireV2Service] 获取问卷2响应列表: page=${page}, pageSize=${pageSize}, status=${status}`);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await this.api.get(`/responses?${params.toString()}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV2Service] 问卷2响应列表获取成功:`, response.data.data);
        // 转换为camelCase格式
        return QuestionnaireV2DataConverter.snakeToCamel(response.data.data);
      } else {
        throw new Error(response.data.message || '获取问卷2响应列表失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV2Service] 获取问卷2响应列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷2响应详情
   */
  async getResponseDetail(responseId: string) {
    try {
      console.log(`[QuestionnaireV2Service] 获取问卷2响应详情: ${responseId}`);
      
      const response = await this.api.get(`/responses/${responseId}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV2Service] 问卷2响应详情获取成功:`, response.data.data);
        // 转换为camelCase格式
        return QuestionnaireV2DataConverter.snakeToCamel(response.data.data);
      } else {
        throw new Error(response.data.message || '获取问卷2响应详情失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV2Service] 获取问卷2响应详情失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷2系统信息
   */
  async getSystemInfo(): Promise<{
    systemInfo: QuestionnaireV2SystemInfo;
    availableQuestionnaires: string[];
    versions: any[];
    economicQuestions: string[];
  }> {
    try {
      console.log(`[QuestionnaireV2Service] 获取问卷2系统信息`);
      
      const response = await this.api.get('/system-info');
      
      if (response.data.success) {
        console.log(`[QuestionnaireV2Service] 问卷2系统信息获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷2系统信息失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV2Service] 获取问卷2系统信息失败:`, error);
      throw error;
    }
  }

  /**
   * 验证问卷2数据格式
   */
  validateRequestData(data: QuestionnaireV2Request): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本结构
    if (!data.questionnaireId) {
      errors.push('缺少问卷ID');
    }

    if (!data.sectionResponses || !Array.isArray(data.sectionResponses)) {
      errors.push('缺少或无效的章节响应数组');
    } else {
      // 验证每个章节响应
      for (let i = 0; i < data.sectionResponses.length; i++) {
        const section = data.sectionResponses[i];
        if (!section.sectionId) {
          errors.push(`第${i + 1}个章节缺少章节ID`);
        }
        if (!section.questionResponses || !Array.isArray(section.questionResponses)) {
          errors.push(`第${i + 1}个章节缺少或无效的问题响应数组`);
        } else {
          // 验证每个问题响应
          for (let j = 0; j < section.questionResponses.length; j++) {
            const question = section.questionResponses[j];
            if (!question.questionId) {
              errors.push(`第${i + 1}个章节第${j + 1}个问题缺少问题ID`);
            }
          }
        }
      }
    }

    if (!data.metadata) {
      errors.push('缺少元数据');
    } else {
      if (!data.metadata.startTime) {
        errors.push('元数据缺少开始时间');
      }
      if (!data.metadata.endTime) {
        errors.push('元数据缺少结束时间');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 获取API基础URL（用于调试）
   */
  getApiBaseUrl(): string {
    return `${baseUrl}/api/questionnaire-v2`;
  }
}

// 导出单例实例
export const questionnaireV2Service = new QuestionnaireV2Service();

// 导出便捷函数
export const getQuestionnaireV2Definition = (questionnaireId: string) =>
  questionnaireV2Service.getDefinition(questionnaireId);

export const submitQuestionnaireV2Response = (data: QuestionnaireV2Request) =>
  questionnaireV2Service.submitResponse(data);

export const getQuestionnaireV2SystemInfo = () =>
  questionnaireV2Service.getSystemInfo();

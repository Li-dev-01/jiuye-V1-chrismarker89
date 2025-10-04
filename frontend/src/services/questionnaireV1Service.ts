/**
 * 问卷1独立服务
 * 完全独立的前端服务，与问卷2无任何依赖关系
 * 专用于传统问卷系统
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

// 问卷1 API 配置
const questionnaireV1Api = axios.create({
  baseURL: `${baseUrl}/api/questionnaire-v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 问卷1数据类型定义
export interface QuestionnaireV1PersonalInfo {
  name: string;
  gender: string;
  age: string;
  phone: string;
  email: string;
  location?: string;
}

export interface QuestionnaireV1EducationInfo {
  educationLevel: string;
  major?: string;
  graduationYear?: string;
  school?: string;
}

export interface QuestionnaireV1EmploymentInfo {
  currentStatus: string;
  industry?: string;
  position?: string;
  workExperience?: string;
  salaryRange?: string;
}

export interface QuestionnaireV1JobSearchInfo {
  isJobSeeking?: boolean;
  jobSearchDuration?: string;
  targetIndustry?: string;
  targetPosition?: string;
  expectedSalary?: string;
  difficulties?: string[];
}

export interface QuestionnaireV1EmploymentStatus {
  status: string;
  details?: Record<string, any>;
}

export interface QuestionnaireV1Request {
  questionnaireId: string;
  personalInfo: QuestionnaireV1PersonalInfo;
  educationInfo: QuestionnaireV1EducationInfo;
  employmentInfo: QuestionnaireV1EmploymentInfo;
  jobSearchInfo?: QuestionnaireV1JobSearchInfo;
  employmentStatus?: QuestionnaireV1EmploymentStatus;
}

export interface QuestionnaireV1Response {
  id: string;
  questionnaire: any;
  systemVersion: 'v1';
}

export interface QuestionnaireV1Definition {
  id: string;
  title: string;
  description: string;
  sections: any[];
  config: any;
  metadata: any;
}

export interface QuestionnaireV1SystemInfo {
  systemVersion: 'v1';
  systemName: string;
  description: string;
  supportedFeatures: string[];
  dataFormat: string;
  apiPrefix: string;
  databaseTable: string;
}

/**
 * 问卷1服务类
 */
export class QuestionnaireV1Service {
  private api = questionnaireV1Api;

  /**
   * 获取问卷1定义
   */
  async getDefinition(questionnaireId: string): Promise<QuestionnaireV1Definition> {
    try {
      console.log(`[QuestionnaireV1Service] 获取问卷1定义: ${questionnaireId}`);
      
      const response = await this.api.get(`/definition/${questionnaireId}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV1Service] 问卷1定义获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷1定义失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV1Service] 获取问卷1定义失败:`, error);
      throw error;
    }
  }

  /**
   * 提交问卷1响应
   */
  async submitResponse(requestData: QuestionnaireV1Request): Promise<QuestionnaireV1Response> {
    try {
      console.log(`[QuestionnaireV1Service] 提交问卷1响应:`, requestData);
      
      const response = await this.api.post('/submit', requestData);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV1Service] 问卷1提交成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '提交问卷1失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV1Service] 提交问卷1失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷1响应列表
   */
  async getResponses(page: number = 1, pageSize: number = 10, status?: string) {
    try {
      console.log(`[QuestionnaireV1Service] 获取问卷1响应列表: page=${page}, pageSize=${pageSize}, status=${status}`);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await this.api.get(`/responses?${params.toString()}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV1Service] 问卷1响应列表获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷1响应列表失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV1Service] 获取问卷1响应列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷1响应详情
   */
  async getResponseDetail(responseId: string) {
    try {
      console.log(`[QuestionnaireV1Service] 获取问卷1响应详情: ${responseId}`);
      
      const response = await this.api.get(`/responses/${responseId}`);
      
      if (response.data.success) {
        console.log(`[QuestionnaireV1Service] 问卷1响应详情获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷1响应详情失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV1Service] 获取问卷1响应详情失败:`, error);
      throw error;
    }
  }

  /**
   * 获取问卷1系统信息
   */
  async getSystemInfo(): Promise<{
    systemInfo: QuestionnaireV1SystemInfo;
    availableQuestionnaires: string[];
    versions: any[];
  }> {
    try {
      console.log(`[QuestionnaireV1Service] 获取问卷1系统信息`);
      
      const response = await this.api.get('/system-info');
      
      if (response.data.success) {
        console.log(`[QuestionnaireV1Service] 问卷1系统信息获取成功:`, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取问卷1系统信息失败');
      }
    } catch (error) {
      console.error(`[QuestionnaireV1Service] 获取问卷1系统信息失败:`, error);
      throw error;
    }
  }

  /**
   * 验证问卷1数据格式
   */
  validateRequestData(data: QuestionnaireV1Request): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本结构
    if (!data.questionnaireId) {
      errors.push('缺少问卷ID');
    }

    if (!data.personalInfo) {
      errors.push('缺少个人信息');
    } else {
      // 验证个人信息必填字段
      const requiredPersonalFields = ['name', 'gender', 'age', 'phone', 'email'];
      for (const field of requiredPersonalFields) {
        if (!data.personalInfo[field as keyof QuestionnaireV1PersonalInfo]) {
          errors.push(`个人信息缺少必填字段: ${field}`);
        }
      }
    }

    if (!data.educationInfo) {
      errors.push('缺少教育信息');
    } else {
      if (!data.educationInfo.educationLevel) {
        errors.push('教育信息缺少学历字段');
      }
    }

    if (!data.employmentInfo) {
      errors.push('缺少就业信息');
    } else {
      if (!data.employmentInfo.currentStatus) {
        errors.push('就业信息缺少当前状态字段');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 获取API基础URL（用于调试）
   */
  getApiBaseUrl(): string {
    return `${baseUrl}/api/questionnaire-v1`;
  }
}

// 导出单例实例
export const questionnaireV1Service = new QuestionnaireV1Service();

// 导出便捷函数
export const getQuestionnaireV1Definition = (questionnaireId: string) =>
  questionnaireV1Service.getDefinition(questionnaireId);

export const submitQuestionnaireV1Response = (data: QuestionnaireV1Request) =>
  questionnaireV1Service.submitResponse(data);

export const getQuestionnaireV1SystemInfo = () =>
  questionnaireV1Service.getSystemInfo();

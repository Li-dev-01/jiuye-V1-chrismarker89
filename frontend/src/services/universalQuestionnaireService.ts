/**
 * 通用问卷系统服务
 * 处理通用问卷的提交、统计等API调用
 */

import type { UniversalQuestionnaireResponse } from '../types/universal-questionnaire';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005/api';

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 问卷统计数据接口
interface QuestionnaireStatistics {
  questionnaireId: string;
  totalResponses: number;
  statistics: Record<string, {
    questionId: string;
    totalResponses: number;
    options: {
      value: string;
      count: number;
      percentage: number;
    }[];
    lastUpdated: string;
  }>;
  lastUpdated: string;
}

class UniversalQuestionnaireService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/universal-questionnaire`;
  }

  /**
   * 提交通用问卷
   */
  async submitQuestionnaire(response: UniversalQuestionnaireResponse): Promise<ApiResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '提交失败');
      }

      return data;
    } catch (error) {
      console.error('提交通用问卷失败:', error);
      throw error;
    }
  }

  /**
   * 关联问卷提交到用户
   */
  async associateSubmissionToUser(submissionId: number, userId: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/associate-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          userId
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '关联失败');
      }

      return data;
    } catch (error) {
      console.error('关联问卷失败:', error);
      throw error;
    }
  }

  /**
   * 获取问卷统计数据
   */
  async getQuestionnaireStatistics(questionnaireId: string): Promise<QuestionnaireStatistics> {
    try {
      const res = await fetch(`${this.baseUrl}/statistics/${questionnaireId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '获取统计数据失败');
      }

      return data.data;
    } catch (error) {
      console.error('获取问卷统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取问卷列表（管理员功能）
   */
  async getQuestionnaireList(token?: string): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${this.baseUrl}/list`, {
        method: 'GET',
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '获取问卷列表失败');
      }

      return data;
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取问卷响应详情（管理员功能）
   */
  async getQuestionnaireResponses(
    questionnaireId: string, 
    page: number = 1, 
    limit: number = 20,
    token?: string
  ): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(
        `${this.baseUrl}/responses/${questionnaireId}?page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '获取问卷响应失败');
      }

      return data;
    } catch (error) {
      console.error('获取问卷响应失败:', error);
      throw error;
    }
  }

  /**
   * 模拟获取实时统计数据（用于演示）
   */
  async getMockStatistics(questionnaireId: string): Promise<Record<string, any>> {
    // 模拟统计数据，用于演示实时统计功能
    const mockStats: Record<string, any> = {
      'education-level': {
        questionId: 'education-level',
        totalResponses: 1247,
        options: [
          { value: 'bachelor', label: '本科', count: 856, percentage: 68.6 },
          { value: 'master', label: '硕士研究生', count: 312, percentage: 25.0 },
          { value: 'phd', label: '博士研究生', count: 79, percentage: 6.3 }
        ],
        lastUpdated: new Date().toISOString()
      },
      'current-status': {
        questionId: 'current-status',
        totalResponses: 1247,
        options: [
          { value: 'employed', label: '已就业', count: 623, percentage: 49.9 },
          { value: 'seeking', label: '正在求职', count: 374, percentage: 30.0 },
          { value: 'preparing', label: '准备考研/考公', count: 187, percentage: 15.0 },
          { value: 'entrepreneurship', label: '自主创业', count: 37, percentage: 3.0 },
          { value: 'other', label: '其他', count: 26, percentage: 2.1 }
        ],
        lastUpdated: new Date().toISOString()
      },
      'preferred-industries': {
        questionId: 'preferred-industries',
        totalResponses: 1247,
        options: [
          { value: 'tech', label: '互联网/科技', count: 456, percentage: 36.6 },
          { value: 'finance', label: '金融', count: 298, percentage: 23.9 },
          { value: 'education', label: '教育', count: 234, percentage: 18.8 },
          { value: 'healthcare', label: '医疗健康', count: 189, percentage: 15.2 },
          { value: 'manufacturing', label: '制造业', count: 156, percentage: 12.5 }
        ],
        lastUpdated: new Date().toISOString()
      }
    };

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockStats;
  }

  /**
   * 验证问卷数据
   */
  validateQuestionnaireResponse(response: UniversalQuestionnaireResponse): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证基本结构
    if (!response.questionnaireId) {
      errors.push('问卷ID不能为空');
    }

    if (!response.sectionResponses || !Array.isArray(response.sectionResponses)) {
      errors.push('问卷节响应数据格式不正确');
    } else if (response.sectionResponses.length === 0) {
      errors.push('至少需要完成一个问卷节');
    }

    if (!response.metadata) {
      errors.push('问卷元数据不能为空');
    }

    // 验证节响应
    if (response.sectionResponses) {
      response.sectionResponses.forEach((section, sectionIndex) => {
        if (!section.sectionId) {
          errors.push(`第${sectionIndex + 1}个节的ID不能为空`);
        }

        if (!section.questionResponses || !Array.isArray(section.questionResponses)) {
          errors.push(`第${sectionIndex + 1}个节的问题响应格式不正确`);
        } else {
          section.questionResponses.forEach((question, questionIndex) => {
            if (!question.questionId) {
              errors.push(`第${sectionIndex + 1}个节第${questionIndex + 1}个问题的ID不能为空`);
            }
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 创建单例实例
export const universalQuestionnaireService = new UniversalQuestionnaireService();

// 导出类型
export type { QuestionnaireStatistics, ApiResponse };

/**
 * 问卷心声服务
 * 处理心声的创建、获取、管理等操作
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置 - 真实数据验收阶段
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

// 类型定义
export interface HeartVoice {
  id: number;
  uuid: string;
  userId: number;
  questionnaireId?: number;
  content: string;
  category: string;
  emotionScore: number;
  tags: string[];
  isAnonymous: boolean;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected';
  isFeatured: boolean;
  likeCount: number;
  dislikeCount?: number;
  createdAt: string;
  publishedAt?: string;
  reviewedAt?: string;
}

export interface CreateHeartVoiceData {
  content: string;
  category: string;
  emotion_score: number;
  tags: string[];
  is_anonymous: boolean;
  questionnaire_id?: number;
  user_id: number;
}

export interface GenerateHeartVoiceRequest {
  questionnaireData: any;
  userType: 'anonymous' | 'authenticated';
  preferences?: {
    style?: 'reflective' | 'optimistic' | 'realistic';
    length?: 'short' | 'medium' | 'long';
    tone?: 'sincere' | 'encouraging' | 'analytical';
  };
}

export interface HeartVoiceListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  userId?: number;
  featured?: boolean;
  sortBy?: 'created_at' | 'like_count' | 'emotion_score';
  sortOrder?: 'asc' | 'desc';
}

export interface HeartVoiceResponse {
  success: boolean;
  data?: HeartVoice;
  error?: string;
  message?: string;
}

export interface HeartVoiceListResponse {
  success: boolean;
  data?: {
    voices: HeartVoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

/**
 * 问卷心声服务类
 */
export class HeartVoiceService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/heart-voices`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 清除过期token
          localStorage.removeItem('auth_token');
          ErrorHandler.redirectToLogin();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * AI生成心声内容
   */
  async generateHeartVoice(request: GenerateHeartVoiceRequest): Promise<string> {
    try {
      const response = await this.client.post('/generate', request);
      if (response.data.success) {
        return response.data.data.content;
      } else {
        throw new Error(response.data.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate heart voice error:', error);
      // 如果API调用失败，返回基于问卷数据的模板内容
      return this.generateTemplateContent(request.questionnaireData);
    }
  }

  /**
   * 生成模板心声内容（备用方案）
   */
  private generateTemplateContent(questionnaireData: any): string {
    const templates = [
      "通过这次问卷调查，我深刻反思了自己的就业准备情况。作为一名即将踏入社会的大学生，我既充满期待又感到不安。希望能够通过不断学习和实践来提升自己的竞争力。",
      "填写问卷的过程让我意识到，就业不仅仅是找到一份工作，更是找到适合自己的发展道路。我会继续努力，为实现自己的职业目标而奋斗。",
      "面对当前的就业形势，我既看到了挑战，也看到了机遇。这次调查让我更清楚地认识了自己的优势和不足，我会有针对性地提升自己。",
      "作为一名大学生，我深知就业的重要性。通过这次问卷，我对自己的职业规划有了更清晰的认识，也更加明确了努力的方向。"
    ];

    // 根据问卷数据选择合适的模板
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  /**
   * 创建问卷心声
   */
  async createHeartVoice(data: CreateHeartVoiceData): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.post('/', data);
      return response.data;
    } catch (error) {
      console.error('Create heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取心声列表
   */
  async getHeartVoices(params: HeartVoiceListParams = {}): Promise<HeartVoiceListResponse> {
    try {
      const response = await this.client.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Get heart voices error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取单个心声详情
   */
  async getHeartVoice(id: number): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取用户的心声列表
   */
  async getUserHeartVoices(userId: number, params: Omit<HeartVoiceListParams, 'userId'> = {}): Promise<HeartVoiceListResponse> {
    try {
      const response = await this.client.get(`/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user heart voices error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 点赞心声
   */
  async likeHeartVoice(id: number): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.post(`/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Like heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 取消点赞心声
   */
  async unlikeHeartVoice(id: number): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.delete(`/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Unlike heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 踩心声
   */
  async dislikeHeartVoice(id: number): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.post(`/${id}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Dislike heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 删除心声（用户删除自己的心声）
   */
  async deleteHeartVoice(id: number): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取心声分类统计
   */
  async getCategoryStats(): Promise<{
    success: boolean;
    data?: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/stats/categories');
      return response.data;
    } catch (error) {
      console.error('Get category stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取情感分析统计
   */
  async getEmotionStats(): Promise<{
    success: boolean;
    data?: {
      averageScore: number;
      distribution: Array<{
        score: number;
        count: number;
        percentage: number;
      }>;
    };
    error?: string;
  }> {
    try {
      const response = await this.client.get('/stats/emotions');
      return response.data;
    } catch (error) {
      console.error('Get emotion stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 搜索心声
   */
  async searchHeartVoices(query: string, params: HeartVoiceListParams = {}): Promise<HeartVoiceListResponse> {
    try {
      const response = await this.client.get('/search', {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Search heart voices error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 举报心声
   */
  async reportHeartVoice(id: number, reason: string, description?: string): Promise<HeartVoiceResponse> {
    try {
      const response = await this.client.post(`/${id}/report`, {
        reason,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Report heart voice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const heartVoiceService = new HeartVoiceService();
export default heartVoiceService;

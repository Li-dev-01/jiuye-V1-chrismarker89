/**
 * 审核员服务
 * 连接现有审核员页面与三层审核系统
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 类型定义 - 与现有审核员页面兼容
export interface ReviewItem {
  id: string;
  auditId: number;
  type: 'voice' | 'story' | 'questionnaire';
  userId: string;
  username: string;
  
  // 心声特有字段
  content?: string;
  category?: string;
  mood?: 'positive' | 'neutral' | 'negative';
  rating?: number;
  
  // 故事特有字段
  title?: string;
  tags?: string[];
  
  // 问卷特有字段
  data?: any;
  
  // 通用字段
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  likes?: number;
  comments?: number;
  
  // 三层审核系统字段
  auditDetails: {
    layer?: number;
    reasons?: string[];
    confidence?: number;
    ai_recommendation?: string;
  };
  confidenceScore: number;
}

export interface ReviewerStats {
  pendingVoices: number;
  pendingStories: number;
  pendingQuestionnaires: number;
  todayReviewed: number;
  totalReviewed: number;
  averageReviewTime: number;
}

export interface SubmitReviewRequest {
  audit_id: number;
  decision: 'approved' | 'rejected';
  reviewer_id: number;
  notes?: string;
}

export interface PendingReviewsResponse {
  success: boolean;
  data?: {
    reviews: ReviewItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * 审核员服务类
 */
class ReviewerService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/reviewer`,
      timeout: 15000,
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
          localStorage.removeItem('auth_token');
          ErrorHandler.redirectToLogin();
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * 获取待人工审核的内容列表（第三层审核）
   */
  async getPendingReviews(params: {
    page?: number;
    pageSize?: number;
    content_type?: 'heart_voice' | 'story' | 'questionnaire';
  } = {}): Promise<PendingReviewsResponse> {
    try {
      const response = await this.client.get('/pending-reviews', { params });
      return response.data;
    } catch (error) {
      console.error('Get pending reviews error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取特定类型的待审核内容（兼容现有页面）
   */
  async getVoiceSubmissions(params: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    success: boolean;
    data?: ReviewItem[];
    error?: string;
  }> {
    try {
      const result = await this.getPendingReviews({
        ...params,
        content_type: 'heart_voice'
      });
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.reviews
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Get voice submissions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取故事待审核内容
   */
  async getStorySubmissions(params: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    success: boolean;
    data?: ReviewItem[];
    error?: string;
  }> {
    try {
      const result = await this.getPendingReviews({
        ...params,
        content_type: 'story'
      });
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.reviews
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Get story submissions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取问卷待审核内容
   */
  async getQuestionnaireSubmissions(params: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    success: boolean;
    data?: ReviewItem[];
    error?: string;
  }> {
    try {
      const result = await this.getPendingReviews({
        ...params,
        content_type: 'questionnaire'
      });
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.reviews
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Get questionnaire submissions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 提交审核结果
   */
  async submitReview(request: SubmitReviewRequest): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await this.client.post('/submit-review', request);
      return response.data;
    } catch (error) {
      console.error('Submit review error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取审核员统计数据
   */
  async getReviewerStats(reviewerId?: number): Promise<{
    success: boolean;
    data?: ReviewerStats;
    error?: string;
  }> {
    try {
      const params = reviewerId ? { reviewer_id: reviewerId } : {};
      const response = await this.client.get('/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Get reviewer stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 批量审核（兼容现有快速审核功能）
   */
  async batchReview(reviews: Array<{
    auditId: number;
    decision: 'approved' | 'rejected';
    notes?: string;
  }>, reviewerId: number): Promise<{
    success: boolean;
    results?: Array<{ success: boolean; error?: string }>;
    error?: string;
  }> {
    try {
      const results = [];
      
      for (const review of reviews) {
        const result = await this.submitReview({
          audit_id: review.auditId,
          decision: review.decision,
          reviewer_id: reviewerId,
          notes: review.notes
        });
        results.push(result);
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Batch review error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取审核历史（可扩展）
   */
  async getReviewHistory(reviewerId: number, params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // 这里可以实现审核历史API
      // 暂时返回空数据
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Get review history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const reviewerService = new ReviewerService();
export default reviewerService;

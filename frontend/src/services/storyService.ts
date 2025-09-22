/**
 * 就业故事服务
 * 处理故事的创建、获取、管理等操作
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 类型定义
export interface Story {
  id: number;
  uuid: string;
  userId: number;
  questionnaireId?: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  authorName: string;
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
  likeCount: number;
  dislikeCount?: number;
  commentCount: number;
  createdAt: string;
  publishedAt?: string;
  reviewedAt?: string;
}

export interface CreateStoryData {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  author_name: string;
  is_anonymous: boolean;
  questionnaire_id?: number;
  user_id: number;
}

export interface StoryListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  userId?: number;
  featured?: boolean;
  published?: boolean;
  tags?: string[];
  sortBy?: 'created_at' | 'view_count' | 'like_count' | 'published_at';
  sortOrder?: 'asc' | 'desc';
}

export interface StoryResponse {
  success: boolean;
  data?: Story;
  error?: string;
  message?: string;
}

export interface StoryListResponse {
  success: boolean;
  data?: {
    stories: Story[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

/**
 * 就业故事服务类
 */
class StoryService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/stories`,
      timeout: 15000, // 故事内容较长，增加超时时间
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
   * 创建就业故事
   */
  async createStory(data: CreateStoryData): Promise<StoryResponse> {
    try {
      const response = await this.client.post('/', data);
      return response.data;
    } catch (error) {
      console.error('Create story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取故事列表
   */
  async getStories(params: StoryListParams = {}): Promise<StoryListResponse> {
    try {
      const response = await this.client.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Get stories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取单个故事详情
   */
  async getStory(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取用户的故事列表
   */
  async getUserStories(userId: number, params: Omit<StoryListParams, 'userId'> = {}): Promise<StoryListResponse> {
    try {
      const response = await this.client.get(`/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user stories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取精选故事
   */
  async getFeaturedStories(params: Omit<StoryListParams, 'featured'> = {}): Promise<StoryListResponse> {
    try {
      const response = await this.client.get('/featured', { params });
      return response.data;
    } catch (error) {
      console.error('Get featured stories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 增加故事浏览量
   */
  async incrementViewCount(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.post(`/${id}/view`);
      return response.data;
    } catch (error) {
      console.error('Increment view count error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 点赞故事
   */
  async likeStory(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.post(`/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Like story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 取消点赞故事
   */
  async unlikeStory(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.delete(`/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Unlike story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 踩故事
   */
  async dislikeStory(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.post(`/${id}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Dislike story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 删除故事（用户删除自己的故事）
   */
  async deleteStory(id: number): Promise<StoryResponse> {
    try {
      const response = await this.client.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取故事分类统计
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
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20): Promise<{
    success: boolean;
    data?: Array<{
      tag: string;
      count: number;
    }>;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/stats/tags', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get popular tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 搜索故事
   */
  async searchStories(query: string, params: StoryListParams = {}): Promise<StoryListResponse> {
    try {
      const response = await this.client.get('/search', {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Search stories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 根据标签获取相关故事
   */
  async getStoriesByTag(tag: string, params: StoryListParams = {}): Promise<StoryListResponse> {
    try {
      const response = await this.client.get('/by-tag', {
        params: { tag, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Get stories by tag error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 举报故事
   */
  async reportStory(id: number, reason: string, description?: string): Promise<StoryResponse> {
    try {
      const response = await this.client.post(`/${id}/report`, {
        reason,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Report story error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取推荐故事
   */
  async getRecommendedStories(userId?: number, limit: number = 10): Promise<StoryListResponse> {
    try {
      const response = await this.client.get('/recommended', {
        params: { userId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get recommended stories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取故事标签列表
   */
  async getStoryTags(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // 使用管理员API获取标签，避免路由冲突
      const response = await axios.get(`${this.baseURL.replace('/stories', '')}/admin/content/tags`, {
        params: { content_type: 'story' }
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get tags'
        };
      }
    } catch (error) {
      console.error('Get story tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const storyService = new StoryService();
export default storyService;

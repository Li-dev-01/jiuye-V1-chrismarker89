/**
 * 用户内容服务
 * 统一管理用户的问卷、心声、故事内容
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 内容类型定义
export interface UserContentItem {
  id: number;
  uuid?: string;
  title: string;
  content?: string;
  type: 'questionnaire' | 'voice' | 'story';
  status: 'pending' | 'approved' | 'rejected' | 'submitted';
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  // 问卷特有字段
  completionPercentage?: number;
  isCompleted?: boolean;
  // 心声特有字段
  category?: string;
  emotionScore?: number;
  likeCount?: number;
  // 故事特有字段
  summary?: string;
  authorName?: string;
  isAnonymous?: boolean;
  viewCount?: number;
}

export interface UserContentListParams {
  page?: number;
  pageSize?: number;
  type?: 'questionnaire' | 'voice' | 'story';
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserContentListResponse {
  success: boolean;
  data?: {
    items: UserContentItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface UserContentResponse {
  success: boolean;
  data?: UserContentItem;
  error?: string;
}

export class UserContentService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
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
          localStorage.removeItem('auth_token');
          ErrorHandler.redirectToLogin();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取用户的问卷列表
   */
  async getUserQuestionnaires(userId: string, params: Omit<UserContentListParams, 'type'> = {}): Promise<UserContentListResponse> {
    try {
      // 使用UUID路由获取用户问卷
      const response = await this.client.get(`/api/uuid/questionnaire/user/${userId}`, { params });
      
      if (response.data.success) {
        const items = response.data.data.map((item: any, index: number) => ({
          id: item.id,
          uuid: item.uuid || item.data_uuid,
          title: item.title || `问卷 #${item.id}`,
          type: 'questionnaire' as const,
          status: item.status || 'submitted',
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          completionPercentage: item.completion_percentage || item.completionPercentage,
          isCompleted: item.is_completed || item.isCompleted,
          // 添加序号
          serialNumber: index + 1
        }));

        return {
          success: true,
          data: {
            items,
            pagination: response.data.pagination || {
              page: 1,
              pageSize: items.length,
              total: items.length,
              totalPages: 1
            }
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Get user questionnaires error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户的心声列表
   */
  async getUserVoices(userId: string, params: Omit<UserContentListParams, 'type'> = {}): Promise<UserContentListResponse> {
    try {
      const response = await this.client.get(`/api/heart-voices/user/${userId}`, { params });
      
      if (response.data.success) {
        const items = response.data.data.items.map((item: any, index: number) => ({
          id: item.id,
          uuid: item.uuid || item.data_uuid,
          title: item.title || `心声 #${item.id}`,
          content: item.content,
          type: 'voice' as const,
          status: item.status || item.audit_status || 'approved',
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          publishedAt: item.published_at || item.publishedAt,
          category: item.category,
          emotionScore: item.emotion_score || item.emotionScore,
          likeCount: item.like_count || item.likeCount || 0,
          // 添加序号
          serialNumber: index + 1
        }));

        return {
          success: true,
          data: {
            items,
            pagination: response.data.data.pagination || {
              page: 1,
              pageSize: items.length,
              total: items.length,
              totalPages: 1
            }
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Get user voices error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户的故事列表
   */
  async getUserStories(userId: string, params: Omit<UserContentListParams, 'type'> = {}): Promise<UserContentListResponse> {
    try {
      const response = await this.client.get(`/api/stories/user/${userId}`, { params });
      
      if (response.data.success) {
        const items = response.data.data.stories.map((item: any, index: number) => ({
          id: item.id,
          uuid: item.uuid || item.data_uuid,
          title: item.title,
          content: item.content,
          summary: item.summary,
          type: 'story' as const,
          status: item.status || item.audit_status || 'approved',
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          publishedAt: item.published_at || item.publishedAt,
          category: item.category,
          authorName: item.author_name || item.authorName,
          isAnonymous: item.is_anonymous || item.isAnonymous,
          viewCount: item.view_count || item.viewCount || 0,
          likeCount: item.like_count || item.likeCount || 0,
          // 添加序号
          serialNumber: index + 1
        }));

        return {
          success: true,
          data: {
            items,
            pagination: {
              page: response.data.data.page || 1,
              pageSize: response.data.data.pageSize || items.length,
              total: response.data.data.total || items.length,
              totalPages: response.data.data.totalPages || 1
            }
          }
        };
      }
      
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
   * 删除用户内容
   */
  async deleteUserContent(id: number, type: 'questionnaire' | 'voice' | 'story'): Promise<UserContentResponse> {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'questionnaire':
          endpoint = `/api/uuid/questionnaire/${id}`;
          break;
        case 'voice':
          endpoint = `/api/heart-voices/${id}`;
          break;
        case 'story':
          endpoint = `/api/stories/${id}`;
          break;
        default:
          throw new Error('Invalid content type');
      }

      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error('Delete user content error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取单个内容详情
   */
  async getContentDetail(id: number, type: 'questionnaire' | 'voice' | 'story'): Promise<UserContentResponse> {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'questionnaire':
          endpoint = `/api/uuid/questionnaire/${id}`;
          break;
        case 'voice':
          endpoint = `/api/heart-voices/${id}`;
          break;
        case 'story':
          endpoint = `/api/stories/${id}`;
          break;
        default:
          throw new Error('Invalid content type');
      }

      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Get content detail error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const userContentService = new UserContentService();
export default userContentService;

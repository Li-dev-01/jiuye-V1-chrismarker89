/**
 * 用户内容管理服务
 * 提供用户提交内容的管理、搜索、批量操作等功能
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

// 内容类型枚举
export enum ContentType {
  QUESTIONNAIRE = 'questionnaire',
  HEART_VOICE = 'heart_voice',
  STORY = 'story'
}

// 用户内容记录接口
export interface UserContentRecord {
  id: string;
  content_type: ContentType;
  content_id: string;
  user_id: string;
  ip_address?: string;
  content: string;
  content_summary: string;
  submitted_at: string;
  status: 'active' | 'deleted' | 'flagged';
  duplicate_count?: number;
  related_records?: string[];
}

// 筛选参数接口
export interface ContentFilterParams {
  page?: number;
  pageSize?: number;
  contentType?: ContentType;
  userId?: string;
  ipAddress?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  duplicatesOnly?: boolean;
}

// 搜索结果接口
export interface ContentSearchResult {
  content_type: ContentType;
  content_id: string;
  user_id: string;
  content: string;
  submitted_at: string;
  ip_address?: string;
}

// 重复检测结果接口
export interface DuplicateDetectionResult {
  type: string;
  identifier: string; // IP地址、用户ID或内容
  count: number;
  content_ids: string;
  user_ids?: string;
  first_submission: string;
  last_submission: string;
}

// IP统计接口
export interface IpStatistics {
  ip_address: string;
  submission_count: number;
  unique_users: number;
  first_submission: string;
  last_submission: string;
}

// 批量操作结果接口
export interface BatchOperationResult {
  deletedCount: number;
  deletedRecords: any[];
  operation: string;
  timestamp: string;
}

// 内容统计接口
export interface ContentStatistics {
  contentStats: {
    questionnaires: number;
    heartVoices: number;
    stories: number;
  };
  todayStats: {
    today_submissions: number;
    today_unique_users: number;
  };
  ipStats: {
    unique_ips: number;
    total_with_ip: number;
  };
  lastUpdated: string;
}

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class UserContentManagementService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/user-content-management`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        // 使用管理系统的token
        const token = localStorage.getItem('management_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log('用户内容管理API请求:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          token: token ? token.substring(0, 20) + '...' : null
        });

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
        console.error('用户内容管理API请求失败:', error);

        // 记录详细错误信息用于调试
        if (error.response) {
          console.error('响应状态:', error.response.status);
          console.error('响应数据:', error.response.data);
          console.error('请求URL:', error.config?.url);
        }

        // 不自动重定向，让组件自己处理认证错误
        // 这样可以避免在页面加载时意外跳转
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取用户内容列表
   */
  async getUserContentList(params: ContentFilterParams): Promise<{
    records: UserContentRecord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.client.get<ApiResponse<UserContentRecord[]>>('/list', {
        params
      });

      if (response.data.success) {
        return {
          records: response.data.data,
          pagination: response.data.pagination || {
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            total: 0,
            totalPages: 0
          }
        };
      } else {
        throw new Error(response.data.error || '获取内容列表失败');
      }
    } catch (error) {
      console.error('获取用户内容列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据内容搜索用户
   */
  async searchUsersByContent(
    keyword: string,
    contentType?: ContentType,
    exactMatch = false
  ): Promise<{
    results: ContentSearchResult[];
    total: number;
    keyword: string;
    contentType?: ContentType;
    exactMatch: boolean;
  }> {
    try {
      const response = await this.client.post<ApiResponse>('/search-by-content', {
        keyword,
        contentType,
        exactMatch
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '内容搜索失败');
      }
    } catch (error) {
      console.error('内容搜索失败:', error);
      throw error;
    }
  }

  /**
   * 检测重复提交
   */
  async detectDuplicates(
    type: 'ip' | 'user' | 'content',
    threshold = 2,
    contentType?: ContentType
  ): Promise<{
    duplicates: DuplicateDetectionResult[];
    total: number;
    type: string;
    threshold: number;
    contentType?: ContentType;
  }> {
    try {
      const response = await this.client.get<ApiResponse>('/duplicates', {
        params: { type, threshold, contentType }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '重复检测失败');
      }
    } catch (error) {
      console.error('重复检测失败:', error);
      throw error;
    }
  }

  /**
   * 获取IP地址统计
   */
  async getIpStatistics(): Promise<{
    ipStats: IpStatistics[];
    summary: {
      unique_ips: number;
      total_submissions: number;
    };
  }> {
    try {
      const response = await this.client.get<ApiResponse>('/ip-stats');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取IP统计失败');
      }
    } catch (error) {
      console.error('获取IP统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除内容
   */
  async batchDeleteContent(params: {
    ids?: string[];
    ipAddress?: string;
    userId?: string;
    contentType?: ContentType;
    reason?: string;
  }): Promise<BatchOperationResult> {
    try {
      const response = await this.client.post<ApiResponse<BatchOperationResult>>('/batch-delete', params);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  }

  /**
   * 标记可疑内容
   */
  async flagSuspiciousContent(
    ids: string[],
    reason: string
  ): Promise<{
    flaggedCount: number;
    flaggedIds: string[];
    reason: string;
    timestamp: string;
  }> {
    try {
      const response = await this.client.post<ApiResponse>('/flag-suspicious', {
        ids,
        reason
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '标记可疑内容失败');
      }
    } catch (error) {
      console.error('标记可疑内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容统计
   */
  async getContentStatistics(): Promise<ContentStatistics> {
    try {
      const response = await this.client.get<ApiResponse<ContentStatistics>>('/stats');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 导出内容数据
   */
  async exportContentData(params: ContentFilterParams): Promise<Blob> {
    try {
      const response = await this.client.get('/export', {
        params,
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('导出数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(params: {
    page?: number;
    pageSize?: number;
    operationType?: string;
    operatorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    logs: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.client.get<ApiResponse>('/logs', {
        params
      });

      if (response.data.success) {
        return {
          logs: response.data.data,
          pagination: response.data.pagination || {
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            total: 0,
            totalPages: 0
          }
        };
      } else {
        throw new Error(response.data.error || '获取操作日志失败');
      }
    } catch (error) {
      console.error('获取操作日志失败:', error);
      throw error;
    }
  }
}

// 创建服务实例
export const userContentManagementService = new UserContentManagementService();

// 导出类型和服务
export default userContentManagementService;
export type {
  UserContentRecord,
  ContentFilterParams,
  ContentSearchResult,
  DuplicateDetectionResult,
  IpStatistics,
  BatchOperationResult,
  ContentStatistics,
  ApiResponse
};

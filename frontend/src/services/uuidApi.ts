/**
 * UUID用户管理API服务
 * 连接后端API进行用户认证和管理
 */

import type { AxiosInstance } from 'axios';
import { apiClient } from './api';
import {
  UserType,
  ContentType,
  ContentStatus
} from '../types/uuid-system';
import type {
  UniversalUser,
  UserSession,
  AuthResult,
  UserCredentials,
  UserContentMapping,
  UserStatistics
} from '../types/uuid-system';

// API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
  requestId?: string;
}

// 认证请求类型
interface AuthRequest {
  userType: UserType;
  credentials: UserCredentials;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    fingerprint: string;
  };
}

// 半匿名认证请求
interface SemiAnonymousAuthRequest {
  identityA: string;
  identityB: string;
  deviceInfo?: any;
}

// 管理员认证请求
interface AdminAuthRequest {
  username: string;
  password: string;
  userType: 'admin' | 'super_admin' | 'reviewer';
}

// 内容关联请求
interface LinkContentRequest {
  userUuid: string;
  contentType: ContentType;
  contentId: string;
  status?: ContentStatus;
  metadata?: Record<string, any>;
}

class UUIDApiService {
  private api: AxiosInstance;
  private authBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev/api'; // 用户认证API服务

  constructor() {
    this.api = apiClient;
  }

  /**
   * 半匿名用户认证
   */
  async authenticateSemiAnonymous(
    identityA: string,
    identityB: string,
    deviceInfo?: any
  ): Promise<ApiResponse<{ user: UniversalUser; session: UserSession }>> {
    const response = await fetch(`${this.authBaseUrl}/uuid/auth/semi-anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identityA,
        identityB,
        deviceInfo: deviceInfo || this.getDeviceInfo()
      })
    });

    const data = await response.json();
    return data;
  }

  /**
   * 全匿名用户认证
   */
  async authenticateAnonymous(
    deviceInfo?: any
  ): Promise<ApiResponse<{ user: UniversalUser; session: UserSession }>> {
    const response = await this.api.post<ApiResponse<{ user: UniversalUser; session: UserSession }>>(
      '/uuid/auth/anonymous',
      {
        deviceInfo: deviceInfo || this.getDeviceInfo()
      }
    );
    return response.data;
  }

  /**
   * 管理员认证
   */
  async authenticateAdmin(
    username: string,
    password: string,
    userType: UserType = UserType.ADMIN
  ): Promise<ApiResponse<{ user: UniversalUser; session: UserSession }>> {
    const response = await this.api.post<ApiResponse<{ user: UniversalUser; session: UserSession }>>(
      '/uuid/auth/admin',
      {
        username,
        password,
        userType,
        deviceInfo: this.getDeviceInfo()
      }
    );
    return response.data;
  }

  /**
   * 验证会话
   */
  async validateSession(sessionToken: string): Promise<ApiResponse<{ user: UniversalUser; session: UserSession }>> {
    const response = await this.api.post<ApiResponse<{ user: UniversalUser; session: UserSession }>>(
      '/uuid/auth/validate',
      { sessionToken }
    );
    return response.data;
  }

  /**
   * 刷新会话
   */
  async refreshSession(sessionToken: string): Promise<ApiResponse<{ session: UserSession }>> {
    const response = await this.api.post<ApiResponse<{ session: UserSession }>>(
      '/uuid/auth/refresh',
      { sessionToken }
    );
    return response.data;
  }

  /**
   * 用户登出
   */
  async logout(sessionToken: string): Promise<ApiResponse<void>> {
    const response = await this.api.post<ApiResponse<void>>(
      '/uuid/auth/logout',
      { sessionToken }
    );
    return response.data;
  }

  /**
   * 检查身份冲突
   */
  async checkIdentityConflict(
    currentSessionToken: string,
    newCredentials: UserCredentials
  ): Promise<ApiResponse<{ hasConflict: boolean; message?: string }>> {
    const response = await this.api.post<ApiResponse<{ hasConflict: boolean; message?: string }>>(
      '/uuid/auth/check-conflict',
      {
        currentSessionToken,
        newCredentials
      }
    );
    return response.data;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(uuid: string): Promise<ApiResponse<UniversalUser>> {
    const response = await this.api.get<ApiResponse<UniversalUser>>(
      `/uuid/users/${uuid}`
    );
    return response.data;
  }

  /**
   * 更新用户信息
   */
  async updateUser(uuid: string, updates: Partial<UniversalUser>): Promise<ApiResponse<UniversalUser>> {
    const response = await this.api.patch<ApiResponse<UniversalUser>>(
      `/uuid/users/${uuid}`,
      updates
    );
    return response.data;
  }

  /**
   * 关联用户内容
   */
  async linkUserContent(
    userUuid: string,
    contentType: ContentType,
    contentId: string,
    status: ContentStatus = ContentStatus.PENDING,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<UserContentMapping>> {
    const response = await this.api.post<ApiResponse<UserContentMapping>>(
      '/uuid/content/link',
      {
        userUuid,
        contentType,
        contentId,
        status,
        metadata
      }
    );
    return response.data;
  }

  /**
   * 获取用户内容
   */
  async getUserContent(
    userUuid: string,
    contentType?: ContentType,
    status?: ContentStatus
  ): Promise<ApiResponse<UserContentMapping[]>> {
    const params = new URLSearchParams();
    if (contentType) params.append('contentType', contentType);
    if (status) params.append('status', status);

    const response = await this.api.get<ApiResponse<UserContentMapping[]>>(
      `/uuid/users/${userUuid}/content?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 更新内容状态
   */
  async updateContentStatus(
    mappingId: string,
    status: ContentStatus,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<UserContentMapping>> {
    const response = await this.api.patch<ApiResponse<UserContentMapping>>(
      `/uuid/content/${mappingId}`,
      { status, metadata }
    );
    return response.data;
  }

  /**
   * 删除用户内容关联
   */
  async unlinkUserContent(mappingId: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(
      `/uuid/content/${mappingId}`
    );
    return response.data;
  }

  /**
   * 获取用户统计信息
   */
  async getUserStatistics(
    dateRange?: { start: string; end: string },
    userType?: UserType
  ): Promise<ApiResponse<UserStatistics>> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }
    if (userType) params.append('userType', userType);

    const response = await this.api.get<ApiResponse<UserStatistics>>(
      `/uuid/statistics?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取每日新增用户统计
   */
  async getDailyUserStats(
    date: string,
    userType?: UserType
  ): Promise<ApiResponse<{ date: string; count: number; userType: UserType }[]>> {
    const params = new URLSearchParams();
    params.append('date', date);
    if (userType) params.append('userType', userType);

    const response = await this.api.get<ApiResponse<{ date: string; count: number; userType: UserType }[]>>(
      `/uuid/statistics/daily?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 批量操作用户
   */
  async batchUpdateUsers(
    operations: Array<{
      uuid: string;
      operation: 'activate' | 'deactivate' | 'suspend' | 'delete';
      reason?: string;
    }>
  ): Promise<ApiResponse<{ success: number; failed: number; errors: any[] }>> {
    const response = await this.api.post<ApiResponse<{ success: number; failed: number; errors: any[] }>>(
      '/uuid/users/batch',
      { operations }
    );
    return response.data;
  }

  /**
   * 搜索用户
   */
  async searchUsers(
    query: string,
    filters?: {
      userType?: UserType;
      status?: string;
      dateRange?: { start: string; end: string };
    },
    pagination?: { page: number; pageSize: number }
  ): Promise<ApiResponse<{ users: UniversalUser[]; total: number; page: number; pageSize: number }>> {
    const response = await this.api.post<ApiResponse<{ users: UniversalUser[]; total: number; page: number; pageSize: number }>>(
      '/uuid/users/search',
      {
        query,
        filters,
        pagination: pagination || { page: 1, pageSize: 20 }
      }
    );
    return response.data;
  }

  /**
   * 导出用户数据
   */
  async exportUserData(
    filters?: {
      userType?: UserType;
      dateRange?: { start: string; end: string };
    },
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    const response = await this.api.post<ApiResponse<{ downloadUrl: string; filename: string }>>(
      '/uuid/users/export',
      { filters, format }
    );
    return response.data;
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 导出单例实例
export const uuidApiService = new UUIDApiService();
export default uuidApiService;

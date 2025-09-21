/**
 * 管理员服务 - 修复版本
 * 连接管理员API，提供真实数据
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

// 创建axios实例
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
adminApi.interceptors.request.use(
  (config) => {
    // 从localStorage获取管理员token
    const token = localStorage.getItem('management_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Admin API Error:', error);
    return Promise.reject(error);
  }
);

// 用户接口
export interface User {
  id: string;
  username: string;
  nickname?: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'banned';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  questionnairesCount: number;
  storiesCount: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 仪表板统计数据接口
export interface DashboardStats {
  totalUsers: number;
  totalQuestionnaires: number;
  totalReviews: number;
  pendingReviews: number;
  todaySubmissions: number;
  weeklyGrowth: number;
  systemHealth: number;
  activeUsers: number;
}

// 管理员服务类
export class AdminService {
  // 获取仪表板统计数据
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await adminApi.get('/api/admin/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      throw error;
    }
  }

  // 获取用户列表
  static async getUsers(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      userType?: string;
      status?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters?.userType && { userType: filters.userType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await adminApi.get(`/api/admin/users?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 更新用户状态
  static async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      await adminApi.put(`/api/admin/users/${userId}/status`, { status });
    } catch (error) {
      console.error('更新用户状态失败:', error);
      throw error;
    }
  }

  // 获取用户详情
  static async getUserDetails(userId: string): Promise<User> {
    try {
      const response = await adminApi.get(`/api/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<void> {
    try {
      await adminApi.delete(`/api/admin/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 批量操作用户
  static async batchUpdateUsers(
    userIds: string[],
    action: 'activate' | 'deactivate' | 'delete',
    data?: any
  ): Promise<void> {
    try {
      await adminApi.post('/api/admin/users/batch', {
        userIds,
        action,
        data,
      });
    } catch (error) {
      console.error('批量操作用户失败:', error);
      throw error;
    }
  }

  // 导出用户数据
  static async exportUsers(format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    try {
      const response = await adminApi.get(`/api/admin/users/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('导出用户数据失败:', error);
      throw error;
    }
  }

  // 获取用户统计
  static async getUserStats(): Promise<any> {
    try {
      const response = await adminApi.get('/api/admin/users/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw error;
    }
  }
}

export default AdminService;

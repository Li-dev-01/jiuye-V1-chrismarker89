/**
 * 管理系统专用AdminService
 * 专门为管理员/审核员系统提供API服务
 */

import axios from 'axios';
import { managementAuthService } from './managementAuthService';

// 仪表板统计数据类型
export interface DashboardStats {
  questionnaires: {
    total_questionnaires: number;
    pending_questionnaires: number;
    approved_questionnaires: number;
    rejected_questionnaires: number;
  };
  voices: {
    total_voices: number;
    raw_voices: number;
    valid_voices: number;
  };
  stories: {
    total_stories: number;
    raw_stories: number;
    valid_stories: number;
  };
  audits: {
    total_audits: number;
    pending_audits: number;
    approved_audits: number;
    rejected_audits: number;
    human_reviews: number;
  };
  users: {
    total_users: number;
    active_users: number;
    reviewers: number;
    admins: number;
  };
  today: {
    submissions: number;
    audits: number;
  };
}

// 问卷数据类型
export interface AdminQuestionnaire {
  id: number;
  session_id: string;
  is_completed: boolean;
  completion_percentage: number;
  started_at: string;
  completed_at: string | null;
  total_time_seconds: number | null;
  device_type: string | null;
  browser_type: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 创建专用的axios实例
const managementApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 使用管理系统的认证token
managementApi.interceptors.request.use(
  (config) => {
    const token = managementAuthService.getAuthToken();
    if (token) {
      // 使用管理系统的token格式
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('管理API请求:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      token: token ? token.substring(0, 20) + '...' : null
    });
    return config;
  },
  (error) => {
    console.error('管理API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
managementApi.interceptors.response.use(
  (response) => {
    console.log('管理API响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('管理API响应错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // 如果是401错误，可能需要重新登录
    if (error.response?.status === 401) {
      console.warn('管理系统认证失效，需要重新登录');
      // 可以在这里触发重新登录逻辑
    }
    
    return Promise.reject(error);
  }
);

// 用户接口定义
export interface ManagementUser {
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

// 管理系统专用服务类
export class ManagementAdminService {
  // 获取仪表板统计数据
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('获取仪表板统计数据...');
      const response = await managementApi.get('/api/admin/dashboard/stats');
      const apiData = response.data.data;

      // 转换API数据格式为前端期望的格式
      const dashboardStats: DashboardStats = {
        questionnaires: {
          total_questionnaires: apiData.totalQuestionnaires || 0,
          pending_questionnaires: apiData.pendingReviews || 0,
          approved_questionnaires: (apiData.totalQuestionnaires || 0) - (apiData.pendingReviews || 0),
          rejected_questionnaires: 0
        },
        voices: {
          total_voices: apiData.voices?.total_voices || 0,
          raw_voices: apiData.voices?.raw_voices || 0,
          valid_voices: apiData.voices?.valid_voices || 0
        },
        stories: {
          total_stories: apiData.stories?.total_stories || 0,
          raw_stories: apiData.stories?.raw_stories || 0,
          valid_stories: apiData.stories?.valid_stories || 0
        },
        audits: {
          total_audits: apiData.audits?.total_audits || 0,
          pending_audits: apiData.audits?.pending_audits || 0,
          approved_audits: apiData.audits?.approved_audits || 0,
          rejected_audits: apiData.audits?.rejected_audits || 0,
          human_reviews: apiData.audits?.human_reviews || 0
        },
        users: {
          total_users: apiData.totalUsers || 0,
          active_users: apiData.activeUsers || 0,
          reviewers: 0,
          admins: 0
        },
        today: {
          submissions: apiData.todaySubmissions || 0,
          audits: 0
        }
      };

      console.log('转换后的仪表板统计数据:', dashboardStats);
      return dashboardStats;
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
  ): Promise<any> {
    try {
      console.log('获取用户列表...', { page, pageSize, filters });

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters?.userType && { userType: filters.userType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await managementApi.get(`/api/admin/users?${params}`);
      console.log('用户列表响应:', response.data);

      // 安全地处理响应数据
      if (response && response.data) {
        // 尝试不同的数据结构
        if (response.data.data) {
          return response.data.data;
        } else if (response.data.items) {
          return response.data.items;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('未知的响应数据格式:', response.data);
          return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } };
        }
      } else {
        console.warn('响应数据为空');
        return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } };
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      // 返回空数据而不是抛出错误
      return { items: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
  }

  // 更新用户状态
  static async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      console.log('更新用户状态...', { userId, status });
      await managementApi.put(`/api/admin/users/${userId}/status`, { status });
    } catch (error) {
      console.error('更新用户状态失败:', error);
      throw error;
    }
  }

  // 获取用户详情
  static async getUserDetails(userId: string): Promise<ManagementUser> {
    try {
      console.log('获取用户详情...', { userId });
      const response = await managementApi.get(`/api/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<void> {
    try {
      console.log('删除用户...', { userId });
      await managementApi.delete(`/api/admin/users/${userId}`);
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
      console.log('批量操作用户...', { userIds, action, data });
      await managementApi.post('/api/admin/users/batch', {
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
      console.log('导出用户数据...', { format });
      const response = await managementApi.get(`/api/admin/users/export?format=${format}`, {
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
      console.log('获取用户统计...');
      const response = await managementApi.get('/api/admin/users/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw error;
    }
  }

  // 获取问卷列表
  static async getQuestionnaires(params: any = {}): Promise<PaginatedResponse<AdminQuestionnaire>> {
    try {
      console.log('获取问卷列表...', params);
      const response = await managementApi.get('/api/admin/questionnaires', { params });
      const apiData = response.data.data;

      // 转换API数据格式为前端期望的格式
      const transformedItems: AdminQuestionnaire[] = apiData.items.map((item: any) => ({
        id: parseInt(item.id.replace('q_', '').split('_')[0]) || 0,
        session_id: item.sessionId,
        is_completed: item.completionStatus === 'completed',
        completion_percentage: item.completionRate,
        started_at: item.submittedAt,
        completed_at: item.completionStatus === 'completed' ? item.submittedAt : null,
        total_time_seconds: null,
        device_type: item.deviceType,
        browser_type: null,
        status: item.status as 'pending' | 'approved' | 'rejected',
        created_at: item.submittedAt,
        updated_at: item.submittedAt
      }));

      return {
        items: transformedItems,
        pagination: apiData.pagination
      };
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      throw error;
    }
  }

  // 更新问卷状态
  static async updateQuestionnaireStatus(id: number, status: string, comment?: string): Promise<any> {
    try {
      console.log('更新问卷状态...', { id, status, comment });
      const response = await managementApi.put(`/api/admin/questionnaires/${id}`, { status, comment });
      return response.data.data;
    } catch (error) {
      console.error('更新问卷状态失败:', error);
      throw error;
    }
  }

  // 批量更新问卷状态
  static async batchUpdateQuestionnaireStatus(ids: number[], status: string, comment?: string): Promise<void> {
    try {
      console.log('批量更新问卷状态...', { ids, status, comment });
      await managementApi.post('/api/admin/questionnaires/batch-update', { ids, status, comment });
    } catch (error) {
      console.error('批量更新问卷状态失败:', error);
      throw error;
    }
  }

  // 删除问卷
  static async deleteQuestionnaire(id: number): Promise<void> {
    try {
      console.log('删除问卷...', { id });
      await managementApi.delete(`/api/admin/questionnaires/${id}`);
    } catch (error) {
      console.error('删除问卷失败:', error);
      throw error;
    }
  }



  // 获取审核记录
  static async getAuditRecords(params: any = {}): Promise<any> {
    try {
      console.log('获取审核记录...', params);
      const response = await managementApi.get('/api/admin/audit-records', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取审核记录失败:', error);
      throw error;
    }
  }

  // 获取审核员列表
  static async getReviewers(params: any = {}): Promise<any> {
    try {
      console.log('获取审核员列表...', params);
      const response = await managementApi.get('/api/admin/reviewers', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取审核员列表失败:', error);
      throw error;
    }
  }

  // 获取内容分类列表
  static async getContentCategories(): Promise<any[]> {
    try {
      console.log('获取内容分类列表...');
      const response = await managementApi.get('/api/admin/content/categories');
      return response.data.data;
    } catch (error) {
      console.error('获取内容分类失败:', error);
      throw error;
    }
  }

  // 获取内容标签列表
  static async getContentTags(): Promise<any[]> {
    try {
      console.log('获取内容标签列表...');
      const response = await managementApi.get('/api/admin/content/tags');
      return response.data.data;
    } catch (error) {
      console.error('获取内容标签失败:', error);
      throw error;
    }
  }

  // 创建内容分类
  static async createContentCategory(data: any): Promise<any> {
    try {
      console.log('创建内容分类...', data);
      const response = await managementApi.post('/api/admin/content/categories', data);
      return response.data.data;
    } catch (error) {
      console.error('创建内容分类失败:', error);
      throw error;
    }
  }

  // 创建内容标签
  static async createContentTag(data: any): Promise<any> {
    try {
      console.log('创建内容标签...', data);
      const response = await managementApi.post('/api/admin/content/tags', data);
      return response.data.data;
    } catch (error) {
      console.error('创建内容标签失败:', error);
      throw error;
    }
  }

  // 更新内容标签
  static async updateContentTag(id: string, data: any): Promise<any> {
    try {
      console.log('更新内容标签...', id, data);
      const response = await managementApi.put(`/api/admin/content/tags/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('更新内容标签失败:', error);
      throw error;
    }
  }

  // 删除内容标签
  static async deleteContentTag(id: string): Promise<any> {
    try {
      console.log('删除内容标签...', id);
      const response = await managementApi.delete(`/api/admin/content/tags/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除内容标签失败:', error);
      throw error;
    }
  }

  // 获取标签统计
  static async getContentTagStats(): Promise<any> {
    try {
      console.log('获取标签统计...');
      const response = await managementApi.get('/api/admin/content/tags/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取标签统计失败:', error);
      throw error;
    }
  }

  // 合并标签
  static async mergeContentTags(sourceTagIds: string[], targetTagId: string): Promise<any> {
    try {
      console.log('合并标签...', sourceTagIds, targetTagId);
      const response = await managementApi.post('/api/admin/content/tags/merge', {
        source_tag_ids: sourceTagIds,
        target_tag_id: targetTagId
      });
      return response.data;
    } catch (error) {
      console.error('合并标签失败:', error);
      throw error;
    }
  }

  // 清理未使用的标签
  static async cleanupUnusedTags(): Promise<any> {
    try {
      console.log('清理未使用的标签...');
      const response = await managementApi.delete('/api/admin/content/tags/cleanup');
      return response.data;
    } catch (error) {
      console.error('清理标签失败:', error);
      throw error;
    }
  }

  // 获取审核配置
  static async getAuditConfig(): Promise<any> {
    try {
      console.log('获取审核配置...');
      const response = await managementApi.get('/api/admin/audit-config');
      return response.data.data;
    } catch (error) {
      console.error('获取审核配置失败:', error);
      throw error;
    }
  }

  // 更新审核配置
  static async updateAuditConfig(data: any): Promise<any> {
    try {
      console.log('更新审核配置...', data);
      const response = await managementApi.put('/api/admin/audit-config', data);
      return response.data.data;
    } catch (error) {
      console.error('更新审核配置失败:', error);
      throw error;
    }
  }

  // 获取AI供应商列表
  static async getAiProviders(): Promise<any[]> {
    try {
      console.log('获取AI供应商列表...');
      const response = await managementApi.get('/api/admin/ai-providers');
      return response.data.data;
    } catch (error) {
      console.error('获取AI供应商列表失败:', error);
      throw error;
    }
  }

  // 获取本地规则列表
  static async getLocalRules(): Promise<any[]> {
    try {
      console.log('获取本地规则列表...');
      const response = await managementApi.get('/api/admin/local-rules');
      return response.data.data;
    } catch (error) {
      console.error('获取本地规则列表失败:', error);
      throw error;
    }
  }

  // 获取API端点列表
  static async getApiEndpoints(): Promise<any[]> {
    try {
      console.log('获取API端点列表...');
      const response = await managementApi.get('/api/admin/api/endpoints');
      return response.data.data;
    } catch (error) {
      console.error('获取API端点列表失败:', error);
      // 返回基本的API端点信息作为后备
      return [
        {
          id: 'auth-login',
          method: 'POST',
          path: '/api/auth/login',
          description: '用户登录',
          page: '登录页面',
          database: 'D1',
          tables: ['users'],
          status: 'active'
        },
        {
          id: 'questionnaire-submit',
          method: 'POST',
          path: '/api/questionnaire/submit',
          description: '提交问卷',
          page: '问卷页面',
          database: 'D1',
          tables: ['questionnaire_submissions'],
          status: 'active'
        },
        {
          id: 'voices-list',
          method: 'GET',
          path: '/api/voices',
          description: '获取心声列表',
          page: '心声页面',
          database: 'D1',
          tables: ['valid_voices'],
          status: 'active'
        },
        {
          id: 'stories-list',
          method: 'GET',
          path: '/api/stories',
          description: '获取故事列表',
          page: '故事页面',
          database: 'D1',
          tables: ['valid_stories'],
          status: 'active'
        }
      ];
    }
  }

  // 获取数据库表列表
  static async getDatabaseTables(): Promise<any[]> {
    try {
      console.log('获取数据库表列表...');
      const response = await managementApi.get('/api/admin/database/tables');
      return response.data.data;
    } catch (error) {
      console.error('获取数据库表列表失败:', error);
      // 返回基本的数据库表信息作为后备
      return [
        {
          name: 'questionnaire_submissions',
          type: 'temp',
          description: '问卷提交数据表',
          recordCount: 856,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['questionnaire-submit', 'admin-questionnaires']
        },
        {
          name: 'valid_voices',
          type: 'valid',
          description: '有效心声数据表',
          recordCount: 0,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['voices-list', 'voices-submit']
        },
        {
          name: 'valid_stories',
          type: 'valid',
          description: '有效故事数据表',
          recordCount: 0,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['stories-list', 'stories-submit']
        },
        {
          name: 'users',
          type: 'system',
          description: '用户数据表',
          recordCount: 12,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['auth-login', 'user-register']
        }
      ];
    }
  }

  // 验证管理系统认证状态
  static async validateAuth(): Promise<boolean> {
    try {
      const token = managementAuthService.getAuthToken();
      const user = managementAuthService.getCurrentUser();
      const session = managementAuthService.getCurrentSession();

      console.log('验证管理系统认证状态:', {
        hasToken: !!token,
        hasUser: !!user,
        hasSession: !!session,
        userType: user?.userType
      });

      return !!(token && user && session);
    } catch (error) {
      console.error('验证认证状态失败:', error);
      return false;
    }
  }
}

export default ManagementAdminService;

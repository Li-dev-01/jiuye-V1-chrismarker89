/**
 * 管理员服务
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

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
  error?: string;
}

// 安全管理相关类型
export interface SecurityMetrics {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  active_threats: number;
  blocked_ips: number;
  failed_logins: number;
  ddos_attempts: number;
  system_health: number;
}

export interface ThreatEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  details: string;
  status: 'active' | 'resolved' | 'ignored';
  created_at: string;
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blocked_at: string;
  expires_at: string;
  threat_score: number;
}

export interface SecurityConfig {
  ddos_protection: boolean;
  brute_force_protection: boolean;
  ip_whitelist_enabled: boolean;
  auto_block_enabled: boolean;
  max_login_attempts: number;
  block_duration: number;
  ddos_threshold: number;
}

export interface SecurityThreats {
  suspicious_ips: Array<{
    ip_address: string;
    threat_score: number;
    request_count: number;
    last_activity: string;
    threat_type: string;
  }>;
  attack_patterns: Array<{
    pattern_type: string;
    frequency: number;
    severity: string;
    description: string;
  }>;
  security_events: Array<{
    id: string;
    event_type: string;
    severity: string;
    source_ip: string;
    description: string;
    created_at: string;
    status: string;
  }>;
}

export interface ProjectStatus {
  project_enabled: boolean;
  maintenance_mode: boolean;
  emergency_shutdown: boolean;
  last_updated: string | null;
  updated_by: string | null;
}

export class AdminService {
  /**
   * 获取仪表板统计数据
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await adminApi.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取问卷列表
   */
  static async getQuestionnaires(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<PaginatedResponse<AdminQuestionnaire>> {
    try {
      const response = await adminApi.get<ApiResponse<PaginatedResponse<AdminQuestionnaire>>>(
        '/api/admin/questionnaires',
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('获取问卷列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新问卷状态
   */
  static async updateQuestionnaireStatus(
    id: number,
    status: 'approved' | 'rejected',
    comment?: string
  ): Promise<AdminQuestionnaire> {
    try {
      const response = await adminApi.put<ApiResponse<AdminQuestionnaire>>(
        `/api/admin/questionnaires/${id}`,
        { status, comment }
      );
      return response.data.data;
    } catch (error) {
      console.error('更新问卷状态失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新问卷状态
   */
  static async batchUpdateQuestionnaireStatus(
    ids: number[],
    status: 'approved' | 'rejected',
    comment?: string
  ): Promise<void> {
    try {
      await adminApi.post('/api/admin/questionnaires/batch-update', {
        ids,
        status,
        comment
      });
    } catch (error) {
      console.error('批量更新问卷状态失败:', error);
      throw error;
    }
  }

  /**
   * 删除问卷
   */
  static async deleteQuestionnaire(id: number): Promise<void> {
    try {
      await adminApi.delete(`/api/admin/questionnaires/${id}`);
    } catch (error) {
      console.error('删除问卷失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表
   */
  static async getUsers(params: {
    page?: number;
    pageSize?: number;
    userType?: string;
    status?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const response = await adminApi.get<ApiResponse<PaginatedResponse<any>>>(
        '/api/admin/users',
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取审核记录
   */
  static async getAuditRecords(params: {
    page?: number;
    pageSize?: number;
    contentType?: string;
    auditResult?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const response = await adminApi.get<ApiResponse<PaginatedResponse<any>>>(
        '/api/admin/audit-records',
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('获取审核记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统日志
   */
  static async getSystemLogs(params: {
    page?: number;
    pageSize?: number;
    level?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const response = await adminApi.get<ApiResponse<PaginatedResponse<any>>>(
        '/api/super-admin/system/logs',
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('获取系统日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取操作记录
   */
  static async getOperationLogs(params: {
    page?: number;
    pageSize?: number;
    username?: string;
    operation?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const response = await adminApi.get<ApiResponse<PaginatedResponse<any>>>(
        '/api/super-admin/operation/logs',
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error('获取操作记录失败:', error);
      throw error;
    }
  }

  /**
   * 导出数据
   */
  static async exportData(params: {
    type: 'questionnaires' | 'voices' | 'stories' | 'users';
    format: 'csv' | 'excel';
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      const response = await adminApi.get('/api/admin/export', {
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
   * 获取审核配置
   */
  static async getAuditConfig(): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/api/admin/audit-config');
      return response.data.data;
    } catch (error) {
      console.error('获取审核配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新审核配置
   */
  static async updateAuditConfig(config: any): Promise<any> {
    try {
      const response = await adminApi.put<ApiResponse<any>>('/api/admin/audit-config', config);
      return response.data.data;
    } catch (error) {
      console.error('更新审核配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取AI供应商列表
   */
  static async getAiProviders(): Promise<any[]> {
    try {
      const response = await adminApi.get<ApiResponse<any[]>>('/api/admin/ai-providers');
      return response.data.data;
    } catch (error) {
      console.error('获取AI供应商列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取本地规则列表
   */
  static async getLocalRules(): Promise<any[]> {
    try {
      const response = await adminApi.get<ApiResponse<any[]>>('/api/admin/local-rules');
      return response.data.data;
    } catch (error) {
      console.error('获取本地规则列表失败:', error);
      throw error;
    }
  }



  /**
   * 获取用户统计
   */
  static async getUserStats(): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/api/admin/users/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户状态
   */
  static async updateUserStatus(userId: number, data: { status: string }): Promise<any> {
    try {
      const response = await adminApi.put<ApiResponse<any>>(`/api/admin/users/${userId}/status`, data);
      return response.data.data;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取审核员列表
   */
  static async getReviewers(params: {
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/api/admin/reviewers', { params });
      return response.data.data;
    } catch (error) {
      console.error('获取审核员列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取审核员活动日志
   */
  static async getReviewerActivity(reviewerId: string, params: {
    page?: number;
    pageSize?: number;
    activityType?: string;
  }): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>(`/api/admin/reviewers/${reviewerId}/activity`, { params });
      return response.data.data;
    } catch (error) {
      console.error('获取审核员活动日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容分类列表
   */
  static async getContentCategories(): Promise<any[]> {
    try {
      const response = await adminApi.get<ApiResponse<any[]>>('/api/admin/content/categories');
      return response.data.data;
    } catch (error) {
      console.error('获取内容分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容标签列表
   */
  static async getContentTags(): Promise<any[]> {
    try {
      const response = await adminApi.get<ApiResponse<any[]>>('/api/admin/content/tags');
      return response.data.data;
    } catch (error) {
      console.error('获取内容标签失败:', error);
      throw error;
    }
  }

  /**
   * 创建内容分类
   */
  static async createContentCategory(data: any): Promise<any> {
    try {
      const response = await adminApi.post<ApiResponse<any>>('/api/admin/content/categories', data);
      return response.data.data;
    } catch (error) {
      console.error('创建内容分类失败:', error);
      throw error;
    }
  }

  /**
   * 创建内容标签
   */
  static async createContentTag(data: any): Promise<any> {
    try {
      const response = await adminApi.post<ApiResponse<any>>('/api/admin/content/tags', data);
      return response.data.data;
    } catch (error) {
      console.error('创建内容标签失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据库状态
   */
  static async getDatabaseStatus(): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/api/admin/database/status');
      return response.data.data;
    } catch (error) {
      console.error('获取数据库状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取API统计
   */
  static async getApiStats(): Promise<any> {
    try {
      const response = await adminApi.get<ApiResponse<any>>('/api/admin/api/stats');
      return response.data.data;
    } catch (error) {
      console.error('获取API统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取安全指标
   */
  static async getSecurityMetrics() {
    try {
      const response = await adminApi.get('/api/super-admin/security/metrics');
      return response.data.data;
    } catch (error) {
      console.error('获取安全指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取威胁分析数据
   */
  static async getSecurityThreats() {
    try {
      const response = await adminApi.get('/api/super-admin/security/threats');
      return response.data.data;
    } catch (error) {
      console.error('获取威胁分析失败:', error);
      throw error;
    }
  }

  /**
   * 封禁IP地址
   */
  static async blockIP(data: { ip_address: string; reason: string }) {
    try {
      const response = await adminApi.post('/api/super-admin/security/block-ip', data);
      return response.data;
    } catch (error) {
      console.error('封禁IP失败:', error);
      throw error;
    }
  }

  /**
   * 紧急关闭系统
   */
  static async emergencyShutdown(data: { reason: string }) {
    try {
      const response = await adminApi.post('/api/super-admin/emergency/shutdown', data);
      return response.data;
    } catch (error) {
      console.error('紧急关闭失败:', error);
      throw error;
    }
  }

  /**
   * 恢复系统运行
   */
  static async restoreProject(data: { reason: string }) {
    try {
      const response = await adminApi.post('/api/super-admin/project/restore', data);
      return response.data;
    } catch (error) {
      console.error('恢复系统失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目状态
   */
  static async getProjectStatus() {
    try {
      const response = await adminApi.get('/api/super-admin/project/status');
      return response.data.data;
    } catch (error) {
      console.error('获取项目状态失败:', error);
      throw error;
    }
  }
}

export default AdminService;

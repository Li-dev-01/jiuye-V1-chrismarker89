/**
 * 超级管理员专用API服务
 * 集成真实的超级管理员API接口
 */

import { adminApiClient } from './adminApiClient';
import { API_CONFIG } from '../config/api';

// 项目状态接口
export interface ProjectStatus {
  project_enabled: boolean;
  maintenance_mode: boolean;
  emergency_shutdown: boolean;
  last_updated: string | null;
  updated_by: string | null;
}

// 安全指标接口
export interface SecurityMetrics {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  active_threats: number;
  blocked_ips: number;
  failed_logins: number;
  ddos_attempts: number;
  system_health: number;
}

// 威胁IP接口
export interface ThreatIP {
  ip_address: string;
  threat_score: number;
  attack_count: number;
  last_attack: string;
  location?: string;
  blocked: boolean;
}

// 安全事件接口
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_agent?: string;
  handled: boolean;
}

// 威胁分析数据接口
export interface ThreatAnalysisData {
  suspicious_ips: ThreatIP[];
  attack_patterns: any[];
  security_events: SecurityEvent[];
}

// 系统日志接口
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'success';
  category: string;
  message: string;
  source: string;
  username?: string;
  action?: string;
  ip_address?: string;
  user_agent?: string;
}

// 系统日志查询参数
export interface SystemLogsQuery {
  page?: number;
  pageSize?: number;
  level?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// 系统日志响应
export interface SystemLogsResponse {
  items: SystemLog[];
  total: number;
  page: number;
  pageSize: number;
}

// 项目控制操作
export interface ProjectControlAction {
  action: 'enable' | 'disable' | 'maintenance_on' | 'maintenance_off' | 'emergency_shutdown' | 'restore';
  reason?: string;
}

class SuperAdminApiService {
  /**
   * 获取项目运行状态
   */
  async getProjectStatus(): Promise<ProjectStatus> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN_PROJECT_STATUS);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取项目状态失败');
      }
    } catch (error) {
      console.error('获取项目状态失败:', error);
      throw error;
    }
  }

  /**
   * 控制项目状态
   */
  async controlProject(action: ProjectControlAction): Promise<void> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN_PROJECT_CONTROL, action);
      
      if (!response.data.success) {
        throw new Error(response.data.message || '项目控制操作失败');
      }
    } catch (error) {
      console.error('项目控制操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取安全指标
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN_SECURITY_METRICS);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取安全指标失败');
      }
    } catch (error) {
      console.error('获取安全指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取威胁分析数据
   */
  async getThreatAnalysis(): Promise<ThreatAnalysisData> {
    try {
      const response = await adminApiClient.get(API_CONFIG.ENDPOINTS.SUPER_ADMIN_SECURITY_THREATS);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取威胁分析失败');
      }
    } catch (error) {
      console.error('获取威胁分析失败:', error);
      throw error;
    }
  }

  /**
   * 紧急关闭项目
   */
  async emergencyShutdown(reason: string): Promise<void> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN_EMERGENCY_SHUTDOWN, {
        reason
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '紧急关闭失败');
      }
    } catch (error) {
      console.error('紧急关闭失败:', error);
      throw error;
    }
  }

  /**
   * 恢复项目运行
   */
  async restoreProject(reason: string): Promise<void> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN_PROJECT_RESTORE, {
        reason
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '项目恢复失败');
      }
    } catch (error) {
      console.error('项目恢复失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(query: SystemLogsQuery = {}): Promise<SystemLogsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query.level && query.level !== 'all') params.append('level', query.level);
      if (query.category && query.category !== 'all') params.append('category', query.category);
      if (query.startDate) params.append('startDate', query.startDate);
      if (query.endDate) params.append('endDate', query.endDate);
      if (query.search) params.append('search', query.search);

      const url = `${API_CONFIG.ENDPOINTS.SUPER_ADMIN_SYSTEM_LOGS}?${params.toString()}`;
      const response = await adminApiClient.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取系统日志失败');
      }
    } catch (error) {
      console.error('获取系统日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取操作记录
   */
  async getOperationLogs(query: SystemLogsQuery = {}): Promise<SystemLogsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query.search) params.append('search', query.search);

      const url = `${API_CONFIG.ENDPOINTS.SUPER_ADMIN_OPERATION_LOGS}?${params.toString()}`;
      const response = await adminApiClient.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取操作记录失败');
      }
    } catch (error) {
      console.error('获取操作记录失败:', error);
      throw error;
    }
  }

  /**
   * 封禁威胁IP
   */
  async blockIP(ip: string, reason: string): Promise<void> {
    try {
      const response = await adminApiClient.post(API_CONFIG.ENDPOINTS.SUPER_ADMIN_BLOCK_IP, {
        ip_address: ip,
        reason
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'IP封禁失败');
      }
    } catch (error) {
      console.error('IP封禁失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const superAdminApiService = new SuperAdminApiService();
export default superAdminApiService;

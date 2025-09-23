/**
 * 审核服务
 * 处理A表到B表的审核流程
 */

import axios, { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 类型定义
export interface AuditRecord {
  auditId: number;
  sourceTable: string;
  sourceId: number;
  contentType: 'heart_voice' | 'story';
  contentTitle: string;
  contentPreview: string;
  authorName: string;
  auditType: 'automatic' | 'manual_required';
  auditResult: 'pending' | 'approved' | 'rejected' | 'flagged';
  confidenceScore: number;
  auditDetails: any;
  createdAt: string;
}

export interface AuditConfig {
  auto_approve_enabled: boolean;
  auto_approve_all: boolean;
  manual_review_threshold: number;
  content_filters: {
    min_length: number;
    max_length: number;
    forbidden_words: string[];
  };
}

export interface ProcessAuditRequest {
  source_table: string;
  source_id: number;
  content_type: 'heart_voice' | 'story';
  force_manual?: boolean;
}

export interface ProcessAuditResponse {
  success: boolean;
  data?: {
    audit_result: 'approved' | 'rejected' | 'flagged';
    audit_type: 'automatic' | 'manual_required';
    score: number;
    reasons: string[];
    requires_manual: boolean;
  };
  error?: string;
}

export interface ManualReviewRequest {
  audit_id: number;
  decision: 'approved' | 'rejected';
  reviewer_id: number;
  notes?: string;
}

export interface PendingAuditsResponse {
  success: boolean;
  data?: {
    audits: AuditRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * 审核服务类
 */
class AuditService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 审核可能需要较长时间
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
   * 处理审核（A表→B表）
   */
  async processAudit(request: ProcessAuditRequest): Promise<ProcessAuditResponse> {
    try {
      const response = await this.client.post('/process', request);
      return response.data;
    } catch (error) {
      console.error('Process audit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取待审核列表
   */
  async getPendingAudits(params: {
    page?: number;
    pageSize?: number;
    content_type?: 'heart_voice' | 'story';
  } = {}): Promise<PendingAuditsResponse> {
    try {
      const response = await this.client.get('/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Get pending audits error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 人工审核
   */
  async manualReview(request: ManualReviewRequest): Promise<{
    success: boolean;
    data?: {
      audit_id: number;
      decision: string;
      reviewed_at: string;
    };
    error?: string;
    message?: string;
  }> {
    try {
      const response = await this.client.post('/manual-review', request);
      return response.data;
    } catch (error) {
      console.error('Manual review error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取审核配置
   */
  async getAuditConfig(): Promise<{
    success: boolean;
    data?: AuditConfig;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/config');
      return response.data;
    } catch (error) {
      console.error('Get audit config error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 更新审核配置
   */
  async updateAuditConfig(config: Partial<AuditConfig> & { user_id: number }): Promise<{
    success: boolean;
    data?: AuditConfig;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await this.client.post('/config', config);
      return response.data;
    } catch (error) {
      console.error('Update audit config error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 批量处理审核
   */
  async batchProcessAudit(requests: ProcessAuditRequest[]): Promise<{
    success: boolean;
    results?: ProcessAuditResponse[];
    error?: string;
  }> {
    try {
      const results: ProcessAuditResponse[] = [];
      
      for (const request of requests) {
        const result = await this.processAudit(request);
        results.push(result);
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Batch process audit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取审核统计
   */
  async getAuditStats(): Promise<{
    success: boolean;
    data?: {
      total_pending: number;
      total_approved: number;
      total_rejected: number;
      auto_approval_rate: number;
      manual_review_rate: number;
    };
    error?: string;
  }> {
    try {
      // 这里可以实现审核统计API
      // 暂时返回模拟数据
      return {
        success: true,
        data: {
          total_pending: 0,
          total_approved: 0,
          total_rejected: 0,
          auto_approval_rate: 0.95,
          manual_review_rate: 0.05
        }
      };
    } catch (error) {
      console.error('Get audit stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 重新处理失败的审核
   */
  async retryFailedAudit(auditId: number): Promise<ProcessAuditResponse> {
    try {
      // 这里可以实现重试逻辑
      // 暂时返回成功
      return {
        success: true,
        data: {
          audit_result: 'approved',
          audit_type: 'automatic',
          score: 1.0,
          reasons: [],
          requires_manual: false
        }
      };
    } catch (error) {
      console.error('Retry failed audit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const auditService = new AuditService();
export default auditService;

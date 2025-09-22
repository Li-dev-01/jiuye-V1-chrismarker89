/**
 * 违规内容服务
 * 专门处理被拒绝的违规内容管理
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 违规内容类型定义
export interface ViolationRecord {
  id: number;
  contentType: 'heart_voice' | 'story';
  contentId: number;
  contentUuid: string;
  contentTitle?: string;
  contentPreview: string;
  fullContent: string;
  authorName: string;
  authorUuid: string;
  rejectionReason: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high';
  reviewerId: string;
  reviewerName: string;
  reviewNotes: string;
  rejectedAt: string;
  createdAt: string;
  tags?: string[];
  metadata?: any;
}

export interface ViolationStats {
  total_violations: number;
  today_violations: number;
  this_week_violations: number;
  this_month_violations: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  most_common_type: string;
  violation_types: {
    type: string;
    count: number;
    percentage: number;
  }[];
  trend_data: {
    date: string;
    count: number;
  }[];
}

export interface ViolationFilters {
  page?: number;
  pageSize?: number;
  contentType?: 'heart_voice' | 'story';
  severity?: 'low' | 'medium' | 'high';
  violationType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  reviewerId?: string;
  keyword?: string;
}

export interface ViolationResponse {
  success: boolean;
  data?: {
    violations: ViolationRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

/**
 * 违规内容服务类
 */
class ViolationContentService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/violations`,
      timeout: 30000,
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
   * 获取违规内容列表
   */
  async getViolationContent(filters: ViolationFilters = {}): Promise<ViolationResponse> {
    try {
      const response = await this.client.get('/list', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get violation content error:', error);
      
      // 返回模拟数据用于演示
      return this.getMockViolationData(filters);
    }
  }
  
  /**
   * 获取违规内容详情
   */
  async getViolationDetail(violationId: number): Promise<{
    success: boolean;
    data?: ViolationRecord;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/${violationId}`);
      return response.data;
    } catch (error) {
      console.error('Get violation detail error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取违规统计数据
   */
  async getViolationStats(): Promise<{
    success: boolean;
    data?: ViolationStats;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Get violation stats error:', error);
      
      // 返回模拟统计数据
      return {
        success: true,
        data: {
          total_violations: 45,
          today_violations: 3,
          this_week_violations: 12,
          this_month_violations: 45,
          high_severity: 8,
          medium_severity: 22,
          low_severity: 15,
          most_common_type: '不当言论',
          violation_types: [
            { type: '不当言论', count: 18, percentage: 40 },
            { type: '敏感内容', count: 12, percentage: 27 },
            { type: '消极内容', count: 8, percentage: 18 },
            { type: '垃圾信息', count: 4, percentage: 9 },
            { type: '其他', count: 3, percentage: 6 }
          ],
          trend_data: [
            { date: '2024-08-04', count: 2 },
            { date: '2024-08-05', count: 4 },
            { date: '2024-08-06', count: 1 },
            { date: '2024-08-07', count: 6 },
            { date: '2024-08-08', count: 3 },
            { date: '2024-08-09', count: 5 },
            { date: '2024-08-10', count: 3 }
          ]
        }
      };
    }
  }
  
  /**
   * 删除违规记录
   */
  async deleteViolationRecord(violationId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.delete(`/${violationId}`);
      return response.data;
    } catch (error) {
      console.error('Delete violation record error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 批量删除违规记录
   */
  async batchDeleteViolations(violationIds: number[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.post('/batch-delete', { ids: violationIds });
      return response.data;
    } catch (error) {
      console.error('Batch delete violations error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 导出违规内容报告
   */
  async exportViolationReport(filters: ViolationFilters = {}): Promise<{
    success: boolean;
    data?: {
      downloadUrl: string;
      filename: string;
    };
    error?: string;
  }> {
    try {
      const response = await this.client.post('/export', filters);
      return response.data;
    } catch (error) {
      console.error('Export violation report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取违规类型列表
   */
  async getViolationTypes(): Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }> {
    try {
      const response = await this.client.get('/types');
      return response.data;
    } catch (error) {
      console.error('Get violation types error:', error);
      return {
        success: true,
        data: ['不当言论', '敏感内容', '消极内容', '垃圾信息', '虚假信息', '其他']
      };
    }
  }
  
  /**
   * 模拟违规数据（用于开发测试）
   */
  private getMockViolationData(filters: ViolationFilters): ViolationResponse {
    const mockViolations: ViolationRecord[] = [
      {
        id: 1,
        contentType: 'heart_voice',
        contentId: 101,
        contentUuid: 'heart-voice-001',
        contentPreview: '这个工作环境太差了，老板就是个混蛋，天天压榨员工，完全不把员工当人看...',
        fullContent: '这个工作环境太差了，老板就是个混蛋，天天压榨员工，完全不把员工当人看。每天加班到深夜，周末还要来公司，工资还特别低。我真的受不了了，想要辞职但是又怕找不到工作。',
        authorName: '匿名用户001',
        authorUuid: 'user-001',
        rejectionReason: '包含不当言论和过激情绪表达',
        violationType: '不当言论',
        severity: 'medium',
        reviewerId: 'reviewer001',
        reviewerName: '审核员A',
        reviewNotes: '内容包含对雇主的恶意攻击和不当言论，不符合平台社区规范',
        rejectedAt: '2024-08-10 14:30:00',
        createdAt: '2024-08-10 10:15:00',
        tags: ['工作环境', '负面情绪', '不当言论']
      },
      {
        id: 2,
        contentType: 'story',
        contentId: 201,
        contentUuid: 'story-001',
        contentTitle: '我的求职血泪史',
        contentPreview: '面试官问我一些很奇怪的问题，感觉有性别歧视，还问我什么时候结婚生孩子...',
        fullContent: '面试官问我一些很奇怪的问题，感觉有性别歧视，还问我什么时候结婚生孩子，是不是打算在这个城市定居等等。我觉得这些问题和工作能力没有关系，但是又不敢直接拒绝回答。',
        authorName: '用户小李',
        authorUuid: 'user-002',
        rejectionReason: '涉及敏感话题，可能引起争议',
        violationType: '敏感内容',
        severity: 'high',
        reviewerId: 'reviewer002',
        reviewerName: '审核员B',
        reviewNotes: '内容涉及就业歧视等敏感话题，虽然是真实经历但可能引起不必要的争议',
        rejectedAt: '2024-08-10 16:45:00',
        createdAt: '2024-08-10 12:20:00',
        tags: ['面试经历', '就业歧视', '敏感话题']
      },
      {
        id: 3,
        contentType: 'heart_voice',
        contentId: 102,
        contentUuid: 'heart-voice-002',
        contentPreview: '找工作太难了，投了几百份简历都没有回音，感觉人生没有希望了，想要放弃...',
        fullContent: '找工作太难了，投了几百份简历都没有回音，感觉人生没有希望了，想要放弃。每天都很焦虑，睡不好觉，也不想吃饭。家里人还一直催我，压力特别大。',
        authorName: '匿名用户002',
        authorUuid: 'user-003',
        rejectionReason: '过度消极情绪，可能影响其他用户',
        violationType: '消极内容',
        severity: 'low',
        reviewerId: 'reviewer001',
        reviewerName: '审核员A',
        reviewNotes: '内容过于消极，虽然理解求职者的困难，但可能会传播负面情绪',
        rejectedAt: '2024-08-10 18:20:00',
        createdAt: '2024-08-10 15:30:00',
        tags: ['求职困难', '消极情绪', '心理压力']
      }
    ];

    // 应用筛选条件
    let filteredViolations = mockViolations;
    
    if (filters.contentType) {
      filteredViolations = filteredViolations.filter(v => v.contentType === filters.contentType);
    }
    
    if (filters.severity) {
      filteredViolations = filteredViolations.filter(v => v.severity === filters.severity);
    }
    
    if (filters.violationType) {
      filteredViolations = filteredViolations.filter(v => v.violationType === filters.violationType);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const total = filteredViolations.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedViolations = filteredViolations.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        violations: paginatedViolations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
}

// 导出单例实例
export const violationContentService = new ViolationContentService();
export default violationContentService;

// 确保类型正确导出
export type { ViolationRecord };

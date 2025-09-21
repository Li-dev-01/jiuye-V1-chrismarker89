/**
 * Analytics Service - 数据分析服务
 * 为可视化页面提供数据支持
 */

import type { AxiosInstance } from 'axios';
import { apiClient } from './api';

export interface AnalyticsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardData {
  totalResponses: number;
  totalHeartVoices: number;
  totalStories: number;
  completionRate: number;
  averageTime: number;
  lastUpdated: string;
  educationDistribution: Array<{ name: string; value: number }>;
  salaryExpectation: Array<{ name: string; value: number }>;
  employmentStatus: Array<{ name: string; value: number }>;
  monthlyTrend: {
    months: string[];
    questionnaires: number[];
    completions: number[];
  };
  regionDistribution: Array<{ name: string; value: number }>;
  ageDistribution: Array<{ name: string; value: number }>;
  skillsHeatmap: {
    data: Array<{ skill: string; level: number }>;
  };
}

class AnalyticsService {
  private api: AxiosInstance;

  constructor() {
    this.api = apiClient;
  }

  /**
   * 获取仪表板数据
   */
  async getDashboardData(): Promise<AnalyticsResponse<DashboardData>> {
    try {
      const response = await this.api.get('/analytics/dashboard');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch dashboard data'
      };
    }
  }

  /**
   * 获取数据分布
   */
  async getDistribution(questionId: string): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get(`/analytics/distribution?question_id=${questionId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch distribution data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch distribution data'
      };
    }
  }

  /**
   * 获取趋势数据
   */
  async getTrendData(period: string = '6months'): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get(`/analytics/trend?period=${period}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch trend data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch trend data'
      };
    }
  }

  /**
   * 获取交叉分析数据
   */
  async getCrossAnalysis(dimensions: string[]): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.post('/analytics/cross-analysis', { dimensions });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch cross analysis data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch cross analysis data'
      };
    }
  }

  /**
   * 获取就业分析数据
   */
  async getEmploymentAnalysis(): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get('/analytics/employment');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch employment analysis:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employment analysis'
      };
    }
  }

  /**
   * 获取地域分析数据
   */
  async getRegionalAnalysis(): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get('/analytics/regional');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch regional analysis:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch regional analysis'
      };
    }
  }

  /**
   * 获取满意度分析数据
   */
  async getSatisfactionAnalysis(): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get('/analytics/satisfaction');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch satisfaction analysis:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch satisfaction analysis'
      };
    }
  }

  /**
   * 获取实时统计数据
   */
  async getRealTimeStats(): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.get('/analytics/realtime');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Failed to fetch realtime stats:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch realtime stats'
      };
    }
  }

  /**
   * 导出数据
   */
  async exportData(format: 'csv' | 'excel' | 'json', filters?: any): Promise<AnalyticsResponse> {
    try {
      const response = await this.api.post('/analytics/export', {
        format,
        filters
      }, {
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Data exported successfully'
      };
    } catch (error: any) {
      console.error('Failed to export data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export data'
      };
    }
  }
}

// 创建并导出服务实例
export const analyticsService = new AnalyticsService();
export default analyticsService;

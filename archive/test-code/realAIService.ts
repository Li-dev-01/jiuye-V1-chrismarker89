import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type {
  AISource,
  AIProvider,
  AISourceStatus,
  AISourceType,
  AISourceHealth,
  AISourceUsage,
  AISourceConfig,
  LoadBalancerConfig,
  TerminalAllocation,
  AIWaterManagementResponse
} from '../types/ai-water-management';

// API基础配置 - 使用现有的admin API服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

class RealAIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // 获取所有AI水源
  async getAISources(): Promise<AIWaterManagementResponse<AISource[]>> {
    try {
      const response = await this.api.get('/ai-sources');
      return response;
    } catch (error) {
      console.error('Failed to fetch AI sources:', error);
      throw error;
    }
  }

  // 获取单个AI水源详情
  async getAISource(id: string): Promise<AIWaterManagementResponse<AISource>> {
    try {
      const response = await this.api.get(`/ai-sources/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch AI source ${id}:`, error);
      throw error;
    }
  }

  // 创建新的AI水源
  async createAISource(config: Omit<AISourceConfig, 'id'>): Promise<AIWaterManagementResponse<AISource>> {
    try {
      const response = await this.api.post('/ai-sources', config);
      return response;
    } catch (error) {
      console.error('Failed to create AI source:', error);
      throw error;
    }
  }

  // 更新AI水源配置
  async updateAISource(id: string, config: Partial<AISourceConfig>): Promise<AIWaterManagementResponse<AISource>> {
    try {
      const response = await this.api.put(`/ai-sources/${id}`, config);
      return response;
    } catch (error) {
      console.error(`Failed to update AI source ${id}:`, error);
      throw error;
    }
  }

  // 删除AI水源
  async deleteAISource(id: string): Promise<AIWaterManagementResponse<void>> {
    try {
      const response = await this.api.delete(`/ai-sources/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete AI source ${id}:`, error);
      throw error;
    }
  }

  // 测试AI水源连接
  async testAISource(id: string): Promise<AIWaterManagementResponse<{ success: boolean; message: string; responseTime: number }>> {
    try {
      const response = await this.api.post(`/ai-sources/${id}/test`);
      return response;
    } catch (error) {
      console.error(`Failed to test AI source ${id}:`, error);
      throw error;
    }
  }

  // 启用/禁用AI水源
  async toggleAISource(id: string, enabled: boolean): Promise<AIWaterManagementResponse<AISource>> {
    try {
      const response = await this.api.patch(`/ai-sources/${id}/toggle`, { enabled });
      return response;
    } catch (error) {
      console.error(`Failed to toggle AI source ${id}:`, error);
      throw error;
    }
  }

  // 获取AI水源健康状态
  async getAISourceHealth(id: string): Promise<AIWaterManagementResponse<AISourceHealth>> {
    try {
      const response = await this.api.get(`/ai-sources/${id}/health`);
      return response;
    } catch (error) {
      console.error(`Failed to get AI source health ${id}:`, error);
      throw error;
    }
  }

  // 获取AI水源使用统计
  async getAISourceUsage(id: string, period: 'day' | 'week' | 'month' = 'day'): Promise<AIWaterManagementResponse<AISourceUsage>> {
    try {
      const response = await this.api.get(`/ai-sources/${id}/usage`, { params: { period } });
      return response;
    } catch (error) {
      console.error(`Failed to get AI source usage ${id}:`, error);
      throw error;
    }
  }

  // 获取负载均衡配置
  async getLoadBalancerConfig(): Promise<AIWaterManagementResponse<LoadBalancerConfig>> {
    try {
      const response = await this.api.get('/load-balancer/config');
      return response;
    } catch (error) {
      console.error('Failed to get load balancer config:', error);
      throw error;
    }
  }

  // 更新负载均衡配置
  async updateLoadBalancerConfig(config: Partial<LoadBalancerConfig>): Promise<AIWaterManagementResponse<LoadBalancerConfig>> {
    try {
      const response = await this.api.put('/load-balancer/config', config);
      return response;
    } catch (error) {
      console.error('Failed to update load balancer config:', error);
      throw error;
    }
  }

  // 获取终端分配配置
  async getTerminalAllocations(): Promise<AIWaterManagementResponse<TerminalAllocation[]>> {
    try {
      const response = await this.api.get('/terminal-allocations');
      return response;
    } catch (error) {
      console.error('Failed to get terminal allocations:', error);
      throw error;
    }
  }

  // 更新终端分配配置
  async updateTerminalAllocation(terminalId: string, allocation: Partial<TerminalAllocation>): Promise<AIWaterManagementResponse<TerminalAllocation>> {
    try {
      const response = await this.api.put(`/terminal-allocations/${terminalId}`, allocation);
      return response;
    } catch (error) {
      console.error(`Failed to update terminal allocation ${terminalId}:`, error);
      throw error;
    }
  }

  // 获取系统统计信息
  async getSystemStats(): Promise<AIWaterManagementResponse<{
    totalSources: number;
    activeSources: number;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
  }>> {
    try {
      const response = await this.api.get('/stats/system');
      return response;
    } catch (error) {
      console.error('Failed to get system stats:', error);
      throw error;
    }
  }

  // 获取成本分析
  async getCostAnalysis(period: 'day' | 'week' | 'month' = 'month'): Promise<AIWaterManagementResponse<{
    totalCost: number;
    breakdown: Record<AIProvider, number>;
    trend: Array<{ date: string; cost: number }>;
    projectedMonthlyCost: number;
  }>> {
    try {
      const response = await this.api.get('/stats/cost-analysis', { params: { period } });
      return response;
    } catch (error) {
      console.error('Failed to get cost analysis:', error);
      throw error;
    }
  }

  // 获取性能监控数据
  async getPerformanceMetrics(period: 'hour' | 'day' | 'week' = 'day'): Promise<AIWaterManagementResponse<{
    responseTime: Array<{ timestamp: string; value: number; provider: AIProvider }>;
    successRate: Array<{ timestamp: string; value: number; provider: AIProvider }>;
    requestVolume: Array<{ timestamp: string; value: number; provider: AIProvider }>;
  }>> {
    try {
      const response = await this.api.get('/stats/performance', { params: { period } });
      return response;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  // 刷新所有AI水源健康状态
  async refreshAllHealthChecks(): Promise<AIWaterManagementResponse<void>> {
    try {
      const response = await this.api.post('/ai-sources/refresh-health');
      return response;
    } catch (error) {
      console.error('Failed to refresh health checks:', error);
      throw error;
    }
  }

  // 导出配置
  async exportConfig(): Promise<AIWaterManagementResponse<{ config: string; timestamp: string }>> {
    try {
      const response = await this.api.get('/config/export');
      return response;
    } catch (error) {
      console.error('Failed to export config:', error);
      throw error;
    }
  }

  // 导入配置
  async importConfig(configData: string): Promise<AIWaterManagementResponse<{ imported: number; errors: string[] }>> {
    try {
      const response = await this.api.post('/config/import', { config: configData });
      return response;
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const realAIService = new RealAIService();
export default realAIService;

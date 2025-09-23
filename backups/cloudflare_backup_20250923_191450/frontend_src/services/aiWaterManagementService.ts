/**
 * AI水源管理服务
 * 
 * 提供AI水源管理的核心功能，包括水源配置、监控、负载均衡等
 */

import { apiClient } from './api';
import type {
  AISource,
  AISourceConfig,
  AISourceStatus,
  AIProvider,
  LoadBalancerConfig,
  CostControlConfig,
  TerminalAllocation,
  AIRequest,
  AIResponse,
  AIReviewAnalysis,
  SystemMetrics,
  AIWaterManagementResponse,
  AIWaterManagementEvent
} from '../types/ai-water-management';

class AIWaterManagementService {
  private baseUrl = '/api/ai-water-management';
  private eventListeners: Map<string, Function[]> = new Map();

  // ==================== 水源管理 ====================

  /**
   * 获取所有AI水源
   */
  async getAllSources(): Promise<AISource[]> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<AISource[]>>(
        `${this.baseUrl}/sources`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取AI水源失败');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('获取AI水源失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个AI水源详情
   */
  async getSource(sourceId: string): Promise<AISource> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<AISource>>(
        `${this.baseUrl}/sources/${sourceId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取AI水源详情失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取AI水源详情失败:', error);
      throw error;
    }
  }

  /**
   * 添加新的AI水源
   */
  async addSource(config: AISourceConfig): Promise<AISource> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<AISource>>(
        `${this.baseUrl}/sources`,
        config
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '添加AI水源失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('添加AI水源失败:', error);
      throw error;
    }
  }

  /**
   * 更新AI水源配置
   */
  async updateSource(sourceId: string, config: Partial<AISourceConfig>): Promise<AISource> {
    try {
      const response = await apiClient.put<AIWaterManagementResponse<AISource>>(
        `${this.baseUrl}/sources/${sourceId}`,
        config
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '更新AI水源失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('更新AI水源失败:', error);
      throw error;
    }
  }

  /**
   * 删除AI水源
   */
  async removeSource(sourceId: string): Promise<void> {
    try {
      const response = await apiClient.delete<AIWaterManagementResponse<void>>(
        `${this.baseUrl}/sources/${sourceId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '删除AI水源失败');
      }
    } catch (error) {
      console.error('删除AI水源失败:', error);
      throw error;
    }
  }

  /**
   * 测试AI水源连接
   */
  async testSourceConnection(sourceId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<any>>(
        `${this.baseUrl}/sources/${sourceId}/test`
      );
      
      return {
        success: response.data.success,
        responseTime: response.data.data?.responseTime || 0,
        error: response.data.error?.message
      };
    } catch (error) {
      console.error('测试AI水源连接失败:', error);
      return {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : '连接测试失败'
      };
    }
  }

  /**
   * 更新AI水源状态
   */
  async updateSourceStatus(sourceId: string, status: AISourceStatus): Promise<void> {
    try {
      const response = await apiClient.patch<AIWaterManagementResponse<void>>(
        `${this.baseUrl}/sources/${sourceId}/status`,
        { status }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '更新水源状态失败');
      }
    } catch (error) {
      console.error('更新水源状态失败:', error);
      throw error;
    }
  }

  // ==================== 负载均衡 ====================

  /**
   * 获取负载均衡配置
   */
  async getLoadBalancerConfig(): Promise<LoadBalancerConfig> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<LoadBalancerConfig>>(
        `${this.baseUrl}/load-balancer/config`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取负载均衡配置失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取负载均衡配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新负载均衡配置
   */
  async updateLoadBalancerConfig(config: Partial<LoadBalancerConfig>): Promise<LoadBalancerConfig> {
    try {
      const response = await apiClient.put<AIWaterManagementResponse<LoadBalancerConfig>>(
        `${this.baseUrl}/load-balancer/config`,
        config
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '更新负载均衡配置失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('更新负载均衡配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取最佳AI水源
   */
  async getBestSource(requirements: {
    contentType: string;
    qualityRequirement?: string;
    costPriority?: string;
    maxCostPerRequest?: number;
  }): Promise<AISource> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<AISource>>(
        `${this.baseUrl}/load-balancer/best-source`,
        requirements
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取最佳水源失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取最佳水源失败:', error);
      throw error;
    }
  }

  // ==================== 成本控制 ====================

  /**
   * 获取成本控制配置
   */
  async getCostControlConfig(): Promise<CostControlConfig> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<CostControlConfig>>(
        `${this.baseUrl}/cost-control/config`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取成本控制配置失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取成本控制配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新成本控制配置
   */
  async updateCostControlConfig(config: Partial<CostControlConfig>): Promise<CostControlConfig> {
    try {
      const response = await apiClient.put<AIWaterManagementResponse<CostControlConfig>>(
        `${this.baseUrl}/cost-control/config`,
        config
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '更新成本控制配置失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('更新成本控制配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取成本分析报告
   */
  async getCostAnalysis(period: string = 'last_7_days'): Promise<any> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<any>>(
        `${this.baseUrl}/cost-control/analysis?period=${period}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取成本分析失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取成本分析失败:', error);
      throw error;
    }
  }

  // ==================== AI请求处理 ====================

  /**
   * 发送AI请求
   */
  async sendAIRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<AIResponse>>(
        `${this.baseUrl}/request`,
        request
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'AI请求失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('AI请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取AI审核分析
   */
  async getReviewAnalysis(contentId: string, contentType: string): Promise<AIReviewAnalysis> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<AIReviewAnalysis>>(
        `${this.baseUrl}/review/analyze`,
        { contentId, contentType }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取AI审核分析失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取AI审核分析失败:', error);
      throw error;
    }
  }

  // ==================== 系统监控 ====================

  /**
   * 获取系统监控指标
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await apiClient.get<AIWaterManagementResponse<SystemMetrics>>(
        `${this.baseUrl}/monitor/metrics`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '获取系统指标失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('获取系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<any> {
    try {
      const response = await apiClient.post<AIWaterManagementResponse<any>>(
        `${this.baseUrl}/monitor/health-check`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || '健康检查失败');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  // ==================== 事件监听 ====================

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: AIWaterManagementEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }
}

// 导出单例实例
export const aiWaterManagementService = new AIWaterManagementService();
export default aiWaterManagementService;

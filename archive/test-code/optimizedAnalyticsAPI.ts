/**
 * 优化的数据分析API服务
 * 基于静态汇总表的高性能API
 */

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, API_ENDPOINTS, handleApiError, retryApiCall, apiCache, generateCacheKey, logApiCall } from '../config/apiConfig';
import type { 
  ApiResponse, 
  BasicStatistics, 
  DistributionData, 
  CrossAnalysisData, 
  EmploymentAnalysisData,
  AnalyticsFilters
} from '../config/apiConfig';

// 同步状态类型
export interface SyncTask {
  id: number;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  affectedRows?: number;
  errorMessage?: string;
}

export interface SyncStatus {
  tasks: SyncTask[];
  lastSync?: string;
  nextScheduledSync?: string;
}

// 性能指标类型
export interface SyncMetric {
  taskType: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  avgAffectedRows: number;
  totalRuns: number;
  successfulRuns: number;
  successRate: number;
}

export interface CacheMetric {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface PerformanceMetrics {
  syncMetrics: SyncMetric[];
  cacheMetrics: CacheMetric;
}

// 健康状态类型
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected' | 'not_configured';
  totalRecords: number;
  lastSync?: string;
  syncScheduler: 'running' | 'stopped';
}

/**
 * 优化的数据分析API服务类
 */
class OptimizedAnalyticsAPI {
  private client: AxiosInstance;
  
  constructor() {
    // 创建API客户端
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }
  
  /**
   * 获取基础统计数据（优化版）
   */
  async getBasicStatistics(filters?: AnalyticsFilters): Promise<BasicStatistics> {
    const cacheKey = generateCacheKey(API_ENDPOINTS.BASIC_STATS, filters);
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logApiCall(API_ENDPOINTS.BASIC_STATS, filters, { source: 'client-cache' });
      return cachedData;
    }
    
    try {
      // 构建查询参数
      const params: any = {};
      
      if (filters) {
        if (filters.educationLevel) {
          params.dimension = 'education_level';
          params.value = filters.educationLevel;
        }
        
        // 其他筛选条件...
        params.useCache = true;
      }
      
      const response = await retryApiCall(() => 
        this.client.get<ApiResponse<BasicStatistics>>(API_ENDPOINTS.BASIC_STATS, { params })
      );
      
      logApiCall(API_ENDPOINTS.BASIC_STATS, params, response);
      
      if (response.data.success) {
        // 缓存结果
        apiCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get basic statistics');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.BASIC_STATS, filters, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 获取分布数据（优化版）
   */
  async getDistributionData(questionId: string, filters?: AnalyticsFilters): Promise<DistributionData[]> {
    const cacheKey = generateCacheKey(`${API_ENDPOINTS.DISTRIBUTION}/${questionId}`, filters);
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logApiCall(`${API_ENDPOINTS.DISTRIBUTION}/${questionId}`, filters, { source: 'client-cache' });
      return cachedData;
    }
    
    try {
      // 构建查询参数
      const params: any = { questionId };
      
      if (filters) {
        if (filters.educationLevel) {
          params.dimension = 'education_level';
          params.value = filters.educationLevel;
        }
        
        // 其他筛选条件...
        params.useCache = true;
      }
      
      const response = await retryApiCall(() => 
        this.client.get<ApiResponse<DistributionData[]>>(API_ENDPOINTS.DISTRIBUTION, { params })
      );
      
      logApiCall(API_ENDPOINTS.DISTRIBUTION, params, response);
      
      if (response.data.success) {
        // 缓存结果
        apiCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get distribution data');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.DISTRIBUTION, { questionId, ...filters }, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 获取交叉分析数据（优化版）
   */
  async getCrossAnalysis(dimension1: string, dimension2: string, filters?: AnalyticsFilters): Promise<CrossAnalysisData[]> {
    const cacheKey = generateCacheKey(API_ENDPOINTS.CROSS_ANALYSIS, { dimension1, dimension2, ...filters });
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logApiCall(API_ENDPOINTS.CROSS_ANALYSIS, { dimension1, dimension2, ...filters }, { source: 'client-cache' });
      return cachedData;
    }
    
    try {
      // 构建查询参数
      const params: any = { dimension1, dimension2 };
      
      if (filters) {
        // 添加筛选条件...
        params.useCache = true;
      }
      
      const response = await retryApiCall(() => 
        this.client.get<ApiResponse<CrossAnalysisData[]>>(API_ENDPOINTS.CROSS_ANALYSIS, { params })
      );
      
      logApiCall(API_ENDPOINTS.CROSS_ANALYSIS, params, response);
      
      if (response.data.success) {
        // 缓存结果
        apiCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get cross analysis');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.CROSS_ANALYSIS, { dimension1, dimension2, ...filters }, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 获取就业分析数据（优化版）
   */
  async getEmploymentAnalysis(filters?: AnalyticsFilters): Promise<EmploymentAnalysisData[]> {
    const cacheKey = generateCacheKey(API_ENDPOINTS.EMPLOYMENT_ANALYSIS, filters);
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logApiCall(API_ENDPOINTS.EMPLOYMENT_ANALYSIS, filters, { source: 'client-cache' });
      return cachedData;
    }
    
    try {
      // 构建查询参数
      const params: any = {};
      
      if (filters) {
        // 添加筛选条件...
        params.useCache = true;
      }
      
      const response = await retryApiCall(() => 
        this.client.get<ApiResponse<EmploymentAnalysisData[]>>(API_ENDPOINTS.EMPLOYMENT_ANALYSIS, { params })
      );
      
      logApiCall(API_ENDPOINTS.EMPLOYMENT_ANALYSIS, params, response);
      
      if (response.data.success) {
        // 缓存结果
        apiCache.set(cacheKey, response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get employment analysis');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.EMPLOYMENT_ANALYSIS, filters, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 触发数据同步
   */
  async triggerSync(force: boolean = false): Promise<SyncTask[]> {
    try {
      const response = await this.client.post<ApiResponse<{ tasks: SyncTask[] }>>(
        API_ENDPOINTS.SYNC_TRIGGER,
        { force }
      );
      
      logApiCall(API_ENDPOINTS.SYNC_TRIGGER, { force }, response);
      
      if (response.data.success) {
        // 清除客户端缓存
        apiCache.clear();
        return response.data.data.tasks;
      } else {
        throw new Error(response.data.message || 'Failed to trigger sync');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.SYNC_TRIGGER, { force }, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const response = await this.client.get<ApiResponse<SyncStatus>>(API_ENDPOINTS.SYNC_STATUS);
      
      logApiCall(API_ENDPOINTS.SYNC_STATUS, {}, response);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get sync status');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.SYNC_STATUS, {}, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await this.client.get<ApiResponse<PerformanceMetrics>>(API_ENDPOINTS.PERFORMANCE_METRICS);
      
      logApiCall(API_ENDPOINTS.PERFORMANCE_METRICS, {}, response);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get performance metrics');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.PERFORMANCE_METRICS, {}, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 清除缓存
   */
  async invalidateCache(pattern?: string): Promise<void> {
    try {
      const response = await this.client.post<ApiResponse<void>>(
        API_ENDPOINTS.CACHE_INVALIDATE,
        { pattern }
      );
      
      logApiCall(API_ENDPOINTS.CACHE_INVALIDATE, { pattern }, response);
      
      if (response.data.success) {
        // 清除客户端缓存
        if (pattern) {
          apiCache.clear(pattern);
        } else {
          apiCache.clear();
        }
      } else {
        throw new Error(response.data.message || 'Failed to invalidate cache');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.CACHE_INVALIDATE, { pattern }, undefined, error);
      throw handleApiError(error);
    }
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await this.client.get<ApiResponse<HealthStatus>>(API_ENDPOINTS.HEALTH_CHECK);
      
      logApiCall(API_ENDPOINTS.HEALTH_CHECK, {}, response);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to check health');
      }
    } catch (error) {
      logApiCall(API_ENDPOINTS.HEALTH_CHECK, {}, undefined, error);
      throw handleApiError(error);
    }
  }
}

// 导出单例实例
export const optimizedAnalyticsAPI = new OptimizedAnalyticsAPI();
export default optimizedAnalyticsAPI;

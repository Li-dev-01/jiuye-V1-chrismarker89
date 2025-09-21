/**
 * API配置文件
 * 控制前端使用模拟数据还是真实API
 */

// 环境配置
export const API_CONFIG = {
  // API基础URL - 只使用真实API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev',
  
  // 超时设置
  TIMEOUT: 10000,
  
  // 缓存设置
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
  
  // 重试设置
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API端点配置
export const API_ENDPOINTS = {
  // 基础统计（优化版）
  BASIC_STATS: '/analytics/basic-stats',

  // 分布数据（优化版）
  DISTRIBUTION: '/analytics/distribution',

  // 交叉分析（优化版）
  CROSS_ANALYSIS: '/analytics/cross-analysis',

  // 就业分析（优化版）
  EMPLOYMENT_ANALYSIS: '/analytics/employment',

  // 专业分析
  MAJOR_ANALYSIS: '/analytics/majors',

  // 求职困难分析
  JOB_HUNTING: '/analytics/job-hunting',

  // 院校对比
  UNIVERSITY_COMPARISON: '/analytics/universities',

  // 地区分析
  LOCATION_ANALYSIS: '/analytics/locations',

  // 同步控制（新增）
  SYNC_TRIGGER: '/analytics/sync',
  SYNC_STATUS: '/analytics/sync/status',

  // 性能监控（新增）
  PERFORMANCE_METRICS: '/analytics/performance',

  // 缓存控制
  CACHE_INVALIDATE: '/analytics/cache/invalidate',

  // 健康检查（优化版）
  HEALTH_CHECK: '/analytics/health',

  // 分级审核系统（新增）
  AUDIT_LEVEL: '/api/audit/level',
  AUDIT_TEST: '/api/audit/test',
  AUDIT_STATS: '/api/audit/stats',
  AUDIT_HISTORY: '/api/audit/history',
};

// 数据源类型
export type DataSource = 'api';

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  source: DataSource;
}

// 错误响应类型
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 筛选参数类型
export interface AnalyticsFilters {
  educationLevel?: string;
  majorField?: string;
  graduationYear?: string;
  gender?: string;
  universityTier?: string;
  currentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleSize?: number;
}

// 基础统计数据类型
export interface BasicStatistics {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  avgCompletionTime: number;
  qualityScore: number;
  employmentRate: number;
  unemploymentRate: number;
  dataRange: {
    from: string;
    to: string;
  };
  lastUpdated: string;
}

// 分布数据类型
export interface DistributionData {
  label: string;
  value: number;
  percentage: number;
}

// 交叉分析数据类型
export interface CrossAnalysisData {
  category: string;
  total: number;
  breakdown: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

// 就业分析数据类型
export interface EmploymentAnalysisData {
  education: string;
  total: number;
  employed: number;
  unemployed: number;
  employmentRate: number;
}

// API客户端配置
export const createApiConfig = () => ({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // 请求拦截器
  transformRequest: [(data: any) => {
    // 添加时间戳防止缓存
    if (data && typeof data === 'object') {
      data._timestamp = Date.now();
    }
    return JSON.stringify(data);
  }],
  // 响应拦截器
  transformResponse: [(data: string) => {
    try {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        source: 'api' as DataSource,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse response',
          details: error,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }],
});

// 真实数据标识
export const REAL_DATA_IDENTIFIER = {
  source: 'api' as DataSource,
  timestamp: new Date().toISOString(),
  version: '1.0.0',
};

// 数据验证函数
export const validateApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    'data' in response &&
    typeof response.timestamp === 'string'
  );
};

// 错误处理函数
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // 服务器响应错误
    return {
      success: false,
      error: {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || error.message,
        details: error.response.data,
      },
      timestamp: new Date().toISOString(),
    };
  } else if (error.request) {
    // 网络错误
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
        details: error.request,
      },
      timestamp: new Date().toISOString(),
    };
  } else {
    // 其他错误
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        details: error,
      },
      timestamp: new Date().toISOString(),
    };
  }
};

// 重试函数
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxAttempts: number = API_CONFIG.RETRY_ATTEMPTS,
  delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// 缓存管理
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = API_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  clear(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const apiCache = new ApiCache();

// 生成缓存键
export const generateCacheKey = (endpoint: string, params?: any): string => {
  const paramString = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${endpoint}:${btoa(paramString)}`;
};

// 开发模式日志
export const logApiCall = (endpoint: string, params?: any, response?: any, error?: any): void => {
  if (import.meta.env.DEV) {
    const logData = {
      endpoint,
      params,
      response: response ? { ...response, data: '[DATA]' } : undefined,
      error: error ? error.message : undefined,
      timestamp: new Date().toISOString(),
      source: 'api',
    };
    
    console.group(`🔌 API Call: ${endpoint}`);
    console.table(logData);
    console.groupEnd();
  }
};

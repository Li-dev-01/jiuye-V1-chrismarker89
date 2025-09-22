import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';
import { apiVersionManager, type ApiVersion } from '../config/versionConfig';

// API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  version?: ApiVersion;
  timestamp?: string;
  deprecation?: {
    deprecated: boolean;
    deprecationDate?: string;
    sunsetDate?: string;
    recommendedVersion?: ApiVersion;
  };
}

// API基础配置 - 修复为实际的后端服务端口
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求时间戳
    config.headers['X-Request-Time'] = new Date().toISOString();

    // 添加API版本信息
    const currentVersion = apiVersionManager.getCurrentVersion();
    config.headers['X-API-Version'] = currentVersion;

    // 如果URL不包含版本信息，使用版本管理器生成正确的URL
    if (config.url && !config.url.includes('/api/v')) {
      const fullUrl = apiVersionManager.getApiEndpoint(config.url);
      const baseUrl = config.baseURL || API_BASE_URL;
      config.url = fullUrl.replace(baseUrl, '');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 检查版本弃用警告
    const deprecated = response.headers['x-api-deprecated'];
    const deprecationDate = response.headers['x-api-deprecation-date'];
    const sunsetDate = response.headers['x-api-sunset-date'];
    const recommendedVersion = response.headers['x-api-recommended-version'];

    if (deprecated === 'true') {
      console.warn('API版本已弃用:', {
        currentVersion: response.headers['x-api-version'],
        deprecationDate,
        sunsetDate,
        recommendedVersion
      });

      // 如果用户设置了显示警告，可以在这里触发通知
      const preferences = apiVersionManager.getPreferences();
      if (preferences.showVersionWarnings) {
        // 这里可以触发全局通知组件
        console.warn(`当前使用的API版本已弃用，建议升级到 ${recommendedVersion}`);
      }
    }

    return response;
  },
  (error) => {
    // 处理版本不兼容错误
    if (error.response?.status === 400 && error.response?.data?.error?.code === 'UNSUPPORTED_VERSION') {
      console.error('API版本不支持:', error.response.data.error);

      // 如果设置了自动回退，尝试回退到v1
      const preferences = apiVersionManager.getPreferences();
      if (preferences.fallbackToV1 && apiVersionManager.getCurrentVersion() !== 'v1') {
        console.log('自动回退到v1版本');
        apiVersionManager.setCurrentVersion('v1');
        // 可以选择重新发送请求
      }
    }

    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      ErrorHandler.redirectToLogin();
    }

    // 处理网络错误
    if (!error.response) {
      console.error('Network Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API请求封装
export class ApiService {
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }
}

// 导出axios实例供特殊情况使用
export { apiClient };
export default ApiService;

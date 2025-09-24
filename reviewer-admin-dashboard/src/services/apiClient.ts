import axios from 'axios';
import { message } from 'antd';
import { API_CONFIG, STORAGE_KEYS } from '../config/api';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证Token (简化版)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.REVIEWER_TOKEN);
    if (token) {
      // 简化：只使用标准的Bearer token
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API_CLIENT] Request with token: ${token.substring(0, 20)}...`);
    }
    return config;
  },
  (error) => {
    console.error('[API_CLIENT] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 错误处理 (简化版)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API_CLIENT] Response success: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API_CLIENT] Response error:', error);

    // 详细错误日志
    if (error.response) {
      console.error(`[API_CLIENT] Error status: ${error.response.status}`);
      console.error(`[API_CLIENT] Error data:`, error.response.data);
    }

    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);

      if (window.location.pathname !== '/login') {
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      message.error('权限不足，无法访问该资源');
    } else if (error.response?.status >= 500) {
      const errorMsg = error.response?.data?.message || '服务器内部错误';
      message.error(`服务器错误: ${errorMsg}`);
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接');
    } else {
      const errorMessage = error.response?.data?.message || error.message || '请求失败';
      message.error(`请求失败: ${errorMessage}`);
    }

    return Promise.reject(error);
  }
);

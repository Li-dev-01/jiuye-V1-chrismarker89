import axios from 'axios';
import { message } from 'antd';
import { API_CONFIG, STORAGE_KEYS } from '../config/api';

/**
 * 管理员专用API客户端
 * 确保使用正确的管理员token进行API调用
 */
export const adminApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 专门为管理员设计
adminApiClient.interceptors.request.use(
  (config) => {
    // 登录请求不需要token
    if (config.url?.includes('/login')) {
      console.log(`[ADMIN_API_CLIENT] Login request, skipping token`);
      return config;
    }

    // 优先使用管理员token
    const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const superAdminToken = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);

    const token = adminToken || superAdminToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[ADMIN_API_CLIENT] Request with admin token: ${token.substring(0, 20)}...`);
    } else {
      console.warn('[ADMIN_API_CLIENT] No admin token found');
    }
    return config;
  },
  (error) => {
    console.error('[ADMIN_API_CLIENT] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 管理员专用错误处理
adminApiClient.interceptors.response.use(
  (response) => {
    console.log(`[ADMIN_API_CLIENT] Response success: ${response.config.url}`);
    console.log(`[ADMIN_API_CLIENT] Response data:`, response.data);
    console.log(`[ADMIN_API_CLIENT] Response status:`, response.status);
    return response;
  },
  (error) => {
    console.error('[ADMIN_API_CLIENT] Response error:', error);

    if (error.response?.status === 401) {
      // 清除管理员相关的存储
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);

      // 重定向到管理员登录页
      const currentPath = window.location.pathname;
      let redirectPath = '/admin/login';
      
      if (currentPath.startsWith('/admin/super')) {
        redirectPath = '/admin/super-login';
      }

      if (window.location.pathname !== redirectPath) {
        message.error('管理员登录已过期，请重新登录');
        window.location.href = redirectPath;
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

export default adminApiClient;

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
      // 🔍 检查token格式 - 支持三种格式：
      // 1. Session格式（Google OAuth会话）: session_timestamp_randomhash
      // 2. UUID格式（会话ID）: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      // 3. JWT格式（旧的简单认证）: eyJ...
      const sessionRegex = /^session_[0-9]+_[a-z0-9]+$/;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const jwtRegex = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

      const isSession = sessionRegex.test(token);
      const isUUID = uuidRegex.test(token);
      const isJWT = jwtRegex.test(token);

      if (!isSession && !isUUID && !isJWT) {
        console.error('[ADMIN_API_CLIENT] ❌ 检测到无效token格式！');
        console.error('[ADMIN_API_CLIENT] Token:', token.substring(0, 50));
        console.error('[ADMIN_API_CLIENT] 期望格式: Session (session_xxx) / UUID / JWT');
        console.error('[ADMIN_API_CLIENT] 正在清除无效token并重定向到登录页...');

        // 清除所有token
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
        localStorage.removeItem('super_admin_user');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('reviewer_user');

        // 延迟跳转，确保用户能看到错误信息
        setTimeout(() => {
          window.location.href = '/unified-login';
        }, 2000);

        return Promise.reject(new Error('Token格式无效，请重新登录'));
      }

      config.headers.Authorization = `Bearer ${token}`;
      const tokenType = isSession ? 'Session (OAuth)' : isUUID ? 'UUID (Session)' : 'JWT (Simple Auth)';
      console.log(`[ADMIN_API_CLIENT] ✅ Request with ${tokenType} token: ${token.substring(0, 20)}...`);
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
    console.error('[ADMIN_API_CLIENT] Error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      currentPath: window.location.pathname
    });

    if (error.response?.status === 401) {
      // ⚠️ 检查是否是超级管理员专属 API
      const isSuperAdminAPI = error.config?.url?.includes('/api/super-admin/');

      if (isSuperAdminAPI) {
        // 检查当前token类型
        const token = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
        const isSimpleAuthToken = token?.startsWith('mgmt_token_');
        const isSessionToken = token?.match(/^session_[0-9]+_[a-z0-9]+$/);

        console.error('[ADMIN_API_CLIENT] ❌ Super admin API returned 401');
        console.error('[ADMIN_API_CLIENT] Token type:', {
          isSimpleAuth: isSimpleAuthToken,
          isSession: isSessionToken,
          tokenPreview: token?.substring(0, 20) + '...'
        });

        if (isSimpleAuthToken) {
          // Simple Auth token 不支持超级管理员API - 这是预期的
          console.warn('[ADMIN_API_CLIENT] Simple Auth token cannot access super admin API (expected)');
          message.warning('请使用Google OAuth登录以访问超级管理员功能');
          return Promise.reject(error);
        } else if (isSessionToken) {
          // Session token 应该可以访问超级管理员API
          // 如果返回401，说明会话过期或无效
          console.error('[ADMIN_API_CLIENT] ❌ This is UNEXPECTED - Session token should work!');
          console.error('[ADMIN_API_CLIENT] Possible reasons: session expired, database issue, or backend auth problem');
          message.error('会话已过期或无效，请重新登录');

          // 清除token并跳转
          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);

          setTimeout(() => {
            window.location.href = '/unified-login';
          }, 1500);

          return Promise.reject(error);
        } else {
          // 未知token格式
          console.error('[ADMIN_API_CLIENT] Unknown token format');
          message.error('Token格式无效，请重新登录');

          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);

          setTimeout(() => {
            window.location.href = '/unified-login';
          }, 1500);

          return Promise.reject(error);
        }
      }

      // 其他 401 错误才清除 token 和跳转
      console.error('[ADMIN_API_CLIENT] 401 Unauthorized - clearing tokens and redirecting');

      // 清除管理员相关的存储
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);

      // 重定向到管理员登录页
      const currentPath = window.location.pathname;
      let redirectPath = '/unified-login';

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

import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import { STORAGE_KEYS } from '../config/api';
import { User, LoginCredentials, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, userType?: 'reviewer' | 'admin' | 'super_admin') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.REVIEWER_TOKEN),
  isAuthenticated: false, // 初始化为false，需要通过checkAuth验证
  isLoading: false,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  login: async (credentials: LoginCredentials, userType: 'reviewer' | 'admin' | 'super_admin' = 'reviewer') => {
    console.log(`[AUTH_STORE] 🚀 LOGIN START: username=${credentials.username}, userType=${userType}`);
    set({ isLoading: true });
    try {
      console.log(`[AUTH_STORE] 📡 Sending login request to API...`);

      // 使用简化认证API
      const response = await apiClient.post<any>('/api/simple-auth/login', {
        username: credentials.username,
        password: credentials.password,
        userType: userType
      });

      console.log('[AUTH_STORE] 📥 Login API response:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        console.error('[AUTH_STORE] ❌ Login API returned failure:', response.data.message);
        throw new Error(response.data.message || '登录失败');
      }

      const { token, user } = response.data.data;
      console.log(`[AUTH_STORE] 📋 Extracted data - token length: ${token?.length}, user:`, JSON.stringify(user, null, 2));

      // 存储到本地存储
      localStorage.setItem(STORAGE_KEYS.REVIEWER_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      console.log(`[AUTH_STORE] 💾 Stored to localStorage - token: ${token?.substring(0, 20)}..., user: ${user.username}`);

      // 立即设置认证状态，不需要等待checkAuth
      const newState = {
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      };

      console.log(`[AUTH_STORE] 🔄 Setting auth state:`, JSON.stringify(newState, null, 2));
      set(newState);

      // 验证状态是否正确设置
      const currentState = get();
      console.log(`[AUTH_STORE] ✅ LOGIN COMPLETE - Final state:`, {
        isAuthenticated: currentState.isAuthenticated,
        user: currentState.user?.username,
        role: currentState.user?.role,
        userType: currentState.user?.userType,
        hasToken: !!currentState.token
      });
    } catch (error: any) {
      console.error('[AUTH_STORE] ❌ LOGIN FAILED:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // 清除本地存储
    localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: async () => {
    const token = get().token;
    console.log(`[AUTH_STORE] 🔍 CHECK_AUTH START - token exists: ${!!token}, token length: ${token?.length}`);

    if (!token) {
      console.log('[AUTH_STORE] ❌ No token found, setting unauthenticated');
      set({ isAuthenticated: false, user: null, isLoading: false });
      return false;
    }

    console.log(`[AUTH_STORE] 🔄 Setting loading state for auth check`);
    set({ isLoading: true });

    try {
      console.log('[AUTH_STORE] 📡 Sending auth verification request...');

      // 使用简化验证API，token通过Authorization header发送
      const response = await apiClient.post('/api/simple-auth/verify', {});

      console.log('[AUTH_STORE] 📥 Auth verification response:', JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.data.user) {
        const user = response.data.data.user;
        console.log(`[AUTH_STORE] 👤 Verified user:`, JSON.stringify(user, null, 2));

        // 更新用户信息
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
        const newState = { user, isAuthenticated: true, isLoading: false };

        console.log(`[AUTH_STORE] 🔄 Setting verified auth state:`, newState);
        set(newState);

        console.log(`[AUTH_STORE] ✅ CHECK_AUTH SUCCESS: ${user.username}, role: ${user.role}`);
        return true;
      } else {
        console.error('[AUTH_STORE] ❌ Invalid verification response:', response.data);
        throw new Error('验证响应无效');
      }
    } catch (error) {
      console.error('[AUTH_STORE] ❌ CHECK_AUTH FAILED:', error);
      console.log('[AUTH_STORE] 🧹 Clearing auth state due to verification failure');

      const clearState = { isAuthenticated: false, user: null, token: null, isLoading: false };
      set(clearState);
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);

      console.log('[AUTH_STORE] 🧹 Auth state cleared:', clearState);
      return false;
    }
  }
}));

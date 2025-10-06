/**
 * 普通管理员专用认证存储
 * 与超级管理员和审核员完全分离的认证系统
 */

import { create } from 'zustand';
import { adminApiClient } from '../services/adminApiClient';
import { STORAGE_KEYS } from '../config/api';
import { User, LoginCredentials } from '../types';

interface AdminAuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, userType: 'admin') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setAuthState: (state: { user: User; token: string; isAuthenticated: boolean; isLoading: boolean }) => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
  isAuthenticated: false,
  isLoading: false,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setAuthState: (state) => {
    console.log('[ADMIN_AUTH] 🔄 Setting auth state directly:', state);

    // 🔧 关键修复：保存到 localStorage
    if (state.token) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, state.token);
    }
    if (state.user) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER_INFO, JSON.stringify(state.user));
    }

    set(state);
    console.log('[ADMIN_AUTH] ✅ Auth state saved to localStorage');
  },

  login: async (credentials: LoginCredentials, userType: 'admin') => {
    console.log(`[ADMIN_AUTH] 🚀 LOGIN START: username=${credentials.username}, userType=${userType}`);
    set({ isLoading: true });
    
    try {
      console.log(`[ADMIN_AUTH] 📡 Sending admin login request...`);

      const response = await adminApiClient.post<any>('/api/simple-auth/login', {
        username: credentials.username,
        password: credentials.password,
        userType: userType
      });

      console.log('[ADMIN_AUTH] 📥 Full response object:', response);
      console.log('[ADMIN_AUTH] 📥 Response status:', response.status);
      console.log('[ADMIN_AUTH] 📥 Response headers:', response.headers);
      console.log('[ADMIN_AUTH] 📥 Login API response.data:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        console.error('[ADMIN_AUTH] ❌ Login API returned failure:', response.data.message);
        throw new Error(response.data.message || '管理员登录失败');
      }

      const { token, user } = response.data.data;
      console.log(`[ADMIN_AUTH] 📋 Extracted data - token length: ${token?.length}, user:`, JSON.stringify(user, null, 2));

      // 验证用户角色
      if (user.role !== 'admin' && user.userType !== 'admin') {
        console.error('[ADMIN_AUTH] ❌ User is not admin:', user);
        throw new Error('您没有管理员权限');
      }

      // 存储到管理员专用存储
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER_INFO, JSON.stringify(user));
      console.log(`[ADMIN_AUTH] 💾 Stored to admin localStorage`);

      // 清除其他角色的token（确保单一登录）
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_USER_INFO);

      const newState = {
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      };

      console.log(`[ADMIN_AUTH] 🔄 Setting admin auth state:`, JSON.stringify(newState, null, 2));
      set(newState);

      const currentState = get();
      console.log(`[ADMIN_AUTH] ✅ ADMIN LOGIN COMPLETE - Final state:`, {
        isAuthenticated: currentState.isAuthenticated,
        user: currentState.user?.username,
        role: currentState.user?.role,
        userType: currentState.user?.userType,
        hasToken: !!currentState.token
      });

      // 返回用户数据，供调用方直接使用
      return user;
    } catch (error: any) {
      console.error('[ADMIN_AUTH] ❌ ADMIN LOGIN FAILED:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    console.log('[ADMIN_AUTH] 🚪 Admin logout');
    
    // 清除管理员存储
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_INFO);
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: async () => {
    const token = get().token || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    console.log(`[ADMIN_AUTH] 🔍 CHECK_AUTH START - token exists: ${!!token}`);

    if (!token) {
      console.log('[ADMIN_AUTH] ❌ No admin token found');
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }

    // 确保token在状态中
    if (!get().token && token) {
      set({ token });
    }

    try {
      console.log('[ADMIN_AUTH] 📡 Verifying admin session with API...');

      // 使用新的会话验证API
      const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/auth/email-role/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: token
        })
      });

      const data = await response.json();
      console.log('[ADMIN_AUTH] 📥 Session verification response:', JSON.stringify(data, null, 2));

      if (data.success && data.data.user) {
        const userData = data.data.user;

        // 验证是否为管理员
        if (userData.role !== 'admin') {
          console.error('[ADMIN_AUTH] ❌ Session is not for admin role:', userData.role);
          get().logout();
          return false;
        }

        const user = {
          id: userData.accountId,
          accountId: userData.accountId,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          userType: userData.role,
          displayName: userData.displayName,
          permissions: userData.permissions,
          googleLinked: userData.googleLinked
        };

        localStorage.setItem(STORAGE_KEYS.ADMIN_USER_INFO, JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true
        });
        console.log('[ADMIN_AUTH] ✅ Admin session verified successfully');
        return true;
      } else {
        console.error('[ADMIN_AUTH] ❌ Invalid verification response:', data);
        get().logout();
        return false;
      }
    } catch (error) {
      console.error('[ADMIN_AUTH] ❌ Auth check failed:', error);
      get().logout();
      return false;
    }
  }
}));

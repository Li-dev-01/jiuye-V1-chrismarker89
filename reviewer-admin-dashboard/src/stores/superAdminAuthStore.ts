/**
 * 超级管理员专用认证存储
 * 与普通管理员和审核员完全分离的认证系统
 */

import { create } from 'zustand';
import { adminApiClient } from '../services/adminApiClient';
import { STORAGE_KEYS } from '../config/api';
import { User, LoginCredentials } from '../types';

interface SuperAdminAuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, userType: 'super_admin') => Promise<any>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setAuthState: (state: { user: User; token: string; isAuthenticated: boolean; isLoading: boolean }) => void;
}

export const useSuperAdminAuthStore = create<SuperAdminAuthState>((set, get) => {
  // 初始化时从 LocalStorage 恢复用户信息
  const storedToken = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
  const storedUserInfo = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);

  let initialUser: User | null = null;
  let initialIsAuthenticated = false;

  if (storedToken && storedUserInfo) {
    try {
      initialUser = JSON.parse(storedUserInfo);
      initialIsAuthenticated = true;
      console.log('[SUPER_ADMIN_AUTH] 🔄 Restored from localStorage:', {
        username: initialUser?.username,
        role: initialUser?.role,
        hasToken: !!storedToken
      });
    } catch (error) {
      console.error('[SUPER_ADMIN_AUTH] ❌ Failed to parse stored user info:', error);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);
    }
  }

  return {
  user: initialUser,
  token: storedToken,
  isAuthenticated: initialIsAuthenticated,
  isLoading: false,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setAuthState: (state) => {
    console.log('[SUPER_ADMIN_AUTH] 🔄 Setting auth state directly:', state);

    // 🔧 关键修复：保存到 localStorage
    if (state.token) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN, state.token);
    }
    if (state.user) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO, JSON.stringify(state.user));
    }

    set(state);
    console.log('[SUPER_ADMIN_AUTH] ✅ Auth state saved to localStorage');
  },

  login: async (credentials: LoginCredentials, userType: 'super_admin') => {
    console.log(`[SUPER_ADMIN_AUTH] 🚀 LOGIN START: username=${credentials.username}, userType=${userType}`);
    set({ isLoading: true });

    try {
      console.log(`[SUPER_ADMIN_AUTH] 📡 Sending super admin login request...`);

      const response = await adminApiClient.post<any>('/api/simple-auth/login', {
        username: credentials.username,
        password: credentials.password,
        userType: userType
      });

      console.log('[SUPER_ADMIN_AUTH] 📥 Login API response:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        console.error('[SUPER_ADMIN_AUTH] ❌ Login API returned failure:', response.data.message);
        throw new Error(response.data.message || '超级管理员登录失败');
      }

      const { token, user } = response.data.data;
      console.log(`[SUPER_ADMIN_AUTH] 📋 Extracted data - token length: ${token?.length}, user:`, JSON.stringify(user, null, 2));

      // 验证用户角色
      if (user.role !== 'super_admin' && user.userType !== 'super_admin') {
        console.error('[SUPER_ADMIN_AUTH] ❌ User is not super admin:', user);
        throw new Error('您没有超级管理员权限');
      }

      // 存储到超级管理员专用存储
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO, JSON.stringify(user));
      console.log(`[SUPER_ADMIN_AUTH] 💾 Stored to super admin localStorage`);

      // 清除其他角色的token（确保单一登录）
      localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.REVIEWER_USER_INFO);

      const newState = {
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      };

      console.log(`[SUPER_ADMIN_AUTH] 🔄 Setting super admin auth state:`, JSON.stringify(newState, null, 2));
      set(newState);

      const currentState = get();
      console.log(`[SUPER_ADMIN_AUTH] ✅ SUPER ADMIN LOGIN COMPLETE - Final state:`, {
        isAuthenticated: currentState.isAuthenticated,
        user: currentState.user?.username,
        role: currentState.user?.role,
        userType: (currentState.user as any)?.userType,
        hasToken: !!currentState.token
      });

      // 返回用户数据，供调用方直接使用
      return user;
    } catch (error: any) {
      console.error('[SUPER_ADMIN_AUTH] ❌ SUPER ADMIN LOGIN FAILED:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    console.log('[SUPER_ADMIN_AUTH] 🚪 Super admin logout');
    
    // 清除超级管理员存储
    localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: async () => {
    const token = get().token;
    console.log(`[SUPER_ADMIN_AUTH] 🔍 CHECK_AUTH START - token exists: ${!!token}`);

    if (!token) {
      console.log('[SUPER_ADMIN_AUTH] ❌ No super admin token found');
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      console.log('[SUPER_ADMIN_AUTH] 📡 Verifying super admin session with API...');

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
      console.log('[SUPER_ADMIN_AUTH] 📥 Session verification response:', JSON.stringify(data, null, 2));

      if (data.success && data.data.user) {
        const userData = data.data.user;

        // 验证是否为超级管理员
        if (userData.role !== 'super_admin') {
          console.error('[SUPER_ADMIN_AUTH] ❌ Session is not for super_admin role:', userData.role);
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

        localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO, JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true
        });
        console.log('[SUPER_ADMIN_AUTH] ✅ Super admin session verified successfully');
        return true;
      } else {
        console.error('[SUPER_ADMIN_AUTH] ❌ Invalid verification response:', data);
        get().logout();
        return false;
      }
    } catch (error) {
      console.error('[SUPER_ADMIN_AUTH] ❌ Auth check failed:', error);
      get().logout();
      return false;
    }
  }
}});

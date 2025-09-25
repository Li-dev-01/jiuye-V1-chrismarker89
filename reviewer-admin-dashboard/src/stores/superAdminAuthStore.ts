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
  login: (credentials: LoginCredentials, userType: 'super_admin') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}

export const useSuperAdminAuthStore = create<SuperAdminAuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN),
  isAuthenticated: false,
  isLoading: false,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
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
        userType: currentState.user?.userType,
        hasToken: !!currentState.token
      });
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
      // 从本地存储恢复用户信息
      const storedUserInfo = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO);
      if (storedUserInfo) {
        const user = JSON.parse(storedUserInfo);
        console.log('[SUPER_ADMIN_AUTH] 📋 Restored super admin user from localStorage:', user);
        
        // 验证是否为超级管理员
        if (user.role === 'super_admin' || user.userType === 'super_admin') {
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          });
          console.log('[SUPER_ADMIN_AUTH] ✅ Super admin auth restored successfully');
          return true;
        } else {
          console.error('[SUPER_ADMIN_AUTH] ❌ Stored user is not super admin:', user);
          get().logout();
          return false;
        }
      }

      // 如果没有本地用户信息，尝试从API验证
      console.log('[SUPER_ADMIN_AUTH] 📡 Verifying super admin token with API...');
      const response = await adminApiClient.get('/api/simple-auth/me');

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        
        // 验证是否为超级管理员
        if (user.role === 'super_admin' || user.userType === 'super_admin') {
          localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO, JSON.stringify(user));
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          });
          console.log('[SUPER_ADMIN_AUTH] ✅ Super admin token verified successfully');
          return true;
        } else {
          console.error('[SUPER_ADMIN_AUTH] ❌ API returned non-super-admin user:', user);
          get().logout();
          return false;
        }
      } else {
        console.error('[SUPER_ADMIN_AUTH] ❌ Token verification failed');
        get().logout();
        return false;
      }
    } catch (error) {
      console.error('[SUPER_ADMIN_AUTH] ❌ Auth check failed:', error);
      get().logout();
      return false;
    }
  }
}));

/**
 * 统一认证状态管理
 * 整合问卷系统和管理系统的认证状态
 */

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  UnifiedUser,
  UnifiedSession,
  UnifiedAuthResult,
  UnifiedCredentials,
  UnifiedPermission,
  UnifiedPermissionResult,
  UnifiedUserType,
  UserDomain
} from '../types/unified-auth';

import { canAccessRoute, hasPermission, getUserDomain } from '../types/unified-auth';
import { unifiedAuthService } from '../services/unifiedAuthService';

interface UnifiedAuthState {
  // 状态
  currentUser: UnifiedUser | null;
  currentSession: UnifiedSession | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 认证操作
  login: (credentials: UnifiedCredentials) => Promise<UnifiedAuthResult>;
  logout: () => void;
  
  // 问卷域专用方法
  loginAsAnonymous: () => Promise<boolean>;
  loginAsSemiAnonymous: (displayName: string) => Promise<boolean>;
  
  // 管理域专用方法
  loginAsManagement: (username: string, password: string, userType?: UnifiedUserType) => Promise<boolean>;

  // Google OAuth专用方法
  loginWithGoogle: (googleUser: any, domain: UserDomain, userType?: UnifiedUserType) => Promise<boolean>;
  
  // 权限检查
  hasPermission: (permission: UnifiedPermission) => boolean;
  hasUserType: (userType: UnifiedUserType) => boolean;
  canAccessRoute: (route: string) => UnifiedPermissionResult;
  isInDomain: (domain: UserDomain) => boolean;
  
  // 会话管理
  refreshSession: () => Promise<void>;
  checkSession: () => boolean;
  
  // 工具方法
  clearError: () => void;
  initializeAuth: () => void;
  getRedirectPath: () => string;
}

export const useUnifiedAuthStore = create<UnifiedAuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      currentSession: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 统一登录
      login: async (credentials: UnifiedCredentials): Promise<UnifiedAuthResult> => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await unifiedAuthService.login(credentials);
          
          if (result.success && result.user && result.session) {
            set({
              currentUser: result.user,
              currentSession: result.session,
              authToken: result.token || null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              isLoading: false,
              error: result.error || '登录失败'
            });
          }
          
          return result;
        } catch (error: any) {
          const errorMessage = error.message || '登录失败，请稍后再试';
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return {
            success: false,
            error: errorMessage
          };
        }
      },

      // 匿名用户登录
      loginAsAnonymous: async (): Promise<boolean> => {
        const result = await get().login({
          userType: UnifiedUserType.ANONYMOUS,
          domain: UserDomain.QUESTIONNAIRE,
          displayName: '匿名用户'
        });
        return result.success;
      },

      // 半匿名用户登录
      loginAsSemiAnonymous: async (displayName: string): Promise<boolean> => {
        const result = await get().login({
          userType: UnifiedUserType.SEMI_ANONYMOUS,
          domain: UserDomain.QUESTIONNAIRE,
          displayName
        });
        return result.success;
      },

      // 管理域登录
      loginAsManagement: async (username: string, password: string, userType?: UnifiedUserType): Promise<boolean> => {
        const result = await get().login({
          username,
          password,
          userType,
          domain: UserDomain.MANAGEMENT
        });
        return result.success;
      },

      // Google OAuth登录
      loginWithGoogle: async (googleUser: any, domain: UserDomain, userType?: UnifiedUserType): Promise<boolean> => {
        const result = await get().login({
          googleUser,
          domain,
          userType
        });
        return result.success;
      },

      // 登出
      logout: (): void => {
        unifiedAuthService.logout();
        set({
          currentUser: null,
          currentSession: null,
          authToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        console.log('用户已登出');
      },

      // 权限检查
      hasPermission: (permission: UnifiedPermission): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return hasPermission(currentUser, permission);
      },

      // 用户类型检查
      hasUserType: (userType: UnifiedUserType): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return currentUser.userType === userType;
      },

      // 路由访问检查
      canAccessRoute: (route: string): UnifiedPermissionResult => {
        const { currentUser } = get();
        return canAccessRoute(currentUser, route);
      },

      // 域检查
      isInDomain: (domain: UserDomain): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return currentUser.domain === domain;
      },

      // 刷新会话
      refreshSession: async (): Promise<void> => {
        try {
          const currentUser = unifiedAuthService.getCurrentUser();
          const currentSession = unifiedAuthService.getCurrentSession();
          const authToken = unifiedAuthService.getAuthToken();
          const isValid = unifiedAuthService.isSessionValid();

          if (currentUser && currentSession && isValid) {
            set({
              currentUser,
              currentSession,
              authToken,
              isAuthenticated: true
            });
          } else {
            // 会话无效，清除状态
            set({
              currentUser: null,
              currentSession: null,
              authToken: null,
              isAuthenticated: false
            });
            unifiedAuthService.logout();
          }
        } catch (error) {
          console.error('刷新会话失败:', error);
          set({
            currentUser: null,
            currentSession: null,
            authToken: null,
            isAuthenticated: false
          });
        }
      },

      // 检查会话
      checkSession: (): boolean => {
        return unifiedAuthService.isSessionValid();
      },

      // 清除错误
      clearError: (): void => {
        set({ error: null });
      },

      // 初始化认证状态
      initializeAuth: (): void => {
        const currentUser = unifiedAuthService.getCurrentUser();
        const currentSession = unifiedAuthService.getCurrentSession();
        const authToken = unifiedAuthService.getAuthToken();
        const isValid = unifiedAuthService.isSessionValid();

        if (currentUser && currentSession && isValid) {
          set({
            currentUser,
            currentSession,
            authToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          set({
            currentUser: null,
            currentSession: null,
            authToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          unifiedAuthService.logout();
        }
      },

      // 获取重定向路径
      getRedirectPath: (): string => {
        const { currentUser } = get();
        if (!currentUser) return '/';

        const domain = getUserDomain(currentUser.userType);
        
        switch (currentUser.userType) {
          case UnifiedUserType.SUPER_ADMIN:
          case UnifiedUserType.ADMIN:
            return '/admin/dashboard';
          case UnifiedUserType.REVIEWER:
            return '/reviewer/dashboard';
          case UnifiedUserType.REGISTERED:
          case UnifiedUserType.SEMI_ANONYMOUS:
          case UnifiedUserType.ANONYMOUS:
          default:
            return '/';
        }
      }
    }),
    {
      name: 'unified-auth-storage',
      partialize: (state) => ({
        // 持久化认证状态和用户信息
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        currentSession: state.currentSession,
        authToken: state.authToken
      })
    }
  )
);

// 导出便捷的hook
export const useUnifiedAuth = () => {
  const store = useUnifiedAuthStore();
  
  // 初始化时检查认证状态
  React.useEffect(() => {
    store.initializeAuth();
    store.refreshSession();
  }, []);
  
  return store;
};

// 导出权限检查hook
export const useUnifiedPermission = (permission: UnifiedPermission) => {
  const hasPermission = useUnifiedAuthStore(state => state.hasPermission);
  return hasPermission(permission);
};

// 导出域检查hook
export const useUserDomain = () => {
  const currentUser = useUnifiedAuthStore(state => state.currentUser);
  return currentUser ? getUserDomain(currentUser.userType) : null;
};

// 导出路由权限检查hook
export const useRoutePermission = (route: string) => {
  const canAccessRoute = useUnifiedAuthStore(state => state.canAccessRoute);
  return canAccessRoute(route);
};

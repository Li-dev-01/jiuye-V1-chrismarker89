/**
 * 安全认证状态钩子
 * 为悬浮组件提供安全的认证状态访问
 */

import { useState, useEffect, useCallback } from 'react';
import type { UniversalUser, UserSession } from '../types/uuid-system';
import { useUniversalAuthStore } from '../stores/universalAuthStore';

interface SafeAuthState {
  currentUser: UniversalUser | null;
  currentSession: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isStoreAvailable: boolean;
}

interface SafeAuthActions {
  login: (credentials: any) => Promise<boolean>;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * 安全认证状态钩子
 * 提供错误隔离和降级机制的认证状态访问
 */
export const useSafeAuth = (): SafeAuthState & SafeAuthActions => {
  const [state, setState] = useState<SafeAuthState>({
    currentUser: null,
    currentSession: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isStoreAvailable: false
  });

  // 直接在组件顶层调用 Hook，符合 React Hook 规则
  let authStore = null;
  let storeAvailable = false;

  try {
    authStore = useUniversalAuthStore();
    storeAvailable = true;
  } catch (error) {
    console.warn('useSafeAuth: Failed to access auth store:', error);
    storeAvailable = false;
  }

  /**
   * 安全地获取认证状态
   */
  const safeGetAuthState = useCallback(() => {
    try {
      if (!storeAvailable || !authStore) {
        return {
          currentUser: null,
          currentSession: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Auth store not available',
          isStoreAvailable: false
        };
      }

      return {
        currentUser: authStore.currentUser,
        currentSession: authStore.currentSession,
        isAuthenticated: authStore.isAuthenticated,
        isLoading: authStore.isLoading,
        error: authStore.error,
        isStoreAvailable: true
      };
    } catch (error) {
      console.warn('useSafeAuth: Failed to get auth state:', error);
      return {
        currentUser: null,
        currentSession: null,
        isAuthenticated: false,
        isLoading: false,
        error: `Auth state error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isStoreAvailable: false
      };
    }
  }, [storeAvailable, authStore]);

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const authState = safeGetAuthState();
        setState(authState);
      } catch (error) {
        console.error('useSafeAuth: Failed to initialize auth state:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isStoreAvailable: false
        }));
      }
    };

    initializeAuth();

    // 设置定期检查认证状态
    const interval = setInterval(() => {
      try {
        const authState = safeGetAuthState();
        setState(authState);
      } catch (error) {
        console.warn('useSafeAuth: Failed to update auth state:', error);
      }
    }, 5000); // 每5秒检查一次

    return () => clearInterval(interval);
  }, [safeGetAuthState]);

  /**
   * 安全登录
   */
  const login = useCallback(async (credentials: any): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!storeAvailable || !authStore) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Auth store not available',
          isStoreAvailable: false 
        }));
        return false;
      }

      // 根据凭据类型选择登录方法
      let result;
      if (credentials.type === 'semi-anonymous') {
        result = await authStore.loginSemiAnonymous(credentials.displayName);
      } else {
        // 其他登录类型
        result = await authStore.login(credentials);
      }

      if (result.success) {
        const newState = safeGetAuthState();
        setState(newState);
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Login failed' 
        }));
        return false;
      }
    } catch (error) {
      console.error('useSafeAuth: Login error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
      return false;
    }
  }, [storeAvailable, authStore, safeGetAuthState]);

  /**
   * 安全登出
   */
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!storeAvailable || !authStore) {
        // 即使store不可用，也清除本地状态
        setState({
          currentUser: null,
          currentSession: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isStoreAvailable: false
        });
        return true;
      }

      await authStore.logout();
      
      const newState = safeGetAuthState();
      setState(newState);
      return true;
    } catch (error) {
      console.error('useSafeAuth: Logout error:', error);
      // 即使出错，也清除本地状态
      setState({
        currentUser: null,
        currentSession: null,
        isAuthenticated: false,
        isLoading: false,
        error: `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isStoreAvailable: false
      });
      return true; // 登出总是返回成功
    }
  }, [storeAvailable, authStore, safeGetAuthState]);

  /**
   * 安全刷新用户信息
   */
  const refreshUser = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!storeAvailable || !authStore) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Auth store not available',
          isStoreAvailable: false 
        }));
        return false;
      }

      await authStore.refreshUser();
      
      const newState = safeGetAuthState();
      setState(newState);
      return true;
    } catch (error) {
      console.error('useSafeAuth: Refresh user error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
      return false;
    }
  }, [storeAvailable, authStore, safeGetAuthState]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    clearError
  };
};

/**
 * 简化版安全认证钩子
 * 只提供基本的认证状态，不包含操作方法
 */
export const useSafeAuthState = () => {
  const { 
    currentUser, 
    currentSession, 
    isAuthenticated, 
    isLoading, 
    error, 
    isStoreAvailable 
  } = useSafeAuth();

  return {
    currentUser,
    currentSession,
    isAuthenticated,
    isLoading,
    error,
    isStoreAvailable
  };
};

export default useSafeAuth;

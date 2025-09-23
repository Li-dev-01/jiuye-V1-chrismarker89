/**
 * 管理系统认证状态管理
 * 专门管理管理员和审核员的认证状态
 */

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  ManagementUser,
  ManagementSession,
  ManagementAuthResult,
  ManagementCredentials,
  ManagementPermission,
  ManagementPermissionResult,
  ManagementUserType
} from '../types/management-auth';

import { MANAGEMENT_ROUTE_PERMISSIONS } from '../types/management-auth';
import { managementAuthService } from '../services/managementAuthService';

// 辅助函数：根据角色获取权限
const getPermissionsByRole = (role: ManagementUserType): ManagementPermission[] => {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        'browse_content', 'project_management', 'create_reviewer', 'manage_users',
        'view_all_content', 'system_settings', 'view_all_stats', 'review_content',
        'approve_content', 'reject_content', 'delete_content', 'manage_system'
      ];
    case 'ADMIN':
      return [
        'browse_content', 'project_management', 'create_reviewer', 'manage_users',
        'view_all_content', 'system_settings', 'view_all_stats', 'review_content',
        'approve_content', 'reject_content'
      ];
    case 'REVIEWER':
      return [
        'browse_content', 'review_content', 'approve_content', 'reject_content'
      ];
    default:
      return ['browse_content'];
  }
};

interface ManagementAuthState {
  // 状态
  currentUser: ManagementUser | null;
  currentSession: ManagementSession | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 认证操作
  login: (credentials: ManagementCredentials) => Promise<boolean>;
  autoLogin: (params: { email: string; role: string }) => Promise<boolean>;
  setUser: (userData: any) => void;
  logout: () => void;
  
  // 权限检查
  hasPermission: (permission: ManagementPermission) => boolean;
  hasUserType: (userType: ManagementUserType) => boolean;
  isAdmin: () => boolean;
  isReviewer: () => boolean;
  canAccessRoute: (route: string) => ManagementPermissionResult;
  
  // 会话管理
  refreshSession: () => Promise<void>;
  checkSession: () => boolean;
  
  // 工具方法
  clearError: () => void;
  initializeAuth: () => void;
  getDefaultRedirectPath: () => string;
}

// 临时禁用持久化来测试问题
export const useManagementAuthStore = create<ManagementAuthState>()(
  // persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      currentSession: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 管理员/审核员登录
      login: async (credentials: ManagementCredentials): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          // 1. 直接调用服务层登录
          const result = await managementAuthService.login(credentials);
          console.log('🔍 管理员登录服务层调用完成', result);

          // 2. 检查登录是否成功
          if (!result.success) {
            set({
              isLoading: false,
              error: result.error || '登录失败'
            });
            return false;
          }

          // 3. 强制从服务层获取最新状态
          const currentUser = managementAuthService.getCurrentUser();
          const currentSession = managementAuthService.getCurrentSession();
          const authToken = managementAuthService.getAuthToken();
          const isValid = managementAuthService.isSessionValid();

          console.log('🔍 服务层状态检查:', {
            hasUser: !!currentUser,
            hasSession: !!currentSession,
            hasToken: !!authToken,
            isValid,
            userType: currentUser?.userType
          });

          // 4. 如果服务层有有效状态，强制更新Store
          if (currentUser && currentSession && isValid) {
            // 使用直接赋值而不是set方法
            const newState = {
              currentUser,
              currentSession,
              authToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            };

            // 直接设置状态
            set(newState);

            console.log('✅ 管理用户登录成功，状态已强制更新:', {
              userType: currentUser.userType,
              username: currentUser.username,
              isAuthenticated: true
            });

            // 验证状态是否正确设置
            setTimeout(() => {
              const currentState = get();
              console.log('⏱️ 延迟验证store状态:', {
                isAuthenticated: currentState.isAuthenticated,
                hasUser: !!currentState.currentUser,
                userType: currentState.currentUser?.userType
              });
            }, 100);

            return true;
          } else {
            console.log('❌ 服务层状态无效');
            set({
              isLoading: false,
              error: '登录状态设置失败'
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '登录过程中发生错误'
          });
          return false;
        }
      },

      // 设置用户（用于Google OAuth回调）
      setUser: (userData: any): void => {
        try {
          // 将后端返回的用户数据转换为ManagementUser格式
          const managementUser: ManagementUser = {
            id: userData.user?.uuid || userData.uuid || `google_${Date.now()}`,
            username: userData.user?.displayName || userData.displayName || 'Google用户',
            email: userData.user?.email || userData.email || '',
            userType: (userData.user?.role || userData.role || 'admin') as ManagementUserType,
            displayName: userData.user?.displayName || userData.displayName || 'Google用户',
            permissions: userData.user?.permissions || getPermissionsByRole(userData.user?.role || userData.role || 'admin'),
            profile: {
              language: 'zh-CN',
              timezone: 'Asia/Shanghai',
              notifications: {
                email: true,
                push: false,
                sms: false
              }
            },
            metadata: {
              loginMethod: 'google_oauth',
              source: 'google',
              createdAt: new Date().toISOString(),
              googleLinked: true
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };

          // 创建会话
          const managementSession: ManagementSession = {
            sessionId: `google_session_${Date.now()}`,
            userUuid: managementUser.id,
            userType: managementUser.userType,
            loginMethod: 'google_oauth',
            deviceInfo: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            },
            ipAddress: 'google_oauth',
            userAgent: navigator.userAgent,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8小时
          };

          const authToken = `google_token_${Date.now()}`;

          // 设置状态
          set({
            currentUser: managementUser,
            currentSession: managementSession,
            authToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          console.log('✅ Google OAuth用户设置成功:', {
            userType: managementUser.userType,
            email: managementUser.email,
            displayName: managementUser.displayName
          });

        } catch (error: any) {
          console.error('❌ 设置Google OAuth用户失败:', error);
          set({
            isLoading: false,
            error: error.message || '设置用户信息失败'
          });
        }
      },

      // 自动登录（来自多项目管理中心）
      autoLogin: async (params: { email: string; role: string }): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔄 开始自动登录:', params);

          // 创建临时用户对象
          const tempUser: ManagementUser = {
            id: `auto_${Date.now()}`,
            username: params.email.split('@')[0],
            email: params.email,
            userType: params.role as ManagementUserType,
            displayName: params.email,
            permissions: getPermissionsByRole(params.role as ManagementUserType),
            profile: {
              language: 'zh-CN',
              timezone: 'Asia/Shanghai',
              notifications: {
                email: true,
                push: false,
                sms: false
              }
            },
            metadata: {
              loginMethod: 'auto_login',
              source: 'multi_project_center',
              createdAt: new Date().toISOString()
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };

          // 创建临时会话
          const tempSession: ManagementSession = {
            sessionId: `auto_session_${Date.now()}`,
            userUuid: tempUser.id,
            userType: tempUser.userType,
            loginMethod: 'auto_login',
            deviceInfo: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            },
            ipAddress: 'auto_login',
            userAgent: navigator.userAgent,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8小时
          };

          const authToken = `auto_token_${Date.now()}`;

          // 设置状态
          set({
            currentUser: tempUser,
            currentSession: tempSession,
            authToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          console.log('✅ 自动登录成功:', {
            userType: tempUser.userType,
            email: tempUser.email
          });

          return true;
        } catch (error: any) {
          console.error('❌ 自动登录失败:', error);
          set({
            isLoading: false,
            error: error.message || '自动登录失败'
          });
          return false;
        }
      },

      // 登出
      logout: (): void => {
        managementAuthService.logout();
        set({
          currentUser: null,
          currentSession: null,
          authToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        console.log('管理用户已登出');
      },

      // 权限检查
      hasPermission: (permission: ManagementPermission): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return currentUser.permissions.includes(permission);
      },

      // 用户类型检查
      hasUserType: (userType: ManagementUserType): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return currentUser.userType === userType;
      },

      // 检查是否为管理员
      isAdmin: (): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.userType);
      },

      // 检查是否为审核员
      isReviewer: (): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;
        return ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.userType);
      },

      // 路由访问检查
      canAccessRoute: (route: string): ManagementPermissionResult => {
        const { currentUser } = get();
        
        // 获取路由所需权限
        const requiredPermissions = MANAGEMENT_ROUTE_PERMISSIONS[route];
        
        // 如果路由不需要权限，允许访问
        if (!requiredPermissions || requiredPermissions.length === 0) {
          return { hasPermission: true };
        }
        
        // 如果用户未登录
        if (!currentUser) {
          return {
            hasPermission: false,
            reason: '需要登录才能访问此页面',
            requiredPermissions
          };
        }
        
        // 检查是否具有任意一个所需权限
        const hasAccess = requiredPermissions.some(permission => 
          currentUser.permissions.includes(permission)
        );
        
        if (!hasAccess) {
          return {
            hasPermission: false,
            reason: '您没有访问此页面的权限',
            requiredPermissions
          };
        }
        
        return { hasPermission: true };
      },

      // 刷新会话
      refreshSession: async (): Promise<void> => {
        try {
          const success = await managementAuthService.refreshSession();
          if (success) {
            const currentUser = managementAuthService.getCurrentUser();
            const currentSession = managementAuthService.getCurrentSession();
            const authToken = managementAuthService.getAuthToken();
            
            set({
              currentUser,
              currentSession,
              authToken,
              isAuthenticated: !!currentUser && !!currentSession && managementAuthService.isSessionValid()
            });
          } else {
            // 刷新失败，清除认证状态
            set({
              currentUser: null,
              currentSession: null,
              authToken: null,
              isAuthenticated: false
            });
          }
        } catch (error) {
          console.error('刷新管理会话失败:', error);
          set({
            currentUser: null,
            currentSession: null,
            authToken: null,
            isAuthenticated: false
          });
        }
      },

      // 检查会话有效性
      checkSession: (): boolean => {
        return managementAuthService.isSessionValid();
      },

      // 清除错误
      clearError: (): void => {
        set({ error: null });
      },

      // 获取默认重定向路径
      getDefaultRedirectPath: (): string => {
        return managementAuthService.getDefaultRedirectPath();
      },

      // 初始化认证状态
      initializeAuth: (): void => {
        // 总是检查服务层状态并同步到 Store
        const currentUser = managementAuthService.getCurrentUser();
        const currentSession = managementAuthService.getCurrentSession();
        const authToken = managementAuthService.getAuthToken();
        const isValid = managementAuthService.isSessionValid();

        if (currentUser && currentSession && isValid) {
          // 强制同步到 Store
          set({
            currentUser,
            currentSession,
            authToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          // 清除认证状态
          set({
            currentUser: null,
            currentSession: null,
            authToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          managementAuthService.logout();
        }
      }
    })
    // {
    //   name: 'management-auth-storage',
    //   partialize: (state) => ({
    //     // 持久化认证状态和用户信息
    //     isAuthenticated: state.isAuthenticated,
    //     currentUser: state.currentUser,
    //     currentSession: state.currentSession,
    //     authToken: state.authToken
    //   })
    // }
  // )
);

// 导出便捷的hook
export const useManagementAuth = () => {
  const store = useManagementAuthStore();
  
  // 初始化时检查认证状态
  React.useEffect(() => {
    store.initializeAuth();
    store.refreshSession();
  }, []);
  
  return store;
};

// 导出权限检查hook
export const useManagementPermission = (permission: ManagementPermission) => {
  const hasPermission = useManagementAuthStore(state => state.hasPermission);
  return hasPermission(permission);
};

// 导出路由保护hook
export const useManagementRouteAccess = (route: string) => {
  const canAccessRoute = useManagementAuthStore(state => state.canAccessRoute);
  return canAccessRoute(route);
};

// 导出用户类型检查hook
export const useManagementUserType = () => {
  const currentUser = useManagementAuthStore(state => state.currentUser);
  const hasUserType = useManagementAuthStore(state => state.hasUserType);
  const isAdmin = useManagementAuthStore(state => state.isAdmin);
  const isReviewer = useManagementAuthStore(state => state.isReviewer);
  
  return {
    currentUser,
    hasUserType,
    isAdmin: isAdmin(),
    isReviewer: isReviewer(),
    userType: currentUser?.userType || null
  };
};

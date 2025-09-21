/**
 * 统一认证状态管理
 * 管理所有用户类型的认证状态和权限
 */

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UserType,
  Permission,
  ContentType,
  ContentStatus
} from '../types/uuid-system';
import type {
  UniversalUser,
  UserSession,
  AuthResult,
  IdentityConflictResult,
  UserCredentials
} from '../types/uuid-system';

import { uuidUserService } from '../services/uuidUserService';
import { generateDeviceFingerprint, generateABIdentityHash } from '../utils/crypto';
import { globalStateManager, GlobalUserState } from '../services/globalStateManager';

interface UniversalAuthState {
  // 状态
  currentUser: UniversalUser | null;
  currentSession: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 身份冲突处理
  identityConflict: IdentityConflictResult | null;
  pendingCredentials: UserCredentials | null;
  
  // 认证方法
  loginAdmin: (username: string, password: string, userType?: UserType) => Promise<boolean>;
  loginSemiAnonymous: (identityA: string, identityB: string) => Promise<boolean>;
  loginAnonymous: () => Promise<boolean>;
  logout: () => Promise<void>;
  
  // 身份切换
  switchIdentity: (credentials: UserCredentials) => Promise<boolean>;
  confirmIdentitySwitch: () => Promise<boolean>;
  cancelIdentitySwitch: () => void;
  
  // 权限检查
  hasPermission: (permission: Permission) => boolean;
  canAccessRoute: (route: string) => boolean;
  canAccessContent: (contentUserUuid: string) => boolean;
  
  // 内容管理
  linkContent: (contentType: ContentType, contentId: string, status?: ContentStatus) => Promise<void>;
  getUserContent: (userUuid?: string) => Promise<any[]>;
  
  // 工具方法
  clearError: () => void;
  refreshUser: () => Promise<void>;
  checkSession: () => boolean;
  initializeAuth: () => void;
  forceLogout: () => void;
}

export const useUniversalAuthStore = create<UniversalAuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      currentSession: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      identityConflict: null,
      pendingCredentials: null,

      // 管理员登录
      loginAdmin: async (username: string, password: string, userType: UserType = UserType.ADMIN): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const credentials: UserCredentials = {
            username,
            passwordHash: password // 在实际应用中应该先哈希
          };

          // 检查身份冲突
          const conflictResult = await uuidUserService.checkIdentityConflict(credentials);
          if (conflictResult.hasConflict && conflictResult.requiresConfirmation) {
            set({
              identityConflict: conflictResult,
              pendingCredentials: credentials,
              isLoading: false
            });
            return false;
          }

          const result = await uuidUserService.authenticateUser(credentials, userType);
          
          if (result.success && result.user && result.session) {
            set({
              currentUser: result.user,
              currentSession: result.session,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // 触发全局状态检测
            globalStateManager.detectCurrentState();

            console.log('登录成功，用户信息已保存:', {
              userType: result.user.userType,
              uuid: result.user.uuid,
              display_name: result.user.display_name
            });

            return true;
          } else {
            set({
              error: result.error || '登录失败',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录过程中发生错误',
            isLoading: false
          });
          return false;
        }
      },

      // 半匿名用户登录
      loginSemiAnonymous: async (identityA: string, identityB: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          // 检查身份冲突（使用当前会话）
          const currentSession = get().currentSession;
          if (currentSession) {
            // 这里可以调用API检查冲突，暂时简化处理
            const hasConflict = get().currentUser !== null;
            if (hasConflict) {
              set({
                identityConflict: {
                  hasConflict: true,
                  currentUserType: get().currentUser?.userType,
                  message: '检测到您已登录，切换到半匿名身份将清除当前登录状态。是否继续？',
                  requiresConfirmation: true
                },
                pendingCredentials: { identityAHash: identityA, identityBHash: identityB },
                isLoading: false
              });
              return false;
            }
          }

          const result = await uuidUserService.loginSemiAnonymous(identityA, identityB);

          if (result.success && result.user && result.session) {
            set({
              currentUser: result.user,
              currentSession: result.session,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({
              error: result.error || '登录失败',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录过程中发生错误',
            isLoading: false
          });
          return false;
        }
      },

      // 全匿名用户登录
      loginAnonymous: async (): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result = await uuidUserService.loginAnonymous();

          if (result.success && result.user && result.session) {
            set({
              currentUser: result.user,
              currentSession: result.session,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({
              error: result.error || '登录失败',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录过程中发生错误',
            isLoading: false
          });
          return false;
        }
      },

      // 登出
      logout: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          await uuidUserService.logout();
          set({
            currentUser: null,
            currentSession: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            identityConflict: null,
            pendingCredentials: null
          });

          // 触发全局状态检测
          globalStateManager.detectCurrentState();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登出失败',
            isLoading: false
          });
        }
      },

      // 身份切换
      switchIdentity: async (credentials: UserCredentials): Promise<boolean> => {
        const conflictResult = await uuidUserService.checkIdentityConflict(credentials);
        
        if (conflictResult.hasConflict && conflictResult.requiresConfirmation) {
          set({
            identityConflict: conflictResult,
            pendingCredentials: credentials
          });
          return false;
        }

        // 直接切换身份
        return await get().confirmIdentitySwitch();
      },

      // 确认身份切换
      confirmIdentitySwitch: async (): Promise<boolean> => {
        const { pendingCredentials } = get();
        if (!pendingCredentials) return false;

        set({ isLoading: true, error: null });

        try {
          // 先登出当前用户
          await uuidUserService.logout();

          // 使用新凭据登录
          const result = await uuidUserService.authenticateUser(pendingCredentials);
          
          if (result.success && result.user && result.session) {
            set({
              currentUser: result.user,
              currentSession: result.session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              identityConflict: null,
              pendingCredentials: null
            });
            return true;
          } else {
            set({
              error: result.error || '身份切换失败',
              isLoading: false,
              identityConflict: null,
              pendingCredentials: null
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '身份切换过程中发生错误',
            isLoading: false,
            identityConflict: null,
            pendingCredentials: null
          });
          return false;
        }
      },

      // 取消身份切换
      cancelIdentitySwitch: (): void => {
        set({
          identityConflict: null,
          pendingCredentials: null
        });
      },

      // 权限检查
      hasPermission: (permission: Permission): boolean => {
        return uuidUserService.hasPermission(permission);
      },

      // 路由访问检查
      canAccessRoute: (route: string): boolean => {
        const { currentUser } = get();
        if (!currentUser) return false;

        // 管理员和超级管理员可以访问所有路由
        if (currentUser.userType === UserType.ADMIN || currentUser.userType === UserType.SUPER_ADMIN) {
          return true;
        }

        // 审核员可以访问审核相关路由
        if (currentUser.userType === UserType.REVIEWER) {
          const reviewerRoutes = ['/reviewer', '/reviewer/dashboard', '/reviewer/questionnaires', '/reviewer/stories', '/reviewer/voices', '/reviewer/history'];
          return reviewerRoutes.some(r => route.startsWith(r));
        }

        // 其他用户类型的路由检查
        const publicRoutes = ['/', '/analytics', '/stories', '/voices', '/questionnaire'];
        return publicRoutes.some(r => route.startsWith(r));
      },

      // 内容访问检查
      canAccessContent: (contentUserUuid: string): boolean => {
        return uuidUserService.canAccessContent(contentUserUuid);
      },

      // 关联内容
      linkContent: async (
        contentType: ContentType,
        contentId: string,
        status: ContentStatus = ContentStatus.PENDING
      ): Promise<void> => {
        try {
          await uuidUserService.linkUserContent(contentType, contentId, status);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '关联内容失败'
          });
          throw error;
        }
      },

      // 获取用户内容
      getUserContent: async (userUuid?: string): Promise<any[]> => {
        try {
          return await uuidUserService.getUserContent(userUuid);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取用户内容失败'
          });
          throw error;
        }
      },

      // 清除错误
      clearError: (): void => {
        set({ error: null });
      },

      // 刷新用户信息
      refreshUser: async (): Promise<void> => {
        const currentUser = uuidUserService.getCurrentUser();
        const currentSession = uuidUserService.getCurrentSession();

        set({
          currentUser,
          currentSession,
          isAuthenticated: !!currentUser && !!currentSession
        });
      },

      // 初始化认证状态
      initializeAuth: (): void => {
        const state = get();

        // 如果持久化状态显示已认证，但没有用户信息，尝试从服务层恢复
        if (state.isAuthenticated && !state.currentUser) {
          const currentUser = uuidUserService.getCurrentUser();
          const currentSession = uuidUserService.getCurrentSession();

          if (currentUser && currentSession) {
            set({
              currentUser,
              currentSession,
              isAuthenticated: true
            });
          } else {
            // 如果无法恢复，清除认证状态
            set({
              currentUser: null,
              currentSession: null,
              isAuthenticated: false
            });
          }
        }
      },

      // 强制清除所有认证状态（调试用）
      forceLogout: (): void => {
        // 清除服务层状态
        uuidUserService.logout();

        // 清除存储状态
        set({
          currentUser: null,
          currentSession: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });

        // 清除本地存储（使用正确的键名）
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_user_session');
        localStorage.removeItem('universal-auth-storage');
      },

      // 检查会话
      checkSession: (): boolean => {
        const currentUser = uuidUserService.getCurrentUser();
        const currentSession = uuidUserService.getCurrentSession();
        const isValid = !!currentUser && !!currentSession;
        
        if (!isValid) {
          set({
            currentUser: null,
            currentSession: null,
            isAuthenticated: false
          });
        }
        
        return isValid;
      }
    }),
    {
      name: 'universal-auth-storage',
      partialize: (state) => ({
        // 持久化认证状态和用户信息
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        currentSession: state.currentSession
      })
    }
  )
);

// 导出便捷的hook
export const useAuth = () => {
  const store = useUniversalAuthStore();

  // 初始化时检查会话和认证状态
  React.useEffect(() => {
    store.initializeAuth();
    store.refreshUser();
  }, []);

  return store;
};

// 导出权限检查hook
export const usePermission = (permission: Permission) => {
  const hasPermission = useUniversalAuthStore(state => state.hasPermission);
  return hasPermission(permission);
};

// 导出路由保护hook
export const useRouteAccess = (route: string) => {
  const canAccessRoute = useUniversalAuthStore(state => state.canAccessRoute);
  return canAccessRoute(route);
};

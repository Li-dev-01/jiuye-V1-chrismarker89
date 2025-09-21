/**
 * UniversalAuthStore测试
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUniversalAuthStore } from '../universalAuthStore';

// Mock dependencies
vi.mock('../../services/uuidUserService', () => ({
  uuidUserService: {
    authenticateUser: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    isSessionValid: vi.fn()
  }
}));

vi.mock('../../services/globalStateManager', () => ({
  globalStateManager: {
    setUserState: vi.fn(),
    clearUserState: vi.fn(),
    getUserState: vi.fn()
  }
}));

vi.mock('../../utils/crypto', () => ({
  generateDeviceFingerprint: vi.fn().mockReturnValue('mock-fingerprint'),
  generateABIdentityHash: vi.fn().mockReturnValue('mock-hash')
}));

import { uuidUserService } from '../../services/uuidUserService';
import { globalStateManager } from '../../services/globalStateManager';

describe('UniversalAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除localStorage
    localStorage.clear();
    // 重置store状态
    useUniversalAuthStore.getState().forceLogout();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('初始状态', () => {
    test('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      expect(result.current.currentUser).toBeNull();
      expect(result.current.currentSession).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.identityConflict).toBeNull();
      expect(result.current.pendingCredentials).toBeNull();
    });
  });

  describe('用户认证', () => {
    test('成功认证应该更新状态', async () => {
      const mockUser = {
        uuid: 'test-uuid',
        userType: 'SEMI_ANONYMOUS' as const,
        permissions: ['SUBMIT_QUESTIONNAIRE'],
        createdAt: new Date().toISOString()
      };

      const mockSession = {
        sessionId: 'test-session',
        userId: 'test-uuid',
        expiresAt: Date.now() + 3600000,
        isValid: true
      };

      const mockCredentials = {
        phoneLastFour: '1234',
        birthday: '0315'
      };

      vi.mocked(uuidUserService.authenticateUser).mockResolvedValue({
        success: true,
        user: mockUser,
        session: mockSession,
        isNewUser: false
      });

      const { result } = renderHook(() => useUniversalAuthStore());

      await act(async () => {
        await result.current.authenticateUser(mockCredentials);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.currentSession).toEqual(mockSession);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('认证失败应该设置错误状态', async () => {
      const mockCredentials = {
        phoneLastFour: '1234',
        birthday: '0315'
      };

      vi.mocked(uuidUserService.authenticateUser).mockResolvedValue({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: '认证信息无效'
      });

      const { result } = renderHook(() => useUniversalAuthStore());

      await act(async () => {
        await result.current.authenticateUser(mockCredentials);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.error).toBe('认证信息无效');
      expect(result.current.isLoading).toBe(false);
    });

    test('身份冲突应该设置冲突状态', async () => {
      const mockCredentials = {
        phoneLastFour: '1234',
        birthday: '0315'
      };

      const mockConflict = {
        type: 'IDENTITY_CONFLICT' as const,
        existingUser: {
          uuid: 'existing-uuid',
          userType: 'SEMI_ANONYMOUS' as const,
          permissions: [],
          createdAt: new Date().toISOString()
        },
        conflictReason: 'DUPLICATE_IDENTITY',
        suggestedActions: ['MERGE_ACCOUNTS', 'CREATE_NEW']
      };

      vi.mocked(uuidUserService.authenticateUser).mockResolvedValue({
        success: false,
        error: 'IDENTITY_CONFLICT',
        identityConflict: mockConflict
      });

      const { result } = renderHook(() => useUniversalAuthStore());

      await act(async () => {
        await result.current.authenticateUser(mockCredentials);
      });

      expect(result.current.identityConflict).toEqual(mockConflict);
      expect(result.current.pendingCredentials).toEqual(mockCredentials);
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('认证过程中应该显示加载状态', async () => {
      const mockCredentials = {
        phoneLastFour: '1234',
        birthday: '0315'
      };

      let resolveAuth: (value: any) => void;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });

      vi.mocked(uuidUserService.authenticateUser).mockReturnValue(authPromise);

      const { result } = renderHook(() => useUniversalAuthStore());

      // 开始认证
      act(() => {
        result.current.authenticateUser(mockCredentials);
      });

      // 应该显示加载状态
      expect(result.current.isLoading).toBe(true);

      // 完成认证
      await act(async () => {
        resolveAuth!({
          success: true,
          user: {
            uuid: 'test-uuid',
            userType: 'SEMI_ANONYMOUS',
            permissions: [],
            createdAt: new Date().toISOString()
          },
          session: {
            sessionId: 'test-session',
            userId: 'test-uuid',
            expiresAt: Date.now() + 3600000,
            isValid: true
          }
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('权限检查', () => {
    test('应该正确检查用户权限', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置用户状态
      act(() => {
        result.current.currentUser = {
          uuid: 'test-uuid',
          userType: 'SEMI_ANONYMOUS',
          permissions: ['SUBMIT_QUESTIONNAIRE', 'VIEW_STATISTICS'],
          createdAt: new Date().toISOString()
        };
        result.current.isAuthenticated = true;
      });

      expect(result.current.hasPermission('SUBMIT_QUESTIONNAIRE')).toBe(true);
      expect(result.current.hasPermission('VIEW_STATISTICS')).toBe(true);
      expect(result.current.hasPermission('ADMIN_ACCESS')).toBe(false);
    });

    test('未认证用户应该没有权限', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      expect(result.current.hasPermission('SUBMIT_QUESTIONNAIRE')).toBe(false);
      expect(result.current.hasPermission('VIEW_STATISTICS')).toBe(false);
    });
  });

  describe('路由访问控制', () => {
    test('应该正确检查路由访问权限', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置管理员用户
      act(() => {
        result.current.currentUser = {
          uuid: 'admin-uuid',
          userType: 'ADMIN',
          permissions: ['ADMIN_ACCESS', 'CONTENT_REVIEW'],
          createdAt: new Date().toISOString()
        };
        result.current.isAuthenticated = true;
      });

      expect(result.current.canAccessRoute('/admin')).toBe(true);
      expect(result.current.canAccessRoute('/admin/users')).toBe(true);
      expect(result.current.canAccessRoute('/questionnaire')).toBe(true);
    });

    test('普通用户应该无法访问管理路由', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置普通用户
      act(() => {
        result.current.currentUser = {
          uuid: 'user-uuid',
          userType: 'SEMI_ANONYMOUS',
          permissions: ['SUBMIT_QUESTIONNAIRE'],
          createdAt: new Date().toISOString()
        };
        result.current.isAuthenticated = true;
      });

      expect(result.current.canAccessRoute('/admin')).toBe(false);
      expect(result.current.canAccessRoute('/questionnaire')).toBe(true);
    });
  });

  describe('登出功能', () => {
    test('应该正确清除用户状态', async () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 先设置认证状态
      act(() => {
        result.current.currentUser = {
          uuid: 'test-uuid',
          userType: 'SEMI_ANONYMOUS',
          permissions: ['SUBMIT_QUESTIONNAIRE'],
          createdAt: new Date().toISOString()
        };
        result.current.isAuthenticated = true;
      });

      // 执行登出
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.currentSession).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(uuidUserService.logout).toHaveBeenCalled();
      expect(globalStateManager.clearUserState).toHaveBeenCalled();
    });
  });

  describe('会话检查', () => {
    test('应该正确检查会话有效性', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置有效会话
      act(() => {
        result.current.currentSession = {
          sessionId: 'test-session',
          userId: 'test-uuid',
          expiresAt: Date.now() + 3600000,
          isValid: true
        };
      });

      vi.mocked(uuidUserService.isSessionValid).mockReturnValue(true);

      expect(result.current.checkSession()).toBe(true);
    });

    test('过期会话应该返回false', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置过期会话
      act(() => {
        result.current.currentSession = {
          sessionId: 'test-session',
          userId: 'test-uuid',
          expiresAt: Date.now() - 3600000, // 已过期
          isValid: false
        };
      });

      vi.mocked(uuidUserService.isSessionValid).mockReturnValue(false);

      expect(result.current.checkSession()).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('应该正确清除错误状态', () => {
      const { result } = renderHook(() => useUniversalAuthStore());

      // 设置错误状态
      act(() => {
        result.current.error = '测试错误';
      });

      // 清除错误
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

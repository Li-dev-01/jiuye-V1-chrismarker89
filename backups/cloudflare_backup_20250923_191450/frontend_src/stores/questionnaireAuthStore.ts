// 问卷认证Store
import { create } from 'zustand';
import { uuidApiService } from '../services/uuidApi';

interface User {
  id: string;
  userType: 'anonymous' | 'semi-anonymous' | 'registered';
  nickname?: string;
  identityHash?: string;
}

interface QuestionnaireAuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (userData: User) => void;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;

  // 快捷注册
  registerSemiAnonymous: (data: { nickname: string; userType: string }) => Promise<boolean>;

  // 半匿名登录
  loginWithAB: (data: { identityA: string; identityB: string; remember: boolean }) => Promise<boolean>;
  loginSemiAnonymous: (identityA: string, identityB: string) => Promise<boolean>;
}

export const useQuestionnaireAuthStore = create<QuestionnaireAuthState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  isLoading: false,
  error: null,

  login: (userData) => set({
    isAuthenticated: true,
    currentUser: userData,
    error: null
  }),

  logout: () => set({
    isAuthenticated: false,
    currentUser: null,
    error: null
  }),

  clearError: () => set({ error: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  registerSemiAnonymous: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // 模拟注册过程
      const userId = `semi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user: User = {
        id: userId,
        userType: 'semi-anonymous',
        nickname: data.nickname
      };

      set({
        isAuthenticated: true,
        currentUser: user,
        isLoading: false
      });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '注册失败',
        isLoading: false
      });
      return false;
    }
  },

  loginWithAB: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // 调用UUID API（问卷用户使用现有API）
      const response = await uuidApiService.authenticateSemiAnonymous(
        data.identityA,
        data.identityB,
        {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      );

      if (!response.success) {
        set({
          error: response.message || '登录失败',
          isLoading: false
        });
        return false;
      }

      const { user: apiUser, session } = response.data;

      // 转换为本地用户格式
      const user: User = {
        id: apiUser.uuid,
        userType: 'semi-anonymous',
        nickname: apiUser.display_name,
        identityHash: apiUser.identity_hash || ''
      };

      // 保存会话信息到localStorage
      if (data.remember) {
        localStorage.setItem('questionnaire_session', JSON.stringify(session));
      }

      set({
        isAuthenticated: true,
        currentUser: user,
        isLoading: false
      });

      return true;
    } catch (error) {
      console.error('A+B登录失败:', error);
      set({
        error: error instanceof Error ? error.message : '登录失败，请稍后重试',
        isLoading: false
      });
      return false;
    }
  },

  loginSemiAnonymous: async (identityA, identityB) => {
    return get().loginWithAB({ identityA, identityB, remember: false });
  }
}));

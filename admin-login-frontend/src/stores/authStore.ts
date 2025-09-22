import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'reviewer';
  projects: string[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  verifyEmail: (email: string) => Promise<{ success: boolean; role: string; email: string }>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      // 第一层：邮箱验证（临时关闭白名单，任意邮箱可通过）
      verifyEmail: async (email: string) => {
        try {
          console.log('🔍 验证邮箱:', email);

          const normalizedEmail = email.toLowerCase().trim();
          console.log('📧 标准化邮箱:', normalizedEmail);

          // 临时关闭白名单验证，任意邮箱都可以通过
          console.log('🔓 白名单验证已关闭，任意邮箱可通过');

          // 根据邮箱关键词智能分配角色
          let role = 'reviewer'; // 默认角色

          if (normalizedEmail.includes('superadmin') || normalizedEmail.includes('super')) {
            role = 'super_admin';
          } else if (normalizedEmail.includes('admin') || normalizedEmail.includes('manager')) {
            role = 'admin';
          } else if (normalizedEmail.includes('reviewer') || normalizedEmail.includes('review')) {
            role = 'reviewer';
          }

          console.log('🎭 自动分配角色:', role);

          return {
            success: true,
            role: role,
            email: email
          };
        } catch (error) {
          console.error('Email verification error:', error);
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        try {
          // 这里连接到您的后端API
          const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/uuid/auth/admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: email, password }),
          });

          if (!response.ok) {
            throw new Error('登录失败');
          }

          const data = await response.json();

          if (data.success) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              token: data.data.session?.sessionId || 'admin-session',
            });
          } else {
            throw new Error(data.message || '登录失败');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      loginWithGoogle: async (googleToken: string) => {
        try {
          const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/google-auth/management', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ googleUser: googleToken }),
          });

          if (!response.ok) {
            throw new Error('Google登录失败');
          }

          const data = await response.json();

          if (data.success) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              token: data.data.session?.sessionId || 'admin-session',
            });
          } else {
            throw new Error(data.message || 'Google登录失败');
          }
        } catch (error) {
          console.error('Google login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token验证失败');
          }

          const data = await response.json();
          set({
            user: data.user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Auth check error:', error);
          set({
            user: null,
            isAuthenticated: false,
            token: null,
          });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

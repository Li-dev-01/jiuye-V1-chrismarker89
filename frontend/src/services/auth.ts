import ApiService from './api';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  QuickRegisterRequest
} from '../types/auth';

// 定义API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

interface LoginResponse extends ApiResponse {
  data: {
    user: User;
    token: string;
  };
}

export class AuthService {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 模拟API调用，实际项目中应该调用真实API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            user: {
              id: '1',
              username: credentials.username,
              email: 'user@example.com',
              role: credentials.loginType || 'user',
              permissions: [],
              isAnonymous: false,
              createdAt: new Date().toISOString(),
              status: 'active'
            },
            token: 'mock_token_' + Date.now()
          },
          message: '登录成功'
        });
      }, 500);
    });
  }

  // 用户注册
  static async register(request: RegisterRequest): Promise<LoginResponse> {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            user: {
              id: Date.now().toString(),
              username: request.username,
              email: request.email,
              role: 'user',
              permissions: [],
              isAnonymous: request.isAnonymous || false,
              createdAt: new Date().toISOString(),
              status: 'active'
            },
            token: 'mock_token_' + Date.now()
          },
          message: '注册成功'
        });
      }, 500);
    });
  }

  // 验证令牌
  static async verifyToken(): Promise<ApiResponse<User>> {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInfo = this.getUserInfo();
        if (userInfo) {
          resolve({
            success: true,
            data: userInfo,
            message: '验证成功'
          });
        } else {
          throw new Error('Token invalid');
        }
      }, 200);
    });
  }

  // 刷新令牌
  static async refreshToken(): Promise<LoginResponse> {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInfo = this.getUserInfo();
        if (userInfo) {
          resolve({
            success: true,
            data: {
              user: userInfo,
              token: 'refreshed_token_' + Date.now()
            },
            message: '刷新成功'
          });
        } else {
          throw new Error('Refresh failed');
        }
      }, 200);
    });
  }

  // 用户登出
  static async logout(): Promise<void> {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      // 无论API调用是否成功，都清除本地存储
      this.clearAuthData();
    }
  }

  // 获取用户信息
  static async getProfile(): Promise<User> {
    // 模拟API调用
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userInfo = this.getUserInfo();
        if (userInfo) {
          resolve(userInfo);
        } else {
          reject(new Error('User not found'));
        }
      }, 200);
    });
  }

  // 更新用户信息
  static async updateProfile(userData: Partial<User>): Promise<User> {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentUser = this.getUserInfo();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          this.saveAuthData(this.getAuthToken() || '', updatedUser);
          resolve(updatedUser);
        }
      }, 200);
    });
  }

  // 检查token有效性
  static async validateToken(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  }

  // 本地存储操作
  static saveAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
  }

  static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static getUserInfo(): User | null {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  }

  static clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

/**
 * 统一用户创建服务
 * 支持3种用户创建模式的前端服务
 */

// 用户创建模式
export type UserCreationMode = 'manual' | 'google_oauth' | 'auto_register';

// 手动创建参数
export interface ManualCreationParams {
  username?: string;
  email: string;
  password: string;
  displayName?: string;
}

// Google OAuth创建参数
export interface GoogleOAuthCreationParams {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

// 自动注册参数
export interface AutoRegisterParams {
  preferredPrefix?: string; // 1-9
  identityA?: string;
  identityB?: string;
}

// 用户创建结果
export interface UserCreationResult {
  success: boolean;
  data?: {
    uuid: string;
    userId: string;
    displayName: string;
    email?: string;
    prefix?: string;
    creationMode: UserCreationMode;
    identityHash?: string;
  };
  error?: string;
  message?: string;
}

// 前缀使用统计
export interface PrefixUsageStats {
  prefix: string;
  usageCount: number;
  isAvailable: boolean;
  lastUsedAt?: string;
}

// 用户创建统计
export interface UserCreationStats {
  manual: number;
  google_oauth: number;
  auto_register: number;
}

class UnifiedUserCreationService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005/api';

  /**
   * 手动创建用户
   */
  async createManualUser(params: ManualCreationParams): Promise<UserCreationResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user-creation/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Unknown Error',
          message: result.message || '手动创建用户失败'
        };
      }

      return result;
    } catch (error) {
      console.error('手动创建用户失败:', error);
      return {
        success: false,
        error: 'Network Error',
        message: '网络请求失败'
      };
    }
  }

  /**
   * Google OAuth创建用户
   */
  async createGoogleOAuthUser(params: GoogleOAuthCreationParams): Promise<UserCreationResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user-creation/google-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Unknown Error',
          message: result.message || 'Google OAuth用户创建失败'
        };
      }

      return result;
    } catch (error) {
      console.error('Google OAuth用户创建失败:', error);
      return {
        success: false,
        error: 'Network Error',
        message: '网络请求失败'
      };
    }
  }

  /**
   * 自动注册用户（1-9前缀）
   */
  async createAutoRegisterUser(params: AutoRegisterParams = {}): Promise<UserCreationResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user-creation/auto-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Unknown Error',
          message: result.message || '自动注册用户创建失败'
        };
      }

      return result;
    } catch (error) {
      console.error('自动注册用户创建失败:', error);
      return {
        success: false,
        error: 'Network Error',
        message: '网络请求失败'
      };
    }
  }

  /**
   * 获取前缀使用统计
   */
  async getPrefixUsageStats(): Promise<{ success: boolean; data?: PrefixUsageStats[]; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user-creation/prefix-stats`);
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Unknown Error'
        };
      }

      return result;
    } catch (error) {
      console.error('获取前缀统计失败:', error);
      return {
        success: false,
        error: 'Network Error'
      };
    }
  }

  /**
   * 获取用户创建统计
   */
  async getUserCreationStats(): Promise<{ success: boolean; data?: UserCreationStats; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user-creation/creation-stats`);
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Unknown Error'
        };
      }

      return result;
    } catch (error) {
      console.error('获取用户创建统计失败:', error);
      return {
        success: false,
        error: 'Network Error'
      };
    }
  }

  /**
   * 验证用户名可用性
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; message?: string }> {
    try {
      // 基础格式验证
      if (username.length < 3) {
        return { available: false, message: '用户名至少需要3个字符' };
      }

      if (username.length > 50) {
        return { available: false, message: '用户名不能超过50个字符' };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { available: false, message: '用户名只能包含字母、数字和下划线' };
      }

      // TODO: 调用后端API检查用户名是否已存在
      // 这里可以添加实时检查逻辑

      return { available: true };
    } catch (error) {
      console.error('检查用户名可用性失败:', error);
      return { available: false, message: '检查失败，请重试' };
    }
  }

  /**
   * 验证邮箱格式
   */
  validateEmail(email: string): { valid: boolean; message?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { valid: false, message: '邮箱地址为必填项' };
    }

    if (!emailRegex.test(email)) {
      return { valid: false, message: '邮箱格式不正确' };
    }

    return { valid: true };
  }

  /**
   * 验证密码强度
   */
  validatePassword(password: string): { valid: boolean; message?: string; strength?: 'weak' | 'medium' | 'strong' } {
    if (!password) {
      return { valid: false, message: '密码为必填项' };
    }

    if (password.length < 6) {
      return { valid: false, message: '密码至少需要6个字符' };
    }

    if (password.length > 128) {
      return { valid: false, message: '密码不能超过128个字符' };
    }

    // 计算密码强度
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    return { valid: true, strength };
  }

  /**
   * 获取推荐的前缀
   */
  async getRecommendedPrefix(): Promise<string | null> {
    try {
      const statsResult = await this.getPrefixUsageStats();
      
      if (!statsResult.success || !statsResult.data) {
        return null;
      }

      // 找到使用次数最少的可用前缀
      const availablePrefixes = statsResult.data.filter(p => p.isAvailable);
      if (availablePrefixes.length === 0) {
        return null;
      }

      availablePrefixes.sort((a, b) => a.usageCount - b.usageCount);
      return availablePrefixes[0].prefix;
    } catch (error) {
      console.error('获取推荐前缀失败:', error);
      return null;
    }
  }

  /**
   * 生成显示名称建议
   */
  generateDisplayNameSuggestions(input: string): string[] {
    const suggestions: string[] = [];
    
    if (input) {
      // 基于输入生成建议
      suggestions.push(input);
      suggestions.push(`${input}_用户`);
      suggestions.push(`${input}${Math.floor(Math.random() * 1000)}`);
    }

    // 添加一些通用建议
    const genericSuggestions = [
      '匿名用户',
      '问卷参与者',
      '调研用户',
      `用户${Math.floor(Math.random() * 10000)}`
    ];

    suggestions.push(...genericSuggestions);

    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 5);
  }
}

// 导出单例实例
export const unifiedUserCreationService = new UnifiedUserCreationService();
export default unifiedUserCreationService;

/**
 * 统一认证服务
 * 整合问卷系统和管理系统的认证逻辑
 */

import type {
  UnifiedUser,
  UnifiedSession,
  UnifiedAuthResult,
  UnifiedCredentials,
  UnifiedUserType,
  UserDomain,
  UnifiedPermission
} from '../types/unified-auth';

import {
  UNIFIED_USER_PERMISSIONS,
  getUserDomain,
  hasPermission,
  canAccessRoute
} from '../types/unified-auth';

import { generateDeviceFingerprint } from '../utils/crypto';

// 预设账号配置
const PRESET_ACCOUNTS = {
  // 问卷域账号（半匿名用户）
  questionnaire: [
    // 半匿名用户通过displayName创建
  ],
  
  // 管理域账号
  management: [
    {
      id: 'admin1',
      username: 'admin1',
      password: 'admin123',
      userType: UnifiedUserType.ADMIN,
      displayName: '系统管理员',
      email: 'admin@system.local',
      redirectPath: '/admin/dashboard'
    },
    {
      id: 'superadmin',
      username: 'superadmin',
      password: 'super123',
      userType: UnifiedUserType.SUPER_ADMIN,
      displayName: '超级管理员',
      email: 'superadmin@system.local',
      redirectPath: '/admin/dashboard'
    },
    {
      id: 'reviewer1',
      username: 'reviewerA',
      password: 'admin123',
      userType: UnifiedUserType.REVIEWER,
      displayName: '审核员A',
      email: 'reviewera@system.local',
      redirectPath: '/reviewer/dashboard'
    },
    {
      id: 'reviewer2',
      username: 'reviewerB',
      password: 'admin123',
      userType: UnifiedUserType.REVIEWER,
      displayName: '审核员B',
      email: 'reviewerb@system.local',
      redirectPath: '/reviewer/dashboard'
    }
  ]
};

class UnifiedAuthService {
  private readonly STORAGE_KEYS = {
    CURRENT_USER: 'unified_current_user',
    CURRENT_SESSION: 'unified_current_session',
    AUTH_TOKEN: 'unified_auth_token'
  };

  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    'https://employment-survey-api-prod.chrismarker89.workers.dev';

  /**
   * 统一登录方法
   */
  async login(credentials: UnifiedCredentials): Promise<UnifiedAuthResult> {
    try {
      const { domain, userType, googleUser } = credentials;

      // Google OAuth登录
      if (googleUser) {
        return await this.loginWithGoogle(credentials);
      }

      // 根据域选择登录方式
      if (domain === UserDomain.QUESTIONNAIRE ||
          [UnifiedUserType.ANONYMOUS, UnifiedUserType.SEMI_ANONYMOUS, UnifiedUserType.REGISTERED].includes(userType!)) {
        return await this.loginQuestionnaireDomain(credentials);
      } else if (domain === UserDomain.MANAGEMENT ||
                 [UnifiedUserType.REVIEWER, UnifiedUserType.ADMIN, UnifiedUserType.SUPER_ADMIN].includes(userType!)) {
        return await this.loginManagementDomain(credentials);
      }

      return {
        success: false,
        error: '未知的用户域或用户类型'
      };

    } catch (error: any) {
      console.error('统一登录失败:', error);
      return {
        success: false,
        error: error.message || '登录失败，请稍后再试'
      };
    }
  }

  /**
   * Google OAuth登录
   */
  private async loginWithGoogle(credentials: UnifiedCredentials): Promise<UnifiedAuthResult> {
    const { googleUser, domain, userType } = credentials;

    if (!googleUser || !googleUser.email) {
      return {
        success: false,
        error: 'Google用户信息不完整'
      };
    }

    try {
      // 根据域调用不同的Google OAuth API
      if (domain === UserDomain.MANAGEMENT ||
          [UnifiedUserType.REVIEWER, UnifiedUserType.ADMIN, UnifiedUserType.SUPER_ADMIN].includes(userType!)) {
        return await this.loginGoogleManagement(googleUser);
      } else {
        return await this.loginGoogleQuestionnaire(googleUser);
      }
    } catch (error: any) {
      console.error('Google OAuth登录失败:', error);
      return {
        success: false,
        error: error.message || 'Google登录失败'
      };
    }
  }

  /**
   * Google OAuth问卷域登录
   */
  private async loginGoogleQuestionnaire(googleUser: any): Promise<UnifiedAuthResult> {
    const response = await fetch(`${this.API_BASE_URL}/api/auth/google/questionnaire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser,
        userType: 'semi_anonymous'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google问卷登录失败');
    }

    const result = await response.json();
    if (result.success) {
      // 转换为统一格式
      const user = await this.convertToUnifiedUser(result.data, UserDomain.QUESTIONNAIRE);
      const session = await this.createSession(user);
      const token = this.generateToken(user, session);

      this.saveAuthData(user, session, token);

      return {
        success: true,
        user,
        session,
        token,
        message: 'Google登录成功',
        redirectPath: '/'
      };
    }

    throw new Error(result.error || 'Google问卷登录失败');
  }

  /**
   * Google OAuth管理域登录
   */
  private async loginGoogleManagement(googleUser: any): Promise<UnifiedAuthResult> {
    const response = await fetch(`${this.API_BASE_URL}/api/auth/google/management`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser,
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '您的邮箱不在管理员白名单中');
    }

    const result = await response.json();
    if (result.success) {
      // 转换为统一格式
      const user = await this.convertToUnifiedUser(result.data, UserDomain.MANAGEMENT);
      const session = await this.createSession(user);
      const token = this.generateToken(user, session);

      this.saveAuthData(user, session, token);

      return {
        success: true,
        user,
        session,
        token,
        message: 'Google管理员登录成功',
        redirectPath: user.userType === UnifiedUserType.REVIEWER ? '/reviewer/dashboard' : '/admin/dashboard'
      };
    }

    throw new Error(result.error || 'Google管理员登录失败');
  }

  /**
   * 问卷域登录（半匿名用户）
   */
  private async loginQuestionnaireDomain(credentials: UnifiedCredentials): Promise<UnifiedAuthResult> {
    const { displayName, userType = UnifiedUserType.SEMI_ANONYMOUS } = credentials;

    if (!displayName) {
      return {
        success: false,
        error: '请输入显示名称'
      };
    }

    // 创建半匿名用户
    const user = await this.createQuestionnaireUser(displayName, userType);
    const session = await this.createSession(user);
    const token = this.generateToken(user, session);

    // 保存到本地存储
    this.saveAuthData(user, session, token);

    return {
      success: true,
      user,
      session,
      token,
      message: '登录成功',
      redirectPath: '/'
    };
  }

  /**
   * 管理域登录（用户名密码）
   */
  private async loginManagementDomain(credentials: UnifiedCredentials): Promise<UnifiedAuthResult> {
    const { username, password, userType } = credentials;

    if (!username || !password) {
      return {
        success: false,
        error: '用户名和密码不能为空'
      };
    }

    // 检查预设账号
    const presetAccount = PRESET_ACCOUNTS.management.find(account =>
      account.username === username && account.password === password
    );

    if (presetAccount) {
      const user = await this.createManagementUser(presetAccount);
      const session = await this.createSession(user);
      const token = this.generateToken(user, session);

      // 保存到本地存储
      this.saveAuthData(user, session, token);

      return {
        success: true,
        user,
        session,
        token,
        message: '登录成功',
        redirectPath: presetAccount.redirectPath
      };
    }

    // 尝试远程API验证
    try {
      const apiResult = await this.callManagementAPI(username, password, userType);
      if (apiResult.success) {
        return apiResult;
      }
    } catch (error) {
      console.warn('远程API调用失败，使用本地验证:', error);
    }

    return {
      success: false,
      error: '用户名或密码错误'
    };
  }

  /**
   * 转换API响应为统一用户格式
   */
  private async convertToUnifiedUser(apiData: any, domain: UserDomain): Promise<UnifiedUser> {
    // 映射用户类型
    let userType: UnifiedUserType;
    switch (apiData.role || apiData.user_type) {
      case 'super_admin':
        userType = UnifiedUserType.SUPER_ADMIN;
        break;
      case 'admin':
        userType = UnifiedUserType.ADMIN;
        break;
      case 'reviewer':
        userType = UnifiedUserType.REVIEWER;
        break;
      case 'registered':
        userType = UnifiedUserType.REGISTERED;
        break;
      case 'semi_anonymous':
        userType = UnifiedUserType.SEMI_ANONYMOUS;
        break;
      case 'anonymous':
      default:
        userType = UnifiedUserType.ANONYMOUS;
    }

    const permissions = UNIFIED_USER_PERMISSIONS[userType] || [];

    return {
      id: apiData.id || apiData.uuid,
      uuid: apiData.uuid || apiData.id,
      username: apiData.username,
      email: apiData.email,
      displayName: apiData.display_name || apiData.displayName,
      userType,
      domain,
      permissions,
      profile: {
        displayName: apiData.display_name || apiData.displayName,
        avatar: apiData.picture,
        preferences: apiData.profile ? JSON.parse(apiData.profile) : {}
      },
      metadata: {
        loginCount: apiData.metadata?.loginCount || 1,
        lastLoginTime: new Date().toISOString(),
        createdAt: apiData.created_at || new Date().toISOString(),
        updatedAt: apiData.updated_at || new Date().toISOString()
      }
    };
  }

  /**
   * 创建问卷域用户
   */
  private async createQuestionnaireUser(displayName: string, userType: UnifiedUserType): Promise<UnifiedUser> {
    const uuid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const domain = UserDomain.QUESTIONNAIRE;
    const permissions = UNIFIED_USER_PERMISSIONS[userType] || [];

    return {
      id: uuid,
      uuid,
      displayName,
      userType,
      domain,
      permissions,
      profile: {
        displayName,
        preferences: {}
      },
      metadata: {
        loginCount: 1,
        lastLoginTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 创建管理域用户
   */
  private async createManagementUser(account: any): Promise<UnifiedUser> {
    const domain = UserDomain.MANAGEMENT;
    const permissions = UNIFIED_USER_PERMISSIONS[account.userType] || [];

    return {
      id: account.id,
      uuid: `mgmt_${account.id}_${Date.now()}`,
      username: account.username,
      email: account.email,
      displayName: account.displayName,
      userType: account.userType,
      domain,
      permissions,
      profile: {
        displayName: account.displayName,
        preferences: {}
      },
      metadata: {
        loginCount: 1,
        lastLoginTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 创建会话
   */
  private async createSession(user: UnifiedUser): Promise<UnifiedSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deviceFingerprint = await generateDeviceFingerprint();
    
    // 会话有效期：问卷域24小时，管理域8小时
    const sessionDuration = user.domain === UserDomain.QUESTIONNAIRE ? 
      24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;

    return {
      sessionId,
      userId: user.id,
      userUuid: user.uuid,
      userType: user.userType,
      domain: user.domain,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      ipAddress: 'localhost',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + sessionDuration).toISOString(),
      isActive: true,
      permissions: user.permissions
    };
  }

  /**
   * 生成Token
   */
  private generateToken(user: UnifiedUser, session: UnifiedSession): string {
    const prefix = user.domain === UserDomain.MANAGEMENT ? 'mgmt_token' : 'quest_token';
    const userTypeStr = user.userType === UnifiedUserType.SUPER_ADMIN ? 'SUPER_ADMIN' : user.userType;
    return `${prefix}_${userTypeStr}_${Date.now()}`;
  }

  /**
   * 保存认证数据
   */
  private saveAuthData(user: UnifiedUser, session: UnifiedSession, token: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
      
      // 为了兼容性，同时保存到旧的存储key
      if (user.domain === UserDomain.MANAGEMENT) {
        localStorage.setItem('management_current_user', JSON.stringify(user));
        localStorage.setItem('management_current_session', JSON.stringify(session));
        localStorage.setItem('management_auth_token', token);
      }
    } catch (error) {
      console.error('保存认证数据失败:', error);
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): UnifiedUser | null {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): UnifiedSession | null {
    try {
      const sessionJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      console.error('获取当前会话失败:', error);
      return null;
    }
  }

  /**
   * 获取认证Token
   */
  getAuthToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    return session.isActive && now < expiresAt;
  }

  /**
   * 登出
   */
  logout(): void {
    // 清除统一存储
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    
    // 清除兼容性存储
    localStorage.removeItem('management_current_user');
    localStorage.removeItem('management_current_session');
    localStorage.removeItem('management_auth_token');
    localStorage.removeItem('questionnaire_user');
    localStorage.removeItem('questionnaire_session');
    
    console.log('用户已登出');
  }

  /**
   * 调用管理API
   */
  private async callManagementAPI(username: string, password: string, userType?: UnifiedUserType): Promise<UnifiedAuthResult> {
    const response = await fetch(`${this.API_BASE_URL}/api/auth/admin/generate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      // 转换API响应为统一格式
      const user = await this.createManagementUser({
        id: data.data.username,
        username: data.data.username,
        userType: data.data.userType || userType || UnifiedUserType.ADMIN,
        displayName: data.data.username,
        email: `${data.data.username}@system.local`
      });
      
      const session = await this.createSession(user);
      const token = data.data.token;
      
      this.saveAuthData(user, session, token);
      
      return {
        success: true,
        user,
        session,
        token,
        message: '登录成功'
      };
    }

    throw new Error(data.error || '登录失败');
  }
}

// 导出单例
export const unifiedAuthService = new UnifiedAuthService();

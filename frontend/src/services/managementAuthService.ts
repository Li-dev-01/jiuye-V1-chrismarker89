/**
 * 管理系统认证服务
 * 专门处理管理员和审核员的用户名+密码认证
 */

import type {
  ManagementUser,
  ManagementSession,
  ManagementAuthResult,
  ManagementCredentials,
  ManagementUserType,
  ManagementPermission
} from '../types/management-auth';

import {
  MANAGEMENT_USER_PERMISSIONS,
  MANAGEMENT_SESSION_CONFIG,
  PRESET_MANAGEMENT_ACCOUNTS,
  MANAGEMENT_DEFAULT_REDIRECTS
} from '../types/management-auth';

import { generateDeviceFingerprint } from '../utils/crypto';

class ManagementAuthService {
  private readonly STORAGE_KEYS = {
    CURRENT_USER: 'management_current_user',
    CURRENT_SESSION: 'management_current_session',
    AUTH_TOKEN: 'management_auth_token'
  };

  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

  /**
   * 管理员/审核员登录
   */
  async login(credentials: ManagementCredentials): Promise<ManagementAuthResult> {
    try {
      const { username, password, userType, remember = false } = credentials;

      // 验证输入
      if (!username || !password) {
        return {
          success: false,
          error: '用户名和密码不能为空'
        };
      }

      // 首先检查预置账号
      const presetAccount = PRESET_MANAGEMENT_ACCOUNTS.find(account =>
        account.username === username && account.password === password
      );

      if (presetAccount) {
        console.log(`✅ 预置账号登录成功: ${presetAccount.name} (${presetAccount.userType})`);
        const result = await this.createLocalSession(presetAccount, remember);
        console.log('本地会话创建结果:', result);
        return result;
      }

      // 尝试调用远程API
      try {
        const response = await this.callRemoteAPI(username, password, userType);
        if (response.success) {
          return await this.createSessionFromAPI(response, remember);
        }
      } catch (apiError) {
        console.warn('远程API调用失败，使用本地验证:', apiError);
      }

      return {
        success: false,
        error: '用户名或密码错误'
      };

    } catch (error: any) {
      console.error('管理员登录失败:', error);
      return {
        success: false,
        error: error.message || '登录失败，请稍后再试'
      };
    }
  }

  /**
   * 创建本地会话
   */
  private async createLocalSession(
    account: typeof PRESET_MANAGEMENT_ACCOUNTS[0],
    remember: boolean
  ): Promise<ManagementAuthResult> {
    const deviceFingerprint = await generateDeviceFingerprint();
    const sessionId = `mgmt_session_${account.id}_${Date.now()}`;
    const uuid = `mgmt_uuid_${account.id}`;

    const user: ManagementUser = {
      id: account.id,
      uuid,
      username: account.username,
      userType: account.userType,
      display_name: account.name,
      permissions: MANAGEMENT_USER_PERMISSIONS[account.userType],
      specialties: account.specialties,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      status: 'active',
      metadata: {
        loginCount: 1,
        lastLoginIP: 'localhost',
        failedLoginAttempts: 0
      }
    };

    const session: ManagementSession = {
      sessionId,
      userId: account.id,
      userUuid: uuid,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      ipAddress: 'localhost',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + MANAGEMENT_SESSION_CONFIG[account.userType]).toISOString(),
      isActive: true,
      permissions: MANAGEMENT_USER_PERMISSIONS[account.userType]
    };

    // 生成简单的token
    const token = `mgmt_token_${account.userType}_${Date.now()}`;

    // 保存到本地存储
    this.saveCurrentUser(user);
    this.saveCurrentSession(session);
    this.saveAuthToken(token);

    return {
      success: true,
      user,
      session,
      token,
      message: '登录成功'
    };
  }

  /**
   * 从API响应创建会话
   */
  private async createSessionFromAPI(apiResponse: any, remember: boolean): Promise<ManagementAuthResult> {
    const { user, session, token } = apiResponse.data;
    
    this.saveCurrentUser(user);
    this.saveCurrentSession(session);
    this.saveAuthToken(token);

    return {
      success: true,
      user,
      session,
      token,
      message: '登录成功'
    };
  }

  /**
   * 调用远程API
   */
  private async callRemoteAPI(
    username: string, 
    password: string, 
    userType?: ManagementUserType
  ): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        password, 
        userType: userType || 'ADMIN',
        deviceInfo: {
          fingerprint: await generateDeviceFingerprint(),
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): ManagementUser | null {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('获取当前管理用户失败:', error);
      return null;
    }
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): ManagementSession | null {
    try {
      const sessionJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      console.error('获取当前管理会话失败:', error);
      return null;
    }
  }

  /**
   * 获取认证令牌
   */
  getAuthToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * 检查会话有效性
   */
  isSessionValid(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    return session.isActive && now < expiresAt;
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission: ManagementPermission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.permissions.includes(permission);
  }

  /**
   * 检查用户类型
   */
  hasUserType(userType: ManagementUserType): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.userType === userType;
  }

  /**
   * 检查是否为管理员（包括超级管理员）
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return ['ADMIN', 'SUPER_ADMIN'].includes(user.userType);
  }

  /**
   * 检查是否为审核员（包括管理员）
   */
  isReviewer(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.userType);
  }

  /**
   * 获取用户默认重定向路径
   */
  getDefaultRedirectPath(): string {
    const user = this.getCurrentUser();
    if (!user) return '/admin/login';

    return MANAGEMENT_DEFAULT_REDIRECTS[user.userType] || '/admin';
  }

  /**
   * 刷新会话
   */
  async refreshSession(): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) return false;

      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.saveCurrentUser(result.data.user);
          this.saveCurrentSession(result.data.session);
          this.saveAuthToken(result.data.token);
          return true;
        }
      }
    } catch (error) {
      console.error('刷新会话失败:', error);
    }

    return false;
  }

  /**
   * 登出
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
    console.log('管理用户已登出');
  }

  /**
   * 保存当前用户
   */
  private saveCurrentUser(user: ManagementUser): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  /**
   * 保存当前会话
   */
  private saveCurrentSession(session: ManagementSession): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  /**
   * 保存认证令牌
   */
  private saveAuthToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * 获取预置账号列表（用于快速登录）
   */
  getPresetAccounts() {
    return PRESET_MANAGEMENT_ACCOUNTS.map(account => ({
      id: account.id,
      username: account.username,
      name: account.name,
      userType: account.userType,
      redirectPath: account.redirectPath
    }));
  }
}

// 导出单例实例
export const managementAuthService = new ManagementAuthService();

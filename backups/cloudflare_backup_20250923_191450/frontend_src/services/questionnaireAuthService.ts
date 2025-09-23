/**
 * 问卷系统认证服务
 * 专门处理半匿名用户的A+B认证
 */

import type {
  QuestionnaireUser,
  QuestionnaireSession,
  QuestionnaireAuthResult,
  ABCredentials,
  QuestionnaireUserType,
  QuestionnairePermission
} from '../types/questionnaire-auth';

import {
  QUESTIONNAIRE_USER_PERMISSIONS,
  QUESTIONNAIRE_SESSION_CONFIG,
  AB_VALIDATION_RULES,
  TEST_AB_COMBINATIONS
} from '../types/questionnaire-auth';

import { generateDeviceFingerprint, generateABIdentityHash } from '../utils/crypto';
import { api } from './api';

class QuestionnaireAuthService {
  private readonly STORAGE_KEYS = {
    CURRENT_USER: 'questionnaire_current_user',
    CURRENT_SESSION: 'questionnaire_current_session',
    REMEMBER_IDENTITY: 'questionnaire_remember_identity'
  };

  private readonly API_BASE_URL = 'http://localhost:8787/api/uuid';

  /**
   * A+B 身份验证登录
   */
  async loginWithAB(credentials: ABCredentials): Promise<QuestionnaireAuthResult> {
    try {
      const { identityA, identityB, remember = false } = credentials;

      // 验证A+B格式
      const validation = this.validateABFormat(identityA, identityB);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // 首先检查本地测试组合
      const testUser = TEST_AB_COMBINATIONS.find(combo =>
        combo.a === identityA && combo.b === identityB
      );

      if (testUser) {
        console.log(`✅ 本地测试组合验证成功: ${testUser.name}`);
        return await this.createLocalSession(identityA, identityB, testUser.name, remember);
      }

      // 尝试调用远程API
      try {
        const response = await this.callRemoteAPI(identityA, identityB);
        if (response.success) {
          return await this.createSessionFromAPI(response, remember);
        }
      } catch (apiError) {
        console.warn('远程API调用失败，使用本地验证:', apiError);
      }

      return {
        success: false,
        error: 'A+B组合验证失败，请检查输入是否正确'
      };

    } catch (error: any) {
      console.error('A+B身份验证失败:', error);
      return {
        success: false,
        error: error.message || '身份验证失败，请稍后再试'
      };
    }
  }

  /**
   * 创建本地会话
   */
  private async createLocalSession(
    identityA: string, 
    identityB: string, 
    displayName: string,
    remember: boolean
  ): Promise<QuestionnaireAuthResult> {
    const uuid = await this.generateUUID(identityA, identityB);
    const deviceFingerprint = await generateDeviceFingerprint();
    const identityHash = generateABIdentityHash(identityA, identityB);

    const user: QuestionnaireUser = {
      uuid,
      userType: 'SEMI_ANONYMOUS',
      display_name: displayName,
      identityHash,
      permissions: QUESTIONNAIRE_USER_PERMISSIONS.SEMI_ANONYMOUS,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      metadata: {
        deviceFingerprint,
        loginCount: 1,
        lastLoginIP: 'localhost'
      }
    };

    const session: QuestionnaireSession = {
      sessionId: `session_${uuid}_${Date.now()}`,
      userUuid: uuid,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      ipAddress: 'localhost',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + QUESTIONNAIRE_SESSION_CONFIG.SEMI_ANONYMOUS).toISOString(),
      isActive: true
    };

    // 保存到本地存储
    this.saveCurrentUser(user);
    this.saveCurrentSession(session);

    // 记住身份（如果用户选择）
    if (remember) {
      this.saveRememberedIdentity(identityA, identityB);
    }

    return {
      success: true,
      user,
      session,
      message: '登录成功'
    };
  }

  /**
   * 从API响应创建会话
   */
  private async createSessionFromAPI(apiResponse: any, remember: boolean): Promise<QuestionnaireAuthResult> {
    // 处理API响应，创建用户和会话对象
    // 这里需要根据实际API响应格式进行调整
    const { user, session } = apiResponse.data;
    
    this.saveCurrentUser(user);
    this.saveCurrentSession(session);

    if (remember) {
      // 从API响应中提取A+B值（如果可用）
      this.saveRememberedIdentity('', '');
    }

    return {
      success: true,
      user,
      session,
      message: '登录成功'
    };
  }

  /**
   * 验证A+B格式
   */
  private validateABFormat(identityA: string, identityB: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!AB_VALIDATION_RULES.identityA.pattern.test(identityA)) {
      errors.push(AB_VALIDATION_RULES.identityA.message);
    }

    if (!AB_VALIDATION_RULES.identityB.pattern.test(identityB)) {
      errors.push(AB_VALIDATION_RULES.identityB.message);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成UUID
   */
  private async generateUUID(identityA: string, identityB: string): Promise<string> {
    try {
      // 尝试调用UUID服务
      const response = await fetch(`${this.API_BASE_URL}/generate-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityA, identityB })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.uuid;
        }
      }
    } catch (error) {
      console.warn('UUID服务调用失败，使用本地生成:', error);
    }

    // 本地UUID生成（基于A+B组合的哈希）
    return this.generateLocalUUID(identityA, identityB);
  }

  /**
   * 本地UUID生成
   */
  private generateLocalUUID(identityA: string, identityB: string): string {
    const combined = `${identityA}_${identityB}_${Date.now()}`;
    const hash = btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    return `uuid_${hash}`;
  }

  /**
   * 调用远程API
   */
  private async callRemoteAPI(identityA: string, identityB: string): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/auth/semi-anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityA, identityB })
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): QuestionnaireUser | null {
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
  getCurrentSession(): QuestionnaireSession | null {
    try {
      const sessionJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      console.error('获取当前会话失败:', error);
      return null;
    }
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
  hasPermission(permission: QuestionnairePermission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.permissions.includes(permission);
  }

  /**
   * 登出
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    console.log('问卷用户已登出');
  }

  /**
   * 保存当前用户
   */
  private saveCurrentUser(user: QuestionnaireUser): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  /**
   * 保存当前会话
   */
  private saveCurrentSession(session: QuestionnaireSession): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  /**
   * 保存记住的身份
   */
  private saveRememberedIdentity(identityA: string, identityB: string): void {
    const remembered = {
      identityA: identityA.substring(0, 3) + '****' + identityA.substring(7), // 脱敏处理
      timestamp: Date.now()
    };
    localStorage.setItem(this.STORAGE_KEYS.REMEMBER_IDENTITY, JSON.stringify(remembered));
  }

  /**
   * 获取记住的身份
   */
  getRememberedIdentity(): { identityA: string; timestamp: number } | null {
    try {
      const rememberedJson = localStorage.getItem(this.STORAGE_KEYS.REMEMBER_IDENTITY);
      return rememberedJson ? JSON.parse(rememberedJson) : null;
    } catch (error) {
      console.error('获取记住的身份失败:', error);
      return null;
    }
  }

  /**
   * 清除记住的身份
   */
  clearRememberedIdentity(): void {
    localStorage.removeItem(this.STORAGE_KEYS.REMEMBER_IDENTITY);
  }

  /**
   * 调用新的问卷认证API - A+B半匿名认证
   */
  async authenticateWithAPI(identityA: string, identityB: string, remember: boolean = false): Promise<QuestionnaireAuthResult> {
    try {
      const response = await api.post('/questionnaire-auth/semi-anonymous', {
        identityA,
        identityB,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
          }
        }
      });

      if (response.data.success) {
        const { user, session } = response.data.data;

        // 转换为本地格式
        const localUser: QuestionnaireUser = {
          uuid: user.uuid,
          userType: 'SEMI_ANONYMOUS',
          display_name: user.display_name,
          identityHash: '', // 不需要在前端存储
          permissions: user.permissions,
          created_at: user.created_at,
          last_active_at: user.last_active_at,
          metadata: user.metadata
        };

        const localSession: QuestionnaireSession = {
          sessionId: session.session_id,
          userUuid: session.user_uuid,
          deviceFingerprint: session.device_fingerprint,
          userAgent: session.user_agent,
          ipAddress: session.ip_address,
          created_at: session.created_at,
          expires_at: session.expires_at,
          isActive: session.is_active
        };

        // 保存到本地存储
        this.saveCurrentUser(localUser);
        this.saveCurrentSession(localSession);

        // 记住身份（如果用户选择）
        if (remember) {
          this.saveRememberedIdentity(identityA, identityB);
        }

        return {
          success: true,
          user: localUser,
          session: localSession,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'AUTH_FAILED',
          message: response.data.message || '认证失败'
        };
      }
    } catch (error: any) {
      console.error('问卷API认证失败:', error);

      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.error || 'API_ERROR',
          message: error.response.data.message || '认证失败'
        };
      }

      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络错误，请检查连接后重试'
      };
    }
  }
}

// 导出单例实例
export const questionnaireAuthService = new QuestionnaireAuthService();

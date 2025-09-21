/**
 * UUID用户管理服务
 * 统一管理所有用户类型的认证、权限和会话
 */

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
  UserCredentials,
  UserContentMapping,
  UserStatistics
} from '../types/uuid-system';

import {
  generateUUID,
  parseUUIDInfo,
  hasPermission,
  SESSION_CONFIG,
  ROLE_PERMISSIONS
} from '../types/uuid-system';

// 加密工具
import { generateHash, generateSalt } from '../utils/crypto';
import { uuidApiService } from './uuidApi';

class UUIDUserService {
  private static instance: UUIDUserService;
  private currentUser: UniversalUser | null = null;
  private currentSession: UserSession | null = null;

  private constructor() {
    this.loadCurrentSession();
  }

  public static getInstance(): UUIDUserService {
    if (!UUIDUserService.instance) {
      UUIDUserService.instance = new UUIDUserService();
    }
    return UUIDUserService.instance;
  }

  /**
   * 创建新用户
   */
  async createUser(
    userType: UserType,
    credentials: UserCredentials,
    additionalData?: any
  ): Promise<UniversalUser> {
    try {
      const uuid = generateUUID(userType);
      const now = new Date().toISOString();

      const user: UniversalUser = {
        uuid,
        userType,
        credentials: await this.encryptCredentials(credentials),
        profile: {
          displayName: this.generateDisplayName(userType, uuid),
          role: userType,
          preferences: {
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            notifications: {
              email: false,
              push: false,
              sms: false
            },
            privacy: {
              showProfile: false,
              allowTracking: false,
              dataRetention: 30
            }
          }
        },
        permissions: ROLE_PERMISSIONS[userType],
        metadata: {
          loginCount: 0,
          contentStats: {
            totalSubmissions: 0,
            approvedSubmissions: 0,
            rejectedSubmissions: 0,
            downloads: 0
          },
          securityFlags: {
            isSuspicious: false,
            failedLoginAttempts: 0,
            twoFactorEnabled: false
          },
          ...(userType === UserType.REVIEWER && {
            reviewStats: {
              totalReviewed: 0,
              approved: 0,
              rejected: 0,
              dailyQuota: 50, // 默认每日审核50条
              todayReviewed: 0,
              averageReviewTime: 0
            }
          })
        },
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        status: 'active'
      };

      // 半匿名用户需要设置身份哈希
      if (userType === UserType.SEMI_ANONYMOUS && credentials.identityAHash && credentials.identityBHash) {
        user.identityHash = await this.generateIdentityHash(
          credentials.identityAHash,
          credentials.identityBHash
        );
      }

      // 保存到本地存储（开发环境）
      await this.saveUser(user);

      console.log(`用户创建成功: ${userType} - ${uuid}`);
      return user;

    } catch (error) {
      console.error('创建用户失败:', error);
      throw new Error('用户创建失败');
    }
  }

  /**
   * 用户认证
   */
  async authenticateUser(credentials: UserCredentials, userType?: UserType): Promise<AuthResult> {
    try {
      // 检查身份冲突
      const conflictResult = await this.checkIdentityConflict(credentials);
      if (conflictResult.hasConflict && conflictResult.requiresConfirmation) {
        return {
          success: false,
          error: conflictResult.message,
          requiresTwoFactor: false
        };
      }

      let apiResponse;

      // 根据凭据类型调用不同的API
      if (credentials.username && credentials.passwordHash) {
        // 实名用户登录
        apiResponse = await uuidApiService.authenticateAdmin(
          credentials.username,
          credentials.passwordHash,
          userType || UserType.ADMIN
        );
      } else if (credentials.identityAHash && credentials.identityBHash) {
        // 半匿名用户登录 - 需要原始A+B值
        // 注意：这里需要传递原始值，而不是哈希值
        throw new Error('半匿名登录需要原始A+B值，请使用loginSemiAnonymous方法');
      } else if (credentials.deviceFingerprint) {
        // 全匿名用户登录
        apiResponse = await uuidApiService.authenticateAnonymous();
      } else {
        return {
          success: false,
          error: '无效的认证凭据',
          requiresTwoFactor: false
        };
      }

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.message || '认证失败',
          requiresTwoFactor: false
        };
      }

      const { user, session } = apiResponse.data;

      // 设置当前用户和会话
      this.currentUser = user;
      this.currentSession = session;

      // 保存会话到本地存储
      this.saveCurrentSession();

      return {
        success: true,
        user,
        session
      };

    } catch (error) {
      console.error('用户认证失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '认证过程中发生错误',
        requiresTwoFactor: false
      };
    }
  }

  /**
   * 半匿名用户登录（使用原始A+B值）
   */
  async loginSemiAnonymous(identityA: string, identityB: string): Promise<AuthResult> {
    try {
      const apiResponse = await uuidApiService.authenticateSemiAnonymous(identityA, identityB);

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.message || '半匿名登录失败',
          requiresTwoFactor: false
        };
      }

      const { user, session } = apiResponse.data;

      // 设置当前用户和会话
      this.currentUser = user;
      this.currentSession = session;

      // 保存会话到本地存储
      this.saveCurrentSession();

      return {
        success: true,
        user,
        session
      };

    } catch (error) {
      console.error('半匿名登录失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '半匿名登录过程中发生错误',
        requiresTwoFactor: false
      };
    }
  }

  /**
   * 全匿名用户登录
   */
  async loginAnonymous(): Promise<AuthResult> {
    try {
      const apiResponse = await uuidApiService.authenticateAnonymous();

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.message || '匿名登录失败',
          requiresTwoFactor: false
        };
      }

      const { user, session } = apiResponse.data;

      // 设置当前用户和会话
      this.currentUser = user;
      this.currentSession = session;

      // 保存会话到本地存储
      this.saveCurrentSession();

      return {
        success: true,
        user,
        session
      };

    } catch (error) {
      console.error('匿名登录失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '匿名登录过程中发生错误',
        requiresTwoFactor: false
      };
    }
  }

  /**
   * 检查身份冲突
   */
  async checkIdentityConflict(newCredentials: UserCredentials): Promise<IdentityConflictResult> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      return {
        hasConflict: false,
        requiresConfirmation: false
      };
    }

    // 确定新的用户类型
    let newUserType: UserType;
    if (newCredentials.username) {
      newUserType = UserType.ADMIN; // 或根据具体逻辑判断
    } else if (newCredentials.identityAHash) {
      newUserType = UserType.SEMI_ANONYMOUS;
    } else {
      newUserType = UserType.ANONYMOUS;
    }

    if (currentUser.userType !== newUserType) {
      return {
        hasConflict: true,
        currentUserType: currentUser.userType,
        message: `检测到您已以${this.getUserTypeDisplayName(currentUser.userType)}身份登录，切换到${this.getUserTypeDisplayName(newUserType)}身份将清除当前登录状态。是否继续？`,
        requiresConfirmation: true
      };
    }

    return {
      hasConflict: false,
      requiresConfirmation: false
    };
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        await this.revokeSession(this.currentSession.sessionId);
      }

      this.currentUser = null;
      this.currentSession = null;

      // 清除本地存储
      localStorage.removeItem('current_user_session');
      localStorage.removeItem('current_user');

      console.log('用户已登出');
    } catch (error) {
      console.error('登出失败:', error);
    }
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): UniversalUser | null {
    if (this.currentUser && this.isSessionValid()) {
      return this.currentUser;
    }
    return null;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): UserSession | null {
    if (this.currentSession && this.isSessionValid()) {
      return this.currentSession;
    }
    return null;
  }

  /**
   * 检查权限
   */
  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return hasPermission(user, permission);
  }

  /**
   * 检查是否可以访问内容
   */
  canAccessContent(contentUserUuid: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // 超级管理员和管理员可以访问所有内容
    if (user.userType === UserType.SUPER_ADMIN || user.userType === UserType.ADMIN) {
      return true;
    }

    // 审核员可以访问待审核内容
    if (user.userType === UserType.REVIEWER) {
      return this.hasPermission(Permission.REVIEW_CONTENT);
    }

    // 半匿名用户只能访问自己的内容
    if (user.userType === UserType.SEMI_ANONYMOUS) {
      return user.uuid === contentUserUuid;
    }

    return false;
  }

  /**
   * 关联用户内容
   */
  async linkUserContent(
    contentType: ContentType,
    contentId: string,
    status: ContentStatus = ContentStatus.PENDING
  ): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const mapping: UserContentMapping = {
      id: generateUUID(UserType.ANONYMOUS), // 使用简单UUID作为映射ID
      userUuid: user.uuid,
      contentType,
      contentId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存内容映射
    await this.saveContentMapping(mapping);

    // 更新用户内容统计
    await this.updateUserContentStats(user.uuid, contentType, status);
  }

  /**
   * 获取用户内容
   */
  async getUserContent(userUuid?: string): Promise<UserContentMapping[]> {
    const targetUuid = userUuid || this.getCurrentUser()?.uuid;
    if (!targetUuid) {
      throw new Error('用户UUID无效');
    }

    // 检查权限
    if (userUuid && !this.canAccessContent(userUuid)) {
      throw new Error('无权访问该用户内容');
    }

    return await this.loadUserContent(targetUuid);
  }

  // 私有方法实现...
  private async encryptCredentials(credentials: UserCredentials): Promise<UserCredentials> {
    const encrypted: UserCredentials = { ...credentials };
    
    if (credentials.passwordHash) {
      encrypted.passwordHash = await generateHash(credentials.passwordHash);
    }
    
    return encrypted;
  }

  private generateDisplayName(userType: UserType, uuid: string): string {
    const shortUuid = uuid.slice(-8);
    switch (userType) {
      case UserType.ANONYMOUS:
        return `匿名用户_${shortUuid}`;
      case UserType.SEMI_ANONYMOUS:
        return `半匿名用户_${shortUuid}`;
      case UserType.REVIEWER:
        return `审核员_${shortUuid}`;
      case UserType.ADMIN:
        return `管理员_${shortUuid}`;
      case UserType.SUPER_ADMIN:
        return `超级管理员_${shortUuid}`;
      default:
        return `用户_${shortUuid}`;
    }
  }

  private getUserTypeDisplayName(userType: UserType): string {
    const names = {
      [UserType.ANONYMOUS]: '全匿名用户',
      [UserType.SEMI_ANONYMOUS]: '半匿名用户',
      [UserType.REVIEWER]: '审核员',
      [UserType.ADMIN]: '管理员',
      [UserType.SUPER_ADMIN]: '超级管理员'
    };
    return names[userType] || '未知用户';
  }

  private async generateIdentityHash(identityA: string, identityB: string): Promise<string> {
    const salt = 'college_employment_survey_2024';
    const combinedKey = `${identityA}:${identityB}:${salt}`;
    return await generateHash(combinedKey);
  }

  private async verifyPassword(inputHash: string, storedHash?: string): Promise<boolean> {
    if (!storedHash) return false;
    return inputHash === storedHash;
  }

  private isSessionValid(): boolean {
    if (!this.currentSession) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);
    
    return now < expiresAt;
  }

  // 本地存储方法（开发环境使用）
  private async saveUser(user: UniversalUser): Promise<void> {
    const users = this.loadUsersFromStorage();
    users[user.uuid] = user;
    localStorage.setItem('uuid_users', JSON.stringify(users));
  }

  private loadUsersFromStorage(): Record<string, UniversalUser> {
    const stored = localStorage.getItem('uuid_users');
    return stored ? JSON.parse(stored) : {};
  }

  private async findUserByUsername(username: string): Promise<UniversalUser | null> {
    const users = this.loadUsersFromStorage();
    return Object.values(users).find(user => user.credentials?.username === username) || null;
  }

  private async findUserByIdentityHash(identityHash: string): Promise<UniversalUser | null> {
    const users = this.loadUsersFromStorage();
    return Object.values(users).find(user => user.identityHash === identityHash) || null;
  }

  private async findOrCreateAnonymousUser(deviceFingerprint: string): Promise<UniversalUser> {
    // 查找现有匿名用户
    const users = this.loadUsersFromStorage();
    const existingUser = Object.values(users).find(user => 
      user.userType === UserType.ANONYMOUS && 
      user.credentials?.deviceFingerprint === deviceFingerprint
    );

    if (existingUser) {
      return existingUser;
    }

    // 创建新的匿名用户
    return await this.createUser(UserType.ANONYMOUS, { deviceFingerprint });
  }

  private async createSession(user: UniversalUser): Promise<UserSession> {
    const sessionId = generateUUID(UserType.ANONYMOUS);
    const sessionToken = generateUUID(UserType.ANONYMOUS);
    const expiresAt = new Date(Date.now() + SESSION_CONFIG[user.userType]);

    const session: UserSession = {
      sessionId,
      userUuid: user.uuid,
      sessionToken,
      deviceFingerprint: user.credentials?.deviceFingerprint || '',
      ipAddress: '127.0.0.1', // 开发环境
      userAgent: navigator.userAgent,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 保存会话
    const sessions = this.loadSessionsFromStorage();
    sessions[sessionId] = session;
    localStorage.setItem('uuid_sessions', JSON.stringify(sessions));

    return session;
  }

  private loadSessionsFromStorage(): Record<string, UserSession> {
    const stored = localStorage.getItem('uuid_sessions');
    return stored ? JSON.parse(stored) : {};
  }

  private async revokeSession(sessionId: string): Promise<void> {
    const sessions = this.loadSessionsFromStorage();
    if (sessions[sessionId]) {
      sessions[sessionId].isActive = false;
      localStorage.setItem('uuid_sessions', JSON.stringify(sessions));
    }
  }

  private async updateUserLoginInfo(user: UniversalUser): Promise<void> {
    user.metadata.loginCount += 1;
    user.lastActiveAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    
    await this.saveUser(user);
  }

  private saveCurrentSession(): void {
    if (this.currentUser && this.currentSession) {
      localStorage.setItem('current_user', JSON.stringify(this.currentUser));
      localStorage.setItem('current_user_session', JSON.stringify(this.currentSession));
    }
  }

  private loadCurrentSession(): void {
    try {
      const userStr = localStorage.getItem('current_user');
      const sessionStr = localStorage.getItem('current_user_session');
      
      if (userStr && sessionStr) {
        this.currentUser = JSON.parse(userStr);
        this.currentSession = JSON.parse(sessionStr);
        
        // 检查会话是否有效
        if (!this.isSessionValid()) {
          this.currentUser = null;
          this.currentSession = null;
        }
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      this.currentUser = null;
      this.currentSession = null;
    }
  }

  private async saveContentMapping(mapping: UserContentMapping): Promise<void> {
    const mappings = this.loadContentMappingsFromStorage();
    mappings[mapping.id] = mapping;
    localStorage.setItem('uuid_content_mappings', JSON.stringify(mappings));
  }

  private loadContentMappingsFromStorage(): Record<string, UserContentMapping> {
    const stored = localStorage.getItem('uuid_content_mappings');
    return stored ? JSON.parse(stored) : {};
  }

  private async loadUserContent(userUuid: string): Promise<UserContentMapping[]> {
    const mappings = this.loadContentMappingsFromStorage();
    return Object.values(mappings).filter(mapping => mapping.userUuid === userUuid);
  }

  private async updateUserContentStats(
    userUuid: string,
    contentType: ContentType,
    status: ContentStatus
  ): Promise<void> {
    const users = this.loadUsersFromStorage();
    const user = users[userUuid];
    
    if (user) {
      user.metadata.contentStats.totalSubmissions += 1;
      
      if (status === ContentStatus.APPROVED) {
        user.metadata.contentStats.approvedSubmissions += 1;
      } else if (status === ContentStatus.REJECTED) {
        user.metadata.contentStats.rejectedSubmissions += 1;
      }
      
      user.metadata.contentStats.lastSubmissionAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      
      await this.saveUser(user);
    }
  }
}

// 导出单例实例
export const uuidUserService = UUIDUserService.getInstance();
export default uuidUserService;

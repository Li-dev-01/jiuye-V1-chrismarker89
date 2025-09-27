/**
 * 全局状态管理器
 * 处理4种用户状态的检测、切换和冲突解决
 */

import { UserType } from '../types/uuid-system';
import type { UniversalUser, UserSession } from '../types/uuid-system';
import { uuidApiService } from './uuidApi';

// 全局状态类型
export enum GlobalUserState {
  ANONYMOUS = 'anonymous',           // 全匿名用户
  SEMI_ANONYMOUS = 'semi_anonymous', // 半匿名用户
  REVIEWER = 'reviewer',             // 审核员
  ADMIN = 'admin',                   // 管理员
  SUPER_ADMIN = 'super_admin'        // 超级管理员
}

// 全局状态到UserType的映射
function globalStateToUserType(state: GlobalUserState): UserType {
  switch (state) {
    case GlobalUserState.ANONYMOUS:
      return UserType.ANONYMOUS;
    case GlobalUserState.SEMI_ANONYMOUS:
      return UserType.SEMI_ANONYMOUS;
    case GlobalUserState.REVIEWER:
      return UserType.REVIEWER;
    case GlobalUserState.ADMIN:
      return UserType.ADMIN;
    case GlobalUserState.SUPER_ADMIN:
      return UserType.SUPER_ADMIN;
    default:
      throw new Error(`不支持的全局状态: ${state}`);
  }
}

// 状态检测结果
export interface StateDetectionResult {
  currentState: GlobalUserState;
  user: UniversalUser | null;
  session: UserSession | null;
  isValid: boolean;
  conflicts: StateConflict[];
  recommendations: string[];
}

// 状态冲突
export interface StateConflict {
  type: 'token_expired' | 'multiple_sessions' | 'invalid_user' | 'permission_mismatch';
  severity: 'low' | 'medium' | 'high';
  message: string;
  autoResolvable: boolean;
}

// 状态切换选项
export interface StateSwitchOptions {
  targetState: GlobalUserState;
  credentials?: any;
  forceSwitch?: boolean;
  clearConflicts?: boolean;
}

class GlobalStateManager {
  private static instance: GlobalStateManager;
  private currentState: GlobalUserState = GlobalUserState.ANONYMOUS;
  private stateCheckInterval: number | null = null;
  private listeners: Array<(state: StateDetectionResult) => void> = [];

  // 存储键名
  private readonly STORAGE_KEYS = {
    CURRENT_USER: 'uuid_current_user',
    CURRENT_SESSION: 'uuid_current_session',
    LAST_STATE: 'uuid_last_state',
    STATE_TIMESTAMP: 'uuid_state_timestamp',
    CONFLICT_LOG: 'uuid_conflict_log'
  };

  private constructor() {
    this.initializeStateDetection();
  }

  public static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager();
    }
    return GlobalStateManager.instance;
  }

  /**
   * 初始化状态检测
   */
  private initializeStateDetection() {
    // 页面加载时检测状态
    this.detectCurrentState();
    
    // 定期检测状态（每30秒）
    this.startPeriodicStateCheck();
    
    // 监听存储变化（多标签页同步）
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // 页面可见性变化时检测
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.detectCurrentState();
      }
    });
  }

  /**
   * 检测当前状态
   */
  async detectCurrentState(): Promise<StateDetectionResult> {
    try {
      const user = this.getCurrentUser();
      const session = this.getCurrentSession();
      const conflicts: StateConflict[] = [];
      const recommendations: string[] = [];

      // 1. 检查是否有用户数据
      if (!user || !session) {
        return this.createStateResult(GlobalUserState.ANONYMOUS, null, null, true, [], [
          '当前为全匿名状态，可以参与问卷调查'
        ]);
      }

      // 2. 检查会话是否过期
      const isSessionValid = await this.validateSession(session);
      if (!isSessionValid) {
        conflicts.push({
          type: 'token_expired',
          severity: 'high',
          message: '会话已过期，需要重新登录',
          autoResolvable: true
        });
        recommendations.push('会话已过期，建议重新登录');
      }

      // 3. 根据用户类型确定状态
      let detectedState: GlobalUserState;
      switch (user.userType) {
        case 'anonymous':
          detectedState = GlobalUserState.ANONYMOUS;
          break;
        case 'semi_anonymous':
          detectedState = GlobalUserState.SEMI_ANONYMOUS;
          recommendations.push('半匿名用户可以管理自己的内容和下载资源');
          break;
        case 'reviewer':
          detectedState = GlobalUserState.REVIEWER;
          recommendations.push('审核员可以审核内容，会话1小时后过期');
          break;
        case 'admin':
          detectedState = GlobalUserState.ADMIN;
          recommendations.push('管理员拥有项目管理权限，会话1小时后过期');
          break;
        case 'super_admin':
          detectedState = GlobalUserState.SUPER_ADMIN;
          recommendations.push('超级管理员拥有所有权限，会话1小时后过期');
          break;
        default:
          detectedState = GlobalUserState.ANONYMOUS;
          conflicts.push({
            type: 'invalid_user',
            severity: 'medium',
            message: '未知的用户类型',
            autoResolvable: false
          });
      }

      // 4. 检查权限一致性
      if (user.userType !== 'anonymous' && !user.permissions) {
        conflicts.push({
          type: 'permission_mismatch',
          severity: 'medium',
          message: '用户权限数据缺失',
          autoResolvable: false
        });
      }

      // 5. 更新当前状态
      this.currentState = detectedState;
      this.saveStateToStorage(detectedState, user, session);

      const result = this.createStateResult(
        detectedState, 
        user, 
        session, 
        isSessionValid && conflicts.length === 0,
        conflicts,
        recommendations
      );

      // 通知监听器
      this.notifyListeners(result);

      return result;

    } catch (error) {
      console.error('状态检测失败:', error);
      return this.createStateResult(GlobalUserState.ANONYMOUS, null, null, false, [
        {
          type: 'invalid_user',
          severity: 'high',
          message: '状态检测失败',
          autoResolvable: false
        }
      ], ['状态检测失败，已重置为匿名状态']);
    }
  }

  /**
   * 切换用户状态
   */
  async switchState(options: StateSwitchOptions): Promise<StateDetectionResult> {
    try {
      const currentResult = await this.detectCurrentState();

      // 检查是否需要处理冲突
      if (currentResult.conflicts.length > 0 && !options.forceSwitch) {
        if (options.clearConflicts) {
          await this.resolveConflicts(currentResult.conflicts);
        } else {
          throw new Error('存在状态冲突，需要先解决冲突或使用强制切换');
        }
      }

      // 根据目标状态执行切换
      switch (options.targetState) {
        case GlobalUserState.ANONYMOUS:
          await this.switchToAnonymous();
          break;
        case GlobalUserState.SEMI_ANONYMOUS:
          if (!options.credentials?.identityA || !options.credentials?.identityB) {
            throw new Error('半匿名登录需要A+B凭据');
          }
          await this.switchToSemiAnonymous(options.credentials.identityA, options.credentials.identityB);
          break;
        case GlobalUserState.REVIEWER:
        case GlobalUserState.ADMIN:
        case GlobalUserState.SUPER_ADMIN:
          if (!options.credentials?.username || !options.credentials?.password) {
            throw new Error('管理员登录需要用户名和密码');
          }
          await this.switchToAdmin(
            options.credentials.username,
            options.credentials.password,
            globalStateToUserType(options.targetState)
          );
          break;
        default:
          throw new Error('不支持的目标状态');
      }

      // 重新检测状态
      return await this.detectCurrentState();

    } catch (error) {
      console.error('状态切换失败:', error);
      throw error;
    }
  }

  /**
   * 解决状态冲突
   */
  async resolveConflicts(conflicts: StateConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.autoResolvable) {
        switch (conflict.type) {
          case 'token_expired':
            await this.clearExpiredSession();
            break;
          case 'multiple_sessions':
            await this.clearAllSessions();
            break;
        }
      }
    }
  }

  /**
   * 强制刷新状态
   */
  async forceRefresh(): Promise<StateDetectionResult> {
    // 只清除UUID系统的缓存，保留问卷认证系统的数据
    this.clearUuidSystemStorage();

    // 重新检测状态
    return await this.detectCurrentState();
  }

  /**
   * 添加状态监听器
   */
  addStateListener(listener: (state: StateDetectionResult) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态监听器
   */
  removeStateListener(listener: (state: StateDetectionResult) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): GlobalUserState {
    return this.currentState;
  }

  /**
   * 检查是否可以执行特定操作
   */
  canPerformAction(action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // 基于用户类型和权限检查
    switch (action) {
      case 'submit_questionnaire':
        return true; // 所有用户都可以提交问卷
      case 'download_content':
        return user.userType !== 'anonymous';
      case 'manage_own_content':
        return user.userType === 'semi_anonymous' || this.isAdminUser(user.userType);
      case 'review_content':
        return user.userType === 'reviewer' || this.isAdminUser(user.userType);
      case 'manage_users':
        return this.isAdminUser(user.userType);
      default:
        return false;
    }
  }

  // ==================== 私有方法 ====================

  private async validateSession(session: UserSession): Promise<boolean> {
    try {
      if (!session.sessionToken) return false;

      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        console.log('❌ 会话已过期:', session.sessionToken.substring(0, 20) + '...');
        return false;
      }

      // 对于问卷认证的会话，跳过API验证，只检查时间
      if (session.sessionToken.startsWith('questionnaire_')) {
        console.log('✅ 问卷会话验证通过（跳过API验证）:', session.sessionToken.substring(0, 20) + '...');
        return true;
      }

      // 对于其他会话，尝试API验证，但不因为API错误而失败
      try {
        console.log('🔍 验证UUID系统会话:', session.sessionToken.substring(0, 20) + '...');
        const result = await uuidApiService.validateSession(session.sessionToken);
        console.log('✅ UUID会话验证结果:', result.success);
        return result.success;
      } catch (apiError) {
        console.warn('⚠️ UUID API会话验证失败，但会话时间有效，继续使用:', apiError);
        // 如果API验证失败，但会话时间还有效，则认为会话有效
        return true;
      }
    } catch (error) {
      console.error('❌ 会话验证异常:', error);
      return false;
    }
  }

  private async switchToAnonymous(): Promise<void> {
    this.clearLocalStorage();
    this.currentState = GlobalUserState.ANONYMOUS;
  }

  private async switchToSemiAnonymous(identityA: string, identityB: string): Promise<void> {
    const result = await uuidApiService.authenticateSemiAnonymous(identityA, identityB);
    if (result.success) {
      this.saveUserAndSession(result.data.user, result.data.session);
    } else {
      throw new Error(result.message);
    }
  }

  private async switchToAdmin(username: string, password: string, userType: UserType): Promise<void> {
    const result = await uuidApiService.authenticateAdmin(username, password, userType);
    if (result.success) {
      this.saveUserAndSession(result.data.user, result.data.session);
    } else {
      throw new Error(result.message);
    }
  }

  private createStateResult(
    state: GlobalUserState,
    user: UniversalUser | null,
    session: UserSession | null,
    isValid: boolean,
    conflicts: StateConflict[],
    recommendations: string[]
  ): StateDetectionResult {
    return {
      currentState: state,
      user,
      session,
      isValid,
      conflicts,
      recommendations
    };
  }

  private getCurrentUser(): UniversalUser | null {
    try {
      console.log('🔍 检查当前用户状态...');

      // 首先尝试从UUID系统获取用户
      let userData = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      if (userData) {
        console.log('✅ 从UUID系统获取到用户数据');
        return JSON.parse(userData);
      }

      // 如果UUID系统没有用户，尝试从问卷认证系统获取
      userData = localStorage.getItem('questionnaire_current_user');
      if (userData) {
        console.log('✅ 从问卷认证系统获取到用户数据');
        const questionnaireUser = JSON.parse(userData);
        console.log('📋 原始问卷用户数据:', questionnaireUser);
        // 转换问卷用户格式为通用用户格式
        return this.convertQuestionnaireUserToUniversalUser(questionnaireUser);
      }

      console.log('❌ 未找到任何用户数据');
      return null;
    } catch (error) {
      console.error('❌ 获取当前用户失败:', error);
      return null;
    }
  }

  private getCurrentSession(): UserSession | null {
    try {
      // 首先尝试从UUID系统获取会话
      let sessionData = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // 如果UUID系统没有会话，尝试从问卷认证系统获取
      sessionData = localStorage.getItem('questionnaire_current_session');
      if (sessionData) {
        const questionnaireSession = JSON.parse(sessionData);
        // 转换问卷会话格式为通用会话格式
        return this.convertQuestionnaireSessionToUniversalSession(questionnaireSession);
      }

      return null;
    } catch {
      return null;
    }
  }

  private saveUserAndSession(user: UniversalUser, session: UserSession): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  private saveStateToStorage(state: GlobalUserState, user: UniversalUser | null, session: UserSession | null): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_STATE, state);
    localStorage.setItem(this.STORAGE_KEYS.STATE_TIMESTAMP, new Date().toISOString());
    if (user) localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    if (session) localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  private clearLocalStorage(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  private clearUuidSystemStorage(): void {
    // 只清除UUID系统的存储键，保留问卷认证系统的数据
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  private async clearExpiredSession(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
  }

  private async clearAllSessions(): Promise<void> {
    this.clearLocalStorage();
  }

  private startPeriodicStateCheck(): void {
    this.stateCheckInterval = window.setInterval(() => {
      this.detectCurrentState();
    }, 30000); // 每30秒检查一次
  }

  private handleStorageChange(event: StorageEvent): void {
    // 监听UUID系统的存储键
    const isUuidSystemKey = Object.values(this.STORAGE_KEYS).includes(event.key as any);

    // 监听问卷认证系统的存储键
    const isQuestionnaireSystemKey = [
      'questionnaire_current_user',
      'questionnaire_current_session'
    ].includes(event.key || '');

    if (isUuidSystemKey || isQuestionnaireSystemKey) {
      console.log('🔄 检测到存储变化，重新检测状态:', event.key);
      this.detectCurrentState();
    }
  }

  private notifyListeners(result: StateDetectionResult): void {
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('状态监听器执行失败:', error);
      }
    });
  }

  private isAdminUser(userType: string): boolean {
    return ['admin', 'super_admin'].includes(userType);
  }

  /**
   * 将问卷用户格式转换为通用用户格式
   */
  private convertQuestionnaireUserToUniversalUser(questionnaireUser: any): UniversalUser | null {
    try {
      console.log('🔄 转换问卷用户数据:', questionnaireUser);

      // 处理权限数据 - 可能是字符串或数组
      let permissions = [];
      if (questionnaireUser.permissions) {
        if (typeof questionnaireUser.permissions === 'string') {
          try {
            permissions = JSON.parse(questionnaireUser.permissions);
          } catch {
            permissions = [questionnaireUser.permissions];
          }
        } else if (Array.isArray(questionnaireUser.permissions)) {
          permissions = questionnaireUser.permissions;
        }
      }

      // 符合命名规范：API返回snake_case，前端转换为camelCase
      // 支持两种格式以确保兼容性
      const userType = questionnaireUser.userType || questionnaireUser.user_type || 'semi_anonymous';
      const displayName = questionnaireUser.displayName || questionnaireUser.display_name || '问卷用户';
      const createdAt = questionnaireUser.createdAt || questionnaireUser.created_at || Date.now();
      const lastActiveAt = questionnaireUser.lastActiveAt || questionnaireUser.last_active_at || Date.now();
      const isActive = questionnaireUser.isActive !== false && questionnaireUser.is_active !== false && questionnaireUser.status !== 'inactive';

      const convertedUser = {
        uuid: questionnaireUser.uuid || questionnaireUser.id,
        username: questionnaireUser.username || displayName,
        displayName: displayName,
        userType: userType,
        permissions: permissions,
        createdAt: typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt,
        lastLoginAt: typeof lastActiveAt === 'string' ? new Date(lastActiveAt).getTime() : lastActiveAt,
        isActive: isActive,
        metadata: {
          source: 'questionnaire_auth',
          originalData: questionnaireUser
        }
      };

      console.log('✅ 转换后的用户数据:', convertedUser);
      return convertedUser;
    } catch (error) {
      console.error('❌ 转换问卷用户格式失败:', error);
      return null;
    }
  }

  /**
   * 将问卷会话格式转换为通用会话格式
   */
  private convertQuestionnaireSessionToUniversalSession(questionnaireSession: any): UserSession | null {
    try {
      console.log('🔄 转换问卷会话数据:', questionnaireSession);

      // 符合命名规范：API返回snake_case，前端转换为camelCase
      // 处理过期时间
      let expiresAt = questionnaireSession.expiresAt || questionnaireSession.expires_at;
      if (!expiresAt) {
        // 默认24小时过期
        expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      } else if (typeof expiresAt === 'string') {
        expiresAt = new Date(expiresAt).getTime();
      }

      // 处理创建时间
      let createdAt = questionnaireSession.createdAt || questionnaireSession.created_at || Date.now();
      if (typeof createdAt === 'string') {
        createdAt = new Date(createdAt).getTime();
      }

      const convertedSession = {
        sessionId: questionnaireSession.sessionId || questionnaireSession.session_id || questionnaireSession.id,
        sessionToken: questionnaireSession.sessionToken || questionnaireSession.session_token || questionnaireSession.token,
        userId: questionnaireSession.userId || questionnaireSession.user_uuid || questionnaireSession.user_id,
        userType: questionnaireSession.userType || questionnaireSession.user_type || 'semi_anonymous',
        createdAt: createdAt,
        expiresAt: expiresAt,
        isActive: questionnaireSession.isActive !== false && questionnaireSession.is_active !== false,
        metadata: {
          source: 'questionnaire_auth',
          originalData: questionnaireSession
        }
      };

      console.log('✅ 转换后的会话数据:', convertedSession);
      return convertedSession;
    } catch (error) {
      console.error('❌ 转换问卷会话格式失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const globalStateManager = GlobalStateManager.getInstance();
export default globalStateManager;

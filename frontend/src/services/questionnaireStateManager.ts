/**
 * 问卷专用状态管理器
 * 独立于全局状态管理，专门处理问卷认证和提交
 */

export interface QuestionnaireUser {
  uuid: string;
  displayName: string;
  userType: 'semi_anonymous';
  identityA: string;
  identityB: string;
  createdAt: string;
}

export interface QuestionnaireSession {
  sessionToken: string;
  expiresAt: string;
  userId: string;
}

export interface QuestionnaireAuthState {
  isAuthenticated: boolean;
  user: QuestionnaireUser | null;
  session: QuestionnaireSession | null;
}

class QuestionnaireStateManager {
  private static instance: QuestionnaireStateManager;
  private listeners: ((state: QuestionnaireAuthState) => void)[] = [];

  private constructor() {}

  public static getInstance(): QuestionnaireStateManager {
    if (!QuestionnaireStateManager.instance) {
      QuestionnaireStateManager.instance = new QuestionnaireStateManager();
    }
    return QuestionnaireStateManager.instance;
  }

  /**
   * 获取当前认证状态
   */
  public getCurrentState(): QuestionnaireAuthState {
    try {
      const userStr = localStorage.getItem('questionnaire_current_user');
      const sessionStr = localStorage.getItem('questionnaire_current_session');

      if (!userStr || !sessionStr) {
        return { isAuthenticated: false, user: null, session: null };
      }

      const user = JSON.parse(userStr);
      const session = JSON.parse(sessionStr);

      // 检查会话是否过期
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        this.clearAuth();
        return { isAuthenticated: false, user: null, session: null };
      }

      return { isAuthenticated: true, user, session };
    } catch (error) {
      console.error('获取问卷认证状态失败:', error);
      return { isAuthenticated: false, user: null, session: null };
    }
  }

  /**
   * 设置认证状态
   */
  public setAuthState(user: QuestionnaireUser, session: QuestionnaireSession): void {
    try {
      localStorage.setItem('questionnaire_current_user', JSON.stringify(user));
      localStorage.setItem('questionnaire_current_session', JSON.stringify(session));
      
      const newState = this.getCurrentState();
      this.notifyListeners(newState);
      
      console.log('✅ 问卷认证状态已设置:', newState);
    } catch (error) {
      console.error('设置问卷认证状态失败:', error);
    }
  }

  /**
   * 清除认证状态
   */
  public clearAuth(): void {
    localStorage.removeItem('questionnaire_current_user');
    localStorage.removeItem('questionnaire_current_session');
    
    const newState = this.getCurrentState();
    this.notifyListeners(newState);
    
    console.log('✅ 问卷认证状态已清除');
  }

  /**
   * 添加状态监听器
   */
  public addListener(listener: (state: QuestionnaireAuthState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态监听器
   */
  public removeListener(listener: (state: QuestionnaireAuthState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(state: QuestionnaireAuthState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('问卷状态监听器执行失败:', error);
      }
    });
  }

  /**
   * 强制刷新状态
   */
  public forceRefresh(): QuestionnaireAuthState {
    const state = this.getCurrentState();
    this.notifyListeners(state);
    return state;
  }
}

export const questionnaireStateManager = QuestionnaireStateManager.getInstance();
export default questionnaireStateManager;

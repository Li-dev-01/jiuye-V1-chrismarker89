/**
 * 问卷完成状态检测Hook
 * 在问卷最后一页检测用户登录状态并决定后续流程
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../stores/universalAuthStore';
// 注释掉暂时不可用的导入
// import { globalStateManager } from '../services/globalStateManager';
// import type { GlobalUserState, StateDetectionResult } from '../services/globalStateManager';

// 临时类型定义
interface StateDetectionResult {
  isValid: boolean;
  user?: any;
  session?: any;
  state?: string;
  conflicts: Array<{ type: string; message: string }>;
}

export interface QuestionnaireCompletionState {
  // 用户状态
  isLoggedIn: boolean;
  userType: string | null;
  hasValidToken: boolean;
  
  // 检测结果
  detectionResult: StateDetectionResult | null;
  isDetecting: boolean;
  
  // 推荐操作
  recommendedAction: 'none' | 'login' | 'register' | 'continue_anonymous';
  showLoginPrompt: boolean;
  
  // 方法
  detectUserState: () => Promise<void>;
  proceedWithCurrentState: () => void;
  promptLogin: () => void;
}

export const useQuestionnaireCompletion = (): QuestionnaireCompletionState => {
  const { isAuthenticated, currentUser, currentSession, checkSession } = useAuth();
  
  const [detectionResult, setDetectionResult] = useState<StateDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [recommendedAction, setRecommendedAction] = useState<'none' | 'login' | 'register' | 'continue_anonymous'>('none');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 检测用户状态
  const detectUserState = async () => {
    setIsDetecting(true);
    try {
      // 检查多种登录状态
      const hasAuth = isAuthenticated && !!currentUser;
      const hasSemiAnonymous = currentUser?.userType === 'semi-anonymous';
      const hasValidSession = !!currentSession;

      // 简化的状态检测逻辑
      const result: StateDetectionResult = {
        isValid: hasAuth || hasSemiAnonymous || hasValidSession,
        user: currentUser,
        session: currentSession,
        state: (hasAuth || hasSemiAnonymous) ? 'authenticated' : 'anonymous',
        conflicts: []
      };

      setDetectionResult(result);

      // 2. 根据检测结果决定推荐操作
      const action = determineRecommendedAction(result);
      setRecommendedAction(action);

      // 3. 决定是否显示登录提示
      setShowLoginPrompt(shouldShowLoginPrompt(result, action));

    } catch (error) {
      console.error('用户状态检测失败:', error);
      setRecommendedAction('continue_anonymous');
    } finally {
      setIsDetecting(false);
    }
  };

  // 根据检测结果决定推荐操作
  const determineRecommendedAction = (result: StateDetectionResult): 'none' | 'login' | 'register' | 'continue_anonymous' => {
    // 如果已经是有效的登录状态
    if (result.isValid && result.user && result.session) {
      return 'none'; // 无需额外操作
    }

    // 如果有token但已过期
    if (result.conflicts.some(c => c.type === 'token_expired')) {
      return 'login'; // 建议重新登录
    }

    // 如果是完全匿名状态
    if (result.state === 'anonymous') {
      return 'register'; // 建议注册/登录以保存数据
    }

    // 如果有部分数据但状态不一致
    if (result.conflicts.length > 0) {
      return 'login'; // 建议重新登录解决冲突
    }

    return 'continue_anonymous';
  };

  // 决定是否显示登录提示
  const shouldShowLoginPrompt = (result: StateDetectionResult, action: string): boolean => {
    // 如果已经登录且状态有效，不显示提示
    if (result.isValid && result.user) {
      return false;
    }

    // 如果推荐登录或注册，显示提示
    return action === 'login' || action === 'register';
  };

  // 继续当前状态（不登录）
  const proceedWithCurrentState = () => {
    setShowLoginPrompt(false);
    setRecommendedAction('continue_anonymous');
  };

  // 提示登录
  const promptLogin = () => {
    setShowLoginPrompt(true);
  };

  // 页面加载时自动检测
  useEffect(() => {
    detectUserState();
  }, []); // 只在组件挂载时执行一次

  // 监听认证状态变化
  useEffect(() => {
    // 避免无限循环，只在状态真正变化时执行
    detectUserState();
  }, [isAuthenticated]); // 只监听isAuthenticated的变化

  return {
    // 状态
    isLoggedIn: isAuthenticated && !!currentUser,
    userType: currentUser?.userType || null,
    hasValidToken: checkSession(),
    
    // 检测结果
    detectionResult,
    isDetecting,
    
    // 推荐操作
    recommendedAction,
    showLoginPrompt,
    
    // 方法
    detectUserState,
    proceedWithCurrentState,
    promptLogin
  };
};

// 辅助函数：获取用户状态描述
export const getUserStateDescription = (result: StateDetectionResult | null): string => {
  if (!result) return '检测中...';
  
  if (result.isValid && result.user) {
    switch (result.user.userType) {
      case 'semi_anonymous':
        return '半匿名用户（已登录）';
      case 'reviewer':
        return '审核员（已登录）';
      case 'admin':
        return '管理员（已登录）';
      default:
        return '已登录用户';
    }
  }
  
  return '匿名用户（未登录）';
};

// 辅助函数：获取推荐操作描述
export const getRecommendedActionDescription = (action: string): string => {
  switch (action) {
    case 'login':
      return '建议重新登录以保存您的数据';
    case 'register':
      return '建议登录以保存您的问卷数据和心声';
    case 'continue_anonymous':
      return '您可以继续以匿名方式使用';
    default:
      return '您的登录状态正常';
  }
};

/**
 * 简化的防爬虫Hook
 * 配合Cloudflare使用，重点区分真实用户和机器爬虫
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { antiBotDetector, checkIfHuman, getHumanToken } from '../utils/simpleAntiBot';

interface AntiBotState {
  isVerified: boolean;
  isBot: boolean;
  humanScore: number;
  verificationToken: string;
  lastCheck: number;
}

interface UseAntiBotOptions {
  enableProtection: boolean;
  recheckInterval: number; // 重新检查间隔（毫秒）
  minHumanScore: number;   // 最低人类得分
  onBotDetected?: (reasons: string[]) => void;
  onVerificationFailed?: () => void;
}

interface UseAntiBotReturn {
  // 状态
  isVerified: boolean;
  isBot: boolean;
  humanScore: number;
  
  // 方法
  checkAccess: () => Promise<boolean>;
  getVerificationToken: () => string;
  forceRecheck: () => void;
  
  // 统计
  getBehaviorStats: () => any;
}

export function useAntiBot(options: UseAntiBotOptions = {
  enableProtection: true,
  recheckInterval: 30000, // 30秒
  minHumanScore: 0.3,
}): UseAntiBotReturn {

  const [state, setState] = useState<AntiBotState>({
    isVerified: false,
    isBot: false,
    humanScore: 0,
    verificationToken: '',
    lastCheck: 0
  });

  // 执行机器人检测
  const performBotCheck = useCallback((): boolean => {
    if (!options.enableProtection) {
      setState(prev => ({
        ...prev,
        isVerified: true,
        isBot: false,
        humanScore: 1,
        lastCheck: Date.now()
      }));
      return true;
    }

    const detection = checkIfHuman();
    const isVerified = !detection.isBot && detection.humanScore >= options.minHumanScore;
    
    setState(prev => ({
      ...prev,
      isVerified,
      isBot: detection.isBot,
      humanScore: detection.humanScore,
      verificationToken: isVerified ? getHumanToken() : '',
      lastCheck: Date.now()
    }));

    // 处理机器人检测
    if (detection.isBot) {
      console.warn('Bot detected:', detection.reasons);
      options.onBotDetected?.(detection.reasons);
      
      // 显示友好的提示信息
      message.error({
        content: '检测到异常访问行为，请确保您是正常用户访问',
        duration: 5
      });
      
      return false;
    }

    // 处理验证失败
    if (!isVerified) {
      console.warn('Human verification failed:', {
        humanScore: detection.humanScore,
        required: options.minHumanScore
      });
      
      options.onVerificationFailed?.();
      
      message.warning({
        content: '请正常浏览页面后再试，或刷新页面重新验证',
        duration: 3
      });
      
      return false;
    }

    return true;
  }, [options]);

  // 检查访问权限
  const checkAccess = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    
    // 检查是否需要重新验证
    if (now - state.lastCheck > options.recheckInterval) {
      return performBotCheck();
    }
    
    // 使用缓存的验证结果
    if (!state.isVerified || state.isBot) {
      return performBotCheck();
    }
    
    return true;
  }, [state.lastCheck, state.isVerified, state.isBot, options.recheckInterval, performBotCheck]);

  // 获取验证令牌
  const getVerificationToken = useCallback((): string => {
    if (!state.isVerified) {
      performBotCheck();
    }
    return state.verificationToken || getHumanToken();
  }, [state.isVerified, state.verificationToken, performBotCheck]);

  // 强制重新检查
  const forceRecheck = useCallback(() => {
    performBotCheck();
  }, [performBotCheck]);

  // 获取行为统计
  const getBehaviorStats = useCallback(() => {
    return antiBotDetector.getBehaviorStats();
  }, []);

  // 初始化检查
  useEffect(() => {
    if (options.enableProtection) {
      // 延迟初始检查，让用户有时间产生交互行为
      const timer = setTimeout(() => {
        performBotCheck();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [options.enableProtection, performBotCheck]);

  // 定期重新检查
  useEffect(() => {
    if (!options.enableProtection) return;

    const interval = setInterval(() => {
      if (state.isVerified) {
        performBotCheck();
      }
    }, options.recheckInterval);

    return () => clearInterval(interval);
  }, [options.enableProtection, options.recheckInterval, state.isVerified, performBotCheck]);

  return {
    // 状态
    isVerified: state.isVerified,
    isBot: state.isBot,
    humanScore: state.humanScore,
    
    // 方法
    checkAccess,
    getVerificationToken,
    forceRecheck,
    
    // 统计
    getBehaviorStats
  };
}

// 简化的内容访问Hook
export function useProtectedContent<T>(
  loadFunction: (...args: any[]) => Promise<T>,
  options: UseAntiBotOptions = { enableProtection: true, recheckInterval: 30000, minHumanScore: 0.3 }
) {
  const antiBot = useAntiBot(options);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const protectedLoad = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // 检查访问权限
      const hasAccess = await antiBot.checkAccess();
      if (!hasAccess) {
        throw new Error('访问被拒绝：未通过人机验证');
      }

      // 执行实际的加载函数
      const result = await loadFunction(...args);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载失败';
      setError(errorMessage);
      console.error('Protected content load failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [antiBot, loadFunction]);

  return {
    protectedLoad,
    loading,
    error,
    ...antiBot
  };
}

// API请求拦截器
export const createProtectedApiClient = (baseApiClient: any) => {
  return {
    ...baseApiClient,
    
    async get(url: string, config: any = {}) {
      const token = getHumanToken();
      return baseApiClient.get(url, {
        ...config,
        headers: {
          ...config.headers,
          'X-Human-Token': token
        }
      });
    },
    
    async post(url: string, data: any, config: any = {}) {
      const token = getHumanToken();
      return baseApiClient.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          'X-Human-Token': token
        }
      });
    }
  };
};

// 使用示例
export const useStoryProtection = () => {
  return useAntiBot({
    enableProtection: true,
    recheckInterval: 30000,
    minHumanScore: 0.3,
    onBotDetected: (reasons) => {
      console.log('Story access blocked - bot detected:', reasons);
      // 可以发送到分析服务
    },
    onVerificationFailed: () => {
      console.log('Story access blocked - verification failed');
    }
  });
};

export const useVoiceProtection = () => {
  return useAntiBot({
    enableProtection: true,
    recheckInterval: 30000,
    minHumanScore: 0.3,
    onBotDetected: (reasons) => {
      console.log('Voice access blocked - bot detected:', reasons);
    },
    onVerificationFailed: () => {
      console.log('Voice access blocked - verification failed');
    }
  });
};

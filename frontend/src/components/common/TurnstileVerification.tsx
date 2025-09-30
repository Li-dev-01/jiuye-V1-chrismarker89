/**
 * Cloudflare Turnstile 人机验证组件
 * 提供无感的机器人检测和验证功能
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Spin } from 'antd';

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  onLoad?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  action?: string;
  cData?: string;
  retry?: 'auto' | 'never';
  retryInterval?: number;
  refreshExpired?: 'auto' | 'manual' | 'never';
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
  className?: string;
  style?: React.CSSProperties;
}

// 全局类型声明
declare global {
  interface Window {
    turnstile: {
      render: (element: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
      execute: (widgetId: string) => void;
      isExpired: (widgetId: string) => boolean;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export const TurnstileVerification: React.FC<TurnstileProps> = ({
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAB3qD0c5VZzGcchW',
  onSuccess,
  onError,
  onExpired,
  onLoad,
  theme = 'auto',
  size = 'normal',
  action,
  cData,
  retry = 'auto',
  retryInterval = 8000,
  refreshExpired = 'auto',
  appearance = 'always',
  execution = 'render',
  className,
  style
}) => {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 错误处理回调
  const handleError = useCallback((errorMessage: string) => {
    console.error('Turnstile错误:', errorMessage);
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  // 成功处理回调
  const handleSuccess = useCallback((token: string) => {
    console.log('Turnstile验证成功');
    setError(null);
    setIsLoading(false);
    onSuccess(token);
  }, [onSuccess]);

  // 过期处理回调
  const handleExpired = useCallback(() => {
    console.log('Turnstile token已过期');
    setError('验证已过期，请重新验证');
    onExpired?.();
  }, [onExpired]);

  // 渲染Turnstile组件
  const renderTurnstile = useCallback(() => {
    if (!turnstileRef.current || !window.turnstile || !scriptLoaded) {
      return;
    }

    try {
      // 如果已有widget，先移除
      if (widgetId) {
        window.turnstile.remove(widgetId);
        setWidgetId(null);
      }

      const id = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: handleSuccess,
        'error-callback': handleError,
        'expired-callback': handleExpired,
        'timeout-callback': () => handleError('验证超时'),
        'after-interactive-callback': () => {
          console.log('Turnstile交互开始');
        },
        'before-interactive-callback': () => {
          console.log('Turnstile准备交互');
        },
        theme,
        size,
        action,
        cData,
        retry,
        'retry-interval': retryInterval,
        'refresh-expired': refreshExpired,
        appearance,
        execution
      });

      setWidgetId(id);
      setIsLoading(false);
      onLoad?.();
      
      console.log('Turnstile组件渲染成功, Widget ID:', id);
    } catch (error) {
      handleError(`渲染失败: ${error.message}`);
    }
  }, [
    siteKey, handleSuccess, handleError, handleExpired, onLoad,
    theme, size, action, cData, retry, retryInterval, 
    refreshExpired, appearance, execution, scriptLoaded, widgetId
  ]);

  // 加载Turnstile脚本
  useEffect(() => {
    // 检查脚本是否已加载
    if (document.querySelector('script[src*="turnstile"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    // 设置全局回调
    window.onloadTurnstileCallback = () => {
      console.log('Turnstile脚本加载完成');
      setScriptLoaded(true);
    };

    script.onload = () => {
      if (window.turnstile) {
        console.log('Turnstile API可用');
        setScriptLoaded(true);
      }
    };

    script.onerror = () => {
      handleError('Turnstile脚本加载失败');
    };

    document.head.appendChild(script);

    return () => {
      // 清理
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.warn('清理Turnstile widget失败:', e);
        }
      }
      
      // 移除脚本
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      // 清理全局回调
      delete window.onloadTurnstileCallback;
    };
  }, []);

  // 当脚本加载完成时渲染组件
  useEffect(() => {
    if (scriptLoaded) {
      renderTurnstile();
    }
  }, [scriptLoaded, renderTurnstile]);

  // 重置方法
  const reset = useCallback(() => {
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
        setError(null);
        setIsLoading(true);
        console.log('Turnstile已重置');
      } catch (error) {
        handleError(`重置失败: ${error.message}`);
      }
    }
  }, [widgetId, handleError]);

  // 执行验证方法
  const execute = useCallback(() => {
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.execute(widgetId);
        console.log('Turnstile执行验证');
      } catch (error) {
        handleError(`执行失败: ${error.message}`);
      }
    }
  }, [widgetId, handleError]);

  // 获取响应token
  const getResponse = useCallback((): string | null => {
    if (widgetId && window.turnstile) {
      try {
        return window.turnstile.getResponse(widgetId);
      } catch (error) {
        handleError(`获取响应失败: ${error.message}`);
        return null;
      }
    }
    return null;
  }, [widgetId, handleError]);

  // 检查是否过期
  const isExpired = useCallback((): boolean => {
    if (widgetId && window.turnstile) {
      try {
        return window.turnstile.isExpired(widgetId);
      } catch (error) {
        handleError(`检查过期状态失败: ${error.message}`);
        return true;
      }
    }
    return true;
  }, [widgetId, handleError]);

  // 暴露方法给父组件
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    reset,
    execute,
    getResponse,
    isExpired
  }));

  return (
    <div className={className} style={style}>
      {error && (
        <Alert
          message="验证错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
          action={
            <button 
              onClick={reset}
              style={{
                background: 'none',
                border: 'none',
                color: '#1890ff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              重试
            </button>
          }
        />
      )}
      
      {isLoading && !error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          border: '1px dashed #d9d9d9',
          borderRadius: '6px',
          background: '#fafafa'
        }}>
          <Spin size="small" />
          <span style={{ marginLeft: 8, color: '#666' }}>
            正在加载安全验证...
          </span>
        </div>
      )}
      
      <div 
        ref={turnstileRef}
        style={{ 
          minHeight: isLoading ? 0 : '65px',
          display: isLoading ? 'none' : 'block'
        }}
      />
    </div>
  );
};

export default TurnstileVerification;

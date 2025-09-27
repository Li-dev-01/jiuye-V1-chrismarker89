/**
 * Google OAuth登录按钮组件
 * 支持问卷用户的便捷注册和管理员的白名单登录
 */

import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { googleOAuthService, type GoogleUser } from '../../services/googleOAuthService';

interface GoogleLoginButtonProps {
  /** 登录类型：问卷用户 或 管理员 */
  userType: 'questionnaire' | 'management';
  /** 登录成功回调 */
  onSuccess?: (userData: any) => void;
  /** 登录失败回调 */
  onError?: (error: string) => void;
  /** 按钮样式 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 按钮大小 */
  size?: 'large' | 'middle' | 'small';
  /** 是否块级按钮 */
  block?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  userType,
  onSuccess,
  onError,
  type = 'default',
  size = 'middle',
  block = false,
  style,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // 检查Google OAuth是否可用
  useEffect(() => {
    setIsAvailable(googleOAuthService.isAvailable());
  }, []);

  const handleGoogleLogin = async () => {
    if (!isAvailable) {
      message.warning('Google登录功能暂未配置，请联系管理员');
      return;
    }

    setIsLoading(true);

    try {
      // 保存用户类型到sessionStorage，回调时使用
      sessionStorage.setItem('google_oauth_user_type', userType);

      // 执行Google OAuth登录（重定向方式），传递用户类型以使用对应的回调URL
      await googleOAuthService.signIn(userType);

    } catch (error) {
      console.error('Google登录失败:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google登录失败';

      // 如果是重定向消息，不显示错误
      if (!errorMessage.includes('Redirecting')) {
        message.error(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireUserLogin = async (googleUser: GoogleUser) => {
    message.info('正在创建您的匿名身份...');

    // 调用后端API创建半匿名用户
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/questionnaire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        googleUser: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          id: googleUser.id
        },
        userType: 'semi_anonymous',
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      message.success('Google登录成功！已自动创建您的匿名身份');
      onSuccess?.(result.data);
    } else {
      const error = await response.json();
      throw new Error(error.message || '服务器处理Google登录失败');
    }
  };

  const handleManagementUserLogin = async (googleUser: GoogleUser) => {
    message.info('正在验证管理员权限...');

    // 调用后端API验证白名单
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        googleUser: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          id: googleUser.id
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      message.success(`欢迎，${result.data.role}！`);
      onSuccess?.(result.data);
    } else {
      const error = await response.json();
      throw new Error(error.message || '您的邮箱不在管理员白名单中');
    }
  };

  const getButtonText = () => {
    if (!isAvailable) {
      return 'Google登录未配置';
    }

    if (isLoading) {
      return userType === 'questionnaire' ? '正在登录...' : '正在验证...';
    }

    return userType === 'questionnaire'
      ? 'Google 一键注册'
      : 'Google 管理员登录';
  };

  return (
    <Button
      type={type}
      size={size}
      block={block}
      loading={isLoading}
      disabled={!isAvailable}
      onClick={handleGoogleLogin}
      icon={!isLoading ? <GoogleOutlined /> : undefined}
      style={style}
      className={className}
    >
      {getButtonText()}
    </Button>
  );
};

export default GoogleLoginButton;

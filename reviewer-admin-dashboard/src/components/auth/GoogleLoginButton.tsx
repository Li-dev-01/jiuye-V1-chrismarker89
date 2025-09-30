/**
 * Google OAuth登录按钮组件
 * 用于审核员、管理员、超级管理员的Google登录
 */

import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

interface GoogleLoginButtonProps {
  /** 用户类型：审核员、管理员、超级管理员 */
  userType: 'reviewer' | 'admin' | 'super_admin';
  /** 登录成功回调 */
  onSuccess?: (userData: any) => void;
  /** 登录失败回调 */
  onError?: (error: string) => void;
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 按钮大小 */
  size?: 'large' | 'middle' | 'small';
  /** 是否块级按钮 */
  block?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 按钮文本 */
  children?: React.ReactNode;
}

// Google OAuth配置
const GOOGLE_CLIENT_ID = '23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com';

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  userType,
  onSuccess,
  onError,
  type = 'default',
  size = 'middle',
  block = false,
  style,
  className,
  children
}) => {
  const handleGoogleLogin = () => {
    try {
      // 生成state参数（包含角色信息）
      const state = btoa(JSON.stringify({
        role: userType,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2)
      }));
      
      // 保存state到sessionStorage用于验证
      sessionStorage.setItem('google_oauth_state', state);
      sessionStorage.setItem('google_oauth_role', userType);
      
      // 构建回调URL
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      // 构建Google OAuth授权URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'select_account');
      
      console.log('[GoogleLoginButton] 🚀 Redirecting to Google OAuth:', {
        userType,
        redirectUri,
        state: state.substring(0, 20) + '...'
      });
      
      // 重定向到Google OAuth授权页面
      window.location.href = authUrl.toString();
      
    } catch (error) {
      console.error('[GoogleLoginButton] ❌ Error initiating Google login:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : '启动Google登录失败');
      }
    }
  };
  
  return (
    <Button
      icon={<GoogleOutlined />}
      onClick={handleGoogleLogin}
      type={type}
      size={size}
      block={block}
      style={style}
      className={className}
    >
      {children || '使用 Google 账号登录'}
    </Button>
  );
};

export default GoogleLoginButton;


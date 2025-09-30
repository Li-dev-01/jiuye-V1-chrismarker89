/**
 * Google OAuth回调处理页面
 * 处理Google OAuth登录后的回调
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../stores/superAdminAuthStore';

const { Text } = Typography;

const GoogleOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // 获取所有 auth stores
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // 获取URL参数
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // 检查是否有错误
      if (error) {
        setStatus('error');
        setErrorMessage(`Google登录失败: ${error}`);
        return;
      }

      // 检查必要参数
      if (!code || !state) {
        setStatus('error');
        setErrorMessage('缺少必要的OAuth参数');
        return;
      }

      // 验证state
      const savedState = sessionStorage.getItem('google_oauth_state');
      if (state !== savedState) {
        setStatus('error');
        setErrorMessage('State验证失败，可能存在安全风险');
        return;
      }

      // 解析state获取角色信息
      const stateData = JSON.parse(atob(state));
      const role = stateData.role || 'reviewer';

      console.log('[GoogleOAuthCallback] 🔄 Processing OAuth callback:', {
        role,
        code: code.substring(0, 20) + '...',
        redirectUri: `${window.location.origin}/auth/google/callback`
      });

      // 调用后端API交换token（新的邮箱与角色账号API）
      const apiUrl = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api/auth/email-role/google/callback';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/auth/google/callback`,
          role // 传递用户选择的角色
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[GoogleOAuthCallback] ❌ API error:', errorData);
        throw new Error(errorData.message || '登录失败，您的邮箱可能不在白名单中');
      }

      const data = await response.json();
      console.log('[GoogleOAuthCallback] ✅ API response:', data);

      // 检查返回的数据结构
      if (!data.success || !data.data) {
        throw new Error('登录响应数据格式错误');
      }

      const userData = data.data.user;
      const sessionData = data.data.session;

      // 使用返回的角色（已经是用户选择的角色）
      const actualRole = userData.role;

      console.log('[GoogleOAuthCallback] 📝 Saving auth data:', {
        actualRole,
        accountId: userData.accountId,
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName
      });

      // 根据角色保存认证信息到localStorage
      const tokenKey = actualRole === 'reviewer' ? 'reviewer_token' :
                       actualRole === 'admin' ? 'admin_token' :
                       'super_admin_token';

      // 使用 sessionId 作为 token
      const token = sessionData.sessionId;

      localStorage.setItem(tokenKey, token);

      const userInfo = {
        id: userData.accountId, // 使用 accountId 作为 id
        accountId: userData.accountId,
        email: userData.email,
        username: userData.username,
        role: actualRole,
        userType: actualRole,
        displayName: userData.displayName,
        permissions: userData.permissions,
        googleLinked: userData.googleLinked
      };

      localStorage.setItem(`${actualRole}_user`, JSON.stringify(userInfo));

      console.log('[GoogleOAuthCallback] 🔄 Updating Zustand store state...');

      // ✅ 关键修复：直接更新对应的 Zustand store 状态
      if (actualRole === 'reviewer') {
        reviewerAuth.setAuthState({
          user: userInfo,
          token: token,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('[GoogleOAuthCallback] ✅ Updated reviewerAuth store');
      } else if (actualRole === 'admin') {
        adminAuth.setAuthState({
          user: userInfo,
          token: token,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('[GoogleOAuthCallback] ✅ Updated adminAuth store');
      } else if (actualRole === 'super_admin') {
        superAdminAuth.setAuthState({
          user: userInfo,
          token: token,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('[GoogleOAuthCallback] ✅ Updated superAdminAuth store');
      }

      // 清理session storage
      sessionStorage.removeItem('google_oauth_state');
      sessionStorage.removeItem('google_oauth_role');

      setStatus('success');

      // 延迟跳转到对应的仪表板
      setTimeout(() => {
        switch (actualRole) {
          case 'reviewer':
            navigate('/dashboard', { replace: true });
            break;
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'super_admin':
            navigate('/admin/super', { replace: true });
            break;
          default:
            navigate('/login', { replace: true });
        }
      }, 1500);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || '处理OAuth回调时发生错误');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />}
          size="large"
        />
        <Text style={{ color: '#fff', marginTop: '24px', fontSize: '16px' }}>
          正在处理Google登录...
        </Text>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Result
          status="success"
          title="登录成功！"
          subTitle="正在跳转到您的仪表板..."
          style={{ background: '#fff', borderRadius: '12px', padding: '48px' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Result
        status="error"
        title="登录失败"
        subTitle={errorMessage}
        extra={
          <a href="/login" style={{ color: '#1890ff' }}>
            返回登录页面
          </a>
        }
        style={{ background: '#fff', borderRadius: '12px', padding: '48px' }}
      />
    </div>
  );
};

export default GoogleOAuthCallback;


/**
 * Google OAuth回调处理页面
 * 处理Google登录后的重定向和用户信息处理
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Space } from 'antd';
import { GoogleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { googleOAuthService } from '../../services/googleOAuthService';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';

const { Title, Text } = Typography;

interface CallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  userInfo?: any;
}

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginSemiAnonymous } = useUniversalAuthStore();
  
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: '正在处理Google登录...'
  });

  useEffect(() => {
    handleCallback();
  }, []);

  const handleQuestionnaireCallback = async (code: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/google/callback`,
        userType: 'questionnaire'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '问卷用户登录失败');
    }

    return await response.json();
  };

  const handleManagementCallback = async (code: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/google/callback`,
        userType: 'management'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '管理员登录失败');
    }

    return await response.json();
  };

  const handleCallback = async () => {
    try {
      // 获取URL参数
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const urlState = searchParams.get('state');

      if (error) {
        setState({
          status: 'error',
          message: `Google登录失败: ${error}`
        });
        return;
      }

      if (!code) {
        setState({
          status: 'error',
          message: '未收到Google授权码'
        });
        return;
      }

      // 验证state参数
      const savedState = sessionStorage.getItem('google_oauth_state');
      if (urlState !== savedState) {
        setState({
          status: 'error',
          message: '安全验证失败，请重新登录'
        });
        return;
      }

      // 获取用户类型
      const userType = sessionStorage.getItem('google_oauth_user_type') || 'questionnaire';

      setState({
        status: 'loading',
        message: userType === 'questionnaire' ? '正在创建您的匿名身份...' : '正在验证管理员权限...'
      });

      // 根据用户类型调用不同的后端API
      let response;
      if (userType === 'questionnaire') {
        response = await handleQuestionnaireCallback(code);
      } else {
        response = await handleManagementCallback(code);
      }

      // 更新认证状态
      if (userType === 'questionnaire') {
        loginSemiAnonymous(response.user);
      }

      setState({
        status: 'success',
        message: userType === 'questionnaire' ? 'Google登录成功！已创建您的匿名身份' : `欢迎，${response.user.role}！`,
        userInfo: response.user
      });

      // 延迟跳转
      setTimeout(() => {
        if (userType === 'management') {
          navigate('/management-portal');
        } else {
          navigate('/');
        }
        // 清理临时存储
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_user_type');
      }, 2000);

    } catch (error) {
      console.error('Google callback error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Google登录处理失败'
      });
    }
  };

  const handleRetry = () => {
    navigate('/auth/login');
  };

  const getIcon = () => {
    switch (state.status) {
      case 'loading':
        return <Spin size="large" />;
      case 'success':
        return <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
    }
  };

  const getAlertType = () => {
    switch (state.status) {
      case 'loading':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{
          width: 400,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
        bordered={false}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 图标 */}
          <div>
            {getIcon()}
          </div>

          {/* 标题 */}
          <Title level={3} style={{ margin: 0 }}>
            <GoogleOutlined style={{ marginRight: 8 }} />
            Google 登录
          </Title>

          {/* 状态信息 */}
          <Alert
            message={state.message}
            type={getAlertType()}
            showIcon
            style={{ textAlign: 'left' }}
          />

          {/* 用户信息（成功时显示） */}
          {state.status === 'success' && state.userInfo && (
            <div style={{ textAlign: 'left' }}>
              <Text strong>登录用户：</Text>
              <br />
              <Text>{state.userInfo.name}</Text>
              <br />
              <Text type="secondary">{state.userInfo.email}</Text>
            </div>
          )}

          {/* 错误时的重试按钮 */}
          {state.status === 'error' && (
            <div>
              <button
                onClick={handleRetry}
                style={{
                  padding: '8px 16px',
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                返回登录页面
              </button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

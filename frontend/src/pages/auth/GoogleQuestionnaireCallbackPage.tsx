/**
 * Google OAuth问卷用户回调处理页面
 * 专门处理问卷用户的Google登录回调
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Space, message } from 'antd';
import { GoogleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';

const { Title, Text } = Typography;

interface CallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  userInfo?: any;
}

export const GoogleQuestionnaireCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginSemiAnonymous } = useUniversalAuthStore();
  
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: '正在处理Google登录，创建您的匿名身份...'
  });

  useEffect(() => {
    handleCallback();
  }, []);

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

      setState({
        status: 'loading',
        message: '正在创建您的匿名身份...'
      });

      // 调用Google OAuth回调API处理授权码交换
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/auth/google/callback/questionnaire`,
          userType: 'questionnaire'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '问卷用户登录失败');
      }

      const result = await response.json();

      // 更新认证状态
      await loginSemiAnonymous(result.data.identityA, result.data.identityB);

      setState({
        status: 'success',
        message: 'Google登录成功！已创建您的匿名身份，即将跳转到首页...',
        userInfo: result.data
      });

      message.success('Google登录成功！');

      // 延迟跳转到首页
      setTimeout(() => {
        navigate('/', { replace: true });
        // 清理临时存储
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_user_type');
      }, 2000);

    } catch (error) {
      console.error('Google questionnaire callback error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Google登录处理失败'
      });
    }
  };

  const handleRetry = () => {
    navigate('/');
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
            问卷用户登录
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
              <Text strong>匿名身份已创建：</Text>
              <br />
              <Text>身份标识：{state.userInfo.anonymousId}</Text>
              <br />
              <Text type="secondary">您的Google账号信息已安全加密</Text>
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
                返回首页
              </button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default GoogleQuestionnaireCallbackPage;

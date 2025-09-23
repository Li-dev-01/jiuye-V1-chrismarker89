/**
 * Google OAuth管理员回调处理页面
 * 专门处理管理员的Google登录回调
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Space, message } from 'antd';
import { GoogleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CrownOutlined } from '@ant-design/icons';
import { useManagementAuthStore } from '../../stores/managementAuthStore';

const { Title, Text } = Typography;

interface CallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  userInfo?: any;
}

export const GoogleManagementCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useManagementAuthStore();
  
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: '正在验证管理员权限...'
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
        message: '正在验证管理员权限...'
      });

      // 调用Google OAuth回调API处理授权码交换
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/auth/google/callback/management`,
          userType: 'management'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '您的邮箱不在管理员白名单中');
      }

      const result = await response.json();

      // 更新管理员认证状态
      setUser(result.data);

      setState({
        status: 'success',
        message: `欢迎，${result.data.role}！即将跳转到管理后台...`,
        userInfo: result.data
      });

      message.success(`欢迎，${result.data.role}！`);

      // 根据角色跳转到对应页面
      setTimeout(() => {
        const redirectPath = result.data.role === 'super_admin' ? '/admin' :
                           result.data.role === 'admin' ? '/admin' : '/reviewer/dashboard';
        navigate(redirectPath, { replace: true });
        
        // 清理临时存储
        sessionStorage.removeItem('google_oauth_state');
        sessionStorage.removeItem('google_oauth_user_type');
      }, 2000);

    } catch (error) {
      console.error('Google management callback error:', error);
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '管理员登录处理失败'
      });
    }
  };

  const handleRetry = () => {
    navigate('/admin/login');
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '👑';
      case 'admin':
        return '🛡️';
      case 'reviewer':
        return '👨‍💼';
      default:
        return '👤';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员';
      case 'admin':
        return '管理员';
      case 'reviewer':
        return '审核员';
      default:
        return '用户';
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
            <CrownOutlined style={{ marginRight: 8 }} />
            管理员登录
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
              <Text strong>登录成功：</Text>
              <br />
              <Text>
                {getRoleIcon(state.userInfo.role)} {getRoleName(state.userInfo.role)}
              </Text>
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
                返回管理员登录
              </button>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default GoogleManagementCallbackPage;

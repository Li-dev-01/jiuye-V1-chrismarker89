/**
 * 超级管理员专用登录页面
 * 与普通管理员登录完全分离，使用独立的token和存储
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert, Divider } from 'antd';
import { CrownOutlined, LockOutlined, SafetyOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSuperAdminAuthStore } from '../stores/superAdminAuthStore';
import type { LoginCredentials } from '../types';

const { Title, Text } = Typography;

const SuperAdminLoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useSuperAdminAuthStore();

  // 如果已经登录，重定向到超级管理员控制台
  useEffect(() => {
    if (isAuthenticated && user?.role === 'super_admin') {
      console.log(`[SUPER_ADMIN_LOGIN] ✅ Already logged in as super admin, redirecting...`);
      navigate('/admin/super', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values: LoginCredentials) => {
    console.log(`[SUPER_ADMIN_LOGIN] 🚀 Login attempt: ${values.username}`);
    setLoading(true);
    setError(null);

    try {
      await login(values, 'super_admin');
      
      // 验证用户角色
      const currentUser = useSuperAdminAuthStore.getState().user;
      if (currentUser?.role === 'super_admin') {
        console.log(`[SUPER_ADMIN_LOGIN] ✅ Super admin login successful: ${currentUser.username}`);
        navigate('/admin/super');
      } else {
        console.error(`[SUPER_ADMIN_LOGIN] ❌ Role verification failed:`, currentUser);
        setError('您没有超级管理员权限，请使用正确的超级管理员账号登录');
        useSuperAdminAuthStore.getState().logout();
      }
    } catch (error: any) {
      console.error('[SUPER_ADMIN_LOGIN] ❌ Login error:', error);
      setError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await login(
        { username: 'superadmin', password: 'admin123' },
        'super_admin'
      );

      const currentUser = useSuperAdminAuthStore.getState().user;
      if (currentUser?.role === 'super_admin') {
        console.log(`[SUPER_ADMIN_LOGIN] ✅ Quick login successful: ${currentUser.username}`);
        navigate('/admin/super');
      } else {
        setError('超级管理员权限验证失败');
        useSuperAdminAuthStore.getState().logout();
      }
    } catch (error: any) {
      console.error('Super admin quick login error:', error);
      setError(error.message || '一键登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff3838 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '420px',
          boxShadow: '0 12px 48px rgba(255, 107, 107, 0.3)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            <CrownOutlined />
          </div>
          <Title level={2} style={{ 
            margin: 0, 
            color: '#ff4757',
            fontWeight: 'bold'
          }}>
            超级管理员控制台
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            <SafetyOutlined /> 最高权限安全登录
          </Text>
        </div>

        {error && (
          <Alert
            message="登录失败"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="super_admin_login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="超级管理员账号"
            rules={[{ required: true, message: '请输入超级管理员账号' }]}
          >
            <Input 
              prefix={<CrownOutlined style={{ color: '#ff6b6b' }} />}
              placeholder="请输入超级管理员账号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#ff6b6b' }} />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                border: 'none',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? '验证中...' : '安全登录'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>快速登录</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            onClick={quickLogin}
            loading={loading}
            block
            size="large"
            style={{
              background: 'linear-gradient(135deg, #ff9ff3, #f368e0)',
              border: 'none',
              color: 'white',
              height: '44px',
              fontWeight: 'bold'
            }}
            icon={<SecurityScanOutlined />}
          >
            超级管理员一键登录
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <LockOutlined /> 超级管理员拥有系统最高权限，请谨慎操作
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Button 
              type="link" 
              onClick={() => navigate('/admin/login')}
              style={{ color: '#ff6b6b' }}
            >
              返回普通管理员登录
            </Button>
          </div>
        </Space>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: 'rgba(255, 107, 107, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 107, 107, 0.2)'
        }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            <SafetyOutlined style={{ color: '#ff6b6b', marginRight: '4px' }} />
            超级管理员功能包括：安全控制台、紧急控制、项目管理、威胁分析等
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminLoginPage;

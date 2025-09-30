/**
 * 统一登录页面
 * 支持审核员、管理员、超级管理员三种角色的登录
 * 支持账号密码登录和Google OAuth登录
 */

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, Typography, Space, Alert, Divider, message } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  ToolOutlined, 
  CrownOutlined,
  GoogleOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../stores/superAdminAuthStore';
import type { LoginCredentials } from '../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

type UserRole = 'reviewer' | 'admin' | 'super_admin';

const UnifiedLoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>('reviewer');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 三个独立的认证store
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  // 根据当前tab获取对应的auth store
  const getCurrentAuth = () => {
    switch (activeTab) {
      case 'reviewer':
        return reviewerAuth;
      case 'admin':
        return adminAuth;
      case 'super_admin':
        return superAdminAuth;
      default:
        return reviewerAuth;
    }
  };

  // 检查是否已登录
  useEffect(() => {
    const auth = getCurrentAuth();
    if (auth.isAuthenticated && auth.user) {
      redirectToDashboard(activeTab);
    }
  }, [activeTab]);

  // 重定向到对应的仪表板
  const redirectToDashboard = (role: UserRole) => {
    switch (role) {
      case 'reviewer':
        navigate('/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'super_admin':
        navigate('/admin/super', { replace: true });
        break;
    }
  };

  // 账号密码登录
  const handlePasswordLogin = async (values: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      // 根据activeTab调用对应的login方法，并获取返回的用户数据
      let currentUser: any;
      let auth: any;

      if (activeTab === 'reviewer') {
        currentUser = await reviewerAuth.login(values, 'reviewer');
        auth = reviewerAuth;
      } else if (activeTab === 'admin') {
        currentUser = await adminAuth.login(values, 'admin');
        auth = adminAuth;
      } else if (activeTab === 'super_admin') {
        currentUser = await superAdminAuth.login(values, 'super_admin');
        auth = superAdminAuth;
      } else {
        throw new Error('未知的用户类型');
      }

      console.log('[LOGIN] 登录成功，完整用户对象:', currentUser);
      console.log('[LOGIN] 用户信息详情:', {
        username: currentUser?.username,
        role: currentUser?.role,
        userType: currentUser?.userType,
        activeTab,
        'typeof role': typeof currentUser?.role,
        'typeof userType': typeof currentUser?.userType,
        'typeof activeTab': typeof activeTab
      });

      // 检查是否需要2FA
      if (currentUser?.twoFactorEnabled) {
        setShow2FA(true);
        message.info('请输入双因素认证码');
        return;
      }

      // 验证角色 - 放宽验证逻辑，允许角色匹配
      const userRole = currentUser?.role;
      const userType = currentUser?.userType;

      console.log('[LOGIN] 角色验证开始:', {
        userRole,
        userType,
        activeTab,
        'userRole === activeTab': userRole === activeTab,
        'userType === activeTab': userType === activeTab
      });

      // 检查角色是否匹配（支持多种格式）
      const roleMatches =
        userRole === activeTab ||
        userType === activeTab ||
        (activeTab === 'admin' && (userRole === 'admin' || userType === 'admin')) ||
        (activeTab === 'reviewer' && (userRole === 'reviewer' || userType === 'reviewer')) ||
        (activeTab === 'super_admin' && (userRole === 'super_admin' || userType === 'super_admin'));

      console.log('[LOGIN] 角色匹配结果:', roleMatches);

      if (roleMatches) {
        message.success('登录成功');
        redirectToDashboard(activeTab);
      } else {
        console.error('角色验证失败:', { userRole, userType, activeTab, currentUser });
        setError(`角色验证失败，请使用正确的登录入口。当前角色: ${userRole || userType}`);
        auth.logout();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth登录
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建Google OAuth URL
      const clientId = '23546164414-3t3g8n9hvnv4ekjok90co2sm3sfb6mt8.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'email profile';
      const state = btoa(JSON.stringify({ role: activeTab, timestamp: Date.now() }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=select_account`;

      // 保存state用于验证
      sessionStorage.setItem('google_oauth_state', state);
      sessionStorage.setItem('google_oauth_role', activeTab);

      // 重定向到Google OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      setError('Google登录失败，请稍后重试');
      setLoading(false);
    }
  };

  // 2FA验证
  const handle2FAVerification = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用2FA验证API
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: twoFactorCode,
          role: activeTab
        })
      });

      if (response.ok) {
        message.success('验证成功');
        redirectToDashboard(activeTab);
      } else {
        message.error('验证码错误');
      }
    } catch (error) {
      message.error('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 快速登录（测试用）
  const quickLogin = async () => {
    const testAccounts = {
      reviewer: { username: 'reviewerA', password: 'admin123' },
      admin: { username: 'admin', password: 'admin123' },
      super_admin: { username: 'superadmin', password: 'admin123' }
    };

    form.setFieldsValue(testAccounts[activeTab]);
    await handlePasswordLogin(testAccounts[activeTab]);
  };

  // Tab配置
  const tabConfig = {
    reviewer: {
      icon: <UserOutlined />,
      title: '审核员',
      description: '内容审核和管理',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    admin: {
      icon: <ToolOutlined />,
      title: '管理员',
      description: '技术管理和系统维护',
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #74b9ff, #0984e3)'
    },
    super_admin: {
      icon: <CrownOutlined />,
      title: '超级管理员',
      description: '系统最高权限管理',
      color: '#f368e0',
      gradient: 'linear-gradient(135deg, #ff9ff3, #f368e0)'
    }
  };

  const currentConfig = tabConfig[activeTab];

  // 如果需要2FA验证
  if (show2FA) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: currentConfig.gradient,
        padding: '20px'
      }}>
        <Card style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: currentConfig.color }}>
              <SafetyOutlined />
            </div>
            <Title level={2}>双因素认证</Title>
            <Text type="secondary">请输入您的6位验证码</Text>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Input
              size="large"
              placeholder="000000"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handle2FAVerification}
            >
              验证
            </Button>

            <Button
              type="link"
              block
              onClick={() => {
                setShow2FA(false);
                setTwoFactorCode('');
                getCurrentAuth().logout();
              }}
            >
              返回登录
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            注册/登录
          </Title>
          <Text type="secondary">大学生就业调研系统</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as UserRole);
            setError(null);
            form.resetFields();
          }}
          centered
          size="large"
          style={{ marginBottom: '16px' }}
        >
          <TabPane
            tab={
              <span style={{ fontSize: '15px', fontWeight: 500 }}>
                {tabConfig.reviewer.icon} 审核员
              </span>
            }
            key="reviewer"
          />
          <TabPane
            tab={
              <span style={{ fontSize: '15px', fontWeight: 500 }}>
                {tabConfig.admin.icon} 管理员
              </span>
            }
            key="admin"
          />
          <TabPane
            tab={
              <span style={{ fontSize: '15px', fontWeight: 500 }}>
                {tabConfig.super_admin.icon} 超级管理员
              </span>
            }
            key="super_admin"
          />
        </Tabs>

        <div>
          {error && (
            <Alert
              message={error}
              type="error"
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* 账号密码登录表单 */}
          <Form
            form={form}
            onFinish={handlePasswordLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="账号"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入账号"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: '44px',
                  fontWeight: 'bold',
                  background: currentConfig.color,
                  borderColor: currentConfig.color
                }}
              >
                确认登录
              </Button>
            </Form.Item>
          </Form>

          {/* Google OAuth登录 */}
          <Button
            size="large"
            block
            icon={<GoogleOutlined />}
            onClick={handleGoogleLogin}
            loading={loading}
            style={{
              marginBottom: '12px',
              height: '44px',
              fontWeight: 'bold',
              borderColor: '#4285f4',
              color: '#4285f4'
            }}
          >
            Google登录
          </Button>

          {/* 自动登录（调试用） - 开发调试阶段保留 */}
          <Button
            size="large"
            block
            onClick={quickLogin}
            loading={loading}
            style={{
              marginBottom: '16px',
              height: '44px',
              fontWeight: 'bold',
              background: '#f093fb',
              borderColor: '#f093fb',
              color: 'white'
            }}
          >
            🔧 自动登录（调试）
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <LockOutlined /> 使用Gmail白名单严格限制登录权限
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnifiedLoginPage;


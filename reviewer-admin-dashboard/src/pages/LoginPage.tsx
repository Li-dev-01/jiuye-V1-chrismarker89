import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LoginCredentials } from '../types';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, user, checkAuth } = useAuthStore();
  const [form] = Form.useForm();

  // 如果已经登录，根据角色重定向到对应仪表板
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.userType === 'admin' || user.userType === 'super_admin';

      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const onFinish = async (values: LoginCredentials) => {
    try {
      await login(values, 'reviewer'); // 明确指定为审核员登录
      message.success('登录成功');

      console.log('[LOGIN_PAGE] Login successful, getting current user state');

      // 登录成功后直接获取用户信息并重定向
      const currentUser = useAuthStore.getState().user;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      console.log('[LOGIN_PAGE] Current auth state:', { isAuthenticated, user: currentUser });

      if (isAuthenticated && currentUser) {
        // 验证用户角色 - 审核员登录页面只允许审核员
        if (currentUser.role === 'reviewer') {
          console.log(`[LOGIN_PAGE] Reviewer login successful: ${currentUser.username}`);
          // 重定向到之前访问的页面或审核员仪表板
          const from = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
          message.warning('管理员请使用管理员登录入口');
          useAuthStore.getState().logout();
          navigate('/admin/login');
        } else {
          message.error('您没有审核员权限');
          useAuthStore.getState().logout();
        }
      } else {
        console.error('[LOGIN_PAGE] Login successful but auth state not updated properly');
        message.error('登录状态异常，请重试');
      }
    } catch (error: any) {
      console.error('[LOGIN_PAGE] Login error:', error);
      const errorMessage = error.response?.data?.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    }
  };

  // 预填充测试账号
  const fillTestAccount = () => {
    form.setFieldsValue({
      username: 'reviewerA',
      password: 'admin123'
    });
  };

  const quickLogin = async () => {
    try {
      await login({ username: 'reviewerA', password: 'admin123' }, 'reviewer');
      message.success('一键登录成功');

      console.log('[LOGIN_PAGE] Quick login successful, getting current user state');

      // 登录成功后直接获取用户信息并重定向
      const currentUser = useAuthStore.getState().user;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;

      console.log('[LOGIN_PAGE] Quick login auth state:', { isAuthenticated, user: currentUser });

      if (isAuthenticated && currentUser) {
        // 验证用户角色 - 审核员登录页面只允许审核员
        if (currentUser.role === 'reviewer') {
          console.log(`[LOGIN_PAGE] Quick reviewer login successful: ${currentUser.username}`);
          navigate('/dashboard');
        } else if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
          message.warning('管理员请使用管理员登录入口');
          useAuthStore.getState().logout();
          navigate('/admin/login');
        } else {
          message.error('您没有审核员权限');
          useAuthStore.getState().logout();
        }
      } else {
        console.error('[LOGIN_PAGE] Quick login successful but auth state not updated properly');
        message.error('登录状态异常，请重试');
      }
    } catch (error: any) {
      console.error('[LOGIN_PAGE] Quick login error:', error);
      const errorMessage = error.response?.data?.message || '一键登录失败';
      message.error(errorMessage);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            审核员登录
          </Title>
          <Text type="secondary">
            大学生就业调研系统 - 内容审核管理
          </Text>
        </div>

        <Spin spinning={isLoading}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入审核员用户名" 
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请输入密码" 
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ width: '100%' }}
                loading={isLoading}
              >
                登录
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="link"
                onClick={fillTestAccount}
                style={{ width: '100%', padding: 0 }}
              >
                使用测试账号 (reviewerA / admin123)
              </Button>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                ghost
                onClick={quickLogin}
                loading={isLoading}
                style={{ width: '100%' }}
              >
                一键登录（调试用）
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 6,
          fontSize: '12px',
          color: '#666'
        }}>
          <Text type="secondary">
            <strong>测试说明：</strong><br />
            • 用户名：reviewerA<br />
            • 密码：admin123<br />
            • 这是独立前端MVP验证版本
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type="link"
            onClick={() => navigate('/admin/login')}
            style={{ fontSize: '12px' }}
          >
            管理员登录入口
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;

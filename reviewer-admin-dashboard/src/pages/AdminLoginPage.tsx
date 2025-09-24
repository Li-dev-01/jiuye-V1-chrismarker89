import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { LoginCredentials } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminLoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuthStore();

  // 如果已经登录，根据角色重定向到对应仪表板
  useEffect(() => {
    const logData = {
      isAuthenticated,
      user: user?.username,
      role: user?.role,
      userType: user?.userType,
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    };

    console.log(`[ADMIN_LOGIN] 🔄 useEffect triggered:`, logData);

    // 持久化日志到localStorage
    const existingLogs = JSON.parse(localStorage.getItem('admin_login_debug_logs') || '[]');
    existingLogs.push({
      type: 'useEffect_triggered',
      data: logData
    });
    localStorage.setItem('admin_login_debug_logs', JSON.stringify(existingLogs.slice(-20))); // 保留最近20条

    if (isAuthenticated && user) {
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.userType === 'admin' || user.userType === 'super_admin';
      console.log(`[ADMIN_LOGIN] 👤 User check: role=${user.role}, userType=${user.userType}, isAdmin=${isAdmin}`);

      if (isAdmin) {
        console.log(`[ADMIN_LOGIN] ✅ Already logged in as admin, DELAYING redirect to capture logs...`);

        // 延迟重定向以捕获更多日志
        setTimeout(() => {
          console.log(`[ADMIN_LOGIN] 🔄 Now redirecting to admin dashboard`);
          navigate('/admin/dashboard', { replace: true });
        }, 2000); // 延迟2秒
      } else {
        console.log(`[ADMIN_LOGIN] ❌ User is not admin (role: ${user.role}, userType: ${user.userType}), clearing login`);
        // 如果不是管理员，清除登录状态
        useAuthStore.getState().logout();
        setError('您没有管理员权限，请使用正确的管理员账号登录');
      }
    } else {
      console.log(`[ADMIN_LOGIN] ⏳ Not ready for redirect: isAuthenticated=${isAuthenticated}, hasUser=${!!user}`);
    }
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values: LoginCredentials & { userType: 'admin' | 'super_admin' }) => {
    const startTime = Date.now();
    console.log(`[ADMIN_LOGIN] 🚀 onFinish START:`, {
      username: values.username,
      userType: values.userType,
      timestamp: new Date().toISOString()
    });

    // 清空之前的调试日志
    localStorage.removeItem('admin_login_debug_logs');

    setLoading(true);
    setError(null);

    try {
      console.log(`[ADMIN_LOGIN] 📡 Calling login function...`);
      await login(
        { username: values.username, password: values.password },
        values.userType
      );

      console.log(`[ADMIN_LOGIN] ✅ Login function completed, checking auth state...`);

      // 验证用户角色
      const authState = useAuthStore.getState();
      const currentUser = authState.user;

      const authStateLog = {
        isAuthenticated: authState.isAuthenticated,
        user: currentUser?.username,
        role: currentUser?.role,
        userType: currentUser?.userType,
        hasToken: !!authState.token,
        tokenLength: authState.token?.length,
        timestamp: new Date().toISOString()
      };

      console.log(`[ADMIN_LOGIN] 📋 Current auth state:`, authStateLog);

      // 持久化关键状态
      localStorage.setItem('admin_login_final_state', JSON.stringify(authStateLog));

      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
        console.log(`[ADMIN_LOGIN] ✅ Login successful: ${currentUser.username}, role: ${currentUser.role}`);
        console.log(`[ADMIN_LOGIN] ⏱️ DELAYING navigation to capture more logs... (3 seconds)`);

        // 延迟导航以捕获更多日志
        setTimeout(() => {
          console.log(`[ADMIN_LOGIN] 🔄 Now navigating to /admin/dashboard after ${Date.now() - startTime}ms`);
          navigate('/admin/dashboard');
        }, 3000); // 延迟3秒

      } else {
        console.error(`[ADMIN_LOGIN] ❌ Role verification failed:`, {
          hasUser: !!currentUser,
          role: currentUser?.role,
          userType: currentUser?.userType,
          timestamp: new Date().toISOString()
        });
        setError('您没有管理员权限，请使用正确的管理员账号登录');
        useAuthStore.getState().logout();
      }
    } catch (error: any) {
      console.error('[ADMIN_LOGIN] ❌ Login error:', error);
      localStorage.setItem('admin_login_error', JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }));
      setError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      console.log(`[ADMIN_LOGIN] 🏁 onFinish END, setting loading=false after ${Date.now() - startTime}ms`);
      setLoading(false);
    }
  };

  const fillTestAccount = (userType: 'admin' | 'super_admin') => {
    const accounts = {
      admin: { username: 'admin1', password: 'admin123' },
      super_admin: { username: 'superadmin', password: 'admin123' }
    };

    form.setFieldsValue({
      username: accounts[userType].username,
      password: accounts[userType].password,
      userType: userType
    });
  };

  const quickLogin = async (userType: 'admin' | 'super_admin') => {
    const accounts = {
      admin: { username: 'admin1', password: 'admin123' },
      super_admin: { username: 'superadmin', password: 'admin123' }
    };

    setLoading(true);
    setError(null);

    try {
      await login(
        { username: accounts[userType].username, password: accounts[userType].password },
        userType
      );

      // 验证用户角色
      const currentUser = useAuthStore.getState().user;
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
        console.log(`[ADMIN_LOGIN] Quick login successful: ${currentUser.username}, role: ${currentUser.role}`);
        // 登录成功，跳转到管理员仪表板
        navigate('/admin/dashboard');
      } else {
        setError('您没有管理员权限，请使用正确的管理员账号登录');
        useAuthStore.getState().logout();
      }
    } catch (error: any) {
      console.error('Quick login error:', error);
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <CrownOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            管理员登录
          </Title>
          <Text type="secondary">
            系统管理控制台
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
          name="admin_login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ userType: 'admin' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
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

          <Form.Item
            name="userType"
            label="管理员类型"
            rules={[{ required: true, message: '请选择管理员类型' }]}
          >
            <Select placeholder="请选择管理员类型">
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', height: '44px' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '12px', display: 'block' }}>
            测试账号快速填充：
          </Text>
          <Space>
            <Button
              size="small"
              type="link"
              onClick={() => fillTestAccount('admin')}
            >
              管理员
            </Button>
            <Button
              size="small"
              type="link"
              onClick={() => fillTestAccount('super_admin')}
            >
              超级管理员
            </Button>
          </Space>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '12px', display: 'block' }}>
            一键登录（调试用）：
          </Text>
          <Space>
            <Button
              size="small"
              type="primary"
              ghost
              loading={loading}
              onClick={() => quickLogin('admin')}
            >
              管理员登录
            </Button>
            <Button
              size="small"
              type="primary"
              ghost
              loading={loading}
              onClick={() => quickLogin('super_admin')}
            >
              超级管理员登录
            </Button>
          </Space>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button 
            type="link" 
            onClick={() => navigate('/login')}
            style={{ fontSize: '12px' }}
          >
            返回审核员登录
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;

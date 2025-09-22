/**
 * 新的管理员登录页面
 * 使用独立的管理系统认证
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, message, Space } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { managementAuthService } from '../../services/managementAuthService';
import { PRESET_MANAGEMENT_ACCOUNTS } from '../../types/management-auth';
import type { ManagementUserType } from '../../types/management-auth';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';


const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

export const NewAdminLoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPresetAccounts, setShowPresetAccounts] = useState(true); // 默认显示快速登录，方便开发调试
  
  const { login, error, clearError } = useManagementAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      // 查找预置账号
      const account = PRESET_MANAGEMENT_ACCOUNTS.find(acc => acc.username === values.username);

      // 使用 Store 的 login 方法，确保状态同步
      const success = await login({
        username: values.username,
        password: values.password,
        userType: account?.userType || 'ADMIN'
      });

      if (success) {
        // 登录成功，根据角色跳转
        message.success(`${account?.name || '用户'}登录成功！`);

        // 从服务层获取用户信息
        const currentUser = managementAuthService.getCurrentUser();
        console.log('🧪 登录成功，准备跳转:', {
          account: account?.name,
          userType: currentUser?.userType,
          redirectPath: account?.redirectPath,
          serviceValid: managementAuthService.isSessionValid()
        });

        // 立即跳转，不需要延迟
        if (account) {
          console.log('🧪 跳转到:', account.redirectPath);
          navigate(account.redirectPath, { replace: true });
        } else {
          console.log('🧪 跳转到默认路径: /admin');
          navigate('/admin', { replace: true });
        }
      } else {
        message.error('登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('Login failed:', error);
      message.error('登录过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 快速登录
  const handleQuickLogin = (account: typeof PRESET_MANAGEMENT_ACCOUNTS[0]) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password
    });
  };

  // 获取用户类型图标
  const getUserTypeIcon = (userType: ManagementUserType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return <CrownOutlined style={{ color: '#ff4d4f' }} />;
      case 'ADMIN':
        return <SafetyOutlined style={{ color: '#1890ff' }} />;
      case 'REVIEWER':
        return <TeamOutlined style={{ color: '#52c41a' }} />;
      default:
        return <UserOutlined />;
    }
  };

  // 获取用户类型颜色
  const getUserTypeColor = (userType: ManagementUserType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return '#ff4d4f';
      case 'ADMIN':
        return '#1890ff';
      case 'REVIEWER':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            管理系统登录
          </Title>
          <Text type="secondary">
            请使用管理员或审核员账号登录
          </Text>
        </div>

        {/* 错误信息 */}
        {error && (
          <Alert
            message="登录失败"
            description={error}
            type="error"
            closable
            onClose={clearError}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
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
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* Google 管理员登录分隔线 */}
        <Divider style={{ margin: '24px 0' }}>
          <span style={{ color: '#999', fontSize: '14px' }}>或</span>
        </Divider>

        {/* Google 管理员登录 */}
        <div style={{ marginBottom: '24px' }}>
          <GoogleLoginButton
            userType="management"
            type="default"
            size="large"
            block
            onSuccess={(userData) => {
              message.success(`欢迎，${userData.role}！`);
              // 根据角色跳转到对应页面
              const redirectPath = userData.role === 'super_admin' ? '/admin' :
                                 userData.role === 'admin' ? '/admin' : '/reviewer/dashboard';
              navigate(redirectPath, { replace: true });
            }}
            onError={(error) => {
              message.error(`Google登录失败: ${error}`);
            }}
            style={{
              borderColor: '#4285f4',
              color: '#4285f4',
              height: '48px',
              fontSize: '16px'
            }}
          />
          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            仅限白名单邮箱登录
          </div>
        </div>

        <Divider />

        {/* 快速登录 */}
        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            onClick={() => setShowPresetAccounts(!showPresetAccounts)}
            style={{ padding: 0 }}
          >
            {showPresetAccounts ? '隐藏' : '显示'}开发调试账号
          </Button>
        </div>

        {showPresetAccounts && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
              点击下方账号快速登录：
            </Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {PRESET_MANAGEMENT_ACCOUNTS.map((account, index) => (
                <Button
                  key={index}
                  size="small"
                  block
                  onClick={() => handleQuickLogin(account)}
                  style={{
                    textAlign: 'left',
                    height: 'auto',
                    padding: '8px 12px',
                    border: `1px solid ${getUserTypeColor(account.userType)}20`,
                    backgroundColor: `${getUserTypeColor(account.userType)}05`
                  }}
                >
                  <Space>
                    {getUserTypeIcon(account.userType)}
                    <div>
                      <div style={{ fontWeight: 500 }}>{account.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {account.username} / {account.userType}
                      </div>
                    </div>
                  </Space>
                </Button>
              ))}
            </Space>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            管理系统 v2.0 - 独立认证体系
          </Text>
        </div>
      </Card>
    </div>
  );
};

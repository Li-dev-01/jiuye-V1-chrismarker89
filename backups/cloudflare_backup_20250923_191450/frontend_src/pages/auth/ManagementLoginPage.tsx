/**
 * 独立的管理系统登录页面
 * 专门用于审核员、管理员、超级管理员登录
 * 提高安全性，降低爆破风险
 */

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert, message, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { ManagementUserType } from '../../types/management-auth';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import styles from './ManagementLoginPage.module.css';

const { Title, Text, Paragraph } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

// 预置账号配置
const PRESET_ACCOUNTS = [
  {
    username: 'admin1',
    password: 'admin123',
    userType: 'ADMIN' as ManagementUserType,
    name: '管理员',
    redirectPath: '/admin'
  },
  {
    username: 'superadmin',
    password: 'admin123',
    userType: 'SUPER_ADMIN' as ManagementUserType,
    name: '超级管理员',
    redirectPath: '/admin'
  },
  {
    username: 'reviewerA',
    password: 'admin123',
    userType: 'REVIEWER' as ManagementUserType,
    name: '审核员A',
    redirectPath: '/reviewer/dashboard'
  }
];

export const ManagementLoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useManagementAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      // 查找预置账号
      const account = PRESET_ACCOUNTS.find(acc => acc.username === values.username);

      const success = await login(
        values.username,
        values.password,
        account?.userType || 'ADMIN' as ManagementUserType
      );

      if (success) {
        // 登录成功，根据角色跳转
        message.success(`${account?.name || '用户'}登录成功！`);

        // 延迟跳转，确保状态更新完成
        setTimeout(() => {
          if (account) {
            navigate(account.redirectPath, { replace: true });
          } else {
            navigate('/admin', { replace: true });
          }
        }, 500);
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

  const handleQuickLogin = (account: typeof PRESET_ACCOUNTS[0]) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.backgroundPattern}></div>
      </div>
      
      <div className={styles.layoutContainer}>
        <div className={styles.cardWrapper}>
          <Card className={styles.loginCard} bordered={false}>
            <div className={styles.header}>
              <div className={styles.iconContainer}>
                <SecurityScanOutlined className={styles.mainIcon} />
              </div>
              <Title level={2} className={styles.title}>
                管理系统登录
              </Title>
              <Paragraph className={styles.subtitle}>
                审核员 · 管理员 · 超级管理员
              </Paragraph>
            </div>

            {error && (
              <Alert
                message="登录失败"
                description={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              name="management-login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              className={styles.form}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入管理员用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  size="large"
                  className={styles.loginButton}
                >
                  密码登录
                </Button>
              </Form.Item>
            </Form>

            {/* Google 管理员登录分隔线 */}
            <Divider style={{ margin: '24px 0' }}>
              <span className={styles.dividerText}>或</span>
            </Divider>

            {/* Google 管理员登录 */}
            <div className={styles.googleLogin}>
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
              <div className={styles.googleLoginHint}>
                仅限白名单邮箱登录
              </div>
            </div>

            {/* 快速登录选项 - 仅开发环境显示 */}
            {process.env.NODE_ENV === 'development' && (
              <div className={styles.quickLogin}>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                  开发环境快速登录：
                </Text>
                <Space wrap size="small">
                  {PRESET_ACCOUNTS.map((account) => (
                    <Button
                      key={account.username}
                      size="small"
                      type="dashed"
                      onClick={() => handleQuickLogin(account)}
                      style={{ fontSize: '11px' }}
                    >
                      {account.name}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            <div className={styles.security}>
              <Alert
                message="安全提醒"
                description={
                  <Space direction="vertical" size="small">
                    <Text style={{ fontSize: '12px' }}>• 此页面仅供管理人员使用</Text>
                    <Text style={{ fontSize: '12px' }}>• 请确保在安全环境下登录</Text>
                    <Text style={{ fontSize: '12px' }}>• 登录活动将被记录和监控</Text>
                  </Space>
                }
                type="info"
                showIcon
                icon={<SafetyOutlined />}
              />
            </div>

            <div className={styles.footer}>
              <Button 
                type="link" 
                onClick={() => navigate('/')}
                style={{ padding: 0, fontSize: '12px' }}
              >
                返回主站
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagementLoginPage;

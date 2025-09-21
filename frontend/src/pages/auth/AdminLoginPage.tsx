import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, CrownOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { UserType } from '../../types/uuid-system';
import styles from './AdminLoginPage.module.css';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

// 预置账号配置
const PRESET_ACCOUNTS = [
  {
    username: 'admin1',
    password: 'admin123',
    userType: UserType.ADMIN,
    name: '管理员',
    redirectPath: '/admin'
  },
  {
    username: 'superadmin',
    password: 'admin123',
    userType: UserType.SUPER_ADMIN,
    name: '超级管理员',
    redirectPath: '/admin'
  },
  {
    username: 'reviewerA',
    password: 'admin123',
    userType: UserType.REVIEWER,
    name: '审核员A',
    redirectPath: '/reviewer/dashboard'
  }
];

export const AdminLoginPage: React.FC = () => {
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
        account?.userType || UserType.ADMIN
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

  const handleQuickLogin = async (account: typeof PRESET_ACCOUNTS[0]) => {
    if (isLoading) return;

    // 填充表单
    form.setFieldsValue({
      username: account.username,
      password: account.password
    });

    message.info(`已填充${account.name}账号信息`);

    // 自动登录
    setIsLoading(true);
    clearError();

    try {
      const success = await login(
        account.username,
        account.password,
        account.userType
      );

      if (success) {
        message.success(`${account.name}登录成功！`);

        // 延迟跳转，确保状态更新完成
        setTimeout(() => {
          navigate(account.redirectPath, { replace: true });
        }, 500);
      } else {
        message.error('快速登录失败');
      }
    } catch (error) {
      console.error('Quick login failed:', error);
      message.error('快速登录过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <Card className={styles.loginCard}>
          {/* 登录头部 */}
          <div className={styles.header}>
            <Title level={2} className={styles.title}>
              管理后台登录
            </Title>
            <Text className={styles.description}>
              请输入您的账号和密码，支持管理员和审核员登录
            </Text>
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert
              message="登录失败"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              className={styles.errorAlert}
            />
          )}

          {/* 登录表单 */}
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className={styles.form}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                size="large"
                block
                className={styles.loginButton}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          {/* 一键登录区域 */}
          <div className={styles.quickLoginSection}>
            <Divider>
              <Text type="secondary" className={styles.dividerText}>
                快速登录
              </Text>
            </Divider>

            {/* 管理员登录 */}
            <div className={styles.quickLoginGroup}>
              <Text strong className={styles.groupTitle}>
                <CrownOutlined /> 管理员
              </Text>
              <Button
                type="default"
                size="large"
                block
                loading={isLoading}
                onClick={() => handleQuickLogin(PRESET_ACCOUNTS[0])}
                className={`${styles.quickLoginButton} ${styles.adminButton}`}
              >
                管理员
              </Button>
            </div>

            {/* 超级管理员登录 */}
            <div className={styles.quickLoginGroup}>
              <Text strong className={styles.groupTitle}>
                <SafetyOutlined /> 超级管理员
              </Text>
              <Button
                type="default"
                size="large"
                block
                loading={isLoading}
                onClick={() => handleQuickLogin(PRESET_ACCOUNTS[1])}
                className={`${styles.quickLoginButton} ${styles.superAdminButton}`}
              >
                超级管理员
              </Button>
            </div>

            {/* 审核员登录 */}
            <div className={styles.quickLoginGroup}>
              <Text strong className={styles.groupTitle}>
                <TeamOutlined /> 审核员
              </Text>
              <div className={styles.reviewerButtons}>
                {PRESET_ACCOUNTS.slice(2).map((account) => (
                  <Button
                    key={account.username}
                    type="default"
                    size="large"
                    loading={isLoading}
                    onClick={() => handleQuickLogin(account)}
                    className={`${styles.quickLoginButton} ${styles.reviewerButton}`}
                  >
                    {account.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 帮助信息 */}
          <div className={styles.helpSection}>
            <div className={styles.backToHome}>
              <Link to="/">
                <Button type="link">返回首页</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </PublicLayout>
  );
};

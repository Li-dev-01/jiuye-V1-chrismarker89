/**
 * 自动登录接收页面
 * 接收来自多项目管理中心的自动登录请求
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Alert, Button, Space } from 'antd';
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  UserOutlined,
  CrownOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import styles from './AutoLoginPage.module.css';

const { Title, Text, Paragraph } = Typography;

interface AutoLoginStatus {
  status: 'loading' | 'success' | 'error';
  message: string;
  userInfo?: {
    email: string;
    role: string;
    displayName?: string;
  };
}

export const AutoLoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loginStatus, setLoginStatus] = useState<AutoLoginStatus>({
    status: 'loading',
    message: '正在验证登录信息...'
  });

  const { autoLogin } = useManagementAuthStore();

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        // 获取URL参数
        const role = searchParams.get('role');
        const email = searchParams.get('email');

        if (!role || !email) {
          setLoginStatus({
            status: 'error',
            message: '缺少必要的登录参数'
          });
          return;
        }

        // 验证角色
        const validRoles = ['reviewer', 'admin', 'super_admin'];
        if (!validRoles.includes(role)) {
          setLoginStatus({
            status: 'error',
            message: '无效的用户角色'
          });
          return;
        }

        setLoginStatus({
          status: 'loading',
          message: `正在以${getRoleDisplayName(role)}身份登录...`
        });

        // 执行自动登录
        const success = await autoLogin({
          email,
          role: role as 'reviewer' | 'admin' | 'super_admin'
        });

        if (success) {
          setLoginStatus({
            status: 'success',
            message: '登录成功！正在跳转...',
            userInfo: {
              email,
              role,
              displayName: getRoleDisplayName(role)
            }
          });

          // 延迟跳转到对应的管理界面
          setTimeout(() => {
            const redirectPath = getRedirectPath(role);
            navigate(redirectPath, { replace: true });
          }, 2000);
        } else {
          setLoginStatus({
            status: 'error',
            message: '自动登录失败，请重试'
          });
        }

      } catch (error) {
        console.error('Auto login error:', error);
        setLoginStatus({
          status: 'error',
          message: '登录过程中发生错误'
        });
      }
    };

    performAutoLogin();
  }, [searchParams, autoLogin, navigate]);

  const getRoleDisplayName = (role: string): string => {
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <CrownOutlined style={{ color: '#ff4d4f' }} />;
      case 'admin':
        return <SafetyCertificateOutlined style={{ color: '#1890ff' }} />;
      case 'reviewer':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'reviewer':
        return '/reviewer/dashboard';
      default:
        return '/';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleManualLogin = () => {
    navigate('/auth/management-login');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <div className={styles.content}>
          {loginStatus.status === 'loading' && (
            <div className={styles.loadingSection}>
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                size="large"
              />
              <Title level={3} style={{ marginTop: 24 }}>
                {loginStatus.message}
              </Title>
              <Text type="secondary">
                请稍候，系统正在处理您的登录请求...
              </Text>
            </div>
          )}

          {loginStatus.status === 'success' && loginStatus.userInfo && (
            <div className={styles.successSection}>
              <CheckCircleOutlined 
                style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} 
              />
              <Title level={3} style={{ color: '#52c41a' }}>
                登录成功！
              </Title>
              <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
                <div className={styles.userInfo}>
                  {getRoleIcon(loginStatus.userInfo.role)}
                  <Text strong style={{ marginLeft: 8 }}>
                    {loginStatus.userInfo.displayName}
                  </Text>
                </div>
                <Text type="secondary">
                  {loginStatus.userInfo.email}
                </Text>
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  正在跳转到管理界面...
                </Paragraph>
              </Space>
            </div>
          )}

          {loginStatus.status === 'error' && (
            <div className={styles.errorSection}>
              <ExclamationCircleOutlined 
                style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} 
              />
              <Title level={3} style={{ color: '#ff4d4f' }}>
                登录失败
              </Title>
              <Alert
                message={loginStatus.message}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
              <Space>
                <Button type="primary" onClick={handleRetry}>
                  重试
                </Button>
                <Button onClick={handleManualLogin}>
                  手动登录
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AutoLoginPage;

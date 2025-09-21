/**
 * 安全悬浮状态栏组件
 * 使用安全架构重新实现的悬浮状态栏
 */

import React, { useState, useCallback } from 'react';
import { Button, Dropdown, Modal, Form, Input, message, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  LogoutOutlined,
  LoginOutlined,
  FileTextOutlined,
  HeartOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { SafeFloatingWrapper } from './SafeFloatingWrapper';
import styles from './FloatingStatusBar.module.css';

const { Text } = Typography;

/**
 * 内部悬浮状态栏组件
 * 不包含错误边界，由SafeFloatingWrapper包装
 */
const InternalFloatingStatusBar: React.FC = () => {
  const navigate = useNavigate();
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [loginForm] = Form.useForm();
  
  // 使用统一认证store
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    loginSemiAnonymous,
    logout,
    clearError
  } = useUniversalAuthStore();

  /**
   * 处理快速登录
   */
  const handleQuickLogin = useCallback(async (values: { identityA: string; identityB: string }) => {
    try {
      const success = await loginSemiAnonymous(values.identityA, values.identityB);

      if (success) {
        message.success('登录成功！');
        setShowQuickLogin(false);
        loginForm.resetFields();
      } else {
        message.error('登录失败，请检查A+B组合');
      }
    } catch (error) {
      console.error('Quick login error:', error);
      message.error('登录过程中出现错误');
    }
  }, [loginSemiAnonymous, loginForm]);

  /**
   * 处理登出
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      message.success('已退出登录');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('退出登录时出现错误');
    }
  }, [logout, navigate]);

  /**
   * 处理快速发布
   */
  const handleQuickPublish = useCallback((type: 'voice' | 'story') => {
    if (!isAuthenticated) {
      message.warning('请先登录后再发布内容');
      setShowQuickLogin(true);
      return;
    }

    if (type === 'voice') {
      navigate('/voices');
    } else {
      navigate('/stories');
    }
  }, [isAuthenticated, navigate]);

  /**
   * 处理查看内容
   */
  const handleViewContent = useCallback(() => {
    if (!isAuthenticated) {
      message.warning('请先登录后查看内容');
      setShowQuickLogin(true);
      return;
    }
    navigate('/my-content');
  }, [isAuthenticated, navigate]);



  // 访客菜单项
  const guestMenuItems: MenuProps['items'] = [
    {
      key: 'quick-login',
      icon: <LoginOutlined />,
      label: '快速登录',
      onClick: () => setShowQuickLogin(true)
    },
    {
      key: 'goto-login',
      icon: <UserOutlined />,
      label: '完整登录',
      onClick: () => navigate('/auth/login')
    }
  ];

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'view-content',
      icon: <FileTextOutlined />,
      label: '查看我的内容',
      onClick: handleViewContent
    },

    {
      key: 'publish-story',
      icon: <FileTextOutlined />,
      label: '发布故事',
      onClick: () => handleQuickPublish('story')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true
    }
  ];

  return (
    <>
      <div className={styles.container}>
        <Dropdown
          menu={{ items: isAuthenticated ? userMenuItems : guestMenuItems }}
          trigger={['click']}
          placement="topLeft"
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={isLoading ? null : <PlusOutlined />}
            loading={isLoading}
            className={`${styles.floatingButton} ${isAuthenticated ? styles.loggedIn : styles.guest}`}
            title={
              isAuthenticated
                ? `欢迎，${currentUser?.displayName || '用户'}！点击查看菜单`
                : '点击登录或查看功能'
            }
          />
        </Dropdown>
      </div>

      {/* 快速登录模态框 */}
      <Modal
        title="快速登录"
        open={showQuickLogin}
        onCancel={() => {
          setShowQuickLogin(false);
          loginForm.resetFields();
          clearError();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={loginForm}
          layout="vertical"
          onFinish={handleQuickLogin}
        >
          <Form.Item
            label="身份标识A"
            name="identityA"
            rules={[
              { required: true, message: '请输入身份标识A' },
              { pattern: /^\d{11}$/, message: 'A值必须是11位数字' }
            ]}
          >
            <Input
              placeholder="请输入11位数字"
              autoFocus
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            label="身份标识B"
            name="identityB"
            rules={[
              { required: true, message: '请输入身份标识B' },
              { pattern: /^\d{4,6}$/, message: 'B值必须是4-6位数字' }
            ]}
          >
            <Input
              placeholder="请输入4-6位数字"
              maxLength={6}
            />
          </Form.Item>

          {error && (
            <Form.Item>
              <Text type="danger" style={{ fontSize: '12px' }}>
                {error}
              </Text>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowQuickLogin(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isLoading}
              >
                登录
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f6f6f6', 
          borderRadius: '6px' 
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 快速登录让您可以发布内容和管理个人资料，无需复杂注册流程
          </Text>
        </div>
      </Modal>
    </>
  );
};

/**
 * 安全悬浮状态栏组件
 * 使用SafeFloatingWrapper包装以提供错误隔离
 */
export const SafeFloatingStatusBar: React.FC = () => {
  return (
    <SafeFloatingWrapper
      componentName="悬浮状态栏"
      showErrorDetails={false}
      retryable={true}
      fallbackComponent={
        <div className={styles.container}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => window.location.href = '/auth/login'}
            title="状态栏暂时不可用，点击前往登录页面"
            style={{ opacity: 0.6 }}
          />
        </div>
      }
    >
      <InternalFloatingStatusBar />
    </SafeFloatingWrapper>
  );
};

export default SafeFloatingStatusBar;

/**
 * 悬浮状态栏管理器
 * 提供全局状态栏的启用/禁用控制
 */
export class FloatingStatusBarManager {
  private static instance: FloatingStatusBarManager;
  private isEnabled: boolean = true;
  private listeners: Array<(enabled: boolean) => void> = [];

  static getInstance(): FloatingStatusBarManager {
    if (!FloatingStatusBarManager.instance) {
      FloatingStatusBarManager.instance = new FloatingStatusBarManager();
    }
    return FloatingStatusBarManager.instance;
  }

  enable(): void {
    this.isEnabled = true;
    this.notifyListeners();
  }

  disable(): void {
    this.isEnabled = false;
    this.notifyListeners();
  }

  isStatusBarEnabled(): boolean {
    return this.isEnabled;
  }

  addListener(listener: (enabled: boolean) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (enabled: boolean) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isEnabled));
  }
}

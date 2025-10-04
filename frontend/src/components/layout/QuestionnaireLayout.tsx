/**
 * 问卷项目专用布局
 * 提供统一的顶部导航栏，方便在问卷相关页面间切换
 */

import React from 'react';
import { Layout, Menu, Button, Space, Avatar, Dropdown } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BookOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { MobileNavigation } from './MobileNavigation';
import { getUserDisplayName } from '../../utils/userDisplayUtils';

import styles from './QuestionnaireLayout.module.css';

const { Header, Content, Footer } = Layout;

interface QuestionnaireLayoutProps {
  children: React.ReactNode;
}

export const QuestionnaireLayout: React.FC<QuestionnaireLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, isAuthenticated } = useUniversalAuthStore();

  // 获取用户显示名称（使用8位标识符）
  const getDisplayName = () => {
    if (!currentUser) return '未登录';
    return getUserDisplayName(currentUser);
  };

  // 问卷项目导航菜单
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>
    },
    {
      key: '/questionnaire',
      icon: <FileTextOutlined />,
      label: <Link to="/questionnaire/survey">问卷</Link>
    },
    {
      key: '/analytics/v1',
      icon: <BarChartOutlined />,
      label: <Link to="/analytics/v1">数据可视化V1</Link>
    },
    {
      key: '/analytics/v2',
      icon: <ExperimentOutlined />,
      label: <Link to="/analytics/v2">数据可视化V2</Link>
    },
    {
      key: '/stories',
      icon: <BookOutlined />,
      label: <Link to="/stories">故事墙</Link>
    },
  ];

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/user/profile')
    },
    {
      key: 'my-content',
      icon: <FileTextOutlined />,
      label: '我的内容',
      onClick: () => navigate('/my-content')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/user/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/');
      }
    }
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/questionnaire')) return '/questionnaire';
    if (path.startsWith('/analytics/v1')) return '/analytics/v1';
    if (path.startsWith('/analytics/v2')) return '/analytics/v2';
    if (path.startsWith('/analytics')) return '/analytics/v2'; // 默认选中V2
    if (path.startsWith('/stories')) return '/stories';

    return '/';
  };

  return (
    <Layout className={styles.layout}>
      {/* 问卷项目专用顶部导航 */}
      <Header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo区域 */}
          <div className={styles.logoSection}>
            <Link to="/" className={styles.logo}>
              2025大学生就业问卷调查
            </Link>
          </div>

          {/* 导航菜单 */}
          <Menu
            mode="horizontal"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            className={styles.menu}
          />

          {/* 用户操作区域 */}
          <div className={styles.userSection}>
            {currentUser ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" className={styles.userButton}>
                  <Space>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />}
                      className={styles.avatar}
                    />
                    <span className={styles.username}>
                      {getDisplayName()}
                    </span>
                  </Space>
                </Button>
              </Dropdown>
            ) : (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    // 触发全局事件打开半匿名登录
                    window.dispatchEvent(new Event('openSemiAnonymousLogin'));
                  }}
                >
                  匿名注册/登录
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Header>

      {/* 内容区域 */}
      <Content className={styles.content}>
        {children}
      </Content>

      {/* 底部栏 */}
      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerText}>
              <p>© 2025 大学生就业问卷调查平台. All rights reserved.</p>
              <p>致力于为大学生就业提供数据支持和交流平台</p>
            </div>

            {/* 管理后台登录链接已移除 - 提高安全性 */}
            {/* 管理员请直接访问: /management-portal */}
          </div>
        </div>
      </Footer>

      {/* 移动端导航 */}
      <MobileNavigation />


    </Layout>
  );
};

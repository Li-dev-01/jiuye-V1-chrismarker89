import React from 'react';
import { Typography, Space, Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { SettingOutlined, UserOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { getUserDisplayName } from '../../utils/userDisplayUtils';
import styles from './GlobalHeader.module.css';

const { Title } = Typography;
const { Header } = Layout;

export const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUniversalAuthStore();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/questionnaire-v2/analytics')) return 'analysis-v2';
    if (path.startsWith('/questionnaire-v2')) return 'survey-v2';
    if (path.startsWith('/questionnaire')) return 'survey';
    if (path === '/analytics/nav') return 'analysis-nav';
    if (path.startsWith('/analytics')) return 'analysis-v1';
    if (path.startsWith('/results')) return 'results';
    if (path.startsWith('/stories')) return 'story';
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/voices')) return 'about';
    if (path.startsWith('/admin-test')) return 'admin-test';
    if (path.startsWith('/reviewer-test')) return 'reviewer-test';
    if (path.startsWith('/admin')) return 'admin';
    return '';
  };

  const menuItems = [
    {
      key: 'home',
      label: <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>首页</Link>
    },
    {
      key: 'survey',
      label: <Link to="/questionnaire" style={{ color: 'inherit', textDecoration: 'none' }}>问卷调查</Link>
    },
    {
      key: 'survey-v2',
      label: (
        <div style={{ color: 'inherit', textDecoration: 'none' }}>
          问卷2
          <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '-2px' }}>智能版</div>
        </div>
      ),
      children: [
        {
          key: 'survey-v2-home',
          label: <Link to="/questionnaire-v2" style={{ color: 'inherit', textDecoration: 'none' }}>首页</Link>
        },
        {
          key: 'survey-v2-survey',
          label: <Link to="/questionnaire-v2/survey" style={{ color: 'inherit', textDecoration: 'none' }}>问卷页面</Link>
        },
        {
          key: 'survey-v2-analytics',
          label: <Link to="/questionnaire-v2/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>可视化</Link>
        }
      ]
    },
    {
      key: 'analysis',
      label: '数据可视化',
      children: [
        {
          key: 'analysis-v1',
          label: <Link to="/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>问卷1可视化</Link>
        },
        {
          key: 'analysis-v2',
          label: <Link to="/questionnaire-v2/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>问卷2可视化</Link>
        },
        {
          key: 'analysis-nav',
          label: <Link to="/analytics/nav" style={{ color: 'inherit', textDecoration: 'none' }}>可视化导航</Link>
        }
      ]
    },
    {
      key: 'results',
      label: <Link to="/results" style={{ color: 'inherit', textDecoration: 'none' }}>结果分析</Link>
    },
    {
      key: 'story',
      label: <Link to="/stories" style={{ color: 'inherit', textDecoration: 'none' }}>故事墙</Link>
    },
    {
      key: 'favorites',
      label: <Link to="/favorites" style={{ color: 'inherit', textDecoration: 'none' }}>我的收藏</Link>
    }
  ];

  // 简化版本，暂时移除动态菜单

  return (
    <Header className={styles.header}>
      <div className={styles.headerContent}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title level={3} className={styles.logo}>
            2025大学生就业问卷调查
          </Title>
        </Link>
        
        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          className={styles.menu}
          items={menuItems}
        />
        
        <Space className={styles.userActions}>
          {isAuthenticated && user ? (
            // 已登录用户菜单
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: '个人信息'
                  },
                  {
                    key: 'divider',
                    type: 'divider'
                  },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    onClick: logout
                  }
                ]
              }}
              placement="bottomRight"
            >
              <Button type="text" className={styles.userButton}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{getUserDisplayName(user)}</span>
                </Space>
              </Button>
            </Dropdown>
          ) : (
            // 未登录用户操作
            <Space>
              <GoogleLoginButton
                userType="questionnaire"
                type="primary"
                size="small"
                style={{ height: '32px' }}
              />
              <Button
                type="default"
                size="small"
                icon={<LoginOutlined />}
                onClick={() => {
                  // 触发半匿名登录
                  window.dispatchEvent(new Event('openSemiAnonymousLogin'));
                }}
                className={styles.loginButton}
              >
                半匿名登录
              </Button>
              <Link to="/management-portal">
                <Button
                  type="link"
                  size="small"
                  icon={<SettingOutlined />}
                  className={styles.adminButton}
                >
                  管理登录
                </Button>
              </Link>
            </Space>
          )}
        </Space>
      </div>
    </Header>
  );
};

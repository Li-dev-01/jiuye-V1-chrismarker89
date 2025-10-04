import React from 'react';
import { Typography, Space, Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { SettingOutlined, UserOutlined, LoginOutlined, LogoutOutlined, ExperimentOutlined, BulbOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { getUserDisplayName } from '../../utils/userDisplayUtils';
import styles from './GlobalHeader.module.css';

const { Title } = Typography;
const { Header } = Layout;

export const SecondQuestionnaireHeader: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUniversalAuthStore();

  // 根据当前路径确定选中的菜单项（第二问卷专用）
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/questionnaire-v2') return 'home-v2';
    if (path.startsWith('/questionnaire-v2/survey')) return 'survey-v2';
    if (path.startsWith('/questionnaire-v2/analytics')) return 'analysis-v2';
    if (path.startsWith('/questionnaire-v2/complete')) return 'survey-v2';
    if (path.startsWith('/questionnaire/combo-generator')) return 'combo-generator';
    return '';
  };

  // 第二问卷专用菜单项
  const menuItems = [
    {
      key: 'home-v2',
      label: <Link to="/questionnaire-v2" style={{ color: 'inherit', textDecoration: 'none' }}>首页2</Link>
    },
    {
      key: 'survey-v2',
      label: <Link to="/questionnaire-v2/survey" style={{ color: 'inherit', textDecoration: 'none' }}>问卷2</Link>
    },
    {
      key: 'analysis-v2',
      label: <Link to="/questionnaire-v2/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>可视化2</Link>
    },
    {
      key: 'combo-generator',
      label: (
        <Link to="/questionnaire/combo-generator" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Space>
            <BulbOutlined />
            画像生成器
          </Space>
        </Link>
      )
    },
    {
      key: 'divider-1',
      type: 'divider'
    },
    {
      key: 'back-to-v1',
      label: <Link to="/" style={{ color: '#1890ff', textDecoration: 'none' }}>返回第一问卷</Link>
    }
  ];

  return (
    <Header className={styles.header} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className={styles.headerContent}>
        <Link to="/questionnaire-v2" style={{ textDecoration: 'none' }}>
          <Title level={3} className={styles.logo} style={{ color: '#fff' }}>
            <Space>
              <ExperimentOutlined />
              2025智能就业调查（第二版）
            </Space>
          </Title>
        </Link>
        
        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          className={styles.menu}
          items={menuItems}
          style={{ 
            background: 'transparent',
            borderBottom: 'none'
          }}
          theme="dark"
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
                    key: 'my-responses',
                    icon: <ExperimentOutlined />,
                    label: '我的第二问卷记录'
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
              <Button type="text" className={styles.userButton} style={{ color: '#fff' }}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#fff', color: '#667eea' }} />
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
                style={{ height: '32px', backgroundColor: '#fff', borderColor: '#fff', color: '#667eea' }}
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
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#fff', color: '#fff' }}
              >
                半匿名登录
              </Button>
            </Space>
          )}
        </Space>
      </div>
    </Header>
  );
};

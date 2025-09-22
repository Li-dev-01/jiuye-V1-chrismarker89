import React from 'react';
import { Button, Typography, Space, Layout, Menu, Avatar, Dropdown } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  MessageOutlined,
  BookOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import type { UserRole } from '../../types/auth';
import { getAccessibleMenuItems, getRoleDisplayName } from '../../utils/permissions';
import styles from './RoleBasedHeader.module.css';

const { Title } = Typography;
const { Header } = Layout;

interface RoleBasedHeaderProps {
  role?: UserRole;
  hideNavigation?: boolean;
}

export const RoleBasedHeader: React.FC<RoleBasedHeaderProps> = ({
  role,
  hideNavigation = false
}) => {
  // 根据角色选择合适的认证系统
  const universalAuthStore = useUniversalAuthStore();
  const managementAuthStore = useManagementAuthStore();

  const isManagementRole = role === 'admin' || role === 'reviewer';

  // 根据角色类型获取对应的认证状态
  const { isAuthenticated, logout } = isManagementRole ? managementAuthStore : universalAuthStore;
  const user = isManagementRole ? managementAuthStore.currentUser : universalAuthStore.user;



  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 根据角色获取菜单项
  const getMenuItems = () => {
    if (hideNavigation) return [];

    // 如果指定了角色，使用角色专用菜单
    if (role === 'reviewer') {
      return [
        {
          key: 'dashboard',
          label: <Link to="/reviewer">审核工作台</Link>,
          icon: <DashboardOutlined />
        },
        {
          key: 'quick-review',
          label: <Link to="/reviewer/quick-review">快速审核</Link>,
          icon: <FileTextOutlined />
        },
        {
          key: 'history',
          label: <Link to="/reviewer/history">审核记录</Link>,
          icon: <BarChartOutlined />
        },
        {
          key: 'settings',
          label: <Link to="/reviewer/settings">个人设置</Link>,
          icon: <UserOutlined />
        }
      ];
    }

    if (role === 'admin') {
      // 检查当前用户是否为超级管理员
      const isSuperAdmin = managementAuthStore.currentUser?.userType === 'SUPER_ADMIN';

      if (isSuperAdmin) {
        // 超级管理员专用菜单 - 专注安全与可用性
        return [
          {
            key: 'super-admin',
            label: <Link to="/admin/super-admin">安全控制台</Link>,
            icon: <SettingOutlined />
          },
          {
            key: 'system',
            label: <Link to="/admin/system">系统设置</Link>,
            icon: <SettingOutlined />
          },
          {
            key: 'logs',
            label: <Link to="/admin/logs">系统日志</Link>,
            icon: <FileTextOutlined />
          },
          {
            key: 'security',
            label: <Link to="/admin/security">安全管理</Link>,
            icon: <SettingOutlined />
          }
        ];
      } else {
        // 普通管理员菜单 - 专注日常运营
        return [
          {
            key: 'dashboard',
            label: <Link to="/admin">管理控制台</Link>,
            icon: <DashboardOutlined />
          },
          {
            key: 'users',
            label: <Link to="/admin/users">用户管理</Link>,
            icon: <UserOutlined />
          },
          {
            key: 'reviewers',
            label: <Link to="/admin/reviewers">审核员管理</Link>,
            icon: <TeamOutlined />
          },
          {
            key: 'content',
            label: <Link to="/admin/content">内容管理</Link>,
            icon: <FileTextOutlined />
          },
          {
            key: 'user-content',
            label: <Link to="/admin/user-content">用户内容管理</Link>,
            icon: <UserOutlined />
          },
          {
            key: 'api-data',
            label: <Link to="/admin/api-data">API与数据</Link>,
            icon: <BarChartOutlined />
          },
          {
            key: 'data-generator',
            label: <Link to="/admin/data-generator">数据生成器</Link>,
            icon: <DatabaseOutlined />
          },
          {
            key: 'database-monitor',
            label: <Link to="/admin/database-monitor">数据库监测</Link>,
            icon: <MonitorOutlined />
          },
          {
            key: 'ai-management',
            label: 'AI管理',
            icon: <ThunderboltOutlined />,
            children: [
              {
                key: 'ai-sources',
                label: <Link to="/admin/ai/sources">AI水源配置</Link>
              },
              {
                key: 'ai-monitor',
                label: <Link to="/admin/ai/monitor">监控面板</Link>
              },
              {
                key: 'ai-cost',
                label: <Link to="/admin/ai/cost">成本控制</Link>
              },
              {
                key: 'ai-review-assistant',
                label: <Link to="/admin/ai/review-assistant">审核助手</Link>
              }
            ]
          }
        ];
      }
    }

    // 普通用户菜单
    const accessibleItems = getAccessibleMenuItems(user);
    return accessibleItems.map(item => ({
      key: item.key,
      label: <Link to={item.path}>{item.label}</Link>
    }));
  };

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    
    if (role === 'reviewer') {
      if (path.includes('/quick-review')) return 'quick-review';
      if (path.includes('/history')) return 'history';
      if (path.includes('/settings')) return 'settings';
      return 'dashboard';
    }
    
    if (role === 'admin') {
      if (path.includes('/users')) return 'users';
      if (path.includes('/reviewers')) return 'reviewers';
      if (path.includes('/content')) return 'content';
      if (path.includes('/system')) return 'system';
      if (path.includes('/logs')) return 'logs';
      if (path.includes('/api-data')) return 'api-data';
      if (path.includes('/data-generator')) return 'data-generator';
      if (path.includes('/super-admin')) return 'super-admin';
      return 'dashboard';
    }
    
    // 普通用户路径匹配
    if (path === '/') return 'home';
    if (path.startsWith('/questionnaire')) return 'questionnaire';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/stories')) return 'stories';
    if (path.startsWith('/voices')) return 'voices';
    if (path.startsWith('/profile')) return 'profile';
    
    return '';
  };

  // 用户下拉菜单
  const userMenuItems = user ? [
    {
      key: 'role',
      label: (
        <Space>
          <UserOutlined />
          {isManagementRole
            ? (user as any).userType || (user as any).display_name || user.username
            : getRoleDisplayName(user.role)
          }
        </Space>
      ),
      disabled: true
    },
    {
      type: 'divider' as const
    },
    ...((!isManagementRole && user.role === 'user') ? [{
      key: 'profile',
      label: (
        <Link to="/profile">
          <Space>
            <UserOutlined />
            个人中心
          </Space>
        </Link>
      )
    }] : []),
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          退出登录
        </Space>
      ),
      onClick: handleLogout
    }
  ] : [];

  // 获取页面标题
  const getPageTitle = () => {
    if (role === 'reviewer') return '审核员工作台';
    if (role === 'admin') {
      const isSuperAdmin = managementAuthStore.currentUser?.userType === 'SUPER_ADMIN';
      return isSuperAdmin ? '超级管理员控制台' : '管理员控制台';
    }
    return '2025大学生就业问卷调查';
  };

  return (
    <Header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo和标题 */}
        <div className={styles.logoSection}>
          <Link to={role ? (role === 'reviewer' ? '/reviewer' : '/admin') : '/'}>
            <Title level={4} className={styles.logo}>
              {getPageTitle()}
            </Title>
          </Link>
        </div>
        
        {/* 导航菜单 */}
        {!hideNavigation && (
          <Menu
            mode="horizontal"
            selectedKeys={[getSelectedKey()]}
            className={styles.menu}
            items={getMenuItems()}
          />
        )}
        
        {/* 用户操作区域 */}
        <Space className={styles.userActions}>
          {isAuthenticated && user && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" className={styles.userButton}>
                <Space>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    src={user.avatar}
                  />
                  <span className={styles.username}>
                    {isManagementRole
                      ? (user as any).display_name || user.username
                      : (user.isAnonymous ? '匿名用户' : user.username)
                    }
                  </span>
                </Space>
              </Button>
            </Dropdown>
          )}
        </Space>
      </div>
    </Header>
  );
};

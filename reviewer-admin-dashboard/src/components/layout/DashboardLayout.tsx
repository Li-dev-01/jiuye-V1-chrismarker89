import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Typography,
  theme
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  BarChartOutlined,
  RobotOutlined,
  SettingOutlined,
  CrownOutlined,
  ApiOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 根据用户角色动态生成菜单
  const getMenuItems = () => {
    const isSuperAdmin = user?.role === 'super_admin' || user?.userType === 'super_admin';
    const isAdmin = user?.role === 'admin' || user?.userType === 'admin';
    const isAnyAdmin = isAdmin || isSuperAdmin;

    if (isSuperAdmin) {
      // 超级管理员菜单
      return [
        {
          key: '/admin/dashboard',
          icon: <DashboardOutlined />,
          label: '管理仪表板',
        },
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/admin/analytics',
          icon: <BarChartOutlined />,
          label: '数据分析',
        },
        {
          key: '/admin/ai-moderation',
          icon: <RobotOutlined />,
          label: 'AI审核',
        },
        {
          key: '/admin/tag-management',
          icon: <TagsOutlined />,
          label: '标签管理',
        },
        {
          key: '/admin/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        },
        {
          key: '/admin/super',
          icon: <CrownOutlined />,
          label: '超级管理',
        },
      ];
    } else if (isAdmin) {
      // 普通管理员菜单
      return [
        {
          key: '/admin/dashboard',
          icon: <DashboardOutlined />,
          label: '管理仪表板',
        },
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/admin/analytics',
          icon: <BarChartOutlined />,
          label: '数据分析',
        },
        {
          key: '/admin/ai-moderation',
          icon: <RobotOutlined />,
          label: 'AI审核',
        },
        {
          key: '/admin/tag-management',
          icon: <TagsOutlined />,
          label: '标签管理',
        },
        {
          key: '/admin/api-management',
          icon: <ApiOutlined />,
          label: 'API管理',
        },
        {
          key: '/admin/api-documentation',
          icon: <FileTextOutlined />,
          label: 'API文档',
        },
        {
          key: '/admin/database-schema',
          icon: <DatabaseOutlined />,
          label: '数据库结构',
        },
        {
          key: '/admin/system-monitoring',
          icon: <MonitorOutlined />,
          label: '系统监控',
        },
        {
          key: '/admin/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        },
      ];
    } else {
      // 审核员菜单
      return [
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: '仪表板',
        },
        {
          key: '/pending',
          icon: <FileTextOutlined />,
          label: '待审核内容',
        },
        {
          key: '/history',
          icon: <HistoryOutlined />,
          label: '审核历史',
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {(() => {
            const isSuperAdmin = user?.role === 'super_admin' || user?.userType === 'super_admin';
            const isAdmin = user?.role === 'admin' || user?.userType === 'admin';

            if (collapsed) {
              if (isSuperAdmin) return '超管';
              if (isAdmin) return '管理';
              return '审核';
            } else {
              if (isSuperAdmin) return '超级管理员控制台';
              if (isAdmin) return '系统管理控制台';
              return '审核员管理系统';
            }
          })()}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            <Text>欢迎，{user?.display_name || user?.name || user?.username || '用户'}</Text>
            {(user?.role === 'super_admin' || user?.userType === 'super_admin') && (
              <CrownOutlined style={{ color: '#faad14' }} title="超级管理员" />
            )}
            {(user?.role === 'admin' || user?.userType === 'admin') && !(user?.role === 'super_admin' || user?.userType === 'super_admin') && (
              <CrownOutlined style={{ color: '#1890ff' }} title="管理员" />
            )}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Avatar
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </Space>
        </Header>
        
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

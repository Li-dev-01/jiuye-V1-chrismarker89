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
  TagsOutlined,
  ExperimentOutlined,
  SecurityScanOutlined,
  FlagOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../../stores/superAdminAuthStore';
import PermissionIndicator from '../auth/PermissionIndicator';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检测当前用户类型并使用相应的认证存储
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  // 确定当前活跃的认证状态
  const currentAuth = superAdminAuth.isAuthenticated ? superAdminAuth :
                     adminAuth.isAuthenticated ? adminAuth :
                     reviewerAuth;

  const { user, logout } = currentAuth;
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    // 根据用户类型重定向到相应的登录页面
    if (user?.role === 'super_admin') {
      navigate('/admin/super-login');
    } else if (user?.role === 'admin') {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  // 根据用户角色动态生成菜单 - 严格权限控制
  const getMenuItems = () => {
    const isSuperAdmin = user?.role === 'super_admin' || user?.userType === 'super_admin';
    const isAdmin = user?.role === 'admin' || user?.userType === 'admin';

    if (isSuperAdmin) {
      // 超级管理员菜单 - 安全控制和最高级别管理
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
          key: '/admin/reputation-management',
          icon: <FlagOutlined />,
          label: '信誉管理',
        },
        {
          key: '/admin/story-management',
          icon: <BookOutlined />,
          label: '故事内容管理',
        },
        {
          key: '/admin/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        },
        // 🔥 超级管理员专属功能
        {
          key: 'super-admin-group',
          icon: <CrownOutlined />,
          label: '超级管理功能',
          style: {
            background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
            borderRadius: '6px',
            margin: '4px 0',
            fontWeight: 'bold'
          },
          children: [
            {
              key: '/admin/security-console',
              icon: <SecurityScanOutlined />,
              label: '安全控制台',
            },
            {
              key: '/admin/system-logs',
              icon: <FileTextOutlined />,
              label: '系统日志',
            },
            {
              key: '/admin/system-settings',
              icon: <SettingOutlined />,
              label: '系统配置',
            },
            {
              key: '/admin/email-role-accounts',
              icon: <CrownOutlined />,
              label: '账户管理',
            },
            {
              key: '/admin/security-switches',
              icon: <SecurityScanOutlined />,
              label: '安全开关',
            },
          ],
        },
        // 🧪 权限测试
        {
          key: '/admin/permission-test',
          icon: <ExperimentOutlined />,
          label: '权限测试',
        },
      ];
    } else if (isAdmin) {
      // 普通管理员菜单 - 技术管理和系统维护，无法访问超级管理功能
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
          key: '/admin/reputation-management',
          icon: <FlagOutlined />,
          label: '信誉管理',
        },
        {
          key: '/admin/story-management',
          icon: <BookOutlined />,
          label: '故事内容管理',
        },
        // 🔧 普通管理员专属功能 - 技术管理
        {
          key: '/admin/api-management',
          icon: <ApiOutlined />,
          label: 'API管理',
          style: {
            background: 'rgba(24, 144, 255, 0.1)',
            borderRadius: '6px',
            margin: '4px 0'
          }
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
        // 🧪 权限测试
        {
          key: '/admin/permission-test',
          icon: <ExperimentOutlined />,
          label: '权限测试',
        },
        // ❌ 注意：普通管理员无法访问超级管理功能
      ];
    } else {
      // 审核员菜单 - 只能访问审核相关功能
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
        {
          key: '/permission-test',
          icon: <ExperimentOutlined />,
          label: '权限测试',
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

            {/* 权限指示器 */}
            <PermissionIndicator compact={true} />

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

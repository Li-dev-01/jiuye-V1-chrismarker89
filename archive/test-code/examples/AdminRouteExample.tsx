/**
 * 管理员路由配置示例
 * 展示如何将超级管理员设置集成到现有路由系统中
 *
 * @deprecated 此示例组件已过时，请参考 RoleBasedHeader 和 AdminLayout 组件的实际实现
 * 保留此文件仅作为参考，实际项目中请使用统一的导航系统
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Space, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  BookOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { SuperAdminSettings } from '../pages/admin/SuperAdminSettings';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 模拟管理员组件
const AdminDashboard = () => (
  <div style={{ padding: '24px' }}>
    <Title level={2}>管理员仪表板</Title>
    <p>这里是管理员仪表板内容...</p>
  </div>
);

const UserManagement = () => (
  <div style={{ padding: '24px' }}>
    <Title level={2}>用户管理</Title>
    <p>这里是用户管理内容...</p>
  </div>
);

const QuestionnaireManagement = () => (
  <div style={{ padding: '24px' }}>
    <Title level={2}>问卷管理</Title>
    <p>这里是问卷管理内容...</p>
  </div>
);

const VoiceManagement = () => (
  <div style={{ padding: '24px' }}>
    <Title level={2}>心声管理</Title>
    <p>这里是心声管理内容...</p>
  </div>
);

const StoryManagement = () => (
  <div style={{ padding: '24px' }}>
    <Title level={2}>故事管理</Title>
    <p>这里是故事管理内容...</p>
  </div>
);

// 权限检查Hook
const useAdminAuth = () => {
  // 模拟管理员权限检查
  const isAdmin = true; // 实际应该从认证状态获取
  const isSuperAdmin = true; // 实际应该从用户角色获取
  
  return { isAdmin, isSuperAdmin };
};

// 受保护的路由组件
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requireSuperAdmin?: boolean;
}> = ({ children, requireSuperAdmin = false }) => {
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>访问被拒绝</Title>
        <p>您没有访问此页面的权限，需要超级管理员权限。</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

export const AdminRouteExample: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  
  // 菜单项配置
  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      path: '/admin/dashboard'
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
      path: '/admin/users'
    },
    {
      key: '/admin/questionnaires',
      icon: <FileTextOutlined />,
      label: '问卷管理',
      path: '/admin/questionnaires'
    },
    {
      key: '/admin/voices',
      icon: <MessageOutlined />,
      label: '心声管理',
      path: '/admin/voices'
    },
    {
      key: '/admin/stories',
      icon: <BookOutlined />,
      label: '故事管理',
      path: '/admin/stories'
    }
  ];

  // 如果是超级管理员，添加超级管理员设置
  if (isSuperAdmin) {
    menuItems.push({
      key: '/admin/super-settings',
      icon: <CrownOutlined />,
      label: '超级管理员设置',
      path: '/admin/super-settings'
    });
  }

  // 用户下拉菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人资料
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        账户设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider width={250} theme="dark">
        <div style={{ 
          padding: '16px', 
          color: 'white', 
          borderBottom: '1px solid #303030',
          textAlign: 'center'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            管理后台
          </Title>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/admin/dashboard']}
          style={{ borderRight: 0 }}
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              <a href={item.path}>{item.label}</a>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        {/* 顶部导航 */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              管理员控制台
            </Title>
          </div>
          
          <Space>
            {isSuperAdmin && (
              <Button 
                type="primary" 
                icon={<CrownOutlined />}
                href="/admin/super-settings"
              >
                超级管理员
              </Button>
            )}
            
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>超级管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 主内容区 */}
        <Content style={{ background: '#f0f2f5' }}>
          <Routes>
            {/* 默认重定向到仪表板 */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* 普通管理员路由 */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/questionnaires" 
              element={
                <ProtectedRoute>
                  <QuestionnaireManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/voices" 
              element={
                <ProtectedRoute>
                  <VoiceManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/stories" 
              element={
                <ProtectedRoute>
                  <StoryManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* 超级管理员专用路由 */}
            <Route 
              path="/admin/super-settings/*" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminSettings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

// 使用示例
export const AdminApp: React.FC = () => {
  return (
    <div>
      <h2>管理员系统集成示例</h2>
      <p>以下是如何将超级管理员设置集成到现有管理系统中：</p>
      
      <AdminRouteExample />
      
      <div style={{ marginTop: '24px', padding: '16px', background: '#f6f8fa', borderRadius: '6px' }}>
        <h3>集成说明：</h3>
        <ul>
          <li><strong>权限控制</strong>：通过 <code>ProtectedRoute</code> 组件控制访问权限</li>
          <li><strong>超级管理员</strong>：只有超级管理员才能访问高级设置</li>
          <li><strong>菜单动态</strong>：根据用户权限动态显示菜单项</li>
          <li><strong>路由保护</strong>：所有管理员路由都受到权限保护</li>
          <li><strong>防爬虫设置</strong>：集成在超级管理员设置中</li>
          <li><strong>缓存管理</strong>：提供可视化的缓存配置界面</li>
        </ul>
      </div>
    </div>
  );
};

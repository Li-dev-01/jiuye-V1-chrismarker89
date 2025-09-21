import React from 'react';
import { Card, Typography, Space, Tag, Button, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { Permission, UserType } from '../../types/uuid-system';

const { Text, Title } = Typography;

export const PermissionTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    isAuthenticated, 
    hasPermission, 
    canAccessRoute 
  } = useUniversalAuthStore();

  const testPermissions = [
    Permission.PROJECT_MANAGEMENT,
    Permission.MANAGE_USERS,
    Permission.REVIEW_CONTENT,
    Permission.BROWSE_CONTENT,
    Permission.SYSTEM_SETTINGS
  ];

  const testRoutes = [
    '/admin',
    '/admin/users',
    '/reviewer/dashboard',
    '/analytics',
    '/'
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>权限系统测试页面</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 用户信息 */}
        <Card title="当前用户信息" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>认证状态: </Text>
              <Tag color={isAuthenticated ? 'green' : 'red'}>
                {isAuthenticated ? '已认证' : '未认证'}
              </Tag>
            </div>
            
            {currentUser && (
              <>
                <div>
                  <Text strong>用户类型: </Text>
                  <Tag color="blue">{currentUser.userType}</Tag>
                </div>
                
                <div>
                  <Text strong>用户UUID: </Text>
                  <Text code style={{ fontSize: '12px' }}>{currentUser.uuid}</Text>
                </div>
                
                <div>
                  <Text strong>显示名称: </Text>
                  <Text>{currentUser.display_name}</Text>
                </div>
              </>
            )}
          </Space>
        </Card>

        {/* 权限测试 */}
        <Card title="权限测试" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>权限检查结果:</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {testPermissions.map(permission => (
                <div key={permission} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '12px' }}>{permission}:</Text>
                  <Tag color={hasPermission(permission) ? 'green' : 'red'} size="small">
                    {hasPermission(permission) ? '✓' : '✗'}
                  </Tag>
                </div>
              ))}
            </div>
          </Space>
        </Card>

        {/* 路由访问测试 */}
        <Card title="路由访问测试" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>路由访问权限:</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {testRoutes.map(route => (
                <div key={route} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '12px' }}>{route}:</Text>
                  <Tag color={canAccessRoute(route) ? 'green' : 'red'} size="small">
                    {canAccessRoute(route) ? '✓' : '✗'}
                  </Tag>
                </div>
              ))}
            </div>
          </Space>
        </Card>

        {/* 用户类型权限映射 */}
        <Card title="用户类型权限映射" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>管理员 (admin) 应该有的权限:</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color="blue">PROJECT_MANAGEMENT</Tag>
                <Tag color="blue">MANAGE_USERS</Tag>
                <Tag color="blue">REVIEW_CONTENT</Tag>
                <Tag color="blue">BROWSE_CONTENT</Tag>
                <Tag color="blue">SYSTEM_SETTINGS</Tag>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>审核员 (reviewer) 应该有的权限:</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color="green">REVIEW_CONTENT</Tag>
                <Tag color="green">BROWSE_CONTENT</Tag>
                <Tag color="red">PROJECT_MANAGEMENT (无)</Tag>
                <Tag color="red">MANAGE_USERS (无)</Tag>
              </div>
            </div>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card title="测试操作" size="small">
          <Space wrap>
            <Button onClick={() => navigate('/admin/login')}>
              前往登录页面
            </Button>
            <Button 
              type="primary" 
              onClick={() => navigate('/admin')}
              disabled={!canAccessRoute('/admin')}
            >
              前往管理页面 {!canAccessRoute('/admin') && '(无权限)'}
            </Button>
            <Button 
              onClick={() => navigate('/reviewer/dashboard')}
              disabled={!canAccessRoute('/reviewer/dashboard')}
            >
              前往审核员页面 {!canAccessRoute('/reviewer/dashboard') && '(无权限)'}
            </Button>
            <Button onClick={() => navigate('/debug/auth')}>
              查看认证状态
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

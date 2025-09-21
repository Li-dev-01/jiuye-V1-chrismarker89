/**
 * 简单的管理员测试页面
 * 用于调试管理员登录后闪退的问题
 */

import React from 'react';
import { Card, Typography, Tag, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { AuthStatusDebugger } from '../../components/debug/AuthStatusDebugger';

const { Title, Text } = Typography;

export const SimpleAdminTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    isAuthenticated, 
    isLoading, 
    logout,
    isAdmin,
    hasPermission 
  } = useManagementAuthStore();

  console.log('SimpleAdminTestPage 渲染:', {
    isAuthenticated,
    isLoading,
    currentUser: currentUser ? {
      userType: currentUser.userType,
      username: currentUser.username,
      display_name: currentUser.display_name
    } : null,
    isAdmin: isAdmin(),
    timestamp: new Date().toISOString()
  });

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <AuthStatusDebugger />
      
      <Card title="简单管理员测试页面" style={{ marginTop: '60px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>认证状态</Title>
            <Space wrap>
              <Tag color={isAuthenticated ? 'green' : 'red'}>
                认证状态: {isAuthenticated ? '已认证' : '未认证'}
              </Tag>
              <Tag color={isLoading ? 'orange' : 'blue'}>
                加载状态: {isLoading ? '加载中' : '已完成'}
              </Tag>
              <Tag color={isAdmin() ? 'green' : 'red'}>
                管理员权限: {isAdmin() ? '是' : '否'}
              </Tag>
            </Space>
          </div>

          {currentUser && (
            <div>
              <Title level={3}>用户信息</Title>
              <Space direction="vertical">
                <div>
                  <Text strong>用户类型: </Text>
                  <Tag color="blue">{currentUser.userType}</Tag>
                </div>
                <div>
                  <Text strong>用户名: </Text>
                  <Text>{currentUser.username}</Text>
                </div>
                <div>
                  <Text strong>显示名称: </Text>
                  <Text>{currentUser.display_name}</Text>
                </div>
                <div>
                  <Text strong>用户ID: </Text>
                  <Text code>{currentUser.id}</Text>
                </div>
                <div>
                  <Text strong>UUID: </Text>
                  <Text code style={{ fontSize: '11px' }}>{currentUser.uuid}</Text>
                </div>
                <div>
                  <Text strong>状态: </Text>
                  <Tag color={currentUser.status === 'active' ? 'green' : 'red'}>
                    {currentUser.status}
                  </Tag>
                </div>
              </Space>
            </div>
          )}

          <div>
            <Title level={3}>权限测试</Title>
            <Space wrap>
              <Tag color={hasPermission('manage_users') ? 'green' : 'red'}>
                用户管理: {hasPermission('manage_users') ? '✓' : '✗'}
              </Tag>
              <Tag color={hasPermission('view_admin_analytics') ? 'green' : 'red'}>
                数据分析: {hasPermission('view_admin_analytics') ? '✓' : '✗'}
              </Tag>
              <Tag color={hasPermission('system_settings') ? 'green' : 'red'}>
                系统设置: {hasPermission('system_settings') ? '✓' : '✗'}
              </Tag>
            </Space>
          </div>

          <div>
            <Title level={3}>操作</Title>
            <Space>
              <Button 
                type="primary" 
                onClick={() => navigate('/admin')}
                disabled={!isAdmin()}
              >
                前往完整管理页面
              </Button>
              <Button onClick={() => navigate('/admin/login')}>
                前往登录页面
              </Button>
              <Button 
                danger 
                onClick={handleLogout}
                disabled={!isAuthenticated}
              >
                退出登录
              </Button>
            </Space>
          </div>

          <div>
            <Title level={3}>调试信息</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {JSON.stringify({
                isAuthenticated,
                isLoading,
                isAdmin: isAdmin(),
                userType: currentUser?.userType,
                username: currentUser?.username,
                permissions: currentUser?.permissions?.slice(0, 5) // 只显示前5个权限
              }, null, 2)}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

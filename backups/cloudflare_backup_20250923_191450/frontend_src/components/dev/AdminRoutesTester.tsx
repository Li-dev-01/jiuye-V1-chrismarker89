/**
 * 管理员路由测试工具
 * 用于系统性测试所有管理员路由的可访问性
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Tag, List, Alert, Divider } from 'antd';
import { Link } from 'react-router-dom';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface RouteTest {
  path: string;
  name: string;
  description: string;
  guardType: 'NewAdminRouteGuard' | 'SuperAdminRouteGuard' | 'AdminRouteGuard';
  status: 'pending' | 'testing' | 'success' | 'error';
  error?: string;
}

const ADMIN_ROUTES: RouteTest[] = [
  // 基础管理员路由
  { path: '/admin', name: '管理仪表板', description: '主要管理界面', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/content', name: '内容管理', description: '管理用户提交的内容', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/users', name: '用户管理', description: '简化版用户管理', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/users-full', name: '完整用户管理', description: '完整版用户管理', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/reviewers', name: '审核员管理', description: '管理审核员账号', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/audit-rules', name: '审核规则', description: '配置审核规则', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/user-content', name: '用户内容管理', description: '管理用户内容', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/violation-content', name: '违规内容', description: '查看违规内容', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/performance', name: '性能监控', description: '系统性能监控', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/api-data', name: 'API数据', description: 'API数据管理', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/data-generator', name: '数据生成器', description: '测试数据生成', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/png-management', name: 'PNG管理', description: '图片资源管理', guardType: 'NewAdminRouteGuard', status: 'pending' },

  // 超级管理员路由
  { path: '/admin/system', name: '系统管理', description: '系统配置管理', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/logs', name: '系统日志', description: '查看系统日志', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/security', name: '安全管理', description: '安全配置管理', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/google-whitelist', name: 'Google白名单', description: 'Google服务白名单', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/ip-access-control', name: 'IP访问控制', description: 'IP访问控制管理', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/intelligent-security', name: '智能安全', description: '智能安全系统', guardType: 'SuperAdminRouteGuard', status: 'pending' },
  { path: '/admin/login-monitor', name: '登录监控', description: '登录活动监控', guardType: 'AdminRouteGuard', status: 'pending' },

  // AI管理路由
  { path: '/admin/ai/sources', name: 'AI源管理', description: 'AI数据源管理', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/ai/monitor', name: 'AI监控', description: 'AI系统监控', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/ai/cost', name: 'AI成本控制', description: 'AI使用成本控制', guardType: 'NewAdminRouteGuard', status: 'pending' },
  { path: '/admin/ai/review-assistant', name: 'AI审核助手', description: 'AI辅助审核', guardType: 'NewAdminRouteGuard', status: 'pending' },

  // 超级管理员专用
  { path: '/admin/super-admin', name: '超级管理员', description: '超级管理员专用页面', guardType: 'SuperAdminRouteGuard', status: 'pending' },
];

export const AdminRoutesTester: React.FC = () => {
  const [routes, setRoutes] = useState<RouteTest[]>(ADMIN_ROUTES);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateRouteStatus = (path: string, status: RouteTest['status'], error?: string) => {
    setRoutes(prev => prev.map(route => 
      route.path === path ? { ...route, status, error } : route
    ));
  };

  const testRoute = async (route: RouteTest) => {
    updateRouteStatus(route.path, 'testing');

    try {
      // 实际测试路由是否可访问
      const response = await fetch(`http://localhost:5176${route.path}`, {
        method: 'HEAD',
        credentials: 'include'
      });

      // 检查是否返回HTML页面（而不是重定向到登录页）
      const isAccessible = response.ok && !response.url.includes('/admin/login');

      if (isAccessible) {
        updateRouteStatus(route.path, 'success');
      } else {
        updateRouteStatus(route.path, 'error', `访问失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      updateRouteStatus(route.path, 'error', error instanceof Error ? error.message : '未知错误');
    }
  };

  const testAllRoutes = async () => {
    setIsTestingAll(true);
    
    for (const route of routes) {
      await testRoute(route);
      // 添加延迟避免过快
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (status: RouteTest['status']) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'testing': return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default: return <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getGuardTypeColor = (guardType: string) => {
    switch (guardType) {
      case 'NewAdminRouteGuard': return 'blue';
      case 'SuperAdminRouteGuard': return 'red';
      case 'AdminRouteGuard': return 'green';
      default: return 'default';
    }
  };

  const successCount = routes.filter(r => r.status === 'success').length;
  const errorCount = routes.filter(r => r.status === 'error').length;
  const pendingCount = routes.filter(r => r.status === 'pending').length;

  return (
    <Card title="管理员路由测试工具" style={{ margin: '20px' }}>
      <Alert
        message="路由测试说明"
        description="此工具用于测试所有管理员路由的可访问性。点击路由链接进行手动测试，或使用批量测试功能。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<RocketOutlined />}
            onClick={testAllRoutes}
            loading={isTestingAll}
          >
            批量测试
          </Button>
          <Text>
            成功: <Tag color="green">{successCount}</Tag>
            失败: <Tag color="red">{errorCount}</Tag>
            待测: <Tag color="default">{pendingCount}</Tag>
          </Text>
        </Space>
      </div>

      <List
        dataSource={routes}
        renderItem={(route) => (
          <List.Item
            actions={[
              <Button 
                size="small" 
                onClick={() => testRoute(route)}
                loading={route.status === 'testing'}
              >
                测试
              </Button>,
              <Link to={route.path} target="_blank">
                <Button size="small" type="link">访问</Button>
              </Link>
            ]}
          >
            <List.Item.Meta
              avatar={getStatusIcon(route.status)}
              title={
                <Space>
                  <Text strong>{route.name}</Text>
                  <Tag color={getGuardTypeColor(route.guardType)} size="small">
                    {route.guardType.replace('RouteGuard', '')}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <Text type="secondary">{route.description}</Text>
                  <br />
                  <Text code style={{ fontSize: '12px' }}>{route.path}</Text>
                  {route.error && (
                    <>
                      <br />
                      <Text type="danger" style={{ fontSize: '12px' }}>错误: {route.error}</Text>
                    </>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

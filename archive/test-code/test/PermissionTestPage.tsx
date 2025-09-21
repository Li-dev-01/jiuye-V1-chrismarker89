import React, { useState } from 'react';
import { Card, Row, Col, Button, Table, Tag, Space, Typography, Alert, Divider } from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/RoleBasedLayout';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import { PermissionGuard, PermissionButton, PermissionText } from '../../components/auth/PermissionGuard';
import { canAccessRoute, hasPermission, hasRole } from '../../utils/permissions';
import type { UserRole, Permission } from '../../types/auth';
import styles from './PermissionTestPage.module.css';

const { Title, Paragraph, Text } = Typography;

export const PermissionTestPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useUniversalAuthStore();
  const [testResults, setTestResults] = useState<any[]>([]);

  // 测试路由列表
  const testRoutes = [
    { path: '/', name: '首页', expectedRoles: ['guest', 'user', 'reviewer', 'admin'] },
    { path: '/analytics', name: '数据可视化', expectedRoles: ['guest', 'user', 'reviewer', 'admin'] },
    { path: '/questionnaire', name: '问卷填写', expectedRoles: ['user', 'admin'] },
    { path: '/reviewer', name: '审核工作台', expectedRoles: ['reviewer', 'admin'] },
    { path: '/reviewer/dashboard', name: '审核仪表板', expectedRoles: ['reviewer', 'admin'] },
    { path: '/admin', name: '管理控制台', expectedRoles: ['admin'] },
    { path: '/admin/users', name: '用户管理', expectedRoles: ['admin'] },
    { path: '/admin/api-data', name: 'API管理', expectedRoles: ['admin'] }
  ];

  // 测试权限列表
  const testPermissions: Permission[] = [
    'view_home',
    'view_analytics',
    'create_questionnaire',
    'review_questionnaires',
    'manage_users',
    'manage_api'
  ];

  // 执行权限测试
  const runPermissionTest = () => {
    const results: any[] = [];

    // 测试路由权限
    testRoutes.forEach(route => {
      const accessResult = canAccessRoute(currentUser, route.path);
      const shouldHaveAccess = currentUser ? route.expectedRoles.includes(currentUser.role) : route.expectedRoles.includes('guest');
      
      results.push({
        type: 'route',
        name: route.name,
        path: route.path,
        hasAccess: accessResult.hasPermission,
        shouldHaveAccess,
        isCorrect: accessResult.hasPermission === shouldHaveAccess,
        reason: accessResult.reason
      });
    });

    // 测试权限检查
    testPermissions.forEach(permission => {
      const hasPermissionResult = hasPermission(currentUser, permission);
      let shouldHavePermission = false;

      if (currentUser) {
        switch (permission) {
          case 'view_home':
          case 'view_analytics':
            shouldHavePermission = true;
            break;
          case 'create_questionnaire':
            shouldHavePermission = ['user', 'admin'].includes(currentUser.role);
            break;
          case 'review_questionnaires':
            shouldHavePermission = ['reviewer', 'admin'].includes(currentUser.role);
            break;
          case 'manage_users':
          case 'manage_api':
            shouldHavePermission = ['admin'].includes(currentUser.role);
            break;
        }
      }

      results.push({
        type: 'permission',
        name: permission,
        hasAccess: hasPermissionResult,
        shouldHaveAccess: shouldHavePermission,
        isCorrect: hasPermissionResult === shouldHavePermission
      });
    });

    setTestResults(results);
  };

  // 表格列定义
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'route' ? 'blue' : 'green'}>
          {type === 'route' ? '路由' : '权限'}
        </Tag>
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '路径/权限',
      dataIndex: 'path',
      key: 'path',
      render: (text: string, record: any) => (
        <Text code>{record.path || record.name}</Text>
      )
    },
    {
      title: '实际结果',
      dataIndex: 'hasAccess',
      key: 'hasAccess',
      width: 100,
      render: (hasAccess: boolean) => (
        <Tag color={hasAccess ? 'success' : 'error'} icon={hasAccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {hasAccess ? '有权限' : '无权限'}
        </Tag>
      )
    },
    {
      title: '预期结果',
      dataIndex: 'shouldHaveAccess',
      key: 'shouldHaveAccess',
      width: 100,
      render: (shouldHaveAccess: boolean) => (
        <Tag color={shouldHaveAccess ? 'success' : 'default'}>
          {shouldHaveAccess ? '应有权限' : '应无权限'}
        </Tag>
      )
    },
    {
      title: '测试结果',
      dataIndex: 'isCorrect',
      key: 'isCorrect',
      width: 100,
      render: (isCorrect: boolean) => (
        <Tag color={isCorrect ? 'success' : 'error'} icon={isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isCorrect ? '通过' : '失败'}
        </Tag>
      )
    }
  ];

  // 获取用户角色显示
  const getUserRoleDisplay = () => {
    if (!isAuthenticated || !currentUser) return '未登录 (guest)';
    return `${currentUser.username} (${currentUser.role})`;
  };

  // 获取测试统计
  const getTestStats = () => {
    if (testResults.length === 0) return null;
    
    const passed = testResults.filter(r => r.isCorrect).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    return { passed, total, passRate };
  };

  const stats = getTestStats();

  return (
    <PublicLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>权限系统测试</Title>
          <Paragraph>
            此页面用于测试用户权限系统的正确性，验证不同角色的权限隔离是否有效。
          </Paragraph>
        </div>

        {/* 当前用户信息 */}
        <Card title="当前用户信息" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text strong>登录状态: </Text>
              <Tag color={isAuthenticated ? 'success' : 'default'}>
                {isAuthenticated ? '已登录' : '未登录'}
              </Tag>
            </Col>
            <Col span={8}>
              <Text strong>用户信息: </Text>
              <Text>{getUserRoleDisplay()}</Text>
            </Col>
            <Col span={8}>
              <Text strong>匿名用户: </Text>
              <Tag color={currentUser?.isAnonymous ? 'orange' : 'default'}>
                {currentUser?.isAnonymous ? '是' : '否'}
              </Tag>
            </Col>
          </Row>
        </Card>

        {/* 权限测试控制 */}
        <Card title="权限测试" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Button type="primary" onClick={runPermissionTest} icon={<SafetyOutlined />}>
                执行权限测试
              </Button>
              <Text style={{ marginLeft: 16 }}>
                点击按钮测试当前用户的路由访问权限和功能权限
              </Text>
            </div>
            
            {stats && (
              <Alert
                message={`测试完成: ${stats.passed}/${stats.total} 项通过 (${stats.passRate}%)`}
                type={stats.passRate === '100.0' ? 'success' : 'warning'}
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <Card title="测试结果">
            <Table
              columns={columns}
              dataSource={testResults}
              rowKey={(record, index) => `${record.type}-${record.name}-${index}`}
              pagination={false}
              size="small"
              rowClassName={(record) => record.isCorrect ? '' : styles.failedRow}
            />
          </Card>
        )}

        {/* 权限组件测试 */}
        <Card title="权限组件测试" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Divider orientation="left">PermissionGuard 组件测试</Divider>
            
            <PermissionGuard permission="view_home">
              <Alert message="✅ 您有查看首页的权限" type="success" />
            </PermissionGuard>
            
            <PermissionGuard permission="create_questionnaire" fallback={
              <Alert message="❌ 您没有填写问卷的权限" type="error" />
            }>
              <Alert message="✅ 您有填写问卷的权限" type="success" />
            </PermissionGuard>
            
            <PermissionGuard permission="review_questionnaires" fallback={
              <Alert message="❌ 您没有审核权限" type="error" />
            }>
              <Alert message="✅ 您有审核权限" type="success" />
            </PermissionGuard>
            
            <PermissionGuard permission="manage_users" fallback={
              <Alert message="❌ 您没有管理员权限" type="error" />
            }>
              <Alert message="✅ 您有管理员权限" type="success" />
            </PermissionGuard>

            <Divider orientation="left">PermissionButton 组件测试</Divider>
            
            <Space wrap>
              <PermissionButton permission="view_analytics" type="primary">
                查看数据分析
              </PermissionButton>
              
              <PermissionButton permission="create_questionnaire" type="default">
                填写问卷
              </PermissionButton>
              
              <PermissionButton permission="review_questionnaires" type="default">
                审核内容
              </PermissionButton>
              
              <PermissionButton permission="manage_users" type="primary" danger>
                用户管理
              </PermissionButton>
            </Space>

            <Divider orientation="left">角色测试链接</Divider>
            
            <Space wrap>
              <Link to="/login">
                <Button icon={<UserOutlined />}>普通用户登录</Button>
              </Link>
              <Link to="/reviewer/login">
                <Button icon={<SafetyOutlined />}>审核员登录</Button>
              </Link>
              <Link to="/admin/login">
                <Button icon={<CrownOutlined />}>管理员登录</Button>
              </Link>
            </Space>
          </Space>
        </Card>
      </div>
    </PublicLayout>
  );
};

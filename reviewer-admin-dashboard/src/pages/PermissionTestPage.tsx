/**
 * 权限测试页面
 * 用于验证和展示权限控制系统的工作状态
 */

import React, { useState } from 'react';
import { Card, Row, Col, Alert, Divider, Space, Button, Tag, Table, Typography, message } from 'antd';
import {
  SecurityScanOutlined,
  UserOutlined,
  ToolOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../stores/superAdminAuthStore';
import PermissionIndicator from '../components/auth/PermissionIndicator';
import {
  getUserRole,
  getUserPermissions,
  canAccessFeature,
  hasPermission,
  isReviewer,
  isAdmin,
  isSuperAdmin,
  FEATURE_PERMISSIONS,
  type Permission
} from '../utils/rolePermissions';

const { Title, Text, Paragraph } = Typography;

const PermissionTestPage: React.FC = () => {
  const [copyLoading, setCopyLoading] = useState(false);

  // 获取所有三个认证状态
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  // 确定当前的用户信息
  const getCurrentUser = () => {
    if (superAdminAuth.isAuthenticated && superAdminAuth.user) {
      return superAdminAuth.user;
    } else if (adminAuth.isAuthenticated && adminAuth.user) {
      return adminAuth.user;
    } else if (reviewerAuth.isAuthenticated && reviewerAuth.user) {
      return reviewerAuth.user;
    }
    return null;
  };

  const user = getCurrentUser();
  const userRole = getUserRole(user);
  const userPermissions = getUserPermissions(user);

  // 功能访问测试
  const featureTests = Object.entries(FEATURE_PERMISSIONS).map(([feature, requiredPermissions]) => ({
    feature,
    requiredPermissions,
    hasAccess: canAccessFeature(user, feature),
    description: getFeatureDescription(feature)
  }));

  // 权限测试
  const permissionTests: Array<{
    permission: Permission;
    hasPermission: boolean;
    category: string;
  }> = [
    // 审核员权限测试
    { permission: 'review:read', hasPermission: hasPermission(user, 'review:read'), category: '审核员' },
    { permission: 'review:create', hasPermission: hasPermission(user, 'review:create'), category: '审核员' },
    { permission: 'review:update', hasPermission: hasPermission(user, 'review:update'), category: '审核员' },
    { permission: 'review:history', hasPermission: hasPermission(user, 'review:history'), category: '审核员' },
    
    // 管理员权限测试
    { permission: 'admin:dashboard', hasPermission: hasPermission(user, 'admin:dashboard'), category: '管理员' },
    { permission: 'admin:users', hasPermission: hasPermission(user, 'admin:users'), category: '管理员' },
    { permission: 'admin:analytics', hasPermission: hasPermission(user, 'admin:analytics'), category: '管理员' },
    { permission: 'admin:api_management', hasPermission: hasPermission(user, 'admin:api_management'), category: '管理员' },
    { permission: 'admin:database', hasPermission: hasPermission(user, 'admin:database'), category: '管理员' },
    
    // 超级管理员权限测试
    { permission: 'super_admin:security_console', hasPermission: hasPermission(user, 'super_admin:security_console'), category: '超级管理员' },
    { permission: 'super_admin:emergency_control', hasPermission: hasPermission(user, 'super_admin:emergency_control'), category: '超级管理员' },
    { permission: 'super_admin:project_control', hasPermission: hasPermission(user, 'super_admin:project_control'), category: '超级管理员' },
    { permission: 'super_admin:admin_management', hasPermission: hasPermission(user, 'super_admin:admin_management'), category: '超级管理员' }
  ];

  // 角色检查结果
  const roleChecks = [
    { label: '是否为审核员', result: isReviewer(user), icon: <UserOutlined /> },
    { label: '是否为管理员', result: isAdmin(user), icon: <ToolOutlined /> },
    { label: '是否为超级管理员', result: isSuperAdmin(user), icon: <CrownOutlined /> }
  ];

  // 生成测试报告数据
  const generateTestReport = () => {
    const timestamp = new Date().toLocaleString('zh-CN');
    const permissionStats = {
      review: userPermissions.filter(p => p.startsWith('review:')).length,
      admin: userPermissions.filter(p => p.startsWith('admin:')).length,
      super_admin: userPermissions.filter(p => p.startsWith('super_admin:')).length
    };

    return {
      timestamp,
      user: {
        username: user?.username || '未知',
        displayName: user?.display_name || user?.name || '未设置',
        role: userRole || '未知',
        totalPermissions: userPermissions.length
      },
      roleChecks: roleChecks.map(check => ({
        label: check.label,
        result: check.result ? '✅ 通过' : '❌ 未通过'
      })),
      permissionStats,
      permissions: userPermissions,
      featureAccess: featureTests.map(test => ({
        feature: test.feature,
        description: test.description,
        hasAccess: test.hasAccess ? '✅ 可访问' : '❌ 无权限',
        requiredPermissions: test.requiredPermissions
      })),
      permissionDetails: permissionTests.map(test => ({
        permission: test.permission,
        category: test.category,
        hasPermission: test.hasPermission ? '✅ 拥有' : '❌ 缺失'
      }))
    };
  };

  // 复制测试报告
  const handleCopyReport = async () => {
    setCopyLoading(true);
    try {
      const report = generateTestReport();
      const reportText = `
🔐 权限测试报告
生成时间: ${report.timestamp}

👤 用户信息:
- 用户名: ${report.user.username}
- 显示名: ${report.user.displayName}
- 角色: ${report.user.role}
- 权限总数: ${report.user.totalPermissions}

🎭 角色检查:
${report.roleChecks.map(check => `- ${check.label}: ${check.result}`).join('\n')}

📊 权限统计:
- 审核权限: ${report.permissionStats.review}
- 管理权限: ${report.permissionStats.admin}
- 超管权限: ${report.permissionStats.super_admin}

🔑 所有权限:
${report.permissions.map(p => `- ${p}`).join('\n')}

🚀 功能访问测试:
${report.featureAccess.map(test => `- ${test.feature} (${test.description}): ${test.hasAccess}`).join('\n')}

🧪 详细权限测试:
${report.permissionDetails.map(test => `- [${test.category}] ${test.permission}: ${test.hasPermission}`).join('\n')}
      `.trim();

      await navigator.clipboard.writeText(reportText);
      message.success('测试报告已复制到剪贴板！');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请手动选择文本复制');
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <SecurityScanOutlined /> 权限控制测试页面
        </Title>
        <Button
          type="primary"
          icon={<CopyOutlined />}
          loading={copyLoading}
          onClick={handleCopyReport}
          size="large"
        >
          复制测试报告
        </Button>
      </div>

      <Alert
        message="权限控制系统状态检查"
        description="此页面用于验证当前用户的权限状态和系统权限控制的正确性。点击右上角按钮可复制完整测试报告。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[16, 16]}>
        {/* 用户信息 */}
        <Col span={24}>
          <Card title="当前用户信息" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text><strong>用户名:</strong> {user?.username || '未知'}</Text>
              <Text><strong>显示名:</strong> {user?.display_name || user?.name || '未设置'}</Text>
              <Text><strong>角色:</strong> {userRole || '未知'}</Text>
              <Text><strong>权限数量:</strong> {userPermissions.length}</Text>
              
              <Divider />
              <PermissionIndicator showDetails={true} showPermissionList={false} />
            </Space>
          </Card>
        </Col>

        {/* 角色检查 */}
        <Col span={12}>
          <Card title="角色检查" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {roleChecks.map((check, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    {check.icon}
                    <Text>{check.label}</Text>
                  </Space>
                  {check.result ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">是</Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} color="default">否</Tag>
                  )}
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* 权限统计 */}
        <Col span={12}>
          <Card title="权限统计" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>审核权限:</Text>
                <Tag color="blue">{userPermissions.filter(p => p.startsWith('review:')).length}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>管理权限:</Text>
                <Tag color="orange">{userPermissions.filter(p => p.startsWith('admin:')).length}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>超管权限:</Text>
                <Tag color="red">{userPermissions.filter(p => p.startsWith('super_admin:')).length}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text><strong>总计:</strong></Text>
                <Tag color="purple">{userPermissions.length}</Tag>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 功能访问测试 */}
        <Col span={24}>
          <Card title="功能访问测试" size="small">
            <Table
              dataSource={featureTests}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '功能模块',
                  dataIndex: 'feature',
                  key: 'feature',
                  render: (feature) => <Text code>{feature}</Text>
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description'
                },
                {
                  title: '所需权限',
                  dataIndex: 'requiredPermissions',
                  key: 'requiredPermissions',
                  render: (permissions: Permission[]) => (
                    <Space wrap>
                      {permissions.map(p => (
                        <Tag key={p} color={
                          p.startsWith('super_admin:') ? 'red' :
                          p.startsWith('admin:') ? 'orange' : 'blue'
                        } style={{ fontSize: '11px' }}>
                          {p}
                        </Tag>
                      ))}
                    </Space>
                  )
                },
                {
                  title: '访问状态',
                  dataIndex: 'hasAccess',
                  key: 'hasAccess',
                  render: (hasAccess: boolean) => (
                    hasAccess ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">可访问</Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="error">禁止访问</Tag>
                    )
                  )
                }
              ]}
            />
          </Card>
        </Col>

        {/* 权限详细列表 */}
        <Col span={24}>
          <Card title="权限详细测试" size="small">
            <Table
              dataSource={permissionTests}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '权限',
                  dataIndex: 'permission',
                  key: 'permission',
                  render: (permission) => <Text code>{permission}</Text>
                },
                {
                  title: '分类',
                  dataIndex: 'category',
                  key: 'category',
                  render: (category) => (
                    <Tag color={
                      category === '超级管理员' ? 'red' :
                      category === '管理员' ? 'orange' : 'blue'
                    }>
                      {category}
                    </Tag>
                  )
                },
                {
                  title: '权限状态',
                  dataIndex: 'hasPermission',
                  key: 'hasPermission',
                  render: (hasPermission: boolean) => (
                    hasPermission ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">拥有</Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="default">无权限</Tag>
                    )
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 获取功能描述
function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    reviewer_dashboard: '审核员仪表板',
    pending_reviews: '待审核内容管理',
    review_history: '审核历史记录',
    admin_dashboard: '管理员仪表板',
    user_management: '用户管理功能',
    analytics: '数据分析功能',
    ai_moderation: 'AI审核管理',
    tag_management: '标签管理',
    system_settings: '系统设置',
    api_management: 'API管理（普通管理员专属）',
    api_documentation: 'API文档（普通管理员专属）',
    database_schema: '数据库结构（普通管理员专属）',
    system_monitoring: '系统监控（普通管理员专属）',
    security_console: '安全控制台（超级管理员专属）',
    security_management: '安全管理（超级管理员专属）',
    system_logs: '系统日志（超级管理员专属）',
    system_management: '系统管理（超级管理员专属）',
    emergency_control: '紧急控制（超级管理员专属）',
    project_control: '项目控制（超级管理员专属）',
    threat_analysis: '威胁分析（超级管理员专属）',
    ip_management: 'IP管理（超级管理员专属）',
    admin_management: '管理员管理（超级管理员专属）'
  };
  
  return descriptions[feature] || '未知功能';
}

export default PermissionTestPage;

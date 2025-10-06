/**
 * 超级管理员权限诊断页面
 * 用于调试权限检查问题
 */

import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Alert, Button, Space, Typography, Divider, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../stores/superAdminAuthStore';
import { STORAGE_KEYS } from '../config/api';

const { Title, Paragraph, Text } = Typography;

const SuperAdminDiagnostics: React.FC = () => {
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      
      // 当前路径
      currentPath: window.location.pathname,
      
      // LocalStorage 检查
      localStorage: {
        super_admin_token: localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN),
        admin_token: localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
        reviewer_token: localStorage.getItem(STORAGE_KEYS.REVIEWER_TOKEN),
        super_admin_user: localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_USER_INFO),
        admin_user: localStorage.getItem(STORAGE_KEYS.ADMIN_USER_INFO),
        reviewer_user: localStorage.getItem(STORAGE_KEYS.REVIEWER_USER_INFO),
      },
      
      // 超级管理员 Store 状态
      superAdminStore: {
        isAuthenticated: superAdminAuth.isAuthenticated,
        hasUser: !!superAdminAuth.user,
        hasToken: !!superAdminAuth.token,
        isLoading: superAdminAuth.isLoading,
        user: superAdminAuth.user ? {
          id: superAdminAuth.user.id,
          username: superAdminAuth.user.username,
          email: superAdminAuth.user.email,
          role: superAdminAuth.user.role,
          userType: (superAdminAuth.user as any).userType,
          displayName: (superAdminAuth.user as any).displayName || superAdminAuth.user.display_name,
        } : null,
        tokenLength: superAdminAuth.token?.length || 0,
      },
      
      // 管理员 Store 状态
      adminStore: {
        isAuthenticated: adminAuth.isAuthenticated,
        hasUser: !!adminAuth.user,
        hasToken: !!adminAuth.token,
        isLoading: adminAuth.isLoading,
        user: adminAuth.user ? {
          id: adminAuth.user.id,
          username: adminAuth.user.username,
          email: adminAuth.user.email,
          role: adminAuth.user.role,
          userType: (adminAuth.user as any).userType,
        } : null,
      },
      
      // 审核员 Store 状态
      reviewerStore: {
        isAuthenticated: reviewerAuth.isAuthenticated,
        hasUser: !!reviewerAuth.user,
        hasToken: !!reviewerAuth.token,
        isLoading: reviewerAuth.isLoading,
        user: reviewerAuth.user ? {
          id: reviewerAuth.user.id,
          username: reviewerAuth.user.username,
          email: reviewerAuth.user.email,
          role: reviewerAuth.user.role,
        } : null,
      },
      
      // 权限检查逻辑
      permissionCheck: {
        superAdminPaths: [
          '/admin/security-console',
          '/admin/system-logs',
          '/admin/system-settings',
          '/admin/super-admin-panel',
          '/admin/security-switches',
          '/admin/email-role-accounts'
        ],
        currentPathIsSuperAdmin: [
          '/admin/security-console',
          '/admin/system-logs',
          '/admin/system-settings',
          '/admin/super-admin-panel',
          '/admin/security-switches',
          '/admin/email-role-accounts'
        ].some(path => window.location.pathname.startsWith(path)),
        
        // 模拟 RoleGuard 的权限检查
        getCurrentAuth: () => {
          if (superAdminAuth.isAuthenticated && superAdminAuth.user) {
            return {
              authType: 'super_admin',
              user: superAdminAuth.user,
              isAuthenticated: true,
            };
          } else if (adminAuth.isAuthenticated && adminAuth.user) {
            return {
              authType: 'admin',
              user: adminAuth.user,
              isAuthenticated: true,
            };
          } else if (reviewerAuth.isAuthenticated && reviewerAuth.user) {
            return {
              authType: 'reviewer',
              user: reviewerAuth.user,
              isAuthenticated: true,
            };
          } else {
            return {
              authType: 'none',
              user: null,
              isAuthenticated: false,
            };
          }
        },
      },
    };

    const currentAuth = data.permissionCheck.getCurrentAuth();
    const userRole = currentAuth.user?.role || (currentAuth.user as any)?.userType;

    (data.permissionCheck as any).currentAuth = currentAuth;
    (data.permissionCheck as any).userRole = userRole;
    (data.permissionCheck as any).allowedRolesForSuperAdmin = ['super_admin'];
    (data.permissionCheck as any).hasPermissionForSuperAdmin = ['super_admin'].includes(userRole);
    (data.permissionCheck as any).roleTypeCheck = {
      userRole,
      userRoleType: typeof userRole,
      allowedRole: 'super_admin',
      allowedRoleType: typeof 'super_admin',
      strictEqual: userRole === 'super_admin',
      includesCheck: ['super_admin'].includes(userRole),
    };

    setDiagnosticData(data);
    console.log('🔍 [DIAGNOSTICS] Full diagnostic data:', data);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const renderStatus = (value: boolean) => {
    return value ? (
      <Tag icon={<CheckCircleOutlined />} color="success">是</Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="error">否</Tag>
    );
  };

  const copyToClipboard = () => {
    const text = JSON.stringify(diagnosticData, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      message.success('诊断数据已复制到剪贴板！');
    }).catch(() => {
      message.error('复制失败，请手动复制控制台输出');
      console.log('📋 [COPY] Diagnostic data:', text);
    });
  };

  if (!diagnosticData) {
    return <Card loading />;
  }

  const currentAuth = diagnosticData.permissionCheck.currentAuth;
  const hasPermission = diagnosticData.permissionCheck.hasPermissionForSuperAdmin;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>🔍 超级管理员权限诊断</Title>
      <Paragraph type="secondary">
        诊断时间: {new Date(diagnosticData.timestamp).toLocaleString('zh-CN')}
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 总体状态 */}
        <Card>
          <Alert
            message={hasPermission ? "✅ 权限检查通过" : "❌ 权限检查失败"}
            description={
              hasPermission
                ? `当前用户 ${currentAuth.user?.username} 拥有超级管理员权限`
                : `当前用户角色 ${diagnosticData.permissionCheck.userRole} 不是超级管理员`
            }
            type={hasPermission ? "success" : "error"}
            showIcon
          />
        </Card>

        {/* 当前认证状态 */}
        <Card title="📋 当前认证状态" extra={<Tag color="blue">{currentAuth.authType}</Tag>}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="认证类型">{currentAuth.authType}</Descriptions.Item>
            <Descriptions.Item label="已认证">{renderStatus(currentAuth.isAuthenticated)}</Descriptions.Item>
            <Descriptions.Item label="用户名">{currentAuth.user?.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentAuth.user?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="user.role">{currentAuth.user?.role || '-'}</Descriptions.Item>
            <Descriptions.Item label="user.userType">{(currentAuth.user as any)?.userType || '-'}</Descriptions.Item>
            <Descriptions.Item label="最终角色">{diagnosticData.permissionCheck.userRole || '-'}</Descriptions.Item>
            <Descriptions.Item label="显示名称">{(currentAuth.user as any)?.displayName || currentAuth.user?.display_name || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 权限检查详情 */}
        <Card title="🛡️ 权限检查详情">
          <Descriptions bordered column={1}>
            <Descriptions.Item label="当前路径">
              <Text code>{diagnosticData.currentPath}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="是否为超级管理员路径">
              {renderStatus(diagnosticData.permissionCheck.currentPathIsSuperAdmin)}
            </Descriptions.Item>
            <Descriptions.Item label="用户角色">
              <Tag color="blue">{diagnosticData.permissionCheck.userRole}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="允许的角色">
              <Tag color="green">super_admin</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="权限检查结果">
              {renderStatus(hasPermission)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>🔬 角色类型检查</Title>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="用户角色值">
              <Text code>{JSON.stringify(diagnosticData.permissionCheck.roleTypeCheck.userRole)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="用户角色类型">
              <Tag>{diagnosticData.permissionCheck.roleTypeCheck.userRoleType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="允许角色值">
              <Text code>{JSON.stringify(diagnosticData.permissionCheck.roleTypeCheck.allowedRole)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="允许角色类型">
              <Tag>{diagnosticData.permissionCheck.roleTypeCheck.allowedRoleType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="严格相等 (===)">
              {renderStatus(diagnosticData.permissionCheck.roleTypeCheck.strictEqual)}
            </Descriptions.Item>
            <Descriptions.Item label="includes() 检查">
              {renderStatus(diagnosticData.permissionCheck.roleTypeCheck.includesCheck)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 超级管理员 Store */}
        <Card title="👑 超级管理员 Store 状态">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="isAuthenticated">
              {renderStatus(diagnosticData.superAdminStore.isAuthenticated)}
            </Descriptions.Item>
            <Descriptions.Item label="hasUser">
              {renderStatus(diagnosticData.superAdminStore.hasUser)}
            </Descriptions.Item>
            <Descriptions.Item label="hasToken">
              {renderStatus(diagnosticData.superAdminStore.hasToken)}
            </Descriptions.Item>
            <Descriptions.Item label="isLoading">
              {renderStatus(diagnosticData.superAdminStore.isLoading)}
            </Descriptions.Item>
            <Descriptions.Item label="Token 长度">
              {diagnosticData.superAdminStore.tokenLength}
            </Descriptions.Item>
          </Descriptions>

          {diagnosticData.superAdminStore.user && (
            <>
              <Divider />
              <Title level={5}>用户信息</Title>
              <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                {JSON.stringify(diagnosticData.superAdminStore.user, null, 2)}
              </pre>
            </>
          )}
        </Card>

        {/* LocalStorage 状态 */}
        <Card title="💾 LocalStorage 状态">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="super_admin_token">
              {diagnosticData.localStorage.super_admin_token ? (
                <Text code>{diagnosticData.localStorage.super_admin_token.substring(0, 50)}...</Text>
              ) : (
                <Tag color="red">不存在</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="admin_token">
              {diagnosticData.localStorage.admin_token ? (
                <Text code>{diagnosticData.localStorage.admin_token.substring(0, 50)}...</Text>
              ) : (
                <Tag color="default">不存在</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="reviewer_token">
              {diagnosticData.localStorage.reviewer_token ? (
                <Text code>{diagnosticData.localStorage.reviewer_token.substring(0, 50)}...</Text>
              ) : (
                <Tag color="default">不存在</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          {diagnosticData.localStorage.super_admin_user && (
            <>
              <Divider />
              <Title level={5}>超级管理员用户信息 (LocalStorage)</Title>
              <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                {diagnosticData.localStorage.super_admin_user}
              </pre>
            </>
          )}
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Space wrap>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              size="large"
            >
              📋 一键复制所有诊断数据
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={runDiagnostics}
            >
              重新诊断
            </Button>
            <Button
              onClick={() => {
                console.log('🔍 [DIAGNOSTICS] Full data:', diagnosticData);
                alert('诊断数据已输出到控制台');
              }}
            >
              输出到控制台
            </Button>
            <Button
              danger
              onClick={() => {
                if (window.confirm('确定要清除所有认证数据吗？')) {
                  localStorage.clear();
                  window.location.href = '/unified-login';
                }
              }}
            >
              清除所有认证数据
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SuperAdminDiagnostics;


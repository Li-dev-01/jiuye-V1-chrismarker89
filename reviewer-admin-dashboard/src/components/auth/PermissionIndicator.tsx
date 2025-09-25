/**
 * 权限指示器组件
 * 用于显示当前用户的权限状态和角色信息
 */

import React from 'react';
import { Tag, Tooltip, Space, Badge, Alert } from 'antd';
import {
  CrownOutlined,
  UserOutlined,
  SafetyOutlined,
  ToolOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../../stores/superAdminAuthStore';
import {
  getUserRole,
  getUserPermissions,
  isReviewer,
  isAdmin,
  isSuperAdmin,
  canAccessFeature,
  type UserRole,
  type Permission
} from '../../utils/rolePermissions';

interface PermissionIndicatorProps {
  showDetails?: boolean;
  showPermissionList?: boolean;
  compact?: boolean;
}

const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  showDetails = false,
  showPermissionList = false,
  compact = false
}) => {
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

  if (!user || !userRole) {
    return (
      <Tag icon={<LockOutlined />} color="default">
        未登录
      </Tag>
    );
  }

  // 角色配置
  const roleConfig = {
    reviewer: {
      label: '审核员',
      color: 'blue',
      icon: <EyeOutlined />,
      description: '负责内容审核和质量控制'
    },
    admin: {
      label: '管理员',
      color: 'orange',
      icon: <ToolOutlined />,
      description: '负责系统管理和技术维护'
    },
    super_admin: {
      label: '超级管理员',
      color: 'red',
      icon: <CrownOutlined />,
      description: '拥有最高权限，负责安全控制和系统管理'
    }
  };

  const config = roleConfig[userRole];

  // 权限统计
  const permissionStats = {
    total: userPermissions.length,
    review: userPermissions.filter(p => p.startsWith('review:')).length,
    admin: userPermissions.filter(p => p.startsWith('admin:')).length,
    super_admin: userPermissions.filter(p => p.startsWith('super_admin:')).length
  };

  // 功能访问状态
  const featureAccess = {
    canReview: canAccessFeature(user, 'pending_reviews'),
    canManageUsers: canAccessFeature(user, 'user_management'),
    canAccessAPI: canAccessFeature(user, 'api_management'),
    canControlSecurity: canAccessFeature(user, 'security_console'),
    canEmergencyControl: canAccessFeature(user, 'emergency_control')
  };

  if (compact) {
    return (
      <Tooltip title={`${config.label} - ${config.description}`}>
        <Tag icon={config.icon} color={config.color}>
          {config.label}
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {/* 角色标识 */}
      <Space>
        <Badge 
          count={permissionStats.total} 
          style={{ backgroundColor: config.color === 'red' ? '#ff4d4f' : config.color === 'orange' ? '#fa8c16' : '#1890ff' }}
        >
          <Tag icon={config.icon} color={config.color} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {config.label}
          </Tag>
        </Badge>
        
        {isSuperAdmin(user) && (
          <Tag icon={<SafetyOutlined />} color="gold">
            最高权限
          </Tag>
        )}
        
        {isAdmin(user) && !isSuperAdmin(user) && (
          <Tag icon={<ToolOutlined />} color="cyan">
            技术管理
          </Tag>
        )}
        
        {isReviewer(user) && (
          <Tag icon={<EyeOutlined />} color="green">
            内容审核
          </Tag>
        )}
      </Space>

      {/* 详细信息 */}
      {showDetails && (
        <Alert
          message={`当前角色: ${config.label}`}
          description={config.description}
          type="info"
          showIcon
          style={{ fontSize: '12px' }}
        />
      )}

      {/* 权限统计 */}
      {showDetails && (
        <Space wrap>
          {permissionStats.review > 0 && (
            <Tag color="blue">审核权限 {permissionStats.review}</Tag>
          )}
          {permissionStats.admin > 0 && (
            <Tag color="orange">管理权限 {permissionStats.admin}</Tag>
          )}
          {permissionStats.super_admin > 0 && (
            <Tag color="red">超管权限 {permissionStats.super_admin}</Tag>
          )}
        </Space>
      )}

      {/* 功能访问状态 */}
      {showDetails && (
        <Space wrap>
          <Tooltip title="内容审核功能">
            <Tag 
              icon={featureAccess.canReview ? <UnlockOutlined /> : <LockOutlined />}
              color={featureAccess.canReview ? 'green' : 'default'}
            >
              审核
            </Tag>
          </Tooltip>
          
          <Tooltip title="用户管理功能">
            <Tag 
              icon={featureAccess.canManageUsers ? <UnlockOutlined /> : <LockOutlined />}
              color={featureAccess.canManageUsers ? 'green' : 'default'}
            >
              用户管理
            </Tag>
          </Tooltip>
          
          <Tooltip title="API管理功能">
            <Tag 
              icon={featureAccess.canAccessAPI ? <UnlockOutlined /> : <LockOutlined />}
              color={featureAccess.canAccessAPI ? 'green' : 'default'}
            >
              API管理
            </Tag>
          </Tooltip>
          
          <Tooltip title="安全控制台">
            <Tag 
              icon={featureAccess.canControlSecurity ? <UnlockOutlined /> : <LockOutlined />}
              color={featureAccess.canControlSecurity ? 'green' : 'default'}
            >
              安全控制
            </Tag>
          </Tooltip>
          
          <Tooltip title="紧急控制功能">
            <Tag 
              icon={featureAccess.canEmergencyControl ? <UnlockOutlined /> : <LockOutlined />}
              color={featureAccess.canEmergencyControl ? 'green' : 'default'}
            >
              紧急控制
            </Tag>
          </Tooltip>
        </Space>
      )}

      {/* 权限列表 */}
      {showPermissionList && (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            权限列表 ({userPermissions.length}):
          </div>
          <Space wrap size="small">
            {userPermissions.map((permission) => (
              <Tag
                key={permission}
                color={
                  permission.startsWith('super_admin:') ? 'red' :
                  permission.startsWith('admin:') ? 'orange' :
                  'blue'
                }
                style={{ fontSize: '11px' }}
              >
                {permission}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </Space>
  );
};

export default PermissionIndicator;

import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import type { Permission, UserRole } from '../../types/auth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  getPermissionErrorMessage
} from '../../utils/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  requireAll?: boolean; // 是否需要所有权限，默认false（任意一个即可）
  fallback?: React.ReactNode;
  showError?: boolean; // 是否显示错误页面，默认true
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  requireAll = false,
  fallback,
  showError = true
}) => {
  const { currentUser } = useUniversalAuthStore();

  // 构建权限检查列表
  const permissionsToCheck = [
    ...(permission ? [permission] : []),
    ...permissions
  ];

  // 检查权限
  let hasAccess = true;
  let errorMessage = '';

  if (role) {
    // 检查角色
    hasAccess = hasRole(currentUser, role);
    if (!hasAccess) {
      errorMessage = `需要 ${role} 角色才能访问`;
    }
  } else if (permissionsToCheck.length > 0) {
    // 检查权限
    if (requireAll) {
      hasAccess = hasAllPermissions(currentUser, permissionsToCheck);
    } else {
      hasAccess = hasAnyPermission(currentUser, permissionsToCheck);
    }

    if (!hasAccess) {
      errorMessage = getPermissionErrorMessage(currentUser, permissionsToCheck);
    }
  }

  // 如果有权限，直接渲染子组件
  if (hasAccess) {
    return <>{children}</>;
  }

  // 如果提供了自定义fallback，使用它
  if (fallback) {
    return <>{fallback}</>;
  }

  // 如果不显示错误页面，返回null
  if (!showError) {
    return null;
  }

  // 显示权限错误页面
  return (
    <Result
      status="403"
      title="403"
      subTitle={errorMessage || "抱歉，您没有访问此页面的权限"}
      icon={<LockOutlined />}
      extra={
        <div>
          {!currentUser ? (
            <Link to="/login">
              <Button type="primary" icon={<UserOutlined />}>
                立即登录
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button type="primary">
                返回首页
              </Button>
            </Link>
          )}
        </div>
      }
    />
  );
};

// 权限检查Hook
export const usePermission = () => {
  const { currentUser } = useUniversalAuthStore();

  return {
    hasPermission: (permission: Permission) => hasPermission(currentUser, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(currentUser, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(currentUser, permissions),
    hasRole: (role: UserRole) => hasRole(currentUser, role),
    user: currentUser
  };
};

// 权限按钮组件
interface PermissionButtonProps {
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  [key: string]: any; // 其他Button属性
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  permissions = [],
  role,
  requireAll = false,
  children,
  fallback = null,
  ...buttonProps
}) => {
  const { currentUser } = useUniversalAuthStore();

  // 构建权限检查列表
  const permissionsToCheck = [
    ...(permission ? [permission] : []),
    ...permissions
  ];

  // 检查权限
  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(currentUser, role);
  } else if (permissionsToCheck.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(currentUser, permissionsToCheck);
    } else {
      hasAccess = hasAnyPermission(currentUser, permissionsToCheck);
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
};

// 权限文本组件
interface PermissionTextProps {
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionText: React.FC<PermissionTextProps> = ({
  permission,
  permissions = [],
  role,
  requireAll = false,
  children,
  fallback = null
}) => {
  const { currentUser } = useUniversalAuthStore();

  // 构建权限检查列表
  const permissionsToCheck = [
    ...(permission ? [permission] : []),
    ...permissions
  ];

  // 检查权限
  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(currentUser, role);
  } else if (permissionsToCheck.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(currentUser, permissionsToCheck);
    } else {
      hasAccess = hasAnyPermission(currentUser, permissionsToCheck);
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

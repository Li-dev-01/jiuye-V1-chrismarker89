/**
 * 管理系统路由守卫
 * 专门处理管理员和审核员的路由权限检查
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { managementAuthService } from '../../services/managementAuthService';
import type { ManagementPermission, ManagementUserType } from '../../types/management-auth';

interface ManagementRouteGuardProps {
  children: React.ReactNode;
  permission?: ManagementPermission;
  permissions?: ManagementPermission[];
  userType?: ManagementUserType;
  userTypes?: ManagementUserType[];
  redirectTo?: string;
}

export const ManagementRouteGuard: React.FC<ManagementRouteGuardProps> = ({
  children,
  permission,
  permissions = [],
  userType,
  userTypes = [],
  redirectTo = '/admin/login'
}) => {
  const location = useLocation();
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    canAccessRoute,
    hasPermission,
    hasUserType
  } = useManagementAuthStore();

  console.log('ManagementRouteGuard 检查:', {
    path: location.pathname,
    isAuthenticated,
    currentUser: currentUser ? {
      userType: currentUser.userType,
      username: currentUser.username,
      display_name: currentUser.display_name
    } : null,
    permission,
    permissions,
    userType,
    userTypes
  });

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    console.log('管理用户未认证，重定向到登录页');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 如果没有用户信息，重定向到登录页
  if (!currentUser) {
    console.log('没有管理用户信息，重定向到登录页');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 检查用户类型
  const userTypesToCheck = [
    ...(userType ? [userType] : []),
    ...userTypes
  ];

  if (userTypesToCheck.length > 0) {
    const hasRequiredUserType = userTypesToCheck.some(type => hasUserType(type));
    if (!hasRequiredUserType) {
      console.log('用户类型不匹配:', {
        required: userTypesToCheck,
        actual: currentUser.userType
      });
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  // 检查路由权限
  const routeCheck = canAccessRoute(location.pathname);
  if (!routeCheck.hasPermission) {
    console.log('路由权限检查失败:', routeCheck.reason);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 构建权限检查列表
  const permissionsToCheck = [
    ...(permission ? [permission] : []),
    ...permissions
  ];

  // 如果指定了特定权限，进行额外检查
  if (permissionsToCheck.length > 0) {
    const hasRequiredPermissions = permissionsToCheck.some(p => hasPermission(p));
    
    if (!hasRequiredPermissions) {
      console.log('权限检查失败，缺少权限:', permissionsToCheck);
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  console.log('管理路由权限检查通过');
  return <>{children}</>;
};

// 管理员专用路由守卫 - 测试环境简化版本
export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 测试环境：只检查服务层状态，忽略Store状态
  const serviceUser = managementAuthService.getCurrentUser();
  const serviceValid = managementAuthService.isSessionValid();

  console.log('🧪 AdminRouteGuard 简化检查:', {
    hasUser: !!serviceUser,
    isValid: serviceValid,
    userType: serviceUser?.userType,
    username: serviceUser?.username
  });

  // 测试环境：只要服务层有用户且会话有效就通过
  if (serviceUser && serviceValid) {
    // 简单检查用户类型
    const isAdminType = serviceUser.userType === 'ADMIN' || serviceUser.userType === 'SUPER_ADMIN';

    if (isAdminType) {
      console.log('✅ 管理员权限检查通过 (简化版)');
      return <>{children}</>;
    } else {
      console.log('❌ 用户不是管理员:', serviceUser.userType);
      return <Navigate to="/admin/login" replace />;
    }
  }

  console.log('❌ 管理员认证失败，重定向到登录页');
  return <Navigate to="/admin/login" replace />;
};

// 审核员专用路由守卫 - 测试环境简化版本
export const ReviewerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 测试环境：只检查服务层状态，忽略Store状态
  const serviceUser = managementAuthService.getCurrentUser();
  const serviceValid = managementAuthService.isSessionValid();

  console.log('🧪 ReviewerRouteGuard 简化检查:', {
    hasUser: !!serviceUser,
    isValid: serviceValid,
    userType: serviceUser?.userType,
    username: serviceUser?.username
  });

  // 测试环境：只要服务层有用户且会话有效就通过
  if (serviceUser && serviceValid) {
    // 简单检查用户类型（审核员包括管理员）
    const isReviewerType = serviceUser.userType === 'REVIEWER' ||
                          serviceUser.userType === 'ADMIN' ||
                          serviceUser.userType === 'SUPER_ADMIN';

    if (isReviewerType) {
      console.log('✅ 审核员权限检查通过 (简化版)');
      return <>{children}</>;
    } else {
      console.log('❌ 用户不是审核员:', serviceUser.userType);
      return <Navigate to="/admin/login" replace />;
    }
  }

  console.log('❌ 审核员认证失败，重定向到登录页');
  return <Navigate to="/admin/login" replace />;
};

// 超级管理员专用路由守卫 - 测试环境简化版本
export const SuperAdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 测试环境：只检查服务层状态，忽略Store状态
  const serviceUser = managementAuthService.getCurrentUser();
  const serviceValid = managementAuthService.isSessionValid();

  console.log('🧪 SuperAdminRouteGuard 简化检查:', {
    hasUser: !!serviceUser,
    isValid: serviceValid,
    userType: serviceUser?.userType,
    username: serviceUser?.username
  });

  // 测试环境：只要服务层有用户且会话有效就通过
  if (serviceUser && serviceValid) {
    // 只允许超级管理员访问
    const isSuperAdminType = serviceUser.userType === 'SUPER_ADMIN';

    if (isSuperAdminType) {
      console.log('✅ 超级管理员权限检查通过 (简化版)');
      return <>{children}</>;
    } else {
      console.log('❌ 用户不是超级管理员:', serviceUser.userType);
      // 如果是普通管理员，显示权限不足页面
      if (serviceUser.userType === 'ADMIN') {
        return (
          <div style={{
            padding: '50px',
            textAlign: 'center',
            background: '#fff',
            minHeight: 'calc(100vh - 64px)'
          }}>
            <div style={{ fontSize: '48px', color: '#faad14', marginBottom: '24px' }}>🔒</div>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>访问受限</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
              此页面需要超级管理员权限才能访问
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              您当前是普通管理员，如需访问请联系超级管理员
            </p>
          </div>
        );
      }
      return <Navigate to="/admin/login" replace />;
    }
  }

  console.log('❌ 超级管理员认证失败，重定向到登录页');
  return <Navigate to="/admin/login" replace />;
};

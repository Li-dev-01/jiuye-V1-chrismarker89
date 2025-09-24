/**
 * 统一路由守卫组件
 * 整合问卷系统和管理系统的路由保护逻辑
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Alert } from 'antd';

import type { 
  UnifiedPermission, 
  UnifiedUserType, 
  UserDomain 
} from '../../types/unified-auth';

import { useUnifiedAuthStore } from '../../stores/unifiedAuthStore';

interface UnifiedRouteGuardProps {
  children: React.ReactNode;
  
  // 权限要求
  requiredPermissions?: UnifiedPermission[];
  requiredUserTypes?: UnifiedUserType[];
  requiredDomain?: UserDomain;
  
  // 行为配置
  allowAnonymous?: boolean;
  redirectTo?: string;
  showError?: boolean;
  
  // 自定义检查函数
  customCheck?: (user: any) => boolean;
}

export const UnifiedRouteGuard: React.FC<UnifiedRouteGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredUserTypes = [],
  requiredDomain,
  allowAnonymous = false,
  redirectTo,
  showError = true,
  customCheck
}) => {
  const location = useLocation();
  const { 
    currentUser, 
    isAuthenticated, 
    isLoading, 
    canAccessRoute,
    isInDomain,
    hasPermission,
    hasUserType
  } = useUnifiedAuthStore();

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

  // 检查是否允许匿名访问
  if (allowAnonymous && !isAuthenticated) {
    return <>{children}</>;
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated || !currentUser) {
    const defaultRedirect = requiredDomain === UserDomain.MANAGEMENT ? '/admin/login' : '/login';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  // 检查域要求
  if (requiredDomain && !isInDomain(requiredDomain)) {
    if (showError) {
      return (
        <div style={{ padding: '24px' }}>
          <Alert
            message="访问被拒绝"
            description={`此页面需要${requiredDomain === UserDomain.MANAGEMENT ? '管理' : '问卷'}域权限`}
            type="error"
            showIcon
          />
        </div>
      );
    }
    const redirectPath = requiredDomain === UserDomain.MANAGEMENT ? '/admin/login' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  // 检查用户类型要求
  if (requiredUserTypes.length > 0) {
    const hasRequiredType = requiredUserTypes.some(type => hasUserType(type));
    if (!hasRequiredType) {
      if (showError) {
        return (
          <div style={{ padding: '24px' }}>
            <Alert
              message="权限不足"
              description={`此页面需要以下用户类型之一: ${requiredUserTypes.join(', ')}`}
              type="error"
              showIcon
            />
          </div>
        );
      }
      return <Navigate to={redirectTo || '/'} replace />;
    }
  }

  // 检查权限要求
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(permission => hasPermission(permission));
    if (!hasRequiredPermission) {
      if (showError) {
        return (
          <div style={{ padding: '24px' }}>
            <Alert
              message="权限不足"
              description="您没有访问此页面的权限"
              type="error"
              showIcon
            />
          </div>
        );
      }
      return <Navigate to={redirectTo || '/'} replace />;
    }
  }

  // 使用路由权限检查
  const routePermissionResult = canAccessRoute(location.pathname);
  if (!routePermissionResult.hasPermission) {
    if (showError) {
      return (
        <div style={{ padding: '24px' }}>
          <Alert
            message="访问被拒绝"
            description={routePermissionResult.reason}
            type="error"
            showIcon
          />
        </div>
      );
    }
    return <Navigate to={routePermissionResult.redirectSuggestion || '/'} replace />;
  }

  // 自定义检查
  if (customCheck && !customCheck(currentUser)) {
    if (showError) {
      return (
        <div style={{ padding: '24px' }}>
          <Alert
            message="访问被拒绝"
            description="自定义权限检查失败"
            type="error"
            showIcon
          />
        </div>
      );
    }
    return <Navigate to={redirectTo || '/'} replace />;
  }

  // 所有检查通过，渲染子组件
  return <>{children}</>;
};

// 预定义的路由守卫组件

/**
 * 问卷域路由守卫
 */
export const QuestionnaireRouteGuard: React.FC<{ children: React.ReactNode; allowAnonymous?: boolean }> = ({ 
  children, 
  allowAnonymous = true 
}) => (
  <UnifiedRouteGuard
    requiredDomain={UserDomain.QUESTIONNAIRE}
    allowAnonymous={allowAnonymous}
    redirectTo="/login"
  >
    {children}
  </UnifiedRouteGuard>
);

/**
 * 管理域路由守卫
 */
export const ManagementRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard
    requiredDomain={UserDomain.MANAGEMENT}
    requiredUserTypes={[UnifiedUserType.REVIEWER, UnifiedUserType.ADMIN, UnifiedUserType.SUPER_ADMIN]}
    redirectTo="/admin/login"
  >
    {children}
  </UnifiedRouteGuard>
);

/**
 * 管理员专用路由守卫
 */
export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard
    requiredDomain={UserDomain.MANAGEMENT}
    requiredUserTypes={[UnifiedUserType.ADMIN, UnifiedUserType.SUPER_ADMIN]}
    redirectTo="/admin/login"
  >
    {children}
  </UnifiedRouteGuard>
);

/**
 * 超级管理员专用路由守卫
 */
export const SuperAdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard
    requiredDomain={UserDomain.MANAGEMENT}
    requiredUserTypes={[UnifiedUserType.SUPER_ADMIN]}
    redirectTo="/admin/login"
  >
    {children}
  </UnifiedRouteGuard>
);

/**
 * 审核员专用路由守卫
 */
export const ReviewerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard
    requiredDomain={UserDomain.MANAGEMENT}
    requiredUserTypes={[UnifiedUserType.REVIEWER, UnifiedUserType.ADMIN, UnifiedUserType.SUPER_ADMIN]}
    redirectTo="/admin/login"
  >
    {children}
  </UnifiedRouteGuard>
);

/**
 * 公开路由守卫（允许所有用户访问）
 */
export const PublicRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard allowAnonymous={true}>
    {children}
  </UnifiedRouteGuard>
);

/**
 * 认证用户路由守卫（需要登录但不限制类型）
 */
export const AuthenticatedRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedRouteGuard allowAnonymous={false}>
    {children}
  </UnifiedRouteGuard>
);

/**
 * 问卷系统路由守卫
 * 专门处理半匿名用户的路由权限检查
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useQuestionnaireAuthStore } from '../../stores/questionnaireAuthStore';
import type { QuestionnairePermission } from '../../types/questionnaire-auth';

interface QuestionnaireRouteGuardProps {
  children: React.ReactNode;
  permission?: QuestionnairePermission;
  permissions?: QuestionnairePermission[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const QuestionnaireRouteGuard: React.FC<QuestionnaireRouteGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAuth = false,
  redirectTo
}) => {
  const location = useLocation();
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    canAccessRoute,
    hasPermission
  } = useQuestionnaireAuthStore();

  console.log('QuestionnaireRouteGuard 检查:', {
    path: location.pathname,
    isAuthenticated,
    currentUser: currentUser ? {
      userType: currentUser.userType,
      uuid: currentUser.uuid,
      display_name: currentUser.display_name
    } : null,
    requireAuth,
    permission,
    permissions
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

  // 如果需要认证但用户未登录
  if (requireAuth && !isAuthenticated) {
    console.log('需要认证但用户未登录，重定向到首页');
    return <Navigate to={redirectTo || '/'} state={{ from: location }} replace />;
  }

  // 检查路由权限
  const routeCheck = canAccessRoute(location.pathname);
  if (!routeCheck.hasPermission) {
    console.log('路由权限检查失败:', routeCheck.reason);
    return <Navigate to={redirectTo || '/'} state={{ from: location }} replace />;
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
      return <Navigate to={redirectTo || '/'} state={{ from: location }} replace />;
    }
  }

  console.log('问卷路由权限检查通过');
  return <>{children}</>;
};

// 半匿名用户专用路由守卫
export const SemiAnonymousRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading } = useQuestionnaireAuthStore();

  console.log('SemiAnonymousRouteGuard 检查:', {
    isAuthenticated,
    currentUser: currentUser ? {
      userType: currentUser.userType,
      uuid: currentUser.uuid
    } : null,
    isLoading
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

  // 如果未认证，重定向到首页（可以在首页进行A+B登录）
  if (!isAuthenticated) {
    console.log('半匿名用户未认证，重定向到首页');
    return <Navigate to="/" replace />;
  }

  // 如果没有用户信息，重定向到首页
  if (!currentUser) {
    console.log('没有半匿名用户信息，重定向到首页');
    return <Navigate to="/" replace />;
  }

  // 检查用户类型
  if (currentUser.userType !== 'SEMI_ANONYMOUS') {
    console.log('用户类型不匹配:', currentUser.userType);
    return <Navigate to="/" replace />;
  }

  console.log('半匿名用户权限检查通过');
  return <>{children}</>;
};

// 公共路由守卫（允许所有用户访问，包括未登录用户）
export const PublicQuestionnaireRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 公共路由不需要任何权限检查
  return <>{children}</>;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '../../stores/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('reviewer' | 'admin' | 'super_admin')[];
  redirectTo?: string;
  showError?: boolean;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
  showError = true
}) => {
  const { user, isAuthenticated } = useAuthStore();

  console.log(`[ROLE_GUARD] 🛡️ CHECKING PERMISSIONS:`, {
    user: user?.username,
    role: user?.role,
    userType: user?.userType,
    allowedRoles,
    isAuthenticated,
    redirectTo,
    showError
  });

  // 如果未认证，重定向到登录页
  if (!isAuthenticated || !user) {
    console.log(`[ROLE_GUARD] Not authenticated, redirecting to ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // 检查用户角色是否在允许的角色列表中
  const hasPermission = allowedRoles.includes(user.role as any);

  console.log(`[ROLE_GUARD] 🛡️ Permission check details:`, {
    userRole: user.role,
    allowedRoles,
    hasPermission,
    currentPath: window.location.pathname
  });

  if (!hasPermission) {
    console.log(`[ROLE_GUARD] Permission denied for role ${user.role}, current path: ${window.location.pathname}`);

    // 根据用户角色智能重定向，避免循环重定向
    if (user.role === 'reviewer') {
      console.log(`[ROLE_GUARD] Redirecting reviewer to /dashboard`);
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      // 如果已经在管理员页面，重定向到登录页避免循环
      if (window.location.pathname.startsWith('/admin')) {
        console.log(`[ROLE_GUARD] Admin permission denied on admin route, redirecting to login`);
        return <Navigate to="/admin/login" replace />;
      } else {
        console.log(`[ROLE_GUARD] Redirecting admin to /admin/dashboard`);
        return <Navigate to="/admin/dashboard" replace />;
      }
    }

    if (showError) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          }
        />
      );
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }

  console.log(`[ROLE_GUARD] Permission granted, rendering children`);
  return <>{children}</>;
};

// 预定义的角色守卫组件

/**
 * 审核员专用守卫 - 只允许审核员访问
 */
export const ReviewerOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['reviewer']} redirectTo="/login">
    {children}
  </RoleGuard>
);

/**
 * 管理员专用守卫 - 只允许管理员和超级管理员访问
 */
export const AdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin', 'super_admin']} redirectTo="/admin/login" showError={false}>
    {children}
  </RoleGuard>
);

/**
 * 超级管理员专用守卫 - 只允许超级管理员访问
 */
export const SuperAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['super_admin']} redirectTo="/admin/login" showError={false}>
    {children}
  </RoleGuard>
);

/**
 * 管理域守卫 - 允许审核员、管理员、超级管理员访问
 */
export const ManagementGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['reviewer', 'admin', 'super_admin']} redirectTo="/login">
    {children}
  </RoleGuard>
);

export default RoleGuard;

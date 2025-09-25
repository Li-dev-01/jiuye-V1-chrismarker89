import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../../stores/superAdminAuthStore';

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
  // 获取所有三个认证状态
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();

  // 确定当前的认证状态和用户信息
  const getCurrentAuth = () => {
    if (superAdminAuth.isAuthenticated && superAdminAuth.user) {
      return {
        isAuthenticated: true,
        user: superAdminAuth.user,
        authType: 'super_admin'
      };
    } else if (adminAuth.isAuthenticated && adminAuth.user) {
      return {
        isAuthenticated: true,
        user: adminAuth.user,
        authType: 'admin'
      };
    } else if (reviewerAuth.isAuthenticated && reviewerAuth.user) {
      return {
        isAuthenticated: true,
        user: reviewerAuth.user,
        authType: 'reviewer'
      };
    } else {
      return {
        isAuthenticated: false,
        user: null,
        authType: 'none'
      };
    }
  };

  const currentAuth = getCurrentAuth();
  const { isAuthenticated, user, authType } = currentAuth;

  console.log(`[ROLE_GUARD] 🛡️ CHECKING PERMISSIONS:`, {
    user: user?.username,
    role: user?.role,
    userType: user?.userType,
    allowedRoles,
    isAuthenticated,
    authType,
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
 * ⚠️ 注意：这个守卫允许admin和super_admin都访问
 */
export const AdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin', 'super_admin']} redirectTo="/admin/login" showError={false}>
    {children}
  </RoleGuard>
);

/**
 * 超级管理员专用守卫 - 只允许超级管理员访问
 * 🔒 严格权限控制：普通管理员无法访问
 */
export const SuperAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['super_admin']} redirectTo="/admin/login" showError={true}>
    {children}
  </RoleGuard>
);

/**
 * 普通管理员专用守卫 - 只允许普通管理员访问，超级管理员不能访问
 * 🔧 用于普通管理员专属功能（如API管理、数据库结构等）
 */
export const RegularAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin']} redirectTo="/admin/login" showError={true}>
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

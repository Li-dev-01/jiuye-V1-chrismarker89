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
  // 同时检查 user.role 和 user.userType，因为有些地方可能使用 userType
  const userRole = user.role || user.userType;

  // 添加空值检查，确保allowedRoles是数组
  const safeAllowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [];
  const hasPermission = userRole && safeAllowedRoles.includes(userRole as any);

  console.log(`[ROLE_GUARD] 🛡️ Permission check details:`, {
    'user.role': user.role,
    'user.userType': user.userType,
    'userRole (final)': userRole,
    'user.role type': typeof user.role,
    'user.role JSON': JSON.stringify(user.role),
    allowedRoles,
    'allowedRoles[0]': allowedRoles[0],
    'allowedRoles[0] type': typeof allowedRoles[0],
    'includes result': allowedRoles.includes(userRole as any),
    hasPermission,
    currentPath: window.location.pathname
  });

  if (!hasPermission) {
    console.warn(`[ROLE_GUARD] ⚠️ Permission check failed - redirecting user`);
    console.warn(`[ROLE_GUARD] User role: ${userRole}`);
    console.warn(`[ROLE_GUARD] Allowed roles:`, allowedRoles);
    console.warn(`[ROLE_GUARD] Current path: ${window.location.pathname}`);
    console.warn(`[ROLE_GUARD] Full user object:`, user);

    // 根据用户角色智能重定向，避免循环重定向
    if (userRole === 'reviewer') {
      console.log(`[ROLE_GUARD] Redirecting reviewer to /dashboard`);
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'admin' || userRole === 'super_admin') {
      // 检查是否是权限不足的情况（比如普通管理员访问超级管理员功能）
      const currentPath = window.location.pathname;

      // 如果是超级管理员专属路径但用户是普通管理员，重定向到管理员首页
      const superAdminPaths = ['/admin/security-console', '/admin/system-logs', '/admin/system-settings',
                              '/admin/super-admin-panel', '/admin/security-switches', '/admin/email-role-accounts'];

      if (userRole === 'admin' && superAdminPaths.some(path => currentPath.startsWith(path))) {
        console.log(`[ROLE_GUARD] Regular admin trying to access super admin path, redirecting to admin dashboard`);
        return <Navigate to="/admin/dashboard" replace />;
      }

      // 如果已经在管理员页面但权限不足，重定向到管理员首页而不是登录页
      if (currentPath.startsWith('/admin')) {
        console.log(`[ROLE_GUARD] Admin permission denied on admin route, redirecting to admin dashboard`);
        return <Navigate to="/admin/dashboard" replace />;
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
  <RoleGuard allowedRoles={['admin', 'super_admin']} redirectTo="/unified-login" showError={false}>
    {children}
  </RoleGuard>
);

/**
 * 超级管理员专用守卫 - 只允许超级管理员访问
 * 🔒 严格权限控制：普通管理员无法访问
 */
export const SuperAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['super_admin']} redirectTo="/unified-login" showError={true}>
    {children}
  </RoleGuard>
);

/**
 * 普通管理员专用守卫 - 只允许普通管理员访问，超级管理员不能访问
 * 🔧 用于普通管理员专属功能（如API管理、数据库结构等）
 */
export const RegularAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin']} redirectTo="/unified-login" showError={true}>
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

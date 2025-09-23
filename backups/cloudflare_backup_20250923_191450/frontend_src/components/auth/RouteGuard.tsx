import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import type { Permission, UserRole } from '../../types/auth';
import { LOGIN_ROUTES } from '../../types/auth';
import { canAccessRoute, getDefaultRedirect, needsReauth } from '../../utils/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  requireAuth?: boolean; // 是否需要登录
  allowAnonymous?: boolean; // 是否允许匿名用户
  redirectTo?: string; // 自定义重定向路径
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  requireAuth = false,
  allowAnonymous = true,
  redirectTo
}) => {
  const { user, isAuthenticated, loading, checkAuth } = useUniversalAuthStore();
  const {
    currentUser: universalUser,
    isAuthenticated: universalIsAuthenticated,
    isLoading: universalLoading
  } = useUniversalAuthStore();
  const location = useLocation();

  // 优先使用 Universal Auth Store 的状态
  const finalUser = universalUser || user;
  const finalIsAuthenticated = universalIsAuthenticated || isAuthenticated;
  const finalLoading = universalLoading || loading;

  // 页面加载时检查认证状态
  useEffect(() => {
    if (!finalIsAuthenticated && !finalLoading) {
      checkAuth();
    }
  }, [finalIsAuthenticated, finalLoading, checkAuth]);

  // 如果正在加载，显示加载状态
  if (finalLoading) {
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

  // 检查是否需要登录
  if (requireAuth && !finalIsAuthenticated) {
    const loginPath = role ? LOGIN_ROUTES[role] : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 检查匿名用户权限
  if (!allowAnonymous && finalUser?.isAnonymous) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (role && finalUser && needsReauth(finalUser, role)) {
    const loginPath = LOGIN_ROUTES[role];
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 简化的路由权限检查 - 只在有特定角色要求时检查
  if (role && finalUser && needsReauth(finalUser, role)) {
    const loginPath = LOGIN_ROUTES[role];
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  // 权限检查通过，渲染子组件
  return <>{children}</>;
};

// 管理员路由守卫 - 简化版本
export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading } = useUniversalAuthStore();

  console.log('AdminRouteGuard 检查:', {
    isAuthenticated,
    currentUser: currentUser ? {
      userType: currentUser.userType,
      uuid: currentUser.uuid,
      display_name: currentUser.display_name
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

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    console.log('未认证，重定向到登录页');
    return <Navigate to="/admin/login" replace />;
  }

  // 如果没有用户信息，重定向到登录页
  if (!currentUser) {
    console.log('没有用户信息，重定向到登录页');
    return <Navigate to="/admin/login" replace />;
  }

  // 检查用户类型
  if (!['admin', 'super_admin'].includes(currentUser.userType)) {
    console.log('用户类型不匹配:', currentUser.userType);
    return <Navigate to="/admin/login" replace />;
  }

  console.log('权限检查通过，渲染管理页面');
  return <>{children}</>;
};

// 审核员路由守卫
export const ReviewerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading, refreshUser, checkSession } = useUniversalAuthStore();
  const [checking, setChecking] = React.useState(true);

  // 初始化时检查认证状态
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        // 检查会话有效性
        const sessionValid = checkSession();
        if (!sessionValid && isAuthenticated) {
          // 会话无效但状态显示已认证，尝试刷新
          await refreshUser();
        }
      } catch (error) {
        console.error('认证检查失败:', error);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [checkSession, refreshUser, isAuthenticated]);

  // 如果正在检查或加载，显示加载状态
  if (checking || isLoading) {
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
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // 检查用户类型
  if (!['reviewer', 'admin', 'super_admin'].includes(currentUser.userType)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// 用户路由守卫
export const UserRouteGuard: React.FC<{ children: React.ReactNode; allowAnonymous?: boolean }> = ({ 
  children, 
  allowAnonymous = true 
}) => {
  return (
    <RouteGuard
      requireAuth={true}
      allowAnonymous={allowAnonymous}
      redirectTo="/login"
    >
      {children}
    </RouteGuard>
  );
};

// 公开路由守卫（无需权限）
export const PublicRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// 重定向组件 - 根据用户角色重定向到合适的页面
export const RoleBasedRedirect: React.FC = () => {
  const { user } = useUniversalAuthStore();
  const defaultRedirect = getDefaultRedirect(user);
  
  return <Navigate to={defaultRedirect} replace />;
};

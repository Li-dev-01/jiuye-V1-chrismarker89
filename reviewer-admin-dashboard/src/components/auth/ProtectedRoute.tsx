import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useSuperAdminAuthStore } from '../../stores/superAdminAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // 获取所有三个认证状态
  const reviewerAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const superAdminAuth = useSuperAdminAuthStore();
  const location = useLocation();

  // 确定当前的认证状态和用户信息
  const getCurrentAuth = () => {
    if (superAdminAuth.isAuthenticated && superAdminAuth.user) {
      return {
        isAuthenticated: true,
        isLoading: superAdminAuth.isLoading,
        user: superAdminAuth.user,
        token: superAdminAuth.token,
        checkAuth: superAdminAuth.checkAuth,
        authType: 'super_admin'
      };
    } else if (adminAuth.isAuthenticated && adminAuth.user) {
      return {
        isAuthenticated: true,
        isLoading: adminAuth.isLoading,
        user: adminAuth.user,
        token: adminAuth.token,
        checkAuth: adminAuth.checkAuth,
        authType: 'admin'
      };
    } else if (reviewerAuth.isAuthenticated && reviewerAuth.user) {
      return {
        isAuthenticated: true,
        isLoading: reviewerAuth.isLoading,
        user: reviewerAuth.user,
        token: reviewerAuth.token,
        checkAuth: reviewerAuth.checkAuth,
        authType: 'reviewer'
      };
    } else {
      // 检查是否有任何token存在但未认证
      const hasToken = !!(superAdminAuth.token || adminAuth.token || reviewerAuth.token);
      const isLoading = superAdminAuth.isLoading || adminAuth.isLoading || reviewerAuth.isLoading;

      return {
        isAuthenticated: false,
        isLoading,
        user: null,
        token: hasToken,
        checkAuth: null,
        authType: 'none'
      };
    }
  };

  const currentAuth = getCurrentAuth();
  const { isAuthenticated, isLoading, user, token, checkAuth, authType } = currentAuth;

  console.log(`[PROTECTED_ROUTE] 🛡️ RENDER - path: ${location.pathname}, isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, hasToken: ${!!token}, user: ${user?.username}, role: ${user?.role}, authType: ${authType}`);

  useEffect(() => {
    console.log(`[PROTECTED_ROUTE] 🔄 useEffect triggered:`, {
      path: location.pathname,
      hasToken: !!token,
      isAuthenticated,
      user: user?.username,
      role: user?.role,
      authType
    });

    if (token && !isAuthenticated && checkAuth) {
      console.log(`[PROTECTED_ROUTE] 🔍 Token exists but not authenticated (${authType}), calling checkAuth...`);
      checkAuth()
        .then((result) => {
          console.log(`[PROTECTED_ROUTE] ✅ checkAuth completed with result: ${result}`);
        })
        .catch((error) => {
          console.error('[PROTECTED_ROUTE] ❌ checkAuth failed:', error);
        });
    } else if (!token) {
      console.log('[PROTECTED_ROUTE] ❌ No token found');
    } else if (isAuthenticated) {
      console.log(`[PROTECTED_ROUTE] ✅ Already authenticated (${authType}), no action needed`);
    }
  }, [token, isAuthenticated, checkAuth, location.pathname, authType, user?.username, user?.role]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    console.log('[PROTECTED_ROUTE] ⏳ Showing loading spinner');
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 如果未认证，重定向到统一登录页
  if (!isAuthenticated) {
    const redirectTo = '/unified-login';

    console.log(`[PROTECTED_ROUTE] 🔄 Not authenticated, redirecting to ${redirectTo} from ${location.pathname}`);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  console.log(`[PROTECTED_ROUTE] ✅ Authenticated (${authType}), rendering children for ${location.pathname}`);
  return <>{children}</>;
};

export default ProtectedRoute;

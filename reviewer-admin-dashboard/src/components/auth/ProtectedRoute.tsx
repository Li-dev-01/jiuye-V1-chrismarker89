import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth, token, user } = useAuthStore();
  const location = useLocation();

  console.log(`[PROTECTED_ROUTE] 🛡️ RENDER - path: ${location.pathname}, isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, hasToken: ${!!token}, user: ${user?.username}, role: ${user?.role}`);

  useEffect(() => {
    console.log(`[PROTECTED_ROUTE] 🔄 useEffect triggered:`, {
      path: location.pathname,
      hasToken: !!token,
      isAuthenticated,
      user: user?.username,
      role: user?.role
    });

    if (token && !isAuthenticated) {
      console.log('[PROTECTED_ROUTE] 🔍 Token exists but not authenticated, calling checkAuth...');
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
      console.log('[PROTECTED_ROUTE] ✅ Already authenticated, no action needed');
    }
  }, [token, isAuthenticated, checkAuth, location.pathname]);

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

  // 如果未认证，根据路径重定向到对应的登录页
  if (!isAuthenticated) {
    const isAdminPath = location.pathname.startsWith('/admin');
    const redirectTo = isAdminPath ? '/admin/login' : '/login';
    console.log(`[PROTECTED_ROUTE] 🔄 Not authenticated, redirecting to ${redirectTo} from ${location.pathname}`);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  console.log(`[PROTECTED_ROUTE] ✅ Authenticated, rendering children for ${location.pathname}`);
  return <>{children}</>;
};

export default ProtectedRoute;

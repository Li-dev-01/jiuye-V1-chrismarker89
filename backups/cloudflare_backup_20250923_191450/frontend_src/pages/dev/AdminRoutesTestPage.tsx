/**
 * 管理员路由测试页面
 * 用于开发环境测试所有管理员路由的可访问性
 */

import React from 'react';
import { AdminRoutesTester } from '../../components/dev/AdminRoutesTester';
import { PublicLayout } from '../../components/layout/RoleBasedLayout';

export const AdminRoutesTestPage: React.FC = () => {
  return (
    <PublicLayout>
      <AdminRoutesTester />
    </PublicLayout>
  );
};

export default AdminRoutesTestPage;

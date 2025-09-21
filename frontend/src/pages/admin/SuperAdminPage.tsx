import React from 'react';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import SuperAdminDashboard from '../../components/admin/SuperAdminDashboard';

const SuperAdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <SuperAdminDashboard />
    </AdminLayout>
  );
};

export default SuperAdminPage;

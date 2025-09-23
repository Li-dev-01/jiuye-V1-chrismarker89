/**
 * 数据生成器管理页面
 * 管理员专用的测试数据生成工具
 */

import React from 'react';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { DataGenerator } from '../../components/admin/DataGenerator';

export const DataGeneratorPage: React.FC = () => {
  return (
    <AdminLayout>
      <DataGenerator />
    </AdminLayout>
  );
};

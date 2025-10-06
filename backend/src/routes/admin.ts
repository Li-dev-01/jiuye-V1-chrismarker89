/**
 * 管理员路由
 * 提供基础的管理员API端点，并集成子路由
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import userProfileManagement from './user-profile-management';
import { createDatabaseMonitorRoutes } from './databaseMonitor';

export function createAdminRoutes() {
  const admin = new Hono<{ Bindings: Env }>();

  // 基础管理员信息端点
  admin.get('/', async (c) => {
    return c.json({
      success: true,
      message: '管理员API服务正常',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // 管理员状态检查
  admin.get('/status', async (c) => {
    return c.json({
      success: true,
      data: {
        service: 'admin-api',
        status: 'active',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/admin/user-profile/*',
          '/admin/database/*'
        ]
      }
    });
  });

  // 注册子路由
  admin.route('/user-profile', userProfileManagement);
  admin.route('/database', createDatabaseMonitorRoutes());

  return admin;
}

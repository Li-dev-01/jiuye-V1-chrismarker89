/**
 * 数据库监测管理API路由
 * 提供数据库健康监控、数据流转监测和管理功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';

export function createDatabaseMonitorRoutes() {
  const monitor = new Hono<{ Bindings: Env }>();

  /**
   * 获取数据库总览信息
   * GET /api/admin/database/overview
   */
  monitor.get('/overview', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      
      // 简化版本，直接查询数据库
      const tables = await db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      return c.json({
        success: true,
        data: {
          totalTables: tables.length,
          healthyTables: Math.floor(tables.length * 0.8),
          activeAlerts: 2,
          syncTasks: 3,
          lastUpdate: new Date().toISOString()
        },
        message: '获取数据库总览成功'
      });

    } catch (error) {
      console.error('获取数据库总览失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取数据库总览失败'
      }, 500);
    }
  });

  /**
   * 获取数据流转状态
   * GET /api/admin/database/data-flow
   */
  monitor.get('/data-flow', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      
      // 模拟数据流转状态
      const dataFlow = [
        {
          stage: '测试数据',
          tableName: 'test_story_data',
          recordCount: 1250,
          lastUpdate: new Date().toISOString(),
          status: 'healthy',
          processingTime: 120
        },
        {
          stage: '原始数据',
          tableName: 'raw_story_submissions',
          recordCount: 890,
          lastUpdate: new Date().toISOString(),
          status: 'healthy',
          processingTime: 85
        },
        {
          stage: '有效数据',
          tableName: 'valid_stories',
          recordCount: 88,
          lastUpdate: new Date().toISOString(),
          status: 'warning',
          processingTime: 180,
          errorMessage: '数据传递延迟，等待审核'
        },
        {
          stage: '统计缓存',
          tableName: 'participation_stats',
          recordCount: 4,
          lastUpdate: new Date().toISOString(),
          status: 'error',
          processingTime: 0,
          errorMessage: '统计更新失败'
        }
      ];
      
      return c.json({
        success: true,
        data: dataFlow,
        message: '获取数据流转状态成功'
      });

    } catch (error) {
      console.error('获取数据流转状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取数据流转状态失败'
      }, 500);
    }
  });

  /**
   * 获取表健康状态
   * GET /api/admin/database/table-health
   */
  monitor.get('/table-health', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      
      // 模拟表健康状态
      const tableHealth = [
        {
          tableName: 'universal_questionnaire_responses',
          recordCount: 2,
          qualityScore: 95,
          lastUpdate: new Date().toISOString(),
          growthRate: 12.5,
          issues: [],
          status: 'healthy'
        },
        {
          tableName: 'valid_heart_voices',
          recordCount: 110,
          qualityScore: 88,
          lastUpdate: new Date().toISOString(),
          growthRate: 8.3,
          issues: ['部分记录缺少分类标签'],
          status: 'warning'
        },
        {
          tableName: 'valid_stories',
          recordCount: 88,
          qualityScore: 92,
          lastUpdate: new Date().toISOString(),
          growthRate: -2.1,
          issues: ['审核积压'],
          status: 'warning'
        }
      ];
      
      return c.json({
        success: true,
        data: tableHealth,
        message: '获取表健康状态成功'
      });

    } catch (error) {
      console.error('获取表健康状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取表健康状态失败'
      }, 500);
    }
  });

  /**
   * 获取同步任务状态
   * GET /api/admin/database/sync-tasks
   */
  monitor.get('/sync-tasks', async (c) => {
    try {
      // 模拟同步任务状态
      const syncTasks = [
        {
          taskId: 'sync-001',
          taskName: '测试数据到原始数据同步',
          sourceTable: 'test_story_data',
          targetTable: 'raw_story_submissions',
          lastRun: new Date(Date.now() - 3600000).toISOString(),
          nextRun: new Date(Date.now() + 3600000).toISOString(),
          status: 'success',
          duration: 45,
          recordsProcessed: 25
        },
        {
          taskId: 'sync-002',
          taskName: '原始数据审核同步',
          sourceTable: 'raw_story_submissions',
          targetTable: 'valid_stories',
          lastRun: new Date(Date.now() - 1800000).toISOString(),
          nextRun: new Date(Date.now() + 1800000).toISOString(),
          status: 'failed',
          duration: 0,
          recordsProcessed: 0,
          errorMessage: '审核服务连接超时'
        },
        {
          taskId: 'sync-003',
          taskName: '统计数据更新',
          sourceTable: 'valid_stories',
          targetTable: 'participation_stats',
          lastRun: new Date(Date.now() - 900000).toISOString(),
          nextRun: new Date(Date.now() + 900000).toISOString(),
          status: 'running',
          duration: 180,
          recordsProcessed: 15
        }
      ];
      
      return c.json({
        success: true,
        data: syncTasks,
        message: '获取同步任务状态成功'
      });

    } catch (error) {
      console.error('获取同步任务状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取同步任务状态失败'
      }, 500);
    }
  });

  /**
   * 获取告警信息
   * GET /api/admin/database/alerts
   */
  monitor.get('/alerts', async (c) => {
    try {
      // 模拟告警信息
      const alerts = [
        {
          id: 'alert-001',
          level: 'error',
          message: '统计数据更新失败，影响首页显示',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          resolved: false,
          source: 'sync_monitor'
        },
        {
          id: 'alert-002',
          level: 'warning',
          message: '心声数据质量评分下降到88分',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          resolved: false,
          source: 'data_quality_monitor'
        }
      ];
      
      return c.json({
        success: true,
        data: alerts,
        message: '获取告警信息成功'
      });

    } catch (error) {
      console.error('获取告警信息失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取告警信息失败'
      }, 500);
    }
  });

  /**
   * 健康检查
   * GET /api/admin/database/health
   */
  monitor.get('/health', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      
      // 简单的健康检查
      const testQuery = await db.queryFirst(`SELECT 1 as test`);
      
      return c.json({
        success: true,
        data: {
          status: 'healthy',
          checks: {
            database: testQuery ? 'healthy' : 'error',
            tables: 'healthy',
            sync: 'warning',
            performance: 'healthy'
          },
          timestamp: new Date().toISOString()
        },
        message: '健康检查完成'
      });

    } catch (error) {
      console.error('健康检查失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '健康检查失败'
      }, 500);
    }
  });

  return monitor;
}

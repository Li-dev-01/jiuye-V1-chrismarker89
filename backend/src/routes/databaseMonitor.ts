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
   * 获取数据库结构信息
   * GET /api/admin/database/schema
   */
  monitor.get('/schema', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 获取所有表
      const tablesResult = await db.query(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      const tables = [];
      const relations = [];

      // 为每个表获取详细信息
      for (const tableRow of tablesResult) {
        const tableName = tableRow.name;

        // 获取表的列信息
        const columnsResult = await db.query(`PRAGMA table_info(${tableName})`);

        // 获取表的外键信息
        const foreignKeysResult = await db.query(`PRAGMA foreign_key_list(${tableName})`);

        // 获取表的索引信息
        const indexesResult = await db.query(`PRAGMA index_list(${tableName})`);

        // 获取记录数
        const countResult = await db.queryFirst(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = countResult?.count || 0;

        // 构建列信息
        const columns = columnsResult.map((col: any) => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
          defaultValue: col.dflt_value,
          description: '',
          isPrimaryKey: col.pk === 1,
          isForeignKey: foreignKeysResult.some((fk: any) => fk.from === col.name)
        }));

        // 构建外键信息
        const foreignKeys = foreignKeysResult.map((fk: any) => ({
          name: `fk_${tableName}_${fk.from}`,
          columns: [fk.from],
          referencedTable: fk.table,
          referencedColumns: [fk.to],
          onDelete: fk.on_delete || 'NO ACTION',
          onUpdate: fk.on_update || 'NO ACTION'
        }));

        // 构建索引信息
        const indexes = [];
        for (const idx of indexesResult) {
          const indexInfoResult = await db.query(`PRAGMA index_info(${idx.name})`);
          indexes.push({
            name: idx.name,
            columns: indexInfoResult.map((info: any) => info.name),
            unique: idx.unique === 1,
            type: 'btree'
          });
        }

        // 获取主键
        const primaryKey = columns
          .filter((col: any) => col.isPrimaryKey)
          .map((col: any) => col.name);

        // 添加表信息
        tables.push({
          id: tableName,
          name: tableName,
          description: getTableDescription(tableName),
          schema: 'main',
          columns,
          indexes,
          foreignKeys,
          primaryKey,
          rowCount,
          size: formatBytes(rowCount * 100), // 估算大小
          lastUpdated: new Date().toISOString(),
          dependencies: foreignKeys.map((fk: any) => fk.referencedTable),
          dependents: []
        });

        // 添加关系信息
        for (const fk of foreignKeys) {
          relations.push({
            from: tableName,
            to: fk.referencedTable,
            type: 'many-to-one',
            description: `${tableName}.${fk.columns[0]} -> ${fk.referencedTable}.${fk.referencedColumns[0]}`
          });
        }
      }

      return c.json({
        success: true,
        data: {
          tables,
          relations
        },
        message: '获取数据库结构成功'
      });

    } catch (error) {
      console.error('获取数据库结构失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取数据库结构失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return monitor;
}

/**
 * 获取表的描述信息
 */
function getTableDescription(tableName: string): string {
  const descriptions: Record<string, string> = {
    'users': '用户基础信息表',
    'universal_questionnaire_responses': '通用问卷回答表',
    'raw_story_submissions': '原始故事提交表',
    'valid_stories': '有效故事表（已审核通过）',
    'valid_heart_voices': '有效心声表（已审核通过）',
    'participation_stats': '参与统计表',
    'test_story_data': '测试故事数据表',
    'audit_records': '审核记录表',
    'user_sessions': '用户会话表',
    'questionnaires': '问卷模板表',
    'tags': '标签表',
    'story_tags': '故事标签关联表'
  };

  return descriptions[tableName] || `${tableName} 表`;
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

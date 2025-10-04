/**
 * 简化版系统健康检查路由
 */

import { Hono } from 'hono';

const app = new Hono();

// 基础健康检查
app.get('/health', async (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// 数据库健康检查
app.get('/health/database', async (c) => {
  try {
    // 测试数据库连接
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    
    return c.json({
      success: true,
      data: {
        component: 'database',
        status: 'healthy',
        message: '数据库连接正常',
        timestamp: new Date().toISOString(),
        details: { connectionTest: result }
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      data: {
        component: 'database',
        status: 'critical',
        message: `数据库连接失败: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// 数据一致性检查
app.get('/health/consistency', async (c) => {
  try {
    // 检查user_id字段类型
    const tableInfo = await c.env.DB.prepare('PRAGMA table_info(universal_questionnaire_responses)').all();
    const userIdField = tableInfo.results.find((field: any) => field.name === 'user_id');
    
    // 检查数据统计
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_responses,
        COUNT(user_id) as responses_with_user_id
      FROM universal_questionnaire_responses
    `).first();
    
    return c.json({
      success: true,
      data: {
        component: 'data_consistency',
        status: userIdField?.type === 'TEXT' ? 'healthy' : 'warning',
        message: userIdField?.type === 'TEXT' ? '数据类型一致性正常' : 'user_id字段类型需要修复',
        timestamp: new Date().toISOString(),
        details: {
          userIdFieldType: userIdField?.type,
          statistics: stats
        }
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      data: {
        component: 'data_consistency',
        status: 'critical',
        message: `数据一致性检查失败: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// 迁移状态检查
app.get('/health/migrations', async (c) => {
  try {
    const migrations = await c.env.DB.prepare(`
      SELECT * FROM migration_logs 
      ORDER BY executed_at DESC 
      LIMIT 5
    `).all();
    
    const latestMigration = migrations.results[0];
    const hasFailedMigrations = migrations.results.some((m: any) => m.status === 'failed');
    
    return c.json({
      success: true,
      data: {
        component: 'migrations',
        status: hasFailedMigrations ? 'warning' : 'healthy',
        message: hasFailedMigrations ? '存在失败的迁移' : '迁移状态正常',
        timestamp: new Date().toISOString(),
        details: {
          latestMigration,
          recentMigrations: migrations.results
        }
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      data: {
        component: 'migrations',
        status: 'critical',
        message: `迁移状态检查失败: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// 综合健康检查
app.get('/health/detailed', async (c) => {
  try {
    // 执行所有检查
    const checks = await Promise.all([
      // 数据库检查
      (async () => {
        try {
          await c.env.DB.prepare('SELECT 1').first();
          return {
            component: 'database',
            status: 'healthy',
            message: '数据库连接正常',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            component: 'database',
            status: 'critical',
            message: `数据库连接失败: ${error.message}`,
            timestamp: new Date().toISOString()
          };
        }
      })(),
      
      // 数据一致性检查
      (async () => {
        try {
          const tableInfo = await c.env.DB.prepare('PRAGMA table_info(universal_questionnaire_responses)').all();
          const userIdField = tableInfo.results.find((field: any) => field.name === 'user_id');
          
          return {
            component: 'data_consistency',
            status: userIdField?.type === 'TEXT' ? 'healthy' : 'warning',
            message: userIdField?.type === 'TEXT' ? '数据类型一致性正常' : 'user_id字段类型需要修复',
            timestamp: new Date().toISOString(),
            details: { userIdFieldType: userIdField?.type }
          };
        } catch (error) {
          return {
            component: 'data_consistency',
            status: 'critical',
            message: `数据一致性检查失败: ${error.message}`,
            timestamp: new Date().toISOString()
          };
        }
      })()
    ]);
    
    // 计算总体状态
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      critical: checks.filter(c => c.status === 'critical').length
    };
    
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (summary.critical > 0) {
      overall = 'critical';
    } else if (summary.warning > 0) {
      overall = 'warning';
    }
    
    return c.json({
      success: true,
      data: {
        overall,
        timestamp: new Date().toISOString(),
        checks,
        summary
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: '健康检查执行失败',
        details: error.message
      }
    }, 500);
  }
});

export default app;

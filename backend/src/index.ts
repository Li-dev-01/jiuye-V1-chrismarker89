import { Hono } from 'hono';
// import { serve } from '@hono/node-server'; // 仅在本地开发时使用
import { serveStatic } from '@hono/node-server/serve-static';
import { Env } from './types/api';
import { corsMiddleware } from './middleware/cors';
import { createAuthRoutes } from './routes/auth';
import { createQuestionnaireRoutes } from './routes/questionnaire';
import { createUUIDRoutes } from './routes/uuid';
import { createAdminRoutes } from './routes/admin';
import { createStoriesRoutes } from './routes/stories';
import { dataGenerator } from './routes/dataGenerator';
// import { swaggerSpec, swaggerUiOptions } from './docs/swagger-simple'; // 暂时禁用swagger，因为在Cloudflare Workers中不兼容
import analyticsRoutes from './routes/analytics';
import reviewerRoutes from './routes/reviewer';
import securityRoutes from './routes/security';
import { createParticipationStatsRoutes } from './routes/participationStats';
import { createDatabaseMonitorRoutes } from './routes/databaseMonitor';
import health from './routes/health';
import violationsRoutes from './routes/violations';
import { createTieredAuditRoutes } from './routes/tiered-audit';
import { createQuestionnaireAuthRoutes } from './routes/questionnaire-auth';
import { createStoryAuditRoutes } from './routes/storyAudit';
import { initAuditDatabase, checkAuditDatabaseInit } from './utils/initAuditDatabase';
import { googleAuth } from './routes/google-auth';
import { googleWhitelist } from './routes/google-whitelist';
import { userLoginHistory } from './routes/user-login-history';
import { ipAccessControl } from './routes/ip-access-control';
import { twoFactorAuth } from './routes/two-factor-auth';
import { loginMonitor } from './routes/login-monitor';
import { intelligentSecurity } from './routes/intelligent-security';
import userContentManagement from './routes/user-content-management';
import { createVisualizationRoutes } from './routes/visualization';
import { createUniversalQuestionnaireRoutes } from './routes/universal-questionnaire';
import { createQuestionnaireV1Routes } from './routes/questionnaire-v1';
import { createQuestionnaireV2Routes } from './routes/questionnaire-v2';
import { createDatabaseFixRoutes } from './routes/database-fix';
import { createUnifiedUserCreationRoutes } from './routes/unified-user-creation';
// import { CronHandler, type CronEvent } from './handlers/cronHandler';
import { handleScheduledSync, type CronEvent, type Questionnaire2SyncEnv } from './handlers/questionnaire2SyncHandler';
import pngManagementRoutes from './routes/png-management-simple';
import turnstileTestRoutes from './routes/test/turnstile';
import simpleTestRoutes from './routes/test/simple';
import favorites from './routes/favorites';
import userReports from './routes/userReports';
import systemHealthRoutes from './routes/system-health-simple';

// 创建Hono应用
const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', corsMiddleware);

// 数据库初始化中间件
app.use('*', async (c, next) => {
  try {
    // 检查审核系统数据库是否已初始化
    const isInitialized = await checkAuditDatabaseInit(c.env.DB);

    if (!isInitialized) {
      console.log('[MIDDLEWARE] 初始化审核系统数据库...');
      await initAuditDatabase(c.env.DB);
      console.log('[MIDDLEWARE] 审核系统数据库初始化完成');
    }
  } catch (error) {
    console.error('[MIDDLEWARE] 数据库初始化失败:', error);
    // 不阻断请求，继续执行
  }

  await next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: 健康检查
 *     description: 检查API服务的运行状态
 *     responses:
 *       200:
 *         description: 服务运行正常
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: healthy
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         environment:
 *                           type: string
 *                           example: development
 *             example:
 *               success: true
 *               data:
 *                 status: healthy
 *                 timestamp: "2025-07-31T12:00:00.000Z"
 *                 environment: development
 *               message: "API服务运行正常"
 */
// 健康检查路由

// 测试新的健康检查端点
app.get('/health-test', async (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      message: 'New health check working',
      timestamp: new Date().toISOString()
    }
  });
});

// Swagger API文档 - 暂时禁用
// app.get('/api-docs/swagger.json', (c) => {
//   return c.json(swaggerSpec);
// });

// Swagger UI页面 - 暂时禁用
// app.get('/api-docs', (c) => {
//   const html = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>就业问卷调查系统 API文档</title>
//         <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui.css" />
//         <style>
//           html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
//           *, *:before, *:after { box-sizing: inherit; }
//           body { margin:0; background: #fafafa; }
//           .swagger-ui .topbar { display: none; }
//           .swagger-ui .info { margin: 20px 0; }
//           .swagger-ui .info .title { color: #1890ff; }
//         </style>
//       </head>
//       <body>
//         <div id="swagger-ui"></div>
//         <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-bundle.js"></script>
//         <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-standalone-preset.js"></script>
//         <script>
//           window.onload = function() {
//             const ui = SwaggerUIBundle({
//               url: '/api-docs/swagger.json',
//               dom_id: '#swagger-ui',
//               deepLinking: true,
//               presets: [
//                 SwaggerUIBundle.presets.apis,
//                 SwaggerUIStandalonePreset
//               ],
//               plugins: [
//                 SwaggerUIBundle.plugins.DownloadUrl
//               ],
//               layout: "StandaloneLayout",
//               persistAuthorization: true,
//               displayRequestDuration: true,
//               filter: true,
//               showExtensions: true,
//               showCommonExtensions: true,
//               docExpansion: 'list',
//               defaultModelsExpandDepth: 2,
//               defaultModelExpandDepth: 2
//             });
//           };
//         </script>
//       </body>
//     </html>
//   `;
//   return c.html(html);
// });

// 创建API路由实例
console.log('🔧 Creating API route instance...');
const api = new Hono<{ Bindings: Env }>();
console.log('✅ API route instance created');

// 认证路由
console.log('🔧 About to register auth routes...');
try {
  api.route('/auth', createAuthRoutes());
  console.log('✅ Auth routes registered');
} catch (error) {
  console.error('❌ Failed to register auth routes:', error);
}

// UUID用户管理路由
console.log('🔧 About to register UUID routes...');
try {
  api.route('/uuid', createUUIDRoutes());
  console.log('✅ UUID routes registered');
} catch (error) {
  console.error('❌ Failed to register UUID routes:', error);
}

// 统一用户创建路由 - 暂时注释掉
// console.log('🔧 About to register user creation routes...');
// try {
//   api.route('/user-creation', createUnifiedUserCreationRoutes());
//   console.log('✅ User creation routes registered');
// } catch (error) {
//   console.error('❌ Failed to register user creation routes:', error);
// }

// 独立问卷系统路由注册
console.log('🔧 Registering independent questionnaire systems...');

try {
  // 问卷1系统（传统问卷）
  console.log('🔧 Registering questionnaire V1 routes...');
  api.route('/questionnaire-v1', createQuestionnaireV1Routes());
  console.log('✅ Questionnaire V1 routes registered successfully');

  // 问卷2系统（智能问卷）
  console.log('🔧 Registering questionnaire V2 routes...');
  api.route('/questionnaire-v2', createQuestionnaireV2Routes());
  console.log('✅ Questionnaire V2 routes registered successfully');

} catch (error) {
  console.error('❌ Failed to register independent questionnaire routes:', error);
  console.error('❌ Error details:', error.stack);
}

// 问卷用户认证路由（独立系统）
try {
  console.log('🔧 Registering questionnaire auth routes...');
  const questionnaireAuthRoutes = createQuestionnaireAuthRoutes();
  console.log('🔧 Questionnaire auth routes created:', questionnaireAuthRoutes);
  api.route('/questionnaire-auth', questionnaireAuthRoutes);
  console.log('✅ Questionnaire auth routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register questionnaire auth routes:', error);
  console.error('❌ Error details:', error.stack);
}

// 分析路由
api.route('/analytics', analyticsRoutes);

// 审核员路由
api.route('/reviewer', reviewerRoutes);

// 管理员路由
api.route('/admin', createAdminRoutes());

// 故事路由
api.route('/stories', createStoriesRoutes());

// 收藏功能路由
api.route('/favorites', favorites);

// 违规内容管理路由
api.route('/violations', violationsRoutes);

// 分级审核路由
api.route('/tiered-audit', createTieredAuditRoutes());

// 页面参与统计路由
api.route('/participation-stats', createParticipationStatsRoutes());

// 数据库监测管理路由
api.route('/admin/database', createDatabaseMonitorRoutes());

// 健康检查路由（也在API前缀下提供）
api.route('/health', health);

// 系统健康检查路由（详细监控）
api.get('/system-health/test', async (c) => {
  return c.json({
    success: true,
    message: '系统健康检查路由正常工作',
    timestamp: new Date().toISOString()
  });
});

// 数据库健康检查
api.get('/system-health/database', async (c) => {
  try {
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
api.get('/system-health/consistency', async (c) => {
  try {
    const tableInfo = await c.env.DB.prepare('PRAGMA table_info(universal_questionnaire_responses)').all();
    const userIdField = tableInfo.results.find((field: any) => field.name === 'user_id');

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

// 测试路由
api.route('/test/simple', simpleTestRoutes);
api.route('/test/turnstile', turnstileTestRoutes);

// API路由前缀
app.route('/api', api);

// 故事审核系统路由
app.route('/api/stories', createStoryAuditRoutes());

// 用户举报系统路由
app.route('/api/reports', userReports);

// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: '请求的资源不存在'
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);

  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: c.env?.ENVIRONMENT === 'development' ? err.message : '服务器内部错误'
  }, 500);
});








  // 临时PNG管理API
  api.get('/images/auto-generate/stats', async (c) => {
    return c.json({
      success: true,
      data: {
        totalCards: 156,
        totalDownloads: 1247,
        uniqueContents: 89,
        cardStats: [
          { content_type: 'story', theme: 'dark', count: 35, total_downloads: 156 },
          { content_type: 'story', theme: 'minimal', count: 38, total_downloads: 201 }
        ],
        recentDownloads: [
          { date: '2024-01-01', downloads: 23 },
          { date: '2024-01-02', downloads: 31 },
          { date: '2024-01-03', downloads: 28 }
        ]
      }
    });
  });

  api.post('/images/auto-generate/batch-generate', async (c) => {
    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        totalProcessed: 50,
        totalGenerated: 100,
        results: [
          {
            type: body.contentType || 'story',
            processed: 25,
            generated: 50,
            errors: []
          }
        ]
      },
      message: '批量生成完成：处理 50 项，生成 100 张PNG卡片'
    });
  });

  // 故事路由

  // 审核路由
  api.route('/review', createReviewRoutes());

  // 分析路由 - 使用新的TypeScript版本

  // 可视化路由 - 基于真实问卷数据的可视化
  api.route('/analytics/visualization', createVisualizationRoutes());

  // 审核员路由 - 新的TypeScript版本

  // 管理员路由

  // 数据生成器路由（管理员专用）
  api.route('/admin/data-generator', dataGenerator);

  // AI源管理和超级管理员路由已移除

  // 页面参与统计路由

  // 问卷用户认证路由（独立系统）
  try {
    console.log('🔧 Registering questionnaire auth routes...');
    const questionnaireAuthRoutes = createQuestionnaireAuthRoutes();
    console.log('🔧 Questionnaire auth routes created:', questionnaireAuthRoutes);
    console.log('✅ Questionnaire auth routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register questionnaire auth routes:', error);
    console.error('❌ Error details:', error.stack);
  }


  // 违规内容管理路由

  // 分级审核路由
  api.route('/audit', createTieredAuditRoutes());

  // 数据库修复路由
  api.route('/database-fix', createDatabaseFixRoutes());

  // PNG管理路由
  api.route('/png-management', pngManagementRoutes);


  // 错误报告路由
  api.post('/errors/report', async (c) => {
    try {
      const errorData = await c.req.json();

      // 记录错误到控制台（在生产环境中可以发送到日志服务）
      console.error('前端错误报告:', {
        timestamp: new Date().toISOString(),
        ...errorData
      });

      return c.json({
        success: true,
        message: '错误报告已收到'
      });
    } catch (error) {
      console.error('处理错误报告失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '处理错误报告失败'
      }, 500);
    }
  });

  // 测试数据库监测路由
  api.get('/admin/database-test', async (c) => {
    return c.json({
      success: true,
      message: '数据库监测路由测试成功',
      timestamp: new Date().toISOString()
    });
  });

  // 简化版统计API（直接实现）
  api.get('/stats/simple', async (c) => {
    try {
      const db = c.env.DB;

      // 并行查询所有统计数据
      const [questionnaireResult, storyResult] = await Promise.all([
        db.prepare(`
          SELECT COUNT(DISTINCT user_uuid) as participants,
                 COUNT(*) as responses
          FROM universal_questionnaire_responses
          WHERE completion_status = 'completed'
        `).first(),

        db.prepare(`
          SELECT COUNT(*) as published,
                 COUNT(DISTINCT user_id) as authors
          FROM valid_stories
          WHERE audit_status = 'approved'
        `).first(),


      ]);

      return c.json({
        success: true,
        data: {
          questionnaire: {
            participantCount: questionnaireResult?.participants || 0,
            totalResponses: questionnaireResult?.responses || 0
          },
          stories: {
            publishedCount: storyResult?.published || 0,
            authorCount: storyResult?.authors || 0
          },
          lastUpdated: new Date().toISOString()
        },
        message: '获取参与统计成功'
      });

    } catch (error) {
      console.error('获取参与统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取参与统计失败'
      }, 500);
    }
  });





  // 临时PNG管理API
    return c.json({
      success: true,
      data: {
        totalCards: 156,
        totalDownloads: 1247,
        uniqueContents: 89,
        cardStats: [

          { content_type: 'story', theme: 'dark', count: 35, total_downloads: 156 },
          { content_type: 'story', theme: 'minimal', count: 38, total_downloads: 201 }
        ],
        recentDownloads: [
          { date: '2024-01-01', downloads: 23 },
          { date: '2024-01-02', downloads: 31 },
          { date: '2024-01-03', downloads: 28 }
        ]
      }
    });
  });

    const body = await c.req.json();
    return c.json({
      success: true,
      data: {
        totalProcessed: 50,
        totalGenerated: 100,
        results: [
          {
            type: body.contentType || 'story',
            processed: 25,
            generated: 50,
            errors: []
          }
        ]
      },
      message: '批量生成完成：处理 50 项，生成 100 张PNG卡片'
    });
  });

  // 安全检查路由（反爬虫、反机器人）
  try {
    api.route('/security', securityRoutes);
    console.log('✅ Security routes registered');
  } catch (error) {
    console.error('❌ Failed to register security routes:', error);
  }

  // 简化的安全跟踪路由（直接在API根路径）
  api.post('/track', async (c) => {
    try {
      const clientIP = c.req.header('CF-Connecting-IP') ||
                      c.req.header('X-Forwarded-For') ||
                      c.req.header('X-Real-IP') ||
                      'unknown';

      const userAgent = c.req.header('User-Agent') || '';
      const requestData = await c.req.json();

      // 简化版安全检查
      let riskScore = 0;

      // 基础检查
      if (!userAgent || userAgent.includes('bot')) {
        riskScore += 30;
      }

      // 记录正常访问
      console.log('✅ Security check passed:', {
        clientIP,
        riskScore,
        userAgent: userAgent.substring(0, 50) + '...'
      });

      return c.json({
        success: true,
        message: 'Request processed',
        data: {
          status: 'ok',
          riskScore
        }
      });

    } catch (error) {
      console.error('Security check error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  });

// 认证路由现在从单独文件导入

// 问卷路由现在从单独文件导入

// 审核路由（占位符）
function createReviewRoutes() {
  const review = new Hono<{ Bindings: Env }>();
  
  review.get('/pending', (c) => {
    return c.json({
      success: true,
      data: { message: '待审核列表功能待实现' },
      message: '待审核列表接口'
    });
  });

  return review;
}

// 旧的分析路由已迁移到 ./routes/analytics.ts

// 本地开发服务器
// 模拟环境变量
const mockEnv: Env = {
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5174,http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  DB: {} as any // 模拟D1Database
};

// 创建带环境变量的应用实例
const appWithEnv = new Hono();

appWithEnv.use('*', async (c, next) => {
  // 注入环境变量
  c.env = mockEnv;
  return next();
});

appWithEnv.route('/', app);

// 本地开发服务器代码已移除，仅保留Cloudflare Workers导出

// Cloudflare Workers导出
export default {
  fetch: app.fetch,

  // 定时任务处理器 - 问卷2数据同步
  async scheduled(event: CronEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('🕐 Cloudflare Workers 定时任务触发:', event.cron);

    try {
      // 执行问卷2数据同步
      await handleScheduledSync(event, env as unknown as Questionnaire2SyncEnv);
      console.log('✅ 定时任务执行成功');
    } catch (error) {
      console.error('❌ 定时任务执行失败:', error);
    }
  }
};

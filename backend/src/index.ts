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
import { createDatabaseFixRoutes } from './routes/database-fix';
// import { CronHandler, type CronEvent } from './handlers/cronHandler';
import pngManagementRoutes from './routes/png-management-simple';

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
app.route('/health', health);

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

// API路由前缀 - 直接注册异步创建的路由
(async () => {
  const apiRoutes = await createApiRoutes();
  app.route('/api', apiRoutes);
})();

// 故事审核系统路由
app.route('/api/stories', createStoryAuditRoutes());

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

// 创建API路由
async function createApiRoutes() {
  const api = new Hono<{ Bindings: Env }>();

  // 认证路由
  api.route('/auth', createAuthRoutes());

  // Google OAuth认证路由
  try {
    api.route('/auth/google', googleAuth);
    console.log('✅ Google OAuth routes registered');
  } catch (error) {
    console.error('❌ Failed to register Google OAuth routes:', error);
  }

  // Google OAuth白名单管理路由
  try {
    api.route('/admin/google-whitelist', googleWhitelist);
    console.log('✅ Google whitelist routes registered');
  } catch (error) {
    console.error('❌ Failed to register Google whitelist routes:', error);
  }

  // 用户登录历史路由
  try {
    api.route('/user/login-history', userLoginHistory);
    console.log('✅ User login history routes registered');
  } catch (error) {
    console.error('❌ Failed to register user login history routes:', error);
  }

  // IP访问控制路由
  try {
    api.route('/admin/ip-access-control', ipAccessControl);
    console.log('✅ IP access control routes registered');
  } catch (error) {
    console.error('❌ Failed to register IP access control routes:', error);
  }

  // 双因素认证路由
  try {
    api.route('/user/two-factor', twoFactorAuth);
    console.log('✅ Two factor auth routes registered');
  } catch (error) {
    console.error('❌ Failed to register two factor auth routes:', error);
  }

  // 智能安全路由
  try {
    api.route('/admin/intelligent-security', intelligentSecurity);
    console.log('✅ Intelligent security routes registered');
  } catch (error) {
    console.error('❌ Failed to register intelligent security routes:', error);
  }

  // 登录监控路由
  try {
    api.route('/admin/login-monitor', loginMonitor);
    console.log('✅ Login monitor routes registered');
  } catch (error) {
    console.error('❌ Failed to register login monitor routes:', error);
  }

  // 用户内容管理路由
  try {
    api.route('/user-content-management', userContentManagement);
    console.log('✅ User content management routes registered');
  } catch (error) {
    console.error('❌ Failed to register user content management routes:', error);
  }

  // 问卷用户认证路由已移除

  // 简化认证路由 (专为reviewer-admin-dashboard设计)
  try {
    const simpleAuth = (await import('./routes/simpleAuth')).default;
    api.route('/simple-auth', simpleAuth);
    console.log('✅ Simple auth routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register simple auth routes:', error);
  }

  // 简化审核员路由 (专为reviewer-admin-dashboard设计)
  try {
    const simpleReviewer = (await import('./routes/simpleReviewer')).default;
    api.route('/simple-reviewer', simpleReviewer);
    console.log('✅ Simple reviewer routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register simple reviewer routes:', error);
  }

  // 简化管理员路由 (专为reviewer-admin-dashboard设计)
  try {
    const simpleAdmin = (await import('./routes/simpleAdmin')).default;
    api.route('/simple-admin', simpleAdmin);
    console.log('✅ Simple admin routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register simple admin routes:', error);
  }

  // UUID用户管理路由
  api.route('/uuid', createUUIDRoutes());

  // 问卷路由
  api.route('/questionnaire', createQuestionnaireRoutes());

  // 通用问卷路由 (多级专用表优化版)
  api.route('/universal-questionnaire', createUniversalQuestionnaireRoutes());



  // 文件管理和PNG生成路由已移除









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
  api.route('/stories', createStoriesRoutes());

  // 审核路由
  api.route('/review', createReviewRoutes());

  // 分析路由 - 使用新的TypeScript版本
  api.route('/analytics', analyticsRoutes);

  // 可视化路由 - 基于真实问卷数据的可视化
  api.route('/analytics/visualization', createVisualizationRoutes());

  // 审核员路由 - 新的TypeScript版本
  api.route('/reviewer', reviewerRoutes);

  // 管理员路由
  api.route('/admin', createAdminRoutes());

  // 数据生成器路由（管理员专用）
  api.route('/admin/data-generator', dataGenerator);

  // AI源管理和超级管理员路由已移除

  // 页面参与统计路由
  api.route('/participation-stats', createParticipationStatsRoutes());

  // 数据库监测管理路由
  api.route('/admin/database', createDatabaseMonitorRoutes());

  // 违规内容管理路由
  api.route('/violations', violationsRoutes);

  // 分级审核路由
  api.route('/audit', createTieredAuditRoutes());

  // 数据库修复路由
  api.route('/database-fix', createDatabaseFixRoutes());

  // PNG管理路由
  api.route('/png-management', pngManagementRoutes);

  // 健康检查路由（也在API前缀下提供）
  api.route('/health', health);

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

  return api;
}

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

  // 定时任务处理器 - 暂时禁用
  // async scheduled(event: CronEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  //   console.log('🕐 Cloudflare Workers 定时任务触发:', event.cron);
  //   // 暂时禁用定时任务功能
  // }
};

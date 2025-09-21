import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Env } from './types/api';
import { corsMiddleware } from './middleware/cors';
import { createAuthRoutes } from './routes/auth';
import { createQuestionnaireRoutes } from './routes/questionnaire';
import { createUniversalQuestionnaireRoutes } from './routes/questionnaires';
import { createUUIDRoutes } from './routes/uuid';
import { createQuestionnaireAuthRoutes } from './routes/auth/questionnaires';
import { createSuperAdminRoutes } from './routes/admin/super';
import { createAdminRoutes } from './routes/admin';
import { createAISourcesRoutes } from './routes/ai/sources';
import { createHeartVoicesRoutes } from './routes/heart-voicess';
import { createHeartVoiceRoutes } from './routes/heart-voices';
import { createFileManagementRoutes } from './routes/files';
import { createAutoPngRoutes } from './routes/images/auto-generate';
import { createStoriesRoutes } from './routes/stories';
import { createPngTestRoutes } from './routes/images/test';
import { dataGenerator } from './routes/dataGenerator';
import { swaggerSpec, swaggerUiOptions } from './docs/swagger-simple';
import analyticsRoutes from './routes/analytics';
import reviewerRoutes from './routes/reviewer';
import securityRoutes from './routes/security';
import { createParticipationStatsRoutes } from './routes/participationStats';
import { createDatabaseMonitorRoutes } from './routes/databaseMonitor';
import health from './routes/health';
import violationsRoutes from './routes/violations';
import { createTieredAuditRoutes } from './routes/tiered-audit';
import { googleAuth } from './routes/google-auth';
import { googleWhitelist } from './routes/google-whitelist';
import { userLoginHistory } from './routes/user-login-history';
import { ipAccessControl } from './routes/ip-access-control';
import { twoFactorAuth } from './routes/two-factor-auth';
import { intelligentSecurity } from './routes/intelligent-security';
import userContentManagement from './routes/user-content-management';

// 创建Hono应用
const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', corsMiddleware);

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

// Swagger API文档
app.get('/api-docs/swagger.json', (c) => {
  return c.json(swaggerSpec);
});

// Swagger UI页面
app.get('/api-docs', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>就业问卷调查系统 API文档</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .info .title { color: #1890ff; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/api-docs/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              persistAuthorization: true,
              displayRequestDuration: true,
              filter: true,
              showExtensions: true,
              showCommonExtensions: true,
              docExpansion: 'list',
              defaultModelsExpandDepth: 2,
              defaultModelExpandDepth: 2
            });
          };
        </script>
      </body>
    </html>
  `;
  return c.html(html);
});

// API路由前缀
app.route('/api', createApiRoutes());

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
function createApiRoutes() {
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

  // 用户内容管理路由
  try {
    api.route('/user-content-management', userContentManagement);
    console.log('✅ User content management routes registered');
  } catch (error) {
    console.error('❌ Failed to register user content management routes:', error);
  }

  // 问卷用户认证路由（独立系统）
  try {
    api.route('/questionnaire-auth', createQuestionnaireAuthRoutes());
    console.log('✅ Questionnaire auth routes registered');
  } catch (error) {
    console.error('❌ Failed to register questionnaire auth routes:', error);
  }

  // UUID用户管理路由
  api.route('/uuid', createUUIDRoutes());

  // 问卷路由
  api.route('/questionnaire', createQuestionnaireRoutes());

  // 通用问卷路由
  api.route('/questionnaires', createUniversalQuestionnaireRoutes());

  // 心声路由
  api.route('/heart-voicess', createHeartVoicesRoutes());

  // 新心声路由（问卷心声）
  try {
    api.route('/heart-voices', createHeartVoiceRoutes());
    console.log('✅ Heart voice routes registered');
  } catch (error) {
    console.error('❌ Failed to register heart voice routes:', error);
  }

  // 文件管理路由（R2存储、PNG生成、数据备份）
  try {
    api.route('/files', createFileManagementRoutes());
    console.log('✅ File management routes registered');
  } catch (error) {
    console.error('❌ Failed to register file management routes:', error);
  }

  // 自动PNG生成路由
  try {
    api.route('/images/auto-generate', createAutoPngRoutes());
    console.log('✅ Auto PNG routes registered');
  } catch (error) {
    console.error('❌ Failed to register auto PNG routes:', error);
  }

  // PNG测试路由
  try {
    api.route('/images/test', createPngTestRoutes());
    console.log('✅ PNG test routes registered');
  } catch (error) {
    console.error('❌ Failed to register PNG test routes:', error);
  }

  // 临时心声API（简化版本）
  api.get('/heart-voices/statistics', async (c) => {
    return c.json({
      success: true,
      data: {
        totalCount: 156,
        categoryStats: {
          'employment-feedback': 156
        },
        emotionStats: {
          positive: 45,
          negative: 38,
          neutral: 73
        },
        recentCount: 23,
        averageWordCount: 127,
        topTags: []
      }
    });
  });

  api.post('/heart-voices/:id/like', async (c) => {
    const heartVoiceId = c.req.param('id');
    return c.json({
      success: true,
      message: '点赞成功',
      data: {
        heartVoiceId: parseInt(heartVoiceId),
        action: 'like'
      }
    });
  });

  api.post('/heart-voices/:id/dislike', async (c) => {
    const heartVoiceId = c.req.param('id');
    return c.json({
      success: true,
      message: '踩成功',
      data: {
        heartVoiceId: parseInt(heartVoiceId),
        action: 'dislike'
      }
    });
  });

  api.get('/heart-voices/:id/png/:theme?', async (c) => {
    const heartVoiceId = c.req.param('id');
    const theme = c.req.param('theme') || 'gradient';

    // 模拟PNG下载链接
    const mockDownloadUrl = `https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/heart-voices-${heartVoiceId}-${theme}.png`;

    return c.json({
      success: true,
      data: {
        downloadUrl: mockDownloadUrl,
        cardId: `heart-voices-${heartVoiceId}-${theme}`,
        theme
      }
    });
  });

  api.get('/heart-voices/list', async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    // 模拟心声列表数据
    const mockHeartVoices = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      content: `这是第${(page - 1) * limit + i + 1}条心声内容。求职过程中遇到了很多困难，但是我相信通过努力一定能找到合适的工作。希望就业市场能够更加公平，给每个人平等的机会。`,
      anonymousNickname: `求职者${(page - 1) * limit + i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'employment-feedback',
      wordCount: 50 + Math.floor(Math.random() * 100),
      emotionCategory: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      likeCount: Math.floor(Math.random() * 50),
      dislikeCount: Math.floor(Math.random() * 10)
    }));

    return c.json({
      success: true,
      data: {
        data: mockHeartVoices,
        total: 500,
        page,
        limit
      }
    });
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
          { content_type: 'heart_voice', theme: 'gradient', count: 45, total_downloads: 234 },
          { content_type: 'heart_voice', theme: 'light', count: 38, total_downloads: 189 },
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
            type: body.contentType || 'heart_voice',
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

  // 审核员路由 - 新的TypeScript版本
  api.route('/reviewer', reviewerRoutes);

  // 管理员路由
  api.route('/admin', createAdminRoutes());

  // AI源管理路由
  api.route('/ai/sources', createAISourcesRoutes());

  // 数据生成器路由（管理员专用）
  api.route('/admin/data-generator', dataGenerator);

  // 超级管理员路由
  api.route('/admin/super', createSuperAdminRoutes());

  // 页面参与统计路由
  api.route('/participation-stats', createParticipationStatsRoutes());

  // 数据库监测管理路由
  api.route('/admin/database', createDatabaseMonitorRoutes());

  // 违规内容管理路由
  api.route('/violations', violationsRoutes);

  // 分级审核路由
  api.route('/audit', createTieredAuditRoutes());

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
      const [questionnaireResult, storyResult, voiceResult] = await Promise.all([
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

        db.prepare(`
          SELECT COUNT(*) as published,
                 COUNT(DISTINCT user_id) as authors
          FROM valid_heart_voices
          WHERE audit_status = 'approved'
        `).first()
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
          voices: {
            publishedCount: voiceResult?.published || 0,
            authorCount: voiceResult?.authors || 0
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



  // 临时心声统计API（简化版本）
  api.get('/heart-voices/statistics', async (c) => {
    return c.json({
      success: true,
      data: {
        totalCount: 156,
        categoryStats: {
          'employment-feedback': 156
        },
        emotionStats: {
          positive: 45,
          negative: 38,
          neutral: 73
        },
        recentCount: 23,
        averageWordCount: 127,
        topTags: []
      }
    });
  });

  api.get('/heart-voices/:id/png/:theme?', async (c) => {
    const heartVoiceId = c.req.param('id');
    const theme = c.req.param('theme') || 'gradient';

    // 模拟PNG下载链接
    const mockDownloadUrl = `https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/heart-voices-${heartVoiceId}-${theme}.png`;

    return c.json({
      success: true,
      data: {
        downloadUrl: mockDownloadUrl,
        cardId: `heart-voices-${heartVoiceId}-${theme}`,
        theme
      }
    });
  });

  api.get('/heart-voices/list', async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    // 模拟心声列表数据
    const mockHeartVoices = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      content: `这是第${(page - 1) * limit + i + 1}条心声内容。求职过程中遇到了很多困难，但是我相信通过努力一定能找到合适的工作。希望就业市场能够更加公平，给每个人平等的机会。`,
      anonymousNickname: `求职者${(page - 1) * limit + i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'employment-feedback',
      wordCount: 50 + Math.floor(Math.random() * 100),
      emotionCategory: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      likeCount: Math.floor(Math.random() * 50),
      dislikeCount: Math.floor(Math.random() * 10)
    }));

    return c.json({
      success: true,
      data: {
        data: mockHeartVoices,
        total: 500,
        page,
        limit
      }
    });
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
          { content_type: 'heart_voice', theme: 'gradient', count: 45, total_downloads: 234 },
          { content_type: 'heart_voice', theme: 'light', count: 38, total_downloads: 189 },
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
            type: body.contentType || 'heart_voice',
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

const port = process.env.PORT ? parseInt(process.env.PORT) : 8005;
console.log(`🚀 后端服务器启动在 http://localhost:${port}`);

serve({
  fetch: appWithEnv.fetch,
  port
});

// Cloudflare Workers导出
export default {
  fetch: app.fetch
};

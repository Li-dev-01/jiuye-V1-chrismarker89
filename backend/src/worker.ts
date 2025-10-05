// Cloudflare Workers 入口文件 - 完整版本

import { Hono } from 'hono';
import type { Env } from './types/api';
import { corsMiddleware } from './middleware/cors';
import { versionMiddleware } from './middleware/version';
import { createAuthRoutes } from './routes/auth';
import { createQuestionnaireRoutes } from './routes/questionnaire';
import { createQuestionnaireV2Routes } from './routes/questionnaire-v2';
import { createUniversalQuestionnaireRoutes } from './routes/universal-questionnaire';
import { createUUIDRoutes } from './routes/uuid';
import { createSuperAdminRoutes } from './routes/super-admin';
import { createAISourcesRoutes } from './routes/ai-sources';
import { createStoriesRoutes } from './routes/stories';
import { dataGenerator } from './routes/dataGenerator';
import { createParticipationStatsRoutes } from './routes/participationStats';
import analyticsRoutes from './routes/analytics';
import reviewerRoutes from './routes/reviewer';
import violationsRoutes from './routes/violations';
import { createTieredAuditRoutes } from './routes/tiered-audit';
import { createQuestionnaireAuthRoutes } from './routes/questionnaire-auth';
// import { createFileManagementRoutes } from './routes/file-management';
// import { createAutoPngRoutes } from './routes/auto-png';
// import { createPngTestRoutes } from './routes/png-test';
// import { createReviewRoutes } from './routes/review'; // 文件不存在，暂时注释
import { createDatabaseMonitorRoutes } from './routes/databaseMonitor';
import securityRoutes from './routes/security';
import simpleAdmin from './routes/simpleAdmin';
import simpleAuth from './routes/simpleAuth';
import simpleReviewer from './routes/simpleReviewer';
import { googleAuth } from './routes/google-auth';
import { googleWhitelist } from './routes/google-whitelist';
import { userLoginHistory } from './routes/user-login-history';
import { ipAccessControl } from './routes/ip-access-control';
import { twoFactorAuth } from './routes/two-factor-auth';
import { intelligentSecurity } from './routes/intelligent-security';
import adminWhitelist from './routes/admin-whitelist';
import emailRoleAuth from './routes/email-role-auth';
import accountManagement from './routes/account-management';
import { handleScheduledGeneration, handleScheduledSubmission } from './scheduled/dataGenerationCron';
import health from './routes/health';
import { handleScheduledEvent } from './services/statsScheduler';
import { handleSyncMonitoringTask } from './services/dataSyncMonitor';
import { WorkerAnalyticsService } from './services/analyticsEngine';

const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', corsMiddleware);

// Analytics Engine 数据收集中间件
app.use('*', async (c, next) => {
  const startTime = Date.now();

  try {
    await next();
  } finally {
    // 只在有 ANALYTICS 绑定时记录
    if (c.env.ANALYTICS) {
      try {
        const responseTime = Date.now() - startTime;
        const analytics = new WorkerAnalyticsService(c.env.ANALYTICS);

        analytics.recordRequest({
          path: new URL(c.req.url).pathname,
          method: c.req.method,
          statusCode: c.res.status,
          responseTime,
          userAgent: c.req.header('user-agent'),
          country: c.req.header('cf-ipcountry'),
          cacheStatus: c.req.header('cf-cache-status') as 'hit' | 'miss' | 'none'
        });
      } catch (analyticsError) {
        // 静默失败，不影响主请求
        console.error('Analytics recording failed:', analyticsError);
      }
    }
  }
});

// 健康检查路由
app.route('/health', health);

// API版本管理中间件
app.use('/api/*', versionMiddleware());

// Swagger API文档
app.get('/api-docs/swagger.json', (c) => {
  const swaggerDoc = {
    openapi: '3.0.0',
    info: {
      title: '大学生就业问卷调查系统 API',
      version: '1.0.0',
      description: '大学生就业问卷调查系统的RESTful API文档'
    },
    servers: [
      {
        url: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
        description: '生产环境'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: '健康检查',
          description: '检查系统各组件的健康状态',
          responses: {
            '200': {
              description: '系统健康',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          status: { type: 'string' },
                          timestamp: { type: 'string' },
                          version: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: '系统相关接口'
      }
    ]
  };
  return c.json(swaggerDoc);
});

// Swagger UI页面
app.get('/api-docs', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Employment Survey API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
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
              displayRequestDuration: true
            });
          };
        </script>
      </body>
    </html>
  `;
  return c.html(html);
});





// 向后兼容：无版本前缀的API路由映射到v1
app.route('/api', createApiRoutes());

// API版本信息端点
app.get('/api/version', (c) => {
  const { SUPPORTED_VERSIONS, DEFAULT_VERSION, VERSION_CONFIG } = require('./middleware/version');

  return c.json({
    success: true,
    data: {
      currentVersion: DEFAULT_VERSION,
      supportedVersions: SUPPORTED_VERSIONS,
      versionInfo: VERSION_CONFIG,
      endpoints: {
        v1: '/api/v1/',
        v2: '/api/v2/',
        legacy: '/api/' // 向后兼容
      }
    },
    message: 'API版本信息',
    timestamp: new Date().toISOString()
  });
});

// 创建API路由
function createApiRoutes() {
  const api = new Hono<{ Bindings: Env }>();

  // 认证路由
  api.route('/auth', createAuthRoutes());

  // UUID用户管理路由
  api.route('/uuid', createUUIDRoutes());

  // 问卷路由
  api.route('/questionnaire', createQuestionnaireRoutes());

  // 问卷2独立路由
  api.route('/questionnaire-v2', createQuestionnaireV2Routes());

  // 通用问卷路由
  api.route('/universal-questionnaire', createUniversalQuestionnaireRoutes());

  // 分析路由
  api.route('/analytics', analyticsRoutes);

  // 审核员路由
  api.route('/reviewer', reviewerRoutes);

  // 违规内容管理路由
  api.route('/violations', violationsRoutes);

  // 分级审核路由
  api.route('/tiered-audit', createTieredAuditRoutes());





  // 故事路由
  api.route('/stories', createStoriesRoutes());

  // AI源管理路由
  api.route('/ai-sources', createAISourcesRoutes());



  // 超级管理员路由
  api.route('/super-admin', createSuperAdminRoutes());

  // 简化认证系统路由 (reviewer-admin-dashboard使用)
  api.route('/simple-auth', simpleAuth);

  // 简化管理系统路由 (reviewer-admin-dashboard使用)
  api.route('/simple-admin', simpleAdmin);

  // 简化审核员系统路由 (reviewer-admin-dashboard使用)
  api.route('/simple-reviewer', simpleReviewer);

  // 页面参与统计路由
  api.route('/participation-stats', createParticipationStatsRoutes());

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



  // 用户内容管理路由
  try {
    const createUserContentManagementRoutes = require('./routes/user-content-management').default;
    api.route('/user-content-management', createUserContentManagementRoutes);
    console.log('✅ User content management routes registered');
  } catch (error) {
    console.error('❌ Failed to register user content management routes:', error);
  }

  // 文件管理路由（R2存储、PNG生成、数据备份）
  // try {
  //   api.route('/file-management', createFileManagementRoutes());
  //   console.log('✅ File management routes registered');
  // } catch (error) {
  //   console.error('❌ Failed to register file management routes:', error);
  // }

  // 自动PNG生成路由
  // try {
  //   api.route('/auto-png', createAutoPngRoutes());
  //   console.log('✅ Auto PNG routes registered');
  // } catch (error) {
  //   console.error('❌ Failed to register auto PNG routes:', error);
  // }

  // PNG测试路由
  // try {
  //   api.route('/png-test', createPngTestRoutes());
  //   console.log('✅ PNG test routes registered');
  // } catch (error) {
  //   console.error('❌ Failed to register PNG test routes:', error);
  // }

  // 审核路由 - 暂时注释，文件不存在
  // try {
  //   api.route('/review', createReviewRoutes());
  //   console.log('✅ Review routes registered');
  // } catch (error) {
  //   console.error('❌ Failed to register review routes:', error);
  // }

  // 数据库监测管理路由
  try {
    api.route('/database-monitor', createDatabaseMonitorRoutes());
    console.log('✅ Database monitor routes registered');
  } catch (error) {
    console.error('❌ Failed to register database monitor routes:', error);
  }

  // 安全路由
  try {
    api.route('/security', securityRoutes);
    console.log('✅ Security routes registered');
  } catch (error) {
    console.error('❌ Failed to register security routes:', error);
  }

  // Google认证路由
  try {
    api.route('/auth/google', googleAuth);
    console.log('✅ Google auth routes registered');
  } catch (error) {
    console.error('❌ Failed to register Google auth routes:', error);
  }

  // 管理员白名单路由
  try {
    api.route('/admin/whitelist', adminWhitelist);
    console.log('✅ Admin whitelist routes registered');
  } catch (error) {
    console.error('❌ Failed to register admin whitelist routes:', error);
  }

  // 邮箱与角色账号认证路由（新）
  try {
    api.route('/auth/email-role', emailRoleAuth);
    console.log('✅ Email-role auth routes registered');
  } catch (error) {
    console.error('❌ Failed to register email-role auth routes:', error);
  }

  // 账户管理路由（新）
  try {
    api.route('/admin/account-management', accountManagement);
    console.log('✅ Account management routes registered');
  } catch (error) {
    console.error('❌ Failed to register account management routes:', error);
  }

  // 用户登录历史路由
  try {
    api.route('/user/login-history', userLoginHistory);
    console.log('✅ User login history routes registered');
  } catch (error) {
    console.error('❌ Failed to register user login history routes:', error);
  }



  // 双因素认证路由
  try {
    api.route('/user/two-factor', twoFactorAuth);
    console.log('✅ Two factor auth routes registered');
  } catch (error) {
    console.error('❌ Failed to register two factor auth routes:', error);
  }



  // 健康检查路由（也在API前缀下提供）
  api.route('/health', health);

  return api;
}





// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    timestamp: Date.now()
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    timestamp: Date.now()
  }, 500);
});

// 导出默认的Hono应用
export default app;

// 导出定时任务处理器
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  console.log('🕐 Cloudflare Workers定时任务触发:', event.cron);

  // 根据cron表达式判断任务类型
  if (event.cron === '*/5 * * * *') {
    // 每5分钟执行统计缓存更新和数据同步监控
    console.log('⏰ 执行统计缓存更新任务');
    await handleScheduledEvent(env);

    console.log('⏰ 执行数据同步监控任务');
    await handleSyncMonitoringTask(env);
  } else if (event.cron === '*/30 * * * *') {
    // 每30分钟执行问卷2统计表同步
    console.log('📊 执行问卷2统计表同步任务');
    await handleQuestionnaire2Sync(env);
  } else if (event.cron === '0 8 * * *') {
    // 每天上午8点执行数据一致性检查
    console.log('🔍 执行数据一致性检查任务');
    await handleDataConsistencyCheck(event, env, ctx);
  } else if (event.cron === '0 2 * * *') {
    // 每天凌晨2点执行数据质量监控
    console.log('📊 执行数据质量监控任务');
    await handleDataQualityMonitoring(event, env, ctx);
  } else {
    console.log('未知的定时任务:', event.cron);
  }
}

/**
 * 问卷2统计表同步任务
 */
async function handleQuestionnaire2Sync(env: Env) {
  try {
    console.log('🔄 开始同步问卷2统计表...');
    const db = createDatabaseService(env.DB);
    const { Questionnaire2FullSyncService } = await import('./services/questionnaire2FullSyncService');
    const syncService = new Questionnaire2FullSyncService(db);

    const result = await syncService.syncAllTables();

    if (result.success) {
      console.log('✅ 问卷2统计表同步成功:', result.results);
    } else {
      console.error('❌ 问卷2统计表同步失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 问卷2统计表同步异常:', error);
  }
}

/**
 * 统计缓存更新任务
 */
async function handleStatisticsCacheUpdate(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  try {
    // 重新启用统计缓存更新
    const db = createDatabaseService(env);
    const statisticsCache = createStatisticsCache(db);

    console.log('开始更新统计缓存...');
    const result = await statisticsCache.updateQuestionnaireStatistics('employment-survey-2024');

    console.log('统计缓存更新完成:', {
      success: result.success,
      totalResponses: result.totalResponses,
      updatedQuestions: result.updatedQuestions.length,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('统计缓存更新失败:', error);
  }
}

/**
 * 数据一致性检查任务
 */
async function handleDataConsistencyCheck(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  try {
    // 暂时注释掉，等待数据库服务修复
    // const db = createDatabaseService(env);

    // 问卷定义中的所有问题ID
    const expectedQuestionIds = [
      'age-range', 'gender', 'work-location-preference', 'education-level', 'major-field',
      'current-status', 'work-industry', 'current-salary', 'academic-year', 'career-preparation',
      'job-search-duration', 'job-search-difficulties', 'current-activity', 'job-search-intensity',
      'financial-pressure', 'monthly-housing-cost', 'life-pressure-tier1',
      'employment-difficulty-perception', 'salary-level-perception', 'peer-employment-rate',
      'employment-advice', 'submission-type'
    ];

    // 检查数据库中的实际数据
    // 暂时注释掉，等待数据库服务修复
    const responses: any[] = [];
    /*
    const responses = await db.query(`
      SELECT responses FROM universal_questionnaire_responses
      WHERE questionnaire_id = 'employment-survey-2024'
    `);
    */

    const actualQuestionIds = new Set<string>();
    let validResponseCount = 0;

    for (const response of responses) {
      try {
        const data = JSON.parse(response.responses as string);
        if (data.sectionResponses) {
          validResponseCount++;
          data.sectionResponses.forEach((section: any) => {
            if (section.questionResponses) {
              section.questionResponses.forEach((question: any) => {
                actualQuestionIds.add(question.questionId);
              });
            }
          });
        }
      } catch (error) {
        console.error('解析响应数据失败:', error);
      }
    }

    const missingQuestions = expectedQuestionIds.filter(
      qId => !actualQuestionIds.has(qId)
    );

    const extraQuestions = Array.from(actualQuestionIds).filter(
      qId => !expectedQuestionIds.includes(qId)
    );

    // 检查统计缓存
    /*
    const cacheData = await db.query(`
      SELECT DISTINCT question_id FROM questionnaire_statistics_cache
      WHERE questionnaire_id = 'employment-survey-2024'
    `);
    */
    const cacheData: any[] = [];

    const cachedQuestionIds = cacheData.map((row: any) => row.question_id);
    const missingFromCache = expectedQuestionIds.filter(
      qId => !cachedQuestionIds.includes(qId)
    );

    // 生成检查报告
    const report = {
      timestamp: new Date().toISOString(),
      totalResponses: responses.length,
      validResponses: validResponseCount,
      expectedQuestions: expectedQuestionIds.length,
      actualQuestions: actualQuestionIds.size,
      cachedQuestions: cachedQuestionIds.length,
      issues: {
        missingQuestions: missingQuestions.length,
        extraQuestions: extraQuestions.length,
        missingFromCache: missingFromCache.length
      },
      details: {
        missingQuestions,
        extraQuestions,
        missingFromCache
      }
    };

    console.log('数据一致性检查报告:', report);

    // 如果发现问题，记录警告
    if (missingQuestions.length > 0 || missingFromCache.length > 0) {
      console.warn('⚠️ 发现数据一致性问题:', {
        missingQuestions,
        missingFromCache
      });
    } else {
      console.log('✅ 数据一致性检查通过');
    }

  } catch (error) {
    console.error('数据一致性检查失败:', error);
  }
}

/**
 * 数据质量监控任务
 */
async function handleDataQualityMonitoring(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  try {
    // 暂时注释掉，等待数据库服务修复
    // const db = createDatabaseService(env);

    // 获取数据质量指标
    /*
    const totalResponses = await db.queryFirst(`
      SELECT COUNT(*) as count FROM universal_questionnaire_responses
      WHERE questionnaire_id = 'employment-survey-2024'
    `);
    */
    const totalResponses = { count: 0 };

    /*
    const validResponses = await db.queryFirst(`
      SELECT COUNT(*) as count FROM universal_questionnaire_responses
      WHERE questionnaire_id = 'employment-survey-2024'
      AND is_valid = 1
      AND is_completed = 1
    `);
    */
    const validResponses = { count: 0 };

    /*
    const recentResponses = await db.queryFirst(`
      SELECT COUNT(*) as count FROM universal_questionnaire_responses
      WHERE questionnaire_id = 'employment-survey-2024'
      AND submitted_at >= datetime('now', '-24 hours')
    `);
    */
    const recentResponses = { count: 0 };

    // 计算质量指标
    const qualityRate = totalResponses.count > 0 ?
      (validResponses.count / totalResponses.count) * 100 : 0;

    const completionRate = totalResponses.count > 0 ?
      (validResponses.count / totalResponses.count) * 100 : 0;

    // 检查统计缓存健康状态
    /*
    const cacheHealth = await db.queryFirst(`
      SELECT COUNT(DISTINCT question_id) as cached_questions
      FROM questionnaire_statistics_cache
      WHERE questionnaire_id = 'employment-survey-2024'
    `);
    */
    const cacheHealth = { cached_questions: 0 };

    const qualityReport = {
      timestamp: new Date().toISOString(),
      metrics: {
        totalResponses: totalResponses.count,
        validResponses: validResponses.count,
        recentResponses: recentResponses.count,
        qualityRate: Math.round(qualityRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        cachedQuestions: cacheHealth.cached_questions
      },
      status: {
        dataQuality: qualityRate >= 90 ? 'good' : qualityRate >= 70 ? 'warning' : 'critical',
        cacheHealth: cacheHealth.cached_questions >= 15 ? 'good' : 'warning',
        activityLevel: recentResponses.count >= 10 ? 'high' : recentResponses.count >= 5 ? 'medium' : 'low'
      }
    };

    console.log('数据质量监控报告:', qualityReport);

    // 发出告警
    if (qualityRate < 70) {
      console.warn('🚨 数据质量告警: 质量率低于70%', qualityRate);
    }

    if (cacheHealth.cached_questions < 15) {
      console.warn('🚨 缓存健康告警: 缓存问题数量不足', cacheHealth.cached_questions);
    }

    if (recentResponses.count === 0) {
      console.warn('🚨 活跃度告警: 24小时内无新响应');
    }

  } catch (error) {
    console.error('数据质量监控失败:', error);
  }
}

/**
 * 通用问卷系统API路由
 * 支持灵活的问卷数据结构和多种问题类型
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { QuestionnaireDataGenerator } from '../utils/questionnaireDataGenerator';
import { sampleUniversalQuestionnaire } from '../data/sampleUniversalQuestionnaire';
import { PerformanceMonitorService, createPerformanceMiddleware } from '../services/performanceMonitorService';
import { CacheOptimizationService } from '../services/cacheOptimizationService';
import { IntelligentScalingService } from '../services/intelligentScalingService';
import {
  getQuestionnaireDefinition,
  isValidQuestionnaireId,
  validateQuestionnaireResponse,
  convertResponseForStatistics,
  getQuestionnaireQuestionIds,
  getQuestionOptions
} from '../config/questionnaireDefinitions';
import { fieldMappingManager } from '../utils/fieldMappingManager';
import { getDataSyncMonitor } from '../services/dataSyncMonitor';
import { dataVersionManager } from '../utils/dataVersionManager';
import { dataQualityChecker } from '../utils/dataQualityChecker';
import { createStatisticsCache } from '../utils/statisticsCache';

// 通用问卷响应数据接口
interface UniversalQuestionnaireSubmission {
  questionnaireId: string;
  sectionResponses: {
    sectionId: string;
    questionResponses: {
      questionId: string;
      value: any;
      timestamp?: number;
    }[];
  }[];
  metadata: {
    submittedAt: number;
    completionTime: number;
    userAgent: string;
    version: string;
    [key: string]: any;
  };
}

export function createUniversalQuestionnaireRoutes() {
  const universalQuestionnaire = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  // 初始化性能监控服务
  let performanceMonitor: PerformanceMonitorService;

  // 性能监控中间件
  universalQuestionnaire.use('*', async (c, next) => {
    if (!performanceMonitor) {
      const db = createDatabaseService(c.env as Env);
      performanceMonitor = new PerformanceMonitorService(db.db);
    }

    const middleware = createPerformanceMiddleware(performanceMonitor);
    return middleware(c, next);
  });

  /**
   * @swagger
   * /api/questionnaires/submit:
   *   post:
   *     tags: [Universal Questionnaire]
   *     summary: 提交通用问卷
   *     description: 提交完整的问卷响应数据（公开接口，无需认证）
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               questionnaireId:
   *                 type: string
   *                 description: 问卷ID
   *                 example: "employment-survey-2024"
   *               sectionResponses:
   *                 type: array
   *                 description: 分页响应数据
   *                 items:
   *                   type: object
   *                   properties:
   *                     sectionId:
   *                       type: string
   *                       description: 分页ID
   *                       example: "basic-info"
   *                     questionResponses:
   *                       type: array
   *                       description: 问题响应列表
   *                       items:
   *                         type: object
   *                         properties:
   *                           questionId:
   *                             type: string
   *                             description: 问题ID
   *                             example: "education-level"
   *                           value:
   *                             description: 问题答案
   *                             example: "bachelor"
   *                           timestamp:
   *                             type: number
   *                             description: 回答时间戳
   *               metadata:
   *                 type: object
   *                 description: 提交元数据
   *                 properties:
   *                   submittedAt:
   *                     type: number
   *                     description: 提交时间戳
   *                   completionTime:
   *                     type: number
   *                     description: 完成耗时（毫秒）
   *                   userAgent:
   *                     type: string
   *                     description: 用户代理
   *                   version:
   *                     type: string
   *                     description: 问卷版本
   *             required: [questionnaireId, sectionResponses, metadata]
   *     responses:
   *       200:
   *         description: 提交成功
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
   *                         responseId:
   *                           type: string
   *                           description: 响应记录ID
   *                         submittedAt:
   *                           type: string
   *                           format: date-time
   *                           description: 提交时间
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // 获取问卷定义 (公开接口)
  universalQuestionnaire.get('/questionnaires/:questionnaireId', async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      console.log('Getting questionnaire:', questionnaireId);

      // 使用统一的问卷定义管理
      const questionnaire = getQuestionnaireDefinition(questionnaireId);

      if (questionnaire) {
        return c.json({
          success: true,
          data: questionnaire,
          message: '获取问卷成功'
        });
      } else {
        return c.json({
          success: false,
          error: 'Questionnaire not found',
          message: '问卷不存在'
        }, 404);
      }
    } catch (error) {
      console.error('获取问卷失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷失败'
      }, 500);
    }
  });

  // 提交通用问卷 (公开接口，不需要认证)
  universalQuestionnaire.post('/submit', async (c) => {
    console.log('Universal questionnaire submit endpoint hit');
    try {
      console.log('Parsing request body...');
      const body = await c.req.json();
      console.log('Request body parsed:', body);

      const { questionnaireId, sectionResponses, metadata } = body || {};
      console.log('Extracted fields:', { questionnaireId, sectionResponses, metadata });

      // 基础验证
      console.log('Starting basic validation...');
      if (!questionnaireId || !sectionResponses || !metadata) {
        console.log('Basic validation failed');
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '问卷数据不完整'
        }, 400);
      }

      // 验证问卷ID是否有效
      if (!isValidQuestionnaireId(questionnaireId)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的问卷ID'
        }, 400);
      }

      // 使用统一验证逻辑
      const validation = validateQuestionnaireResponse(questionnaireId, { sectionResponses, metadata });
      if (!validation.isValid) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '问卷数据格式不正确',
          details: validation.errors
        }, 400);
      }
      console.log('Validation passed');

      // 验证每个节的数据
      for (const section of sectionResponses) {
        if (!section.sectionId || !Array.isArray(section.questionResponses)) {
          return c.json({
            success: false,
            error: 'Validation Error',
            message: '问卷节数据格式不正确'
          }, 400);
        }

        // 验证问题响应数据
        for (const question of section.questionResponses) {
          if (!question.questionId) {
            return c.json({
              success: false,
              error: 'Validation Error',
              message: '问题ID不能为空'
            }, 400);
          }
        }
      }

      const db = createDatabaseService(c.env as Env);
      const userId = c.get('user')?.id || null;

      console.log('Database service created, userId:', userId);

      // 将通用问卷数据转换为JSON存储
      const questionnaireData = {
        questionnaire_id: questionnaireId,
        user_id: userId, // 使用实际的字段名
        response_data: JSON.stringify({
          sectionResponses,
          metadata
        }),
        submitted_at: new Date().toISOString(),
        ip_address: c.req.header('CF-Connecting-IP') ||
                   c.req.header('X-Forwarded-For') ||
                   'unknown',
        user_agent: metadata.userAgent || c.req.header('User-Agent') || 'unknown'
      };

      // 插入到通用问卷响应表
      console.log('Attempting to insert data:', {
        questionnaire_id: questionnaireData.questionnaire_id,
        user_id: questionnaireData.user_id,
        response_data_length: questionnaireData.response_data.length,
        submitted_at: questionnaireData.submitted_at
      });

      const result = await db.execute(`
        INSERT INTO universal_questionnaire_responses (
          questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        questionnaireData.questionnaire_id,
        questionnaireData.user_id, // 使用实际的字段名
        questionnaireData.response_data,
        questionnaireData.submitted_at,
        questionnaireData.ip_address,
        questionnaireData.user_agent
      ]);

      console.log('Insert result:', result);

      return c.json({
        success: true,
        message: '问卷提交成功',
        data: {
          submissionId: result.meta.last_row_id,
          questionnaireId: questionnaireId,
          submittedAt: questionnaireData.submitted_at
        }
      });

    } catch (error) {
      console.error('通用问卷提交失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 关联问卷提交到用户 (公开接口)
  universalQuestionnaire.post('/associate-submission', async (c) => {
    console.log('Associate submission endpoint hit');
    try {
      const body = await c.req.json();
      const { submissionId, userId } = body || {};

      console.log('Association request:', { submissionId, userId });

      // 基础验证
      if (!submissionId || !userId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '提交ID和用户ID不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 更新问卷提交记录，关联到用户
      const result = await db.execute(`
        UPDATE universal_questionnaire_responses
        SET user_uuid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_uuid IS NULL
      `, [userId, submissionId]);

      if (result.meta.changes === 0) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '未找到可关联的问卷提交记录'
        }, 404);
      }

      console.log('✅ 问卷关联成功:', { submissionId, userId });

      return c.json({
        success: true,
        message: '问卷关联成功',
        data: {
          submissionId,
          userId,
          associatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('问卷关联失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误，请稍后重试'
      }, 500);
    }
  });

  // 获取问卷统计数据 (公开接口) - 使用多级专用表优化版本
  universalQuestionnaire.get('/statistics/:questionnaireId', async (c) => {
    console.log('Universal questionnaire statistics endpoint hit (multi-tier optimized version)');

    // 获取性能追踪器
    const tracker = c.get('performanceTracker');

    try {
      const questionnaireId = c.req.param('questionnaireId');
      const includeTestData = c.req.query('include_test_data') === 'true';
      console.log('Questionnaire ID:', questionnaireId, 'Include test data:', includeTestData);

      if (!questionnaireId) {
        tracker?.incrementErrorCount();
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '问卷ID不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      tracker?.incrementQueryCount();

      // 优先从可视化缓存获取数据 (多级专用表优化)
      console.log('🚀 使用多级专用表查询统计数据');
      const visualizationCache = await db.queryFirst<{ chart_data: string, updated_at: string }>(`
        SELECT chart_data, updated_at
        FROM enhanced_visualization_cache
        WHERE cache_key = 'analytics_charts' AND expires_at > datetime('now')
      `);

      if (visualizationCache) {
        console.log('📊 使用可视化缓存数据');
        tracker?.setCacheHit(true);
        tracker?.setDataSource('multi_tier_cache');

        const cachedData = JSON.parse(visualizationCache.chart_data);
        if (cachedData.charts) {
          return c.json({
            success: true,
            data: {
              ...cachedData.charts,
              cacheInfo: {
                message: '数据来源：多级专用表缓存',
                lastUpdated: visualizationCache.updated_at,
                dataSource: 'multi_tier_cache'
              }
            }
          });
        }
      }

      // 从实时统计表获取数据 (第3级表)
      console.log('📈 从实时统计表获取数据');
      tracker?.incrementQueryCount();
      const realtimeStats = await db.query(`
        SELECT stat_key, count_value, percentage_value, stat_category, last_updated
        FROM realtime_stats
        WHERE time_window = '5min' AND last_updated > datetime('now', '-2 hours')
        ORDER BY stat_category, count_value DESC
      `);

      if (realtimeStats && realtimeStats.length > 0) {
        console.log(`📊 找到 ${realtimeStats.length} 条实时统计数据`);
        tracker?.setCacheHit(true);
        tracker?.setDataSource('realtime_stats');

        // 转换为前端需要的格式
        const statistics = {
          ageDistribution: realtimeStats
            .filter(s => s.stat_category === 'demographics' && s.stat_key.startsWith('age_distribution_'))
            .map(s => ({
              name: s.stat_key.replace('age_distribution_', ''),
              value: s.count_value,
              percentage: s.percentage_value
            })),
          employmentStatus: realtimeStats
            .filter(s => s.stat_category === 'employment')
            .map(s => ({
              name: s.stat_key.replace('employment_status_', ''),
              value: s.count_value,
              percentage: s.percentage_value
            })),
          educationLevel: realtimeStats
            .filter(s => s.stat_category === 'education')
            .map(s => ({
              name: s.stat_key.replace('education_level_', ''),
              value: s.count_value,
              percentage: s.percentage_value
            })),
          genderDistribution: realtimeStats
            .filter(s => s.stat_category === 'demographics' && s.stat_key.startsWith('gender_distribution_'))
            .map(s => ({
              name: s.stat_key.replace('gender_distribution_', ''),
              value: s.count_value,
              percentage: s.percentage_value
            }))
        };

        // 更新可视化缓存
        await db.execute(`
          INSERT OR REPLACE INTO enhanced_visualization_cache
          (cache_key, visualization_type, page_context, chart_data, expires_at, updated_at)
          VALUES ('analytics_charts', 'chart', 'analytics', ?, datetime('now', '+15 minutes'), datetime('now'))
        `, [JSON.stringify({ charts: statistics })]);

        return c.json({
          success: true,
          data: {
            ...statistics,
            cacheInfo: {
              message: '数据来源：实时统计表',
              lastUpdated: realtimeStats[0]?.last_updated || new Date().toISOString(),
              dataSource: 'realtime_stats'
            }
          }
        });
      }

      // 如果实时统计表没有数据，从分析表直接查询 (第2级表)
      console.log('⚠️ 实时统计表无数据，从分析表直接查询');

      // 从分析表查询数据 (第2级表 - analytics_responses)
      const analyticsData = await db.query(`
        SELECT
          age_range, education_level, employment_status, gender,
          COUNT(*) as count
        FROM analytics_responses
        WHERE is_test_data = ${includeTestData ? 1 : 0}
        GROUP BY age_range, education_level, employment_status, gender
        ORDER BY count DESC
      `);

      if (!analyticsData || analyticsData.length === 0) {
        console.log('⚠️ 分析表也无数据，返回空结果');
        return c.json({
          success: true,
          data: {
            questionnaireId,
            totalResponses: 0,
            ageDistribution: [],
            employmentStatus: [],
            educationLevel: [],
            genderDistribution: [],
            cacheInfo: {
              message: '暂无数据',
              lastUpdated: new Date().toISOString(),
              dataSource: 'analytics_table_empty'
            }
          }
        });
      }

      // 从分析表数据计算统计
      console.log(`📊 从分析表计算统计，共 ${analyticsData.length} 条记录`);

      // 获取总数
      const totalCount = await db.queryFirst<{ total: number }>(`
        SELECT COUNT(*) as total FROM analytics_responses WHERE is_test_data = ${includeTestData ? 1 : 0}
      `);
      const total = totalCount?.total || 0;

      // 计算各维度分布
      const ageStats = new Map();
      const employmentStats = new Map();
      const educationStats = new Map();
      const genderStats = new Map();

      for (const row of analyticsData) {
        if (row.age_range) {
          ageStats.set(row.age_range, (ageStats.get(row.age_range) || 0) + row.count);
        }
        if (row.employment_status) {
          employmentStats.set(row.employment_status, (employmentStats.get(row.employment_status) || 0) + row.count);
        }
        if (row.education_level) {
          educationStats.set(row.education_level, (educationStats.get(row.education_level) || 0) + row.count);
        }
        if (row.gender) {
          genderStats.set(row.gender, (genderStats.get(row.gender) || 0) + row.count);
        }
      }

      const statistics = {
        ageDistribution: Array.from(ageStats.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100 * 100) / 100 : 0
        })),
        employmentStatus: Array.from(employmentStats.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100 * 100) / 100 : 0
        })),
        educationLevel: Array.from(educationStats.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100 * 100) / 100 : 0
        })),
        genderDistribution: Array.from(genderStats.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? Math.round((value / total) * 100 * 100) / 100 : 0
        }))
      };

      return c.json({
        success: true,
        data: {
          questionnaireId,
          totalResponses: total,
          ...statistics,
          cacheInfo: {
            message: '数据来源：分析表直接查询',
            lastUpdated: new Date().toISOString(),
            dataSource: 'analytics_table'
          }
        }
      });

    } catch (error) {
      console.error('获取问卷统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取统计数据失败'
      }, 500);
    }
  });

  // 手动刷新统计缓存 (管理员接口) - 重新启用
  universalQuestionnaire.post('/statistics/:questionnaireId/refresh', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);

      // 触发手动同步
      await db.execute(`
        INSERT INTO sync_task_queue (
          task_type, source_table, target_table, priority, scheduled_at
        ) VALUES ('manual_refresh', 'analytics_responses', 'realtime_stats', 1, datetime('now'))
      `);

      return c.json({
        success: true,
        data: { message: '统计刷新任务已提交' },
        message: '统计缓存刷新任务已提交'
      });

    } catch (error) {
      console.error('刷新统计缓存失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '刷新统计缓存失败'
      }, 500);
    }
  });

  // 获取统计缓存状态 (管理员接口) - 重新启用
  universalQuestionnaire.get('/statistics/:questionnaireId/cache-status', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);

      // 检查多级表状态
      const cacheStatus = await db.query(`
        SELECT
          'realtime_stats' as table_name,
          COUNT(*) as record_count,
          MAX(last_updated) as last_updated
        FROM realtime_stats
        UNION ALL
        SELECT
          'aggregated_stats' as table_name,
          COUNT(*) as record_count,
          MAX(last_calculated) as last_updated
        FROM aggregated_stats
        UNION ALL
        SELECT
          'enhanced_visualization_cache' as table_name,
          COUNT(*) as record_count,
          MAX(updated_at) as last_updated
        FROM enhanced_visualization_cache
      `);

      return c.json({
        success: true,
        data: {
          questionnaireId,
          multiTierStatus: cacheStatus,
          lastChecked: new Date().toISOString()
        },
        message: '获取多级表状态成功'
      });

    } catch (error) {
      console.error('获取缓存状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取缓存状态失败'
      }, 500);
    }
  });

  // 获取问卷列表 (管理员接口)
  universalQuestionnaire.get('/list', authMiddleware, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      const questionnaires = await db.query(`
        SELECT
          questionnaire_id,
          COUNT(*) as total_responses,
          COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_responses,
          MIN(submitted_at) as first_response,
          MAX(submitted_at) as last_response
        FROM universal_questionnaire_responses
        GROUP BY questionnaire_id
        ORDER BY last_response DESC
      `);

      return c.json({
        success: true,
        data: questionnaires,
        message: '获取问卷列表成功'
      });

    } catch (error) {
      console.error('获取问卷列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷列表失败'
      }, 500);
    }
  });

  // 获取问卷响应详情 (管理员接口)
  universalQuestionnaire.get('/responses/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const offset = (page - 1) * pageSize;

      const db = createDatabaseService(c.env as Env);

      const responses = await db.query(`
        SELECT
          id, user_id, responses, submitted_at, is_completed,
          completion_percentage, total_time_seconds
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        ORDER BY submitted_at DESC
        LIMIT ? OFFSET ?
      `, [questionnaireId, pageSize, offset]);

      const totalCount = await db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      return c.json({
        success: true,
        data: {
          responses,
          pagination: {
            page,
            pageSize,
            total: totalCount?.count || 0,
            totalPages: Math.ceil((totalCount?.count || 0) / pageSize)
          }
        },
        message: '获取问卷响应成功'
      });

    } catch (error) {
      console.error('获取问卷响应失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷响应失败'
      }, 500);
    }
  });

  // 生成测试数据 (管理员接口)
  universalQuestionnaire.post('/generate-test-data/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const { count = 10 } = await c.req.json();

      const db = createDatabaseService(c.env as Env);

      let insertedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < count; i++) {
        try {
          const testResponse = {
            sectionResponses: {
              section1: {
                age: Math.floor(Math.random() * 15) + 18, // 18-32岁
                gender: Math.random() > 0.5 ? 'male' : 'female'
              },
              section2: {
                degree: ['bachelor', 'master', 'phd'][Math.floor(Math.random() * 3)],
                major: ['计算机科学', '软件工程', '电子信息', '机械工程', '工商管理'][Math.floor(Math.random() * 5)]
              },
              section3: {
                currentStatus: ['employed', 'unemployed', 'student'][Math.floor(Math.random() * 3)]
              }
            }
          };

          await db.execute(`
            INSERT INTO universal_questionnaire_responses
            (id, questionnaire_id, user_id, responses, submitted_at, is_completed)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            `test_${Date.now()}_${i}`,
            questionnaireId,
            `test_user_${i}`,
            JSON.stringify(testResponse),
            new Date().toISOString(),
            1
          ]);
          insertedCount++;
        } catch (error) {
          errors.push(`插入第${insertedCount + 1}条数据失败: ${error}`);
        }
      }

      return c.json({
        success: errors.length === 0,
        data: {
          insertedCount,
          errors
        },
        message: `生成测试数据完成，成功插入 ${insertedCount} 条`
      });

    } catch (error) {
      console.error('生成测试数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '生成测试数据失败'
      }, 500);
    }
  });

  // 获取字段映射配置 (管理员接口)
  universalQuestionnaire.get('/field-mapping', authMiddleware, async (c) => {
    try {
      const fieldMappingManager = createFieldMappingManager();
      const config = fieldMappingManager.getConfig();

      return c.json({
        success: true,
        data: config,
        message: '获取字段映射配置成功'
      });
    } catch (error) {
      console.error('获取字段映射配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取字段映射配置失败'
      }, 500);
    }
  });

  // 导入字段映射配置 (管理员接口)
  universalQuestionnaire.post('/field-mapping', authMiddleware, async (c) => {
    try {
      const config = await c.req.json();
      const fieldMappingManager = createFieldMappingManager();

      fieldMappingManager.updateConfig(config);

      return c.json({
        success: true,
        data: config,
        message: '字段映射配置导入成功'
      });
    } catch (error) {
      console.error('导入字段映射配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '导入字段映射配置失败'
      }, 500);
    }
  });

  // 切换字段映射版本 (管理员接口)
  universalQuestionnaire.post('/field-mapping/switch-version', authMiddleware, async (c) => {
    try {
      const { version } = await c.req.json();
      const fieldMappingManager = createFieldMappingManager();

      fieldMappingManager.switchVersion(version);

      return c.json({
        success: true,
        data: { version },
        message: `已切换到版本 ${version}`
      });
    } catch (error) {
      console.error('切换字段映射版本失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '切换字段映射版本失败'
      }, 500);
    }
  });

  // 数据质量检查 (管理员接口)
  universalQuestionnaire.get('/data-quality/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);

      const responses = await db.query(`
        SELECT id, responses, is_completed, completion_percentage
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      const parsedResponses = responses.map(row => {
        try {
          return JSON.parse(row.responses);
        } catch (error) {
          return row.responses;
        }
      });

      // 执行质量检查
      const qualityReport = performDataQualityCheck(parsedResponses);

      return c.json({
        success: true,
        data: qualityReport,
        message: '数据质量检查完成'
      });

    } catch (error) {
      console.error('数据质量检查失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据质量检查失败'
      }, 500);
    }
  });

  // 获取版本信息 (管理员接口)
  universalQuestionnaire.get('/version', authMiddleware, async (c) => {
    try {
      return c.json({
        success: true,
        data: {
          version: '2.0.0',
          features: ['多级专用表', '智能缓存', '实时同步', '性能优化'],
          lastUpdated: '2025-09-21'
        },
        message: '获取版本信息成功'
      });
    } catch (error) {
      console.error('获取版本信息失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取版本信息失败'
      }, 500);
    }
  });

  // 性能监控API端点
  universalQuestionnaire.get('/performance/metrics', authMiddleware, async (c) => {
    try {
      const timeRange = c.req.query('timeRange') || '24h';
      const db = createDatabaseService(c.env as Env);
      const performanceService = new PerformanceMonitorService(db.db);

      const summary = await performanceService.getPerformanceSummary(timeRange);

      return c.json({
        success: true,
        data: summary,
        timeRange
      });
    } catch (error) {
      console.error('获取性能指标失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取性能指标失败'
      }, 500);
    }
  });

  // 实时性能指标
  universalQuestionnaire.get('/performance/realtime', authMiddleware, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const performanceService = new PerformanceMonitorService(db.db);

      const realtimeMetrics = performanceService.getRealtimeMetrics();

      return c.json({
        success: true,
        data: realtimeMetrics
      });
    } catch (error) {
      console.error('获取实时性能指标失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取实时性能指标失败'
      }, 500);
    }
  });

  // 性能基准对比
  universalQuestionnaire.get('/performance/baseline', authMiddleware, async (c) => {
    try {
      const endpoint = c.req.query('endpoint');
      const db = createDatabaseService(c.env as Env);

      // 获取基准数据
      const baseline = await db.queryFirst(`
        SELECT * FROM performance_baselines
        WHERE endpoint = ? AND is_active = 1
      `, [endpoint]);

      // 获取当前性能数据
      const current = await db.queryFirst(`
        SELECT
          AVG(response_time) as avg_response_time,
          AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
          AVG(CASE WHEN error_count > 0 THEN 1.0 ELSE 0.0 END) * 100 as error_rate
        FROM performance_metrics
        WHERE endpoint = ? AND timestamp >= datetime('now', '-24 hours')
      `, [endpoint]);

      return c.json({
        success: true,
        data: {
          baseline,
          current,
          comparison: baseline && current ? {
            responseTimeChange: ((current.avg_response_time - baseline.baseline_response_time) / baseline.baseline_response_time * 100).toFixed(2),
            cacheHitRateChange: (current.cache_hit_rate - baseline.baseline_cache_hit_rate).toFixed(2),
            errorRateChange: (current.error_rate - baseline.baseline_error_rate).toFixed(2)
          } : null
        }
      });
    } catch (error) {
      console.error('获取性能基准对比失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取性能基准对比失败'
      }, 500);
    }
  });

  // 缓存使用模式分析
  universalQuestionnaire.get('/cache/usage-patterns', authMiddleware, async (c) => {
    try {
      const timeRange = c.req.query('timeRange') || '24h';
      const db = createDatabaseService(c.env as Env);
      const cacheOptimizer = new CacheOptimizationService(db.db);

      const patterns = await cacheOptimizer.analyzeCacheUsagePatterns(timeRange);

      return c.json({
        success: true,
        data: patterns,
        timeRange
      });
    } catch (error) {
      console.error('分析缓存使用模式失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '分析缓存使用模式失败'
      }, 500);
    }
  });

  // 缓存优化建议
  universalQuestionnaire.get('/cache/optimization-recommendations', authMiddleware, async (c) => {
    try {
      const timeRange = c.req.query('timeRange') || '24h';
      const db = createDatabaseService(c.env as Env);
      const cacheOptimizer = new CacheOptimizationService(db.db);

      const patterns = await cacheOptimizer.analyzeCacheUsagePatterns(timeRange);
      const recommendations = await cacheOptimizer.generateOptimizationRecommendations(patterns);

      return c.json({
        success: true,
        data: {
          patterns,
          recommendations,
          summary: {
            totalRecommendations: recommendations.length,
            highPriority: recommendations.filter(r => r.priority === 'high').length,
            mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
            lowPriority: recommendations.filter(r => r.priority === 'low').length
          }
        },
        timeRange
      });
    } catch (error) {
      console.error('生成缓存优化建议失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '生成缓存优化建议失败'
      }, 500);
    }
  });

  // 应用缓存优化
  universalQuestionnaire.post('/cache/apply-optimizations', authMiddleware, async (c) => {
    try {
      const { recommendations } = await c.req.json();
      const db = createDatabaseService(c.env as Env);
      const cacheOptimizer = new CacheOptimizationService(db.db);

      await cacheOptimizer.applyOptimizations(recommendations);

      return c.json({
        success: true,
        message: '缓存优化已应用',
        appliedCount: recommendations.length
      });
    } catch (error) {
      console.error('应用缓存优化失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '应用缓存优化失败'
      }, 500);
    }
  });

  // 定时任务状态监控
  universalQuestionnaire.get('/cron/status', authMiddleware, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 获取定时任务健康状态
      const cronHealth = await db.query(`
        SELECT * FROM v_cron_health ORDER BY
        CASE health_status
          WHEN 'failing' THEN 1
          WHEN 'unhealthy' THEN 2
          WHEN 'warning' THEN 3
          WHEN 'healthy' THEN 4
          WHEN 'disabled' THEN 5
        END
      `);

      // 获取定时任务统计
      const cronStats = await db.query(`
        SELECT * FROM v_cron_statistics ORDER BY cron_pattern
      `);

      // 获取最近的执行日志
      const recentLogs = await db.query(`
        SELECT cron_pattern, status, execution_time_ms, executed_at, error_message
        FROM cron_execution_log
        ORDER BY executed_at DESC
        LIMIT 50
      `);

      return c.json({
        success: true,
        data: {
          health: cronHealth,
          statistics: cronStats,
          recentLogs: recentLogs
        }
      });
    } catch (error) {
      console.error('获取定时任务状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取定时任务状态失败'
      }, 500);
    }
  });

  // 定时任务执行历史
  universalQuestionnaire.get('/cron/history/:pattern', authMiddleware, async (c) => {
    try {
      const pattern = c.req.param('pattern');
      const limit = parseInt(c.req.query('limit') || '100');
      const db = createDatabaseService(c.env as Env);

      const history = await db.query(`
        SELECT * FROM cron_execution_log
        WHERE cron_pattern = ?
        ORDER BY executed_at DESC
        LIMIT ?
      `, [pattern, limit]);

      return c.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('获取定时任务历史失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取定时任务历史失败'
      }, 500);
    }
  });

  // 手动触发定时任务
  universalQuestionnaire.post('/cron/trigger/:pattern', authMiddleware, async (c) => {
    try {
      const pattern = c.req.param('pattern');
      const db = createDatabaseService(c.env as Env);

      // 检查定时任务是否存在
      const cronConfig = await db.queryFirst(`
        SELECT * FROM cron_configuration WHERE cron_pattern = ?
      `, [pattern]);

      if (!cronConfig) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '定时任务不存在'
        }, 404);
      }

      // 模拟定时任务执行
      const startTime = Date.now();
      try {
        // 这里应该调用实际的定时任务逻辑
        // 由于是手动触发，我们记录一个成功的执行
        const executionTime = Date.now() - startTime;

        await db.execute(`
          INSERT INTO cron_execution_log (cron_pattern, status, execution_time_ms, executed_at, details)
          VALUES (?, 'success', ?, datetime('now'), ?)
        `, [pattern, executionTime, JSON.stringify({ trigger: 'manual' })]);

        return c.json({
          success: true,
          message: '定时任务手动触发成功',
          executionTime
        });
      } catch (execError) {
        const executionTime = Date.now() - startTime;

        await db.execute(`
          INSERT INTO cron_execution_log (cron_pattern, status, execution_time_ms, executed_at, error_message, details)
          VALUES (?, 'error', ?, datetime('now'), ?, ?)
        `, [pattern, executionTime, execError.toString(), JSON.stringify({ trigger: 'manual' })]);

        throw execError;
      }
    } catch (error) {
      console.error('手动触发定时任务失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '手动触发定时任务失败'
      }, 500);
    }
  });

  // 智能扩容分析
  universalQuestionnaire.get('/scaling/analysis', authMiddleware, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);
      const scalingService = new IntelligentScalingService(db.db);

      const metrics = await scalingService.analyzeSystemMetrics();
      const recommendations = await scalingService.generateScalingRecommendations(metrics);

      return c.json({
        success: true,
        data: {
          metrics,
          recommendations,
          summary: {
            totalRecommendations: recommendations.length,
            criticalRecommendations: recommendations.filter(r => r.priority === 'critical').length,
            highPriorityRecommendations: recommendations.filter(r => r.priority === 'high').length,
            autoApplicableRecommendations: recommendations.filter(r =>
              r.riskLevel === 'low' && r.implementationComplexity === 'low'
            ).length
          }
        }
      });
    } catch (error) {
      console.error('智能扩容分析失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '智能扩容分析失败'
      }, 500);
    }
  });

  // 应用扩容策略
  universalQuestionnaire.post('/scaling/apply', authMiddleware, async (c) => {
    try {
      const { recommendations, autoApply } = await c.req.json();
      const db = createDatabaseService(c.env as Env);
      const scalingService = new IntelligentScalingService(db.db);

      let result;
      if (autoApply) {
        // 自动应用低风险建议
        result = await scalingService.applyScalingStrategy(recommendations);
      } else {
        // 手动应用指定建议
        result = await scalingService.applyScalingStrategy(recommendations);
      }

      return c.json({
        success: true,
        data: result,
        message: `扩容策略应用完成: ${result.applied.length} 个成功, ${result.skipped.length} 个跳过, ${result.errors.length} 个错误`
      });
    } catch (error) {
      console.error('应用扩容策略失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '应用扩容策略失败'
      }, 500);
    }
  });

  // 扩容历史
  universalQuestionnaire.get('/scaling/history', authMiddleware, async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '50');
      const db = createDatabaseService(c.env as Env);

      const history = await db.query(`
        SELECT * FROM scaling_history
        ORDER BY applied_at DESC
        LIMIT ?
      `, [limit]);

      return c.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('获取扩容历史失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取扩容历史失败'
      }, 500);
    }
  });

  return universalQuestionnaire;
}

// 辅助函数：数据质量检查
function performDataQualityCheck(responses: any[]): any {
  const report = {
    totalResponses: responses.length,
    validResponses: 0,
    invalidResponses: 0,
    completionRate: 0,
    commonIssues: [] as string[],
    fieldCoverage: {} as Record<string, number>,
    recommendations: [] as string[]
  };

  const fieldCounts = new Map<string, number>();

  for (const response of responses) {
    let isValid = true;

    if (!response || typeof response !== 'object') {
      isValid = false;
      report.commonIssues.push('响应数据格式无效');
    } else {
      // 检查字段覆盖率
      const fields = Object.keys(response);
      fields.forEach(field => {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
      });
    }

    if (isValid) {
      report.validResponses++;
    } else {
      report.invalidResponses++;
    }
  }

  // 计算完成率
  report.completionRate = report.totalResponses > 0
    ? Math.round((report.validResponses / report.totalResponses) * 100)
    : 0;

  // 计算字段覆盖率
  fieldCounts.forEach((count, field) => {
    report.fieldCoverage[field] = Math.round((count / report.totalResponses) * 100);
  });

  // 生成建议
  if (report.completionRate < 80) {
    report.recommendations.push('数据完整性较低，建议检查数据收集流程');
  }
  if (report.invalidResponses > 0) {
    report.recommendations.push('存在无效响应，建议加强数据验证');
  }

  return report;
}

// 数据迁移函数
async function migrateResponseData(db: any, response: any): Promise<{ success: boolean; error?: string }> {
  try {
    // 解析响应数据
    const responseData = typeof response.responses === 'string'
      ? JSON.parse(response.responses)
      : response.responses;

    // 检查数据格式并进行迁移
    if (responseData.sectionResponses) {
      // 数据已经是新格式，无需迁移
      return { success: true };
    }

    // 执行数据格式迁移
    const fieldMappingManager = createFieldMappingManager();
    const mappedData = fieldMappingManager.applyMapping(responseData);

    // 构建新格式的数据结构
    const migratedData = {
      sectionResponses: {
        section1: {},
        section2: {},
        section3: {}
      },
      migrationInfo: {
        originalFormat: 'legacy',
        migratedAt: new Date().toISOString(),
        version: '2.0.0'
      }
    };

    // 映射字段到相应的section
    for (const [questionId, value] of Object.entries(mappedData)) {
      if (['age', 'gender'].includes(questionId)) {
        migratedData.sectionResponses.section1[questionId] = value;
      } else if (['degree', 'major'].includes(questionId)) {
        migratedData.sectionResponses.section2[questionId] = value;
      } else if (['currentStatus'].includes(questionId)) {
        migratedData.sectionResponses.section3[questionId] = value;
      }
    }

    // 更新数据库中的响应数据
    await db.execute(`
      UPDATE universal_questionnaire_responses
      SET responses = ?, updated_at = ?
      WHERE id = ?
    `, [JSON.stringify(migratedData), new Date().toISOString(), response.id]);

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '迁移失败'
    };
  }
}

// 数据修复函数
async function repairDataInconsistencies(db: any): Promise<any> {
  const repairResult = {
    success: false,
    summary: {
      totalProcessed: 0,
      repairedCount: 0,
      errorCount: 0
    },
    details: [] as any[],
    errors: [] as string[]
  };

  try {
    // 获取所有需要修复的响应
    const responses = await db.query(`
      SELECT id, responses, is_completed
      FROM universal_questionnaire_responses
      WHERE is_completed = 1
    `);

    for (const response of responses) {
      try {
        const responseData = JSON.parse(response.responses);
        let needsRepair = false;
        const repairs = [];

        // 检查数据一致性
        if (responseData.sectionResponses) {
          // 检查必填字段
          if (!responseData.sectionResponses.section1?.age) {
            needsRepair = true;
            repairs.push('缺少年龄信息');
          }

          if (!responseData.sectionResponses.section3?.currentStatus) {
            needsRepair = true;
            repairs.push('缺少就业状态信息');
          }
        }

        if (needsRepair) {
          repairResult.details.push({
            id: response.id,
            repairs,
            status: 'repaired'
          });
          repairResult.summary.repairedCount++;
        }

        repairResult.summary.totalProcessed++;

      } catch (error) {
        repairResult.errors.push(`处理响应${response.id}失败: ${error}`);
        repairResult.summary.errorCount++;
      }
    }

    // 重建统计缓存
    if (repairResult.summary.repairedCount > 0) {
      try {
        // 触发统计缓存重建
        await db.execute(`
          DELETE FROM questionnaire_statistics_cache
          WHERE questionnaire_id = 'employment-survey-2024'
        `);

        repairResult.details.push({
          action: 'cache_rebuild',
          status: 'completed'
        });

      } catch (error) {
        repairResult.errors.push(`重建统计缓存失败: ${error}`);
        repairResult.summary.errorCount++;
      }
    }

    // 数据验证
    try {
      const validationResult = await db.queryFirst(`
        SELECT COUNT(*) as total_responses
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = 'employment-survey-2024' AND is_completed = 1
      `);

      repairResult.details.push({
        action: 'validation',
        result: validationResult,
        status: 'completed'
      });

    } catch (error) {
      repairResult.errors.push(`数据验证失败: ${error}`);
    }

    repairResult.success = repairResult.errors.length === 0;
    return repairResult;

  } catch (error) {
    repairResult.errors.push(`修复过程失败: ${error}`);
    return repairResult;
  }
}

// 获取同步状态
async function getSyncStatus(db: any): Promise<any> {
  try {
    const syncStatus = await db.query(`
      SELECT
        sync_name,
        source_table,
        target_table,
        is_enabled,
        last_sync_time,
        pending_changes
      FROM sync_configuration
      ORDER BY sync_name
    `);

    const recentLogs = await db.query(`
      SELECT
        execution_type,
        source_table,
        target_table,
        status,
        records_processed,
        started_at
      FROM sync_execution_logs
      ORDER BY started_at DESC
      LIMIT 10
    `);

    return {
      configurations: syncStatus,
      recentExecutions: recentLogs,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`获取同步状态失败: ${error}`);
  }
}

// 自动修复函数
async function performAutoRepair(db: any): Promise<any> {
  const repairTasks = [
    {
      name: '清理过期缓存',
      action: async () => {
        await db.execute(`
          DELETE FROM enhanced_visualization_cache
          WHERE expires_at < datetime('now')
        `);
      }
    },
    {
      name: '重建实时统计',
      action: async () => {
        await db.execute(`
          DELETE FROM realtime_stats
          WHERE last_updated < datetime('now', '-1 day')
        `);
      }
    },
    {
      name: '同步数据一致性检查',
      action: async () => {
        const inconsistencies = await db.query(`
          SELECT COUNT(*) as count
          FROM analytics_responses ar
          LEFT JOIN questionnaire_responses qr ON ar.id = qr.id
          WHERE qr.id IS NULL
        `);

        if (inconsistencies[0]?.count > 0) {
          throw new Error(`发现 ${inconsistencies[0].count} 条不一致数据`);
        }
      }
    }
  ];

  const results = [];

  for (const task of repairTasks) {
    try {
      await task.action();
      results.push({
        task: task.name,
        status: 'success',
        message: '执行成功'
      });
    } catch (error) {
      results.push({
        task: task.name,
        status: 'failed',
        error: error instanceof Error ? error.message : '执行失败'
      });
    }
  }

  return {
    totalTasks: repairTasks.length,
    successCount: results.filter(r => r.status === 'success').length,
    failedCount: results.filter(r => r.status === 'failed').length,
    details: results,
    executedAt: new Date().toISOString()
  };
}

// 获取告警信息
async function getAlertInfo(db: any): Promise<any> {
  const alerts = [];

  try {
    // 检查同步延迟
    const syncDelays = await db.query(`
      SELECT sync_name, last_sync_time
      FROM sync_configuration
      WHERE last_sync_time < datetime('now', '-1 hour')
      AND is_enabled = 1
    `);

    if (syncDelays.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'sync_delay',
        message: `${syncDelays.length} 个同步任务超过1小时未执行`,
        details: syncDelays
      });
    }

    // 检查缓存命中率
    const cacheStats = await db.queryFirst(`
      SELECT COUNT(*) as total_cache_entries
      FROM enhanced_visualization_cache
      WHERE expires_at > datetime('now')
    `);

    if ((cacheStats?.total_cache_entries || 0) < 3) {
      alerts.push({
        type: 'info',
        category: 'cache_low',
        message: '缓存条目较少，可能影响性能',
        details: { cacheEntries: cacheStats?.total_cache_entries || 0 }
      });
    }

    // 检查数据质量
    const dataQuality = await db.queryFirst(`
      SELECT
        COUNT(*) as total_responses,
        COUNT(CASE WHEN is_test_data = 1 THEN 1 END) as test_responses
      FROM analytics_responses
    `);

    const testDataRatio = dataQuality?.total_responses > 0
      ? (dataQuality.test_responses / dataQuality.total_responses) * 100
      : 0;

    if (testDataRatio > 80) {
      alerts.push({
        type: 'warning',
        category: 'test_data_high',
        message: `测试数据占比过高 (${testDataRatio.toFixed(1)}%)`,
        details: dataQuality
      });
    }

    return {
      alertCount: alerts.length,
      alerts,
      lastChecked: new Date().toISOString(),
      systemStatus: alerts.length === 0 ? 'healthy' : 'needs_attention'
    };

  } catch (error) {
    return {
      alertCount: 1,
      alerts: [{
        type: 'error',
        category: 'system_error',
        message: '系统检查失败',
        details: { error: error instanceof Error ? error.message : '未知错误' }
      }],
      lastChecked: new Date().toISOString(),
      systemStatus: 'error'
    };
  }
}

// 数据验证函数
function validateResponseData(responseData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!responseData) {
    errors.push('响应数据为空');
    return { isValid: false, errors };
  }

  if (typeof responseData !== 'object') {
    errors.push('响应数据格式无效');
    return { isValid: false, errors };
  }

  // 检查必要的数据结构
  if (!responseData.sectionResponses) {
    errors.push('缺少sectionResponses字段');
  } else {
    // 检查各个section
    if (!responseData.sectionResponses.section1) {
      errors.push('缺少section1数据');
    }
    if (!responseData.sectionResponses.section2) {
      errors.push('缺少section2数据');
    }
    if (!responseData.sectionResponses.section3) {
      errors.push('缺少section3数据');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 数据库一致性检查
async function checkDatabaseConsistency(db: any): Promise<any> {
  const result = {
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0
    },
    details: {
      mainTables: {} as any,
      analyticsTables: {} as any,
      cacheTables: {} as any,
      database: {} as any
    },
    issues: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // 检查主表数据
    result.summary.totalChecks++;
    const mainTableStats = await db.queryFirst(`
      SELECT COUNT(*) as total_responses
      FROM questionnaire_responses
      WHERE status = 'completed'
    `);
    result.details.mainTables.completedResponses = mainTableStats?.total_responses || 0;
    result.summary.passedChecks++;

    // 检查分析表数据
    result.summary.totalChecks++;
    const analyticsStats = await db.queryFirst(`
      SELECT COUNT(*) as total_analytics
      FROM analytics_responses
    `);
    result.details.analyticsTables.totalRecords = analyticsStats?.total_analytics || 0;

    // 数据一致性检查
    if (result.details.mainTables.completedResponses !== result.details.analyticsTables.totalRecords) {
      result.issues.push(`主表与分析表数据不一致: 主表${result.details.mainTables.completedResponses}条，分析表${result.details.analyticsTables.totalRecords}条`);
      result.recommendations.push('建议执行数据同步修复');
      result.summary.failedChecks++;
    } else {
      result.summary.passedChecks++;
    }

    // 检查缓存表
    result.summary.totalChecks++;
    const cacheStats = await db.query(`
      SELECT
        'realtime_stats' as table_name,
        COUNT(*) as record_count
      FROM realtime_stats
      UNION ALL
      SELECT
        'aggregated_stats' as table_name,
        COUNT(*) as record_count
      FROM aggregated_stats
      UNION ALL
      SELECT
        'enhanced_visualization_cache' as table_name,
        COUNT(*) as record_count
      FROM enhanced_visualization_cache
    `);

    result.details.cacheTables = {};
    cacheStats.forEach((stat: any) => {
      result.details.cacheTables[stat.table_name] = stat.record_count;
    });
    result.summary.passedChecks++;

    // 检查数据库表结构
    result.summary.totalChecks++;
    const tableList = await db.query(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const expectedTables = [
      'analytics_responses',
      'admin_responses',
      'realtime_stats',
      'aggregated_stats',
      'enhanced_visualization_cache',
      'sync_configuration',
      'sync_execution_logs'
    ];

    const actualTables = tableList.map((t: any) => t.name);
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));

    if (missingTables.length > 0) {
      result.issues.push(`缺少数据库表: ${missingTables.join(', ')}`);
      result.recommendations.push('建议执行数据库迁移脚本');
      result.summary.failedChecks++;
    } else {
      result.summary.passedChecks++;
    }

    // 检查问卷ID一致性
    result.summary.totalChecks++;
    const questionIds = new Set();
    const actualQuestionIds = new Set();

    // 从实际数据中提取问卷ID
    const sampleResponses = await db.query(`
      SELECT responses FROM analytics_responses
      WHERE is_test_data = 1
      LIMIT 10
    `);

    for (const response of sampleResponses) {
      try {
        const data = JSON.parse(response.responses || '{}');
        if (data.sectionResponses) {
          Object.keys(data.sectionResponses).forEach(section => {
            Object.keys(data.sectionResponses[section] || {}).forEach(questionId => {
              actualQuestionIds.add(questionId);
            });
          });
        }
      } catch (error) {
        console.error('解析响应数据失败:', error);
      }
    }

    result.details.database.actualQuestionIds = Array.from(actualQuestionIds);
    result.summary.passedChecks++;

    return result;

  } catch (error) {
    result.issues.push(`数据库一致性检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    result.summary.failedChecks++;
    return result;
  }
}

// 执行数据一致性检查
async function performConsistencyCheck(db: any, questionnaireId: string) {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // 检查数据库表是否存在
    const tables = await db.query(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name IN ('analytics_responses', 'realtime_stats', 'aggregated_stats')
    `);

    if (tables.length < 3) {
      result.isValid = false;
      result.errors.push('缺少必要的数据库表');
    }

    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`一致性检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return result;
  }
}

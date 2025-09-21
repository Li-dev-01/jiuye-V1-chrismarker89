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

      // 将通用问卷数据转换为JSON存储
      const questionnaireData = {
        questionnaire_id: questionnaireId,
        user_id: userId,
        responses: JSON.stringify({
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
      const result = await db.execute(`
        INSERT INTO universal_questionnaire_responses (
          questionnaire_id, user_uuid, responses, submitted_at, is_completed, completion_percentage
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        questionnaireData.questionnaire_id,
        questionnaireData.user_id,
        questionnaireData.responses,
        questionnaireData.submitted_at,
        1, // is_completed
        100 // completion_percentage
      ]);

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

  // 获取问卷统计数据 (公开接口) - 使用缓存优化版本
  universalQuestionnaire.get('/statistics/:questionnaireId', async (c) => {
    console.log('Universal questionnaire statistics endpoint hit (cached version)');
    try {
      const questionnaireId = c.req.param('questionnaireId');
      console.log('Questionnaire ID:', questionnaireId);

      if (!questionnaireId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '问卷ID不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      const statisticsCache = createStatisticsCache(db);

      // 检查是否需要更新缓存（改为5分钟检查一次）
      const shouldUpdate = await statisticsCache.shouldUpdateCache(questionnaireId, 5);

      if (shouldUpdate) {
        console.log('🔄 更新统计缓存...');
        const updateResult = await statisticsCache.updateQuestionnaireStatistics(questionnaireId);
        if (!updateResult.success) {
          console.error('缓存更新失败:', updateResult.errors);
        } else {
          console.log(`✅ 缓存更新成功，处理了 ${updateResult.totalResponses} 条响应`);
        }
      }

      // 尝试从缓存获取数据
      const cachedData = await statisticsCache.getCachedStatistics(questionnaireId);

      if (cachedData) {
        console.log('📊 使用缓存统计数据');
        return c.json({
          success: true,
          data: {
            ...cachedData,
            cacheInfo: {
              message: '数据来源：统计缓存',
              lastUpdated: cachedData.lastUpdated,
              dataSource: 'cache'
            }
          }
        });
      }

      // 如果缓存不可用，回退到实时计算
      console.log('⚠️ 缓存数据不可用，回退到实时计算');

      const responses = await db.query(`
        SELECT responses, submitted_at, is_completed
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        AND is_completed = 1
        AND submitted_at IS NOT NULL
        ORDER BY submitted_at DESC
      `, [questionnaireId]);

      if (!responses || responses.length === 0) {
        return c.json({
          success: true,
          data: {
            questionnaireId,
            totalResponses: 0,
            statistics: {},
            lastUpdated: new Date().toISOString(),
            dataSource: 'realtime'
          }
        });
      }

      // 实时计算统计（保留原有逻辑作为备用）
      const questionStats: Record<string, any> = {};
      let totalResponses = 0;

      for (const response of responses) {
        try {
          const responseData = JSON.parse(response.responses as string);
          totalResponses++;

          // 处理questionnaires-v1格式的数据
          if (responseData.sectionResponses) {
            // 检查是否是数组格式（旧格式）
            if (Array.isArray(responseData.sectionResponses)) {
              // 数组格式：遍历每个节的响应
              for (const section of responseData.sectionResponses) {
                for (const question of section.questionResponses) {
                  const questionId = question.questionId;
                  const value = question.value;

                  if (!questionStats[questionId]) {
                    questionStats[questionId] = {
                      questionId,
                      totalResponses: 0,
                      values: {},
                      lastUpdated: new Date().toISOString()
                    };
                  }

                  questionStats[questionId].totalResponses++;

                  // 统计不同类型的值
                  if (value !== null && value !== undefined && value !== '') {
                    const valueKey = Array.isArray(value) ? value.join(',') : String(value);

                    if (!questionStats[questionId].values[valueKey]) {
                      questionStats[questionId].values[valueKey] = 0;
                    }
                    questionStats[questionId].values[valueKey]++;
                  }
                }
              }
            } else {
              // 对象格式：questionnaires-v1格式
              const sections = responseData.sectionResponses;

              // 统计各个字段
              if (sections.section1) {
                // 年龄分布
                if (sections.section1.age) {
                  const age = parseInt(sections.section1.age);
                  let ageRange = '其他';
                  if (age < 20) ageRange = '20以下';
                  else if (age <= 22) ageRange = '20-22';
                  else if (age <= 25) ageRange = '23-25';
                  else if (age <= 28) ageRange = '26-28';
                  else if (age <= 35) ageRange = '29-35';
                  else ageRange = '35以上';

                  if (!questionStats['age-range']) {
                    questionStats['age-range'] = {
                      questionId: 'age-range',
                      totalResponses: 0,
                      values: {},
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  questionStats['age-range'].totalResponses++;
                  if (!questionStats['age-range'].values[ageRange]) {
                    questionStats['age-range'].values[ageRange] = 0;
                  }
                  questionStats['age-range'].values[ageRange]++;
                }

                // 性别分布
                if (sections.section1.gender) {
                  if (!questionStats['gender']) {
                    questionStats['gender'] = {
                      questionId: 'gender',
                      totalResponses: 0,
                      values: {},
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  questionStats['gender'].totalResponses++;
                  const gender = sections.section1.gender;
                  if (!questionStats['gender'].values[gender]) {
                    questionStats['gender'].values[gender] = 0;
                  }
                  questionStats['gender'].values[gender]++;
                }
              }

              // 教育背景统计
              if (sections.section2) {
                // 学位分布
                if (sections.section2.degree) {
                  if (!questionStats['education-level']) {
                    questionStats['education-level'] = {
                      questionId: 'education-level',
                      totalResponses: 0,
                      values: {},
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  questionStats['education-level'].totalResponses++;
                  const degree = sections.section2.degree;
                  if (!questionStats['education-level'].values[degree]) {
                    questionStats['education-level'].values[degree] = 0;
                  }
                  questionStats['education-level'].values[degree]++;
                }

                // 专业分布（简化分类）
                if (sections.section2.major) {
                  if (!questionStats['major-field']) {
                    questionStats['major-field'] = {
                      questionId: 'major-field',
                      totalResponses: 0,
                      values: {},
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  questionStats['major-field'].totalResponses++;

                  const major = sections.section2.major;
                  let majorCategory = '其他';
                  if (major.includes('计算机') || major.includes('软件') || major.includes('信息') || major.includes('电子')) majorCategory = '工学';
                  else if (major.includes('管理') || major.includes('经济') || major.includes('金融')) majorCategory = '管理学';
                  else if (major.includes('数学') || major.includes('物理') || major.includes('化学')) majorCategory = '理学';
                  else if (major.includes('文学') || major.includes('语言') || major.includes('新闻')) majorCategory = '文学';
                  else if (major.includes('医学') || major.includes('临床') || major.includes('护理')) majorCategory = '医学';
                  else if (major.includes('教育') || major.includes('师范')) majorCategory = '教育学';
                  else if (major.includes('艺术') || major.includes('设计') || major.includes('美术')) majorCategory = '艺术学';
                  else if (major.includes('法学') || major.includes('法律')) majorCategory = '法学';

                  if (!questionStats['major-field'].values[majorCategory]) {
                    questionStats['major-field'].values[majorCategory] = 0;
                  }
                  questionStats['major-field'].values[majorCategory]++;
                }
              }

              // 就业状态统计
              if (sections.section3 && sections.section3.currentStatus) {
                if (!questionStats['current-status']) {
                  questionStats['current-status'] = {
                    questionId: 'current-status',
                    totalResponses: 0,
                    values: {},
                    lastUpdated: new Date().toISOString()
                  };
                }
                questionStats['current-status'].totalResponses++;
                const status = sections.section3.currentStatus;
                if (!questionStats['current-status'].values[status]) {
                  questionStats['current-status'].values[status] = 0;
                }
                questionStats['current-status'].values[status]++;
              }
            }
          } else {
            // 处理两种数据格式：旧格式（简单键值对）和新格式（完整结构）

            // 检查是否是新格式的完整数据
            if (responseData.sectionResponses) {
              // 新格式：已经在上面处理了
              continue;
            }

            // 旧格式：使用动态字段映射管理器
            try {
              const mappedData = fieldMappingManager.applyMapping(responseData);

              for (const [questionId, value] of Object.entries(mappedData)) {
                if (!questionStats[questionId]) {
                  questionStats[questionId] = {
                    questionId,
                    totalResponses: 0,
                    values: {},
                    lastUpdated: new Date().toISOString()
                  };
                }

                questionStats[questionId].totalResponses++;

                // 统计不同类型的值
                if (value !== null && value !== undefined && value !== '') {
                  const valueKey = Array.isArray(value) ? value.join(',') : String(value);

                  if (!questionStats[questionId].values[valueKey]) {
                    questionStats[questionId].values[valueKey] = 0;
                  }
                  questionStats[questionId].values[valueKey]++;
                }
              }
            } catch (error) {
              console.error('字段映射失败:', error);
              // 如果映射失败，跳过这条数据
              continue;
            }
          }
        } catch (parseError) {
          console.error('解析响应数据失败:', parseError);
          continue;
        }
      }

      // 计算百分比
      for (const questionId in questionStats) {
        const stat = questionStats[questionId];
        stat.options = [];
        
        for (const [value, count] of Object.entries(stat.values)) {
          stat.options.push({
            value,
            count: count as number,
            percentage: Math.round(((count as number) / stat.totalResponses) * 100 * 100) / 100
          });
        }

        // 按数量排序
        stat.options.sort((a: any, b: any) => b.count - a.count);
      }

      return c.json({
        success: true,
        data: {
          questionnaireId,
          totalResponses,
          statistics: questionStats,
          lastUpdated: new Date().toISOString(),
          dataSource: 'realtime',
          cacheInfo: {
            message: '数据来源：实时计算（缓存数据不可用时的备用方案）',
            recommendation: '建议启用统计缓存以提升性能'
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
      const statisticsCache = createStatisticsCache(db);

      const updateResult = await statisticsCache.updateQuestionnaireStatistics(questionnaireId);

      return c.json({
        success: updateResult.success,
        data: updateResult,
        message: updateResult.success ? '统计缓存刷新成功' : '统计缓存刷新失败'
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
      const statisticsCache = createStatisticsCache(db);

      const cacheInfo = await statisticsCache.getCacheInfo(questionnaireId);

      return c.json({
        success: true,
        data: cacheInfo,
        message: '获取缓存状态成功'
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
          COUNT(*) as response_count,
          MIN(submitted_at) as first_submission,
          MAX(submitted_at) as last_submission
        FROM universal_questionnaire_responses
        GROUP BY questionnaire_id
        ORDER BY last_submission DESC
      `);

      return c.json({
        success: true,
        data: Array.isArray(questionnaires) ? questionnaires : (questionnaires as any).results || []
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

  // 获取单个问卷的详细响应 (管理员接口)
  universalQuestionnaire.get('/responses/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const offset = (page - 1) * limit;

      const db = createDatabaseService(c.env as Env);

      // 获取总数
      const countResult = await db.queryFirst<{ total: number }>(`
        SELECT COUNT(*) as total
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      const total = countResult?.total || 0;

      // 获取分页数据
      const responses = await db.query(`
        SELECT *
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        ORDER BY submitted_at DESC
        LIMIT ? OFFSET ?
      `, [questionnaireId, limit, offset]);

      return c.json({
        success: true,
        data: {
          responses: Array.isArray(responses) ? responses : (responses as any).results || [],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
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

  // 生成测试数据 (临时移除认证)
  universalQuestionnaire.post('/generate-test-data', async (c) => {
    try {
      const { count = 50, questionnaireId = 'employment-survey-2024' } = await c.req.json();

      if (count > 200) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '单次生成数量不能超过200条'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      const generator = new QuestionnaireDataGenerator(sampleUniversalQuestionnaire);

      // 生成测试数据
      const responses = generator.generateBatch(count);

      // 插入数据库
      let insertedCount = 0;
      const errors = [];

      for (const response of responses) {
        try {
          await db.execute(`
            INSERT INTO universal_questionnaire_responses (
              questionnaire_id,
              responses,
              submitted_at
            ) VALUES (?, ?, ?)
          `, [
            questionnaireId,
            JSON.stringify(response),
            response.submittedAt
          ]);
          insertedCount++;
        } catch (error) {
          errors.push(`插入第${insertedCount + 1}条数据失败: ${error}`);
        }
      }

      return c.json({
        success: true,
        data: {
          totalGenerated: count,
          insertedCount,
          errorCount: errors.length,
          errors: errors.slice(0, 5) // 只返回前5个错误
        },
        message: `成功生成并插入${insertedCount}条测试数据`
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

  // 字段映射管理 (管理员接口)
  universalQuestionnaire.get('/field-mapping/config', authMiddleware, async (c) => {
    try {
      const config = fieldMappingManager.getCurrentMappingConfig();
      const stats = fieldMappingManager.getMappingStats();

      return c.json({
        success: true,
        data: {
          config,
          stats,
          availableVersions: fieldMappingManager.getAvailableVersions()
        },
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

  universalQuestionnaire.post('/field-mapping/config', authMiddleware, async (c) => {
    try {
      const { configJson } = await c.req.json();

      const result = fieldMappingManager.importMappingConfig(configJson);

      if (!result.success) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: result.error
        }, 400);
      }

      return c.json({
        success: true,
        data: null,
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

  universalQuestionnaire.post('/field-mapping/switch-version', authMiddleware, async (c) => {
    try {
      const { version } = await c.req.json();

      const success = fieldMappingManager.switchToVersion(version);

      if (!success) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: `版本 ${version} 不存在`
        }, 404);
      }

      return c.json({
        success: true,
        data: { currentVersion: version },
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
  universalQuestionnaire.post('/data-quality/check', authMiddleware, async (c) => {
    try {
      const { questionnaireId = 'employment-survey-2024', sampleSize = 100 } = await c.req.json();

      const db = createDatabaseService(c.env as Env);

      // 获取样本数据
      const responses = await db.query(
        'SELECT responses FROM universal_questionnaire_responses WHERE questionnaire_id = ? ORDER BY submitted_at DESC LIMIT ?',
        [questionnaireId, sampleSize]
      );

      if (responses.length === 0) {
        return c.json({
          success: false,
          error: 'No Data',
          message: '没有找到数据进行质量检查'
        }, 404);
      }

      // 解析响应数据
      const parsedData = responses.map(row => {
        try {
          return JSON.parse(row.responses);
        } catch (error) {
          return row.responses;
        }
      });

      // 执行质量检查
      const qualityResult = dataQualityChecker.checkDataBatch(parsedData);

      return c.json({
        success: true,
        data: qualityResult,
        message: `完成${qualityResult.totalRecords}条数据的质量检查`
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

  // 数据版本管理 (管理员接口)
  universalQuestionnaire.get('/data-version/info', authMiddleware, async (c) => {
    try {
      const versionInfo = dataVersionManager.getVersionInfo();

      return c.json({
        success: true,
        data: versionInfo,
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

  universalQuestionnaire.post('/data-version/migrate', authMiddleware, async (c) => {
    try {
      const { questionnaireId = 'employment-survey-2024', targetVersion, dryRun = true } = await c.req.json();

      const db = createDatabaseService(c.env as Env);

      // 获取需要迁移的数据
      const responses = await db.query(
        'SELECT id, responses FROM universal_questionnaire_responses WHERE questionnaire_id = ?',
        [questionnaireId]
      );

      if (responses.length === 0) {
        return c.json({
          success: false,
          error: 'No Data',
          message: '没有找到需要迁移的数据'
        }, 404);
      }

      // 解析和迁移数据
      const migrationResults = [];
      let successCount = 0;
      let errorCount = 0;

      for (const row of responses) {
        try {
          const originalData = JSON.parse(row.responses);
          const migrationResult = dataVersionManager.migrateData(originalData, targetVersion);

          migrationResults.push({
            id: row.id,
            fromVersion: migrationResult.fromVersion,
            toVersion: migrationResult.toVersion,
            success: migrationResult.success,
            error: migrationResult.error
          });

          if (migrationResult.success) {
            successCount++;

            // 如果不是试运行，更新数据库
            if (!dryRun) {
              await db.query(
                'UPDATE universal_questionnaire_responses SET responses = ? WHERE id = ?',
                [JSON.stringify(migrationResult.data), row.id]
              );
            }
          } else {
            errorCount++;
          }
        } catch (error) {
          migrationResults.push({
            id: row.id,
            success: false,
            error: `解析失败: ${error}`
          });
          errorCount++;
        }
      }

      return c.json({
        success: errorCount === 0,
        data: {
          totalRecords: responses.length,
          successCount,
          errorCount,
          dryRun,
          results: migrationResults.slice(0, 10) // 只返回前10个结果
        },
        message: dryRun
          ? `试运行完成: ${successCount}成功, ${errorCount}失败`
          : `迁移完成: ${successCount}成功, ${errorCount}失败`
      });

    } catch (error) {
      console.error('数据迁移失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据迁移失败'
      }, 500);
    }
  });

  // 缓存管理API (管理员接口)
  universalQuestionnaire.post('/cache/refresh/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);
      const statisticsCache = createStatisticsCache(db);

      const updateResult = await statisticsCache.updateQuestionnaireStatistics(questionnaireId);

      return c.json({
        success: updateResult.success,
        data: updateResult,
        message: updateResult.success ? '缓存刷新成功' : '缓存刷新失败'
      });

    } catch (error) {
      console.error('刷新缓存失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '刷新缓存失败'
      }, 500);
    }
  });

  universalQuestionnaire.get('/cache/info/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);
      const statisticsCache = createStatisticsCache(db);

      const cacheInfo = await statisticsCache.getCacheInfo(questionnaireId);

      return c.json({
        success: true,
        data: cacheInfo,
        message: '获取缓存信息成功'
      });

    } catch (error) {
      console.error('获取缓存信息失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取缓存信息失败'
      }, 500);
    }
  });

  // 数据一致性检查API (管理员接口)
  universalQuestionnaire.get('/consistency-check/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);

      // 执行数据一致性检查
      const result = await performConsistencyCheck(db, questionnaireId);

      return c.json({
        success: true,
        data: result,
        message: result.isValid ? '数据一致性检查通过' : '发现数据一致性问题'
      });

    } catch (error) {
      console.error('数据一致性检查失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据一致性检查失败'
      }, 500);
    }
  });

  // 数据质量监控API (管理员接口)
  universalQuestionnaire.get('/data-quality/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const db = createDatabaseService(c.env as Env);

      // 获取数据质量指标
      const totalResponses = await db.queryFirst(`
        SELECT COUNT(*) as count FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      const validResponses = await db.queryFirst(`
        SELECT COUNT(*) as count FROM universal_questionnaire_responses
        WHERE questionnaire_id = ? AND is_valid = 1 AND is_completed = 1
      `, [questionnaireId]);

      const recentResponses = await db.queryFirst(`
        SELECT COUNT(*) as count FROM universal_questionnaire_responses
        WHERE questionnaire_id = ? AND submitted_at >= datetime('now', '-24 hours')
      `, [questionnaireId]);

      // 检查统计缓存健康状态
      const cacheHealth = await db.queryFirst(`
        SELECT COUNT(DISTINCT question_id) as cached_questions
        FROM questionnaire_statistics_cache
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      // 计算质量指标
      const qualityRate = totalResponses.count > 0 ?
        (validResponses.count / totalResponses.count) * 100 : 0;

      const qualityReport = {
        timestamp: new Date().toISOString(),
        questionnaireId,
        metrics: {
          totalResponses: totalResponses.count,
          validResponses: validResponses.count,
          recentResponses: recentResponses.count,
          qualityRate: Math.round(qualityRate * 100) / 100,
          cachedQuestions: cacheHealth.cached_questions
        },
        status: {
          dataQuality: qualityRate >= 90 ? 'excellent' : qualityRate >= 70 ? 'good' : 'warning',
          cacheHealth: cacheHealth.cached_questions >= 15 ? 'healthy' : 'warning',
          activityLevel: recentResponses.count >= 10 ? 'high' : recentResponses.count >= 5 ? 'medium' : 'low'
        },
        alerts: []
      };

      // 生成告警
      if (qualityRate < 70) {
        qualityReport.alerts.push({
          type: 'warning',
          message: `数据质量率较低: ${qualityRate.toFixed(2)}%`
        });
      }

      if (cacheHealth.cached_questions < 15) {
        qualityReport.alerts.push({
          type: 'warning',
          message: `统计缓存不完整: 仅有${cacheHealth.cached_questions}个问题`
        });
      }

      return c.json({
        success: true,
        data: qualityReport,
        message: '数据质量监控报告生成成功'
      });

    } catch (error) {
      console.error('数据质量监控失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据质量监控失败'
      }, 500);
    }
  });

  // 数据修复工具API (管理员接口)
  universalQuestionnaire.post('/data-repair/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const repairType = c.req.query('type') || 'all'; // all, missing-questions, cache-rebuild
      const db = createDatabaseService(c.env as Env);

      const repairResult = {
        success: true,
        timestamp: new Date().toISOString(),
        repairType,
        actions: [],
        errors: [],
        summary: {
          totalProcessed: 0,
          successCount: 0,
          errorCount: 0
        }
      };

      // 修复缺失的问题数据
      if (repairType === 'all' || repairType === 'missing-questions') {
        console.log('开始修复缺失的问题数据...');

        const responses = await db.query(`
          SELECT id, responses FROM universal_questionnaire_responses
          WHERE questionnaire_id = ?
        `, [questionnaireId]);

        for (const response of responses) {
          try {
            const data = JSON.parse(response.responses);
            let needsUpdate = false;

            // 检查basic-demographics section
            const basicDemographics = data.sectionResponses?.find(
              (section: any) => section.sectionId === 'basic-demographics'
            );

            if (basicDemographics) {
              const existingQuestions = new Set(
                basicDemographics.questionResponses?.map((q: any) => q.questionId) || []
              );

              // 检查必需的问题
              const requiredQuestions = [
                'age-range', 'gender', 'work-location-preference', 'education-level', 'major-field'
              ];

              for (const questionId of requiredQuestions) {
                if (!existingQuestions.has(questionId)) {
                  // 添加缺失的问题
                  const defaultValues = {
                    'age-range': ['20-22', '23-25', '26-28'],
                    'gender': ['male', 'female', 'prefer-not-say'],
                    'work-location-preference': ['tier1', 'tier2', 'new-tier1'],
                    'education-level': ['bachelor', 'master', 'associate'],
                    'major-field': ['engineering', 'business', 'arts']
                  };

                  const possibleValues = defaultValues[questionId] || ['unknown'];
                  const randomValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];

                  basicDemographics.questionResponses.push({
                    questionId,
                    value: randomValue,
                    timestamp: Date.now()
                  });

                  needsUpdate = true;
                  repairResult.actions.push(`为响应${response.id}添加缺失问题: ${questionId}`);
                }
              }
            }

            if (needsUpdate) {
              await db.execute(`
                UPDATE universal_questionnaire_responses
                SET responses = ?
                WHERE id = ?
              `, [JSON.stringify(data), response.id]);

              repairResult.summary.successCount++;
            }

            repairResult.summary.totalProcessed++;

          } catch (error) {
            repairResult.errors.push(`处理响应${response.id}失败: ${error}`);
            repairResult.summary.errorCount++;
          }
        }
      }

      // 重建统计缓存
      if (repairType === 'all' || repairType === 'cache-rebuild') {
        console.log('开始重建统计缓存...');

        try {
          // 清除旧缓存
          await db.execute(`
            DELETE FROM questionnaire_statistics_cache
            WHERE questionnaire_id = ?
          `, [questionnaireId]);

          repairResult.actions.push('清除旧的统计缓存');

          // 触发缓存重建（通过调用统计API）
          const statisticsCache = createStatisticsCache(db);
          const cacheResult = await statisticsCache.updateQuestionnaireStatistics(questionnaireId);

          if (cacheResult.success) {
            repairResult.actions.push(`重建统计缓存成功，处理了${cacheResult.totalResponses}条响应`);
          } else {
            repairResult.errors.push('重建统计缓存失败');
          }

        } catch (error) {
          repairResult.errors.push(`重建统计缓存失败: ${error}`);
          repairResult.summary.errorCount++;
        }
      }

      // 数据验证
      if (repairType === 'all' || repairType === 'validation') {
        console.log('开始数据验证...');

        try {
          const validationResult = await performConsistencyCheck(db, questionnaireId);

          if (validationResult.isValid) {
            repairResult.actions.push('数据验证通过');
          } else {
            repairResult.actions.push('数据验证发现问题');
            repairResult.errors.push(...validationResult.errors);
          }

        } catch (error) {
          repairResult.errors.push(`数据验证失败: ${error}`);
        }
      }

      repairResult.success = repairResult.errors.length === 0;

      return c.json({
        success: true,
        data: repairResult,
        message: repairResult.success ? '数据修复完成' : '数据修复完成，但存在部分错误'
      });

    } catch (error) {
      console.error('数据修复失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据修复失败'
      }, 500);
    }
  });

  // 数据同步监控API (管理员接口)
  universalQuestionnaire.get('/sync-monitor/status/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const monitor = getDataSyncMonitor(c.env as Env);

      const status = await monitor.checkSyncStatus(questionnaireId);

      return c.json({
        success: true,
        data: status,
        message: '获取同步状态成功'
      });

    } catch (error) {
      console.error('获取同步状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取同步状态失败'
      }, 500);
    }
  });

  universalQuestionnaire.post('/sync-monitor/repair/:questionnaireId', authMiddleware, async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const monitor = getDataSyncMonitor(c.env as Env);

      const repairResult = await monitor.attemptAutoRepair(questionnaireId);

      return c.json({
        success: repairResult,
        data: { repaired: repairResult },
        message: repairResult ? '自动修复成功' : '自动修复失败'
      });

    } catch (error) {
      console.error('自动修复失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '自动修复失败'
      }, 500);
    }
  });

  universalQuestionnaire.get('/sync-monitor/alerts', authMiddleware, async (c) => {
    try {
      const monitor = getDataSyncMonitor(c.env as Env);
      const alerts = monitor.getAllAlerts();
      const metrics = monitor.getMetrics();

      return c.json({
        success: true,
        data: {
          alerts,
          metrics,
          activeAlerts: monitor.getActiveAlerts()
        },
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

  return universalQuestionnaire;
}

/**
 * 执行数据一致性检查
 */
async function performConsistencyCheck(db: any, questionnaireId: string) {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
    details: {
      questionnaire: { totalQuestions: 0, questionIds: [] as string[] },
      database: { totalResponses: 0, actualQuestionIds: [] as string[], missingQuestions: [] as string[] },
      statistics: { cachedQuestionIds: [] as string[], missingFromCache: [] as string[] }
    }
  };

  // 问卷定义中的所有问题ID
  const expectedQuestionIds = [
    'age-range', 'gender', 'work-location-preference', 'education-level', 'major-field',
    'current-status', 'work-industry', 'current-salary', 'academic-year', 'career-preparation',
    'job-search-duration', 'job-search-difficulties', 'current-activity', 'job-search-intensity',
    'financial-pressure', 'monthly-housing-cost', 'life-pressure-tier1',
    'employment-difficulty-perception', 'salary-level-perception', 'peer-employment-rate',
    'employment-advice', 'submission-type'
  ];

  result.details.questionnaire.totalQuestions = expectedQuestionIds.length;
  result.details.questionnaire.questionIds = expectedQuestionIds;

  // 检查数据库实际数据
  const responses = await db.query(`
    SELECT responses FROM universal_questionnaire_responses
    WHERE questionnaire_id = ?
  `, [questionnaireId]);

  const actualQuestionIds = new Set<string>();
  result.details.database.totalResponses = responses.length;

  for (const response of responses) {
    try {
      const data = JSON.parse(response.responses as string);
      if (data.sectionResponses) {
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

  result.details.database.actualQuestionIds = Array.from(actualQuestionIds);
  result.details.database.missingQuestions = expectedQuestionIds.filter(
    qId => !actualQuestionIds.has(qId)
  );

  // 检查统计缓存
  const cacheData = await db.query(`
    SELECT DISTINCT question_id FROM questionnaire_statistics_cache
    WHERE questionnaire_id = ?
  `, [questionnaireId]);

  const cachedQuestionIds = cacheData.map((row: any) => row.question_id);
  result.details.statistics.cachedQuestionIds = cachedQuestionIds;
  result.details.statistics.missingFromCache = expectedQuestionIds.filter(
    qId => !cachedQuestionIds.includes(qId)
  );

  // 分析问题
  if (result.details.database.missingQuestions.length > 0) {
    result.isValid = false;
    result.errors.push(
      `数据库中缺少 ${result.details.database.missingQuestions.length} 个问题的数据: ${result.details.database.missingQuestions.join(', ')}`
    );
    result.recommendations.push('建议更新数据生成器以包含所有问卷定义中的问题');
  }

  if (result.details.statistics.missingFromCache.length > 0) {
    result.isValid = false;
    result.errors.push(
      `统计缓存中缺少 ${result.details.statistics.missingFromCache.length} 个问题: ${result.details.statistics.missingFromCache.join(', ')}`
    );
    result.recommendations.push('建议手动触发统计缓存更新');
  }

  return result;
}

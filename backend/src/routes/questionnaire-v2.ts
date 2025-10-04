/**
 * 问卷2独立路由系统
 * 完全独立的API路由，与问卷1无任何依赖关系
 * 专用于智能问卷系统
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { questionnaireV2ConfigManager } from '../data/questionnaire2/config';
import { Questionnaire2StatsCalculator } from '../services/questionnaire2StatsCalculator';

// 辅助计算函数
function calculateEconomicPressureStats(responses: any[]) {
  const pressureLevels: { [key: string]: number } = {};

  responses.forEach(response => {
    try {
      const economicData = JSON.parse(response.economic_pressure_data || '{}');
      const stressLevel = economicData.stressLevel || 'unknown';
      pressureLevels[stressLevel] = (pressureLevels[stressLevel] || 0) + 1;
    } catch (e) {
      console.warn('Failed to parse economic pressure data:', e);
    }
  });

  const total = responses.length;
  return Object.entries(pressureLevels).map(([level, count]) => ({
    label: level,
    value: count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));
}

function calculateEmploymentConfidenceStats(responses: any[]) {
  const confidenceLevels: { [key: string]: number } = {};

  responses.forEach(response => {
    try {
      const confidenceData = JSON.parse(response.employment_confidence_data || '{}');
      const confidence = confidenceData.jobSearchConfidence || 'unknown';
      confidenceLevels[confidence] = (confidenceLevels[confidence] || 0) + 1;
    } catch (e) {
      console.warn('Failed to parse employment confidence data:', e);
    }
  });

  const total = responses.length;
  return Object.entries(confidenceLevels).map(([level, count]) => ({
    label: level,
    value: count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));
}

function calculateModernDebtStats(responses: any[]) {
  const debtTypes: { [key: string]: number } = {};

  responses.forEach(response => {
    try {
      const debtData = JSON.parse(response.modern_debt_data || '{}');
      const types = debtData.debtTypes || [];
      types.forEach((type: string) => {
        debtTypes[type] = (debtTypes[type] || 0) + 1;
      });
    } catch (e) {
      console.warn('Failed to parse modern debt data:', e);
    }
  });

  const total = responses.length;
  return Object.entries(debtTypes).map(([type, count]) => ({
    label: type,
    value: count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));
}

function calculateDemographicsStats(responses: any[]) {
  const ageRanges: { [key: string]: number } = {};
  const educationLevels: { [key: string]: number } = {};

  responses.forEach(response => {
    try {
      const basicInfo = JSON.parse(response.basic_info || '{}');
      const ageRange = basicInfo.ageRange || 'unknown';
      const educationLevel = basicInfo.educationLevel || 'unknown';

      ageRanges[ageRange] = (ageRanges[ageRange] || 0) + 1;
      educationLevels[educationLevel] = (educationLevels[educationLevel] || 0) + 1;
    } catch (e) {
      console.warn('Failed to parse basic info data:', e);
    }
  });

  const total = responses.length;
  const ageStats = Object.entries(ageRanges).map(([range, count]) => ({
    dimension: 'age_range',
    label: range,
    value: count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));

  const educationStats = Object.entries(educationLevels).map(([level, count]) => ({
    dimension: 'education_level',
    label: level,
    value: count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }));

  return [...ageStats, ...educationStats];
}

export function createQuestionnaireV2Routes() {
  const questionnaireV2 = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  /**
   * @swagger
   * /api/questionnaire-v2/questionnaires/{questionnaireId}:
   *   get:
   *     summary: 获取问卷2定义
   *     tags: [Questionnaire V2]
   *     parameters:
   *       - in: path
   *         name: questionnaireId
   *         required: true
   *         schema:
   *           type: string
   *         description: 问卷2 ID
   *     responses:
   *       200:
   *         description: 问卷2定义获取成功
   *       404:
   *         description: 问卷2不存在
   */
  questionnaireV2.get('/questionnaires/:questionnaireId', async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      console.log('Getting questionnaire V2:', questionnaireId);

      const questionnaire = questionnaireV2ConfigManager.getDefinition(questionnaireId);

      if (questionnaire) {
        return c.json({
          success: true,
          data: questionnaire,
          message: '获取问卷2定义成功',
          systemInfo: questionnaireV2ConfigManager.getSystemInfo()
        });
      } else {
        return c.json({
          success: false,
          error: 'Questionnaire V2 not found',
          message: '问卷2不存在'
        }, 404);
      }
    } catch (error) {
      console.error('获取问卷2失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷2失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/submit:
   *   post:
   *     summary: 提交问卷2响应
   *     tags: [Questionnaire V2]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - questionnaireId
   *               - sectionResponses
   *               - metadata
   *             properties:
   *               questionnaireId:
   *                 type: string
   *               sectionResponses:
   *                 type: array
   *                 items:
   *                   type: object
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: 问卷2提交成功
   *       400:
   *         description: 数据验证失败
   */
  questionnaireV2.post('/submit', optionalAuthMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const { questionnaireId, sectionResponses, metadata } = body;

      console.log('Submitting questionnaire V2:', questionnaireId);

      // 验证问卷2 ID
      if (!questionnaireV2ConfigManager.isValidId(questionnaireId)) {
        return c.json({
          success: false,
          error: 'Invalid Questionnaire V2 ID',
          message: '无效的问卷2 ID'
        }, 400);
      }

      // 验证数据格式
      const validation = questionnaireV2ConfigManager.validateResponseData(questionnaireId, body);
      if (!validation.isValid) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '数据验证失败',
          details: validation.errors
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user'); // 可能为空（匿名提交）

      // 生成UUID
      const responseId = crypto.randomUUID();

      // 插入问卷2数据到专用表
      const result = await db.execute(
        `INSERT INTO universal_questionnaire_responses 
         (id, questionnaire_id, user_uuid, section_responses, metadata, completion_status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          responseId,
          questionnaireId,
          user?.uuid || null,
          JSON.stringify(sectionResponses),
          JSON.stringify(metadata),
          'completed'
        ]
      );

      if (!result.success) {
        throw new Error('Failed to insert questionnaire V2');
      }

      // 获取插入的问卷数据
      const newQuestionnaire = await db.queryFirst(
        'SELECT * FROM universal_questionnaire_responses WHERE id = ?',
        [responseId]
      );

      return c.json({
        success: true,
        data: {
          id: responseId,
          questionnaire: newQuestionnaire,
          systemVersion: 'v2'
        },
        message: '问卷2提交成功'
      });

    } catch (error) {
      console.error('提交问卷2失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '提交问卷2失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/responses:
   *   get:
   *     summary: 获取问卷2响应列表
   *     tags: [Questionnaire V2]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: 问卷2响应列表获取成功
   */
  questionnaireV2.get('/responses', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');
      const status = c.req.query('status');

      const db = createDatabaseService(c.env as Env);

      // 构建查询条件
      let whereClause = '1=1';
      const params: any[] = [];

      // 根据用户角色过滤数据
      if (user.role === 'user') {
        whereClause += ' AND user_uuid = ?';
        params.push(user.uuid);
      }

      if (status) {
        whereClause += ' AND completion_status = ?';
        params.push(status);
      }

      // 获取总数
      const countResult = await db.queryFirst<{ count: number }>(
        `SELECT COUNT(*) as count FROM universal_questionnaire_responses WHERE ${whereClause}`,
        params
      );

      const total = countResult?.count || 0;

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const questionnaires = await db.queryAll(
        `SELECT * FROM universal_questionnaire_responses WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      return c.json({
        success: true,
        data: {
          questionnaires,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          },
          systemVersion: 'v2'
        },
        message: '获取问卷2响应列表成功'
      });

    } catch (error) {
      console.error('获取问卷2响应列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷2响应列表失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/responses/{id}:
   *   get:
   *     summary: 获取问卷2响应详情
   *     tags: [Questionnaire V2]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 响应ID
   *     responses:
   *       200:
   *         description: 问卷2响应详情获取成功
   *       404:
   *         description: 响应不存在
   */
  questionnaireV2.get('/responses/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const user = c.get('user');
      const db = createDatabaseService(c.env as Env);

      let sql = 'SELECT * FROM universal_questionnaire_responses WHERE id = ?';
      const params = [id];

      // 普通用户只能查看自己的问卷
      if (user.role === 'user') {
        sql += ' AND user_uuid = ?';
        params.push(user.uuid);
      }

      const questionnaire = await db.queryFirst(sql, params);

      if (!questionnaire) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '问卷2响应不存在或无权访问'
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          questionnaire,
          systemVersion: 'v2'
        },
        message: '获取问卷2响应详情成功'
      });

    } catch (error) {
      console.error('获取问卷2响应详情失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷2响应详情失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/analytics/{questionnaireId}:
   *   get:
   *     summary: 获取问卷2可视化分析数据
   *     tags: [Questionnaire V2 Analytics]
   *     parameters:
   *       - in: path
   *         name: questionnaireId
   *         required: true
   *         schema:
   *           type: string
   *         description: 问卷2 ID
   *       - in: query
   *         name: include_test_data
   *         schema:
   *           type: boolean
   *         description: 是否包含测试数据
   *     responses:
   *       200:
   *         description: 可视化数据获取成功
   */
  questionnaireV2.get('/analytics/:questionnaireId', async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      const includeTestData = c.req.query('include_test_data') === 'true';
      const db = createDatabaseService(c.env as Env);

      console.log('Getting questionnaire V2 analytics:', questionnaireId, 'includeTestData:', includeTestData);

      // 获取基础统计数据
      const totalResponsesQuery = includeTestData
        ? `SELECT COUNT(*) as total FROM questionnaire_v2_responses WHERE questionnaire_id = ?`
        : `SELECT COUNT(*) as total FROM questionnaire_v2_responses WHERE questionnaire_id = ? AND is_test_data = 0`;

      const totalResult = await db.queryFirst<{total: number}>(totalResponsesQuery, [questionnaireId]);
      const totalResponses = totalResult?.total || 0;

      // 直接从原始数据计算统计（简化版本）
      const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';

      // 获取所有响应数据
      const responsesQuery = `
        SELECT basic_info, economic_pressure_data, employment_confidence_data, modern_debt_data
        FROM questionnaire_v2_responses
        WHERE questionnaire_id = ? AND status = 'completed' ${testDataFilter}
      `;

      const responses = await db.query(responsesQuery, [questionnaireId]);

      // 计算经济压力分布
      const economicPressureStats = calculateEconomicPressureStats(responses);

      // 计算就业信心分布
      const employmentConfidenceStats = calculateEmploymentConfidenceStats(responses);

      // 计算现代负债分布
      const modernDebtStats = calculateModernDebtStats(responses);

      // 计算基础信息分布
      const demographicsStats = calculateDemographicsStats(responses);

      const analyticsData = {
        questionnaireId,
        totalResponses,
        lastUpdated: new Date().toISOString(),
        charts: {
          economicPressure: {
            totalResponses,
            distribution: economicPressureStats,
            insights: ['经济压力是影响就业信心的重要因素', '不同年龄段的经济压力表现差异明显']
          },
          employmentConfidence: {
            totalResponses,
            distribution: employmentConfidenceStats,
            insights: ['短期就业信心普遍高于长期信心', '教育背景显著影响就业信心水平']
          },
          modernDebt: {
            totalResponses,
            distribution: modernDebtStats,
            insights: ['现代负债形式多样化', '学生贷款仍是主要负债来源']
          },
          demographics: {
            totalResponses,
            distribution: demographicsStats
          }
        },
        summary: {
          total_responses: totalResponses,
          completion_rate: 0.85,
          avg_economic_pressure: 3.2,
          avg_employment_confidence: 3.5,
          avg_debt_burden: 2.8
        }
      };

      return c.json({
        success: true,
        data: analyticsData,
        message: '问卷2可视化数据获取成功'
      });

    } catch (error) {
      console.error('Error getting questionnaire V2 analytics:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取可视化数据失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/test-data:
   *   get:
   *     summary: 测试问卷2数据
   *     tags: [Questionnaire V2 Test]
   *     responses:
   *       200:
   *         description: 测试数据获取成功
   */
  questionnaireV2.get('/test-data', async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 获取基础数据
      const totalResult = await db.queryFirst<{total: number}>(`SELECT COUNT(*) as total FROM questionnaire_v2_responses`);
      const sampleData = await db.query(`SELECT * FROM questionnaire_v2_responses LIMIT 2`);

      return c.json({
        success: true,
        data: {
          totalResponses: totalResult?.total || 0,
          sampleData: sampleData || [],
          message: '问卷2数据测试成功'
        }
      });

    } catch (error) {
      console.error('Error testing questionnaire V2 data:', error);
      return c.json({
        success: false,
        error: error.message || 'Internal Server Error',
        message: '测试数据获取失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/calculate-stats:
   *   post:
   *     summary: 计算问卷2统计数据
   *     tags: [Questionnaire V2 Analytics]
   *     parameters:
   *       - in: query
   *         name: include_test_data
   *         schema:
   *           type: boolean
   *         description: 是否包含测试数据
   *     responses:
   *       200:
   *         description: 统计数据计算成功
   */
  questionnaireV2.post('/calculate-stats', async (c) => {
    try {
      const includeTestData = c.req.query('include_test_data') === 'true';
      const db = createDatabaseService(c.env as Env);
      const calculator = new Questionnaire2StatsCalculator(db);

      console.log('🔄 开始计算问卷2统计数据, includeTestData:', includeTestData);

      await calculator.calculateAllStats(includeTestData);

      return c.json({
        success: true,
        message: '问卷2统计数据计算完成',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error calculating questionnaire V2 stats:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '统计数据计算失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v2/system-info:
   *   get:
   *     summary: 获取问卷2系统信息
   *     tags: [Questionnaire V2]
   *     responses:
   *       200:
   *         description: 系统信息获取成功
   */
  questionnaireV2.get('/system-info', async (c) => {
    try {
      const systemInfo = questionnaireV2ConfigManager.getSystemInfo();
      const availableIds = questionnaireV2ConfigManager.getAvailableIds();
      const versions = questionnaireV2ConfigManager.getAllVersions();
      const economicQuestions = questionnaireV2ConfigManager.getEconomicQuestions('questionnaire-v2-2024');

      return c.json({
        success: true,
        data: {
          systemInfo,
          availableQuestionnaires: availableIds,
          versions,
          economicQuestions
        },
        message: '获取问卷2系统信息成功'
      });
    } catch (error) {
      console.error('获取问卷2系统信息失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷2系统信息失败'
      }, 500);
    }
  });

  return questionnaireV2;
}

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

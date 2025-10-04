/**
 * 问卷1独立路由系统
 * 完全独立的API路由，与问卷2无任何依赖关系
 * 专用于传统问卷系统
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { questionnaireV1ConfigManager } from '../data/questionnaire1/config';

export function createQuestionnaireV1Routes() {
  const questionnaireV1 = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  /**
   * @swagger
   * /api/questionnaire-v1/definition/{questionnaireId}:
   *   get:
   *     summary: 获取问卷1定义
   *     tags: [Questionnaire V1]
   *     parameters:
   *       - in: path
   *         name: questionnaireId
   *         required: true
   *         schema:
   *           type: string
   *         description: 问卷1 ID
   *     responses:
   *       200:
   *         description: 问卷1定义获取成功
   *       404:
   *         description: 问卷1不存在
   */
  questionnaireV1.get('/definition/:questionnaireId', async (c) => {
    try {
      const questionnaireId = c.req.param('questionnaireId');
      console.log('Getting questionnaire V1:', questionnaireId);

      const questionnaire = questionnaireV1ConfigManager.getDefinition(questionnaireId);

      if (questionnaire) {
        return c.json({
          success: true,
          data: questionnaire,
          message: '获取问卷1定义成功',
          systemInfo: questionnaireV1ConfigManager.getSystemInfo()
        });
      } else {
        return c.json({
          success: false,
          error: 'Questionnaire V1 not found',
          message: '问卷1不存在'
        }, 404);
      }
    } catch (error) {
      console.error('获取问卷1失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷1失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v1/submit:
   *   post:
   *     summary: 提交问卷1响应
   *     tags: [Questionnaire V1]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - questionnaireId
   *               - personalInfo
   *               - educationInfo
   *               - employmentInfo
   *             properties:
   *               questionnaireId:
   *                 type: string
   *               personalInfo:
   *                 type: object
   *               educationInfo:
   *                 type: object
   *               employmentInfo:
   *                 type: object
   *               jobSearchInfo:
   *                 type: object
   *     responses:
   *       200:
   *         description: 问卷1提交成功
   *       400:
   *         description: 数据验证失败
   */
  questionnaireV1.post('/submit', optionalAuthMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const {
        questionnaireId,
        personalInfo,
        educationInfo,
        employmentInfo,
        jobSearchInfo,
        employmentStatus
      } = body;

      console.log('Submitting questionnaire V1:', questionnaireId);

      // 验证问卷1 ID
      if (!questionnaireV1ConfigManager.isValidId(questionnaireId)) {
        return c.json({
          success: false,
          error: 'Invalid Questionnaire V1 ID',
          message: '无效的问卷1 ID'
        }, 400);
      }

      // 验证数据格式
      const validation = questionnaireV1ConfigManager.validateResponseData(questionnaireId, body);
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

      // 插入问卷1数据到专用表
      const result = await db.execute(
        `INSERT INTO questionnaire_responses 
         (user_id, personal_info, education_info, employment_info, job_search_info, employment_status, status, questionnaire_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user?.id || null,
          JSON.stringify(personalInfo),
          JSON.stringify(educationInfo),
          JSON.stringify(employmentInfo),
          JSON.stringify(jobSearchInfo || {}),
          JSON.stringify(employmentStatus || {}),
          'pending',
          questionnaireId
        ]
      );

      if (!result.success) {
        throw new Error('Failed to insert questionnaire V1');
      }

      // 获取插入的问卷数据
      const newQuestionnaire = await db.queryFirst(
        'SELECT * FROM questionnaire_responses WHERE rowid = ?',
        [result.meta.last_row_id]
      );

      return c.json({
        success: true,
        data: {
          id: result.meta.last_row_id,
          questionnaire: newQuestionnaire,
          systemVersion: 'v1'
        },
        message: '问卷1提交成功'
      });

    } catch (error) {
      console.error('提交问卷1失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '提交问卷1失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v1/responses:
   *   get:
   *     summary: 获取问卷1响应列表
   *     tags: [Questionnaire V1]
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
   *         description: 问卷1响应列表获取成功
   */
  questionnaireV1.get('/responses', authMiddleware, async (c) => {
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
        whereClause += ' AND user_id = ?';
        params.push(user.id);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      // 获取总数
      const countResult = await db.queryFirst<{ count: number }>(
        `SELECT COUNT(*) as count FROM questionnaire_responses WHERE ${whereClause}`,
        params
      );

      const total = countResult?.count || 0;

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const questionnaires = await db.queryAll(
        `SELECT * FROM questionnaire_responses WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
          systemVersion: 'v1'
        },
        message: '获取问卷1响应列表成功'
      });

    } catch (error) {
      console.error('获取问卷1响应列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷1响应列表失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v1/responses/{id}:
   *   get:
   *     summary: 获取问卷1响应详情
   *     tags: [Questionnaire V1]
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
   *         description: 问卷1响应详情获取成功
   *       404:
   *         description: 响应不存在
   */
  questionnaireV1.get('/responses/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const user = c.get('user');
      const db = createDatabaseService(c.env as Env);

      let sql = 'SELECT * FROM questionnaire_responses WHERE id = ?';
      const params = [id];

      // 普通用户只能查看自己的问卷
      if (user.role === 'user') {
        sql += ' AND user_id = ?';
        params.push(String(user.id));
      }

      const questionnaire = await db.queryFirst(sql, params);

      if (!questionnaire) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '问卷1响应不存在或无权访问'
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          questionnaire,
          systemVersion: 'v1'
        },
        message: '获取问卷1响应详情成功'
      });

    } catch (error) {
      console.error('获取问卷1响应详情失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷1响应详情失败'
      }, 500);
    }
  });

  /**
   * @swagger
   * /api/questionnaire-v1/system-info:
   *   get:
   *     summary: 获取问卷1系统信息
   *     tags: [Questionnaire V1]
   *     responses:
   *       200:
   *         description: 系统信息获取成功
   */
  questionnaireV1.get('/system-info', async (c) => {
    try {
      const systemInfo = questionnaireV1ConfigManager.getSystemInfo();
      const availableIds = questionnaireV1ConfigManager.getAvailableIds();
      const versions = questionnaireV1ConfigManager.getAllVersions();

      return c.json({
        success: true,
        data: {
          systemInfo,
          availableQuestionnaires: availableIds,
          versions
        },
        message: '获取问卷1系统信息成功'
      });
    } catch (error) {
      console.error('获取问卷1系统信息失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取问卷1系统信息失败'
      }, 500);
    }
  });

  return questionnaireV1;
}

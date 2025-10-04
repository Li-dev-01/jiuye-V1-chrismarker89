/**
 * 第二问卷API路由 - 完全独立的路由系统
 * 与第一问卷API完全隔离，仅共用用户认证中间件
 */

import { Hono } from 'hono';
// import { authMiddleware } from '../middleware/auth';
// import { createDatabaseService } from '../db';
import { secondQuestionnaire2024 } from '../data/secondQuestionnaire2024';
// import type { Env } from '../types/env';

const secondQuestionnaireRoutes = new Hono();

/**
 * @swagger
 * /api/second-questionnaire/definition:
 *   get:
 *     summary: 获取第二问卷定义
 *     tags: [Second Questionnaire]
 *     responses:
 *       200:
 *         description: 问卷定义获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 */
secondQuestionnaireRoutes.get('/definition', async (c) => {
  try {
    console.log('获取第二问卷定义');
    
    return c.json({
      success: true,
      data: secondQuestionnaire2024,
      message: '获取第二问卷定义成功'
    });
  } catch (error) {
    console.error('获取第二问卷定义失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取问卷定义失败'
    }, 500);
  }
});

/**
 * @swagger
 * /api/second-questionnaire/responses:
 *   post:
 *     summary: 提交第二问卷响应
 *     tags: [Second Questionnaire]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionnaire_id
 *               - participant_group
 *               - basic_demographics
 *               - employment_status
 *               - unemployment_reasons
 *               - job_search_behavior
 *               - psychological_state
 *               - support_needs
 *             properties:
 *               questionnaire_id:
 *                 type: string
 *                 example: "employment-survey-2024-v2"
 *               participant_group:
 *                 type: string
 *                 enum: [fresh_graduate, junior_professional, senior_professional]
 *               basic_demographics:
 *                 type: string
 *                 description: "JSON格式的基础人口统计数据"
 *               employment_status:
 *                 type: string
 *                 description: "JSON格式的就业状态数据"
 *               unemployment_reasons:
 *                 type: string
 *                 description: "JSON格式的失业原因数据"
 *               job_search_behavior:
 *                 type: string
 *                 description: "JSON格式的求职行为数据"
 *               psychological_state:
 *                 type: string
 *                 description: "JSON格式的心理状态数据"
 *               support_needs:
 *                 type: string
 *                 description: "JSON格式的支持需求数据"
 *               group_specific_data:
 *                 type: string
 *                 description: "JSON格式的群体特定数据"
 *               user_experience_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               technical_feedback:
 *                 type: string
 */
secondQuestionnaireRoutes.post('/responses', authMiddleware, async (c) => {
  try {
    const requestBody = await c.req.json();
    const user = c.get('user');
    const db = createDatabaseService(c.env);
    
    console.log('第二问卷提交请求:', {
      userId: user.uuid,
      participantGroup: requestBody.participant_group
    });
    
    // 验证必填字段
    const requiredFields = [
      'questionnaire_id',
      'participant_group', 
      'basic_demographics',
      'employment_status',
      'unemployment_reasons',
      'job_search_behavior',
      'psychological_state',
      'support_needs'
    ];
    
    for (const field of requiredFields) {
      if (!requestBody[field]) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: `缺少必填字段: ${field}`
        }, 400);
      }
    }
    
    // 验证participant_group值
    const validGroups = ['fresh_graduate', 'junior_professional', 'senior_professional'];
    if (!validGroups.includes(requestBody.participant_group)) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '无效的参与者分组'
      }, 400);
    }
    
    // 生成响应ID
    const responseId = crypto.randomUUID();
    const currentTime = new Date().toISOString();
    
    // 插入数据到第二问卷专用表（使用snake_case字段名）
    await db.query(`
      INSERT INTO second_questionnaire_responses (
        id, questionnaire_id, user_uuid, session_id, participant_group,
        basic_demographics, employment_status, unemployment_reasons,
        job_search_behavior, psychological_state, support_needs,
        group_specific_data, response_time_seconds, user_experience_rating,
        technical_feedback, started_at, submitted_at, is_completed, is_valid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      requestBody.questionnaire_id,
      user.uuid,
      requestBody.session_id || crypto.randomUUID(),
      requestBody.participant_group,
      JSON.stringify(requestBody.basic_demographics),
      JSON.stringify(requestBody.employment_status), 
      JSON.stringify(requestBody.unemployment_reasons),
      JSON.stringify(requestBody.job_search_behavior),
      JSON.stringify(requestBody.psychological_state),
      JSON.stringify(requestBody.support_needs),
      JSON.stringify(requestBody.group_specific_data || {}),
      requestBody.response_time_seconds || 0,
      requestBody.user_experience_rating || null,
      requestBody.technical_feedback || null,
      requestBody.started_at || currentTime,
      currentTime,
      1, // is_completed
      1  // is_valid
    ]);
    
    console.log('第二问卷提交成功:', responseId);
    
    return c.json({
      success: true,
      data: { 
        response_id: responseId,
        questionnaire_id: requestBody.questionnaire_id,
        participant_group: requestBody.participant_group,
        submitted_at: currentTime
      },
      message: '第二问卷提交成功'
    });
    
  } catch (error) {
    console.error('第二问卷提交失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error', 
      message: '问卷提交失败'
    }, 500);
  }
});

/**
 * @swagger
 * /api/second-questionnaire/responses/{id}:
 *   get:
 *     summary: 获取第二问卷响应详情
 *     tags: [Second Questionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 响应ID
 */
secondQuestionnaireRoutes.get('/responses/:id', authMiddleware, async (c) => {
  try {
    const responseId = c.req.param('id');
    const user = c.get('user');
    const db = createDatabaseService(c.env);
    
    // 查询第二问卷响应
    const response = await db.queryFirst(`
      SELECT * FROM second_questionnaire_responses 
      WHERE id = ? AND user_uuid = ?
    `, [responseId, user.uuid]);
    
    if (!response) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '问卷响应不存在或无权访问'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: response,
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

/**
 * @swagger
 * /api/second-questionnaire/responses:
 *   get:
 *     summary: 获取用户的第二问卷响应列表
 *     tags: [Second Questionnaire]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 */
secondQuestionnaireRoutes.get('/responses', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('page_size') || '20');
    const offset = (page - 1) * pageSize;
    const db = createDatabaseService(c.env);
    
    // 查询用户的第二问卷响应列表
    const responses = await db.query(`
      SELECT 
        id, questionnaire_id, participant_group, 
        user_experience_rating, submitted_at, created_at
      FROM second_questionnaire_responses 
      WHERE user_uuid = ? AND is_completed = 1
      ORDER BY submitted_at DESC
      LIMIT ? OFFSET ?
    `, [user.uuid, pageSize, offset]);
    
    // 获取总数
    const totalResult = await db.queryFirst(`
      SELECT COUNT(*) as total 
      FROM second_questionnaire_responses 
      WHERE user_uuid = ? AND is_completed = 1
    `, [user.uuid]);
    
    const total = totalResult?.total || 0;
    
    return c.json({
      success: true,
      data: {
        responses,
        pagination: {
          page,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize)
        }
      },
      message: '获取问卷响应列表成功'
    });
    
  } catch (error) {
    console.error('获取问卷响应列表失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取问卷响应列表失败'
    }, 500);
  }
});

export { secondQuestionnaireRoutes };

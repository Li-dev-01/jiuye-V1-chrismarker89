/**
 * 用户画像管理路由
 * 提供用户标签和情绪统计的管理接口
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const userProfileManagement = new Hono<{ Bindings: Env }>();

/**
 * @swagger
 * /api/admin/user-profile/tag-statistics:
 *   get:
 *     summary: 获取用户标签统计
 *     tags: [Admin - User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: questionnaire_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 问卷ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 标签分类（可选）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回数量限制（可选）
 *     responses:
 *       200:
 *         description: 标签统计数据
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
userProfileManagement.get('/tag-statistics', adminAuthMiddleware, async (c) => {
  try {
    const questionnaireId = c.req.query('questionnaire_id');
    const category = c.req.query('category');
    const limit = c.req.query('limit');

    if (!questionnaireId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '问卷ID不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    // 构建查询
    let query = `
      SELECT * FROM questionnaire_tag_statistics
      WHERE questionnaire_id = ?
    `;
    const params: any[] = [questionnaireId];

    if (category) {
      query += ` AND tag_category = ?`;
      params.push(category);
    }

    query += ` ORDER BY count DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const result = await db.db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results || [],
      message: '标签统计获取成功'
    });

  } catch (error: any) {
    console.error('获取标签统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取标签统计失败'
    }, 500);
  }
});

/**
 * @swagger
 * /api/admin/user-profile/emotion-statistics:
 *   get:
 *     summary: 获取情绪统计
 *     tags: [Admin - User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: questionnaire_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 问卷ID
 *     responses:
 *       200:
 *         description: 情绪统计数据
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
userProfileManagement.get('/emotion-statistics', adminAuthMiddleware, async (c) => {
  try {
    const questionnaireId = c.req.query('questionnaire_id');

    if (!questionnaireId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '问卷ID不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    const result = await db.db.prepare(`
      SELECT * FROM questionnaire_emotion_statistics
      WHERE questionnaire_id = ?
      ORDER BY count DESC
    `).bind(questionnaireId).all();

    return c.json({
      success: true,
      data: result.results || [],
      message: '情绪统计获取成功'
    });

  } catch (error: any) {
    console.error('获取情绪统计失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取情绪统计失败'
    }, 500);
  }
});

/**
 * @swagger
 * /api/admin/user-profile/overview:
 *   get:
 *     summary: 获取用户画像概览
 *     tags: [Admin - User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: questionnaire_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 问卷ID
 *     responses:
 *       200:
 *         description: 用户画像概览数据
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
userProfileManagement.get('/overview', adminAuthMiddleware, async (c) => {
  try {
    const questionnaireId = c.req.query('questionnaire_id');

    if (!questionnaireId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '问卷ID不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    // 获取总响应数
    const totalResponses = await db.db.prepare(`
      SELECT COUNT(*) as count
      FROM universal_questionnaire_responses
      WHERE questionnaire_id = ? AND is_completed = 1
    `).bind(questionnaireId).first();

    // 获取标签统计
    const tagStats = await db.db.prepare(`
      SELECT 
        COUNT(*) as total_tags,
        COUNT(DISTINCT tag_category) as total_categories,
        SUM(count) as total_tag_assignments
      FROM questionnaire_tag_statistics
      WHERE questionnaire_id = ?
    `).bind(questionnaireId).first();

    // 获取情绪统计
    const emotionStats = await db.db.prepare(`
      SELECT 
        COUNT(*) as total_emotion_types,
        SUM(count) as total_emotion_records
      FROM questionnaire_emotion_statistics
      WHERE questionnaire_id = ?
    `).bind(questionnaireId).first();

    // 获取热门标签（前10）
    const topTags = await db.db.prepare(`
      SELECT tag_name, tag_category, count, percentage
      FROM questionnaire_tag_statistics
      WHERE questionnaire_id = ?
      ORDER BY count DESC
      LIMIT 10
    `).bind(questionnaireId).all();

    // 获取情绪分布
    const emotionDistribution = await db.db.prepare(`
      SELECT emotion_type, count, percentage
      FROM questionnaire_emotion_statistics
      WHERE questionnaire_id = ?
      ORDER BY count DESC
    `).bind(questionnaireId).all();

    return c.json({
      success: true,
      data: {
        totalResponses: totalResponses?.count || 0,
        tagStatistics: {
          totalTags: tagStats?.total_tags || 0,
          totalCategories: tagStats?.total_categories || 0,
          totalAssignments: tagStats?.total_tag_assignments || 0
        },
        emotionStatistics: {
          totalTypes: emotionStats?.total_emotion_types || 0,
          totalRecords: emotionStats?.total_emotion_records || 0
        },
        topTags: topTags.results || [],
        emotionDistribution: emotionDistribution.results || []
      },
      message: '用户画像概览获取成功'
    });

  } catch (error: any) {
    console.error('获取用户画像概览失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取用户画像概览失败'
    }, 500);
  }
});

/**
 * @swagger
 * /api/admin/user-profile/categories:
 *   get:
 *     summary: 获取所有标签分类
 *     tags: [Admin - User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: questionnaire_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 问卷ID
 *     responses:
 *       200:
 *         description: 标签分类列表
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
userProfileManagement.get('/categories', adminAuthMiddleware, async (c) => {
  try {
    const questionnaireId = c.req.query('questionnaire_id');

    if (!questionnaireId) {
      return c.json({
        success: false,
        error: 'Validation Error',
        message: '问卷ID不能为空'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);

    const result = await db.db.prepare(`
      SELECT 
        tag_category,
        COUNT(*) as tag_count,
        SUM(count) as total_assignments
      FROM questionnaire_tag_statistics
      WHERE questionnaire_id = ?
      GROUP BY tag_category
      ORDER BY total_assignments DESC
    `).bind(questionnaireId).all();

    return c.json({
      success: true,
      data: result.results || [],
      message: '标签分类获取成功'
    });

  } catch (error: any) {
    console.error('获取标签分类失败:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取标签分类失败'
    }, 500);
  }
});

export default userProfileManagement;


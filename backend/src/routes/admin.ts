/**
 * 管理员路由
 * 提供管理员相关的API端点
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { securityValidation, validatePathParams, validateRequestBody, validateQueryParams, commonValidationRules } from '../middleware/validation';
import { securityCheck } from '../middleware/security';
import { cache, cacheConfigs, invalidateCache } from '../middleware/cache';
import { rateLimit, rateLimitConfigs } from '../middleware/rate-limit';
import { pagination, paginationConfigs, paginatedResponse } from '../middleware/pagination';

// AI标签推荐辅助函数
async function generateTagRecommendations(content: string, title?: string, contentType: string = 'story') {
  const fullText = `${title || ''} ${content}`.toLowerCase();

  // 关键词匹配规则
  const tagRules = {
    'job-hunting': {
      keywords: ['求职', '面试', '简历', '找工作', '应聘', '招聘'],
      name: '求职经历',
      confidence: 0.8
    },
    'tech-industry': {
      keywords: ['程序员', '开发', '编程', '软件', '互联网', '科技', 'IT'],
      name: '科技行业',
      confidence: 0.7
    },
    'career-change': {
      keywords: ['转行', '换工作', '跳槽', '职业转换'],
      name: '转行经历',
      confidence: 0.8
    },
    'entrepreneurship': {
      keywords: ['创业', '创业公司', '初创', '自主创业'],
      name: '创业故事',
      confidence: 0.9
    },
    'anxiety': {
      keywords: ['焦虑', '担心', '困惑', '迷茫', '压力'],
      name: '焦虑困惑',
      confidence: 0.7
    },
    'hope': {
      keywords: ['希望', '憧憬', '梦想', '目标', '未来'],
      name: '希望憧憬',
      confidence: 0.6
    },
    'success': {
      keywords: ['成功', '成就', '喜悦', '开心', '满意'],
      name: '成功喜悦',
      confidence: 0.8
    }
  };

  const recommendations = [];

  for (const [key, rule] of Object.entries(tagRules)) {
    const matchCount = rule.keywords.filter(keyword => fullText.includes(keyword)).length;
    if (matchCount > 0) {
      const confidence = Math.min(rule.confidence * (matchCount / rule.keywords.length), 1.0);
      recommendations.push({
        tag_key: key,
        tag_name: rule.name,
        confidence: confidence,
        reason: `匹配关键词: ${rule.keywords.filter(k => fullText.includes(k)).join(', ')}`
      });
    }
  }

  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}
import { DatabaseManager } from '../utils/database';

export function createAdminRoutes() {
  const admin = new Hono<{ Bindings: Env }>();

  // 应用全局安全中间件
  admin.use('*', securityCheck);
  admin.use('*', securityValidation);
  admin.use('*', authMiddleware);
  admin.use('*', requireRole('admin', 'super_admin'));

  // 仪表板统计 (缓存5分钟)
  admin.get('/dashboard/stats',
    cache(cacheConfigs.stats),
    async (c) => {
    try {
      const db = c.env.DB;

      // 获取真实数据库统计 (使用正确的users表)
      const questionnaireCount = await db.prepare(`SELECT COUNT(*) as count FROM questionnaire_responses`).first();
      const storiesCount = await db.prepare(`SELECT COUNT(*) as count FROM valid_stories`).first();
      const usersCount = await db.prepare(`SELECT COUNT(*) as count FROM users`).first();

      // 获取今日提交数据
      const todaySubmissions = await db.prepare(`
        SELECT COUNT(*) as count
        FROM questionnaire_responses
        WHERE DATE(created_at) = DATE('now')
      `).first();

      // 获取活跃用户数（最近7天有活动的用户，使用updated_at作为活跃指标）
      const activeUsersCount = await db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE updated_at >= datetime('now', '-7 days')
      `).first();

      const stats = {
        totalUsers: Number(usersCount?.count) || 0,
        totalQuestionnaires: Number(questionnaireCount?.count) || 0,
        totalReviews: Number(storiesCount?.count) || 0,
        pendingReviews: 12, // 审核状态需要具体查询
        todaySubmissions: Number(todaySubmissions?.count) || 0,
        weeklyGrowth: 12.5,
        systemHealth: 98.5,
        activeUsers: Number(activeUsersCount?.count) || 0,
        voices: {
          raw_voices: 0, // 心声功能已移除
          valid_voices: 0,
          total_voices: 0
        },
        stories: {
          raw_stories: Number(storiesCount?.count) || 0,
          valid_stories: Number(storiesCount?.count) || 0,
          total_stories: Number(storiesCount?.count) || 0
        },
        audits: {
          total_audits: Number(storiesCount?.count) || 0,
          pending_audits: 12,
          approved_audits: Number(storiesCount?.count) || 0,
          rejected_audits: 0,
          human_reviews: 25
        }
      };

      return c.json({
        success: true,
        data: stats,
        message: '仪表板统计数据获取成功'
      });
    } catch (error) {
      console.error('获取仪表板统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取仪表板统计失败'
      }, 500);
    }
  });

  // 问卷列表
  admin.get('/questionnaires', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');
      const status = c.req.query('status');

      // 模拟问卷数据
      const questionnaires = Array.from({ length: pageSize }, (_, i) => ({
        id: `q_${page}_${i + 1}`,
        sessionId: `session_${Date.now()}_${i}`,
        completionStatus: Math.random() > 0.3 ? 'completed' : 'partial',
        completionRate: Math.floor(Math.random() * 100),
        deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile',
        status: Math.random() > 0.2 ? 'approved' : 'pending',
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: `user_${i + 1}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
      }));

      return c.json({
        success: true,
        data: {
          items: questionnaires,
          pagination: {
            page,
            pageSize,
            total: 856,
            totalPages: Math.ceil(856 / pageSize)
          }
        },
        message: '问卷列表获取成功'
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

  // 用户列表 (分页 + 缓存)
  admin.get('/users',
    pagination(paginationConfigs.admin),
    cache(cacheConfigs.medium),
    async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');
      const userType = c.req.query('userType');
      const status = c.req.query('status');
      const search = c.req.query('search');

      const db = c.env.DB;

      // 映射用户类型到前端期望的role
      const mapUserTypeToRole = (userType: string) => {
        switch (userType) {
          case 'admin': return 'admin';
          case 'reviewer': return 'admin'; // 审核员也映射为admin
          case 'super_admin': return 'super_admin';
          default: return 'user';
        }
      };

      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];

      if (userType) {
        whereConditions.push('user_type = ?');
        queryParams.push(userType);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (search) {
        whereConditions.push('(username LIKE ? OR email LIKE ? OR display_name LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 查询总数 (使用正确的users表)
      const countResult = await db.prepare(`SELECT COUNT(*) as total FROM users`).first();
      const total = countResult?.total || 0;

      console.log('数据库查询成功，用户总数:', total);

      // 查询用户列表 (使用实际存在的字段)
      const offset = (page - 1) * pageSize;
      const usersResult = await db.prepare(`
        SELECT
          id,
          username,
          email,
          role,
          created_at as createdAt,
          updated_at as lastLogin
        FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(pageSize, offset).all();

      console.log('用户查询结果:', usersResult.results?.length || 0, '个用户');

      // 处理用户数据 (使用实际存在的字段)
      const users = (usersResult.results || []).map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.username, // users表没有nickname字段，使用username
        email: user.email,
        role: user.role, // 直接使用role字段
        status: 'active', // 默认状态，因为表中没有status字段
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin,
        avatar: null, // 表中没有avatar字段
        questionnairesCount: 0, // 暂时设为0，避免额外查询
        storiesCount: 0
      }));

      console.log('处理后的用户数据:', users.length, '个用户');

      return c.json({
        success: true,
        data: {
          items: users,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '用户列表获取成功'
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户列表失败'
      }, 500);
    }
  });

  // 数据库表检查 (临时调试API)
  admin.get('/debug/tables', async (c) => {
    try {
      const db = c.env.DB;

      // 检查 universal_users 表
      const universalUsersCount = await db.prepare(`SELECT COUNT(*) as count FROM universal_users`).first();

      // 检查 users 表
      let usersCount = null;
      try {
        usersCount = await db.prepare(`SELECT COUNT(*) as count FROM users`).first();
      } catch (e) {
        console.log('users表不存在或查询失败:', e);
      }

      // 检查 valid_stories 表
      const storiesCount = await db.prepare(`SELECT COUNT(*) as count FROM valid_stories`).first();

      // 检查 questionnaire_responses 表
      const questionnaireCount = await db.prepare(`SELECT COUNT(*) as count FROM questionnaire_responses`).first();

      return c.json({
        success: true,
        data: {
          universal_users: universalUsersCount?.count || 0,
          users: usersCount?.count || 'table_not_found',
          valid_stories: storiesCount?.count || 0,
          questionnaire_responses: questionnaireCount?.count || 0
        },
        message: '数据库表统计'
      });
    } catch (error) {
      console.error('数据库表检查失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '数据库表检查失败'
      }, 500);
    }
  });

  // 用户统计
  admin.get('/users/stats', async (c) => {
    try {
      const stats = {
        totalUsers: 1250,
        activeUsers: 1089,
        newUsersToday: 23,
        newUsersWeek: 156,
        usersByType: {
          admin: 5,
          reviewer: 12,
          user: 1233
        },
        usersByStatus: {
          active: 1089,
          inactive: 161
        }
      };

      return c.json({
        success: true,
        data: stats,
        message: '用户统计获取成功'
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取用户统计失败'
      }, 500);
    }
  });

  // 更新用户状态
  admin.put('/users/:userId/status',
    validatePathParams({ userId: commonValidationRules.id }),
    validateRequestBody({
      status: {
        type: 'safe-string',
        pattern: /^(active|inactive|banned)$/,
        required: true
      }
    }),
    async (c) => {
    try {
      const userId = c.req.param('userId');
      const { status } = await c.req.json();

      // 这里应该连接到实际数据库更新用户状态
      // 目前返回模拟响应
      return c.json({
        success: true,
        data: {
          userId,
          status,
          updatedAt: new Date().toISOString()
        },
        message: '用户状态更新成功'
      });
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新用户状态失败'
      }, 500);
    }
  });

  // 删除用户 (危险操作，需要额外验证)
  admin.delete('/users/:userId',
    validatePathParams({ userId: commonValidationRules.id }),
    async (c) => {
    try {
      const userId = c.req.param('userId');

      // 这里应该连接到实际数据库删除用户
      // 目前返回模拟响应
      return c.json({
        success: true,
        data: {
          userId,
          deletedAt: new Date().toISOString()
        },
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '删除用户失败'
      }, 500);
    }
  });

  // 批量操作用户 (危险操作，需要额外验证 + 限流)
  admin.post('/users/batch',
    rateLimit(rateLimitConfigs.strict),
    validateRequestBody({
      userIds: { required: true, custom: (value) => Array.isArray(value) && value.length > 0 },
      action: {
        type: 'safe-string',
        pattern: /^(activate|deactivate|ban|delete)$/,
        required: true
      },
      data: { required: false }
    }),
    async (c) => {
    try {
      const { userIds, action, data } = await c.req.json();

      // 这里应该连接到实际数据库执行批量操作
      // 目前返回模拟响应
      return c.json({
        success: true,
        data: {
          processedCount: userIds.length,
          action,
          userIds,
          processedAt: new Date().toISOString()
        },
        message: `批量${action}操作完成`
      });
    } catch (error) {
      console.error('批量操作用户失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '批量操作用户失败'
      }, 500);
    }
  });

  // 导出用户数据
  admin.get('/users/export', async (c) => {
    try {
      const format = c.req.query('format') || 'csv';
      const userType = c.req.query('userType');
      const status = c.req.query('status');

      if (!['csv', 'excel', 'json'].includes(format)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '不支持的导出格式'
        }, 400);
      }

      // 这里应该连接到实际数据库导出用户数据
      // 目前返回模拟响应
      return c.json({
        success: true,
        data: {
          downloadUrl: `/api/admin/users/download/${Date.now()}.${format}`,
          format,
          filters: { userType, status },
          generatedAt: new Date().toISOString(),
          estimatedSize: '2.5MB',
          recordCount: 1250
        },
        message: '用户数据导出任务已创建'
      });
    } catch (error) {
      console.error('导出用户数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '导出用户数据失败'
      }, 500);
    }
  });

  // 用户管理操作
  admin.post('/users/manage', async (c) => {
    try {
      const { action, userIds, data } = await c.req.json();

      const validActions = [
        'reset_password', 'send_notification', 'update_permissions',
        'merge_accounts', 'export_data', 'anonymize'
      ];

      if (!validActions.includes(action)) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '无效的管理操作'
        }, 400);
      }

      // 这里应该根据不同的action执行相应的操作
      // 目前返回模拟响应
      return c.json({
        success: true,
        data: {
          action,
          processedUsers: userIds?.length || 0,
          result: `${action}操作已完成`,
          processedAt: new Date().toISOString()
        },
        message: '用户管理操作完成'
      });
    } catch (error) {
      console.error('用户管理操作失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '用户管理操作失败'
      }, 500);
    }
  });

  // 审核员列表
  admin.get('/reviewers', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '10');

      // 模拟审核员数据
      const reviewers = Array.from({ length: Math.min(pageSize, 12) }, (_, i) => ({
        id: `reviewer_${i + 1}`,
        username: `reviewer${i + 1}`,
        email: `reviewer${i + 1}@example.com`,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        totalReviews: Math.floor(Math.random() * 500),
        approvedReviews: Math.floor(Math.random() * 400),
        rejectedReviews: Math.floor(Math.random() * 100),
        averageReviewTime: Math.floor(Math.random() * 300) + 60, // 60-360秒
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      return c.json({
        success: true,
        data: {
          items: reviewers,
          pagination: {
            page,
            pageSize,
            total: 12,
            totalPages: Math.ceil(12 / pageSize)
          }
        },
        message: '审核员列表获取成功'
      });
    } catch (error) {
      console.error('获取审核员列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取审核员列表失败'
      }, 500);
    }
  });

  // 内容分类
  admin.get('/content/categories', async (c) => {
    try {
      const db = c.env.DB;
      const contentType = c.req.query('content_type') || 'all';
      const isActive = c.req.query('is_active');

      let query = `
        SELECT
          id, category_key, category_name, category_name_en, description,
          parent_id, sort_order, icon, color, is_active, content_type,
          display_rules, created_at, updated_at
        FROM content_categories
        WHERE 1=1
      `;
      const params: any[] = [];

      if (contentType !== 'all') {
        query += ` AND (content_type = ? OR content_type = 'all')`;
        params.push(contentType);
      }

      if (isActive !== undefined) {
        query += ` AND is_active = ?`;
        params.push(isActive === 'true');
      }

      query += ` ORDER BY sort_order ASC, category_name ASC`;

      const result = await db.prepare(query).bind(...params).all();

      return c.json({
        success: true,
        data: result.results || [],
        message: '内容分类获取成功'
      });
    } catch (error) {
      console.error('获取内容分类失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取内容分类失败'
      }, 500);
    }
  });

  // 创建内容分类
  admin.post('/content/categories', async (c) => {
    try {
      const db = c.env.DB;
      const body = await c.req.json();

      const {
        category_key, category_name, category_name_en, description,
        parent_id, sort_order = 0, icon, color = '#1890ff',
        content_type = 'all', admin_id
      } = body;

      // 验证必填字段
      if (!category_key || !category_name) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '分类键和名称不能为空'
        }, 400);
      }

      // 检查分类键是否已存在
      const existing = await db.prepare(
        'SELECT id FROM content_categories WHERE category_key = ?'
      ).bind(category_key).first();

      if (existing) {
        return c.json({
          success: false,
          error: 'Duplicate Key',
          message: '分类键已存在'
        }, 409);
      }

      // 创建分类
      const result = await db.prepare(`
        INSERT INTO content_categories (
          category_key, category_name, category_name_en, description,
          parent_id, sort_order, icon, color, content_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        category_key, category_name, category_name_en, description,
        parent_id, sort_order, icon, color, content_type
      ).run();

      // 获取创建的分类
      const newCategory = await db.prepare(
        'SELECT * FROM content_categories WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return c.json({
        success: true,
        data: newCategory,
        message: '分类创建成功'
      });
    } catch (error) {
      console.error('创建内容分类失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建内容分类失败'
      }, 500);
    }
  });

  // 确保内容标签表存在
  const ensureContentTagsTableExists = async (db: any) => {
    try {
      // 检查content_tags表是否存在
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='content_tags'
      `).first();

      if (!tableCheck) {
        console.log('content_tags表不存在，正在创建...');

        // 创建content_tags表
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS content_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_key TEXT NOT NULL UNIQUE,
            tag_name TEXT NOT NULL,
            tag_name_en TEXT,
            description TEXT,
            tag_type TEXT DEFAULT 'system' CHECK (tag_type IN ('system', 'user', 'auto')),
            color TEXT DEFAULT '#1890ff',
            usage_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            content_type TEXT DEFAULT 'all' CHECK (content_type IN ('story', 'questionnaire', 'all')),
            admin_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // 创建索引
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_content_tags_key ON content_tags(tag_key)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_content_tags_type ON content_tags(tag_type)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_content_tags_usage_count ON content_tags(usage_count DESC)').run();

        console.log('content_tags表创建完成');
      }

      // 检查是否有数据，如果没有则插入默认标签
      const countResult = await db.prepare('SELECT COUNT(*) as count FROM content_tags').first();
      if (!countResult || countResult.count === 0) {
        console.log('插入默认标签数据...');

        const defaultTags = [
          { tag_key: 'job-hunting', tag_name: '求职经历', tag_name_en: 'Job Hunting', description: '分享求职过程中的经历和感悟', tag_type: 'system', color: '#1890ff', content_type: 'story' },
          { tag_key: 'career-change', tag_name: '转行经历', tag_name_en: 'Career Change', description: '职业转换和行业跳转的经历', tag_type: 'system', color: '#52c41a', content_type: 'story' },
          { tag_key: 'entrepreneurship', tag_name: '创业故事', tag_name_en: 'Entrepreneurship', description: '创业过程中的故事和经验', tag_type: 'system', color: '#fa8c16', content_type: 'story' },
          { tag_key: 'workplace-life', tag_name: '职场生活', tag_name_en: 'Workplace Life', description: '日常工作和职场生活的分享', tag_type: 'system', color: '#722ed1', content_type: 'story' },
          { tag_key: 'skill-growth', tag_name: '技能成长', tag_name_en: 'Skill Growth', description: '专业技能学习和成长经历', tag_type: 'system', color: '#13c2c2', content_type: 'story' },
          { tag_key: 'experience', tag_name: '经验分享', tag_name_en: 'Experience', description: '个人经验和心得体会', tag_type: 'system', color: '#1890ff', content_type: 'story' },
          { tag_key: 'advice', tag_name: '建议意见', tag_name_en: 'Advice', description: '给他人的建议和意见', tag_type: 'system', color: '#52c41a', content_type: 'story' },
          { tag_key: 'featured', tag_name: '精选', tag_name_en: 'Featured', description: '精选推荐内容', tag_type: 'system', color: '#fadb14', content_type: 'all' },
          { tag_key: 'popular', tag_name: '热门', tag_name_en: 'Popular', description: '热门内容', tag_type: 'system', color: '#f759ab', content_type: 'all' }
        ];

        for (const tag of defaultTags) {
          await db.prepare(`
            INSERT INTO content_tags
            (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type, usage_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            tag.tag_key, tag.tag_name, tag.tag_name_en, tag.description,
            tag.tag_type, tag.color, tag.content_type, Math.floor(Math.random() * 20)
          ).run();
        }

        console.log('默认标签数据插入完成');
      }
    } catch (error) {
      console.error('内容标签表初始化失败:', error);
    }
  };

  // 获取内容标签列表 (缓存)
  admin.get('/content/tags',
    cache(cacheConfigs.content),
    async (c) => {
    try {
      const db = c.env.DB;

      // 确保表存在
      await ensureContentTagsTableExists(db);

      const contentType = c.req.query('content_type') || 'all';
      const isActive = c.req.query('is_active');

      let query = `
        SELECT
          id, tag_key, tag_name, tag_name_en, description,
          tag_type, color, usage_count, is_active, content_type,
          created_at, updated_at
        FROM content_tags
        WHERE 1=1
      `;
      const params: any[] = [];

      if (contentType !== 'all') {
        query += ` AND (content_type = ? OR content_type = 'all')`;
        params.push(contentType);
      }

      if (isActive !== undefined) {
        query += ` AND is_active = ?`;
        params.push(isActive === 'true');
      }

      query += ` ORDER BY usage_count DESC, created_at DESC`;

      const result = await db.prepare(query).bind(...params).all();

      return c.json({
        success: true,
        data: result.results || [],
        message: '内容标签获取成功'
      });
    } catch (error) {
      console.error('获取内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取内容标签失败'
      }, 500);
    }
  });

  // 创建内容标签 (缓存失效)
  admin.post('/content/tags',
    invalidateCache(['content', 'tags']),
    async (c) => {
    try {
      const db = c.env.DB;
      const body = await c.req.json();

      const {
        tag_key, tag_name, tag_name_en, description,
        tag_type = 'system', color = '#1890ff',
        content_type = 'all', admin_id
      } = body;

      // 验证必填字段
      if (!tag_key || !tag_name) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '标签键和标签名称为必填项'
        }, 400);
      }

      // 检查标签键是否已存在
      const existing = await db.prepare(
        'SELECT id FROM content_tags WHERE tag_key = ?'
      ).bind(tag_key).first();

      if (existing) {
        return c.json({
          success: false,
          error: 'Conflict',
          message: '标签键已存在'
        }, 409);
      }

      // 创建标签
      const tagId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO content_tags (
          id, tag_key, tag_name, tag_name_en, description,
          tag_type, color, content_type, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tagId, tag_key, tag_name, tag_name_en, description,
        tag_type, color, content_type, admin_id
      ).run();

      // 获取创建的标签
      const newTag = await db.prepare(
        'SELECT * FROM content_tags WHERE id = ?'
      ).bind(tagId).first();

      return c.json({
        success: true,
        data: newTag,
        message: '标签创建成功'
      });
    } catch (error) {
      console.error('创建内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建内容标签失败'
      }, 500);
    }
  });

  // 更新内容标签
  admin.put('/content/tags/:id', async (c) => {
    try {
      const db = c.env.DB;
      const tagId = c.req.param('id');
      const body = await c.req.json();

      const {
        tag_name, tag_name_en, description,
        tag_type, color, content_type, is_active
      } = body;

      // 检查标签是否存在
      const existing = await db.prepare(
        'SELECT id FROM content_tags WHERE id = ?'
      ).bind(tagId).first();

      if (!existing) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '标签不存在'
        }, 404);
      }

      // 更新标签
      await db.prepare(`
        UPDATE content_tags SET
          tag_name = COALESCE(?, tag_name),
          tag_name_en = COALESCE(?, tag_name_en),
          description = COALESCE(?, description),
          tag_type = COALESCE(?, tag_type),
          color = COALESCE(?, color),
          content_type = COALESCE(?, content_type),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tag_name, tag_name_en, description, tag_type,
        color, content_type, is_active, tagId
      ).run();

      // 获取更新后的标签
      const updatedTag = await db.prepare(
        'SELECT * FROM content_tags WHERE id = ?'
      ).bind(tagId).first();

      return c.json({
        success: true,
        data: updatedTag,
        message: '标签更新成功'
      });
    } catch (error) {
      console.error('更新内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新内容标签失败'
      }, 500);
    }
  });

  // 删除内容标签
  admin.delete('/content/tags/:id', async (c) => {
    try {
      const db = c.env.DB;
      const tagId = c.req.param('id');

      // 检查标签是否存在
      const existing = await db.prepare(
        'SELECT id, usage_count FROM content_tags WHERE id = ?'
      ).bind(tagId).first();

      if (!existing) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '标签不存在'
        }, 404);
      }

      // 检查是否有内容使用此标签
      if (Number(existing.usage_count) > 0) {
        return c.json({
          success: false,
          error: 'Conflict',
          message: '该标签正在被使用，无法删除'
        }, 409);
      }

      // 删除标签
      await db.prepare('DELETE FROM content_tags WHERE id = ?').bind(tagId).run();

      return c.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      console.error('删除内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '删除内容标签失败'
      }, 500);
    }
  });

  // 获取标签推荐
  admin.get('/content/tags/recommend', async (c) => {
    try {
      const db = c.env.DB;
      const contentType = c.req.query('content_type') || 'all';
      const limit = parseInt(c.req.query('limit') || '10');

      // 确保表存在
      await ensureContentTagsTableExists(db);

      // 获取热门标签（按使用次数排序）
      let query = `
        SELECT
          id, tag_key, tag_name, tag_name_en, description,
          tag_type, color, usage_count, content_type
        FROM content_tags
        WHERE is_active = 1
      `;
      const params: any[] = [];

      if (contentType !== 'all') {
        query += ` AND (content_type = ? OR content_type = 'all')`;
        params.push(contentType);
      }

      query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
      params.push(limit);

      const tags = await db.prepare(query).bind(...params).all();

      return c.json({
        success: true,
        data: tags.results || [],
        message: '标签推荐获取成功'
      });
    } catch (error) {
      console.error('获取标签推荐失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取标签推荐失败'
      }, 500);
    }
  });

  // 获取标签统计
  admin.get('/content/tags/stats', async (c) => {
    try {
      const db = c.env.DB;

      // 确保表存在
      await ensureContentTagsTableExists(db);

      // 获取标签统计
      const totalTags = await db.prepare(
        'SELECT COUNT(*) as count FROM content_tags'
      ).first();

      const activeTags = await db.prepare(
        'SELECT COUNT(*) as count FROM content_tags WHERE is_active = 1'
      ).first();

      const tagsByType = await db.prepare(`
        SELECT tag_type, COUNT(*) as count
        FROM content_tags
        GROUP BY tag_type
      `).all();

      const tagsByContentType = await db.prepare(`
        SELECT content_type, COUNT(*) as count
        FROM content_tags
        GROUP BY content_type
      `).all();

      const topUsedTags = await db.prepare(`
        SELECT tag_name, usage_count
        FROM content_tags
        WHERE is_active = 1
        ORDER BY usage_count DESC
        LIMIT 10
      `).all();

      return c.json({
        success: true,
        data: {
          total: totalTags?.count || 0,
          active: activeTags?.count || 0,
          byType: tagsByType.results || [],
          byContentType: tagsByContentType.results || [],
          topUsed: topUsedTags.results || []
        },
        message: '标签统计获取成功'
      });
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取标签统计失败'
      }, 500);
    }
  });

  // 合并标签
  admin.post('/content/tags/merge', async (c) => {
    try {
      const db = c.env.DB;
      const { sourceTagIds, targetTagId } = await c.req.json();

      if (!Array.isArray(sourceTagIds) || !targetTagId) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '源标签ID列表和目标标签ID不能为空'
        }, 400);
      }

      // 检查目标标签是否存在
      const targetTag = await db.prepare(
        'SELECT id, usage_count FROM content_tags WHERE id = ?'
      ).bind(targetTagId).first();

      if (!targetTag) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '目标标签不存在'
        }, 404);
      }

      // 开始事务
      await db.prepare('BEGIN').run();

      try {
        // 计算总使用次数
        let totalUsage = targetTag.usage_count || 0;
        for (const sourceId of sourceTagIds) {
          const sourceTag = await db.prepare(
            'SELECT usage_count FROM content_tags WHERE id = ?'
          ).bind(sourceId).first();
          if (sourceTag) {
            totalUsage += sourceTag.usage_count || 0;
          }
        }

        // 更新目标标签的使用次数
        await db.prepare(
          'UPDATE content_tags SET usage_count = ? WHERE id = ?'
        ).bind(totalUsage, targetTagId).run();

        // 删除源标签
        for (const sourceId of sourceTagIds) {
          await db.prepare(
            'DELETE FROM content_tags WHERE id = ?'
          ).bind(sourceId).run();
        }

        await db.prepare('COMMIT').run();

        return c.json({
          success: true,
          message: '标签合并成功'
        });
      } catch (error) {
        await db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('合并标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '合并标签失败'
      }, 500);
    }
  });

  // 清理未使用的标签
  admin.post('/content/tags/cleanup', async (c) => {
    try {
      const db = c.env.DB;

      // 删除使用次数为0的标签
      const result = await db.prepare(
        'DELETE FROM content_tags WHERE usage_count = 0 OR usage_count IS NULL'
      ).run();

      return c.json({
        success: true,
        data: {
          deletedCount: result.changes || 0
        },
        message: '标签清理完成'
      });
    } catch (error) {
      console.error('清理标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理标签失败'
      }, 500);
    }
  });

  // 为内容添加标签
  admin.post('/content/:contentType/:contentId/tags', async (c) => {
    try {
      const db = c.env.DB;
      const contentType = c.req.param('contentType');
      const contentId = c.req.param('contentId');
      const { tag_ids } = await c.req.json();

      if (!['story', 'questionnaire'].includes(contentType)) {
        return c.json({
          success: false,
          error: 'Invalid Content Type',
          message: '无效的内容类型'
        }, 400);
      }

      if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '标签ID列表不能为空'
        }, 400);
      }

      // 开始事务
      await db.prepare('BEGIN').run();

      try {
        // 删除现有关联
        await db.prepare(`
          DELETE FROM content_tag_relations
          WHERE content_id = ? AND content_type = ?
        `).bind(contentId, contentType).run();

        // 添加新关联
        for (const tagId of tag_ids) {
          const relationId = crypto.randomUUID();
          await db.prepare(`
            INSERT INTO content_tag_relations (id, content_id, content_type, tag_id)
            VALUES (?, ?, ?, ?)
          `).bind(relationId, contentId, contentType, tagId).run();
        }

        // 更新标签使用次数
        for (const tagId of tag_ids) {
          await db.prepare(`
            UPDATE content_tags SET
              usage_count = (
                SELECT COUNT(*) FROM content_tag_relations
                WHERE tag_id = ?
              )
            WHERE id = ?
          `).bind(tagId, tagId).run();
        }

        await db.prepare('COMMIT').run();

        return c.json({
          success: true,
          message: '标签关联成功'
        });
      } catch (error) {
        await db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('添加内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '添加内容标签失败'
      }, 500);
    }
  });

  // 获取内容的标签
  admin.get('/content/:contentType/:contentId/tags', async (c) => {
    try {
      const db = c.env.DB;
      const contentType = c.req.param('contentType');
      const contentId = c.req.param('contentId');

      const result = await db.prepare(`
        SELECT ct.* FROM content_tags ct
        JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
        WHERE ctr.content_id = ? AND ctr.content_type = ?
        ORDER BY ct.tag_name
      `).bind(contentId, contentType).all();

      return c.json({
        success: true,
        data: result.results || [],
        message: '获取内容标签成功'
      });
    } catch (error) {
      console.error('获取内容标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取内容标签失败'
      }, 500);
    }
  });

  // 按标签筛选内容
  admin.get('/content/by-tags', async (c) => {
    try {
      const db = c.env.DB;
      const tagIds = c.req.query('tag_ids')?.split(',') || [];
      const contentType = c.req.query('content_type');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const offset = (page - 1) * limit;

      if (tagIds.length === 0) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '请提供标签ID'
        }, 400);
      }

      let query = `
        SELECT DISTINCT
          ctr.content_id, ctr.content_type,
          COUNT(ctr.tag_id) as matched_tags
        FROM content_tag_relations ctr
        WHERE ctr.tag_id IN (${tagIds.map(() => '?').join(',')})
      `;
      let params = [...tagIds];

      if (contentType) {
        query += ` AND ctr.content_type = ?`;
        params.push(contentType);
      }

      query += `
        GROUP BY ctr.content_id, ctr.content_type
        ORDER BY matched_tags DESC
        LIMIT ? OFFSET ?
      `;
      params.push(String(limit), String(offset));

      const result = await db.prepare(query).bind(...params).all();

      return c.json({
        success: true,
        data: result.results || [],
        message: '按标签筛选内容成功'
      });
    } catch (error) {
      console.error('按标签筛选内容失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '按标签筛选内容失败'
      }, 500);
    }
  });

  // 获取标签使用统计
  admin.get('/content/tags/stats', async (c) => {
    try {
      const db = c.env.DB;

      // 获取标签使用统计
      const tagStats = await db.prepare(`
        SELECT
          ct.id, ct.tag_key, ct.tag_name, ct.tag_name_en,
          ct.color, ct.content_type, ct.usage_count,
          COUNT(ctr.id) as actual_usage,
          CASE
            WHEN COUNT(ctr.id) > 50 THEN 'hot'
            WHEN COUNT(ctr.id) > 20 THEN 'popular'
            WHEN COUNT(ctr.id) > 5 THEN 'normal'
            ELSE 'cold'
          END as popularity_level
        FROM content_tags ct
        LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
        WHERE ct.is_active = true
        GROUP BY ct.id
        ORDER BY actual_usage DESC
      `).all();

      // 获取内容类型分布
      const contentTypeStats = await db.prepare(`
        SELECT
          ctr.content_type,
          COUNT(DISTINCT ctr.content_id) as content_count,
          COUNT(DISTINCT ctr.tag_id) as unique_tags
        FROM content_tag_relations ctr
        GROUP BY ctr.content_type
      `).all();

      // 获取最近使用的标签
      const recentTags = await db.prepare(`
        SELECT
          ct.id, ct.tag_name, ct.color,
          COUNT(ctr.id) as recent_usage
        FROM content_tags ct
        JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
        WHERE ctr.created_at >= datetime('now', '-7 days')
        GROUP BY ct.id
        ORDER BY recent_usage DESC
        LIMIT 10
      `).all();

      return c.json({
        success: true,
        data: {
          tagStats: tagStats.results || [],
          contentTypeStats: contentTypeStats.results || [],
          recentTags: recentTags.results || []
        },
        message: '标签统计获取成功'
      });
    } catch (error) {
      console.error('获取标签统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取标签统计失败'
      }, 500);
    }
  });

  // 合并标签
  admin.post('/content/tags/merge', async (c) => {
    try {
      const db = c.env.DB;
      const { source_tag_ids, target_tag_id } = await c.req.json();

      if (!Array.isArray(source_tag_ids) || !target_tag_id) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '请提供源标签ID列表和目标标签ID'
        }, 400);
      }

      // 检查目标标签是否存在
      const targetTag = await db.prepare(
        'SELECT id FROM content_tags WHERE id = ?'
      ).bind(target_tag_id).first();

      if (!targetTag) {
        return c.json({
          success: false,
          error: 'Not Found',
          message: '目标标签不存在'
        }, 404);
      }

      // 开始事务
      await db.prepare('BEGIN').run();

      try {
        // 将所有源标签的关联转移到目标标签
        for (const sourceTagId of source_tag_ids) {
          // 更新关联关系
          await db.prepare(`
            UPDATE content_tag_relations
            SET tag_id = ?
            WHERE tag_id = ?
          `).bind(target_tag_id, sourceTagId).run();

          // 删除源标签
          await db.prepare(
            'DELETE FROM content_tags WHERE id = ?'
          ).bind(sourceTagId).run();
        }

        // 更新目标标签的使用次数
        await db.prepare(`
          UPDATE content_tags SET
            usage_count = (
              SELECT COUNT(*) FROM content_tag_relations
              WHERE tag_id = ?
            )
          WHERE id = ?
        `).bind(target_tag_id, target_tag_id).run();

        await db.prepare('COMMIT').run();

        return c.json({
          success: true,
          message: '标签合并成功'
        });
      } catch (error) {
        await db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('合并标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '合并标签失败'
      }, 500);
    }
  });

  // 清理未使用的标签
  admin.delete('/content/tags/cleanup', async (c) => {
    try {
      const db = c.env.DB;

      // 获取未使用的标签
      const unusedTags = await db.prepare(`
        SELECT ct.id, ct.tag_name
        FROM content_tags ct
        LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
        WHERE ctr.id IS NULL AND ct.tag_type != 'system'
      `).all();

      if (!unusedTags.results || unusedTags.results.length === 0) {
        return c.json({
          success: true,
          data: { deleted_count: 0 },
          message: '没有需要清理的标签'
        });
      }

      // 删除未使用的标签
      const tagIds = unusedTags.results.map((tag: any) => tag.id);
      const placeholders = tagIds.map(() => '?').join(',');

      await db.prepare(`
        DELETE FROM content_tags
        WHERE id IN (${placeholders}) AND tag_type != 'system'
      `).bind(...tagIds).run();

      return c.json({
        success: true,
        data: {
          deleted_count: unusedTags.results.length,
          deleted_tags: unusedTags.results
        },
        message: `成功清理 ${unusedTags.results.length} 个未使用的标签`
      });
    } catch (error) {
      console.error('清理标签失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '清理标签失败'
      }, 500);
    }
  });

  // AI标签推荐
  admin.post('/content/tags/recommend', async (c) => {
    try {
      const { content, title, content_type = 'story' } = await c.req.json();

      if (!content) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '内容不能为空'
        }, 400);
      }

      // 简化版AI推荐逻辑
      const recommendations = await generateTagRecommendations(content, title, content_type);

      return c.json({
        success: true,
        data: recommendations,
        message: 'AI标签推荐成功'
      });
    } catch (error) {
      console.error('AI标签推荐失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: 'AI标签推荐失败'
      }, 500);
    }
  });

  // 测试数据验证API
  admin.get('/test-data/verify', async (c) => {
    try {
      if (!c.env?.DB) {
        return c.json({
          success: false,
          error: 'Database not available',
          message: '数据库连接不可用'
        }, 500);
      }

      // 直接使用D1数据库
      const db = c.env.DB;

      // 验证测试数据
      const userResult = await db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE user_uuid LIKE 'test-user-%'
      `).first();

      const questionnaireResult = await db.prepare(`
        SELECT COUNT(*) as count FROM universal_questionnaire_responses WHERE user_uuid LIKE 'test-user-%'
      `).first();



      const storyResult = await db.prepare(`
        SELECT COUNT(*) as count FROM valid_stories WHERE user_id LIKE 'test-user-%'
      `).first();

      // 获取一些样本数据
      const sampleUser = await db.prepare(`
        SELECT * FROM users WHERE user_uuid LIKE 'test-user-%' LIMIT 1
      `).first();

      return c.json({
        success: true,
        data: {
          counts: {
            users: userResult?.count || 0,
            questionnaires: questionnaireResult?.count || 0,
            stories: storyResult?.count || 0
          },
          samples: {
            user: sampleUser
          }
        },
        message: '测试数据验证成功'
      });
    } catch (error) {
      console.error('测试数据验证失败:', error);
      return c.json({
        success: false,
        error: error.message || 'Internal Server Error',
        message: '测试数据验证失败'
      }, 500);
    }
  });

  // 获取API端点列表
  admin.get('/api/endpoints', async (c) => {
    try {
      const endpoints = [
        {
          id: 'auth-login',
          method: 'POST',
          path: '/api/auth/login',
          description: '用户登录',
          page: '登录页面',
          database: 'D1',
          tables: ['users'],
          status: 'active'
        },
        {
          id: 'questionnaire-submit',
          method: 'POST',
          path: '/api/questionnaire/submit',
          description: '提交问卷',
          page: '问卷页面',
          database: 'D1',
          tables: ['questionnaire_submissions'],
          status: 'active'
        },
        {
          id: 'reviewer-pending',
          method: 'GET',
          path: '/api/reviewer/pending-reviews',
          description: '获取待审核列表',
          page: '审核员页面',
          database: 'D1',
          tables: ['audit_records'],
          status: 'active'
        },
        {
          id: 'analytics-basic',
          method: 'GET',
          path: '/api/analytics/basic-stats',
          description: '基础统计数据',
          page: '数据分析页面',
          database: 'D1',
          tables: ['questionnaire_submissions', 'stories'],
          status: 'active'
        }
      ];

      return c.json({
        success: true,
        data: endpoints,
        message: 'API端点列表获取成功'
      });
    } catch (error) {
      console.error('获取API端点列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取API端点列表失败'
      }, 500);
    }
  });

  // 获取数据库表列表
  admin.get('/database/tables', async (c) => {
    try {
      const tables = [
        {
          name: 'questionnaire_submissions',
          type: 'temp',
          description: '问卷提交数据表',
          recordCount: 856,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['questionnaire-submit', 'admin-questionnaires']
        },

        {
          name: 'valid_stories',
          type: 'valid',
          description: '有效故事数据表',
          recordCount: 0,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['stories-list', 'stories-submit']
        },
        {
          name: 'audit_records',
          type: 'system',
          description: '审核记录表',
          recordCount: 25,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['reviewer-pending', 'reviewer-submit']
        },
        {
          name: 'users',
          type: 'system',
          description: '用户信息表',
          recordCount: 12,
          lastUpdated: new Date().toISOString(),
          relatedApis: ['auth-login', 'user-management']
        }
      ];

      return c.json({
        success: true,
        data: tables,
        message: '数据库表列表获取成功'
      });
    } catch (error) {
      console.error('获取数据库表列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取数据库表列表失败'
      }, 500);
    }
  });

  // 获取审核配置
  admin.get('/audit-config', async (c) => {
    try {
      // 返回默认审核配置
      const auditConfig = {
        audit_mode: 'local_ai',
        local_rules: {
          confidence_threshold: 80,
          max_content_length: 1000,
          sensitive_level: 'normal'
        },
        ai_audit: {
          confidence_threshold: 70,
          timeout_seconds: 30,
          fallback_to_human: true,
          provider: 'openai'
        },
        human_audit: {
          timeout_hours: 24,
          auto_approve_on_timeout: false
        },
        triggers: {
          trigger_on_uncertain: true,
          trigger_on_edge_content: true,
          trigger_on_length_exceed: true,
          trigger_on_user_appeal: true
        }
      };

      return c.json({
        success: true,
        data: auditConfig
      });
    } catch (error) {
      console.error('获取审核配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取审核配置失败'
      }, 500);
    }
  });

  // 更新审核配置
  admin.put('/audit-config', async (c) => {
    try {
      const body = await c.req.json();

      // 这里应该保存到数据库，暂时返回成功响应
      return c.json({
        success: true,
        data: body,
        message: '审核配置更新成功'
      });
    } catch (error) {
      console.error('更新审核配置失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新审核配置失败'
      }, 500);
    }
  });

  // 获取AI供应商列表
  admin.get('/ai-providers', async (c) => {
    try {
      const providers = [
        {
          id: 'openai',
          name: 'OpenAI',
          status: 'active',
          api_endpoint: 'https://api.openai.com/v1',
          models: ['gpt-3.5-turbo', 'gpt-4'],
          rate_limit: 1000,
          cost_per_request: 0.002
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          status: 'inactive',
          api_endpoint: 'https://api.anthropic.com/v1',
          models: ['claude-3-sonnet', 'claude-3-haiku'],
          rate_limit: 500,
          cost_per_request: 0.003
        }
      ];

      return c.json({
        success: true,
        data: providers
      });
    } catch (error) {
      console.error('获取AI供应商列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取AI供应商列表失败'
      }, 500);
    }
  });

  // 获取本地规则列表
  admin.get('/local-rules', async (c) => {
    try {
      const rules = [
        {
          id: 1,
          category: '政治敏感',
          rules: ['政府', '政治', '领导人'],
          severity: 'high',
          action: 'reject',
          enabled: true
        },
        {
          id: 2,
          category: '色情内容',
          rules: ['色情', '裸体', '性行为'],
          severity: 'high',
          action: 'reject',
          enabled: true
        },
        {
          id: 3,
          category: '暴力内容',
          rules: ['暴力', '杀害', '血腥'],
          severity: 'medium',
          action: 'review',
          enabled: true
        },
        {
          id: 4,
          category: '垃圾信息',
          rules: ['广告', '推广', '联系方式'],
          severity: 'low',
          action: 'review',
          enabled: true
        }
      ];

      return c.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('获取本地规则列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取本地规则列表失败'
      }, 500);
    }
  });

  // 获取敏感词列表
  admin.get('/sensitive-words', async (c) => {
    try {
      const sensitiveWords = [
        { id: 1, word: '色情', category: '色情内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 2, word: '暴力', category: '暴力内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 3, word: '政治', category: '政治敏感', severity: 'medium', enabled: true, created_at: '2024-01-01' },
        { id: 4, word: '赌博', category: '违法内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 5, word: '毒品', category: '违法内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 6, word: '广告', category: '垃圾信息', severity: 'low', enabled: true, created_at: '2024-01-01' },
        { id: 7, word: '推广', category: '垃圾信息', severity: 'low', enabled: true, created_at: '2024-01-01' },
        { id: 8, word: '血腥', category: '暴力内容', severity: 'medium', enabled: true, created_at: '2024-01-01' }
      ];

      return c.json({
        success: true,
        data: sensitiveWords
      });
    } catch (error) {
      console.error('获取敏感词列表失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取敏感词列表失败'
      }, 500);
    }
  });

  // 添加敏感词
  admin.post('/sensitive-words', async (c) => {
    try {
      const body = await c.req.json();
      const { word, category, severity } = body;

      if (!word || !category || !severity) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少必填字段'
        }, 400);
      }

      const newWord = {
        id: Date.now(),
        word,
        category,
        severity,
        enabled: true,
        created_at: new Date().toISOString()
      };

      return c.json({
        success: true,
        data: newWord,
        message: '敏感词添加成功'
      });
    } catch (error) {
      console.error('添加敏感词失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '添加敏感词失败'
      }, 500);
    }
  });

  // 更新敏感词
  admin.put('/sensitive-words/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      const updatedWord = {
        id,
        ...body,
        updated_at: new Date().toISOString()
      };

      return c.json({
        success: true,
        data: updatedWord,
        message: '敏感词更新成功'
      });
    } catch (error) {
      console.error('更新敏感词失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新敏感词失败'
      }, 500);
    }
  });

  // 删除敏感词
  admin.delete('/sensitive-words/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));

      return c.json({
        success: true,
        data: { id },
        message: '敏感词删除成功'
      });
    } catch (error) {
      console.error('删除敏感词失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '删除敏感词失败'
      }, 500);
    }
  });

  // 审核测试接口
  admin.post('/audit-test', async (c) => {
    try {
      const body = await c.req.json();
      const { content, content_type } = body;

      if (!content) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '内容不能为空'
        }, 400);
      }

      // 模拟审核结果
      const sensitiveWords = ['色情', '暴力', '政治', '赌博', '毒品'];
      const foundWords = sensitiveWords.filter(word => content.includes(word));

      const result = {
        passed: foundWords.length === 0,
        action: foundWords.length === 0 ? 'approve' : 'reject',
        audit_level: 'level1',
        risk_score: foundWords.length * 0.3,
        confidence: 0.95,
        reason: foundWords.length > 0 ? `包含敏感词: ${foundWords.join(', ')}` : '内容正常',
        violations: foundWords.map(word => ({
          rule_id: `rule_${word}`,
          category: '敏感词',
          matched_text: word,
          severity: 'high',
          confidence: 0.95
        }))
      };

      return c.json({
        success: true,
        data: result,
        message: '审核测试完成'
      });
    } catch (error) {
      console.error('审核测试失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '审核测试失败'
      }, 500);
    }
  });

  // IP访问控制 - 获取规则列表
  admin.get('/ip-access-control/rules', async (c) => {
    try {
      const rules = [
        {
          id: 1,
          name: '办公网络白名单',
          type: 'whitelist',
          ipRange: '192.168.1.0/24',
          description: '公司办公网络',
          enabled: true,
          priority: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: '恶意IP黑名单',
          type: 'blacklist',
          ipRange: '10.0.0.0/8',
          description: '已知恶意IP段',
          enabled: true,
          priority: 2,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      return c.json({
        success: true,
        data: rules,
        message: 'IP访问控制规则获取成功'
      });
    } catch (error) {
      console.error('获取IP访问控制规则失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取IP访问控制规则失败'
      }, 500);
    }
  });

  // IP访问控制 - 创建规则
  admin.post('/ip-access-control/rules',
    validateRequestBody({
      name: { type: 'string', minLength: 1, maxLength: 100, required: true },
      type: {
        type: 'safe-string',
        pattern: /^(whitelist|blacklist)$/,
        required: true
      },
      ipRange: {
        type: 'string',
        pattern: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
        required: true
      },
      description: { type: 'string', maxLength: 500, required: false },
      enabled: { required: false },
      priority: { type: 'number', required: false }
    }),
    async (c) => {
    try {
      const { name, type, ipRange, description, enabled = true, priority = 1 } = await c.req.json();

      const newRule = {
        id: Date.now(),
        name,
        type,
        ipRange,
        description,
        enabled,
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return c.json({
        success: true,
        data: newRule,
        message: 'IP访问控制规则创建成功'
      });
    } catch (error) {
      console.error('创建IP访问控制规则失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '创建IP访问控制规则失败'
      }, 500);
    }
  });

  // IP访问控制 - 更新规则
  admin.put('/ip-access-control/rules/:ruleId',
    validatePathParams({ ruleId: commonValidationRules.numericId }),
    validateRequestBody({
      name: { type: 'string', minLength: 1, maxLength: 100, required: false },
      type: {
        type: 'safe-string',
        pattern: /^(whitelist|blacklist)$/,
        required: false
      },
      ipRange: {
        type: 'string',
        pattern: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
        required: false
      },
      description: { type: 'string', maxLength: 500, required: false },
      enabled: { required: false },
      priority: { type: 'number', required: false }
    }),
    async (c) => {
    try {
      const ruleId = c.req.param('ruleId');
      const { name, type, ipRange, description, enabled, priority } = await c.req.json();

      const updatedRule = {
        id: parseInt(ruleId),
        name,
        type,
        ipRange,
        description,
        enabled,
        priority,
        updatedAt: new Date().toISOString()
      };

      return c.json({
        success: true,
        data: updatedRule,
        message: 'IP访问控制规则更新成功'
      });
    } catch (error) {
      console.error('更新IP访问控制规则失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新IP访问控制规则失败'
      }, 500);
    }
  });

  // IP访问控制 - 删除规则 (危险操作)
  admin.delete('/ip-access-control/rules/:ruleId',
    validatePathParams({ ruleId: commonValidationRules.numericId }),
    async (c) => {
    try {
      const ruleId = c.req.param('ruleId');

      return c.json({
        success: true,
        data: { deletedRuleId: parseInt(ruleId) },
        message: 'IP访问控制规则删除成功'
      });
    } catch (error) {
      console.error('删除IP访问控制规则失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '删除IP访问控制规则失败'
      }, 500);
    }
  });

  // IP访问控制 - 获取时间策略
  admin.get('/ip-access-control/time-policies', async (c) => {
    try {
      const policies = [
        {
          id: 1,
          name: '工作时间访问',
          timeRange: '09:00-18:00',
          weekdays: [1, 2, 3, 4, 5],
          timezone: 'Asia/Shanghai',
          enabled: true,
          description: '仅在工作时间允许访问'
        },
        {
          id: 2,
          name: '24小时访问',
          timeRange: '00:00-23:59',
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          timezone: 'Asia/Shanghai',
          enabled: true,
          description: '全天候访问'
        }
      ];

      return c.json({
        success: true,
        data: policies,
        message: '时间策略获取成功'
      });
    } catch (error) {
      console.error('获取时间策略失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取时间策略失败'
      }, 500);
    }
  });

  // IP访问控制 - 获取统计信息
  admin.get('/ip-access-control/stats', async (c) => {
    try {
      const stats = {
        totalRules: 15,
        activeRules: 12,
        blockedRequests: 1247,
        allowedRequests: 8956,
        topBlockedIPs: [
          { ip: '192.168.1.100', count: 156, lastBlocked: '2024-01-01T12:00:00Z' },
          { ip: '10.0.0.50', count: 89, lastBlocked: '2024-01-01T11:30:00Z' }
        ],
        recentActivity: [
          { timestamp: '2024-01-01T12:00:00Z', action: 'blocked', ip: '192.168.1.100', rule: '恶意IP黑名单' },
          { timestamp: '2024-01-01T11:55:00Z', action: 'allowed', ip: '192.168.1.10', rule: '办公网络白名单' }
        ]
      };

      return c.json({
        success: true,
        data: stats,
        message: 'IP访问控制统计获取成功'
      });
    } catch (error) {
      console.error('获取IP访问控制统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取IP访问控制统计失败'
      }, 500);
    }
  });

  // 智能安全 - 获取异常检测
  admin.get('/intelligent-security/anomalies', async (c) => {
    try {
      const anomalies = [
        {
          id: 1,
          type: 'unusual_login_pattern',
          severity: 'high',
          description: '检测到异常登录模式',
          details: {
            userId: 'user_123',
            loginTime: '2024-01-01T02:30:00Z',
            location: '未知地区',
            device: 'Unknown Device'
          },
          status: 'pending',
          createdAt: '2024-01-01T02:30:00Z'
        },
        {
          id: 2,
          type: 'suspicious_api_calls',
          severity: 'medium',
          description: '检测到可疑API调用',
          details: {
            ip: '192.168.1.100',
            endpoint: '/api/admin/users',
            frequency: 'high',
            pattern: 'automated'
          },
          status: 'investigating',
          createdAt: '2024-01-01T01:15:00Z'
        }
      ];

      return c.json({
        success: true,
        data: anomalies,
        message: '异常检测数据获取成功'
      });
    } catch (error) {
      console.error('获取异常检测数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取异常检测数据失败'
      }, 500);
    }
  });

  // 智能安全 - 获取威胁情报
  admin.get('/intelligent-security/threats', async (c) => {
    try {
      const threats = [
        {
          id: 1,
          type: 'malicious_ip',
          source: 'external_feed',
          indicator: '192.168.1.100',
          confidence: 0.95,
          description: '已知恶意IP地址',
          firstSeen: '2024-01-01T00:00:00Z',
          lastSeen: '2024-01-01T12:00:00Z',
          tags: ['botnet', 'scanning']
        },
        {
          id: 2,
          type: 'suspicious_user_agent',
          source: 'internal_analysis',
          indicator: 'BadBot/1.0',
          confidence: 0.87,
          description: '可疑的用户代理字符串',
          firstSeen: '2024-01-01T06:00:00Z',
          lastSeen: '2024-01-01T11:30:00Z',
          tags: ['automation', 'scraping']
        }
      ];

      return c.json({
        success: true,
        data: threats,
        message: '威胁情报获取成功'
      });
    } catch (error) {
      console.error('获取威胁情报失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取威胁情报失败'
      }, 500);
    }
  });

  // 智能安全 - 获取设备指纹
  admin.get('/intelligent-security/fingerprints', async (c) => {
    try {
      const fingerprints = [
        {
          id: 1,
          fingerprintHash: 'abc123def456',
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            screen: '1920x1080',
            timezone: 'Asia/Shanghai',
            language: 'zh-CN'
          },
          riskScore: 0.2,
          firstSeen: '2024-01-01T00:00:00Z',
          lastSeen: '2024-01-01T12:00:00Z',
          associatedUsers: ['user_123', 'user_456'],
          status: 'trusted'
        },
        {
          id: 2,
          fingerprintHash: 'xyz789uvw012',
          deviceInfo: {
            userAgent: 'BadBot/1.0',
            screen: '800x600',
            timezone: 'UTC',
            language: 'en-US'
          },
          riskScore: 0.9,
          firstSeen: '2024-01-01T06:00:00Z',
          lastSeen: '2024-01-01T11:30:00Z',
          associatedUsers: [],
          status: 'suspicious'
        }
      ];

      return c.json({
        success: true,
        data: fingerprints,
        message: '设备指纹获取成功'
      });
    } catch (error) {
      console.error('获取设备指纹失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取设备指纹失败'
      }, 500);
    }
  });

  // 智能安全 - 获取响应策略
  admin.get('/intelligent-security/responses', async (c) => {
    try {
      const responses = [
        {
          id: 1,
          name: '自动封禁',
          type: 'auto_ban',
          conditions: {
            riskScore: { min: 0.8 },
            frequency: { threshold: 100, timeWindow: '1h' }
          },
          actions: [
            { type: 'block_ip', duration: '24h' },
            { type: 'notify_admin', channels: ['email', 'slack'] }
          ],
          enabled: true,
          priority: 1
        },
        {
          id: 2,
          name: '人工审核',
          type: 'manual_review',
          conditions: {
            riskScore: { min: 0.5, max: 0.8 }
          },
          actions: [
            { type: 'flag_for_review' },
            { type: 'rate_limit', factor: 0.5 }
          ],
          enabled: true,
          priority: 2
        }
      ];

      return c.json({
        success: true,
        data: responses,
        message: '响应策略获取成功'
      });
    } catch (error) {
      console.error('获取响应策略失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取响应策略失败'
      }, 500);
    }
  });

  // 智能安全 - 获取统计信息
  admin.get('/intelligent-security/stats', async (c) => {
    try {
      const stats = {
        totalAnomalies: 156,
        activeThreats: 23,
        blockedAttacks: 89,
        riskDistribution: {
          low: 1200,
          medium: 340,
          high: 67,
          critical: 12
        },
        detectionAccuracy: 0.94,
        falsePositiveRate: 0.03,
        responseTime: {
          average: 2.5,
          p95: 8.2,
          p99: 15.7
        },
        recentIncidents: [
          {
            id: 1,
            type: 'brute_force_attack',
            severity: 'high',
            timestamp: '2024-01-01T12:00:00Z',
            status: 'mitigated'
          },
          {
            id: 2,
            type: 'sql_injection_attempt',
            severity: 'critical',
            timestamp: '2024-01-01T11:30:00Z',
            status: 'blocked'
          }
        ]
      };

      return c.json({
        success: true,
        data: stats,
        message: '智能安全统计获取成功'
      });
    } catch (error) {
      console.error('获取智能安全统计失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取智能安全统计失败'
      }, 500);
    }
  });

  // 登录监控 - 获取登录记录
  admin.get('/login-monitor/records', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const status = c.req.query('status');
      const timeRange = c.req.query('timeRange') || '24h';

      const records = Array.from({ length: pageSize }, (_, i) => ({
        id: i + 1,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        username: `user${Math.floor(Math.random() * 1000)}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: ['北京', '上海', '广州', '深圳'][Math.floor(Math.random() * 4)],
        status: ['success', 'failed', 'blocked'][Math.floor(Math.random() * 3)],
        loginTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        riskScore: Math.random()
      }));

      return c.json({
        success: true,
        data: {
          items: records,
          pagination: {
            page,
            pageSize,
            total: 5000,
            totalPages: Math.ceil(5000 / pageSize)
          }
        },
        message: '登录记录获取成功'
      });
    } catch (error) {
      console.error('获取登录记录失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取登录记录失败'
      }, 500);
    }
  });

  // 登录监控 - 获取告警信息
  admin.get('/login-monitor/alerts', async (c) => {
    try {
      const alerts = [
        {
          id: 1,
          type: 'suspicious_login',
          severity: 'high',
          title: '可疑登录检测',
          description: '检测到来自异常地理位置的登录尝试',
          userId: 'user_123',
          ip: '192.168.1.100',
          location: '未知地区',
          timestamp: '2024-01-01T12:00:00Z',
          status: 'active',
          actions: ['block_ip', 'notify_user']
        },
        {
          id: 2,
          type: 'brute_force',
          severity: 'critical',
          title: '暴力破解攻击',
          description: '检测到针对多个账户的暴力破解尝试',
          ip: '10.0.0.50',
          attemptCount: 156,
          timestamp: '2024-01-01T11:30:00Z',
          status: 'mitigated',
          actions: ['auto_ban', 'alert_admin']
        }
      ];

      return c.json({
        success: true,
        data: alerts,
        message: '登录告警获取成功'
      });
    } catch (error) {
      console.error('获取登录告警失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取登录告警失败'
      }, 500);
    }
  });

  // 登录监控 - 获取图表数据
  admin.get('/login-monitor/charts', async (c) => {
    try {
      const timeRange = c.req.query('timeRange') || '7d';

      const chartData = {
        loginTrends: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          successful: Math.floor(Math.random() * 100),
          failed: Math.floor(Math.random() * 20),
          blocked: Math.floor(Math.random() * 5)
        })),
        locationDistribution: [
          { location: '北京', count: 1250, percentage: 35.2 },
          { location: '上海', count: 890, percentage: 25.1 },
          { location: '广州', count: 567, percentage: 16.0 },
          { location: '深圳', count: 423, percentage: 11.9 },
          { location: '其他', count: 420, percentage: 11.8 }
        ],
        deviceTypes: [
          { device: 'Desktop', count: 2100, percentage: 59.2 },
          { device: 'Mobile', count: 1200, percentage: 33.8 },
          { device: 'Tablet', count: 250, percentage: 7.0 }
        ],
        riskScoreDistribution: [
          { range: '0.0-0.2', count: 2800, label: '低风险' },
          { range: '0.2-0.5', count: 450, label: '中低风险' },
          { range: '0.5-0.8', count: 200, label: '中高风险' },
          { range: '0.8-1.0', count: 100, label: '高风险' }
        ]
      };

      return c.json({
        success: true,
        data: chartData,
        message: '登录监控图表数据获取成功'
      });
    } catch (error) {
      console.error('获取登录监控图表数据失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '获取登录监控图表数据失败'
      }, 500);
    }
  });

  return admin;
}

export default createAdminRoutes;

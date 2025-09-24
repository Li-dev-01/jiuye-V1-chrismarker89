/**
 * 故事审核系统路由
 * 处理故事提交、状态查询和审核管理
 */

import { Hono } from 'hono';
import { Env } from '../types/api';

const storyAudit = new Hono<{ Bindings: Env }>();

// 故事提交API
storyAudit.post('/submit', async (c) => {
  try {
    const { user_id, content } = await c.req.json();
    
    if (!user_id || !content) {
      return c.json({
        success: false,
        message: '用户ID和内容不能为空'
      }, 400);
    }

    // 简化的故事提交处理（调试版本）
    let result;

    try {
      // 1. 检查数据库表是否存在
      const tableCheck = await c.env.DB.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='pending_stories'
      `).first();

      if (!tableCheck) {
        // 初始化数据库
        const { initAuditDatabase } = await import('../utils/initAuditDatabase');
        await initAuditDatabase(c.env.DB);
      }

      // 2. 创建待审核记录
      const stmt = c.env.DB.prepare(`
        INSERT INTO pending_stories (
          user_id, content, status, audit_level,
          user_ip, user_agent, created_at
        ) VALUES (?, ?, 'pending', 1, ?, ?, CURRENT_TIMESTAMP)
      `);

      const insertResult = await stmt.bind(
        user_id,
        content,
        c.req.header('CF-Connecting-IP'),
        c.req.header('User-Agent')
      ).run();

      const storyId = insertResult.meta.last_row_id;

      // 3. 简单的规则检查
      const hasViolations = /[傻逼|白痴|操|草|妈的]/gi.test(content);
      const isShort = content.length < 50;

      let status = 'pending';
      let message = '故事已提交，正在审核中';

      if (hasViolations) {
        status = 'rejected';
        message = '内容不符合社区规范，发布失败';

        // 更新状态为拒绝
        await c.env.DB.prepare(`
          UPDATE pending_stories
          SET status = 'rejected', rule_audit_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(storyId).run();

      } else if (!isShort) {
        // 内容合规且长度足够，直接批准
        status = 'approved';
        message = '故事已发布成功';

        // 移动到正式表
        await c.env.DB.prepare(`
          INSERT INTO stories (user_id, content, created_at, audit_status, audit_type)
          VALUES (?, ?, CURRENT_TIMESTAMP, 'approved', 'rule_based')
        `).bind(user_id, content).run();

        // 更新待审核表状态
        await c.env.DB.prepare(`
          UPDATE pending_stories
          SET status = 'approved', approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(storyId).run();
      }

      result = {
        success: status !== 'rejected',
        story_id: storyId,
        status: status,
        message: message,
        next_step: status === 'approved' ? 'story_published' :
                  status === 'rejected' ? 'content_rejected' : 'ai_audit_scheduled'
      };

    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      throw new Error(`数据库错误: ${dbError.message}`);
    }

    return c.json({
      success: result.success,
      data: {
        story_id: result.story_id,
        status: result.status,
        next_step: result.next_step
      },
      message: result.message,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

  } catch (error) {
    console.error('故事提交失败:', error);
    return c.json({
      success: false,
      message: '系统错误，请稍后重试',
      error: error.message
    }, 500);
  }
});

// 查询故事审核状态
storyAudit.get('/:id/status', async (c) => {
  try {
    const storyId = parseInt(c.req.param('id'));
    
    if (isNaN(storyId)) {
      return c.json({
        success: false,
        message: '无效的故事ID'
      }, 400);
    }
    
    const { StoryAuditController } = await import('../services/storyAuditController');
    const auditController = new StoryAuditController(c.env, c.env.DB);

    const status = await auditController.getStoryAuditStatus(storyId);
    
    if (!status) {
      return c.json({
        success: false,
        message: '故事不存在'
      }, 404);
    }

    return c.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取故事状态失败:', error);
    return c.json({
      success: false,
      message: '系统错误',
      error: error.message
    }, 500);
  }
});

// 批量查询用户的故事状态
storyAudit.get('/user/:userId/stories', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    
    if (isNaN(userId)) {
      return c.json({
        success: false,
        message: '无效的用户ID'
      }, 400);
    }

    // 查询用户的所有故事
    const stories = await c.env.DB.prepare(`
      SELECT 
        id, status, audit_level, created_at, 
        rule_audit_at, ai_audit_at, approved_at,
        SUBSTR(content, 1, 100) as content_preview
      FROM pending_stories 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all();

    // 查询已发布的故事
    const publishedStories = await c.env.DB.prepare(`
      SELECT 
        id, created_at, audit_status, audit_type,
        SUBSTR(content, 1, 100) as content_preview
      FROM stories 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      data: {
        pending_stories: stories.results || [],
        published_stories: publishedStories.results || [],
        total_pending: stories.results?.length || 0,
        total_published: publishedStories.results?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取用户故事失败:', error);
    return c.json({
      success: false,
      message: '系统错误',
      error: error.message
    }, 500);
  }
});

// 前端内容预检API
storyAudit.post('/precheck', async (c) => {
  try {
    const { content } = await c.req.json();
    
    if (!content) {
      return c.json({
        success: false,
        message: '内容不能为空'
      }, 400);
    }

    // 使用简化的内容检查逻辑
    const contentLength = content.length;
    const hasBasicIssues = /[傻逼|白痴|操|草|妈的]/gi.test(content);

    const result = {
      isValid: !hasBasicIssues && contentLength >= 50 && contentLength <= 2000,
      violations: [],
      suggestions: [],
      riskLevel: hasBasicIssues ? 'high' : 'low'
    };

    if (hasBasicIssues) {
      result.violations.push('内容包含不当词汇');
      result.suggestions.push('请使用文明用语描述您的就业经历');
    }

    if (contentLength < 50) {
      result.violations.push('内容过短，至少需要50个字符');
      result.suggestions.push('请详细描述您的就业经历');
    }

    if (contentLength > 2000) {
      result.violations.push('内容过长，最多2000个字符');
      result.suggestions.push('请精简您的故事内容');
    }

    const realtimeCheck = {
      hasIssues: hasBasicIssues,
      message: hasBasicIssues ? '检测到不当内容，请修改后再提交' : undefined,
      type: hasBasicIssues ? 'error' : undefined
    };

    const suggestions = [];
    if (contentLength < 100) {
      suggestions.push('可以详细描述求职过程中的具体经历');
    }
    


    return c.json({
      success: true,
      data: {
        is_valid: result.isValid,
        violations: result.violations,
        suggestions: result.suggestions.concat(suggestions),
        risk_level: result.riskLevel,
        realtime_check: realtimeCheck,
        content_length: content.length,
        estimated_read_time: Math.ceil(content.length / 200) // 假设每分钟200字
      },
      message: result.isValid ? '内容检查通过' : '内容存在问题',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('内容预检失败:', error);
    return c.json({
      success: false,
      message: '预检失败，但不影响提交',
      error: error.message
    }, 500);
  }
});

// 获取审核统计（管理员）
storyAudit.get('/admin/statistics', async (c) => {
  try {
    // 简单的管理员验证（实际应用中应该有更严格的验证）
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: '需要管理员权限'
      }, 401);
    }

    const { StoryAuditController } = await import('../services/storyAuditController');
    const auditController = new StoryAuditController(c.env, c.env.DB);

    const stats = await auditController.getAuditStatistics();

    // 获取违规统计
    const violationStats = await c.env.DB.prepare(`
      SELECT 
        violation_type,
        COUNT(*) as count,
        AVG(risk_score) as avg_risk_score
      FROM violation_records
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY violation_type
      ORDER BY count DESC
    `).all();

    // 获取用户风险分析
    const userRiskStats = await c.env.DB.prepare(`
      SELECT 
        risk_level,
        COUNT(*) as user_count
      FROM user_violation_analysis
      GROUP BY risk_level
    `).all();

    return c.json({
      success: true,
      data: {
        audit_stats: stats,
        violation_stats: violationStats.results || [],
        user_risk_stats: userRiskStats.results || [],
        last_updated: new Date().toISOString()
      },
      message: '获取审核统计成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取审核统计失败:', error);
    return c.json({
      success: false,
      message: '获取审核统计失败',
      error: error.message
    }, 500);
  }
});

// 人工审核队列（管理员）
storyAudit.get('/admin/manual-review-queue', async (c) => {
  try {
    // 管理员权限验证
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: '需要管理员权限'
      }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    // 获取人工审核队列
    const queue = await c.env.DB.prepare(`
      SELECT 
        mrq.id, mrq.pending_story_id, mrq.priority, mrq.status,
        mrq.assigned_to, mrq.created_at, mrq.assigned_at,
        ps.user_id, ps.content, ps.ai_audit_result,
        SUBSTR(ps.content, 1, 200) as content_preview
      FROM manual_review_queue mrq
      JOIN pending_stories ps ON mrq.pending_story_id = ps.id
      WHERE mrq.status IN ('waiting', 'assigned', 'reviewing')
      ORDER BY mrq.priority ASC, mrq.created_at ASC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // 获取总数
    const total = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM manual_review_queue
      WHERE status IN ('waiting', 'assigned', 'reviewing')
    `).first();

    return c.json({
      success: true,
      data: {
        queue: queue.results || [],
        pagination: {
          page,
          limit,
          total: total.count || 0,
          pages: Math.ceil((total.count || 0) / limit)
        }
      },
      message: '获取人工审核队列成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取人工审核队列失败:', error);
    return c.json({
      success: false,
      message: '获取人工审核队列失败',
      error: error.message
    }, 500);
  }
});

export function createStoryAuditRoutes() {
  return storyAudit;
}

// 简化审核员路由 - 专为reviewer-admin-dashboard设计
// 使用真实数据库查询
import { Hono } from 'hono';
import type { Env } from '../types/api';
import { successResponse, errorResponse, jsonResponse } from '../utils/response';
import { simpleAuthMiddleware, requireRole } from '../middleware/simpleAuth';

const simpleReviewer = new Hono<{ Bindings: Env }>();

// 应用简化认证中间件
simpleReviewer.use('*', simpleAuthMiddleware);
simpleReviewer.use('*', requireRole('reviewer', 'admin', 'super_admin'));

// 辅助函数：计算优先级
function calculatePriority(story: any): string {
  // 基于审核层级和风险评分计算优先级
  if (story.audit_level === 3) return 'urgent'; // 人工审核
  if (story.audit_level === 2) return 'high';   // AI审核
  return 'medium'; // 规则审核
}

// 辅助函数：解析JSON字段
function safeJSONParse(jsonString: string | null, defaultValue: any = null) {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

// 获取审核员仪表板数据
simpleReviewer.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    console.log(`[SIMPLE_REVIEWER] Dashboard request from: ${user.username}`);

    // 1. 获取待审核统计
    const pendingStats = await db.prepare(`
      SELECT
        COUNT(*) as total_pending,
        SUM(CASE WHEN audit_level = 1 THEN 1 ELSE 0 END) as rule_flagged,
        SUM(CASE WHEN audit_level = 2 THEN 1 ELSE 0 END) as ai_flagged,
        SUM(CASE WHEN audit_level = 3 THEN 1 ELSE 0 END) as manual_review
      FROM pending_stories
      WHERE status IN ('pending', 'manual_review')
    `).first();

    // 2. 获取今日完成数量（从manual_review_queue查询）
    const todayCompleted = await db.prepare(`
      SELECT COUNT(*) as count
      FROM manual_review_queue
      WHERE status = 'completed'
      AND DATE(completed_at) = DATE('now')
      AND assigned_to = ?
    `).bind(user.username).first();

    // 3. 获取总完成数量
    const totalCompleted = await db.prepare(`
      SELECT COUNT(*) as count
      FROM manual_review_queue
      WHERE status = 'completed'
      AND assigned_to = ?
    `).bind(user.username).first();

    // 4. 计算平均审核时间（分钟）
    const avgTime = await db.prepare(`
      SELECT AVG(
        (julianday(completed_at) - julianday(started_at)) * 24 * 60
      ) as avg_minutes
      FROM manual_review_queue
      WHERE status = 'completed'
      AND assigned_to = ?
      AND started_at IS NOT NULL
      AND completed_at IS NOT NULL
    `).bind(user.username).first();

    // 5. 获取最近活动（最近10条审核记录）
    const recentActivity = await db.prepare(`
      SELECT
        mrq.id,
        mrq.review_result as action,
        mrq.completed_at as timestamp,
        ps.content as content_preview,
        ps.user_id
      FROM manual_review_queue mrq
      JOIN pending_stories ps ON mrq.pending_story_id = ps.id
      WHERE mrq.assigned_to = ?
      AND mrq.status = 'completed'
      ORDER BY mrq.completed_at DESC
      LIMIT 10
    `).bind(user.username).all();

    // 6. 计算性能指标
    const performanceMetrics = await db.prepare(`
      SELECT
        COUNT(*) as total_reviews,
        SUM(CASE WHEN review_result = 'approve' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN review_result = 'reject' THEN 1 ELSE 0 END) as rejected
      FROM manual_review_queue
      WHERE assigned_to = ?
      AND status = 'completed'
    `).bind(user.username).first();

    const approvalRate = performanceMetrics.total_reviews > 0
      ? performanceMetrics.approved / performanceMetrics.total_reviews
      : 0;

    // 7. 获取按类型分类的待审核数量（pending_stories表只有故事）
    const typeStats = {
      story: pendingStats.total_pending || 0,
      questionnaire: 0, // 暂时没有问卷数据
      heart_voice: 0    // 暂时没有心声数据
    };

    // 格式化最近活动数据
    const formattedActivities = recentActivity.results.map((item: any) => ({
      id: item.id,
      content_type: 'story',
      audit_result: item.action === 'approve' ? 'approved' : 'rejected',
      created_at: item.timestamp,
      title: item.content_preview?.substring(0, 50) + '...' || '无标题'
    }));

    // 增强的仪表板数据，支持三层审核系统
    const dashboardData = {
      stats: {
        total_pending: pendingStats.total_pending || 0,
        today_completed: todayCompleted.count || 0,
        total_completed: totalCompleted.count || 0,
        average_review_time: avgTime.avg_minutes || 5.2,
        pending_by_level: {
          rule_flagged: pendingStats.rule_flagged || 0,
          ai_flagged: pendingStats.ai_flagged || 0,
          user_complaints: pendingStats.manual_review || 0
        },
        pending_by_type: typeStats,
        pending_by_priority: {
          urgent: pendingStats.manual_review || 0,
          high: pendingStats.ai_flagged || 0,
          medium: pendingStats.rule_flagged || 0,
          low: 0
        }
      },
      recent_activities: formattedActivities,
      performance_metrics: {
        approval_rate: approvalRate,
        average_daily_reviews: totalCompleted.count > 0 ? totalCompleted.count / 30 : 0,
        quality_score: 0.92 // 暂时固定值，后续可以基于审核质量计算
      },
      // 保持向后兼容
      summary: {
        pendingCount: pendingStats.total_pending || 0,
        completedToday: todayCompleted.count || 0,
        approvalRate: Math.round(approvalRate * 100)
      },
      user: {
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    };

    console.log(`[SIMPLE_REVIEWER] Dashboard data generated for: ${user.username}`);
    return jsonResponse(successResponse(dashboardData, '仪表板数据获取成功'));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] Dashboard error:', error);
    return jsonResponse(errorResponse('获取仪表板数据失败', 500));
  }
});

// 获取待审核列表
simpleReviewer.get('/pending-reviews', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const auditLevel = url.searchParams.get('audit_level') || '';
    const priority = url.searchParams.get('priority') || '';

    console.log(`[SIMPLE_REVIEWER] Pending reviews request from: ${user.username}, page: ${page}`);

    // 构建查询条件
    let whereConditions = ["status IN ('pending', 'manual_review')"];
    const params: any[] = [];

    if (auditLevel) {
      const levelMap: any = { 'rule_based': 1, 'ai_assisted': 2, 'manual_review': 3 };
      whereConditions.push('audit_level = ?');
      params.push(levelMap[auditLevel] || 1);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM pending_stories WHERE ${whereClause}`;
    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult.total || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT
        ps.id,
        ps.user_id,
        ps.content,
        ps.status,
        ps.audit_level,
        ps.created_at,
        ps.rule_audit_result,
        ps.ai_audit_result,
        ps.user_ip
      FROM pending_stories ps
      WHERE ${whereClause}
      ORDER BY
        CASE
          WHEN ps.audit_level = 3 THEN 1
          WHEN ps.audit_level = 2 THEN 2
          ELSE 3
        END,
        ps.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const dataResult = await db.prepare(dataQuery).bind(...params, pageSize, offset).all();

    // 格式化数据
    const reviews = dataResult.results.map((item: any) => {
      const ruleResult = safeJSONParse(item.rule_audit_result);
      const aiResult = safeJSONParse(item.ai_audit_result);

      return {
        id: item.id,
        content_type: 'story',
        title: item.content?.substring(0, 50) + '...' || '无标题',
        content_preview: item.content?.substring(0, 200) + '...' || '',
        full_content: item.content,
        author: {
          user_id: item.user_id,
          username: `用户${item.user_id}`,
          is_anonymous: false
        },
        audit_level: item.audit_level === 1 ? 'rule_based' : item.audit_level === 2 ? 'ai_assisted' : 'manual_review',
        priority: calculatePriority(item),
        submitted_at: item.created_at,
        status: item.status,
        category: '就业故事',
        tags: [],
        risk_score: ruleResult?.risk_score || aiResult?.confidence || 0.5,
        risk_factors: [],
        rule_audit_result: ruleResult,
        ai_audit_result: aiResult
      };
    });

    const result = {
      reviews,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };

    console.log(`[SIMPLE_REVIEWER] Returning ${reviews.length} pending reviews (total: ${total})`);
    return jsonResponse(successResponse(result, '待审核列表获取成功'));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] Pending reviews error:', error);
    return jsonResponse(errorResponse('获取待审核列表失败', 500));
  }
});

// 提交审核结果
simpleReviewer.post('/submit-review', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    const body = await c.req.json();
    const { auditId, action, reason } = body;

    console.log(`[SIMPLE_REVIEWER] Review submission from: ${user.username}, auditId: ${auditId}, action: ${action}`);

    // 验证必需字段
    if (!auditId || !action) {
      return jsonResponse(errorResponse('审核ID和操作不能为空', 400));
    }

    // 验证操作类型
    if (!['approve', 'reject'].includes(action)) {
      return jsonResponse(errorResponse('无效的操作类型', 400));
    }

    // 1. 获取待审核故事
    const story = await db.prepare(`
      SELECT * FROM pending_stories WHERE id = ?
    `).bind(auditId).first();

    if (!story) {
      return jsonResponse(errorResponse('审核内容不存在', 404));
    }

    // 2. 更新pending_stories状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await db.prepare(`
      UPDATE pending_stories
      SET status = ?,
          manual_audit_at = CURRENT_TIMESTAMP,
          manual_audit_result = ?
      WHERE id = ?
    `).bind(
      newStatus,
      JSON.stringify({
        action,
        reason: reason || '',
        reviewer: user.username,
        reviewed_at: new Date().toISOString()
      }),
      auditId
    ).run();

    // 3. 更新manual_review_queue
    await db.prepare(`
      UPDATE manual_review_queue
      SET status = 'completed',
          review_result = ?,
          review_reason = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE pending_story_id = ?
    `).bind(action, reason || '', auditId).run();

    // 4. 如果通过，将内容移到valid_stories表
    if (action === 'approve') {
      await db.prepare(`
        INSERT INTO valid_stories (
          raw_id, data_uuid, user_id, title, content,
          category, tags, author_name, audit_status,
          approved_at, published_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        auditId,
        `story_${auditId}_${Date.now()}`,
        story.user_id,
        story.content?.substring(0, 100) || '无标题',
        story.content,
        'general',
        '[]',
        `用户${story.user_id}`,
        'approved'
      ).run();
    }

    const result = {
      auditId,
      action,
      reason: reason || '',
      reviewerId: user.id,
      reviewerName: user.name,
      reviewedAt: new Date().toISOString(),
      status: 'success'
    };

    console.log(`[SIMPLE_REVIEWER] Review ${action} successful for audit: ${auditId}`);
    return jsonResponse(successResponse(result, `审核${action === 'approve' ? '通过' : '拒绝'}成功`));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] Submit review error:', error);
    return jsonResponse(errorResponse('提交审核失败: ' + error.message, 500));
  }
});

// 获取审核历史
simpleReviewer.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const decision = url.searchParams.get('decision') || '';

    console.log(`[SIMPLE_REVIEWER] History request from: ${user.username}, page: ${page}`);

    // 构建查询条件
    let whereConditions = ["mrq.status = 'completed'", "mrq.assigned_to = ?"];
    const params: any[] = [user.username];

    if (decision) {
      whereConditions.push('mrq.review_result = ?');
      params.push(decision);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM manual_review_queue mrq
      WHERE ${whereClause}
    `;
    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = countResult.total || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT
        mrq.id,
        mrq.pending_story_id,
        mrq.review_result,
        mrq.review_reason,
        mrq.completed_at,
        mrq.started_at,
        ps.content,
        ps.user_id,
        ps.audit_level
      FROM manual_review_queue mrq
      JOIN pending_stories ps ON mrq.pending_story_id = ps.id
      WHERE ${whereClause}
      ORDER BY mrq.completed_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataResult = await db.prepare(dataQuery).bind(...params, pageSize, offset).all();

    // 格式化数据
    const reviews = dataResult.results.map((item: any) => {
      // 计算审核时长（分钟）
      let reviewTime = 0;
      if (item.started_at && item.completed_at) {
        const start = new Date(item.started_at).getTime();
        const end = new Date(item.completed_at).getTime();
        reviewTime = Math.round((end - start) / 60000); // 转换为分钟
      }

      return {
        id: item.id,
        content_type: 'story',
        title: item.content?.substring(0, 50) + '...' || '无标题',
        content_preview: item.content?.substring(0, 200) + '...' || '',
        author: {
          user_id: item.user_id,
          username: `用户${item.user_id}`,
          is_anonymous: false
        },
        audit_level: item.audit_level === 1 ? 'rule_based' : item.audit_level === 2 ? 'ai_assisted' : 'manual_review',
        status: item.review_result === 'approve' ? 'approved' : 'rejected',
        reviewerId: user.id,
        reviewerName: user.name,
        reviewedAt: item.completed_at,
        review_reason: item.review_reason,
        review_time_minutes: reviewTime
      };
    });

    const result = {
      reviews,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };

    console.log(`[SIMPLE_REVIEWER] Returning ${reviews.length} history records (total: ${total})`);
    return jsonResponse(successResponse(result, '审核历史获取成功'));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] History error:', error);
    return jsonResponse(errorResponse('获取审核历史失败', 500));
  }
});

// 获取审核统计
simpleReviewer.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    console.log(`[SIMPLE_REVIEWER] Stats request from: ${user.username}`);

    // 获取待审核统计
    const pendingStats = await db.prepare(`
      SELECT COUNT(*) as count
      FROM pending_stories
      WHERE status IN ('pending', 'manual_review')
    `).first();

    // 获取已审核统计
    const reviewedStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN review_result = 'approve' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN review_result = 'reject' THEN 1 ELSE 0 END) as rejected
      FROM manual_review_queue
      WHERE assigned_to = ?
      AND status = 'completed'
    `).bind(user.username).first();

    const stats = {
      total: (pendingStats.count || 0) + (reviewedStats.total || 0),
      pending: pendingStats.count || 0,
      approved: reviewedStats.approved || 0,
      rejected: reviewedStats.rejected || 0
    };

    console.log(`[SIMPLE_REVIEWER] Stats generated:`, stats);
    return jsonResponse(successResponse(stats, '审核统计获取成功'));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] Stats error:', error);
    return jsonResponse(errorResponse('获取审核统计失败', 500));
  }
});

export default simpleReviewer;

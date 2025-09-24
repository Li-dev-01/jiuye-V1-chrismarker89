// 简化审核员路由 - 专为reviewer-admin-dashboard设计
import { Hono } from 'hono';
import type { Env } from '../types/api';
import { successResponse, errorResponse, jsonResponse } from '../utils/response';
import { simpleAuthMiddleware, requireRole } from '../middleware/simpleAuth';

const simpleReviewer = new Hono<{ Bindings: Env }>();

// 应用简化认证中间件
simpleReviewer.use('*', simpleAuthMiddleware);
simpleReviewer.use('*', requireRole('reviewer', 'admin', 'super_admin'));

// 生成模拟审核数据（增强版，支持三层审核系统）
function generateMockReviewData() {
  const contentTypes = ['story', 'questionnaire', 'heart_voice'];
  const statuses = ['pending', 'approved', 'rejected'];
  const auditLevels = ['rule_based', 'ai_assisted', 'manual_review'];
  const priorities = ['urgent', 'high', 'medium', 'low'];

  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    content_type: contentTypes[i % contentTypes.length],
    title: `待审核内容 ${i + 1} - ${['实习经验分享', '求职心得', '职场感悟', '面试技巧'][i % 4]}`,
    content_preview: `这是第 ${i + 1} 条待审核的内容，需要审核员进行审核处理。内容涉及就业相关话题...`,
    full_content: `完整内容：这是第 ${i + 1} 条待审核的内容，包含详细的就业经历分享。用户分享了自己在求职过程中的经验和感悟，对其他学生具有参考价值。`,
    author: {
      user_id: `user_${String(i + 1).padStart(3, '0')}`,
      username: `用户${i + 1}`,
      is_anonymous: i % 3 === 0
    },
    audit_level: auditLevels[i % auditLevels.length],
    priority: priorities[i % priorities.length],
    submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: i < 8 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)],
    category: ['就业故事', '求职经历', '职场感悟'][Math.floor(Math.random() * 3)],
    tags: [
      ['实习经验', '科技行业'],
      ['求职技巧', '面试经验'],
      ['职场感悟', '新人指导'],
      ['创业经历', '团队管理']
    ][i % 4],
    risk_score: Math.random() * 0.8 + 0.2, // 0.2-1.0
    risk_factors: i % 2 === 0 ? ['AI标记敏感内容'] : ['用户投诉', '内容争议'],

    // 规则审核结果（如果经过规则审核）
    rule_audit_result: i % 3 === 0 ? {
      passed: i % 6 !== 0,
      violations: i % 6 === 0 ? [{
        rule_id: 'sensitive_content',
        category: '敏感内容',
        matched_text: '敏感词汇',
        severity: 'medium' as const,
        confidence: 0.8
      }] : [],
      risk_score: Math.random() * 0.5,
      processing_time_ms: 50
    } : undefined,

    // AI审核结果（如果经过AI审核）
    ai_audit_result: i % 2 === 0 ? {
      passed: i % 4 !== 0,
      confidence: Math.random() * 0.4 + 0.6,
      risk_categories: i % 4 === 0 ? ['potential_sensitive_content'] : [],
      flagged_content: i % 4 === 0 ? [{
        text: '可能的敏感内容',
        reason: '内容可能包含敏感信息',
        confidence: 0.7
      }] : [],
      model_version: 'v2.1',
      processing_time_ms: 150
    } : undefined,

    // 用户投诉信息（部分内容有投诉）
    complaint_info: i % 5 === 0 ? {
      complaint_count: Math.floor(Math.random() * 3) + 1,
      complaint_reasons: ['内容不准确', '误导性信息'],
      latest_complaint_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    } : undefined
  }));
}

// 获取审核员仪表板数据
simpleReviewer.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');
    console.log(`[SIMPLE_REVIEWER] Dashboard request from: ${user.username}`);

    // 生成模拟统计数据
    const mockData = generateMockReviewData();
    const pendingCount = mockData.filter(item => item.status === 'pending').length;
    const approvedCount = mockData.filter(item => item.status === 'approved').length;
    const rejectedCount = mockData.filter(item => item.status === 'rejected').length;
    const totalCount = mockData.length;

    // 今日审核数据（模拟）
    const todayReviews = Math.floor(Math.random() * 10) + 5;

    // 最近活动
    const recentActivity = mockData
      .filter(item => item.status !== 'pending')
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        content_type: item.contentType,
        audit_result: item.status,
        created_at: item.submittedAt,
        title: item.title
      }));

    // 增强的仪表板数据，支持三层审核系统
    const dashboardData = {
      stats: {
        total_pending: pendingCount,
        today_completed: todayReviews,
        total_completed: totalCount,
        average_review_time: 5.2,
        pending_by_level: {
          rule_flagged: Math.floor(pendingCount * 0.2),
          ai_flagged: Math.floor(pendingCount * 0.5),
          user_complaints: Math.floor(pendingCount * 0.3)
        },
        pending_by_type: {
          story: Math.floor(pendingCount * 0.6),
          questionnaire: Math.floor(pendingCount * 0.25),
          heart_voice: Math.floor(pendingCount * 0.15)
        },
        pending_by_priority: {
          urgent: Math.floor(pendingCount * 0.1),
          high: Math.floor(pendingCount * 0.3),
          medium: Math.floor(pendingCount * 0.5),
          low: Math.floor(pendingCount * 0.1)
        }
      },
      recent_activities: recentActivity,
      performance_metrics: {
        approval_rate: totalCount > 0 ? (approvedCount / totalCount) : 0.85,
        average_daily_reviews: 15.3,
        quality_score: 0.92
      },
      // 保持向后兼容
      summary: {
        pendingCount: pendingCount,
        completedToday: todayReviews,
        approvalRate: totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0
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
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const contentType = url.searchParams.get('content_type') || '';

    console.log(`[SIMPLE_REVIEWER] Pending reviews request from: ${user.username}, page: ${page}, contentType: ${contentType}`);

    // 生成模拟数据
    let mockData = generateMockReviewData().filter(item => item.status === 'pending');

    // 按内容类型筛选
    if (contentType) {
      mockData = mockData.filter(item => item.contentType === contentType);
    }

    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = mockData.slice(startIndex, endIndex);

    const result = {
      reviews: paginatedData,
      pagination: {
        total: mockData.length,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(mockData.length / pageSize)
      }
    };

    console.log(`[SIMPLE_REVIEWER] Returning ${paginatedData.length} pending reviews`);
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

    // 模拟审核处理
    const result = {
      auditId: auditId,
      action: action,
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
    return jsonResponse(errorResponse('提交审核失败', 500));
  }
});

// 获取审核历史
simpleReviewer.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    console.log(`[SIMPLE_REVIEWER] History request from: ${user.username}, page: ${page}`);

    // 生成模拟历史数据
    const mockData = generateMockReviewData()
      .filter(item => item.status !== 'pending')
      .map(item => ({
        ...item,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = mockData.slice(startIndex, endIndex);

    const result = {
      reviews: paginatedData,
      pagination: {
        total: mockData.length,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(mockData.length / pageSize)
      }
    };

    console.log(`[SIMPLE_REVIEWER] Returning ${paginatedData.length} history records`);
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
    console.log(`[SIMPLE_REVIEWER] Stats request from: ${user.username}`);

    // 生成模拟统计数据
    const mockData = generateMockReviewData();
    const stats = {
      total: mockData.length,
      pending: mockData.filter(item => item.status === 'pending').length,
      approved: mockData.filter(item => item.status === 'approved').length,
      rejected: mockData.filter(item => item.status === 'rejected').length
    };

    console.log(`[SIMPLE_REVIEWER] Stats generated:`, stats);
    return jsonResponse(successResponse(stats, '审核统计获取成功'));

  } catch (error: any) {
    console.error('[SIMPLE_REVIEWER] Stats error:', error);
    return jsonResponse(errorResponse('获取审核统计失败', 500));
  }
});

export default simpleReviewer;

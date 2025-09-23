// Reviewer API Routes - TypeScript版本

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { DatabaseManager, paginatedQuery } from '../utils/database';
import { successResponse, errorResponse, jsonResponse, parsePaginationParams, validateRequired } from '../utils/response';
import type { AuditRecord, ReviewRequest, ReviewStats } from '../types/entities';

const reviewer = new Hono<{ Bindings: Env }>();

// 生成模拟审核数据
function generateMockReviews(contentType: string, pageSize: number) {
  const mockData = [];
  const count = Math.min(pageSize, 10); // 最多返回10条

  for (let i = 1; i <= count; i++) {
    if (contentType === 'heart_voice' || contentType === '') {
      mockData.push({
        auditId: 1000 + i,
        contentType: 'heart_voice',
        contentId: i,
        contentUuid: `heart-voices-${String(i).padStart(3, '0')}`,
        userId: `test-user-${String(i).padStart(3, '0')}`,
        authorName: `用户${i}`,
        auditResult: 'pending',
        contentPreview: `心声分享 - ${getRandomVoiceContent()}...`,
        data: {
          content: getRandomVoiceContent(),
          category: getRandomCategory(),
          emotion_score: Math.floor(Math.random() * 5) + 1
        },
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        reviewerId: null,
        reviewerName: null,
        reviewNotes: null,
        reviewedAt: null
      });
    }

    if (contentType === 'story' || contentType === '') {
      mockData.push({
        auditId: 2000 + i,
        contentType: 'story',
        contentId: i,
        contentUuid: `story-${String(i).padStart(3, '0')}`,
        userId: `test-user-${String(i).padStart(3, '0')}`,
        authorName: `用户${i}`,
        auditResult: 'pending',
        contentPreview: `故事分享 - ${getRandomStoryTitle()}`,
        data: {
          title: getRandomStoryTitle(),
          content: getRandomStoryContent(),
          category: getRandomCategory()
        },
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        reviewerId: null,
        reviewerName: null,
        reviewNotes: null,
        reviewedAt: null
      });
    }
  }

  return mockData.filter(item =>
    contentType === '' || item.contentType === contentType
  ).slice(0, pageSize);
}

function getRandomVoiceContent() {
  const contents = [
    '找工作真的太难了，投了几十份简历都没有回音',
    '刚毕业就要面对房租、生活费等各种压力',
    '面试了好几家公司，都说我经验不足',
    '看到同学们都找到了不错的工作，而我还在待业',
    '专业对口的工作很少，考虑转行但又担心从零开始'
  ];
  return contents[Math.floor(Math.random() * contents.length)];
}

function getRandomStoryTitle() {
  const titles = [
    '求职路上的挫折与成长',
    '第一份工作的酸甜苦辣',
    '转行的勇气与代价',
    '创业失败后的反思',
    '考研还是工作的选择'
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}

function getRandomStoryContent() {
  const contents = [
    '毕业后的求职路比想象中更加艰难。连续几个月的投简历、面试、被拒绝，让我一度怀疑自己的能力...',
    '刚入职场的时候什么都不懂，经常加班到很晚，工资也不高。但是同事们都很友善，领导也很耐心...',
    '工作了两年后发现这个行业并不适合自己，决定转行学习编程。虽然要从零开始，收入也会减少...',
    '和朋友一起创业做了一个小项目，但是由于经验不足和市场判断错误，最终失败了...',
    '面临毕业时最大的困惑就是考研还是直接工作。经过深思熟虑，我选择了先工作积累经验...'
  ];
  return contents[Math.floor(Math.random() * contents.length)];
}

function getRandomCategory() {
  const categories = ['求职困惑', '生活压力', '职业规划', '就业焦虑', '学习成长'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// 获取待审核列表
reviewer.get('/pending-reviews', async (c) => {
  try {
    const db = new DatabaseManager(c.env);
    const url = new URL(c.req.url);
    const pagination = parsePaginationParams(url);
    const contentType = url.searchParams.get('content_type') || '';

    // 临时返回模拟数据来测试前端功能
    const mockReviews = generateMockReviews(contentType, pagination.pageSize);

    return jsonResponse(successResponse({
      reviews: mockReviews,
      pagination: {
        total: mockReviews.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 1
      }
    }, '待审核列表获取成功'));

    // 原始数据库查询代码（暂时注释）
    /*
    // 构建查询条件
    let whereClause = "ar.audit_result = 'pending'";
    const params: any[] = [];

    if (contentType) {
      whereClause += " AND ar.content_type = ?";
      params.push(contentType);
    }

    // 原始数据库查询代码（暂时注释）
    /*
    const baseQuery = `
      SELECT
        ar.id as auditId,
        ar.content_type,
        ar.content_id,
        ar.content_uuid,
        ar.user_uuid,
        ar.audit_result,
        ar.created_at,
        ar.reviewer_id,
        ar.reviewer_name,
        ar.review_notes,
        ar.reviewed_at,
        CASE
          WHEN ar.content_type = 'questionnaire' THEN
            CONCAT('问卷调查 - 用户:', COALESCE(u1.nickname, '匿名用户'))
          WHEN ar.content_type = 'heart_voice' THEN
            CONCAT('心声分享 - ', SUBSTRING(hv.content, 1, 50), '...')
          WHEN ar.content_type = 'story' THEN
            CONCAT('故事分享 - ', s.title)
          ELSE '未知内容'
        END as content_preview,
        CASE
          WHEN ar.content_type = 'questionnaire' THEN qr.data
          WHEN ar.content_type = 'heart_voice' THEN JSON_OBJECT(
            'content', hv.content,
            'category', hv.category,
            'emotion_score', hv.emotion_score
          )
          WHEN ar.content_type = 'story' THEN JSON_OBJECT(
            'title', s.title,
            'content', s.content,
            'category', s.category
          )
          ELSE NULL
        END as data,
        COALESCE(u2.nickname, '匿名用户') as authorName
      FROM audit_records ar
      LEFT JOIN raw_questionnaire_responses qr ON ar.content_type = 'questionnaire' AND ar.content_id = qr.id
      LEFT JOIN raw_heart_voices hv ON ar.content_type = 'heart_voice' AND ar.content_id = hv.id
      LEFT JOIN raw_story_submissions s ON ar.content_type = 'story' AND ar.content_id = s.id
      LEFT JOIN users u1 ON qr.user_id = u1.id
      LEFT JOIN users u2 ON ar.user_uuid = u2.uuid
      WHERE ${whereClause}
      ORDER BY ar.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM audit_records ar
      WHERE ${whereClause}
    `;

    const result = await paginatedQuery(
      db,
      baseQuery,
      countQuery,
      params,
      pagination
    );

    // 格式化返回数据
    const formattedReviews = result.items.map((item: any) => ({
      auditId: item.auditId,
      contentType: item.content_type,
      contentId: item.content_id,
      contentUuid: item.content_uuid,
      userId: item.user_uuid,
      authorName: item.authorName,
      auditResult: item.audit_result,
      contentPreview: item.content_preview,
      data: item.data ? JSON.parse(item.data) : null,
      createdAt: item.created_at,
      reviewerId: item.reviewer_id,
      reviewerName: item.reviewer_name,
      reviewNotes: item.review_notes,
      reviewedAt: item.reviewed_at
    }));

    return jsonResponse(successResponse({
      reviews: formattedReviews,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    }, '待审核列表获取成功'));
    */

  } catch (error) {
    console.error('Get pending reviews error:', error);
    return errorResponse('Failed to fetch pending reviews', 500);
  }
});

// 提交审核结果
reviewer.post('/submit-review', async (c) => {
  try {
    const db = new DatabaseManager(c.env);
    const data = await c.req.json() as ReviewRequest;

    // 验证必需字段
    const validationError = validateRequired(data, ['auditId', 'action', 'reviewerId']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    const { auditId, action, reviewerId, reason } = data;

    // 验证action值
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('Invalid action. Must be "approve" or "reject"', 400);
    }

    // 检查审核记录是否存在
    const auditRecord = await db.queryFirst<{
      id: number;
      content_type: string;
      content_id: number;
      audit_result: string;
    }>(`
      SELECT id, content_type, content_id, audit_result
      FROM audit_records
      WHERE id = ?
    `, [auditId]);

    if (!auditRecord) {
      return errorResponse('Audit record not found', 404);
    }

    if (auditRecord.audit_result !== 'pending') {
      return errorResponse('This record has already been reviewed', 400);
    }

    const auditResult = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    // 开始事务处理
    const statements = [
      // 更新审核记录
      {
        sql: `
          UPDATE audit_records 
          SET audit_result = ?, reviewer_id = ?, review_notes = ?, reviewed_at = ?
          WHERE id = ?
        `,
        params: [auditResult, reviewerId, reason || '', now, auditId]
      }
    ];

    // 如果审核通过，需要将数据移动到有效表
    if (action === 'approve') {
      const { content_type, content_id } = auditRecord;

      if (content_type === 'questionnaire') {
        statements.push({
          sql: `
            INSERT INTO valid_questionnaire_responses 
            (data_uuid, user_id, user_uuid, data, ip_address, user_agent, audit_status, created_at)
            SELECT data_uuid, user_id, user_uuid, data, ip_address, user_agent, 'approved', ?
            FROM raw_questionnaire_responses
            WHERE id = ?
          `,
          params: [now, content_id]
        });
      } else if (content_type === 'heart_voice') {
        statements.push({
          sql: `
            INSERT INTO valid_heart_voices 
            (data_uuid, user_id, user_uuid, content, category, emotion_score, tags, is_anonymous, audit_status, created_at)
            SELECT data_uuid, user_id, user_uuid, content, category, emotion_score, tags, is_anonymous, 'approved', ?
            FROM raw_heart_voices
            WHERE id = ?
          `,
          params: [now, content_id]
        });
      } else if (content_type === 'story') {
        statements.push({
          sql: `
            INSERT INTO valid_stories 
            (data_uuid, user_id, user_uuid, title, content, category, tags, is_anonymous, audit_status, created_at)
            SELECT data_uuid, user_id, user_uuid, title, content, category, tags, is_anonymous, 'approved', ?
            FROM raw_story_submissions
            WHERE id = ?
          `,
          params: [now, content_id]
        });
      }
    }

    // 执行批量操作
    await db.batch(statements);

    return jsonResponse(successResponse({
      auditId,
      action,
      result: auditResult,
      reviewedAt: now
    }, `审核${action === 'approve' ? '通过' : '拒绝'}成功`));

  } catch (error) {
    console.error('Submit review error:', error);
    return errorResponse('Failed to submit review', 500);
  }
});

// 获取审核统计
reviewer.get('/stats', async (c) => {
  try {
    const db = new DatabaseManager(c.env);

    const stats = await db.queryFirst<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN audit_result = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN audit_result = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN audit_result = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM audit_records
    `);

    const result: ReviewStats = {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      approved: stats?.approved || 0,
      rejected: stats?.rejected || 0
    };

    return jsonResponse(successResponse(result, '审核统计获取成功'));

  } catch (error) {
    console.error('Get review stats error:', error);
    return errorResponse('Failed to fetch review stats', 500);
  }
});

export default reviewer;

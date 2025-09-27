// 违规内容管理 API Routes

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { DatabaseManager, paginatedQuery } from '../utils/database';
import { successResponse, errorResponse, jsonResponse, parsePaginationParams, validateRequired } from '../utils/response';

const violations = new Hono<{ Bindings: Env }>();

// 违规内容类型定义
interface ViolationRecord {
  id: number;
  contentType: 'heart_voice' | 'story';
  contentId: number;
  contentUuid: string;
  contentTitle?: string;
  contentPreview: string;
  fullContent: string;
  authorName: string;
  authorUuid: string;
  rejectionReason: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high';
  reviewerId: string;
  reviewerName: string;
  reviewNotes: string;
  rejectedAt: string;
  createdAt: string;
  tags?: string[];
  metadata?: any;
}

// 生成模拟违规数据
function generateMockViolations(filters: any = {}) {
  const mockData: ViolationRecord[] = [

    {
      id: 2,
      contentType: 'story',
      contentId: 201,
      contentUuid: 'story-001',
      contentTitle: '我的求职血泪史',
      contentPreview: '面试官问我一些很奇怪的问题，感觉有性别歧视，还问我什么时候结婚生孩子...',
      fullContent: '面试官问我一些很奇怪的问题，感觉有性别歧视，还问我什么时候结婚生孩子，是不是打算在这个城市定居等等。我觉得这些问题和工作能力没有关系，但是又不敢直接拒绝回答。后来我了解到这种行为确实是违法的，但是很多公司都这样做。',
      authorName: '用户小李',
      authorUuid: 'user-002',
      rejectionReason: '涉及敏感话题，可能引起争议',
      violationType: '敏感内容',
      severity: 'high',
      reviewerId: 'reviewer002',
      reviewerName: '审核员B',
      reviewNotes: '内容涉及就业歧视等敏感话题，虽然是真实经历但可能引起不必要的争议和法律风险',
      rejectedAt: '2024-08-10 16:45:00',
      createdAt: '2024-08-10 12:20:00',
      tags: ['面试经历', '就业歧视', '敏感话题'],
      metadata: { ip: '192.168.1.101', userAgent: 'Mozilla/5.0...' }
    },

    {
      id: 4,
      contentType: 'story',
      contentId: 202,
      contentUuid: 'story-002',
      contentTitle: '某大厂内幕爆料',
      contentPreview: 'XX公司内部管理混乱，财务造假，员工工资经常拖欠...',
      fullContent: 'XX公司内部管理混乱，财务造假，员工工资经常拖欠，高管贪污腐败。我有内部文件可以证明这些，希望大家不要去这家公司。',
      authorName: '爆料人',
      authorUuid: 'user-004',
      rejectionReason: '涉嫌诽谤和虚假信息',
      violationType: '虚假信息',
      severity: 'high',
      reviewerId: 'reviewer003',
      reviewerName: '审核员C',
      reviewNotes: '内容涉嫌对特定公司的诽谤，缺乏可靠证据支持，存在法律风险',
      rejectedAt: '2024-08-09 20:15:00',
      createdAt: '2024-08-09 18:45:00',
      tags: ['公司爆料', '虚假信息', '诽谤'],
      metadata: { ip: '192.168.1.103', userAgent: 'Mozilla/5.0...' }
    },

  ];

  // 应用筛选条件
  let filteredData = mockData;
  
  if (filters.contentType) {
    filteredData = filteredData.filter(item => item.contentType === filters.contentType);
  }
  
  if (filters.severity) {
    filteredData = filteredData.filter(item => item.severity === filters.severity);
  }
  
  if (filters.violationType) {
    filteredData = filteredData.filter(item => item.violationType === filters.violationType);
  }

  return filteredData;
}

// 获取违规内容列表
violations.get('/list', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePaginationParams(url);
    const contentType = url.searchParams.get('contentType') || '';
    const severity = url.searchParams.get('severity') || '';
    const violationType = url.searchParams.get('violationType') || '';

    // 使用模拟数据
    const allViolations = generateMockViolations({
      contentType,
      severity,
      violationType
    });

    // 分页处理
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedViolations = allViolations.slice(startIndex, endIndex);

    return jsonResponse(successResponse({
      violations: paginatedViolations,
      total: allViolations.length,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(allViolations.length / pagination.pageSize)
    }, '违规内容列表获取成功'));

  } catch (error) {
    console.error('Get violation list error:', error);
    return errorResponse('Failed to fetch violation list', 500);
  }
});

// 获取违规内容详情
violations.get('/:id', async (c) => {
  try {
    const violationId = parseInt(c.req.param('id'));
    const allViolations = generateMockViolations();
    const violation = allViolations.find(v => v.id === violationId);

    if (!violation) {
      return errorResponse('Violation record not found', 404);
    }

    return jsonResponse(successResponse(violation, '违规内容详情获取成功'));

  } catch (error) {
    console.error('Get violation detail error:', error);
    return errorResponse('Failed to fetch violation detail', 500);
  }
});

// 获取违规统计数据
violations.get('/stats', async (c) => {
  try {
    const allViolations = generateMockViolations();
    
    // 计算统计数据
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisMonthStart = new Date();
    thisMonthStart.setDate(thisMonthStart.getDate() - 30);

    const stats = {
      total_violations: allViolations.length,
      today_violations: allViolations.filter(v => v.rejectedAt.startsWith(today)).length,
      this_week_violations: allViolations.filter(v => new Date(v.rejectedAt) >= thisWeekStart).length,
      this_month_violations: allViolations.filter(v => new Date(v.rejectedAt) >= thisMonthStart).length,
      high_severity: allViolations.filter(v => v.severity === 'high').length,
      medium_severity: allViolations.filter(v => v.severity === 'medium').length,
      low_severity: allViolations.filter(v => v.severity === 'low').length,
      most_common_type: '不当言论',
      violation_types: [
        { type: '不当言论', count: 1, percentage: 20 },
        { type: '敏感内容', count: 1, percentage: 20 },
        { type: '消极内容', count: 1, percentage: 20 },
        { type: '虚假信息', count: 1, percentage: 20 },
        { type: '垃圾信息', count: 1, percentage: 20 }
      ],
      trend_data: [
        { date: '2024-08-04', count: 0 },
        { date: '2024-08-05', count: 1 },
        { date: '2024-08-06', count: 0 },
        { date: '2024-08-07', count: 1 },
        { date: '2024-08-08', count: 0 },
        { date: '2024-08-09', count: 2 },
        { date: '2024-08-10', count: 3 }
      ]
    };

    return jsonResponse(successResponse(stats, '违规统计数据获取成功'));

  } catch (error) {
    console.error('Get violation stats error:', error);
    return errorResponse('Failed to fetch violation stats', 500);
  }
});

// 删除违规记录
violations.delete('/:id', async (c) => {
  try {
    const violationId = parseInt(c.req.param('id'));
    
    // 这里应该实现真实的删除逻辑
    // 暂时返回成功响应
    return jsonResponse(successResponse({
      id: violationId,
      deleted: true
    }, '违规记录删除成功'));

  } catch (error) {
    console.error('Delete violation error:', error);
    return errorResponse('Failed to delete violation record', 500);
  }
});

// 批量删除违规记录
violations.post('/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Invalid violation IDs', 400);
    }

    // 这里应该实现真实的批量删除逻辑
    // 暂时返回成功响应
    return jsonResponse(successResponse({
      deletedIds: ids,
      count: ids.length
    }, `成功删除 ${ids.length} 条违规记录`));

  } catch (error) {
    console.error('Batch delete violations error:', error);
    return errorResponse('Failed to batch delete violations', 500);
  }
});

// 获取违规类型列表
violations.get('/types', async (c) => {
  try {
    const types = ['不当言论', '敏感内容', '消极内容', '虚假信息', '垃圾信息', '其他'];
    
    return jsonResponse(successResponse(types, '违规类型列表获取成功'));

  } catch (error) {
    console.error('Get violation types error:', error);
    return errorResponse('Failed to fetch violation types', 500);
  }
});

export default violations;

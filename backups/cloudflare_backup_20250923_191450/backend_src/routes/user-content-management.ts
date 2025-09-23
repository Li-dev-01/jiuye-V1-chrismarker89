/**
 * 用户内容管理API路由
 * 用于管理用户提交的问卷、心声、故事等内容
 * 支持IP地址筛选、批量删除、重复检测等功能
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  ErrorCodes
} from '../utils/standardResponse';

const userContentManagement = new Hono<{ Bindings: Env }>();

// 内容类型枚举
export enum ContentType {
  QUESTIONNAIRE = 'questionnaire',
  HEART_VOICE = 'heart_voice',
  STORY = 'story'
}

// 用户内容记录接口
export interface UserContentRecord {
  id: string;
  contentType: ContentType;
  contentId: string;
  userId: string;
  userUuid?: string;
  ipAddress: string;
  userAgent?: string;
  content: string;
  contentSummary: string;
  submittedAt: string;
  status: 'active' | 'deleted' | 'flagged';
  duplicateCount?: number;
  relatedRecords?: string[];
}

// 筛选参数接口
export interface ContentFilterParams {
  page?: number;
  pageSize?: number;
  contentType?: ContentType;
  userId?: string;
  ipAddress?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  duplicatesOnly?: boolean;
}

/**
 * 获取用户内容列表
 */
userContentManagement.get('/list', authMiddleware, async (c: Context) => {
  try {
    const params: ContentFilterParams = {
      page: parseInt(c.req.query('page') || '1'),
      pageSize: parseInt(c.req.query('pageSize') || '20'),
      contentType: c.req.query('contentType') as ContentType,
      userId: c.req.query('userId'),
      ipAddress: c.req.query('ipAddress'),
      keyword: c.req.query('keyword'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      status: c.req.query('status') || 'active',
      duplicatesOnly: c.req.query('duplicatesOnly') === 'true'
    };

    const db = createDatabaseService(c.env as Env);
    const result = await getUserContentList(db, params);

    return paginatedResponse(c, result.records, {
      page: params.page!,
      pageSize: params.pageSize!,
      total: result.total
    }, '获取用户内容列表成功');

  } catch (error) {
    console.error('获取用户内容列表失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '获取用户内容列表失败');
  }
});

/**
 * 根据内容搜索用户
 */
userContentManagement.post('/search-by-content', authMiddleware, async (c: Context) => {
  try {
    const { keyword, contentType, exactMatch = false } = await c.req.json();

    if (!keyword || keyword.trim().length < 2) {
      return validationErrorResponse(c, '搜索关键词至少需要2个字符');
    }

    const db = createDatabaseService(c.env as Env);
    const results = await searchUsersByContent(db, keyword.trim(), contentType, exactMatch);

    return successResponse(c, {
      keyword,
      contentType,
      exactMatch,
      results,
      total: results.length
    }, '内容搜索完成');

  } catch (error) {
    console.error('内容搜索失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '内容搜索失败');
  }
});

/**
 * 检测重复提交
 */
userContentManagement.get('/duplicates', authMiddleware, async (c: Context) => {
  try {
    const type = c.req.query('type') || 'ip'; // ip | user | content
    const threshold = parseInt(c.req.query('threshold') || '2');
    const contentType = c.req.query('contentType') as ContentType;

    const db = createDatabaseService(c.env as Env);
    const duplicates = await detectDuplicateSubmissions(db, type, threshold, contentType);

    return successResponse(c, {
      type,
      threshold,
      contentType,
      duplicates,
      total: duplicates.length
    }, '重复检测完成');

  } catch (error) {
    console.error('重复检测失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '重复检测失败');
  }
});

/**
 * 获取IP地址统计
 */
userContentManagement.get('/ip-stats', authMiddleware, async (c: Context) => {
  try {
    const db = createDatabaseService(c.env as Env);
    const stats = await getIpAddressStats(db);

    return successResponse(c, stats, '获取IP统计成功');

  } catch (error) {
    console.error('获取IP统计失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '获取IP统计失败');
  }
});

/**
 * 批量删除内容
 */
userContentManagement.post('/batch-delete', authMiddleware, async (c: Context) => {
  try {
    const { 
      ids, 
      ipAddress, 
      userId, 
      contentType,
      reason = '管理员删除'
    } = await c.req.json();

    if (!ids && !ipAddress && !userId) {
      return validationErrorResponse(c, '必须提供删除条件：内容ID、IP地址或用户ID');
    }

    const db = createDatabaseService(c.env as Env);
    const result = await batchDeleteContent(db, {
      ids,
      ipAddress,
      userId,
      contentType,
      reason,
      operatorId: c.get('user')?.id || 'admin'
    });

    return successResponse(c, result, `批量删除完成，共删除 ${result.deletedCount} 条记录`);

  } catch (error) {
    console.error('批量删除失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '批量删除失败');
  }
});

/**
 * 标记可疑内容
 */
userContentManagement.post('/flag-suspicious', authMiddleware, async (c: Context) => {
  try {
    const { ids, reason } = await c.req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return validationErrorResponse(c, '请提供要标记的内容ID');
    }

    const db = createDatabaseService(c.env as Env);
    const result = await flagSuspiciousContent(db, ids, reason, c.get('user')?.id || 'admin');

    return successResponse(c, result, `标记完成，共标记 ${result.flaggedCount} 条记录`);

  } catch (error) {
    console.error('标记可疑内容失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '标记可疑内容失败');
  }
});

/**
 * 获取用户内容统计
 */
userContentManagement.get('/stats', authMiddleware, async (c: Context) => {
  try {
    const db = createDatabaseService(c.env as Env);
    const stats = await getUserContentStats(db);

    return successResponse(c, stats, '获取统计数据成功');

  } catch (error) {
    console.error('获取统计数据失败:', error);
    return errorResponse(c, ErrorCodes.INTERNAL_ERROR, '获取统计数据失败');
  }
});

// ==================== 业务逻辑函数 ====================

/**
 * 获取用户内容列表
 */
async function getUserContentList(db: any, params: ContentFilterParams) {
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  // 构建查询条件
  let whereConditions: string[] = [];
  let queryParams: any[] = [];

  // 基础查询 - 合并所有内容类型
  let baseQuery = `
    SELECT 
      'questionnaire' as content_type,
      id as content_id,
      user_uuid as user_id,
      '' as ip_address,
      responses as content,
      SUBSTR(responses, 1, 100) as content_summary,
      submitted_at,
      'active' as status
    FROM universal_questionnaire_responses
    WHERE 1=1
  `;



  // 添加故事数据
  baseQuery += `
    UNION ALL
    SELECT 
      'story' as content_type,
      id as content_id,
      user_id,
      '' as ip_address,
      content,
      SUBSTR(content, 1, 100) as content_summary,
      created_at as submitted_at,
      'active' as status
    FROM valid_stories
    WHERE audit_status = 'approved'
  `;

  // 应用筛选条件
  if (params.contentType) {
    whereConditions.push(`content_type = ?`);
    queryParams.push(params.contentType);
  }

  if (params.userId) {
    whereConditions.push(`user_id = ?`);
    queryParams.push(params.userId);
  }

  if (params.ipAddress) {
    whereConditions.push(`ip_address = ?`);
    queryParams.push(params.ipAddress);
  }

  if (params.keyword) {
    whereConditions.push(`content LIKE ?`);
    queryParams.push(`%${params.keyword}%`);
  }

  if (params.startDate) {
    whereConditions.push(`submitted_at >= ?`);
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    whereConditions.push(`submitted_at <= ?`);
    queryParams.push(params.endDate);
  }

  // 构建最终查询
  let finalQuery = `SELECT * FROM (${baseQuery}) as combined_content`;
  
  if (whereConditions.length > 0) {
    finalQuery += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  finalQuery += ` ORDER BY submitted_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(pageSize, offset);

  // 执行查询
  const records = await db.query(finalQuery, queryParams);

  // 获取总数
  let countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as combined_content`;
  if (whereConditions.length > 0) {
    countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  const countResult = await db.query(countQuery, queryParams.slice(0, -2));
  const total = Array.isArray(countResult) ? countResult[0]?.total || 0 : countResult?.total || 0;

  return {
    records: Array.isArray(records) ? records : (records as any).results || [],
    total
  };
}

/**
 * 根据内容搜索用户
 */
async function searchUsersByContent(db: any, keyword: string, contentType?: ContentType, exactMatch = false) {
  const searchPattern = exactMatch ? keyword : `%${keyword}%`;
  const operator = exactMatch ? '=' : 'LIKE';
  
  let queries: string[] = [];
  let allResults: any[] = [];

  // 搜索问卷
  if (!contentType || contentType === ContentType.QUESTIONNAIRE) {
    const questionnaireQuery = `
      SELECT 
        'questionnaire' as content_type,
        id as content_id,
        user_uuid as user_id,
        responses as content,
        submitted_at
      FROM universal_questionnaire_responses
      WHERE responses ${operator} ?
      ORDER BY submitted_at DESC
      LIMIT 50
    `;
    const questionnaireResults = await db.query(questionnaireQuery, [searchPattern]);
    allResults.push(...(Array.isArray(questionnaireResults) ? questionnaireResults : (questionnaireResults as any).results || []));
  }



  // 搜索故事
  if (!contentType || contentType === ContentType.STORY) {
    const storyQuery = `
      SELECT 
        'story' as content_type,
        id as content_id,
        user_id,
        content,
        created_at as submitted_at
      FROM valid_stories
      WHERE content ${operator} ? AND audit_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const storyResults = await db.query(storyQuery, [searchPattern]);
    allResults.push(...(Array.isArray(storyResults) ? storyResults : (storyResults as any).results || []));
  }

  // 按时间排序并去重
  return allResults
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 100);
}

/**
 * 检测重复提交
 */
async function detectDuplicateSubmissions(db: any, type: string, threshold: number, contentType?: ContentType) {
  let query = '';
  
  if (type === 'ip') {
    // 按IP地址检测重复
    query = `
      SELECT 
        ip_address,
        COUNT(*) as count,
        GROUP_CONCAT(id) as content_ids,
        MIN(created_at) as first_submission,
        MAX(created_at) as last_submission
      FROM valid_heart_voices
      WHERE ip_address IS NOT NULL AND ip_address != ''
      GROUP BY ip_address
      HAVING COUNT(*) >= ?
      ORDER BY count DESC
    `;
  } else if (type === 'user') {
    // 按用户ID检测重复
    query = `
      SELECT 
        user_id,
        COUNT(*) as count,
        GROUP_CONCAT(id) as content_ids,
        MIN(created_at) as first_submission,
        MAX(created_at) as last_submission
      FROM valid_heart_voices
      WHERE user_id IS NOT NULL
      GROUP BY user_id
      HAVING COUNT(*) >= ?
      ORDER BY count DESC
    `;
  } else if (type === 'content') {
    // 按内容相似度检测重复（简化版本）
    query = `
      SELECT 
        content,
        COUNT(*) as count,
        GROUP_CONCAT(id) as content_ids,
        GROUP_CONCAT(user_id) as user_ids,
        MIN(created_at) as first_submission,
        MAX(created_at) as last_submission
      FROM valid_heart_voices
      WHERE LENGTH(content) > 10
      GROUP BY content
      HAVING COUNT(*) >= ?
      ORDER BY count DESC
    `;
  }

  const results = await db.query(query, [threshold]);
  return Array.isArray(results) ? results : (results as any).results || [];
}

/**
 * 获取IP地址统计
 */
async function getIpAddressStats(db: any) {
  const ipStatsQuery = `
    SELECT 
      ip_address,
      COUNT(*) as submission_count,
      COUNT(DISTINCT user_id) as unique_users,
      MIN(created_at) as first_submission,
      MAX(created_at) as last_submission
    FROM valid_heart_voices
    WHERE ip_address IS NOT NULL AND ip_address != ''
    GROUP BY ip_address
    ORDER BY submission_count DESC
    LIMIT 100
  `;

  const ipStats = await db.query(ipStatsQuery);
  
  const totalQuery = `
    SELECT 
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(*) as total_submissions
    FROM valid_heart_voices
    WHERE ip_address IS NOT NULL AND ip_address != ''
  `;

  const totalStats = await db.query(totalQuery);

  return {
    ipStats: Array.isArray(ipStats) ? ipStats : (ipStats as any).results || [],
    summary: Array.isArray(totalStats) ? totalStats[0] : totalStats
  };
}

/**
 * 批量删除内容
 */
async function batchDeleteContent(db: any, params: any) {
  let deletedCount = 0;
  const deletedRecords: any[] = [];

  // 根据不同条件删除
  if (params.ids && Array.isArray(params.ids)) {
    // 按ID删除
    for (const id of params.ids) {
      // 这里应该实现真实的删除逻辑
      // 暂时记录删除操作
      deletedRecords.push({ id, reason: params.reason });
      deletedCount++;
    }
  }

  if (params.ipAddress) {
    // 按IP地址删除
    const query = `
      SELECT id FROM valid_heart_voices 
      WHERE ip_address = ?
    `;
    const records = await db.query(query, [params.ipAddress]);
    const recordsArray = Array.isArray(records) ? records : (records as any).results || [];
    
    for (const record of recordsArray) {
      deletedRecords.push({ id: record.id, reason: `IP删除: ${params.ipAddress}` });
      deletedCount++;
    }
  }

  if (params.userId) {
    // 按用户ID删除
    const query = `
      SELECT id FROM valid_heart_voices 
      WHERE user_id = ?
    `;
    const records = await db.query(query, [params.userId]);
    const recordsArray = Array.isArray(records) ? records : (records as any).results || [];
    
    for (const record of recordsArray) {
      deletedRecords.push({ id: record.id, reason: `用户删除: ${params.userId}` });
      deletedCount++;
    }
  }

  // 记录删除操作日志
  const logQuery = `
    INSERT INTO content_management_logs (
      operation_type, operator_id, target_type, target_ids, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  await db.query(logQuery, [
    'batch_delete',
    params.operatorId,
    params.contentType || 'mixed',
    JSON.stringify(deletedRecords.map(r => r.id)),
    params.reason
  ]);

  return {
    deletedCount,
    deletedRecords,
    operation: 'batch_delete',
    timestamp: new Date().toISOString()
  };
}

/**
 * 标记可疑内容
 */
async function flagSuspiciousContent(db: any, ids: string[], reason: string, operatorId: string) {
  let flaggedCount = 0;

  // 这里应该实现真实的标记逻辑
  // 暂时记录标记操作
  for (const id of ids) {
    flaggedCount++;
  }

  // 记录标记操作日志
  const logQuery = `
    INSERT INTO content_management_logs (
      operation_type, operator_id, target_type, target_ids, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  await db.query(logQuery, [
    'flag_suspicious',
    operatorId,
    'content',
    JSON.stringify(ids),
    reason
  ]);

  return {
    flaggedCount,
    flaggedIds: ids,
    reason,
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取用户内容统计
 */
async function getUserContentStats(db: any) {
  // 获取各类型内容统计
  const questionnaireCount = await db.query(`SELECT COUNT(*) as count FROM universal_questionnaire_responses`);
  const heartVoiceCount = await db.query(`SELECT COUNT(*) as count FROM valid_heart_voices WHERE audit_status = 'approved'`);
  const storyCount = await db.query(`SELECT COUNT(*) as count FROM valid_stories WHERE audit_status = 'approved'`);

  // 获取今日提交统计
  const todayStats = await db.query(`
    SELECT 
      COUNT(*) as today_submissions,
      COUNT(DISTINCT user_id) as today_unique_users
    FROM valid_heart_voices 
    WHERE DATE(created_at) = DATE('now')
  `);

  // 获取IP统计
  const ipStats = await db.query(`
    SELECT 
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(*) as total_with_ip
    FROM valid_heart_voices 
    WHERE ip_address IS NOT NULL AND ip_address != ''
  `);

  return {
    contentStats: {
      questionnaires: Array.isArray(questionnaireCount) ? questionnaireCount[0]?.count || 0 : questionnaireCount?.count || 0,
      heartVoices: Array.isArray(heartVoiceCount) ? heartVoiceCount[0]?.count || 0 : heartVoiceCount?.count || 0,
      stories: Array.isArray(storyCount) ? storyCount[0]?.count || 0 : storyCount?.count || 0
    },
    todayStats: Array.isArray(todayStats) ? todayStats[0] : todayStats,
    ipStats: Array.isArray(ipStats) ? ipStats[0] : ipStats,
    lastUpdated: new Date().toISOString()
  };
}

export default userContentManagement;

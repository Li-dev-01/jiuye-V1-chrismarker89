/**
 * 心声数据服务
 * 处理问卷心声的CRUD操作和业务逻辑
 */

import { DatabaseService } from '../db';

// 心声数据接口
export interface HeartVoiceData {
  id?: number;
  questionnaireResponseId?: number;
  questionnaireId: string;
  userId: string;
  content: string;
  wordCount?: number;
  category?: string;
  tags?: string[];
  emotionScore?: number;
  emotionCategory?: string;
  isPublic?: boolean;
  isApproved?: boolean;
  status?: string;
  submissionType?: string;
  anonymousNickname?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 心声查询参数
export interface HeartVoiceQueryParams {
  userId?: string;
  questionnaireId?: string;
  category?: string;
  isPublic?: boolean;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 心声统计数据
export interface HeartVoiceStatistics {
  totalCount: number;
  categoryStats: Record<string, number>;
  emotionStats: Record<string, number>;
  recentCount: number;
  averageWordCount: number;
  topTags: Array<{ tag: string; count: number }>;
}

export class HeartVoiceService {
  constructor(private db: DatabaseService) {}

  /**
   * 创建心声记录
   */
  async createHeartVoice(data: HeartVoiceData): Promise<number> {
    try {
      // 确保表存在
      await this.ensureTableExists();

      const result = await this.db.execute(`
        INSERT INTO questionnaire_heart_voices (
          questionnaire_response_id, questionnaire_id, user_id, content,
          category, tags, emotion_score, emotion_category,
          is_public, is_approved, status, submission_type,
          anonymous_nickname, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.questionnaireResponseId || null,
        data.questionnaireId,
        data.userId,
        data.content,
        data.category || 'employment-feedback',
        data.tags ? JSON.stringify(data.tags) : null,
        data.emotionScore || null,
        data.emotionCategory || null,
        data.isPublic !== false, // 默认公开
        data.isApproved !== false, // 默认通过
        data.status || 'active',
        data.submissionType || 'anonymous',
        data.anonymousNickname || null,
        data.ipAddress || null,
        data.userAgent || null
      ]);

      const heartVoiceId = result.meta.last_row_id as number;

      // 如果有问卷响应ID，创建关联记录
      if (data.questionnaireResponseId) {
        await this.createMapping(data.userId, data.questionnaireResponseId, heartVoiceId);
      }

      return heartVoiceId;
    } catch (error) {
      console.error('创建心声记录失败:', error);
      throw new Error('创建心声记录失败');
    }
  }

  /**
   * 获取心声列表
   */
  async getHeartVoices(params: HeartVoiceQueryParams = {}): Promise<{
    data: HeartVoiceData[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        userId,
        questionnaireId,
        category,
        isPublic,
        status = 'active',
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = params;

      // 构建查询条件
      const conditions: string[] = ['status = ?'];
      const values: any[] = [status];

      if (userId) {
        conditions.push('user_id = ?');
        values.push(userId);
      }

      if (questionnaireId) {
        conditions.push('questionnaire_id = ?');
        values.push(questionnaireId);
      }

      if (category) {
        conditions.push('category = ?');
        values.push(category);
      }

      if (isPublic !== undefined) {
        conditions.push('is_public = ?');
        values.push(isPublic);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      // 获取总数
      const countResult = await this.db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM questionnaire_heart_voices
        ${whereClause}
      `, values);

      const total = countResult?.count || 0;

      // 获取数据
      const data = await this.db.query<HeartVoiceData>(`
        SELECT 
          id, questionnaire_response_id as questionnaireResponseId,
          questionnaire_id as questionnaireId, user_id as userId,
          content, word_count as wordCount, category, tags,
          emotion_score as emotionScore, emotion_category as emotionCategory,
          is_public as isPublic, is_approved as isApproved, status,
          submission_type as submissionType, anonymous_nickname as anonymousNickname,
          created_at as createdAt, updated_at as updatedAt
        FROM questionnaire_heart_voices
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `, [...values, limit, offset]);

      // 解析tags字段
      const processedData = data.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags as any) : []
      }));

      return {
        data: processedData,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('获取心声列表失败:', error);
      throw new Error('获取心声列表失败');
    }
  }

  /**
   * 获取心声统计数据
   */
  async getStatistics(questionnaireId?: string): Promise<HeartVoiceStatistics> {
    try {
      const whereClause = questionnaireId ? 'WHERE questionnaire_id = ? AND status = ?' : 'WHERE status = ?';
      const values = questionnaireId ? [questionnaireId, 'active'] : ['active'];

      // 总数统计
      const totalResult = await this.db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM questionnaire_heart_voices
        ${whereClause}
      `, values);

      // 分类统计
      const categoryStats = await this.db.query<{ category: string; count: number }>(`
        SELECT category, COUNT(*) as count
        FROM questionnaire_heart_voices
        ${whereClause}
        GROUP BY category
      `, values);

      // 情感统计
      const emotionStats = await this.db.query<{ emotion_category: string; count: number }>(`
        SELECT emotion_category, COUNT(*) as count
        FROM questionnaire_heart_voices
        ${whereClause} AND emotion_category IS NOT NULL
        GROUP BY emotion_category
      `, values);

      // 最近7天统计
      const recentResult = await this.db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM questionnaire_heart_voices
        ${whereClause} AND created_at >= datetime('now', '-7 days')
      `, values);

      // 平均字数
      const avgWordResult = await this.db.queryFirst<{ avg_words: number }>(`
        SELECT AVG(word_count) as avg_words
        FROM questionnaire_heart_voices
        ${whereClause} AND word_count > 0
      `, values);

      return {
        totalCount: totalResult?.count || 0,
        categoryStats: categoryStats.reduce((acc, item) => {
          acc[item.category] = item.count;
          return acc;
        }, {} as Record<string, number>),
        emotionStats: emotionStats.reduce((acc, item) => {
          acc[item.emotion_category] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentCount: recentResult?.count || 0,
        averageWordCount: Math.round(avgWordResult?.avg_words || 0),
        topTags: [] // TODO: 实现标签统计
      };
    } catch (error) {
      console.error('获取心声统计失败:', error);
      throw new Error('获取心声统计失败');
    }
  }

  /**
   * 创建用户-问卷-心声关联
   */
  private async createMapping(userId: string, questionnaireResponseId: number, heartVoiceId: number): Promise<void> {
    try {
      await this.db.execute(`
        INSERT OR IGNORE INTO user_questionnaire_heart_voice_mapping 
        (user_id, questionnaire_response_id, heart_voice_id)
        VALUES (?, ?, ?)
      `, [userId, questionnaireResponseId, heartVoiceId]);
    } catch (error) {
      console.error('创建关联记录失败:', error);
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 确保表存在
   */
  private async ensureTableExists(): Promise<void> {
    // 这里可以执行建表SQL，或者依赖迁移脚本
    // 暂时留空，依赖迁移脚本创建表
  }
}

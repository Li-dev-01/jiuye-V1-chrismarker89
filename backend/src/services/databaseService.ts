/**
 * 真实数据库服务
 * 替换模拟数据，连接Cloudflare D1数据库
 */

import type { Env } from '../types/api';

export interface QuestionnaireResponse {
  id?: number;
  session_id: string;
  questionnaire_id: string;
  answers: string; // JSON string
  is_completed: boolean;
  completion_percentage: number;
  started_at: string;
  completed_at?: string;
  ip_hash?: string;
  user_agent?: string;
  device_type?: string;
  quality_score: number;
  source: string;
}

export interface HeartVoice {
  id?: number;
  response_id?: number;
  content: string;
  author_name?: string;
  is_anonymous: boolean;
  emotion_score?: number;
  emotion_category?: string;
  category: string;
  tags?: string; // JSON string
  word_count?: number;
  like_count: number;
  dislike_count: number;
  view_count: number;
  is_featured: boolean;
  is_approved: boolean;
  created_at?: string;
}

export interface Story {
  id?: number;
  response_id?: number;
  title: string;
  content: string;
  summary?: string;
  author_name?: string;
  is_anonymous: boolean;
  category: string;
  tags?: string; // JSON string
  word_count?: number;
  like_count: number;
  dislike_count: number;
  view_count: number;
  share_count: number;
  is_featured: boolean;
  is_approved: boolean;
  created_at?: string;
}

export interface User {
  id?: number;
  email: string;
  password_hash: string;
  username?: string;
  display_name?: string;
  role: string;
  user_type: string;
  is_active: boolean;
  last_login_at?: string;
  login_count: number;
  created_at?: string;
}

export class DatabaseService {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  // ==================== 问卷回答相关 ====================

  /**
   * 创建问卷回答
   */
  async createQuestionnaireResponse(data: Omit<QuestionnaireResponse, 'id'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO questionnaire_responses (
        session_id, questionnaire_id, answers, is_completed, completion_percentage,
        started_at, completed_at, ip_hash, user_agent, device_type, quality_score, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.session_id,
      data.questionnaire_id,
      data.answers,
      data.is_completed,
      data.completion_percentage,
      data.started_at,
      data.completed_at || null,
      data.ip_hash || null,
      data.user_agent || null,
      data.device_type || null,
      data.quality_score,
      data.source
    ).run();

    return result.meta.last_row_id as number;
  }

  /**
   * 获取问卷回答
   */
  async getQuestionnaireResponse(sessionId: string): Promise<QuestionnaireResponse | null> {
    const result = await this.db.prepare(`
      SELECT * FROM questionnaire_responses WHERE session_id = ?
    `).bind(sessionId).first();

    return result as QuestionnaireResponse | null;
  }

  /**
   * 更新问卷回答
   */
  async updateQuestionnaireResponse(sessionId: string, data: Partial<QuestionnaireResponse>): Promise<boolean> {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(sessionId);

    const result = await this.db.prepare(`
      UPDATE questionnaire_responses SET ${fields.join(', ')} WHERE session_id = ?
    `).bind(...values).run();

    return result.success;
  }

  /**
   * 获取问卷统计
   */
  async getQuestionnaireStats(): Promise<{
    total: number;
    completed: number;
    completion_rate: number;
    avg_quality_score: number;
  }> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
        AVG(quality_score) as avg_quality_score
      FROM questionnaire_responses
    `).first();

    const total = result?.total || 0;
    const completed = result?.completed || 0;
    const completion_rate = total > 0 ? (completed / total) * 100 : 0;
    const avg_quality_score = result?.avg_quality_score || 0;

    return {
      total,
      completed,
      completion_rate: Math.round(completion_rate * 100) / 100,
      avg_quality_score: Math.round(avg_quality_score * 100) / 100
    };
  }

  // ==================== 心声相关 ====================

  /**
   * 创建心声
   */
  async createHeartVoice(data: Omit<HeartVoice, 'id'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO heart_voices (
        response_id, content, author_name, is_anonymous, emotion_score, emotion_category,
        category, tags, word_count, like_count, dislike_count, view_count, is_featured, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.response_id || null,
      data.content,
      data.author_name || null,
      data.is_anonymous,
      data.emotion_score || null,
      data.emotion_category || null,
      data.category,
      data.tags || null,
      data.word_count || data.content.length,
      data.like_count,
      data.dislike_count,
      data.view_count,
      data.is_featured,
      data.is_approved
    ).run();

    return result.meta.last_row_id as number;
  }

  /**
   * 获取心声列表
   */
  async getHeartVoices(params: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    approved?: boolean;
  } = {}): Promise<{
    data: HeartVoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];

    if (params.category) {
      whereClause += ' AND category = ?';
      bindings.push(params.category);
    }

    if (params.featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      bindings.push(params.featured);
    }

    if (params.approved !== undefined) {
      whereClause += ' AND is_approved = ?';
      bindings.push(params.approved);
    }

    // 获取总数
    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as total FROM heart_voices ${whereClause}
    `).bind(...bindings).first();

    const total = countResult?.total || 0;

    // 获取数据
    const dataResult = await this.db.prepare(`
      SELECT * FROM heart_voices ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    return {
      data: dataResult.results as HeartVoice[],
      total,
      page,
      limit
    };
  }

  /**
   * 更新心声点赞/点踩
   */
  async updateHeartVoiceLikes(id: number, type: 'like' | 'dislike', increment: boolean): Promise<boolean> {
    const field = type === 'like' ? 'like_count' : 'dislike_count';
    const operator = increment ? '+' : '-';

    const result = await this.db.prepare(`
      UPDATE heart_voices 
      SET ${field} = ${field} ${operator} 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return result.success;
  }

  // ==================== 故事相关 ====================

  /**
   * 创建故事
   */
  async createStory(data: Omit<Story, 'id'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO stories (
        response_id, title, content, summary, author_name, is_anonymous, category,
        tags, word_count, like_count, dislike_count, view_count, share_count, is_featured, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.response_id || null,
      data.title,
      data.content,
      data.summary || null,
      data.author_name || null,
      data.is_anonymous,
      data.category,
      data.tags || null,
      data.word_count || data.content.length,
      data.like_count,
      data.dislike_count,
      data.view_count,
      data.share_count,
      data.is_featured,
      data.is_approved
    ).run();

    return result.meta.last_row_id as number;
  }

  /**
   * 获取故事列表
   */
  async getStories(params: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    approved?: boolean;
  } = {}): Promise<{
    data: Story[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];

    if (params.category) {
      whereClause += ' AND category = ?';
      bindings.push(params.category);
    }

    if (params.featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      bindings.push(params.featured);
    }

    if (params.approved !== undefined) {
      whereClause += ' AND is_approved = ?';
      bindings.push(params.approved);
    }

    // 获取总数
    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as total FROM stories ${whereClause}
    `).bind(...bindings).first();

    const total = countResult?.total || 0;

    // 获取数据
    const dataResult = await this.db.prepare(`
      SELECT * FROM stories ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    return {
      data: dataResult.results as Story[],
      total,
      page,
      limit
    };
  }

  // ==================== 用户相关 ====================

  /**
   * 创建用户
   */
  async createUser(data: Omit<User, 'id'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO users (
        email, password_hash, username, display_name, role, user_type, is_active, login_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.email,
      data.password_hash,
      data.username || null,
      data.display_name || null,
      data.role,
      data.user_type,
      data.is_active,
      data.login_count
    ).run();

    return result.meta.last_row_id as number;
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).bind(email).first();

    return result as User | null;
  }

  /**
   * 更新用户登录信息
   */
  async updateUserLogin(userId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(userId).run();

    return result.success;
  }
}

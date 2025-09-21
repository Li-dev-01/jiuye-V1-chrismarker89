// 数据库连接和查询工具

import type { Env } from '../types/api';

// D1 数据库查询结果类型
export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

// 数据库连接管理
export class DatabaseManager {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  // 执行查询
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  // 执行单条查询
  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const result = await this.db.prepare(sql).bind(...params).first();
      return result as T | null;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  // 执行插入/更新/删除
  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      const result = await this.db.prepare(sql).bind(...params).run();
      return result;
    } catch (error) {
      console.error('Database execute error:', error);
      throw new Error(`Database execute failed: ${error}`);
    }
  }

  // 批量执行
  async batch(statements: { sql: string; params?: any[] }[]): Promise<D1Result[]> {
    try {
      const prepared = statements.map(stmt => 
        this.db.prepare(stmt.sql).bind(...(stmt.params || []))
      );
      const results = await this.db.batch(prepared);
      return results;
    } catch (error) {
      console.error('Database batch error:', error);
      throw new Error(`Database batch failed: ${error}`);
    }
  }

  // 事务处理
  async transaction<T>(callback: (db: DatabaseManager) => Promise<T>): Promise<T> {
    // D1 目前不支持显式事务，使用批量操作模拟
    return await callback(this);
  }
}

// 查询构建器
export class QueryBuilder {
  private sql: string = '';
  private params: any[] = [];

  select(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns.join(', ') : columns;
    this.sql = `SELECT ${cols}`;
    return this;
  }

  from(table: string): this {
    this.sql += ` FROM ${table}`;
    return this;
  }

  where(condition: string, value?: any): this {
    const prefix = this.sql.includes('WHERE') ? ' AND' : ' WHERE';
    this.sql += `${prefix} ${condition}`;
    if (value !== undefined) {
      this.params.push(value);
    }
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.sql += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.sql += ` LIMIT ${count}`;
    return this;
  }

  offset(count: number): this {
    this.sql += ` OFFSET ${count}`;
    return this;
  }

  build(): { sql: string; params: any[] } {
    return { sql: this.sql, params: this.params };
  }
}

// 分页查询助手
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export async function paginatedQuery<T>(
  db: DatabaseManager,
  baseQuery: string,
  countQuery: string,
  params: any[],
  pagination: PaginationOptions
): Promise<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  // 获取总数
  const countResult = await db.queryFirst<{ count: number }>(countQuery, params);
  const total = countResult?.count || 0;

  // 获取分页数据
  const dataQuery = `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`;
  const items = await db.query<T>(dataQuery, params);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

// 常用查询模板
export const QueryTemplates = {
  // 审核相关
  getPendingReviews: `
    SELECT 
      ar.id as auditId,
      ar.content_type,
      ar.content_id,
      ar.content_uuid,
      ar.user_uuid,
      ar.audit_result,
      ar.created_at,
      CASE 
        WHEN ar.content_type = 'questionnaire' THEN qr.data
        WHEN ar.content_type = 'heart_voice' THEN hv.content
        WHEN ar.content_type = 'story' THEN s.title
      END as content_preview
    FROM audit_records ar
    LEFT JOIN raw_questionnaire_responses qr ON ar.content_type = 'questionnaire' AND ar.content_id = qr.id
    LEFT JOIN raw_heart_voices hv ON ar.content_type = 'heart_voice' AND ar.content_id = hv.id
    LEFT JOIN raw_story_submissions s ON ar.content_type = 'story' AND ar.content_id = s.id
    WHERE ar.audit_result = 'pending'
    ORDER BY ar.created_at DESC
  `,

  // 统计相关
  getBasicStats: `
    SELECT 
      COUNT(*) as total_responses,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_responses,
      AVG(completion_percentage) as avg_completion_rate,
      AVG(total_time_seconds) as avg_completion_time
    FROM questionnaire_responses
    WHERE is_valid = 1
  `
};

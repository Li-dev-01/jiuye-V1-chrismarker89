/**
 * 励志名言服务
 * 根据用户标签和情绪状态选择合适的励志名言
 */

import type { GeneratedTag } from './questionnaireTagGenerator';

export interface MotivationalQuote {
  id: number;
  quote_text: string;
  author?: string;
  category: string;
  emotion_target?: string;
  tag_keys?: string;
  usage_count: number;
}

/**
 * 励志名言服务类
 */
export class MotivationalQuoteService {
  
  /**
   * 根据标签和情绪选择励志名言
   */
  static async selectQuote(
    db: D1Database,
    tags: GeneratedTag[],
    emotionType: string
  ): Promise<MotivationalQuote | null> {
    try {
      // 策略1: 优先匹配标签 + 情绪
      for (const tag of tags) {
        const quote = await this.findQuoteByTagAndEmotion(db, tag.tagKey, emotionType);
        if (quote) {
          await this.incrementUsageCount(db, quote.id);
          return quote;
        }
      }
      
      // 策略2: 只匹配情绪（通用名言）
      const emotionQuote = await this.findQuoteByEmotion(db, emotionType);
      if (emotionQuote) {
        await this.incrementUsageCount(db, emotionQuote.id);
        return emotionQuote;
      }
      
      // 策略3: 随机选择一条启用的名言
      const randomQuote = await this.findRandomQuote(db);
      if (randomQuote) {
        await this.incrementUsageCount(db, randomQuote.id);
        return randomQuote;
      }
      
      return null;
    } catch (error) {
      console.error('选择励志名言失败:', error);
      return null;
    }
  }
  
  /**
   * 根据标签和情绪查找名言
   */
  private static async findQuoteByTagAndEmotion(
    db: D1Database,
    tagKey: string,
    emotionType: string
  ): Promise<MotivationalQuote | null> {
    try {
      const result = await db.prepare(`
        SELECT * FROM motivational_quotes
        WHERE is_active = 1
          AND (
            tag_keys LIKE ? OR 
            tag_keys LIKE ? OR
            tag_keys LIKE ?
          )
          AND (emotion_target = ? OR emotion_target = 'all' OR emotion_target IS NULL)
        ORDER BY RANDOM()
        LIMIT 1
      `).bind(
        `%"${tagKey}"%`,      // JSON数组格式：["tag1", "tag2"]
        `%${tagKey}%`,         // 简单包含
        `%${tagKey},%`,        // 逗号分隔格式
        emotionType
      ).first();
      
      return result as MotivationalQuote | null;
    } catch (error) {
      console.error('根据标签和情绪查找名言失败:', error);
      return null;
    }
  }
  
  /**
   * 根据情绪查找名言（通用）
   */
  private static async findQuoteByEmotion(
    db: D1Database,
    emotionType: string
  ): Promise<MotivationalQuote | null> {
    try {
      const result = await db.prepare(`
        SELECT * FROM motivational_quotes
        WHERE is_active = 1
          AND (tag_keys IS NULL OR tag_keys = '' OR tag_keys = '[]')
          AND (emotion_target = ? OR emotion_target = 'all' OR emotion_target IS NULL)
        ORDER BY RANDOM()
        LIMIT 1
      `).bind(emotionType).first();
      
      return result as MotivationalQuote | null;
    } catch (error) {
      console.error('根据情绪查找名言失败:', error);
      return null;
    }
  }
  
  /**
   * 随机选择一条名言
   */
  private static async findRandomQuote(
    db: D1Database
  ): Promise<MotivationalQuote | null> {
    try {
      const result = await db.prepare(`
        SELECT * FROM motivational_quotes
        WHERE is_active = 1
        ORDER BY RANDOM()
        LIMIT 1
      `).first();
      
      return result as MotivationalQuote | null;
    } catch (error) {
      console.error('随机选择名言失败:', error);
      return null;
    }
  }
  
  /**
   * 增加名言使用次数
   */
  private static async incrementUsageCount(
    db: D1Database,
    quoteId: number
  ): Promise<void> {
    try {
      await db.prepare(`
        UPDATE motivational_quotes 
        SET usage_count = usage_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(quoteId).run();
    } catch (error) {
      console.error('更新名言使用次数失败:', error);
    }
  }
  
  /**
   * 获取热门名言（使用次数最多）
   */
  static async getPopularQuotes(
    db: D1Database,
    limit: number = 10
  ): Promise<MotivationalQuote[]> {
    try {
      const result = await db.prepare(`
        SELECT * FROM motivational_quotes
        WHERE is_active = 1
        ORDER BY usage_count DESC
        LIMIT ?
      `).bind(limit).all();
      
      return (result.results || []) as MotivationalQuote[];
    } catch (error) {
      console.error('获取热门名言失败:', error);
      return [];
    }
  }
  
  /**
   * 按分类获取名言
   */
  static async getQuotesByCategory(
    db: D1Database,
    category: string,
    limit?: number
  ): Promise<MotivationalQuote[]> {
    try {
      let query = `
        SELECT * FROM motivational_quotes
        WHERE is_active = 1 AND category = ?
        ORDER BY usage_count DESC
      `;
      
      const params: any[] = [category];
      
      if (limit) {
        query += ` LIMIT ?`;
        params.push(limit);
      }
      
      const result = await db.prepare(query).bind(...params).all();
      
      return (result.results || []) as MotivationalQuote[];
    } catch (error) {
      console.error('按分类获取名言失败:', error);
      return [];
    }
  }
  
  /**
   * 获取所有分类
   */
  static async getCategories(db: D1Database): Promise<string[]> {
    try {
      const result = await db.prepare(`
        SELECT DISTINCT category FROM motivational_quotes
        WHERE is_active = 1
        ORDER BY category
      `).all();
      
      return (result.results || []).map((r: any) => r.category);
    } catch (error) {
      console.error('获取名言分类失败:', error);
      return [];
    }
  }
  
  /**
   * 获取名言统计
   */
  static async getQuoteStatistics(db: D1Database): Promise<{
    total: number;
    active: number;
    totalUsage: number;
    categoryCounts: Record<string, number>;
    emotionTargetCounts: Record<string, number>;
  }> {
    try {
      // 总数和启用数
      const totalResult = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(usage_count) as total_usage
        FROM motivational_quotes
      `).first();
      
      // 按分类统计
      const categoryResult = await db.prepare(`
        SELECT category, COUNT(*) as count
        FROM motivational_quotes
        WHERE is_active = 1
        GROUP BY category
      `).all();
      
      // 按情绪目标统计
      const emotionResult = await db.prepare(`
        SELECT 
          COALESCE(emotion_target, 'all') as emotion_target, 
          COUNT(*) as count
        FROM motivational_quotes
        WHERE is_active = 1
        GROUP BY emotion_target
      `).all();
      
      const categoryCounts: Record<string, number> = {};
      for (const row of (categoryResult.results || [])) {
        categoryCounts[(row as any).category] = (row as any).count;
      }
      
      const emotionTargetCounts: Record<string, number> = {};
      for (const row of (emotionResult.results || [])) {
        emotionTargetCounts[(row as any).emotion_target] = (row as any).count;
      }
      
      return {
        total: (totalResult?.total as number) || 0,
        active: (totalResult?.active as number) || 0,
        totalUsage: (totalResult?.total_usage as number) || 0,
        categoryCounts,
        emotionTargetCounts
      };
    } catch (error) {
      console.error('获取名言统计失败:', error);
      return {
        total: 0,
        active: 0,
        totalUsage: 0,
        categoryCounts: {},
        emotionTargetCounts: {}
      };
    }
  }
  
  /**
   * 创建新名言
   */
  static async createQuote(
    db: D1Database,
    data: {
      quote_text: string;
      author?: string;
      category: string;
      emotion_target?: string;
      tag_keys?: string[];
    }
  ): Promise<number> {
    try {
      const tagKeysJson = data.tag_keys ? JSON.stringify(data.tag_keys) : null;
      
      const result = await db.prepare(`
        INSERT INTO motivational_quotes 
        (quote_text, author, category, emotion_target, tag_keys, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(
        data.quote_text,
        data.author || null,
        data.category,
        data.emotion_target || null,
        tagKeysJson
      ).run();
      
      return result.meta.last_row_id as number;
    } catch (error) {
      console.error('创建名言失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新名言
   */
  static async updateQuote(
    db: D1Database,
    id: number,
    data: Partial<{
      quote_text: string;
      author: string;
      category: string;
      emotion_target: string;
      tag_keys: string[];
      is_active: boolean;
    }>
  ): Promise<void> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (data.quote_text !== undefined) {
        updates.push('quote_text = ?');
        params.push(data.quote_text);
      }
      if (data.author !== undefined) {
        updates.push('author = ?');
        params.push(data.author);
      }
      if (data.category !== undefined) {
        updates.push('category = ?');
        params.push(data.category);
      }
      if (data.emotion_target !== undefined) {
        updates.push('emotion_target = ?');
        params.push(data.emotion_target);
      }
      if (data.tag_keys !== undefined) {
        updates.push('tag_keys = ?');
        params.push(JSON.stringify(data.tag_keys));
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return;
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await db.prepare(`
        UPDATE motivational_quotes 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).bind(...params).run();
    } catch (error) {
      console.error('更新名言失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除名言（软删除）
   */
  static async deleteQuote(
    db: D1Database,
    id: number
  ): Promise<void> {
    try {
      await db.prepare(`
        UPDATE motivational_quotes 
        SET is_active = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id).run();
    } catch (error) {
      console.error('删除名言失败:', error);
      throw error;
    }
  }
}


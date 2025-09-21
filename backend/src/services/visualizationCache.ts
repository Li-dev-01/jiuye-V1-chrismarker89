/**
 * 可视化缓存服务
 * 提供高性能的数据缓存机制
 */

import { DatabaseManager } from '../utils/database';
import type { Env } from '../types/api';

export interface CacheEntry {
  cache_key: string;
  data_type: string;
  cached_data: string;
  last_updated: string;
  expires_at: string;
}

export class VisualizationCacheService {
  private db: DatabaseManager;
  private defaultTTL: number = 3600; // 1小时默认TTL

  constructor(env: Env) {
    this.db = new DatabaseManager(env);
  }

  /**
   * 获取缓存数据
   */
  async get(cacheKey: string): Promise<any | null> {
    try {
      const result = await this.db.query<CacheEntry>(`
        SELECT cached_data, expires_at
        FROM visualization_cache
        WHERE cache_key = ? AND expires_at > datetime('now')
      `, [cacheKey]);

      if (result.length > 0) {
        return JSON.parse(result[0].cached_data);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set(cacheKey: string, dataType: string, data: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
      
      await this.db.query(`
        INSERT OR REPLACE INTO visualization_cache 
        (cache_key, data_type, cached_data, last_updated, expires_at)
        VALUES (?, ?, ?, datetime('now'), ?)
      `, [cacheKey, dataType, JSON.stringify(data), expiresAt]);

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async delete(cacheKey: string): Promise<boolean> {
    try {
      await this.db.query(`
        DELETE FROM visualization_cache WHERE cache_key = ?
      `, [cacheKey]);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<number> {
    try {
      const result = await this.db.query(`
        DELETE FROM visualization_cache WHERE expires_at < datetime('now')
      `);
      return (result as any).changes || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   */
  async getOrSet<T>(
    cacheKey: string, 
    dataType: string, 
    fetchFunction: () => Promise<T>, 
    ttlSeconds?: number
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = await this.get(cacheKey);
    if (cached !== null) {
      return cached as T;
    }

    // 缓存未命中，执行获取函数
    try {
      const data = await fetchFunction();
      // 设置缓存
      await this.set(cacheKey, dataType, data, ttlSeconds);
      return data;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      throw error;
    }
  }

  /**
   * 批量设置缓存
   */
  async setBatch(entries: Array<{
    key: string;
    dataType: string;
    data: any;
    ttl?: number;
  }>): Promise<boolean> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.dataType, entry.data, entry.ttl);
      }
      return true;
    } catch (error) {
      console.error('Cache setBatch error:', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  }> {
    try {
      const totalResult = await this.db.query(`
        SELECT COUNT(*) as total FROM visualization_cache
      `);
      
      const expiredResult = await this.db.query(`
        SELECT COUNT(*) as expired 
        FROM visualization_cache 
        WHERE expires_at < datetime('now')
      `);

      const total = totalResult[0]?.total || 0;
      const expired = expiredResult[0]?.expired || 0;

      return {
        totalEntries: total,
        expiredEntries: expired,
        cacheHitRate: total > 0 ? ((total - expired) / total) * 100 : 0
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        cacheHitRate: 0
      };
    }
  }

  /**
   * 预热缓存 - 预先计算常用数据
   */
  async warmup(): Promise<boolean> {
    try {
      // 这里可以预先计算一些常用的统计数据
      console.log('Cache warmup started...');
      
      // 预热基础统计数据
      await this.set('warmup_timestamp', 'system', new Date().toISOString());
      
      console.log('Cache warmup completed');
      return true;
    } catch (error) {
      console.error('Cache warmup error:', error);
      return false;
    }
  }
}

/**
 * 缓存键生成器
 */
export class CacheKeyGenerator {
  static dashboard(params?: Record<string, any>): string {
    const baseKey = 'dashboard';
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${baseKey}:${paramStr}`;
  }

  static distribution(questionId: string, filters?: Record<string, any>): string {
    const baseKey = `distribution:${questionId}`;
    if (!filters || Object.keys(filters).length === 0) {
      return baseKey;
    }
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `${baseKey}:${filterStr}`;
  }

  static realTimeStats(statType: string): string {
    return `realtime:${statType}`;
  }
}

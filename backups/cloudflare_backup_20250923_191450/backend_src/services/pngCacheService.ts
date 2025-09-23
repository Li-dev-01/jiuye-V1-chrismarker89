/**
 * PNG缓存服务
 * 管理PNG文件的缓存机制，提升性能和减少重复生成
 */

import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface CacheEntry {
  id?: number;
  cacheKey: string;
  contentType: 'heart_voice' | 'story';
  contentId: number;
  theme: string;
  r2Key: string;
  downloadUrl: string;
  fileSize: number;
  cacheHitCount: number;
  lastAccessedAt: string;
  expiresAt?: string;
  generationTime: number;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CacheConfig {
  defaultTtlHours: number;
  maxCacheSize: number; // 最大缓存条目数
  cleanupIntervalHours: number;
  qualityThreshold: number; // 质量阈值，低于此值的缓存会被优先清理
}

export class PngCacheService {
  private db: DatabaseService;
  private config: CacheConfig;

  constructor(env: Env, config: Partial<CacheConfig> = {}) {
    this.db = new DatabaseService(env.DB!);
    this.config = {
      defaultTtlHours: 24 * 7, // 默认7天
      maxCacheSize: 10000,
      cleanupIntervalHours: 6,
      qualityThreshold: 0.3,
      ...config
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string
  ): string {
    return `png:${contentType}:${contentId}:${theme}`;
  }

  /**
   * 获取缓存条目
   */
  async getCacheEntry(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string
  ): Promise<CacheEntry | null> {
    try {
      const cacheKey = this.generateCacheKey(contentType, contentId, theme);
      
      const entry = await this.db.queryFirst<CacheEntry>(`
        SELECT * FROM png_cache 
        WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
      `, [cacheKey]);

      if (entry) {
        // 更新访问计数和时间
        await this.updateCacheHit(entry.id!);
        console.log(`🎯 PNG缓存命中: ${cacheKey}`);
        return entry;
      }

      console.log(`❌ PNG缓存未命中: ${cacheKey}`);
      return null;

    } catch (error) {
      console.error('获取PNG缓存失败:', error);
      return null;
    }
  }

  /**
   * 设置缓存条目
   */
  async setCacheEntry(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string,
    r2Key: string,
    downloadUrl: string,
    metadata: {
      fileSize: number;
      generationTime: number;
      qualityScore?: number;
      ttlHours?: number;
    }
  ): Promise<{ success: boolean; cacheKey: string; error?: string }> {
    try {
      const cacheKey = this.generateCacheKey(contentType, contentId, theme);
      const now = new Date().toISOString();
      const ttlHours = metadata.ttlHours || this.config.defaultTtlHours;
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

      // 检查是否已存在
      const existing = await this.db.queryFirst(`
        SELECT id FROM png_cache WHERE cache_key = ?
      `, [cacheKey]);

      if (existing) {
        // 更新现有条目
        await this.db.execute(`
          UPDATE png_cache 
          SET r2_key = ?, download_url = ?, file_size = ?, generation_time = ?,
              quality_score = ?, expires_at = ?, updated_at = ?
          WHERE cache_key = ?
        `, [
          r2Key,
          downloadUrl,
          metadata.fileSize,
          metadata.generationTime,
          metadata.qualityScore || 0.8,
          expiresAt,
          now,
          cacheKey
        ]);
      } else {
        // 插入新条目
        await this.db.execute(`
          INSERT INTO png_cache (
            cache_key, content_type, content_id, theme, r2_key, download_url,
            file_size, generation_time, quality_score, expires_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          cacheKey,
          contentType,
          contentId,
          theme,
          r2Key,
          downloadUrl,
          metadata.fileSize,
          metadata.generationTime,
          metadata.qualityScore || 0.8,
          expiresAt,
          now,
          now
        ]);
      }

      console.log(`✅ PNG缓存已设置: ${cacheKey}, TTL: ${ttlHours}小时`);

      // 检查缓存大小并清理
      await this.cleanupIfNeeded();

      return { success: true, cacheKey };

    } catch (error) {
      console.error('设置PNG缓存失败:', error);
      return {
        success: false,
        cacheKey: this.generateCacheKey(contentType, contentId, theme),
        error: error instanceof Error ? error.message : '设置缓存失败'
      };
    }
  }

  /**
   * 更新缓存命中计数
   */
  private async updateCacheHit(cacheId: number): Promise<void> {
    try {
      await this.db.execute(`
        UPDATE png_cache 
        SET cache_hit_count = cache_hit_count + 1,
            last_accessed_at = datetime('now')
        WHERE id = ?
      `, [cacheId]);
    } catch (error) {
      console.error('更新缓存命中失败:', error);
    }
  }

  /**
   * 删除缓存条目
   */
  async deleteCacheEntry(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme?: string
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      let sql: string;
      let params: any[];

      if (theme) {
        const cacheKey = this.generateCacheKey(contentType, contentId, theme);
        sql = 'DELETE FROM png_cache WHERE cache_key = ?';
        params = [cacheKey];
      } else {
        sql = 'DELETE FROM png_cache WHERE content_type = ? AND content_id = ?';
        params = [contentType, contentId];
      }

      const result = await this.db.execute(sql, params);
      const deletedCount = result.meta.changes || 0;

      console.log(`🗑️ 删除PNG缓存: ${contentType}:${contentId}${theme ? `:${theme}` : ''}, 删除${deletedCount}个条目`);

      return { success: true, deletedCount };

    } catch (error) {
      console.error('删除PNG缓存失败:', error);
      return { success: false, deletedCount: 0 };
    }
  }

  /**
   * 批量清理所有缓存（用于样式更新后强制重新生成）
   */
  async clearAllCache(options: {
    contentType?: 'heart_voice' | 'story';
    theme?: string;
    reason?: string;
  } = {}): Promise<{
    success: boolean;
    deletedCount: number;
    deletedR2Keys: string[];
    error?: string;
  }> {
    try {
      const { contentType, theme, reason = '样式更新' } = options;

      console.log(`🧹 开始批量清理PNG缓存: ${reason}`);

      // 构建查询条件
      let sql = 'SELECT r2_key FROM png_cache WHERE 1=1';
      const params: any[] = [];

      if (contentType) {
        sql += ' AND content_type = ?';
        params.push(contentType);
      }

      if (theme) {
        sql += ' AND theme = ?';
        params.push(theme);
      }

      // 获取要删除的R2键列表（用于后续清理R2存储）
      const cacheEntries = await this.db.queryAll<{ r2_key: string }>(sql, params);
      const r2Keys = cacheEntries.map(entry => entry.r2_key);

      // 执行删除
      let deleteSql = 'DELETE FROM png_cache WHERE 1=1';
      const deleteParams: any[] = [];

      if (contentType) {
        deleteSql += ' AND content_type = ?';
        deleteParams.push(contentType);
      }

      if (theme) {
        deleteSql += ' AND theme = ?';
        deleteParams.push(theme);
      }

      const result = await this.db.execute(deleteSql, deleteParams);
      const deletedCount = result.meta.changes || 0;

      console.log(`🧹 批量清理PNG缓存完成: 删除${deletedCount}个条目, 原因: ${reason}`);

      return {
        success: true,
        deletedCount,
        deletedR2Keys: r2Keys
      };

    } catch (error) {
      console.error('批量清理PNG缓存失败:', error);
      return {
        success: false,
        deletedCount: 0,
        deletedR2Keys: [],
        error: error instanceof Error ? error.message : '批量清理失败'
      };
    }
  }

  /**
   * 清理特定主题的所有缓存
   */
  async clearThemeCache(theme: string): Promise<{ success: boolean; deletedCount: number }> {
    return this.clearAllCache({ theme, reason: `主题${theme}样式更新` });
  }

  /**
   * 清理特定内容类型的所有缓存
   */
  async clearContentTypeCache(contentType: 'heart_voice' | 'story'): Promise<{ success: boolean; deletedCount: number }> {
    return this.clearAllCache({ contentType, reason: `${contentType}样式更新` });
  }

  /**
   * 检查并清理缓存
   */
  async cleanupIfNeeded(): Promise<void> {
    try {
      // 检查缓存大小
      const cacheSize = await this.db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count FROM png_cache
      `);

      if (!cacheSize || cacheSize.count < this.config.maxCacheSize) {
        return;
      }

      console.log(`🧹 PNG缓存达到上限 (${cacheSize.count}/${this.config.maxCacheSize})，开始清理...`);

      // 清理策略：
      // 1. 删除已过期的条目
      // 2. 删除质量分数低的条目
      // 3. 删除最少访问的条目

      // 1. 清理过期条目
      const expiredResult = await this.db.execute(`
        DELETE FROM png_cache 
        WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
      `);
      const expiredCount = expiredResult.meta.changes || 0;

      // 2. 清理低质量条目
      const lowQualityResult = await this.db.execute(`
        DELETE FROM png_cache 
        WHERE quality_score < ? AND cache_hit_count < 5
        ORDER BY quality_score ASC, cache_hit_count ASC
        LIMIT 100
      `, [this.config.qualityThreshold]);
      const lowQualityCount = lowQualityResult.meta.changes || 0;

      // 3. 如果还是太多，清理最少访问的条目
      const currentSize = await this.db.queryFirst<{ count: number }>(`
        SELECT COUNT(*) as count FROM png_cache
      `);

      if (currentSize && currentSize.count > this.config.maxCacheSize * 0.8) {
        const lruResult = await this.db.execute(`
          DELETE FROM png_cache 
          WHERE id IN (
            SELECT id FROM png_cache 
            ORDER BY cache_hit_count ASC, last_accessed_at ASC 
            LIMIT 200
          )
        `);
        const lruCount = lruResult.meta.changes || 0;
        console.log(`🧹 清理最少访问的缓存条目: ${lruCount}个`);
      }

      console.log(`🧹 PNG缓存清理完成: 过期${expiredCount}个, 低质量${lowQualityCount}个`);

    } catch (error) {
      console.error('PNG缓存清理失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    totalSize: number;
    hitRate: number;
    expiredEntries: number;
    topThemes: Array<{ theme: string; count: number; hits: number }>;
  }> {
    try {
      const totalStats = await this.db.queryFirst(`
        SELECT 
          COUNT(*) as total_entries,
          SUM(cache_hit_count) as total_hits,
          SUM(file_size) as total_size,
          COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at < datetime('now') THEN 1 END) as expired_entries
        FROM png_cache
      `);

      const themeStats = await this.db.query(`
        SELECT 
          theme,
          COUNT(*) as count,
          SUM(cache_hit_count) as hits
        FROM png_cache 
        GROUP BY theme 
        ORDER BY hits DESC 
        LIMIT 10
      `);

      const totalEntries = totalStats?.total_entries || 0;
      const totalHits = totalStats?.total_hits || 0;
      const hitRate = totalEntries > 0 ? (totalHits / totalEntries) : 0;

      return {
        totalEntries,
        totalHits,
        totalSize: totalStats?.total_size || 0,
        hitRate,
        expiredEntries: totalStats?.expired_entries || 0,
        topThemes: themeStats.map(stat => ({
          theme: stat.theme,
          count: stat.count,
          hits: stat.hits
        }))
      };

    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        totalSize: 0,
        hitRate: 0,
        expiredEntries: 0,
        topThemes: []
      };
    }
  }

  /**
   * 预热缓存
   */
  async warmupCache(
    contentType: 'heart_voice' | 'story',
    contentIds: number[],
    themes: string[] = ['gradient', 'light']
  ): Promise<{
    totalRequested: number;
    alreadyCached: number;
    needsGeneration: Array<{ contentId: number; theme: string }>;
  }> {
    const alreadyCached: string[] = [];
    const needsGeneration: Array<{ contentId: number; theme: string }> = [];

    for (const contentId of contentIds) {
      for (const theme of themes) {
        const cached = await this.getCacheEntry(contentType, contentId, theme);
        if (cached) {
          alreadyCached.push(this.generateCacheKey(contentType, contentId, theme));
        } else {
          needsGeneration.push({ contentId, theme });
        }
      }
    }

    console.log(`🔥 PNG缓存预热: 已缓存${alreadyCached.length}个, 需生成${needsGeneration.length}个`);

    return {
      totalRequested: contentIds.length * themes.length,
      alreadyCached: alreadyCached.length,
      needsGeneration
    };
  }
}

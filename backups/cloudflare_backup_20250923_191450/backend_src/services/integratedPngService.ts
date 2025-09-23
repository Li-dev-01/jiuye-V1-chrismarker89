/**
 * 集成PNG生成服务
 * 整合真实PNG生成、R2存储、缓存和监控功能
 */

import { RealPngGeneratorService, type PngGenerationOptions, type ContentData } from './realPngGeneratorService';
import { R2StorageService } from './r2StorageService';
import { PngCacheService } from './pngCacheService';
import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface IntegratedPngResult {
  success: boolean;
  downloadUrl?: string;
  cardId?: string;
  r2Key?: string;
  cached?: boolean;
  generationTime?: number;
  fileSize?: number;
  error?: string;
}

export interface PngGenerationTask {
  contentType: 'heart_voice' | 'story';
  contentId: number;
  themes: string[];
  priority?: number;
  userId?: string;
}

export class IntegratedPngService {
  private pngGenerator: RealPngGeneratorService;
  private r2Storage: R2StorageService;
  private cacheService: PngCacheService;
  private db: DatabaseService;

  constructor(env: Env) {
    this.pngGenerator = new RealPngGeneratorService(env);
    this.r2Storage = new R2StorageService(env);
    this.cacheService = new PngCacheService(env);
    this.db = new DatabaseService(env.DB!);
  }

  /**
   * 生成并存储PNG（主要方法）
   */
  async generateAndStorePng(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string = 'gradient',
    options: {
      forceRegenerate?: boolean;
      userId?: string;
      quality?: number;
    } = {}
  ): Promise<IntegratedPngResult> {
    const startTime = Date.now();

    try {
      console.log(`🎨 开始生成PNG: ${contentType}:${contentId}, 主题: ${theme}`);

      // 1. 检查缓存（除非强制重新生成）
      if (!options.forceRegenerate) {
        const cached = await this.cacheService.getCacheEntry(contentType, contentId, theme);
        if (cached) {
          console.log(`🎯 使用缓存PNG: ${contentType}:${contentId}:${theme}`);
          return {
            success: true,
            downloadUrl: cached.downloadUrl,
            cardId: cached.r2Key,
            r2Key: cached.r2Key,
            cached: true,
            fileSize: cached.fileSize
          };
        }
      }

      // 2. 更新生成状态
      await this.updatePngStatus(contentType, contentId, 'generating');

      // 3. 获取内容数据
      const contentData = await this.getContentData(contentType, contentId);
      if (!contentData) {
        await this.updatePngStatus(contentType, contentId, 'failed', '内容不存在');
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 4. 生成PNG
      const pngOptions: PngGenerationOptions = {
        theme: theme as any,
        quality: options.quality || 0.9,
        watermark: true,
        retina: false
      };

      const generationResult = contentType === 'story' 
        ? await this.pngGenerator.generateStoryPng(contentData, pngOptions)
        : await this.pngGenerator.generateHeartVoicePng(contentData, pngOptions);

      if (!generationResult.success || !generationResult.pngBuffer) {
        await this.updatePngStatus(contentType, contentId, 'failed', generationResult.error);
        return {
          success: false,
          error: generationResult.error || 'PNG生成失败'
        };
      }

      // 5. 上传到R2
      const uploadResult = await this.r2Storage.uploadPngFile(
        generationResult.pngBuffer,
        contentType,
        contentId,
        theme,
        {
          generationTime: generationResult.metadata?.generationTime,
          quality: options.quality,
          userId: options.userId
        }
      );

      if (!uploadResult.success) {
        await this.updatePngStatus(contentType, contentId, 'failed', uploadResult.error);
        return {
          success: false,
          error: uploadResult.error || 'R2上传失败'
        };
      }

      // 6. 保存到PNG卡片表
      const cardId = `${contentType}-${contentId}-${theme}-${Date.now()}`;
      await this.savePngCard(
        contentType,
        contentId,
        cardId,
        theme,
        uploadResult.key,
        uploadResult.url,
        generationResult.metadata?.fileSize || 0,
        generationResult.metadata?.generationTime || 0
      );

      // 7. 更新缓存
      await this.cacheService.setCacheEntry(
        contentType,
        contentId,
        theme,
        uploadResult.key,
        uploadResult.url,
        {
          fileSize: generationResult.metadata?.fileSize || 0,
          generationTime: generationResult.metadata?.generationTime || 0,
          qualityScore: options.quality || 0.9
        }
      );

      // 8. 更新状态和主题记录
      await this.updatePngStatus(contentType, contentId, 'completed');
      await this.updateGeneratedThemes(contentType, contentId, theme);

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`✅ PNG生成完成: ${contentType}:${contentId}:${theme}, 耗时: ${totalTime}s`);

      return {
        success: true,
        downloadUrl: uploadResult.url,
        cardId,
        r2Key: uploadResult.key,
        cached: false,
        generationTime: totalTime,
        fileSize: generationResult.metadata?.fileSize
      };

    } catch (error) {
      console.error('集成PNG生成失败:', error);
      await this.updatePngStatus(contentType, contentId, 'failed', error instanceof Error ? error.message : '未知错误');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      };
    }
  }

  /**
   * 批量生成PNG
   */
  async batchGeneratePng(
    tasks: PngGenerationTask[]
  ): Promise<{
    successful: IntegratedPngResult[];
    failed: Array<{ task: PngGenerationTask; error: string }>;
    totalGenerated: number;
    totalFailed: number;
  }> {
    const successful: IntegratedPngResult[] = [];
    const failed: Array<{ task: PngGenerationTask; error: string }> = [];

    console.log(`🔄 开始批量生成PNG: ${tasks.length}个任务`);

    for (const task of tasks) {
      for (const theme of task.themes) {
        try {
          const result = await this.generateAndStorePng(
            task.contentType,
            task.contentId,
            theme,
            { userId: task.userId }
          );

          if (result.success) {
            successful.push(result);
          } else {
            failed.push({ task: { ...task, themes: [theme] }, error: result.error || '生成失败' });
          }
        } catch (error) {
          failed.push({ 
            task: { ...task, themes: [theme] }, 
            error: error instanceof Error ? error.message : '未知错误' 
          });
        }
      }
    }

    console.log(`✅ 批量PNG生成完成: 成功${successful.length}, 失败${failed.length}`);

    return {
      successful,
      failed,
      totalGenerated: successful.length,
      totalFailed: failed.length
    };
  }

  /**
   * 获取内容数据
   */
  private async getContentData(
    contentType: 'heart_voice' | 'story',
    contentId: number
  ): Promise<ContentData | null> {
    try {
      const tableName = contentType === 'heart_voice' ? 'valid_heart_voices' : 'valid_stories';
      
      if (contentType === 'story') {
        const story = await this.db.queryFirst(`
          SELECT id, title, content, category, tags, created_at
          FROM ${tableName} WHERE id = ?
        `, [contentId]);

        if (!story) return null;

        return {
          id: story.id,
          title: story.title,
          content: story.content,
          category: story.category,
          tags: story.tags ? JSON.parse(story.tags) : [],
          createdAt: story.created_at
        };
      } else {
        const heartVoice = await this.db.queryFirst(`
          SELECT id, content, category, emotion_score, tags, created_at
          FROM ${tableName} WHERE id = ?
        `, [contentId]);

        if (!heartVoice) return null;

        return {
          id: heartVoice.id,
          content: heartVoice.content,
          category: heartVoice.category,
          emotionScore: heartVoice.emotion_score,
          tags: heartVoice.tags ? JSON.parse(heartVoice.tags) : [],
          createdAt: heartVoice.created_at
        };
      }
    } catch (error) {
      console.error('获取内容数据失败:', error);
      return null;
    }
  }

  /**
   * 保存PNG卡片记录
   */
  private async savePngCard(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    cardId: string,
    theme: string,
    r2Key: string,
    downloadUrl: string,
    fileSize: number,
    generationTime: number
  ): Promise<void> {
    try {
      await this.db.execute(`
        INSERT OR REPLACE INTO png_cards (
          content_type, content_id, card_id, theme, r2_key, download_url,
          file_size, generated_by, generation_time, download_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'auto', ?, 0, ?)
      `, [
        contentType,
        contentId,
        cardId,
        theme,
        r2Key,
        downloadUrl,
        fileSize,
        generationTime,
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error('保存PNG卡片记录失败:', error);
    }
  }

  /**
   * 更新PNG生成状态
   */
  private async updatePngStatus(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void> {
    try {
      const tableName = contentType === 'heart_voice' ? 'valid_heart_voices' : 'valid_stories';
      
      const updateFields = [
        'png_status = ?',
        'png_generation_attempts = png_generation_attempts + 1'
      ];
      const params: any[] = [status];

      if (status === 'completed') {
        updateFields.push('png_generated_at = ?');
        params.push(new Date().toISOString());
      }

      if (errorMessage) {
        updateFields.push('png_last_error = ?');
        params.push(errorMessage);
      }

      params.push(contentId);

      await this.db.execute(`
        UPDATE ${tableName} 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, params);

    } catch (error) {
      console.error('更新PNG状态失败:', error);
    }
  }

  /**
   * 更新已生成的主题列表
   */
  private async updateGeneratedThemes(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    theme: string
  ): Promise<void> {
    try {
      const tableName = contentType === 'heart_voice' ? 'valid_heart_voices' : 'valid_stories';
      
      // 获取当前主题列表
      const current = await this.db.queryFirst(`
        SELECT png_themes_generated FROM ${tableName} WHERE id = ?
      `, [contentId]);

      let themes: string[] = [];
      if (current?.png_themes_generated) {
        try {
          themes = JSON.parse(current.png_themes_generated);
        } catch {
          themes = [];
        }
      }

      // 添加新主题（如果不存在）
      if (!themes.includes(theme)) {
        themes.push(theme);
        
        await this.db.execute(`
          UPDATE ${tableName} 
          SET png_themes_generated = ?
          WHERE id = ?
        `, [JSON.stringify(themes), contentId]);
      }

    } catch (error) {
      console.error('更新生成主题列表失败:', error);
    }
  }

  /**
   * 获取PNG生成统计
   */
  async getPngGenerationStats(): Promise<{
    totalGenerated: number;
    pendingGeneration: number;
    failedGeneration: number;
    cacheStats: any;
    recentActivity: any[];
  }> {
    try {
      // 获取生成统计
      const storyStats = await this.db.queryFirst(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN png_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN png_status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN png_status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM valid_stories
      `);

      const heartVoiceStats = await this.db.queryFirst(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN png_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN png_status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN png_status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM valid_heart_voices
      `);

      // 获取缓存统计
      const cacheStats = await this.cacheService.getCacheStats();

      // 获取最近活动
      const recentActivity = await this.db.query(`
        SELECT content_type, content_id, theme, created_at
        FROM png_cards 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      return {
        totalGenerated: (storyStats?.completed || 0) + (heartVoiceStats?.completed || 0),
        pendingGeneration: (storyStats?.pending || 0) + (heartVoiceStats?.pending || 0),
        failedGeneration: (storyStats?.failed || 0) + (heartVoiceStats?.failed || 0),
        cacheStats,
        recentActivity
      };

    } catch (error) {
      console.error('获取PNG生成统计失败:', error);
      return {
        totalGenerated: 0,
        pendingGeneration: 0,
        failedGeneration: 0,
        cacheStats: {},
        recentActivity: []
      };
    }
  }
}

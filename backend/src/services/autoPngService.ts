/**
 * 自动PNG生成服务
 * 当数据从A表迁移到B表时，自动生成PNG卡片并存储到R2
 */

import { DatabaseService } from '../db';
import { R2StorageService } from './r2StorageService';
import { PNGCardService } from './pngCardService';
import type { Env } from '../types/api';

export interface AutoPngConfig {
  enableHeartVoice: boolean;
  enableStory: boolean;
  defaultThemes: string[];
  batchSize: number;
}

export class AutoPngService {
  private db: DatabaseService;
  private r2Service: R2StorageService;
  private pngCardService: PNGCardService;
  private config: AutoPngConfig;

  constructor(env: Env, config: Partial<AutoPngConfig> = {}) {
    this.db = new DatabaseService(env.DB!);
    this.r2Service = new R2StorageService(env);
    this.pngCardService = new PNGCardService(env);
    this.config = {
      enableHeartVoice: true,
      enableStory: true,
      defaultThemes: ['gradient', 'light'],
      batchSize: 10,
      ...config
    };
  }

  /**
   * 为新迁移到B表的心声自动生成PNG
   */
  async generatePngForNewHeartVoice(heartVoiceId: number): Promise<{
    success: boolean;
    generatedCards: number;
    error?: string;
  }> {
    if (!this.config.enableHeartVoice) {
      return { success: true, generatedCards: 0 };
    }

    try {
      // 获取心声数据
      const heartVoice = await this.db.queryFirst(`
        SELECT id, content, user_id, category, anonymous_nickname, created_at
        FROM valid_heart_voices 
        WHERE id = ? AND audit_status = 'approved'
      `, [heartVoiceId]);

      if (!heartVoice) {
        return { success: false, generatedCards: 0, error: '心声不存在或未审核通过' };
      }

      let generatedCount = 0;

      // 为每个默认主题生成PNG
      for (const theme of this.config.defaultThemes) {
        try {
          // 检查是否已经生成过
          const existingCard = await this.db.queryFirst(`
            SELECT id FROM png_cards 
            WHERE content_type = 'heart_voice' AND content_id = ? AND theme = ?
          `, [heartVoiceId, theme]);

          if (existingCard) {
            console.log(`心声 ${heartVoiceId} 的 ${theme} 主题PNG已存在，跳过`);
            continue;
          }

          // 生成PNG卡片
          const result = await this.pngCardService.generateHeartVoiceCard(
            {
              id: heartVoice.id,
              questionnaireId: 'auto-generated', // 添加必需的字段
              content: heartVoice.content,
              userId: heartVoice.user_id,
              anonymousNickname: heartVoice.anonymous_nickname,
              createdAt: heartVoice.created_at,
              category: heartVoice.category || 'employment-feedback'
            },
            { theme: theme as any }
          );

          if (result.success && result.cardId && result.downloadUrl && result.r2Key) {
            // 记录PNG卡片信息
            await this.db.execute(`
              INSERT INTO png_cards (
                content_type, content_id, card_id, r2_key, download_url, theme, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              'heart_voice',
              heartVoiceId,
              result.cardId,
              result.r2Key,
              result.downloadUrl,
              theme,
              new Date().toISOString()
            ]);

            generatedCount++;
            console.log(`✅ 为心声 ${heartVoiceId} 生成 ${theme} 主题PNG成功`);
          } else {
            console.error(`❌ 为心声 ${heartVoiceId} 生成 ${theme} 主题PNG失败:`, result.error);
          }
        } catch (error) {
          console.error(`为心声 ${heartVoiceId} 生成 ${theme} 主题PNG时出错:`, error);
        }
      }

      return { success: true, generatedCards: generatedCount };
    } catch (error) {
      console.error('自动生成心声PNG失败:', error);
      return {
        success: false,
        generatedCards: 0,
        error: error instanceof Error ? error.message : '生成失败'
      };
    }
  }

  /**
   * 为新迁移到B表的故事自动生成PNG
   */
  async generatePngForNewStory(storyId: number): Promise<{
    success: boolean;
    generatedCards: number;
    error?: string;
  }> {
    if (!this.config.enableStory) {
      return { success: true, generatedCards: 0 };
    }

    try {
      // 获取故事数据
      const story = await this.db.queryFirst(`
        SELECT id, title, content, user_id, category, created_at
        FROM valid_stories 
        WHERE id = ? AND audit_status = 'approved'
      `, [storyId]);

      if (!story) {
        return { success: false, generatedCards: 0, error: '故事不存在或未审核通过' };
      }

      let generatedCount = 0;

      // 为每个默认主题生成PNG
      for (const theme of this.config.defaultThemes) {
        try {
          // 检查是否已经生成过
          const existingCard = await this.db.queryFirst(`
            SELECT id FROM png_cards 
            WHERE content_type = 'story' AND content_id = ? AND theme = ?
          `, [storyId, theme]);

          if (existingCard) {
            console.log(`故事 ${storyId} 的 ${theme} 主题PNG已存在，跳过`);
            continue;
          }

          // 生成故事PNG卡片
          const result = await this.generateStoryCard(story, theme);

          if (result.success && result.cardId && result.downloadUrl && result.r2Key) {
            // 记录PNG卡片信息
            await this.db.execute(`
              INSERT INTO png_cards (
                content_type, content_id, card_id, r2_key, download_url, theme, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              'story',
              storyId,
              result.cardId,
              result.r2Key,
              result.downloadUrl,
              theme,
              new Date().toISOString()
            ]);

            generatedCount++;
            console.log(`✅ 为故事 ${storyId} 生成 ${theme} 主题PNG成功`);
          } else {
            console.error(`❌ 为故事 ${storyId} 生成 ${theme} 主题PNG失败:`, result.error);
          }
        } catch (error) {
          console.error(`为故事 ${storyId} 生成 ${theme} 主题PNG时出错:`, error);
        }
      }

      return { success: true, generatedCards: generatedCount };
    } catch (error) {
      console.error('自动生成故事PNG失败:', error);
      return {
        success: false,
        generatedCards: 0,
        error: error instanceof Error ? error.message : '生成失败'
      };
    }
  }

  /**
   * 生成故事PNG卡片
   */
  private async generateStoryCard(story: any, theme: string): Promise<{
    success: boolean;
    cardId?: string;
    downloadUrl?: string;
    r2Key?: string;
    error?: string;
  }> {
    try {
      const cardId = `story-${story.id}-${theme}-${Date.now()}`;
      
      // 生成故事SVG内容
      const svgContent = this.generateStorySVG(story, theme);
      
      // 转换为PNG
      const pngBuffer = await this.convertSVGToPNG(svgContent);
      
      // 上传到R2
      const r2Key = `png-cards/stories/${cardId}.png`;
      const uploadResult = await this.r2Service.uploadFile(r2Key, pngBuffer, {
        filename: `story-card-${story.id}.png`,
        contentType: 'image/png',
        category: 'png-card',
        relatedId: story.id.toString(),
        userId: story.user_id
      });

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || 'Upload failed' };
      }

      return {
        success: true,
        cardId,
        downloadUrl: uploadResult.url,
        r2Key
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成故事卡片失败'
      };
    }
  }

  /**
   * 生成故事SVG内容
   */
  private generateStorySVG(story: any, theme: string): string {
    const width = 800;
    const height = 600;
    
    // 简化的故事SVG生成
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f2f5"/>
        <text x="50" y="100" font-family="Arial" font-size="24" font-weight="bold">${story.title}</text>
        <text x="50" y="150" font-family="Arial" font-size="16">${story.content.substring(0, 200)}...</text>
        <text x="50" y="${height - 50}" font-family="Arial" font-size="12" fill="#666">故事分享</text>
      </svg>
    `;
  }

  /**
   * SVG转PNG（简化实现）
   */
  private async convertSVGToPNG(svgContent: string): Promise<Uint8Array> {
    // 简化实现，实际应该使用真正的SVG到PNG转换
    const encoder = new TextEncoder();
    return encoder.encode(svgContent);
  }

  /**
   * 批量为现有数据生成PNG
   */
  async batchGeneratePng(contentType: 'heart_voice' | 'story', limit: number = 50): Promise<{
    success: boolean;
    processed: number;
    generated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;
    let generated = 0;

    try {
      const tableName = contentType === 'heart_voice' ? 'valid_heart_voices' : 'valid_stories';
      
      // 获取没有PNG的内容
      const contents = await this.db.query(`
        SELECT v.id 
        FROM ${tableName} v
        LEFT JOIN png_cards p ON p.content_type = ? AND p.content_id = v.id
        WHERE v.audit_status = 'approved' AND p.id IS NULL
        LIMIT ?
      `, [contentType, limit]);

      for (const content of contents) {
        try {
          processed++;
          
          let result;
          if (contentType === 'heart_voice') {
            result = await this.generatePngForNewHeartVoice(content.id);
          } else {
            result = await this.generatePngForNewStory(content.id);
          }

          if (result.success) {
            generated += result.generatedCards;
          } else {
            errors.push(`${contentType} ${content.id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${contentType} ${content.id}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { success: true, processed, generated, errors };
    } catch (error) {
      return {
        success: false,
        processed,
        generated,
        errors: [error instanceof Error ? error.message : '批量生成失败']
      };
    }
  }
}

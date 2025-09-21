/**
 * 卡片下载服务
 * 处理PNG卡片的生成、下载和管理
 */

import axios, { AxiosInstance } from 'axios';

// API配置
const API_BASE_URL = process.env.REACT_APP_CARD_API_URL || 'http://localhost:8002/api/cards';

// 类型定义
export interface CardStyle {
  styleId: string;
  styleName: string;
  width: number;
  height: number;
  description: string;
}

export interface GeneratedCard {
  card_id: number;
  style: string;
  filename: string;
  file_url: string;
  file_size: number;
}

export interface GenerationResult {
  success: boolean;
  contentId: number;
  contentType: string;
  generatedCards: Record<string, GeneratedCard>;
  totalGenerated: number;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  error?: string;
}

export interface UserCard {
  cardId: number;
  contentType: string;
  contentId: number;
  cardStyle: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  downloadCount: number;
  contentPreview: string;
  createdAt: string;
  lastDownloadedAt?: string;
}

/**
 * 卡片下载服务类
 */
class CardDownloadService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30秒超时，因为生成卡片可能需要较长时间
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }
  
  /**
   * 生成PNG卡片
   */
  async generateCards(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    userId: number,
    styles: string[] = ['style_1', 'style_2', 'minimal']
  ): Promise<GenerationResult> {
    try {
      const response = await this.client.post('/generate', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        styles: styles
      });
      
      if (response.data.success) {
        return {
          success: true,
          contentId: response.data.data.content_id,
          contentType: response.data.data.content_type,
          generatedCards: response.data.data.generated_cards,
          totalGenerated: response.data.data.total_generated
        };
      } else {
        return {
          success: false,
          contentId,
          contentType,
          generatedCards: {},
          totalGenerated: 0,
          error: response.data.error
        };
      }
    } catch (error) {
      console.error('Generate cards error:', error);
      return {
        success: false,
        contentId,
        contentType,
        generatedCards: {},
        totalGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 下载PNG卡片
   */
  async downloadCard(cardId: number, userId: number): Promise<DownloadResult> {
    try {
      const response = await this.client.get(`/download/${cardId}`, {
        params: { user_id: userId }
      });
      
      if (response.data.success) {
        return {
          success: true,
          downloadUrl: response.data.data.download_url,
          filename: response.data.data.filename,
          fileSize: response.data.data.file_size
        };
      } else {
        return {
          success: false,
          downloadUrl: '',
          filename: '',
          fileSize: 0,
          error: response.data.error
        };
      }
    } catch (error) {
      console.error('Download card error:', error);
      return {
        success: false,
        downloadUrl: '',
        filename: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取用户的卡片列表
   */
  async getUserCards(userId: number): Promise<UserCard[]> {
    try {
      const response = await this.client.get(`/user/${userId}`);
      
      if (response.data.success) {
        return response.data.data.cards.map((card: any) => ({
          cardId: card.card_id,
          contentType: card.content_type,
          contentId: card.content_id,
          cardStyle: card.card_style,
          filename: card.filename,
          fileUrl: card.file_url,
          fileSize: card.file_size,
          downloadCount: card.download_count,
          contentPreview: card.content_preview,
          createdAt: card.created_at,
          lastDownloadedAt: card.last_downloaded_at
        }));
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get user cards error:', error);
      throw error;
    }
  }
  
  /**
   * 获取可用的卡片风格
   */
  async getCardStyles(): Promise<CardStyle[]> {
    try {
      const response = await this.client.get('/styles');
      
      if (response.data.success) {
        return response.data.data.styles.map((style: any) => ({
          styleId: style.style_id,
          styleName: style.style_name,
          width: style.width,
          height: style.height,
          description: style.description
        }));
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Get card styles error:', error);
      throw error;
    }
  }
  
  /**
   * 批量下载卡片
   */
  async batchDownload(cardIds: number[], userId: number): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];
    
    for (const cardId of cardIds) {
      try {
        const result = await this.downloadCard(cardId, userId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          downloadUrl: '',
          filename: '',
          fileSize: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
  
  /**
   * 分享卡片（生成分享链接）
   */
  async shareCard(cardId: number, userId: number): Promise<{ success: boolean; shareUrl?: string; error?: string }> {
    try {
      // 这里可以实现分享链接生成逻辑
      // 暂时返回文件URL作为分享链接
      const downloadResult = await this.downloadCard(cardId, userId);
      
      if (downloadResult.success) {
        return {
          success: true,
          shareUrl: downloadResult.downloadUrl
        };
      } else {
        return {
          success: false,
          error: downloadResult.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 预览卡片（获取预览URL）
   */
  async previewCard(cardId: number, userId: number): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
    try {
      const downloadResult = await this.downloadCard(cardId, userId);
      
      if (downloadResult.success) {
        return {
          success: true,
          previewUrl: downloadResult.downloadUrl
        };
      } else {
        return {
          success: false,
          error: downloadResult.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const cardDownloadService = new CardDownloadService();
export default cardDownloadService;

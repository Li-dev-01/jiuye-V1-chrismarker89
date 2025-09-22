/**
 * PNG卡片服务
 * 处理PNG卡片生成、下载和管理
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 类型定义
export interface CardStyle {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  preview?: string;
}

export interface PNGCard {
  id: number;
  contentType: 'heart_voice' | 'story';
  contentId: number;
  contentUuid: string;
  cardStyle: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  imageWidth: number;
  imageHeight: number;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  downloadCount: number;
  createdAt: string;
  lastDownloadedAt?: string;
}

export interface GenerateCardRequest {
  content_type: 'heart_voice' | 'story';
  content_id: number;
  user_id: number;
  styles: string[];
}

export interface GenerateCardResponse {
  success: boolean;
  data?: {
    task_id: string;
    generated_cards: PNGCard[];
    total_cards: number;
  };
  error?: string;
  message?: string;
}

export interface UserCardsResponse {
  success: boolean;
  data?: {
    cards: PNGCard[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export interface CardStylesResponse {
  success: boolean;
  data?: CardStyle[];
  error?: string;
}

/**
 * PNG卡片服务类
 */
class PNGCardService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // PNG生成可能需要较长时间
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          ErrorHandler.redirectToLogin();
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * 生成PNG卡片
   */
  async generateCards(request: GenerateCardRequest): Promise<GenerateCardResponse> {
    try {
      const response = await this.client.post('/generate', request);
      return response.data;
    } catch (error) {
      console.error('Generate cards error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 下载PNG卡片
   */
  async downloadCard(cardId: number, userId: number): Promise<{
    success: boolean;
    data?: Blob;
    fileName?: string;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/download/${cardId}`, {
        params: { user_id: userId },
        responseType: 'blob'
      });
      
      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'card.png';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      return {
        success: true,
        data: response.data,
        fileName: fileName
      };
    } catch (error) {
      console.error('Download card error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取用户的PNG卡片列表
   */
  async getUserCards(userId: number, params: {
    page?: number;
    pageSize?: number;
    contentType?: 'heart_voice' | 'story';
  } = {}): Promise<UserCardsResponse> {
    try {
      const response = await this.client.get(`/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user cards error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 获取可用的卡片风格
   */
  async getCardStyles(): Promise<CardStylesResponse> {
    try {
      const response = await this.client.get('/styles');
      return response.data;
    } catch (error) {
      console.error('Get card styles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 批量生成多种风格的卡片
   */
  async generateAllStyles(
    contentType: 'heart_voice' | 'story',
    contentId: number,
    userId: number
  ): Promise<GenerateCardResponse> {
    try {
      // 先获取所有可用风格
      const stylesResult = await this.getCardStyles();
      if (!stylesResult.success || !stylesResult.data) {
        return {
          success: false,
          error: 'Failed to get card styles'
        };
      }
      
      const allStyles = stylesResult.data.map(style => style.id);
      
      return await this.generateCards({
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        styles: allStyles
      });
    } catch (error) {
      console.error('Generate all styles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 检查用户是否有下载权限
   */
  async checkDownloadPermission(userId: number): Promise<{
    success: boolean;
    canDownload?: boolean;
    error?: string;
  }> {
    try {
      // 这里可以调用权限检查API
      // 暂时基于用户类型判断
      const userType = localStorage.getItem('user_type');
      const canDownload = userType === 'semi_anonymous' || userType === 'admin';
      
      return {
        success: true,
        canDownload: canDownload
      };
    } catch (error) {
      console.error('Check download permission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * 触发浏览器下载
   */
  triggerDownload(blob: Blob, fileName: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Trigger download error:', error);
      throw new Error('下载失败');
    }
  }
  
  /**
   * 批量下载用户的所有卡片
   */
  async batchDownloadUserCards(userId: number, contentType?: 'heart_voice' | 'story'): Promise<{
    success: boolean;
    downloadedCount?: number;
    error?: string;
  }> {
    try {
      const cardsResult = await this.getUserCards(userId, { contentType });
      if (!cardsResult.success || !cardsResult.data) {
        return {
          success: false,
          error: 'Failed to get user cards'
        };
      }
      
      const cards = cardsResult.data.cards.filter(card => 
        card.generationStatus === 'completed'
      );
      
      let downloadedCount = 0;
      for (const card of cards) {
        try {
          const downloadResult = await this.downloadCard(card.id, userId);
          if (downloadResult.success && downloadResult.data) {
            this.triggerDownload(downloadResult.data, downloadResult.fileName || 'card.png');
            downloadedCount++;
            // 添加延迟避免浏览器阻止多个下载
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to download card ${card.id}:`, error);
        }
      }
      
      return {
        success: true,
        downloadedCount: downloadedCount
      };
    } catch (error) {
      console.error('Batch download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const pngCardService = new PNGCardService();
export default pngCardService;

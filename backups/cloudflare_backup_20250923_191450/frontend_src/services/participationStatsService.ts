/**
 * 页面参与统计服务
 * 获取问卷、故事、心声页面的参与数量统计
 */

import { apiClient } from './api';
import type { ApiResponse } from '../types/uuid-system';

// 参与统计数据类型
export interface ParticipationStats {
  questionnaire: {
    participantCount: number;
    totalResponses: number;
  };
  stories: {
    publishedCount: number;
    authorCount: number;
  };
  voices: {
    publishedCount: number;
    authorCount: number;
  };
  lastUpdated: string;
}

// 统计显示配置
export interface StatsDisplayConfig {
  showParticipants?: boolean;
  showTotal?: boolean;
  showAuthors?: boolean;
  refreshInterval?: number; // 自动刷新间隔（毫秒）
}

class ParticipationStatsService {
  private cache: ParticipationStats | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取参与统计数据
   */
  async getParticipationStats(useCache: boolean = true): Promise<ParticipationStats | null> {
    try {
      // 检查缓存
      if (useCache && this.cache && Date.now() < this.cacheExpiry) {
        return this.cache;
      }

      const response = await apiClient.get<ApiResponse<ParticipationStats>>(
        '/participation-stats/simple'
      );

      if (response.data.success) {
        this.cache = response.data.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return this.cache;
      } else {
        console.error('获取参与统计失败:', response.data.message);
        return null;
      }
    } catch (error: any) {
      console.error('获取参与统计失败:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * 格式化数字显示
   */
  formatNumber(num: number): string {
    if (num >= 10000) {
      return `${Math.floor(num / 1000) / 10}万`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 100) / 10}千`;
    }
    return num.toString();
  }

  /**
   * 获取问卷统计文本
   */
  getQuestionnaireStatsText(stats: ParticipationStats): string {
    const { participantCount, totalResponses } = stats.questionnaire;
    if (participantCount === totalResponses) {
      return `${this.formatNumber(participantCount)}人参与`;
    }
    return `${this.formatNumber(participantCount)}人参与 · ${this.formatNumber(totalResponses)}份问卷`;
  }

  /**
   * 获取故事统计文本
   */
  getStoriesStatsText(stats: ParticipationStats): string {
    const { publishedCount, authorCount } = stats.stories;
    return `${this.formatNumber(publishedCount)}个故事 · ${this.formatNumber(authorCount)}位作者`;
  }

  /**
   * 获取心声统计文本
   */
  getVoicesStatsText(stats: ParticipationStats): string {
    const { publishedCount, authorCount } = stats.voices;
    return `${this.formatNumber(publishedCount)}条心声 · ${this.formatNumber(authorCount)}位用户`;
  }

  /**
   * 获取页面类型对应的统计文本
   */
  getStatsTextByPageType(stats: ParticipationStats, pageType: 'questionnaire' | 'stories' | 'voices'): string {
    switch (pageType) {
      case 'questionnaire':
        return this.getQuestionnaireStatsText(stats);
      case 'stories':
        return this.getStoriesStatsText(stats);
      case 'voices':
        return this.getVoicesStatsText(stats);
      default:
        return '';
    }
  }

  /**
   * 获取页面类型对应的主要数字
   */
  getMainNumberByPageType(stats: ParticipationStats, pageType: 'questionnaire' | 'stories' | 'voices'): number {
    switch (pageType) {
      case 'questionnaire':
        return stats.questionnaire.participantCount;
      case 'stories':
        return stats.stories.publishedCount;
      case 'voices':
        return stats.voices.publishedCount;
      default:
        return 0;
    }
  }

  /**
   * 检查统计数据是否有效
   */
  isStatsValid(stats: ParticipationStats | null): boolean {
    if (!stats) return false;
    
    const hasQuestionnaireData = stats.questionnaire.participantCount > 0 || stats.questionnaire.totalResponses > 0;
    const hasStoriesData = stats.stories.publishedCount > 0 || stats.stories.authorCount > 0;
    const hasVoicesData = stats.voices.publishedCount > 0 || stats.voices.authorCount > 0;
    
    return hasQuestionnaireData || hasStoriesData || hasVoicesData;
  }

  /**
   * 获取最后更新时间的友好显示
   */
  getLastUpdatedText(lastUpdated: string): string {
    try {
      const updateTime = new Date(lastUpdated);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) {
        return '刚刚更新';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前更新`;
      } else if (diffMinutes < 24 * 60) {
        const hours = Math.floor(diffMinutes / 60);
        return `${hours}小时前更新`;
      } else {
        return updateTime.toLocaleDateString('zh-CN');
      }
    } catch (error) {
      return '更新时间未知';
    }
  }
}

// 导出单例实例
export const participationStatsService = new ParticipationStatsService();
export default participationStatsService;

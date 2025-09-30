/**
 * 增强的收藏功能服务
 * 支持服务器端API和本地存储的混合模式
 */

import { favoriteService, type FavoriteStory } from './favoriteService';

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

export interface ServerFavorite {
  id: number;
  story_id: string;
  story_title: string;
  story_summary: string;
  story_category: string;
  story_author: string;
  story_published_at: string;
  favorited_at: string;
}

export interface FavoriteResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class EnhancedFavoriteService {
  private isOnline = navigator.onLine;
  private authToken: string | null = null;

  constructor() {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncLocalToServer();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 获取认证token
    this.updateAuthToken();
  }

  /**
   * 更新认证token
   */
  private updateAuthToken() {
    try {
      const authData = localStorage.getItem('universal-auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.state?.currentSession?.token) {
          this.authToken = parsed.state.currentSession.token;
        }
      }
    } catch (error) {
      console.error('获取认证token失败:', error);
    }
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * 检查用户是否已登录
   */
  private isAuthenticated(): boolean {
    this.updateAuthToken();
    return !!this.authToken;
  }

  /**
   * 添加收藏
   */
  async addToFavorites(story: Omit<FavoriteStory, 'favoriteAt'>): Promise<boolean> {
    // 如果用户未登录，使用本地存储
    if (!this.isAuthenticated()) {
      console.log('用户未登录，使用本地收藏');
      return favoriteService.addToFavorites(story);
    }

    // 如果离线，先保存到本地
    if (!this.isOnline) {
      console.log('离线状态，保存到本地');
      return favoriteService.addToFavorites(story);
    }

    try {
      // 尝试保存到服务器
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          storyId: story.id,
          title: story.title,
          summary: story.summary,
          category: story.category,
          authorName: story.authorName,
          publishedAt: story.publishedAt
        })
      });

      const result: FavoriteResponse = await response.json();

      if (result.success) {
        // 服务器保存成功，同时保存到本地作为缓存
        favoriteService.addToFavorites(story);
        return true;
      } else {
        console.error('服务器收藏失败:', result.message);
        // 服务器失败，回退到本地存储
        return favoriteService.addToFavorites(story);
      }
    } catch (error) {
      console.error('收藏请求失败:', error);
      // 网络错误，回退到本地存储
      return favoriteService.addToFavorites(story);
    }
  }

  /**
   * 取消收藏
   */
  async removeFromFavorites(storyId: string): Promise<boolean> {
    // 如果用户未登录，使用本地存储
    if (!this.isAuthenticated()) {
      return favoriteService.removeFromFavorites(storyId);
    }

    // 如果离线，先从本地删除
    if (!this.isOnline) {
      return favoriteService.removeFromFavorites(storyId);
    }

    try {
      // 尝试从服务器删除
      const response = await fetch(`${API_BASE_URL}/favorites/${storyId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const result: FavoriteResponse = await response.json();

      if (result.success) {
        // 服务器删除成功，同时从本地删除
        favoriteService.removeFromFavorites(storyId);
        return true;
      } else {
        console.error('服务器取消收藏失败:', result.message);
        // 服务器失败，回退到本地操作
        return favoriteService.removeFromFavorites(storyId);
      }
    } catch (error) {
      console.error('取消收藏请求失败:', error);
      // 网络错误，回退到本地操作
      return favoriteService.removeFromFavorites(storyId);
    }
  }

  /**
   * 获取收藏列表
   */
  async getFavorites(): Promise<FavoriteStory[]> {
    // 如果用户未登录，使用本地存储
    if (!this.isAuthenticated()) {
      return favoriteService.getFavorites();
    }

    // 如果离线，返回本地数据
    if (!this.isOnline) {
      return favoriteService.getFavorites();
    }

    try {
      // 尝试从服务器获取
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result: FavoriteResponse = await response.json();

      if (result.success && result.data?.favorites) {
        // 转换服务器数据格式
        const serverFavorites: FavoriteStory[] = result.data.favorites.map((item: ServerFavorite) => ({
          id: item.story_id,
          title: item.story_title,
          summary: item.story_summary,
          category: item.story_category,
          authorName: item.story_author,
          publishedAt: item.story_published_at,
          favoriteAt: item.favorited_at
        }));

        // 更新本地缓存
        localStorage.setItem('story_favorites', JSON.stringify(serverFavorites));
        
        return serverFavorites;
      } else {
        console.error('获取服务器收藏失败:', result.message);
        // 服务器失败，回退到本地数据
        return favoriteService.getFavorites();
      }
    } catch (error) {
      console.error('获取收藏请求失败:', error);
      // 网络错误，回退到本地数据
      return favoriteService.getFavorites();
    }
  }

  /**
   * 检查故事是否已收藏
   */
  async isFavorited(storyId: string): Promise<boolean> {
    // 如果用户未登录，使用本地检查
    if (!this.isAuthenticated()) {
      return favoriteService.isFavorited(storyId);
    }

    // 如果离线，使用本地检查
    if (!this.isOnline) {
      return favoriteService.isFavorited(storyId);
    }

    try {
      // 尝试从服务器检查
      const response = await fetch(`${API_BASE_URL}/favorites/check/${storyId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result: FavoriteResponse = await response.json();

      if (result.success) {
        return result.data?.isFavorited || false;
      } else {
        // 服务器失败，回退到本地检查
        return favoriteService.isFavorited(storyId);
      }
    } catch (error) {
      console.error('检查收藏状态请求失败:', error);
      // 网络错误，回退到本地检查
      return favoriteService.isFavorited(storyId);
    }
  }

  /**
   * 获取收藏数量
   */
  async getFavoriteCount(): Promise<number> {
    const favorites = await this.getFavorites();
    return favorites.length;
  }

  /**
   * 同步本地收藏到服务器
   */
  private async syncLocalToServer(): Promise<void> {
    if (!this.isAuthenticated() || !this.isOnline) {
      return;
    }

    try {
      const localFavorites = favoriteService.getFavorites();
      
      for (const favorite of localFavorites) {
        // 检查服务器是否已有此收藏
        const isServerFavorited = await this.isFavorited(favorite.id);
        
        if (!isServerFavorited) {
          // 服务器没有，上传到服务器
          await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              storyId: favorite.id,
              title: favorite.title,
              summary: favorite.summary,
              category: favorite.category,
              authorName: favorite.authorName,
              publishedAt: favorite.publishedAt
            })
          });
        }
      }

      console.log('本地收藏同步到服务器完成');
    } catch (error) {
      console.error('同步收藏到服务器失败:', error);
    }
  }

  /**
   * 清空所有收藏
   */
  async clearAllFavorites(): Promise<boolean> {
    // 如果用户已登录且在线，清空服务器收藏
    if (this.isAuthenticated() && this.isOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });

        const result: FavoriteResponse = await response.json();
        
        if (!result.success) {
          console.error('清空服务器收藏失败:', result.message);
        }
      } catch (error) {
        console.error('清空服务器收藏请求失败:', error);
      }
    }

    // 清空本地收藏
    localStorage.removeItem('story_favorites');
    return true;
  }
}

// 创建单例实例
export const enhancedFavoriteService = new EnhancedFavoriteService();

// 导出类型
export type { FavoriteStory };

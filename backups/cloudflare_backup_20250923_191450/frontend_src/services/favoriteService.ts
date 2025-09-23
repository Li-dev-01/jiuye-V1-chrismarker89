/**
 * 收藏功能服务 - 轻量级实现
 * 使用 localStorage 存储，适合轻量级应用
 */

export interface FavoriteStory {
  id: string;
  title: string;
  summary: string;
  category: string;
  authorName: string;
  publishedAt: string;
  favoriteAt: string; // 收藏时间
}

class FavoriteService {
  private readonly STORAGE_KEY = 'story_favorites';

  /**
   * 获取用户收藏的故事列表
   */
  getFavorites(): FavoriteStory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  }

  /**
   * 添加故事到收藏
   */
  addToFavorites(story: Omit<FavoriteStory, 'favoriteAt'>): boolean {
    try {
      const favorites = this.getFavorites();
      
      // 检查是否已收藏
      if (favorites.some(fav => fav.id === story.id)) {
        return false; // 已收藏
      }

      const newFavorite: FavoriteStory = {
        ...story,
        favoriteAt: new Date().toISOString()
      };

      favorites.unshift(newFavorite); // 新收藏的放在前面
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('添加收藏失败:', error);
      return false;
    }
  }

  /**
   * 从收藏中移除故事
   */
  removeFromFavorites(storyId: string): boolean {
    try {
      const favorites = this.getFavorites();
      const filteredFavorites = favorites.filter(fav => fav.id !== storyId);
      
      if (filteredFavorites.length === favorites.length) {
        return false; // 未找到要移除的项
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredFavorites));
      return true;
    } catch (error) {
      console.error('移除收藏失败:', error);
      return false;
    }
  }

  /**
   * 检查故事是否已收藏
   */
  isFavorited(storyId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === storyId);
  }

  /**
   * 获取收藏数量
   */
  getFavoriteCount(): number {
    return this.getFavorites().length;
  }

  /**
   * 按分类获取收藏
   */
  getFavoritesByCategory(category: string): FavoriteStory[] {
    const favorites = this.getFavorites();
    return category ? favorites.filter(fav => fav.category === category) : favorites;
  }

  /**
   * 搜索收藏的故事
   */
  searchFavorites(keyword: string): FavoriteStory[] {
    const favorites = this.getFavorites();
    if (!keyword.trim()) return favorites;

    const lowerKeyword = keyword.toLowerCase();
    return favorites.filter(fav => 
      fav.title.toLowerCase().includes(lowerKeyword) ||
      fav.summary.toLowerCase().includes(lowerKeyword) ||
      fav.authorName.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 清空所有收藏
   */
  clearAllFavorites(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清空收藏失败:', error);
      return false;
    }
  }

  /**
   * 导出收藏数据（用于备份）
   */
  exportFavorites(): string {
    const favorites = this.getFavorites();
    return JSON.stringify(favorites, null, 2);
  }

  /**
   * 导入收藏数据（用于恢复）
   */
  importFavorites(data: string): boolean {
    try {
      const favorites = JSON.parse(data);
      if (Array.isArray(favorites)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入收藏失败:', error);
      return false;
    }
  }
}

export const favoriteService = new FavoriteService();

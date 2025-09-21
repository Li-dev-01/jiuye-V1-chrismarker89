/**
 * 内容缓存管理器
 * 用于优化故事墙和问卷心声的数据加载和缓存
 */

interface CacheItem<T> {
  data: T[];
  timestamp: number;
  hasMore: boolean;
  totalCount: number;
}

interface LoadConfig {
  listPageSize: number;
  swipeViewerInitialSize: number;
  swipeViewerBatchSize: number;
  preloadThreshold: number;
  maxItemsPerCategory: number;
  maxTotalItems: number;
  cacheDuration: number;
}

export class ContentCacheManager<T extends { id: number; category?: string }> {
  private cache = new Map<string, CacheItem<T>>();
  private viewHistory = new Set<number>(); // 用户浏览历史
  private config: LoadConfig;
  private userAccessController: any; // 用户访问控制器

  constructor(config: Partial<LoadConfig> = {}, userAccessController?: any) {
    this.config = {
      listPageSize: 10,
      swipeViewerInitialSize: 50,
      swipeViewerBatchSize: 30,
      preloadThreshold: 10,
      maxItemsPerCategory: 500,
      maxTotalItems: 2000,
      cacheDuration: 30 * 60 * 1000, // 30分钟
      ...config
    };

    this.userAccessController = userAccessController;

    // 从localStorage恢复浏览历史
    this.loadViewHistory();
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(category: string = 'all'): string {
    return `content_${category}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cacheItem: CacheItem<T>): boolean {
    return Date.now() - cacheItem.timestamp < this.config.cacheDuration;
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    for (const [key, item] of this.cache.entries()) {
      if (!this.isCacheValid(item)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 控制缓存大小
   */
  private limitCacheSize(): void {
    const totalItems = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.data.length, 0);

    if (totalItems > this.config.maxTotalItems) {
      // 使用LRU策略，删除最旧的缓存
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      let itemsToRemove = totalItems - this.config.maxTotalItems;
      for (const [key, item] of sortedEntries) {
        if (itemsToRemove <= 0) break;
        this.cache.delete(key);
        itemsToRemove -= item.data.length;
      }
    }
  }

  /**
   * 去重处理
   */
  private deduplicateItems(items: T[]): T[] {
    const seen = new Set<number>();
    return items.filter(item => {
      if (seen.has(item.id) || this.viewHistory.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  /**
   * 获取列表页数据
   */
  async getListPageData(
    category: string = 'all',
    page: number = 1,
    loadFn: (category: string, offset: number, limit: number) => Promise<{
      items: T[];
      total: number;
      hasMore: boolean;
    }>
  ): Promise<{
    items: T[];
    total: number;
    hasMore: boolean;
    fromCache: boolean;
  }> {
    this.cleanExpiredCache();
    
    const cacheKey = this.getCacheKey(category);
    const cached = this.cache.get(cacheKey);

    // 计算需要的数据范围
    const startIndex = (page - 1) * this.config.listPageSize;
    const endIndex = startIndex + this.config.listPageSize;
    const preloadEndIndex = endIndex + this.config.listPageSize; // 预加载下一页

    // 检查缓存是否足够
    if (cached && this.isCacheValid(cached) && cached.data.length >= preloadEndIndex) {
      const pageItems = cached.data.slice(startIndex, endIndex);
      return {
        items: pageItems,
        total: cached.totalCount,
        hasMore: cached.hasMore,
        fromCache: true
      };
    }

    // 需要加载新数据
    const loadSize = Math.max(this.config.listPageSize * 2, preloadEndIndex);
    const result = await loadFn(category, 0, loadSize);
    
    // 去重处理
    const deduplicatedItems = this.deduplicateItems(result.items);

    // 更新缓存
    this.cache.set(cacheKey, {
      data: deduplicatedItems,
      timestamp: Date.now(),
      hasMore: result.hasMore,
      totalCount: result.total
    });

    this.limitCacheSize();

    const pageItems = deduplicatedItems.slice(startIndex, endIndex);
    return {
      items: pageItems,
      total: result.total,
      hasMore: result.hasMore,
      fromCache: false
    };
  }

  /**
   * 获取SwipeViewer数据
   */
  async getSwipeViewerData(
    category: string = 'all',
    startIndex: number = 0,
    loadFn: (category: string, offset: number, limit: number) => Promise<{
      items: T[];
      total: number;
      hasMore: boolean;
    }>
  ): Promise<{
    items: T[];
    hasMore: boolean;
    fromCache: boolean;
  }> {
    this.cleanExpiredCache();
    
    const cacheKey = this.getCacheKey(category);
    const cached = this.cache.get(cacheKey);
    const requiredSize = startIndex + this.config.swipeViewerInitialSize;

    // 检查缓存是否足够
    if (cached && this.isCacheValid(cached) && cached.data.length >= requiredSize) {
      const items = cached.data.slice(startIndex, requiredSize);
      return {
        items,
        hasMore: cached.hasMore || cached.data.length > requiredSize,
        fromCache: true
      };
    }

    // 加载数据
    const loadSize = Math.max(requiredSize, this.config.swipeViewerInitialSize);
    const result = await loadFn(category, startIndex, loadSize);
    
    // 去重处理
    const deduplicatedItems = this.deduplicateItems(result.items);

    // 合并到现有缓存
    if (cached && this.isCacheValid(cached)) {
      // 合并新数据到现有缓存
      const mergedData = [...cached.data];
      deduplicatedItems.forEach((item, index) => {
        const targetIndex = startIndex + index;
        if (targetIndex < mergedData.length) {
          mergedData[targetIndex] = item;
        } else {
          mergedData.push(item);
        }
      });

      this.cache.set(cacheKey, {
        data: mergedData,
        timestamp: Date.now(),
        hasMore: result.hasMore,
        totalCount: result.total
      });
    } else {
      // 创建新缓存
      this.cache.set(cacheKey, {
        data: deduplicatedItems,
        timestamp: Date.now(),
        hasMore: result.hasMore,
        totalCount: result.total
      });
    }

    this.limitCacheSize();

    const items = deduplicatedItems.slice(0, this.config.swipeViewerInitialSize);
    return {
      items,
      hasMore: result.hasMore,
      fromCache: false
    };
  }

  /**
   * 预加载更多数据
   */
  async loadMoreForSwipeViewer(
    category: string = 'all',
    currentLength: number,
    loadFn: (category: string, offset: number, limit: number) => Promise<{
      items: T[];
      total: number;
      hasMore: boolean;
    }>
  ): Promise<{
    items: T[];
    hasMore: boolean;
  }> {
    const cacheKey = this.getCacheKey(category);
    const cached = this.cache.get(cacheKey);

    // 检查是否需要加载
    if (cached && cached.data.length > currentLength + this.config.preloadThreshold) {
      const newItems = cached.data.slice(currentLength, currentLength + this.config.swipeViewerBatchSize);
      return {
        items: newItems,
        hasMore: cached.hasMore || cached.data.length > currentLength + this.config.swipeViewerBatchSize
      };
    }

    // 加载新数据
    const result = await loadFn(category, currentLength, this.config.swipeViewerBatchSize);
    const deduplicatedItems = this.deduplicateItems(result.items);

    // 更新缓存
    if (cached) {
      cached.data.push(...deduplicatedItems);
      cached.hasMore = result.hasMore;
      cached.timestamp = Date.now();
    }

    return {
      items: deduplicatedItems,
      hasMore: result.hasMore
    };
  }

  /**
   * 记录用户浏览历史
   */
  markAsViewed(itemId: number): void {
    this.viewHistory.add(itemId);
    this.saveViewHistory();
  }

  /**
   * 清除浏览历史
   */
  clearViewHistory(): void {
    this.viewHistory.clear();
    localStorage.removeItem('content_view_history');
  }

  /**
   * 保存浏览历史到localStorage
   */
  private saveViewHistory(): void {
    try {
      const historyArray = Array.from(this.viewHistory);
      // 只保存最近1000条浏览记录
      const recentHistory = historyArray.slice(-1000);
      localStorage.setItem('content_view_history', JSON.stringify(recentHistory));
    } catch (error) {
      console.warn('Failed to save view history:', error);
    }
  }

  /**
   * 从localStorage加载浏览历史
   */
  private loadViewHistory(): void {
    try {
      const saved = localStorage.getItem('content_view_history');
      if (saved) {
        const historyArray = JSON.parse(saved);
        this.viewHistory = new Set(historyArray);
      }
    } catch (error) {
      console.warn('Failed to load view history:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalCategories: number;
    totalItems: number;
    memoryUsageEstimate: string;
    viewHistorySize: number;
  } {
    const totalItems = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.data.length, 0);
    
    // 估算内存使用（每个项目约5KB）
    const memoryUsageKB = totalItems * 5;
    const memoryUsageMB = (memoryUsageKB / 1024).toFixed(2);

    return {
      totalCategories: this.cache.size,
      totalItems,
      memoryUsageEstimate: `${memoryUsageMB}MB`,
      viewHistorySize: this.viewHistory.size
    };
  }
}

/**
 * 优化的内容加载Hook
 * 用于故事墙和问卷心声的性能优化
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ContentCacheManager } from '../utils/contentCacheManager';

interface ContentItem {
  id: number;
  category?: string;
  [key: string]: any;
}

interface UseOptimizedContentOptions {
  contentType: 'story' | 'voice';
  initialCategory?: string;
  enablePreload?: boolean;
  enableDeduplication?: boolean;
}

interface UseOptimizedContentReturn<T> {
  // 列表页数据
  listItems: T[];
  listLoading: boolean;
  listError: string | null;
  listHasMore: boolean;
  listTotal: number;
  
  // SwipeViewer数据
  swipeItems: T[];
  swipeLoading: boolean;
  swipeHasMore: boolean;
  
  // 操作方法
  loadListPage: (page: number, category?: string) => Promise<void>;
  loadSwipeViewer: (startIndex: number, category?: string) => Promise<void>;
  loadMoreSwipeItems: () => Promise<void>;
  changeCategory: (category: string) => Promise<void>;
  markItemAsViewed: (itemId: number) => void;
  
  // 缓存管理
  clearCache: () => void;
  getCacheStats: () => any;
}

export function useOptimizedContent<T extends ContentItem>(
  loadFunction: (category: string, offset: number, limit: number) => Promise<{
    items: T[];
    total: number;
    hasMore: boolean;
  }>,
  options: UseOptimizedContentOptions
): UseOptimizedContentReturn<T> {
  
  // 缓存管理器
  const cacheManagerRef = useRef<ContentCacheManager<T>>();
  if (!cacheManagerRef.current) {
    cacheManagerRef.current = new ContentCacheManager<T>({
      listPageSize: 10,
      swipeViewerInitialSize: 50,
      swipeViewerBatchSize: 30,
      preloadThreshold: 10,
      maxItemsPerCategory: 500,
      maxTotalItems: 2000,
      cacheDuration: 30 * 60 * 1000
    });
  }

  // 状态管理
  const [listItems, setListItems] = useState<T[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listHasMore, setListHasMore] = useState(true);
  const [listTotal, setListTotal] = useState(0);

  const [swipeItems, setSwipeItems] = useState<T[]>([]);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [swipeHasMore, setSwipeHasMore] = useState(true);

  const [currentCategory, setCurrentCategory] = useState(options.initialCategory || 'all');
  const [currentPage, setCurrentPage] = useState(1);

  // 加载列表页数据
  const loadListPage = useCallback(async (page: number, category?: string) => {
    const targetCategory = category || currentCategory;
    setListLoading(true);
    setListError(null);

    try {
      const result = await cacheManagerRef.current!.getListPageData(
        targetCategory,
        page,
        loadFunction
      );

      setListItems(result.items);
      setListTotal(result.total);
      setListHasMore(result.hasMore);
      setCurrentPage(page);

      // 性能监控
      if (!result.fromCache) {
        console.log(`[${options.contentType}] Loaded page ${page} from API:`, {
          category: targetCategory,
          itemCount: result.items.length,
          total: result.total
        });
      } else {
        console.log(`[${options.contentType}] Loaded page ${page} from cache:`, {
          category: targetCategory,
          itemCount: result.items.length
        });
      }

    } catch (error) {
      console.error(`Failed to load ${options.contentType} list:`, error);
      setListError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setListLoading(false);
    }
  }, [currentCategory, loadFunction, options.contentType]);

  // 加载SwipeViewer数据
  const loadSwipeViewer = useCallback(async (startIndex: number, category?: string) => {
    const targetCategory = category || currentCategory;
    setSwipeLoading(true);

    try {
      const result = await cacheManagerRef.current!.getSwipeViewerData(
        targetCategory,
        startIndex,
        loadFunction
      );

      setSwipeItems(result.items);
      setSwipeHasMore(result.hasMore);

      console.log(`[${options.contentType}] Loaded SwipeViewer data:`, {
        category: targetCategory,
        startIndex,
        itemCount: result.items.length,
        fromCache: result.fromCache
      });

    } catch (error) {
      console.error(`Failed to load ${options.contentType} swipe data:`, error);
    } finally {
      setSwipeLoading(false);
    }
  }, [currentCategory, loadFunction, options.contentType]);

  // 加载更多SwipeViewer数据
  const loadMoreSwipeItems = useCallback(async () => {
    if (swipeLoading || !swipeHasMore) return;

    setSwipeLoading(true);

    try {
      const result = await cacheManagerRef.current!.loadMoreForSwipeViewer(
        currentCategory,
        swipeItems.length,
        loadFunction
      );

      setSwipeItems(prev => [...prev, ...result.items]);
      setSwipeHasMore(result.hasMore);

      console.log(`[${options.contentType}] Loaded more SwipeViewer data:`, {
        category: currentCategory,
        newItemCount: result.items.length,
        totalItems: swipeItems.length + result.items.length
      });

    } catch (error) {
      console.error(`Failed to load more ${options.contentType} data:`, error);
    } finally {
      setSwipeLoading(false);
    }
  }, [currentCategory, swipeItems.length, swipeLoading, swipeHasMore, loadFunction, options.contentType]);

  // 切换分类
  const changeCategory = useCallback(async (category: string) => {
    if (category === currentCategory) return;

    setCurrentCategory(category);
    setCurrentPage(1);
    
    // 并行加载列表页和SwipeViewer数据
    await Promise.all([
      loadListPage(1, category),
      loadSwipeViewer(0, category)
    ]);

    console.log(`[${options.contentType}] Changed category to:`, category);
  }, [currentCategory, loadListPage, loadSwipeViewer, options.contentType]);

  // 标记项目为已浏览
  const markItemAsViewed = useCallback((itemId: number) => {
    if (options.enableDeduplication !== false) {
      cacheManagerRef.current!.markAsViewed(itemId);
    }
  }, [options.enableDeduplication]);

  // 清除缓存
  const clearCache = useCallback(() => {
    cacheManagerRef.current!.clearCache();
    console.log(`[${options.contentType}] Cache cleared`);
  }, [options.contentType]);

  // 获取缓存统计
  const getCacheStats = useCallback(() => {
    return cacheManagerRef.current!.getCacheStats();
  }, []);

  // 初始化加载
  useEffect(() => {
    loadListPage(1);
    if (options.enablePreload !== false) {
      loadSwipeViewer(0);
    }
  }, []);

  // 性能监控
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getCacheStats();
      if (stats.totalItems > 0) {
        console.log(`[${options.contentType}] Cache stats:`, stats);
      }
    }, 60000); // 每分钟输出一次统计

    return () => clearInterval(interval);
  }, [getCacheStats, options.contentType]);

  return {
    // 列表页数据
    listItems,
    listLoading,
    listError,
    listHasMore,
    listTotal,
    
    // SwipeViewer数据
    swipeItems,
    swipeLoading,
    swipeHasMore,
    
    // 操作方法
    loadListPage,
    loadSwipeViewer,
    loadMoreSwipeItems,
    changeCategory,
    markItemAsViewed,
    
    // 缓存管理
    clearCache,
    getCacheStats
  };
}

// 预设配置
export const CONTENT_CONFIGS = {
  STORY: {
    contentType: 'story' as const,
    enablePreload: true,
    enableDeduplication: true
  },
  VOICE: {
    contentType: 'voice' as const,
    enablePreload: true,
    enableDeduplication: true
  }
} as const;

// 性能监控Hook
export function usePerformanceMonitor(contentType: string) {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    cacheHitRate: 0,
    memoryUsage: '0MB'
  });

  const startTime = useRef<number>(0);

  const startMeasure = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endMeasure = useCallback((fromCache: boolean) => {
    const loadTime = performance.now() - startTime.current;
    
    setMetrics(prev => ({
      ...prev,
      loadTime,
      cacheHitRate: fromCache ? prev.cacheHitRate + 1 : prev.cacheHitRate
    }));

    console.log(`[${contentType}] Load time: ${loadTime.toFixed(2)}ms, From cache: ${fromCache}`);
  }, [contentType]);

  return { metrics, startMeasure, endMeasure };
}

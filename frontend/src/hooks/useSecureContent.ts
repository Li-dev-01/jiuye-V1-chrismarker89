/**
 * 安全内容访问Hook
 * 集成用户访问控制、防爬虫机制和内容缓存
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { ContentCacheManager } from '../utils/contentCacheManager';
import { userAccessController, UserType } from '../utils/userAccessControl';
import { useAuth } from '../stores/universalAuthStore';

interface ContentItem {
  id: number;
  category?: string;
  [key: string]: any;
}

interface UseSecureContentOptions {
  contentType: 'story' | 'voice';
  initialCategory?: string;
  enableAntiCrawler?: boolean;
}

interface AccessLimitInfo {
  isLimited: boolean;
  remainingQuota: number;
  userType: UserType;
  upgradeRequired: boolean;
  retryAfter?: number;
  reason?: string;
}

interface UseSecureContentReturn<T> {
  // 数据状态
  listItems: T[];
  swipeItems: T[];
  loading: boolean;
  error: string | null;
  
  // 访问控制状态
  accessInfo: AccessLimitInfo;
  userStats: any;
  
  // 操作方法
  loadListPage: (page: number, category?: string) => Promise<boolean>;
  loadSwipeViewer: (startIndex: number, category?: string) => Promise<boolean>;
  loadMoreSwipeItems: () => Promise<boolean>;
  changeCategory: (category: string) => Promise<boolean>;
  
  // 用户操作
  upgradeToSemiAnonymous: () => Promise<boolean>;
  recordContentView: (contentIds: number[], metadata?: any) => void;
  
  // 管理方法
  clearUserData: () => void;
  getCacheStats: () => any;
}

export function useSecureContent<T extends ContentItem>(
  loadFunction: (category: string, offset: number, limit: number) => Promise<{
    items: T[];
    total: number;
    hasMore: boolean;
  }>,
  options: UseSecureContentOptions
): UseSecureContentReturn<T> {

  // 认证状态
  const { isAuthenticated, currentUser } = useAuth();
  
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
    }, userAccessController);
  }

  // 状态管理
  const [listItems, setListItems] = useState<T[]>([]);
  const [swipeItems, setSwipeItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState(options.initialCategory || 'all');
  
  // 访问控制状态
  const [accessInfo, setAccessInfo] = useState<AccessLimitInfo>({
    isLimited: false,
    remainingQuota: 50,
    userType: UserType.ANONYMOUS,
    upgradeRequired: false
  });
  
  const [userStats, setUserStats] = useState<any>({});

  // 确定用户类型
  const getUserType = useCallback((): UserType => {
    if (isAuthenticated && currentUser) {
      return currentUser.isFullyRegistered ? UserType.REGISTERED : UserType.SEMI_ANONYMOUS;
    }
    return UserType.ANONYMOUS;
  }, [isAuthenticated, currentUser]);

  // 检查访问权限
  const checkAccess = useCallback(async (requestedCount: number = 1): Promise<boolean> => {
    if (!options.enableAntiCrawler) return true;

    const userType = getUserType();
    const userId = currentUser?.id;
    
    const accessResult = await userAccessController.checkAccess(userType, userId, requestedCount);
    
    setAccessInfo({
      isLimited: !accessResult.allowed,
      remainingQuota: accessResult.remainingQuota || 0,
      userType,
      upgradeRequired: accessResult.upgradeRequired || false,
      retryAfter: accessResult.retryAfter,
      reason: accessResult.reason
    });

    if (!accessResult.allowed) {
      if (accessResult.upgradeRequired) {
        message.warning({
          content: `${accessResult.reason}，请注册半匿名账户以继续浏览`,
          duration: 5
        });
      } else if (accessResult.retryAfter) {
        const minutes = Math.ceil(accessResult.retryAfter / 60);
        message.error({
          content: `${accessResult.reason}，请${minutes}分钟后再试`,
          duration: 3
        });
      } else {
        message.error(accessResult.reason);
      }
      return false;
    }

    return true;
  }, [options.enableAntiCrawler, getUserType, currentUser]);

  // 记录访问
  const recordAccess = useCallback((contentIds: number[], metadata?: any) => {
    if (!options.enableAntiCrawler) return;

    const userType = getUserType();
    const userId = currentUser?.id;
    
    userAccessController.recordAccess(userType, userId, contentIds, {
      category: currentCategory,
      ...metadata
    });

    // 更新用户统计
    const stats = userAccessController.getUserAccessStats(userType, userId);
    setUserStats(stats);
  }, [options.enableAntiCrawler, getUserType, currentUser, currentCategory]);

  // 加载列表页数据
  const loadListPage = useCallback(async (page: number, category?: string): Promise<boolean> => {
    const targetCategory = category || currentCategory;
    const requestedCount = 10; // 每页10条

    // 检查访问权限
    if (!(await checkAccess(requestedCount))) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await cacheManagerRef.current!.getListPageData(
        targetCategory,
        page,
        loadFunction
      );

      setListItems(result.items);
      
      // 记录访问
      recordAccess(result.items.map(item => item.id), {
        action: 'view',
        source: 'list_page',
        page
      });

      console.log(`[${options.contentType}] Loaded list page ${page}:`, {
        category: targetCategory,
        itemCount: result.items.length,
        fromCache: result.fromCache,
        remainingQuota: accessInfo.remainingQuota - requestedCount
      });

      return true;

    } catch (error) {
      console.error(`Failed to load ${options.contentType} list:`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentCategory, checkAccess, recordAccess, options.contentType, accessInfo.remainingQuota]);

  // 加载SwipeViewer数据
  const loadSwipeViewer = useCallback(async (startIndex: number, category?: string): Promise<boolean> => {
    const targetCategory = category || currentCategory;
    const requestedCount = 50; // SwipeViewer初始加载50条

    // 检查访问权限
    if (!(await checkAccess(requestedCount))) {
      return false;
    }

    setLoading(true);

    try {
      const result = await cacheManagerRef.current!.getSwipeViewerData(
        targetCategory,
        startIndex,
        loadFunction
      );

      setSwipeItems(result.items);
      
      // 记录访问
      recordAccess(result.items.map(item => item.id), {
        action: 'view',
        source: 'swipe_viewer',
        startIndex
      });

      console.log(`[${options.contentType}] Loaded SwipeViewer data:`, {
        category: targetCategory,
        startIndex,
        itemCount: result.items.length,
        fromCache: result.fromCache
      });

      return true;

    } catch (error) {
      console.error(`Failed to load ${options.contentType} swipe data:`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentCategory, checkAccess, recordAccess, options.contentType]);

  // 加载更多SwipeViewer数据
  const loadMoreSwipeItems = useCallback(async (): Promise<boolean> => {
    const requestedCount = 30; // 每批加载30条

    // 检查访问权限
    if (!(await checkAccess(requestedCount))) {
      return false;
    }

    if (loading) return false;

    setLoading(true);

    try {
      const result = await cacheManagerRef.current!.loadMoreForSwipeViewer(
        currentCategory,
        swipeItems.length,
        loadFunction
      );

      setSwipeItems(prev => [...prev, ...result.items]);
      
      // 记录访问
      recordAccess(result.items.map(item => item.id), {
        action: 'view',
        source: 'swipe_viewer_more',
        batchSize: result.items.length
      });

      return true;

    } catch (error) {
      console.error(`Failed to load more ${options.contentType} data:`, error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentCategory, swipeItems.length, loading, checkAccess, recordAccess, options.contentType]);

  // 切换分类
  const changeCategory = useCallback(async (category: string): Promise<boolean> => {
    if (category === currentCategory) return true;

    setCurrentCategory(category);
    
    // 并行加载列表页和SwipeViewer数据
    const [listSuccess, swipeSuccess] = await Promise.all([
      loadListPage(1, category),
      loadSwipeViewer(0, category)
    ]);

    return listSuccess && swipeSuccess;
  }, [currentCategory, loadListPage, loadSwipeViewer]);

  // 升级到半匿名用户
  const upgradeToSemiAnonymous = useCallback(async (): Promise<boolean> => {
    try {
      // 这里应该调用注册API
      // const result = await registerSemiAnonymousUser();
      
      // 模拟注册成功
      message.success('注册成功！现在可以浏览更多内容了');
      
      // 重新检查访问权限
      await checkAccess(0);
      
      return true;
    } catch (error) {
      message.error('注册失败，请重试');
      return false;
    }
  }, [checkAccess]);

  // 记录内容浏览
  const recordContentView = useCallback((contentIds: number[], metadata?: any) => {
    recordAccess(contentIds, {
      action: 'view',
      readTime: metadata?.readTime,
      ...metadata
    });
  }, [recordAccess]);

  // 清除用户数据
  const clearUserData = useCallback(() => {
    const userType = getUserType();
    const userId = currentUser?.id;
    userAccessController.clearUserData(userType, userId);
    cacheManagerRef.current!.clearCache();
    
    setAccessInfo({
      isLimited: false,
      remainingQuota: 50,
      userType: UserType.ANONYMOUS,
      upgradeRequired: false
    });
    
    message.success('用户数据已清除');
  }, [getUserType, currentUser]);

  // 获取缓存统计
  const getCacheStats = useCallback(() => {
    return {
      cache: cacheManagerRef.current!.getCacheStats(),
      system: userAccessController.getSystemStats()
    };
  }, []);

  // 检查是否需要升级提示
  useEffect(() => {
    if (!options.enableAntiCrawler) return;

    const userType = getUserType();
    const userId = currentUser?.id;
    const upgradeCheck = userAccessController.shouldUpgradeUser(userType, userId);
    
    if (upgradeCheck.shouldUpgrade) {
      message.info({
        content: `${upgradeCheck.reason}，建议注册以获得更好的体验`,
        duration: 8
      });
    }
  }, [options.enableAntiCrawler, getUserType, currentUser]);

  // 初始化加载
  useEffect(() => {
    loadListPage(1);
    loadSwipeViewer(0);
  }, []);

  // 定期更新用户统计
  useEffect(() => {
    const interval = setInterval(() => {
      if (options.enableAntiCrawler) {
        const userType = getUserType();
        const userId = currentUser?.id;
        const stats = userAccessController.getUserAccessStats(userType, userId);
        setUserStats(stats);
      }
    }, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, [options.enableAntiCrawler, getUserType, currentUser]);

  return {
    // 数据状态
    listItems,
    swipeItems,
    loading,
    error,
    
    // 访问控制状态
    accessInfo,
    userStats,
    
    // 操作方法
    loadListPage,
    loadSwipeViewer,
    loadMoreSwipeItems,
    changeCategory,
    
    // 用户操作
    upgradeToSemiAnonymous,
    recordContentView,
    
    // 管理方法
    clearUserData,
    getCacheStats
  };
}

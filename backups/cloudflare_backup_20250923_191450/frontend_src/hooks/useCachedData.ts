/**
 * 缓存数据 Hook
 * 提供数据缓存、自动刷新和错误处理功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCachedDataOptions {
  enabled?: boolean;
  cacheTime?: number;      // 缓存时间（毫秒）
  staleTime?: number;      // 数据新鲜时间（毫秒）
  refetchInterval?: number; // 自动刷新间隔（毫秒）
  retry?: number;          // 重试次数
  retryDelay?: number;     // 重试延迟（毫秒）
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface UseCachedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// 全局缓存存储
const cache = new Map<string, CacheEntry<any>>();

export const useCachedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataReturn<T> => {
  const {
    enabled = true,
    cacheTime = 5 * 60 * 1000,      // 5分钟
    staleTime = 1 * 60 * 1000,      // 1分钟
    refetchInterval,
    retry = 1,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取缓存数据
  const getCachedData = useCallback((): CacheEntry<T> | null => {
    const cached = cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheTime;
    
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    const isStale = now - cached.timestamp > staleTime;
    return { ...cached, isStale };
  }, [key, cacheTime, staleTime]);

  // 设置缓存数据
  const setCachedData = useCallback((newData: T) => {
    cache.set(key, {
      data: newData,
      timestamp: Date.now(),
      isStale: false
    });
  }, [key]);

  // 执行数据获取
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const result = await fetcher();
      
      setData(result);
      setCachedData(result);
      setError(null);
      retryCountRef.current = 0;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`数据获取失败 (${key}):`, error);
      
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
      } else {
        setError(error);
        retryCountRef.current = 0;
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [enabled, fetcher, key, retry, retryDelay, setCachedData]);

  // 手动刷新数据
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // 清除缓存
  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
    setError(null);
  }, [key]);

  // 初始化数据加载
  useEffect(() => {
    if (!enabled) return;

    // 首先检查缓存
    const cached = getCachedData();
    if (cached) {
      setData(cached.data);
      
      // 如果数据已过期，在后台刷新
      if (cached.isStale) {
        fetchData();
      }
    } else {
      // 没有缓存，直接获取数据
      fetchData();
    }
  }, [enabled, getCachedData, fetchData]);

  // 设置自动刷新
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refetchInterval, fetchData]);

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
};

// 全局缓存管理工具
export const cacheUtils = {
  // 清除所有缓存
  clearAll: () => {
    cache.clear();
  },
  
  // 清除特定前缀的缓存
  clearByPrefix: (prefix: string) => {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },
  
  // 获取缓存大小
  getSize: () => cache.size,
  
  // 获取所有缓存键
  getKeys: () => Array.from(cache.keys())
};

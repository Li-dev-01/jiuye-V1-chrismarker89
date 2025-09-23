// 缓存管理工具

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  // 设置缓存
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const storage = options.storage || 'memory';
    const expiry = Date.now() + ttl;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry
    };

    switch (storage) {
      case 'memory':
        this.setMemoryCache(key, cacheItem);
        break;
      case 'localStorage':
        this.setStorageCache(key, cacheItem, localStorage);
        break;
      case 'sessionStorage':
        this.setStorageCache(key, cacheItem, sessionStorage);
        break;
    }
  }

  // 获取缓存
  get<T>(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): T | null {
    let cacheItem: CacheItem<T> | null = null;

    switch (storage) {
      case 'memory':
        cacheItem = this.memoryCache.get(key) || null;
        break;
      case 'localStorage':
        cacheItem = this.getStorageCache(key, localStorage);
        break;
      case 'sessionStorage':
        cacheItem = this.getStorageCache(key, sessionStorage);
        break;
    }

    if (!cacheItem) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cacheItem.expiry) {
      this.delete(key, storage);
      return null;
    }

    return cacheItem.data;
  }

  // 删除缓存
  delete(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    switch (storage) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'localStorage':
        localStorage.removeItem(`cache_${key}`);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(`cache_${key}`);
        break;
    }
  }

  // 清空缓存
  clear(storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    switch (storage) {
      case 'memory':
        this.memoryCache.clear();
        break;
      case 'localStorage':
        this.clearStorageCache(localStorage);
        break;
      case 'sessionStorage':
        this.clearStorageCache(sessionStorage);
        break;
    }
  }

  // 检查缓存是否存在且未过期
  has(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): boolean {
    return this.get(key, storage) !== null;
  }

  // 获取缓存统计信息
  getStats(storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): {
    size: number;
    keys: string[];
  } {
    switch (storage) {
      case 'memory':
        return {
          size: this.memoryCache.size,
          keys: Array.from(this.memoryCache.keys())
        };
      case 'localStorage':
        return this.getStorageStats(localStorage);
      case 'sessionStorage':
        return this.getStorageStats(sessionStorage);
      default:
        return { size: 0, keys: [] };
    }
  }

  private setMemoryCache<T>(key: string, cacheItem: CacheItem<T>): void {
    // 如果超过最大大小，删除最旧的项
    if (this.memoryCache.size >= this.maxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, cacheItem);
  }

  private setStorageCache<T>(key: string, cacheItem: CacheItem<T>, storage: Storage): void {
    try {
      storage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set storage cache:', error);
    }
  }

  private getStorageCache<T>(key: string, storage: Storage): CacheItem<T> | null {
    try {
      const item = storage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get storage cache:', error);
      return null;
    }
  }

  private clearStorageCache(storage: Storage): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => storage.removeItem(key));
  }

  private getStorageStats(storage: Storage): { size: number; keys: string[] } {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache_')) {
        keys.push(key.replace('cache_', ''));
      }
    }
    return { size: keys.length, keys };
  }

  // 清理过期缓存
  cleanup(): void {
    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (Date.now() > item.expiry) {
        this.memoryCache.delete(key);
      }
    }

    // 清理 localStorage 缓存
    this.cleanupStorageCache(localStorage);

    // 清理 sessionStorage 缓存
    this.cleanupStorageCache(sessionStorage);
  }

  private cleanupStorageCache(storage: Storage): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache_')) {
        const item = this.getStorageCache(key.replace('cache_', ''), storage);
        if (item && Date.now() > item.expiry) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => storage.removeItem(key));
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager();

// 定期清理过期缓存
setInterval(() => {
  cacheManager.cleanup();
}, 60000); // 每分钟清理一次

// 缓存装饰器函数
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  const { keyGenerator, ...cacheOptions } = options;
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    // 尝试从缓存获取
    const cached = cacheManager.get(key, cacheOptions.storage);
    if (cached !== null) {
      return cached;
    }

    // 执行函数并缓存结果
    const result = fn(...args);
    
    // 如果是 Promise，缓存 resolved 值
    if (result instanceof Promise) {
      return result.then(value => {
        cacheManager.set(key, value, cacheOptions);
        return value;
      });
    } else {
      cacheManager.set(key, result, cacheOptions);
      return result;
    }
  }) as T;
}

// React Hook for caching
export function useCache<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  options: CacheOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    // 先尝试从缓存获取
    const cached = cacheManager.get<T>(key, options.storage);
    if (cached !== null) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, options);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = React.useCallback(() => {
    cacheManager.delete(key, options.storage);
    fetchData();
  }, [key, fetchData, options.storage]);

  return { data, loading, error, refetch };
}

export default cacheManager;

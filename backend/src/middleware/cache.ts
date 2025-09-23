/**
 * 缓存中间件
 * 提供Redis缓存和内存缓存支持
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 内存缓存存储
const memoryCache = new Map<string, { data: any; expires: number }>();

// 缓存配置
interface CacheConfig {
  ttl?: number; // 缓存时间（秒）
  keyPrefix?: string; // 缓存键前缀
  skipCache?: boolean; // 跳过缓存
  cacheType?: 'memory' | 'redis'; // 缓存类型
}

/**
 * 生成缓存键
 */
function generateCacheKey(c: Context, prefix: string = ''): string {
  const url = c.req.url;
  const method = c.req.method;
  const user = c.get('user');
  const userId = user?.id || 'anonymous';
  
  return `${prefix}:${method}:${url}:${userId}`;
}

/**
 * 内存缓存操作
 */
class MemoryCache {
  static get(key: string): any | null {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.data;
  }

  static set(key: string, data: any, ttl: number): void {
    const expires = Date.now() + (ttl * 1000);
    memoryCache.set(key, { data, expires });
  }

  static delete(key: string): void {
    memoryCache.delete(key);
  }

  static clear(): void {
    memoryCache.clear();
  }

  static size(): number {
    return memoryCache.size;
  }

  // 清理过期缓存
  static cleanup(): void {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (now > item.expires) {
        memoryCache.delete(key);
      }
    }
  }
}

/**
 * Redis缓存操作（模拟实现）
 */
class RedisCache {
  static async get(key: string): Promise<any | null> {
    // 在实际环境中，这里会连接到Redis
    // 目前使用内存缓存模拟
    return MemoryCache.get(key);
  }

  static async set(key: string, data: any, ttl: number): Promise<void> {
    // 在实际环境中，这里会连接到Redis
    // 目前使用内存缓存模拟
    MemoryCache.set(key, data, ttl);
  }

  static async delete(key: string): Promise<void> {
    MemoryCache.delete(key);
  }

  static async clear(): Promise<void> {
    MemoryCache.clear();
  }
}

/**
 * 缓存中间件
 */
export function cache(config: CacheConfig = {}) {
  const {
    ttl = 300, // 默认5分钟
    keyPrefix = 'api',
    skipCache = false,
    cacheType = 'memory'
  } = config;

  return async (c: Context, next: Next) => {
    // 跳过缓存的条件
    if (skipCache || c.req.method !== 'GET') {
      await next();
      return;
    }

    const cacheKey = generateCacheKey(c, keyPrefix);

    try {
      // 尝试从缓存获取数据
      let cachedData: any = null;
      
      if (cacheType === 'redis') {
        cachedData = await RedisCache.get(cacheKey);
      } else {
        cachedData = MemoryCache.get(cacheKey);
      }

      if (cachedData) {
        console.log(`🗄️ 缓存命中: ${cacheKey}`);
        c.header('X-Cache', 'HIT');
        c.header('X-Cache-Key', cacheKey);
        return c.json(cachedData);
      }

      // 缓存未命中，执行请求
      await next();

      // 缓存响应数据
      const response = await c.res.clone();
      if (response.status === 200) {
        try {
          const responseData = await response.json();
          
          if (cacheType === 'redis') {
            await RedisCache.set(cacheKey, responseData, ttl);
          } else {
            MemoryCache.set(cacheKey, responseData, ttl);
          }
          
          console.log(`💾 缓存存储: ${cacheKey} (TTL: ${ttl}s)`);
          c.header('X-Cache', 'MISS');
          c.header('X-Cache-Key', cacheKey);
        } catch (error) {
          console.warn('缓存存储失败:', error);
        }
      }

    } catch (error) {
      console.error('缓存中间件错误:', error);
      // 缓存失败时继续正常处理
      await next();
    }
  };
}

/**
 * 缓存失效中间件
 */
export function invalidateCache(patterns: string[] = []) {
  return async (c: Context, next: Next) => {
    await next();

    // 只在成功的写操作后失效缓存
    if (c.res.status >= 200 && c.res.status < 300 && 
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
      
      try {
        if (patterns.length === 0) {
          // 清空所有缓存
          MemoryCache.clear();
          await RedisCache.clear();
          console.log('🗑️ 清空所有缓存');
        } else {
          // 根据模式失效特定缓存
          for (const pattern of patterns) {
            // 这里可以实现更复杂的模式匹配
            console.log(`🗑️ 失效缓存模式: ${pattern}`);
          }
        }
      } catch (error) {
        console.error('缓存失效失败:', error);
      }
    }
  };
}

/**
 * 预定义的缓存配置
 */
export const cacheConfigs = {
  // 短期缓存 - 1分钟
  short: { ttl: 60, keyPrefix: 'short' },
  
  // 中期缓存 - 5分钟
  medium: { ttl: 300, keyPrefix: 'medium' },
  
  // 长期缓存 - 30分钟
  long: { ttl: 1800, keyPrefix: 'long' },
  
  // 统计数据缓存 - 10分钟
  stats: { ttl: 600, keyPrefix: 'stats' },
  
  // 用户数据缓存 - 5分钟
  user: { ttl: 300, keyPrefix: 'user' },
  
  // 内容缓存 - 15分钟
  content: { ttl: 900, keyPrefix: 'content' }
};

/**
 * 缓存管理工具
 */
export const CacheManager = {
  // 获取缓存统计
  getStats() {
    return {
      memoryCache: {
        size: MemoryCache.size(),
        keys: Array.from(memoryCache.keys())
      }
    };
  },

  // 清理过期缓存
  cleanup() {
    MemoryCache.cleanup();
  },

  // 清空所有缓存
  async clearAll() {
    MemoryCache.clear();
    await RedisCache.clear();
  },

  // 预热缓存
  async warmup(urls: string[]) {
    console.log('🔥 开始缓存预热...');
    for (const url of urls) {
      try {
        // 这里可以实现缓存预热逻辑
        console.log(`预热: ${url}`);
      } catch (error) {
        console.error(`预热失败 ${url}:`, error);
      }
    }
  }
};

// 定期清理过期缓存 - 在Cloudflare Workers中通过定时任务处理
// setInterval(() => {
//   MemoryCache.cleanup();
// }, 60000); // 每分钟清理一次

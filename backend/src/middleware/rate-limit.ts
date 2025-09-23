/**
 * 限流中间件
 * 实现令牌桶算法和滑动窗口限流
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 限流存储
const rateLimitStore = new Map<string, any>();

// 限流配置接口
interface RateLimitConfig {
  windowMs?: number; // 时间窗口（毫秒）
  maxRequests?: number; // 最大请求数
  keyGenerator?: (c: Context) => string; // 键生成器
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean; // 跳过失败请求
  message?: string; // 限流消息
  algorithm?: 'token-bucket' | 'sliding-window' | 'fixed-window'; // 算法类型
}

/**
 * 令牌桶算法实现
 */
class TokenBucket {
  private capacity: number; // 桶容量
  private tokens: number; // 当前令牌数
  private refillRate: number; // 令牌补充速率（每秒）
  private lastRefill: number; // 上次补充时间

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  // 尝试消费令牌
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  // 补充令牌
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  // 获取当前状态
  getStatus() {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      refillRate: this.refillRate
    };
  }
}

/**
 * 滑动窗口算法实现
 */
class SlidingWindow {
  private requests: number[]; // 请求时间戳数组
  private windowMs: number; // 时间窗口
  private maxRequests: number; // 最大请求数

  constructor(windowMs: number, maxRequests: number) {
    this.requests = [];
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  // 检查是否允许请求
  isAllowed(): boolean {
    const now = Date.now();
    
    // 清理过期请求
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  // 获取当前状态
  getStatus() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      resetTime: this.requests.length > 0 ? 
        Math.min(...this.requests) + this.windowMs : now
    };
  }
}

/**
 * 固定窗口算法实现
 */
class FixedWindow {
  private count: number; // 当前计数
  private windowStart: number; // 窗口开始时间
  private windowMs: number; // 时间窗口
  private maxRequests: number; // 最大请求数

  constructor(windowMs: number, maxRequests: number) {
    this.count = 0;
    this.windowStart = Date.now();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  // 检查是否允许请求
  isAllowed(): boolean {
    const now = Date.now();
    
    // 检查是否需要重置窗口
    if (now - this.windowStart >= this.windowMs) {
      this.count = 0;
      this.windowStart = now;
    }
    
    if (this.count < this.maxRequests) {
      this.count++;
      return true;
    }
    
    return false;
  }

  // 获取当前状态
  getStatus() {
    const now = Date.now();
    
    if (now - this.windowStart >= this.windowMs) {
      return {
        currentRequests: 0,
        maxRequests: this.maxRequests,
        windowMs: this.windowMs,
        resetTime: now + this.windowMs
      };
    }
    
    return {
      currentRequests: this.count,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      resetTime: this.windowStart + this.windowMs
    };
  }
}

/**
 * 默认键生成器
 */
function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Forwarded-For') || 
            c.req.header('X-Real-IP') || 
            'unknown';
  const user = c.get('user');
  const userId = user?.id || 'anonymous';
  const path = new URL(c.req.url).pathname;
  
  return `${ip}:${userId}:${path}`;
}

/**
 * 限流中间件
 */
export function rateLimit(config: RateLimitConfig = {}) {
  const {
    windowMs = 60000, // 默认1分钟
    maxRequests = 100, // 默认100请求/分钟
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = '请求过于频繁，请稍后再试',
    algorithm = 'sliding-window'
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    
    // 获取或创建限流器
    let limiter = rateLimitStore.get(key);
    
    if (!limiter) {
      switch (algorithm) {
        case 'token-bucket':
          limiter = new TokenBucket(maxRequests, maxRequests / (windowMs / 1000));
          break;
        case 'fixed-window':
          limiter = new FixedWindow(windowMs, maxRequests);
          break;
        case 'sliding-window':
        default:
          limiter = new SlidingWindow(windowMs, maxRequests);
          break;
      }
      rateLimitStore.set(key, limiter);
    }

    // 检查是否允许请求
    let allowed = false;
    
    if (algorithm === 'token-bucket') {
      allowed = limiter.consume(1);
    } else {
      allowed = limiter.isAllowed();
    }

    if (!allowed) {
      const status = limiter.getStatus();
      
      // 设置限流响应头
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000).toString());
      c.header('Retry-After', Math.ceil((status.resetTime - Date.now()) / 1000).toString());

      console.log(`🚦 限流触发: ${key} (${algorithm})`);
      
      return c.json({
        success: false,
        error: 'Rate Limit Exceeded',
        message,
        retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000)
      }, 429);
    }

    // 执行请求
    await next();

    // 根据配置决定是否计入限流
    const shouldCount = !(
      (skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 400) ||
      (skipFailedRequests && c.res.status >= 400)
    );

    if (shouldCount) {
      const status = limiter.getStatus();
      
      // 设置响应头
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', 
        Math.max(0, status.maxRequests - status.currentRequests).toString());
      c.header('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000).toString());
    }
  };
}

/**
 * 预定义的限流配置
 */
export const rateLimitConfigs = {
  // 严格限流 - 10请求/分钟
  strict: {
    windowMs: 60000,
    maxRequests: 10,
    message: '请求过于频繁，请稍后再试'
  },
  
  // 中等限流 - 60请求/分钟
  moderate: {
    windowMs: 60000,
    maxRequests: 60,
    message: '请求频率过高，请适当降低'
  },
  
  // 宽松限流 - 200请求/分钟
  lenient: {
    windowMs: 60000,
    maxRequests: 200,
    message: '请求量较大，请注意频率'
  },
  
  // API限流 - 1000请求/小时
  api: {
    windowMs: 3600000,
    maxRequests: 1000,
    algorithm: 'token-bucket' as const,
    message: 'API调用次数已达上限'
  },
  
  // 登录限流 - 5次/15分钟
  login: {
    windowMs: 900000,
    maxRequests: 5,
    algorithm: 'fixed-window' as const,
    message: '登录尝试次数过多，请稍后再试'
  }
};

/**
 * 限流管理工具
 */
export const RateLimitManager = {
  // 获取限流统计
  getStats() {
    const stats: any = {};
    
    for (const [key, limiter] of rateLimitStore.entries()) {
      stats[key] = limiter.getStatus();
    }
    
    return {
      totalKeys: rateLimitStore.size,
      limiters: stats
    };
  },

  // 清空特定键的限流
  clearKey(key: string) {
    rateLimitStore.delete(key);
  },

  // 清空所有限流
  clearAll() {
    rateLimitStore.clear();
  },

  // 获取键的状态
  getKeyStatus(key: string) {
    const limiter = rateLimitStore.get(key);
    return limiter ? limiter.getStatus() : null;
  }
};

// 定期清理过期的限流器 - 在Cloudflare Workers中通过定时任务处理
// setInterval(() => {
//   const now = Date.now();
//   for (const [key, limiter] of rateLimitStore.entries()) {
//     const status = limiter.getStatus();
//
//     // 如果限流器长时间未使用，则删除
//     if (status.resetTime && now - status.resetTime > 300000) { // 5分钟
//       rateLimitStore.delete(key);
//     }
//   }
// }, 300000); // 每5分钟清理一次

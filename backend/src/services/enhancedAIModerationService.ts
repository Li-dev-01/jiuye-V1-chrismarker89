/**
 * 增强的 AI 审核服务
 * 集成缓存、速率限制、提示词管理和告警功能
 */

import { aiGatewayConfigManager, AIGatewayConfig } from './aiGatewayConfigService';

export interface AIAnalysisRequest {
  content: string;
  contentType: 'story' | 'comment' | 'review' | 'questionnaire';
  userId?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

export interface AIAnalysisResult {
  riskScore: number;
  confidence: number;
  recommendation: 'approve' | 'review' | 'reject';
  details: {
    classification?: any;
    sentiment?: any;
    safety?: any;
    semantic?: any;
  };
  processingTime: number;
  modelVersions: {
    classification: string;
    sentiment: string;
    safety: string;
  };
  cached?: boolean;
  cacheKey?: string;
}

/**
 * 缓存管理器
 */
class AICacheManager {
  private cache = new Map<string, { data: AIAnalysisResult; expires: number; hits: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  /**
   * 生成缓存键
   */
  async generateKey(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 获取缓存
   */
  async get(content: string, config: AIGatewayConfig): Promise<AIAnalysisResult | null> {
    if (!config.cache.enabled) return null;

    const key = await this.generateKey(content);
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      this.stats.hits++;
      console.log(`✅ 缓存命中: ${key.substring(0, 8)}... (命中${cached.hits}次)`);
      return { ...cached.data, cached: true, cacheKey: key };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * 设置缓存
   */
  async set(content: string, result: AIAnalysisResult, config: AIGatewayConfig): Promise<void> {
    if (!config.cache.enabled) return;
    if (result.confidence < config.cache.confidenceThreshold) {
      console.log(`⚠️ 置信度过低，不缓存: ${result.confidence}`);
      return;
    }

    // 检查排除模式
    for (const pattern of config.cache.excludePatterns) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`⚠️ 匹配排除模式，不缓存: ${pattern}`);
        return;
      }
    }

    const key = await this.generateKey(content);

    // LRU 策略：如果缓存满了，删除最少使用的
    if (this.cache.size >= config.cache.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: result,
      expires: Date.now() + config.cache.ttl * 1000,
      hits: 0
    });

    console.log(`💾 缓存存储: ${key.substring(0, 8)}... (TTL: ${config.cache.ttl}s)`);
  }

  /**
   * LRU 驱逐策略
   */
  private evictLRU(): void {
    let minHits = Infinity;
    let evictKey: string | null = null;

    for (const [key, value] of this.cache.entries()) {
      if (value.hits < minHits) {
        minHits = value.hits;
        evictKey = key;
      }
    }

    if (evictKey) {
      this.cache.delete(evictKey);
      this.stats.evictions++;
      console.log(`🗑️ 缓存驱逐: ${evictKey.substring(0, 8)}... (命中${minHits}次)`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ 缓存已清空');
  }
}

/**
 * 速率限制器
 */
class AIRateLimiter {
  private requests = {
    perMinute: new Map<string, number[]>(),
    perHour: new Map<string, number[]>(),
    perDay: new Map<string, number[]>()
  };
  private costs = new Map<string, number>(); // 每日成本追踪

  /**
   * 检查速率限制
   */
  checkLimit(userId: string, config: AIGatewayConfig): { allowed: boolean; reason?: string } {
    if (!config.rateLimit.enabled) return { allowed: true };

    const now = Date.now();

    // 检查每分钟限制
    const minuteRequests = this.getRequests(userId, 'perMinute', now, 60 * 1000);
    if (minuteRequests.length >= config.rateLimit.perMinute) {
      return { allowed: false, reason: `超过每分钟限制 (${config.rateLimit.perMinute})` };
    }

    // 检查每小时限制
    const hourRequests = this.getRequests(userId, 'perHour', now, 60 * 60 * 1000);
    if (hourRequests.length >= config.rateLimit.perHour) {
      return { allowed: false, reason: `超过每小时限制 (${config.rateLimit.perHour})` };
    }

    // 检查每天限制
    const dayRequests = this.getRequests(userId, 'perDay', now, 24 * 60 * 60 * 1000);
    if (dayRequests.length >= config.rateLimit.perDay) {
      return { allowed: false, reason: `超过每天限制 (${config.rateLimit.perDay})` };
    }

    // 检查成本预算
    const dailyCost = this.costs.get(userId) || 0;
    if (dailyCost >= config.rateLimit.costBudget) {
      return { allowed: false, reason: `超过每日成本预算 ($${config.rateLimit.costBudget})` };
    }

    return { allowed: true };
  }

  /**
   * 记录请求
   */
  recordRequest(userId: string, cost: number = 0.00001): void {
    const now = Date.now();

    // 记录到各个时间窗口
    this.addRequest(userId, 'perMinute', now);
    this.addRequest(userId, 'perHour', now);
    this.addRequest(userId, 'perDay', now);

    // 记录成本
    const currentCost = this.costs.get(userId) || 0;
    this.costs.set(userId, currentCost + cost);
  }

  /**
   * 获取时间窗口内的请求
   */
  private getRequests(userId: string, window: 'perMinute' | 'perHour' | 'perDay', now: number, windowMs: number): number[] {
    const requests = this.requests[window].get(userId) || [];
    const validRequests = requests.filter(time => now - time < windowMs);
    this.requests[window].set(userId, validRequests);
    return validRequests;
  }

  /**
   * 添加请求记录
   */
  private addRequest(userId: string, window: 'perMinute' | 'perHour' | 'perDay', timestamp: number): void {
    const requests = this.requests[window].get(userId) || [];
    requests.push(timestamp);
    this.requests[window].set(userId, requests);
  }

  /**
   * 获取统计信息
   */
  getStats(userId: string): any {
    const now = Date.now();
    return {
      perMinute: this.getRequests(userId, 'perMinute', now, 60 * 1000).length,
      perHour: this.getRequests(userId, 'perHour', now, 60 * 60 * 1000).length,
      perDay: this.getRequests(userId, 'perDay', now, 24 * 60 * 60 * 1000).length,
      dailyCost: this.costs.get(userId) || 0
    };
  }
}

/**
 * 告警管理器
 */
class AIAlertManager {
  private alerts: Array<{
    timestamp: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    data?: any;
  }> = [];

  /**
   * 发送告警
   */
  async sendAlert(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    data?: any,
    config?: AIGatewayConfig
  ): Promise<void> {
    const alert = {
      timestamp: Date.now(),
      type,
      severity,
      message,
      data
    };

    this.alerts.push(alert);

    // 保留最近100条告警
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`🚨 [${severity.toUpperCase()}] ${type}: ${message}`);

    // 发送到配置的渠道
    if (config?.alerts.enabled) {
      if (config.alerts.channels.webhook && config.alerts.contacts.webhookUrl) {
        await this.sendWebhook(config.alerts.contacts.webhookUrl, alert);
      }
    }
  }

  /**
   * 发送 Webhook
   */
  private async sendWebhook(url: string, alert: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Webhook发送失败:', error);
    }
  }

  /**
   * 获取告警历史
   */
  getAlerts(limit: number = 20): any[] {
    return this.alerts.slice(-limit);
  }
}

/**
 * 增强的 AI 审核服务
 */
export class EnhancedAIModerationService {
  private cacheManager = new AICacheManager();
  private rateLimiter = new AIRateLimiter();
  private alertManager = new AIAlertManager();

  /**
   * 分析内容
   */
  async analyze(
    request: AIAnalysisRequest,
    ai: any
  ): Promise<AIAnalysisResult> {
    const config = aiGatewayConfigManager.getConfig();
    const userId = request.userId || 'anonymous';
    const startTime = Date.now();

    try {
      // 1. 检查速率限制
      const rateLimitCheck = this.rateLimiter.checkLimit(userId, config);
      if (!rateLimitCheck.allowed) {
        await this.alertManager.sendAlert(
          'rate_limit_exceeded',
          'medium',
          `用户 ${userId} 超过速率限制: ${rateLimitCheck.reason}`,
          { userId, reason: rateLimitCheck.reason },
          config
        );
        throw new Error(rateLimitCheck.reason);
      }

      // 2. 检查缓存
      const cached = await this.cacheManager.get(request.content, config);
      if (cached) {
        return cached;
      }

      // 3. 执行 AI 分析
      const result = await this.performAnalysis(request, ai, config);

      // 4. 缓存结果
      await this.cacheManager.set(request.content, result, config);

      // 5. 记录请求
      this.rateLimiter.recordRequest(userId);

      // 6. 检查性能告警
      const processingTime = Date.now() - startTime;
      if (config.alerts.rules.slowResponse.enabled && 
          processingTime > config.alerts.rules.slowResponse.threshold) {
        await this.alertManager.sendAlert(
          'slow_response',
          'medium',
          `AI分析响应时间过长: ${processingTime}ms`,
          { processingTime, threshold: config.alerts.rules.slowResponse.threshold },
          config
        );
      }

      return result;

    } catch (error) {
      await this.alertManager.sendAlert(
        'analysis_error',
        'high',
        `AI分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error, request },
        config
      );
      throw error;
    }
  }

  /**
   * 执行实际的 AI 分析
   */
  private async performAnalysis(
    request: AIAnalysisRequest,
    ai: any,
    config: AIGatewayConfig
  ): Promise<AIAnalysisResult> {
    // 这里实现实际的 AI 调用逻辑
    // 暂时返回模拟数据
    return {
      riskScore: Math.random() * 0.8,
      confidence: 0.85 + Math.random() * 0.15,
      recommendation: Math.random() > 0.7 ? 'approve' : 'review',
      details: {
        classification: { label: 'NEUTRAL', score: 0.85 },
        sentiment: { sentiment: 'neutral', confidence: 0.78 },
        safety: { status: 'safe', confidence: 0.92 }
      },
      processingTime: Math.floor(200 + Math.random() * 300),
      modelVersions: {
        classification: '@cf/huggingface/distilbert-sst-2-int8',
        sentiment: '@cf/meta/llama-3-8b-instruct',
        safety: '@cf/meta/llama-guard-3-8b'
      }
    };
  }

  /**
   * 获取服务统计
   */
  getStats(userId?: string): any {
    return {
      cache: this.cacheManager.getStats(),
      rateLimit: userId ? this.rateLimiter.getStats(userId) : null,
      alerts: this.alertManager.getAlerts(10)
    };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cacheManager.clear();
  }
}

/**
 * 全局服务实例
 */
export const enhancedAIModerationService = new EnhancedAIModerationService();


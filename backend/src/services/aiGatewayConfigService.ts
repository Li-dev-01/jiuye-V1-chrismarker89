/**
 * AI Gateway 配置管理服务
 * 管理缓存策略、速率限制、提示词和告警配置
 */

export interface AIGatewayConfig {
  // 缓存配置
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）
    maxSize: number; // 最大缓存条目数
    strategy: 'lru' | 'lfu' | 'fifo'; // 缓存策略
    confidenceThreshold: number; // 只缓存高置信度结果
    excludePatterns: string[]; // 不缓存的内容模式
  };

  // 速率限制配置
  rateLimit: {
    enabled: boolean;
    perMinute: number; // 每分钟请求数
    perHour: number; // 每小时请求数
    perDay: number; // 每天请求数
    burstSize: number; // 突发请求大小
    costBudget: number; // 每日成本预算（美元）
    alertThreshold: number; // 告警阈值（百分比）
  };

  // 提示词管理
  prompts: {
    enabled: boolean;
    version: string;
    templates: {
      sentimentAnalysis: string;
      contentSafety: string;
      employmentClassification: string;
      riskAssessment: string;
    };
    optimization: {
      autoOptimize: boolean; // 自动优化提示词
      abTesting: boolean; // A/B 测试
      performanceTracking: boolean; // 性能追踪
    };
  };

  // 告警配置
  alerts: {
    enabled: boolean;
    channels: {
      email: boolean;
      webhook: boolean;
      dashboard: boolean;
    };
    rules: {
      highErrorRate: { enabled: boolean; threshold: number }; // 错误率告警
      slowResponse: { enabled: boolean; threshold: number }; // 响应慢告警
      costOverrun: { enabled: boolean; threshold: number }; // 成本超支告警
      quotaExceeded: { enabled: boolean; threshold: number }; // 配额超限告警
      anomalyDetection: { enabled: boolean; sensitivity: number }; // 异常检测
    };
    contacts: {
      email?: string;
      webhookUrl?: string;
    };
  };

  // 性能优化
  performance: {
    parallelRequests: boolean; // 并行请求
    requestBatching: boolean; // 请求批处理
    modelFallback: boolean; // 模型降级
    timeoutMs: number; // 超时时间
    retryAttempts: number; // 重试次数
    retryDelayMs: number; // 重试延迟
  };

  // 监控配置
  monitoring: {
    enabled: boolean;
    metrics: {
      requestCount: boolean;
      responseTime: boolean;
      errorRate: boolean;
      cacheHitRate: boolean;
      costTracking: boolean;
      modelPerformance: boolean;
    };
    sampling: {
      enabled: boolean;
      rate: number; // 采样率（0-1）
    };
  };
}

/**
 * 默认配置
 */
export const DEFAULT_AI_GATEWAY_CONFIG: AIGatewayConfig = {
  cache: {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 10000,
    strategy: 'lru',
    confidenceThreshold: 0.7,
    excludePatterns: ['test', 'debug', 'sample']
  },

  rateLimit: {
    enabled: true,
    perMinute: 100,
    perHour: 1000,
    perDay: 10000,
    burstSize: 20,
    costBudget: 1.0, // $1/天
    alertThreshold: 80 // 80%时告警
  },

  prompts: {
    enabled: true,
    version: '1.0.0',
    templates: {
      sentimentAnalysis: `分析以下就业相关内容的情感倾向和潜在风险。

内容: {content}

请返回JSON格式：
{
  "sentiment": "positive/negative/neutral",
  "risk_level": "low/medium/high",
  "confidence": 0.0-1.0,
  "reasoning": "简短说明"
}`,

      contentSafety: `检测以下内容是否包含不当信息（政治敏感、色情、暴力、歧视等）。

内容: {content}

返回: safe/unsafe`,

      employmentClassification: `对以下就业相关内容进行分类。

内容: {content}

分类: 工作经历/求职经验/职场建议/薪资福利/公司评价/其他`,

      riskAssessment: `评估以下内容的风险等级。

内容: {content}
类型: {contentType}

考虑因素：
1. 内容真实性
2. 是否包含敏感信息
3. 是否存在误导性
4. 语言规范性

返回JSON：
{
  "risk_score": 0.0-1.0,
  "risk_factors": ["因素1", "因素2"],
  "recommendation": "approve/review/reject"
}`
    },
    optimization: {
      autoOptimize: false,
      abTesting: false,
      performanceTracking: true
    }
  },

  alerts: {
    enabled: true,
    channels: {
      email: false,
      webhook: true,
      dashboard: true
    },
    rules: {
      highErrorRate: { enabled: true, threshold: 5 }, // 5%错误率
      slowResponse: { enabled: true, threshold: 2000 }, // 2秒
      costOverrun: { enabled: true, threshold: 80 }, // 80%预算
      quotaExceeded: { enabled: true, threshold: 90 }, // 90%配额
      anomalyDetection: { enabled: true, sensitivity: 0.8 }
    },
    contacts: {
      webhookUrl: undefined,
      email: undefined
    }
  },

  performance: {
    parallelRequests: true,
    requestBatching: false,
    modelFallback: true,
    timeoutMs: 5000,
    retryAttempts: 2,
    retryDelayMs: 1000
  },

  monitoring: {
    enabled: true,
    metrics: {
      requestCount: true,
      responseTime: true,
      errorRate: true,
      cacheHitRate: true,
      costTracking: true,
      modelPerformance: true
    },
    sampling: {
      enabled: false,
      rate: 0.1 // 10%采样
    }
  }
};

/**
 * AI Gateway 配置管理器
 */
export class AIGatewayConfigManager {
  private config: AIGatewayConfig;
  private configHistory: Array<{
    timestamp: number;
    config: AIGatewayConfig;
    operator: string;
  }> = [];

  constructor(initialConfig?: Partial<AIGatewayConfig>) {
    this.config = {
      ...DEFAULT_AI_GATEWAY_CONFIG,
      ...initialConfig
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIGatewayConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AIGatewayConfig>, operator: string = 'system'): void {
    // 记录配置历史
    this.configHistory.push({
      timestamp: Date.now(),
      config: { ...this.config },
      operator
    });

    // 保留最近50条历史
    if (this.configHistory.length > 50) {
      this.configHistory = this.configHistory.slice(-50);
    }

    // 深度合并配置
    this.config = this.deepMerge(this.config, newConfig);

    console.log(`🔧 AI Gateway配置已更新 by ${operator}`);
  }

  /**
   * 获取配置历史
   */
  getConfigHistory(limit: number = 10): Array<any> {
    return this.configHistory.slice(-limit);
  }

  /**
   * 验证配置
   */
  validateConfig(config: Partial<AIGatewayConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证缓存配置
    if (config.cache) {
      if (config.cache.ttl && config.cache.ttl < 0) {
        errors.push('缓存TTL不能为负数');
      }
      if (config.cache.maxSize && config.cache.maxSize < 1) {
        errors.push('缓存大小必须大于0');
      }
      if (config.cache.confidenceThreshold && 
          (config.cache.confidenceThreshold < 0 || config.cache.confidenceThreshold > 1)) {
        errors.push('置信度阈值必须在0-1之间');
      }
    }

    // 验证速率限制
    if (config.rateLimit) {
      if (config.rateLimit.perMinute && config.rateLimit.perMinute < 1) {
        errors.push('每分钟请求数必须大于0');
      }
      if (config.rateLimit.costBudget && config.rateLimit.costBudget < 0) {
        errors.push('成本预算不能为负数');
      }
    }

    // 验证性能配置
    if (config.performance) {
      if (config.performance.timeoutMs && config.performance.timeoutMs < 100) {
        errors.push('超时时间不能小于100ms');
      }
      if (config.performance.retryAttempts && config.performance.retryAttempts < 0) {
        errors.push('重试次数不能为负数');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * 全局配置管理器实例
 */
export const aiGatewayConfigManager = new AIGatewayConfigManager();


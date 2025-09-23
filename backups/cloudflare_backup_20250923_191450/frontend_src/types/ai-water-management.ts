/**
 * AI水源管理系统类型定义
 * 
 * 定义AI服务管理相关的接口、类型和枚举
 */

// AI水源状态
export enum AISourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

// AI水源类型
export enum AISourceType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary', 
  BACKUP = 'backup'
}

// AI服务提供商
export enum AIProvider {
  OPENAI = 'openai',
  GROK = 'grok',
  GEMINI = 'gemini',
  CLAUDE = 'claude',
  DEEPSEEK = 'deepseek',
  OPENROUTER = 'openrouter',
  TOGETHER = 'together',
  GROQ = 'groq',
  PERPLEXITY = 'perplexity',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  HUGGINGFACE = 'huggingface'
}

// 负载均衡策略
export enum LoadBalanceStrategy {
  QUALITY_FIRST = 'quality_first',
  COST_FIRST = 'cost_first',
  BALANCED = 'balanced',
  ROUND_ROBIN = 'round_robin'
}

// 审核内容类型
export enum ReviewContentType {
  QUESTIONNAIRE = 'questionnaire',
  STORY = 'story',
  VOICE = 'voice'
}

// AI水源配置
export interface AISourceConfig {
  id: string;
  name: string;
  type: AISourceType;
  provider: AIProvider;
  status: AISourceStatus;
  config: {
    apiKey: string;
    endpoint: string;
    model: string;
    thinkingModel?: string;
    maxConcurrent: number;
    rateLimit: number;
    costPerToken: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  features: {
    streaming: boolean;
    functionCalling: boolean;
    imageGeneration: boolean;
    codeExecution: boolean;
    multimodal: boolean;
  };
  limits: {
    maxTokensPerRequest: number;
    maxRequestsPerMinute: number;
    maxTokensPerMinute: number;
    maxRequestsPerDay: number;
  };
}

// AI水源健康状态
export interface AISourceHealth {
  lastCheck: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  uptime: number;
  totalChecks: number;
  healthyChecks: number;
  issues?: string[];
}

// AI水源使用统计
export interface AISourceUsage {
  requestsToday: number;
  tokensUsed: number;
  costToday: number;
  lastUsed: string;
  monthlyRequests: number;
  monthlyTokens: number;
  monthlyCost: number;
}

// 完整的AI水源信息
export interface AISource {
  id: string;
  name: string;
  type: AISourceType;
  provider: AIProvider;
  status: AISourceStatus;
  config: AISourceConfig['config'];
  features: AISourceConfig['features'];
  limits: AISourceConfig['limits'];
  health: AISourceHealth;
  usage: AISourceUsage;
  createdAt: string;
  updatedAt: string;
}

// 负载均衡配置
export interface LoadBalancerConfig {
  globalEnabled: boolean;
  defaultProvider: AIProvider;
  failoverEnabled: boolean;
  loadBalanceMode: LoadBalanceStrategy;
  providerPercentages: Record<AIProvider, number>;
  healthCheckInterval: number;
  maxRetries: number;
  timeoutSeconds: number;
  batchSize: number;
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
  rateLimiting: {
    enabled: boolean;
    globalLimit: number;
    perProviderLimit: number;
    windowMs: number;
  };
}

// 成本控制配置
export interface CostControlConfig {
  dailyBudget: number;
  monthlyBudget: number;
  alertThresholds: {
    daily: number;
    monthly: number;
  };
  costOptimization: {
    enabled: boolean;
    autoSwitchToLowerCost: boolean;
    costThresholdMultiplier: number;
    qualityMinimumThreshold: number;
  };
  billing: {
    currency: string;
    trackingEnabled: boolean;
    reportingInterval: string;
    costBreakdownByTerminal: boolean;
  };
}

// 终端分配配置
export interface TerminalAllocation {
  terminalId: string;
  terminalName: string;
  terminalType: ReviewContentType;
  primarySource: AIProvider;
  backupSources: AIProvider[];
  qualityRequirement: 'low' | 'medium' | 'high' | 'premium';
  costPriority: LoadBalanceStrategy;
  maxCostPerRequest: number;
  enabled: boolean;
  allocation: {
    strategy: LoadBalanceStrategy;
    fallbackChain: AIProvider[];
    healthCheckInterval: number;
    maxRetries: number;
    timeoutSeconds: number;
  };
}

// AI请求参数
export interface AIRequest {
  prompt: string;
  contentType: ReviewContentType;
  contentId: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stream?: boolean;
  };
  metadata?: Record<string, any>;
}

// AI响应结果
export interface AIResponse {
  success: boolean;
  data?: {
    content: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    model: string;
    provider: AIProvider;
    responseTime: number;
    cost: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    sourceId: string;
  };
}

// AI审核分析结果
export interface AIReviewAnalysis {
  contentId: string;
  contentType: ReviewContentType;
  analysis: {
    qualityScore: number;        // 内容质量评分 0-100
    sentimentScore: number;      // 情感分析评分 -1到1
    toxicityScore: number;       // 有害内容评分 0-1
    relevanceScore: number;      // 相关性评分 0-1
    readabilityScore: number;    // 可读性评分 0-100
  };
  flags: {
    hasSensitiveContent: boolean;
    hasPersonalInfo: boolean;
    hasInappropriateLanguage: boolean;
    hasSpam: boolean;
    hasOffTopic: boolean;
  };
  suggestions: {
    recommendation: 'approve' | 'reject' | 'review_required';
    confidence: number;          // 置信度 0-1
    reasons: string[];
    improvements?: string[];
  };
  metadata: {
    aiSource: AIProvider;
    model: string;
    analysisTime: number;
    cost: number;
    timestamp: string;
  };
}

// 系统监控指标
export interface SystemMetrics {
  overview: {
    totalSources: number;
    activeSources: number;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    systemHealth: number;
  };
  sources: Record<string, {
    status: AISourceStatus;
    health: number;
    requestCount: number;
    cost: number;
    responseTime: number;
    errorRate: number;
  }>;
  performance: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    costPerMinute: number;
    errorRate: number;
    uptime: number;
  };
  costs: {
    today: number;
    thisMonth: number;
    budgetUtilization: {
      daily: number;
      monthly: number;
    };
    breakdown: Record<AIProvider, number>;
  };
}

// API响应包装器
export interface AIWaterManagementResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// 事件类型
export interface AIWaterManagementEvent {
  type: 'source_status_change' | 'failover' | 'cost_alert' | 'health_alert' | 'performance_alert';
  sourceId?: string;
  data: any;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * AI内容审核Worker
 * 基于Cloudflare Workers AI的智能内容审核服务
 */

export interface Env {
  AI: any;
  DB: D1Database;
  AI_MODERATION_CONFIG: KVNamespace;
}

interface AIAnalysisRequest {
  content: string;
  contentType: 'story' | 'comment' | 'review';
  userId?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

interface AIAnalysisResult {
  riskScore: number;
  confidence: number;
  recommendation: 'approve' | 'review' | 'reject';
  details: {
    classification: any;
    sentiment: any;
    safety: any;
    semantic?: any;
  };
  processingTime: number;
  modelVersions: {
    classification: string;
    sentiment: string;
    safety: string;
  };
}

interface ModerationConfig {
  enabled: boolean;
  models: {
    textClassification: string;
    contentSafety: string;
    sentimentAnalysis: string;
    semanticAnalysis?: string;
  };
  thresholds: {
    autoApprove: number;
    humanReview: number;
    autoReject: number;
  };
  features: {
    parallelAnalysis: boolean;
    semanticAnalysis: boolean;
    caching: boolean;
    batchProcessing: boolean;
  };
}

const DEFAULT_CONFIG: ModerationConfig = {
  enabled: true,
  models: {
    textClassification: '@cf/huggingface/distilbert-sst-2-int8',
    contentSafety: '@cf/meta/llama-guard-3-8b',
    sentimentAnalysis: '@cf/meta/llama-3-8b-instruct',
    semanticAnalysis: '@cf/baai/bge-base-en-v1.5'
  },
  thresholds: {
    autoApprove: 0.2,
    humanReview: 0.5,
    autoReject: 0.8
  },
  features: {
    parallelAnalysis: true,
    semanticAnalysis: true,
    caching: true,
    batchProcessing: false
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 路由处理
      switch (path) {
        case '/analyze':
          return await handleAnalyze(request, env);
        case '/config':
          return await handleConfig(request, env);
        case '/batch':
          return await handleBatch(request, env);
        case '/health':
          return await handleHealth(request, env);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('AI Moderator Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 处理内容分析请求
 */
async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const startTime = Date.now();
  const analysisRequest: AIAnalysisRequest = await request.json();
  
  // 获取配置
  const config = await getConfig(env);
  
  if (!config.enabled) {
    return new Response(JSON.stringify({
      success: false,
      error: 'AI moderation disabled',
      fallback: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 检查缓存
  const cacheKey = await generateCacheKey(analysisRequest.content);
  if (config.features.caching) {
    const cached = await getCachedResult(env, cacheKey);
    if (cached) {
      return new Response(JSON.stringify({
        success: true,
        data: cached,
        cached: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 执行AI分析
  const result = await performAIAnalysis(analysisRequest, config, env);
  
  // 缓存结果
  if (config.features.caching && result.confidence > 0.7) {
    await cacheResult(env, cacheKey, result);
  }

  // 记录分析日志
  await logAnalysis(env, analysisRequest, result);

  return new Response(JSON.stringify({
    success: true,
    data: result
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 执行AI分析
 */
async function performAIAnalysis(
  request: AIAnalysisRequest, 
  config: ModerationConfig, 
  env: Env
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    let analysisPromises: Promise<any>[] = [];
    
    if (config.features.parallelAnalysis) {
      // 并行分析
      analysisPromises = [
        // 文本分类
        env.AI.run(config.models.textClassification, {
          text: request.content
        }).catch(e => ({ error: e.message, model: 'classification' })),
        
        // 情感分析
        env.AI.run(config.models.sentimentAnalysis, {
          messages: [
            { 
              role: "system", 
              content: "分析以下文本的情感倾向和潜在风险，返回JSON格式：{\"sentiment\": \"positive/negative/neutral\", \"risk_level\": \"low/medium/high\", \"confidence\": 0.0-1.0}" 
            },
            { role: "user", content: request.content }
          ]
        }).catch(e => ({ error: e.message, model: 'sentiment' })),
        
        // 内容安全检测
        env.AI.run(config.models.contentSafety, {
          messages: [
            { role: "user", content: request.content }
          ]
        }).catch(e => ({ error: e.message, model: 'safety' }))
      ];

      // 语义分析（可选）
      if (config.features.semanticAnalysis && config.models.semanticAnalysis) {
        analysisPromises.push(
          env.AI.run(config.models.semanticAnalysis, {
            text: request.content
          }).catch(e => ({ error: e.message, model: 'semantic' }))
        );
      }
    }

    const [classificationResult, sentimentResult, safetyResult, semanticResult] = 
      await Promise.all(analysisPromises);

    // 计算风险分数
    const riskScore = calculateRiskScore({
      classification: classificationResult,
      sentiment: sentimentResult,
      safety: safetyResult,
      semantic: semanticResult
    }, config);

    // 生成推荐
    const recommendation = getRiskRecommendation(riskScore, config.thresholds);
    
    // 计算置信度
    const confidence = calculateConfidence([
      classificationResult,
      sentimentResult,
      safetyResult,
      semanticResult
    ]);

    const processingTime = Date.now() - startTime;

    return {
      riskScore,
      confidence,
      recommendation,
      details: {
        classification: classificationResult,
        sentiment: sentimentResult,
        safety: safetyResult,
        semantic: semanticResult
      },
      processingTime,
      modelVersions: {
        classification: config.models.textClassification,
        sentiment: config.models.sentimentAnalysis,
        safety: config.models.contentSafety
      }
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // 降级处理
    return {
      riskScore: 0.5, // 中等风险，触发人工审核
      confidence: 0.1,
      recommendation: 'review',
      details: {
        classification: { error: 'AI analysis failed' },
        sentiment: { error: 'AI analysis failed' },
        safety: { error: 'AI analysis failed' }
      },
      processingTime: Date.now() - startTime,
      modelVersions: {
        classification: 'error',
        sentiment: 'error',
        safety: 'error'
      }
    };
  }
}

/**
 * 计算风险分数
 */
function calculateRiskScore(results: any, config: ModerationConfig): number {
  const weights = {
    safety: 0.4,      // 安全检测权重最高
    sentiment: 0.3,   // 情感分析
    classification: 0.2, // 内容分类
    semantic: 0.1     // 语义相似度
  };

  let score = 0;
  let totalWeight = 0;

  // 安全检测评分
  if (results.safety && !results.safety.error) {
    const safetyScore = extractSafetyScore(results.safety);
    score += weights.safety * safetyScore;
    totalWeight += weights.safety;
  }

  // 情感分析评分
  if (results.sentiment && !results.sentiment.error) {
    const sentimentScore = extractSentimentScore(results.sentiment);
    score += weights.sentiment * sentimentScore;
    totalWeight += weights.sentiment;
  }

  // 分类评分
  if (results.classification && !results.classification.error) {
    const classificationScore = extractClassificationScore(results.classification);
    score += weights.classification * classificationScore;
    totalWeight += weights.classification;
  }

  // 语义评分
  if (results.semantic && !results.semantic.error) {
    const semanticScore = extractSemanticScore(results.semantic);
    score += weights.semantic * semanticScore;
    totalWeight += weights.semantic;
  }

  // 归一化分数
  return totalWeight > 0 ? Math.min(score / totalWeight, 1.0) : 0.5;
}

/**
 * 提取安全检测分数
 */
function extractSafetyScore(safetyResult: any): number {
  // Llama Guard 返回格式解析
  if (typeof safetyResult.response === 'string') {
    const response = safetyResult.response.toLowerCase();
    if (response.includes('unsafe') || response.includes('violation')) {
      return 0.9; // 高风险
    }
    if (response.includes('safe')) {
      return 0.1; // 低风险
    }
  }
  return 0.5; // 中等风险
}

/**
 * 提取情感分析分数
 */
function extractSentimentScore(sentimentResult: any): number {
  try {
    const response = sentimentResult.response || sentimentResult;
    if (typeof response === 'string') {
      const parsed = JSON.parse(response);
      if (parsed.risk_level === 'high') return 0.8;
      if (parsed.risk_level === 'medium') return 0.5;
      if (parsed.risk_level === 'low') return 0.2;
      
      // 基于情感的简单评分
      if (parsed.sentiment === 'negative') return 0.6;
      if (parsed.sentiment === 'positive') return 0.2;
    }
  } catch (e) {
    console.warn('Failed to parse sentiment result:', e);
  }
  return 0.3; // 默认低风险
}

/**
 * 提取分类分数
 */
function extractClassificationScore(classificationResult: any): number {
  // DistilBERT SST-2 结果解析
  if (classificationResult.label === 'NEGATIVE') {
    return Math.min(classificationResult.score * 0.8, 0.8);
  }
  return 0.2;
}

/**
 * 提取语义分数
 */
function extractSemanticScore(semanticResult: any): number {
  // BGE embedding 结果处理
  // 这里可以与已知的违规内容向量进行相似度比较
  return 0.3; // 简化实现
}

/**
 * 计算置信度
 */
function calculateConfidence(results: any[]): number {
  const validResults = results.filter(r => r && !r.error);
  const successRate = validResults.length / results.length;
  
  // 基于成功率和结果一致性计算置信度
  return Math.max(successRate * 0.8, 0.1);
}

/**
 * 获取风险推荐
 */
function getRiskRecommendation(
  riskScore: number, 
  thresholds: ModerationConfig['thresholds']
): 'approve' | 'review' | 'reject' {
  if (riskScore <= thresholds.autoApprove) {
    return 'approve';
  } else if (riskScore >= thresholds.autoReject) {
    return 'reject';
  } else {
    return 'review';
  }
}

/**
 * 获取配置
 */
async function getConfig(env: Env): Promise<ModerationConfig> {
  try {
    const configStr = await env.AI_MODERATION_CONFIG.get('config');
    if (configStr) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(configStr) };
    }
  } catch (e) {
    console.warn('Failed to load config, using default:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * 生成缓存键
 */
async function generateCacheKey(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 获取缓存结果
 */
async function getCachedResult(env: Env, cacheKey: string): Promise<AIAnalysisResult | null> {
  try {
    const cached = await env.AI_MODERATION_CONFIG.get(`cache:${cacheKey}`);
    if (cached) {
      const result = JSON.parse(cached);
      // 检查缓存是否过期（24小时）
      if (Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
        return result.data;
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

/**
 * 缓存结果
 */
async function cacheResult(env: Env, cacheKey: string, result: AIAnalysisResult): Promise<void> {
  try {
    await env.AI_MODERATION_CONFIG.put(`cache:${cacheKey}`, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }), {
      expirationTtl: 24 * 60 * 60 // 24小时过期
    });
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

/**
 * 记录分析日志
 */
async function logAnalysis(
  env: Env, 
  request: AIAnalysisRequest, 
  result: AIAnalysisResult
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO ai_moderation_logs (
        content_hash, content_type, user_id, risk_score, 
        recommendation, confidence, processing_time, 
        model_versions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      await generateCacheKey(request.content),
      request.contentType,
      request.userId || 'anonymous',
      result.riskScore,
      result.recommendation,
      result.confidence,
      result.processingTime,
      JSON.stringify(result.modelVersions),
      new Date().toISOString()
    ).run();
  } catch (e) {
    console.warn('Failed to log analysis:', e);
  }
}

/**
 * 处理配置请求
 */
async function handleConfig(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const config = await getConfig(env);
    return new Response(JSON.stringify({
      success: true,
      data: config
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'POST') {
    const newConfig = await request.json();
    await env.AI_MODERATION_CONFIG.put('config', JSON.stringify(newConfig));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Configuration updated'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

/**
 * 处理批量分析请求
 */
async function handleBatch(request: Request, env: Env): Promise<Response> {
  // 批量处理实现
  return new Response(JSON.stringify({
    success: false,
    message: 'Batch processing not implemented yet'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 健康检查
 */
async function handleHealth(request: Request, env: Env): Promise<Response> {
  return new Response(JSON.stringify({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

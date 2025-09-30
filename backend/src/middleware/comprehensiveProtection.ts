/**
 * 综合防护中间件
 * 集成Turnstile验证 + IP时效限制 + 行为分析
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';
import { TurnstileService, TurnstileAnalyzer } from '../services/turnstileService';

// IP时效限制配置
interface TimeBasedLimitConfig {
  shortTerm: { window: number; limit: number };    // 短期限制
  mediumTerm: { window: number; limit: number };   // 中期限制  
  longTerm: { window: number; limit: number };     // 长期限制
  suspiciousMultiplier: number;                    // 可疑IP限制倍数
  trustedMultiplier: number;                       // 可信IP限制倍数
}

// 请求类型配置
const REQUEST_TYPE_CONFIGS: Record<string, TimeBasedLimitConfig> = {
  questionnaire: {
    shortTerm: { window: 60000, limit: 2 },      // 1分钟2次
    mediumTerm: { window: 3600000, limit: 5 },   // 1小时5次
    longTerm: { window: 86400000, limit: 10 },   // 24小时10次
    suspiciousMultiplier: 0.3,
    trustedMultiplier: 2.0
  },
  story: {
    shortTerm: { window: 60000, limit: 1 },      // 1分钟1次
    mediumTerm: { window: 3600000, limit: 8 },   // 1小时8次
    longTerm: { window: 86400000, limit: 20 },   // 24小时20次
    suspiciousMultiplier: 0.2,
    trustedMultiplier: 1.5
  },
  registration: {
    shortTerm: { window: 60000, limit: 1 },      // 1分钟1次
    mediumTerm: { window: 3600000, limit: 3 },   // 1小时3次
    longTerm: { window: 86400000, limit: 5 },    // 24小时5次
    suspiciousMultiplier: 0.1,
    trustedMultiplier: 1.2
  },
  login: {
    shortTerm: { window: 60000, limit: 3 },      // 1分钟3次
    mediumTerm: { window: 3600000, limit: 15 },  // 1小时15次
    longTerm: { window: 86400000, limit: 50 },   // 24小时50次
    suspiciousMultiplier: 0.5,
    trustedMultiplier: 1.5
  }
};

// IP时效限制管理器
class IPTimeBasedRateLimit {
  private requestHistory = new Map<string, number[]>();
  private suspiciousIPs = new Set<string>();
  private trustedIPs = new Set<string>();
  private ipReputationScores = new Map<string, number>();

  checkLimit(ip: string, requestType: string): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    remainingRequests?: { short: number; medium: number; long: number };
    riskLevel?: 'low' | 'medium' | 'high';
  } {
    const config = REQUEST_TYPE_CONFIGS[requestType];
    if (!config) {
      return { allowed: true, riskLevel: 'low' };
    }

    const key = `${ip}:${requestType}`;
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];

    // 清理过期记录
    const validHistory = history.filter(timestamp => 
      now - timestamp < config.longTerm.window
    );

    // 计算限制倍数
    let multiplier = 1;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (this.suspiciousIPs.has(ip)) {
      multiplier = config.suspiciousMultiplier;
      riskLevel = 'high';
    } else if (this.trustedIPs.has(ip)) {
      multiplier = config.trustedMultiplier;
      riskLevel = 'low';
    } else {
      // 基于IP信誉评分调整
      const reputationScore = this.ipReputationScores.get(ip) || 0.5;
      if (reputationScore < 0.3) {
        multiplier = 0.5;
        riskLevel = 'high';
      } else if (reputationScore > 0.8) {
        multiplier = 1.5;
        riskLevel = 'low';
      } else {
        riskLevel = 'medium';
      }
    }

    // 计算各级限制
    const shortTermCount = validHistory.filter(t => 
      now - t < config.shortTerm.window
    ).length;
    
    const mediumTermCount = validHistory.filter(t => 
      now - t < config.mediumTerm.window
    ).length;
    
    const longTermCount = validHistory.length;

    const shortLimit = Math.max(1, Math.floor(config.shortTerm.limit * multiplier));
    const mediumLimit = Math.max(1, Math.floor(config.mediumTerm.limit * multiplier));
    const longLimit = Math.max(1, Math.floor(config.longTerm.limit * multiplier));

    // 检查限制
    if (shortTermCount >= shortLimit) {
      return {
        allowed: false,
        reason: '短期请求频率过高',
        retryAfter: Math.ceil(config.shortTerm.window / 1000),
        riskLevel
      };
    }

    if (mediumTermCount >= mediumLimit) {
      return {
        allowed: false,
        reason: '中期请求频率过高',
        retryAfter: Math.ceil(config.mediumTerm.window / 1000),
        riskLevel
      };
    }

    if (longTermCount >= longLimit) {
      return {
        allowed: false,
        reason: '长期请求频率过高',
        retryAfter: Math.ceil(config.longTerm.window / 1000),
        riskLevel
      };
    }

    return {
      allowed: true,
      remainingRequests: {
        short: shortLimit - shortTermCount,
        medium: mediumLimit - mediumTermCount,
        long: longLimit - longTermCount
      },
      riskLevel
    };
  }

  recordRequest(ip: string, requestType: string, success: boolean): void {
    const key = `${ip}:${requestType}`;
    const history = this.requestHistory.get(key) || [];
    history.push(Date.now());
    this.requestHistory.set(key, history);

    // 更新IP信誉评分
    this.updateIPReputation(ip, success);
  }

  markSuspicious(ip: string, reason: string): void {
    this.suspiciousIPs.add(ip);
    this.ipReputationScores.set(ip, 0.1);
    console.log(`IP ${ip} 被标记为可疑: ${reason}`);
  }

  markTrusted(ip: string, reason: string): void {
    this.trustedIPs.add(ip);
    this.suspiciousIPs.delete(ip);
    this.ipReputationScores.set(ip, 0.9);
    console.log(`IP ${ip} 被标记为可信: ${reason}`);
  }

  private updateIPReputation(ip: string, success: boolean): void {
    const currentScore = this.ipReputationScores.get(ip) || 0.5;
    const adjustment = success ? 0.05 : -0.1;
    const newScore = Math.max(0, Math.min(1, currentScore + adjustment));
    this.ipReputationScores.set(ip, newScore);
  }

  getIPStats(ip: string): {
    reputation: number;
    isSuspicious: boolean;
    isTrusted: boolean;
    requestCounts: Record<string, number>;
  } {
    const requestCounts: Record<string, number> = {};
    
    for (const [key, history] of this.requestHistory) {
      if (key.startsWith(`${ip}:`)) {
        const requestType = key.split(':')[1];
        requestCounts[requestType] = history.length;
      }
    }

    return {
      reputation: this.ipReputationScores.get(ip) || 0.5,
      isSuspicious: this.suspiciousIPs.has(ip),
      isTrusted: this.trustedIPs.has(ip),
      requestCounts
    };
  }
}

// 全局实例
const ipRateLimit = new IPTimeBasedRateLimit();

/**
 * 综合防护中间件
 */
export const comprehensiveProtectionMiddleware = (
  requestType: string,
  options: {
    requireTurnstile?: boolean;
    turnstileAction?: string;
    skipIPLimit?: boolean;
    customLimits?: Partial<TimeBasedLimitConfig>;
  } = {}
) => {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     c.req.header('X-Real-IP') || 
                     'unknown';

    console.log(`🛡️ 综合防护检查开始: ${requestType} from ${clientIP}`);

    try {
      // 1. IP时效限制检查
      if (!options.skipIPLimit) {
        const rateLimitResult = ipRateLimit.checkLimit(clientIP, requestType);
        
        if (!rateLimitResult.allowed) {
          console.log(`❌ IP限制阻止: ${rateLimitResult.reason}`);
          
          // 记录失败请求
          ipRateLimit.recordRequest(clientIP, requestType, false);
          
          return c.json({
            success: false,
            error: 'Rate Limit Exceeded',
            message: rateLimitResult.reason,
            retryAfter: rateLimitResult.retryAfter,
            riskLevel: rateLimitResult.riskLevel
          }, 429);
        }

        console.log(`✅ IP限制检查通过, 风险级别: ${rateLimitResult.riskLevel}`);
      }

      // 2. Turnstile验证
      if (options.requireTurnstile) {
        const turnstileToken = c.req.header('cf-turnstile-response') || 
                              c.req.header('turnstile-token');
        
        let requestBody: any = {};
        try {
          requestBody = await c.req.json();
        } catch (e) {
          // 忽略JSON解析错误
        }

        const token = turnstileToken || requestBody.turnstileToken;

        if (!token) {
          console.log('❌ 缺少Turnstile token');
          return c.json({
            success: false,
            error: 'Missing Turnstile Token',
            message: '缺少人机验证token'
          }, 400);
        }

        const turnstileService = new TurnstileService(c.env.TURNSTILE_SECRET_KEY);
        const verification = await turnstileService.verifyToken(token, {
          remoteIP: clientIP
        });

        if (!verification.success) {
          console.log('❌ Turnstile验证失败:', verification.errorCodes);
          
          // 标记可疑IP
          ipRateLimit.markSuspicious(clientIP, 'Turnstile验证失败');
          
          return c.json({
            success: false,
            error: 'Turnstile Verification Failed',
            message: '人机验证失败，请重试',
            details: verification.errorCodes
          }, 403);
        }

        // 检查action匹配
        if (options.turnstileAction && verification.action !== options.turnstileAction) {
          console.log(`❌ Turnstile action不匹配: 期望 ${options.turnstileAction}, 实际 ${verification.action}`);
          return c.json({
            success: false,
            error: 'Invalid Turnstile Action',
            message: '验证action不匹配'
          }, 403);
        }

        // 分析安全级别
        const securityAnalysis = TurnstileAnalyzer.analyzeSecurityLevel(verification);
        const suspiciousCheck = TurnstileAnalyzer.isSuspiciousVerification(verification);

        console.log(`✅ Turnstile验证成功, 安全级别: ${securityAnalysis.level} (${securityAnalysis.score})`);

        // 根据安全级别调整IP信誉
        if (securityAnalysis.level === 'high' && !suspiciousCheck.suspicious) {
          ipRateLimit.markTrusted(clientIP, 'Turnstile高安全级别验证');
        } else if (suspiciousCheck.suspicious) {
          ipRateLimit.markSuspicious(clientIP, `可疑验证: ${suspiciousCheck.reasons.join(', ')}`);
        }

        // 将验证信息添加到上下文
        c.set('turnstileVerification', verification);
        c.set('securityAnalysis', securityAnalysis);
      }

      // 3. 记录成功的请求
      ipRateLimit.recordRequest(clientIP, requestType, true);

      // 4. 添加安全头
      c.header('X-Content-Type-Options', 'nosniff');
      c.header('X-Frame-Options', 'DENY');
      c.header('X-XSS-Protection', '1; mode=block');

      // 5. 继续处理请求
      await next();

      const processingTime = Date.now() - startTime;
      console.log(`✅ 综合防护检查完成: ${requestType}, 耗时: ${processingTime}ms`);

    } catch (error) {
      console.error('❌ 综合防护中间件错误:', error);
      
      // 记录失败请求
      ipRateLimit.recordRequest(clientIP, requestType, false);
      
      return c.json({
        success: false,
        error: 'Protection Middleware Error',
        message: '安全检查失败'
      }, 500);
    }
  };
};

/**
 * 获取IP统计信息的中间件
 */
export const ipStatsMiddleware = () => {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const stats = ipRateLimit.getIPStats(clientIP);
    c.set('ipStats', stats);
    await next();
  };
};

/**
 * 管理员专用的防护统计接口
 */
export const getProtectionStats = () => {
  return {
    ipRateLimit,
    getGlobalStats: () => ({
      totalIPs: ipRateLimit['requestHistory'].size,
      suspiciousIPs: ipRateLimit['suspiciousIPs'].size,
      trustedIPs: ipRateLimit['trustedIPs'].size,
      reputationScores: Object.fromEntries(ipRateLimit['ipReputationScores'])
    })
  };
};

export default comprehensiveProtectionMiddleware;

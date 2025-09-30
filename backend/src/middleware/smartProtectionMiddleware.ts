/**
 * 智能防护中间件
 * 根据安全配置开关动态调整防护策略
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';
import { securityConfig, isSecurityEnabled } from '../services/securityConfigService';
import { TurnstileService, TurnstileAnalyzer } from '../services/turnstileService';

// 模拟的IP频率限制类（简化版）
class SmartIPRateLimit {
  private requestHistory = new Map<string, number[]>();

  checkLimit(ip: string, requestType: string): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  } {
    // 检查是否启用频率限制
    if (!isSecurityEnabled('rateLimit')) {
      return { allowed: true };
    }

    const now = Date.now();
    const key = `${ip}:${requestType}`;
    const history = this.requestHistory.get(key) || [];

    // 清理过期记录
    const validHistory = history.filter(timestamp => now - timestamp < 3600000); // 1小时

    // 根据配置检查不同级别的限制
    if (isSecurityEnabled('rateLimit', 'shortTerm')) {
      const shortTermCount = validHistory.filter(t => now - t < 60000).length; // 1分钟
      if (shortTermCount >= 3) {
        return { allowed: false, reason: '短期频率限制', retryAfter: 60 };
      }
    }

    if (isSecurityEnabled('rateLimit', 'mediumTerm')) {
      const mediumTermCount = validHistory.filter(t => now - t < 3600000).length; // 1小时
      if (mediumTermCount >= 10) {
        return { allowed: false, reason: '中期频率限制', retryAfter: 3600 };
      }
    }

    return { allowed: true };
  }

  recordRequest(ip: string, requestType: string): void {
    if (!isSecurityEnabled('rateLimit')) return;

    const key = `${ip}:${requestType}`;
    const history = this.requestHistory.get(key) || [];
    history.push(Date.now());
    this.requestHistory.set(key, history);
  }
}

const smartIPRateLimit = new SmartIPRateLimit();

/**
 * 智能防护中间件
 */
export const smartProtectionMiddleware = (
  requestType: string,
  options: {
    turnstileAction?: string;
    customChecks?: (c: Context) => Promise<{ allowed: boolean; reason?: string }>;
  } = {}
) => {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     'unknown';

    // 获取当前安全配置
    const config = securityConfig.getConfig();
    const environment = securityConfig.getEnvironment();

    console.log(`🛡️ 智能防护检查: ${requestType} from ${clientIP} (${environment})`);

    try {
      // 检查维护模式
      if (config.emergency.maintenanceMode) {
        return c.json({
          success: false,
          error: 'Maintenance Mode',
          message: '系统正在维护中，请稍后再试'
        }, 503);
      }

      // 检查紧急阻止模式
      if (config.emergency.blockAllSubmissions) {
        return c.json({
          success: false,
          error: 'Emergency Block',
          message: '系统处于紧急模式，暂时阻止所有提交'
        }, 503);
      }

      // 开发环境绕过检查
      if (environment === 'development' && config.debug.bypassAllChecks) {
        console.log('🔧 开发环境绕过所有安全检查');
        await next();
        return;
      }

      // 1. IP频率限制检查
      if (isSecurityEnabled('rateLimit')) {
        const rateLimitResult = smartIPRateLimit.checkLimit(clientIP, requestType);
        
        if (!rateLimitResult.allowed) {
          console.log(`❌ IP频率限制阻止: ${rateLimitResult.reason}`);
          
          // 记录失败请求
          smartIPRateLimit.recordRequest(clientIP, requestType);
          
          return c.json({
            success: false,
            error: 'Rate Limit Exceeded',
            message: rateLimitResult.reason,
            retryAfter: rateLimitResult.retryAfter
          }, 429);
        }

        if (config.debug.verboseLogging) {
          console.log(`✅ IP频率限制检查通过`);
        }
      }

      // 2. Turnstile验证
      if (isSecurityEnabled('turnstile', requestType)) {
        const turnstileToken = c.req.header('cf-turnstile-response') || 
                              c.req.header('turnstile-token');
        
        let requestBody: any = {};
        try {
          const bodyText = await c.req.text();
          if (bodyText) {
            requestBody = JSON.parse(bodyText);
            // 重新设置请求体，因为已经被读取了
            c.req = new Request(c.req.url, {
              method: c.req.method,
              headers: c.req.headers,
              body: bodyText
            });
          }
        } catch (e) {
          // 忽略JSON解析错误
        }

        const token = turnstileToken || requestBody.turnstileToken;

        // 开发环境绕过Turnstile
        if (environment === 'development' && config.turnstile.bypassInDev) {
          console.log('🔧 开发环境绕过Turnstile验证');
        } else {
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
          
          if (config.debug.verboseLogging) {
            console.log(`✅ Turnstile验证成功, 安全级别: ${securityAnalysis.level} (${securityAnalysis.score})`);
          }

          // 将验证信息添加到上下文
          c.set('turnstileVerification', verification);
          c.set('securityAnalysis', securityAnalysis);
        }
      }

      // 3. 内容质量检测
      if (isSecurityEnabled('contentQuality') && requestBody) {
        if (isSecurityEnabled('contentQuality', 'duplicateCheck')) {
          // 简化的重复内容检测
          const contentHash = this.generateContentHash(requestBody);
          if (await this.isDuplicateContent(contentHash, clientIP)) {
            console.log('❌ 检测到重复内容');
            return c.json({
              success: false,
              error: 'Duplicate Content',
              message: '检测到重复内容，请勿重复提交'
            }, 400);
          }
        }

        if (isSecurityEnabled('contentQuality', 'spamDetection')) {
          // 简化的垃圾内容检测
          if (this.isSpamContent(requestBody)) {
            console.log('❌ 检测到垃圾内容');
            return c.json({
              success: false,
              error: 'Spam Content',
              message: '内容质量不符合要求'
            }, 400);
          }
        }
      }

      // 4. 自定义检查
      if (options.customChecks) {
        const customResult = await options.customChecks(c);
        if (!customResult.allowed) {
          console.log(`❌ 自定义检查失败: ${customResult.reason}`);
          return c.json({
            success: false,
            error: 'Custom Check Failed',
            message: customResult.reason || '自定义检查失败'
          }, 400);
        }
      }

      // 5. 记录成功的请求
      smartIPRateLimit.recordRequest(clientIP, requestType);

      // 6. 添加安全头
      c.header('X-Content-Type-Options', 'nosniff');
      c.header('X-Frame-Options', 'DENY');
      c.header('X-XSS-Protection', '1; mode=block');

      // 7. 记录详细日志
      if (config.debug.logAllRequests) {
        console.log(`📝 请求详情:`, {
          type: requestType,
          ip: clientIP,
          userAgent: c.req.header('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }

      // 8. 继续处理请求
      await next();

      const processingTime = Date.now() - startTime;
      if (config.debug.verboseLogging) {
        console.log(`✅ 智能防护检查完成: ${requestType}, 耗时: ${processingTime}ms`);
      }

    } catch (error) {
      console.error('❌ 智能防护中间件错误:', error);
      
      // 记录失败请求
      smartIPRateLimit.recordRequest(clientIP, requestType);
      
      return c.json({
        success: false,
        error: 'Protection Middleware Error',
        message: '安全检查失败'
      }, 500);
    }
  };
};

/**
 * 快捷的防护中间件配置
 */
export const protectQuestionnaire = () => smartProtectionMiddleware('questionnaire', {
  turnstileAction: 'questionnaire-submit'
});

export const protectStory = () => smartProtectionMiddleware('story', {
  turnstileAction: 'story-submit'
});

export const protectRegistration = () => smartProtectionMiddleware('registration', {
  turnstileAction: 'user-register'
});

export const protectLogin = () => smartProtectionMiddleware('login', {
  turnstileAction: 'user-login'
});

/**
 * 获取当前防护状态
 */
export const getProtectionStatus = () => {
  const config = securityConfig.getConfig();
  const stats = securityConfig.getConfigStats();
  
  return {
    environment: securityConfig.getEnvironment(),
    config,
    stats,
    activeProtections: {
      turnstile: config.turnstile.enabled,
      rateLimit: config.rateLimit.enabled,
      contentQuality: config.contentQuality.enabled,
      behaviorAnalysis: config.behaviorAnalysis.enabled,
      emergency: config.emergency.enabled,
      debug: config.debug.enabled
    }
  };
};

export default smartProtectionMiddleware;

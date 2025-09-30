/**
 * Turnstile测试API
 * 用于验证Turnstile后端验证是否正常工作
 */

import { Hono } from 'hono';
import type { Env } from '../../types/api';
import { TurnstileService, TurnstileAnalyzer } from '../../services/turnstileService';

const app = new Hono<{ Bindings: Env }>();

/**
 * 测试Turnstile验证
 */
app.post('/', async (c) => {
  try {
    const { turnstileToken, testData } = await c.req.json();
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     'unknown';

    console.log('🧪 Turnstile测试请求:', {
      hasToken: !!turnstileToken,
      tokenLength: turnstileToken?.length || 0,
      clientIP,
      testData
    });

    // 检查是否有Token
    if (!turnstileToken) {
      return c.json({
        success: false,
        error: 'Missing Token',
        message: '缺少Turnstile token'
      }, 400);
    }

    // 检查Secret Key配置
    if (!c.env.TURNSTILE_SECRET_KEY) {
      return c.json({
        success: false,
        error: 'Configuration Error',
        message: 'Turnstile Secret Key未配置',
        details: {
          configured: false,
          environment: c.env.NODE_ENV || 'unknown'
        }
      }, 500);
    }

    // 创建Turnstile服务
    const turnstileService = new TurnstileService(c.env.TURNSTILE_SECRET_KEY);

    // 验证Token
    const verification = await turnstileService.verifyToken(turnstileToken, {
      remoteIP: clientIP
    });

    console.log('🔍 Turnstile验证结果:', {
      success: verification.success,
      errorCodes: verification.errorCodes,
      action: verification.action,
      hostname: verification.hostname
    });

    if (!verification.success) {
      return c.json({
        success: false,
        error: 'Verification Failed',
        message: 'Turnstile验证失败',
        details: {
          errorCodes: verification.errorCodes,
          clientIP,
          timestamp: new Date().toISOString()
        }
      }, 403);
    }

    // 分析安全级别
    const securityAnalysis = TurnstileAnalyzer.analyzeSecurityLevel(verification);
    const suspiciousCheck = TurnstileAnalyzer.isSuspiciousVerification(verification);

    // 返回成功结果
    return c.json({
      success: true,
      message: 'Turnstile验证成功',
      details: {
        verification: {
          success: verification.success,
          challengeTs: verification.challengeTs,
          hostname: verification.hostname,
          action: verification.action,
          interactive: verification.metadata?.interactive
        },
        securityAnalysis: {
          level: securityAnalysis.level,
          score: securityAnalysis.score,
          factors: securityAnalysis.factors
        },
        suspiciousCheck: {
          suspicious: suspiciousCheck.suspicious,
          reasons: suspiciousCheck.reasons
        },
        request: {
          clientIP,
          userAgent: c.req.header('User-Agent'),
          timestamp: new Date().toISOString(),
          testData
        }
      }
    });

  } catch (error) {
    console.error('❌ Turnstile测试API错误:', error);
    
    return c.json({
      success: false,
      error: 'Internal Error',
      message: '内部服务器错误',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * 获取Turnstile配置状态
 */
app.get('/status', async (c) => {
  try {
    const hasSecretKey = !!c.env.TURNSTILE_SECRET_KEY;
    const environment = c.env.NODE_ENV || 'unknown';

    return c.json({
      success: true,
      data: {
        configured: hasSecretKey,
        environment,
        secretKeyLength: hasSecretKey ? c.env.TURNSTILE_SECRET_KEY.length : 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ 获取Turnstile状态失败:', error);
    
    return c.json({
      success: false,
      error: 'Status Check Failed',
      message: '状态检查失败'
    }, 500);
  }
});

/**
 * 测试连接到Cloudflare Turnstile API
 */
app.get('/connectivity', async (c) => {
  try {
    // 测试连接到Turnstile验证端点
    const testResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new FormData() // 空请求，只测试连接
    });

    const canConnect = testResponse.status !== 0; // 任何HTTP响应都表示可以连接

    return c.json({
      success: true,
      data: {
        canConnect,
        responseStatus: testResponse.status,
        responseStatusText: testResponse.statusText,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Connectivity Test Failed',
      message: '连接测试失败',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

export default app;

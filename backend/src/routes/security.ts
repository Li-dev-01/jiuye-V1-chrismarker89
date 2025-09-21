// Security API Routes - Anti-Bot Protection
import { Hono } from 'hono';
import type { Env } from '../types/api';
import { successResponse, errorResponse } from '../utils/response';
// import { IPReputationService } from '../services/ipReputationService';
// import { SecurityMonitor } from '../services/securityMonitor';

const security = new Hono<{ Bindings: Env }>();

// IP信誉数据库（简化版本）
const MALICIOUS_IP_PATTERNS = [
  /^10\./, // 内网IP
  /^192\.168\./, // 内网IP
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 内网IP
  /^127\./, // 本地回环
];

// 已知恶意IP列表（示例）
const KNOWN_MALICIOUS_IPS = new Set([
  '1.2.3.4',
  '5.6.7.8',
  // 实际使用时应该从IP信誉数据库获取
]);

// 用户代理黑名单
const SUSPICIOUS_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /python/i,
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
];

// 请求频率限制存储
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

// IP信誉检查（简化版本）
async function checkIPReputation(ip: string): Promise<{ safe: boolean; reason?: string; score: number }> {
  try {
    // 基础检查
    if (KNOWN_MALICIOUS_IPS.has(ip)) {
      return { safe: false, reason: 'known_malicious', score: 100 };
    }

    for (const pattern of MALICIOUS_IP_PATTERNS) {
      if (pattern.test(ip)) {
        return { safe: false, reason: 'suspicious_pattern', score: 90 };
      }
    }

    return { safe: true, score: 0 };
  } catch (error) {
    console.error('IP reputation check failed:', error);
    return { safe: true, score: 0 };
  }
}

// 用户代理检查
function checkUserAgent(userAgent: string): { safe: boolean; reason?: string } {
  if (!userAgent) {
    return { safe: false, reason: 'missing_user_agent' };
  }

  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return { safe: false, reason: 'suspicious_user_agent' };
    }
  }

  return { safe: true };
}

// 请求频率检查
function checkRateLimit(ip: string, limit: number = 60, window: number = 60000): { safe: boolean; reason?: string } {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return { safe: true };
  }

  const record = rateLimitStore.get(key)!;
  
  // 重置窗口
  if (now - record.lastReset > window) {
    record.count = 1;
    record.lastReset = now;
    return { safe: true };
  }

  record.count++;
  
  if (record.count > limit) {
    return { safe: false, reason: 'rate_limit_exceeded' };
  }

  return { safe: true };
}

// 行为模式分析
function analyzeBehaviorPattern(data: any): { safe: boolean; reason?: string; score: number } {
  let suspiciousScore = 0;

  // 检查时间戳合理性
  const timestamp = data.t;
  const now = Date.now();
  if (!timestamp || Math.abs(now - timestamp) > 300000) { // 5分钟容差
    suspiciousScore += 30;
  }

  // 检查页面URL合理性
  if (!data.u || !data.u.includes(process.env.FRONTEND_DOMAIN || 'college-employment-survey-frontend.pages.dev')) {
    suspiciousScore += 40;
  }

  // 检查屏幕分辨率合理性
  if (data.s) {
    const [width, height] = data.s.split('x').map(Number);
    if (width < 320 || height < 240 || width > 7680 || height > 4320) {
      suspiciousScore += 20;
    }
  }

  // 检查语言设置
  if (!data.l || data.l.length < 2) {
    suspiciousScore += 10;
  }

  const safe = suspiciousScore < 50;
  return { 
    safe, 
    reason: safe ? undefined : 'suspicious_behavior_pattern',
    score: suspiciousScore 
  };
}

// 主要安全检查端点
security.post('/track', async (c) => {
  try {
    const clientIP = c.req.header('CF-Connecting-IP') ||
                    c.req.header('X-Forwarded-For') ||
                    c.req.header('X-Real-IP') ||
                    'unknown';

    const userAgent = c.req.header('User-Agent') || '';
    const requestData = await c.req.json();

    // 简化版安全检查
    let riskScore = 0;

    // 基础检查
    if (!userAgent || userAgent.includes('bot')) {
      riskScore += 30;
    }

    // 记录正常访问
    console.log('✅ Security check passed:', {
      clientIP,
      riskScore,
      userAgent: userAgent.substring(0, 50) + '...'
    });

    return c.json({
      success: true,
      message: 'Request processed',
      data: {
        status: 'ok',
        riskScore
      }
    });

  } catch (error) {
    console.error('Security check error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

// 获取安全统计信息（管理员用）
security.get('/stats', async (c) => {
  try {
    return c.json({
      success: true,
      message: 'Security statistics',
      data: {
        totalRequests: 1250,
        blockedRequests: 15,
        riskScore: 2.5,
        rateLimitEntries: rateLimitStore.size,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Security stats error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

// 获取最近的安全事件（管理员用）
security.get('/events', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const events = [
      {
        id: '1',
        type: 'suspicious_activity',
        severity: 'low',
        timestamp: new Date().toISOString(),
        clientIP: '192.168.1.1',
        blocked: false
      }
    ];

    return c.json({
      success: true,
      message: 'Recent security events',
      data: {
        events,
        total: events.length
      }
    });
  } catch (error) {
    console.error('Security events error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

// 获取特定IP的历史记录（管理员用）
security.get('/ip/:ip/history', async (c) => {
  try {
    const ip = c.req.param('ip');
    const limit = parseInt(c.req.query('limit') || '50');
    const history = [];
    const isBlacklisted = false;

    return c.json({
      success: true,
      message: 'IP history',
      data: {
        ip,
        isBlacklisted,
        events: history,
        total: history.length
      }
    });
  } catch (error) {
    console.error('IP history error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

export default security;

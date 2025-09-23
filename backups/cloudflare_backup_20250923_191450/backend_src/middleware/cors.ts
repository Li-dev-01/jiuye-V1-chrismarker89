import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 检查origin是否匹配通配符模式
function matchesWildcardPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern;
  }

  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // 转义点号
    .replace(/\*/g, '.*');  // 将*替换为.*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(origin);
}

export async function corsMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const env = c.env;
  const origin = c.req.header('Origin');

  // 如果没有环境变量，使用默认值
  const corsOrigin = env?.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177';
  const allowedOrigins = corsOrigin.split(',').map((o: string) => o.trim());

  // 设置CORS头
  let isAllowed = false;

  if (origin) {
    // 检查精确匹配
    if (allowedOrigins.includes(origin)) {
      isAllowed = true;
    }
    // 检查通配符模式匹配
    else {
      for (const pattern of allowedOrigins) {
        if (matchesWildcardPattern(origin, pattern)) {
          isAllowed = true;
          break;
        }
      }
    }
    // 开发环境允许所有本地端口
    if (!isAllowed && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      isAllowed = true;
    }
  }

  // 如果配置了通配符，直接允许所有来源
  if (allowedOrigins.includes('*')) {
    c.header('Access-Control-Allow-Origin', '*');
  } else if (isAllowed && origin) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // 生产环境：如果origin不在允许列表中，不设置CORS头
    console.log(`CORS blocked origin: ${origin}, allowed patterns: ${allowedOrigins.join(', ')}`);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Time, X-Requested-With, X-API-Version, X-User-ID, X-Human-Token');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  // 处理预检请求
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204 as any);
  }

  return next();
}

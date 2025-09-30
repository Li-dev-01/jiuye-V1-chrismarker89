/**
 * 简单测试路由
 * 用于验证路由系统是否正常工作
 */

import { Hono } from 'hono';
import type { Env } from '../../types/api';

const app = new Hono<{ Bindings: Env }>();

/**
 * 简单的ping测试
 */
app.get('/ping', async (c) => {
  return c.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

/**
 * 环境信息测试
 */
app.get('/env', async (c) => {
  return c.json({
    success: true,
    data: {
      environment: c.env.ENVIRONMENT || 'unknown',
      hasTurnstileSecret: !!c.env.TURNSTILE_SECRET_KEY,
      timestamp: new Date().toISOString()
    }
  });
});

export default app;

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

// 创建简单的Hono应用
const app = new Hono();

// 简单的健康检查端点
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// CORS 中间件
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Time');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return new Response('', { status: 204 });
  }

  return next();
});

// API路由
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// 模拟认证端点
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();

  // 简单的模拟登录
  if (body.username && body.password) {
    return c.json({
      success: true,
      data: {
        user: {
          id: '1',
          username: body.username,
          email: body.username + '@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'mock-jwt-token-' + Date.now()
      },
      message: '登录成功'
    });
  } else {
    return c.json({
      success: false,
      error: 'Invalid credentials',
      message: '用户名或密码错误'
    }, 401);
  }
});

// 模拟注册端点
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json();

  return c.json({
    success: true,
    data: {
      user: {
        id: '2',
        username: body.username,
        email: body.email,
        role: body.role || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    message: '注册成功'
  });
});

// 模拟问卷提交端点
app.post('/api/questionnaire/submit', async (c) => {
  const body = await c.req.json();

  return c.json({
    success: true,
    data: {
      id: 'questionnaire-' + Date.now(),
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: '问卷提交成功'
  });
});

// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: '请求的资源不存在'
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Application error:', err);
  
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

const port = 8788;
console.log(`🚀 简单后端服务器启动在 http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

export default app;

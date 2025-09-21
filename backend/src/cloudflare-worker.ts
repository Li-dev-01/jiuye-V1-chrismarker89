import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseService } from './services/databaseService';
import { R2StorageService } from './services/r2StorageService';

// 定义环境变量类型
interface Env {
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN?: string;
  R2_BUCKET_NAME?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Time'],
  credentials: true,
}));

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Employment Survey API is running',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown',
    version: '1.0.0'
  });
});

// API 健康检查
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'API endpoints are working',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/health',
      '/api/auth/login',
      '/api/questionnaire/submit',
      '/api/analytics/stats'
    ]
  });
});

// 模拟认证端点
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();

    // 简单的模拟登录验证
    if (!body.username || !body.password) {
      return c.json({
        success: false,
        error: 'Username and password are required'
      }, 400);
    }

    // 模拟用户验证 (支持邮箱和用户名)
    const mockUsers = [
      { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { username: 'superadmin', email: 'superadmin@example.com', password: 'super123', role: 'super_admin' },
      { username: 'auditor', email: 'auditor@example.com', password: 'audit123', role: 'auditor' },
      { username: 'user', email: 'user@example.com', password: 'user123', role: 'user' },
      { username: 'reviewer', email: 'reviewer@example.com', password: 'reviewer123', role: 'reviewer' }
    ];

    const user = mockUsers.find(u =>
      (u.username === body.username || u.email === body.username) && u.password === body.password
    );

    if (!user) {
      return c.json({
        success: false,
        error: 'Invalid credentials'
      }, 401);
    }

    // 生成模拟 JWT token
    const token = `mock-jwt-token-${user.username}-${Date.now()}`;

    return c.json({
      success: true,
      data: {
        user: {
          id: `user-${user.username}`,
          username: user.username,
          role: user.role,
          email: user.email,
          userType: user.role === 'admin' ? 'SUPER_ADMIN' : 'USER'
        },
        token: token,
        expiresIn: '24h'
      },
      message: 'Login successful'
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid request body'
    }, 400);
  }
});

// 简化的问卷提交端点 (测试用)
app.post('/api/questionnaire/submit', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;

    // 验证必需字段
    if (!body.sessionId) {
      return c.json({
        success: false,
        error: 'Session ID is required'
      }, 400);
    }

    // 生成测试数据
    const userId = `user-${Date.now()}`;

    // 先创建用户 (如果不存在)
    await db.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, `testuser-${Date.now()}`, `test-${Date.now()}@example.com`, 'test-hash', 'user').run();

    const testData = {
      id: body.sessionId,
      user_id: userId,
      personal_info: JSON.stringify({
        name: "测试用户",
        age: 25,
        gender: "male",
        email: "test@example.com"
      }),
      education_info: JSON.stringify({
        university: "测试大学",
        major: "计算机科学",
        degree: "bachelor",
        graduationYear: 2024
      }),
      employment_info: JSON.stringify({
        preferredIndustry: ["技术"],
        expectedSalary: 10000,
        preferredLocation: ["北京"]
      }),
      job_search_info: JSON.stringify({
        searchChannels: ["网络招聘"],
        searchDuration: 2
      }),
      employment_status: JSON.stringify({
        currentStatus: "seeking",
        satisfactionLevel: 4
      }),
      status: body.isCompleted ? 'approved' : 'pending'
    };

    // 直接插入数据
    const result = await db.prepare(`
      INSERT OR REPLACE INTO questionnaire_responses (
        id, user_id, personal_info, education_info, employment_info,
        job_search_info, employment_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      testData.id,
      testData.user_id,
      testData.personal_info,
      testData.education_info,
      testData.employment_info,
      testData.job_search_info,
      testData.employment_status,
      testData.status
    ).run();

    return c.json({
      success: true,
      data: {
        submissionId: body.sessionId,
        timestamp: new Date().toISOString()
      },
      message: 'Questionnaire submitted successfully'
    });

  } catch (error) {
    console.error('Questionnaire submission error:', error);
    return c.json({
      success: false,
      error: `Failed to submit questionnaire: ${error.message}`
    }, 500);
  }
});

// 心声提交端点
app.post('/api/heart-voices/submit', async (c) => {
  try {
    const body = await c.req.json();
    const db = new DatabaseService(c.env);

    if (!body.content) {
      return c.json({
        success: false,
        error: 'Content is required'
      }, 400);
    }

    const heartVoiceId = await db.createHeartVoice({
      response_id: body.responseId,
      content: body.content,
      author_name: body.authorName,
      is_anonymous: body.isAnonymous !== false,
      emotion_score: body.emotionScore,
      emotion_category: body.emotionCategory,
      category: body.category || 'employment-feedback',
      tags: body.tags ? JSON.stringify(body.tags) : null,
      word_count: body.content.length,
      like_count: 0,
      dislike_count: 0,
      view_count: 0,
      is_featured: false,
      is_approved: true
    });

    return c.json({
      success: true,
      data: {
        id: heartVoiceId,
        message: 'Heart voice submitted successfully'
      }
    });

  } catch (error) {
    console.error('Heart voice submission error:', error);
    return c.json({
      success: false,
      error: 'Failed to submit heart voice'
    }, 500);
  }
});

// 获取心声列表端点
app.get('/api/heart-voices', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const category = c.req.query('category');
    const featured = c.req.query('featured') === 'true';

    const result = await db.getHeartVoices({
      page,
      limit,
      category,
      featured,
      approved: true
    });

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get heart voices error:', error);
    return c.json({
      success: false,
      error: 'Failed to get heart voices'
    }, 500);
  }
});

// 心声点赞/点踩端点
app.post('/api/heart-voices/:id/react', async (c) => {
  try {
    const db = new DatabaseService(c.env);
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    if (!body.type || !['like', 'dislike'].includes(body.type)) {
      return c.json({
        success: false,
        error: 'Invalid reaction type'
      }, 400);
    }

    const success = await db.updateHeartVoiceLikes(id, body.type, body.increment !== false);

    return c.json({
      success,
      message: success ? 'Reaction updated' : 'Failed to update reaction'
    });

  } catch (error) {
    console.error('Heart voice reaction error:', error);
    return c.json({
      success: false,
      error: 'Failed to update reaction'
    }, 500);
  }
});

// 真实统计数据端点
app.get('/api/analytics/stats', async (c) => {
  try {
    // 直接查询数据库获取统计信息
    const db = c.env.DB;

    // 获取问卷统计
    const questionnaireStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM questionnaire_responses
    `).first();

    // 获取心声统计
    const heartVoiceStats = await db.prepare(`
      SELECT COUNT(*) as total FROM questionnaire_heart_voices
    `).first();

    // 获取用户统计
    const userStats = await db.prepare(`
      SELECT COUNT(*) as total FROM users
    `).first();

    const total = questionnaireStats?.total || 0;
    const completed = questionnaireStats?.completed || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return c.json({
      success: true,
      data: {
        totalSubmissions: total,
        completedSubmissions: completed,
        completionRate: Math.round(completionRate * 100) / 100,
        averageQualityScore: 0.85, // 模拟值
        heartVoices: heartVoiceStats?.total || 0,
        users: userStats?.total || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to get analytics stats'
    }, 500);
  }
});

// 模拟用户注册端点
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email || !body.password) {
      return c.json({
        success: false,
        error: 'Email and password are required'
      }, 400);
    }

    // 模拟用户注册
    const userId = `user-${Date.now()}`;

    return c.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: body.email,
          role: 'user',
          createdAt: new Date().toISOString()
        }
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid request body'
    }, 400);
  }
});

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist'
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  }, 500);
});

// 导出默认处理器
export default app;

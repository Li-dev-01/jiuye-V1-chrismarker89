/**
 * System API 测试套件
 * 自动生成的API测试用例
 */

const request = require('supertest');
const { setupTestApp, teardownTestApp, getAuthToken } = require('./setup');

describe('System API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });


  describe('GET /api/endpoints', () => {
    
    it('should 获取endpoints', async () => {
      const response = await request(app)
        .get('/api/endpoints')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/endpoints?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/endpoints?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/summary', () => {
    
    it('should 获取summary', async () => {
      const response = await request(app)
        .get('/api/summary')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/dimension/:dimensionId', () => {
    
    it('should 获取:dimensionId', async () => {
      const response = await request(app)
        .get('/api/dimension/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/dimension/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/question/:questionId', () => {
    
    it('should 获取:questionId', async () => {
      const response = await request(app)
        .get('/api/question/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/question/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cross-analysis', () => {
    
    it('should 获取cross-analysis', async () => {
      const response = await request(app)
        .get('/api/cross-analysis')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cross-analysis?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cross-analysis?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/employment-report', () => {
    
    it('should 获取employment-report', async () => {
      const response = await request(app)
        .get('/api/employment-report')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/real-time-stats', () => {
    
    it('should 获取real-time-stats', async () => {
      const response = await request(app)
        .get('/api/real-time-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/real-time-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/real-time-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/data-quality', () => {
    
    it('should 获取data-quality', async () => {
      const response = await request(app)
        .get('/api/data-quality')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/social-insights', () => {
    
    it('should 获取social-insights', async () => {
      const response = await request(app)
        .get('/api/social-insights')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/social-insights?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/social-insights?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/api-docs/swagger.json', () => {
    
    it('should 获取swagger.json', async () => {
      const response = await request(app)
        .get('/api/api-docs/swagger.json')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/api-docs', () => {
    
    it('should 获取api-docs', async () => {
      const response = await request(app)
        .get('/api/api-docs')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/api-docs?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/api-docs?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/version', () => {
    
    it('should 获取version', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v1', () => {
    
    it('should 获取v1', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v2', () => {
    
    it('should 获取v2', async () => {
      const response = await request(app)
        .get('/api/v2')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/api', () => {
    
    it('should 获取资源', async () => {
      const response = await request(app)
        .get('/api/api')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/auth', () => {
    
    it('should 获取auth', async () => {
      const response = await request(app)
        .get('/api/auth')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/uuid', () => {
    
    it('should 获取uuid', async () => {
      const response = await request(app)
        .get('/api/uuid')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/questionnaire', () => {
    
    it('should 获取questionnaire', async () => {
      const response = await request(app)
        .get('/api/questionnaire')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/universal-questionnaire', () => {
    
    it('should 获取universal-questionnaire', async () => {
      const response = await request(app)
        .get('/api/universal-questionnaire')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/analytics', () => {
    
    it('should 获取analytics', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/reviewer', () => {
    
    it('should 获取reviewer', async () => {
      const response = await request(app)
        .get('/api/reviewer')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/violations', () => {
    
    it('should 获取violations', async () => {
      const response = await request(app)
        .get('/api/violations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/violations?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/violations?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/tiered-audit', () => {
    
    it('should 获取tiered-audit', async () => {
      const response = await request(app)
        .get('/api/tiered-audit')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/admin', () => {
    
    it('should 获取admin', async () => {
      const response = await request(app)
        .get('/api/admin')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/ai-sources', () => {
    
    it('should 获取ai-sources', async () => {
      const response = await request(app)
        .get('/api/ai-sources')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/ai-sources?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/ai-sources?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/super-admin', () => {
    
    it('should 获取super-admin', async () => {
      const response = await request(app)
        .get('/api/super-admin')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/participation-stats', () => {
    
    it('should 获取participation-stats', async () => {
      const response = await request(app)
        .get('/api/participation-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/participation-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/participation-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/questionnaire-auth', () => {
    
    it('should 获取questionnaire-auth', async () => {
      const response = await request(app)
        .get('/api/questionnaire-auth')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/user-content-management', () => {
    
    it('should 获取user-content-management', async () => {
      const response = await request(app)
        .get('/api/user-content-management')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/file-management', () => {
    
    it('should 获取file-management', async () => {
      const response = await request(app)
        .get('/api/file-management')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/auto-png', () => {
    
    it('should 获取auto-png', async () => {
      const response = await request(app)
        .get('/api/auto-png')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/png-test', () => {
    
    it('should 获取png-test', async () => {
      const response = await request(app)
        .get('/api/png-test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/review', () => {
    
    it('should 获取review', async () => {
      const response = await request(app)
        .get('/api/review')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/database-monitor', () => {
    
    it('should 获取database-monitor', async () => {
      const response = await request(app)
        .get('/api/database-monitor')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/security', () => {
    
    it('should 获取security', async () => {
      const response = await request(app)
        .get('/api/security')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/*', () => {
    
    it('should 获取*', async () => {
      const response = await request(app)
        .get('/api/*')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v1', () => {
    
    it('should 获取v1', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v2', () => {
    
    it('should 获取v2', async () => {
      const response = await request(app)
        .get('/api/v2')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/version', () => {
    
    it('should 获取version', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v1/', () => {
    
    it('should 获取v1', async () => {
      const response = await request(app)
        .get('/api/v1/')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/v2/', () => {
    
    it('should 获取v2', async () => {
      const response = await request(app)
        .get('/api/v2/')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health-test', () => {
    
    it('should 获取health-test', async () => {
      const response = await request(app)
        .get('/api/health-test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/api-docs/swagger.json', () => {
    
    it('should 获取swagger.json', async () => {
      const response = await request(app)
        .get('/api/api-docs/swagger.json')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/api-docs', () => {
    
    it('should 获取api-docs', async () => {
      const response = await request(app)
        .get('/api/api-docs')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/api-docs?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/api-docs?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/images/auto-generate/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/images/auto-generate/batch-generate', () => {
    
    it('should 获取batch-generate', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/batch-generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/errors/report', () => {
    
    it('should 获取report', async () => {
      const response = await request(app)
        .get('/api/errors/report')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/stats/simple', () => {
    
    it('should 获取simple', async () => {
      const response = await request(app)
        .get('/api/stats/simple')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/images/auto-generate/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/images/auto-generate/batch-generate', () => {
    
    it('should 获取batch-generate', async () => {
      const response = await request(app)
        .get('/api/images/auto-generate/batch-generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/track', () => {
    
    it('should 获取track', async () => {
      const response = await request(app)
        .get('/api/track')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/api', () => {
    
    it('should 获取资源', async () => {
      const response = await request(app)
        .get('/api/api')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/auth', () => {
    
    it('should 获取auth', async () => {
      const response = await request(app)
        .get('/api/auth')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/user-content-management', () => {
    
    it('should 获取user-content-management', async () => {
      const response = await request(app)
        .get('/api/user-content-management')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/uuid', () => {
    
    it('should 获取uuid', async () => {
      const response = await request(app)
        .get('/api/uuid')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/questionnaire', () => {
    
    it('should 获取questionnaire', async () => {
      const response = await request(app)
        .get('/api/questionnaire')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/universal-questionnaire', () => {
    
    it('should 获取universal-questionnaire', async () => {
      const response = await request(app)
        .get('/api/universal-questionnaire')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/review', () => {
    
    it('should 获取review', async () => {
      const response = await request(app)
        .get('/api/review')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/analytics', () => {
    
    it('should 获取analytics', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/reviewer', () => {
    
    it('should 获取reviewer', async () => {
      const response = await request(app)
        .get('/api/reviewer')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/admin', () => {
    
    it('should 获取admin', async () => {
      const response = await request(app)
        .get('/api/admin')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/participation-stats', () => {
    
    it('should 获取participation-stats', async () => {
      const response = await request(app)
        .get('/api/participation-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/participation-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/participation-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/violations', () => {
    
    it('should 获取violations', async () => {
      const response = await request(app)
        .get('/api/violations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/violations?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/violations?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/audit', () => {
    
    it('should 获取audit', async () => {
      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/database-fix', () => {
    
    it('should 获取database-fix', async () => {
      const response = await request(app)
        .get('/api/database-fix')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/png-management', () => {
    
    it('should 获取png-management', async () => {
      const response = await request(app)
        .get('/api/png-management')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/security', () => {
    
    it('should 获取security', async () => {
      const response = await request(app)
        .get('/api/security')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/', () => {
    
    it('should 获取资源', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/process', () => {
    
    it('should 获取process', async () => {
      const response = await request(app)
        .get('/api/audit/process')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/process?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/process?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/audit/pending', () => {
    
    it('should 获取pending', async () => {
      const response = await request(app)
        .get('/api/audit/pending')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/manual-review', () => {
    
    it('should 获取manual-review', async () => {
      const response = await request(app)
        .get('/api/audit/manual-review')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/config', () => {
    
    it('should 获取config', async () => {
      const response = await request(app)
        .get('/api/audit/config')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/level', () => {
    
    it('should 获取level', async () => {
      const response = await request(app)
        .get('/api/audit/level')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/audit/history', () => {
    
    it('should 获取history', async () => {
      const response = await request(app)
        .get('/api/audit/history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/test', () => {
    
    it('should 获取test', async () => {
      const response = await request(app)
        .get('/api/audit/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/process', () => {
    
    it('should 获取process', async () => {
      const response = await request(app)
        .get('/api/audit/process')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/process?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/process?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/audit/pending', () => {
    
    it('should 获取pending', async () => {
      const response = await request(app)
        .get('/api/audit/pending')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/manual-review', () => {
    
    it('should 获取manual-review', async () => {
      const response = await request(app)
        .get('/api/audit/manual-review')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/config', () => {
    
    it('should 获取config', async () => {
      const response = await request(app)
        .get('/api/audit/config')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/level', () => {
    
    it('should 获取level', async () => {
      const response = await request(app)
        .get('/api/audit/level')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/audit/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/audit/history', () => {
    
    it('should 获取history', async () => {
      const response = await request(app)
        .get('/api/audit/history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/audit/test', () => {
    
    it('should 获取test', async () => {
      const response = await request(app)
        .get('/api/audit/test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/heart-voices', () => {
    
    it('should 获取heart-voices', async () => {
      const response = await request(app)
        .get('/api/heart-voices')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/heart-voices', () => {
    
    it('should 获取heart-voices', async () => {
      const response = await request(app)
        .get('/api/heart-voices')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/heart-voices/<int:voice_id>', () => {
    
    it('should 获取<int:voice_id>', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/heart-voices/<int:voice_id>/like', () => {
    
    it('should 获取like', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<int1/like')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<intnonexistent/like')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/heart-voices', () => {
    
    it('should 获取heart-voices', async () => {
      const response = await request(app)
        .get('/api/heart-voices')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/heart-voices', () => {
    
    it('should 获取heart-voices', async () => {
      const response = await request(app)
        .get('/api/heart-voices')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/heart-voices?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/heart-voices/<int:voice_id>', () => {
    
    it('should 获取<int:voice_id>', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/heart-voices/<int:voice_id>/like', () => {
    
    it('should 获取like', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<int1/like')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/<intnonexistent/like')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cards/generate', () => {
    
    it('should 获取generate', async () => {
      const response = await request(app)
        .get('/api/cards/generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/cards/download/<int:card_id>', () => {
    
    it('should 获取<int:card_id>', async () => {
      const response = await request(app)
        .get('/api/cards/download/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/cards/download/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cards/styles', () => {
    
    it('should 获取styles', async () => {
      const response = await request(app)
        .get('/api/cards/styles')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cards/styles?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cards/styles?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/cards/generate', () => {
    
    it('should 获取generate', async () => {
      const response = await request(app)
        .get('/api/cards/generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/cards/download/<int:card_id>', () => {
    
    it('should 获取<int:card_id>', async () => {
      const response = await request(app)
        .get('/api/cards/download/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/cards/download/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cards/styles', () => {
    
    it('should 获取styles', async () => {
      const response = await request(app)
        .get('/api/cards/styles')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cards/styles?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cards/styles?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories', () => {
    
    it('should 获取stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/test-data/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/test-data/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/test-data/generate', () => {
    
    it('should 获取generate', async () => {
      const response = await request(app)
        .get('/api/test-data/generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/clear', () => {
    
    it('should 获取clear', async () => {
      const response = await request(app)
        .get('/api/test-data/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/preview', () => {
    
    it('should 获取preview', async () => {
      const response = await request(app)
        .get('/api/test-data/preview')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/validate', () => {
    
    it('should 获取validate', async () => {
      const response = await request(app)
        .get('/api/test-data/validate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/templates', () => {
    
    it('should 获取templates', async () => {
      const response = await request(app)
        .get('/api/test-data/templates')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/templates?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/templates?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/test-data/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/test-data/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/test-data/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/test-data/generate', () => {
    
    it('should 获取generate', async () => {
      const response = await request(app)
        .get('/api/test-data/generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/clear', () => {
    
    it('should 获取clear', async () => {
      const response = await request(app)
        .get('/api/test-data/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/preview', () => {
    
    it('should 获取preview', async () => {
      const response = await request(app)
        .get('/api/test-data/preview')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/validate', () => {
    
    it('should 获取validate', async () => {
      const response = await request(app)
        .get('/api/test-data/validate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/test-data/templates', () => {
    
    it('should 获取templates', async () => {
      const response = await request(app)
        .get('/api/test-data/templates')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/templates?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/test-data/templates?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/test-data/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/test-data/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/uuid/test-combinations', () => {
    
    it('should 获取test-combinations', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/uuid/session/<session_id>', () => {
    
    it('should 获取<session_id>', async () => {
      const response = await request(app)
        .get('/api/uuid/session/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/uuid/session/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/uuid/users/statistics', () => {
    
    it('should 获取statistics', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/uuid/test-combinations', () => {
    
    it('should 获取test-combinations', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/test-combinations?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/uuid/session/<session_id>', () => {
    
    it('should 获取<session_id>', async () => {
      const response = await request(app)
        .get('/api/uuid/session/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/uuid/session/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/uuid/users/statistics', () => {
    
    it('should 获取statistics', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/uuid/users/statistics?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });
});
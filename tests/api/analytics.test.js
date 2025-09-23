/**
 * Analytics API 测试套件
 * 自动生成的API测试用例
 */

const request = require('supertest');
const { setupTestApp, teardownTestApp, getAuthToken } = require('./setup');

describe('Analytics API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });


  describe('GET /api/analytics/basic-stats', () => {
    
    it('should 获取basic-stats', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/visualization', () => {
    
    it('should 获取visualization', async () => {
      const response = await request(app)
        .get('/api/analytics/visualization')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/basic-stats', () => {
    
    it('should 获取basic-stats', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/distribution', () => {
    
    it('should 获取distribution', async () => {
      const response = await request(app)
        .get('/api/analytics/distribution')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/cross-analysis', () => {
    
    it('should 获取cross-analysis', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/sync', () => {
    
    it('should 获取sync', async () => {
      const response = await request(app)
        .get('/api/analytics/sync')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/sync/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/performance', () => {
    
    it('should 获取performance', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/cache/invalidate', () => {
    
    it('should 获取invalidate', async () => {
      const response = await request(app)
        .get('/api/analytics/cache/invalidate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/employment', () => {
    
    it('should 获取employment', async () => {
      const response = await request(app)
        .get('/api/analytics/employment')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/basic-stats', () => {
    
    it('should 获取basic-stats', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/basic-stats?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/distribution', () => {
    
    it('should 获取distribution', async () => {
      const response = await request(app)
        .get('/api/analytics/distribution')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/cross-analysis', () => {
    
    it('should 获取cross-analysis', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/cross-analysis?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/sync', () => {
    
    it('should 获取sync', async () => {
      const response = await request(app)
        .get('/api/analytics/sync')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/sync/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/sync/status?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/analytics/performance', () => {
    
    it('should 获取performance', async () => {
      const response = await request(app)
        .get('/api/analytics/performance')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/cache/invalidate', () => {
    
    it('should 获取invalidate', async () => {
      const response = await request(app)
        .get('/api/analytics/cache/invalidate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/health', () => {
    
    it('should 获取health', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/employment', () => {
    
    it('should 获取employment', async () => {
      const response = await request(app)
        .get('/api/analytics/employment')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/dashboard', () => {
    
    it('should 获取dashboard', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/real-data', () => {
    
    it('should 获取real-data', async () => {
      const response = await request(app)
        .get('/api/analytics/real-data')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/dashboard', () => {
    
    it('should 获取dashboard', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });

  describe('GET /api/analytics/real-data', () => {
    
    it('should 获取real-data', async () => {
      const response = await request(app)
        .get('/api/analytics/real-data')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
    });
    
    
  });
});
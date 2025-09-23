/**
 * User API 测试套件
 * 自动生成的API测试用例
 */

const request = require('supertest');
const { setupTestApp, teardownTestApp, getAuthToken } = require('./setup');

describe('User API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });


  describe('GET /api/user/login-history', () => {
    
    it('should 获取login-history', async () => {
      const response = await request(app)
        .get('/api/user/login-history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/user/two-factor', () => {
    
    it('should 获取two-factor', async () => {
      const response = await request(app)
        .get('/api/user/two-factor')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/user/two-factor')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/user/login-history', () => {
    
    it('should 获取login-history', async () => {
      const response = await request(app)
        .get('/api/user/login-history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    
  });

  describe('GET /api/user/two-factor', () => {
    
    it('should 获取two-factor', async () => {
      const response = await request(app)
        .get('/api/user/two-factor')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/user/two-factor')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/heart-voices/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/heart-voices/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/heart-voices/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cards/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/cards/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/cards/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/cards/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/cards/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/cards/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/cards/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/cards/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/stories/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/stories/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories/user/<int:user_id>', () => {
    
    it('should 获取<int:user_id>', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/stories/user/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/user/<int1?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
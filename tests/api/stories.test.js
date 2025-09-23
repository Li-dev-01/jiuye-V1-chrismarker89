/**
 * Stories API 测试套件
 * 自动生成的API测试用例
 */

const request = require('supertest');
const { setupTestApp, teardownTestApp, getAuthToken } = require('./setup');

describe('Stories API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });


  describe('GET /api/stories/<int:story_id>', () => {
    
    it('should 获取<int:story_id>', async () => {
      const response = await request(app)
        .get('/api/stories/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/stories/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/<int1?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/<int1?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories/featured', () => {
    
    it('should 获取featured', async () => {
      const response = await request(app)
        .get('/api/stories/featured')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/featured?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/featured?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories/<int:story_id>', () => {
    
    it('should 获取<int:story_id>', async () => {
      const response = await request(app)
        .get('/api/stories/<int1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/stories/<intnonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/<int1?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/<int1?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stories/featured', () => {
    
    it('should 获取featured', async () => {
      const response = await request(app)
        .get('/api/stories/featured')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
    
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/featured?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/stories/featured?page=-1&pageSize=0')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
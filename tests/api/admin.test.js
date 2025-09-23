/**
 * Admin API 测试套件
 * 自动生成的API测试用例
 */

import request from 'supertest';
import { setupTestApp, teardownTestApp, getAuthToken } from './setup.js';

describe('Admin API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await teardownTestApp();
  });


  describe('GET /api/admin/users/download/${Date.now()}.${format}', () => {
    
    it('should 获取${Date.now()}.${format}', async () => {
      const response = await request(app)
        .get('/api/admin/users/download/$1.$1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users/download/$1.$1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/users/download/$nonexistent.$nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/download/$1.$1?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/download/$1.$1?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users', () => {
    
    it('should 获取users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/data-generator', () => {
    
    it('should 获取data-generator', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/google-whitelist', () => {
    
    it('should 获取google-whitelist', async () => {
      const response = await request(app)
        .get('/api/admin/google-whitelist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/google-whitelist')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/ip-access-control', () => {
    
    it('should 获取ip-access-control', async () => {
      const response = await request(app)
        .get('/api/admin/ip-access-control')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ip-access-control')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/intelligent-security', () => {
    
    it('should 获取intelligent-security', async () => {
      const response = await request(app)
        .get('/api/admin/intelligent-security')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/intelligent-security')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/database-test', () => {
    
    it('should 获取database-test', async () => {
      const response = await request(app)
        .get('/api/admin/database-test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/database-test')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/google-whitelist', () => {
    
    it('should 获取google-whitelist', async () => {
      const response = await request(app)
        .get('/api/admin/google-whitelist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/google-whitelist')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/ip-access-control', () => {
    
    it('should 获取ip-access-control', async () => {
      const response = await request(app)
        .get('/api/admin/ip-access-control')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ip-access-control')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/intelligent-security', () => {
    
    it('should 获取intelligent-security', async () => {
      const response = await request(app)
        .get('/api/admin/intelligent-security')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/intelligent-security')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/login-monitor', () => {
    
    it('should 获取login-monitor', async () => {
      const response = await request(app)
        .get('/api/admin/login-monitor')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/login-monitor')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator', () => {
    
    it('should 获取data-generator', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/database', () => {
    
    it('should 获取database', async () => {
      const response = await request(app)
        .get('/api/admin/database')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/database')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/dashboard/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/questionnaires', () => {
    
    it('should 获取questionnaires', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/questionnaires/<int:questionnaire_id>', () => {
    
    it('should 获取<int:questionnaire_id>', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/audit-records', () => {
    
    it('should 获取audit-records', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/audit-config', () => {
    
    it('should 获取audit-config', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/audit-config', () => {
    
    it('should 获取audit-config', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/ai-providers', () => {
    
    it('should 获取ai-providers', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/ai-sources', () => {
    
    it('should 获取ai-sources', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/ai-sources', () => {
    
    it('should 获取ai-sources', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/local-rules', () => {
    
    it('should 获取local-rules', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users', () => {
    
    it('should 获取users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users/<user_id>/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/users/nonexistent/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/reviewers/<reviewer_id>/activity', () => {
    
    it('should 获取activity', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/1/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/1/activity')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/nonexistent/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/reviewers', () => {
    
    it('should 获取reviewers', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/categories', () => {
    
    it('should 获取categories', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/tags', () => {
    
    it('should 获取tags', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/categories', () => {
    
    it('should 获取categories', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/tags', () => {
    
    it('should 获取tags', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/database/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/database/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/database/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/database/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/database/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/api/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/project/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/project/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/project/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/project/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/project/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/project/control', () => {
    
    it('should 获取control', async () => {
      const response = await request(app)
        .get('/api/admin/project/control')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/project/control')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/user-behavior/analysis', () => {
    
    it('should 获取analysis', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/user-behavior/cleanup', () => {
    
    it('should 获取cleanup', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/cleanup')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/dashboard/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/questionnaires', () => {
    
    it('should 获取questionnaires', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/questionnaires/<int:questionnaire_id>', () => {
    
    it('should 获取<int:questionnaire_id>', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<intnonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/questionnaires/<int1?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/audit-records', () => {
    
    it('should 获取audit-records', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/audit-records?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/audit-config', () => {
    
    it('should 获取audit-config', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/audit-config', () => {
    
    it('should 获取audit-config', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/audit-config')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/ai-providers', () => {
    
    it('should 获取ai-providers', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-providers?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/ai-sources', () => {
    
    it('should 获取ai-sources', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/ai-sources', () => {
    
    it('should 获取ai-sources', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/ai-sources?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/local-rules', () => {
    
    it('should 获取local-rules', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/local-rules?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users', () => {
    
    it('should 获取users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/users/<user_id>/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/users/nonexistent/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users/1/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/reviewers/<reviewer_id>/activity', () => {
    
    it('should 获取activity', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/1/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/1/activity')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers/nonexistent/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/reviewers', () => {
    
    it('should 获取reviewers', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reviewers?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/categories', () => {
    
    it('should 获取categories', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/tags', () => {
    
    it('should 获取tags', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/categories', () => {
    
    it('should 获取categories', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/categories?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/content/tags', () => {
    
    it('should 获取tags', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/content/tags?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/database/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/database/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/database/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/database/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/database/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/api/stats', () => {
    
    it('should 获取stats', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/api/stats?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/project/status', () => {
    
    it('should 获取status', async () => {
      const response = await request(app)
        .get('/api/admin/project/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/project/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/project/status?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/project/status?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/project/control', () => {
    
    it('should 获取control', async () => {
      const response = await request(app)
        .get('/api/admin/project/control')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/project/control')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/user-behavior/analysis', () => {
    
    it('should 获取analysis', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('pageSize', 5);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/analysis?page=-1&pageSize=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/admin/user-behavior/cleanup', () => {
    
    it('should 获取cleanup', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/user-behavior/cleanup')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/clear', () => {
    
    it('should 获取clear', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/clear')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/smart-voice', () => {
    
    it('should 获取smart-voice', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-voice')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/smart-story', () => {
    
    it('should 获取smart-story', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-story')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-story')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/clear', () => {
    
    it('should 获取clear', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/clear')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/smart-voice', () => {
    
    it('should 获取smart-voice', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-voice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-voice')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });

  describe('GET /api/admin/data-generator/smart-story', () => {
    
    it('should 获取smart-story', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-story')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // 添加特定的响应验证
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/admin/data-generator/smart-story')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
  });
});
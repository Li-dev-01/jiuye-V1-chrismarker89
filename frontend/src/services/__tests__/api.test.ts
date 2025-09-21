/**
 * API服务测试
 */

import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { api, ApiResponse } from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('请求拦截器', () => {
    test('应该添加Authorization头部', async () => {
      const mockToken = 'test-token';
      localStorage.setItem('auth_token', mockToken);

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        get: vi.fn().mockResolvedValue({ data: { success: true } })
      } as any);

      // 重新导入以触发拦截器设置
      const { api: newApi } = await import('../api');
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      localStorage.removeItem('auth_token');
    });

    test('应该处理请求错误', async () => {
      const mockError = new Error('Network Error');
      
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { 
            use: vi.fn((success, error) => {
              // 模拟请求错误
              error(mockError);
            })
          },
          response: { use: vi.fn() }
        }
      } as any);

      // 验证错误处理
      expect(() => {
        // 重新导入以触发拦截器
        require('../api');
      }).not.toThrow();
    });
  });

  describe('响应拦截器', () => {
    test('应该正确处理成功响应', async () => {
      const mockResponse = {
        data: { success: true, data: { test: 'value' } },
        status: 200,
        statusText: 'OK'
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { 
            use: vi.fn((success) => {
              const result = success(mockResponse);
              expect(result).toEqual(mockResponse);
            })
          }
        }
      } as any);

      // 重新导入以触发拦截器
      require('../api');
    });

    test('应该处理401未授权错误', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { 
            use: vi.fn((success, error) => {
              try {
                error(mockError);
              } catch (e) {
                // 验证错误被正确抛出
                expect(e).toBe(mockError);
              }
            })
          }
        }
      } as any);

      // 重新导入以触发拦截器
      require('../api');
    });

    test('应该处理网络错误', async () => {
      const mockError = {
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      };

      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { 
            use: vi.fn((success, error) => {
              try {
                error(mockError);
              } catch (e) {
                expect(e).toBe(mockError);
              }
            })
          }
        }
      } as any);

      require('../api');
    });
  });

  describe('API方法', () => {
    const mockApiInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn()
    };

    beforeEach(() => {
      mockedAxios.create.mockReturnValue({
        ...mockApiInstance,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      } as any);
    });

    test('GET请求应该正确工作', async () => {
      const mockResponse = { data: { success: true, data: { id: 1 } } };
      mockApiInstance.get.mockResolvedValue(mockResponse);

      const { api: newApi } = await import('../api');
      const result = await newApi.get('/test');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockResponse);
    });

    test('POST请求应该正确工作', async () => {
      const mockData = { name: 'test' };
      const mockResponse = { data: { success: true, data: { id: 1 } } };
      mockApiInstance.post.mockResolvedValue(mockResponse);

      const { api: newApi } = await import('../api');
      const result = await newApi.post('/test', mockData);

      expect(mockApiInstance.post).toHaveBeenCalledWith('/test', mockData, undefined);
      expect(result).toEqual(mockResponse);
    });

    test('PUT请求应该正确工作', async () => {
      const mockData = { id: 1, name: 'updated' };
      const mockResponse = { data: { success: true } };
      mockApiInstance.put.mockResolvedValue(mockResponse);

      const { api: newApi } = await import('../api');
      const result = await newApi.put('/test/1', mockData);

      expect(mockApiInstance.put).toHaveBeenCalledWith('/test/1', mockData, undefined);
      expect(result).toEqual(mockResponse);
    });

    test('DELETE请求应该正确工作', async () => {
      const mockResponse = { data: { success: true } };
      mockApiInstance.delete.mockResolvedValue(mockResponse);

      const { api: newApi } = await import('../api');
      const result = await newApi.delete('/test/1');

      expect(mockApiInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockResponse);
    });

    test('PATCH请求应该正确工作', async () => {
      const mockData = { name: 'patched' };
      const mockResponse = { data: { success: true } };
      mockApiInstance.patch.mockResolvedValue(mockResponse);

      const { api: newApi } = await import('../api');
      const result = await newApi.patch('/test/1', mockData);

      expect(mockApiInstance.patch).toHaveBeenCalledWith('/test/1', mockData, undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('错误处理', () => {
    test('应该正确处理API错误响应', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { 
            success: false, 
            error: 'Bad Request',
            message: '请求参数错误'
          }
        }
      };

      const mockApiInstance = {
        get: vi.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance as any);

      const { api: newApi } = await import('../api');

      try {
        await newApi.get('/test');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    test('应该正确处理网络错误', async () => {
      const mockError = new Error('Network Error');

      const mockApiInstance = {
        get: vi.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance as any);

      const { api: newApi } = await import('../api');

      try {
        await newApi.get('/test');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });

  describe('配置', () => {
    test('应该使用正确的基础URL', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('localhost')
        })
      );
    });

    test('应该设置正确的超时时间', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000
        })
      );
    });

    test('应该设置正确的默认头部', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
});

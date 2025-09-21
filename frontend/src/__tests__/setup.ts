/**
 * 测试环境设置
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展expect匹配器
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock全局对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto.subtle for Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm, data) => {
        // 简单的mock实现
        const text = new TextDecoder().decode(data);
        const hash = text.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return new ArrayBuffer(32);
      })
    },
    getRandomValues: vi.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

// Mock screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24
  }
});

// Mock Intl
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: vi.fn().mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: 'Asia/Shanghai' })
    }))
  }
});

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// 全局测试工具
global.testUtils = {
  // 等待异步操作完成
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 创建mock用户
  createMockUser: (type = 'anonymous', overrides = {}) => ({
    uuid: `${type}-20250127-12345678-1234-4567-8901-123456789012`,
    userType: type,
    displayName: `${type}用户_89012`,
    permissions: [],
    profile: { language: 'zh-CN' },
    metadata: { loginCount: 1 },
    status: 'active',
    createdAt: '2025-01-27T10:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
    lastActiveAt: '2025-01-27T10:00:00Z',
    ...overrides
  }),
  
  // 创建mock会话
  createMockSession: (userUuid, overrides = {}) => ({
    sessionId: 'sess-12345678-1234-4567-8901-123456789012',
    userUuid,
    sessionToken: 'tok-12345678-1234-4567-8901-123456789012',
    deviceFingerprint: 'device123',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
    expiresAt: '2025-01-28T10:00:00Z',
    isActive: true,
    createdAt: '2025-01-27T10:00:00Z',
    ...overrides
  }),
  
  // 创建mock API响应
  createMockApiResponse: (data, success = true, message = 'Success') => ({
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: 'test-request-id'
  })
};

// TypeScript类型声明
declare global {
  var testUtils: {
    waitForAsync: (ms?: number) => Promise<void>;
    createMockUser: (type?: string, overrides?: any) => any;
    createMockSession: (userUuid: string, overrides?: any) => any;
    createMockApiResponse: (data: any, success?: boolean, message?: string) => any;
  };
}

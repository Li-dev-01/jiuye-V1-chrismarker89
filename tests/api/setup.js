/**
 * API测试设置文件
 * 提供测试环境的初始化和清理功能
 */

import { spawn } from 'child_process';
import axios from 'axios';

let testServer;
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

/**
 * 设置测试应用
 */
async function setupTestApp() {
  // 启动测试服务器
  testServer = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, PORT: TEST_PORT, NODE_ENV: 'test' },
    stdio: 'pipe'
  });

  // 等待服务器启动
  await waitForServer();
  
  return BASE_URL;
}

/**
 * 清理测试环境
 */
async function teardownTestApp() {
  if (testServer) {
    testServer.kill();
  }
}

/**
 * 获取认证令牌
 */
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    return response.data.data.token;
  } catch (error) {
    console.warn('无法获取认证令牌，使用模拟令牌');
    return 'mock-auth-token';
  }
}

/**
 * 等待服务器启动
 */
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/api/health`);
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('测试服务器启动超时');
}

/**
 * 创建测试数据
 */
async function createTestData() {
  // 创建测试用户
  const testUser = await axios.post(`${BASE_URL}/api/users`, {
    name: '测试用户',
    email: 'test@example.com',
    password: 'testpassword'
  });

  // 创建测试故事
  const testStory = await axios.post(`${BASE_URL}/api/stories`, {
    title: '测试故事',
    content: '这是一个测试故事',
    category: 'success'
  });

  return { testUser, testStory };
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    // 清理测试数据的逻辑
    await axios.delete(`${BASE_URL}/api/test-data/clear`);
  } catch (error) {
    console.warn('清理测试数据失败:', error.message);
  }
}

export {
  setupTestApp,
  teardownTestApp,
  getAuthToken,
  createTestData,
  cleanupTestData,
  BASE_URL
};
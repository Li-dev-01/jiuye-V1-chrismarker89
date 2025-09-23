#!/usr/bin/env node

/**
 * 前端请求调试脚本
 * 模拟前端发送的确切请求
 */

import axios from 'axios';

// 模拟前端配置
const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 模拟前端认证token获取逻辑
function getAuthHeaders() {
  // 模拟localStorage中的认证信息
  const sessionToken = '{"sessionId": "test-session-id"}';
  const universalAuth = '{"state": {"currentSession": {"sessionId": "test-universal-session"}}}';
  
  try {
    const sessionData = JSON.parse(sessionToken);
    if (sessionData.sessionId) {
      return { 'Authorization': `Bearer ${sessionData.sessionId}` };
    }
  } catch (e) {
    console.warn('Failed to parse session token:', e);
  }
  
  try {
    const authData = JSON.parse(universalAuth);
    if (authData.state?.currentSession?.sessionId) {
      return { 'Authorization': `Bearer ${authData.state.currentSession.sessionId}` };
    }
  } catch (e) {
    console.warn('Failed to parse universal auth:', e);
  }
  
  return {};
}

// 创建axios实例，模拟前端配置
const client = axios.create({
  baseURL: `${API_BASE_URL}/api/stories`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 添加请求拦截器
client.interceptors.request.use(
  (config) => {
    console.log('🔍 请求拦截器 - 原始配置:');
    console.log('  baseURL:', config.baseURL);
    console.log('  url:', config.url);
    console.log('  完整URL:', config.baseURL + config.url);
    
    const authHeaders = getAuthHeaders();
    Object.assign(config.headers, authHeaders);
    
    console.log('  认证头:', authHeaders);
    console.log('  最终headers:', config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
client.interceptors.response.use(
  (response) => {
    console.log('✅ 响应成功:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.log('❌ 响应错误:');
    console.log('  状态码:', error.response?.status);
    console.log('  状态文本:', error.response?.statusText);
    console.log('  错误信息:', error.message);
    console.log('  请求URL:', error.config?.url);
    console.log('  完整URL:', error.config?.baseURL + error.config?.url);
    return Promise.reject(error);
  }
);

// 模拟前端故事数据
const storyData = {
  title: "前端调试测试故事",
  content: "这是通过前端调试脚本发送的测试故事内容",
  category: "job_search",
  tags: ["前端调试", "测试"],
  user_id: "semi-20250923-20a0e009",
  author_name: "半匿名用户_20a0e009",
  is_anonymous: false
};

async function testStoryCreation() {
  console.log('🚀 开始测试故事创建...');
  console.log('📝 故事数据:', JSON.stringify(storyData, null, 2));
  
  try {
    // 这里使用 '/' 路径，模拟前端的 createStory 方法
    const response = await client.post('/', storyData);
    
    console.log('🎉 故事创建成功!');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('💥 故事创建失败!');
    console.log('🔍 错误详情:');
    
    if (error.response) {
      console.log('  HTTP状态:', error.response.status);
      console.log('  响应数据:', error.response.data);
    } else if (error.request) {
      console.log('  请求发送失败:', error.request);
    } else {
      console.log('  配置错误:', error.message);
    }
  }
}

// 执行测试
testStoryCreation();

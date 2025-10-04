#!/usr/bin/env node

/**
 * 测试后端启动和基础功能
 */

import { spawn } from 'child_process';
import axios from 'axios';

const BACKEND_PORT = 49186; // 从wrangler输出中获取的端口
const BASE_URL = `http://localhost:${BACKEND_PORT}`;

async function testBackendHealth() {
  console.log('🔍 测试后端健康状态...');
  
  try {
    // 测试基础健康检查
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ 基础健康检查通过:', healthResponse.data);
    
    // 测试系统健康检查
    try {
      const systemHealthResponse = await axios.get(`${BASE_URL}/api/system-health/health`);
      console.log('✅ 系统健康检查通过:', systemHealthResponse.data);
    } catch (error) {
      console.log('⚠️  系统健康检查端点可能未启用:', error.response?.status);
    }
    
    // 测试数据库连接
    try {
      const dbHealthResponse = await axios.get(`${BASE_URL}/api/system-health/health/database`);
      console.log('✅ 数据库健康检查通过:', dbHealthResponse.data);
    } catch (error) {
      console.log('⚠️  数据库健康检查失败:', error.response?.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 后端健康检查失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始后端功能测试...');
  
  // 等待后端启动
  console.log('⏳ 等待后端服务启动...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const isHealthy = await testBackendHealth();
  
  if (isHealthy) {
    console.log('🎉 后端服务运行正常，可以继续数据库迁移');
  } else {
    console.log('❌ 后端服务存在问题，请先修复后再进行迁移');
  }
}

main().catch(console.error);

#!/usr/bin/env node

// 简单的认证API测试脚本

const API_BASE = 'http://localhost:8787/api';

async function testAuth() {
  console.log('🧪 开始测试认证API...\n');

  try {
    // 1. 测试注册
    console.log('1️⃣ 测试用户注册...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'TestPass123!'
      })
    });

    const registerResult = await registerResponse.json();
    console.log('注册结果:', registerResult.success ? '✅ 成功' : '❌ 失败');
    if (!registerResult.success) {
      console.log('错误:', registerResult.message);
      return;
    }

    const token = registerResult.data.token;
    console.log('获得Token:', token.substring(0, 50) + '...\n');

    // 2. 测试获取用户信息
    console.log('2️⃣ 测试获取用户信息...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileResult = await profileResponse.json();
    console.log('获取用户信息:', profileResult.success ? '✅ 成功' : '❌ 失败');
    if (profileResult.success) {
      console.log('用户信息:', profileResult.data);
    } else {
      console.log('错误:', profileResult.message);
    }

    // 3. 测试登录
    console.log('\n3️⃣ 测试用户登录...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser3',
        password: 'TestPass123!'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('登录结果:', loginResult.success ? '✅ 成功' : '❌ 失败');
    if (loginResult.success) {
      console.log('新Token:', loginResult.data.token.substring(0, 50) + '...');
    } else {
      console.log('错误:', loginResult.message);
    }

    console.log('\n🎉 认证API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAuth();

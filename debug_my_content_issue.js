#!/usr/bin/env node

/**
 * "我的内容"页面问题深度分析脚本
 * 通过实际测试验证问题根源
 */

import axios from 'axios';

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const FRONTEND_URL = 'https://1c62525d.college-employment-survey-frontend-l84.pages.dev';

// 测试用户信息
const TEST_USER = {
  identityA: '13800138000',
  identityB: '1234',
  expectedUserId: 'semi-20250923-20a0e009' // 根据之前的测试
};

console.log('🔍 开始深度分析"我的内容"页面问题...\n');

// 步骤1: 测试用户登录API
async function testUserLogin() {
  console.log('📋 步骤1: 测试用户登录API');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/uuid/auth/semi-anonymous-login`, {
      identityA: TEST_USER.identityA,
      identityB: TEST_USER.identityB,
      deviceInfo: {}
    });
    
    console.log('✅ 登录API响应状态:', response.status);
    console.log('📊 登录响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      console.log('🔑 用户UUID:', userData.uuid);
      console.log('👤 用户类型:', userData.userType);
      console.log('📝 显示名称:', userData.displayName);
      
      return {
        success: true,
        userData: userData,
        sessionId: userData.sessionId
      };
    } else {
      console.log('❌ 登录失败:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('💥 登录API错误:', error.message);
    if (error.response) {
      console.log('📄 错误响应:', error.response.data);
    }
    return { success: false };
  }
}

// 步骤2: 测试用户故事API
async function testUserStoriesAPI(userId, sessionId) {
  console.log('\n📋 步骤2: 测试用户故事API');
  console.log('🔍 测试用户ID:', userId);
  
  try {
    const headers = {};
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/stories/user/${userId}`, {
      headers: headers
    });
    
    console.log('✅ 用户故事API响应状态:', response.status);
    console.log('📊 API响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const stories = response.data.data.stories || [];
      console.log('📚 用户故事数量:', stories.length);
      
      if (stories.length > 0) {
        console.log('📖 第一个故事:', {
          id: stories[0].id,
          title: stories[0].title,
          status: stories[0].status || stories[0].audit_status,
          created_at: stories[0].created_at
        });
      }
      
      return {
        success: true,
        stories: stories,
        total: response.data.data.pagination?.total || stories.length
      };
    } else {
      console.log('❌ 用户故事API失败:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('💥 用户故事API错误:', error.message);
    if (error.response) {
      console.log('📄 错误响应状态:', error.response.status);
      console.log('📄 错误响应数据:', error.response.data);
    }
    return { success: false };
  }
}

// 步骤3: 模拟前端权限检查逻辑
function testFrontendPermissionLogic(userData) {
  console.log('\n📋 步骤3: 模拟前端权限检查逻辑');
  
  const isAuthenticated = !!(userData && userData.uuid);
  console.log('🔐 isAuthenticated:', isAuthenticated);
  
  if (!userData) {
    console.log('❌ 用户数据为空');
    return false;
  }
  
  console.log('👤 用户数据分析:');
  console.log('  - uuid:', userData.uuid);
  console.log('  - userType:', userData.userType);
  console.log('  - displayName:', userData.displayName);
  console.log('  - username:', userData.username);
  console.log('  - email:', userData.email);
  
  // 模拟前端权限检查逻辑
  const hasContentAccess = isAuthenticated && userData && userData.uuid && (
    userData.userType === 'SEMI_ANONYMOUS' ||
    userData.userType === 'semi_anonymous' ||
    userData.userType === 'ANONYMOUS' ||
    userData.userType === 'anonymous' ||
    userData.userType === 'user' ||
    userData.userType === 'USER' ||
    userData.username ||
    userData.email
  );
  
  console.log('🔑 hasContentAccess:', hasContentAccess);
  
  // 详细分析每个条件
  console.log('\n🔍 权限条件详细分析:');
  console.log('  - isAuthenticated && userData && userData.uuid:', !!(isAuthenticated && userData && userData.uuid));
  console.log('  - userType === SEMI_ANONYMOUS:', userData.userType === 'SEMI_ANONYMOUS');
  console.log('  - userType === semi_anonymous:', userData.userType === 'semi_anonymous');
  console.log('  - userType === ANONYMOUS:', userData.userType === 'ANONYMOUS');
  console.log('  - userType === anonymous:', userData.userType === 'anonymous');
  console.log('  - userType === user:', userData.userType === 'user');
  console.log('  - userType === USER:', userData.userType === 'USER');
  console.log('  - has username:', !!userData.username);
  console.log('  - has email:', !!userData.email);
  
  return hasContentAccess;
}

// 步骤4: 测试前端页面访问
async function testFrontendPageAccess() {
  console.log('\n📋 步骤4: 测试前端页面访问');
  
  try {
    const response = await axios.get(`${FRONTEND_URL}/my-content`);
    console.log('✅ 前端页面响应状态:', response.status);
    console.log('📄 页面内容长度:', response.data.length);
    
    // 检查页面内容中是否包含"需要登录访问"
    const needsLoginText = response.data.includes('需要登录访问');
    const hasLoginForm = response.data.includes('请使用A+B方式登录后查看您的内容');
    
    console.log('🔍 页面内容分析:');
    console.log('  - 包含"需要登录访问":', needsLoginText);
    console.log('  - 包含登录提示:', hasLoginForm);
    
    return {
      success: true,
      needsLogin: needsLoginText || hasLoginForm
    };
  } catch (error) {
    console.log('💥 前端页面访问错误:', error.message);
    return { success: false };
  }
}

// 步骤5: 综合分析和建议
function analyzeResults(loginResult, storiesResult, permissionResult, pageResult) {
  console.log('\n📋 步骤5: 综合分析和建议');
  console.log('=' .repeat(50));
  
  console.log('🔍 测试结果汇总:');
  console.log('  1. 用户登录API:', loginResult.success ? '✅ 成功' : '❌ 失败');
  console.log('  2. 用户故事API:', storiesResult.success ? '✅ 成功' : '❌ 失败');
  console.log('  3. 前端权限检查:', permissionResult ? '✅ 通过' : '❌ 失败');
  console.log('  4. 前端页面访问:', pageResult.success ? '✅ 成功' : '❌ 失败');
  
  if (pageResult.success && pageResult.needsLogin) {
    console.log('\n❌ 问题确认: 前端页面仍显示"需要登录访问"');
  }
  
  console.log('\n🔍 问题分析:');
  
  if (loginResult.success && storiesResult.success && permissionResult && pageResult.needsLogin) {
    console.log('📊 问题类型: 前端权限检查逻辑问题');
    console.log('💡 可能原因:');
    console.log('  - 前端localStorage中的用户数据格式不正确');
    console.log('  - 权限检查条件过于严格');
    console.log('  - 用户状态同步问题');
    console.log('  - 页面组件状态管理问题');
  } else if (!loginResult.success) {
    console.log('📊 问题类型: 用户登录API问题');
  } else if (!storiesResult.success) {
    console.log('📊 问题类型: 用户故事API问题');
  } else if (!permissionResult) {
    console.log('📊 问题类型: 权限检查逻辑问题');
  }
  
  console.log('\n🛠️ 建议修复方案:');
  console.log('  1. 检查前端用户状态管理');
  console.log('  2. 验证localStorage数据格式');
  console.log('  3. 简化权限检查逻辑');
  console.log('  4. 添加更多调试日志');
}

// 主函数
async function main() {
  try {
    // 步骤1: 测试登录
    const loginResult = await testUserLogin();
    
    let storiesResult = { success: false };
    let permissionResult = false;
    
    if (loginResult.success) {
      // 步骤2: 测试用户故事API
      storiesResult = await testUserStoriesAPI(
        loginResult.userData.uuid, 
        loginResult.sessionId
      );
      
      // 步骤3: 测试权限检查
      permissionResult = testFrontendPermissionLogic(loginResult.userData);
    }
    
    // 步骤4: 测试前端页面
    const pageResult = await testFrontendPageAccess();
    
    // 步骤5: 综合分析
    analyzeResults(loginResult, storiesResult, permissionResult, pageResult);
    
  } catch (error) {
    console.log('💥 测试过程中发生错误:', error.message);
  }
}

// 执行测试
main();

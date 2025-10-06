#!/usr/bin/env node

/**
 * API路由测试脚本
 * 用于验证后端API路由是否正确注册和工作
 */

const BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 测试路由列表
const routes = [
  // 基础路由
  { path: '/api/health', method: 'GET', expectStatus: 200, description: '健康检查' },
  
  // 简化管理员路由
  { path: '/api/simple-admin/dashboard', method: 'GET', expectStatus: 401, description: 'Simple Admin Dashboard (需要认证)' },
  { path: '/api/simple-admin/ai-moderation/config', method: 'GET', expectStatus: 401, description: 'AI审核配置 (需要认证)' },
  
  // 用户画像管理路由 (已迁移到simple-admin)
  { path: '/api/simple-admin/user-profile/tag-statistics?questionnaire_id=dev-daily-V1', method: 'GET', expectStatus: 401, description: '用户画像标签统计 (需要认证)' },
  { path: '/api/simple-admin/user-profile/emotion-statistics?questionnaire_id=dev-daily-V1', method: 'GET', expectStatus: 401, description: '用户画像情绪统计 (需要认证)' },

  // 人工审核队列路由 (已迁移到simple-admin)
  { path: '/api/simple-admin/manual-review-queue', method: 'GET', expectStatus: 401, description: '人工审核队列 (需要认证)' },
];

async function testRoute(route) {
  try {
    console.log(`\n🧪 测试: ${route.description}`);
    console.log(`   路径: ${route.method} ${route.path}`);
    
    const response = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const status = response.status;
    const isExpected = status === route.expectStatus;
    
    console.log(`   状态: ${status} ${isExpected ? '✅' : '❌'} (期望: ${route.expectStatus})`);
    
    if (!isExpected) {
      const text = await response.text();
      console.log(`   响应: ${text}`);
    }
    
    return { route, status, isExpected };
  } catch (error) {
    console.log(`   错误: ❌ ${error.message}`);
    return { route, status: 'ERROR', isExpected: false, error };
  }
}

async function runTests() {
  console.log('🚀 开始API路由测试...\n');
  console.log(`📍 测试目标: ${BASE_URL}`);
  
  const results = [];
  
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 汇总结果
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.isExpected).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.isExpected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.route.description}`);
    if (!result.isExpected) {
      console.log(`     期望: ${result.route.expectStatus}, 实际: ${result.status}`);
    }
  });
  
  console.log('='.repeat(60));
  console.log(`📈 通过率: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查路由配置');
  }
}

// 运行测试
runTests().catch(console.error);

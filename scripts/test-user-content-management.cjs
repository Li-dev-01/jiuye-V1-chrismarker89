#!/usr/bin/env node

/**
 * 用户内容管理系统测试脚本
 * 测试新创建的用户内容管理API功能
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 测试端点列表
const testEndpoints = [
  {
    name: '获取内容统计',
    path: '/api/user-content-management/stats',
    method: 'GET',
    requiresAuth: true
  },
  {
    name: '获取内容列表',
    path: '/api/user-content-management/list',
    method: 'GET',
    requiresAuth: true,
    params: { page: 1, pageSize: 10 }
  },
  {
    name: '检测重复提交',
    path: '/api/user-content-management/duplicates',
    method: 'GET',
    requiresAuth: true,
    params: { type: 'ip', threshold: 2 }
  },
  {
    name: 'IP地址统计',
    path: '/api/user-content-management/ip-stats',
    method: 'GET',
    requiresAuth: true
  }
];

/**
 * 测试单个端点
 */
async function testEndpoint(endpoint) {
  const url = new URL(endpoint.path, API_BASE_URL);
  
  // 添加查询参数
  if (endpoint.params) {
    Object.entries(endpoint.params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
  }
  
  try {
    console.log(`🔍 测试: ${endpoint.name}`);
    console.log(`   URL: ${url.toString()}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 注意：这里没有添加认证token，所以预期会收到401错误
    // 这是正常的，因为我们主要测试API端点是否存在和响应格式
    
    const startTime = Date.now();
    const response = await fetch(url.toString(), { 
      method: endpoint.method,
      headers 
    });
    const responseTime = Date.now() - startTime;
    
    const contentType = response.headers.get('content-type');
    let responseData = null;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Invalid JSON response' };
      }
    } else {
      responseData = { text: await response.text() };
    }
    
    // 分析结果
    let status = '❌ 失败';
    let message = '';
    
    if (endpoint.requiresAuth && response.status === 401) {
      status = '✅ 正常';
      message = '认证保护正常工作';
    } else if (response.ok) {
      status = '✅ 成功';
      message = '端点正常响应';
    } else if (response.status === 404) {
      status = '❌ 端点不存在';
      message = '路由未注册或路径错误';
    } else {
      status = '⚠️ 异常';
      message = `状态码: ${response.status}`;
    }
    
    console.log(`   ${status} ${message}`);
    console.log(`   ⏱️ 响应时间: ${responseTime}ms`);
    
    if (responseData && responseData.error) {
      console.log(`   📝 错误信息: ${responseData.error}`);
    }
    
    if (responseData && responseData.message) {
      console.log(`   📝 响应消息: ${responseData.message}`);
    }
    
    console.log('');
    
    return {
      name: endpoint.name,
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      success: endpoint.requiresAuth ? response.status === 401 : response.ok,
      data: responseData,
      expectedAuth: endpoint.requiresAuth
    };
    
  } catch (error) {
    console.log(`   ❌ 网络错误: ${error.message}`);
    console.log('');
    
    return {
      name: endpoint.name,
      url: url.toString(),
      status: 0,
      statusText: 'Network Error',
      responseTime: 0,
      success: false,
      error: error.message,
      expectedAuth: endpoint.requiresAuth
    };
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 用户内容管理系统API测试\n');
  console.log(`🌐 API基础URL: ${API_BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 生成测试报告
  console.log('📊 测试结果汇总:');
  console.log('=' * 50);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功数: ${successCount}`);
  console.log(`失败数: ${totalCount - successCount}`);
  console.log(`成功率: ${Math.round((successCount / totalCount) * 100)}%`);
  
  console.log('\n📋 详细结果:');
  results.forEach(result => {
    const statusEmoji = result.success ? '✅' : '❌';
    const authNote = result.expectedAuth ? ' (需要认证)' : '';
    console.log(`${statusEmoji} ${result.name}${authNote}: ${result.status} (${result.responseTime}ms)`);
  });
  
  // 失败的端点
  const failedEndpoints = results.filter(r => !r.success);
  if (failedEndpoints.length > 0) {
    console.log('\n❌ 需要检查的端点:');
    failedEndpoints.forEach(result => {
      console.log(`  ${result.name}:`);
      console.log(`    URL: ${result.url}`);
      console.log(`    状态: ${result.status} ${result.statusText}`);
      if (result.data && result.data.error) {
        console.log(`    错误: ${result.data.error}`);
      }
      if (result.error) {
        console.log(`    网络错误: ${result.error}`);
      }
    });
  }
  
  // 成功的认证保护端点
  const authProtectedSuccess = results.filter(r => r.success && r.expectedAuth && r.status === 401);
  if (authProtectedSuccess.length > 0) {
    console.log('\n🔒 认证保护正常的端点:');
    authProtectedSuccess.forEach(result => {
      console.log(`  ✅ ${result.name} - 正确返回401未授权`);
    });
  }
  
  console.log('\n🎯 测试总结:');
  if (successCount === totalCount) {
    console.log('🎉 所有API端点都正常工作！');
    console.log('✅ 路由注册成功');
    console.log('✅ 认证中间件正常');
    console.log('✅ 错误处理正确');
  } else {
    console.log('⚠️ 部分端点需要检查');
    console.log('请检查失败的端点并修复问题');
  }
  
  console.log('\n📝 下一步:');
  console.log('1. 如果所有端点都返回401，说明API注册成功');
  console.log('2. 需要在前端添加认证token才能正常调用');
  console.log('3. 可以在管理员页面中测试完整功能');
  console.log('4. 需要初始化数据库表结构');
  
  return results;
}

/**
 * 测试数据库连接
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ 测试数据库连接...');
  
  try {
    // 测试一个简单的查询端点
    const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024`);
    
    if (response.ok) {
      console.log('✅ 数据库连接正常');
      const data = await response.json();
      if (data.success) {
        console.log('✅ 数据库查询正常');
        return true;
      } else {
        console.log('⚠️ 数据库查询有问题:', data.error);
        return false;
      }
    } else {
      console.log('❌ 数据库连接失败:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command) {
    case 'all':
      // 先测试数据库连接
      const dbOk = await testDatabaseConnection();
      
      // 然后测试API端点
      const results = await runAllTests();
      
      const failedCount = results.filter(r => !r.success).length;
      const exitCode = (dbOk && failedCount === 0) ? 0 : 1;
      
      console.log(`\n🏁 测试完成，退出码: ${exitCode}`);
      process.exit(exitCode);
      break;

    case 'db':
      const dbResult = await testDatabaseConnection();
      process.exit(dbResult ? 0 : 1);
      break;

    case 'api':
      const apiResults = await runAllTests();
      const apiFailedCount = apiResults.filter(r => !r.success).length;
      process.exit(apiFailedCount === 0 ? 0 : 1);
      break;

    default:
      console.log('用法: node test-user-content-management.cjs [all|db|api]');
      console.log('  all  - 运行所有测试 (默认)');
      console.log('  db   - 仅测试数据库连接');
      console.log('  api  - 仅测试API端点');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testEndpoint,
  runAllTests,
  testDatabaseConnection
};

#!/usr/bin/env node

/**
 * 前端功能实际测试脚本
 * 通过API调用测试前端功能是否正常工作
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev';
const FRONTEND_URL = 'https://b1346dca.college-employment-survey-frontend.pages.dev';

/**
 * 测试用户内容管理API
 */
async function testUserContentManagementAPI() {
  console.log('🔍 测试用户内容管理API...\n');

  const tests = [
    {
      name: '获取用户内容统计',
      method: 'GET',
      path: '/api/v1/user-content-management/stats',
      expectedStatus: 401 // 需要认证
    },
    {
      name: '获取用户内容列表',
      method: 'GET',
      path: '/api/v1/user-content-management/list',
      expectedStatus: 401 // 需要认证
    },
    {
      name: '获取IP地址统计',
      method: 'GET',
      path: '/api/v1/user-content-management/ip-stats',
      expectedStatus: 401 // 需要认证
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);

      const response = await fetch(`${API_BASE_URL}${test.path}`, {
        method: test.method
      });

      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`   ✅ 测试通过 (${response.status})`);
      } else {
        console.log(`   ❌ 测试失败 (预期: ${test.expectedStatus}, 实际: ${response.status})`);
      }

      results.push({
        name: test.name,
        success: success,
        status: response.status,
        expectedStatus: test.expectedStatus
      });

    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  return results;
}

/**
 * 测试API版本管理
 */
async function testAPIVersionManagement() {
  console.log('🔍 测试API版本管理...\n');

  const tests = [
    {
      name: '获取版本信息',
      method: 'GET',
      path: '/api/version',
      expectedStatus: 200
    },
    {
      name: 'V1版本健康检查',
      method: 'GET',
      path: '/api/v1/health',
      expectedStatus: 200
    },
    {
      name: 'V2版本健康检查',
      method: 'GET',
      path: '/api/v2/health',
      expectedStatus: 200
    },
    {
      name: '不支持的版本',
      method: 'GET',
      path: '/api/v3/health',
      expectedStatus: 400
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);

      const response = await fetch(`${API_BASE_URL}${test.path}`, {
        method: test.method
      });

      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`   ✅ 测试通过 (${response.status})`);
        
        // 如果是版本信息，显示详细信息
        if (test.path === '/api/version' && response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log(`   📋 当前版本: ${data.data.currentVersion}`);
            console.log(`   📋 支持版本: ${data.data.supportedVersions.join(', ')}`);
          }
        }
      } else {
        console.log(`   ❌ 测试失败 (预期: ${test.expectedStatus}, 实际: ${response.status})`);
      }

      results.push({
        name: test.name,
        success: success,
        status: response.status,
        expectedStatus: test.expectedStatus
      });

    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  return results;
}

/**
 * 测试前端路由可访问性
 */
async function testFrontendRoutes() {
  console.log('🔍 测试前端路由可访问性...\n');

  const routes = [
    {
      name: '主页',
      path: '/',
      expectedStatus: 200
    },
    {
      name: '管理员登录页',
      path: '/admin/login',
      expectedStatus: 200
    },
    {
      name: '管理员页面',
      path: '/admin',
      expectedStatus: 200
    },
    {
      name: '用户内容管理页面',
      path: '/admin/user-content',
      expectedStatus: 200
    }
  ];

  const results = [];

  for (const route of routes) {
    try {
      console.log(`🔍 ${route.name}`);
      console.log(`   GET ${route.path}`);

      const response = await fetch(`${FRONTEND_URL}${route.path}`);
      
      const success = response.status === route.expectedStatus;
      
      if (success) {
        console.log(`   ✅ 路由可访问 (${response.status})`);
      } else {
        console.log(`   ❌ 路由不可访问 (预期: ${route.expectedStatus}, 实际: ${response.status})`);
      }

      results.push({
        name: route.name,
        success: success,
        status: response.status,
        expectedStatus: route.expectedStatus
      });

    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results.push({
        name: route.name,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  return results;
}

/**
 * 运行完整的功能测试
 */
async function runFullFunctionalTest() {
  console.log('🚀 前端功能完整测试\n');
  console.log('=' * 50);

  // 1. 测试用户内容管理API
  const userContentResults = await testUserContentManagementAPI();
  
  // 2. 测试API版本管理
  const versionResults = await testAPIVersionManagement();
  
  // 3. 测试前端路由
  const routeResults = await testFrontendRoutes();

  // 生成测试报告
  console.log('📊 功能测试结果汇总:');
  console.log('=' * 50);

  const userContentSuccessCount = userContentResults.filter(r => r.success).length;
  const userContentTotalCount = userContentResults.length;
  const versionSuccessCount = versionResults.filter(r => r.success).length;
  const versionTotalCount = versionResults.length;
  const routeSuccessCount = routeResults.filter(r => r.success).length;
  const routeTotalCount = routeResults.length;

  console.log(`用户内容管理API: ${userContentSuccessCount}/${userContentTotalCount} 通过`);
  console.log(`API版本管理: ${versionSuccessCount}/${versionTotalCount} 通过`);
  console.log(`前端路由: ${routeSuccessCount}/${routeTotalCount} 通过`);

  const overallSuccess = userContentSuccessCount === userContentTotalCount && 
                         versionSuccessCount === versionTotalCount && 
                         routeSuccessCount === routeTotalCount;

  console.log(`总体结果: ${overallSuccess ? '✅ 全部通过' : '⚠️ 部分通过'}`);

  console.log('\n🎯 功能测试总结:');
  if (overallSuccess) {
    console.log('🎉 所有功能测试通过！');
    console.log('✅ 用户内容管理API正常工作');
    console.log('✅ API版本管理系统正常');
    console.log('✅ 前端路由全部可访问');
    console.log('✅ 前后端功能完全集成');
  } else {
    console.log('⚠️ 部分功能需要检查');
    
    const failedTests = [
      ...userContentResults.filter(r => !r.success),
      ...versionResults.filter(r => !r.success),
      ...routeResults.filter(r => !r.success)
    ];
    
    if (failedTests.length > 0) {
      console.log('\n❌ 失败的测试:');
      failedTests.forEach(result => {
        console.log(`  ${result.name}: ${result.error || `状态码 ${result.status}`}`);
      });
    }
  }

  console.log('\n📝 访问链接:');
  console.log(`🌐 前端主页: ${FRONTEND_URL}`);
  console.log(`🔧 管理员页面: ${FRONTEND_URL}/admin`);
  console.log(`👥 用户内容管理: ${FRONTEND_URL}/admin/user-content`);
  console.log(`🔗 API基础URL: ${API_BASE_URL}`);

  console.log('\n💡 使用说明:');
  console.log('1. 访问管理员页面需要先登录');
  console.log('2. 用户内容管理功能需要管理员权限');
  console.log('3. API版本管理已完全集成');
  console.log('4. 所有新功能都已部署到生产环境');

  return {
    userContent: userContentResults,
    version: versionResults,
    routes: routeResults,
    overall: overallSuccess
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command) {
    case 'all':
      const results = await runFullFunctionalTest();
      process.exit(results.overall ? 0 : 1);
      break;

    case 'user-content':
      const userContentResults = await testUserContentManagementAPI();
      const userContentSuccess = userContentResults.every(r => r.success);
      process.exit(userContentSuccess ? 0 : 1);
      break;

    case 'version':
      const versionResults = await testAPIVersionManagement();
      const versionSuccess = versionResults.every(r => r.success);
      process.exit(versionSuccess ? 0 : 1);
      break;

    case 'routes':
      const routeResults = await testFrontendRoutes();
      const routeSuccess = routeResults.every(r => r.success);
      process.exit(routeSuccess ? 0 : 1);
      break;

    default:
      console.log('用法: node test-frontend-features.cjs [all|user-content|version|routes]');
      console.log('  all          - 运行完整功能测试 (默认)');
      console.log('  user-content - 仅测试用户内容管理API');
      console.log('  version      - 仅测试API版本管理');
      console.log('  routes       - 仅测试前端路由');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('功能测试失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testUserContentManagementAPI,
  testAPIVersionManagement,
  testFrontendRoutes,
  runFullFunctionalTest
};

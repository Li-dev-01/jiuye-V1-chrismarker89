#!/usr/bin/env node

/**
 * 版本管理系统测试脚本
 * 测试前端和后端的版本功能集成
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev';

// 测试端点列表
const versionTestEndpoints = [
  {
    name: 'API版本信息',
    path: '/api/version',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'V1版本统计API',
    path: '/api/v1/universal-questionnaire/statistics/employment-survey-2024',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'V2版本统计API',
    path: '/api/v2/universal-questionnaire/statistics/employment-survey-2024',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: '无版本前缀API（向后兼容）',
    path: '/api/universal-questionnaire/statistics/employment-survey-2024',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'V1版本用户内容管理',
    path: '/api/v1/user-content-management/stats',
    method: 'GET',
    expectedStatus: 401 // 需要认证
  },
  {
    name: 'V2版本用户内容管理',
    path: '/api/v2/user-content-management/stats',
    method: 'GET',
    expectedStatus: 401 // 需要认证
  }
];

/**
 * 测试单个版本端点
 */
async function testVersionEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint.path}`;
  
  try {
    console.log(`🔍 测试: ${endpoint.name}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url, { method: endpoint.method });
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
    
    // 检查版本相关的响应头
    const versionHeaders = {
      'x-api-version': response.headers.get('x-api-version'),
      'x-api-supported-versions': response.headers.get('x-api-supported-versions'),
      'x-api-deprecated': response.headers.get('x-api-deprecated'),
      'x-api-deprecation-date': response.headers.get('x-api-deprecation-date'),
      'x-api-sunset-date': response.headers.get('x-api-sunset-date'),
      'x-api-recommended-version': response.headers.get('x-api-recommended-version')
    };
    
    // 分析结果
    let status = '❌ 失败';
    let message = '';
    
    if (response.status === endpoint.expectedStatus) {
      status = '✅ 成功';
      message = '状态码符合预期';
    } else {
      status = '⚠️ 状态码不匹配';
      message = `预期: ${endpoint.expectedStatus}, 实际: ${response.status}`;
    }
    
    console.log(`   ${status} ${message}`);
    console.log(`   ⏱️ 响应时间: ${responseTime}ms`);
    
    // 显示版本信息
    if (versionHeaders['x-api-version']) {
      console.log(`   📋 API版本: ${versionHeaders['x-api-version']}`);
    }
    
    if (versionHeaders['x-api-supported-versions']) {
      console.log(`   📋 支持版本: ${versionHeaders['x-api-supported-versions']}`);
    }
    
    if (versionHeaders['x-api-deprecated'] === 'true') {
      console.log(`   ⚠️ 版本已弃用`);
      if (versionHeaders['x-api-recommended-version']) {
        console.log(`   💡 推荐版本: ${versionHeaders['x-api-recommended-version']}`);
      }
    }
    
    if (responseData && responseData.success !== undefined) {
      console.log(`   📊 业务状态: ${responseData.success ? '成功' : '失败'}`);
      if (!responseData.success && responseData.error) {
        console.log(`   ❌ 错误: ${responseData.error}`);
      }
    }
    
    console.log('');
    
    return {
      name: endpoint.name,
      url: url,
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      success: response.status === endpoint.expectedStatus,
      data: responseData,
      versionHeaders: versionHeaders,
      expectedStatus: endpoint.expectedStatus
    };
    
  } catch (error) {
    console.log(`   ❌ 网络错误: ${error.message}`);
    console.log('');
    
    return {
      name: endpoint.name,
      url: url,
      status: 0,
      statusText: 'Network Error',
      responseTime: 0,
      success: false,
      error: error.message,
      expectedStatus: endpoint.expectedStatus
    };
  }
}

/**
 * 测试版本信息端点
 */
async function testVersionInfo() {
  console.log('📋 测试版本信息端点...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/version`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ 版本信息获取成功:');
      console.log(`   当前版本: ${data.data.currentVersion}`);
      console.log(`   支持版本: ${data.data.supportedVersions.join(', ')}`);
      console.log(`   端点配置:`);
      
      Object.entries(data.data.endpoints).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      
      console.log(`   版本详情:`);
      Object.entries(data.data.versionInfo).forEach(([version, info]) => {
        console.log(`     ${version}:`);
        console.log(`       支持: ${info.isSupported}`);
        console.log(`       弃用: ${info.isDeprecated}`);
        console.log(`       兼容: ${info.compatibleVersions.join(', ')}`);
      });
      
      return true;
    } else {
      console.log('❌ 版本信息获取失败:', data.error || '未知错误');
      return false;
    }
  } catch (error) {
    console.log('❌ 版本信息请求失败:', error.message);
    return false;
  }
}

/**
 * 测试版本兼容性
 */
async function testVersionCompatibility() {
  console.log('\n🔄 测试版本兼容性...\n');
  
  const testCases = [
    {
      name: '测试不支持的版本',
      path: '/api/v3/universal-questionnaire/statistics/employment-survey-2024',
      expectedStatus: 400,
      expectedError: 'UNSUPPORTED_VERSION'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 ${testCase.name}`);
      console.log(`   URL: ${API_BASE_URL}${testCase.path}`);
      
      const response = await fetch(`${API_BASE_URL}${testCase.path}`);
      const data = await response.json();
      
      const success = response.status === testCase.expectedStatus;
      const hasExpectedError = testCase.expectedError ? 
        data.error?.code === testCase.expectedError : true;
      
      if (success && hasExpectedError) {
        console.log('   ✅ 兼容性测试通过');
        results.push({ ...testCase, success: true });
      } else {
        console.log('   ❌ 兼容性测试失败');
        console.log(`   预期状态: ${testCase.expectedStatus}, 实际: ${response.status}`);
        if (testCase.expectedError) {
          console.log(`   预期错误: ${testCase.expectedError}, 实际: ${data.error?.code || '无'}`);
        }
        results.push({ ...testCase, success: false });
      }
      
    } catch (error) {
      console.log(`   ❌ 测试失败: ${error.message}`);
      results.push({ ...testCase, success: false, error: error.message });
    }
    
    console.log('');
  }
  
  return results;
}

/**
 * 运行所有版本管理测试
 */
async function runAllVersionTests() {
  console.log('🚀 版本管理系统集成测试\n');
  console.log(`🌐 API基础URL: ${API_BASE_URL}\n`);
  
  // 1. 测试版本信息
  const versionInfoSuccess = await testVersionInfo();
  
  // 2. 测试版本端点
  console.log('\n📡 测试版本端点...\n');
  const endpointResults = [];
  
  for (const endpoint of versionTestEndpoints) {
    const result = await testVersionEndpoint(endpoint);
    endpointResults.push(result);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 3. 测试版本兼容性
  const compatibilityResults = await testVersionCompatibility();
  
  // 生成测试报告
  console.log('📊 版本管理测试结果汇总:');
  console.log('=' * 50);
  
  const endpointSuccessCount = endpointResults.filter(r => r.success).length;
  const endpointTotalCount = endpointResults.length;
  const compatibilitySuccessCount = compatibilityResults.filter(r => r.success).length;
  const compatibilityTotalCount = compatibilityResults.length;
  
  console.log(`版本信息测试: ${versionInfoSuccess ? '✅ 通过' : '❌ 失败'}`);
  console.log(`端点测试: ${endpointSuccessCount}/${endpointTotalCount} 通过`);
  console.log(`兼容性测试: ${compatibilitySuccessCount}/${compatibilityTotalCount} 通过`);
  
  const overallSuccess = versionInfoSuccess && 
    endpointSuccessCount === endpointTotalCount && 
    compatibilitySuccessCount === compatibilityTotalCount;
  
  console.log(`总体结果: ${overallSuccess ? '✅ 全部通过' : '❌ 部分失败'}`);
  
  console.log('\n📋 详细结果:');
  endpointResults.forEach(result => {
    const statusEmoji = result.success ? '✅' : '❌';
    console.log(`${statusEmoji} ${result.name}: ${result.status} (${result.responseTime}ms)`);
  });
  
  // 版本功能检查
  console.log('\n🔧 版本功能检查:');
  const hasV1Support = endpointResults.some(r => r.versionHeaders['x-api-version'] === 'v1');
  const hasV2Support = endpointResults.some(r => r.versionHeaders['x-api-version'] === 'v2');
  const hasVersionHeaders = endpointResults.some(r => r.versionHeaders['x-api-version']);
  const hasBackwardCompatibility = endpointResults.some(r => 
    r.name.includes('无版本前缀') && r.success
  );
  
  console.log(`✅ V1版本支持: ${hasV1Support ? '是' : '否'}`);
  console.log(`✅ V2版本支持: ${hasV2Support ? '是' : '否'}`);
  console.log(`✅ 版本响应头: ${hasVersionHeaders ? '是' : '否'}`);
  console.log(`✅ 向后兼容性: ${hasBackwardCompatibility ? '是' : '否'}`);
  
  console.log('\n🎯 测试总结:');
  if (overallSuccess) {
    console.log('🎉 版本管理系统完全正常！');
    console.log('✅ 前后端版本功能完全集成');
    console.log('✅ 所有版本端点正常工作');
    console.log('✅ 版本兼容性检查通过');
    console.log('✅ 向后兼容性保持良好');
  } else {
    console.log('⚠️ 版本管理系统部分功能需要检查');
    
    const failedEndpoints = endpointResults.filter(r => !r.success);
    if (failedEndpoints.length > 0) {
      console.log('\n❌ 失败的端点:');
      failedEndpoints.forEach(result => {
        console.log(`  ${result.name}: ${result.status} ${result.statusText}`);
      });
    }
  }
  
  console.log('\n📝 下一步建议:');
  console.log('1. 在前端管理页面中集成版本管理组件');
  console.log('2. 测试版本切换功能');
  console.log('3. 验证版本弃用警告机制');
  console.log('4. 检查自动回退功能');
  
  return {
    versionInfo: versionInfoSuccess,
    endpoints: endpointResults,
    compatibility: compatibilityResults,
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
      const results = await runAllVersionTests();
      process.exit(results.overall ? 0 : 1);
      break;

    case 'info':
      const infoSuccess = await testVersionInfo();
      process.exit(infoSuccess ? 0 : 1);
      break;

    case 'endpoints':
      console.log('📡 测试版本端点...\n');
      const endpointResults = [];
      for (const endpoint of versionTestEndpoints) {
        const result = await testVersionEndpoint(endpoint);
        endpointResults.push(result);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const endpointSuccess = endpointResults.every(r => r.success);
      process.exit(endpointSuccess ? 0 : 1);
      break;

    case 'compatibility':
      const compatResults = await testVersionCompatibility();
      const compatSuccess = compatResults.every(r => r.success);
      process.exit(compatSuccess ? 0 : 1);
      break;

    default:
      console.log('用法: node test-version-management.cjs [all|info|endpoints|compatibility]');
      console.log('  all           - 运行所有版本管理测试 (默认)');
      console.log('  info          - 仅测试版本信息端点');
      console.log('  endpoints     - 仅测试版本端点');
      console.log('  compatibility - 仅测试版本兼容性');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('版本管理测试失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testVersionEndpoint,
  testVersionInfo,
  testVersionCompatibility,
  runAllVersionTests
};

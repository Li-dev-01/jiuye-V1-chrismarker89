#!/usr/bin/env node

/**
 * 管理员页面API功能测试脚本
 * 测试所有管理员页面的API端点是否正常工作
 */

const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const FRONTEND_URL = 'https://9019b3f6.college-employment-survey-frontend-l84.pages.dev';

// 测试结果存储
const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  frontendUrl: FRONTEND_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// 管理员页面API端点列表
const adminApiEndpoints = [
  // 基础健康检查
  { name: '健康检查', path: '/api/health', method: 'GET', expectedStatus: 200, requiresAuth: false },
  
  // 管理员仪表板
  { name: '仪表板统计', path: '/api/admin/dashboard/stats', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 用户管理
  { name: '用户列表', path: '/api/admin/users?page=1&pageSize=10', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '审核员列表', path: '/api/admin/reviewers?page=1&pageSize=10', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 问卷管理
  { name: '问卷列表', path: '/api/admin/questionnaires?page=1&pageSize=10', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 内容管理
  { name: '内容分类', path: '/api/admin/content/categories', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '内容标签', path: '/api/admin/content/tags', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 用户内容管理
  { name: '用户内容列表', path: '/api/user-content-management/list?page=1&pageSize=20&status=active', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '用户内容统计', path: '/api/user-content-management/stats', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 安全管理
  { name: 'IP访问控制', path: '/api/admin/ip-access-control/rules', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '智能安全', path: '/api/admin/intelligent-security/anomalies', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '登录监控', path: '/api/admin/login-monitor/sessions', method: 'GET', expectedStatus: 401, requiresAuth: true },
  
  // 系统管理
  { name: '双因子认证', path: '/api/admin/two-factor-auth/status', method: 'GET', expectedStatus: 401, requiresAuth: true },
  { name: '用户登录历史', path: '/api/admin/user-login-history/history', method: 'GET', expectedStatus: 401, requiresAuth: true }
];

// HTTP请求函数
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Admin-API-Test/1.0',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 执行单个API测试
async function testApiEndpoint(endpoint) {
  const startTime = Date.now();
  const fullUrl = BASE_URL + endpoint.path;
  
  console.log(`🧪 测试: ${endpoint.name} - ${endpoint.method} ${endpoint.path}`);
  
  try {
    const response = await makeRequest(fullUrl, endpoint.method);
    const responseTime = Date.now() - startTime;
    
    const testResult = {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      expectedStatus: endpoint.expectedStatus,
      actualStatus: response.statusCode,
      responseTime: responseTime,
      requiresAuth: endpoint.requiresAuth,
      success: response.statusCode === endpoint.expectedStatus,
      timestamp: new Date().toISOString()
    };

    // 尝试解析响应体
    try {
      testResult.responseBody = JSON.parse(response.body);
    } catch (e) {
      testResult.responseBody = response.body.substring(0, 200);
    }

    if (testResult.success) {
      console.log(`  ✅ 通过 - 状态码: ${response.statusCode}, 响应时间: ${responseTime}ms`);
    } else {
      console.log(`  ❌ 失败 - 期望: ${endpoint.expectedStatus}, 实际: ${response.statusCode}, 响应时间: ${responseTime}ms`);
    }

    return testResult;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`  ❌ 错误 - ${error.message}, 响应时间: ${responseTime}ms`);
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      expectedStatus: endpoint.expectedStatus,
      actualStatus: 'ERROR',
      responseTime: responseTime,
      requiresAuth: endpoint.requiresAuth,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// 测试前端页面访问
async function testFrontendAccess() {
  console.log(`🌐 测试前端页面访问: ${FRONTEND_URL}`);
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    const success = response.statusCode === 200;
    
    console.log(`  ${success ? '✅' : '❌'} 前端页面 - 状态码: ${response.statusCode}`);
    
    return {
      name: '前端页面访问',
      path: '/',
      method: 'GET',
      expectedStatus: 200,
      actualStatus: response.statusCode,
      success: success,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.log(`  ❌ 前端页面访问失败 - ${error.message}`);
    return {
      name: '前端页面访问',
      path: '/',
      method: 'GET',
      expectedStatus: 200,
      actualStatus: 'ERROR',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始管理员页面API功能测试');
  console.log(`📍 后端API地址: ${BASE_URL}`);
  console.log(`📍 前端页面地址: ${FRONTEND_URL}`);
  console.log(`⏰ 测试时间: ${testResults.timestamp}`);
  console.log('=' .repeat(80));

  // 测试前端页面访问
  const frontendTest = await testFrontendAccess();
  testResults.tests.push(frontendTest);

  console.log('\n📋 开始API端点测试:');
  
  // 测试所有API端点
  for (const endpoint of adminApiEndpoints) {
    const result = await testApiEndpoint(endpoint);
    testResults.tests.push(result);
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 计算测试统计
  testResults.summary.total = testResults.tests.length;
  testResults.summary.passed = testResults.tests.filter(t => t.success).length;
  testResults.summary.failed = testResults.summary.total - testResults.summary.passed;
  testResults.summary.successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);

  // 输出测试总结
  console.log('\n' + '=' .repeat(80));
  console.log('📊 测试总结:');
  console.log(`  总测试数: ${testResults.summary.total}`);
  console.log(`  通过数: ${testResults.summary.passed}`);
  console.log(`  失败数: ${testResults.summary.failed}`);
  console.log(`  成功率: ${testResults.summary.successRate}%`);

  // 保存测试结果
  const reportPath = 'docs/ADMIN_API_TEST_REPORT.md';
  const jsonPath = 'docs/ADMIN_API_TEST_DATA.json';
  
  // 保存JSON数据
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
  
  // 生成Markdown报告
  const markdownReport = generateMarkdownReport(testResults);
  fs.writeFileSync(reportPath, markdownReport);
  
  console.log(`\n📄 测试报告已保存: ${reportPath}`);
  console.log(`📄 测试数据已保存: ${jsonPath}`);
  
  // 根据测试结果设置退出码
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 生成Markdown报告
function generateMarkdownReport(results) {
  const { summary, tests, timestamp, baseUrl, frontendUrl } = results;
  
  let report = `# 管理员页面API功能测试报告\n\n`;
  report += `**测试时间**: ${timestamp}\n`;
  report += `**后端API地址**: ${baseUrl}\n`;
  report += `**前端页面地址**: ${frontendUrl}\n\n`;
  
  report += `## 📊 测试总结\n\n`;
  report += `- **总测试数**: ${summary.total}\n`;
  report += `- **通过数**: ${summary.passed}\n`;
  report += `- **失败数**: ${summary.failed}\n`;
  report += `- **成功率**: ${summary.successRate}%\n\n`;
  
  report += `## 📋 详细测试结果\n\n`;
  report += `| 测试项目 | 路径 | 方法 | 期望状态 | 实际状态 | 响应时间 | 结果 |\n`;
  report += `|---------|------|------|----------|----------|----------|------|\n`;
  
  tests.forEach(test => {
    const status = test.success ? '✅ 通过' : '❌ 失败';
    const responseTime = test.responseTime ? `${test.responseTime}ms` : 'N/A';
    report += `| ${test.name} | ${test.path} | ${test.method} | ${test.expectedStatus} | ${test.actualStatus} | ${responseTime} | ${status} |\n`;
  });
  
  return report;
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});

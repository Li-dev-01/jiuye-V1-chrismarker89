#!/usr/bin/env node

/**
 * 管理员认证修复测试脚本
 * 测试管理员API认证流程和数据加载
 */

const https = require('https');
const fs = require('fs');

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const FRONTEND_URL = 'https://016b7dc4.college-employment-survey-frontend-l84.pages.dev';

// 测试结果存储
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  },
  tests: []
};

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 添加测试结果
function addTestResult(name, passed, details) {
  testResults.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// 测试1: 前端页面访问
async function testFrontendAccess() {
  try {
    const response = await makeRequest(FRONTEND_URL);
    const passed = response.statusCode === 200;
    addTestResult(
      '前端页面访问',
      passed,
      `状态码: ${response.statusCode}`
    );
    return passed;
  } catch (error) {
    addTestResult('前端页面访问', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试2: 管理员token生成
async function testAdminTokenGeneration() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/auth/admin/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const passed = response.statusCode === 200 && response.data?.success;
    addTestResult(
      '管理员token生成',
      passed,
      passed ? `Token: ${response.data.data.token.substring(0, 20)}...` : `错误: ${response.data?.message || '未知错误'}`
    );
    
    return passed ? response.data.data.token : null;
  } catch (error) {
    addTestResult('管理员token生成', false, `错误: ${error.message}`);
    return null;
  }
}

// 测试3: 管理员API访问
async function testAdminAPIAccess(token) {
  if (!token) {
    addTestResult('管理员API访问', false, '缺少认证token');
    return false;
  }

  const apiEndpoints = [
    { name: '仪表板统计', path: '/api/admin/dashboard/stats' },
    { name: '用户列表', path: '/api/admin/users?page=1&pageSize=10' },
    { name: '问卷列表', path: '/api/admin/questionnaires?page=1&pageSize=10' },
    { name: '审核员列表', path: '/api/admin/reviewers?page=1&pageSize=10' }
  ];

  let allPassed = true;

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest(`${API_BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const passed = response.statusCode === 200 && response.data?.success;
      addTestResult(
        `${endpoint.name} API`,
        passed,
        passed ? `数据获取成功` : `状态码: ${response.statusCode}, 错误: ${response.data?.message || '未知错误'}`
      );
      
      if (!passed) allPassed = false;
    } catch (error) {
      addTestResult(`${endpoint.name} API`, false, `错误: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// 测试4: 前端管理员页面访问
async function testAdminPageAccess() {
  try {
    const response = await makeRequest(`${FRONTEND_URL}/admin`);
    const passed = response.statusCode === 200;
    addTestResult(
      '管理员页面访问',
      passed,
      `状态码: ${response.statusCode}`
    );
    return passed;
  } catch (error) {
    addTestResult('管理员页面访问', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试5: API监控页面访问
async function testApiMonitorPageAccess() {
  try {
    const response = await makeRequest(`${FRONTEND_URL}/admin/api-data`);
    const passed = response.statusCode === 200;
    addTestResult(
      'API监控页面访问',
      passed,
      `状态码: ${response.statusCode}`
    );
    return passed;
  } catch (error) {
    addTestResult('API监控页面访问', false, `错误: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始管理员认证修复测试...\n');

  // 执行测试
  await testFrontendAccess();
  const token = await testAdminTokenGeneration();
  await testAdminAPIAccess(token);
  await testAdminPageAccess();
  await testApiMonitorPageAccess();

  // 计算成功率
  testResults.summary.successRate = Math.round(
    (testResults.summary.passed / testResults.summary.total) * 100
  );

  // 输出测试总结
  console.log('\n📊 测试总结:');
  console.log(`总测试数: ${testResults.summary.total}`);
  console.log(`通过: ${testResults.summary.passed}`);
  console.log(`失败: ${testResults.summary.failed}`);
  console.log(`成功率: ${testResults.summary.successRate}%`);

  // 保存测试结果
  const reportPath = 'docs/ADMIN_AUTH_FIX_TEST_REPORT.md';
  const jsonPath = 'docs/ADMIN_AUTH_FIX_TEST_DATA.json';

  // 保存JSON数据
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));

  // 生成Markdown报告
  const markdownReport = generateMarkdownReport();
  fs.writeFileSync(reportPath, markdownReport);

  console.log(`\n📄 测试报告已保存:`);
  console.log(`- Markdown: ${reportPath}`);
  console.log(`- JSON: ${jsonPath}`);

  // 输出修复建议
  if (testResults.summary.successRate < 100) {
    console.log('\n🔧 修复建议:');
    
    const failedTests = testResults.tests.filter(test => !test.passed);
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.details}`);
    });

    if (token) {
      console.log('\n💡 管理员token已生成，可以用于前端测试:');
      console.log(`Token: ${token}`);
      console.log('\n使用方法:');
      console.log('1. 在浏览器开发者工具中执行:');
      console.log(`   localStorage.setItem('management_auth_token', '${token}');`);
      console.log('2. 刷新管理员页面');
    }
  }

  return testResults.summary.successRate === 100;
}

// 生成Markdown报告
function generateMarkdownReport() {
  const { summary, tests, timestamp } = testResults;
  
  let report = `# 管理员认证修复测试报告\n\n`;
  report += `**测试时间**: ${timestamp}\n`;
  report += `**前端地址**: ${FRONTEND_URL}\n`;
  report += `**后端地址**: ${API_BASE_URL}\n\n`;
  
  report += `## 📊 测试总结\n\n`;
  report += `| 指标 | 数值 |\n`;
  report += `|------|------|\n`;
  report += `| 总测试数 | ${summary.total} |\n`;
  report += `| 通过测试 | ${summary.passed} |\n`;
  report += `| 失败测试 | ${summary.failed} |\n`;
  report += `| 成功率 | ${summary.successRate}% |\n\n`;
  
  report += `## 📋 详细测试结果\n\n`;
  tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    report += `### ${index + 1}. ${status} ${test.name}\n\n`;
    report += `**状态**: ${test.passed ? '通过' : '失败'}\n`;
    report += `**详情**: ${test.details}\n`;
    report += `**时间**: ${test.timestamp}\n\n`;
  });
  
  if (summary.successRate < 100) {
    report += `## 🔧 修复建议\n\n`;
    const failedTests = tests.filter(test => !test.passed);
    failedTests.forEach(test => {
      report += `- **${test.name}**: ${test.details}\n`;
    });
  }
  
  report += `\n---\n*报告生成时间: ${timestamp}*\n`;
  
  return report;
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

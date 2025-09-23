#!/usr/bin/env node

/**
 * 用户管理页面测试脚本
 * 测试用户数据加载和显示功能
 */

const https = require('https');
const fs = require('fs');

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const FRONTEND_URL = 'https://51269de9.college-employment-survey-frontend-l84.pages.dev';

// 测试结果存储
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  },
  tests: [],
  userDataSample: null,
  apiResponses: {}
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

// 生成管理员token
async function generateAdminToken() {
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
      passed ? `Token生成成功` : `错误: ${response.data?.message || '未知错误'}`
    );
    
    return passed ? response.data.data.token : null;
  } catch (error) {
    addTestResult('管理员token生成', false, `错误: ${error.message}`);
    return null;
  }
}

// 测试用户API数据
async function testUserAPIData(token) {
  if (!token) {
    addTestResult('用户API数据测试', false, '缺少认证token');
    return false;
  }

  try {
    // 测试用户列表API
    const response = await makeRequest(`${API_BASE_URL}/api/admin/users?page=1&pageSize=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    testResults.apiResponses.userList = response;

    const passed = response.statusCode === 200 && response.data?.success;
    
    if (passed && response.data.data) {
      const userData = response.data.data;
      testResults.userDataSample = userData;
      
      addTestResult(
        '用户列表API',
        true,
        `成功获取 ${userData.items?.length || 0} 个用户，总计 ${userData.pagination?.total || 0} 个用户`
      );

      // 详细分析用户数据
      if (userData.items && userData.items.length > 0) {
        const sampleUser = userData.items[0];
        addTestResult(
          '用户数据结构验证',
          true,
          `示例用户: ${sampleUser.username} (${sampleUser.email}), 问卷: ${sampleUser.questionnairesCount}, 故事: ${sampleUser.storiesCount}`
        );
      } else {
        addTestResult(
          '用户数据结构验证',
          false,
          '用户列表为空'
        );
      }
    } else {
      addTestResult(
        '用户列表API',
        false,
        `状态码: ${response.statusCode}, 错误: ${response.data?.message || '未知错误'}`
      );
    }

    return passed;
  } catch (error) {
    addTestResult('用户API数据测试', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试数据库中的实际用户数量
async function testDatabaseUserCount(token) {
  if (!token) {
    addTestResult('数据库用户统计', false, '缺少认证token');
    return false;
  }

  try {
    // 测试仪表板统计API
    const response = await makeRequest(`${API_BASE_URL}/api/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    testResults.apiResponses.dashboardStats = response;

    const passed = response.statusCode === 200 && response.data?.success;
    
    if (passed && response.data.data) {
      const stats = response.data.data;
      addTestResult(
        '数据库用户统计',
        true,
        `总用户数: ${stats.totalUsers}, 活跃用户: ${stats.activeUsers}, 问卷数: ${stats.totalQuestionnaires}, 故事数: ${stats.stories?.total_stories || 0}`
      );
    } else {
      addTestResult(
        '数据库用户统计',
        false,
        `状态码: ${response.statusCode}, 错误: ${response.data?.message || '未知错误'}`
      );
    }

    return passed;
  } catch (error) {
    addTestResult('数据库用户统计', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试前端用户管理页面
async function testUserManagementPage() {
  try {
    const response = await makeRequest(`${FRONTEND_URL}/admin/users`);
    const passed = response.statusCode === 200;
    addTestResult(
      '用户管理页面访问',
      passed,
      `状态码: ${response.statusCode}`
    );
    return passed;
  } catch (error) {
    addTestResult('用户管理页面访问', false, `错误: ${error.message}`);
    return false;
  }
}

// 分析数据不一致问题
function analyzeDataInconsistency() {
  console.log('\n🔍 数据一致性分析:');
  
  const userListData = testResults.apiResponses.userList?.data?.data;
  const dashboardData = testResults.apiResponses.dashboardStats?.data?.data;
  
  if (userListData && dashboardData) {
    console.log(`📊 API数据对比:`);
    console.log(`   用户列表API: ${userListData.items?.length || 0} 个用户 (当前页), 总计: ${userListData.pagination?.total || 0}`);
    console.log(`   仪表板API: ${dashboardData.totalUsers || 0} 个用户`);
    
    if (userListData.pagination?.total !== dashboardData.totalUsers) {
      console.log(`⚠️  数据不一致: 用户列表总数 (${userListData.pagination?.total}) != 仪表板总数 (${dashboardData.totalUsers})`);
    } else {
      console.log(`✅ 数据一致: 两个API返回相同的用户总数`);
    }
  }
  
  // 分析可能的问题
  console.log(`\n🔧 可能的问题分析:`);
  
  if (userListData?.items?.length === 0) {
    console.log(`❌ 用户列表为空 - 可能原因:`);
    console.log(`   1. 数据库查询条件过滤了所有用户`);
    console.log(`   2. 前端数据处理逻辑错误`);
    console.log(`   3. API响应格式不匹配前端期望`);
  }
  
  if (dashboardData?.totalUsers > 0 && userListData?.items?.length === 0) {
    console.log(`❌ 仪表板有用户但列表为空 - 可能原因:`);
    console.log(`   1. 用户列表API和仪表板API查询不同的数据源`);
    console.log(`   2. 用户列表API有额外的过滤条件`);
    console.log(`   3. 分页逻辑错误`);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始用户管理页面测试...\n');

  // 执行测试
  const token = await generateAdminToken();
  await testUserAPIData(token);
  await testDatabaseUserCount(token);
  await testUserManagementPage();

  // 分析数据一致性
  analyzeDataInconsistency();

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
  const reportPath = 'docs/USER_MANAGEMENT_TEST_REPORT.md';
  const jsonPath = 'docs/USER_MANAGEMENT_TEST_DATA.json';

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
  }

  if (token) {
    console.log('\n💡 管理员token (用于前端测试):');
    console.log(`Token: ${token}`);
    console.log('\n使用方法:');
    console.log('1. 在浏览器开发者工具中执行:');
    console.log(`   localStorage.setItem('management_auth_token', '${token}');`);
    console.log('2. 刷新用户管理页面');
  }

  return testResults.summary.successRate === 100;
}

// 生成Markdown报告
function generateMarkdownReport() {
  const { summary, tests, timestamp, userDataSample, apiResponses } = testResults;
  
  let report = `# 用户管理页面测试报告\n\n`;
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
  
  if (userDataSample) {
    report += `## 📋 用户数据样本\n\n`;
    report += `**用户总数**: ${userDataSample.pagination?.total || 0}\n`;
    report += `**当前页用户数**: ${userDataSample.items?.length || 0}\n\n`;
    
    if (userDataSample.items && userDataSample.items.length > 0) {
      report += `**示例用户**:\n`;
      const user = userDataSample.items[0];
      report += `- ID: ${user.id}\n`;
      report += `- 用户名: ${user.username}\n`;
      report += `- 邮箱: ${user.email}\n`;
      report += `- 角色: ${user.role}\n`;
      report += `- 状态: ${user.status}\n`;
      report += `- 问卷数: ${user.questionnairesCount}\n`;
      report += `- 故事数: ${user.storiesCount}\n\n`;
    }
  }
  
  report += `## 📋 详细测试结果\n\n`;
  tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    report += `### ${index + 1}. ${status} ${test.name}\n\n`;
    report += `**状态**: ${test.passed ? '通过' : '失败'}\n`;
    report += `**详情**: ${test.details}\n`;
    report += `**时间**: ${test.timestamp}\n\n`;
  });
  
  report += `\n---\n*报告生成时间: ${timestamp}*\n`;
  
  return report;
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

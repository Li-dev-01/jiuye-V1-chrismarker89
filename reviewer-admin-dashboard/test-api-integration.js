/**
 * API集成测试脚本
 * 验证管理员仪表板的真实API连接
 */

const API_BASE = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
const ADMIN_TOKEN = 'mgmt_token_ADMIN_1727197200000';

async function testAPI(endpoint, description) {
  console.log(`\n🧪 测试: ${description}`);
  console.log(`📡 端点: ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ 成功: ${response.status}`);
      console.log(`📊 数据预览:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return { success: true, data };
    } else {
      console.log(`❌ 失败: ${response.status}`);
      console.log(`🚨 错误:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`💥 网络错误:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 开始API集成测试...');
  console.log(`🔗 API基础地址: ${API_BASE}`);
  console.log(`🔑 认证Token: ${ADMIN_TOKEN}`);
  
  const tests = [
    {
      endpoint: '/api/admin/dashboard/stats',
      description: '管理员仪表板统计'
    },
    {
      endpoint: '/api/admin/users?limit=5',
      description: '用户列表（前5个）'
    },
    {
      endpoint: '/api/admin/questionnaires?page=1&pageSize=5',
      description: '问卷列表（第1页）'
    },
    {
      endpoint: '/api/admin/database/check',
      description: '数据库状态检查'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.description);
    results.push({
      ...test,
      ...result
    });
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📋 测试总结:');
  console.log('='.repeat(50));
  
  let successCount = 0;
  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    console.log(`${index + 1}. ${result.description}: ${status}`);
    if (result.success) successCount++;
  });
  
  console.log('='.repeat(50));
  console.log(`📊 成功率: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  
  if (successCount === results.length) {
    console.log('🎉 所有API测试通过！管理员仪表板已成功集成真实API。');
  } else {
    console.log('⚠️  部分API测试失败，请检查后端服务状态。');
  }

  return results;
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testAPI };
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.apiTest = { runTests, testAPI };
  console.log('💡 在浏览器控制台中运行: apiTest.runTests()');
}

// 自动运行测试（如果直接执行此文件）
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

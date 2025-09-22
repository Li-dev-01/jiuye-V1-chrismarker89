/**
 * 测试系统日志API的脚本
 * 用于验证真实数据API是否正常工作
 */

const API_BASE_URL = 'https://employment-survey-api-dev.chrismarker89.workers.dev';

// 模拟超级管理员认证
const SUPER_ADMIN_AUTH = 'Basic ' + btoa('super_admin:super_admin_password_2024');

async function testSystemLogsAPI() {
  console.log('🧪 测试系统日志API...');
  
  try {
    // 测试基本查询
    console.log('\n📋 测试基本查询...');
    const response = await fetch(`${API_BASE_URL}/api/super-admin/system/logs?page=1&pageSize=10`, {
      headers: {
        'Authorization': SUPER_ADMIN_AUTH,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ 基本查询成功');
    console.log(`📊 返回数据: ${data.data.total} 条记录`);
    console.log(`📄 当前页: ${data.data.page}/${Math.ceil(data.data.total / data.data.pageSize)}`);
    
    if (data.data.items.length > 0) {
      console.log('\n📝 示例日志记录:');
      const sample = data.data.items[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  用户: ${sample.username}`);
      console.log(`  操作: ${sample.action}`);
      console.log(`  级别: ${sample.level}`);
      console.log(`  分类: ${sample.category}`);
      console.log(`  消息: ${sample.message}`);
      console.log(`  时间: ${sample.timestamp}`);
    }
    
    // 测试筛选功能
    console.log('\n🔍 测试筛选功能...');
    const filterResponse = await fetch(`${API_BASE_URL}/api/super-admin/system/logs?level=info&category=auth&search=login`, {
      headers: {
        'Authorization': SUPER_ADMIN_AUTH,
        'Content-Type': 'application/json'
      }
    });
    
    if (filterResponse.ok) {
      const filterData = await filterResponse.json();
      console.log(`✅ 筛选查询成功: ${filterData.data.total} 条记录`);
    }
    
    // 测试日期范围
    console.log('\n📅 测试日期范围筛选...');
    const today = new Date().toISOString().split('T')[0];
    const dateResponse = await fetch(`${API_BASE_URL}/api/super-admin/system/logs?startDate=${today}&endDate=${today}`, {
      headers: {
        'Authorization': SUPER_ADMIN_AUTH,
        'Content-Type': 'application/json'
      }
    });
    
    if (dateResponse.ok) {
      const dateData = await dateResponse.json();
      console.log(`✅ 日期筛选成功: ${dateData.data.total} 条记录`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
  
  return true;
}

async function testOperationLogsAPI() {
  console.log('\n🧪 测试操作记录API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/super-admin/operation/logs?page=1&pageSize=5`, {
      headers: {
        'Authorization': SUPER_ADMIN_AUTH,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ 操作记录查询成功');
    console.log(`📊 返回数据: ${data.data.total} 条记录`);
    
    if (data.data.items.length > 0) {
      console.log('\n📝 示例操作记录:');
      const sample = data.data.items[0];
      console.log(`  用户: ${sample.username} (${sample.userType})`);
      console.log(`  操作: ${sample.operation}`);
      console.log(`  目标: ${sample.target}`);
      console.log(`  结果: ${sample.result}`);
      console.log(`  详情: ${sample.details}`);
      console.log(`  时间: ${sample.timestamp}`);
    }
    
  } catch (error) {
    console.error('❌ 操作记录测试失败:', error.message);
    return false;
  }
  
  return true;
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试系统日志真实数据API');
  console.log('=' .repeat(50));
  
  const systemLogsResult = await testSystemLogsAPI();
  const operationLogsResult = await testOperationLogsAPI();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 测试结果汇总:');
  console.log(`  系统日志API: ${systemLogsResult ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  操作记录API: ${operationLogsResult ? '✅ 通过' : '❌ 失败'}`);
  
  if (systemLogsResult && operationLogsResult) {
    console.log('\n🎉 所有测试通过！系统日志已成功切换到真实数据。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查API实现。');
  }
}

// 如果是在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSystemLogsAPI, testOperationLogsAPI, runTests };
}

// 如果是直接运行
if (typeof window === 'undefined') {
  runTests();
}

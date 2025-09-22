#!/usr/bin/env node

/**
 * 测试API端点脚本
 * 验证哪些API端点是可用的
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev/api';

async function testEndpoints() {
  console.log('🔍 测试API端点可用性...\n');

  const endpoints = [
    // 问卷提交相关
    { method: 'GET', path: '/universal-questionnaire/statistics/employment-survey-2024', name: '获取统计数据' },
    { method: 'POST', path: '/universal-questionnaire/submit', name: '提交问卷数据' },
    { method: 'GET', path: '/universal-questionnaire/count', name: '获取问卷总数' },
    { method: 'GET', path: '/universal-questionnaire/recent', name: '获取最近问卷' },
    { method: 'GET', path: '/universal-questionnaire/all/employment-survey-2024', name: '获取所有问卷' },
    
    // 统计相关
    { method: 'POST', path: '/universal-questionnaire/trigger-stats-update/employment-survey-2024', name: '触发统计更新' },
    { method: 'POST', path: '/universal-questionnaire/refresh-cache/employment-survey-2024', name: '刷新缓存' },
    { method: 'POST', path: '/universal-questionnaire/recalculate-stats/employment-survey-2024', name: '重新计算统计' },
    
    // 其他可能的端点
    { method: 'GET', path: '/questionnaire/statistics/employment-survey-2024', name: '旧版统计API' },
    { method: 'POST', path: '/questionnaire/submit', name: '旧版提交API' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 测试: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // 对于POST请求，添加一个测试数据
      if (endpoint.method === 'POST' && endpoint.path.includes('submit')) {
        options.body = JSON.stringify({
          questionnaireId: 'employment-survey-2024',
          sectionResponses: [{
            sectionId: 'test',
            questionResponses: [{
              questionId: 'test',
              value: 'test'
            }]
          }]
        });
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
      
      if (response.ok) {
        console.log(`  ✅ 成功 (${response.status})`);
        
        // 如果是统计API，显示一些关键信息
        if (endpoint.path.includes('statistics')) {
          const data = await response.json();
          if (data.success && data.data && data.data.statistics) {
            const stats = data.data.statistics;
            console.log(`    📊 统计项目数: ${Object.keys(stats).length}`);
            console.log(`    📊 年龄段数据: ${stats['age-range'] ? stats['age-range'].totalResponses + '人' : '无'}`);
            console.log(`    📊 工作地点数据: ${stats['work-location-preference'] ? stats['work-location-preference'].totalResponses + '人' : '无'}`);
          }
        }
      } else {
        console.log(`  ❌ 失败 (${response.status} ${response.statusText})`);
        
        // 尝试获取错误详情
        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            console.log(`    错误: ${errorData.error}`);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
      
    } catch (error) {
      console.log(`  ❌ 网络错误: ${error.message}`);
    }
    
    // 添加小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 测试提交一条真实数据
async function testRealSubmission() {
  console.log('\n🧪 测试提交真实数据...');
  
  const testData = {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-demographics',
        questionResponses: [
          {
            questionId: 'age-range',
            value: '23-25',
            timestamp: Date.now()
          },
          {
            questionId: 'gender',
            value: 'male',
            timestamp: Date.now()
          },
          {
            questionId: 'work-location-preference',
            value: 'tier1',
            timestamp: Date.now()
          }
        ]
      }
    ],
    metadata: {
      userAgent: 'test-script',
      timestamp: Date.now(),
      source: 'api-test'
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 测试提交成功:', JSON.stringify(result, null, 2));
      
      // 等待一下，然后检查统计是否更新
      console.log('⏳ 等待统计更新...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 检查统计
      const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        const ageStats = statsData.data.statistics['age-range'];
        const workLocationStats = statsData.data.statistics['work-location-preference'];
        
        console.log('📊 更新后的统计:');
        console.log(`  年龄段: ${ageStats ? ageStats.totalResponses + '人' : '无数据'}`);
        console.log(`  工作地点: ${workLocationStats ? workLocationStats.totalResponses + '人' : '无数据'}`);
      }
      
    } else {
      console.log('❌ 测试提交失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 测试提交出现错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 API端点测试工具启动\n');
  console.log('=' * 50);
  
  await testEndpoints();
  await testRealSubmission();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 测试完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEndpoints,
  testRealSubmission
};

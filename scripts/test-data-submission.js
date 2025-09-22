// 测试数据提交脚本 - 验证新格式数据和实时统计功能

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 测试数据样本 - 新格式
const testSubmissions = [
  {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-info',
        questionResponses: [
          { questionId: 'age-range', value: '23-25' },
          { questionId: 'gender', value: 'female' },
          { questionId: 'work-location-preference', value: 'tier1' }
        ]
      },
      {
        sectionId: 'education',
        questionResponses: [
          { questionId: 'education-level', value: 'master' },
          { questionId: 'major-field', value: 'engineering' }
        ]
      },
      {
        sectionId: 'identity',
        questionResponses: [
          { questionId: 'current-status', value: 'employed' }
        ]
      }
    ],
    metadata: {
      submissionSource: 'test-script',
      userAgent: 'Test Script 1.0',
      timestamp: new Date().toISOString()
    }
  },
  {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-info',
        questionResponses: [
          { questionId: 'age-range', value: '20-22' },
          { questionId: 'gender', value: 'male' },
          { questionId: 'work-location-preference', value: 'new-tier1' }
        ]
      },
      {
        sectionId: 'education',
        questionResponses: [
          { questionId: 'education-level', value: 'bachelor' },
          { questionId: 'major-field', value: 'management' }
        ]
      },
      {
        sectionId: 'identity',
        questionResponses: [
          { questionId: 'current-status', value: 'student' }
        ]
      }
    ],
    metadata: {
      submissionSource: 'test-script',
      userAgent: 'Test Script 1.0',
      timestamp: new Date().toISOString()
    }
  },
  {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-info',
        questionResponses: [
          { questionId: 'age-range', value: '23-25' },
          { questionId: 'gender', value: 'female' },
          { questionId: 'work-location-preference', value: 'tier1' }
        ]
      },
      {
        sectionId: 'education',
        questionResponses: [
          { questionId: 'education-level', value: 'bachelor' },
          { questionId: 'major-field', value: 'other' }
        ]
      },
      {
        sectionId: 'identity',
        questionResponses: [
          { questionId: 'current-status', value: 'unemployed' }
        ]
      }
    ],
    metadata: {
      submissionSource: 'test-script',
      userAgent: 'Test Script 1.0',
      timestamp: new Date().toISOString()
    }
  }
];

// 提交测试数据
async function submitTestData() {
  console.log('🚀 开始提交测试数据...');
  
  for (let i = 0; i < testSubmissions.length; i++) {
    const submission = testSubmissions[i];
    
    try {
      console.log(`📝 提交第 ${i + 1} 份问卷...`);
      
      const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 第 ${i + 1} 份问卷提交成功: ID ${result.data.id}`);
      } else {
        console.error(`❌ 第 ${i + 1} 份问卷提交失败:`, result.message);
      }
      
      // 延迟1秒避免过快提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 份问卷提交异常:`, error);
    }
  }
  
  console.log('📊 等待5秒后检查统计数据...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 检查统计数据
  await checkStatistics();
}

// 检查统计数据
async function checkStatistics() {
  try {
    console.log('📊 检查统计数据...');
    
    const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 统计数据获取成功:');
      console.log(`📈 数据来源: ${result.data.source}`);
      console.log(`📊 统计题目数: ${Object.keys(result.data.statistics).length}`);
      
      // 显示各题目统计
      for (const [questionId, stats] of Object.entries(result.data.statistics)) {
        console.log(`\n🎯 ${questionId}:`);
        console.log(`   总回答数: ${stats.totalResponses}`);
        stats.options.forEach(option => {
          console.log(`   ${option.value}: ${option.count}人 (${option.percentage}%)`);
        });
      }
    } else {
      console.error('❌ 统计数据获取失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 统计数据检查异常:', error);
  }
}

// 系统健康检查
async function healthCheck() {
  try {
    console.log('🔍 执行系统健康检查...');
    
    const response = await fetch(`${API_BASE_URL}/api/analytics/system-health-check/employment-survey-2024`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ 系统健康状态: ${result.data.overall}`);
      console.log(`📊 数据库状态: ${result.data.checks.database.status}`);
      console.log(`🔄 数据一致性: ${result.data.checks.dataConsistency.status}`);
      console.log(`💾 统计缓存: ${result.data.checks.statisticsCache.status}`);
      
      if (result.data.issues.length > 0) {
        console.log('⚠️ 发现问题:');
        result.data.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (result.data.recommendations.length > 0) {
        console.log('💡 建议:');
        result.data.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
    } else {
      console.error('❌ 健康检查失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 健康检查异常:', error);
  }
}

// 主函数
async function main() {
  console.log('🎯 开始系统测试和验证...\n');
  
  // 1. 执行健康检查
  await healthCheck();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. 提交测试数据
  await submitTestData();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 3. 再次执行健康检查
  console.log('🔍 提交数据后的健康检查...');
  await healthCheck();
  
  console.log('\n🎉 系统测试完成！');
}

// 如果是Node.js环境，执行主函数
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  const fetch = require('node-fetch');
  main().catch(console.error);
} else {
  // 浏览器环境
  console.log('请在浏览器控制台中运行 main() 函数');
}

// 导出函数供浏览器使用
if (typeof window !== 'undefined') {
  window.testSubmission = {
    main,
    submitTestData,
    checkStatistics,
    healthCheck
  };
}

#!/usr/bin/env node

/**
 * 等待并检查统计更新脚本
 * 等待足够时间让统计缓存自动更新，然后检查结果
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev/api';

async function waitAndCheck() {
  console.log('⏰ 等待统计缓存自动更新...\n');

  // 先检查当前统计
  console.log('📊 当前统计状态:');
  await checkCurrentStats();

  // 等待2分钟让缓存有机会更新
  console.log('\n⏳ 等待2分钟让统计缓存更新...');
  for (let i = 120; i > 0; i--) {
    process.stdout.write(`\r⏳ 剩余时间: ${i} 秒`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n');

  // 再次检查统计
  console.log('📊 更新后的统计状态:');
  await checkCurrentStats();

  // 提交一条新的测试数据
  console.log('\n🧪 提交一条新的测试数据...');
  await submitTestData();

  // 再等待1分钟
  console.log('\n⏳ 等待1分钟让新数据生效...');
  for (let i = 60; i > 0; i--) {
    process.stdout.write(`\r⏳ 剩余时间: ${i} 秒`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n');

  // 最后检查统计
  console.log('📊 最终统计状态:');
  await checkCurrentStats();
}

async function checkCurrentStats() {
  try {
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      const keyQuestions = ['age-range', 'work-location-preference', 'gender'];
      
      for (const questionId of keyQuestions) {
        const questionStats = statsData.data.statistics[questionId];
        if (questionStats) {
          console.log(`  ${questionId}: ${questionStats.totalResponses}人 (更新于: ${new Date(questionStats.lastUpdated).toLocaleTimeString()})`);
        } else {
          console.log(`  ${questionId}: 无数据`);
        }
      }
    } else {
      console.log('❌ 获取统计数据失败');
    }
  } catch (error) {
    console.error('❌ 检查统计时出现错误:', error.message);
  }
}

async function submitTestData() {
  const testData = {
    questionnaireId: 'employment-survey-2024',
    sectionResponses: [
      {
        sectionId: 'basic-demographics',
        questionResponses: [
          {
            questionId: 'age-range',
            value: '29-35',
            timestamp: Date.now()
          },
          {
            questionId: 'gender',
            value: 'female',
            timestamp: Date.now()
          },
          {
            questionId: 'work-location-preference',
            value: 'hometown',
            timestamp: Date.now()
          },
          {
            questionId: 'education-level',
            value: 'bachelor',
            timestamp: Date.now()
          },
          {
            questionId: 'major-field',
            value: 'engineering',
            timestamp: Date.now()
          }
        ]
      }
    ],
    metadata: {
      userAgent: 'test-script',
      timestamp: Date.now(),
      source: 'wait-and-check-test'
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
      console.log(`✅ 测试数据提交成功: submissionId ${result.data.submissionId}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ 测试数据提交失败: ${response.status} ${response.statusText}`);
      console.log('错误详情:', errorText);
    }
  } catch (error) {
    console.error('❌ 提交测试数据时出现错误:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 等待并检查统计更新工具启动\n');
  console.log('=' * 50);
  
  await waitAndCheck();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 检查完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  waitAndCheck,
  checkCurrentStats,
  submitTestData
};

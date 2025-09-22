#!/usr/bin/env node

/**
 * 强制刷新统计缓存脚本
 * 使用管理员权限强制更新统计缓存
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

async function forceCacheRefresh() {
  console.log('🔄 强制刷新统计缓存...\n');

  try {
    // 1. 使用管理员接口刷新缓存
    console.log('📊 1. 使用管理员接口刷新缓存');
    const refreshResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/cache/refresh/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token' // 管理员令牌
      }
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ 缓存刷新成功:', JSON.stringify(refreshData, null, 2));
    } else {
      console.log('⚠️ 缓存刷新失败:', refreshResponse.status, refreshResponse.statusText);
      const errorText = await refreshResponse.text();
      console.log('错误详情:', errorText);
    }

    // 2. 等待缓存更新完成
    console.log('\n⏳ 等待缓存更新完成...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. 检查更新后的统计数据
    console.log('\n📈 3. 检查更新后的统计数据');
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('✅ 统计数据获取成功');
      
      // 检查关键问题的统计
      const keyQuestions = ['age-range', 'gender', 'work-location-preference', 'education-level', 'major-field'];
      
      for (const questionId of keyQuestions) {
        const questionStats = statsData.data.statistics[questionId];
        if (questionStats) {
          console.log(`\n📊 ${questionId}:`);
          console.log(`  总回答人数: ${questionStats.totalResponses}`);
          console.log(`  最后更新: ${questionStats.lastUpdated}`);
          console.log(`  选项分布:`);
          questionStats.options.slice(0, 3).forEach(option => {
            console.log(`    ${option.value}: ${option.count}人 (${option.percentage}%)`);
          });
          if (questionStats.options.length > 3) {
            console.log(`    ... 还有 ${questionStats.options.length - 3} 个选项`);
          }
        } else {
          console.log(`\n❌ ${questionId}: 无统计数据`);
        }
      }
    } else {
      console.log('❌ 统计数据获取失败:', statsData.message || statsData.error);
    }

    // 4. 尝试使用analytics接口刷新
    console.log('\n🔄 4. 尝试使用analytics接口刷新');
    const analyticsRefreshResponse = await fetch(`${API_BASE_URL}/analytics/refresh-statistics-cache/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (analyticsRefreshResponse.ok) {
      const analyticsRefreshData = await analyticsRefreshResponse.json();
      console.log('✅ Analytics缓存刷新成功:', JSON.stringify(analyticsRefreshData, null, 2));
    } else {
      console.log('⚠️ Analytics缓存刷新失败:', analyticsRefreshResponse.status, analyticsRefreshResponse.statusText);
    }

  } catch (error) {
    console.error('❌ 操作过程中出现错误:', error);
  }
}

// 提交更多测试数据
async function submitMoreTestData() {
  console.log('\n🧪 提交更多测试数据...');
  
  const testDataSets = [
    {
      questionnaireId: 'employment-survey-2024',
      sectionResponses: [
        {
          sectionId: 'basic-demographics',
          questionResponses: [
            { questionId: 'age-range', value: 'under-20', timestamp: Date.now() },
            { questionId: 'gender', value: 'female', timestamp: Date.now() },
            { questionId: 'work-location-preference', value: 'new-tier1', timestamp: Date.now() }
          ]
        }
      ]
    },
    {
      questionnaireId: 'employment-survey-2024',
      sectionResponses: [
        {
          sectionId: 'basic-demographics',
          questionResponses: [
            { questionId: 'age-range', value: '20-22', timestamp: Date.now() },
            { questionId: 'gender', value: 'prefer-not-say', timestamp: Date.now() },
            { questionId: 'work-location-preference', value: 'tier2', timestamp: Date.now() }
          ]
        }
      ]
    },
    {
      questionnaireId: 'employment-survey-2024',
      sectionResponses: [
        {
          sectionId: 'basic-demographics',
          questionResponses: [
            { questionId: 'age-range', value: '26-28', timestamp: Date.now() },
            { questionId: 'gender', value: 'male', timestamp: Date.now() },
            { questionId: 'work-location-preference', value: 'tier3', timestamp: Date.now() }
          ]
        }
      ]
    }
  ];

  for (let i = 0; i < testDataSets.length; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/universal-questionnaire/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testDataSets[i])
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 测试数据 ${i + 1} 提交成功: submissionId ${result.data.submissionId}`);
      } else {
        console.log(`❌ 测试数据 ${i + 1} 提交失败:`, response.status, response.statusText);
      }
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 测试数据 ${i + 1} 提交出现错误:`, error);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 强制缓存刷新工具启动\n');
  console.log('=' * 50);
  
  // 先提交一些测试数据
  await submitMoreTestData();
  
  // 等待一段时间让数据稳定
  console.log('\n⏳ 等待数据稳定...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 强制刷新缓存
  await forceCacheRefresh();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 操作完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  forceCacheRefresh,
  submitMoreTestData
};

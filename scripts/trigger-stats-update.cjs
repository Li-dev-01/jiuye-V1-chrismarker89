#!/usr/bin/env node

/**
 * 手动触发统计缓存更新脚本
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

async function triggerStatsUpdate() {
  console.log('🔄 手动触发统计缓存更新...\n');

  try {
    // 1. 尝试触发统计更新
    console.log('📊 1. 触发统计缓存更新');
    const updateResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/trigger-stats-update/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ 统计更新触发成功:', JSON.stringify(updateData, null, 2));
    } else {
      console.log('⚠️ 统计更新触发失败:', updateResponse.status, updateResponse.statusText);
      const errorData = await updateResponse.text();
      console.log('错误详情:', errorData);
    }

    // 2. 等待一段时间让统计更新完成
    console.log('\n⏳ 等待统计更新完成...');
    await new Promise(resolve => setTimeout(resolve, 5000));

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
          questionStats.options.forEach(option => {
            console.log(`    ${option.value}: ${option.count}人 (${option.percentage}%)`);
          });
        } else {
          console.log(`\n❌ ${questionId}: 无统计数据`);
        }
      }
    } else {
      console.log('❌ 统计数据获取失败:', statsData.message || statsData.error);
    }

    // 4. 尝试强制刷新缓存
    console.log('\n🔄 4. 尝试强制刷新缓存');
    const refreshResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/refresh-cache/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ 缓存刷新成功:', JSON.stringify(refreshData, null, 2));
    } else {
      console.log('⚠️ 缓存刷新失败:', refreshResponse.status, refreshResponse.statusText);
    }

  } catch (error) {
    console.error('❌ 操作过程中出现错误:', error);
  }
}

// 检查数据库中的实际记录数
async function checkDatabaseRecords() {
  console.log('\n🗄️ 检查数据库记录数...');
  
  try {
    // 尝试获取问卷响应总数
    const countResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/count/employment-survey-2024`);
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ 数据库记录数:', JSON.stringify(countData, null, 2));
    } else {
      console.log('⚠️ 无法获取数据库记录数:', countResponse.status, countResponse.statusText);
    }

    // 尝试获取最近的提交记录
    const recentResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/recent/employment-survey-2024?limit=5`);
    
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      console.log('✅ 最近提交记录:', JSON.stringify(recentData, null, 2));
    } else {
      console.log('⚠️ 无法获取最近提交记录:', recentResponse.status, recentResponse.statusText);
    }

  } catch (error) {
    console.error('❌ 检查数据库记录时出现错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 统计缓存更新工具启动\n');
  console.log('=' * 50);
  
  await checkDatabaseRecords();
  await triggerStatsUpdate();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 操作完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  triggerStatsUpdate,
  checkDatabaseRecords
};

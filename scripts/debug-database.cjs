#!/usr/bin/env node

/**
 * 调试数据库数据脚本
 * 直接查询数据库，检查我们提交的数据是否正确保存
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev/api';

async function debugDatabase() {
  console.log('🔍 开始调试数据库数据...\n');

  try {
    // 1. 尝试获取所有问卷响应
    console.log('📊 1. 获取所有问卷响应');
    const allResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/all/employment-survey-2024?limit=200`);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log('✅ 获取成功，总数:', allData.data ? allData.data.length : 0);
      
      if (allData.data && allData.data.length > 0) {
        // 分析最近的几条记录
        console.log('\n📝 最近的5条记录:');
        const recent = allData.data.slice(-5);
        
        recent.forEach((record, index) => {
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  ID: ${record.id}`);
          console.log(`  提交时间: ${record.submittedAt}`);
          console.log(`  问卷ID: ${record.questionnaireId}`);
          console.log(`  部分数量: ${record.sectionResponses ? record.sectionResponses.length : 0}`);
          
          if (record.sectionResponses && record.sectionResponses.length > 0) {
            record.sectionResponses.forEach(section => {
              console.log(`    部分: ${section.sectionId} (${section.questionResponses ? section.questionResponses.length : 0}个问题)`);
              
              if (section.questionResponses) {
                section.questionResponses.forEach(q => {
                  console.log(`      ${q.questionId}: ${q.value}`);
                });
              }
            });
          }
        });
        
        // 统计年龄段和工作地点偏好的数据
        console.log('\n📊 统计年龄段数据:');
        const ageRangeData = {};
        const workLocationData = {};
        
        allData.data.forEach(record => {
          if (record.sectionResponses) {
            record.sectionResponses.forEach(section => {
              if (section.questionResponses) {
                section.questionResponses.forEach(q => {
                  if (q.questionId === 'age-range') {
                    ageRangeData[q.value] = (ageRangeData[q.value] || 0) + 1;
                  }
                  if (q.questionId === 'work-location-preference') {
                    workLocationData[q.value] = (workLocationData[q.value] || 0) + 1;
                  }
                });
              }
            });
          }
        });
        
        console.log('年龄段分布:', ageRangeData);
        console.log('工作地点偏好分布:', workLocationData);
        
      } else {
        console.log('❌ 没有找到任何记录');
      }
    } else {
      console.log('❌ 获取失败:', allResponse.status, allResponse.statusText);
      const errorText = await allResponse.text();
      console.log('错误详情:', errorText);
    }

    // 2. 尝试直接查询统计API
    console.log('\n📈 2. 直接查询统计API');
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('✅ 统计API正常');
      
      // 检查年龄段统计
      const ageStats = statsData.data.statistics['age-range'];
      if (ageStats) {
        console.log('\n年龄段统计:');
        console.log(`  总回答人数: ${ageStats.totalResponses}`);
        console.log(`  最后更新: ${ageStats.lastUpdated}`);
        console.log('  分布:', ageStats.values);
      } else {
        console.log('❌ 没有年龄段统计数据');
      }
      
      // 检查工作地点偏好统计
      const workLocationStats = statsData.data.statistics['work-location-preference'];
      if (workLocationStats) {
        console.log('\n工作地点偏好统计:');
        console.log(`  总回答人数: ${workLocationStats.totalResponses}`);
        console.log(`  最后更新: ${workLocationStats.lastUpdated}`);
        console.log('  分布:', workLocationStats.values);
      } else {
        console.log('❌ 没有工作地点偏好统计数据');
      }
    }

    // 3. 尝试手动重新计算统计
    console.log('\n🔄 3. 尝试手动重新计算统计');
    const recalcResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/recalculate-stats/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (recalcResponse.ok) {
      const recalcData = await recalcResponse.json();
      console.log('✅ 重新计算成功:', JSON.stringify(recalcData, null, 2));
    } else {
      console.log('⚠️ 重新计算失败:', recalcResponse.status, recalcResponse.statusText);
    }

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 数据库调试工具启动\n');
  console.log('=' * 50);
  
  await debugDatabase();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 调试完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugDatabase
};

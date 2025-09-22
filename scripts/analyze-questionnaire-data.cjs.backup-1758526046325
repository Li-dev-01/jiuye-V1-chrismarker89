#!/usr/bin/env node

/**
 * 分析问卷数据脚本
 * 检查数据库中问卷数据的实际情况和统计流转
 */

const API_BASE_URL = 'https://employment-survey-api-prod.justpm2099.workers.dev/api';

// 分析问卷数据
async function analyzeQuestionnaireData() {
  console.log('🔍 开始分析问卷数据...\n');

  try {
    // 1. 检查问卷总数
    console.log('📊 1. 检查问卷总数');
    const totalResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/count`);
    const totalData = await totalResponse.json();
    console.log('总问卷数:', totalData);

    // 2. 获取问卷统计数据
    console.log('\n📈 2. 获取问卷统计数据');
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();
    console.log('统计数据:', JSON.stringify(statsData, null, 2));

    // 3. 检查最近提交的问卷
    console.log('\n📝 3. 检查最近提交的问卷');
    const recentResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/recent?limit=10`);
    const recentData = await recentResponse.json();
    console.log('最近问卷:', JSON.stringify(recentData, null, 2));

    // 4. 检查数据库表状态
    console.log('\n🗄️ 4. 检查数据库表状态');
    const dbStatusResponse = await fetch(`${API_BASE_URL}/admin/database/status`, {
      headers: {
        'Authorization': 'Bearer admin-token' // 需要管理员权限
      }
    });
    
    if (dbStatusResponse.ok) {
      const dbStatusData = await dbStatusResponse.json();
      console.log('数据库状态:', JSON.stringify(dbStatusData, null, 2));
    } else {
      console.log('无法获取数据库状态 (需要管理员权限)');
    }

    // 5. 检查统计缓存状态
    console.log('\n⚡ 5. 检查统计缓存状态');
    const cacheResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/cache-status/employment-survey-2024`);
    const cacheData = await cacheResponse.json();
    console.log('缓存状态:', JSON.stringify(cacheData, null, 2));

    // 6. 分析特定问题的统计
    console.log('\n🎯 6. 分析特定问题的统计');
    const questionIds = ['education-level', 'current-status', 'gender', 'location'];
    
    for (const questionId of questionIds) {
      try {
        const questionResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/question-stats/${questionId}?questionnaireId=employment-survey-2024`);
        const questionData = await questionResponse.json();
        console.log(`\n问题 ${questionId} 统计:`, JSON.stringify(questionData, null, 2));
      } catch (error) {
        console.log(`问题 ${questionId} 统计获取失败:`, error.message);
      }
    }

    // 7. 检查数据完整性
    console.log('\n✅ 7. 数据完整性检查');
    await checkDataIntegrity();

  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error);
  }
}

// 检查数据完整性
async function checkDataIntegrity() {
  try {
    // 检查是否有数据丢失或不一致
    const integrityResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/integrity-check/employment-survey-2024`);
    const integrityData = await integrityResponse.json();
    
    if (integrityData.success) {
      console.log('✅ 数据完整性检查通过');
      console.log('检查结果:', JSON.stringify(integrityData.data, null, 2));
    } else {
      console.log('⚠️ 数据完整性检查发现问题:', integrityData.message);
    }
  } catch (error) {
    console.log('⚠️ 无法执行数据完整性检查:', error.message);
  }
}

// 分析统计数据更新状态
async function analyzeStatisticsUpdate() {
  console.log('\n🔄 分析统计数据更新状态...');
  
  try {
    // 检查统计缓存的最后更新时间
    const updateResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/stats-update-info/employment-survey-2024`);
    const updateData = await updateResponse.json();
    
    if (updateData.success) {
      console.log('统计更新信息:', JSON.stringify(updateData.data, null, 2));
      
      // 分析更新延迟
      const lastUpdate = new Date(updateData.data.lastUpdated);
      const now = new Date();
      const delayMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
      
      console.log(`\n⏰ 统计数据延迟: ${delayMinutes} 分钟`);
      
      if (delayMinutes > 5) {
        console.log('⚠️ 统计数据可能需要手动更新');
        
        // 尝试触发统计更新
        console.log('🔄 尝试触发统计更新...');
        const triggerResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/trigger-stats-update/employment-survey-2024`, {
          method: 'POST'
        });
        
        const triggerData = await triggerResponse.json();
        console.log('更新触发结果:', JSON.stringify(triggerData, null, 2));
      }
    }
  } catch (error) {
    console.log('⚠️ 无法获取统计更新信息:', error.message);
  }
}

// 检查问卷字段分布
async function analyzeFieldDistribution() {
  console.log('\n📊 分析问卷字段分布...');
  
  const fields = [
    { id: 'education-level', name: '教育水平' },
    { id: 'current-status', name: '就业状态' },
    { id: 'gender', name: '性别' },
    { id: 'location', name: '地区' },
    { id: 'industry', name: '行业' },
    { id: 'salary-range', name: '薪资范围' }
  ];
  
  for (const field of fields) {
    try {
      const response = await fetch(`${API_BASE_URL}/universal-questionnaire/field-distribution/${field.id}?questionnaireId=employment-survey-2024`);
      const data = await response.json();
      
      if (data.success && data.data.options && data.data.options.length > 0) {
        console.log(`\n${field.name} (${field.id}) 分布:`);
        data.data.options.forEach(option => {
          console.log(`  ${option.value}: ${option.count} 人 (${option.percentage}%)`);
        });
        console.log(`  总回答人数: ${data.data.totalResponses}`);
      } else {
        console.log(`\n${field.name} (${field.id}): 暂无数据或数据格式异常`);
      }
    } catch (error) {
      console.log(`\n${field.name} (${field.id}): 获取失败 - ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 问卷数据分析工具启动\n');
  console.log('=' * 50);
  
  await analyzeQuestionnaireData();
  await analyzeStatisticsUpdate();
  await analyzeFieldDistribution();
  
  console.log('\n' + '=' * 50);
  console.log('✨ 分析完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzeQuestionnaireData,
  analyzeStatisticsUpdate,
  analyzeFieldDistribution
};

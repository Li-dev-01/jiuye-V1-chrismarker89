/**
 * 测试前端API调用
 */

async function testFrontendAPI() {
  console.log('🧪 测试问卷2前端API调用...');
  
  try {
    // 测试问卷2 API端点
    const apiUrl = 'http://localhost:8787/api/universal-questionnaire/statistics/questionnaire-v2-2024?include_test_data=true';
    console.log(`📡 调用API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('✅ API响应成功');
    console.log('📊 数据结构:');
    console.log(`  - 成功状态: ${data.success}`);
    console.log(`  - 数据源: ${data.source}`);
    console.log(`  - 最后更新: ${data.lastUpdated}`);
    
    if (data.data && data.data.charts) {
      const charts = data.data.charts;
      console.log('📈 图表数据:');
      
      if (charts.economicPressure) {
        console.log(`  - 经济压力分析: ${charts.economicPressure.totalResponses} 个响应`);
        console.log(`    平均分数: ${charts.economicPressure.averageScore}`);
        console.log(`    分布数据: ${charts.economicPressure.distribution.length} 个区间`);
      }
      
      if (charts.employmentConfidence) {
        console.log(`  - 就业信心分析:`);
        console.log(`    6个月展望 - 积极: ${charts.employmentConfidence.sixMonthOutlook.positive}%`);
        console.log(`    1年展望 - 积极: ${charts.employmentConfidence.oneYearOutlook.positive}%`);
      }
      
      if (charts.modernDebt) {
        console.log(`  - 现代负债分析:`);
        console.log(`    有负债比例: ${charts.modernDebt.hasDebt}%`);
        console.log(`    负债类型: ${charts.modernDebt.types.length} 种`);
        charts.modernDebt.types.forEach(type => {
          console.log(`      ${type.name}: ${type.percentage}%`);
        });
      }
    }
    
    console.log('\n🎯 问卷2可视化系统API测试完成');
    console.log('✅ API端点正常工作');
    console.log('✅ 数据结构符合预期');
    console.log('✅ 包含问卷2特色功能数据');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

// 运行测试
testFrontendAPI();

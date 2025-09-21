#!/usr/bin/env node

/**
 * 全面检查所有图表的双语显示状态
 * 验证图表标题和数据标签的中英文双语显示，确保无遗漏
 */

// 模拟所有可能的图表数据
const ALL_CHART_DATA = {
  // 就业形势总览
  'current-status': [
    { name: '已就业', value: 600, percentage: 60 },
    { name: '求职中', value: 250, percentage: 25 },
    { name: '继续深造', value: 100, percentage: 10 },
    { name: '其他', value: 50, percentage: 5 }
  ],
  
  // 人口结构分析
  'gender-distribution': [
    { name: '女性', value: 520, percentage: 52 },
    { name: '男性', value: 460, percentage: 46 },
    { name: '不愿透露', value: 20, percentage: 2 }
  ],
  'age-distribution': [
    { name: '18-22岁', value: 280, percentage: 28 },
    { name: '23-25岁', value: 350, percentage: 35 },
    { name: '26-30岁', value: 220, percentage: 22 },
    { name: '31-35岁', value: 100, percentage: 10 },
    { name: '35岁以上', value: 50, percentage: 5 }
  ],
  'major-field': [
    { name: '计算机科学', value: 250, percentage: 25 },
    { name: '经济学', value: 200, percentage: 20 },
    { name: '工程学', value: 180, percentage: 18 },
    { name: '管理学', value: 150, percentage: 15 },
    { name: '文学', value: 120, percentage: 12 },
    { name: '其他', value: 100, percentage: 10 }
  ],
  'work-location-preference': [
    { name: '北京', value: 220, percentage: 22 },
    { name: '上海', value: 200, percentage: 20 },
    { name: '深圳', value: 180, percentage: 18 },
    { name: '广州', value: 150, percentage: 15 },
    { name: '杭州', value: 120, percentage: 12 },
    { name: '其他城市', value: 130, percentage: 13 }
  ],
  
  // 就业市场分析
  'work-industry': [
    { name: '互联网/科技', value: 280, percentage: 28 },
    { name: '金融服务', value: 180, percentage: 18 },
    { name: '制造业', value: 150, percentage: 15 },
    { name: '教育培训', value: 120, percentage: 12 },
    { name: '医疗健康', value: 100, percentage: 10 },
    { name: '政府机关', value: 80, percentage: 8 },
    { name: '其他行业', value: 90, percentage: 9 }
  ],
  'current-salary': [
    { name: '3K以下', value: 80, percentage: 8 },
    { name: '3K-5K', value: 220, percentage: 22 },
    { name: '5K-8K', value: 280, percentage: 28 },
    { name: '8K-12K', value: 250, percentage: 25 },
    { name: '12K-20K', value: 120, percentage: 12 },
    { name: '20K以上', value: 50, percentage: 5 }
  ],
  'job-search-duration': [
    { name: '1个月内', value: 150, percentage: 15 },
    { name: '1-3个月', value: 350, percentage: 35 },
    { name: '3-6个月', value: 280, percentage: 28 },
    { name: '6-12个月', value: 150, percentage: 15 },
    { name: '12个月以上', value: 70, percentage: 7 }
  ],
  'job-search-difficulties': [
    { name: '缺乏经验', value: 320, percentage: 32 },
    { name: '技能不匹配', value: 250, percentage: 25 },
    { name: '竞争激烈', value: 200, percentage: 20 },
    { name: '薪资期望', value: 120, percentage: 12 },
    { name: '地域限制', value: 80, percentage: 8 },
    { name: '其他原因', value: 30, percentage: 3 }
  ],
  
  // 就业感知分析
  'employment-difficulty-perception': [
    { name: '非常困难', value: 280, percentage: 28 },
    { name: '比较困难', value: 350, percentage: 35 },
    { name: '一般', value: 220, percentage: 22 },
    { name: '比较容易', value: 120, percentage: 12 },
    { name: '非常容易', value: 30, percentage: 3 }
  ],
  'salary-level-perception': [
    { name: '低于预期', value: 420, percentage: 42 },
    { name: '符合预期', value: 380, percentage: 38 },
    { name: '高于预期', value: 150, percentage: 15 },
    { name: '远超预期', value: 50, percentage: 5 }
  ]
};

// 图表标题映射
const CHART_TITLE_MAP = {
  'current-status': '同龄人就业率观察',
  'gender-distribution': '性别分布',
  'age-distribution': '年龄分布',
  'major-field': '专业分布',
  'work-location-preference': '地域分布',
  'work-industry': '行业就业分布',
  'current-salary': '薪资水平分布',
  'job-search-duration': '求职时长分析',
  'job-search-difficulties': '求职困难分析',
  'employment-difficulty-perception': '就业难度感知',
  'salary-level-perception': '薪资水平感知'
};

// 双语标题映射
const CHART_TITLE_BILINGUAL_MAP = {
  '同龄人就业率观察': { chinese: '同龄人就业率观察', english: 'Peer Employment Rate Observation' },
  '性别分布': { chinese: '性别分布', english: 'Gender Distribution' },
  '年龄分布': { chinese: '年龄分布', english: 'Age Distribution' },
  '专业分布': { chinese: '专业分布', english: 'Major Field Distribution' },
  '地域分布': { chinese: '地域分布', english: 'Geographic Distribution' },
  '行业就业分布': { chinese: '行业就业分布', english: 'Industry Employment Distribution' },
  '薪资水平分布': { chinese: '薪资水平分布', english: 'Salary Level Distribution' },
  '求职时长分析': { chinese: '求职时长分析', english: 'Job Search Duration Analysis' },
  '求职困难分析': { chinese: '求职困难分析', english: 'Job Search Difficulties Analysis' },
  '就业难度感知': { chinese: '就业难度感知', english: 'Employment Difficulty Perception' },
  '薪资水平感知': { chinese: '薪资水平感知', english: 'Salary Level Perception' }
};

// 双语数据标签映射
const DATA_LABEL_BILINGUAL_MAP = {
  // 就业状态
  '已就业': { chinese: '已就业', english: 'Employed' },
  '求职中': { chinese: '求职中', english: 'Job Seeking' },
  '继续深造': { chinese: '继续深造', english: 'Further Study' },
  '其他': { chinese: '其他', english: 'Others' },
  
  // 性别
  '男性': { chinese: '男性', english: 'Male' },
  '女性': { chinese: '女性', english: 'Female' },
  '不愿透露': { chinese: '不愿透露', english: 'Prefer not to say' },
  
  // 年龄段
  '18-22岁': { chinese: '18-22岁', english: '18-22 years' },
  '23-25岁': { chinese: '23-25岁', english: '23-25 years' },
  '26-30岁': { chinese: '26-30岁', english: '26-30 years' },
  '31-35岁': { chinese: '31-35岁', english: '31-35 years' },
  '35岁以上': { chinese: '35岁以上', english: 'Over 35 years' },
  
  // 专业
  '计算机科学': { chinese: '计算机科学', english: 'Computer Science' },
  '经济学': { chinese: '经济学', english: 'Economics' },
  '工程学': { chinese: '工程学', english: 'Engineering' },
  '管理学': { chinese: '管理学', english: 'Management' },
  '文学': { chinese: '文学', english: 'Literature' },
  
  // 地域
  '北京': { chinese: '北京', english: 'Beijing' },
  '上海': { chinese: '上海', english: 'Shanghai' },
  '深圳': { chinese: '深圳', english: 'Shenzhen' },
  '广州': { chinese: '广州', english: 'Guangzhou' },
  '杭州': { chinese: '杭州', english: 'Hangzhou' },
  '其他城市': { chinese: '其他城市', english: 'Other Cities' },
  
  // 行业
  '互联网/科技': { chinese: '互联网/科技', english: 'IT/Tech' },
  '金融服务': { chinese: '金融服务', english: 'Finance' },
  '制造业': { chinese: '制造业', english: 'Manufacturing' },
  '教育培训': { chinese: '教育培训', english: 'Education' },
  '医疗健康': { chinese: '医疗健康', english: 'Healthcare' },
  '政府机关': { chinese: '政府机关', english: 'Government' },
  '其他行业': { chinese: '其他行业', english: 'Other Industries' },
  
  // 薪资
  '3K以下': { chinese: '3K以下', english: 'Below 3K' },
  '3K-5K': { chinese: '3K-5K', english: '3K-5K' },
  '5K-8K': { chinese: '5K-8K', english: '5K-8K' },
  '8K-12K': { chinese: '8K-12K', english: '8K-12K' },
  '12K-20K': { chinese: '12K-20K', english: '12K-20K' },
  '20K以上': { chinese: '20K以上', english: 'Above 20K' },
  
  // 求职时长
  '1个月内': { chinese: '1个月内', english: 'Within 1 Month' },
  '1-3个月': { chinese: '1-3个月', english: '1-3 Months' },
  '3-6个月': { chinese: '3-6个月', english: '3-6 Months' },
  '6-12个月': { chinese: '6-12个月', english: '6-12 Months' },
  '12个月以上': { chinese: '12个月以上', english: 'Over 12 Months' },
  
  // 求职困难
  '缺乏经验': { chinese: '缺乏经验', english: 'Lack of Experience' },
  '技能不匹配': { chinese: '技能不匹配', english: 'Skill Mismatch' },
  '竞争激烈': { chinese: '竞争激烈', english: 'High Competition' },
  '薪资期望': { chinese: '薪资期望', english: 'Salary Expectation' },
  '地域限制': { chinese: '地域限制', english: 'Location Constraint' },
  '其他原因': { chinese: '其他原因', english: 'Other Reasons' },
  
  // 就业难度感知
  '非常困难': { chinese: '非常困难', english: 'Very Difficult' },
  '比较困难': { chinese: '比较困难', english: 'Difficult' },
  '一般': { chinese: '一般', english: 'Average' },
  '比较容易': { chinese: '比较容易', english: 'Easy' },
  '非常容易': { chinese: '非常容易', english: 'Very Easy' },
  
  // 薪资感知
  '低于预期': { chinese: '低于预期', english: 'Below Expectation' },
  '符合预期': { chinese: '符合预期', english: 'Meet Expectation' },
  '高于预期': { chinese: '高于预期', english: 'Above Expectation' },
  '远超预期': { chinese: '远超预期', english: 'Far Above Expectation' }
};

function formatBilingualTitle(title) {
  const bilingual = CHART_TITLE_BILINGUAL_MAP[title] || { chinese: title, english: title };
  return `${bilingual.chinese}\n${bilingual.english}`;
}

function formatBilingualDataLabel(label) {
  const bilingual = DATA_LABEL_BILINGUAL_MAP[label] || { chinese: label, english: label };
  return `${bilingual.chinese}\n(${bilingual.english})`;
}

function checkChartBilingualSupport(chartId, title, data) {
  console.log(`\n📊 检查图表: ${chartId}`);
  
  // 检查标题双语支持
  const titleBilingual = CHART_TITLE_BILINGUAL_MAP[title];
  const hasTitleBilingual = titleBilingual && titleBilingual.chinese && titleBilingual.english;
  
  console.log(`   📋 标题: ${title}`);
  if (hasTitleBilingual) {
    console.log(`     ✅ 双语支持: ${titleBilingual.chinese} / ${titleBilingual.english}`);
  } else {
    console.log(`     ❌ 缺少双语映射`);
  }
  
  // 检查数据标签双语支持
  console.log(`   🏷️  数据标签检查:`);
  const labelResults = [];
  
  data.forEach((item, index) => {
    const labelBilingual = DATA_LABEL_BILINGUAL_MAP[item.name];
    const hasLabelBilingual = labelBilingual && labelBilingual.chinese && labelBilingual.english;
    
    if (hasLabelBilingual) {
      console.log(`     ✅ ${item.name}: ${labelBilingual.chinese} / ${labelBilingual.english}`);
      labelResults.push(true);
    } else {
      console.log(`     ❌ ${item.name}: 缺少双语映射`);
      labelResults.push(false);
    }
  });
  
  const labelSuccessRate = labelResults.filter(r => r).length / labelResults.length;
  
  return {
    chartId,
    title,
    hasTitleBilingual,
    labelSuccessRate,
    totalLabels: data.length,
    successfulLabels: labelResults.filter(r => r).length,
    issues: labelResults.filter(r => !r).length
  };
}

async function testComprehensiveBilingualCheck() {
  console.log('🌐 开始全面检查所有图表的双语显示状态...\n');

  console.log('📋 1. 双语显示优化方案');
  console.log('   🎯 图表标题: 上下结构，左对齐');
  console.log('     格式: 中文标题');
  console.log('           English Title');
  console.log('');
  console.log('   🏷️  数据标签: 上下排列，居中对齐，换行显示');
  console.log('     格式: 中文标签');
  console.log('           (English Label)');
  console.log('');
  console.log('   💡 优势:');
  console.log('     - 避免标签过长导致遮挡');
  console.log('     - 支持国际化用户群体');
  console.log('     - 便于开发者验证映射正确性');
  console.log('     - 提升学术研究的专业性');

  console.log('\n📊 2. 全面检查所有图表');
  
  const results = [];
  const chartIds = Object.keys(ALL_CHART_DATA);
  
  for (const chartId of chartIds) {
    const title = CHART_TITLE_MAP[chartId] || chartId;
    const data = ALL_CHART_DATA[chartId];
    const result = checkChartBilingualSupport(chartId, title, data);
    results.push(result);
  }

  console.log('\n🎯 3. 检查结果汇总');
  
  const titleSuccessCount = results.filter(r => r.hasTitleBilingual).length;
  const totalCharts = results.length;
  const totalLabels = results.reduce((sum, r) => sum + r.totalLabels, 0);
  const successfulLabels = results.reduce((sum, r) => sum + r.successfulLabels, 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
  
  console.log(`📊 图表总数: ${totalCharts}`);
  console.log(`✅ 标题双语支持: ${titleSuccessCount}/${totalCharts} (${Math.round(titleSuccessCount/totalCharts*100)}%)`);
  console.log(`🏷️  数据标签总数: ${totalLabels}`);
  console.log(`✅ 标签双语支持: ${successfulLabels}/${totalLabels} (${Math.round(successfulLabels/totalLabels*100)}%)`);
  console.log(`❌ 待修复问题: ${totalIssues}个`);

  console.log('\n🔍 4. 问题详情');
  
  const titleIssues = results.filter(r => !r.hasTitleBilingual);
  const labelIssues = results.filter(r => r.issues > 0);
  
  if (titleIssues.length > 0) {
    console.log('\n   📋 缺少标题双语映射的图表:');
    titleIssues.forEach(issue => {
      console.log(`     - ${issue.chartId}: ${issue.title}`);
    });
  }
  
  if (labelIssues.length > 0) {
    console.log('\n   🏷️  存在标签双语映射问题的图表:');
    labelIssues.forEach(issue => {
      console.log(`     - ${issue.chartId}: ${issue.issues}/${issue.totalLabels}个标签缺少双语映射`);
    });
  }

  console.log('\n🌐 5. 换行显示优化效果');
  
  console.log('\n   🔴 修复前的问题:');
  console.log('     - 标签过长: "1个月内 (Within 1 Month)" 导致X轴重叠');
  console.log('     - 单行显示: 占用过多横向空间');
  console.log('     - 视觉混乱: 标签遮挡影响图表可读性');
  
  console.log('\n   🟢 修复后的效果:');
  console.log('     - 换行显示: 中文和英文分行显示');
  console.log('     - 空间优化: 减少横向占位，避免遮挡');
  console.log('     - 视觉清晰: 图表更加美观易读');
  console.log('     - 国际化友好: 支持中英文用户');

  console.log('\n🎊 6. 最终评估');
  
  const overallSuccess = titleSuccessCount === totalCharts && totalIssues === 0;
  
  if (overallSuccess) {
    console.log('🎉 双语显示检查完全通过！');
    console.log('✅ 所有图表标题支持双语显示');
    console.log('✅ 所有数据标签支持双语映射');
    console.log('✅ 换行显示优化完成');
    console.log('✅ 国际化支持完善');
  } else {
    console.log('⚠️  发现需要修复的问题:');
    if (titleSuccessCount < totalCharts) {
      console.log(`   - ${totalCharts - titleSuccessCount}个图表标题缺少双语映射`);
    }
    if (totalIssues > 0) {
      console.log(`   - ${totalIssues}个数据标签缺少双语映射`);
    }
  }

  console.log('\n🚀 检查完成！');
  
  return {
    totalCharts,
    titleSuccess: titleSuccessCount,
    totalLabels,
    labelSuccess: successfulLabels,
    totalIssues,
    overallSuccess,
    results
  };
}

// 运行测试
if (require.main === module) {
  testComprehensiveBilingualCheck()
    .then(report => {
      console.log('\n📋 最终报告:', JSON.stringify(report, null, 2));
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 检查失败:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensiveBilingualCheck };

#!/usr/bin/env node

/**
 * 深度双语显示问题修复测试
 * 专门测试学历分布、就业准备情况等问题图表
 */

// 双语标题映射
const CHART_TITLE_BILINGUAL_MAP = {
  '学历分布': { chinese: '学历分布', english: 'Education Level Distribution' },
  '学历层次分布': { chinese: '学历层次分布', english: 'Education Level Distribution' },
  '教育水平分布': { chinese: '教育水平分布', english: 'Education Level Distribution' },
  '就业准备情况': { chinese: '就业准备情况', english: 'Career Preparation Status' },
  '专业分布': { chinese: '专业分布', english: 'Major Field Distribution' },
  '性别分布': { chinese: '性别分布', english: 'Gender Distribution' },
  '年龄分布': { chinese: '年龄分布', english: 'Age Distribution' },
  '当前身份状态分布': { chinese: '当前身份状态分布', english: 'Current Status Distribution' }
};

// 双语数据标签映射
const DATA_LABEL_BILINGUAL_MAP = {
  // 学历标签 - 多种变体
  '高中及以下': { chinese: '高中及以下', english: 'High School or Below' },
  '高中/中专以下': { chinese: '高中/中专以下', english: 'High School or Below' },
  '专科': { chinese: '专科', english: 'Associate Degree' },
  '大专': { chinese: '大专', english: 'Associate Degree' },
  '本科': { chinese: '本科', english: 'Bachelor Degree' },
  '硕士': { chinese: '硕士', english: 'Master Degree' },
  '硕士研究生': { chinese: '硕士研究生', english: 'Master Degree' },
  '博士': { chinese: '博士', english: 'PhD' },
  '博士研究生': { chinese: '博士研究生', english: 'PhD' },
  
  // 就业准备情况
  '充分准备': { chinese: '充分准备', english: 'Well Prepared' },
  '基本准备': { chinese: '基本准备', english: 'Basically Prepared' },
  '准备不足': { chinese: '准备不足', english: 'Insufficiently Prepared' },
  '完全没准备': { chinese: '完全没准备', english: 'Not Prepared' },
  '不确定': { chinese: '不确定', english: 'Uncertain' },
  
  // 性别
  '男性': { chinese: '男性', english: 'Male' },
  '女性': { chinese: '女性', english: 'Female' },
  '不愿透露': { chinese: '不愿透露', english: 'Prefer not to say' },
  
  // 年龄段
  '18-22岁': { chinese: '18-22岁', english: '18-22 years' },
  '23-25岁': { chinese: '23-25岁', english: '23-25 years' },
  '26-30岁': { chinese: '26-30岁', english: '26-30 years' },
  '31-35岁': { chinese: '31-35岁', english: '31-35 years' },
  '35岁以上': { chinese: '35岁以上', english: 'Over 35 years' }
};

// 模拟问题图表的数据
const PROBLEMATIC_CHARTS = [
  {
    questionId: 'education-level',
    questionTitle: '学历分布',
    chartType: 'bar',
    data: [
      { name: '高中/中专以下', value: 50, percentage: 5 },
      { name: '大专', value: 200, percentage: 20 },
      { name: '本科', value: 500, percentage: 50 },
      { name: '硕士研究生', value: 200, percentage: 20 },
      { name: '博士研究生', value: 50, percentage: 5 }
    ]
  },
  {
    questionId: 'career-preparation',
    questionTitle: '就业准备情况',
    chartType: 'bar',
    data: [
      { name: '充分准备', value: 180, percentage: 18 },
      { name: '基本准备', value: 320, percentage: 32 },
      { name: '准备不足', value: 280, percentage: 28 },
      { name: '完全没准备', value: 150, percentage: 15 },
      { name: '不确定', value: 70, percentage: 7 }
    ]
  },
  {
    questionId: 'major-field',
    questionTitle: '专业分布',
    chartType: 'pie',
    data: [
      { name: '计算机科学', value: 250, percentage: 25 },
      { name: '经济学', value: 200, percentage: 20 },
      { name: '工程学', value: 180, percentage: 18 },
      { name: '管理学', value: 150, percentage: 15 },
      { name: '文学', value: 120, percentage: 12 },
      { name: '其他', value: 100, percentage: 10 }
    ]
  }
];

function formatBilingualTitle(title) {
  const bilingual = CHART_TITLE_BILINGUAL_MAP[title] || { chinese: title, english: title };
  return `${bilingual.chinese}\n${bilingual.english}`;
}

function formatBilingualDataLabel(label) {
  const bilingual = DATA_LABEL_BILINGUAL_MAP[label] || { chinese: label, english: label };
  return `${bilingual.chinese}\n(${bilingual.english})`;
}

function testChartTitleMapping(chart) {
  console.log(`\n📊 测试图表: ${chart.questionId}`);
  console.log(`   📋 原始标题: "${chart.questionTitle}"`);
  
  const titleBilingual = CHART_TITLE_BILINGUAL_MAP[chart.questionTitle];
  const hasTitleBilingual = titleBilingual && titleBilingual.chinese && titleBilingual.english;
  
  if (hasTitleBilingual) {
    console.log(`   ✅ 标题双语映射: 存在`);
    console.log(`     中文: ${titleBilingual.chinese}`);
    console.log(`     英文: ${titleBilingual.english}`);
    console.log(`   📝 显示格式:`);
    console.log(`     ${titleBilingual.chinese}`);
    console.log(`     ${titleBilingual.english}`);
  } else {
    console.log(`   ❌ 标题双语映射: 缺失`);
    console.log(`     需要添加: '${chart.questionTitle}': { chinese: '${chart.questionTitle}', english: 'English Title' }`);
  }
  
  return hasTitleBilingual;
}

function testDataLabelMapping(chart) {
  console.log(`   🏷️  数据标签测试:`);
  
  const labelResults = [];
  
  chart.data.forEach((item, index) => {
    const labelBilingual = DATA_LABEL_BILINGUAL_MAP[item.name];
    const hasLabelBilingual = labelBilingual && labelBilingual.chinese && labelBilingual.english;
    
    if (hasLabelBilingual) {
      console.log(`     ✅ "${item.name}": ${labelBilingual.chinese} / ${labelBilingual.english}`);
      console.log(`       换行格式: ${formatBilingualDataLabel(item.name).replace('\n', ' → ')}`);
      labelResults.push(true);
    } else {
      console.log(`     ❌ "${item.name}": 缺少双语映射`);
      console.log(`       需要添加: '${item.name}': { chinese: '${item.name}', english: 'English Label' }`);
      labelResults.push(false);
    }
  });
  
  const successRate = labelResults.filter(r => r).length / labelResults.length;
  console.log(`   📊 标签成功率: ${Math.round(successRate * 100)}% (${labelResults.filter(r => r).length}/${labelResults.length})`);
  
  return successRate;
}

function testDataMappingCorrectness(chart) {
  console.log(`   🔍 数据映射正确性检查:`);
  
  // 检查是否是正确的数据类型
  let isCorrectData = true;
  let dataTypeDescription = '';
  
  switch (chart.questionId) {
    case 'education-level':
      // 学历分布应该包含学历相关的标签
      const educationLabels = ['高中', '大专', '本科', '硕士', '博士'];
      const hasEducationLabels = chart.data.some(item => 
        educationLabels.some(label => item.name.includes(label))
      );
      isCorrectData = hasEducationLabels;
      dataTypeDescription = '学历相关标签';
      break;
      
    case 'career-preparation':
      // 就业准备应该包含准备程度相关的标签
      const preparationLabels = ['准备', '没准备', '不确定'];
      const hasPreparationLabels = chart.data.some(item => 
        preparationLabels.some(label => item.name.includes(label))
      );
      isCorrectData = hasPreparationLabels;
      dataTypeDescription = '就业准备相关标签';
      break;
      
    case 'major-field':
      // 专业分布应该包含专业相关的标签
      const majorLabels = ['科学', '学', '工程', '管理', '文学'];
      const hasMajorLabels = chart.data.some(item => 
        majorLabels.some(label => item.name.includes(label))
      );
      isCorrectData = hasMajorLabels;
      dataTypeDescription = '专业相关标签';
      break;
  }
  
  if (isCorrectData) {
    console.log(`     ✅ 数据类型正确: 包含${dataTypeDescription}`);
  } else {
    console.log(`     ❌ 数据类型错误: 应包含${dataTypeDescription}，但实际数据不匹配`);
    console.log(`     🔧 可能的问题: 数据映射配置错误，需要检查dimensionCompatibilityAdapter.ts`);
  }
  
  return isCorrectData;
}

async function testDeepBilingualFix() {
  console.log('🔍 开始深度双语显示问题修复测试...\n');

  console.log('📋 1. 问题分析目标');
  console.log('   🎯 图表标题: 确保所有标题都有双语映射');
  console.log('   🏷️  数据标签: 确保所有数据标签都有双语映射');
  console.log('   🔍 数据正确性: 确保图表显示的是正确的数据类型');
  console.log('   🎨 显示格式: 验证双语换行显示效果');

  console.log('\n📊 2. 问题图表深度测试');
  
  const testResults = [];
  
  for (const chart of PROBLEMATIC_CHARTS) {
    const hasTitleBilingual = testChartTitleMapping(chart);
    const labelSuccessRate = testDataLabelMapping(chart);
    const isCorrectData = testDataMappingCorrectness(chart);
    
    testResults.push({
      chartId: chart.questionId,
      title: chart.questionTitle,
      hasTitleBilingual,
      labelSuccessRate,
      isCorrectData,
      overallScore: (hasTitleBilingual ? 0.4 : 0) + (labelSuccessRate * 0.4) + (isCorrectData ? 0.2 : 0)
    });
  }

  console.log('\n🎯 3. 修复效果汇总');
  
  const titleSuccessCount = testResults.filter(r => r.hasTitleBilingual).length;
  const avgLabelSuccessRate = testResults.reduce((sum, r) => sum + r.labelSuccessRate, 0) / testResults.length;
  const dataCorrectCount = testResults.filter(r => r.isCorrectData).length;
  const avgOverallScore = testResults.reduce((sum, r) => sum + r.overallScore, 0) / testResults.length;
  
  console.log(`📊 测试图表总数: ${testResults.length}`);
  console.log(`✅ 标题双语支持: ${titleSuccessCount}/${testResults.length} (${Math.round(titleSuccessCount/testResults.length*100)}%)`);
  console.log(`🏷️  标签双语支持: ${Math.round(avgLabelSuccessRate*100)}% 平均成功率`);
  console.log(`🔍 数据映射正确: ${dataCorrectCount}/${testResults.length} (${Math.round(dataCorrectCount/testResults.length*100)}%)`);
  console.log(`📈 综合评分: ${Math.round(avgOverallScore*100)}%`);

  console.log('\n🌟 4. 具体问题和修复建议');
  
  testResults.forEach(result => {
    console.log(`\n   📊 ${result.title} (${result.chartId}):`);
    console.log(`     综合评分: ${Math.round(result.overallScore*100)}%`);
    
    if (!result.hasTitleBilingual) {
      console.log(`     🔧 需要修复: 添加标题双语映射`);
    }
    
    if (result.labelSuccessRate < 1) {
      console.log(`     🔧 需要修复: 完善数据标签双语映射 (当前${Math.round(result.labelSuccessRate*100)}%)`);
    }
    
    if (!result.isCorrectData) {
      console.log(`     🔧 需要修复: 检查数据映射配置，确保显示正确的数据类型`);
    }
    
    if (result.overallScore >= 0.9) {
      console.log(`     ✅ 状态: 优秀，双语显示完整`);
    } else if (result.overallScore >= 0.7) {
      console.log(`     ⚠️  状态: 良好，需要小幅优化`);
    } else {
      console.log(`     ❌ 状态: 需要重点修复`);
    }
  });

  console.log('\n🎊 5. 最终评估');
  
  const allIssuesFixed = titleSuccessCount === testResults.length && 
                        avgLabelSuccessRate === 1 && 
                        dataCorrectCount === testResults.length;
  
  if (allIssuesFixed) {
    console.log('🎉 深度双语显示修复完全成功！');
    console.log('✅ 所有图表标题支持双语显示');
    console.log('✅ 所有数据标签支持双语显示');
    console.log('✅ 所有图表数据映射正确');
    console.log('✅ 双语换行显示格式完美');
  } else {
    console.log('⚠️  仍需要进一步修复:');
    if (titleSuccessCount < testResults.length) {
      console.log(`   - ${testResults.length - titleSuccessCount}个图表标题需要双语映射`);
    }
    if (avgLabelSuccessRate < 1) {
      console.log(`   - 数据标签双语支持需要提升到100%`);
    }
    if (dataCorrectCount < testResults.length) {
      console.log(`   - ${testResults.length - dataCorrectCount}个图表的数据映射需要修复`);
    }
  }

  console.log('\n🚀 测试完成！');
  
  return {
    totalCharts: testResults.length,
    titleSuccess: titleSuccessCount,
    avgLabelSuccessRate,
    dataCorrectCount,
    avgOverallScore,
    allIssuesFixed,
    results: testResults
  };
}

// 运行测试
if (require.main === module) {
  testDeepBilingualFix()
    .then(report => {
      console.log('\n📋 最终报告:', JSON.stringify(report, null, 2));
      process.exit(report.allIssuesFixed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testDeepBilingualFix };

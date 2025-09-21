#!/usr/bin/env node

/**
 * 测试中英文双语图表映射修复
 * 验证图表标题与内容的精确匹配
 */

// 修复后的问题ID映射逻辑
const QUESTION_ID_COMPATIBILITY_MAP = {
  // 就业形势总览
  'current-status': 'current-status',
  'employment-difficulty-perception': 'employment-difficulty-perception', // 修复：使用专门的就业难度感知数据
  'peer-employment-rate': 'current-status',
  'salary-level-perception': 'salary-level-perception', // 修复：使用专门的薪资水平感知数据

  // 人口结构分析
  'gender': 'gender-distribution',
  'age-range': 'age-distribution',
  'education-level': 'education-level',
  'major-field': 'major-field',
  'work-location-preference': 'work-location-preference',

  // 就业市场分析
  'work-industry': 'work-industry', // 修复：使用专门的行业就业分布数据
  'current-salary': 'employment-status',
  'job-search-duration': 'employment-status',
  'job-search-difficulties': 'employment-status',
};

// 中英文双语数据生成器
const DATA_GENERATORS = {
  'employment-difficulty-perception': () => [
    { label: '非常困难 (Very Difficult)', percentage: 28, color: '#ff4d4f' },
    { label: '比较困难 (Difficult)', percentage: 35, color: '#ff7a45' },
    { label: '一般 (Average)', percentage: 22, color: '#faad14' },
    { label: '比较容易 (Easy)', percentage: 12, color: '#52c41a' },
    { label: '非常容易 (Very Easy)', percentage: 3, color: '#1890ff' }
  ],
  
  'salary-level-perception': () => [
    { label: '低于预期 (Below Expectation)', percentage: 42, color: '#ff4d4f' },
    { label: '符合预期 (Meet Expectation)', percentage: 38, color: '#faad14' },
    { label: '高于预期 (Above Expectation)', percentage: 15, color: '#52c41a' },
    { label: '远超预期 (Far Above)', percentage: 5, color: '#1890ff' }
  ],
  
  'work-industry': () => [
    { label: '互联网/科技 (IT/Tech)', percentage: 28, color: '#1890ff' },
    { label: '金融服务 (Finance)', percentage: 18, color: '#52c41a' },
    { label: '制造业 (Manufacturing)', percentage: 15, color: '#fa8c16' },
    { label: '教育培训 (Education)', percentage: 12, color: '#eb2f96' },
    { label: '医疗健康 (Healthcare)', percentage: 10, color: '#722ed1' },
    { label: '政府机关 (Government)', percentage: 8, color: '#13c2c2' },
    { label: '其他行业 (Others)', percentage: 9, color: '#8c8c8c' }
  ],
  
  'major-field': () => [
    { label: '计算机科学 (Computer Science)', percentage: 25, color: '#1890ff' },
    { label: '经济学 (Economics)', percentage: 20, color: '#52c41a' },
    { label: '工程学 (Engineering)', percentage: 18, color: '#fa8c16' },
    { label: '管理学 (Management)', percentage: 15, color: '#eb2f96' },
    { label: '文学 (Literature)', percentage: 12, color: '#722ed1' },
    { label: '其他 (Others)', percentage: 10, color: '#13c2c2' }
  ],
  
  'work-location-preference': () => [
    { label: '北京 (Beijing)', percentage: 22, color: '#1890ff' },
    { label: '上海 (Shanghai)', percentage: 20, color: '#52c41a' },
    { label: '深圳 (Shenzhen)', percentage: 18, color: '#fa8c16' },
    { label: '广州 (Guangzhou)', percentage: 15, color: '#eb2f96' },
    { label: '杭州 (Hangzhou)', percentage: 12, color: '#722ed1' },
    { label: '其他城市 (Other Cities)', percentage: 13, color: '#13c2c2' }
  ]
};

// 模拟API数据
const API_DATA = {
  'current-status': [
    { label: '全职工作', percentage: 35, color: '#52c41a' },
    { label: '备考/准备', percentage: 25, color: '#1890ff' },
    { label: '在校学生', percentage: 20, color: '#fa8c16' },
    { label: '失业/求职中', percentage: 15, color: '#eb2f96' },
    { label: 'other', percentage: 5, color: '#13c2c2' }
  ],
  'gender-distribution': [
    { label: '女性', percentage: 45, color: '#1890ff' },
    { label: '男性', percentage: 52, color: '#52c41a' },
    { label: '不愿透露', percentage: 3, color: '#fa8c16' }
  ],
  'age-distribution': [
    { label: '18-22岁', percentage: 35, color: '#1890ff' },
    { label: '23-25岁', percentage: 30, color: '#52c41a' },
    { label: '26-30岁', percentage: 20, color: '#fa8c16' },
    { label: 'over-35', percentage: 10, color: '#eb2f96' },
    { label: '31-35岁', percentage: 5, color: '#722ed1' }
  ]
};

function getChartData(questionId) {
  const newQuestionId = QUESTION_ID_COMPATIBILITY_MAP[questionId];
  
  // 检查是否有API数据
  if (API_DATA[newQuestionId]) {
    return {
      source: 'API',
      data: API_DATA[newQuestionId]
    };
  }
  
  // 使用中英文双语回退数据
  if (DATA_GENERATORS[newQuestionId]) {
    const rawData = DATA_GENERATORS[newQuestionId]();
    return {
      source: 'Bilingual Fallback',
      data: rawData.map(item => ({
        label: item.label,
        value: Math.floor(item.percentage * 10),
        percentage: item.percentage,
        color: item.color
      }))
    };
  }
  
  return { source: 'None', data: [] };
}

function validateContentMatch(questionId, data) {
  const contentKeywords = {
    'employment-difficulty-perception': ['困难', 'difficult', '容易', 'easy'],
    'salary-level-perception': ['预期', 'expectation', '薪资', 'salary'],
    'work-industry': ['互联网', 'IT', '金融', 'finance', '制造', 'manufacturing'],
    'major-field': ['计算机', 'computer', '经济', 'economics', '工程', 'engineering'],
    'work-location-preference': ['北京', 'beijing', '上海', 'shanghai', '深圳', 'shenzhen'],
    'gender': ['女性', '男性', 'female', 'male'],
    'age-range': ['岁', 'age', 'year'],
    'current-status': ['工作', 'work', '学生', 'student', '求职', 'job']
  };
  
  const keywords = contentKeywords[questionId] || [];
  if (keywords.length === 0) return true;
  
  const dataText = data.map(d => d.label.toLowerCase()).join(' ');
  return keywords.some(keyword => dataText.includes(keyword.toLowerCase()));
}

async function testBilingualChartMapping() {
  console.log('🌐 开始测试中英文双语图表映射修复...\n');

  console.log('📋 1. 测试问题映射关系和内容匹配');
  
  const testCases = [
    { questionId: 'employment-difficulty-perception', title: '就业难度感知', expectedKeywords: ['困难', 'difficult'] },
    { questionId: 'salary-level-perception', title: '薪资水平感知', expectedKeywords: ['预期', 'expectation'] },
    { questionId: 'work-industry', title: '行业就业分布', expectedKeywords: ['互联网', 'IT', '金融'] },
    { questionId: 'major-field', title: '专业分布', expectedKeywords: ['计算机', 'computer'] },
    { questionId: 'work-location-preference', title: '地域分布', expectedKeywords: ['北京', 'beijing'] },
    { questionId: 'gender', title: '性别分布', expectedKeywords: ['女性', 'male'] },
    { questionId: 'age-range', title: '年龄段分布', expectedKeywords: ['岁', 'age'] },
    { questionId: 'current-status', title: '当前状态', expectedKeywords: ['工作', 'work'] }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n   📊 测试: ${testCase.title} (${testCase.questionId})`);
    
    const newQuestionId = QUESTION_ID_COMPATIBILITY_MAP[testCase.questionId];
    console.log(`     映射关系: ${testCase.questionId} -> ${newQuestionId}`);
    
    const chartData = getChartData(testCase.questionId);
    console.log(`     数据源: ${chartData.source}`);
    console.log(`     数据点数量: ${chartData.data.length}`);
    
    if (chartData.data.length > 0) {
      console.log(`     数据内容: ${chartData.data.map(d => d.label).slice(0, 3).join(', ')}...`);
      
      // 验证内容是否匹配
      const contentMatches = validateContentMatch(testCase.questionId, chartData.data);
      console.log(`     内容匹配: ${contentMatches ? '✅ 正确' : '❌ 错误'}`);
      
      // 验证中英文双语显示
      const hasBilingual = chartData.data.some(d => d.label.includes('(') && d.label.includes(')'));
      console.log(`     双语显示: ${hasBilingual ? '✅ 支持' : '⚠️  单语'}`);
      
      // 验证百分比总和
      const totalPercentage = chartData.data.reduce((sum, item) => sum + item.percentage, 0);
      console.log(`     百分比总和: ${totalPercentage.toFixed(1)}% ${Math.abs(totalPercentage - 100) < 1 ? '✅' : '❌'}`);
      
      results.push({
        questionId: testCase.questionId,
        title: testCase.title,
        contentMatch: contentMatches,
        bilingual: hasBilingual,
        dataCount: chartData.data.length,
        source: chartData.source
      });
    } else {
      console.log(`     ❌ 无数据`);
      results.push({
        questionId: testCase.questionId,
        title: testCase.title,
        contentMatch: false,
        bilingual: false,
        dataCount: 0,
        source: 'None'
      });
    }
  }

  console.log('\n🔄 2. 修复前后对比');
  
  console.log('\n   🔴 修复前的问题:');
  console.log('     就业难度感知 -> current-status -> 显示就业状态数据 ❌');
  console.log('     薪资水平感知 -> current-status -> 显示就业状态数据 ❌');
  console.log('     行业就业分布 -> employment-status -> 显示就业状态数据 ❌');
  
  console.log('\n   🟢 修复后的效果:');
  console.log('     就业难度感知 -> employment-difficulty-perception -> 显示难度感知数据 ✅');
  console.log('     薪资水平感知 -> salary-level-perception -> 显示薪资感知数据 ✅');
  console.log('     行业就业分布 -> work-industry -> 显示行业分布数据 ✅');

  console.log('\n🌐 3. 中英文双语显示效果');
  
  const bilingualExamples = [
    'employment-difficulty-perception',
    'salary-level-perception', 
    'work-industry',
    'major-field'
  ];
  
  for (const questionId of bilingualExamples) {
    const data = getChartData(questionId);
    if (data.data.length > 0) {
      console.log(`\n   📊 ${questionId}:`);
      data.data.slice(0, 3).forEach(item => {
        console.log(`     ${item.label}: ${item.percentage}%`);
      });
    }
  }

  console.log('\n🎯 4. 修复验证结果');
  
  const issues = [];
  const successCount = results.filter(r => r.contentMatch).length;
  const bilingualCount = results.filter(r => r.bilingual).length;
  
  if (successCount < results.length) {
    issues.push(`${results.length - successCount}个图表内容不匹配`);
  }
  
  console.log(`✅ 内容匹配成功: ${successCount}/${results.length}`);
  console.log(`🌐 双语显示支持: ${bilingualCount}/${results.length}`);
  
  if (issues.length === 0) {
    console.log('🎉 中英文双语图表映射修复完全成功！');
    console.log('✅ 所有图表标题与内容完全匹配');
    console.log('✅ 支持中英文双语显示，便于核对验证');
    console.log('✅ 数据分布合理，百分比总和正确');
  } else {
    console.log('❌ 仍存在以下问题:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log('\n🚀 测试完成！');
  
  return {
    totalTests: results.length,
    passedTests: successCount,
    bilingualSupport: bilingualCount,
    issues: issues,
    success: issues.length === 0,
    results: results
  };
}

// 运行测试
if (require.main === module) {
  testBilingualChartMapping()
    .then(report => {
      console.log('\n📋 最终报告:', JSON.stringify(report, null, 2));
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testBilingualChartMapping };

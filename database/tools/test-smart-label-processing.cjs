#!/usr/bin/env node

/**
 * 智能标签处理测试
 * 测试数值标签、文本标签的智能双语处理
 */

// 模拟智能标签处理函数
function shouldApplyBilingualLabel(label) {
  if (!label || typeof label !== 'string') return false;
  
  // 纯数字标签不需要双语处理
  if (/^\d+$/.test(label.trim())) return false;
  
  // 数值范围标签不需要双语处理 (如: "2000-3000", "3K-5K", "18-22")
  if (/^\d+[-~]\d+$/.test(label.trim())) return false;
  if (/^\d+[KkMm]?[-~]\d+[KkMm]?$/.test(label.trim())) return false;
  
  // 带单位的数值不需要双语处理 (如: "3K以下", "20K以上", "6000以上")
  if (/^\d+[KkMm]?以[下上]$/.test(label.trim())) return false;
  
  // 年龄范围特殊处理 (如: "18-22岁")
  if (/^\d+[-~]\d+岁$/.test(label.trim())) return true;
  
  // 百分比不需要双语处理
  if (/^\d+(\.\d+)?%$/.test(label.trim())) return false;
  
  // 货币金额不需要双语处理 (如: "¥2000", "$1000")
  if (/^[¥$€£]\d+/.test(label.trim())) return false;
  
  // 其他情况默认需要双语处理
  return true;
}

function formatSmartBilingualDataLabel(label, bilingualMap = {}) {
  if (!shouldApplyBilingualLabel(label)) {
    // 不需要双语处理的标签，直接返回原标签
    return label;
  }
  
  const bilingual = bilingualMap[label] || { chinese: label, english: label };
  if (bilingual.chinese === bilingual.english) {
    // 中英文相同时，只显示一次
    return bilingual.chinese;
  }
  
  return `${bilingual.chinese}\n(${bilingual.english})`;
}

// 测试用例
const TEST_LABELS = [
  // 数值类标签 (不应该双语处理)
  { label: '2000-3000', type: '住房成本范围', shouldBilingual: false },
  { label: '3000-4000', type: '住房成本范围', shouldBilingual: false },
  { label: '5000-6000', type: '住房成本范围', shouldBilingual: false },
  { label: '6000以上', type: '住房成本范围', shouldBilingual: false },
  { label: '3K-5K', type: '薪资范围', shouldBilingual: false },
  { label: '5K-8K', type: '薪资范围', shouldBilingual: false },
  { label: '20K以上', type: '薪资范围', shouldBilingual: false },
  { label: '100', type: '纯数字', shouldBilingual: false },
  { label: '85.5%', type: '百分比', shouldBilingual: false },
  { label: '¥2000', type: '货币金额', shouldBilingual: false },
  { label: '$1000', type: '货币金额', shouldBilingual: false },
  
  // 文本类标签 (应该双语处理)
  { label: '18-22岁', type: '年龄范围', shouldBilingual: true },
  { label: '23-25岁', type: '年龄范围', shouldBilingual: true },
  { label: '男性', type: '性别', shouldBilingual: true },
  { label: '女性', type: '性别', shouldBilingual: true },
  { label: '本科', type: '学历', shouldBilingual: true },
  { label: '硕士研究生', type: '学历', shouldBilingual: true },
  { label: '充分准备', type: '就业准备', shouldBilingual: true },
  { label: '准备不足', type: '就业准备', shouldBilingual: true },
  { label: '计算机科学', type: '专业', shouldBilingual: true },
  { label: '经济学', type: '专业', shouldBilingual: true }
];

// 双语映射 (简化版)
const BILINGUAL_MAP = {
  '18-22岁': { chinese: '18-22岁', english: '18-22 years' },
  '23-25岁': { chinese: '23-25岁', english: '23-25 years' },
  '男性': { chinese: '男性', english: 'Male' },
  '女性': { chinese: '女性', english: 'Female' },
  '本科': { chinese: '本科', english: 'Bachelor Degree' },
  '硕士研究生': { chinese: '硕士研究生', english: 'Master Degree' },
  '充分准备': { chinese: '充分准备', english: 'Well Prepared' },
  '准备不足': { chinese: '准备不足', english: 'Insufficiently Prepared' },
  '计算机科学': { chinese: '计算机科学', english: 'Computer Science' },
  '经济学': { chinese: '经济学', english: 'Economics' }
};

function testSmartLabelProcessing() {
  console.log('🧠 开始智能标签处理测试...\n');

  console.log('📋 1. 测试目标');
  console.log('   🎯 数值标签: 不进行双语处理，保持原样');
  console.log('   🏷️  文本标签: 智能双语处理，避免重复');
  console.log('   🔍 边界情况: 正确处理特殊格式的标签');
  console.log('   🎨 显示优化: 避免不必要的双语显示');

  console.log('\n📊 2. 标签分类测试');
  
  const results = [];
  
  TEST_LABELS.forEach(testCase => {
    const actualShouldBilingual = shouldApplyBilingualLabel(testCase.label);
    const expectedShouldBilingual = testCase.shouldBilingual;
    const isCorrect = actualShouldBilingual === expectedShouldBilingual;
    
    const formattedLabel = formatSmartBilingualDataLabel(testCase.label, BILINGUAL_MAP);
    
    console.log(`\n   📝 "${testCase.label}" (${testCase.type})`);
    console.log(`     预期: ${expectedShouldBilingual ? '需要双语' : '不需要双语'}`);
    console.log(`     实际: ${actualShouldBilingual ? '需要双语' : '不需要双语'}`);
    console.log(`     结果: ${isCorrect ? '✅ 正确' : '❌ 错误'}`);
    console.log(`     格式化后: "${formattedLabel.replace('\n', ' → ')}"`);
    
    results.push({
      label: testCase.label,
      type: testCase.type,
      expected: expectedShouldBilingual,
      actual: actualShouldBilingual,
      correct: isCorrect,
      formatted: formattedLabel
    });
  });

  console.log('\n🎯 3. 测试结果汇总');
  
  const correctCount = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);
  
  const numericLabels = results.filter(r => !r.expected);
  const textLabels = results.filter(r => r.expected);
  
  const numericCorrect = numericLabels.filter(r => r.correct).length;
  const textCorrect = textLabels.filter(r => r.correct).length;
  
  console.log(`📊 总体准确率: ${correctCount}/${totalCount} (${accuracy}%)`);
  console.log(`🔢 数值标签准确率: ${numericCorrect}/${numericLabels.length} (${Math.round(numericCorrect/numericLabels.length*100)}%)`);
  console.log(`📝 文本标签准确率: ${textCorrect}/${textLabels.length} (${Math.round(textCorrect/textLabels.length*100)}%)`);

  console.log('\n🌟 4. 优化效果展示');
  
  console.log('\n   🔴 优化前的问题:');
  console.log('     - 所有标签都被强制双语处理');
  console.log('     - 数值标签显示为 "2000-3000\\n(2000-3000)"');
  console.log('     - 造成不必要的视觉混乱和空间浪费');
  
  console.log('\n   🟢 优化后的效果:');
  console.log('     - 数值标签保持原样: "2000-3000"');
  console.log('     - 文本标签智能双语: "男性\\n(Male)"');
  console.log('     - 相同中英文只显示一次');
  console.log('     - 视觉清晰，空间利用高效');

  console.log('\n📋 5. 具体优化案例');
  
  // 展示几个典型的优化案例
  const showcases = [
    { label: '2000-3000', before: '2000-3000\n(2000-3000)', after: '2000-3000' },
    { label: '5K-8K', before: '5K-8K\n(5K-8K)', after: '5K-8K' },
    { label: '85.5%', before: '85.5%\n(85.5%)', after: '85.5%' },
    { label: '男性', before: '男性\n(Male)', after: '男性\n(Male)' },
    { label: '本科', before: '本科\n(Bachelor Degree)', after: '本科\n(Bachelor Degree)' }
  ];
  
  showcases.forEach(showcase => {
    const actualAfter = formatSmartBilingualDataLabel(showcase.label, BILINGUAL_MAP);
    const isOptimized = actualAfter === showcase.after;
    
    console.log(`\n   📊 "${showcase.label}"`);
    console.log(`     优化前: "${showcase.before.replace('\n', ' → ')}"`);
    console.log(`     优化后: "${showcase.after.replace('\n', ' → ')}"`);
    console.log(`     实际结果: "${actualAfter.replace('\n', ' → ')}"`);
    console.log(`     状态: ${isOptimized ? '✅ 优化成功' : '❌ 需要调整'}`);
  });

  console.log('\n🎊 6. 最终评估');
  
  if (accuracy >= 95) {
    console.log('🎉 智能标签处理完全成功！');
    console.log('✅ 数值标签正确识别，不进行双语处理');
    console.log('✅ 文本标签智能双语处理');
    console.log('✅ 避免了不必要的重复显示');
    console.log('✅ 优化了视觉效果和空间利用');
  } else if (accuracy >= 80) {
    console.log('⚠️  智能标签处理基本成功，需要微调:');
    const errors = results.filter(r => !r.correct);
    errors.forEach(error => {
      console.log(`   - "${error.label}": 预期${error.expected ? '双语' : '单语'}，实际${error.actual ? '双语' : '单语'}`);
    });
  } else {
    console.log('❌ 智能标签处理需要重大改进');
    console.log('   请检查正则表达式和判断逻辑');
  }

  console.log('\n🚀 测试完成！');
  
  return {
    totalCount,
    correctCount,
    accuracy,
    numericAccuracy: Math.round(numericCorrect/numericLabels.length*100),
    textAccuracy: Math.round(textCorrect/textLabels.length*100),
    results,
    success: accuracy >= 95
  };
}

// 运行测试
if (require.main === module) {
  testSmartLabelProcessing()
    .then ? testSmartLabelProcessing() : testSmartLabelProcessing()
    .then ? undefined : console.log('\n📋 测试报告已生成');
}

module.exports = { testSmartLabelProcessing };

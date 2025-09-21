#!/usr/bin/env node

/**
 * 测试兼容性适配器的工作情况
 * 验证新旧ID系统的映射和数据转换
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';

// 模拟前端的兼容性适配器逻辑
const DIMENSION_ID_COMPATIBILITY_MAP = {
  'demographics': 'demographic-analysis',
  'employment-market': 'employment-market-analysis', 
  'student-preparation': 'student-employment-preparation',
  'living-costs': 'living-costs',
  'policy-insights': 'policy-insights',
  'employment-overview': 'employment-overview'
};

const UNIFIED_DIMENSION_MAPPING = [
  {
    frontendId: 'employment-overview',
    title: '就业形势总览',
    questions: [
      { apiDataField: 'employmentStatus' }
    ]
  },
  {
    frontendId: 'demographic-analysis',
    title: '人口结构分析',
    questions: [
      { apiDataField: 'genderDistribution' },
      { apiDataField: 'ageDistribution' }
    ]
  },
  {
    frontendId: 'employment-market-analysis',
    title: '就业市场形势分析',
    questions: [
      { apiDataField: 'employmentStatus' }
    ]
  },
  {
    frontendId: 'student-employment-preparation',
    title: '学生就业准备',
    questions: [
      { apiDataField: 'educationLevel' }
    ]
  }
];

const LEGACY_DIMENSIONS = [
  { id: 'employment-overview', title: '就业形势总览' },
  { id: 'demographics', title: '人口结构分析' },
  { id: 'employment-market', title: '就业市场深度分析' },
  { id: 'student-preparation', title: '学生就业准备' },
  { id: 'living-costs', title: '生活成本与压力' },
  { id: 'policy-insights', title: '政策建议洞察' }
];

async function testCompatibilityAdapter() {
  console.log('🧪 开始测试兼容性适配器...\n');

  // 1. 测试API数据获取
  console.log('📡 1. 测试API数据获取');
  try {
    const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024?include_test_data=true`);
    const result = await response.json();
    
    if (result.success) {
      const apiData = result.data;
      console.log('✅ API数据获取成功');
      console.log(`   - 总响应数: ${apiData.totalResponses}`);
      console.log(`   - 可用字段: ${Object.keys(apiData).join(', ')}`);
      
      // 验证数据完整性
      const expectedFields = ['genderDistribution', 'ageDistribution', 'employmentStatus', 'educationLevel'];
      const missingFields = expectedFields.filter(field => !apiData[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ 所有必需的API字段都存在');
      } else {
        console.log(`❌ 缺失字段: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('❌ API数据获取失败:', result.message);
      return;
    }
  } catch (error) {
    console.log('❌ API请求失败:', error.message);
    return;
  }

  console.log('\n📋 2. 测试维度ID映射');
  
  // 2. 测试旧版ID到新版ID的映射
  for (const legacyDim of LEGACY_DIMENSIONS) {
    const newId = DIMENSION_ID_COMPATIBILITY_MAP[legacyDim.id] || legacyDim.id;
    const hasUnifiedMapping = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
    
    console.log(`   ${legacyDim.id} -> ${newId}`);
    console.log(`     标题: ${legacyDim.title}`);
    console.log(`     统一映射: ${hasUnifiedMapping ? '✅ 存在' : '❌ 不存在'}`);
    
    if (hasUnifiedMapping) {
      const apiFields = hasUnifiedMapping.questions.map(q => q.apiDataField);
      console.log(`     API字段: ${apiFields.join(', ')}`);
    }
    console.log('');
  }

  console.log('📊 3. 测试数据转换兼容性');
  
  // 3. 测试数据转换
  const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024?include_test_data=true`);
  const result = await response.json();
  const apiData = result.data;

  for (const legacyDim of LEGACY_DIMENSIONS) {
    const newId = DIMENSION_ID_COMPATIBILITY_MAP[legacyDim.id] || legacyDim.id;
    const unifiedMapping = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
    
    console.log(`   处理维度: ${legacyDim.id} (${legacyDim.title})`);
    
    if (unifiedMapping) {
      let hasData = false;
      
      for (const question of unifiedMapping.questions) {
        const fieldData = apiData[question.apiDataField];
        if (fieldData && fieldData.length > 0) {
          hasData = true;
          console.log(`     ✅ ${question.apiDataField}: ${fieldData.length}个数据点`);
          
          // 验证百分比总和
          const totalPercentage = fieldData.reduce((sum, item) => sum + item.percentage, 0);
          const isValidPercentage = Math.abs(totalPercentage - 100) < 0.1;
          console.log(`        百分比总和: ${totalPercentage.toFixed(1)}% ${isValidPercentage ? '✅' : '❌'}`);
        } else {
          console.log(`     ❌ ${question.apiDataField}: 无数据`);
        }
      }
      
      if (!hasData) {
        console.log(`     ⚠️  维度无可用数据，需要回退策略`);
      }
    } else {
      console.log(`     ⚠️  无统一映射，需要回退数据`);
    }
    console.log('');
  }

  console.log('📈 4. 生成兼容性报告');
  
  // 4. 生成兼容性报告
  const supportedDimensions = LEGACY_DIMENSIONS.filter(legacyDim => {
    const newId = DIMENSION_ID_COMPATIBILITY_MAP[legacyDim.id] || legacyDim.id;
    const unifiedMapping = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
    
    if (!unifiedMapping) return false;
    
    // 检查是否有实际数据
    return unifiedMapping.questions.some(question => {
      const fieldData = apiData[question.apiDataField];
      return fieldData && fieldData.length > 0;
    });
  });

  const compatibilityReport = {
    totalDimensions: LEGACY_DIMENSIONS.length,
    supportedDimensions: supportedDimensions.length,
    unsupportedDimensions: LEGACY_DIMENSIONS.length - supportedDimensions.length,
    supportedList: supportedDimensions.map(d => d.id),
    unsupportedList: LEGACY_DIMENSIONS.filter(d => !supportedDimensions.includes(d)).map(d => d.id)
  };

  console.log('   📊 兼容性统计:');
  console.log(`     总维度数: ${compatibilityReport.totalDimensions}`);
  console.log(`     支持的维度: ${compatibilityReport.supportedDimensions} (${(compatibilityReport.supportedDimensions/compatibilityReport.totalDimensions*100).toFixed(1)}%)`);
  console.log(`     待支持维度: ${compatibilityReport.unsupportedDimensions}`);
  console.log('');
  console.log(`   ✅ 支持的维度: ${compatibilityReport.supportedList.join(', ')}`);
  console.log(`   ⚠️  待支持维度: ${compatibilityReport.unsupportedList.join(', ')}`);

  console.log('\n🎯 5. 测试结论');
  
  if (compatibilityReport.supportedDimensions >= 4) {
    console.log('✅ 兼容性适配器工作正常');
    console.log('✅ 主要维度都有API数据支持');
    console.log('✅ 数据转换流程完整');
  } else if (compatibilityReport.supportedDimensions >= 2) {
    console.log('⚠️  兼容性适配器部分工作');
    console.log('⚠️  部分维度缺乏API数据支持');
    console.log('💡 建议: 为不支持的维度实现回退数据策略');
  } else {
    console.log('❌ 兼容性适配器存在问题');
    console.log('❌ 大部分维度无法获取数据');
    console.log('🔧 需要: 检查API映射配置和数据源');
  }

  console.log('\n🚀 测试完成！');
  
  return compatibilityReport;
}

// 运行测试
if (require.main === module) {
  testCompatibilityAdapter()
    .then(report => {
      console.log('\n📋 最终报告:', JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testCompatibilityAdapter };

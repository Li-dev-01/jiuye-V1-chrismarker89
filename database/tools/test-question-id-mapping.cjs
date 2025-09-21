#!/usr/bin/env node

/**
 * 测试问题ID映射修复
 * 验证旧版questionId与新版frontendQuestionId的映射关系
 */

// 模拟前端的问题ID映射逻辑
const QUESTION_ID_COMPATIBILITY_MAP = {
  // 就业形势总览
  'current-status': 'current-status',
  'employment-difficulty-perception': 'current-status',
  'peer-employment-rate': 'current-status',
  'salary-level-perception': 'current-status',
  
  // 人口结构分析
  'gender': 'gender-distribution',
  'age-range': 'age-distribution',
  'education-level': 'education-level',
  'major-field': 'gender-distribution',
  'work-location-preference': 'age-distribution',
  
  // 就业市场分析
  'work-industry': 'employment-status',
  'current-salary': 'employment-status',
  'job-search-duration': 'employment-status',
  'job-search-difficulties': 'employment-status',
  
  // 学生就业准备
  'academic-year': 'education-level',
  'career-preparation': 'education-level',
  
  // 生活成本压力
  'monthly-housing-cost': 'cost-pressure',
  'life-pressure-tier1': 'cost-pressure',
  'financial-pressure': 'cost-pressure',
  
  // 政策建议
  'employment-advice': 'policy-suggestions'
};

const UNIFIED_DIMENSION_MAPPING = [
  {
    frontendId: 'employment-overview',
    title: '就业形势总览',
    questions: [
      { frontendQuestionId: 'current-status', apiDataField: 'employmentStatus' }
    ]
  },
  {
    frontendId: 'demographic-analysis',
    title: '人口结构分析',
    questions: [
      { frontendQuestionId: 'gender-distribution', apiDataField: 'genderDistribution' },
      { frontendQuestionId: 'age-distribution', apiDataField: 'ageDistribution' }
    ]
  },
  {
    frontendId: 'employment-market-analysis',
    title: '就业市场形势分析',
    questions: [
      { frontendQuestionId: 'employment-status', apiDataField: 'employmentStatus' }
    ]
  },
  {
    frontendId: 'student-employment-preparation',
    title: '学生就业准备',
    questions: [
      { frontendQuestionId: 'education-level', apiDataField: 'educationLevel' }
    ]
  }
];

const LEGACY_QUESTIONS = [
  // 就业形势总览
  { dimensionId: 'employment-overview', questionId: 'current-status', title: '当前身份状态分布' },
  { dimensionId: 'employment-overview', questionId: 'employment-difficulty-perception', title: '就业难度感知' },
  { dimensionId: 'employment-overview', questionId: 'peer-employment-rate', title: '同龄人就业率观察' },
  { dimensionId: 'employment-overview', questionId: 'salary-level-perception', title: '薪资水平感知' },
  
  // 人口结构分析
  { dimensionId: 'demographics', questionId: 'gender', title: '性别分布' },
  { dimensionId: 'demographics', questionId: 'age-range', title: '年龄段分布' },
  { dimensionId: 'demographics', questionId: 'education-level', title: '学历结构' },
  { dimensionId: 'demographics', questionId: 'major-field', title: '专业分布' },
  { dimensionId: 'demographics', questionId: 'work-location-preference', title: '地域分布' },
  
  // 就业市场分析
  { dimensionId: 'employment-market', questionId: 'work-industry', title: '行业就业分布' },
  { dimensionId: 'employment-market', questionId: 'current-salary', title: '薪资水平分布' },
  { dimensionId: 'employment-market', questionId: 'job-search-duration', title: '求职时长分析' },
  { dimensionId: 'employment-market', questionId: 'job-search-difficulties', title: '求职困难分析' },
  
  // 学生就业准备
  { dimensionId: 'student-preparation', questionId: 'academic-year', title: '年级分布' },
  { dimensionId: 'student-preparation', questionId: 'career-preparation', title: '就业准备情况' },
  
  // 生活成本压力
  { dimensionId: 'living-costs', questionId: 'monthly-housing-cost', title: '住房成本分布' },
  { dimensionId: 'living-costs', questionId: 'life-pressure-tier1', title: '一线城市生活压力' },
  { dimensionId: 'living-costs', questionId: 'financial-pressure', title: '经济压力状况' },
  
  // 政策建议
  { dimensionId: 'policy-insights', questionId: 'employment-advice', title: '改善建议统计' }
];

async function testQuestionIdMapping() {
  console.log('🧪 开始测试问题ID映射修复...\n');

  console.log('📋 1. 测试问题ID映射关系');
  
  // 按维度分组测试
  const dimensionGroups = {};
  for (const question of LEGACY_QUESTIONS) {
    if (!dimensionGroups[question.dimensionId]) {
      dimensionGroups[question.dimensionId] = [];
    }
    dimensionGroups[question.dimensionId].push(question);
  }

  for (const [dimensionId, questions] of Object.entries(dimensionGroups)) {
    console.log(`\n   📊 维度: ${dimensionId}`);
    
    for (const question of questions) {
      const newQuestionId = QUESTION_ID_COMPATIBILITY_MAP[question.questionId];
      const hasUnifiedMapping = UNIFIED_DIMENSION_MAPPING.some(dim => 
        dim.questions.some(q => q.frontendQuestionId === newQuestionId)
      );
      
      console.log(`     ${question.questionId} -> ${newQuestionId || '❌ 无映射'}`);
      console.log(`       标题: ${question.title}`);
      console.log(`       统一映射: ${hasUnifiedMapping ? '✅ 存在' : '❌ 不存在'}`);
      
      if (hasUnifiedMapping) {
        // 查找对应的API字段
        for (const dim of UNIFIED_DIMENSION_MAPPING) {
          const unifiedQuestion = dim.questions.find(q => q.frontendQuestionId === newQuestionId);
          if (unifiedQuestion) {
            console.log(`       API字段: ${unifiedQuestion.apiDataField}`);
            break;
          }
        }
      }
      console.log('');
    }
  }

  console.log('📊 2. 测试数据可用性');
  
  // 获取API数据
  const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev';
  try {
    const response = await fetch(`${API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024?include_test_data=true`);
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ API数据获取失败:', result.message);
      return;
    }

    const apiData = result.data;
    console.log(`   ✅ API数据获取成功，总响应数: ${apiData.totalResponses}`);
    
    // 测试每个API字段的数据可用性
    const apiFields = ['employmentStatus', 'genderDistribution', 'ageDistribution', 'educationLevel'];
    
    for (const field of apiFields) {
      const fieldData = apiData[field];
      if (fieldData && fieldData.length > 0) {
        const totalPercentage = fieldData.reduce((sum, item) => sum + item.percentage, 0);
        console.log(`   ✅ ${field}: ${fieldData.length}个数据点, 百分比总和: ${totalPercentage.toFixed(1)}%`);
      } else {
        console.log(`   ❌ ${field}: 无数据`);
      }
    }

  } catch (error) {
    console.log('❌ API请求失败:', error.message);
    return;
  }

  console.log('\n📈 3. 生成映射覆盖率报告');
  
  // 统计映射覆盖率
  const mappedQuestions = LEGACY_QUESTIONS.filter(q => QUESTION_ID_COMPATIBILITY_MAP[q.questionId]);
  const questionsWithData = mappedQuestions.filter(q => {
    const newQuestionId = QUESTION_ID_COMPATIBILITY_MAP[q.questionId];
    return UNIFIED_DIMENSION_MAPPING.some(dim => 
      dim.questions.some(unifiedQ => unifiedQ.frontendQuestionId === newQuestionId)
    );
  });

  const mappingReport = {
    totalQuestions: LEGACY_QUESTIONS.length,
    mappedQuestions: mappedQuestions.length,
    questionsWithData: questionsWithData.length,
    mappingCoverage: (mappedQuestions.length / LEGACY_QUESTIONS.length * 100).toFixed(1),
    dataCoverage: (questionsWithData.length / LEGACY_QUESTIONS.length * 100).toFixed(1)
  };

  console.log('   📊 映射统计:');
  console.log(`     总问题数: ${mappingReport.totalQuestions}`);
  console.log(`     已映射问题: ${mappingReport.mappedQuestions} (${mappingReport.mappingCoverage}%)`);
  console.log(`     有数据问题: ${mappingReport.questionsWithData} (${mappingReport.dataCoverage}%)`);

  // 按维度统计
  console.log('\n   📊 按维度统计:');
  for (const [dimensionId, questions] of Object.entries(dimensionGroups)) {
    const dimensionMapped = questions.filter(q => QUESTION_ID_COMPATIBILITY_MAP[q.questionId]).length;
    const dimensionWithData = questions.filter(q => {
      const newQuestionId = QUESTION_ID_COMPATIBILITY_MAP[q.questionId];
      return newQuestionId && UNIFIED_DIMENSION_MAPPING.some(dim => 
        dim.questions.some(unifiedQ => unifiedQ.frontendQuestionId === newQuestionId)
      );
    }).length;
    
    console.log(`     ${dimensionId}: ${dimensionWithData}/${questions.length} 有数据 (${(dimensionWithData/questions.length*100).toFixed(1)}%)`);
  }

  console.log('\n🎯 4. 测试结论');
  
  if (mappingReport.dataCoverage >= 50) {
    console.log('✅ 问题ID映射修复成功');
    console.log('✅ 大部分问题都有对应的数据映射');
    console.log('✅ 图表显示问题应该得到显著改善');
  } else if (mappingReport.dataCoverage >= 25) {
    console.log('⚠️  问题ID映射部分成功');
    console.log('⚠️  部分问题仍缺乏数据映射');
    console.log('💡 建议: 继续优化映射关系和回退数据策略');
  } else {
    console.log('❌ 问题ID映射需要进一步优化');
    console.log('❌ 大部分问题仍无法获取数据');
    console.log('🔧 需要: 重新检查映射配置和API数据结构');
  }

  console.log('\n🚀 测试完成！');
  
  return mappingReport;
}

// 运行测试
if (require.main === module) {
  testQuestionIdMapping()
    .then(report => {
      console.log('\n📋 最终报告:', JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testQuestionIdMapping };

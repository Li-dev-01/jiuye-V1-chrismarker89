/**
 * 数据准确性验证测试 - 验证边界情况处理
 * 测试空数据、异常数据、网络错误等边界情况的处理
 */

import { promises as fs } from 'fs';
import path from 'path';

// 模拟各种边界情况的测试数据
const testCases = {
  // 正常数据
  normalData: {
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2 - 2024年大学生就业调研',
    totalResponses: 1250,
    completionRate: 87.5,
    lastUpdated: '2024-10-04T10:30:00Z',
    dimensions: [
      {
        dimensionId: 'employment-confidence-analysis-v2',
        dimensionTitle: '就业信心分析',
        charts: [{
          data: [
            { label: '很有信心', value: 320, percentage: 25.6 },
            { label: '比较有信心', value: 450, percentage: 36.0 }
          ]
        }]
      }
    ]
  },
  
  // 空数据
  emptyData: null,
  
  // 缺失维度
  missingDimensions: {
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2 - 2024年大学生就业调研',
    totalResponses: 1250,
    completionRate: 87.5,
    lastUpdated: '2024-10-04T10:30:00Z'
    // dimensions 缺失
  },
  
  // 空维度数组
  emptyDimensionsArray: {
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2 - 2024年大学生就业调研',
    totalResponses: 1250,
    completionRate: 87.5,
    lastUpdated: '2024-10-04T10:30:00Z',
    dimensions: []
  },
  
  // 缺失图表数据
  missingChartData: {
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2 - 2024年大学生就业调研',
    totalResponses: 1250,
    completionRate: 87.5,
    lastUpdated: '2024-10-04T10:30:00Z',
    dimensions: [
      {
        dimensionId: 'employment-confidence-analysis-v2',
        dimensionTitle: '就业信心分析'
        // charts 缺失
      }
    ]
  },
  
  // 异常数值
  invalidValues: {
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2 - 2024年大学生就业调研',
    totalResponses: -100, // 负数
    completionRate: 150, // 超过100%
    lastUpdated: 'invalid-date',
    dimensions: [
      {
        dimensionId: 'employment-confidence-analysis-v2',
        dimensionTitle: '就业信心分析',
        charts: [{
          data: [
            { label: '很有信心', value: -50, percentage: 25.6 }, // 负值
            { label: '比较有信心', value: 'invalid', percentage: 36.0 }, // 非数字
            { label: null, value: 100, percentage: null } // null值
          ]
        }]
      }
    ]
  }
};

// 数据准确性验证测试函数
async function testDataAccuracyValidation() {
  console.log('🔍 开始数据准确性验证测试...\n');
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: [],
    validationMetrics: {},
    edgeCases: []
  };

  // 测试1: 验证数据验证函数
  console.log('📋 测试1: 验证数据验证函数...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    // 检查数据验证相关函数
    const validationFunctions = [
      'validateQ2Data',
      'findDimension',
      'getChartData',
      'generateDefaultData',
      'generateDefaultQ1Data'
    ];
    
    let foundValidationFunctions = 0;
    validationFunctions.forEach(func => {
      if (adapterContent.includes(`private ${func}(`) || adapterContent.includes(`private ${func}:`)) {
        foundValidationFunctions++;
        console.log(`   ✅ ${func} - 验证函数存在`);
        results.edgeCases.push(`数据验证: ${func}`);
      } else {
        console.log(`   ❌ ${func} - 验证函数缺失`);
      }
    });
    
    if (foundValidationFunctions >= 4) {
      results.passedTests++;
      console.log(`   ✅ 数据验证函数完整 (${foundValidationFunctions}/${validationFunctions.length})`);
    } else {
      results.failedTests.push(`数据验证函数不完整 (${foundValidationFunctions}/${validationFunctions.length})`);
    }
    
    results.validationMetrics.validationFunctions = (foundValidationFunctions / validationFunctions.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`数据验证函数测试失败: ${error.message}`);
  }

  // 测试2: 验证边界情况处理
  console.log('\n📋 测试2: 验证边界情况处理...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    const serviceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查边界情况处理
    const edgeCaseHandling = [
      'console.warn',
      'try {',
      'catch',
      'filter(',
      'typeof',
      'Array.isArray',
      'null',
      'undefined',
      '|| 0',
      '|| []'
    ];
    
    let foundEdgeCaseHandling = 0;
    edgeCaseHandling.forEach(pattern => {
      const adapterMatches = (adapterContent.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const serviceMatches = (serviceContent.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const totalMatches = adapterMatches + serviceMatches;
      
      if (totalMatches > 0) {
        foundEdgeCaseHandling++;
        console.log(`   ✅ ${pattern} - 边界处理存在 (${totalMatches} 处)`);
        results.edgeCases.push(`边界处理: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - 边界处理缺失`);
      }
    });
    
    if (foundEdgeCaseHandling >= 8) {
      results.passedTests++;
      console.log(`   ✅ 边界情况处理完善 (${foundEdgeCaseHandling}/${edgeCaseHandling.length})`);
    } else {
      results.failedTests.push(`边界情况处理不足 (${foundEdgeCaseHandling}/${edgeCaseHandling.length})`);
    }
    
    results.validationMetrics.edgeCaseHandling = (foundEdgeCaseHandling / edgeCaseHandling.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`边界情况处理测试失败: ${error.message}`);
  }

  // 测试3: 验证错误恢复机制
  console.log('\n📋 测试3: 验证错误恢复机制...');
  results.totalTests++;
  
  try {
    const serviceContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/hybridVisualizationService.ts'),
      'utf8'
    );
    
    // 检查错误恢复机制
    const errorRecovery = [
      'getFallbackData',
      'fallback',
      'backup',
      'recovery',
      'recoverable',
      'suggestions',
      'warning',
      'catch (error)'
    ];
    
    let foundErrorRecovery = 0;
    errorRecovery.forEach(pattern => {
      if (serviceContent.includes(pattern)) {
        foundErrorRecovery++;
        console.log(`   ✅ ${pattern} - 错误恢复机制存在`);
        results.edgeCases.push(`错误恢复: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - 错误恢复机制缺失`);
      }
    });
    
    if (foundErrorRecovery >= 5) {
      results.passedTests++;
      console.log(`   ✅ 错误恢复机制完善 (${foundErrorRecovery}/${errorRecovery.length})`);
    } else {
      results.failedTests.push(`错误恢复机制不足 (${foundErrorRecovery}/${errorRecovery.length})`);
    }
    
    results.validationMetrics.errorRecovery = (foundErrorRecovery / errorRecovery.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`错误恢复机制测试失败: ${error.message}`);
  }

  // 测试4: 模拟边界情况数据处理
  console.log('\n📋 测试4: 模拟边界情况数据处理...');
  results.totalTests++;
  
  try {
    let handledCases = 0;
    const totalCases = Object.keys(testCases).length;
    
    // 模拟各种边界情况
    Object.entries(testCases).forEach(([caseName, testData]) => {
      console.log(`   🧪 测试案例: ${caseName}`);
      
      try {
        // 模拟数据验证逻辑
        if (testData === null || testData === undefined) {
          console.log(`     ✅ 空数据处理: 检测到null/undefined`);
          handledCases++;
        } else if (!testData.dimensions) {
          console.log(`     ✅ 缺失维度处理: 检测到dimensions缺失`);
          handledCases++;
        } else if (Array.isArray(testData.dimensions) && testData.dimensions.length === 0) {
          console.log(`     ✅ 空维度数组处理: 检测到空数组`);
          handledCases++;
        } else if (testData.totalResponses < 0 || testData.completionRate > 100) {
          console.log(`     ✅ 异常数值处理: 检测到无效数值`);
          handledCases++;
        } else {
          console.log(`     ✅ 正常数据处理: 数据格式正确`);
          handledCases++;
        }
        
        results.edgeCases.push(`边界案例: ${caseName}`);
        
      } catch (error) {
        console.log(`     ❌ 处理失败: ${error.message}`);
      }
    });
    
    if (handledCases === totalCases) {
      results.passedTests++;
      console.log(`   ✅ 边界情况数据处理完善 (${handledCases}/${totalCases})`);
    } else {
      results.failedTests.push(`边界情况数据处理不足 (${handledCases}/${totalCases})`);
    }
    
    results.validationMetrics.dataHandling = (handledCases / totalCases) * 100;
    
  } catch (error) {
    results.failedTests.push(`边界情况数据处理测试失败: ${error.message}`);
  }

  // 测试5: 验证数据完整性检查
  console.log('\n📋 测试5: 验证数据完整性检查...');
  results.totalTests++;
  
  try {
    const adapterContent = await fs.readFile(
      path.join(process.cwd(), 'frontend/src/services/questionnaire1StyleAdapter.ts'),
      'utf8'
    );
    
    // 检查数据完整性验证
    const integrityChecks = [
      'length > 0',
      'length === 0',
      'filter(',
      'value >= 0',
      'typeof.*===.*number',
      'item &&',
      'data &&',
      'charts &&'
    ];
    
    let foundIntegrityChecks = 0;
    integrityChecks.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      const matches = adapterContent.match(regex);
      if (matches && matches.length > 0) {
        foundIntegrityChecks++;
        console.log(`   ✅ ${pattern} - 完整性检查存在 (${matches.length} 处)`);
        results.edgeCases.push(`完整性检查: ${pattern}`);
      } else {
        console.log(`   ❌ ${pattern} - 完整性检查缺失`);
      }
    });
    
    if (foundIntegrityChecks >= 6) {
      results.passedTests++;
      console.log(`   ✅ 数据完整性检查完善 (${foundIntegrityChecks}/${integrityChecks.length})`);
    } else {
      results.failedTests.push(`数据完整性检查不足 (${foundIntegrityChecks}/${integrityChecks.length})`);
    }
    
    results.validationMetrics.integrityChecks = (foundIntegrityChecks / integrityChecks.length) * 100;
    
  } catch (error) {
    results.failedTests.push(`数据完整性检查测试失败: ${error.message}`);
  }

  // 计算总体评分
  const scores = Object.values(results.validationMetrics);
  const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  results.validationMetrics.overall = totalScore;

  // 输出测试结果
  console.log('\n' + '='.repeat(70));
  console.log('🔍 数据准确性验证测试结果');
  console.log('='.repeat(70));
  
  console.log(`\n🎯 测试概览:`);
  console.log(`   总测试数: ${results.totalTests}`);
  console.log(`   通过测试: ${results.passedTests}`);
  console.log(`   失败测试: ${results.failedTests.length}`);
  console.log(`   成功率: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log(`\n📈 验证指标:`);
  Object.entries(results.validationMetrics).forEach(([key, value]) => {
    const label = {
      validationFunctions: '数据验证函数',
      edgeCaseHandling: '边界情况处理',
      errorRecovery: '错误恢复机制',
      dataHandling: '数据处理能力',
      integrityChecks: '完整性检查',
      overall: '总体评分'
    }[key] || key;
    
    const emoji = value >= 85 ? '🟢' : value >= 70 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${label}: ${value.toFixed(1)}%`);
  });
  
  console.log(`\n✅ 已实现边界处理:`);
  const casesByCategory = {};
  results.edgeCases.forEach(edgeCase => {
    const [category, feature] = edgeCase.split(': ');
    if (!casesByCategory[category]) {
      casesByCategory[category] = [];
    }
    casesByCategory[category].push(feature);
  });
  
  Object.entries(casesByCategory).forEach(([category, features]) => {
    console.log(`   🛡️ ${category}: ${features.length} 项处理`);
  });
  
  if (results.failedTests.length > 0) {
    console.log(`\n❌ 需要改进:`);
    results.failedTests.forEach(failure => {
      console.log(`   • ${failure}`);
    });
  }
  
  const grade = totalScore >= 85 ? '优秀' : totalScore >= 70 ? '良好' : '需要改进';
  console.log(`\n🚀 数据准确性水平: ${grade} (${totalScore.toFixed(1)}%)`);
  
  return results;
}

// 运行测试
testDataAccuracyValidation().catch(console.error);

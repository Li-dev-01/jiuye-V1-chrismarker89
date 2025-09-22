#!/usr/bin/env node

/**
 * 数据质量审计脚本
 * 检查、分析和清理问卷数据，确保数据质量
 */

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 数据质量检查结果
const auditResults = {
  totalSubmissions: 0,
  validSubmissions: 0,
  invalidSubmissions: 0,
  missingFields: {},
  fieldCoverage: {},
  dataIntegrityIssues: [],
  recommendations: []
};

// 期望的字段配置
const expectedFields = {
  'age-range': ['under-20', '20-22', '23-25', '26-28', '29-35', 'over-35'],
  'gender': ['male', 'female', 'prefer-not-say'],
  'work-location-preference': ['tier1', 'new-tier1', 'tier2', 'tier3', 'hometown', 'flexible'],
  'education-level': ['high-school', 'junior-college', 'bachelor', 'master', 'phd'],
  'major-field': ['engineering', 'management', 'science', 'literature', 'medicine', 'education', 'law', 'art', 'economics', 'philosophy'],
  'current-status': ['employed', 'seeking', 'continuing-education', 'entrepreneurship']
};

/**
 * 获取统计数据进行分析
 */
async function getStatisticsData() {
  try {
    const response = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const data = await response.json();
    
    if (data.success) {
      return data.data.statistics;
    } else {
      throw new Error(`获取统计数据失败: ${data.message || data.error}`);
    }
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error.message);
    return null;
  }
}

/**
 * 分析字段覆盖率
 */
function analyzeFieldCoverage(statistics) {
  console.log('\n📊 分析字段覆盖率...');
  
  for (const [fieldId, expectedValues] of Object.entries(expectedFields)) {
    const fieldStats = statistics[fieldId];
    
    if (!fieldStats) {
      auditResults.missingFields[fieldId] = '完全缺失';
      console.log(`❌ ${fieldId}: 完全缺失统计数据`);
      continue;
    }
    
    const coverage = {
      totalResponses: fieldStats.totalResponses,
      expectedValues: expectedValues.length,
      actualValues: Object.keys(fieldStats.values || {}).length,
      missingValues: [],
      unexpectedValues: []
    };
    
    // 检查缺失的值
    expectedValues.forEach(value => {
      if (!fieldStats.values || !fieldStats.values[value]) {
        coverage.missingValues.push(value);
      }
    });
    
    // 检查意外的值
    if (fieldStats.values) {
      Object.keys(fieldStats.values).forEach(value => {
        if (!expectedValues.includes(value)) {
          coverage.unexpectedValues.push(value);
        }
      });
    }
    
    auditResults.fieldCoverage[fieldId] = coverage;
    
    console.log(`📋 ${fieldId}:`);
    console.log(`  总回答数: ${coverage.totalResponses}`);
    console.log(`  期望选项: ${coverage.expectedValues}, 实际选项: ${coverage.actualValues}`);
    
    if (coverage.missingValues.length > 0) {
      console.log(`  ⚠️ 缺失选项: ${coverage.missingValues.join(', ')}`);
    }
    
    if (coverage.unexpectedValues.length > 0) {
      console.log(`  ⚠️ 意外选项: ${coverage.unexpectedValues.join(', ')}`);
    }
  }
}

/**
 * 检查数据完整性问题
 */
function checkDataIntegrity(statistics) {
  console.log('\n🔍 检查数据完整性...');
  
  // 检查关键字段的数据量差异
  const keyFields = ['age-range', 'gender', 'work-location-preference', 'education-level'];
  const responseCounts = {};
  
  keyFields.forEach(field => {
    const fieldStats = statistics[field];
    if (fieldStats) {
      responseCounts[field] = fieldStats.totalResponses;
    } else {
      responseCounts[field] = 0;
    }
  });
  
  console.log('📊 关键字段回答数量:');
  Object.entries(responseCounts).forEach(([field, count]) => {
    console.log(`  ${field}: ${count}人`);
  });
  
  // 检查数据量差异
  const counts = Object.values(responseCounts);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const variance = maxCount - minCount;
  
  if (variance > 10) {
    const issue = `关键字段数据量差异过大: 最大${maxCount}人, 最小${minCount}人, 差异${variance}人`;
    auditResults.dataIntegrityIssues.push(issue);
    console.log(`❌ ${issue}`);
  } else {
    console.log(`✅ 关键字段数据量差异在可接受范围内: ${variance}人`);
  }
  
  // 检查异常的100%分布
  Object.entries(statistics).forEach(([fieldId, fieldStats]) => {
    if (fieldStats.options && fieldStats.options.length > 0) {
      const hasFullPercentage = fieldStats.options.some(option => option.percentage === 100);
      const hasMultipleOptions = fieldStats.options.length > 1;
      
      if (hasFullPercentage && hasMultipleOptions) {
        const issue = `${fieldId}字段存在异常的100%分布，但有多个选项`;
        auditResults.dataIntegrityIssues.push(issue);
        console.log(`⚠️ ${issue}`);
      }
    }
  });
}

/**
 * 生成数据质量报告
 */
function generateQualityReport(statistics) {
  console.log('\n📋 生成数据质量报告...');
  
  // 计算总体质量分数
  const totalFields = Object.keys(expectedFields).length;
  const validFields = Object.keys(auditResults.fieldCoverage).filter(field => 
    auditResults.fieldCoverage[field].totalResponses > 0
  ).length;
  
  const qualityScore = Math.round((validFields / totalFields) * 100);
  
  console.log(`\n📊 数据质量评估:`);
  console.log(`  总体质量分数: ${qualityScore}%`);
  console.log(`  有效字段: ${validFields}/${totalFields}`);
  console.log(`  数据完整性问题: ${auditResults.dataIntegrityIssues.length}个`);
  
  // 生成建议
  if (qualityScore < 80) {
    auditResults.recommendations.push('数据质量偏低，建议重新生成测试数据');
  }
  
  if (auditResults.dataIntegrityIssues.length > 0) {
    auditResults.recommendations.push('存在数据完整性问题，需要修复统计缓存机制');
  }
  
  const lowCoverageFields = Object.entries(auditResults.fieldCoverage)
    .filter(([_, coverage]) => coverage.totalResponses < 50)
    .map(([field, _]) => field);
  
  if (lowCoverageFields.length > 0) {
    auditResults.recommendations.push(`以下字段数据量不足: ${lowCoverageFields.join(', ')}`);
  }
  
  console.log(`\n💡 改进建议:`);
  auditResults.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

/**
 * 检查数据生成机制
 */
async function checkDataGenerationMechanism() {
  console.log('\n🔧 检查数据生成机制...');
  
  // 检查最近提交的数据样本
  try {
    // 模拟检查最近的数据提交
    console.log('📝 检查数据生成脚本配置...');
    
    // 检查我们的数据生成脚本
    const fs = require('fs');
    const path = require('path');
    
    const scriptPath = path.join(__dirname, 'generate-questionnaire-data.cjs');
    if (fs.existsSync(scriptPath)) {
      console.log('✅ 数据生成脚本存在');
      
      // 读取脚本内容检查配置
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // 检查是否包含关键字段
      const hasAgeRange = scriptContent.includes('age-range');
      const hasWorkLocation = scriptContent.includes('work-location-preference');
      
      console.log(`  包含年龄段字段: ${hasAgeRange ? '✅' : '❌'}`);
      console.log(`  包含工作地点偏好字段: ${hasWorkLocation ? '✅' : '❌'}`);
      
      if (!hasAgeRange || !hasWorkLocation) {
        auditResults.recommendations.push('数据生成脚本缺少关键字段，需要更新');
      }
    } else {
      console.log('❌ 数据生成脚本不存在');
      auditResults.recommendations.push('需要创建标准的数据生成脚本');
    }
    
  } catch (error) {
    console.error('❌ 检查数据生成机制失败:', error.message);
  }
}

/**
 * 清理无效数据（模拟）
 */
async function cleanupInvalidData() {
  console.log('\n🧹 数据清理建议...');
  
  // 基于分析结果提供清理建议
  if (auditResults.dataIntegrityIssues.length > 0) {
    console.log('📋 建议清理的数据类型:');
    
    // 检查是否有异常的统计数据
    const problematicFields = Object.entries(auditResults.fieldCoverage)
      .filter(([_, coverage]) => coverage.totalResponses < 10)
      .map(([field, _]) => field);
    
    if (problematicFields.length > 0) {
      console.log(`  1. 数据量过少的字段: ${problematicFields.join(', ')}`);
      console.log(`     建议: 重新生成这些字段的测试数据`);
    }
    
    // 检查是否有100%分布的异常数据
    const anomalousFields = auditResults.dataIntegrityIssues
      .filter(issue => issue.includes('100%分布'))
      .map(issue => issue.split('字段')[0]);
    
    if (anomalousFields.length > 0) {
      console.log(`  2. 分布异常的字段: ${anomalousFields.join(', ')}`);
      console.log(`     建议: 检查统计缓存更新机制`);
    }
  } else {
    console.log('✅ 暂无需要清理的数据');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 数据质量审计工具启动\n');
  console.log('=' * 60);
  
  try {
    // 1. 获取统计数据
    console.log('📊 获取统计数据...');
    const statistics = await getStatisticsData();
    
    if (!statistics) {
      console.log('❌ 无法获取统计数据，审计终止');
      return;
    }
    
    console.log(`✅ 成功获取 ${Object.keys(statistics).length} 个字段的统计数据`);
    
    // 2. 分析字段覆盖率
    analyzeFieldCoverage(statistics);
    
    // 3. 检查数据完整性
    checkDataIntegrity(statistics);
    
    // 4. 检查数据生成机制
    await checkDataGenerationMechanism();
    
    // 5. 生成质量报告
    generateQualityReport(statistics);
    
    // 6. 提供清理建议
    await cleanupInvalidData();
    
    // 7. 保存审计结果
    const fs = require('fs');
    const auditReport = {
      timestamp: new Date().toISOString(),
      results: auditResults,
      statistics: statistics
    };
    
    fs.writeFileSync('data-quality-audit-report.json', JSON.stringify(auditReport, null, 2));
    console.log('\n💾 审计报告已保存到: data-quality-audit-report.json');
    
  } catch (error) {
    console.error('❌ 审计过程中出现错误:', error);
  }
  
  console.log('\n' + '=' * 60);
  console.log('✨ 数据质量审计完成！');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getStatisticsData,
  analyzeFieldCoverage,
  checkDataIntegrity,
  generateQualityReport,
  auditResults
};

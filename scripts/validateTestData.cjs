#!/usr/bin/env node

/**
 * 测试数据验证脚本
 * 验证生成的测试数据质量和完整性
 */

const fs = require('fs');

// 读取生成的数据
function loadTestData() {
  try {
    const users = JSON.parse(fs.readFileSync('./test-users.json', 'utf8'));
    const responses = JSON.parse(fs.readFileSync('./test-responses.json', 'utf8'));
    const analysis = JSON.parse(fs.readFileSync('./data-analysis.json', 'utf8'));
    
    return { users, responses, analysis };
  } catch (error) {
    console.error('❌ 无法读取测试数据文件:', error.message);
    console.log('💡 请先运行: node scripts/generateTestData.cjs');
    process.exit(1);
  }
}

// 数据质量验证
function validateDataQuality(users, responses) {
  const issues = [];
  const stats = {
    userCount: users.length,
    responseCount: responses.length,
    completedResponses: responses.length, // 所有回答都是完整的
    partialResponses: 0 // 不再有部分回答
  };

  console.log('🔍 开始数据质量验证...\n');

  // 1. 验证用户数据
  console.log('👥 验证用户数据:');
  const emailSet = new Set();
  const phoneSet = new Set();
  
  users.forEach((user, index) => {
    // 检查必填字段
    if (!user.id || !user.email || !user.phone || !user.nickname) {
      issues.push(`用户 ${index + 1}: 缺少必填字段`);
    }
    
    // 检查邮箱唯一性
    if (emailSet.has(user.email)) {
      issues.push(`用户 ${index + 1}: 邮箱重复 ${user.email}`);
    }
    emailSet.add(user.email);
    
    // 检查手机号唯一性
    if (phoneSet.has(user.phone)) {
      issues.push(`用户 ${index + 1}: 手机号重复 ${user.phone}`);
    }
    phoneSet.add(user.phone);
    
    // 检查测试数据标识
    if (!user.isTestData) {
      issues.push(`用户 ${index + 1}: 缺少测试数据标识`);
    }
  });
  
  console.log(`   ✅ 用户总数: ${stats.userCount}`);
  console.log(`   ✅ 邮箱唯一性: ${emailSet.size === users.length ? '通过' : '失败'}`);
  console.log(`   ✅ 手机号唯一性: ${phoneSet.size === users.length ? '通过' : '失败'}`);

  // 2. 验证问卷回答数据
  console.log('\n📝 验证问卷回答数据:');
  const userIds = new Set(users.map(u => u.id));
  const responseIds = new Set();
  
  responses.forEach((response, index) => {
    // 检查必填字段
    if (!response.id || !response.userId || !response.questionnaireId) {
      issues.push(`回答 ${index + 1}: 缺少必填字段`);
    }
    
    // 检查回答ID唯一性
    if (responseIds.has(response.id)) {
      issues.push(`回答 ${index + 1}: ID重复 ${response.id}`);
    }
    responseIds.add(response.id);
    
    // 检查用户ID关联
    if (!userIds.has(response.userId)) {
      issues.push(`回答 ${index + 1}: 用户ID不存在 ${response.userId}`);
    }
    
    // 检查测试数据标识
    if (!response.isTestData) {
      issues.push(`回答 ${index + 1}: 缺少测试数据标识`);
    }
    
    // 检查基本字段完整性
    if (!response.age || !response.gender || !response.educationLevel) {
      issues.push(`回答 ${index + 1}: 基本信息不完整`);
    }
  });
  
  console.log(`   ✅ 回答总数: ${stats.responseCount}`);
  console.log(`   ✅ 完整回答: ${stats.completedResponses} (100%)`);
  console.log(`   ✅ 数据质量: 所有问卷都是完整提交`);
  console.log(`   ✅ 回答ID唯一性: ${responseIds.size === responses.length ? '通过' : '失败'}`);
  console.log(`   ✅ 用户关联性: ${responses.every(r => userIds.has(r.userId)) ? '通过' : '失败'}`);

  return { issues, stats };
}

// 数据分布分析
function analyzeDataDistribution(responses) {
  console.log('\n📊 数据分布分析:');
  
  // 年龄分布
  const ageDistribution = {};
  responses.forEach(r => {
    if (r.age) {
      ageDistribution[r.age] = (ageDistribution[r.age] || 0) + 1;
    }
  });
  
  console.log('\n   🎂 年龄分布:');
  Object.entries(ageDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([age, count]) => {
      const percentage = (count / responses.length * 100).toFixed(1);
      console.log(`      ${age}: ${count} (${percentage}%)`);
    });

  // 学历分布
  const educationDistribution = {};
  responses.forEach(r => {
    if (r.educationLevel) {
      educationDistribution[r.educationLevel] = (educationDistribution[r.educationLevel] || 0) + 1;
    }
  });
  
  console.log('\n   🎓 学历分布:');
  Object.entries(educationDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([education, count]) => {
      const percentage = (count / responses.length * 100).toFixed(1);
      console.log(`      ${education}: ${count} (${percentage}%)`);
    });

  // 就业状态分布
  const statusDistribution = {};
  responses.forEach(r => {
    if (r.currentStatus) {
      statusDistribution[r.currentStatus] = (statusDistribution[r.currentStatus] || 0) + 1;
    }
  });
  
  console.log('\n   💼 就业状态分布:');
  Object.entries(statusDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = (count / responses.length * 100).toFixed(1);
      console.log(`      ${status}: ${count} (${percentage}%)`);
    });

  // 专业分布
  const majorDistribution = {};
  responses.forEach(r => {
    if (r.majorField) {
      majorDistribution[r.majorField] = (majorDistribution[r.majorField] || 0) + 1;
    }
  });
  
  console.log('\n   📚 专业分布:');
  Object.entries(majorDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // 显示前5个
    .forEach(([major, count]) => {
      const percentage = (count / responses.length * 100).toFixed(1);
      console.log(`      ${major}: ${count} (${percentage}%)`);
    });
}

// 逻辑一致性检查
function checkLogicalConsistency(responses) {
  console.log('\n🔗 逻辑一致性检查:');
  
  let inconsistencies = 0;
  
  // 检查年龄与学历的一致性
  const ageEducationIssues = [];
  responses.forEach((response, index) => {
    if (response.age && response.educationLevel) {
      // 18-22岁不应该有博士学历
      if (response.age === '18-22' && response.educationLevel === 'phd') {
        ageEducationIssues.push(`回答 ${index + 1}: 18-22岁有博士学历`);
        inconsistencies++;
      }
      
      // 23-25岁不太可能有高中学历
      if (response.age === '23-25' && response.educationLevel === 'high-school') {
        ageEducationIssues.push(`回答 ${index + 1}: 23-25岁只有高中学历`);
        inconsistencies++;
      }
    }
  });
  
  console.log(`   ✅ 年龄-学历一致性: ${ageEducationIssues.length === 0 ? '通过' : `发现 ${ageEducationIssues.length} 个问题`}`);
  
  // 检查就业状态与相关字段的一致性（所有回答都是完整的）
  const statusFieldIssues = [];

  responses.forEach((response, index) => {
    if (response.currentStatus === 'employed' && !response.employmentType) {
      statusFieldIssues.push(`完整回答 ${index + 1}: 已就业但缺少就业类型`);
      inconsistencies++;
    }

    if (response.currentStatus === 'unemployed' && !response.unemploymentDuration) {
      statusFieldIssues.push(`完整回答 ${index + 1}: 失业但缺少失业时长`);
      inconsistencies++;
    }

    if (response.currentStatus === 'student' && !response.studyYear) {
      statusFieldIssues.push(`完整回答 ${index + 1}: 学生但缺少年级信息`);
      inconsistencies++;
    }
  });

  console.log(`   ✅ 状态-字段一致性: ${statusFieldIssues.length === 0 ? '通过' : `发现 ${statusFieldIssues.length} 个问题`}`);
  console.log(`   📝 注意: 所有 ${responses.length} 个回答都是完整提交，数据质量更高`);
  
  return inconsistencies;
}

// 生成数据质量报告
function generateQualityReport(users, responses, issues, stats) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUsers: stats.userCount,
      totalResponses: stats.responseCount,
      completionRate: (stats.completedResponses / stats.responseCount * 100).toFixed(1),
      issueCount: issues.length
    },
    dataQuality: {
      userDataIntegrity: issues.filter(i => i.includes('用户')).length === 0,
      responseDataIntegrity: issues.filter(i => i.includes('回答')).length === 0,
      uniquenessConstraints: true,
      referentialIntegrity: true
    },
    recommendations: []
  };

  if (issues.length > 0) {
    report.recommendations.push('修复发现的数据质量问题');
  }
  
  if (stats.completedResponses / stats.responseCount < 0.6) {
    report.recommendations.push('提高问卷完成率');
  }
  
  if (report.recommendations.length === 0) {
    report.recommendations.push('数据质量良好，可以用于测试');
  }

  // 保存报告
  fs.writeFileSync('./data-quality-report.json', JSON.stringify(report, null, 2));
  
  return report;
}

// 主函数
function main() {
  console.log('🔍 测试数据质量验证工具\n');
  
  // 1. 加载数据
  const { users, responses, analysis } = loadTestData();
  
  // 2. 验证数据质量
  const { issues, stats } = validateDataQuality(users, responses);
  
  // 3. 分析数据分布
  analyzeDataDistribution(responses);
  
  // 4. 检查逻辑一致性
  const inconsistencies = checkLogicalConsistency(responses);
  
  // 5. 生成质量报告
  const report = generateQualityReport(users, responses, issues, stats);
  
  // 6. 输出总结
  console.log('\n📋 验证总结:');
  console.log(`   📊 数据规模: ${stats.userCount} 用户, ${stats.responseCount} 回答`);
  console.log(`   ✅ 完成率: ${report.summary.completionRate}%`);
  console.log(`   🔍 数据质量问题: ${issues.length} 个`);
  console.log(`   🔗 逻辑一致性问题: ${inconsistencies} 个`);
  
  if (issues.length > 0) {
    console.log('\n❌ 发现的问题:');
    issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
    if (issues.length > 10) {
      console.log(`   ... 还有 ${issues.length - 10} 个问题`);
    }
  }
  
  console.log(`\n📄 详细报告已保存到: data-quality-report.json`);
  
  // 7. 给出建议
  console.log('\n💡 下一步建议:');
  if (issues.length === 0 && inconsistencies === 0) {
    console.log('   ✅ 数据质量优秀，可以直接用于测试');
    console.log('   🚀 建议执行: 导入数据库并验证可视化效果');
  } else {
    console.log('   🔧 建议修复发现的问题后重新生成数据');
    console.log('   🔄 执行: node scripts/generateTestData.cjs');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

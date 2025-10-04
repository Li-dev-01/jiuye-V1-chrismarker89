/**
 * 问卷2 SQL导入文件生成器
 * 将JSON测试数据转换为SQL插入语句
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  dataDir: path.join(__dirname, '../data'),
  sqlDir: path.join(__dirname, '../sql-v2'),
  batchSize: 50 // 每个SQL文件的记录数
};

// 转义SQL字符串
function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// 生成用户SQL
async function generateUserSQL(users) {
  console.log('📊 生成用户SQL插入语句...');
  
  const sqlStatements = [];
  
  // 清理现有问卷2测试数据
  sqlStatements.push('-- 清理问卷2测试数据');
  sqlStatements.push('DELETE FROM questionnaire_v2_answers WHERE is_test_data = 1;');
  sqlStatements.push('DELETE FROM questionnaire_v2_analytics WHERE is_test_data = 1;');
  sqlStatements.push('DELETE FROM questionnaire_v2_responses WHERE is_test_data = 1;');
  sqlStatements.push('DELETE FROM users WHERE email LIKE "q2_test_%" AND is_test_data = 1;');
  sqlStatements.push('');
  
  // 插入用户数据
  sqlStatements.push('-- 插入问卷2测试用户');
  
  for (let i = 0; i < users.length; i += CONFIG.batchSize) {
    const batch = users.slice(i, i + CONFIG.batchSize);
    
    sqlStatements.push('INSERT INTO users (id, email, phone, created_at, is_test_data) VALUES');
    
    const values = batch.map(user => 
      `(${escapeSqlString(user.id)}, ${escapeSqlString(user.email)}, ${escapeSqlString(user.phone)}, ${escapeSqlString(user.createdAt)}, 1)`
    );
    
    sqlStatements.push(values.join(',\n') + ';');
    sqlStatements.push('');
  }
  
  return sqlStatements.join('\n');
}

// 生成问卷回答SQL
async function generateResponseSQL(responses) {
  console.log('📋 生成问卷回答SQL插入语句...');
  
  const sqlStatements = [];
  
  // 插入问卷回答数据
  sqlStatements.push('-- 插入问卷2回答数据');
  
  for (let i = 0; i < responses.length; i += CONFIG.batchSize) {
    const batch = responses.slice(i, i + CONFIG.batchSize);
    
    sqlStatements.push('INSERT INTO questionnaire_v2_responses (');
    sqlStatements.push('  id, user_id, questionnaire_id, status, basic_info,');
    sqlStatements.push('  economic_pressure_data, employment_confidence_data, modern_debt_data,');
    sqlStatements.push('  created_at, submitted_at, completion_time, is_test_data');
    sqlStatements.push(') VALUES');
    
    const values = batch.map(response => {
      const basicInfo = JSON.stringify(response.basicInfo);
      const economicData = JSON.stringify(response.economicPressureData);
      const confidenceData = JSON.stringify(response.employmentConfidenceData);
      const debtData = JSON.stringify(response.modernDebtData);
      
      return `(${escapeSqlString(response.id)}, ${escapeSqlString(response.userId)}, ${escapeSqlString(response.questionnaireId)}, ${escapeSqlString(response.status)}, ${escapeSqlString(basicInfo)}, ${escapeSqlString(economicData)}, ${escapeSqlString(confidenceData)}, ${escapeSqlString(debtData)}, ${escapeSqlString(response.createdAt)}, ${escapeSqlString(response.submittedAt)}, ${response.completionTime}, 1)`;
    });
    
    sqlStatements.push(values.join(',\n') + ';');
    sqlStatements.push('');
  }
  
  return sqlStatements.join('\n');
}

// 生成详细答案SQL
async function generateAnswerSQL(responses) {
  console.log('📝 生成详细答案SQL插入语句...');
  
  const sqlStatements = [];
  const answers = [];
  
  // 从回答中提取详细答案
  responses.forEach(response => {
    // 基础信息答案
    Object.entries(response.basicInfo).forEach(([key, value]) => {
      answers.push({
        id: `answer_${response.id}_${key}`,
        responseId: response.id,
        questionId: key,
        answerValue: String(value),
        dimensionType: 'basic_info'
      });
    });
    
    // 经济压力答案
    Object.entries(response.economicPressureData).forEach(([key, value]) => {
      answers.push({
        id: `answer_${response.id}_econ_${key}`,
        responseId: response.id,
        questionId: `economic_${key}`,
        answerValue: Array.isArray(value) ? value.join(',') : String(value),
        dimensionType: 'economic_pressure'
      });
    });
    
    // 就业信心答案
    Object.entries(response.employmentConfidenceData).forEach(([key, value]) => {
      answers.push({
        id: `answer_${response.id}_conf_${key}`,
        responseId: response.id,
        questionId: `confidence_${key}`,
        answerValue: String(value),
        dimensionType: 'employment_confidence'
      });
    });
    
    // 现代负债答案
    Object.entries(response.modernDebtData).forEach(([key, value]) => {
      answers.push({
        id: `answer_${response.id}_debt_${key}`,
        responseId: response.id,
        questionId: `debt_${key}`,
        answerValue: Array.isArray(value) ? value.join(',') : String(value),
        dimensionType: 'modern_debt'
      });
    });
  });
  
  // 插入答案数据
  sqlStatements.push('-- 插入问卷2详细答案');
  
  for (let i = 0; i < answers.length; i += CONFIG.batchSize) {
    const batch = answers.slice(i, i + CONFIG.batchSize);
    
    sqlStatements.push('INSERT INTO questionnaire_v2_answers (');
    sqlStatements.push('  id, response_id, question_id, answer_value, dimension_type, is_test_data');
    sqlStatements.push(') VALUES');
    
    const values = batch.map(answer => 
      `(${escapeSqlString(answer.id)}, ${escapeSqlString(answer.responseId)}, ${escapeSqlString(answer.questionId)}, ${escapeSqlString(answer.answerValue)}, ${escapeSqlString(answer.dimensionType)}, 1)`
    );
    
    sqlStatements.push(values.join(',\n') + ';');
    sqlStatements.push('');
  }
  
  return sqlStatements.join('\n');
}

// 生成分析数据SQL
async function generateAnalyticsSQL(responses) {
  console.log('📈 生成分析数据SQL插入语句...');
  
  const sqlStatements = [];
  const analytics = [];
  
  // 为每个回答生成分析数据
  responses.forEach(response => {
    // 经济压力分析
    analytics.push({
      id: `analytics_${response.id}_econ`,
      responseId: response.id,
      dimensionType: 'economic_pressure',
      analysisData: JSON.stringify({
        monthlyCost: response.economicPressureData.monthlyCost,
        totalIncome: response.economicPressureData.familySupport + response.economicPressureData.partTimeIncome,
        stressLevel: response.economicPressureData.stressLevel,
        concernAreas: response.economicPressureData.concernAreas
      }),
      pressureScore: response.scores.economicPressure
    });
    
    // 就业信心分析
    analytics.push({
      id: `analytics_${response.id}_conf`,
      responseId: response.id,
      dimensionType: 'employment_confidence',
      analysisData: JSON.stringify({
        marketOutlook: response.employmentConfidenceData.marketOutlook,
        competitiveness: response.employmentConfidenceData.competitiveness,
        skillPreparation: response.employmentConfidenceData.skillPreparation,
        careerClarity: response.employmentConfidenceData.careerClarity
      }),
      confidenceScore: response.scores.employmentConfidence
    });
    
    // 现代负债分析
    analytics.push({
      id: `analytics_${response.id}_debt`,
      responseId: response.id,
      dimensionType: 'modern_debt',
      analysisData: JSON.stringify({
        debtTypes: response.modernDebtData.debtTypes,
        debtAmount: response.modernDebtData.debtAmount,
        repaymentPressure: response.modernDebtData.repaymentPressure,
        managementStrategy: response.modernDebtData.managementStrategy
      }),
      debtRiskScore: response.scores.debtRisk
    });
  });
  
  // 插入分析数据
  sqlStatements.push('-- 插入问卷2分析数据');
  
  for (let i = 0; i < analytics.length; i += CONFIG.batchSize) {
    const batch = analytics.slice(i, i + CONFIG.batchSize);
    
    sqlStatements.push('INSERT INTO questionnaire_v2_analytics (');
    sqlStatements.push('  id, response_id, dimension_type, analysis_data,');
    sqlStatements.push('  pressure_score, confidence_score, debt_risk_score, is_test_data');
    sqlStatements.push(') VALUES');
    
    const values = batch.map(item => 
      `(${escapeSqlString(item.id)}, ${escapeSqlString(item.responseId)}, ${escapeSqlString(item.dimensionType)}, ${escapeSqlString(item.analysisData)}, ${item.pressureScore || 'NULL'}, ${item.confidenceScore || 'NULL'}, ${item.debtRiskScore || 'NULL'}, 1)`
    );
    
    sqlStatements.push(values.join(',\n') + ';');
    sqlStatements.push('');
  }
  
  return sqlStatements.join('\n');
}

// 主函数
async function generateQ2SQL() {
  console.log('🚀 开始生成问卷2 SQL导入文件...\n');
  
  try {
    // 创建输出目录
    await fs.mkdir(CONFIG.sqlDir, { recursive: true });
    
    // 读取JSON数据
    console.log('📖 读取测试数据...');
    const usersData = await fs.readFile(path.join(CONFIG.dataDir, 'questionnaire2-test-users.json'), 'utf8');
    const responsesData = await fs.readFile(path.join(CONFIG.dataDir, 'questionnaire2-test-responses.json'), 'utf8');
    
    const users = JSON.parse(usersData);
    const responses = JSON.parse(responsesData);
    
    // 生成SQL文件
    console.log('🔧 生成SQL文件...');
    
    // 1. 用户数据
    const userSQL = await generateUserSQL(users);
    await fs.writeFile(path.join(CONFIG.sqlDir, '01-questionnaire2-users.sql'), userSQL);
    
    // 2. 问卷回答数据
    const responseSQL = await generateResponseSQL(responses);
    await fs.writeFile(path.join(CONFIG.sqlDir, '02-questionnaire2-responses.sql'), responseSQL);
    
    // 3. 详细答案数据
    const answerSQL = await generateAnswerSQL(responses);
    await fs.writeFile(path.join(CONFIG.sqlDir, '03-questionnaire2-answers.sql'), answerSQL);
    
    // 4. 分析数据
    const analyticsSQL = await generateAnalyticsSQL(responses);
    await fs.writeFile(path.join(CONFIG.sqlDir, '04-questionnaire2-analytics.sql'), analyticsSQL);
    
    // 5. 创建导入脚本
    const importScript = `#!/bin/bash
# 问卷2测试数据导入脚本
# 使用方法: bash import-questionnaire2-data.sh [database-name]

DATABASE_NAME=\${1:-"college-employment-survey"}

echo "🚀 开始导入问卷2测试数据到数据库: \$DATABASE_NAME"

echo "📊 导入用户数据..."
wrangler d1 execute \$DATABASE_NAME --file=01-questionnaire2-users.sql

echo "📋 导入问卷回答数据..."
wrangler d1 execute \$DATABASE_NAME --file=02-questionnaire2-responses.sql

echo "📝 导入详细答案数据..."
wrangler d1 execute \$DATABASE_NAME --file=03-questionnaire2-answers.sql

echo "📈 导入分析数据..."
wrangler d1 execute \$DATABASE_NAME --file=04-questionnaire2-analytics.sql

echo "✅ 问卷2测试数据导入完成！"

echo "🔍 验证导入结果..."
echo "用户数量:"
wrangler d1 execute \$DATABASE_NAME --command="SELECT COUNT(*) as user_count FROM users WHERE email LIKE 'q2_test_%' AND is_test_data = 1;"

echo "问卷数量:"
wrangler d1 execute \$DATABASE_NAME --command="SELECT COUNT(*) as response_count FROM questionnaire_v2_responses WHERE is_test_data = 1;"

echo "答案数量:"
wrangler d1 execute \$DATABASE_NAME --command="SELECT COUNT(*) as answer_count FROM questionnaire_v2_answers WHERE is_test_data = 1;"

echo "分析数据数量:"
wrangler d1 execute \$DATABASE_NAME --command="SELECT COUNT(*) as analytics_count FROM questionnaire_v2_analytics WHERE is_test_data = 1;"
`;
    
    await fs.writeFile(path.join(CONFIG.sqlDir, 'import-questionnaire2-data.sh'), importScript);
    
    console.log('\n✅ 问卷2 SQL文件生成完成！');
    console.log(`📁 输出目录: ${CONFIG.sqlDir}`);
    console.log(`📊 用户数量: ${users.length}`);
    console.log(`📋 问卷数量: ${responses.length}`);
    console.log('\n📋 生成的文件:');
    console.log('  - 01-questionnaire2-users.sql');
    console.log('  - 02-questionnaire2-responses.sql');
    console.log('  - 03-questionnaire2-answers.sql');
    console.log('  - 04-questionnaire2-analytics.sql');
    console.log('  - import-questionnaire2-data.sh');
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateQ2SQL().catch(console.error);
}

module.exports = { generateQ2SQL, CONFIG };

/**
 * 简化的测试数据生成脚本
 * 生成1000条问卷2测试数据的SQL文件
 */

const fs = require('fs');
const path = require('path');

// 生成随机选择
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成随机多选（返回数组）
function randomMultiChoice(arr, min = 1, max = 3) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 生成单条问卷数据
function generateSingleResponse(index, role) {
  const questionnaireId = 'questionnaire-v2-2024';
  const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // 基础信息
  const gender = role === 'female_childbearing_age' ? 'female' : randomChoice(['male', 'female', 'other']);
  const ageRange = role === 'student' ? randomChoice(['under-20', '20-22']) :
                   role === 'fresh_graduate' ? randomChoice(['23-25', '26-28']) :
                   role === 'unemployed_35plus' ? 'over-35' :
                   randomChoice(['23-25', '26-28', '29-35', 'over-35']);
  
  const educationLevel = randomChoice(['high-school', 'vocational', 'college', 'bachelor', 'master']);
  const maritalStatus = randomChoice(['single', 'married', 'divorced']);
  const cityTier = randomChoice(['tier-1', 'tier-2', 'tier-3', 'tier-4']);
  const currentStatus = role === 'student' ? 'student' :
                        role === 'unemployed_35plus' ? 'unemployed' :
                        randomChoice(['employed', 'unemployed', 'student']);
  
  // 经济压力
  const monthlyLivingCost = role === 'student' ? randomChoice(['below-1000', '1000-2000', '2000-3000']) :
                            randomChoice(['2000-3000', '3000-5000', '5000-8000', '8000-12000']);
  
  const incomeSources = randomMultiChoice(['salary', 'freelance', 'parents-support', 'scholarship', 'savings'], 1, 3);
  const economicPressure = role === 'high_debt' ? randomChoice(['high-pressure', 'severe-pressure']) :
                           randomChoice(['no-pressure', 'low-pressure', 'moderate-pressure', 'high-pressure']);
  
  // 就业信心
  const employmentConfidence = randomChoice(['1', '2', '3', '4', '5']);
  
  // 构建sectionResponses
  const sectionResponses = [
    {
      sectionId: 'basic-demographics-v2',
      responses: [
        { questionId: 'gender-v2', value: gender },
        { questionId: 'age-range-v2', value: ageRange },
        { questionId: 'education-level-v2', value: educationLevel },
        { questionId: 'marital-status-v2', value: maritalStatus },
        { questionId: 'current-city-tier-v2', value: cityTier }
      ]
    },
    {
      sectionId: 'current-status-v2',
      responses: [
        { questionId: 'current-status-question-v2', value: currentStatus }
      ]
    },
    {
      sectionId: 'universal-economic-pressure-v2',
      responses: [
        { questionId: 'monthly-living-cost-v2', value: monthlyLivingCost },
        { questionId: 'income-sources-v2', value: incomeSources },
        { questionId: 'economic-pressure-level-v2', value: economicPressure }
      ]
    },
    {
      sectionId: 'employment-confidence-v2',
      responses: [
        { questionId: 'employment-confidence-v2', value: employmentConfidence }
      ]
    }
  ];
  
  const metadata = {
    submittedAt: Date.now(),
    completionTime: Math.floor(Math.random() * 600) + 300,
    userAgent: 'TestDataGenerator/1.0',
    version: '2.2.0',
    submissionType: 'complete',
    isCompleted: true,
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    isTestData: true,
    testDataRole: role,
    testDataGeneratedAt: Date.now()
  };
  
  return {
    questionnaireId,
    sectionResponses: JSON.stringify(sectionResponses).replace(/'/g, "''"),
    metadata: JSON.stringify(metadata).replace(/'/g, "''"),
    submittedAt,
    completionTime: metadata.completionTime,
    userAgent: metadata.userAgent,
    version: metadata.version,
    submissionType: metadata.submissionType,
    isCompleted: 1,
    ipAddress: metadata.ipAddress
  };
}

// 生成所有测试数据
function generateAllTestData() {
  const roles = {
    student: 200,
    fresh_graduate: 180,
    young_professional: 250,
    unemployed_35plus: 120,
    female_childbearing_age: 150,
    high_debt: 100
  };
  
  const allData = [];
  
  for (const [role, count] of Object.entries(roles)) {
    for (let i = 0; i < count; i++) {
      allData.push(generateSingleResponse(allData.length, role));
    }
  }
  
  return allData;
}

// 生成SQL插入语句
function generateInsertSQL(data, batchSize = 50) {
  const sqlFiles = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const values = batch.map(row => `(
  '${row.questionnaireId}',
  '${row.sectionResponses}',
  '${row.metadata}',
  '${row.submittedAt}',
  ${row.completionTime},
  '${row.userAgent}',
  '${row.version}',
  '${row.submissionType}',
  NULL,
  ${row.isCompleted},
  '${row.ipAddress}'
)`).join(',\n');
    
    const sql = `INSERT INTO universal_questionnaire_responses (
  questionnaire_id,
  section_responses,
  metadata,
  submitted_at,
  completion_time,
  user_agent,
  version,
  submission_type,
  user_id,
  is_completed,
  ip_address
) VALUES
${values};
`;
    
    sqlFiles.push(sql);
  }
  
  return sqlFiles;
}

// 主函数
function main() {
  console.log('🚀 开始生成1000条测试数据...\n');
  
  const data = generateAllTestData();
  console.log(`✅ 生成 ${data.length} 条数据\n`);
  
  const sqlStatements = generateInsertSQL(data, 50);
  console.log(`📝 生成 ${sqlStatements.length} 个SQL批次\n`);
  
  // 创建输出目录
  const outputDir = path.join(__dirname, 'generated-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 保存SQL文件（每个文件10个批次，即500条记录）
  const maxBatchesPerFile = 10;
  for (let i = 0; i < sqlStatements.length; i += maxBatchesPerFile) {
    const fileBatches = sqlStatements.slice(i, i + maxBatchesPerFile);
    const fileIndex = Math.floor(i / maxBatchesPerFile) + 1;
    const sqlPath = path.join(outputDir, `import_test_data_part${fileIndex}.sql`);
    
    fs.writeFileSync(sqlPath, fileBatches.join('\n\n'));
    console.log(`✅ SQL文件 ${fileIndex} 已保存: ${sqlPath}`);
  }
  
  // 生成导入指令
  const totalFiles = Math.ceil(sqlStatements.length / maxBatchesPerFile);
  const instructions = `
# 问卷2测试数据导入指南

## 数据概览
- 总数据量: 1000条
- 分布: 学生200, 应届毕业生180, 在职青年250, 35+失业120, 女性育龄150, 高负债100

## 导入命令

\`\`\`bash
cd backend/generated-data

${Array.from({length: totalFiles}, (_, i) => `npx wrangler d1 execute college-employment-survey --remote --file=import_test_data_part${i + 1}.sql`).join('\n')}
\`\`\`

## 验证导入

\`\`\`sql
SELECT COUNT(*) FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024';
\`\`\`

预期结果: 1000条
`;
  
  fs.writeFileSync(path.join(outputDir, 'IMPORT_INSTRUCTIONS.md'), instructions);
  console.log(`\n📋 导入指南已保存\n`);
  console.log('✅ 完成！请查看 backend/generated-data/ 目录');
}

main();


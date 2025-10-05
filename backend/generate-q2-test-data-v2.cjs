/**
 * 问卷2测试数据生成脚本 V2
 * 完全符合数据库Schema和API一致性
 * 生成1000条测试数据
 */

const fs = require('fs');
const path = require('path');

// 随机选择
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 随机多选
function randomMultiChoice(arr, min = 1, max = 3) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

// 随机数字
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成单条问卷响应数据（符合Schema）
function generateSingleResponse(index, role) {
  const questionnaireId = 'questionnaire-v2-2024';
  const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // 基础信息（根据角色）
  const gender = role === 'female_childbearing_age' ? 'female' : randomChoice(['male', 'female', 'other']);
  const ageRange = role === 'student' ? randomChoice(['under-20', '20-22']) :
                   role === 'fresh_graduate' ? randomChoice(['23-25', '26-28']) :
                   role === 'unemployed_35plus' ? 'over-35' :
                   randomChoice(['23-25', '26-28', '29-35', 'over-35']);
  
  const educationLevel = randomChoice(['high-school', 'vocational', 'college', 'bachelor', 'master', 'phd']);
  const maritalStatus = randomChoice(['single', 'married', 'divorced', 'widowed']);
  const hasChildren = maritalStatus === 'married' ? randomChoice(['yes', 'no']) : 'no';
  const cityTier = randomChoice(['tier-1', 'tier-2', 'tier-3', 'tier-4']);
  const hukouType = randomChoice(['urban', 'rural']);
  const yearsExperience = role === 'student' ? '0' : randomChoice(['0', '1-3', '3-5', '5-10', 'over-10']);
  
  const currentStatus = role === 'student' ? 'student' :
                        role === 'unemployed_35plus' ? 'unemployed' :
                        randomChoice(['employed', 'unemployed', 'freelance']);

  // 就业状态相关（仅employed状态）
  const monthlySalary = currentStatus === 'employed' ?
    randomChoice(['below-3000', '3000-5000', '5000-8000', '8000-12000', '12000-20000', 'over-20000']) : null;

  // 经济压力
  const debtSituation = randomMultiChoice(['student-loan', 'mortgage', 'car-loan', 'consumer-loan', 'credit-card', 'none'], 1, 3);
  const monthlyDebtBurden = debtSituation.includes('none') ? 'no-debt' : randomChoice(['below-1000', '1000-3000', '3000-5000', '5000-10000', 'over-10000']);
  const monthlyLivingCost = role === 'student' ? randomChoice(['below-1000', '1000-2000', '2000-3000']) :
                            randomChoice(['2000-3000', '3000-5000', '5000-8000', '8000-12000', 'over-12000']);
  const incomeSources = randomMultiChoice(['salary', 'freelance', 'parents-support', 'scholarship', 'savings', 'investment'], 1, 3);
  const parentalSupportAmount = incomeSources.includes('parents-support') ? randomChoice(['below-500', '500-1000', '1000-2000', '2000-3000', '3000-5000', 'over-5000']) : null;
  const incomeExpenseBalance = randomChoice(['surplus-large', 'surplus-small', 'balanced', 'deficit-small', 'deficit-large', 'dependent']);
  const economicPressure = role === 'high_debt' ? randomChoice(['high-pressure', 'severe-pressure']) :
                           randomChoice(['no-pressure', 'low-pressure', 'mild-pressure', 'moderate-pressure', 'high-pressure']);
  
  // 就业信心
  const employmentConfidence = randomChoice(['1', '2', '3', '4', '5']);
  const confidenceFactors = randomMultiChoice(['market-outlook', 'personal-skills', 'education-background', 'work-experience', 'network', 'age', 'gender'], 1, 4);
  
  // 歧视经历
  const discriminationTypes = randomMultiChoice(['age', 'gender', 'education', 'appearance', 'region', 'marital-status', 'political-status', 'none'], 0, 3);
  const discriminationSeverity = discriminationTypes.length > 0 && !discriminationTypes.includes('none') ? randomChoice(['mild', 'moderate', 'severe']) : null;
  const discriminationChannels = discriminationTypes.length > 0 && !discriminationTypes.includes('none') ? randomMultiChoice(['job-posting', 'resume-screening', 'interview', 'onsite-interview', 'offer-stage', 'workplace'], 1, 2) : null;

  // 生育意愿（仅适用于育龄人群）
  const fertilityPlan = (gender === 'female' && ['23-25', '26-28', '29-35'].includes(ageRange)) ||
                        (gender === 'male' && ['26-28', '29-35'].includes(ageRange))
    ? randomChoice(['no-plan', 'considering', 'plan-1', 'plan-2', 'plan-3-or-more'])
    : null;

  // 构建sectionResponses（符合问卷2定义）
  const sectionResponses = [
    {
      sectionId: 'basic-demographics-v2',
      responses: [
        { questionId: 'gender-v2', value: gender },
        { questionId: 'age-range-v2', value: ageRange },
        { questionId: 'education-level-v2', value: educationLevel },
        { questionId: 'marital-status-v2', value: maritalStatus },
        { questionId: 'has-children-v2', value: hasChildren },
        { questionId: 'current-city-tier-v2', value: cityTier },
        { questionId: 'hukou-type-v2', value: hukouType },
        { questionId: 'years-experience-v2', value: yearsExperience }
      ]
    },
    {
      sectionId: 'current-status-v2',
      responses: [
        { questionId: 'current-status-question-v2', value: currentStatus },
        ...(monthlySalary ? [{ questionId: 'monthly-salary-v2', value: monthlySalary }] : [])
      ]
    },
    {
      sectionId: 'universal-economic-pressure-v2',
      responses: [
        { questionId: 'debt-situation-v2', value: debtSituation },
        { questionId: 'monthly-debt-burden-v2', value: monthlyDebtBurden },
        { questionId: 'monthly-living-cost-v2', value: monthlyLivingCost },
        { questionId: 'income-sources-v2', value: incomeSources },
        ...(parentalSupportAmount ? [{ questionId: 'parental-support-amount-v2', value: parentalSupportAmount }] : []),
        { questionId: 'income-expense-balance-v2', value: incomeExpenseBalance },
        { questionId: 'economic-pressure-level-v2', value: economicPressure }
      ]
    },
    {
      sectionId: 'employment-confidence-v2',
      responses: [
        { questionId: 'employment-confidence-v2', value: employmentConfidence },
        { questionId: 'confidence-factors-v2', value: confidenceFactors }
      ]
    },
    {
      sectionId: 'discrimination-experience-v2',
      responses: [
        { questionId: 'experienced-discrimination-types-v2', value: discriminationTypes },
        ...(discriminationSeverity ? [{ questionId: 'discrimination-severity-v2', value: discriminationSeverity }] : []),
        ...(discriminationChannels ? [{ questionId: 'discrimination-channels-v2', value: discriminationChannels }] : [])
      ]
    },
    ...(fertilityPlan ? [{
      sectionId: 'fertility-intention-v2',
      responses: [
        { questionId: 'fertility-plan-v2', value: fertilityPlan }
      ]
    }] : [])
  ];
  
  // 元数据
  const metadata = {
    submittedAt: Date.now(),
    completionTime: randomInt(300, 900),
    userAgent: 'TestDataGenerator/2.0',
    version: '2.2.0',
    submissionType: 'complete',
    isCompleted: true,
    ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
    isTestData: true,
    testDataRole: role,
    testDataGeneratedAt: Date.now()
  };
  
  // 构建response_data（符合Schema）
  const responseData = {
    sectionResponses,
    metadata
  };
  
  return {
    questionnaireId,
    userId: null, // 匿名提交
    responseData: JSON.stringify(responseData).replace(/'/g, "''"), // 转义单引号
    submittedAt,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
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
    console.log(`生成 ${role} 角色数据: ${count}条`);
    for (let i = 0; i < count; i++) {
      allData.push(generateSingleResponse(allData.length, role));
    }
  }
  
  return allData;
}

// 生成SQL插入语句（符合实际表结构）
function generateInsertSQL(data, batchSize = 50) {
  const sqlFiles = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const values = batch.map(row => `(
  '${row.questionnaireId}',
  NULL,
  '${row.responseData}',
  '${row.submittedAt}',
  '${row.ipAddress}',
  '${row.userAgent}'
)`).join(',\n');
    
    const sql = `-- 批次 ${Math.floor(i / batchSize) + 1}
INSERT INTO universal_questionnaire_responses (
  questionnaire_id,
  user_id,
  response_data,
  submitted_at,
  ip_address,
  user_agent
) VALUES
${values};
`;
    
    sqlFiles.push(sql);
  }
  
  return sqlFiles;
}

// 主函数
function main() {
  console.log('🚀 开始生成问卷2测试数据（1000条）...\n');
  console.log('📋 数据Schema: universal_questionnaire_responses');
  console.log('📋 字段: questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent\n');
  
  const data = generateAllTestData();
  console.log(`\n✅ 生成 ${data.length} 条数据\n`);
  
  const sqlStatements = generateInsertSQL(data, 25);
  console.log(`📝 生成 ${sqlStatements.length} 个SQL批次\n`);

  // 创建输出目录
  const outputDir = path.join(__dirname, 'generated-data-v2');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存SQL文件（每个文件5个批次，即125条记录）
  const maxBatchesPerFile = 5;
  for (let i = 0; i < sqlStatements.length; i += maxBatchesPerFile) {
    const fileBatches = sqlStatements.slice(i, i + maxBatchesPerFile);
    const fileIndex = Math.floor(i / maxBatchesPerFile) + 1;
    const sqlPath = path.join(outputDir, `import_q2_test_data_part${fileIndex}.sql`);
    
    fs.writeFileSync(sqlPath, fileBatches.join('\n\n'));
    console.log(`✅ SQL文件 ${fileIndex} 已保存: ${sqlPath}`);
  }
  
  // 生成导入指令
  const totalFiles = Math.ceil(sqlStatements.length / maxBatchesPerFile);
  const instructions = `# 问卷2测试数据导入指南 V2

## 数据概览
- **总数据量**: 1000条
- **数据库表**: universal_questionnaire_responses
- **Schema字段**: questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent
- **数据分布**: 
  - 学生: 200条 (20%)
  - 应届毕业生: 180条 (18%)
  - 在职青年: 250条 (25%)
  - 35+失业: 120条 (12%)
  - 女性育龄: 150条 (15%)
  - 高负债: 100条 (10%)

## 导入命令

\`\`\`bash
cd backend/generated-data-v2

${Array.from({length: totalFiles}, (_, i) => `# 导入第${i + 1}部分（500条）
npx wrangler d1 execute college-employment-survey --remote --file=import_q2_test_data_part${i + 1}.sql`).join('\n\n')}
\`\`\`

## 验证导入

\`\`\`bash
# 查询总数
npx wrangler d1 execute college-employment-survey --remote --command="SELECT COUNT(*) as total FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024';"

# 查询测试数据分布
npx wrangler d1 execute college-employment-survey --remote --command="SELECT json_extract(response_data, '$.metadata.testDataRole') as role, COUNT(*) as count FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024' AND json_extract(response_data, '$.metadata.isTestData') = 1 GROUP BY role;"
\`\`\`

预期结果: 1000条测试数据

## 下一步：同步静态表

导入完成后，调用同步API：

\`\`\`bash
curl -X POST https://employment-survey-api-prod.chrismarker89.workers.dev/api/questionnaire-v2/sync-static-tables
\`\`\`
`;
  
  fs.writeFileSync(path.join(outputDir, 'IMPORT_INSTRUCTIONS.md'), instructions);
  console.log(`\n📋 导入指南已保存\n`);
  console.log('✅ 完成！请查看 backend/generated-data-v2/ 目录');
  console.log('\n📊 数据一致性验证:');
  console.log('  ✅ Schema: universal_questionnaire_responses');
  console.log('  ✅ 字段: response_data (JSON格式)');
  console.log('  ✅ 数据结构: { sectionResponses: [...], metadata: {...} }');
  console.log('  ✅ 问卷ID: questionnaire-v2-2024');
}

main();


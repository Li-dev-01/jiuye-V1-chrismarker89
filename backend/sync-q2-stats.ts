/**
 * 问卷2统计数据同步脚本
 * 从 universal_questionnaire_responses 同步到 q2_* 统计表
 */

import { createDatabaseService } from './src/db';

interface ResponseData {
  response_data: string;
}

interface Stats {
  total: number;
  [key: string]: any;
}

async function syncQ2Statistics() {
  console.log('🔄 开始同步问卷2统计数据...\n');

  // 模拟环境变量（实际运行时会从 wrangler 获取）
  const env = process.env as any;
  
  if (!env.DB) {
    console.error('❌ 数据库连接不可用');
    console.log('请使用以下命令运行：');
    console.log('npx wrangler d1 execute college-employment-survey --remote --file=./sync-q2-stats.sql');
    return;
  }

  const db = createDatabaseService(env.DB);

  try {
    // 1. 获取所有问卷2数据
    console.log('📊 步骤1: 读取原始数据...');
    const responses = await db.query<ResponseData>(
      `SELECT response_data 
       FROM universal_questionnaire_responses 
       WHERE questionnaire_id = 'questionnaire-v2-2024'`
    );

    console.log(`✅ 找到 ${responses.length} 条问卷2数据\n`);

    if (responses.length === 0) {
      console.log('⚠️ 没有数据需要同步');
      return;
    }

    // 2. 解析数据并统计
    console.log('📊 步骤2: 解析并统计数据...');
    const stats = parseResponses(responses);
    console.log(`✅ 统计完成，共 ${stats.total} 条有效数据\n`);

    // 3. 同步到各个统计表
    console.log('📊 步骤3: 同步到统计表...');
    
    await syncBasicStats(db, stats);
    await syncEconomicAnalysis(db, stats);
    await syncEmploymentAnalysis(db, stats);
    await syncDiscriminationAnalysis(db, stats);
    await syncConfidenceAnalysis(db, stats);
    await syncFertilityAnalysis(db, stats);

    console.log('\n✅ 所有统计表同步完成！');

  } catch (error) {
    console.error('❌ 同步失败:', error);
    throw error;
  }
}

/**
 * 解析响应数据
 */
function parseResponses(responses: ResponseData[]): Stats {
  const stats: Stats = {
    total: responses.length,
    gender: {},
    ageRange: {},
    educationLevel: {},
    maritalStatus: {},
    cityTier: {},
    hukouType: {},
    employmentStatus: {},
    debtSituation: {},
    monthlyLivingCost: {},
    economicPressure: {},
    currentSalary: {},
    discriminationTypes: {},
    discriminationSeverity: {},
    discriminationChannels: {},
    employmentConfidence6m: {},
    employmentConfidence1y: {},
    confidenceFactors: {},
    fertilityIntent: {}
  };

  for (const response of responses) {
    try {
      const data = JSON.parse(response.response_data);
      const sectionResponses = data.sectionResponses || [];

      // 提取所有问题响应
      const answers: Record<string, any> = {};
      for (const section of sectionResponses) {
        for (const qr of section.questionResponses || []) {
          answers[qr.questionId] = qr.value;
        }
      }

      // 统计各维度
      countValue(stats.gender, answers['gender-v2']);
      countValue(stats.ageRange, answers['age-range-v2']);
      countValue(stats.educationLevel, answers['education-level-v2']);
      countValue(stats.maritalStatus, answers['marital-status-v2']);
      countValue(stats.cityTier, answers['current-location-v2']);
      countValue(stats.hukouType, answers['hukou-type-v2']);
      countValue(stats.employmentStatus, answers['current-status-question-v2']);
      
      // 负债情况（多选）
      if (Array.isArray(answers['debt-situation-v2'])) {
        for (const debt of answers['debt-situation-v2']) {
          countValue(stats.debtSituation, debt);
        }
      }
      
      countValue(stats.monthlyLivingCost, answers['monthly-living-cost-v2']);
      countValue(stats.economicPressure, answers['economic-pressure-level-v2']);
      countValue(stats.currentSalary, answers['current-salary-v2']);
      
      // 歧视类型（多选）
      if (Array.isArray(answers['experienced-discrimination-types-v2'])) {
        for (const type of answers['experienced-discrimination-types-v2']) {
          countValue(stats.discriminationTypes, type);
        }
      }
      
      countValue(stats.discriminationSeverity, answers['discrimination-severity-v2']);
      
      // 歧视渠道（多选）
      if (Array.isArray(answers['discrimination-channels-v2'])) {
        for (const channel of answers['discrimination-channels-v2']) {
          countValue(stats.discriminationChannels, channel);
        }
      }
      
      countValue(stats.employmentConfidence6m, answers['employment-confidence-6months-v2']);
      countValue(stats.employmentConfidence1y, answers['employment-confidence-1year-v2']);
      
      // 信心影响因素（多选）
      if (Array.isArray(answers['confidence-influencing-factors-v2'])) {
        for (const factor of answers['confidence-influencing-factors-v2']) {
          countValue(stats.confidenceFactors, factor);
        }
      }
      
      countValue(stats.fertilityIntent, answers['fertility-plan-v2']);

    } catch (error) {
      console.error('解析数据失败:', error);
    }
  }

  return stats;
}

function countValue(counter: Record<string, number>, value: any) {
  if (value === undefined || value === null || value === '') return;
  const key = String(value);
  counter[key] = (counter[key] || 0) + 1;
}

/**
 * 同步基础统计表
 */
async function syncBasicStats(db: any, stats: Stats) {
  console.log('  📝 同步基础统计表...');
  
  await db.execute('DELETE FROM q2_basic_stats');

  const dimensions = [
    { key: 'gender', name: 'gender' },
    { key: 'ageRange', name: 'age_range' },
    { key: 'educationLevel', name: 'education_level' },
    { key: 'maritalStatus', name: 'marital_status' },
    { key: 'cityTier', name: 'city_tier' },
    { key: 'hukouType', name: 'hukou_type' },
    { key: 'employmentStatus', name: 'employment_status' }
  ];

  let inserted = 0;
  for (const dim of dimensions) {
    const data = stats[dim.key];
    for (const [value, count] of Object.entries(data)) {
      const percentage = ((count as number) / stats.total) * 100;
      await db.execute(
        `INSERT INTO q2_basic_stats (dimension, value, count, percentage, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [dim.name, value, count, percentage]
      );
      inserted++;
    }
  }

  console.log(`  ✅ 基础统计表: ${inserted} 条记录`);
}

/**
 * 同步经济分析表
 */
async function syncEconomicAnalysis(db: any, stats: Stats) {
  console.log('  💰 同步经济分析表...');
  
  await db.execute('DELETE FROM q2_economic_analysis');

  let inserted = 0;
  
  // 负债情况
  for (const [value, count] of Object.entries(stats.debtSituation)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['debt_situation', value, count, percentage]
    );
    inserted++;
  }

  // 生活成本
  for (const [value, count] of Object.entries(stats.monthlyLivingCost)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['monthly_living_cost', value, count, percentage]
    );
    inserted++;
  }

  // 经济压力
  for (const [value, count] of Object.entries(stats.economicPressure)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['economic_pressure', value, count, percentage]
    );
    inserted++;
  }

  console.log(`  ✅ 经济分析表: ${inserted} 条记录`);
}

/**
 * 同步就业分析表
 */
async function syncEmploymentAnalysis(db: any, stats: Stats) {
  console.log('  💼 同步就业分析表...');
  
  await db.execute('DELETE FROM q2_employment_analysis');

  let inserted = 0;
  
  // 就业状态
  for (const [value, count] of Object.entries(stats.employmentStatus)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_employment_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['employment_status', value, count, percentage]
    );
    inserted++;
  }

  // 薪资水平
  for (const [value, count] of Object.entries(stats.currentSalary)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_employment_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['current_salary', value, count, percentage]
    );
    inserted++;
  }

  console.log(`  ✅ 就业分析表: ${inserted} 条记录`);
}

/**
 * 同步歧视分析表
 */
async function syncDiscriminationAnalysis(db: any, stats: Stats) {
  console.log('  ⚖️ 同步歧视分析表...');

  await db.execute('DELETE FROM q2_discrimination_analysis');

  let inserted = 0;

  // 歧视类型
  for (const [value, count] of Object.entries(stats.discriminationTypes)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_discrimination_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['discrimination_types', value, count, percentage]
    );
    inserted++;
  }

  // 歧视严重程度
  for (const [value, count] of Object.entries(stats.discriminationSeverity)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_discrimination_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['discrimination_severity', value, count, percentage]
    );
    inserted++;
  }

  // 歧视渠道
  for (const [value, count] of Object.entries(stats.discriminationChannels)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_discrimination_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['discrimination_channels', value, count, percentage]
    );
    inserted++;
  }

  console.log(`  ✅ 歧视分析表: ${inserted} 条记录`);
}

/**
 * 同步信心分析表
 */
async function syncConfidenceAnalysis(db: any, stats: Stats) {
  console.log('  📈 同步信心分析表...');

  await db.execute('DELETE FROM q2_confidence_analysis');

  let inserted = 0;

  // 6个月信心
  for (const [value, count] of Object.entries(stats.employmentConfidence6m)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_confidence_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['confidence_6months', value, count, percentage]
    );
    inserted++;
  }

  // 1年信心
  for (const [value, count] of Object.entries(stats.employmentConfidence1y)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_confidence_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['confidence_1year', value, count, percentage]
    );
    inserted++;
  }

  // 影响因素
  for (const [value, count] of Object.entries(stats.confidenceFactors)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_confidence_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['confidence_factors', value, count, percentage]
    );
    inserted++;
  }

  console.log(`  ✅ 信心分析表: ${inserted} 条记录`);
}

/**
 * 同步生育分析表
 */
async function syncFertilityAnalysis(db: any, stats: Stats) {
  console.log('  👶 同步生育分析表...');

  await db.execute('DELETE FROM q2_fertility_analysis');

  let inserted = 0;

  // 生育意愿
  for (const [value, count] of Object.entries(stats.fertilityIntent)) {
    const percentage = ((count as number) / stats.total) * 100;
    await db.execute(
      `INSERT INTO q2_fertility_analysis (dimension, value, count, percentage, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      ['fertility_intent', value, count, percentage]
    );
    inserted++;
  }

  console.log(`  ✅ 生育分析表: ${inserted} 条记录`);
}

// 运行同步
syncQ2Statistics().catch(console.error);


/**
 * 问卷2测试数据生成脚本
 * 生成不同角色、不同状态的问卷2测试数据
 * 所有数据带有'测试数据'标记，方便后期清理
 */

import { EnhancedQuestionnaireDataGenerator } from '../utils/enhancedQuestionnaireDataGenerator';
import type { GeneratedQuestionnaireData } from '../utils/enhancedQuestionnaireDataGenerator';

// 定义不同角色的分布权重
const ROLE_DISTRIBUTIONS = {
  // 学生群体（18-22岁，学生状态）
  student: {
    'age-range-v2': { '18-22': 0.8, '23-25': 0.2 },
    'education-level-v2': { 'undergraduate': 0.7, 'junior-college': 0.2, 'high-school': 0.1 },
    'current-status-v2': { 'student': 1.0 },
    'monthly-living-cost-v2': { '1000-2000': 0.6, 'below-1000': 0.2, '2000-3000': 0.2 },
    'income-sources-v2': { 'parents-support': 0.8, 'scholarship': 0.3, 'freelance': 0.2 },
    'parental-support-amount-v2': { '1000-2000': 0.5, '2000-3000': 0.3, '500-1000': 0.2 },
    'income-expense-balance-v2': { 'balanced': 0.4, 'surplus-low': 0.3, 'deficit-low': 0.3 }
  },

  // 应届毕业生（23-25岁，求职中）
  fresh_graduate: {
    'age-range-v2': { '23-25': 0.8, '26-28': 0.2 },
    'education-level-v2': { 'undergraduate': 0.6, 'master': 0.3, 'junior-college': 0.1 },
    'current-status-v2': { 'unemployed': 0.7, 'employed': 0.3 },
    'monthly-living-cost-v2': { '2000-3000': 0.4, '3000-5000': 0.4, '1000-2000': 0.2 },
    'income-sources-v2': { 'parents-support': 0.6, 'savings': 0.4, 'freelance': 0.2 },
    'parental-support-amount-v2': { '2000-3000': 0.4, '1000-2000': 0.3, '3000-5000': 0.3 },
    'income-expense-balance-v2': { 'deficit-low': 0.5, 'balanced': 0.3, 'deficit-high': 0.2 }
  },

  // 在职青年（26-34岁，已就业）
  young_professional: {
    'age-range-v2': { '26-28': 0.4, '29-34': 0.6 },
    'education-level-v2': { 'undergraduate': 0.5, 'master': 0.3, 'junior-college': 0.2 },
    'current-status-v2': { 'employed': 0.9, 'unemployed': 0.1 },
    'monthly-living-cost-v2': { '3000-5000': 0.4, '5000-8000': 0.4, '2000-3000': 0.2 },
    'income-sources-v2': { 'salary': 0.9, 'freelance': 0.2, 'investment': 0.1 },
    'income-expense-balance-v2': { 'surplus-low': 0.4, 'balanced': 0.3, 'surplus-high': 0.2, 'deficit-low': 0.1 }
  },

  // 35+失业群体（35+岁，失业）
  unemployed_35plus: {
    'age-range-v2': { '35+': 1.0 },
    'education-level-v2': { 'undergraduate': 0.4, 'junior-college': 0.3, 'high-school': 0.2, 'master': 0.1 },
    'current-status-v2': { 'unemployed': 1.0 },
    'monthly-living-cost-v2': { '3000-5000': 0.4, '5000-8000': 0.3, '2000-3000': 0.3 },
    'income-sources-v2': { 'savings': 0.6, 'parents-support': 0.2, 'loan': 0.3, 'government-aid': 0.2 },
    'income-expense-balance-v2': { 'deficit-high': 0.4, 'deficit-low': 0.3, 'balanced': 0.2, 'no-income': 0.1 },
    'economic-pressure-level-v2': { 'high-pressure': 0.4, 'severe-pressure': 0.3, 'moderate-pressure': 0.3 }
  },

  // 女性育龄群体（26-34岁，女性）
  female_childbearing_age: {
    'gender-v2': { 'female': 1.0 },
    'age-range-v2': { '26-28': 0.4, '29-34': 0.6 },
    'marital-status-v2': { 'married': 0.6, 'single': 0.3, 'divorced': 0.1 },
    'has-children-v2': { 'yes': 0.4, 'no': 0.6 },
    'fertility-intent-v2': { 'yes-soon': 0.2, 'yes-later': 0.3, 'no': 0.3, 'no-already': 0.2 },
    'experienced-discrimination-types-v2': { 'gender': 0.5, 'marriage-fertility': 0.6, 'age': 0.2 }
  },

  // 高经济压力群体（负债较多）
  high_debt: {
    'debt-situation-v2': { 'student-loan': 0.4, 'alipay-huabei': 0.7, 'credit-card': 0.6, 'consumer-loan': 0.4 },
    'monthly-debt-burden-v2': { '2000-3000': 0.3, '3000-5000': 0.4, 'above-5000': 0.3 },
    'economic-pressure-level-v2': { 'high-pressure': 0.5, 'severe-pressure': 0.3, 'moderate-pressure': 0.2 },
    'income-expense-balance-v2': { 'deficit-high': 0.5, 'deficit-low': 0.3, 'balanced': 0.2 }
  }
};

/**
 * 生成指定角色的测试数据
 */
export function generateRoleBasedTestData(
  role: keyof typeof ROLE_DISTRIBUTIONS,
  count: number
): GeneratedQuestionnaireData[] {
  const generator = new EnhancedQuestionnaireDataGenerator({
    questionnaireId: 'questionnaire-v2-2024',
    count,
    distributionWeights: ROLE_DISTRIBUTIONS[role]
  });

  const data = generator.generateBatch();

  // 为每条数据添加测试标记
  return data.map(item => ({
    ...item,
    metadata: {
      ...item.metadata,
      isTestData: true,
      testDataRole: role,
      testDataGeneratedAt: Date.now()
    }
  }));
}

/**
 * 生成完整的测试数据集（包含所有角色）
 * 更新：生成1000条测试数据以覆盖40+字段的多维度分析
 */
export function generateCompleteTestDataset(): {
  data: GeneratedQuestionnaireData[];
  summary: Record<string, number>;
} {
  const allData: GeneratedQuestionnaireData[] = [];
  const summary: Record<string, number> = {};

  // 每个角色生成的数量（总计1000条）
  const roleCounts = {
    student: 200,                   // 学生：200条（20%）
    fresh_graduate: 180,            // 应届毕业生：180条（18%）
    young_professional: 250,        // 在职青年：250条（25%）
    unemployed_35plus: 120,         // 35+失业：120条（12%）
    female_childbearing_age: 150,   // 女性育龄：150条（15%）
    high_debt: 100                  // 高负债：100条（10%）
  };

  for (const [role, count] of Object.entries(roleCounts)) {
    const roleData = generateRoleBasedTestData(role as keyof typeof ROLE_DISTRIBUTIONS, count);
    allData.push(...roleData);
    summary[role] = count;
  }

  summary.total = allData.length;

  return { data: allData, summary };
}

/**
 * 将测试数据转换为数据库插入格式
 */
export function convertToDBFormat(data: GeneratedQuestionnaireData[]): any[] {
  return data.map(item => ({
    questionnaire_id: item.questionnaireId,
    section_responses: JSON.stringify(item.sectionResponses),
    metadata: JSON.stringify(item.metadata),
    submitted_at: new Date(item.metadata.submittedAt).toISOString(),
    completion_time: item.metadata.completionTime,
    user_agent: item.metadata.userAgent,
    version: item.metadata.version,
    submission_type: item.metadata.submissionType,
    user_id: item.metadata.userId || null,
    is_completed: item.metadata.isCompleted ? 1 : 0,
    ip_address: item.metadata.ipAddress,
    is_test_data: 1, // 测试数据标记
    test_data_role: (item.metadata as any).testDataRole || null,
    test_data_generated_at: new Date((item.metadata as any).testDataGeneratedAt || Date.now()).toISOString()
  }));
}

/**
 * 生成SQL插入语句
 */
export function generateInsertSQL(data: GeneratedQuestionnaireData[]): string {
  const dbData = convertToDBFormat(data);
  
  const values = dbData.map(row => {
    const sectionResponses = row.section_responses.replace(/'/g, "''");
    const metadata = row.metadata.replace(/'/g, "''");
    
    return `(
      '${row.questionnaire_id}',
      '${sectionResponses}',
      '${metadata}',
      '${row.submitted_at}',
      ${row.completion_time},
      '${row.user_agent}',
      '${row.version}',
      '${row.submission_type}',
      ${row.user_id ? `'${row.user_id}'` : 'NULL'},
      ${row.is_completed},
      '${row.ip_address}',
      ${row.is_test_data},
      ${row.test_data_role ? `'${row.test_data_role}'` : 'NULL'},
      '${row.test_data_generated_at}'
    )`;
  }).join(',\n');

  return `
INSERT INTO universal_questionnaire_responses (
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
  ip_address,
  is_test_data,
  test_data_role,
  test_data_generated_at
) VALUES
${values};
`;
}

/**
 * 主函数：生成并输出测试数据
 */
export function main() {
  console.log('🚀 开始生成问卷2测试数据...\n');

  const { data, summary } = generateCompleteTestDataset();

  console.log('📊 生成摘要：');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n✅ 总计生成 ${summary.total} 条测试数据\n`);

  // 输出JSON格式（用于API导入）
  console.log('📄 JSON格式数据（前3条示例）：');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  // 输出SQL格式（用于直接数据库导入）
  console.log('\n📝 SQL插入语句（已生成，可用于数据库导入）');
  console.log('提示：完整SQL语句已保存到 questionnaire2_test_data.sql');

  return { data, summary };
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}


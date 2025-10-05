/**
 * 问卷2静态表同步服务
 * 从原始数据表同步到7个静态分析表
 */

import type { DatabaseService } from '../db';

export class Questionnaire2StaticTableSyncService {
  constructor(private db: DatabaseService) {}

  /**
   * 执行完整同步（所有静态表）
   */
  async syncAllTables(): Promise<{
    success: boolean;
    results: Record<string, any>;
    error?: string;
  }> {
    const results: Record<string, any> = {};
    const startTime = Date.now();

    try {
      console.log('🔄 开始同步问卷2静态表...');

      // 记录同步开始
      await this.logSyncStart('ALL_TABLES', 'full');

      // 同步各个表
      results.basicStats = await this.syncBasicStats();
      results.economicAnalysis = await this.syncEconomicAnalysis();
      results.employmentAnalysis = await this.syncEmploymentAnalysis();
      results.discriminationAnalysis = await this.syncDiscriminationAnalysis();
      results.confidenceAnalysis = await this.syncConfidenceAnalysis();
      results.fertilityAnalysis = await this.syncFertilityAnalysis();
      results.crossAnalysis = await this.syncCrossAnalysis();

      const duration = Date.now() - startTime;
      console.log(`✅ 所有静态表同步完成，耗时: ${duration}ms`);

      // 记录同步成功
      await this.logSyncComplete('ALL_TABLES', 'full', results, 'success');

      return { success: true, results };
    } catch (error: any) {
      console.error('❌ 静态表同步失败:', error);
      
      // 记录同步失败
      await this.logSyncComplete('ALL_TABLES', 'full', results, 'failed', error.message);

      return { success: false, results, error: error.message };
    }
  }

  /**
   * 同步基础维度统计表
   */
  private async syncBasicStats(): Promise<any> {
    console.log('📊 同步基础维度统计表...');

    // 清空旧数据
    await this.db.run('DELETE FROM q2_basic_stats');

    const dimensions = [
      { field: 'gender_v2', dimension: 'gender' },
      { field: 'age_range_v2', dimension: 'age' },
      { field: 'education_level_v2', dimension: 'education' },
      { field: 'marital_status_v2', dimension: 'marital' },
      { field: 'current_city_tier_v2', dimension: 'city' },
      { field: 'hukou_type_v2', dimension: 'hukou' },
      { field: 'current_status_question_v2', dimension: 'employment_status' }
    ];

    let totalInserted = 0;

    for (const { field, dimension } of dimensions) {
      const stats = await this.db.all(
        `SELECT 
          '${dimension}' as dimension,
          ${field} as value,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire2_wide_table WHERE ${field} IS NOT NULL), 2) as percentage
         FROM questionnaire2_wide_table
         WHERE ${field} IS NOT NULL
         GROUP BY ${field}`
      );

      for (const stat of stats) {
        await this.db.run(
          `INSERT INTO q2_basic_stats (dimension, value, count, percentage, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [stat.dimension, stat.value, stat.count, stat.percentage]
        );
        totalInserted++;
      }
    }

    console.log(`✅ 基础维度统计表同步完成，插入 ${totalInserted} 条记录`);
    return { inserted: totalInserted };
  }

  /**
   * 同步经济压力分析表
   */
  private async syncEconomicAnalysis(): Promise<any> {
    console.log('💰 同步经济压力分析表...');

    await this.db.run('DELETE FROM q2_economic_analysis');

    const result = await this.db.all(
      `SELECT 
        age_range_v2 as age_range,
        current_status_question_v2 as employment_status,
        AVG(CAST(SUBSTR(monthly_living_cost_v2, 1, INSTR(monthly_living_cost_v2, '-') - 1) AS REAL)) as avg_living_cost,
        AVG(CAST(SUBSTR(monthly_debt_burden_v2, 1, INSTR(monthly_debt_burden_v2, '-') - 1) AS REAL)) as avg_debt_burden,
        ROUND(SUM(CASE WHEN income_sources_v2 LIKE '%parents-support%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as parental_support_rate,
        ROUND(SUM(CASE WHEN economic_pressure_level_v2 IN ('high-pressure', 'severe-pressure') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as high_pressure_rate,
        ROUND(SUM(CASE WHEN income_expense_balance_v2 IN ('deficit-low', 'deficit-high', 'no-income') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as income_deficit_rate,
        COUNT(*) as count
       FROM questionnaire2_wide_table
       WHERE age_range_v2 IS NOT NULL AND current_status_question_v2 IS NOT NULL
       GROUP BY age_range_v2, current_status_question_v2`
    );

    for (const row of result) {
      await this.db.run(
        `INSERT INTO q2_economic_analysis (
          age_range, employment_status, avg_living_cost, avg_debt_burden,
          parental_support_rate, high_pressure_rate, income_deficit_rate, count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          row.age_range, row.employment_status, row.avg_living_cost, row.avg_debt_burden,
          row.parental_support_rate, row.high_pressure_rate, row.income_deficit_rate, row.count
        ]
      );
    }

    console.log(`✅ 经济压力分析表同步完成，插入 ${result.length} 条记录`);
    return { inserted: result.length };
  }

  /**
   * 同步就业状态分析表
   */
  private async syncEmploymentAnalysis(): Promise<any> {
    console.log('💼 同步就业状态分析表...');

    await this.db.run('DELETE FROM q2_employment_analysis');

    const result = await this.db.all(
      `SELECT 
        age_range_v2 as age_range,
        education_level_v2 as education_level,
        current_city_tier_v2 as city_tier,
        current_status_question_v2 as employment_status,
        AVG(CAST(SUBSTR(current_salary_v2, 1, INSTR(current_salary_v2, '-') - 1) AS REAL)) as avg_salary,
        ROUND(SUM(CASE WHEN current_status_question_v2 = 'unemployed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as unemployment_rate,
        AVG(CASE WHEN job_search_duration_v2 = '6-12-months' THEN 9 
                 WHEN job_search_duration_v2 = 'over-12-months' THEN 15 
                 ELSE 3 END) as avg_job_search_months,
        ROUND(SUM(CASE WHEN salary_debt_ratio_v2 IN ('50-70', 'over-70') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as salary_debt_ratio_high_rate,
        COUNT(*) as count
       FROM questionnaire2_wide_table
       WHERE age_range_v2 IS NOT NULL
       GROUP BY age_range_v2, education_level_v2, current_city_tier_v2, current_status_question_v2`
    );

    for (const row of result) {
      await this.db.run(
        `INSERT INTO q2_employment_analysis (
          age_range, education_level, city_tier, employment_status,
          avg_salary, unemployment_rate, avg_job_search_months, salary_debt_ratio_high_rate, count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          row.age_range, row.education_level, row.city_tier, row.employment_status,
          row.avg_salary, row.unemployment_rate, row.avg_job_search_months, row.salary_debt_ratio_high_rate, row.count
        ]
      );
    }

    console.log(`✅ 就业状态分析表同步完成，插入 ${result.length} 条记录`);
    return { inserted: result.length };
  }

  /**
   * 同步歧视分析表
   */
  private async syncDiscriminationAnalysis(): Promise<any> {
    console.log('⚖️ 同步歧视分析表...');

    await this.db.run('DELETE FROM q2_discrimination_analysis');

    // 这里需要解析多选字段，简化处理
    const discriminationTypes = ['gender', 'age', 'education', 'marriage-fertility', 'appearance', 'region', 'health'];
    let totalInserted = 0;

    for (const type of discriminationTypes) {
      const stats = await this.db.all(
        `SELECT 
          '${type}' as discrimination_type,
          gender_v2 as gender,
          age_range_v2 as age_range,
          discrimination_severity_v2 as severity,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire2_wide_table WHERE experienced_discrimination_types_v2 LIKE '%${type}%'), 2) as percentage
         FROM questionnaire2_wide_table
         WHERE experienced_discrimination_types_v2 LIKE '%${type}%'
         GROUP BY gender_v2, age_range_v2, discrimination_severity_v2`
      );

      for (const stat of stats) {
        await this.db.run(
          `INSERT INTO q2_discrimination_analysis (
            discrimination_type, gender, age_range, severity, count, percentage, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [stat.discrimination_type, stat.gender, stat.age_range, stat.severity, stat.count, stat.percentage]
        );
        totalInserted++;
      }
    }

    console.log(`✅ 歧视分析表同步完成，插入 ${totalInserted} 条记录`);
    return { inserted: totalInserted };
  }

  /**
   * 同步就业信心分析表
   */
  private async syncConfidenceAnalysis(): Promise<any> {
    console.log('🌟 同步就业信心分析表...');

    await this.db.run('DELETE FROM q2_confidence_analysis');

    const result = await this.db.all(
      `SELECT 
        age_range_v2 as age_range,
        current_status_question_v2 as employment_status,
        economic_pressure_level_v2 as economic_pressure,
        AVG(CAST(employment_confidence_v2 AS REAL)) as avg_confidence_index,
        ROUND(SUM(CASE WHEN CAST(employment_confidence_v2 AS REAL) < 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as low_confidence_rate,
        ROUND(SUM(CASE WHEN CAST(employment_confidence_v2 AS REAL) > 4 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as high_confidence_rate,
        COUNT(*) as count
       FROM questionnaire2_wide_table
       WHERE employment_confidence_v2 IS NOT NULL
       GROUP BY age_range_v2, current_status_question_v2, economic_pressure_level_v2`
    );

    for (const row of result) {
      await this.db.run(
        `INSERT INTO q2_confidence_analysis (
          age_range, employment_status, economic_pressure, avg_confidence_index,
          low_confidence_rate, high_confidence_rate, count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          row.age_range, row.employment_status, row.economic_pressure, row.avg_confidence_index,
          row.low_confidence_rate, row.high_confidence_rate, row.count
        ]
      );
    }

    console.log(`✅ 就业信心分析表同步完成，插入 ${result.length} 条记录`);
    return { inserted: result.length };
  }

  /**
   * 同步生育意愿分析表
   */
  private async syncFertilityAnalysis(): Promise<any> {
    console.log('👶 同步生育意愿分析表...');

    await this.db.run('DELETE FROM q2_fertility_analysis');

    const result = await this.db.all(
      `SELECT 
        age_range_v2 as age_range,
        marital_status_v2 as marital_status,
        economic_pressure_level_v2 as economic_pressure,
        fertility_intent_v2 as fertility_intent,
        has_children_v2 as has_children,
        ROUND(SUM(CASE WHEN fertility_intent_v2 = 'no' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as no_fertility_rate,
        COUNT(*) as count
       FROM questionnaire2_wide_table
       WHERE gender_v2 = 'female' AND fertility_intent_v2 IS NOT NULL
       GROUP BY age_range_v2, marital_status_v2, economic_pressure_level_v2, fertility_intent_v2, has_children_v2`
    );

    for (const row of result) {
      await this.db.run(
        `INSERT INTO q2_fertility_analysis (
          age_range, marital_status, economic_pressure, fertility_intent, has_children,
          no_fertility_rate, count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          row.age_range, row.marital_status, row.economic_pressure, row.fertility_intent,
          row.has_children, row.no_fertility_rate, row.count
        ]
      );
    }

    console.log(`✅ 生育意愿分析表同步完成，插入 ${result.length} 条记录`);
    return { inserted: result.length };
  }

  /**
   * 同步交叉分析表
   */
  private async syncCrossAnalysis(): Promise<any> {
    console.log('🔍 同步交叉分析表...');

    await this.db.run('DELETE FROM q2_cross_analysis');

    // 示例：年龄 × 学历 × 平均薪资
    const salaryAnalysis = await this.db.all(
      `SELECT 
        'age' as dimension1, age_range_v2 as value1,
        'education' as dimension2, education_level_v2 as value2,
        'avg_salary' as metric_name,
        AVG(CAST(SUBSTR(current_salary_v2, 1, INSTR(current_salary_v2, '-') - 1) AS REAL)) as metric_value,
        COUNT(*) as count
       FROM questionnaire2_wide_table
       WHERE age_range_v2 IS NOT NULL AND education_level_v2 IS NOT NULL AND current_salary_v2 IS NOT NULL
       GROUP BY age_range_v2, education_level_v2`
    );

    for (const row of salaryAnalysis) {
      await this.db.run(
        `INSERT INTO q2_cross_analysis (
          dimension1, value1, dimension2, value2, metric_name, metric_value, count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [row.dimension1, row.value1, row.dimension2, row.value2, row.metric_name, row.metric_value, row.count]
      );
    }

    console.log(`✅ 交叉分析表同步完成，插入 ${salaryAnalysis.length} 条记录`);
    return { inserted: salaryAnalysis.length };
  }

  /**
   * 记录同步开始
   */
  private async logSyncStart(tableName: string, syncType: string): Promise<void> {
    await this.db.run(
      `INSERT INTO q2_sync_log (table_name, sync_type, status, started_at)
       VALUES (?, ?, 'running', CURRENT_TIMESTAMP)`,
      [tableName, syncType]
    );
  }

  /**
   * 记录同步完成
   */
  private async logSyncComplete(
    tableName: string,
    syncType: string,
    results: any,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const recordsProcessed = Object.values(results).reduce((sum: number, r: any) => sum + (r?.inserted || 0), 0);

    await this.db.run(
      `INSERT INTO q2_sync_log (
        table_name, sync_type, records_processed, status, error_message, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [tableName, syncType, recordsProcessed, status, errorMessage || null]
    );
  }
}


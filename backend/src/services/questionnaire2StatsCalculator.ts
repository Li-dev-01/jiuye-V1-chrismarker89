/**
 * 问卷2统计数据计算服务
 * 专门用于计算和更新问卷2的各种统计表
 */

import type { DatabaseService } from '../db';

export class Questionnaire2StatsCalculator {
  constructor(private db: DatabaseService) {}

  /**
   * 计算并更新所有统计数据
   */
  async calculateAllStats(includeTestData: boolean = true): Promise<void> {
    console.log('🔄 开始计算问卷2统计数据...');
    
    try {
      await Promise.all([
        this.calculateEconomicPressureStats(includeTestData),
        this.calculateEmploymentConfidenceStats(includeTestData),
        this.calculateModernDebtStats(includeTestData),
        this.calculateDemographicsStats(includeTestData),
        this.calculateSummaryStats(includeTestData)
      ]);
      
      console.log('✅ 问卷2统计数据计算完成');
    } catch (error) {
      console.error('❌ 问卷2统计数据计算失败:', error);
      throw error;
    }
  }

  /**
   * 计算经济压力分析统计
   */
  private async calculateEconomicPressureStats(includeTestData: boolean): Promise<void> {
    const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';
    
    // 清理旧数据
    await this.db.prepare(`DELETE FROM questionnaire_v2_economic_pressure_stats WHERE is_test_data = ?`)
      .bind(includeTestData ? 1 : 0).run();

    // 计算负债情况分布
    const debtSituationQuery = `
      SELECT 
        'debt_situation' as metric_name,
        JSON_EXTRACT(economic_pressure_data, '$.debtTypes') as debt_types,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE economic_pressure_data IS NOT NULL ${testDataFilter}
      GROUP BY debt_types
    `;

    const debtResults = await this.db.prepare(debtSituationQuery).all();
    const totalResponses = debtResults.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    // 插入负债情况统计
    for (const row of debtResults.results || []) {
      const debtTypes = JSON.parse(row.debt_types || '[]');
      for (const debtType of debtTypes) {
        await this.db.prepare(`
          INSERT OR REPLACE INTO questionnaire_v2_economic_pressure_stats 
          (metric_name, metric_value, count, percentage, is_test_data)
          VALUES (?, ?, ?, ?, ?)
        `).bind('debt_situation', debtType, row.count, (row.count / totalResponses) * 100, includeTestData ? 1 : 0).run();
      }
    }

    // 计算经济压力水平分布
    const pressureLevelQuery = `
      SELECT 
        'pressure_level' as metric_name,
        JSON_EXTRACT(economic_pressure_data, '$.stressLevel') as stress_level,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE economic_pressure_data IS NOT NULL ${testDataFilter}
      GROUP BY stress_level
    `;

    const pressureResults = await this.db.prepare(pressureLevelQuery).all();
    for (const row of pressureResults.results || []) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO questionnaire_v2_economic_pressure_stats 
        (metric_name, metric_value, count, percentage, is_test_data)
        VALUES (?, ?, ?, ?, ?)
      `).bind('pressure_level', row.stress_level, row.count, (row.count / totalResponses) * 100, includeTestData ? 1 : 0).run();
    }
  }

  /**
   * 计算就业信心指数统计
   */
  private async calculateEmploymentConfidenceStats(includeTestData: boolean): Promise<void> {
    const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';
    
    // 清理旧数据
    await this.db.prepare(`DELETE FROM questionnaire_v2_employment_confidence_stats WHERE is_test_data = ?`)
      .bind(includeTestData ? 1 : 0).run();

    // 计算6个月信心指数
    const confidence6MonthsQuery = `
      SELECT 
        '6months' as time_period,
        JSON_EXTRACT(employment_confidence_data, '$.jobSearchConfidence') as confidence_level,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE employment_confidence_data IS NOT NULL ${testDataFilter}
      GROUP BY confidence_level
    `;

    const confidence6Results = await this.db.prepare(confidence6MonthsQuery).all();
    const total6Months = confidence6Results.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    for (const row of confidence6Results.results || []) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO questionnaire_v2_employment_confidence_stats 
        (time_period, confidence_level, count, percentage, is_test_data)
        VALUES (?, ?, ?, ?, ?)
      `).bind('6months', row.confidence_level, row.count, (row.count / total6Months) * 100, includeTestData ? 1 : 0).run();
    }

    // 计算1年信心指数（使用市场前景作为代理指标）
    const confidence1YearQuery = `
      SELECT 
        '1year' as time_period,
        JSON_EXTRACT(employment_confidence_data, '$.marketOutlook') as confidence_level,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE employment_confidence_data IS NOT NULL ${testDataFilter}
      GROUP BY confidence_level
    `;

    const confidence1Results = await this.db.prepare(confidence1YearQuery).all();
    const total1Year = confidence1Results.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    for (const row of confidence1Results.results || []) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO questionnaire_v2_employment_confidence_stats 
        (time_period, confidence_level, count, percentage, is_test_data)
        VALUES (?, ?, ?, ?, ?)
      `).bind('1year', row.confidence_level, row.count, (row.count / total1Year) * 100, includeTestData ? 1 : 0).run();
    }
  }

  /**
   * 计算现代负债分析统计
   */
  private async calculateModernDebtStats(includeTestData: boolean): Promise<void> {
    const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';
    
    // 清理旧数据
    await this.db.prepare(`DELETE FROM questionnaire_v2_modern_debt_stats WHERE is_test_data = ?`)
      .bind(includeTestData ? 1 : 0).run();

    const debtTypesQuery = `
      SELECT 
        JSON_EXTRACT(modern_debt_data, '$.debtTypes') as debt_types,
        JSON_EXTRACT(modern_debt_data, '$.debtAmount') as debt_amount,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE modern_debt_data IS NOT NULL ${testDataFilter}
      GROUP BY debt_types
    `;

    const debtResults = await this.db.prepare(debtTypesQuery).all();
    const totalResponses = debtResults.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    for (const row of debtResults.results || []) {
      const debtTypes = JSON.parse(row.debt_types || '[]');
      for (const debtType of debtTypes) {
        await this.db.prepare(`
          INSERT OR REPLACE INTO questionnaire_v2_modern_debt_stats 
          (debt_type, count, percentage, avg_amount, is_test_data)
          VALUES (?, ?, ?, ?, ?)
        `).bind(debtType, row.count, (row.count / totalResponses) * 100, row.debt_amount || 0, includeTestData ? 1 : 0).run();
      }
    }
  }

  /**
   * 计算基础信息统计
   */
  private async calculateDemographicsStats(includeTestData: boolean): Promise<void> {
    const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';
    
    // 清理旧数据
    await this.db.prepare(`DELETE FROM questionnaire_v2_demographics_stats WHERE is_test_data = ?`)
      .bind(includeTestData ? 1 : 0).run();

    // 年龄分布
    const ageQuery = `
      SELECT 
        'age_range' as dimension,
        JSON_EXTRACT(basic_info, '$.ageRange') as value,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE basic_info IS NOT NULL ${testDataFilter}
      GROUP BY value
    `;

    const ageResults = await this.db.prepare(ageQuery).all();
    const totalAge = ageResults.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    for (const row of ageResults.results || []) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO questionnaire_v2_demographics_stats 
        (dimension, value, count, percentage, is_test_data)
        VALUES (?, ?, ?, ?, ?)
      `).bind('age_range', row.value, row.count, (row.count / totalAge) * 100, includeTestData ? 1 : 0).run();
    }

    // 教育水平分布
    const educationQuery = `
      SELECT 
        'education_level' as dimension,
        JSON_EXTRACT(basic_info, '$.educationLevel') as value,
        COUNT(*) as count
      FROM questionnaire_v2_responses 
      WHERE basic_info IS NOT NULL ${testDataFilter}
      GROUP BY value
    `;

    const educationResults = await this.db.prepare(educationQuery).all();
    const totalEducation = educationResults.results?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;

    for (const row of educationResults.results || []) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO questionnaire_v2_demographics_stats 
        (dimension, value, count, percentage, is_test_data)
        VALUES (?, ?, ?, ?, ?)
      `).bind('education_level', row.value, row.count, (row.count / totalEducation) * 100, includeTestData ? 1 : 0).run();
    }
  }

  /**
   * 计算综合分析汇总统计
   */
  private async calculateSummaryStats(includeTestData: boolean): Promise<void> {
    const testDataFilter = includeTestData ? '' : 'AND is_test_data = 0';
    
    // 清理旧数据
    await this.db.prepare(`DELETE FROM questionnaire_v2_summary_stats WHERE is_test_data = ?`)
      .bind(includeTestData ? 1 : 0).run();

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_responses,
        AVG(CASE 
          WHEN JSON_EXTRACT(economic_pressure_data, '$.stressLevel') = 'low' THEN 1
          WHEN JSON_EXTRACT(economic_pressure_data, '$.stressLevel') = 'medium' THEN 3
          WHEN JSON_EXTRACT(economic_pressure_data, '$.stressLevel') = 'high' THEN 5
          ELSE 3
        END) as avg_economic_pressure,
        AVG(JSON_EXTRACT(employment_confidence_data, '$.skillPreparation')) as avg_employment_confidence,
        AVG(JSON_EXTRACT(modern_debt_data, '$.debtAmount')) as avg_debt_burden
      FROM questionnaire_v2_responses 
      WHERE status = 'completed' ${testDataFilter}
    `;

    const summaryResult = await this.db.prepare(summaryQuery).first();
    
    if (summaryResult) {
      await this.db.prepare(`
        INSERT INTO questionnaire_v2_summary_stats 
        (total_responses, completion_rate, avg_economic_pressure, avg_employment_confidence, avg_debt_burden, is_test_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        summaryResult.total_responses,
        0.85, // 假设完成率
        summaryResult.avg_economic_pressure || 3.0,
        (summaryResult.avg_employment_confidence || 70) / 20, // 转换为1-5分制
        summaryResult.avg_debt_burden || 0,
        includeTestData ? 1 : 0
      ).run();
    }
  }
}

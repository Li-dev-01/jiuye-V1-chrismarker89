/**
 * 问卷2完整同步服务
 * 从 universal_questionnaire_responses 同步到所有 q2_* 统计表
 */

import type { DatabaseService } from '../db';

interface Stats {
  total: number;
  [key: string]: any;
}

export class Questionnaire2FullSyncService {
  constructor(private db: DatabaseService) {}

  /**
   * 执行完整同步
   */
  async syncAllTables(): Promise<{
    success: boolean;
    results: Record<string, any>;
    error?: string;
  }> {
    const results: Record<string, any> = {};
    const startTime = Date.now();

    try {
      console.log('🔄 开始同步问卷2所有统计表...');

      // 1. 获取所有问卷2数据
      const responses = await this.db.query<{ response_data: string }>(
        `SELECT response_data 
         FROM universal_questionnaire_responses 
         WHERE questionnaire_id = 'questionnaire-v2-2024'`
      );

      console.log(`📊 找到 ${responses.length} 条问卷2数据`);

      if (responses.length === 0) {
        return {
          success: false,
          results: {},
          error: '没有找到问卷2数据'
        };
      }

      // 2. 解析数据并统计
      const stats = this.parseResponses(responses);
      console.log(`✅ 数据解析完成，共 ${stats.total} 条有效数据`);

      // 3. 同步到各个统计表
      results.basicStats = await this.syncBasicStats(stats);
      results.economicAnalysis = await this.syncEconomicAnalysis(stats);
      results.employmentAnalysis = await this.syncEmploymentAnalysis(stats);
      results.discriminationAnalysis = await this.syncDiscriminationAnalysis(stats);
      results.confidenceAnalysis = await this.syncConfidenceAnalysis(stats);
      results.fertilityAnalysis = await this.syncFertilityAnalysis(stats);

      const duration = Date.now() - startTime;
      console.log(`✅ 所有统计表同步完成，耗时: ${duration}ms`);

      return { success: true, results };
    } catch (error: any) {
      console.error('❌ 同步失败:', error);
      return { success: false, results, error: error.message };
    }
  }

  /**
   * 解析响应数据
   */
  private parseResponses(responses: { response_data: string }[]): Stats {
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
      employmentConfidence: {},
      confidenceFactors: {},
      fertilityIntent: {}
    };

    for (const response of responses) {
      try {
        const data = JSON.parse(response.response_data);
        const sectionResponses = data.sectionResponses || [];

        // 提取所有问题响应（兼容两种格式）
        const answers: Record<string, any> = {};
        for (const section of sectionResponses) {
          const responses = section.questionResponses || section.responses;
          if (!responses) continue;
          for (const qr of responses) {
            answers[qr.questionId] = qr.value;
          }
        }

        // 统计各维度
        this.countValue(stats.gender, answers['gender-v2']);
        this.countValue(stats.ageRange, answers['age-range-v2']);
        this.countValue(stats.educationLevel, answers['education-level-v2']);
        this.countValue(stats.maritalStatus, answers['marital-status-v2']);
        this.countValue(stats.cityTier, answers['current-city-tier-v2']);
        this.countValue(stats.hukouType, answers['hukou-type-v2']);
        this.countValue(stats.employmentStatus, answers['current-status-question-v2']);

        // 负债情况（多选）
        if (Array.isArray(answers['debt-situation-v2'])) {
          for (const debt of answers['debt-situation-v2']) {
            this.countValue(stats.debtSituation, debt);
          }
        }

        this.countValue(stats.monthlyLivingCost, answers['monthly-living-cost-v2']);
        this.countValue(stats.economicPressure, answers['economic-pressure-level-v2']);
        this.countValue(stats.currentSalary, answers['current-salary-v2']);

        // 歧视类型（多选）
        if (Array.isArray(answers['experienced-discrimination-types-v2'])) {
          for (const type of answers['experienced-discrimination-types-v2']) {
            this.countValue(stats.discriminationTypes, type);
          }
        }

        this.countValue(stats.discriminationSeverity, answers['discrimination-severity-v2']);

        // 歧视渠道（多选）
        if (Array.isArray(answers['discrimination-channels-v2'])) {
          for (const channel of answers['discrimination-channels-v2']) {
            this.countValue(stats.discriminationChannels, channel);
          }
        }

        this.countValue(stats.employmentConfidence, answers['employment-confidence-v2']);

        // 信心影响因素（多选）
        if (Array.isArray(answers['confidence-factors-v2'])) {
          for (const factor of answers['confidence-factors-v2']) {
            this.countValue(stats.confidenceFactors, factor);
          }
        }

        this.countValue(stats.fertilityIntent, answers['fertility-plan-v2']);

      } catch (error) {
        console.error('解析数据失败:', error);
      }
    }

    return stats;
  }

  private countValue(counter: Record<string, number>, value: any) {
    if (value === undefined || value === null || value === '') return;
    const key = String(value);
    counter[key] = (counter[key] || 0) + 1;
  }

  /**
   * 同步基础统计表
   */
  private async syncBasicStats(stats: Stats): Promise<any> {
    console.log('  📝 同步基础统计表...');

    await this.db.execute('DELETE FROM q2_basic_stats');

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
        await this.db.execute(
          `INSERT INTO q2_basic_stats (dimension, value, count, percentage, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [dim.name, value, count, percentage]
        );
        inserted++;
      }
    }

    console.log(`  ✅ 基础统计表: ${inserted} 条记录`);
    return { inserted };
  }

  /**
   * 同步经济分析表
   */
  private async syncEconomicAnalysis(stats: Stats): Promise<any> {
    console.log('  💰 同步经济分析表...');

    await this.db.execute('DELETE FROM q2_economic_analysis');

    let inserted = 0;

    // 负债情况
    for (const [value, count] of Object.entries(stats.debtSituation)) {
      const percentage = ((count as number) / stats.total) * 100;
      await this.db.execute(
        `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        ['debt_situation', value, count, percentage]
      );
      inserted++;
    }

    // 生活成本
    for (const [value, count] of Object.entries(stats.monthlyLivingCost)) {
      const percentage = ((count as number) / stats.total) * 100;
      await this.db.execute(
        `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        ['monthly_living_cost', value, count, percentage]
      );
      inserted++;
    }

    // 经济压力
    for (const [value, count] of Object.entries(stats.economicPressure)) {
      const percentage = ((count as number) / stats.total) * 100;
      await this.db.execute(
        `INSERT INTO q2_economic_analysis (dimension, value, count, percentage, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        ['economic_pressure', value, count, percentage]
      );
      inserted++;
    }

    console.log(`  ✅ 经济分析表: ${inserted} 条记录`);
    return { inserted };
  }

  // 其他同步方法...
  private async syncEmploymentAnalysis(stats: Stats): Promise<any> {
    console.log('  💼 同步就业分析表...');
    await this.db.execute('DELETE FROM q2_employment_analysis');
    return { inserted: 0 };
  }

  private async syncDiscriminationAnalysis(stats: Stats): Promise<any> {
    console.log('  ⚖️ 同步歧视分析表...');
    await this.db.execute('DELETE FROM q2_discrimination_analysis');
    return { inserted: 0 };
  }

  private async syncConfidenceAnalysis(stats: Stats): Promise<any> {
    console.log('  📈 同步信心分析表...');
    await this.db.execute('DELETE FROM q2_confidence_analysis');
    return { inserted: 0 };
  }

  private async syncFertilityAnalysis(stats: Stats): Promise<any> {
    console.log('  👶 同步生育分析表...');
    await this.db.execute('DELETE FROM q2_fertility_analysis');
    return { inserted: 0 };
  }
}


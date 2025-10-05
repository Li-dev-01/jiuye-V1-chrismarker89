/**
 * 问卷2定时同步处理器
 * 负责定期同步原始数据到静态表
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface Questionnaire2SyncEnv {
  DB: D1Database;
}

export interface CronEvent {
  cron: string;
  scheduledTime: number;
}

/**
 * 问卷2数据同步服务
 */
export class Questionnaire2SyncHandler {
  constructor(private db: D1Database) {}

  /**
   * 执行完整同步
   */
  async executeFullSync(): Promise<{
    success: boolean;
    syncedTables: string[];
    totalRecords: number;
    errors: string[];
  }> {
    console.log('🔄 开始问卷2数据同步...');

    const syncedTables: string[] = [];
    const errors: string[] = [];
    let totalRecords = 0;

    try {
      // 1. 获取所有问卷2数据
      const responses = await this.db
        .prepare(
          `SELECT response_data, submitted_at 
           FROM universal_questionnaire_responses 
           WHERE questionnaire_id = 'questionnaire-v2-2024'`
        )
        .all();

      if (!responses.results || responses.results.length === 0) {
        console.log('⚠️ 没有找到问卷2数据');
        return {
          success: false,
          syncedTables: [],
          totalRecords: 0,
          errors: ['没有找到问卷2数据']
        };
      }

      totalRecords = responses.results.length;
      console.log(`📊 找到 ${totalRecords} 条问卷2数据`);

      // 2. 解析数据并生成统计
      const stats = this.parseResponses(responses.results);

      // 3. 同步到基础统计表
      await this.syncBasicStats(stats);
      syncedTables.push('q2_basic_stats');

      // 4. 同步到经济分析表
      await this.syncEconomicAnalysis(stats);
      syncedTables.push('q2_economic_analysis');

      // 5. 同步到就业分析表
      await this.syncEmploymentAnalysis(stats);
      syncedTables.push('q2_employment_analysis');

      // 6. 同步到歧视分析表
      await this.syncDiscriminationAnalysis(stats);
      syncedTables.push('q2_discrimination_analysis');

      // 7. 同步到信心分析表
      await this.syncConfidenceAnalysis(stats);
      syncedTables.push('q2_confidence_analysis');

      // 8. 同步到生育分析表
      await this.syncFertilityAnalysis(stats);
      syncedTables.push('q2_fertility_analysis');

      // 9. 记录同步日志
      await this.logSync(syncedTables.length, totalRecords);

      console.log(`✅ 同步完成: ${syncedTables.length} 个表, ${totalRecords} 条记录`);

      return {
        success: true,
        syncedTables,
        totalRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ 同步失败:', error);
      errors.push(error.message || '未知错误');

      return {
        success: false,
        syncedTables,
        totalRecords,
        errors
      };
    }
  }

  /**
   * 解析响应数据
   */
  private parseResponses(responses: any[]): any {
    const stats: any = {
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
      incomeSources: {},
      economicPressure: {},
      currentSalary: {},
      discriminationTypes: {},
      discriminationSeverity: {},
      employmentConfidence: {},
      fertilityIntent: {}
    };

    for (const response of responses) {
      try {
        const data = JSON.parse(response.response_data);
        const sectionResponses = data.sectionResponses || [];

        // 遍历所有section
        for (const section of sectionResponses) {
          for (const questionResponse of section.responses || []) {
            const questionId = questionResponse.questionId;
            const value = questionResponse.value;

            // 统计各个问题的答案
            if (questionId === 'gender-v2') {
              stats.gender[value] = (stats.gender[value] || 0) + 1;
            } else if (questionId === 'age-range-v2') {
              stats.ageRange[value] = (stats.ageRange[value] || 0) + 1;
            } else if (questionId === 'education-level-v2') {
              stats.educationLevel[value] = (stats.educationLevel[value] || 0) + 1;
            } else if (questionId === 'marital-status-v2') {
              stats.maritalStatus[value] = (stats.maritalStatus[value] || 0) + 1;
            } else if (questionId === 'current-city-tier-v2') {
              stats.cityTier[value] = (stats.cityTier[value] || 0) + 1;
            } else if (questionId === 'hukou-type-v2') {
              stats.hukouType[value] = (stats.hukouType[value] || 0) + 1;
            } else if (questionId === 'current-status-question-v2') {
              stats.employmentStatus[value] = (stats.employmentStatus[value] || 0) + 1;
            } else if (questionId === 'debt-situation-v2') {
              stats.debtSituation[value] = (stats.debtSituation[value] || 0) + 1;
            } else if (questionId === 'monthly-living-cost-v2') {
              stats.monthlyLivingCost[value] = (stats.monthlyLivingCost[value] || 0) + 1;
            } else if (questionId === 'income-sources-v2' && Array.isArray(value)) {
              for (const item of value) {
                stats.incomeSources[item] = (stats.incomeSources[item] || 0) + 1;
              }
            } else if (questionId === 'economic-pressure-level-v2') {
              stats.economicPressure[value] = (stats.economicPressure[value] || 0) + 1;
            } else if (questionId === 'current-salary-v2') {
              stats.currentSalary[value] = (stats.currentSalary[value] || 0) + 1;
            } else if (questionId === 'experienced-discrimination-types-v2' && Array.isArray(value)) {
              for (const item of value) {
                stats.discriminationTypes[item] = (stats.discriminationTypes[item] || 0) + 1;
              }
            } else if (questionId === 'discrimination-severity-v2') {
              stats.discriminationSeverity[value] = (stats.discriminationSeverity[value] || 0) + 1;
            } else if (questionId === 'employment-confidence-v2') {
              stats.employmentConfidence[value] = (stats.employmentConfidence[value] || 0) + 1;
            } else if (questionId === 'fertility-intent-v2') {
              stats.fertilityIntent[value] = (stats.fertilityIntent[value] || 0) + 1;
            }
          }
        }
      } catch (error) {
        console.error('解析响应数据失败:', error);
      }
    }

    return stats;
  }

  /**
   * 同步基础统计表
   */
  private async syncBasicStats(stats: any): Promise<void> {
    // 清空表
    await this.db.prepare('DELETE FROM q2_basic_stats').run();

    // 插入统计数据
    const insertStmt = this.db.prepare(`
      INSERT INTO q2_basic_stats (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 性别统计
    for (const [value, count] of Object.entries(stats.gender)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('gender', value, count, percentage));
    }

    // 年龄统计
    for (const [value, count] of Object.entries(stats.ageRange)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('age_range', value, count, percentage));
    }

    // 学历统计
    for (const [value, count] of Object.entries(stats.educationLevel)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('education_level', value, count, percentage));
    }

    // 婚姻状况统计
    for (const [value, count] of Object.entries(stats.maritalStatus)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('marital_status', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 基础统计表同步完成');
  }

  /**
   * 同步经济分析表
   */
  private async syncEconomicAnalysis(stats: any): Promise<void> {
    await this.db.prepare('DELETE FROM q2_economic_analysis').run();

    const insertStmt = this.db.prepare(`
      INSERT INTO q2_economic_analysis (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 负债情况
    for (const [value, count] of Object.entries(stats.debtSituation)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('debt_situation', value, count, percentage));
    }

    // 生活开支
    for (const [value, count] of Object.entries(stats.monthlyLivingCost)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('monthly_living_cost', value, count, percentage));
    }

    // 经济压力
    for (const [value, count] of Object.entries(stats.economicPressure)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('economic_pressure', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 经济分析表同步完成');
  }

  /**
   * 同步就业分析表
   */
  private async syncEmploymentAnalysis(stats: any): Promise<void> {
    await this.db.prepare('DELETE FROM q2_employment_analysis').run();

    const insertStmt = this.db.prepare(`
      INSERT INTO q2_employment_analysis (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 就业状态
    for (const [value, count] of Object.entries(stats.employmentStatus)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('employment_status', value, count, percentage));
    }

    // 月薪
    for (const [value, count] of Object.entries(stats.currentSalary)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('current_salary', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 就业分析表同步完成');
  }

  /**
   * 同步歧视分析表
   */
  private async syncDiscriminationAnalysis(stats: any): Promise<void> {
    await this.db.prepare('DELETE FROM q2_discrimination_analysis').run();

    const insertStmt = this.db.prepare(`
      INSERT INTO q2_discrimination_analysis (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 歧视类型
    for (const [value, count] of Object.entries(stats.discriminationTypes)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('discrimination_types', value, count, percentage));
    }

    // 歧视严重程度
    for (const [value, count] of Object.entries(stats.discriminationSeverity)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('discrimination_severity', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 歧视分析表同步完成');
  }

  /**
   * 同步信心分析表
   */
  private async syncConfidenceAnalysis(stats: any): Promise<void> {
    await this.db.prepare('DELETE FROM q2_confidence_analysis').run();

    const insertStmt = this.db.prepare(`
      INSERT INTO q2_confidence_analysis (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 就业信心
    for (const [value, count] of Object.entries(stats.employmentConfidence)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('employment_confidence', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 信心分析表同步完成');
  }

  /**
   * 同步生育分析表
   */
  private async syncFertilityAnalysis(stats: any): Promise<void> {
    await this.db.prepare('DELETE FROM q2_fertility_analysis').run();

    const insertStmt = this.db.prepare(`
      INSERT INTO q2_fertility_analysis (
        dimension, value, count, percentage
      ) VALUES (?, ?, ?, ?)
    `);

    const batch: any[] = [];

    // 生育意愿
    for (const [value, count] of Object.entries(stats.fertilityIntent)) {
      const percentage = ((count as number) / stats.total) * 100;
      batch.push(insertStmt.bind('fertility_intent', value, count, percentage));
    }

    await this.db.batch(batch);
    console.log('✅ 生育分析表同步完成');
  }

  /**
   * 记录同步日志
   */
  private async logSync(tablesCount: number, recordsCount: number): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO q2_sync_log (
          sync_type, tables_synced, records_processed, status, sync_time
        ) VALUES (?, ?, ?, ?, datetime('now'))`
      )
      .bind('scheduled', tablesCount, recordsCount, 'success')
      .run();
  }
}

/**
 * 定时任务处理函数
 */
export async function handleScheduledSync(
  event: CronEvent,
  env: Questionnaire2SyncEnv
): Promise<void> {
  console.log('🕐 定时任务触发:', event.cron, new Date(event.scheduledTime));

  const handler = new Questionnaire2SyncHandler(env.DB);
  const result = await handler.executeFullSync();

  if (result.success) {
    console.log(`✅ 同步成功: ${result.syncedTables.join(', ')}`);
  } else {
    console.error(`❌ 同步失败: ${result.errors.join(', ')}`);
  }
}


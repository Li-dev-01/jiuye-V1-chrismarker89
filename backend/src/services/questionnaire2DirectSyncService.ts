/**
 * 问卷2直接同步服务
 * 直接从 universal_questionnaire_responses 同步到静态表
 * 不依赖宽表，简化数据流程
 */

import type { DatabaseService } from '../db';

export class Questionnaire2DirectSyncService {
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
      console.log('🔄 开始同步问卷2静态表（直接模式）...');

      // 同步基础统计
      results.basicStats = await this.syncBasicStats();
      
      const duration = Date.now() - startTime;
      console.log(`✅ 静态表同步完成，耗时: ${duration}ms`);

      return { success: true, results };
    } catch (error: any) {
      console.error('❌ 静态表同步失败:', error);
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

    // 获取所有问卷2数据
    const responses = await this.db.all(
      `SELECT response_data 
       FROM universal_questionnaire_responses 
       WHERE questionnaire_id = 'questionnaire-v2-2024'`
    );

    console.log(`📝 找到 ${responses.length} 条问卷2数据`);

    // 统计各维度
    const stats: Record<string, Record<string, number>> = {};

    for (const row of responses) {
      try {
        const data = JSON.parse(row.response_data);
        const sectionResponses = data.sectionResponses || [];

        // 提取基础信息
        const basicSection = sectionResponses.find((s: any) => s.sectionId === 'basic-demographics-v2');
        if (basicSection) {
          for (const response of basicSection.responses) {
            const dimension = response.questionId.replace('-v2', '');
            const value = response.value;

            if (!stats[dimension]) {
              stats[dimension] = {};
            }
            if (!stats[dimension][value]) {
              stats[dimension][value] = 0;
            }
            stats[dimension][value]++;
          }
        }

        // 提取当前状态
        const statusSection = sectionResponses.find((s: any) => s.sectionId === 'current-status-v2');
        if (statusSection) {
          for (const response of statusSection.responses) {
            const dimension = 'employment_status';
            const value = response.value;

            if (!stats[dimension]) {
              stats[dimension] = {};
            }
            if (!stats[dimension][value]) {
              stats[dimension][value] = 0;
            }
            stats[dimension][value]++;
          }
        }
      } catch (error) {
        console.error('解析数据失败:', error);
      }
    }

    // 插入统计数据
    let totalInserted = 0;
    const total = responses.length;

    for (const [dimension, values] of Object.entries(stats)) {
      for (const [value, count] of Object.entries(values)) {
        const percentage = ((count / total) * 100).toFixed(2);
        
        await this.db.run(
          `INSERT INTO q2_basic_stats (dimension, value, count, percentage, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [dimension, value, count, parseFloat(percentage)]
        );
        totalInserted++;
      }
    }

    console.log(`✅ 基础维度统计表同步完成，插入 ${totalInserted} 条记录`);
    return { inserted: totalInserted, dimensions: Object.keys(stats).length };
  }
}


/**
 * 问卷统计服务 - 准实时统计方案
 * 使用定时任务更新统计缓存表，降低实时查询压力
 */

// import type { DatabaseService } from '../types/database';

export interface QuestionStats {
  questionId: string;
  totalResponses: number;
  options: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

export interface QuestionnaireStatsCache {
  questionnaireId: string;
  questionId: string;
  optionValue: string;
  count: number;
  percentage: number;
  totalResponses: number;
  lastUpdated: string;
}

export class QuestionnaireStatsService {
  constructor(private db: any) {}

  /**
   * 定时更新统计缓存（每分钟执行）
   */
  async updateStatsCache(questionnaireId: string = 'employment-survey-2024'): Promise<void> {
    console.log(`🔄 开始更新问卷统计缓存: ${questionnaireId}`);
    
    try {
      // 1. 获取所有响应数据（改为排除最近10秒的数据，减少延迟）
      const responses = await this.db.query(`
        SELECT responses, submitted_at
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        AND submitted_at <= datetime('now', '-10 seconds')
        ORDER BY submitted_at DESC
      `, [questionnaireId]);

      if (!responses || responses.length === 0) {
        console.log('📊 暂无数据需要统计');
        return;
      }

      // 2. 解析并统计数据
      const questionStats = await this.calculateStats(responses);

      // 3. 清空旧的缓存数据
      await this.db.execute(`
        DELETE FROM questionnaire_stats_cache 
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      // 4. 批量插入新的统计数据
      await this.batchInsertStats(questionnaireId, questionStats);

      console.log(`✅ 统计缓存更新完成，共处理 ${responses.length} 条响应`);

    } catch (error) {
      console.error('❌ 更新统计缓存失败:', error);
      throw error;
    }
  }

  /**
   * 计算统计数据
   */
  private async calculateStats(responses: any[]): Promise<Record<string, QuestionStats>> {
    const questionStats: Record<string, any> = {};
    let totalResponses = 0;

    for (const response of responses) {
      try {
        const responseData = JSON.parse(response.responses as string);
        totalResponses++;

        // 处理新格式数据
        if (responseData.sectionResponses) {
          for (const section of responseData.sectionResponses) {
            for (const question of section.questionResponses) {
              this.processQuestionResponse(questionStats, question.questionId, question.value);
            }
          }
        } else {
          // 处理旧格式数据（通过字段映射）
          const { fieldMappingManager } = await import('../utils/fieldMappingManager');
          const mappedData = fieldMappingManager.applyMapping(responseData);
          
          for (const [questionId, value] of Object.entries(mappedData)) {
            this.processQuestionResponse(questionStats, questionId, value);
          }
        }
      } catch (parseError) {
        console.error('解析响应数据失败:', parseError);
        continue;
      }
    }

    // 计算百分比
    for (const questionId in questionStats) {
      const stat = questionStats[questionId];
      stat.options = [];
      
      for (const [value, count] of Object.entries(stat.values)) {
        stat.options.push({
          value,
          count: count as number,
          percentage: Math.round(((count as number) / stat.totalResponses) * 100 * 100) / 100
        });
      }

      // 按数量排序
      stat.options.sort((a: any, b: any) => b.count - a.count);
      stat.lastUpdated = new Date().toISOString();
    }

    return questionStats;
  }

  /**
   * 处理单个问题响应
   */
  private processQuestionResponse(questionStats: any, questionId: string, value: any): void {
    if (!questionStats[questionId]) {
      questionStats[questionId] = {
        questionId,
        totalResponses: 0,
        values: {},
      };
    }

    questionStats[questionId].totalResponses++;

    if (value !== null && value !== undefined && value !== '') {
      const valueKey = Array.isArray(value) ? value.join(',') : String(value);
      
      if (!questionStats[questionId].values[valueKey]) {
        questionStats[questionId].values[valueKey] = 0;
      }
      questionStats[questionId].values[valueKey]++;
    }
  }

  /**
   * 批量插入统计数据到缓存表
   */
  private async batchInsertStats(questionnaireId: string, questionStats: Record<string, QuestionStats>): Promise<void> {
    const insertPromises = [];

    for (const [questionId, stats] of Object.entries(questionStats)) {
      for (const option of stats.options) {
        insertPromises.push(
          this.db.execute(`
            INSERT INTO questionnaire_stats_cache 
            (questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            questionnaireId,
            questionId,
            option.value,
            option.count,
            option.percentage,
            stats.totalResponses,
            stats.lastUpdated
          ])
        );
      }
    }

    await Promise.all(insertPromises);
  }

  /**
   * 从缓存获取统计数据（前端调用）
   */
  async getCachedStats(questionnaireId: string = 'employment-survey-2024'): Promise<Record<string, QuestionStats>> {
    try {
      const cacheData = await this.db.query(`
        SELECT question_id, option_value, count, percentage, total_responses, last_updated
        FROM questionnaire_stats_cache
        WHERE questionnaire_id = ?
        ORDER BY question_id, count DESC
      `, [questionnaireId]);

      const result: Record<string, QuestionStats> = {};

      for (const row of cacheData) {
        const questionId = row.question_id;
        
        if (!result[questionId]) {
          result[questionId] = {
            questionId,
            totalResponses: row.total_responses,
            options: [],
            lastUpdated: row.last_updated
          };
        }

        result[questionId].options.push({
          value: row.option_value,
          count: row.count,
          percentage: row.percentage
        });
      }

      return result;
    } catch (error) {
      console.error('获取缓存统计数据失败:', error);
      return {};
    }
  }

  /**
   * 获取统计数据更新时间
   */
  async getLastUpdateTime(questionnaireId: string = 'employment-survey-2024'): Promise<string | null> {
    try {
      const result = await this.db.queryFirst(`
        SELECT MAX(last_updated) as last_updated
        FROM questionnaire_stats_cache
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      return result?.last_updated || null;
    } catch (error) {
      console.error('获取更新时间失败:', error);
      return null;
    }
  }
}

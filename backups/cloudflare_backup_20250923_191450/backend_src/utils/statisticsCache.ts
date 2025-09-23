/**
 * 统计缓存管理器
 * 提供高效的统计数据缓存和更新机制
 */

import { createDatabaseService } from '../db';
import { getQuestionnaireDefinition, convertResponseForStatistics } from '../config/questionnaireDefinitions';

export interface StatisticsCacheEntry {
  questionnaireId: string;
  questionId: string;
  optionValue: string;
  count: number;
  percentage: number;
  lastUpdated: string;
}

export interface StatisticsUpdateResult {
  success: boolean;
  updatedQuestions: string[];
  totalResponses: number;
  processingTime: number;
  errors: string[];
}

export class StatisticsCache {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 更新指定问卷的统计缓存
   */
  async updateQuestionnaireStatistics(questionnaireId: string): Promise<StatisticsUpdateResult> {
    const startTime = Date.now();
    const result: StatisticsUpdateResult = {
      success: false,
      updatedQuestions: [],
      totalResponses: 0,
      processingTime: 0,
      errors: []
    };

    try {
      // 获取问卷定义
      const questionnaire = getQuestionnaireDefinition(questionnaireId);
      if (!questionnaire) {
        result.errors.push(`问卷定义不存在: ${questionnaireId}`);
        return result;
      }

      // 获取所有响应数据 - 修正：只统计完成并提交的问卷
      const responses = await this.db.query(`
        SELECT responses, submitted_at, is_completed
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        AND is_valid = 1
        AND is_completed = 1
        AND submitted_at IS NOT NULL
        ORDER BY submitted_at DESC
      `, [questionnaireId]);

      if (!responses || responses.length === 0) {
        result.success = true;
        result.totalResponses = 0;
        return result;
      }

      result.totalResponses = responses.length;

      // 解析响应数据并统计 - 修正版：每题独立统计
      const questionStats: Record<string, {
        totalAnswered: number;
        optionCounts: Record<string, number>;
      }> = {};

      for (const response of responses) {
        try {
          const responseData = JSON.parse(response.responses as string);
          const flatData = convertResponseForStatistics(questionnaireId, responseData);

          // 统计每个问题的选项 - 关键修正：每题独立计数
          for (const [questionId, value] of Object.entries(flatData)) {
            if (value === null || value === undefined || value === '') continue;

            if (!questionStats[questionId]) {
              questionStats[questionId] = {
                totalAnswered: 0,
                optionCounts: {}
              };
            }

            // 每个回答该题的用户计入总数（关键修正）
            questionStats[questionId].totalAnswered++;

            // 处理多选题（数组值）
            if (Array.isArray(value)) {
              for (const item of value) {
                const itemStr = String(item);
                questionStats[questionId].optionCounts[itemStr] =
                  (questionStats[questionId].optionCounts[itemStr] || 0) + 1;
              }
            } else {
              // 处理单选题
              const stringValue = String(value);
              questionStats[questionId].optionCounts[stringValue] =
                (questionStats[questionId].optionCounts[stringValue] || 0) + 1;
            }
          }
        } catch (parseError) {
          console.error('解析响应数据失败:', parseError);
          result.errors.push(`解析响应数据失败: ${parseError}`);
        }
      }

      // 清理旧的缓存数据
      await this.db.execute(`
        DELETE FROM questionnaire_statistics_cache 
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      // 插入新的统计数据 - 修正版：使用实际回答人数
      for (const [questionId, questionData] of Object.entries(questionStats)) {
        const { totalAnswered, optionCounts } = questionData;

        for (const [optionValue, count] of Object.entries(optionCounts)) {
          // 关键修正：使用实际回答该题的人数计算百分比
          const percentage = Math.round((count / totalAnswered) * 100 * 100) / 100;

          await this.db.execute(`
            INSERT INTO questionnaire_statistics_cache
            (questionnaire_id, question_id, option_value, count, percentage, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            questionnaireId,
            questionId,
            optionValue,
            count,
            percentage,
            new Date().toISOString()
          ]);
        }

        result.updatedQuestions.push(questionId);
        console.log(`✅ 更新题目 ${questionId} 统计: ${totalAnswered} 人回答, ${Object.keys(optionCounts).length} 个选项`);
      }

      result.success = true;
      result.processingTime = Date.now() - startTime;

    } catch (error) {
      console.error('更新统计缓存失败:', error);
      result.errors.push(`更新统计缓存失败: ${error}`);
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 获取缓存的统计数据
   */
  async getCachedStatistics(questionnaireId: string): Promise<any> {
    try {
      const cacheData = await this.db.query(`
        SELECT question_id, option_value, count, percentage, last_updated
        FROM questionnaire_statistics_cache
        WHERE questionnaire_id = ?
        ORDER BY question_id, count DESC
      `, [questionnaireId]);

      if (!cacheData || cacheData.length === 0) {
        return null;
      }

      // 组织数据结构
      const statistics: Record<string, any> = {};
      let totalResponses = 0;
      let lastUpdated = '';

      for (const row of cacheData) {
        const questionId = row.question_id;
        
        if (!statistics[questionId]) {
          statistics[questionId] = {
            questionId,
            totalResponses: 0, // 实际回答该题的人数
            values: {},
            options: [],
            lastUpdated: row.last_updated,
            metadata: {
              displayRate: 0, // 题目显示率，稍后计算
              isConditional: false // 是否为条件显示题目
            }
          };
        }

        statistics[questionId].values[row.option_value] = row.count;
        statistics[questionId].options.push({
          value: row.option_value,
          count: row.count,
          percentage: row.percentage
        });

        // 计算该题目的实际回答人数（所有选项的总和）
        const questionTotal = Object.values(statistics[questionId].values).reduce((sum: number, count: any) => sum + count, 0);
        statistics[questionId].totalResponses = questionTotal;

        if (row.last_updated > lastUpdated) {
          lastUpdated = row.last_updated;
        }
      }

      // 更新每个问题的总响应数
      for (const questionId in statistics) {
        statistics[questionId].totalResponses = Object.values(statistics[questionId].values).reduce((sum: number, count: any) => sum + count, 0);
      }

      return {
        questionnaireId,
        totalResponses,
        statistics,
        lastUpdated,
        dataSource: 'cache'
      };

    } catch (error) {
      console.error('获取缓存统计数据失败:', error);
      return null;
    }
  }

  /**
   * 检查缓存是否需要更新
   */
  async shouldUpdateCache(questionnaireId: string, maxAgeMinutes: number = 30): Promise<boolean> {
    try {
      const latestCache = await this.db.queryFirst(`
        SELECT MAX(last_updated) as last_updated
        FROM questionnaire_statistics_cache
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      if (!latestCache || !latestCache.last_updated) {
        return true; // 没有缓存，需要更新
      }

      const cacheAge = Date.now() - new Date(latestCache.last_updated).getTime();
      const maxAge = maxAgeMinutes * 60 * 1000;

      return cacheAge > maxAge;

    } catch (error) {
      console.error('检查缓存状态失败:', error);
      return true; // 出错时默认更新
    }
  }

  /**
   * 获取缓存状态信息
   */
  async getCacheInfo(questionnaireId: string): Promise<any> {
    try {
      const info = await this.db.queryFirst(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT question_id) as questions_count,
          MIN(last_updated) as oldest_update,
          MAX(last_updated) as latest_update
        FROM questionnaire_statistics_cache
        WHERE questionnaire_id = ?
      `, [questionnaireId]);

      return {
        questionnaireId,
        totalEntries: info?.total_entries || 0,
        questionsCount: info?.questions_count || 0,
        oldestUpdate: info?.oldest_update,
        latestUpdate: info?.latest_update,
        hasCache: (info?.total_entries || 0) > 0
      };

    } catch (error) {
      console.error('获取缓存信息失败:', error);
      return {
        questionnaireId,
        totalEntries: 0,
        questionsCount: 0,
        hasCache: false,
        error: error.message
      };
    }
  }
}

/**
 * 创建统计缓存管理器实例
 */
export function createStatisticsCache(db: any): StatisticsCache {
  return new StatisticsCache(db);
}

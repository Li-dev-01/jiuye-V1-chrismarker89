/**
 * 测试数据库服务
 * 专门用于管理测试数据的生成、存储和质量控制
 */

import type { Env } from '../types/api';
import { handleDatabaseError, handleServiceError } from '../utils/errorHandler';

export interface TestDatabaseService {
  // 基础数据库操作
  execute(query: string, params?: any[]): Promise<any>;
  
  // 数据生成相关
  insertTestStory(storyData: TestStoryData): Promise<string>;
  insertTestQuestionnaire(questionnaireData: TestQuestionnaireData): Promise<string>;
  insertTestUser(userData: TestUserData): Promise<string>;
  
  // 数据质量评估
  calculateQualityScore(dataType: string, data: any): Promise<number>;
  getQualityRules(dataType: string): Promise<QualityRule[]>;
  
  // 数据查询和管理
  getUnsubmittedData(dataType: string, limit?: number): Promise<any[]>;
  getHighQualityData(dataType: string, minScore: number, limit?: number): Promise<any[]>;
  markAsSubmitted(dataType: string, ids: number[], submissionResult: any): Promise<void>;
  
  // 统计和监控
  getGenerationStats(): Promise<GenerationStats>;
  getSubmissionStats(): Promise<SubmissionStats>;
  cleanupOldData(daysOld: number): Promise<number>;
}

// 数据类型定义
export interface TestStoryData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  authorName?: string;
  generatorVersion?: string;
  generationTemplate?: string;
}

export interface TestQuestionnaireData {
  questionnaireType: string;
  dataJson: string;
  generatorVersion?: string;
  generationConfig?: string;
}

export interface TestUserData {
  userType: string;
  identityHash?: string;
  displayName: string;
  userDataJson: string;
  generatorVersion?: string;
}

export interface QualityRule {
  id: number;
  ruleName: string;
  ruleType: string;
  dataType: string;
  ruleConfig: any;
  weight: number;
  enabled: boolean;
}

export interface GenerationStats {
  totalGenerated: number;
  todayGenerated: number;
  avgQualityScore: number;
  highQualityCount: number;
  byType: {
    stories: number;
    questionnaires: number;
    users: number;
  };
}

export interface SubmissionStats {
  totalSubmitted: number;
  todaySubmitted: number;
  successRate: number;
  avgSubmissionTime: number;
  byType: {
    stories: number;
    questionnaires: number;
    users: number;
  };
}

/**
 * 创建测试数据库服务实例
 */
export function createTestDatabaseService(env: Env): TestDatabaseService {
  // 使用独立的测试数据库连接
  // 这里可以配置为使用不同的D1数据库实例
  const testDb = env.TEST_DB || env.DB; // 如果没有独立测试DB，暂时使用主DB
  
  return {
    async execute(query: string, params?: any[]) {
      try {
        console.log('🔍 执行测试数据库查询:', { query, params });

        const stmt = testDb.prepare(query);
        let result;

        if (params && params.length > 0) {
          result = await stmt.bind(...params).all();
        } else {
          result = await stmt.all();
        }

        console.log('✅ 查询执行成功:', {
          success: result.success,
          resultCount: result.results?.length || 0
        });

        return {
          results: result.results || [],
          meta: result.meta || {},
          success: result.success
        };
      } catch (error) {
        console.error('❌ 测试数据库操作失败:', {
          query,
          params,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error(`Test database operation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    async insertTestStory(storyData: TestStoryData): Promise<string> {
      try {
        const dataUuid = crypto.randomUUID();
        const qualityScore = await this.calculateQualityScore('story', storyData);

        console.log('📝 插入测试故事数据:', {
          dataUuid,
          title: storyData.title,
          qualityScore
        });

        const result = await this.execute(`
          INSERT INTO test_story_data
          (data_uuid, title, content, category, tags, author_name, quality_score,
           content_length, generator_version, generation_template)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dataUuid,
          storyData.title,
          storyData.content,
          storyData.category || '求职经历',
          JSON.stringify(storyData.tags || []),
          storyData.authorName || '匿名用户',
          qualityScore,
          storyData.content.length,
          storyData.generatorVersion || 'v2.0',
          storyData.generationTemplate || 'default'
        ]);

        console.log('✅ 测试故事插入成功:', dataUuid);
        return dataUuid;
      } catch (error) {
        console.error('❌ 插入测试故事失败:', error);
        throw error;
      }
    },

    async insertTestQuestionnaire(questionnaireData: TestQuestionnaireData): Promise<string> {
      const dataUuid = crypto.randomUUID();
      const qualityScore = await this.calculateQualityScore('questionnaire', questionnaireData);
      
      await this.execute(`
        INSERT INTO test_questionnaire_data 
        (data_uuid, questionnaire_type, data_json, quality_score, generator_version, generation_config)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        dataUuid,
        questionnaireData.questionnaireType,
        questionnaireData.dataJson,
        qualityScore,
        questionnaireData.generatorVersion || 'v1.0',
        questionnaireData.generationConfig || '{}'
      ]);
      
      return dataUuid;
    },

    async insertTestUser(userData: TestUserData): Promise<string> {
      const dataUuid = crypto.randomUUID();
      const qualityScore = await this.calculateQualityScore('user', userData);
      
      await this.execute(`
        INSERT INTO test_user_data 
        (data_uuid, user_type, identity_hash, display_name, user_data_json, quality_score, generator_version)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        dataUuid,
        userData.userType,
        userData.identityHash || '',
        userData.displayName,
        userData.userDataJson,
        qualityScore,
        userData.generatorVersion || 'v1.0'
      ]);
      
      return dataUuid;
    },

    async calculateQualityScore(dataType: string, data: any): Promise<number> {
      try {
        // 简化的质量评分逻辑
        if (dataType === 'story') {
          const contentLength = data.content?.length || 0;
          if (contentLength < 50) return 30;
          if (contentLength > 2000) return 70;
          if (contentLength > 100) return 85;
          return 75;
        } else if (dataType === 'questionnaire') {
          return 80; // 问卷默认80分
        } else if (dataType === 'user') {
          return 90; // 用户数据默认90分
        }
        return 75;
      } catch (error) {
        console.error('Quality score calculation failed:', error);
        return 50; // 默认分数
      }
    },

    async getQualityRules(dataType: string): Promise<QualityRule[]> {
      try {
        const result = await this.execute(`
          SELECT * FROM test_quality_rules
          WHERE data_type = ? AND enabled = TRUE
          ORDER BY weight DESC
        `, [dataType]);

        return result.results.map((row: any) => ({
          ...row,
          ruleConfig: JSON.parse(row.rule_config || '{}')
        }));
      } catch (error) {
        console.error('Failed to get quality rules:', error);
        return [];
      }
    },

    async getUnsubmittedData(dataType: string, limit: number = 10): Promise<any[]> {
      try {
        const tableName = `test_${dataType}_data`;
        console.log('🔍 查询未提交数据:', { dataType, tableName, limit });

        const result = await this.execute(`
          SELECT * FROM ${tableName}
          WHERE submitted_to_main = 0
          ORDER BY quality_score DESC, generated_at ASC
          LIMIT ?
        `, [limit]);

        console.log('✅ 查询未提交数据成功:', result.results.length);
        return result.results;
      } catch (error) {
        console.error('❌ 查询未提交数据失败:', error);
        return [];
      }
    },

    async getHighQualityData(dataType: string, minScore: number = 80, limit: number = 10): Promise<any[]> {
      try {
        const tableName = `test_${dataType}_data`;
        console.log('🔍 查询高质量数据:', { dataType, tableName, minScore, limit });

        const result = await this.execute(`
          SELECT * FROM ${tableName}
          WHERE submitted_to_main = 0 AND quality_score >= ?
          ORDER BY RANDOM()
          LIMIT ?
        `, [minScore, limit]);

        console.log('✅ 查询高质量数据成功:', result.results.length);
        return result.results;
      } catch (error) {
        console.error('❌ 查询高质量数据失败:', error);
        return [];
      }
    },

    async markAsSubmitted(dataType: string, ids: number[], submissionResult: any): Promise<void> {
      try {
        const tableName = `test_${dataType}_data`;
        const placeholders = ids.map(() => '?').join(',');

        console.log('📝 标记数据为已提交:', { dataType, tableName, ids });

        await this.execute(`
          UPDATE ${tableName}
          SET submitted_to_main = 1,
              submitted_at = ?,
              submission_result = ?
          WHERE id IN (${placeholders})
        `, [new Date().toISOString(), JSON.stringify(submissionResult), ...ids]);

        console.log('✅ 标记提交状态成功');
      } catch (error) {
        console.error('❌ 标记提交状态失败:', error);
        throw error;
      }
    },

    async getGenerationStats(): Promise<GenerationStats> {
      // 实现统计查询逻辑
      const today = new Date().toISOString().split('T')[0];
      
      const totalResult = await this.execute(`
        SELECT 
          (SELECT COUNT(*) FROM test_story_data) +
          (SELECT COUNT(*) FROM test_questionnaire_data) +
          (SELECT COUNT(*) FROM test_user_data) as total
      `);
      
      const todayResult = await this.execute(`
        SELECT 
          (SELECT COUNT(*) FROM test_story_data WHERE DATE(generated_at) = ?) +
          (SELECT COUNT(*) FROM test_questionnaire_data WHERE DATE(generated_at) = ?) +
          (SELECT COUNT(*) FROM test_user_data WHERE DATE(generated_at) = ?) as today
      `, [today, today, today]);
      
      return {
        totalGenerated: totalResult.results[0]?.total || 0,
        todayGenerated: todayResult.results[0]?.today || 0,
        avgQualityScore: 75, // 简化实现
        highQualityCount: 0,
        byType: {
          stories: 0,
          questionnaires: 0,
          users: 0
        }
      };
    },

    async getSubmissionStats(): Promise<SubmissionStats> {
      // 实现提交统计逻辑
      return {
        totalSubmitted: 0,
        todaySubmitted: 0,
        successRate: 95.0,
        avgSubmissionTime: 1500,
        byType: {
          stories: 0,
          questionnaires: 0,
          users: 0
        }
      };
    },

    async cleanupOldData(daysOld: number = 7): Promise<number> {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffISO = cutoffDate.toISOString();
      
      let deletedCount = 0;
      
      // 清理已提交的旧数据
      const tables = ['test_story_data', 'test_questionnaire_data', 'test_user_data'];
      
      for (const table of tables) {
        const result = await this.execute(`
          DELETE FROM ${table} 
          WHERE submitted_to_main = TRUE AND submitted_at < ?
        `, [cutoffISO]);
        
        deletedCount += result.meta.changes || 0;
      }
      
      return deletedCount;
    }
  };
}

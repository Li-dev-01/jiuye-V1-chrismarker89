/**
 * 混合架构统计服务
 * 结合JSON灵活性和关系型数据库的统计优势
 */

import type { DatabaseService } from '../db';
import { getQuestionnaireDefinition, convertResponseForStatistics } from '../config/questionnaireDefinitions';

export interface HybridStatisticsConfig {
  enableRealTimeSync: boolean;
  cacheExpirationMinutes: number;
  enablePathAnalysis: boolean;
  enableQualityMonitoring: boolean;
}

export interface UserPathAnalysis {
  entryPoint: string;
  pathSequence: string[];
  branchDecisions: Record<string, any>;
  completedSections: number;
  totalSections: number;
  dropoutPoint?: string;
  totalTimeSeconds: number;
}

export interface BranchStatistics {
  branchKey: string;
  userCount: number;
  avgCompletion: number;
  dataCompleteness: {
    employment: number;
    jobSeeking: number;
    student: number;
  };
  mostCommonPaths: string[];
}

export interface DataQualityMetrics {
  totalResponses: number;
  completionRate: number;
  branchCoverage: Record<string, number>;
  sectionCompletionRates: Record<string, number>;
  coreFieldsCompleteness: number;
  conditionalFieldsCompleteness: number;
  dropoutPoints: Array<{
    section: string;
    dropoutRate: number;
  }>;
}

export class HybridStatisticsService {
  private db: DatabaseService;
  private config: HybridStatisticsConfig;

  constructor(db: DatabaseService, config: Partial<HybridStatisticsConfig> = {}) {
    this.db = db;
    this.config = {
      enableRealTimeSync: true,
      cacheExpirationMinutes: 15,
      enablePathAnalysis: true,
      enableQualityMonitoring: true,
      ...config
    };
  }

  /**
   * 迁移现有数据到混合架构
   */
  async migrateExistingData(questionnaireId: string): Promise<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      migratedCount: 0,
      errors: [] as string[]
    };

    try {
      // 获取所有现有响应数据
      const responses = await this.db.query(`
        SELECT id, responses, submitted_at
        FROM universal_questionnaire_responses
        WHERE questionnaire_id = ?
        ORDER BY submitted_at DESC
      `, [questionnaireId]);

      if (!responses || responses.length === 0) {
        result.success = true;
        return result;
      }

      // 获取问卷定义
      const questionnaire = getQuestionnaireDefinition(questionnaireId);
      if (!questionnaire) {
        result.errors.push(`问卷定义不存在: ${questionnaireId}`);
        return result;
      }

      // 批量迁移数据
      for (const response of responses) {
        try {
          const responseData = JSON.parse(response.responses as string);
          const coreStats = this.extractCoreStatistics(responseData, questionnaire);
          const userPath = this.analyzeUserPath(responseData, questionnaire);

          // 插入核心统计数据
          await this.db.execute(`
            INSERT OR REPLACE INTO questionnaire_core_stats (
              response_id, questionnaire_id, age_range, gender, education_level,
              major_field, graduation_year, work_location_preference, current_status,
              work_industry, work_experience, position_level, current_salary,
              job_satisfaction, job_search_intensity, financial_pressure,
              academic_performance, internship_experience, user_path,
              sections_completed, completion_percentage, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            response.id, questionnaireId,
            coreStats.ageRange, coreStats.gender, coreStats.educationLevel,
            coreStats.majorField, coreStats.graduationYear, coreStats.workLocationPreference,
            coreStats.currentStatus, coreStats.workIndustry, coreStats.workExperience,
            coreStats.positionLevel, coreStats.currentSalary, coreStats.jobSatisfaction,
            coreStats.jobSearchIntensity, coreStats.financialPressure,
            coreStats.academicPerformance, coreStats.internshipExperience,
            JSON.stringify(userPath.pathSequence), JSON.stringify(userPath.completedSections),
            (Array.isArray(userPath.completedSections) ? userPath.completedSections.length : 0) / (Array.isArray(questionnaire.sections) ? questionnaire.sections.length : 1) * 100,
            response.submitted_at
          ]);

          // 插入用户路径数据
          await this.db.execute(`
            INSERT OR REPLACE INTO questionnaire_user_paths (
              response_id, questionnaire_id, entry_point, path_sequence,
              branch_decisions, total_sections, completed_sections,
              total_time_seconds, section_times
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            response.id, questionnaireId, userPath.entryPoint,
            JSON.stringify(userPath.pathSequence), JSON.stringify(userPath.branchDecisions),
            (Array.isArray(questionnaire.sections) ? questionnaire.sections.length : 0), (Array.isArray(userPath.completedSections) ? userPath.completedSections.length : 0),
            userPath.totalTimeSeconds, JSON.stringify({})
          ]);

          result.migratedCount++;
        } catch (error) {
          result.errors.push(`迁移响应 ${response.id} 失败: ${error}`);
        }
      }

      // 更新统计缓存
      await this.refreshStatisticsCache(questionnaireId);

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`迁移过程失败: ${error}`);
      return result;
    }
  }

  /**
   * 提取核心统计字段
   */
  private extractCoreStatistics(responseData: any, questionnaire: any): any {
    const flatData = convertResponseForStatistics(questionnaire.id, responseData);
    
    return {
      ageRange: flatData['age-range'],
      gender: flatData['gender'],
      educationLevel: flatData['education-level'],
      majorField: flatData['major-field'],
      graduationYear: flatData['graduation-year'],
      workLocationPreference: flatData['work-location-preference'],
      currentStatus: flatData['current-status'],
      workIndustry: flatData['work-industry'],
      workExperience: flatData['work-experience'],
      positionLevel: flatData['position-level'],
      currentSalary: flatData['current-salary'],
      jobSatisfaction: flatData['job-satisfaction'],
      jobSearchIntensity: flatData['job-search-intensity'],
      financialPressure: flatData['financial-pressure'],
      academicPerformance: flatData['academic-performance'],
      internshipExperience: flatData['internship-experience']
    };
  }

  /**
   * 分析用户路径
   */
  private analyzeUserPath(responseData: any, questionnaire: any): UserPathAnalysis {
    const completedSections: string[] = [];
    const pathSequence: string[] = [];
    const branchDecisions: Record<string, any> = {};
    let entryPoint = 'unknown';

    if (responseData.sectionResponses) {
      for (const sectionResponse of responseData.sectionResponses) {
        completedSections.push(sectionResponse.sectionId);
        pathSequence.push(sectionResponse.sectionId);

        // 记录分支决策
        for (const questionResponse of sectionResponse.questionResponses) {
          if (questionResponse.questionId === 'current-status') {
            entryPoint = questionResponse.value;
            branchDecisions[questionResponse.questionId] = questionResponse.value;
          }
        }
      }
    }

    return {
      entryPoint,
      pathSequence,
      branchDecisions,
      completedSections: completedSections.length,
      totalSections: questionnaire.sections.length,
      totalTimeSeconds: 0 // 需要从metadata中提取
    };
  }

  /**
   * 获取分支统计
   */
  async getBranchStatistics(questionnaireId: string): Promise<BranchStatistics[]> {
    const results = await this.db.query(`
      SELECT * FROM v_questionnaire_branch_stats
      WHERE questionnaire_id = ?
      ORDER BY user_count DESC
    `, [questionnaireId]);

    return results.map((row: any) => ({
      branchKey: row.branch_key,
      userCount: row.user_count,
      avgCompletion: row.avg_completion,
      dataCompleteness: {
        employment: (row.employment_data_count / row.user_count) * 100,
        jobSeeking: (row.job_seeking_data_count / row.user_count) * 100,
        student: (row.student_data_count / row.user_count) * 100
      },
      mostCommonPaths: [] // 需要额外查询
    }));
  }

  /**
   * 获取数据质量指标
   */
  async getDataQualityMetrics(questionnaireId: string): Promise<DataQualityMetrics> {
    const qualityData = await this.db.queryFirst(`
      SELECT * FROM questionnaire_data_quality
      WHERE questionnaire_id = ?
      ORDER BY last_calculated DESC
      LIMIT 1
    `, [questionnaireId]);

    if (!qualityData) {
      // 实时计算
      return this.calculateDataQualityMetrics(questionnaireId);
    }

    return {
      totalResponses: qualityData.total_responses,
      completionRate: qualityData.completion_rate,
      branchCoverage: JSON.parse(qualityData.branch_coverage || '{}'),
      sectionCompletionRates: JSON.parse(qualityData.section_completion_rates || '{}'),
      coreFieldsCompleteness: qualityData.core_fields_completeness,
      conditionalFieldsCompleteness: qualityData.conditional_fields_completeness,
      dropoutPoints: JSON.parse(qualityData.dropout_points || '[]')
    };
  }

  /**
   * 实时计算数据质量指标
   */
  private async calculateDataQualityMetrics(questionnaireId: string): Promise<DataQualityMetrics> {
    // 获取基础统计
    const basicStats = await this.db.queryFirst(`
      SELECT 
        COUNT(*) as total_responses,
        AVG(completion_percentage) as completion_rate,
        AVG(CASE WHEN age_range IS NOT NULL AND gender IS NOT NULL 
                 AND education_level IS NOT NULL THEN 100 ELSE 0 END) as core_completeness
      FROM questionnaire_core_stats
      WHERE questionnaire_id = ?
    `, [questionnaireId]);

    // 获取分支覆盖率
    const branchCoverage = await this.db.query(`
      SELECT current_status, COUNT(*) as count
      FROM questionnaire_core_stats
      WHERE questionnaire_id = ?
      GROUP BY current_status
    `, [questionnaireId]);

    const branchCoverageMap: Record<string, number> = {};
    branchCoverage.forEach((row: any) => {
      branchCoverageMap[row.current_status] = row.count;
    });

    return {
      totalResponses: basicStats?.total_responses || 0,
      completionRate: basicStats?.completion_rate || 0,
      branchCoverage: branchCoverageMap,
      sectionCompletionRates: {}, // 需要进一步实现
      coreFieldsCompleteness: basicStats?.core_completeness || 0,
      conditionalFieldsCompleteness: 0, // 需要进一步实现
      dropoutPoints: [] // 需要进一步实现
    };
  }

  /**
   * 刷新统计缓存
   */
  async refreshStatisticsCache(questionnaireId: string): Promise<void> {
    // 清空旧缓存
    await this.db.execute(`
      DELETE FROM questionnaire_enhanced_stats_cache
      WHERE questionnaire_id = ?
    `, [questionnaireId]);

    // 获取基础统计信息
    const basicStats = await this.db.queryFirst(`
      SELECT COUNT(*) as total_responses FROM questionnaire_core_stats WHERE questionnaire_id = ?
    `, [questionnaireId]);

    // 重新计算统计
    const coreFields = [
      'age_range', 'gender', 'education_level', 'major_field',
      'current_status', 'work_industry', 'job_satisfaction'
    ];

    for (const field of coreFields) {
      const stats = await this.db.query(`
        SELECT 
          ${field} as option_value,
          COUNT(*) as count,
          COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questionnaire_core_stats WHERE questionnaire_id = ?) as percentage
        FROM questionnaire_core_stats
        WHERE questionnaire_id = ? AND ${field} IS NOT NULL
        GROUP BY ${field}
      `, [questionnaireId, questionnaireId]);

      for (const stat of stats) {
        await this.db.execute(`
          INSERT INTO questionnaire_enhanced_stats_cache 
          (questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          questionnaireId,
          field.replace('_', '-'), // 转换为问题ID格式
          stat.option_value,
          stat.count,
          stat.percentage,
          basicStats?.total_responses || 0
        ]);
      }
    }
  }
}

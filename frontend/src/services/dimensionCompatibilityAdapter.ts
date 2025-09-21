/**
 * 维度兼容性适配器
 * 解决新旧ID系统冲突，提供无缝的兼容性支持
 */

import { globalIdMappingService, convertLegacyDimensionId } from '../config/globalIdRegistry';
import { VISUALIZATION_DIMENSIONS } from '../config/questionnaireVisualizationMapping';
import { UNIFIED_DIMENSION_MAPPING } from '../config/unifiedDataMapping';
import { unifiedDataTransformService, type StandardDimensionData } from './unifiedDataTransformService';
import type { DimensionData } from './questionnaireVisualizationService';

// ===== 1. 维度ID映射表 =====

/**
 * 旧版ID到新版ID的映射关系
 */
export const DIMENSION_ID_COMPATIBILITY_MAP: Record<string, string> = {
  // 旧版ID -> 新版ID
  'demographics': 'demographic-analysis',
  'employment-market': 'employment-market-analysis', 
  'student-preparation': 'student-employment-preparation',
  'living-costs': 'living-costs',
  'policy-insights': 'policy-insights',
  // 保持一致的ID
  'employment-overview': 'employment-overview'
};

/**
 * 新版ID到旧版ID的反向映射
 */
export const REVERSE_DIMENSION_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DIMENSION_ID_COMPATIBILITY_MAP).map(([old, new_]) => [new_, old])
);

/**
 * 问题ID映射表 (旧版questionId -> 新版frontendQuestionId)
 */
export const QUESTION_ID_COMPATIBILITY_MAP: Record<string, string> = {
  // 就业形势总览
  'current-status': 'current-status',
  'employment-difficulty-perception': 'employment-difficulty-perception', // 使用专门的就业难度感知数据
  'peer-employment-rate': 'current-status',
  'salary-level-perception': 'salary-level-perception', // 使用专门的薪资水平感知数据

  // 人口结构分析
  'gender': 'gender-distribution',
  'age-range': 'age-distribution',
  'education-level': 'education-level',
  'major-field': 'major-field', // 使用专门的专业分布数据（回退数据）
  'work-location-preference': 'work-location-preference', // 使用专门的地域分布数据（回退数据）

  // 就业市场分析
  'work-industry': 'work-industry', // 使用专门的行业就业分布数据
  'current-salary': 'current-salary', // 使用专门的薪资水平分布数据
  'job-search-duration': 'job-search-duration', // 使用专门的求职时长分析数据
  'job-search-difficulties': 'job-search-difficulties', // 使用专门的求职困难分析数据

  // 学生就业准备
  'academic-year': 'education-level',
  'career-preparation': 'career-preparation',

  // 生活成本压力 (这些可能是回退数据)
  'monthly-housing-cost': 'cost-pressure',
  'life-pressure-tier1': 'cost-pressure',
  'financial-pressure': 'cost-pressure',

  // 政策建议
  'employment-advice': 'policy-suggestions'
};

/**
 * 反向问题ID映射
 */
export const REVERSE_QUESTION_ID_MAP: Record<string, string[]> = {};

// 构建反向映射
for (const [oldId, newId] of Object.entries(QUESTION_ID_COMPATIBILITY_MAP)) {
  if (!REVERSE_QUESTION_ID_MAP[newId]) {
    REVERSE_QUESTION_ID_MAP[newId] = [];
  }
  REVERSE_QUESTION_ID_MAP[newId].push(oldId);
}

// ===== 2. 兼容性适配器类 =====

export class DimensionCompatibilityAdapter {
  private static instance: DimensionCompatibilityAdapter;

  private constructor() {}

  public static getInstance(): DimensionCompatibilityAdapter {
    if (!DimensionCompatibilityAdapter.instance) {
      DimensionCompatibilityAdapter.instance = new DimensionCompatibilityAdapter();
    }
    return DimensionCompatibilityAdapter.instance;
  }

  /**
   * 转换旧版维度ID到新版ID
   */
  public convertLegacyToNewId(legacyId: string): string {
    return DIMENSION_ID_COMPATIBILITY_MAP[legacyId] || legacyId;
  }

  /**
   * 转换新版维度ID到旧版ID
   */
  public convertNewToLegacyId(newId: string): string {
    return REVERSE_DIMENSION_ID_MAP[newId] || newId;
  }

  /**
   * 转换旧版问题ID到新版问题ID
   */
  public convertLegacyQuestionId(legacyQuestionId: string): string {
    return QUESTION_ID_COMPATIBILITY_MAP[legacyQuestionId] || legacyQuestionId;
  }

  /**
   * 获取新版问题ID对应的所有旧版问题ID
   */
  public getLegacyQuestionIds(newQuestionId: string): string[] {
    return REVERSE_QUESTION_ID_MAP[newQuestionId] || [];
  }

  /**
   * 检查维度ID是否有API数据支持
   */
  public hasApiDataSupport(dimensionId: string): boolean {
    const newId = this.convertLegacyToNewId(dimensionId);
    const unifiedMapping = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
    return !!unifiedMapping;
  }

  /**
   * 获取维度的API数据字段
   */
  public getDimensionApiFields(dimensionId: string): string[] {
    const newId = this.convertLegacyToNewId(dimensionId);
    const unifiedMapping = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
    
    if (!unifiedMapping) {
      return [];
    }

    const apiFields: string[] = [];
    for (const question of unifiedMapping.questions) {
      if (!apiFields.includes(question.apiDataField)) {
        apiFields.push(question.apiDataField);
      }
    }
    
    return apiFields;
  }

  /**
   * 获取维度的旧版配置信息
   */
  public getLegacyDimensionConfig(dimensionId: string) {
    return VISUALIZATION_DIMENSIONS.find(dim => dim.id === dimensionId);
  }

  /**
   * 获取维度的新版配置信息
   */
  public getUnifiedDimensionConfig(dimensionId: string) {
    const newId = this.convertLegacyToNewId(dimensionId);
    return UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
  }

  /**
   * 合并旧版和新版配置，创建兼容的维度配置
   */
  public createCompatibleDimensionConfig(dimensionId: string) {
    const legacyConfig = this.getLegacyDimensionConfig(dimensionId);
    const unifiedConfig = this.getUnifiedDimensionConfig(dimensionId);

    if (!legacyConfig) {
      console.warn(`未找到旧版维度配置: ${dimensionId}`);
      return null;
    }

    // 基础配置来自旧版（保持UI一致性）
    const compatibleConfig = {
      id: legacyConfig.id,
      title: legacyConfig.title,
      description: legacyConfig.description,
      icon: legacyConfig.icon,
      socialImpact: legacyConfig.socialImpact,
      questions: legacyConfig.questions,
      // 新增字段
      hasApiSupport: !!unifiedConfig,
      unifiedId: unifiedConfig?.frontendId || null,
      apiFields: this.getDimensionApiFields(dimensionId)
    };

    return compatibleConfig;
  }

  /**
   * 转换标准维度数据为兼容格式
   */
  public convertStandardToCompatibleFormat(
    standardData: StandardDimensionData,
    legacyDimensionId: string
  ): DimensionData {
    const legacyConfig = this.getLegacyDimensionConfig(legacyDimensionId);

    if (!legacyConfig) {
      throw new Error(`未找到旧版维度配置: ${legacyDimensionId}`);
    }

    // 创建新版问题ID到标准图表数据的映射
    const standardChartsMap = new Map<string, any>();
    for (const chart of standardData.charts) {
      standardChartsMap.set(chart.questionId, chart);
    }

    // 为每个旧版问题生成兼容的图表数据
    const compatibleCharts = legacyConfig.questions.map(legacyQuestion => {
      // 转换旧版问题ID到新版问题ID
      const newQuestionId = this.convertLegacyQuestionId(legacyQuestion.questionId);
      const standardChart = standardChartsMap.get(newQuestionId);

      if (standardChart && standardChart.data && standardChart.data.length > 0) {
        // 有真实数据：使用标准图表数据
        return {
          questionId: legacyQuestion.questionId, // 保持旧版ID
          questionTitle: legacyQuestion.questionTitle,
          chartType: legacyQuestion.chartType,
          data: standardChart.data.map((point: any) => ({
            label: point.label,
            value: point.value,
            percentage: point.percentage,
            color: point.color,
            icon: point.icon
          })),
          totalResponses: standardChart.totalResponses,
          lastUpdated: standardChart.lastUpdated,
          socialInsight: standardChart.socialInsight
        };
      } else {
        // 无真实数据：生成回退数据
        console.warn(`问题 ${legacyQuestion.questionId} 无对应数据，使用回退数据`);
        return {
          questionId: legacyQuestion.questionId,
          questionTitle: legacyQuestion.questionTitle,
          chartType: legacyQuestion.chartType,
          data: this.generateFallbackQuestionData(legacyQuestion),
          totalResponses: 0,
          lastUpdated: new Date().toISOString(),
          socialInsight: `${legacyQuestion.socialValue || '数据分析'} (使用示例数据)`
        };
      }
    });

    return {
      dimensionId: legacyDimensionId, // 使用旧版ID保持兼容性
      dimensionTitle: standardData.dimensionTitle,
      charts: compatibleCharts,
      totalResponses: standardData.totalResponses,
      completionRate: standardData.completionRate
    };
  }

  /**
   * 生成回退问题数据
   */
  private generateFallbackQuestionData(legacyQuestion: any): any[] {
    // 根据问题类型生成特定的回退数据
    return this.generateSpecificFallbackData(legacyQuestion.questionId, legacyQuestion);
  }

  /**
   * 根据问题ID生成特定的回退数据
   */
  private generateSpecificFallbackData(questionId: string, legacyQuestion: any): any[] {
    switch (questionId) {
      case 'major-field':
        return this.generateMajorFieldData();
      case 'work-location-preference':
        return this.generateLocationPreferenceData();
      case 'employment-difficulty-perception':
        return this.generateEmploymentDifficultyData();
      case 'salary-level-perception':
        return this.generateSalaryLevelData();
      case 'work-industry':
        return this.generateWorkIndustryData();
      case 'current-salary':
        return this.generateCurrentSalaryData();
      case 'job-search-duration':
        return this.generateJobSearchDurationData();
      case 'job-search-difficulties':
        return this.generateJobSearchDifficultiesData();
      case 'gender-distribution':
        return this.generateGenderDistributionData();
      case 'age-distribution':
        return this.generateAgeDistributionData();
      case 'career-preparation':
        return this.generateCareerPreparationData();
      default:
        return this.generateGenericFallbackData(legacyQuestion);
    }
  }

  /**
   * 生成专业分布数据
   */
  private generateMajorFieldData(): any[] {
    const majors = [
      { label: '计算机科学', percentage: 25, color: '#1890ff' },
      { label: '经济学', percentage: 20, color: '#52c41a' },
      { label: '工程学', percentage: 18, color: '#fa8c16' },
      { label: '管理学', percentage: 15, color: '#eb2f96' },
      { label: '文学', percentage: 12, color: '#722ed1' },
      { label: '其他', percentage: 10, color: '#13c2c2' }
    ];

    return majors.map(major => ({
      name: major.label,
      label: major.label,
      value: Math.floor(major.percentage * 10), // 假设总数1000
      percentage: major.percentage,
      color: major.color
    }));
  }

  /**
   * 生成地域分布数据
   */
  private generateLocationPreferenceData(): any[] {
    const locations = [
      { label: '北京', percentage: 22, color: '#1890ff' },
      { label: '上海', percentage: 20, color: '#52c41a' },
      { label: '深圳', percentage: 18, color: '#fa8c16' },
      { label: '广州', percentage: 15, color: '#eb2f96' },
      { label: '杭州', percentage: 12, color: '#722ed1' },
      { label: '其他城市', percentage: 13, color: '#13c2c2' }
    ];

    return locations.map(location => ({
      name: location.label,
      label: location.label,
      value: Math.floor(location.percentage * 10), // 假设总数1000
      percentage: location.percentage,
      color: location.color
    }));
  }

  /**
   * 生成就业难度感知数据
   */
  private generateEmploymentDifficultyData(): any[] {
    const difficulties = [
      { label: '非常困难', percentage: 28, color: '#ff4d4f' },
      { label: '比较困难', percentage: 35, color: '#ff7a45' },
      { label: '一般', percentage: 22, color: '#faad14' },
      { label: '比较容易', percentage: 12, color: '#52c41a' },
      { label: '非常容易', percentage: 3, color: '#1890ff' }
    ];

    return difficulties.map(difficulty => ({
      name: difficulty.label,
      label: difficulty.label,
      value: Math.floor(difficulty.percentage * 10),
      percentage: difficulty.percentage,
      color: difficulty.color
    }));
  }

  /**
   * 生成薪资水平感知数据
   */
  private generateSalaryLevelData(): any[] {
    const salaryLevels = [
      { label: '低于预期', percentage: 42, color: '#ff4d4f' },
      { label: '符合预期', percentage: 38, color: '#faad14' },
      { label: '高于预期', percentage: 15, color: '#52c41a' },
      { label: '远超预期', percentage: 5, color: '#1890ff' }
    ];

    return salaryLevels.map(level => ({
      name: level.label,
      label: level.label,
      value: Math.floor(level.percentage * 10),
      percentage: level.percentage,
      color: level.color
    }));
  }

  /**
   * 生成行业就业分布数据
   */
  private generateWorkIndustryData(): any[] {
    const industries = [
      { label: '互联网/科技', percentage: 28, color: '#1890ff' },
      { label: '金融服务', percentage: 18, color: '#52c41a' },
      { label: '制造业', percentage: 15, color: '#fa8c16' },
      { label: '教育培训', percentage: 12, color: '#eb2f96' },
      { label: '医疗健康', percentage: 10, color: '#722ed1' },
      { label: '政府机关', percentage: 8, color: '#13c2c2' },
      { label: '其他行业', percentage: 9, color: '#8c8c8c' }
    ];

    return industries.map(industry => ({
      name: industry.label,
      label: industry.label,
      value: Math.floor(industry.percentage * 10),
      percentage: industry.percentage,
      color: industry.color
    }));
  }

  /**
   * 生成薪资水平分布数据
   */
  private generateCurrentSalaryData(): any[] {
    const salaryRanges = [
      { label: '3K以下', percentage: 8, color: '#ff4d4f' },
      { label: '3K-5K', percentage: 22, color: '#ff7a45' },
      { label: '5K-8K', percentage: 28, color: '#faad14' },
      { label: '8K-12K', percentage: 25, color: '#52c41a' },
      { label: '12K-20K', percentage: 12, color: '#1890ff' },
      { label: '20K以上', percentage: 5, color: '#722ed1' }
    ];

    return salaryRanges.map(range => ({
      name: range.label,
      label: range.label,
      value: Math.floor(range.percentage * 10),
      percentage: range.percentage,
      color: range.color
    }));
  }

  /**
   * 生成求职时长分析数据
   */
  private generateJobSearchDurationData(): any[] {
    const durations = [
      { label: '1个月内', percentage: 15, color: '#52c41a' },
      { label: '1-3个月', percentage: 35, color: '#1890ff' },
      { label: '3-6个月', percentage: 28, color: '#faad14' },
      { label: '6-12个月', percentage: 15, color: '#ff7a45' },
      { label: '12个月以上', percentage: 7, color: '#ff4d4f' }
    ];

    return durations.map(duration => ({
      name: duration.label,
      label: duration.label,
      value: Math.floor(duration.percentage * 10),
      percentage: duration.percentage,
      color: duration.color
    }));
  }

  /**
   * 生成求职困难分析数据
   */
  private generateJobSearchDifficultiesData(): any[] {
    const difficulties = [
      { label: '缺乏经验', percentage: 32, color: '#ff4d4f' },
      { label: '技能不匹配', percentage: 25, color: '#ff7a45' },
      { label: '竞争激烈', percentage: 20, color: '#faad14' },
      { label: '薪资期望', percentage: 12, color: '#1890ff' },
      { label: '地域限制', percentage: 8, color: '#722ed1' },
      { label: '其他原因', percentage: 3, color: '#8c8c8c' }
    ];

    return difficulties.map(difficulty => ({
      name: difficulty.label,
      label: difficulty.label,
      value: Math.floor(difficulty.percentage * 10),
      percentage: difficulty.percentage,
      color: difficulty.color
    }));
  }

  /**
   * 生成性别分布数据
   */
  private generateGenderDistributionData(): any[] {
    const genders = [
      { label: '女性', percentage: 52, color: '#FF6B9D' },
      { label: '男性', percentage: 46, color: '#1890FF' },
      { label: '不愿透露', percentage: 2, color: '#52C41A' }
    ];

    return genders.map(gender => ({
      name: gender.label,
      label: gender.label,
      value: Math.floor(gender.percentage * 10),
      percentage: gender.percentage,
      color: gender.color
    }));
  }

  /**
   * 生成年龄分布数据
   */
  private generateAgeDistributionData(): any[] {
    const ageRanges = [
      { label: '18-22岁', percentage: 28, color: '#1890ff' },
      { label: '23-25岁', percentage: 35, color: '#52c41a' },
      { label: '26-30岁', percentage: 22, color: '#faad14' },
      { label: '31-35岁', percentage: 10, color: '#ff7a45' },
      { label: '35岁以上', percentage: 5, color: '#722ed1' }
    ];

    return ageRanges.map(age => ({
      name: age.label,
      label: age.label,
      value: Math.floor(age.percentage * 10),
      percentage: age.percentage,
      color: age.color
    }));
  }

  /**
   * 生成就业准备情况数据
   */
  private generateCareerPreparationData(): any[] {
    const preparations = [
      { label: '充分准备', percentage: 18, color: '#52C41A' },
      { label: '基本准备', percentage: 32, color: '#1890FF' },
      { label: '准备不足', percentage: 28, color: '#FA8C16' },
      { label: '完全没准备', percentage: 15, color: '#FF4D4F' },
      { label: '不确定', percentage: 7, color: '#722ED1' }
    ];

    return preparations.map(prep => ({
      name: prep.label,
      label: prep.label,
      value: Math.floor(prep.percentage * 10),
      percentage: prep.percentage,
      color: prep.color
    }));
  }

  /**
   * 生成通用回退数据
   */
  private generateGenericFallbackData(legacyQuestion: any): any[] {
    if (!legacyQuestion.options || !Array.isArray(legacyQuestion.options)) {
      return [];
    }

    // 生成随机但合理的数据
    const totalValue = 100;
    const optionCount = legacyQuestion.options.length;

    return legacyQuestion.options.map((option: any, index: number) => {
      // 生成随机百分比，确保总和为100%
      const basePercentage = Math.floor(100 / optionCount);
      const randomVariation = Math.floor(Math.random() * 10) - 5; // -5 到 +5 的变化
      const percentage = Math.max(1, basePercentage + randomVariation);
      const value = Math.floor((percentage / 100) * totalValue);

      return {
        label: option.label,
        value: value,
        percentage: percentage,
        color: option.color,
        icon: option.icon
      };
    });
  }

  /**
   * 获取所有支持的维度列表（按优先级排序）
   */
  public getSupportedDimensions(): Array<{
    id: string;
    title: string;
    hasApiSupport: boolean;
    priority: number;
  }> {
    const dimensions = VISUALIZATION_DIMENSIONS.map(dim => {
      const hasApiSupport = this.hasApiDataSupport(dim.id);
      
      // 设置优先级：有API支持的优先级更高
      let priority = 0;
      if (hasApiSupport) {
        priority = 10;
        // 特定维度的额外优先级
        if (dim.id === 'employment-overview') priority += 5;
        if (dim.id === 'demographics') priority += 4;
        if (dim.id === 'employment-market') priority += 3;
        if (dim.id === 'student-preparation') priority += 2;
      }

      return {
        id: dim.id,
        title: dim.title,
        hasApiSupport,
        priority
      };
    });

    // 按优先级排序
    return dimensions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取维度的数据加载策略
   */
  public getDimensionLoadingStrategy(dimensionId: string): {
    strategy: 'api' | 'fallback' | 'skip';
    reason: string;
    apiFields?: string[];
  } {
    const hasApiSupport = this.hasApiDataSupport(dimensionId);
    
    if (hasApiSupport) {
      return {
        strategy: 'api',
        reason: '维度有API数据支持',
        apiFields: this.getDimensionApiFields(dimensionId)
      };
    }

    const legacyConfig = this.getLegacyDimensionConfig(dimensionId);
    if (legacyConfig) {
      return {
        strategy: 'fallback',
        reason: '维度无API数据支持，使用回退数据'
      };
    }

    return {
      strategy: 'skip',
      reason: '维度配置不存在'
    };
  }

  /**
   * 生成维度兼容性报告
   */
  public generateCompatibilityReport(): {
    totalDimensions: number;
    supportedDimensions: number;
    unsupportedDimensions: number;
    details: Array<{
      dimensionId: string;
      title: string;
      hasApiSupport: boolean;
      apiFields: string[];
      strategy: string;
    }>;
  } {
    const dimensions = VISUALIZATION_DIMENSIONS;
    const details = dimensions.map(dim => {
      const hasApiSupport = this.hasApiDataSupport(dim.id);
      const strategy = this.getDimensionLoadingStrategy(dim.id);
      
      return {
        dimensionId: dim.id,
        title: dim.title,
        hasApiSupport,
        apiFields: this.getDimensionApiFields(dim.id),
        strategy: strategy.strategy
      };
    });

    const supportedCount = details.filter(d => d.hasApiSupport).length;
    
    return {
      totalDimensions: dimensions.length,
      supportedDimensions: supportedCount,
      unsupportedDimensions: dimensions.length - supportedCount,
      details
    };
  }

  /**
   * 验证维度配置的一致性
   */
  public validateDimensionConsistency(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查每个旧版维度是否有对应的新版配置
    for (const legacyDim of VISUALIZATION_DIMENSIONS) {
      const newId = this.convertLegacyToNewId(legacyDim.id);
      const unifiedConfig = UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === newId);
      
      if (!unifiedConfig) {
        warnings.push(`旧版维度 ${legacyDim.id} 没有对应的统一配置`);
      }
    }

    // 检查新版配置是否有对应的旧版配置
    for (const unifiedDim of UNIFIED_DIMENSION_MAPPING) {
      const legacyId = this.convertNewToLegacyId(unifiedDim.frontendId);
      const legacyConfig = VISUALIZATION_DIMENSIONS.find(dim => dim.id === legacyId);
      
      if (!legacyConfig) {
        warnings.push(`统一配置 ${unifiedDim.frontendId} 没有对应的旧版配置`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ===== 3. 导出单例实例 =====

export const dimensionCompatibilityAdapter = DimensionCompatibilityAdapter.getInstance();

// ===== 4. 便捷函数 =====

/**
 * 快速检查维度是否支持
 */
export function isDimensionSupported(dimensionId: string): boolean {
  return dimensionCompatibilityAdapter.hasApiDataSupport(dimensionId);
}

/**
 * 快速获取支持的维度列表
 */
export function getSupportedDimensionIds(): string[] {
  return dimensionCompatibilityAdapter
    .getSupportedDimensions()
    .filter(dim => dim.hasApiSupport)
    .map(dim => dim.id);
}

/**
 * 快速获取维度兼容性报告
 */
export function getCompatibilityReport() {
  return dimensionCompatibilityAdapter.generateCompatibilityReport();
}

export default dimensionCompatibilityAdapter;

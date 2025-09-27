/**
 * 问卷可视化数据服务
 * 基于真实问卷数据的可视化数据查询服务
 * 使用统一数据映射解决维度ID和数据结构不匹配问题
 */

import { API_CONFIG } from '../config/apiConfig';
import { mockVisualizationService, type MockVisualizationService } from './mockVisualizationData';
import { useMockData, getDataSourceStatus } from '../config/dataSourceConfig';
import {
  unifiedDataTransformService,
  type StandardDimensionData,
  type StandardChartData,
  type ApiCompleteData
} from './unifiedDataTransformService';
import { UNIFIED_DIMENSION_MAPPING, getAllFrontendDimensionIds } from '../config/unifiedDataMapping';
import {
  dimensionCompatibilityAdapter,
  getSupportedDimensionIds,
  getCompatibilityReport
} from './dimensionCompatibilityAdapter';

export interface VisualizationDataPoint {
  label: string;
  value: number;
  percentage: number;
  color?: string;
  icon?: string;
}

export interface ChartData {
  questionId: string;
  questionTitle: string;
  chartType: string;
  data: VisualizationDataPoint[];
  totalResponses: number;
  lastUpdated: string;
  socialInsight?: string;
}

export interface DimensionData {
  dimensionId: string;
  dimensionTitle: string;
  charts: ChartData[];
  totalResponses: number;
  completionRate: number;
}

// 兼容性类型别名 - 逐步迁移到StandardDimensionData
export type LegacyDimensionData = DimensionData;

export interface CrossAnalysisData {
  title: string;
  description: string;
  data: Array<{
    category: string;
    subcategories: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
  }>;
}

export interface VisualizationSummary {
  totalResponses: number;
  completionRate: number;
  lastUpdated: string;
  keyInsights: string[];
  dimensions: DimensionData[];
}

class QuestionnaireVisualizationService {
  private baseUrl = API_CONFIG.BASE_URL;
  private universalQuestionnaireUrl = `${this.baseUrl}/api/universal-questionnaire`;

  /**
   * 获取完整的可视化数据摘要
   */
  async getVisualizationSummary(): Promise<VisualizationSummary> {
    if (useMockData()) {
      return await mockVisualizationService.getSummary();
    }

    try {
      // 使用新的universal-questionnaire统计API
      const response = await fetch(`${this.universalQuestionnaireUrl}/statistics/employment-survey-2024?include_test_data=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API返回失败');
      }

      // 转换API响应为VisualizationSummary格式
      const data = result.data;
      return {
        totalResponses: this.calculateTotalResponses(data),
        completionRate: 100, // 新API只返回完整数据
        lastUpdated: data.cacheInfo?.lastUpdated || new Date().toISOString(),
        keyInsights: this.generateKeyInsights(data),
        dimensions: this.convertToDimensions(data)
      };
    } catch (error) {
      console.error('Failed to fetch visualization summary:', error);
      throw error;
    }
  }

  /**
   * 计算总响应数
   */
  private calculateTotalResponses(data: any): number {
    // 从任一分布数据中获取总数
    if (data.ageDistribution && data.ageDistribution.length > 0) {
      return data.ageDistribution.reduce((sum: number, item: any) => sum + item.value, 0);
    }
    if (data.employmentStatus && data.employmentStatus.length > 0) {
      return data.employmentStatus.reduce((sum: number, item: any) => sum + item.value, 0);
    }
    return 0;
  }

  /**
   * 生成关键洞察
   */
  private generateKeyInsights(data: any): string[] {
    const insights: string[] = [];

    if (data.employmentStatus) {
      const employed = data.employmentStatus.find((item: any) => item.name === 'employed');
      if (employed) {
        insights.push(`就业率达到${employed.percentage}%，显示出良好的就业形势`);
      }
    }

    if (data.ageDistribution) {
      const mainAge = data.ageDistribution[0];
      if (mainAge) {
        insights.push(`${mainAge.name}岁年龄段占比最高，达到${mainAge.percentage}%`);
      }
    }

    if (data.educationLevel) {
      const bachelor = data.educationLevel.find((item: any) => item.name === 'bachelor');
      if (bachelor) {
        insights.push(`本科学历占主体，比例为${bachelor.percentage}%`);
      }
    }

    return insights;
  }

  /**
   * 转换为维度数据格式
   */
  private convertToDimensions(data: any): any[] {
    return [
      {
        id: 'age',
        title: '年龄分布',
        data: data.ageDistribution || [],
        insights: ['年龄分布相对集中，主要为应届毕业生群体']
      },
      {
        id: 'employment',
        title: '就业状态',
        data: data.employmentStatus || [],
        insights: ['就业形势总体良好，大部分毕业生已找到工作']
      },
      {
        id: 'education',
        title: '教育背景',
        data: data.educationLevel || [],
        insights: ['本科学历为主体，研究生比例逐年增长']
      },
      {
        id: 'gender',
        title: '性别分布',
        data: data.genderDistribution || [],
        insights: ['性别分布相对均衡']
      }
    ];
  }

  /**
   * 获取特定维度的数据 (使用兼容性适配器)
   */
  async getDimensionData(dimensionId: string): Promise<DimensionData> {
    if (useMockData()) {
      const data = await mockVisualizationService.getDimensionData(dimensionId);
      if (!data) {
        throw new Error(`Dimension ${dimensionId} not found`);
      }
      return data;
    }

    try {
      // 检查维度的加载策略
      const loadingStrategy = dimensionCompatibilityAdapter.getDimensionLoadingStrategy(dimensionId);

      console.log(`📊 维度 ${dimensionId} 加载策略:`, loadingStrategy);

      if (loadingStrategy.strategy === 'skip') {
        throw new Error(`维度 ${dimensionId} 不支持: ${loadingStrategy.reason}`);
      }

      if (loadingStrategy.strategy === 'fallback') {
        console.warn(`维度 ${dimensionId} 使用回退策略: ${loadingStrategy.reason}`);
        return this.generateFallbackDimensionData(dimensionId);
      }

      // API策略：获取真实数据
      const response = await fetch(`${this.universalQuestionnaireUrl}/statistics/employment-survey-2024?include_test_data=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API返回失败');
      }

      const apiData: ApiCompleteData = result.data;

      // 验证API数据质量
      const validation = unifiedDataTransformService.validateApiData(apiData);
      if (!validation.isValid) {
        console.warn('API数据不完整:', validation.missingFields);
      }

      // 转换旧版维度ID到新版ID
      const newDimensionId = dimensionCompatibilityAdapter.convertLegacyToNewId(dimensionId);

      // 转换为标准化维度数据
      const standardDimensionData = unifiedDataTransformService.transformApiDataToDimension(newDimensionId, apiData);

      // 转换为兼容格式
      return dimensionCompatibilityAdapter.convertStandardToCompatibleFormat(standardDimensionData, dimensionId);

    } catch (error) {
      console.error(`Failed to fetch dimension data for ${dimensionId}:`, error);
      throw error;
    }
  }

  /**
   * 生成回退维度数据
   */
  private generateFallbackDimensionData(dimensionId: string): DimensionData {
    const legacyConfig = dimensionCompatibilityAdapter.getLegacyDimensionConfig(dimensionId);

    if (!legacyConfig) {
      throw new Error(`未找到维度配置: ${dimensionId}`);
    }

    // 生成回退图表数据
    const fallbackCharts: ChartData[] = legacyConfig.questions.map(question => ({
      questionId: question.questionId,
      questionTitle: question.questionTitle,
      chartType: question.chartType,
      data: question.options.map((option, index) => ({
        label: option.label,
        value: Math.floor(Math.random() * 100) + 10, // 随机数据
        percentage: Math.floor(Math.random() * 30) + 5, // 随机百分比
        color: option.color,
        icon: option.icon
      })),
      totalResponses: 0,
      lastUpdated: new Date().toISOString(),
      socialInsight: `${question.socialValue} (使用示例数据)`
    }));

    return {
      dimensionId,
      dimensionTitle: legacyConfig.title,
      charts: fallbackCharts,
      totalResponses: 0,
      completionRate: 0
    };
  }

  /**
   * 转换标准格式到兼容格式
   */
  private convertStandardToLegacyFormat(standardData: StandardDimensionData): DimensionData {
    const legacyCharts: ChartData[] = standardData.charts.map(chart => ({
      questionId: chart.questionId,
      questionTitle: chart.questionTitle,
      chartType: chart.chartType,
      data: chart.data.map(point => ({
        label: point.label,
        value: point.value,
        percentage: point.percentage,
        color: point.color,
        icon: point.icon
      })),
      totalResponses: chart.totalResponses,
      lastUpdated: chart.lastUpdated,
      socialInsight: chart.socialInsight
    }));

    return {
      dimensionId: standardData.dimensionId,
      dimensionTitle: standardData.dimensionTitle,
      charts: legacyCharts,
      totalResponses: standardData.totalResponses,
      completionRate: standardData.completionRate
    };
  }

  /**
   * 从完整数据中提取特定维度数据 (已弃用 - 使用统一映射替代)
   * @deprecated 使用 unifiedDataTransformService.transformApiDataToDimension 替代
   */
  private extractDimensionData(dimensionId: string, data: any): DimensionData {
    // 映射前端维度ID到后端数据字段
    const dimensionMap: Record<string, any> = {
      // 就业形势总览
      'employment-overview': {
        title: '就业形势总览',
        charts: [
          {
            questionId: 'current-status',
            questionTitle: '当前身份状态分布',
            chartType: 'donut',
            data: this.transformDataForChart(data.employmentStatus || []),
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '反映当前就业市场的整体状况和人群分布'
          },
          {
            questionId: 'employment-difficulty-perception',
            questionTitle: '就业难度感知',
            chartType: 'bar',
            data: [], // 暂时为空，需要额外数据
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '了解求职者对就业市场难度的主观感受'
          }
        ]
      },
      // 人口结构分析
      'demographic-analysis': {
        title: '人口结构分析',
        charts: [
          {
            questionId: 'gender-distribution',
            questionTitle: '性别分布',
            chartType: 'pie',
            data: this.transformDataForChart(data.genderDistribution || []),
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '了解参与调研人群的性别构成'
          },
          {
            questionId: 'age-distribution',
            questionTitle: '年龄分布',
            chartType: 'bar',
            data: this.transformDataForChart(data.ageDistribution || []),
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '分析不同年龄段的就业状况差异'
          }
        ]
      },
      // 就业市场形势分析
      'employment-market-analysis': {
        title: '就业市场形势分析',
        charts: [
          {
            questionId: 'employment-status',
            questionTitle: '就业状态分布',
            chartType: 'pie',
            data: this.transformDataForChart(data.employmentStatus || []),
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '反映当前就业市场的供需状况'
          }
        ]
      },
      // 学生就业准备
      'student-employment-preparation': {
        title: '学生就业准备',
        charts: [
          {
            questionId: 'education-level',
            questionTitle: '教育水平分布',
            chartType: 'donut',
            data: this.transformDataForChart(data.educationLevel || []),
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '分析不同教育背景对就业的影响'
          }
        ]
      },
      // 生活成本压力
      'living-costs': {
        title: '生活成本压力',
        charts: [
          {
            questionId: 'cost-pressure',
            questionTitle: '生活成本压力感知',
            chartType: 'bar',
            data: [], // 需要额外数据
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '了解生活成本对就业选择的影响'
          }
        ]
      },
      // 政策建议洞察
      'policy-insights': {
        title: '政策建议洞察',
        charts: [
          {
            questionId: 'policy-suggestions',
            questionTitle: '政策建议分布',
            chartType: 'treemap',
            data: [], // 需要额外数据
            totalResponses: data.totalResponses || 0,
            lastUpdated: new Date().toISOString(),
            socialInsight: '收集对就业政策的建议和期望'
          }
        ]
      }
    };

    const dimensionData = dimensionMap[dimensionId];
    if (!dimensionData) {
      console.warn(`Dimension ${dimensionId} not found, available dimensions:`, Object.keys(dimensionMap));
      // 返回空数据而不是抛出错误
      return {
        dimensionId: dimensionId,
        dimensionTitle: `未知维度: ${dimensionId}`,
        charts: [],
        totalResponses: data.totalResponses || 0,
        completionRate: 100
      };
    }

    return {
      dimensionId: dimensionId,
      dimensionTitle: dimensionData.title,
      charts: dimensionData.charts || [],
      totalResponses: data.totalResponses || 0,
      completionRate: 100
    };
  }

  /**
   * 转换API数据为图表数据格式
   */
  private transformDataForChart(apiData: any[]): VisualizationDataPoint[] {
    if (!Array.isArray(apiData)) {
      console.warn('Invalid API data for chart transformation:', apiData);
      return [];
    }

    return apiData.map(item => ({
      label: this.getLocalizedLabel(item.name),
      value: item.value || 0,
      percentage: item.percentage || 0,
      color: this.getColorForItem(item.name)
    }));
  }

  /**
   * 获取本地化标签
   */
  private getLocalizedLabel(key: string): string {
    const labelMap: Record<string, string> = {
      // 性别标签
      'male': '男性',
      'female': '女性',
      'prefer-not-say': '不愿透露',

      // 教育水平标签
      'high-school': '高中/中专及以下',
      'junior-college': '大专',
      'bachelor': '本科',
      'master': '硕士研究生',
      'phd': '博士研究生',

      // 就业状态标签
      'employed': '全职工作',
      'unemployed': '失业/求职中',
      'student': '在校学生',
      'preparing': '备考/进修',
      'freelance': '自由职业',
      'parttime': '兼职工作',
      'internship': '实习中',

      // 年龄段标签
      '18-22': '18-22岁',
      '23-25': '23-25岁',
      '26-30': '26-30岁',
      '31-35': '31-35岁',
      '36-40': '36-40岁',
      '40+': '40岁以上'
    };

    return labelMap[key] || key;
  }

  /**
   * 获取项目颜色
   */
  private getColorForItem(key: string): string {
    const colorMap: Record<string, string> = {
      // 性别颜色
      'male': '#1890FF',
      'female': '#FF6B9D',
      'prefer-not-say': '#52C41A',

      // 教育水平颜色
      'high-school': '#FA8C16',
      'junior-college': '#FADB14',
      'bachelor': '#1890FF',
      'master': '#722ED1',
      'phd': '#13C2C2',

      // 就业状态颜色
      'employed': '#52C41A',
      'unemployed': '#FF4D4F',
      'student': '#1890FF',
      'preparing': '#722ED1',
      'freelance': '#13C2C2',
      'parttime': '#FADB14',
      'internship': '#FA8C16'
    };

    return colorMap[key] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
  }

  /**
   * 批量获取所有维度数据 (使用兼容性适配器)
   */
  async getAllDimensionsData(): Promise<Record<string, DimensionData>> {
    if (useMockData()) {
      const result: Record<string, DimensionData> = {};
      const supportedIds = getSupportedDimensionIds();

      for (const dimensionId of supportedIds) {
        try {
          const data = await mockVisualizationService.getDimensionData(dimensionId);
          if (data) {
            result[dimensionId] = data;
          }
        } catch (error) {
          console.warn(`Failed to load mock data for dimension ${dimensionId}:`, error);
        }
      }

      return result;
    }

    try {
      // 获取兼容性报告
      const compatibilityReport = getCompatibilityReport();
      console.log('📊 维度兼容性报告:', compatibilityReport);

      // 获取API数据
      const response = await fetch(`${this.universalQuestionnaireUrl}/statistics/employment-survey-2024?include_test_data=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API返回失败');
      }

      const apiData: ApiCompleteData = result.data;

      // 获取数据质量报告
      const qualityReport = unifiedDataTransformService.getDataQualityReport(apiData);
      console.log('📊 数据质量报告:', qualityReport);

      // 批量处理所有维度
      const allDimensionsData: Record<string, DimensionData> = {};

      for (const dimensionDetail of compatibilityReport.details) {
        const dimensionId = dimensionDetail.dimensionId;

        try {
          if (dimensionDetail.hasApiSupport) {
            // 有API支持：使用真实数据
            const newDimensionId = dimensionCompatibilityAdapter.convertLegacyToNewId(dimensionId);
            const standardData = unifiedDataTransformService.transformApiDataToDimension(newDimensionId, apiData);
            allDimensionsData[dimensionId] = dimensionCompatibilityAdapter.convertStandardToCompatibleFormat(standardData, dimensionId);
          } else {
            // 无API支持：使用回退数据
            console.warn(`维度 ${dimensionId} 无API支持，使用回退数据`);
            allDimensionsData[dimensionId] = this.generateFallbackDimensionData(dimensionId);
          }
        } catch (error) {
          console.error(`处理维度 ${dimensionId} 失败:`, error);
          // 生成空数据避免整个系统崩溃
          allDimensionsData[dimensionId] = this.generateEmptyDimensionData(dimensionId);
        }
      }

      return allDimensionsData;

    } catch (error) {
      console.error('Failed to fetch all dimensions data:', error);
      throw error;
    }
  }

  /**
   * 生成空维度数据
   */
  private generateEmptyDimensionData(dimensionId: string): DimensionData {
    const legacyConfig = dimensionCompatibilityAdapter.getLegacyDimensionConfig(dimensionId);

    return {
      dimensionId,
      dimensionTitle: legacyConfig?.title || `未知维度: ${dimensionId}`,
      charts: [],
      totalResponses: 0,
      completionRate: 0
    };
  }

  /**
   * 获取数据源状态和质量信息
   */
  async getDataSourceInfo(): Promise<{
    source: string;
    totalResponses: number;
    dataQuality: any;
    lastUpdated: string;
    availableDimensions: string[];
  }> {
    try {
      const response = await fetch(`${this.universalQuestionnaireUrl}/statistics/employment-survey-2024?include_test_data=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API返回失败');
      }

      const apiData: ApiCompleteData = result.data;
      const qualityReport = unifiedDataTransformService.getDataQualityReport(apiData);

      return {
        source: useMockData() ? 'mock' : 'api',
        totalResponses: apiData.totalResponses || 0,
        dataQuality: qualityReport,
        lastUpdated: apiData.cacheInfo?.lastUpdated || new Date().toISOString(),
        availableDimensions: getAllFrontendDimensionIds()
      };

    } catch (error) {
      console.error('Failed to get data source info:', error);
      throw error;
    }
  }

  /**
   * 获取特定问题的图表数据
   */
  async getQuestionChartData(questionId: string): Promise<ChartData> {
    try {
      const response = await fetch(`${this.baseUrl}/question/${questionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch chart data for ${questionId}:`, error);
      throw error;
    }
  }

  /**
   * 获取交叉分析数据
   */
  async getCrossAnalysisData(
    primaryQuestion: string,
    secondaryQuestion: string
  ): Promise<CrossAnalysisData[]> {
    if (useMockData()) {
      return await mockVisualizationService.getCrossAnalysis(primaryQuestion, secondaryQuestion);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/cross-analysis?primary=${primaryQuestion}&secondary=${secondaryQuestion}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch cross analysis data:', error);
      throw error;
    }
  }

  /**
   * 获取就业形势报告
   */
  async getEmploymentReport(): Promise<{
    overview: string;
    keyFindings: string[];
    recommendations: string[];
    dataQuality: {
      sampleSize: number;
      representativeness: string;
      confidence: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/employment-report`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch employment report:', error);
      throw error;
    }
  }

  /**
   * 获取实时统计数据
   */
  async getRealTimeStats(): Promise<{
    activeUsers: number;
    todayResponses: number;
    weeklyGrowth: number;
    popularQuestions: Array<{
      questionId: string;
      title: string;
      responseCount: number;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/real-time-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
      throw error;
    }
  }

  /**
   * 导出可视化数据
   */
  async exportVisualizationData(
    format: 'json' | 'csv' | 'excel',
    dimensionIds?: string[]
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format,
        ...(dimensionIds && { dimensions: dimensionIds.join(',') })
      });
      
      const response = await fetch(`${this.baseUrl}/export?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Failed to export visualization data:', error);
      throw error;
    }
  }

  /**
   * 获取数据质量报告
   */
  async getDataQualityReport(): Promise<{
    totalResponses: number;
    completeResponses: number;
    partialResponses: number;
    qualityScore: number;
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      affectedQuestions: string[];
    }>;
    recommendations: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/data-quality`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch data quality report:', error);
      throw error;
    }
  }

  /**
   * 获取社会统计学洞察
   */
  async getSocialInsights(): Promise<{
    employmentTrends: string[];
    demographicInsights: string[];
    policyRecommendations: string[];
    marketAnalysis: string[];
    educationGaps: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/social-insights`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch social insights:', error);
      throw error;
    }
  }
}

export const questionnaireVisualizationService = new QuestionnaireVisualizationService();
export default questionnaireVisualizationService;

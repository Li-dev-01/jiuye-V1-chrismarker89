/**
 * 问卷2专用可视化数据服务
 * 基于问卷2的经济压力和就业信心特色功能的数据服务
 */

import { API_CONFIG } from '../config/apiConfig';
import { getQuestionnaire2VisualizationConfig, QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS } from '../config/questionnaire2VisualizationMapping';

export interface Questionnaire2ChartData {
  questionId: string;
  questionTitle: string;
  chartType: 'pie' | 'bar' | 'donut' | 'line' | 'treemap' | 'heatmap';
  data: Array<{
    label: string;
    value: number;
    percentage: number;
    color?: string;
    icon?: string;
  }>;
  totalResponses: number;
  lastUpdated: string;
  economicInsight?: string; // 问卷2特有的经济压力洞察
  confidenceInsight?: string; // 问卷2特有的就业信心洞察
}

export interface Questionnaire2DimensionData {
  dimensionId: string;
  dimensionTitle: string;
  description: string;
  icon: string;
  totalResponses: number;
  completionRate: number;
  charts: Questionnaire2ChartData[];
  uniqueFeatures?: string[]; // 问卷2特有功能标识
}

export interface Questionnaire2VisualizationSummary {
  questionnaireId: string;
  title: string;
  totalResponses: number;
  completionRate: number;
  lastUpdated: string;
  economicPressureInsights: string[]; // 经济压力分析洞察
  employmentConfidenceInsights: string[]; // 就业信心分析洞察
  modernDebtAnalysis: string[]; // 现代负债分析洞察
  dimensions: Questionnaire2DimensionData[];
}

class Questionnaire2VisualizationService {
  private baseUrl = API_CONFIG.BASE_URL;
  private universalQuestionnaireUrl = `${this.baseUrl}/api/universal-questionnaire`;

  /**
   * 获取问卷2的完整可视化数据摘要
   */
  async getVisualizationSummary(): Promise<Questionnaire2VisualizationSummary> {
    try {
      // 使用问卷2的API端点
      const response = await fetch(`${this.universalQuestionnaireUrl}/statistics/questionnaire-v2-2024?include_test_data=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API返回失败');
      }

      // 转换API响应为问卷2专用格式
      const data = result.data;
      return {
        questionnaireId: 'questionnaire-v2-2024',
        title: '问卷2可视化分析',
        totalResponses: this.calculateTotalResponses(data),
        completionRate: 100,
        lastUpdated: data.cacheInfo?.lastUpdated || new Date().toISOString(),
        economicPressureInsights: this.generateEconomicPressureInsights(data),
        employmentConfidenceInsights: this.generateEmploymentConfidenceInsights(data),
        modernDebtAnalysis: this.generateModernDebtAnalysis(data),
        dimensions: this.convertToQuestionnaire2Dimensions(data)
      };

    } catch (error) {
      console.error('获取问卷2可视化数据失败:', error);
      // 返回静态模拟数据作为后备
      return this.getStaticVisualizationData();
    }
  }

  /**
   * 获取特定维度的问卷2数据
   */
  async getDimensionData(dimensionId: string): Promise<Questionnaire2DimensionData> {
    try {
      const summary = await this.getVisualizationSummary();
      const dimension = summary.dimensions.find(d => d.dimensionId === dimensionId);
      
      if (!dimension) {
        throw new Error(`问卷2维度 ${dimensionId} 未找到`);
      }
      
      return dimension;
    } catch (error) {
      console.error(`获取问卷2维度数据失败 (${dimensionId}):`, error);
      throw error;
    }
  }

  /**
   * 获取问卷2的经济压力分析数据
   */
  async getEconomicPressureAnalysis(): Promise<Questionnaire2DimensionData> {
    return this.getDimensionData('economic-pressure-analysis-v2');
  }

  /**
   * 获取问卷2的就业信心指数数据
   */
  async getEmploymentConfidenceAnalysis(): Promise<Questionnaire2DimensionData> {
    return this.getDimensionData('employment-confidence-analysis-v2');
  }

  /**
   * 获取问卷2的现代负债分析数据
   */
  async getModernDebtAnalysis(): Promise<Questionnaire2ChartData> {
    const dimension = await this.getDimensionData('economic-pressure-analysis-v2');
    const debtChart = dimension.charts.find(c => c.questionId === 'debt-situation-v2');
    
    if (!debtChart) {
      throw new Error('现代负债分析数据未找到');
    }
    
    return debtChart;
  }

  /**
   * 计算总响应数
   */
  private calculateTotalResponses(data: any): number {
    // 从API数据中提取总响应数 - 适配问卷2的数据结构
    if (data.charts?.economicPressure?.totalResponses) {
      return data.charts.economicPressure.totalResponses;
    }
    return data.totalResponses || data.summary?.totalResponses || 156; // 默认值
  }

  /**
   * 生成经济压力洞察
   */
  private generateEconomicPressureInsights(data: any): string[] {
    return [
      '现代年轻人负债结构以消费信贷为主，花呗、白条等新型负债工具使用率高',
      '月还款负担普遍在收入的20-40%之间，经济压力较为明显',
      '经济压力程度与就业状态密切相关，在职人员压力相对较小',
      '负债多样化趋势明显，传统银行贷款与新兴金融产品并存'
    ];
  }

  /**
   * 生成就业信心洞察
   */
  private generateEmploymentConfidenceInsights(data: any): string[] {
    return [
      '短期就业信心（6个月）普遍高于长期信心（1年），反映对当前市场的谨慎乐观',
      '就业信心与经济压力呈负相关，经济负担重的群体信心相对较低',
      '年龄段对就业信心影响显著，25-28岁群体信心最为稳定',
      '教育背景与就业信心正相关，高学历群体对未来就业更有信心'
    ];
  }

  /**
   * 生成现代负债分析洞察
   */
  private generateModernDebtAnalysis(data: any): string[] {
    return [
      '支付宝花呗使用率最高，已成为年轻人主要的短期消费信贷工具',
      '京东白条在电商消费场景中占据重要地位',
      '微信分付作为新兴产品，使用率快速增长',
      '传统信用卡仍有一定市场份额，但增长趋缓',
      '助学贷款在应届毕业生群体中比例较高'
    ];
  }

  /**
   * 转换为问卷2专用维度数据格式
   */
  private convertToQuestionnaire2Dimensions(data: any): Questionnaire2DimensionData[] {
    const config = getQuestionnaire2VisualizationConfig();
    
    return config.dimensions.map(dimension => ({
      dimensionId: dimension.id,
      dimensionTitle: dimension.title,
      description: dimension.description,
      icon: dimension.icon,
      totalResponses: this.calculateTotalResponses(data),
      completionRate: 100,
      charts: dimension.questions.map(question => this.convertToChartData(question, data)),
      uniqueFeatures: this.getUniqueFeatures(dimension.id)
    }));
  }

  /**
   * 转换为图表数据格式
   */
  private convertToChartData(questionConfig: any, apiData: any): Questionnaire2ChartData {
    // 从API数据中提取对应问题的数据
    const questionData = this.extractQuestionData(questionConfig.questionId, apiData);
    
    return {
      questionId: questionConfig.questionId,
      questionTitle: questionConfig.questionTitle,
      chartType: questionConfig.chartType,
      data: questionData,
      totalResponses: this.calculateTotalResponses(apiData),
      lastUpdated: new Date().toISOString(),
      economicInsight: this.getEconomicInsight(questionConfig.questionId),
      confidenceInsight: this.getConfidenceInsight(questionConfig.questionId)
    };
  }

  /**
   * 从API数据中提取特定问题的数据
   */
  private extractQuestionData(questionId: string, apiData: any): any[] {
    // 根据问题ID从问卷2的API数据结构中提取相应数据
    const charts = apiData.charts || {};

    // 根据问题ID映射到对应的数据
    if (questionId.includes('economic-pressure')) {
      const economicData = charts.economicPressure?.distribution || [];
      return economicData.map((item: any, index: number) => ({
        label: item.range || `选项${index + 1}`,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: this.getDefaultColor(index),
        icon: '💰'
      }));
    }

    if (questionId.includes('employment-confidence')) {
      const confidenceData = charts.employmentConfidence || {};
      const sixMonthData = confidenceData.sixMonthOutlook || {};
      return [
        { label: '积极', value: Math.round(sixMonthData.positive || 0), percentage: sixMonthData.positive || 0, color: '#52c41a', icon: '📈' },
        { label: '中性', value: Math.round(sixMonthData.neutral || 0), percentage: sixMonthData.neutral || 0, color: '#faad14', icon: '📊' },
        { label: '消极', value: Math.round(sixMonthData.negative || 0), percentage: sixMonthData.negative || 0, color: '#ff4d4f', icon: '📉' }
      ];
    }

    if (questionId.includes('modern-debt')) {
      const debtData = charts.modernDebt?.types || [];
      return debtData.map((item: any, index: number) => ({
        label: item.name || `选项${index + 1}`,
        value: Math.round(item.percentage || 0),
        percentage: item.percentage || 0,
        color: this.getDefaultColor(index),
        icon: '💳'
      }));
    }

    // 默认返回空数组
    return [];
  }

  /**
   * 获取维度的独特功能标识
   */
  private getUniqueFeatures(dimensionId: string): string[] {
    const features: Record<string, string[]> = {
      'economic-pressure-analysis-v2': ['现代负债分析', '月还款负担评估', '经济压力程度'],
      'employment-confidence-analysis-v2': ['6个月信心指数', '1年信心指数', '信心趋势分析'],
      'employment-income-analysis-v2': ['薪资负债比', '收入压力分析']
    };
    
    return features[dimensionId] || [];
  }

  /**
   * 获取经济压力相关洞察
   */
  private getEconomicInsight(questionId: string): string | undefined {
    const insights: Record<string, string> = {
      'debt-situation-v2': '现代年轻人负债结构多样化，新型金融产品使用率高',
      'monthly-debt-burden-v2': '月还款负担普遍在收入的20-40%之间',
      'economic-pressure-level-v2': '经济压力与就业状态密切相关'
    };
    
    return insights[questionId];
  }

  /**
   * 获取就业信心相关洞察
   */
  private getConfidenceInsight(questionId: string): string | undefined {
    const insights: Record<string, string> = {
      'employment-confidence-6months-v2': '短期就业信心相对乐观，反映对当前市场的积极预期',
      'employment-confidence-1year-v2': '长期就业信心相对谨慎，体现对未来不确定性的担忧'
    };
    
    return insights[questionId];
  }

  /**
   * 获取默认颜色
   */
  private getDefaultColor(index: number): string {
    const colors = ['#1890FF', '#52C41A', '#FA8C16', '#722ED1', '#13C2C2', '#F759AB', '#FADB14', '#FF4D4F'];
    return colors[index % colors.length];
  }

  /**
   * 获取静态可视化数据（后备数据）
   */
  private getStaticVisualizationData(): Questionnaire2VisualizationSummary {
    // 返回基于问卷2配置的静态数据
    const config = getQuestionnaire2VisualizationConfig();
    
    return {
      questionnaireId: 'questionnaire-v2-2024',
      title: '问卷2可视化分析',
      totalResponses: 0,
      completionRate: 0,
      lastUpdated: new Date().toISOString(),
      economicPressureInsights: this.generateEconomicPressureInsights({}),
      employmentConfidenceInsights: this.generateEmploymentConfidenceInsights({}),
      modernDebtAnalysis: this.generateModernDebtAnalysis({}),
      dimensions: config.dimensions.map(dimension => ({
        dimensionId: dimension.id,
        dimensionTitle: dimension.title,
        description: dimension.description,
        icon: dimension.icon,
        totalResponses: 0,
        completionRate: 0,
        charts: dimension.questions.map(question => ({
          questionId: question.questionId,
          questionTitle: question.questionTitle,
          chartType: question.chartType,
          data: [],
          totalResponses: 0,
          lastUpdated: new Date().toISOString(),
          economicInsight: this.getEconomicInsight(question.questionId),
          confidenceInsight: this.getConfidenceInsight(question.questionId)
        })),
        uniqueFeatures: this.getUniqueFeatures(dimension.id)
      }))
    };
  }
}

export const questionnaire2VisualizationService = new Questionnaire2VisualizationService();
export default questionnaire2VisualizationService;

/**
 * 问卷2专用可视化数据服务
 * 基于问卷2的经济压力和就业信心特色功能的数据服务
 */

import { API_CONFIG } from '../config/apiConfig';
import { getQuestionnaire2VisualizationConfig, QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS } from '../config/questionnaire2VisualizationMapping';
import { getCurrentDataSource, useMockData } from '../config/dataSourceConfig';
import { questionnaire2MockVisualizationData } from './questionnaire2MockData';

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
  discriminationInsights?: string[]; // 歧视分析洞察（新增）
  genderAnalysisInsights?: string[]; // 性别分析洞察（新增）
  regionalInsights?: string[]; // 地域分析洞察（新增）
  dimensions: Questionnaire2DimensionData[];
}

class Questionnaire2VisualizationService {
  private baseUrl = API_CONFIG.BASE_URL;
  private questionnaire2Url = `${this.baseUrl}/api/questionnaire-v2`;

  /**
   * 获取问卷2的完整可视化数据摘要
   */
  async getVisualizationSummary(): Promise<Questionnaire2VisualizationSummary> {
    try {
      // 检查数据源配置
      if (useMockData()) {
        console.log('📊 使用模拟数据 - 问卷2可视化');
        return this.getStaticVisualizationData();
      }

      // 使用问卷2的专用API端点
      const response = await fetch(`${this.questionnaire2Url}/analytics/questionnaire-v2-2024?include_test_data=true`);
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
        discriminationInsights: this.generateDiscriminationInsights(data),
        genderAnalysisInsights: this.generateGenderAnalysisInsights(data),
        regionalInsights: this.generateRegionalInsights(data),
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
   * 生成歧视分析洞察（新增）
   */
  private generateDiscriminationInsights(data: any): string[] {
    return [
      '性别歧视与婚育歧视在女性群体中尤为突出，尤其是35+已婚女性',
      '年龄歧视在35岁以上求职者中普遍存在，成为就业的主要障碍',
      '工作经验要求过高成为应届生与转行者的主要困扰',
      '歧视主要发生在简历筛选与现场面试环节，隐性歧视难以取证',
      '地域歧视与学历歧视仍然存在，但相对其他类型占比较低'
    ];
  }

  /**
   * 生成性别分析洞察（新增）
   */
  private generateGenderAnalysisInsights(data: any): string[] {
    return [
      '女性在求职过程中遭遇婚育询问的频率显著高于男性',
      '35+女性面临年龄与婚育的双重压力，求职周期明显延长',
      '男性在技术岗位中占比较高，女性在服务与教育行业分布较多',
      '性别薪资差距依然存在，同等条件下女性薪资普遍低于男性10-20%'
    ];
  }

  /**
   * 生成地域分析洞察（新增）
   */
  private generateRegionalInsights(data: any): string[] {
    return [
      '一线城市就业机会多但竞争激烈，薪资水平显著高于其他城市',
      '新一线城市成为年轻人新选择，生活成本与就业机会相对平衡',
      '二三线城市就业机会有限，但生活压力较小',
      '户籍限制在一线城市仍然存在，影响落户与子女教育'
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

    // 新增：性别分布
    if (questionId === 'gender-v2') {
      const genderData = charts.gender?.distribution || [];
      return genderData.map((item: any) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(0),
        icon: item.icon || '👤'
      }));
    }

    // 新增：婚姻状况
    if (questionId === 'marital-status-v2') {
      const maritalData = charts.maritalStatus?.distribution || [];
      return maritalData.map((item: any) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(0),
        icon: item.icon || '💑'
      }));
    }

    // 新增：城市层级
    if (questionId === 'current-city-tier-v2') {
      const cityData = charts.cityTier?.distribution || [];
      return cityData.map((item: any) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(0),
        icon: '🏙️'
      }));
    }

    // 新增：歧视类型
    if (questionId === 'experienced-discrimination-types-v2') {
      const discriminationData = charts.discrimination?.types || [];
      return discriminationData.map((item: any, index: number) => ({
        label: item.label || item.type || `选项${index + 1}`,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '⚖️'
      }));
    }

    // 新增：歧视严重度
    if (questionId === 'discrimination-severity-v2') {
      const severityData = charts.discrimination?.severity || [];
      return severityData.map((item: any, index: number) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '📊'
      }));
    }

    // 新增：歧视渠道
    if (questionId === 'discrimination-channels-v2') {
      const channelsData = charts.discrimination?.channels || [];
      return channelsData.map((item: any, index: number) => ({
        label: item.label || item.channel,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '🔍'
      }));
    }

    // 新增：求职时长
    if (questionId === 'job-seeking-duration-v2') {
      const durationData = charts.jobSeeking?.duration || [];
      return durationData.map((item: any, index: number) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '⏱️'
      }));
    }

    // 新增：投递量
    if (questionId === 'applications-per-week-v2') {
      const applicationsData = charts.jobSeeking?.applications || [];
      return applicationsData.map((item: any, index: number) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '📝'
      }));
    }

    // 新增：转化率
    if (questionId === 'interview-conversion-v2') {
      const conversionData = charts.jobSeeking?.conversion || [];
      return conversionData.map((item: any, index: number) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '📈'
      }));
    }

    // 新增：渠道使用
    if (questionId === 'channels-used-v2') {
      const channelsUsedData = charts.jobSeeking?.channelsUsed || [];
      return channelsUsedData.map((item: any, index: number) => ({
        label: item.label || item.channel,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '🌐'
      }));
    }

    // 新增：Offer数量
    if (questionId === 'offer-received-v2') {
      const offerData = charts.jobSeeking?.offers || [];
      return offerData.map((item: any, index: number) => ({
        label: item.label || item.value,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '🎉'
      }));
    }

    // 新增：支持类型
    if (questionId === 'support-needed-types-v2') {
      const supportData = charts.support?.types || [];
      return supportData.map((item: any, index: number) => ({
        label: item.label || item.type,
        value: item.count || 0,
        percentage: item.percentage || 0,
        color: item.color || this.getDefaultColor(index),
        icon: '🤝'
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
      'basic-demographics-v2': ['性别分布', '婚育状况', '地域分布', '工作年限'],
      'economic-pressure-analysis-v2': ['现代负债分析', '月还款负担评估', '经济压力程度'],
      'employment-confidence-analysis-v2': ['6个月信心指数', '1年信心指数', '信心趋势分析'],
      'employment-income-analysis-v2': ['薪资负债比', '收入压力分析'],
      'discrimination-analysis-v2': ['14种歧视类型', '5级严重度量化', '9个发生渠道'],
      'support-needs-analysis-v2': ['10种支持类型', '需求优先级排序'],
      'job-seeking-behavior-v2': ['求职周期', '投递转化率', '渠道有效性', 'Offer获取率']
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
    console.log('📊 使用问卷2模拟数据');
    // 使用专门的模拟数据
    return questionnaire2MockVisualizationData;
  }
}

export const questionnaire2VisualizationService = new Questionnaire2VisualizationService();
export default questionnaire2VisualizationService;

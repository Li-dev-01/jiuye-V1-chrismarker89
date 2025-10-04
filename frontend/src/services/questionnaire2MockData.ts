/**
 * 问卷2专用静态模拟数据
 * 基于问卷2的经济压力和就业信心特色功能的模拟数据
 */

import type { 
  Questionnaire2VisualizationSummary, 
  Questionnaire2DimensionData, 
  Questionnaire2ChartData 
} from './questionnaire2VisualizationService';

/**
 * 生成模拟数据点
 */
function generateMockDataPoints(labels: string[], baseCount: number = 100): Array<{
  label: string;
  value: number;
  percentage: number;
  color: string;
}> {
  const colors = ['#1890FF', '#52C41A', '#FA8C16', '#722ED1', '#13C2C2', '#F759AB', '#FADB14', '#FF4D4F'];
  const total = labels.length * baseCount;
  
  return labels.map((label, index) => {
    const value = Math.floor(Math.random() * baseCount * 0.8) + baseCount * 0.2;
    return {
      label,
      value,
      percentage: Math.round((value / total) * 100 * 10) / 10,
      color: colors[index % colors.length]
    };
  });
}

/**
 * 基础人口统计数据（问卷2版本）
 */
const basicDemographicsV2Data: Questionnaire2DimensionData = {
  dimensionId: 'basic-demographics-v2',
  dimensionTitle: '基础人口统计',
  description: '问卷2参与者的基本信息分布',
  icon: '👥',
  totalResponses: 342,
  completionRate: 94.2,
  charts: [
    {
      questionId: 'age-range-v2',
      questionTitle: '年龄段分布',
      chartType: 'bar',
      data: generateMockDataPoints([
        '20岁以下',
        '20-22岁（在校大学生为主）',
        '23-25岁（应届毕业生为主）',
        '26-28岁（职场新人为主）',
        '29-35岁（职场中坚为主）',
        '35岁以上（职场资深为主）'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      economicInsight: '年龄结构影响经济压力感知，25-28岁群体面临最大经济压力'
    },
    {
      questionId: 'education-level-v2',
      questionTitle: '学历分布',
      chartType: 'donut',
      data: generateMockDataPoints([
        '高中/中专',
        '专科',
        '本科',
        '硕士研究生',
        '博士研究生'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      economicInsight: '高学历群体负债结构更复杂，但收入预期更高'
    }
  ],
  uniqueFeatures: ['年龄段细分', '教育背景分析']
};

/**
 * 经济压力分析数据（问卷2核心特色）
 */
const economicPressureAnalysisV2Data: Questionnaire2DimensionData = {
  dimensionId: 'economic-pressure-analysis-v2',
  dimensionTitle: '经济压力分析',
  description: '问卷2的核心特色：经济压力状况分析',
  icon: '💰',
  totalResponses: 342,
  completionRate: 91.8,
  charts: [
    {
      questionId: 'debt-situation-v2',
      questionTitle: '负债情况分布',
      chartType: 'bar',
      data: [
        { label: '支付宝花呗', value: 198, percentage: 57.9, color: '#1890FF' },
        { label: '信用卡账单', value: 156, percentage: 45.6, color: '#52C41A' },
        { label: '京东白条', value: 134, percentage: 39.2, color: '#FA8C16' },
        { label: '助学贷款', value: 89, percentage: 26.0, color: '#722ED1' },
        { label: '微信分付', value: 76, percentage: 22.2, color: '#13C2C2' },
        { label: '其他消费贷款', value: 45, percentage: 13.2, color: '#F759AB' },
        { label: '房贷', value: 23, percentage: 6.7, color: '#FADB14' },
        { label: '车贷', value: 12, percentage: 3.5, color: '#FF4D4F' },
        { label: '无负债', value: 67, percentage: 19.6, color: '#8C8C8C' }
      ],
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      economicInsight: '现代年轻人负债结构以消费信贷为主，花呗使用率最高达57.9%',
      confidenceInsight: '负债多样化与就业压力正相关，影响就业选择'
    },
    {
      questionId: 'monthly-debt-burden-v2',
      questionTitle: '月还款负担分布',
      chartType: 'pie',
      data: generateMockDataPoints([
        '无还款压力',
        '500元以下',
        '500-1000元',
        '1000-2000元',
        '2000-3000元',
        '3000-5000元',
        '5000元以上'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      economicInsight: '月还款负担普遍在1000-3000元区间，占收入比例较高',
      confidenceInsight: '还款压力直接影响就业稳定性需求'
    },
    {
      questionId: 'economic-pressure-level-v2',
      questionTitle: '经济压力程度',
      chartType: 'bar',
      data: generateMockDataPoints([
        '无压力',
        '轻微压力',
        '中等压力',
        '较大压力',
        '极大压力'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      economicInsight: '超过60%的受访者感受到中等以上经济压力',
      confidenceInsight: '经济压力与就业信心呈显著负相关'
    }
  ],
  uniqueFeatures: ['现代负债分析', '月还款负担评估', '经济压力程度']
};

/**
 * 就业信心指数分析（问卷2核心特色）
 */
const employmentConfidenceAnalysisV2Data: Questionnaire2DimensionData = {
  dimensionId: 'employment-confidence-analysis-v2',
  dimensionTitle: '就业信心指数',
  description: '问卷2的核心特色：就业信心评估',
  icon: '📈',
  totalResponses: 342,
  completionRate: 89.5,
  charts: [
    {
      questionId: 'employment-confidence-6months-v2',
      questionTitle: '6个月就业前景信心',
      chartType: 'bar',
      data: generateMockDataPoints([
        '非常有信心',
        '比较有信心',
        '一般',
        '不太有信心',
        '完全没信心'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      confidenceInsight: '短期就业信心相对乐观，68%的受访者对6个月内就业前景持积极态度',
      economicInsight: '短期信心与当前经济状况关联度较高'
    },
    {
      questionId: 'employment-confidence-1year-v2',
      questionTitle: '1年就业前景信心',
      chartType: 'bar',
      data: generateMockDataPoints([
        '非常有信心',
        '比较有信心',
        '一般',
        '不太有信心',
        '完全没信心'
      ]),
      totalResponses: 342,
      lastUpdated: new Date().toISOString(),
      confidenceInsight: '长期就业信心相对谨慎，反映对未来不确定性的担忧',
      economicInsight: '长期信心与经济压力承受能力密切相关'
    }
  ],
  uniqueFeatures: ['6个月信心指数', '1年信心指数', '信心趋势分析']
};

/**
 * 收入与工作分析（条件性章节）
 */
const employmentIncomeAnalysisV2Data: Questionnaire2DimensionData = {
  dimensionId: 'employment-income-analysis-v2',
  dimensionTitle: '收入与工作分析',
  description: '在职人员的收入状况分析',
  icon: '💵',
  totalResponses: 156, // 仅全职工作者
  completionRate: 100,
  charts: [
    {
      questionId: 'current-salary-v2',
      questionTitle: '月薪分布',
      chartType: 'bar',
      data: generateMockDataPoints([
        '3000元以下',
        '3000-5000元',
        '5000-8000元',
        '8000-12000元',
        '12000-20000元',
        '20000-30000元',
        '30000-50000元',
        '50000元以上'
      ]),
      totalResponses: 156,
      lastUpdated: new Date().toISOString(),
      economicInsight: '薪资主要集中在5000-12000元区间，与负债压力形成对比',
      confidenceInsight: '薪资水平直接影响就业稳定性和信心'
    },
    {
      questionId: 'salary-debt-ratio-v2',
      questionTitle: '收入负债比',
      chartType: 'pie',
      data: generateMockDataPoints([
        '10%以下',
        '10-20%',
        '20-30%',
        '30-40%',
        '40-50%',
        '50%以上'
      ]),
      totalResponses: 156,
      lastUpdated: new Date().toISOString(),
      economicInsight: '超过40%的在职人员月还款占收入比例超过30%，经济压力明显',
      confidenceInsight: '高负债比例群体对就业稳定性要求更高'
    }
  ],
  uniqueFeatures: ['薪资负债比', '收入压力分析']
};

/**
 * 问卷2完整模拟数据
 */
export const questionnaire2MockVisualizationData: Questionnaire2VisualizationSummary = {
  questionnaireId: 'questionnaire-v2-2024',
  title: '问卷2可视化分析',
  totalResponses: 342,
  completionRate: 91.2,
  lastUpdated: new Date().toISOString(),
  economicPressureInsights: [
    '现代年轻人负债结构以消费信贷为主，花呗、白条等新型负债工具使用率高达57.9%',
    '月还款负担普遍在收入的20-40%之间，经济压力较为明显',
    '经济压力程度与就业状态密切相关，在职人员压力相对较小但仍显著',
    '负债多样化趋势明显，传统银行贷款与新兴金融产品并存',
    '超过60%的受访者感受到中等以上经济压力，影响生活质量和就业选择'
  ],
  employmentConfidenceInsights: [
    '短期就业信心（6个月）普遍高于长期信心（1年），反映对当前市场的谨慎乐观',
    '就业信心与经济压力呈负相关，经济负担重的群体信心相对较低',
    '年龄段对就业信心影响显著，25-28岁群体信心最为稳定',
    '教育背景与就业信心正相关，高学历群体对未来就业更有信心',
    '68%的受访者对6个月内就业前景持积极态度，但长期信心相对谨慎'
  ],
  modernDebtAnalysis: [
    '支付宝花呗使用率最高（57.9%），已成为年轻人主要的短期消费信贷工具',
    '京东白条在电商消费场景中占据重要地位（39.2%）',
    '微信分付作为新兴产品，使用率快速增长（22.2%）',
    '传统信用卡仍有一定市场份额（45.6%），但增长趋缓',
    '助学贷款在应届毕业生群体中比例较高（26.0%）',
    '仍有19.6%的受访者无任何负债，主要为学生群体'
  ],
  dimensions: [
    basicDemographicsV2Data,
    economicPressureAnalysisV2Data,
    employmentConfidenceAnalysisV2Data,
    employmentIncomeAnalysisV2Data
  ]
};

/**
 * 问卷2模拟数据服务
 */
export class Questionnaire2MockVisualizationService {
  /**
   * 获取完整的问卷2可视化数据
   */
  async getSummary(): Promise<Questionnaire2VisualizationSummary> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    return questionnaire2MockVisualizationData;
  }

  /**
   * 获取特定维度数据
   */
  async getDimensionData(dimensionId: string): Promise<Questionnaire2DimensionData | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dimension = questionnaire2MockVisualizationData.dimensions.find(
      d => d.dimensionId === dimensionId
    );
    
    return dimension || null;
  }

  /**
   * 获取经济压力分析数据
   */
  async getEconomicPressureAnalysis(): Promise<Questionnaire2DimensionData> {
    return this.getDimensionData('economic-pressure-analysis-v2') as Promise<Questionnaire2DimensionData>;
  }

  /**
   * 获取就业信心分析数据
   */
  async getEmploymentConfidenceAnalysis(): Promise<Questionnaire2DimensionData> {
    return this.getDimensionData('employment-confidence-analysis-v2') as Promise<Questionnaire2DimensionData>;
  }

  /**
   * 获取收入分析数据
   */
  async getIncomeAnalysis(): Promise<Questionnaire2DimensionData> {
    return this.getDimensionData('employment-income-analysis-v2') as Promise<Questionnaire2DimensionData>;
  }
}

export const questionnaire2MockVisualizationService = new Questionnaire2MockVisualizationService();

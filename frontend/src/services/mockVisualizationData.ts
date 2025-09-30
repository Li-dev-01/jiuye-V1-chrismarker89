/**
 * 模拟可视化数据服务
 * 提供基于真实问卷结构的模拟数据
 */

import type { 
  VisualizationSummary, 
  DimensionData, 
  ChartData, 
  VisualizationDataPoint,
  CrossAnalysisData 
} from './questionnaireVisualizationService';

// 生成随机数据点
const generateDataPoints = (labels: string[], total: number = 1000): VisualizationDataPoint[] => {
  const points: VisualizationDataPoint[] = [];
  let remaining = total;
  
  labels.forEach((label, index) => {
    const isLast = index === labels.length - 1;
    const value = isLast ? remaining : Math.floor(Math.random() * (remaining / (labels.length - index))) + 1;
    remaining -= value;
    
    points.push({
      label,
      value,
      percentage: Math.round((value / total) * 100),
      color: `hsl(${(index * 360) / labels.length}, 70%, 50%)`
    });
  });
  
  return points;
};

// 就业形势总览模拟数据
const employmentOverviewData: DimensionData = {
  dimensionId: 'employment-overview',
  dimensionTitle: '就业形势总览',
  totalResponses: 1247,
  completionRate: 89.3,
  charts: [
    {
      questionId: 'current-status',
      questionTitle: '当前就业状态分布',
      chartType: 'donut',
      data: generateDataPoints(['全职工作', '实习中', '求职中', '继续深造', '自由职业', '暂不就业']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '全职就业率达到45.2%，继续深造比例为28.1%，整体就业形势稳定'
    },
    {
      questionId: 'employment-difficulty-perception',
      questionTitle: '就业难度感知',
      chartType: 'bar',
      data: generateDataPoints(['非常困难', '比较困难', '一般', '比较容易', '非常容易']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '67.8%的受访者认为就业有一定难度，反映当前就业市场竞争激烈'
    },
    {
      questionId: 'peer-employment-rate',
      questionTitle: '同龄人就业率观察',
      chartType: 'bar',
      data: generateDataPoints(['0-20%', '21-40%', '41-60%', '61-80%', '81-100%']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '大多数受访者观察到同龄人就业率在60%以上，显示整体就业环境向好'
    },
    {
      questionId: 'salary-level-perception',
      questionTitle: '薪资水平感知',
      chartType: 'bar',
      data: generateDataPoints(['远低于预期', '低于预期', '符合预期', '高于预期', '远高于预期']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '52.3%的受访者认为薪资符合或高于预期，就业质量有所提升'
    }
  ]
};

// 人口结构分析模拟数据
const demographicsData: DimensionData = {
  dimensionId: 'demographics',
  dimensionTitle: '人口结构分析',
  totalResponses: 1247,
  completionRate: 92.1,
  charts: [
    {
      questionId: 'age-range',
      questionTitle: '年龄段分布',
      chartType: 'pie',
      data: generateDataPoints(['18-20岁', '21-23岁', '24-26岁', '27-29岁', '30岁以上']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '主要集中在21-26岁年龄段，符合大学毕业生就业群体特征'
    },
    {
      questionId: 'gender',
      questionTitle: '性别分布',
      chartType: 'donut',
      data: generateDataPoints(['男性', '女性', '其他']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '性别分布相对均衡，女性参与度略高，反映女性对就业问题的关注'
    },
    {
      questionId: 'education-level',
      questionTitle: '学历结构',
      chartType: 'bar',
      data: generateDataPoints(['专科', '本科', '硕士', '博士']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '本科学历占主体，硕士学历比例逐年上升，教育水平持续提高'
    },
    {
      questionId: 'major-field',
      questionTitle: '专业分布',
      chartType: 'treemap',
      data: generateDataPoints(['工学', '管理学', '经济学', '文学', '理学', '法学', '教育学', '艺术学']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '工学和管理学专业占比较高，与当前产业结构和就业需求相匹配'
    }
  ]
};

// 就业市场深度分析模拟数据
const employmentMarketData: DimensionData = {
  dimensionId: 'employment-market',
  dimensionTitle: '就业市场深度分析',
  totalResponses: 1247,
  completionRate: 85.7,
  charts: [
    {
      questionId: 'work-industry',
      questionTitle: '行业就业分布',
      chartType: 'treemap',
      data: generateDataPoints(['互联网/科技', '金融', '教育', '制造业', '医疗健康', '政府/事业单位', '咨询服务', '其他']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '互联网科技和金融行业吸纳就业最多，新兴产业成为就业增长点'
    },
    {
      questionId: 'current-salary',
      questionTitle: '薪资水平分布',
      chartType: 'bar',
      data: generateDataPoints(['3000以下', '3000-5000', '5000-8000', '8000-12000', '12000-20000', '20000以上']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '薪资主要集中在5000-12000元区间，高薪岗位竞争激烈'
    }
  ]
};

// 学生就业准备模拟数据
const studentPreparationData: DimensionData = {
  dimensionId: 'student-preparation',
  dimensionTitle: '学生就业准备',
  totalResponses: 1247,
  completionRate: 87.5,
  charts: [
    {
      questionId: 'internship-experience',
      questionTitle: '实习经验分析',
      chartType: 'bar',
      data: generateDataPoints(['无实习经验', '1次实习', '2-3次实习', '4次以上实习']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '78.5%的学生有实习经验，实习对就业帮助显著'
    },
    {
      questionId: 'skill-preparation',
      questionTitle: '技能准备情况',
      chartType: 'bar',
      data: generateDataPoints(['准备不足', '基本准备', '准备充分', '准备很充分']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '技能准备充分的学生就业成功率明显更高'
    }
  ]
};

// 生活成本与压力模拟数据
const livingCostsData: DimensionData = {
  dimensionId: 'living-costs',
  dimensionTitle: '生活成本与压力',
  totalResponses: 1247,
  completionRate: 91.2,
  charts: [
    {
      questionId: 'monthly-housing-cost',
      questionTitle: '住房支出分析',
      chartType: 'bar',
      data: generateDataPoints(['2000元以下', '2000-4000元', '4000-6000元', '6000-8000元', '8000-12000元', '12000元以上']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '住房成本占收入比例过高，影响生活质量'
    },
    {
      questionId: 'financial-pressure',
      questionTitle: '经济压力感知',
      chartType: 'donut',
      data: generateDataPoints(['压力很大', '有一定压力', '压力适中', '压力较小', '无压力']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '经济压力是影响就业选择的重要因素'
    }
  ]
};

// 政策洞察与建议模拟数据
const policyInsightsData: DimensionData = {
  dimensionId: 'policy-insights',
  dimensionTitle: '政策洞察与建议',
  totalResponses: 1247,
  completionRate: 83.7,
  charts: [
    {
      questionId: 'employment-policy-effectiveness',
      questionTitle: '就业政策效果评估',
      chartType: 'bar',
      data: generateDataPoints(['效果很好', '效果较好', '效果一般', '效果较差', '效果很差']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '就业政策需要更贴近实际需求，提高针对性'
    },
    {
      questionId: 'training-needs',
      questionTitle: '教育培训需求分析',
      chartType: 'treemap',
      data: generateDataPoints(['技能培训', '职业规划', '面试指导', '创业培训', '心理辅导']),
      totalResponses: 1247,
      lastUpdated: new Date().toISOString(),
      socialInsight: '技能培训和职业规划是最迫切的需求'
    }
  ]
};

// 模拟可视化总览数据
export const mockVisualizationSummary: VisualizationSummary = {
  totalResponses: 1247,
  completionRate: 89.3,
  lastUpdated: new Date().toISOString(),
  keyInsights: [
    '全职就业率达到45.2%，就业形势总体稳定',
    '67.8%的受访者认为就业有一定难度',
    '互联网科技行业成为主要就业方向',
    '薪资水平主要集中在5000-12000元区间',
    '本科学历占主体，硕士学历比例上升',
    '78.5%的学生有实习经验，对就业帮助显著'
  ],
  dimensions: [
    employmentOverviewData,
    demographicsData,
    employmentMarketData,
    studentPreparationData,
    livingCostsData,
    policyInsightsData
  ]
};

// 模拟交叉分析数据
export const mockCrossAnalysisData: CrossAnalysisData[] = [
  {
    title: '学历与薪资关系分析',
    description: '不同学历层次的薪资分布情况',
    data: [
      {
        category: '专科',
        subcategories: [
          { name: '3000-5000', value: 45, percentage: 60 },
          { name: '5000-8000', value: 25, percentage: 33 },
          { name: '8000以上', value: 5, percentage: 7 }
        ]
      },
      {
        category: '本科',
        subcategories: [
          { name: '3000-5000', value: 180, percentage: 30 },
          { name: '5000-8000', value: 300, percentage: 50 },
          { name: '8000以上', value: 120, percentage: 20 }
        ]
      },
      {
        category: '硕士',
        subcategories: [
          { name: '5000-8000', value: 80, percentage: 40 },
          { name: '8000-12000', value: 90, percentage: 45 },
          { name: '12000以上', value: 30, percentage: 15 }
        ]
      }
    ]
  }
];

// 模拟数据服务类
export class MockVisualizationService {
  // 获取可视化总览
  async getSummary(): Promise<VisualizationSummary> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockVisualizationSummary;
  }

  // 获取维度数据
  async getDimensionData(dimensionId: string): Promise<DimensionData | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockVisualizationSummary.dimensions.find(d => d.dimensionId === dimensionId) || null;
  }

  // 获取交叉分析数据
  async getCrossAnalysis(analysis1: string, analysis2: string): Promise<CrossAnalysisData[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockCrossAnalysisData;
  }

  // 获取实时统计
  async getRealTimeStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      todayResponses: Math.floor(Math.random() * 100) + 20,
      systemLoad: Math.random() * 0.8 + 0.1
    };
  }

  // 获取数据质量报告
  async getDataQualityReport(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      completionRate: 89.3,
      validityScore: 94.7,
      consistencyScore: 91.2,
      lastValidation: new Date().toISOString()
    };
  }
}

export const mockVisualizationService = new MockVisualizationService();

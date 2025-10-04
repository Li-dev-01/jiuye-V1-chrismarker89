/**
 * 问卷2专用可视化数据映射配置
 * 基于问卷2的经济压力和就业信心问题建立的数据映射系统
 */

export interface QuestionVisualizationConfig {
  questionId: string;
  questionTitle: string;
  chartType: 'pie' | 'bar' | 'donut' | 'line' | 'treemap' | 'heatmap';
  category: string;
  description: string;
  options?: Array<{
    value: string;
    label: string;
    color?: string;
    icon?: string;
  }>;
}

export interface VisualizationDimension {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: QuestionVisualizationConfig[];
}

/**
 * 基于问卷2的6个核心可视化维度
 */
export const QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS: VisualizationDimension[] = [
  {
    id: 'basic-demographics-v2',
    title: '基础人口统计',
    description: '问卷2参与者的基本信息分布',
    icon: '👥',
    questions: [
      {
        questionId: 'age-range-v2',
        questionTitle: '年龄段分布',
        chartType: 'bar',
        category: 'demographics',
        description: '显示问卷2参与者的年龄构成',
        options: [
          { value: 'under-20', label: '20岁以下', color: '#1890FF' },
          { value: '20-22', label: '20-22岁（在校大学生为主）', color: '#52C41A' },
          { value: '23-25', label: '23-25岁（应届毕业生为主）', color: '#FA8C16' },
          { value: '26-28', label: '26-28岁（职场新人为主）', color: '#722ED1' },
          { value: '29-35', label: '29-35岁（职场中坚为主）', color: '#13C2C2' },
          { value: 'over-35', label: '35岁以上（职场资深为主）', color: '#F759AB' }
        ]
      },
      {
        questionId: 'education-level-v2',
        questionTitle: '学历分布',
        chartType: 'pie',
        category: 'demographics',
        description: '问卷2参与者的教育背景',
        options: [
          { value: 'high-school', label: '高中及以下', color: '#FF4D4F' },
          { value: 'vocational', label: '中专/技校', color: '#FA8C16' },
          { value: 'college', label: '大专', color: '#FADB14' },
          { value: 'bachelor', label: '本科', color: '#52C41A' },
          { value: 'master', label: '硕士研究生', color: '#1890FF' },
          { value: 'phd', label: '博士研究生', color: '#722ED1' }
        ]
      }
    ]
  },
  {
    id: 'current-status-analysis-v2',
    title: '当前状态分析',
    description: '问卷2参与者的就业状态分布',
    icon: '💼',
    questions: [
      {
        questionId: 'current-status-question-v2',
        questionTitle: '当前状态分布',
        chartType: 'donut',
        category: 'employment-status',
        description: '问卷2参与者的身份构成分析',
        options: [
          { value: 'fulltime', label: '全职工作', color: '#52C41A', icon: '💼' },
          { value: 'student', label: '在校学生', color: '#1890FF', icon: '🎓' },
          { value: 'unemployed', label: '待业/求职中', color: '#FA8C16', icon: '🔍' },
          { value: 'freelance', label: '自由职业', color: '#13C2C2', icon: '🎨' },
          { value: 'entrepreneur', label: '创业', color: '#722ED1', icon: '🚀' }
        ]
      }
    ]
  },
  {
    id: 'economic-pressure-analysis-v2',
    title: '经济压力分析',
    description: '问卷2的核心特色：经济压力状况分析',
    icon: '💰',
    questions: [
      {
        questionId: 'debt-situation-v2',
        questionTitle: '负债情况分布',
        chartType: 'bar',
        category: 'economic-pressure',
        description: '现代年轻人的负债类型分析（问卷2特色功能）',
        options: [
          { value: 'student-loan', label: '助学贷款', color: '#1890FF' },
          { value: 'alipay-huabei', label: '支付宝花呗', color: '#52C41A' },
          { value: 'credit-card', label: '信用卡账单', color: '#FA8C16' },
          { value: 'jd-baitiao', label: '京东白条', color: '#722ED1' },
          { value: 'wechat-pay-later', label: '微信分付', color: '#13C2C2' },
          { value: 'consumer-loan', label: '其他消费贷款', color: '#F759AB' },
          { value: 'mortgage', label: '房贷', color: '#FADB14' },
          { value: 'car-loan', label: '车贷', color: '#FF4D4F' },
          { value: 'no-debt', label: '目前没有任何负债', color: '#52C41A' }
        ]
      },
      {
        questionId: 'monthly-debt-burden-v2',
        questionTitle: '月还款负担分布',
        chartType: 'bar',
        category: 'economic-pressure',
        description: '每月还款金额分布（问卷2特色功能）',
        options: [
          { value: 'no-payment', label: '无需还款', color: '#52C41A' },
          { value: 'below-300', label: '300元以下', color: '#73D13D' },
          { value: '300-500', label: '300-500元', color: '#FADB14' },
          { value: '500-1000', label: '500-1000元', color: '#FA8C16' },
          { value: '1000-2000', label: '1000-2000元', color: '#FF7A45' },
          { value: '2000-3000', label: '2000-3000元', color: '#FF4D4F' },
          { value: '3000-5000', label: '3000-5000元', color: '#CF1322' },
          { value: 'above-5000', label: '5000元以上', color: '#A8071A' }
        ]
      },
      {
        questionId: 'economic-pressure-level-v2',
        questionTitle: '经济压力程度',
        chartType: 'pie',
        category: 'economic-pressure',
        description: '主观经济压力感受分析（问卷2特色功能）',
        options: [
          { value: 'no-pressure', label: '没有压力', color: '#52C41A' },
          { value: 'mild-pressure', label: '轻微压力', color: '#73D13D' },
          { value: 'moderate-pressure', label: '中等压力', color: '#FADB14' },
          { value: 'high-pressure', label: '较大压力', color: '#FA8C16' },
          { value: 'severe-pressure', label: '巨大压力', color: '#FF4D4F' }
        ]
      }
    ]
  },
  {
    id: 'employment-income-analysis-v2',
    title: '收入与工作分析',
    description: '在职人员的收入状况分析',
    icon: '💵',
    questions: [
      {
        questionId: 'current-salary-v2',
        questionTitle: '月薪分布',
        chartType: 'bar',
        category: 'income-analysis',
        description: '在职人员的薪资水平分布',
        options: [
          { value: 'below-3k', label: '3000元以下', color: '#FF4D4F' },
          { value: '3k-5k', label: '3000-5000元', color: '#FA8C16' },
          { value: '5k-8k', label: '5000-8000元', color: '#FADB14' },
          { value: '8k-12k', label: '8000-12000元', color: '#52C41A' },
          { value: '12k-20k', label: '12000-20000元', color: '#1890FF' },
          { value: '20k-30k', label: '20000-30000元', color: '#722ED1' },
          { value: '30k-50k', label: '30000-50000元', color: '#13C2C2' },
          { value: 'above-50k', label: '50000元以上', color: '#F759AB' }
        ]
      },
      {
        questionId: 'salary-debt-ratio-v2',
        questionTitle: '收入负债比',
        chartType: 'pie',
        category: 'income-analysis',
        description: '月还款占月收入比例分析',
        options: [
          { value: 'no-debt', label: '无债务负担', color: '#52C41A' },
          { value: 'below-10', label: '10%以下', color: '#73D13D' },
          { value: '10-20', label: '10%-20%', color: '#FADB14' },
          { value: '20-30', label: '20%-30%', color: '#FA8C16' },
          { value: '30-50', label: '30%-50%', color: '#FF7A45' },
          { value: 'above-50', label: '50%以上', color: '#FF4D4F' }
        ]
      }
    ]
  },
  {
    id: 'employment-confidence-analysis-v2',
    title: '就业信心指数',
    description: '问卷2特色：就业前景信心分析',
    icon: '📈',
    questions: [
      {
        questionId: 'employment-confidence-6months-v2',
        questionTitle: '6个月就业信心',
        chartType: 'bar',
        category: 'employment-confidence',
        description: '对未来6个月就业前景的信心程度',
        options: [
          { value: 'very-confident', label: '非常有信心', color: '#52C41A' },
          { value: 'confident', label: '比较有信心', color: '#73D13D' },
          { value: 'neutral', label: '一般', color: '#FADB14' },
          { value: 'worried', label: '比较担心', color: '#FA8C16' },
          { value: 'very-worried', label: '非常担心', color: '#FF4D4F' }
        ]
      },
      {
        questionId: 'employment-confidence-1year-v2',
        questionTitle: '1年就业信心',
        chartType: 'bar',
        category: 'employment-confidence',
        description: '对未来1年就业前景的信心程度',
        options: [
          { value: 'very-confident', label: '非常有信心', color: '#52C41A' },
          { value: 'confident', label: '比较有信心', color: '#73D13D' },
          { value: 'neutral', label: '一般', color: '#FADB14' },
          { value: 'worried', label: '比较担心', color: '#FA8C16' },
          { value: 'very-worried', label: '非常担心', color: '#FF4D4F' }
        ]
      }
    ]
  }
];

/**
 * 问卷2与问卷1的差异化特色
 */
export const QUESTIONNAIRE2_UNIQUE_FEATURES = {
  economicPressure: {
    title: '经济压力分析',
    description: '问卷2独有的现代负债类型分析',
    uniqueQuestions: [
      'debt-situation-v2',
      'monthly-debt-burden-v2', 
      'economic-pressure-level-v2'
    ]
  },
  employmentConfidence: {
    title: '就业信心指数',
    description: '问卷2独有的就业前景信心评估',
    uniqueQuestions: [
      'employment-confidence-6months-v2',
      'employment-confidence-1year-v2'
    ]
  },
  modernDebtTypes: {
    title: '现代负债类型',
    description: '包含花呗、白条、微信分付等新型消费信贷',
    modernOptions: [
      'alipay-huabei',
      'jd-baitiao', 
      'wechat-pay-later',
      'consumer-loan'
    ]
  }
};

/**
 * 获取问卷2专用的可视化配置
 */
export function getQuestionnaire2VisualizationConfig() {
  return {
    dimensions: QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS,
    uniqueFeatures: QUESTIONNAIRE2_UNIQUE_FEATURES,
    questionnaireId: 'questionnaire-v2-2024',
    title: '问卷2可视化分析',
    description: '基于经济压力和就业信心的智能问卷数据分析'
  };
}

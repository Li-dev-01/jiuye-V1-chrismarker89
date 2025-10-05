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
        questionId: 'gender-v2',
        questionTitle: '性别分布',
        chartType: 'pie',
        category: 'demographics',
        description: '问卷2参与者的性别构成',
        options: [
          { value: 'male', label: '男', color: '#1890FF', icon: '👨' },
          { value: 'female', label: '女', color: '#F759AB', icon: '👩' },
          { value: 'other', label: '其他', color: '#722ED1', icon: '🧑' },
          { value: 'prefer-not', label: '不愿透露', color: '#D9D9D9', icon: '🔒' }
        ]
      },
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
      },
      {
        questionId: 'marital-status-v2',
        questionTitle: '婚姻状况分布',
        chartType: 'pie',
        category: 'demographics',
        description: '问卷2参与者的婚姻状况',
        options: [
          { value: 'single', label: '未婚', color: '#1890FF' },
          { value: 'married', label: '已婚', color: '#52C41A' },
          { value: 'divorced', label: '离异', color: '#FA8C16' },
          { value: 'widowed', label: '丧偶', color: '#722ED1' },
          { value: 'prefer-not', label: '不愿透露', color: '#D9D9D9' }
        ]
      },
      {
        questionId: 'has-children-v2',
        questionTitle: '子女状况分布',
        chartType: 'pie',
        category: 'demographics',
        description: '问卷2参与者的子女状况',
        options: [
          { value: 'yes', label: '是', color: '#52C41A' },
          { value: 'no', label: '否', color: '#1890FF' },
          { value: 'prefer-not', label: '不愿透露', color: '#D9D9D9' }
        ]
      },
      {
        questionId: 'current-city-tier-v2',
        questionTitle: '城市层级分布',
        chartType: 'bar',
        category: 'demographics',
        description: '问卷2参与者所在城市层级',
        options: [
          { value: 'tier1', label: '一线城市', color: '#1890FF' },
          { value: 'new-tier1', label: '新一线城市', color: '#52C41A' },
          { value: 'tier2', label: '二线城市', color: '#FA8C16' },
          { value: 'tier3-4', label: '三四线城市', color: '#722ED1' },
          { value: 'county-town', label: '县城/乡镇', color: '#13C2C2' },
          { value: 'rural', label: '农村', color: '#F759AB' },
          { value: 'overseas', label: '海外', color: '#FADB14' }
        ]
      },
      {
        questionId: 'years-experience-v2',
        questionTitle: '工作年限分布',
        chartType: 'bar',
        category: 'demographics',
        description: '问卷2参与者的工作经验',
        options: [
          { value: 'none', label: '无工作经验', color: '#FF4D4F' },
          { value: 'less-1', label: '1年以下', color: '#FA8C16' },
          { value: '1-3', label: '1-3年', color: '#FADB14' },
          { value: '3-5', label: '3-5年', color: '#52C41A' },
          { value: '5-10', label: '5-10年', color: '#1890FF' },
          { value: 'over-10', label: '10年以上', color: '#722ED1' }
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
  },
  {
    id: 'discrimination-analysis-v2',
    title: '求职歧视分析',
    description: '问卷2特色：求职歧视类型、严重度与渠道分析',
    icon: '⚖️',
    questions: [
      {
        questionId: 'experienced-discrimination-types-v2',
        questionTitle: '歧视类型分布',
        chartType: 'bar',
        category: 'discrimination',
        description: '求职过程中经历或担忧的歧视类型统计',
        options: [
          { value: 'work-experience', label: '工作经验要求', color: '#1890FF' },
          { value: 'gender', label: '性别歧视', color: '#F759AB' },
          { value: 'marriage-fertility', label: '婚育状况歧视', color: '#FF4D4F' },
          { value: 'age', label: '年龄歧视', color: '#FA8C16' },
          { value: 'region', label: '地域歧视', color: '#722ED1' },
          { value: 'education-level', label: '学历歧视', color: '#13C2C2' },
          { value: 'school-tier', label: '学校层次歧视', color: '#FADB14' },
          { value: 'major', label: '专业歧视', color: '#52C41A' },
          { value: 'health', label: '健康状况歧视', color: '#FF7A45' },
          { value: 'appearance', label: '外貌歧视', color: '#F759AB' },
          { value: 'political-status', label: '政治面貌要求', color: '#722ED1' },
          { value: 'social-background', label: '家庭背景', color: '#13C2C2' },
          { value: 'other', label: '其他歧视', color: '#D9D9D9' },
          { value: 'none', label: '未经历歧视', color: '#52C41A' }
        ]
      },
      {
        questionId: 'discrimination-severity-v2',
        questionTitle: '歧视影响程度',
        chartType: 'bar',
        category: 'discrimination',
        description: '歧视对求职的影响程度分布',
        options: [
          { value: 'no-impact', label: '没有影响', color: '#52C41A' },
          { value: 'mild', label: '轻微影响', color: '#73D13D' },
          { value: 'moderate', label: '中等影响', color: '#FADB14' },
          { value: 'severe', label: '严重影响', color: '#FA8C16' },
          { value: 'very-severe', label: '极其严重', color: '#FF4D4F' }
        ]
      },
      {
        questionId: 'discrimination-channels-v2',
        questionTitle: '歧视发生渠道',
        chartType: 'bar',
        category: 'discrimination',
        description: '歧视主要发生在哪些环节',
        options: [
          { value: 'job-posting', label: '招聘广告', color: '#1890FF' },
          { value: 'online-platform', label: '在线平台筛选', color: '#52C41A' },
          { value: 'resume-screening', label: '简历筛选', color: '#FA8C16' },
          { value: 'phone-interview', label: '电话面试', color: '#722ED1' },
          { value: 'onsite-interview', label: '现场面试', color: '#13C2C2' },
          { value: 'background-check', label: '背景调查', color: '#F759AB' },
          { value: 'offer-stage', label: 'Offer阶段', color: '#FADB14' },
          { value: 'referral', label: '内推', color: '#FF7A45' },
          { value: 'other', label: '其他渠道', color: '#D9D9D9' }
        ]
      }
    ]
  },
  {
    id: 'support-needs-analysis-v2',
    title: '支持需求分析',
    description: '求职者期望得到的支持类型统计',
    icon: '🤝',
    questions: [
      {
        questionId: 'support-needed-types-v2',
        questionTitle: '期望支持类型',
        chartType: 'bar',
        category: 'support-needs',
        description: '求职者希望得到的支持类型分布',
        options: [
          { value: 'policy-support', label: '政策支持', color: '#1890FF' },
          { value: 'skill-training', label: '技能培训', color: '#52C41A' },
          { value: 'career-guidance', label: '职业规划', color: '#FA8C16' },
          { value: 'job-info', label: '招聘信息', color: '#722ED1' },
          { value: 'anti-discrimination', label: '反歧视保护', color: '#FF4D4F' },
          { value: 'mental-support', label: '心理支持', color: '#13C2C2' },
          { value: 'networking', label: '人脉资源', color: '#F759AB' },
          { value: 'flexible-work', label: '灵活就业', color: '#FADB14' },
          { value: 'fair-evaluation', label: '公平评估', color: '#FF7A45' },
          { value: 'other', label: '其他支持', color: '#D9D9D9' }
        ]
      }
    ]
  },
  {
    id: 'job-seeking-behavior-v2',
    title: '求职行为分析',
    description: '待业/求职群体的求职行为与渠道使用情况',
    icon: '🔍',
    questions: [
      {
        questionId: 'job-seeking-duration-v2',
        questionTitle: '求职时长分布',
        chartType: 'bar',
        category: 'job-seeking',
        description: '求职者已求职时长统计',
        options: [
          { value: 'less-1month', label: '不到1个月', color: '#52C41A' },
          { value: '1-3months', label: '1-3个月', color: '#73D13D' },
          { value: '3-6months', label: '3-6个月', color: '#FADB14' },
          { value: '6-12months', label: '6-12个月', color: '#FA8C16' },
          { value: 'over-1year', label: '超过1年', color: '#FF4D4F' }
        ]
      },
      {
        questionId: 'applications-per-week-v2',
        questionTitle: '每周投递量',
        chartType: 'bar',
        category: 'job-seeking',
        description: '求职者每周投递简历数量分布',
        options: [
          { value: 'less-5', label: '少于5份', color: '#FF4D4F' },
          { value: '5-10', label: '5-10份', color: '#FA8C16' },
          { value: '10-20', label: '10-20份', color: '#FADB14' },
          { value: '20-50', label: '20-50份', color: '#52C41A' },
          { value: 'over-50', label: '50份以上', color: '#1890FF' }
        ]
      },
      {
        questionId: 'interview-conversion-v2',
        questionTitle: '面试邀约率',
        chartType: 'bar',
        category: 'job-seeking',
        description: '简历投递后获得面试的比例',
        options: [
          { value: 'below-5', label: '低于5%', color: '#FF4D4F' },
          { value: '5-10', label: '5-10%', color: '#FA8C16' },
          { value: '10-20', label: '10-20%', color: '#FADB14' },
          { value: '20-30', label: '20-30%', color: '#52C41A' },
          { value: 'above-30', label: '30%以上', color: '#1890FF' }
        ]
      },
      {
        questionId: 'channels-used-v2',
        questionTitle: '求职渠道使用',
        chartType: 'bar',
        category: 'job-seeking',
        description: '求职者主要使用的求职渠道',
        options: [
          { value: 'boss', label: 'BOSS直聘', color: '#1890FF' },
          { value: 'zhaopin', label: '智联招聘', color: '#52C41A' },
          { value: '51job', label: '前程无忧', color: '#FA8C16' },
          { value: 'lagou', label: '拉勾网', color: '#722ED1' },
          { value: 'liepin', label: '猎聘', color: '#13C2C2' },
          { value: 'linkedin', label: 'LinkedIn', color: '#F759AB' },
          { value: 'company-website', label: '企业官网', color: '#FADB14' },
          { value: 'referral', label: '内推', color: '#FF7A45' },
          { value: 'campus', label: '校园招聘', color: '#52C41A' },
          { value: 'social-media', label: '社交媒体', color: '#1890FF' },
          { value: 'other', label: '其他渠道', color: '#D9D9D9' }
        ]
      },
      {
        questionId: 'offer-received-v2',
        questionTitle: 'Offer获取情况',
        chartType: 'bar',
        category: 'job-seeking',
        description: '求职者收到的offer数量',
        options: [
          { value: 'none', label: '0个', color: '#FF4D4F' },
          { value: '1', label: '1个', color: '#FA8C16' },
          { value: '2-3', label: '2-3个', color: '#FADB14' },
          { value: '4-5', label: '4-5个', color: '#52C41A' },
          { value: 'over-5', label: '5个以上', color: '#1890FF' }
        ]
      }
    ]
  }
];

/**
 * 问卷2与问卷1的差异化特色（v2.1.0 扩展）
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
  },
  discriminationAnalysis: {
    title: '求职歧视分析',
    description: '问卷2独有的求职歧视类型、严重度与渠道分析',
    uniqueQuestions: [
      'experienced-discrimination-types-v2',
      'discrimination-severity-v2',
      'discrimination-channels-v2'
    ],
    discriminationTypes: [
      'work-experience',
      'gender',
      'marriage-fertility',
      'age',
      'region',
      'education-level',
      'school-tier',
      'major',
      'health',
      'appearance',
      'political-status',
      'social-background'
    ]
  },
  genderAndMarriageAnalysis: {
    title: '性别与婚育分析',
    description: '问卷2独有的性别、婚育状况对就业影响的深度分析',
    uniqueQuestions: [
      'gender-v2',
      'marital-status-v2',
      'has-children-v2',
      'fertility-intent-v2',
      'marriage-inquiry-frequency-v2',
      'marriage-impact-perception-v2',
      'employer-requirements-v2'
    ]
  },
  regionalAnalysis: {
    title: '地域与流动分析',
    description: '问卷2独有的城市层级、户籍类型对就业的影响分析',
    uniqueQuestions: [
      'current-city-tier-v2',
      'hukou-type-v2'
    ]
  },
  jobSeekingBehavior: {
    title: '求职行为分析',
    description: '问卷2独有的求职时长、投递量、转化率、渠道使用分析',
    uniqueQuestions: [
      'job-seeking-duration-v2',
      'applications-per-week-v2',
      'interview-conversion-v2',
      'channels-used-v2',
      'offer-received-v2'
    ]
  },
  supportNeeds: {
    title: '支持需求分析',
    description: '问卷2独有的求职者期望支持类型统计',
    uniqueQuestions: [
      'support-needed-types-v2'
    ]
  },
  openEndedInsights: {
    title: '开放性洞察',
    description: '问卷2独有的开放题，捕捉个人优势、忧虑与案例',
    uniqueQuestions: [
      'personal-advantages-v2',
      'employment-concerns-v2',
      'support-needed-open-v2',
      'discrimination-case-open-v2'
    ]
  }
};

/**
 * 获取问卷2专用的可视化配置（v2.1.0）
 */
export function getQuestionnaire2VisualizationConfig() {
  return {
    dimensions: QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS,
    uniqueFeatures: QUESTIONNAIRE2_UNIQUE_FEATURES,
    questionnaireId: 'questionnaire-v2-2024',
    version: '2.1.0',
    title: '问卷2可视化分析',
    description: '基于经济压力、就业信心、求职歧视与性别婚育的智能问卷数据分析',
    totalDimensions: QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS.length,
    totalQuestions: QUESTIONNAIRE2_VISUALIZATION_DIMENSIONS.reduce(
      (sum, dim) => sum + dim.questions.length,
      0
    ),
    newFeatures: [
      '性别与婚育分析',
      '求职歧视类型与严重度',
      '地域与城市层级分析',
      '求职行为与渠道有效性',
      '支持需求统计',
      '开放性洞察'
    ]
  };
}

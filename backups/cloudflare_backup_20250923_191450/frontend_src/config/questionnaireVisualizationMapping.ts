/**
 * 问卷可视化数据映射配置
 * 基于真实问卷问题建立的数据映射系统
 */

export interface QuestionVisualizationConfig {
  questionId: string;
  questionTitle: string;
  chartType: 'pie' | 'bar' | 'donut' | 'line' | 'treemap' | 'heatmap';
  category: string;
  socialValue: string;
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
  socialImpact: string;
}

/**
 * 基于真实问卷的6个核心可视化维度
 */
export const VISUALIZATION_DIMENSIONS: VisualizationDimension[] = [
  {
    id: 'employment-overview',
    title: '就业形势总览',
    description: '反映当前整体就业状况和市场感知',
    icon: '📈',
    socialImpact: '为政府制定就业政策提供数据支撑',
    questions: [
      {
        questionId: 'current-status',
        questionTitle: '当前身份状态分布',
        chartType: 'donut',
        category: 'employment-overview',
        socialValue: '反映社会就业结构和人群分布',
        description: '显示参与者的身份构成：学生、就业、失业等',
        options: [
          { value: 'student', label: '在校学生', color: '#1890FF', icon: '🎓' },
          { value: 'unemployed', label: '失业/求职中', color: '#FA8C16', icon: '🔍' },
          { value: 'fulltime', label: '全职工作', color: '#52C41A', icon: '💼' },
          { value: 'internship', label: '实习中', color: '#722ED1', icon: '📝' },
          { value: 'freelance', label: '自由职业', color: '#13C2C2', icon: '🎨' },
          { value: 'parttime', label: '兼职工作', color: '#FADB14', icon: '⏰' },
          { value: 'preparing', label: '备考/进修', color: '#F759AB', icon: '📚' }
        ]
      },
      {
        questionId: 'employment-difficulty-perception',
        questionTitle: '就业难度感知',
        chartType: 'bar',
        category: 'employment-overview',
        socialValue: '评估就业市场紧张程度和社会预期',
        description: '反映社会对当前就业环境的整体感知',
        options: [
          { value: 'very-easy', label: '非常容易', color: '#52C41A', icon: '😊' },
          { value: 'easy', label: '比较容易', color: '#73D13D', icon: '🙂' },
          { value: 'moderate', label: '一般', color: '#FADB14', icon: '😐' },
          { value: 'difficult', label: '比较困难', color: '#FA8C16', icon: '😟' },
          { value: 'very-difficult', label: '非常困难', color: '#FF4D4F', icon: '😰' }
        ]
      },
      {
        questionId: 'peer-employment-rate',
        questionTitle: '同龄人就业率观察',
        chartType: 'bar',
        category: 'employment-overview',
        socialValue: '从个体视角反映就业市场真实状况',
        description: '通过个人观察了解周围同龄人的就业情况',
        options: [
          { value: 'very-high', label: '非常高(90%+)', color: '#52C41A', icon: '📈' },
          { value: 'high', label: '比较高(70-90%)', color: '#73D13D', icon: '📊' },
          { value: 'moderate', label: '一般(50-70%)', color: '#FADB14', icon: '📉' },
          { value: 'low', label: '比较低(30-50%)', color: '#FA8C16', icon: '📋' },
          { value: 'very-low', label: '很低(30%以下)', color: '#FF4D4F', icon: '📌' },
          { value: 'unknown', label: '不太了解', color: '#8C8C8C', icon: '❓' }
        ]
      },
      {
        questionId: 'salary-level-perception',
        questionTitle: '薪资水平感知',
        chartType: 'bar',
        category: 'employment-overview',
        socialValue: '反映薪资期望与现实的差距',
        description: '了解社会对当前薪资水平的整体评价',
        options: [
          { value: 'much-higher', label: '比预期高很多', color: '#52C41A', icon: '💰' },
          { value: 'higher', label: '比预期稍高', color: '#73D13D', icon: '💵' },
          { value: 'as-expected', label: '符合预期', color: '#FADB14', icon: '💴' },
          { value: 'lower', label: '比预期稍低', color: '#FA8C16', icon: '💶' },
          { value: 'much-lower', label: '比预期低很多', color: '#FF4D4F', icon: '💷' }
        ]
      }
    ]
  },
  {
    id: 'demographics',
    title: '人口结构分析',
    description: '分析参与者的基本人口统计特征',
    icon: '👥',
    socialImpact: '为教育资源配置和人才培养提供参考',
    questions: [
      {
        questionId: 'age-range',
        questionTitle: '年龄段分布',
        chartType: 'bar',
        category: 'demographics',
        socialValue: '了解不同年龄群体的就业特点',
        description: '显示参与者的年龄结构分布',
        options: [
          { value: 'under-20', label: '20岁以下', color: '#FF9A8B', icon: '👶' },
          { value: '20-22', label: '20-22岁', color: '#A8E6CF', icon: '🧒' },
          { value: '23-25', label: '23-25岁', color: '#FFD93D', icon: '👦' },
          { value: '26-28', label: '26-28岁', color: '#6BCF7F', icon: '👨' },
          { value: '29-35', label: '29-35岁', color: '#4D96FF', icon: '🧑' },
          { value: 'over-35', label: '35岁以上', color: '#9B59B6', icon: '👴' }
        ]
      },
      {
        questionId: 'gender',
        questionTitle: '性别分布',
        chartType: 'pie',
        category: 'demographics',
        socialValue: '分析性别对就业状况的影响',
        description: '了解参与者的性别构成',
        options: [
          { value: 'male', label: '男性', color: '#4D96FF', icon: '👨' },
          { value: 'female', label: '女性', color: '#FF9A8B', icon: '👩' },
          { value: 'prefer-not-say', label: '不愿透露', color: '#A8E6CF', icon: '🌈' }
        ]
      },
      {
        questionId: 'education-level',
        questionTitle: '学历结构',
        chartType: 'pie',
        category: 'demographics',
        socialValue: '分析不同教育背景的就业情况',
        description: '显示参与者的最高学历分布',
        options: [
          { value: 'high-school', label: '高中/中专及以下', color: '#FFD93D', icon: '🏫' },
          { value: 'junior-college', label: '大专', color: '#A8E6CF', icon: '🎓' },
          { value: 'bachelor', label: '本科', color: '#4D96FF', icon: '🎓' },
          { value: 'master', label: '硕士研究生', color: '#9B59B6', icon: '👨‍🎓' },
          { value: 'phd', label: '博士研究生', color: '#FF6B6B', icon: '👨‍🔬' }
        ]
      },
      {
        questionId: 'major-field',
        questionTitle: '专业分布',
        chartType: 'treemap',
        category: 'demographics',
        socialValue: '分析不同专业的就业情况',
        description: '了解参与者的专业背景分布',
        options: [
          { value: 'engineering', label: '工学', color: '#4D96FF', icon: '⚙️' },
          { value: 'management', label: '经济管理类', color: '#52C41A', icon: '💼' },
          { value: 'science', label: '理学', color: '#722ED1', icon: '🔬' },
          { value: 'literature', label: '文学', color: '#FA8C16', icon: '📚' },
          { value: 'medicine', label: '医学', color: '#FF4D4F', icon: '⚕️' },
          { value: 'education', label: '教育学', color: '#13C2C2', icon: '👨‍🏫' },
          { value: 'law', label: '法学', color: '#FADB14', icon: '⚖️' },
          { value: 'art', label: '艺术学', color: '#F759AB', icon: '🎨' },
          { value: 'economics', label: '经济学', color: '#52C41A', icon: '💰' },
          { value: 'philosophy', label: '哲学', color: '#8C8C8C', icon: '🤔' }
        ]
      },
      {
        questionId: 'work-location-preference',
        questionTitle: '地域分布',
        chartType: 'bar',
        category: 'demographics',
        socialValue: '分析不同地区的就业环境差异',
        description: '了解参与者的工作/生活城市类型',
        options: [
          { value: 'tier1', label: '一线城市', color: '#FF4D4F', icon: '🏙️' },
          { value: 'new-tier1', label: '新一线城市', color: '#FA8C16', icon: '🌆' },
          { value: 'tier2', label: '二线城市', color: '#FADB14', icon: '🏘️' },
          { value: 'tier3', label: '三线及以下城市', color: '#52C41A', icon: '🏡' },
          { value: 'hometown', label: '家乡所在地', color: '#13C2C2', icon: '🏠' },
          { value: 'flexible', label: '灵活选择', color: '#722ED1', icon: '🌍' }
        ]
      }
    ]
  },
  {
    id: 'employment-market',
    title: '就业市场深度分析',
    description: '深入分析就业市场的行业、薪资、求职等情况',
    icon: '💼',
    socialImpact: '为求职者和企业提供市场参考',
    questions: [
      {
        questionId: 'work-industry',
        questionTitle: '行业就业分布',
        chartType: 'treemap',
        category: 'employment-market',
        socialValue: '识别热门就业领域和行业趋势',
        description: '显示不同行业的就业人数分布',
        options: [
          { value: 'internet-tech', label: '互联网/科技', color: '#4D96FF', icon: '💻' },
          { value: 'finance', label: '金融/银行/保险', color: '#52C41A', icon: '🏦' },
          { value: 'manufacturing', label: '制造业', color: '#FA8C16', icon: '🏭' },
          { value: 'education', label: '教育/培训', color: '#722ED1', icon: '🎓' },
          { value: 'healthcare', label: '医疗/健康', color: '#FF4D4F', icon: '🏥' },
          { value: 'real-estate', label: '房地产/建筑', color: '#13C2C2', icon: '🏢' },
          { value: 'retail-commerce', label: '零售/电商', color: '#FADB14', icon: '🛒' },
          { value: 'media-advertising', label: '媒体/广告/文化', color: '#F759AB', icon: '📺' },
          { value: 'consulting', label: '咨询/专业服务', color: '#9B59B6', icon: '💼' },
          { value: 'government', label: '政府/事业单位', color: '#FF6B6B', icon: '🏛️' },
          { value: 'transportation', label: '交通/物流', color: '#A8E6CF', icon: '🚚' },
          { value: 'energy', label: '能源/化工', color: '#FFD93D', icon: '⚡' },
          { value: 'agriculture', label: '农业/食品', color: '#6BCF7F', icon: '🌾' },
          { value: 'other', label: '其他行业', color: '#8C8C8C', icon: '🔧' }
        ]
      },
      {
        questionId: 'current-salary',
        questionTitle: '薪资水平分布',
        chartType: 'bar',
        category: 'employment-market',
        socialValue: '提供同行业同背景薪酬参考',
        description: '显示当前就业人员的月薪分布情况',
        options: [
          { value: 'below-3k', label: '3000元以下', color: '#FF4D4F', icon: '💸' },
          { value: '3k-5k', label: '3000-5000元', color: '#FA8C16', icon: '💰' },
          { value: '5k-8k', label: '5000-8000元', color: '#FADB14', icon: '💵' },
          { value: '8k-12k', label: '8000-12000元', color: '#52C41A', icon: '💴' },
          { value: '12k-20k', label: '12000-20000元', color: '#13C2C2', icon: '💶' },
          { value: '20k-30k', label: '20000-30000元', color: '#722ED1', icon: '💷' },
          { value: '30k-50k', label: '30000-50000元', color: '#4D96FF', icon: '💎' },
          { value: 'above-50k', label: '50000元以上', color: '#9B59B6', icon: '👑' }
        ]
      },
      {
        questionId: 'job-search-duration',
        questionTitle: '求职时长分析',
        chartType: 'bar',
        category: 'employment-market',
        socialValue: '反映就业市场的竞争激烈程度',
        description: '显示求职者的求职时间分布',
        options: [
          { value: 'less-1month', label: '不到1个月', color: '#52C41A', icon: '⚡' },
          { value: '1-3months', label: '1-3个月', color: '#73D13D', icon: '🏃' },
          { value: '3-6months', label: '3-6个月', color: '#FADB14', icon: '🚶' },
          { value: '6-12months', label: '6个月-1年', color: '#FA8C16', icon: '🐌' },
          { value: '1-2years', label: '1-2年', color: '#FF4D4F', icon: '🦥' },
          { value: 'over-2years', label: '2年以上', color: '#8C8C8C', icon: '🐢' }
        ]
      },
      {
        questionId: 'job-search-difficulties',
        questionTitle: '求职困难分析',
        chartType: 'bar',
        category: 'employment-market',
        socialValue: '识别求职过程中的主要障碍',
        description: '统计求职者遇到的主要困难',
        options: [
          { value: 'lack-experience', label: '缺乏相关工作经验', color: '#FF4D4F', icon: '🔰' },
          { value: 'skill-mismatch', label: '技能与岗位要求不匹配', color: '#FA8C16', icon: '⚙️' },
          { value: 'no-response', label: '简历投递无回应', color: '#FADB14', icon: '📧' },
          { value: 'interview-failure', label: '面试表现不佳', color: '#722ED1', icon: '🎭' },
          { value: 'salary-gap', label: '薪资期望与现实差距大', color: '#13C2C2', icon: '💰' },
          { value: 'location-limit', label: '地域限制', color: '#52C41A', icon: '📍' },
          { value: 'age-discrimination', label: '年龄限制', color: '#9B59B6', icon: '⏰' },
          { value: 'education-requirement', label: '学历要求过高', color: '#4D96FF', icon: '🎓' },
          { value: 'market-competition', label: '市场竞争激烈', color: '#F759AB', icon: '⚔️' },
          { value: 'industry-decline', label: '目标行业不景气', color: '#8C8C8C', icon: '📉' }
        ]
      }
    ]
  },
  {
    id: 'student-preparation',
    title: '学生就业准备',
    description: '分析在校学生的就业准备情况',
    icon: '🎓',
    socialImpact: '为教育机构优化就业指导提供依据',
    questions: [
      {
        questionId: 'academic-year',
        questionTitle: '年级分布',
        chartType: 'bar',
        category: 'student-preparation',
        socialValue: '了解不同年级学生的就业准备状况',
        description: '显示在校学生的年级分布',
        options: [
          { value: 'year-1', label: '一年级', color: '#FF9A8B', icon: '1️⃣' },
          { value: 'year-2', label: '二年级', color: '#A8E6CF', icon: '2️⃣' },
          { value: 'year-3', label: '三年级', color: '#FFD93D', icon: '3️⃣' },
          { value: 'year-4', label: '四年级', color: '#6BCF7F', icon: '4️⃣' },
          { value: 'year-5-plus', label: '五年级及以上', color: '#4D96FF', icon: '5️⃣' },
          { value: 'graduate-1', label: '研究生一年级', color: '#9B59B6', icon: '🎓' },
          { value: 'graduate-2', label: '研究生二年级', color: '#FF6B6B', icon: '👨‍🎓' },
          { value: 'graduate-3-plus', label: '研究生三年级及以上', color: '#13C2C2', icon: '👨‍🔬' }
        ]
      },
      {
        questionId: 'career-preparation',
        questionTitle: '就业准备情况',
        chartType: 'bar',
        category: 'student-preparation',
        socialValue: '评估学生就业准备的充分程度',
        description: '统计学生为就业做的各种准备',
        options: [
          { value: 'internship', label: '参加实习', color: '#52C41A', icon: '💼' },
          { value: 'skill-training', label: '技能培训和认证', color: '#4D96FF', icon: '🛠️' },
          { value: 'job-search', label: '投递简历找工作', color: '#FA8C16', icon: '📄' },
          { value: 'graduate-exam', label: '准备考研', color: '#722ED1', icon: '📚' },
          { value: 'civil-service', label: '准备公务员考试', color: '#13C2C2', icon: '🏛️' },
          { value: 'study-abroad', label: '准备出国留学', color: '#F759AB', icon: '✈️' },
          { value: 'entrepreneurship', label: '创业准备', color: '#FADB14', icon: '🚀' },
          { value: 'none', label: '暂时没有特别准备', color: '#8C8C8C', icon: '😴' }
        ]
      }
    ]
  },
  {
    id: 'living-costs',
    title: '生活成本与压力',
    description: '分析生活成本和经济压力状况',
    icon: '🏠',
    socialImpact: '为城市规划和民生政策提供参考',
    questions: [
      {
        questionId: 'monthly-housing-cost',
        questionTitle: '住房成本分布',
        chartType: 'bar',
        category: 'living-costs',
        socialValue: '反映住房成本对就业选择的影响',
        description: '统计每月住房支出情况',
        options: [
          { value: 'below-2k', label: '2000元以下', color: '#52C41A', icon: '🏡' },
          { value: '2k-4k', label: '2000-4000元', color: '#73D13D', icon: '🏠' },
          { value: '4k-6k', label: '4000-6000元', color: '#FADB14', icon: '🏘️' },
          { value: '6k-8k', label: '6000-8000元', color: '#FA8C16', icon: '🏢' },
          { value: '8k-12k', label: '8000-12000元', color: '#FF4D4F', icon: '🏙️' },
          { value: 'above-12k', label: '12000元以上', color: '#722ED1', icon: '🏰' }
        ]
      },
      {
        questionId: 'life-pressure-tier1',
        questionTitle: '一线城市生活压力',
        chartType: 'bar',
        category: 'living-costs',
        socialValue: '评估一线城市生活压力状况',
        description: '了解一线城市居民的生活压力感受',
        options: [
          { value: 'very-low', label: '压力很小', color: '#52C41A', icon: '😊' },
          { value: 'low', label: '压力较小', color: '#73D13D', icon: '🙂' },
          { value: 'moderate', label: '压力适中', color: '#FADB14', icon: '😐' },
          { value: 'high', label: '压力较大', color: '#FA8C16', icon: '😟' },
          { value: 'very-high', label: '压力很大', color: '#FF4D4F', icon: '😰' }
        ]
      },
      {
        questionId: 'financial-pressure',
        questionTitle: '经济压力状况',
        chartType: 'bar',
        category: 'living-costs',
        socialValue: '反映失业期间的经济困难程度',
        description: '了解失业人员的经济压力情况',
        options: [
          { value: 'no-pressure', label: '没有经济压力', color: '#52C41A', icon: '💰' },
          { value: 'mild-pressure', label: '有一定压力', color: '#73D13D', icon: '💵' },
          { value: 'moderate-pressure', label: '压力较大', color: '#FADB14', icon: '💴' },
          { value: 'severe-pressure', label: '压力很大', color: '#FF4D4F', icon: '💸' }
        ]
      }
    ]
  },
  {
    id: 'policy-insights',
    title: '政策建议洞察',
    description: '收集改善就业状况的政策建议',
    icon: '🏛️',
    socialImpact: '为政府制定就业政策提供民意参考',
    questions: [
      {
        questionId: 'employment-advice',
        questionTitle: '改善建议统计',
        chartType: 'bar',
        category: 'policy-insights',
        socialValue: '收集社会对就业政策的建议和期望',
        description: '统计民众认为最需要的就业改善措施',
        options: [
          { value: 'education-reform', label: '教育体系改革', color: '#4D96FF', icon: '🎓' },
          { value: 'skill-training', label: '加强职业技能培训', color: '#52C41A', icon: '🛠️' },
          { value: 'policy-support', label: '政府政策支持', color: '#722ED1', icon: '🏛️' },
          { value: 'economic-growth', label: '促进经济发展', color: '#FA8C16', icon: '📈' },
          { value: 'fair-recruitment', label: '规范招聘流程', color: '#13C2C2', icon: '⚖️' },
          { value: 'salary-standards', label: '规范薪资标准', color: '#FADB14', icon: '💰' },
          { value: 'work-life-balance', label: '改善工作环境', color: '#F759AB', icon: '⚖️' },
          { value: 'entrepreneurship', label: '鼓励创业创新', color: '#9B59B6', icon: '🚀' }
        ]
      }
    ]
  }
];

/**
 * 获取问题的可视化配置
 */
export function getQuestionVisualizationConfig(questionId: string): QuestionVisualizationConfig | null {
  for (const dimension of VISUALIZATION_DIMENSIONS) {
    const question = dimension.questions.find(q => q.questionId === questionId);
    if (question) {
      return question;
    }
  }
  return null;
}

/**
 * 获取维度的所有问题
 */
export function getDimensionQuestions(dimensionId: string): QuestionVisualizationConfig[] {
  const dimension = VISUALIZATION_DIMENSIONS.find(d => d.id === dimensionId);
  return dimension ? dimension.questions : [];
}

/**
 * 获取所有可视化问题ID
 */
export function getAllVisualizationQuestionIds(): string[] {
  const questionIds: string[] = [];
  for (const dimension of VISUALIZATION_DIMENSIONS) {
    for (const question of dimension.questions) {
      questionIds.push(question.questionId);
    }
  }
  return questionIds;
}

/**
 * 问卷字段ID映射配置
 * 
 * 用途：统一管理问卷字段ID，避免硬编码导致的不一致问题
 * 
 * 命名规范：
 * - 数据库字段：snake_case（如：age_range）
 * - 问卷字段ID：kebab-case-v2（如：age-range-v2）
 * - 中文标签：中文（如：年龄段）
 */

/**
 * 问卷V2字段ID映射表
 */
export const QUESTIONNAIRE_V2_FIELD_IDS = {
  // ==================== 基本信息 ====================
  gender: 'gender-v2',                              // 性别
  ageRange: 'age-range-v2',                         // 年龄段
  educationLevel: 'education-level-v2',             // 学历
  maritalStatus: 'marital-status-v2',               // 婚姻状态
  hasChildren: 'has-children-v2',                   // 是否有孩子
  fertilityIntent: 'fertility-intent-v2',           // 生育意愿
  
  // ==================== 地理信息 ====================
  currentCityTier: 'current-city-tier-v2',          // 当前城市层级
  hukouType: 'hukou-type-v2',                       // 户口类型
  
  // ==================== 就业信息 ====================
  yearsExperience: 'years-experience-v2',           // 工作年限
  currentStatus: 'current-status-question-v2',      // 当前状态（就业/失业/学生）⚠️ 注意：不是 employment-status-v2
  
  // ==================== 经济信息 ====================
  debtSituation: 'debt-situation-v2',               // 负债情况（多选数组）
  monthlyDebtBurden: 'monthly-debt-burden-v2',      // 月度债务负担
  economicPressureLevel: 'economic-pressure-level-v2', // 经济压力等级 ⚠️ 注意：不是 economic-pressure-v2
  monthlyLivingCost: 'monthly-living-cost-v2',      // 月度生活成本
  incomeSources: 'income-sources-v2',               // 收入来源（多选数组）
  parentalSupportAmount: 'parental-support-amount-v2', // 父母支持金额
  incomeExpenseBalance: 'income-expense-balance-v2',   // 收支平衡
  currentSalary: 'current-salary-v2',               // 当前月薪 ⚠️ 注意：不是 monthly-salary-v2
  
  // ==================== 歧视与公平 ====================
  experiencedDiscriminationTypes: 'experienced-discrimination-types-v2', // 经历的歧视类型（多选）
  discriminationSeverity: 'discrimination-severity-v2',                  // 歧视严重程度
  discriminationChannels: 'discrimination-channels-v2',                  // 歧视渠道（多选）
  supportNeededTypes: 'support-needed-types-v2',                         // 需要的支持类型（多选）
  
  // ==================== 就业信心 ====================
  employmentConfidence6Months: 'employment-confidence-6months-v2',  // 6个月就业信心 ⚠️ 注意：不是 employment-confidence-v2
  employmentConfidence1Year: 'employment-confidence-1year-v2',      // 1年就业信心
  
  // ==================== 求职信息 ====================
  jobSeekingDuration: 'job-seeking-duration-v2',    // 求职时长
  applicationsPerWeek: 'applications-per-week-v2',  // 每周投递数
  interviewConversion: 'interview-conversion-v2',   // 面试转化率
  channelsUsed: 'channels-used-v2',                 // 使用的求职渠道（多选）
  offerReceived: 'offer-received-v2'                // 收到的offer数
} as const;

/**
 * 字段值映射表（用于标签生成）
 */
export const FIELD_VALUE_MAPPINGS = {
  // 年龄段
  ageRange: {
    'under-20': '20岁以下',
    '18-22': '18-22岁',
    '23-25': '23-25岁',
    '26-30': '26-30岁',
    '30+': '30岁以上'
  },
  
  // 性别
  gender: {
    'male': '男性',
    'female': '女性',
    'other': '其他'
  },
  
  // 学历
  educationLevel: {
    'high-school': '高中',
    'college': '专科',
    'bachelor': '本科',
    'master': '硕士',
    'phd': '博士'
  },
  
  // 就业状态
  currentStatus: {
    'employed': '已就业',
    'unemployed': '求职中',
    'student': '在校学生',
    'freelance': '自由职业'
  },
  
  // 经济压力
  economicPressureLevel: {
    'no-pressure': '无压力',
    'low-pressure': '低压力',
    'moderate-pressure': '中等压力',
    'high-pressure': '高压力',
    'severe-pressure': '严重压力'
  },
  
  // 就业信心
  employmentConfidence: {
    'very-confident': '非常自信',
    'confident': '自信',
    'neutral': '中性',
    'worried': '担忧',
    'not-confident': '不自信',
    'very-anxious': '非常焦虑'
  },
  
  // 城市层级
  currentCityTier: {
    'tier1': '一线城市',
    'tier2': '二线城市',
    'tier3': '三线城市',
    'tier4': '四线及以下',
    'rural': '农村'
  },
  
  // 婚姻状态
  maritalStatus: {
    'single': '单身',
    'married': '已婚',
    'divorced': '离异',
    'widowed': '丧偶'
  },
  
  // 生育意愿
  fertilityIntent: {
    'yes': '有生育意愿',
    'no': '不打算生育',
    'uncertain': '不确定'
  }
} as const;

/**
 * 辅助函数：获取字段的中文标签
 */
export function getFieldLabel(fieldKey: keyof typeof QUESTIONNAIRE_V2_FIELD_IDS): string {
  const labels: Record<string, string> = {
    gender: '性别',
    ageRange: '年龄段',
    educationLevel: '学历',
    maritalStatus: '婚姻状态',
    hasChildren: '是否有孩子',
    fertilityIntent: '生育意愿',
    currentCityTier: '城市层级',
    hukouType: '户口类型',
    yearsExperience: '工作年限',
    currentStatus: '就业状态',
    debtSituation: '负债情况',
    monthlyDebtBurden: '月度债务',
    economicPressureLevel: '经济压力',
    monthlyLivingCost: '生活成本',
    incomeSources: '收入来源',
    parentalSupportAmount: '父母支持',
    incomeExpenseBalance: '收支平衡',
    currentSalary: '当前月薪',
    experiencedDiscriminationTypes: '歧视类型',
    discriminationSeverity: '歧视程度',
    discriminationChannels: '歧视渠道',
    supportNeededTypes: '需要支持',
    employmentConfidence6Months: '6个月就业信心',
    employmentConfidence1Year: '1年就业信心',
    jobSeekingDuration: '求职时长',
    applicationsPerWeek: '每周投递',
    interviewConversion: '面试转化',
    channelsUsed: '求职渠道',
    offerReceived: 'Offer数量'
  };
  
  return labels[fieldKey] || fieldKey;
}

/**
 * 辅助函数：获取字段值的中文标签
 */
export function getFieldValueLabel(
  fieldKey: keyof typeof FIELD_VALUE_MAPPINGS,
  value: string
): string {
  const mapping = FIELD_VALUE_MAPPINGS[fieldKey];
  if (!mapping) return value;
  
  return (mapping as any)[value] || value;
}

/**
 * 辅助函数：检查字段值是否为数组类型
 */
export function isArrayField(fieldKey: string): boolean {
  const arrayFields = [
    'debtSituation',
    'incomeSources',
    'experiencedDiscriminationTypes',
    'discriminationChannels',
    'supportNeededTypes',
    'channelsUsed'
  ];
  
  return arrayFields.includes(fieldKey);
}


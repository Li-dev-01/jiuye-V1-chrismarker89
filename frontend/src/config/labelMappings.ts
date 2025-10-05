/**
 * 问卷2数据标签中英文映射
 * 将API返回的英文值转换为中文显示
 */

export const LABEL_MAPPINGS: Record<string, Record<string, string>> = {
  // 性别
  gender: {
    'male': '男',
    'female': '女',
    'other': '其他'
  },

  // 年龄范围
  ageRange: {
    'under-20': '20岁以下',
    '20-22': '20-22岁',
    '23-25': '23-25岁',
    '26-28': '26-28岁',
    '29-35': '29-35岁',
    'over-35': '35岁以上'
  },

  // 学历
  educationLevel: {
    'high-school': '高中',
    'vocational': '中专/职校',
    'college': '大专',
    'bachelor': '本科',
    'master': '硕士',
    'phd': '博士'
  },

  // 婚姻状况
  maritalStatus: {
    'single': '未婚',
    'married': '已婚',
    'divorced': '离异',
    'widowed': '丧偶'
  },

  // 城市层级
  cityTier: {
    'tier-1': '一线城市',
    'tier-2': '二线城市',
    'tier-3': '三线城市',
    'tier-4': '四线及以下'
  },

  // 户籍类型
  hukouType: {
    'urban': '城镇',
    'rural': '农村'
  },

  // 就业状态
  employmentStatus: {
    'employed': '在职',
    'unemployed': '失业',
    'student': '在校学生',
    'freelance': '自由职业'
  },

  // 负债情况
  debtSituation: {
    'none': '无负债',
    'student-loan': '助学贷款',
    'mortgage': '房贷',
    'car-loan': '车贷',
    'consumer-loan': '消费贷',
    'credit-card': '信用卡',
    'jd-baitiao': '京东白条',
    'alipay-huabei': '支付宝花呗',
    'business-loan': '经营贷'
  },

  // 每月生活开支
  monthlyLivingCost: {
    'below-1000': '1000元以下',
    '1000-2000': '1000-2000元',
    '2000-3000': '2000-3000元',
    '3000-5000': '3000-5000元',
    '5000-8000': '5000-8000元',
    '8000-12000': '8000-12000元',
    'over-12000': '12000元以上'
  },

  // 收入来源
  incomeSources: {
    'salary': '工资收入',
    'freelance': '自由职业收入',
    'parents-support': '父母支持',
    'scholarship': '奖学金',
    'savings': '存款',
    'investment': '投资收益',
    'part-time': '兼职收入',
    'government-aid': '政府补助'
  },

  // 父母支援金额
  parentalSupport: {
    'no-support': '无支援',
    'below-500': '500元以下',
    '500-1000': '500-1000元',
    '1000-2000': '1000-2000元',
    '2000-3000': '2000-3000元',
    '3000-5000': '3000-5000元',
    'over-5000': '5000元以上'
  },

  // 收支平衡
  incomeExpenseBalance: {
    'surplus-large': '大量结余',
    'surplus-small': '略有结余',
    'balanced': '收支平衡',
    'deficit-small': '略有赤字',
    'deficit-large': '严重赤字',
    'dependent': '完全依赖他人'
  },

  // 经济压力
  economicPressure: {
    'no-pressure': '无压力',
    'low-pressure': '压力较小',
    'mild-pressure': '轻微压力',
    'moderate-pressure': '压力适中',
    'high-pressure': '压力较大',
    'severe-pressure': '压力很大'
  },

  // 月薪
  salary: {
    'below-3000': '3000元以下',
    '3000-5000': '3000-5000元',
    '5000-8000': '5000-8000元',
    '8000-12000': '8000-12000元',
    '12000-20000': '12000-20000元',
    'over-20000': '20000元以上'
  },

  // 歧视类型
  discriminationTypes: {
    'none': '无歧视',
    'age': '年龄歧视',
    'gender': '性别歧视',
    'education': '学历歧视',
    'appearance': '外貌歧视',
    'region': '地域歧视',
    'marital-status': '婚育歧视',
    'health': '健康歧视',
    'political-status': '政治面貌歧视'
  },

  // 歧视严重程度
  discriminationSeverity: {
    'mild': '轻微',
    'moderate': '中等',
    'severe': '严重'
  },

  // 歧视渠道
  discriminationChannels: {
    'job-posting': '招聘信息',
    'resume-screening': '简历筛选',
    'interview': '面试过程',
    'onsite-interview': '现场面试',
    'offer-stage': 'Offer阶段',
    'workplace': '职场环境'
  },

  // 就业信心
  employmentConfidence: {
    '1': '非常不自信',
    '2': '不太自信',
    '3': '一般',
    '4': '比较自信',
    '5': '非常自信'
  },

  // 信心影响因素
  confidenceFactors: {
    'market-outlook': '市场前景',
    'personal-skills': '个人技能',
    'education-background': '教育背景',
    'work-experience': '工作经验',
    'network': '人脉资源',
    'age': '年龄因素',
    'gender': '性别因素',
    'family-support': '家庭支持'
  },

  // 生育意愿
  fertilityIntent: {
    'no-plan': '不打算生育',
    'considering': '考虑中',
    'plan-1': '计划生1个',
    'plan-2': '计划生2个',
    'plan-3-or-more': '计划生3个及以上'
  },

  // 月负债
  monthlyDebtBurden: {
    'no-debt': '无负债',
    'below-1000': '1000元以下',
    '1000-3000': '1000-3000元',
    '3000-5000': '3000-5000元',
    '5000-10000': '5000-10000元',
    'over-10000': '10000元以上'
  }
};

/**
 * 获取标签的中文翻译
 * @param category 类别（如 'gender', 'ageRange'）
 * @param value 英文值
 * @returns 中文标签，如果没有映射则返回原值
 */
export function getLabel(category: string, value: string): string {
  const categoryMappings = LABEL_MAPPINGS[category];
  if (!categoryMappings) {
    console.warn(`未找到类别 ${category} 的标签映射`);
    return value;
  }

  const label = categoryMappings[value];
  if (!label) {
    console.warn(`未找到 ${category}.${value} 的标签映射`);
    return value;
  }

  return label;
}

/**
 * 批量转换数据标签
 * @param category 类别
 * @param data 数据数组
 * @returns 转换后的数据数组
 */
export function translateLabels(
  category: string,
  data: Array<{ name: string; value: number; percentage: number }>
): Array<{ name: string; value: number; percentage: number }> {
  console.log(`🔄 翻译 ${category}:`, data);
  const result = data.map(item => ({
    ...item,
    name: getLabel(category, item.name)
  }));
  console.log(`✅ 翻译结果 ${category}:`, result);
  return result;
}


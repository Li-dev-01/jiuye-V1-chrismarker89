/**
 * 统一数据映射配置
 * 解决维度ID映射混乱和数据结构不匹配的全局性问题
 */

// ===== 1. 统一的维度映射体系 =====

/**
 * 维度映射配置
 * 建立前端维度ID、API字段、问卷题目ID的统一映射关系
 */
export interface DimensionMapping {
  // 前端维度ID (用于路由和组件)
  frontendId: string;
  // 维度标题
  title: string;
  // 维度描述
  description: string;
  // 图标
  icon: string;

  // 包含的问题映射
  questions: QuestionMapping[];
}

/**
 * 问题映射配置
 */
export interface QuestionMapping {
  // 前端问题ID
  frontendQuestionId: string;
  // 问卷定义中的题目ID
  questionnaireQuestionId: string;
  // API返回的数据字段名
  apiDataField: string;
  // 问题标题
  title: string;
  // 图表类型
  chartType: 'pie' | 'donut' | 'bar' | 'line' | 'treemap';

  // 问题描述
  description: string;
  // 选项映射
  optionMapping: OptionMapping[];
}

/**
 * 选项映射配置
 */
export interface OptionMapping {
  // API返回的选项值
  apiValue: string;
  // 显示标签
  displayLabel: string;
  // 颜色
  color: string;
  // 图标
  icon?: string;
}

// ===== 2. 完整的映射配置 =====

export const UNIFIED_DIMENSION_MAPPING: DimensionMapping[] = [
  {
    frontendId: 'employment-overview',
    title: '就业形势总览',
    description: '反映当前整体就业状况和市场感知',
    icon: '📈',

    questions: [
      {
        frontendQuestionId: 'current-status',
        questionnaireQuestionId: 'current-status',
        apiDataField: 'employmentStatus',
        title: '当前身份状态分布',
        chartType: 'donut',

        description: '显示参与者的身份构成：学生、就业、失业等',
        optionMapping: [
          { apiValue: 'student', displayLabel: '在校学生', color: '#1890FF', icon: '🎓' },
          { apiValue: 'unemployed', displayLabel: '失业/求职中', color: '#FA8C16', icon: '🔍' },
          { apiValue: 'employed', displayLabel: '全职工作', color: '#52C41A', icon: '💼' },
          { apiValue: 'internship', displayLabel: '实习中', color: '#722ED1', icon: '📝' },
          { apiValue: 'freelance', displayLabel: '自由职业', color: '#13C2C2', icon: '🎨' },
          { apiValue: 'parttime', displayLabel: '兼职工作', color: '#FADB14', icon: '⏰' },
          { apiValue: 'preparing', displayLabel: '备考/进修', color: '#F759AB', icon: '📚' }
        ]
      }
    ]
  },
  {
    frontendId: 'demographic-analysis',
    title: '人口结构分析',
    description: '分析参与调研人群的基本特征',
    icon: '👥',

    questions: [
      {
        frontendQuestionId: 'gender-distribution',
        questionnaireQuestionId: 'gender',
        apiDataField: 'genderDistribution',
        title: '性别分布',
        chartType: 'pie',

        description: '分析不同性别群体的就业特点',
        optionMapping: [
          { apiValue: 'male', displayLabel: '男性', color: '#1890FF', icon: '👨' },
          { apiValue: 'female', displayLabel: '女性', color: '#FF6B9D', icon: '👩' },
          { apiValue: 'prefer-not-say', displayLabel: '不愿透露', color: '#52C41A', icon: '🤐' }
        ]
      },
      {
        frontendQuestionId: 'age-distribution',
        questionnaireQuestionId: 'age-range',
        apiDataField: 'ageDistribution',
        title: '年龄分布',
        chartType: 'bar',
        socialValue: '分析不同年龄段的就业状况差异',
        description: '了解各年龄段的就业特点和挑战',
        optionMapping: [
          { apiValue: '18-22', displayLabel: '18-22岁', color: '#1890FF', icon: '🧒' },
          { apiValue: '23-25', displayLabel: '23-25岁', color: '#52C41A', icon: '👦' },
          { apiValue: '26-30', displayLabel: '26-30岁', color: '#FA8C16', icon: '👨' },
          { apiValue: '31-35', displayLabel: '31-35岁', color: '#722ED1', icon: '👨‍💼' },
          { apiValue: '36-40', displayLabel: '36-40岁', color: '#13C2C2', icon: '👨‍🦳' },
          { apiValue: '40+', displayLabel: '40岁以上', color: '#FADB14', icon: '👴' }
        ]
      }
    ]
  },
  {
    frontendId: 'employment-market-analysis',
    title: '就业市场形势分析',
    description: '深入分析就业市场的供需状况',
    icon: '💼',
    socialImpact: '反映当前就业市场的供需状况',
    questions: [
      {
        frontendQuestionId: 'employment-status',
        questionnaireQuestionId: 'current-status',
        apiDataField: 'employmentStatus',
        title: '就业状态分布',
        chartType: 'pie',
        socialValue: '反映当前就业市场的供需状况',
        description: '分析就业市场的整体状况',
        optionMapping: [
          { apiValue: 'employed', displayLabel: '全职工作', color: '#52C41A', icon: '💼' },
          { apiValue: 'unemployed', displayLabel: '失业/求职中', color: '#FF4D4F', icon: '🔍' },
          { apiValue: 'student', displayLabel: '在校学生', color: '#1890FF', icon: '🎓' },
          { apiValue: 'preparing', displayLabel: '备考/进修', color: '#722ED1', icon: '📚' },
          { apiValue: 'freelance', displayLabel: '自由职业', color: '#13C2C2', icon: '🎨' },
          { apiValue: 'parttime', displayLabel: '兼职工作', color: '#FADB14', icon: '⏰' },
          { apiValue: 'internship', displayLabel: '实习中', color: '#FA8C16', icon: '📝' }
        ]
      }
    ]
  },
  {
    frontendId: 'student-employment-preparation',
    title: '学生就业准备',
    description: '分析学生群体的就业准备情况',
    icon: '🎓',
    socialImpact: '分析不同教育背景对就业的影响',
    questions: [
      {
        frontendQuestionId: 'education-level',
        questionnaireQuestionId: 'education-level',
        apiDataField: 'educationLevel',
        title: '教育水平分布',
        chartType: 'donut',
        socialValue: '分析不同教育背景对就业的影响',
        description: '了解教育水平与就业机会的关系',
        optionMapping: [
          { apiValue: 'high-school', displayLabel: '高中/中专及以下', color: '#FA8C16', icon: '🏫' },
          { apiValue: 'junior-college', displayLabel: '大专', color: '#FADB14', icon: '🏛️' },
          { apiValue: 'bachelor', displayLabel: '本科', color: '#1890FF', icon: '🎓' },
          { apiValue: 'master', displayLabel: '硕士研究生', color: '#722ED1', icon: '👨‍🎓' },
          { apiValue: 'phd', displayLabel: '博士研究生', color: '#13C2C2', icon: '👨‍🔬' }
        ]
      }
    ]
  },
  // 注释掉暂时没有API数据支持的维度
  // {
  //   frontendId: 'living-costs',
  //   title: '生活成本压力',
  //   description: '分析生活成本对就业选择的影响',
  //   icon: '🏠',
  //   socialImpact: '了解生活成本对就业选择的影响',
  //   questions: [
  //     {
  //       frontendQuestionId: 'cost-pressure',
  //       questionnaireQuestionId: 'living-cost-pressure',
  //       apiDataField: 'livingCostPressure',
  //       title: '生活成本压力感知',
  //       chartType: 'bar',
  //       socialValue: '了解生活成本对就业选择的影响',
  //       description: '分析生活成本压力对就业决策的影响',
  //       optionMapping: [
  //         { apiValue: 'very-high', displayLabel: '压力很大', color: '#FF4D4F', icon: '😰' },
  //         { apiValue: 'high', displayLabel: '压力较大', color: '#FA8C16', icon: '😟' },
  //         { apiValue: 'moderate', displayLabel: '压力适中', color: '#FADB14', icon: '😐' },
  //         { apiValue: 'low', displayLabel: '压力较小', color: '#52C41A', icon: '😊' },
  //         { apiValue: 'very-low', displayLabel: '压力很小', color: '#1890FF', icon: '😄' }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   frontendId: 'policy-insights',
  //   title: '政策建议洞察',
  //   description: '收集对就业政策的建议和期望',
  //   icon: '💡',
  //   socialImpact: '收集对就业政策的建议和期望',
  //   questions: [
  //     {
  //       frontendQuestionId: 'policy-suggestions',
  //       questionnaireQuestionId: 'policy-suggestions',
  //       apiDataField: 'policySuggestions',
  //       title: '政策建议分布',
  //       chartType: 'treemap',
  //       socialValue: '收集对就业政策的建议和期望',
  //       description: '了解公众对就业政策的期望和建议',
  //       optionMapping: [
  //         { apiValue: 'job-creation', displayLabel: '增加就业岗位', color: '#52C41A', icon: '💼' },
  //         { apiValue: 'skill-training', displayLabel: '技能培训支持', color: '#1890FF', icon: '📚' },
  //         { apiValue: 'salary-standards', displayLabel: '规范薪资标准', color: '#FADB14', icon: '💰' },
  //         { apiValue: 'work-life-balance', displayLabel: '改善工作环境', color: '#F759AB', icon: '⚖️' },
  //         { apiValue: 'entrepreneurship', displayLabel: '鼓励创业创新', color: '#9B59B6', icon: '🚀' }
  //       ]
  //     }
  //   ]
  // }
];

// ===== 3. 数据转换工具函数 =====

/**
 * 根据前端维度ID获取映射配置
 */
export function getDimensionMapping(frontendId: string): DimensionMapping | null {
  return UNIFIED_DIMENSION_MAPPING.find(dim => dim.frontendId === frontendId) || null;
}

/**
 * 根据前端问题ID获取问题映射配置
 */
export function getQuestionMapping(frontendQuestionId: string): QuestionMapping | null {
  for (const dimension of UNIFIED_DIMENSION_MAPPING) {
    const question = dimension.questions.find(q => q.frontendQuestionId === frontendQuestionId);
    if (question) return question;
  }
  return null;
}

/**
 * 获取所有API数据字段名
 */
export function getAllApiDataFields(): string[] {
  const fields: string[] = [];
  for (const dimension of UNIFIED_DIMENSION_MAPPING) {
    for (const question of dimension.questions) {
      if (!fields.includes(question.apiDataField)) {
        fields.push(question.apiDataField);
      }
    }
  }
  return fields;
}

/**
 * 获取所有前端维度ID
 */
export function getAllFrontendDimensionIds(): string[] {
  return UNIFIED_DIMENSION_MAPPING.map(dim => dim.frontendId);
}

/**
 * 验证映射配置的完整性
 */
export function validateMappingConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查维度ID唯一性
  const dimensionIds = UNIFIED_DIMENSION_MAPPING.map(dim => dim.frontendId);
  const uniqueDimensionIds = new Set(dimensionIds);
  if (dimensionIds.length !== uniqueDimensionIds.size) {
    errors.push('维度ID存在重复');
  }

  // 检查问题ID唯一性
  const questionIds: string[] = [];
  for (const dimension of UNIFIED_DIMENSION_MAPPING) {
    for (const question of dimension.questions) {
      questionIds.push(question.frontendQuestionId);
    }
  }
  const uniqueQuestionIds = new Set(questionIds);
  if (questionIds.length !== uniqueQuestionIds.size) {
    errors.push('问题ID存在重复');
  }

  // 检查每个维度至少有一个问题
  for (const dimension of UNIFIED_DIMENSION_MAPPING) {
    if (dimension.questions.length === 0) {
      warnings.push(`维度 ${dimension.frontendId} 没有配置问题`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ===== 4. 导出配置验证 =====

// 在模块加载时验证配置
const validation = validateMappingConfig();
if (!validation.isValid) {
  console.error('统一数据映射配置验证失败:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('统一数据映射配置警告:', validation.warnings);
}

export default UNIFIED_DIMENSION_MAPPING;

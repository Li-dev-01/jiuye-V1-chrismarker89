/**
 * 问卷条件逻辑工具
 * 处理问题之间的依赖关系和条件显示
 */

// 学历-院校类型映射规则
export const EDUCATION_SCHOOL_MAPPING = {
  'high-school': [
    'vocational',      // 职业学校
    'other'           // 其他
  ],
  'junior-college': [
    'vocational',      // 专科院校
    'other'           // 其他
  ],
  'bachelor': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'regular-public', // 普通公办本科
    'private',        // 民办本科
    'overseas'        // 海外院校
  ],
  'master': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'regular-public', // 普通公办本科
    'research-institute', // 科研院所
    'overseas'        // 海外院校
  ],
  'phd': [
    '985',            // 985高校
    '211',            // 211高校（非985）
    'double-first-class', // 双一流高校
    'research-institute', // 科研院所
    'overseas'        // 海外院校
  ]
} as const;

// 院校类型标签映射
export const SCHOOL_TYPE_LABELS = {
  '985': '985高校',
  '211': '211高校（非985）',
  'double-first-class': '双一流高校',
  'regular-public': '普通公办本科',
  'private': '民办本科',
  'vocational': '专科院校',
  'research-institute': '科研院所',
  'overseas': '海外院校',
  'other': '其他'
} as const;

// 学历标签映射
export const EDUCATION_LABELS = {
  'high-school': '高中及以下',
  'junior-college': '大专',
  'bachelor': '本科',
  'master': '硕士研究生',
  'phd': '博士研究生'
} as const;

/**
 * 根据学历获取可选的院校类型
 */
export function getAvailableSchoolTypes(educationLevel: string): string[] {
  return EDUCATION_SCHOOL_MAPPING[educationLevel as keyof typeof EDUCATION_SCHOOL_MAPPING] || [];
}

/**
 * 验证学历-院校类型组合是否有效
 */
export function validateEducationSchoolCombination(
  educationLevel: string, 
  schoolType: string
): { valid: boolean; message?: string } {
  if (!educationLevel || !schoolType) {
    return { valid: true }; // 如果任一为空，不进行验证
  }

  const validSchoolTypes = getAvailableSchoolTypes(educationLevel);
  
  if (!validSchoolTypes.includes(schoolType)) {
    const educationLabel = EDUCATION_LABELS[educationLevel as keyof typeof EDUCATION_LABELS];
    const schoolLabel = SCHOOL_TYPE_LABELS[schoolType as keyof typeof SCHOOL_TYPE_LABELS];
    
    return {
      valid: false,
      message: `${educationLabel}与${schoolLabel}不匹配，请重新选择`
    };
  }
  
  return { valid: true };
}

/**
 * 获取学历标签
 */
export function getEducationLabel(educationLevel: string): string {
  return EDUCATION_LABELS[educationLevel as keyof typeof EDUCATION_LABELS] || educationLevel;
}

/**
 * 获取院校类型标签
 */
export function getSchoolTypeLabel(schoolType: string): string {
  return SCHOOL_TYPE_LABELS[schoolType as keyof typeof SCHOOL_TYPE_LABELS] || schoolType;
}

/**
 * 条件逻辑规则定义
 */
export interface ConditionalRule {
  dependsOn: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logic?: 'and' | 'or';
}

/**
 * 问题条件配置
 */
export const QUESTION_CONDITIONS = {
  // 院校类型依赖学历
  'university-tier': [
    {
      dependsOn: 'education-level',
      operator: 'not_equals' as const,
      value: null
    }
  ],
  
  // 已就业人群相关问题
  'employment-type': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'employed'
    }
  ],

  'current-salary': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'employed'
    }
  ],

  'work-industry': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'employed'
    }
  ],

  'job-satisfaction': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'employed'
    }
  ],

  // 失业/求职人群相关问题
  'unemployment-duration': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'unemployed'
    }
  ],

  'last-job-salary': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'unemployed'
    }
  ],

  'job-search-channels': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'unemployed'
    }
  ],

  'job-search-difficulties': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'unemployed'
    }
  ],

  // 在校学生相关问题
  'study-year': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'student'
    }
  ],

  'career-planning': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'student'
    }
  ],

  'internship-experience': [
    {
      dependsOn: 'current-status',
      operator: 'equals' as const,
      value: 'student'
    }
  ]
} as const;

/**
 * 评估条件是否满足
 */
export function evaluateCondition(
  dependentValue: any,
  operator: ConditionalRule['operator'],
  targetValue: any
): boolean {
  // 检查值是否为空（null、undefined、空字符串）
  const isEmpty = (value: any) => value === null || value === undefined || value === '';

  switch (operator) {
    case 'equals':
      return dependentValue === targetValue;
    case 'not_equals':
      // 特殊处理：如果目标值是null/undefined，检查依赖值是否为空
      if (targetValue === null || targetValue === undefined) {
        return !isEmpty(dependentValue);
      }
      return dependentValue !== targetValue;
    case 'contains':
      return Array.isArray(dependentValue) && dependentValue.includes(targetValue);
    case 'not_contains':
      return Array.isArray(dependentValue) && !dependentValue.includes(targetValue);
    case 'in':
      return Array.isArray(targetValue) && targetValue.includes(dependentValue);
    case 'not_in':
      return Array.isArray(targetValue) && !targetValue.includes(dependentValue);
    default:
      return true;
  }
}

/**
 * 检查问题是否应该显示
 */
export function shouldShowQuestion(
  questionId: string,
  formData: Record<string, any>
): boolean {
  const conditions = QUESTION_CONDITIONS[questionId as keyof typeof QUESTION_CONDITIONS];
  
  if (!conditions) {
    return true; // 没有条件限制，默认显示
  }
  
  return conditions.every(condition => {
    const dependentValue = formData[condition.dependsOn];
    return evaluateCondition(dependentValue, condition.operator, condition.value);
  });
}

/**
 * 获取问题的可用选项（用于动态选项过滤）
 */
export function getAvailableOptions(
  questionId: string,
  formData: Record<string, any>,
  originalOptions: Array<{ value: string; label: string }>
): Array<{ value: string; label: string }> {
  switch (questionId) {
    case 'university-tier':
      const educationLevel = formData['education-level'];
      if (!educationLevel) {
        return []; // 如果没有选择学历，不显示任何选项
      }
      
      const availableSchoolTypes = getAvailableSchoolTypes(educationLevel);
      return originalOptions.filter(option => 
        availableSchoolTypes.includes(option.value)
      );
      
    default:
      return originalOptions;
  }
}

/**
 * 清理不匹配的表单数据
 */
export function cleanupFormData(
  questionId: string,
  newValue: any,
  formData: Record<string, any>
): Record<string, any> {
  const updatedData = { ...formData, [questionId]: newValue };
  
  // 如果是学历变更，需要清理不匹配的院校类型
  if (questionId === 'education-level') {
    const currentSchoolType = formData['university-tier'];
    if (currentSchoolType) {
      const validation = validateEducationSchoolCombination(newValue, currentSchoolType);
      if (!validation.valid) {
        updatedData['university-tier'] = null; // 清空不匹配的院校类型
      }
    }
  }
  
  return updatedData;
}

/**
 * 获取表单验证错误
 */
export function getFormValidationErrors(formData: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // 验证学历-院校类型组合
  const educationLevel = formData['education-level'];
  const schoolType = formData['university-tier'];
  
  if (educationLevel && schoolType) {
    const validation = validateEducationSchoolCombination(educationLevel, schoolType);
    if (!validation.valid) {
      errors['university-tier'] = validation.message || '学历与院校类型不匹配';
    }
  }
  
  return errors;
}

/**
 * 获取问题的提示信息
 */
export function getQuestionHint(
  questionId: string,
  formData: Record<string, any>
): string | null {
  switch (questionId) {
    case 'university-tier':
      const educationLevel = formData['education-level'];
      if (!educationLevel) {
        return '请先选择您的学历层次';
      }
      break;
      
    case 'employment-type':
    case 'current-salary':
    case 'work-industry':
    case 'job-satisfaction':
      const currentStatus = formData['current-status'];
      if (currentStatus !== 'employed') {
        return '此问题仅适用于已就业人员';
      }
      break;

    case 'unemployment-duration':
    case 'last-job-salary':
    case 'job-search-channels':
    case 'job-search-difficulties':
      const unemployedStatus = formData['current-status'];
      if (unemployedStatus !== 'unemployed') {
        return '此问题仅适用于失业/求职人员';
      }
      break;

    case 'study-year':
    case 'career-planning':
    case 'internship-experience':
      const studentStatus = formData['current-status'];
      if (studentStatus !== 'student') {
        return '此问题仅适用于在校学生';
      }
      break;
  }
  
  return null;
}

/**
 * 通用问卷系统类型定义
 */

export interface QuestionOption {
  value: string;
  label: string;
  description?: string; // 选项的详细描述
}

export interface QuestionCondition {
  dependsOn: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
}

export interface QuestionValidation {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: string;
}

export interface QuestionStatistics {
  enabled: boolean;
  chartType?: 'pie' | 'bar' | 'donut' | 'line';
  showPercentage?: boolean;
  showCount?: boolean;
}

export interface QuestionConfig {
  maxLength?: number;
  minLength?: number;
  rows?: number;
  maxSelections?: number;
  minSelections?: number;
  placeholder?: string;
}

export interface Question {
  id: string;
  type: 'radio' | 'checkbox' | 'select' | 'textarea' | 'text' | 'number';
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  condition?: QuestionCondition;
  validation?: QuestionValidation[];
  statistics?: QuestionStatistics;
  config?: QuestionConfig;
  // 扩展属性
  accessibility?: {
    ariaLabel?: string;
    helpText?: string;
    screenReaderText?: string;
    description?: string; // 可访问性描述
  };
  branchLogic?: {
    enabled?: boolean; // 是否启用分支逻辑
    conditions?: Array<{
      questionId: string;
      operator: 'equals' | 'not_equals' | 'in' | 'not_in';
      value: any;
    }>;
    action?: 'show' | 'hide' | 'require' | 'skip';
    affectedSections?: string[]; // 影响的章节
  };
  metadata?: {
    category?: string;
    tags?: string[];
    importance?: 'low' | 'medium' | 'high';
    analyticsEnabled?: boolean;
    sensitivityLevel?: 'low' | 'medium' | 'high'; // 敏感度级别
    privacyNote?: string; // 隐私说明
  };
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  condition?: {
    dependsOn: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
    value: any;
  };
  metadata?: {
    category?: string;
    order?: number;
    estimatedTime?: number;
    importance?: 'low' | 'medium' | 'high';
    cognitiveLoad?: 'low' | 'medium' | 'high'; // 认知负荷
    priority?: 'low' | 'medium' | 'high' | 'critical'; // 优先级
    targetAudience?: string; // 目标受众
    branchingPoint?: boolean; // 是否为分支点
    conditionalLogic?: any; // 条件逻辑
  };
}

export interface QuestionnaireConfig {
  title: string;
  description: string;
  allowAnonymous: boolean;
  requireEmail: boolean;
  allowBackward: boolean;
  showProgress: boolean;
  autoSave: boolean;
  autoSaveInterval?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationSummary?: boolean;
  stopOnFirstError?: boolean;
  showStatistics?: boolean;
  statisticsPosition?: 'top' | 'bottom' | 'side';
  updateStatisticsRealtime?: boolean;
  submitOnComplete?: boolean;
  statisticsUpdateInterval?: number;
  theme?: string;
  enableLazyLoading?: boolean;
  preloadNextSection?: boolean;

  // 第二问卷特有配置
  conversationalMode?: boolean;
  animationEnabled?: boolean;
  tagSelectorMode?: boolean;
  cacheStatistics?: boolean;
  enableConditionalLogic?: boolean;
  showConditionalHints?: boolean;
  // 性能配置
  performance?: {
    enableCaching?: boolean;
    cacheTimeout?: number;
    enableCompression?: boolean;
    enableLazyLoading?: boolean;
    preloadNextSection?: boolean;
    batchStateUpdates?: boolean;
  };
  // 可访问性配置
  accessibility?: {
    enableScreenReader?: boolean;
    enableKeyboardNavigation?: boolean;
    enableHighContrast?: boolean;
    enableFocusIndicators?: boolean;
    enableFocusManagement?: boolean;
  };
  // 验证配置
  validation?: {
    enableRealTimeValidation?: boolean;
    showValidationSummary?: boolean;
    enableCustomValidators?: boolean;
    stopOnFirstError?: boolean;
    enableDynamicValidation?: boolean;
  };
  // 统计配置
  statistics?: {
    enabled?: boolean;
    enableRealTimeStats?: boolean;
    enableAdvancedAnalytics?: boolean;
    enableExport?: boolean;
    position?: string;
    updateRealtime?: boolean;
    updateInterval?: number;
    enableBranchComparison?: boolean;
  };
  // 数据质量配置
  dataQuality?: {
    enableValidation?: boolean;
    requireCompleteness?: boolean;
    enableConsistencyCheck?: boolean;
    enableBranchPathTracking?: boolean;
    enableDataCleaning?: boolean;
    enableSampleSizeMonitoring?: boolean;
  };
  // 用户体验配置
  userExperience?: {
    enableProgressBar?: boolean;
    enableQuestionNumbers?: boolean;
    enableSectionNavigation?: boolean;
    enableAutoSave?: boolean;
    autoSaveInterval?: number;
    enableAnimations?: boolean; // 启用动画效果
    animationDuration?: number; // 动画持续时间
    enableProgressPrediction?: boolean; // 启用进度预测
    showEstimatedTime?: boolean; // 显示预计时间
    enableSmartNavigation?: boolean; // 智能导航
  };
}

export interface QuestionnaireMetadata {
  id: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  author: string;
  category: string;
  tags: string[];
  estimatedTime: number;
  targetAudience: string;
  language: string;
  status: 'draft' | 'published' | 'archived';
  designPrinciples?: string[]; // 设计原则
  qualityMetrics?: {
    completionRate?: number;
    averageTime?: number;
    satisfactionScore?: number;
    expectedCompletionRate?: number; // 预期完成率
    maxCognitiveLoad?: number; // 最大认知负荷
    targetResponseTime?: number; // 目标响应时间
    accessibilityScore?: string; // 可访问性评分
  };
}

export interface UniversalQuestionnaire {
  id: string;
  title: string;
  description: string;
  sections: QuestionnaireSection[];
  config: QuestionnaireConfig;
  metadata: QuestionnaireMetadata;
}

export interface QuestionResponse {
  questionId: string;
  value: any;
}

export interface SectionResponse {
  sectionId: string;
  questionResponses: QuestionResponse[];
}

export interface QuestionnaireResponse {
  sectionResponses: SectionResponse[];
  submittedAt: string;
  isCompleted: boolean;
  timeSpent: number;
}

export interface QuestionStatistic {
  questionId: string;
  totalResponses: number;
  values: Record<string, number>;
  lastUpdated: string;
  options?: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
}

export interface QuestionnaireStatistics {
  totalResponses: number;
  statistics: Record<string, QuestionStatistic>;
  lastUpdated: string;
}

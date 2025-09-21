/**
 * 问卷系统核心类型定义
 * 
 * 包含问卷、节、问题等核心数据结构的类型定义
 */

// 问题类型枚举
export type QuestionType = 
  | 'radio'        // 单选题
  | 'checkbox'     // 多选题
  | 'select'       // 下拉选择
  | 'text'         // 文本输入
  | 'textarea'     // 长文本
  | 'number'       // 数字输入
  | 'date'         // 日期选择
  | 'email'        // 邮箱输入
  | 'rating'       // 评分
  | 'slider'       // 滑块
  | 'file'         // 文件上传
  | 'matrix'       // 矩阵题
  | 'ranking'      // 排序题
  | 'likert';      // 李克特量表

// 验证规则类型
export type ValidationType = 
  | 'required'     // 必填
  | 'minLength'    // 最小长度
  | 'maxLength'    // 最大长度
  | 'min'          // 最小值
  | 'max'          // 最大值
  | 'pattern'      // 正则表达式
  | 'email'        // 邮箱格式
  | 'url'          // URL格式
  | 'custom';      // 自定义验证

// 统计图表类型
export type ChartType = 'bar' | 'pie' | 'line' | 'area' | 'heatmap' | 'donut';

// 问题选项接口
export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

// 验证规则接口
export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
  validator?: (value: any, formData: any) => boolean | string;
}

// 问题统计接口
export interface QuestionStatistics {
  totalResponses: number;
  options: OptionStatistic[];
  lastUpdated: number;
  trend?: TrendData[];
}

// 选项统计接口
export interface OptionStatistic {
  value: string;
  label: string;
  count: number;
  percentage: number;
  isSelected?: boolean;
  trend?: number; // 相比上期的变化百分比
}

// 趋势数据接口
export interface TrendData {
  timestamp: number;
  value: number;
  label?: string;
}

// 问题接口
export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  
  // 选项配置（适用于选择类问题）
  options?: QuestionOption[];
  
  // 验证规则
  validation?: ValidationRule[];
  
  // 条件显示
  condition?: QuestionCondition;
  
  // 统计配置
  statistics?: {
    enabled: boolean;
    chartType?: ChartType;
    showPercentage?: boolean;
    showCount?: boolean;
    showTrend?: boolean;
    position?: 'right' | 'bottom' | 'popup';
  };
  
  // 特殊配置
  config?: {
    // 文本类型配置
    multiline?: boolean;
    rows?: number;
    maxLength?: number;
    
    // 数字类型配置
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    
    // 日期类型配置
    minDate?: string;
    maxDate?: string;
    format?: string;
    
    // 评分类型配置
    maxRating?: number;
    allowHalf?: boolean;
    showLabels?: boolean;
    
    // 滑块类型配置
    marks?: { [key: number]: string };
    
    // 文件类型配置
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
    
    // 矩阵题配置
    rows?: QuestionOption[];
    columns?: QuestionOption[];
    
    // 排序题配置
    maxSelections?: number;
  };
  
  // 元数据
  metadata?: {
    order: number;
    category?: string;
    tags?: string[];
    version?: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

// 问题条件接口
export interface QuestionCondition {
  dependsOn: string; // 依赖的问题ID
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less';
  value: any;
  logic?: 'and' | 'or'; // 多条件逻辑
  conditions?: QuestionCondition[]; // 嵌套条件
}

// 问卷节接口
export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  
  // 节验证
  validation?: {
    required?: boolean;
    minQuestions?: number;
    maxQuestions?: number;
    customValidator?: (sectionData: any) => boolean | string;
  };
  
  // 条件显示
  condition?: QuestionCondition;
  
  // 元数据
  metadata?: {
    order: number;
    estimatedTime?: number; // 预估完成时间（分钟）
    category?: string;
    tags?: string[];
  };
}

// 问卷配置接口
export interface QuestionnaireConfig {
  // 基础设置
  title: string;
  description?: string;
  allowAnonymous: boolean;
  requireEmail: boolean;
  
  // 导航设置
  allowBackward: boolean;
  showProgress: boolean;
  autoSave: boolean;
  autoSaveInterval?: number; // 自动保存间隔（毫秒）
  
  // 验证设置
  validateOnChange: boolean;
  validateOnBlur: boolean;
  showValidationSummary: boolean;
  stopOnFirstError: boolean;
  
  // 统计设置
  showStatistics: boolean;
  statisticsPosition: 'right' | 'bottom' | 'popup';
  updateStatisticsRealtime: boolean;
  statisticsUpdateInterval?: number;
  
  // 主题设置
  theme: string;
  customCSS?: string;
  
  // API设置
  apiEndpoint?: string;
  submitEndpoint?: string;
  statisticsEndpoint?: string;
  
  // 性能设置
  enableLazyLoading: boolean;
  preloadNextSection: boolean;
  cacheStatistics: boolean;
  cacheTimeout?: number;
  
  // 安全设置
  enableCSRFProtection: boolean;
  enableRateLimit: boolean;
  maxSubmissionsPerIP?: number;
  
  // 国际化设置
  locale: string;
  supportedLocales?: string[];
  
  // 回调函数
  onSectionChange?: (sectionId: string, progress: number) => void;
  onQuestionAnswer?: (questionId: string, value: any) => void;
  onValidationError?: (errors: ValidationError[]) => void;
  onSubmitStart?: () => void;
  onSubmitSuccess?: (response: any) => void;
  onSubmitError?: (error: any) => void;
}

// 问卷元数据接口
export interface QuestionnaireMetadata {
  id: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  category?: string;
  tags?: string[];
  estimatedTime?: number; // 预估完成时间（分钟）
  targetAudience?: string;
  language: string;
  status: 'draft' | 'published' | 'archived';
}

// 主问卷接口
export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  sections: QuestionnaireSection[];
  config: QuestionnaireConfig;
  metadata: QuestionnaireMetadata;
}

// 问卷响应数据接口
export interface QuestionnaireResponse {
  questionnaireId: string;
  sectionResponses: SectionResponse[];
  metadata: ResponseMetadata;
}

// 节响应接口
export interface SectionResponse {
  sectionId: string;
  questionResponses: QuestionResponse[];
  completedAt?: number;
  timeSpent?: number; // 花费时间（毫秒）
}

// 问题响应接口
export interface QuestionResponse {
  questionId: string;
  value: any;
  answeredAt: number;
  timeSpent?: number;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

// 响应元数据接口
export interface ResponseMetadata {
  responseId: string;
  userId?: string;
  isAnonymous: boolean;
  startedAt: number;
  completedAt?: number;
  totalTimeSpent?: number;
  deviceInfo?: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
  };
  submissionInfo?: {
    ipAddress: string;
    location?: string;
    referrer?: string;
  };
}

// 验证错误接口
export interface ValidationError {
  questionId: string;
  sectionId: string;
  field: string;
  message: string;
  value: any;
  rule: ValidationRule;
}

// 进度信息接口
export interface ProgressInfo {
  currentSection: number;
  totalSections: number;
  currentQuestion: number;
  totalQuestions: number;
  completedQuestions: number;
  percentage: number;
  estimatedTimeRemaining?: number; // 预估剩余时间（分钟）
}

// 提交结果接口
export interface SubmissionResult {
  success: boolean;
  responseId?: string;
  message?: string;
  errors?: ValidationError[];
  redirectUrl?: string;
  metadata?: {
    submittedAt: number;
    processingTime: number;
    verified: boolean;
  };
}

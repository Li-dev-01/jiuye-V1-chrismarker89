/**
 * 通用问卷系统类型定义
 * 基于原有通用问卷系统的数据结构
 */

// 问题类型枚举
export type UniversalQuestionType = 
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
export type UniversalValidationType = 
  | 'required'     // 必填
  | 'minLength'    // 最小长度
  | 'maxLength'    // 最大长度
  | 'min'          // 最小值
  | 'max'          // 最大值
  | 'pattern'      // 正则表达式
  | 'email'        // 邮箱格式
  | 'url'          // URL格式
  | 'custom';      // 自定义验证

// 图表类型
export type UniversalChartType = 
  | 'bar'          // 条形图
  | 'pie'          // 饼图
  | 'donut'        // 环形图
  | 'line'         // 折线图
  | 'area'         // 面积图
  | 'scatter'      // 散点图
  | 'heatmap'      // 热力图
  | 'histogram'    // 直方图
  | 'box'          // 箱线图
  | 'radar'        // 雷达图
  | 'wordcloud'    // 词云图
  | 'timeline';    // 时间线图

// 问题选项接口
export interface UniversalQuestionOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  color?: string;
}

// 验证规则接口
export interface UniversalValidationRule {
  type: UniversalValidationType;
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | string;
}

// 条件显示接口
export interface UniversalQuestionCondition {
  dependsOn: string; // 依赖的问题ID
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

// 统计数据接口
export interface UniversalStatisticsData {
  totalResponses: number;
  options?: {
    value: string | number;
    label: string;
    count: number;
    percentage: number;
  }[];
  mean?: number;
  median?: number;
  mode?: any;
  range?: {
    min: number;
    max: number;
  };
  distribution?: {
    value: any;
    count: number;
  }[];
  trend?: {
    timestamp: number;
    value: number;
  }[];
}

// 问题配置接口
export interface UniversalQuestionConfig {
  // 通用配置
  layout?: 'vertical' | 'horizontal' | 'grid';
  size?: 'small' | 'medium' | 'large';
  
  // 选择类问题配置
  allowOther?: boolean;
  allowMultiple?: boolean;
  maxSelections?: number;
  minSelections?: number;
  
  // 输入类问题配置
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  autocomplete?: string;
  
  // 数字类问题配置
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  
  // 评分类问题配置
  maxRating?: number;
  allowHalf?: boolean;
  showLabels?: boolean;
  labels?: string[];
  
  // 滑块类问题配置
  marks?: Record<number, string>;
  showValue?: boolean;
  
  // 文件上传配置
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  
  // 日期配置
  format?: string;
  showTime?: boolean;
  
  // 其他配置
  [key: string]: any;
}

// 问题接口
export interface UniversalQuestion {
  id: string;
  type: UniversalQuestionType;
  title: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  
  // 选项配置（适用于选择类问题）
  options?: UniversalQuestionOption[];
  
  // 验证规则
  validation?: UniversalValidationRule[];
  
  // 条件显示
  condition?: UniversalQuestionCondition;
  
  // 问题配置
  config?: UniversalQuestionConfig;
  
  // 统计配置
  statistics?: {
    enabled: boolean;
    chartType?: UniversalChartType;
    showPercentage?: boolean;
    showCount?: boolean;
    showTrend?: boolean;
    position?: 'right' | 'bottom' | 'popup';
  };
  
  // 排序权重
  order?: number;
}

// 问卷节接口
export interface UniversalQuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: UniversalQuestion[];
  order?: number;
  condition?: UniversalQuestionCondition;
}

// 问卷配置接口
export interface UniversalQuestionnaireConfig {
  title?: string;
  description?: string;
  allowAnonymous?: boolean;
  requireEmail?: boolean;
  allowBackward?: boolean;
  showProgress?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationSummary?: boolean;
  stopOnFirstError?: boolean;
  showStatistics?: boolean;
  statisticsPosition?: 'right' | 'bottom' | 'popup';
  updateStatisticsRealtime?: boolean;
  statisticsUpdateInterval?: number;
  theme?: string;
  enableLazyLoading?: boolean;
  preloadNextSection?: boolean;
  cacheStatistics?: boolean;
  [key: string]: any;
}

// 问卷元数据接口
export interface UniversalQuestionnaireMetadata {
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
export interface UniversalQuestionnaire {
  id: string;
  title: string;
  description?: string;
  sections: UniversalQuestionnaireSection[];
  config: UniversalQuestionnaireConfig;
  metadata: UniversalQuestionnaireMetadata;
}

// 问题响应接口
export interface UniversalQuestionResponse {
  questionId: string;
  value: any;
  timestamp?: number;
  duration?: number; // 回答耗时（毫秒）
}

// 节响应接口
export interface UniversalSectionResponse {
  sectionId: string;
  questionResponses: UniversalQuestionResponse[];
  startTime?: number;
  endTime?: number;
}

// 响应元数据接口
export interface UniversalResponseMetadata {
  submittedAt: number;
  completionTime: number; // 总完成时间（毫秒）
  userAgent: string;
  ipAddress?: string;
  sessionId?: string;
  version: string;
  [key: string]: any;
}

// 问卷响应数据接口
export interface UniversalQuestionnaireResponse {
  questionnaireId: string;
  sectionResponses: UniversalSectionResponse[];
  metadata: UniversalResponseMetadata;
}

// 问卷统计接口
export interface UniversalQuestionnaireStatistics {
  questionnaireId: string;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  questionStatistics: Record<string, UniversalStatisticsData>;
  lastUpdated: number;
}

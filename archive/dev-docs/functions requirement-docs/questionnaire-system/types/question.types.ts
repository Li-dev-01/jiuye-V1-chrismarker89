/**
 * 问题类型相关的类型定义
 * 
 * 包含各种问题类型的特定配置和行为定义
 */

import { QuestionType, QuestionOption, ValidationRule, ChartType } from './questionnaire.types';

// 问题渲染器属性接口
export interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  showStatistics?: boolean;
  statistics?: QuestionStatistics;
  theme?: string;
}

// 基础问题接口
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
}

// 单选题接口
export interface RadioQuestion extends BaseQuestion {
  type: 'radio';
  options: QuestionOption[];
  config?: {
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    allowOther?: boolean;
    otherPlaceholder?: string;
  };
}

// 多选题接口
export interface CheckboxQuestion extends BaseQuestion {
  type: 'checkbox';
  options: QuestionOption[];
  config?: {
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    minSelections?: number;
    maxSelections?: number;
    allowOther?: boolean;
    otherPlaceholder?: string;
    selectAllOption?: boolean;
  };
}

// 下拉选择接口
export interface SelectQuestion extends BaseQuestion {
  type: 'select';
  options: QuestionOption[];
  config?: {
    searchable?: boolean;
    multiple?: boolean;
    maxSelections?: number;
    placeholder?: string;
    noOptionsMessage?: string;
  };
}

// 文本输入接口
export interface TextQuestion extends BaseQuestion {
  type: 'text';
  config?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    autocomplete?: string;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url';
  };
}

// 长文本接口
export interface TextareaQuestion extends BaseQuestion {
  type: 'textarea';
  config?: {
    rows?: number;
    maxLength?: number;
    minLength?: number;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    autoResize?: boolean;
    showCharCount?: boolean;
  };
}

// 数字输入接口
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  config?: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    format?: 'integer' | 'decimal' | 'currency' | 'percentage';
    prefix?: string;
    suffix?: string;
    thousandSeparator?: boolean;
  };
}

// 日期选择接口
export interface DateQuestion extends BaseQuestion {
  type: 'date';
  config?: {
    minDate?: string;
    maxDate?: string;
    format?: string;
    showTime?: boolean;
    timeFormat?: '12h' | '24h';
    disabledDates?: string[];
    highlightedDates?: string[];
    locale?: string;
  };
}

// 邮箱输入接口
export interface EmailQuestion extends BaseQuestion {
  type: 'email';
  config?: {
    domains?: string[]; // 允许的域名
    blockedDomains?: string[]; // 禁止的域名
    requireVerification?: boolean;
    verificationEndpoint?: string;
  };
}

// 评分接口
export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  config?: {
    maxRating?: number;
    allowHalf?: boolean;
    showLabels?: boolean;
    labels?: string[];
    icon?: 'star' | 'heart' | 'thumb' | 'number';
    size?: 'small' | 'medium' | 'large';
    color?: string;
  };
}

// 滑块接口
export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  config?: {
    min: number;
    max: number;
    step?: number;
    marks?: { [key: number]: string };
    showValue?: boolean;
    showRange?: boolean;
    vertical?: boolean;
    tooltipFormatter?: (value: number) => string;
  };
}

// 文件上传接口
export interface FileQuestion extends BaseQuestion {
  type: 'file';
  config?: {
    accept?: string;
    maxSize?: number; // 字节
    maxFiles?: number;
    multiple?: boolean;
    uploadEndpoint?: string;
    previewEnabled?: boolean;
    compressionEnabled?: boolean;
    compressionQuality?: number;
  };
}

// 矩阵题接口
export interface MatrixQuestion extends BaseQuestion {
  type: 'matrix';
  config?: {
    rows: QuestionOption[];
    columns: QuestionOption[];
    inputType?: 'radio' | 'checkbox' | 'text' | 'number';
    required?: boolean;
    allowPartial?: boolean;
  };
}

// 排序题接口
export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
  options: QuestionOption[];
  config?: {
    maxSelections?: number;
    minSelections?: number;
    dragEnabled?: boolean;
    showNumbers?: boolean;
    allowTies?: boolean;
  };
}

// 李克特量表接口
export interface LikertQuestion extends BaseQuestion {
  type: 'likert';
  config?: {
    scale: number; // 量表级数，如5、7
    labels?: {
      left?: string;
      right?: string;
      center?: string;
    };
    statements: string[];
    required?: boolean;
    allowNeutral?: boolean;
  };
}

// 联合问题类型
export type Question = 
  | RadioQuestion
  | CheckboxQuestion
  | SelectQuestion
  | TextQuestion
  | TextareaQuestion
  | NumberQuestion
  | DateQuestion
  | EmailQuestion
  | RatingQuestion
  | SliderQuestion
  | FileQuestion
  | MatrixQuestion
  | RankingQuestion
  | LikertQuestion;

// 问题统计接口
export interface QuestionStatistics {
  questionId: string;
  questionType: QuestionType;
  totalResponses: number;
  lastUpdated: number;
  
  // 选择类问题统计
  optionStats?: OptionStatistic[];
  
  // 数值类问题统计
  numericStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    mode: number;
    standardDeviation: number;
    distribution: { value: number; count: number }[];
  };
  
  // 文本类问题统计
  textStats?: {
    averageLength: number;
    wordCloud: { word: string; count: number }[];
    sentiment?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  
  // 日期类问题统计
  dateStats?: {
    earliest: string;
    latest: string;
    distribution: { date: string; count: number }[];
  };
  
  // 文件类问题统计
  fileStats?: {
    totalFiles: number;
    totalSize: number;
    fileTypes: { type: string; count: number }[];
    averageSize: number;
  };
  
  // 趋势数据
  trend?: TrendData[];
}

// 选项统计接口
export interface OptionStatistic {
  value: string;
  label: string;
  count: number;
  percentage: number;
  isSelected?: boolean;
  trend?: number;
  metadata?: {
    firstSelectedAt?: number;
    lastSelectedAt?: number;
    averageSelectionTime?: number;
  };
}

// 趋势数据接口
export interface TrendData {
  timestamp: number;
  value: number;
  count?: number;
  percentage?: number;
  label?: string;
}

// 问题验证结果接口
export interface QuestionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

// 验证错误接口
export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: ValidationRule;
  severity: 'error' | 'warning';
}

// 验证警告接口
export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

// 问题事件接口
export interface QuestionEvent {
  type: 'focus' | 'blur' | 'change' | 'submit' | 'error';
  questionId: string;
  value: any;
  timestamp: number;
  metadata?: {
    timeSpent?: number;
    attempts?: number;
    userAgent?: string;
  };
}

// 问题渲染配置接口
export interface QuestionRenderConfig {
  showTitle: boolean;
  showDescription: boolean;
  showRequired: boolean;
  showValidation: boolean;
  showStatistics: boolean;
  animationEnabled: boolean;
  theme: string;
  customCSS?: string;
  
  // 布局配置
  layout: {
    direction: 'row' | 'column';
    spacing: 'compact' | 'normal' | 'relaxed';
    alignment: 'left' | 'center' | 'right';
  };
  
  // 交互配置
  interaction: {
    autoFocus: boolean;
    tabIndex?: number;
    accessibilityEnabled: boolean;
    keyboardNavigation: boolean;
  };
}

// 问题工厂接口
export interface QuestionFactory {
  createQuestion(type: QuestionType, config: any): Question;
  validateQuestion(question: Question): QuestionValidationResult;
  renderQuestion(question: Question, props: QuestionRendererProps): React.ReactElement;
  getDefaultConfig(type: QuestionType): any;
  getSupportedTypes(): QuestionType[];
}

// 问题插件接口
export interface QuestionPlugin {
  name: string;
  version: string;
  supportedTypes: QuestionType[];
  
  // 生命周期钩子
  onQuestionMount?(question: Question): void;
  onQuestionUnmount?(question: Question): void;
  onValueChange?(question: Question, oldValue: any, newValue: any): void;
  onValidation?(question: Question, result: QuestionValidationResult): void;
  
  // 自定义渲染
  customRenderer?(question: Question, props: QuestionRendererProps): React.ReactElement | null;
  
  // 自定义验证
  customValidator?(question: Question, value: any): ValidationError[] | null;
  
  // 自定义统计
  customStatistics?(question: Question, responses: any[]): QuestionStatistics | null;
}

/**
 * 混合可视化系统类型定义
 * 支持问卷2的3维度专业分析和问卷1的6维度全面分析
 */

// 基础图表数据接口
export interface ChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color?: string;
  icon?: string;
}

// 通用图表数据接口
export interface UniversalChartData {
  questionId: string;
  questionTitle: string;
  chartType: 'pie' | 'bar' | 'donut' | 'line' | 'treemap' | 'heatmap';
  data: ChartDataPoint[];
  totalResponses: number;
  lastUpdated: string;
  insight?: string;
}

// 通用维度数据接口
export interface UniversalDimensionData {
  dimensionId: string;
  dimensionTitle: string;
  description: string;
  icon: string;
  totalResponses: number;
  completionRate: number;
  charts: UniversalChartData[];
  insights?: string[];
}

// Tab页面类型定义
export type TabType = 'q2-specialized' | 'q1-comprehensive';

export interface TabConfig {
  key: TabType;
  label: string;
  description: string;
  icon: string;
  dimensions: UniversalDimensionData[];
}

// 问卷2专业分析维度ID
export const Q2_DIMENSION_IDS = {
  ECONOMIC_PRESSURE: 'economic-pressure-analysis-v2',
  EMPLOYMENT_CONFIDENCE: 'employment-confidence-analysis-v2', 
  MODERN_DEBT: 'modern-debt-analysis-v2'
} as const;

// 问卷1全面分析维度ID
export const Q1_DIMENSION_IDS = {
  EMPLOYMENT_OVERVIEW: 'employment-overview-from-q2',
  DEMOGRAPHICS: 'demographics-from-q2',
  MARKET_ANALYSIS: 'market-analysis-from-q2',
  PREPAREDNESS: 'preparedness-from-q2',
  LIVING_COSTS: 'living-costs-from-q2',
  POLICY_INSIGHTS: 'policy-insights-from-q2'
} as const;

// 混合可视化数据接口
export interface HybridVisualizationData {
  questionnaireId: string;
  title: string;
  totalResponses: number;
  completionRate: number;
  lastUpdated: string;
  
  // Tab配置
  tabs: TabConfig[];
  
  // 元数据
  metadata: {
    dataSource: string;
    transformationVersion: string;
    cacheInfo?: {
      lastCached: string;
      expiresAt: string;
    };
  };
}

// 数据转换结果接口
export interface DataTransformationResult {
  success: boolean;
  data?: UniversalDimensionData[];
  error?: string;
  transformationTime: number;
  sourceDataVersion: string;
}

// 可视化配置接口
export interface VisualizationConfig {
  enableQ2Specialized: boolean;
  enableQ1Comprehensive: boolean;
  defaultTab: TabType;
  showDataSource: boolean;
  enableComparison: boolean;
}

// 数据源状态接口
export interface DataSourceStatus {
  isOnline: boolean;
  lastSync: string;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  responseTime: number;
}

// 洞察生成配置
export interface InsightConfig {
  enableAutoGeneration: boolean;
  insightTypes: ('trend' | 'correlation' | 'anomaly' | 'recommendation')[];
  language: 'zh-CN' | 'en-US';
}

// 图表渲染配置
export interface ChartRenderConfig {
  theme: 'light' | 'dark';
  colorScheme: 'default' | 'professional' | 'modern';
  animation: boolean;
  responsive: boolean;
  showLegend: boolean;
  showTooltip: boolean;
}

// 错误处理接口
export interface VisualizationError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

// 性能监控接口
export interface PerformanceMetrics {
  dataLoadTime: number;
  transformationTime: number;
  renderTime: number;
  totalTime: number;
  memoryUsage: number;
}

// 用户交互事件接口
export interface UserInteractionEvent {
  type: 'tab-switch' | 'chart-click' | 'dimension-select' | 'export-data';
  timestamp: string;
  data: any;
  userId?: string;
}

// 导出配置接口
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'png' | 'json';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRawData: boolean;
  customTitle?: string;
}

// API响应接口
export interface HybridVisualizationResponse {
  success: boolean;
  data?: HybridVisualizationData;
  error?: VisualizationError;
  performance?: PerformanceMetrics;
}

// 缓存策略接口
export interface CacheStrategy {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  key: string;
  version: string;
}

// 数据验证结果接口
export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataCompleteness: number; // 0-100
  qualityScore: number; // 0-100
}

// 维度映射配置接口
export interface DimensionMappingConfig {
  sourceQuestionnaireId: string;
  targetDimensionId: string;
  mappingRules: {
    questionId: string;
    transformFunction: string;
    weight: number;
  }[];
  validationRules: string[];
}

// 实时更新配置接口
export interface RealTimeUpdateConfig {
  enabled: boolean;
  interval: number; // Update interval in seconds
  autoRefresh: boolean;
  notifyOnUpdate: boolean;
}

// 用户偏好设置接口
export interface UserPreferences {
  defaultTab: TabType;
  chartPreferences: ChartRenderConfig;
  exportPreferences: ExportConfig;
  notificationSettings: {
    dataUpdates: boolean;
    systemAlerts: boolean;
    performanceWarnings: boolean;
  };
}

// 系统状态接口
export interface SystemStatus {
  isHealthy: boolean;
  services: {
    api: 'online' | 'offline' | 'degraded';
    database: 'online' | 'offline' | 'degraded';
    cache: 'online' | 'offline' | 'degraded';
  };
  lastHealthCheck: string;
  uptime: number;
}

// 分析报告接口
export interface AnalysisReport {
  id: string;
  title: string;
  generatedAt: string;
  type: 'specialized' | 'comprehensive' | 'comparison';
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  dataQuality: DataValidationResult;
  charts: UniversalChartData[];
}

// 比较分析接口
export interface ComparisonAnalysis {
  q2Specialized: UniversalDimensionData[];
  q1Comprehensive: UniversalDimensionData[];
  differences: {
    dimensionId: string;
    metric: string;
    q2Value: number;
    q1Value: number;
    difference: number;
    significance: 'high' | 'medium' | 'low';
  }[];
  correlations: {
    dimension1: string;
    dimension2: string;
    correlation: number;
    pValue: number;
  }[];
}

// 趋势分析接口
export interface TrendAnalysis {
  dimensionId: string;
  timeRange: {
    start: string;
    end: string;
  };
  dataPoints: {
    timestamp: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  forecast: {
    timestamp: string;
    predictedValue: number;
    confidence: number;
  }[];
}

// 异常检测接口
export interface AnomalyDetection {
  dimensionId: string;
  anomalies: {
    timestamp: string;
    value: number;
    expectedValue: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  detectionMethod: string;
  confidence: number;
}

// 数据质量监控接口
export interface DataQualityMonitor {
  overall: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };
  dimensions: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  issues: {
    type: 'missing_data' | 'invalid_format' | 'outlier' | 'inconsistency';
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedFields: string[];
  }[];
}

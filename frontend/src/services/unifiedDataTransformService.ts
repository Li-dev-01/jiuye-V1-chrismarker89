/**
 * 统一数据转换服务
 * 解决API数据格式与前端组件期望格式不匹配的问题
 */

import { 
  UNIFIED_DIMENSION_MAPPING, 
  getDimensionMapping, 
  getQuestionMapping,
  type DimensionMapping,
  type QuestionMapping,
  type OptionMapping
} from '../config/unifiedDataMapping';

// ===== 1. 标准化的数据接口 =====

/**
 * 标准化的可视化数据点
 */
export interface StandardVisualizationDataPoint {
  // 显示标签
  label: string;
  // 原始API值
  apiValue: string;
  // 数值
  value: number;
  // 百分比
  percentage: number;
  // 颜色
  color: string;
  // 图标
  icon?: string;
  // 额外元数据
  metadata?: {
    socialValue?: string;
    description?: string;
  };
}

/**
 * 标准化的图表数据
 */
export interface StandardChartData {
  questionId: string;
  questionTitle: string;
  chartType: string;
  data: StandardVisualizationDataPoint[];
  totalResponses: number;
  lastUpdated: string;
  socialInsight?: string;
  // 图表配置
  chartConfig?: {
    showLegend?: boolean;
    showTooltip?: boolean;
    showPercentage?: boolean;
    height?: number;
  };
}

/**
 * 标准化的维度数据
 */
export interface StandardDimensionData {
  dimensionId: string;
  dimensionTitle: string;
  description: string;
  icon: string;
  socialImpact: string;
  charts: StandardChartData[];
  totalResponses: number;
  completionRate: number;
  lastUpdated: string;
}

// ===== 2. API数据接口定义 =====

/**
 * API返回的原始数据格式
 */
export interface ApiRawDataPoint {
  name: string;
  value: number;
  percentage: number;
}

/**
 * API返回的完整数据结构
 */
export interface ApiCompleteData {
  totalResponses: number;
  genderDistribution?: ApiRawDataPoint[];
  ageDistribution?: ApiRawDataPoint[];
  employmentStatus?: ApiRawDataPoint[];
  educationLevel?: ApiRawDataPoint[];
  livingCostPressure?: ApiRawDataPoint[];
  policySuggestions?: ApiRawDataPoint[];
  cacheInfo?: {
    lastUpdated: string;
    source: string;
  };
}

// ===== 3. 数据转换核心服务 =====

export class UnifiedDataTransformService {
  
  /**
   * 转换API数据为标准化的维度数据
   */
  public transformApiDataToDimension(
    frontendDimensionId: string, 
    apiData: ApiCompleteData
  ): StandardDimensionData {
    const dimensionMapping = getDimensionMapping(frontendDimensionId);
    
    if (!dimensionMapping) {
      console.warn(`未找到维度映射: ${frontendDimensionId}`);
      return this.createEmptyDimensionData(frontendDimensionId, apiData);
    }

    const charts: StandardChartData[] = [];

    // 转换每个问题的数据
    for (const questionMapping of dimensionMapping.questions) {
      const chartData = this.transformQuestionData(questionMapping, apiData);
      if (chartData) {
        charts.push(chartData);
      }
    }

    return {
      dimensionId: frontendDimensionId,
      dimensionTitle: dimensionMapping.title,
      description: dimensionMapping.description,
      icon: dimensionMapping.icon,
      socialImpact: dimensionMapping.socialImpact,
      charts,
      totalResponses: apiData.totalResponses || 0,
      completionRate: 100, // API只返回完整数据
      lastUpdated: apiData.cacheInfo?.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * 转换单个问题的数据
   */
  private transformQuestionData(
    questionMapping: QuestionMapping,
    apiData: ApiCompleteData
  ): StandardChartData | null {
    // 获取API数据字段
    const apiFieldData = (apiData as any)[questionMapping.apiDataField];
    
    if (!Array.isArray(apiFieldData)) {
      console.warn(`API数据字段 ${questionMapping.apiDataField} 不存在或格式错误`);
      return this.createEmptyChartData(questionMapping, apiData);
    }

    // 转换数据点
    const transformedData: StandardVisualizationDataPoint[] = [];
    
    for (const apiDataPoint of apiFieldData) {
      const transformedPoint = this.transformDataPoint(
        apiDataPoint, 
        questionMapping.optionMapping
      );
      if (transformedPoint) {
        transformedData.push(transformedPoint);
      }
    }

    return {
      questionId: questionMapping.frontendQuestionId,
      questionTitle: questionMapping.title,
      chartType: questionMapping.chartType,
      data: transformedData,
      totalResponses: apiData.totalResponses || 0,
      lastUpdated: apiData.cacheInfo?.lastUpdated || new Date().toISOString(),
      socialInsight: questionMapping.socialValue,
      chartConfig: {
        showLegend: true,
        showTooltip: true,
        showPercentage: true,
        height: 300
      }
    };
  }

  /**
   * 转换单个数据点
   */
  private transformDataPoint(
    apiDataPoint: ApiRawDataPoint,
    optionMapping: OptionMapping[]
  ): StandardVisualizationDataPoint | null {
    // 查找对应的选项映射
    const mapping = optionMapping.find(opt => opt.apiValue === apiDataPoint.name);
    
    if (!mapping) {
      console.warn(`未找到选项映射: ${apiDataPoint.name}`);
      // 创建默认映射
      return {
        label: apiDataPoint.name,
        apiValue: apiDataPoint.name,
        value: apiDataPoint.value,
        percentage: apiDataPoint.percentage,
        color: this.generateRandomColor(),
        icon: '❓'
      };
    }

    return {
      label: mapping.displayLabel,
      apiValue: apiDataPoint.name,
      value: apiDataPoint.value,
      percentage: apiDataPoint.percentage,
      color: mapping.color,
      icon: mapping.icon
    };
  }

  /**
   * 创建空的维度数据
   */
  private createEmptyDimensionData(
    frontendDimensionId: string,
    apiData: ApiCompleteData
  ): StandardDimensionData {
    return {
      dimensionId: frontendDimensionId,
      dimensionTitle: `未知维度: ${frontendDimensionId}`,
      description: '该维度暂无配置',
      icon: '❓',
      socialImpact: '暂无社会价值描述',
      charts: [],
      totalResponses: apiData.totalResponses || 0,
      completionRate: 100,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 创建空的图表数据
   */
  private createEmptyChartData(
    questionMapping: QuestionMapping,
    apiData: ApiCompleteData
  ): StandardChartData {
    return {
      questionId: questionMapping.frontendQuestionId,
      questionTitle: questionMapping.title,
      chartType: questionMapping.chartType,
      data: [],
      totalResponses: apiData.totalResponses || 0,
      lastUpdated: apiData.cacheInfo?.lastUpdated || new Date().toISOString(),
      socialInsight: questionMapping.socialValue + ' (暂无数据)',
      chartConfig: {
        showLegend: true,
        showTooltip: true,
        showPercentage: true,
        height: 300
      }
    };
  }

  /**
   * 生成随机颜色
   */
  private generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * 转换为图表组件所需的格式
   */
  public transformToChartFormat(chartData: StandardChartData): any[] {
    return chartData.data.map(point => ({
      name: point.label,
      value: point.value,
      percentage: point.percentage,
      color: point.color,
      icon: point.icon
    }));
  }

  /**
   * 批量转换所有维度数据
   */
  public transformAllDimensions(apiData: ApiCompleteData): Record<string, StandardDimensionData> {
    const result: Record<string, StandardDimensionData> = {};
    
    for (const dimensionMapping of UNIFIED_DIMENSION_MAPPING) {
      result[dimensionMapping.frontendId] = this.transformApiDataToDimension(
        dimensionMapping.frontendId,
        apiData
      );
    }
    
    return result;
  }

  /**
   * 验证API数据完整性
   */
  public validateApiData(apiData: ApiCompleteData): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // 检查必需字段
    if (typeof apiData.totalResponses !== 'number') {
      missingFields.push('totalResponses');
    }

    // 检查各个数据字段
    const requiredFields = ['genderDistribution', 'ageDistribution', 'employmentStatus', 'educationLevel'];
    
    for (const field of requiredFields) {
      const fieldData = (apiData as any)[field];
      if (!Array.isArray(fieldData)) {
        missingFields.push(field);
      } else if (fieldData.length === 0) {
        warnings.push(`${field} 数据为空`);
      }
    }

    // 检查数据格式
    for (const field of requiredFields) {
      const fieldData = (apiData as any)[field];
      if (Array.isArray(fieldData)) {
        for (const item of fieldData) {
          if (!item.name || typeof item.value !== 'number' || typeof item.percentage !== 'number') {
            warnings.push(`${field} 数据格式不正确`);
            break;
          }
        }
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  }

  /**
   * 获取数据质量报告
   */
  public getDataQualityReport(apiData: ApiCompleteData): {
    totalResponses: number;
    dataCompleteness: number;
    fieldCoverage: Record<string, boolean>;
    qualityScore: number;
  } {
    const validation = this.validateApiData(apiData);
    const totalFields = ['genderDistribution', 'ageDistribution', 'employmentStatus', 'educationLevel'].length;
    const validFields = totalFields - validation.missingFields.length;
    
    const fieldCoverage: Record<string, boolean> = {};
    for (const field of ['genderDistribution', 'ageDistribution', 'employmentStatus', 'educationLevel']) {
      fieldCoverage[field] = Array.isArray((apiData as any)[field]) && (apiData as any)[field].length > 0;
    }

    const dataCompleteness = (validFields / totalFields) * 100;
    const qualityScore = validation.isValid ? 
      (dataCompleteness - validation.warnings.length * 5) : 
      (dataCompleteness * 0.5);

    return {
      totalResponses: apiData.totalResponses || 0,
      dataCompleteness,
      fieldCoverage,
      qualityScore: Math.max(0, Math.min(100, qualityScore))
    };
  }
}

// ===== 4. 导出服务实例 =====

export const unifiedDataTransformService = new UnifiedDataTransformService();

export default unifiedDataTransformService;

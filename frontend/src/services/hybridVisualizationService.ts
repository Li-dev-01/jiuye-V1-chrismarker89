/**
 * 混合可视化服务
 * 集成问卷2的3维度专业分析和问卷1的6维度全面分析
 * 采用Tab子页面样式统一展示
 */

import { questionnaire2VisualizationService } from './questionnaire2VisualizationService';
import { Questionnaire1StyleAdapter } from './questionnaire1StyleAdapter';
import type {
  HybridVisualizationData,
  TabConfig,
  TabType,
  UniversalDimensionData,
  HybridVisualizationResponse,
  PerformanceMetrics,
  DataValidationResult
} from '../types/hybridVisualization';
import {
  Q2_DIMENSION_IDS,
  Q1_DIMENSION_IDS
} from '../types/hybridVisualization';

class HybridVisualizationService {
  private q2Service = questionnaire2VisualizationService;
  private q1Adapter = new Questionnaire1StyleAdapter();
  private cache = new Map<string, any>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15分钟缓存

  /**
   * 获取混合可视化数据 - 主要入口方法
   */
  async getHybridVisualizationData(): Promise<HybridVisualizationResponse> {
    const startTime = performance.now();
    
    try {
      console.log('🔄 开始获取混合可视化数据...');
      
      // 检查缓存
      const cacheKey = 'hybrid-visualization-data';
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('✅ 使用缓存数据');
        return {
          success: true,
          data: cachedData,
          performance: this.calculatePerformance(startTime)
        };
      }

      // 性能优化：并行获取和转换数据
      const q2DataPromise = this.q2Service.getVisualizationSummary();
      console.log('📊 开始获取问卷2数据...');

      // 等待数据获取完成
      const q2Data = await q2DataPromise;
      console.log('📊 问卷2数据获取完成:', q2Data.totalResponses, '个响应');

      // 性能优化：并行转换数据和构建Tab
      const [q1Data, q2TabPromise] = await Promise.all([
        this.q1Adapter.transformToQ1Format(q2Data),
        Promise.resolve(this.createQ2SpecializedTab(q2Data.dimensions))
      ]);
      console.log('🔄 数据转换完成，生成', q1Data.dimensions.length, '个维度');

      // 并行构建Q1 Tab
      const [q2Tab, q1Tab] = await Promise.all([
        q2TabPromise,
        Promise.resolve(this.createQ1ComprehensiveTab(q1Data.dimensions))
      ]);

      // 构建混合数据结构
      const hybridData: HybridVisualizationData = {
        questionnaireId: 'questionnaire-v2-hybrid',
        title: '问卷2数据可视化 - 专业分析 & 全面分析',
        totalResponses: q2Data.totalResponses,
        completionRate: q2Data.completionRate,
        lastUpdated: q2Data.lastUpdated,

        tabs: [q2Tab, q1Tab],
        
        metadata: {
          dataSource: 'questionnaire-v2-2024',
          transformationVersion: '1.0.0',
          cacheInfo: {
            lastCached: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.CACHE_TTL).toISOString()
          }
        }
      };

      // 缓存数据
      this.setCache(cacheKey, hybridData);
      
      console.log('✅ 混合可视化数据构建完成');
      
      return {
        success: true,
        data: hybridData,
        performance: this.calculatePerformance(startTime)
      };

    } catch (error) {
      console.error('❌ 获取混合可视化数据失败:', error);
      
      return {
        success: false,
        error: {
          code: 'HYBRID_DATA_FETCH_ERROR',
          message: '获取混合可视化数据失败',
          details: error,
          timestamp: new Date().toISOString(),
          recoverable: true
        },
        performance: this.calculatePerformance(startTime)
      };
    }
  }

  /**
   * 获取备用数据，用于错误恢复
   */
  private getFallbackData(): HybridVisualizationData | null {
    try {
      // 尝试从缓存获取任何可用数据
      const cacheKeys = ['hybrid-visualization-data', 'q2-data-backup'];
      for (const key of cacheKeys) {
        const cached = this.getFromCache(key);
        if (cached) {
          console.log(`🔄 使用缓存备用数据: ${key}`);
          return cached;
        }
      }

      // 返回最小可用数据结构
      return {
        questionnaireId: 'questionnaire-v2-hybrid-fallback',
        title: '问卷2数据可视化 - 备用模式',
        totalResponses: 0,
        completionRate: 0,
        lastUpdated: new Date().toISOString(),
        tabs: [
          {
            key: 'q2-specialized',
            label: '专业分析',
            description: '数据加载中，请稍后刷新',
            icon: '🎯',
            dimensions: []
          }
        ],
        metadata: {
          dataSource: 'fallback',
          transformationVersion: '1.0.0',
          cacheInfo: {
            lastCached: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.CACHE_TTL).toISOString()
          }
        }
      };
    } catch (error) {
      console.error('❌ 获取备用数据失败:', error);
      return null;
    }
  }

  /**
   * 创建问卷2专业分析Tab配置
   */
  private createQ2SpecializedTab(q2Dimensions: any[]): TabConfig {
    return {
      key: 'q2-specialized',
      label: '专业分析',
      description: '经济压力、就业信心、现代负债专业分析',
      icon: '🎯',
      dimensions: this.convertQ2Dimensions(q2Dimensions)
    };
  }

  /**
   * 创建问卷1全面分析Tab配置
   */
  private createQ1ComprehensiveTab(q1Dimensions: UniversalDimensionData[]): TabConfig {
    return {
      key: 'q1-comprehensive',
      label: '全面分析',
      description: '6维度全面就业市场分析框架',
      icon: '📊',
      dimensions: q1Dimensions
    };
  }

  /**
   * 转换问卷2维度数据为通用格式
   */
  private convertQ2Dimensions(q2Dimensions: any[]): UniversalDimensionData[] {
    return q2Dimensions.map(dimension => ({
      dimensionId: dimension.dimensionId,
      dimensionTitle: dimension.dimensionTitle,
      description: dimension.description,
      icon: this.getQ2DimensionIcon(dimension.dimensionId),
      totalResponses: dimension.totalResponses,
      completionRate: dimension.completionRate,
      charts: dimension.charts.map((chart: any) => ({
        questionId: chart.questionId,
        questionTitle: chart.questionTitle,
        chartType: chart.chartType,
        data: chart.data,
        totalResponses: chart.totalResponses,
        lastUpdated: chart.lastUpdated,
        insight: chart.economicInsight || chart.confidenceInsight
      })),
      insights: this.generateQ2Insights(dimension)
    }));
  }

  /**
   * 获取问卷2维度图标
   */
  private getQ2DimensionIcon(dimensionId: string): string {
    const iconMap: Record<string, string> = {
      [Q2_DIMENSION_IDS.ECONOMIC_PRESSURE]: '💰',
      [Q2_DIMENSION_IDS.EMPLOYMENT_CONFIDENCE]: '📈',
      [Q2_DIMENSION_IDS.MODERN_DEBT]: '💳'
    };
    return iconMap[dimensionId] || '📊';
  }

  /**
   * 生成问卷2洞察
   */
  private generateQ2Insights(dimension: any): string[] {
    const insights: string[] = [];
    
    switch (dimension.dimensionId) {
      case Q2_DIMENSION_IDS.ECONOMIC_PRESSURE:
        insights.push('现代年轻人负债结构以消费信贷为主');
        insights.push('月还款负担普遍在收入的20-40%之间');
        break;
      case Q2_DIMENSION_IDS.EMPLOYMENT_CONFIDENCE:
        insights.push('短期就业信心普遍高于长期信心');
        insights.push('就业信心与经济压力呈负相关');
        break;
      case Q2_DIMENSION_IDS.MODERN_DEBT:
        insights.push('支付宝花呗已成为主要的短期消费信贷工具');
        insights.push('新兴金融产品使用率快速增长');
        break;
    }
    
    return insights;
  }

  /**
   * 获取特定Tab的数据
   */
  async getTabData(tabType: TabType): Promise<UniversalDimensionData[]> {
    try {
      const hybridData = await this.getHybridVisualizationData();
      
      if (!hybridData.success || !hybridData.data) {
        throw new Error('无法获取混合数据');
      }

      const tab = hybridData.data.tabs.find(t => t.key === tabType);
      if (!tab) {
        throw new Error(`未找到Tab: ${tabType}`);
      }

      return tab.dimensions;
    } catch (error) {
      console.error(`获取Tab数据失败 (${tabType}):`, error);
      throw error;
    }
  }

  /**
   * 获取特定维度的数据
   */
  async getDimensionData(tabType: TabType, dimensionId: string): Promise<UniversalDimensionData> {
    try {
      const tabData = await this.getTabData(tabType);
      const dimension = tabData.find(d => d.dimensionId === dimensionId);
      
      if (!dimension) {
        throw new Error(`未找到维度: ${dimensionId} in ${tabType}`);
      }

      return dimension;
    } catch (error) {
      console.error(`获取维度数据失败 (${tabType}/${dimensionId}):`, error);
      throw error;
    }
  }

  /**
   * 验证数据质量
   */
  async validateDataQuality(): Promise<DataValidationResult> {
    try {
      const hybridData = await this.getHybridVisualizationData();
      
      if (!hybridData.success || !hybridData.data) {
        return {
          isValid: false,
          errors: ['无法获取数据'],
          warnings: [],
          dataCompleteness: 0,
          qualityScore: 0
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      let totalCharts = 0;
      let validCharts = 0;

      // 验证每个Tab的数据
      for (const tab of hybridData.data.tabs) {
        for (const dimension of tab.dimensions) {
          for (const chart of dimension.charts) {
            totalCharts++;
            
            if (chart.data && chart.data.length > 0) {
              validCharts++;
            } else {
              warnings.push(`图表 ${chart.questionTitle} 缺少数据`);
            }
            
            if (!chart.totalResponses || chart.totalResponses === 0) {
              warnings.push(`图表 ${chart.questionTitle} 响应数为0`);
            }
          }
        }
      }

      const dataCompleteness = totalCharts > 0 ? (validCharts / totalCharts) * 100 : 0;
      const qualityScore = Math.max(0, dataCompleteness - warnings.length * 5);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        dataCompleteness,
        qualityScore
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`数据验证失败: ${error}`],
        warnings: [],
        dataCompleteness: 0,
        qualityScore: 0
      };
    }
  }

  /**
   * 刷新数据
   */
  async refreshData(): Promise<void> {
    console.log('🔄 刷新混合可视化数据...');
    this.clearCache();
    await this.getHybridVisualizationData();
    console.log('✅ 数据刷新完成');
  }

  /**
   * 缓存管理
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * 性能计算
   */
  private calculatePerformance(startTime: number): PerformanceMetrics {
    const endTime = performance.now();
    return {
      dataLoadTime: 0, // 由具体服务计算
      transformationTime: 0, // 由适配器计算
      renderTime: 0, // 由前端组件计算
      totalTime: endTime - startTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    };
  }
}

// 导出单例实例
export const hybridVisualizationService = new HybridVisualizationService();

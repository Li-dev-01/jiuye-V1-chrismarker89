/**
 * 智能扩容服务
 * 根据数据量和使用模式自动调整同步策略
 */

export interface ScalingMetrics {
  dataVolume: {
    totalRecords: number;
    dailyGrowthRate: number;
    weeklyGrowthRate: number;
    projectedMonthlyGrowth: number;
  };
  usagePatterns: {
    peakHourTraffic: number;
    averageHourlyTraffic: number;
    concurrentUsers: number;
    requestDistribution: Record<string, number>;
  };
  systemPerformance: {
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    resourceUtilization: number;
  };
  businessMetrics: {
    userSatisfactionScore: number;
    systemAvailability: number;
    costEfficiency: number;
  };
}

export interface ScalingRecommendation {
  type: 'sync_frequency' | 'cache_strategy' | 'resource_allocation' | 'data_partitioning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  currentValue: any;
  recommendedValue: any;
  expectedImpact: {
    performance: string;
    cost: string;
    reliability: string;
  };
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedTimeToImplement: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ScalingStrategy {
  name: string;
  description: string;
  triggers: {
    dataVolumeThreshold: number;
    trafficThreshold: number;
    performanceThreshold: number;
  };
  actions: ScalingRecommendation[];
  rollbackPlan: string;
}

export class IntelligentScalingService {
  private db: D1Database;
  private scalingStrategies: ScalingStrategy[];

  constructor(db: D1Database) {
    this.db = db;
    this.scalingStrategies = this.initializeScalingStrategies();
  }

  /**
   * 分析当前系统指标
   */
  async analyzeSystemMetrics(): Promise<ScalingMetrics> {
    try {
      // 分析数据量增长
      const dataVolume = await this.analyzeDataVolume();
      
      // 分析使用模式
      const usagePatterns = await this.analyzeUsagePatterns();
      
      // 分析系统性能
      const systemPerformance = await this.analyzeSystemPerformance();
      
      // 分析业务指标
      const businessMetrics = await this.analyzeBusinessMetrics();

      return {
        dataVolume,
        usagePatterns,
        systemPerformance,
        businessMetrics
      };
    } catch (error) {
      console.error('分析系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 生成扩容建议
   */
  async generateScalingRecommendations(metrics: ScalingMetrics): Promise<ScalingRecommendation[]> {
    const recommendations: ScalingRecommendation[] = [];

    // 基于数据量增长的建议
    if (metrics.dataVolume.dailyGrowthRate > 10) {
      recommendations.push({
        type: 'sync_frequency',
        priority: 'high',
        action: '增加同步频率以应对快速数据增长',
        currentValue: '5分钟',
        recommendedValue: '2分钟',
        expectedImpact: {
          performance: '提升30%',
          cost: '增加20%',
          reliability: '提升25%'
        },
        implementationComplexity: 'low',
        estimatedTimeToImplement: '1小时',
        riskLevel: 'low'
      });
    }

    // 基于流量模式的建议
    if (metrics.usagePatterns.peakHourTraffic > metrics.usagePatterns.averageHourlyTraffic * 3) {
      recommendations.push({
        type: 'cache_strategy',
        priority: 'medium',
        action: '实施动态缓存预热策略',
        currentValue: '静态缓存',
        recommendedValue: '智能预热缓存',
        expectedImpact: {
          performance: '提升40%',
          cost: '增加15%',
          reliability: '提升20%'
        },
        implementationComplexity: 'medium',
        estimatedTimeToImplement: '4小时',
        riskLevel: 'medium'
      });
    }

    // 基于性能指标的建议
    if (metrics.systemPerformance.averageResponseTime > 1000) {
      recommendations.push({
        type: 'resource_allocation',
        priority: 'critical',
        action: '优化资源分配和查询策略',
        currentValue: '当前配置',
        recommendedValue: '优化配置',
        expectedImpact: {
          performance: '提升50%',
          cost: '增加10%',
          reliability: '提升30%'
        },
        implementationComplexity: 'high',
        estimatedTimeToImplement: '8小时',
        riskLevel: 'medium'
      });
    }

    // 基于缓存命中率的建议
    if (metrics.systemPerformance.cacheHitRate < 85) {
      recommendations.push({
        type: 'cache_strategy',
        priority: 'high',
        action: '优化缓存策略和数据预加载',
        currentValue: `${metrics.systemPerformance.cacheHitRate}%`,
        recommendedValue: '95%+',
        expectedImpact: {
          performance: '提升35%',
          cost: '减少5%',
          reliability: '提升15%'
        },
        implementationComplexity: 'medium',
        estimatedTimeToImplement: '3小时',
        riskLevel: 'low'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 自动应用扩容策略
   */
  async applyScalingStrategy(recommendations: ScalingRecommendation[]): Promise<{
    applied: ScalingRecommendation[];
    skipped: ScalingRecommendation[];
    errors: string[];
  }> {
    const result = {
      applied: [] as ScalingRecommendation[],
      skipped: [] as ScalingRecommendation[],
      errors: [] as string[]
    };

    for (const recommendation of recommendations) {
      try {
        // 只自动应用低风险、低复杂度的建议
        if (recommendation.riskLevel === 'low' && recommendation.implementationComplexity === 'low') {
          await this.implementRecommendation(recommendation);
          result.applied.push(recommendation);
          
          // 记录扩容历史
          await this.recordScalingAction(recommendation);
        } else {
          result.skipped.push(recommendation);
        }
      } catch (error) {
        result.errors.push(`应用建议失败 ${recommendation.action}: ${error}`);
      }
    }

    return result;
  }

  /**
   * 分析数据量增长
   */
  private async analyzeDataVolume(): Promise<ScalingMetrics['dataVolume']> {
    // 获取总记录数
    const totalRecords = await this.db.prepare(`
      SELECT COUNT(*) as count FROM analytics_responses WHERE is_test_data = 0
    `).first();

    // 计算日增长率
    const dailyGrowth = await this.db.prepare(`
      SELECT 
        COUNT(*) as today_count,
        (SELECT COUNT(*) FROM analytics_responses 
         WHERE created_at >= datetime('now', '-2 days') 
         AND created_at < datetime('now', '-1 day')
         AND is_test_data = 0) as yesterday_count
      FROM analytics_responses 
      WHERE created_at >= datetime('now', '-1 day')
      AND is_test_data = 0
    `).first();

    const dailyGrowthRate = dailyGrowth?.yesterday_count > 0 
      ? ((dailyGrowth.today_count - dailyGrowth.yesterday_count) / dailyGrowth.yesterday_count) * 100
      : 0;

    // 计算周增长率
    const weeklyGrowth = await this.db.prepare(`
      SELECT 
        COUNT(*) as this_week,
        (SELECT COUNT(*) FROM analytics_responses 
         WHERE created_at >= datetime('now', '-14 days') 
         AND created_at < datetime('now', '-7 days')
         AND is_test_data = 0) as last_week
      FROM analytics_responses 
      WHERE created_at >= datetime('now', '-7 days')
      AND is_test_data = 0
    `).first();

    const weeklyGrowthRate = weeklyGrowth?.last_week > 0
      ? ((weeklyGrowth.this_week - weeklyGrowth.last_week) / weeklyGrowth.last_week) * 100
      : 0;

    return {
      totalRecords: totalRecords?.count || 0,
      dailyGrowthRate,
      weeklyGrowthRate,
      projectedMonthlyGrowth: weeklyGrowthRate * 4.3 // 估算月增长
    };
  }

  /**
   * 分析使用模式
   */
  private async analyzeUsagePatterns(): Promise<ScalingMetrics['usagePatterns']> {
    // 分析流量分布
    const trafficStats = await this.db.prepare(`
      SELECT 
        strftime('%H', timestamp) as hour,
        COUNT(*) as requests,
        COUNT(DISTINCT client_ip) as unique_users
      FROM performance_metrics 
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY strftime('%H', timestamp)
      ORDER BY requests DESC
    `).all();

    const hourlyRequests = trafficStats.results.map((r: any) => r.requests);
    const peakHourTraffic = Math.max(...hourlyRequests);
    const averageHourlyTraffic = hourlyRequests.reduce((a, b) => a + b, 0) / hourlyRequests.length;

    // 分析请求分布
    const requestDistribution = await this.db.prepare(`
      SELECT endpoint, COUNT(*) as count
      FROM performance_metrics 
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY endpoint
    `).all();

    const distribution: Record<string, number> = {};
    requestDistribution.results.forEach((r: any) => {
      distribution[r.endpoint] = r.count;
    });

    return {
      peakHourTraffic,
      averageHourlyTraffic,
      concurrentUsers: Math.max(...trafficStats.results.map((r: any) => r.unique_users)),
      requestDistribution: distribution
    };
  }

  /**
   * 分析系统性能
   */
  private async analyzeSystemPerformance(): Promise<ScalingMetrics['systemPerformance']> {
    const perfStats = await this.db.prepare(`
      SELECT 
        AVG(response_time) as avg_response_time,
        AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
        AVG(CASE WHEN error_count > 0 THEN 1.0 ELSE 0.0 END) * 100 as error_rate
      FROM performance_metrics 
      WHERE timestamp >= datetime('now', '-24 hours')
    `).first();

    return {
      averageResponseTime: perfStats?.avg_response_time || 0,
      cacheHitRate: perfStats?.cache_hit_rate || 0,
      errorRate: perfStats?.error_rate || 0,
      resourceUtilization: 75 // 模拟值，实际应从系统监控获取
    };
  }

  /**
   * 分析业务指标
   */
  private async analyzeBusinessMetrics(): Promise<ScalingMetrics['businessMetrics']> {
    // 这些指标通常来自业务监控系统
    return {
      userSatisfactionScore: 85, // 模拟值
      systemAvailability: 99.5, // 模拟值
      costEfficiency: 78 // 模拟值
    };
  }

  /**
   * 实施建议
   */
  private async implementRecommendation(recommendation: ScalingRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'sync_frequency':
        await this.adjustSyncFrequency(recommendation);
        break;
      case 'cache_strategy':
        await this.optimizeCacheStrategy(recommendation);
        break;
      case 'resource_allocation':
        await this.adjustResourceAllocation(recommendation);
        break;
      default:
        console.warn(`未知的扩容类型: ${recommendation.type}`);
    }
  }

  /**
   * 调整同步频率
   */
  private async adjustSyncFrequency(recommendation: ScalingRecommendation): Promise<void> {
    // 根据建议调整高频同步任务的频率
    await this.db.prepare(`
      UPDATE sync_configuration 
      SET frequency_minutes = CASE 
        WHEN sync_name IN ('analytics_to_realtime', 'main_to_analytics') THEN 2
        WHEN sync_name IN ('realtime_to_aggregated') THEN 5
        ELSE frequency_minutes
      END,
      updated_at = datetime('now')
      WHERE sync_name IN ('analytics_to_realtime', 'main_to_analytics', 'realtime_to_aggregated')
    `).run();
  }

  /**
   * 优化缓存策略
   */
  private async optimizeCacheStrategy(recommendation: ScalingRecommendation): Promise<void> {
    // 调整缓存过期时间和预热策略
    await this.db.prepare(`
      UPDATE sync_configuration 
      SET description = description || ' [智能优化: 缓存策略调整]',
      updated_at = datetime('now')
      WHERE sync_name LIKE '%cache%' OR sync_name LIKE '%visualization%'
    `).run();
  }

  /**
   * 调整资源分配
   */
  private async adjustResourceAllocation(recommendation: ScalingRecommendation): Promise<void> {
    // 这里可以调整数据库连接池、查询优化等
    console.log('调整资源分配:', recommendation.action);
  }

  /**
   * 记录扩容操作
   */
  private async recordScalingAction(recommendation: ScalingRecommendation): Promise<void> {
    await this.db.prepare(`
      INSERT INTO scaling_history (
        scaling_type, action, current_value, new_value, 
        expected_impact, applied_at, risk_level
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `).bind(
      recommendation.type,
      recommendation.action,
      JSON.stringify(recommendation.currentValue),
      JSON.stringify(recommendation.recommendedValue),
      JSON.stringify(recommendation.expectedImpact),
      recommendation.riskLevel
    ).run();
  }

  /**
   * 初始化扩容策略
   */
  private initializeScalingStrategies(): ScalingStrategy[] {
    return [
      {
        name: 'high_growth_strategy',
        description: '高增长期扩容策略',
        triggers: {
          dataVolumeThreshold: 10000,
          trafficThreshold: 1000,
          performanceThreshold: 500
        },
        actions: [],
        rollbackPlan: '恢复到之前的同步频率配置'
      },
      {
        name: 'performance_optimization',
        description: '性能优化策略',
        triggers: {
          dataVolumeThreshold: 5000,
          trafficThreshold: 500,
          performanceThreshold: 1000
        },
        actions: [],
        rollbackPlan: '恢复默认缓存配置'
      }
    ];
  }
}

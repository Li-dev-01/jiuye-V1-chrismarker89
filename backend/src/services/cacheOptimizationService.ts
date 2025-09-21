/**
 * 缓存优化服务
 * 根据实际使用模式分析和调整各级缓存的同步频率
 */

export interface CacheUsagePattern {
  endpoint: string;
  requestFrequency: number; // 每小时请求数
  cacheHitRate: number; // 缓存命中率
  averageResponseTime: number; // 平均响应时间
  dataFreshness: number; // 数据新鲜度要求（分钟）
  userConcurrency: number; // 并发用户数
  peakHours: string[]; // 高峰时段
}

export interface OptimizationRecommendation {
  syncConfigId: string;
  currentFrequency: number; // 当前同步频率（分钟）
  recommendedFrequency: number; // 推荐同步频率（分钟）
  reason: string;
  expectedImprovement: {
    responseTime: string;
    cacheHitRate: string;
    resourceUsage: string;
  };
  priority: 'high' | 'medium' | 'low';
}

export class CacheOptimizationService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 分析缓存使用模式
   */
  async analyzeCacheUsagePatterns(timeRange: string = '24h'): Promise<CacheUsagePattern[]> {
    try {
      const timeCondition = this.getTimeCondition(timeRange);
      
      // 分析各端点的使用模式
      const patterns = await this.db.prepare(`
        SELECT 
          endpoint,
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
          COUNT(DISTINCT client_ip) as unique_users,
          strftime('%H', timestamp) as hour,
          COUNT(*) as hourly_requests
        FROM performance_metrics 
        WHERE ${timeCondition}
        GROUP BY endpoint, strftime('%H', timestamp)
        ORDER BY endpoint, hour
      `).all();

      // 处理数据，计算使用模式
      const endpointPatterns = new Map<string, any>();
      
      patterns.results.forEach((row: any) => {
        if (!endpointPatterns.has(row.endpoint)) {
          endpointPatterns.set(row.endpoint, {
            endpoint: row.endpoint,
            totalRequests: 0,
            avgResponseTime: 0,
            cacheHitRate: 0,
            uniqueUsers: new Set(),
            hourlyData: []
          });
        }
        
        const pattern = endpointPatterns.get(row.endpoint);
        pattern.totalRequests += row.hourly_requests;
        pattern.avgResponseTime += row.avg_response_time * row.hourly_requests;
        pattern.cacheHitRate += row.cache_hit_rate * row.hourly_requests;
        pattern.uniqueUsers.add(row.unique_users);
        pattern.hourlyData.push({
          hour: row.hour,
          requests: row.hourly_requests
        });
      });

      // 转换为最终格式
      const usagePatterns: CacheUsagePattern[] = [];
      
      endpointPatterns.forEach((data, endpoint) => {
        const requestFrequency = data.totalRequests / 24; // 每小时平均请求数
        const avgResponseTime = data.avgResponseTime / data.totalRequests;
        const cacheHitRate = data.cacheHitRate / data.totalRequests;
        
        // 计算高峰时段
        const peakHours = data.hourlyData
          .sort((a: any, b: any) => b.requests - a.requests)
          .slice(0, 3)
          .map((h: any) => h.hour);

        // 根据端点类型确定数据新鲜度要求
        const dataFreshness = this.calculateDataFreshnessRequirement(endpoint, requestFrequency);

        usagePatterns.push({
          endpoint,
          requestFrequency,
          cacheHitRate,
          averageResponseTime: avgResponseTime,
          dataFreshness,
          userConcurrency: data.uniqueUsers.size,
          peakHours
        });
      });

      return usagePatterns;
    } catch (error) {
      console.error('Failed to analyze cache usage patterns:', error);
      throw error;
    }
  }

  /**
   * 生成优化建议
   */
  async generateOptimizationRecommendations(patterns: CacheUsagePattern[]): Promise<OptimizationRecommendation[]> {
    try {
      // 获取当前同步配置
      const syncConfigs = await this.db.prepare(`
        SELECT * FROM sync_configuration WHERE is_enabled = 1
      `).all();

      const recommendations: OptimizationRecommendation[] = [];

      for (const config of syncConfigs.results) {
        const relatedPatterns = patterns.filter(p => 
          this.isEndpointRelatedToSync(p.endpoint, config.sync_name)
        );

        if (relatedPatterns.length === 0) continue;

        const avgPattern = this.calculateAveragePattern(relatedPatterns);
        const recommendation = this.generateSyncRecommendation(config, avgPattern);
        
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Failed to generate optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * 应用优化建议
   */
  async applyOptimizations(recommendations: OptimizationRecommendation[]): Promise<void> {
    try {
      for (const rec of recommendations) {
        if (rec.priority === 'high' || rec.priority === 'medium') {
          await this.db.prepare(`
            UPDATE sync_configuration 
            SET frequency_minutes = ?, 
                updated_at = datetime('now'),
                description = description || ' [自动优化: ' || ? || ']'
            WHERE sync_name = ?
          `).bind(
            rec.recommendedFrequency,
            rec.reason,
            rec.syncConfigId
          ).run();

          console.log(`✅ 已优化同步配置 ${rec.syncConfigId}: ${rec.currentFrequency}分钟 → ${rec.recommendedFrequency}分钟`);
        }
      }
    } catch (error) {
      console.error('Failed to apply optimizations:', error);
      throw error;
    }
  }

  /**
   * 计算数据新鲜度要求
   */
  private calculateDataFreshnessRequirement(endpoint: string, requestFrequency: number): number {
    // 根据端点类型和请求频率确定数据新鲜度要求
    if (endpoint.includes('statistics')) {
      // 统计数据：高频访问需要更新鲜的数据
      if (requestFrequency > 50) return 5; // 5分钟
      if (requestFrequency > 20) return 10; // 10分钟
      return 15; // 15分钟
    }
    
    if (endpoint.includes('realtime')) {
      return 2; // 实时数据需要2分钟内更新
    }
    
    if (endpoint.includes('cache-status')) {
      return 1; // 缓存状态需要1分钟内更新
    }
    
    return 30; // 默认30分钟
  }

  /**
   * 判断端点是否与同步配置相关
   */
  private isEndpointRelatedToSync(endpoint: string, syncName: string): boolean {
    const relationMap: Record<string, string[]> = {
      'analytics_to_realtime': ['/statistics/', '/analytics/'],
      'realtime_to_aggregated': ['/statistics/', '/analytics/'],
      'aggregated_to_dashboard': ['/dashboard/', '/admin/'],
      'dashboard_to_visualization': ['/visualization/', '/analytics/'],
      'analytics_to_admin': ['/admin/', '/statistics/'],
      'analytics_to_export': ['/export/', '/download/'],
      'analytics_to_social': ['/social/', '/insights/'],
      'main_to_analytics': ['/statistics/', '/analytics/', '/questionnaire/']
    };

    const relatedPaths = relationMap[syncName] || [];
    return relatedPaths.some(path => endpoint.includes(path));
  }

  /**
   * 计算平均使用模式
   */
  private calculateAveragePattern(patterns: CacheUsagePattern[]): CacheUsagePattern {
    const avgPattern: CacheUsagePattern = {
      endpoint: 'average',
      requestFrequency: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      dataFreshness: 0,
      userConcurrency: 0,
      peakHours: []
    };

    patterns.forEach(p => {
      avgPattern.requestFrequency += p.requestFrequency;
      avgPattern.cacheHitRate += p.cacheHitRate;
      avgPattern.averageResponseTime += p.averageResponseTime;
      avgPattern.dataFreshness += p.dataFreshness;
      avgPattern.userConcurrency += p.userConcurrency;
    });

    const count = patterns.length;
    avgPattern.requestFrequency /= count;
    avgPattern.cacheHitRate /= count;
    avgPattern.averageResponseTime /= count;
    avgPattern.dataFreshness /= count;
    avgPattern.userConcurrency /= count;

    return avgPattern;
  }

  /**
   * 生成同步建议
   */
  private generateSyncRecommendation(config: any, pattern: CacheUsagePattern): OptimizationRecommendation | null {
    const currentFreq = config.frequency_minutes;
    let recommendedFreq = currentFreq;
    let reason = '';
    let priority: 'high' | 'medium' | 'low' = 'low';

    // 基于缓存命中率调整
    if (pattern.cacheHitRate < 80) {
      // 缓存命中率低，需要更频繁的同步
      recommendedFreq = Math.max(1, Math.floor(currentFreq * 0.7));
      reason = `缓存命中率较低(${pattern.cacheHitRate.toFixed(1)}%)，建议提高同步频率`;
      priority = 'high';
    } else if (pattern.cacheHitRate > 95 && pattern.requestFrequency < 10) {
      // 缓存命中率高且请求频率低，可以降低同步频率
      recommendedFreq = Math.min(60, Math.floor(currentFreq * 1.5));
      reason = `缓存命中率高(${pattern.cacheHitRate.toFixed(1)}%)且请求频率低，可降低同步频率节省资源`;
      priority = 'medium';
    }

    // 基于响应时间调整
    if (pattern.averageResponseTime > 1000) {
      recommendedFreq = Math.max(1, Math.floor(currentFreq * 0.8));
      reason += (reason ? '; ' : '') + `响应时间较慢(${pattern.averageResponseTime.toFixed(0)}ms)，建议提高同步频率`;
      priority = 'high';
    }

    // 基于请求频率调整
    if (pattern.requestFrequency > 100) {
      recommendedFreq = Math.max(2, Math.floor(currentFreq * 0.6));
      reason += (reason ? '; ' : '') + `高频访问(${pattern.requestFrequency.toFixed(1)}次/小时)，需要更频繁同步`;
      priority = 'high';
    }

    // 如果没有变化，返回null
    if (recommendedFreq === currentFreq) {
      return null;
    }

    return {
      syncConfigId: config.sync_name,
      currentFrequency: currentFreq,
      recommendedFrequency: recommendedFreq,
      reason: reason || '基于使用模式的优化建议',
      expectedImprovement: {
        responseTime: recommendedFreq < currentFreq ? '提升10-30%' : '轻微下降',
        cacheHitRate: recommendedFreq < currentFreq ? '提升5-15%' : '保持稳定',
        resourceUsage: recommendedFreq < currentFreq ? '增加10-20%' : '减少15-25%'
      },
      priority
    };
  }

  /**
   * 获取时间条件
   */
  private getTimeCondition(timeRange: string): string {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return `timestamp >= '${cutoffTime.toISOString()}'`;
  }
}

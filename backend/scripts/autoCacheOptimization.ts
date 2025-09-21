/**
 * 自动缓存优化脚本
 * 定期分析缓存使用模式并应用优化建议
 */

import { CacheOptimizationService } from '../src/services/cacheOptimizationService';

export interface AutoOptimizationConfig {
  enabled: boolean;
  analysisInterval: number; // 分析间隔（小时）
  applyThreshold: {
    minCacheHitRate: number; // 最小缓存命中率阈值
    maxResponseTime: number; // 最大响应时间阈值（毫秒）
    minRequestFrequency: number; // 最小请求频率阈值
  };
  safetyLimits: {
    maxFrequencyIncrease: number; // 最大频率增加倍数
    minFrequencyDecrease: number; // 最小频率减少倍数
    maxSyncFrequency: number; // 最大同步频率（分钟）
    minSyncFrequency: number; // 最小同步频率（分钟）
  };
}

export class AutoCacheOptimizer {
  private db: D1Database;
  private config: AutoOptimizationConfig;
  private cacheOptimizer: CacheOptimizationService;

  constructor(db: D1Database, config?: Partial<AutoOptimizationConfig>) {
    this.db = db;
    this.cacheOptimizer = new CacheOptimizationService(db);
    this.config = {
      enabled: true,
      analysisInterval: 6, // 每6小时分析一次
      applyThreshold: {
        minCacheHitRate: 85, // 缓存命中率低于85%时触发优化
        maxResponseTime: 1000, // 响应时间超过1秒时触发优化
        minRequestFrequency: 5 // 每小时至少5个请求才考虑优化
      },
      safetyLimits: {
        maxFrequencyIncrease: 2.0, // 最多增加2倍频率
        minFrequencyDecrease: 0.5, // 最少减少到一半频率
        maxSyncFrequency: 1, // 最频繁1分钟同步一次
        minSyncFrequency: 60 // 最少60分钟同步一次
      },
      ...config
    };
  }

  /**
   * 执行自动优化
   */
  async runAutoOptimization(): Promise<{
    success: boolean;
    analysis: any;
    recommendations: any[];
    applied: any[];
    skipped: any[];
    errors: string[];
  }> {
    const result = {
      success: false,
      analysis: null,
      recommendations: [],
      applied: [],
      skipped: [],
      errors: []
    };

    try {
      if (!this.config.enabled) {
        result.errors.push('自动优化已禁用');
        return result;
      }

      console.log('🔍 开始自动缓存优化分析...');

      // 1. 分析缓存使用模式
      const patterns = await this.cacheOptimizer.analyzeCacheUsagePatterns('24h');
      result.analysis = {
        totalEndpoints: patterns.length,
        avgCacheHitRate: patterns.reduce((sum, p) => sum + p.cacheHitRate, 0) / patterns.length,
        avgResponseTime: patterns.reduce((sum, p) => sum + p.averageResponseTime, 0) / patterns.length,
        totalRequestFrequency: patterns.reduce((sum, p) => sum + p.requestFrequency, 0)
      };

      console.log(`📊 分析了 ${patterns.length} 个端点的使用模式`);

      // 2. 生成优化建议
      const allRecommendations = await this.cacheOptimizer.generateOptimizationRecommendations(patterns);
      result.recommendations = allRecommendations;

      console.log(`💡 生成了 ${allRecommendations.length} 个优化建议`);

      // 3. 筛选需要应用的建议
      const applicableRecommendations = this.filterApplicableRecommendations(
        allRecommendations,
        patterns
      );

      console.log(`✅ 筛选出 ${applicableRecommendations.length} 个可应用的建议`);

      // 4. 应用安全的优化建议
      for (const recommendation of applicableRecommendations) {
        try {
          const safeRecommendation = this.applySafetyLimits(recommendation);
          
          if (safeRecommendation) {
            await this.cacheOptimizer.applyOptimizations([safeRecommendation]);
            result.applied.push(safeRecommendation);
            
            // 记录优化历史
            await this.recordOptimizationHistory(safeRecommendation);
            
            console.log(`✅ 已应用优化: ${safeRecommendation.syncConfigId}`);
          } else {
            result.skipped.push({
              ...recommendation,
              skipReason: '超出安全限制'
            });
          }
        } catch (error) {
          result.errors.push(`应用优化失败 ${recommendation.syncConfigId}: ${error}`);
        }
      }

      // 5. 更新优化状态
      await this.updateOptimizationStatus(result);

      result.success = result.errors.length === 0;
      
      console.log(`🎉 自动优化完成: 应用 ${result.applied.length} 个，跳过 ${result.skipped.length} 个，错误 ${result.errors.length} 个`);

      return result;
    } catch (error) {
      result.errors.push(`自动优化执行失败: ${error}`);
      console.error('自动缓存优化失败:', error);
      return result;
    }
  }

  /**
   * 筛选可应用的建议
   */
  private filterApplicableRecommendations(recommendations: any[], patterns: any[]): any[] {
    return recommendations.filter(rec => {
      // 只应用高优先级和中优先级的建议
      if (rec.priority === 'low') return false;

      // 检查相关端点的使用模式
      const relatedPatterns = patterns.filter(p => 
        p.endpoint.includes('statistics') || p.endpoint.includes('analytics')
      );

      if (relatedPatterns.length === 0) return false;

      const avgPattern = relatedPatterns.reduce((acc, p) => ({
        cacheHitRate: acc.cacheHitRate + p.cacheHitRate,
        averageResponseTime: acc.averageResponseTime + p.averageResponseTime,
        requestFrequency: acc.requestFrequency + p.requestFrequency
      }), { cacheHitRate: 0, averageResponseTime: 0, requestFrequency: 0 });

      avgPattern.cacheHitRate /= relatedPatterns.length;
      avgPattern.averageResponseTime /= relatedPatterns.length;
      avgPattern.requestFrequency /= relatedPatterns.length;

      // 应用阈值检查
      const shouldOptimize = 
        avgPattern.cacheHitRate < this.config.applyThreshold.minCacheHitRate ||
        avgPattern.averageResponseTime > this.config.applyThreshold.maxResponseTime;

      const hasEnoughTraffic = 
        avgPattern.requestFrequency >= this.config.applyThreshold.minRequestFrequency;

      return shouldOptimize && hasEnoughTraffic;
    });
  }

  /**
   * 应用安全限制
   */
  private applySafetyLimits(recommendation: any): any | null {
    const { safetyLimits } = this.config;
    const frequencyRatio = recommendation.recommendedFrequency / recommendation.currentFrequency;

    // 检查频率变化是否在安全范围内
    if (frequencyRatio > safetyLimits.maxFrequencyIncrease || 
        frequencyRatio < safetyLimits.minFrequencyDecrease) {
      return null;
    }

    // 检查绝对频率限制
    if (recommendation.recommendedFrequency < safetyLimits.maxSyncFrequency ||
        recommendation.recommendedFrequency > safetyLimits.minSyncFrequency) {
      // 调整到安全范围内
      recommendation.recommendedFrequency = Math.max(
        safetyLimits.maxSyncFrequency,
        Math.min(safetyLimits.minSyncFrequency, recommendation.recommendedFrequency)
      );
    }

    return recommendation;
  }

  /**
   * 记录优化历史
   */
  private async recordOptimizationHistory(recommendation: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO cache_optimization_history (
          sync_config_id, 
          old_frequency, 
          new_frequency, 
          reason, 
          applied_at,
          expected_improvement
        ) VALUES (?, ?, ?, ?, datetime('now'), ?)
      `).bind(
        recommendation.syncConfigId,
        recommendation.currentFrequency,
        recommendation.recommendedFrequency,
        recommendation.reason,
        JSON.stringify(recommendation.expectedImprovement)
      ).run();
    } catch (error) {
      console.error('记录优化历史失败:', error);
    }
  }

  /**
   * 更新优化状态
   */
  private async updateOptimizationStatus(result: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO auto_optimization_status (
          id,
          last_run_at,
          success,
          recommendations_count,
          applied_count,
          skipped_count,
          error_count,
          next_run_at
        ) VALUES (1, datetime('now'), ?, ?, ?, ?, ?, datetime('now', '+${this.config.analysisInterval} hours'))
      `).bind(
        result.success ? 1 : 0,
        result.recommendations.length,
        result.applied.length,
        result.skipped.length,
        result.errors.length
      ).run();
    } catch (error) {
      console.error('更新优化状态失败:', error);
    }
  }

  /**
   * 获取优化历史
   */
  async getOptimizationHistory(limit: number = 50): Promise<any[]> {
    try {
      const history = await this.db.prepare(`
        SELECT * FROM cache_optimization_history 
        ORDER BY applied_at DESC 
        LIMIT ?
      `).bind(limit).all();

      return history.results;
    } catch (error) {
      console.error('获取优化历史失败:', error);
      return [];
    }
  }

  /**
   * 获取优化状态
   */
  async getOptimizationStatus(): Promise<any> {
    try {
      const status = await this.db.prepare(`
        SELECT * FROM auto_optimization_status WHERE id = 1
      `).first();

      return status || {
        last_run_at: null,
        success: false,
        recommendations_count: 0,
        applied_count: 0,
        skipped_count: 0,
        error_count: 0,
        next_run_at: null
      };
    } catch (error) {
      console.error('获取优化状态失败:', error);
      return null;
    }
  }
}

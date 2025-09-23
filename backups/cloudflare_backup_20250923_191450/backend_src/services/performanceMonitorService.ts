/**
 * 性能监控服务
 * 监控API响应时间、缓存命中率、数据库查询性能等关键指标
 */

export interface PerformanceMetrics {
  timestamp: string;
  endpoint: string;
  responseTime: number;
  cacheHit: boolean;
  dataSource: string;
  queryCount: number;
  errorCount: number;
  userAgent?: string;
  clientIP?: string;
}

export interface PerformanceSummary {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestQueries: Array<{
    endpoint: string;
    responseTime: number;
    timestamp: string;
  }>;
  dataSourceDistribution: Record<string, number>;
  hourlyStats: Array<{
    hour: string;
    requests: number;
    avgResponseTime: number;
    cacheHitRate: number;
  }>;
}

export class PerformanceMonitorService {
  private db: D1Database;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS_IN_MEMORY = 1000;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 记录性能指标
   */
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // 存储到数据库
      await this.db.prepare(`
        INSERT INTO performance_metrics (
          timestamp, endpoint, response_time, cache_hit, data_source,
          query_count, error_count, user_agent, client_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metrics.timestamp,
        metrics.endpoint,
        metrics.responseTime,
        metrics.cacheHit ? 1 : 0,
        metrics.dataSource,
        metrics.queryCount,
        metrics.errorCount,
        metrics.userAgent || null,
        metrics.clientIP || null
      ).run();

      // 内存中保留最近的指标
      this.metrics.push(metrics);
      if (this.metrics.length > this.MAX_METRICS_IN_MEMORY) {
        this.metrics.shift();
      }
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
    }
  }

  /**
   * 获取性能摘要
   */
  async getPerformanceSummary(timeRange: string = '24h'): Promise<PerformanceSummary> {
    try {
      const timeCondition = this.getTimeCondition(timeRange);
      
      // 基础统计
      const basicStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) as cache_hit_rate,
          AVG(CASE WHEN error_count > 0 THEN 1.0 ELSE 0.0 END) as error_rate
        FROM performance_metrics 
        WHERE ${timeCondition}
      `).first();

      // 百分位数统计
      const percentileStats = await this.db.prepare(`
        SELECT response_time
        FROM performance_metrics 
        WHERE ${timeCondition}
        ORDER BY response_time
      `).all();

      const responseTimes = percentileStats.results.map((r: any) => r.response_time);
      const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

      // 最慢查询
      const slowestQueries = await this.db.prepare(`
        SELECT endpoint, response_time, timestamp
        FROM performance_metrics 
        WHERE ${timeCondition}
        ORDER BY response_time DESC
        LIMIT 10
      `).all();

      // 数据源分布
      const dataSourceStats = await this.db.prepare(`
        SELECT data_source, COUNT(*) as count
        FROM performance_metrics 
        WHERE ${timeCondition}
        GROUP BY data_source
      `).all();

      const dataSourceDistribution: Record<string, number> = {};
      dataSourceStats.results.forEach((row: any) => {
        dataSourceDistribution[row.data_source] = row.count;
      });

      // 小时统计
      const hourlyStats = await this.db.prepare(`
        SELECT 
          strftime('%H', timestamp) as hour,
          COUNT(*) as requests,
          AVG(response_time) as avg_response_time,
          AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) as cache_hit_rate
        FROM performance_metrics 
        WHERE ${timeCondition}
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
      `).all();

      return {
        totalRequests: basicStats?.total_requests || 0,
        averageResponseTime: Math.round((basicStats?.avg_response_time || 0) * 100) / 100,
        cacheHitRate: Math.round((basicStats?.cache_hit_rate || 0) * 10000) / 100,
        errorRate: Math.round((basicStats?.error_rate || 0) * 10000) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
        slowestQueries: slowestQueries.results.map((row: any) => ({
          endpoint: row.endpoint,
          responseTime: row.response_time,
          timestamp: row.timestamp
        })),
        dataSourceDistribution,
        hourlyStats: hourlyStats.results.map((row: any) => ({
          hour: row.hour,
          requests: row.requests,
          avgResponseTime: Math.round(row.avg_response_time * 100) / 100,
          cacheHitRate: Math.round(row.cache_hit_rate * 10000) / 100
        }))
      };
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      throw error;
    }
  }

  /**
   * 获取实时性能指标
   */
  getRealtimeMetrics(): PerformanceMetrics[] {
    return this.metrics.slice(-50); // 返回最近50条记录
  }

  /**
   * 清理旧的性能数据
   */
  async cleanupOldMetrics(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      await this.db.prepare(`
        DELETE FROM performance_metrics 
        WHERE timestamp < ?
      `).bind(cutoffDate.toISOString()).run();
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * 获取时间条件SQL
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

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
}

/**
 * 性能监控中间件
 */
export function createPerformanceMiddleware(monitorService: PerformanceMonitorService) {
  return async (c: any, next: () => Promise<void>) => {
    const startTime = Date.now();
    const endpoint = c.req.path;
    let cacheHit = false;
    let dataSource = 'unknown';
    let queryCount = 0;
    let errorCount = 0;

    // 添加性能追踪到上下文
    c.set('performanceTracker', {
      setCacheHit: (hit: boolean) => { cacheHit = hit; },
      setDataSource: (source: string) => { dataSource = source; },
      incrementQueryCount: () => { queryCount++; },
      incrementErrorCount: () => { errorCount++; }
    });

    try {
      await next();
    } catch (error) {
      errorCount++;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      
      // 记录性能指标
      await monitorService.recordMetrics({
        timestamp: new Date().toISOString(),
        endpoint,
        responseTime,
        cacheHit,
        dataSource,
        queryCount,
        errorCount,
        userAgent: c.req.header('user-agent'),
        clientIP: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')
      });
    }
  };
}

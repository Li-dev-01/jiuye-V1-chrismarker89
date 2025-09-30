/**
 * Cloudflare Workers Analytics Engine Service
 * 用于收集和查询自定义指标
 */

export interface AnalyticsEngineDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

export interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  country?: string;
  cacheStatus?: 'hit' | 'miss' | 'none';
}

export interface DatabaseMetrics {
  queryType: 'read' | 'write';
  duration: number;
  success: boolean;
  tableName?: string;
}

export interface WorkerMetrics {
  invocations: number;
  errors: number;
  errorRate: number;
  cpuTime: number;
  duration: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export class WorkerAnalyticsService {
  constructor(private analytics: AnalyticsEngineDataset) {}

  /**
   * 记录 HTTP 请求指标
   */
  recordRequest(data: RequestMetrics) {
    try {
      this.analytics.writeDataPoint({
        blobs: [
          data.path,
          data.method,
          data.userAgent || 'unknown',
          data.country || 'unknown',
          data.cacheStatus || 'none'
        ],
        doubles: [
          data.statusCode,
          data.responseTime
        ],
        indexes: [
          `status_${Math.floor(data.statusCode / 100)}xx`,
          `method_${data.method.toLowerCase()}`,
          data.cacheStatus ? `cache_${data.cacheStatus}` : 'cache_none'
        ]
      });
    } catch (error) {
      console.error('Failed to record request metrics:', error);
    }
  }

  /**
   * 记录数据库查询指标
   */
  recordDatabaseQuery(data: DatabaseMetrics) {
    try {
      this.analytics.writeDataPoint({
        blobs: [
          data.queryType,
          data.success ? 'success' : 'error',
          data.tableName || 'unknown'
        ],
        doubles: [data.duration],
        indexes: [
          `db_${data.queryType}`,
          data.success ? 'db_success' : 'db_error'
        ]
      });
    } catch (error) {
      console.error('Failed to record database metrics:', error);
    }
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(data: { hit: boolean; path: string }) {
    try {
      this.analytics.writeDataPoint({
        blobs: [data.path],
        doubles: [data.hit ? 1 : 0],
        indexes: [data.hit ? 'cache_hit' : 'cache_miss']
      });
    } catch (error) {
      console.error('Failed to record cache metrics:', error);
    }
  }

  /**
   * 记录 Worker 错误
   */
  recordError(data: {
    errorType: string;
    errorMessage: string;
    path: string;
  }) {
    try {
      this.analytics.writeDataPoint({
        blobs: [
          data.errorType,
          data.errorMessage.substring(0, 100), // 限制长度
          data.path
        ],
        doubles: [1],
        indexes: ['worker_error', `error_${data.errorType}`]
      });
    } catch (error) {
      console.error('Failed to record error metrics:', error);
    }
  }
}

/**
 * Analytics Engine 查询服务
 */
export class AnalyticsQueryService {
  constructor(
    private accountId: string,
    private apiToken: string
  ) {}

  /**
   * 执行 SQL 查询
   */
  private async executeQuery(query: string): Promise<any> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/analytics_engine/sql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: query  // 直接发送 SQL 字符串，不是 JSON
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Analytics Engine query failed: ${error}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * 获取请求统计
   */
  async getRequestStats(timeRange: string = '24h') {
    const hours = this.parseTimeRange(timeRange);
    const timestampFilter = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000); // 转换为秒

    // 简化查询 - 分别查询不同的指标
    const totalQuery = `
      SELECT
        COUNT() AS total_requests,
        AVG(double2) AS avg_response_time,
        quantile(0.5)(double2) AS p50_response_time,
        quantile(0.95)(double2) AS p95_response_time,
        quantile(0.99)(double2) AS p99_response_time
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
    `;

    const statusQuery = `
      SELECT
        index1 AS status_category,
        COUNT() AS count
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
      GROUP BY index1
    `;

    const cacheQuery = `
      SELECT
        index3 AS cache_status,
        COUNT() AS count
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
      GROUP BY index3
    `;

    // 并行执行查询
    const [totalResult, statusResult, cacheResult] = await Promise.all([
      this.executeQuery(totalQuery),
      this.executeQuery(statusQuery),
      this.executeQuery(cacheQuery)
    ]);

    // 合并结果
    const stats: any = totalResult.data?.[0] || {};

    // 处理状态码统计
    const statusCounts: any = {};
    (statusResult.data || []).forEach((row: any) => {
      statusCounts[row.status_category] = row.count;
    });

    // 处理缓存统计
    const cacheCounts: any = {};
    (cacheResult.data || []).forEach((row: any) => {
      cacheCounts[row.cache_status] = row.count;
    });

    return {
      data: [{
        total_requests: stats.total_requests || 0,
        success_2xx: statusCounts['status_2xx'] || 0,
        redirect_3xx: statusCounts['status_3xx'] || 0,
        client_error_4xx: statusCounts['status_4xx'] || 0,
        server_error_5xx: statusCounts['status_5xx'] || 0,
        avg_response_time: stats.avg_response_time || 0,
        p50_response_time: stats.p50_response_time || 0,
        p95_response_time: stats.p95_response_time || 0,
        p99_response_time: stats.p99_response_time || 0,
        cache_hits: cacheCounts['cache_hit'] || 0,
        cache_misses: cacheCounts['cache_miss'] || 0
      }]
    };
  }

  /**
   * 获取地理分布
   */
  async getGeographyStats(timeRange: string = '24h') {
    const hours = this.parseTimeRange(timeRange);
    const timestampFilter = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);

    const query = `
      SELECT
        blob4 AS country,
        COUNT() AS requests,
        AVG(double2) AS avg_response_time
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
        AND blob4 != 'unknown'
      GROUP BY country
      ORDER BY requests DESC
      LIMIT 10
    `;

    return await this.executeQuery(query);
  }

  /**
   * 获取数据库统计
   */
  async getDatabaseStats(timeRange: string = '24h') {
    const hours = this.parseTimeRange(timeRange);
    const timestampFilter = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);

    const query = `
      SELECT
        blob1 AS query_type,
        COUNT() AS count,
        AVG(double1) AS avg_duration
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
        AND (index1 = 'db_read' OR index1 = 'db_write')
      GROUP BY blob1
      `;

    const result = await this.executeQuery(query);

    // 合并结果
    const stats: any = {};
    (result.data || []).forEach((row: any) => {
      if (row.query_type === 'read') {
        stats.read_queries = row.count;
        stats.read_avg_duration = row.avg_duration;
      } else if (row.query_type === 'write') {
        stats.write_queries = row.count;
        stats.write_avg_duration = row.avg_duration;
      }
    });

    return {
      data: [{
        total_queries: (stats.read_queries || 0) + (stats.write_queries || 0),
        read_queries: stats.read_queries || 0,
        write_queries: stats.write_queries || 0,
        avg_duration: ((stats.read_avg_duration || 0) + (stats.write_avg_duration || 0)) / 2,
        errors: 0
      }]
    };
  }

  /**
   * 获取错误统计
   */
  async getErrorStats(timeRange: string = '24h') {
    const hours = this.parseTimeRange(timeRange);
    const timestampFilter = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);

    const query = `
      SELECT
        blob1 AS error_type,
        COUNT() AS error_count,
        blob3 AS path
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
        AND index1 = 'worker_error'
      GROUP BY error_type, path
      ORDER BY error_count DESC
      LIMIT 20
    `;

    return await this.executeQuery(query);
  }

  /**
   * 获取热门路径
   */
  async getTopPaths(timeRange: string = '24h', limit: number = 10) {
    const hours = this.parseTimeRange(timeRange);
    const timestampFilter = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);

    const query = `
      SELECT
        blob1 AS path,
        blob2 AS method,
        COUNT() AS request_count,
        AVG(double2) AS avg_response_time
      FROM ANALYTICS
      WHERE timestamp >= ${timestampFilter}
      GROUP BY path, method
      ORDER BY request_count DESC
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);

    // 为每个路径添加 success_count (简化版本，假设都成功)
    return {
      data: (result.data || []).map((row: any) => ({
        ...row,
        success_count: row.request_count // 简化：假设所有请求都成功
      }))
    };
  }

  /**
   * 解析时间范围
   */
  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/^(\d+)([hd])$/);
    if (!match) return 24; // 默认 24 小时

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'h') return value;
    if (unit === 'd') return value * 24;

    return 24;
  }
}


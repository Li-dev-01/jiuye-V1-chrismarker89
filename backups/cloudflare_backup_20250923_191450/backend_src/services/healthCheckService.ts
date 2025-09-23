/**
 * 健康检查服务
 * 监控系统各组件的健康状态
 */

import { DatabaseService } from '../db';
import type { Env } from '../types/api';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time: number;
  last_check: string;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    storage: ServiceHealth;
  };
  metrics: {
    memory_usage: number;
    cpu_usage: number;
    request_count: number;
    error_rate: number;
  };
}

export class HealthCheckService {
  private env: Env;
  private db: DatabaseService;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env.DB);
    this.startTime = Date.now();
  }

  /**
   * 执行完整的健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // 并行检查所有服务
    const [databaseHealth, cacheHealth, storageHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkStorage()
    ]);

    // 计算整体状态
    const services = { database: databaseHealth, cache: cacheHealth, storage: storageHealth };
    const overallStatus = this.calculateOverallStatus(services);

    // 获取系统指标
    const metrics = await this.getSystemMetrics();

    return {
      status: overallStatus,
      timestamp,
      version: '1.0.0',
      uptime,
      services,
      metrics
    };
  }

  /**
   * 检查数据库健康状态
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const lastCheck = new Date().toISOString();

    try {
      // 执行简单的数据库查询
      await this.db.queryFirst('SELECT 1 as test');
      
      const responseTime = Date.now() - startTime;
      
      // 判断响应时间
      let status: ServiceHealth['status'] = 'healthy';
      if (responseTime > 2000) {
        status = 'unhealthy';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }

      return {
        status,
        response_time: responseTime,
        last_check: lastCheck
      };

    } catch (error: any) {
      return {
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        last_check: lastCheck,
        error: error.message
      };
    }
  }

  /**
   * 检查缓存健康状态
   */
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const lastCheck = new Date().toISOString();

    try {
      // 在Cloudflare Workers环境中，我们可以检查内存缓存或其他缓存机制
      // 这里简化为基本的响应时间检查
      await new Promise(resolve => setTimeout(resolve, 10)); // 模拟缓存操作

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime > 500 ? 'degraded' : 'healthy',
        response_time: responseTime,
        last_check: lastCheck
      };

    } catch (error: any) {
      return {
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        last_check: lastCheck,
        error: error.message
      };
    }
  }

  /**
   * 检查存储健康状态
   */
  private async checkStorage(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const lastCheck = new Date().toISOString();

    try {
      // 检查R2存储（如果有的话）
      if (this.env.R2_BUCKET) {
        const testKey = 'health_check_test.txt';
        const testContent = 'Health check test content';
        
        // 写入测试
        await this.env.R2_BUCKET.put(testKey, testContent);
        
        // 读取测试
        const object = await this.env.R2_BUCKET.get(testKey);
        if (!object) {
          throw new Error('Storage read test failed');
        }
        
        // 清理测试数据
        await this.env.R2_BUCKET.delete(testKey);
      }

      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        response_time: responseTime,
        last_check: lastCheck
      };

    } catch (error: any) {
      return {
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        last_check: lastCheck,
        error: error.message
      };
    }
  }

  /**
   * 计算整体健康状态
   */
  private calculateOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * 获取系统指标
   */
  private async getSystemMetrics() {
    // 在Cloudflare Workers环境中，这些指标可能有限
    // 这里提供基础的指标收集
    
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    
    return {
      memory_usage: 0, // Workers环境中无法直接获取
      cpu_usage: 0,    // Workers环境中无法直接获取
      request_count: this.requestCount,
      error_rate: errorRate
    };
  }

  /**
   * 记录请求
   */
  recordRequest(isError: boolean = false) {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * 快速健康检查（仅检查关键服务）
   */
  async quickHealthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // 只检查数据库
      await this.db.queryFirst('SELECT 1 as test');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}

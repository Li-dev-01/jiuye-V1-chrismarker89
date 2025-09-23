/**
 * 健康检查路由
 * 提供系统健康状态监控端点
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { HealthCheckService } from '../services/healthCheckService';
import { successResponse, errorResponse } from '../utils/response';
import type { Env } from '../types/api';

const health = new Hono<{ Bindings: Env }>();

// 全局健康检查服务实例
let healthCheckService: HealthCheckService | null = null;

/**
 * 获取或创建健康检查服务实例
 */
function getHealthCheckService(env: Env): HealthCheckService {
  if (!healthCheckService) {
    healthCheckService = new HealthCheckService(env);
  }
  return healthCheckService;
}

/**
 * 完整健康检查
 * GET /health
 */
health.get('/', async (c: Context<{ Bindings: Env }>) => {
  try {
    const healthService = getHealthCheckService(c.env as Env);
    const healthResult = await healthService.performHealthCheck();
    
    // 根据健康状态返回相应的HTTP状态码
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;
    
    return c.json({
      success: true,
      data: healthResult,
      message: `系统状态: ${healthResult.status}`
    }, statusCode);
    
  } catch (error: any) {
    console.error('健康检查失败:', error);
    
    return c.json({
      success: false,
      error: 'Health Check Failed',
      message: '健康检查执行失败',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }, 503);
  }
});

/**
 * 快速健康检查
 * GET /health/quick
 */
health.get('/quick', async (c: Context<{ Bindings: Env }>) => {
  try {
    const healthService = getHealthCheckService(c.env as Env);
    const quickResult = await healthService.quickHealthCheck();
    
    const statusCode = quickResult.status === 'healthy' ? 200 : 503;
    
    return c.json({
      success: true,
      data: quickResult,
      message: '快速健康检查完成'
    }, statusCode);
    
  } catch (error: any) {
    console.error('快速健康检查失败:', error);
    
    return c.json({
      success: false,
      error: 'Quick Health Check Failed',
      message: '快速健康检查失败',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

/**
 * 数据库健康检查
 * GET /health/database
 */
health.get('/database', async (c: Context<{ Bindings: Env }>) => {
  try {
    const healthService = getHealthCheckService(c.env as Env);
    const startTime = Date.now();
    
    // 执行数据库连接测试
    await healthService['checkDatabase']();
    
    const responseTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'database',
        response_time: responseTime,
        timestamp: new Date().toISOString()
      },
      message: '数据库连接正常'
    });
    
  } catch (error: any) {
    console.error('数据库健康检查失败:', error);
    
    return c.json({
      success: false,
      error: 'Database Health Check Failed',
      message: '数据库连接异常',
      data: {
        status: 'unhealthy',
        service: 'database',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

/**
 * 系统信息
 * GET /health/info
 */
health.get('/info', async (c: Context<{ Bindings: Env }>) => {
  try {
    const info = {
      service: 'Employment Survey API',
      version: '1.0.0',
      environment: c.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      node_version: process.version || 'unknown',
      platform: 'Cloudflare Workers'
    };
    
    return c.json({
      success: true,
      data: info,
      message: '系统信息获取成功'
    });
    
  } catch (error: any) {
    console.error('获取系统信息失败:', error);
    
    return c.json({
      success: false,
      error: 'System Info Failed',
      message: '获取系统信息失败',
      data: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * 存活检查（最简单的检查）
 * GET /health/alive
 */
health.get('/alive', async (c: Context<{ Bindings: Env }>) => {
  return c.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString()
    },
    message: '服务正在运行'
  });
});

/**
 * 就绪检查（检查服务是否准备好处理请求）
 * GET /health/ready
 */
health.get('/ready', async (c: Context<{ Bindings: Env }>) => {
  try {
    const healthService = getHealthCheckService(c.env as Env);
    
    // 检查关键依赖是否就绪
    const quickResult = await healthService.quickHealthCheck();
    
    if (quickResult.status === 'healthy') {
      return c.json({
        success: true,
        data: {
          status: 'ready',
          timestamp: new Date().toISOString()
        },
        message: '服务已就绪'
      });
    } else {
      return c.json({
        success: false,
        data: {
          status: 'not_ready',
          timestamp: new Date().toISOString()
        },
        message: '服务未就绪'
      }, 503);
    }
    
  } catch (error: any) {
    console.error('就绪检查失败:', error);
    
    return c.json({
      success: false,
      error: 'Readiness Check Failed',
      message: '就绪检查失败',
      data: {
        status: 'not_ready',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 503);
  }
});

export default health;

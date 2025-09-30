/**
 * 安全配置管理API路由
 * 提供超级管理员的安全开关控制接口
 */

import { Hono } from 'hono';
import type { Env } from '../../types/api';
import { securityConfig } from '../../services/securityConfigService';
import { getProtectionStatus } from '../../middleware/smartProtectionMiddleware';

const app = new Hono<{ Bindings: Env }>();

/**
 * 获取当前安全配置
 */
app.get('/config', async (c) => {
  try {
    const config = securityConfig.getConfig();
    const environment = securityConfig.getEnvironment();
    const stats = securityConfig.getConfigStats();

    return c.json({
      success: true,
      data: {
        config,
        environment,
        stats,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('获取安全配置失败:', error);
    return c.json({
      success: false,
      error: 'Failed to get security config',
      message: '获取安全配置失败'
    }, 500);
  }
});

/**
 * 更新安全配置
 */
app.put('/config', async (c) => {
  try {
    const { config: newConfig } = await c.req.json();
    const operator = c.req.header('X-Admin-User') || 'unknown';

    // 验证配置
    const validation = securityConfig.validateConfig(newConfig);
    if (!validation.valid) {
      return c.json({
        success: false,
        error: 'Invalid Config',
        message: '配置验证失败',
        details: validation.errors
      }, 400);
    }

    // 更新配置
    securityConfig.updateConfig(newConfig, operator);

    // 记录操作日志
    console.log(`🔧 安全配置已更新 by ${operator}:`, {
      turnstileEnabled: newConfig.turnstile.enabled,
      rateLimitEnabled: newConfig.rateLimit.enabled,
      emergencyMode: newConfig.emergency.enabled
    });

    return c.json({
      success: true,
      message: '安全配置已更新',
      data: {
        config: securityConfig.getConfig(),
        operator,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('更新安全配置失败:', error);
    return c.json({
      success: false,
      error: 'Failed to update security config',
      message: '更新安全配置失败'
    }, 500);
  }
});

/**
 * 重置为默认配置
 */
app.post('/config/reset', async (c) => {
  try {
    const operator = c.req.header('X-Admin-User') || 'unknown';
    
    securityConfig.resetToDefault(operator);

    console.log(`🔄 安全配置已重置 by ${operator}`);

    return c.json({
      success: true,
      message: '安全配置已重置为默认值',
      data: {
        config: securityConfig.getConfig(),
        operator,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('重置安全配置失败:', error);
    return c.json({
      success: false,
      error: 'Failed to reset security config',
      message: '重置安全配置失败'
    }, 500);
  }
});

/**
 * 紧急停止所有防护
 */
app.post('/emergency/stop', async (c) => {
  try {
    const operator = c.req.header('X-Admin-User') || 'unknown';
    const { reason } = await c.req.json().catch(() => ({ reason: '未提供原因' }));
    
    securityConfig.emergencyStop(operator);

    console.log(`🚨 紧急停止所有安全防护 by ${operator}, 原因: ${reason}`);

    return c.json({
      success: true,
      message: '已紧急停止所有安全防护',
      data: {
        config: securityConfig.getConfig(),
        operator,
        reason,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('紧急停止失败:', error);
    return c.json({
      success: false,
      error: 'Failed to emergency stop',
      message: '紧急停止失败'
    }, 500);
  }
});

/**
 * 启用严格模式
 */
app.post('/emergency/strict', async (c) => {
  try {
    const operator = c.req.header('X-Admin-User') || 'unknown';
    const { reason } = await c.req.json().catch(() => ({ reason: '未提供原因' }));
    
    securityConfig.enableStrictMode(operator);

    console.log(`🔒 启用严格安全模式 by ${operator}, 原因: ${reason}`);

    return c.json({
      success: true,
      message: '已启用严格安全模式',
      data: {
        config: securityConfig.getConfig(),
        operator,
        reason,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('启用严格模式失败:', error);
    return c.json({
      success: false,
      error: 'Failed to enable strict mode',
      message: '启用严格模式失败'
    }, 500);
  }
});

/**
 * 获取配置历史
 */
app.get('/config/history', async (c) => {
  try {
    const history = securityConfig.getConfigHistory();
    
    return c.json({
      success: true,
      data: {
        history: history.map(item => ({
          timestamp: item.timestamp,
          operator: item.operator,
          date: new Date(item.timestamp).toISOString(),
          changes: [] // Simplified - config changes tracking removed
        })),
        total: history.length
      }
    });
  } catch (error) {
    console.error('获取配置历史失败:', error);
    return c.json({
      success: false,
      error: 'Failed to get config history',
      message: '获取配置历史失败'
    }, 500);
  }
});

/**
 * 获取防护状态统计
 */
app.get('/status', async (c) => {
  try {
    const status = getProtectionStatus();
    
    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取防护状态失败:', error);
    return c.json({
      success: false,
      error: 'Failed to get protection status',
      message: '获取防护状态失败'
    }, 500);
  }
});

/**
 * 测试配置有效性
 */
app.post('/config/test', async (c) => {
  try {
    const { config: testConfig } = await c.req.json();
    
    const validation = securityConfig.validateConfig(testConfig);
    
    return c.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: [] // Simplified - config warnings removed
      }
    });
  } catch (error) {
    console.error('测试配置失败:', error);
    return c.json({
      success: false,
      error: 'Failed to test config',
      message: '测试配置失败'
    }, 500);
  }
});

/**
 * 获取实时监控数据
 */
app.get('/monitoring', async (c) => {
  try {
    // 这里应该从实际的监控系统获取数据
    const monitoringData = {
      requestsPerMinute: 0, // 实际应该从监控系统获取
      blockedRequests: 0,
      turnstileVerifications: 0,
      rateLimitHits: 0,
      emergencyModeActive: securityConfig.getConfig().emergency.enabled,
      lastUpdate: Date.now()
    };
    
    return c.json({
      success: true,
      data: monitoringData
    });
  } catch (error) {
    console.error('获取监控数据失败:', error);
    return c.json({
      success: false,
      error: 'Failed to get monitoring data',
      message: '获取监控数据失败'
    }, 500);
  }
});

export default app;

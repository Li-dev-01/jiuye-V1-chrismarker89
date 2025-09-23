/**
 * 安全防护中间件
 * 用于检测和防护DDoS攻击、暴力破解等安全威胁
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';

interface SecurityConfig {
  ddosThreshold: number;
  ddosWindow: number;
  bruteForceThreshold: number;
  bruteForceWindow: number;
  autoEmergencyThreshold: number;
}

interface AccessRecord {
  timestamps: number[];
}

interface LoginFailure {
  count: number;
  lastAttempt: number;
}

class SecurityMiddleware {
  private ipAccessLog: Map<string, AccessRecord> = new Map();
  private loginFailures: Map<string, LoginFailure> = new Map();
  private config: SecurityConfig = {
    ddosThreshold: 100,
    ddosWindow: 60000, // 60秒
    bruteForceThreshold: 5,
    bruteForceWindow: 300000, // 5分钟
    autoEmergencyThreshold: 200,
  };

  async loadConfigFromDB(env: Env): Promise<void> {
    try {
      const db = createDatabaseService(env);
      
      const configs = await db.query(`
        SELECT config_key, config_value 
        FROM system_config 
        WHERE config_key IN (
          'ddos_protection_enabled',
          'brute_force_protection_enabled', 
          'auto_emergency_shutdown_threshold'
        )
      `);

      for (const config of configs) {
        if (config.config_key === 'auto_emergency_shutdown_threshold') {
          this.config.autoEmergencyThreshold = parseInt(config.config_value);
        }
      }
    } catch (error) {
      console.error('加载安全配置失败:', error);
    }
  }

  async checkProjectStatus(env: Env): Promise<boolean> {
    try {
      const db = createDatabaseService(env);
      
      const configs = await db.query(`
        SELECT config_key, config_value 
        FROM system_config 
        WHERE config_key IN ('project_enabled', 'emergency_shutdown')
      `);

      const configMap = new Map(configs.map(c => [c.config_key, c.config_value]));
      
      // 如果项目被禁用或处于紧急关闭状态
      if (configMap.get('project_enabled')?.toLowerCase() === 'false' || 
          configMap.get('emergency_shutdown')?.toLowerCase() === 'true') {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('检查项目状态失败:', error);
      return true; // 默认允许访问
    }
  }

  detectDDoS(ipAddress: string): boolean {
    const currentTime = Date.now();
    
    if (!this.ipAccessLog.has(ipAddress)) {
      this.ipAccessLog.set(ipAddress, { timestamps: [] });
    }
    
    const record = this.ipAccessLog.get(ipAddress)!;
    
    // 清理过期记录
    record.timestamps = record.timestamps.filter(
      timestamp => currentTime - timestamp <= this.config.ddosWindow
    );
    
    // 添加当前访问记录
    record.timestamps.push(currentTime);
    
    // 检查是否超过阈值
    const requestCount = record.timestamps.length;
    
    if (requestCount > this.config.ddosThreshold) {
      this.logSecurityEvent('ddos_detected', 'high', ipAddress, {
        request_count: requestCount,
        window_seconds: this.config.ddosWindow / 1000
      });
      return true;
    }
    
    // 检查是否需要自动紧急关闭
    if (requestCount > this.config.autoEmergencyThreshold) {
      this.triggerEmergencyShutdown(ipAddress, 'auto_ddos_protection');
      return true;
    }
    
    return false;
  }

  detectBruteForce(ipAddress: string, isLoginFailure: boolean = false): boolean {
    const currentTime = Date.now();
    
    if (isLoginFailure) {
      if (!this.loginFailures.has(ipAddress)) {
        this.loginFailures.set(ipAddress, { count: 0, lastAttempt: 0 });
      }
      
      const failure = this.loginFailures.get(ipAddress)!;
      
      // 清理过期记录
      if (currentTime - failure.lastAttempt > this.config.bruteForceWindow) {
        failure.count = 0;
      }
      
      // 增加失败计数
      failure.count += 1;
      failure.lastAttempt = currentTime;
    }
    
    const failure = this.loginFailures.get(ipAddress);
    if (failure && failure.count > this.config.bruteForceThreshold) {
      this.logSecurityEvent('brute_force_detected', 'high', ipAddress, {
        failure_count: failure.count,
        window_seconds: this.config.bruteForceWindow / 1000
      });
      return true;
    }
    
    return false;
  }

  async triggerEmergencyShutdown(sourceIp: string, reason: string): Promise<void> {
    try {
      // 这里应该实现紧急关闭逻辑
      console.log(`紧急关闭已触发 - 原因: ${reason}, 源IP: ${sourceIp}`);
      
      // 记录安全事件
      this.logSecurityEvent('emergency_shutdown_triggered', 'critical', sourceIp, {
        reason,
        auto_triggered: true
      });
    } catch (error) {
      console.error('触发紧急关闭失败:', error);
    }
  }

  private logSecurityEvent(eventType: string, severity: string, sourceIp: string, details: any): void {
    try {
      // 这里应该记录到数据库
      console.log('安全事件:', {
        event_type: eventType,
        severity,
        source_ip: sourceIp,
        details,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('记录安全事件失败:', error);
    }
  }

  async recordUserBehavior(env: Env, ipAddress: string, actionType: string, actionDetails: any): Promise<void> {
    try {
      const db = createDatabaseService(env);
      
      await db.execute(`
        INSERT INTO user_behavior_analysis 
        (ip_address, action_type, action_details, created_at)
        VALUES (?, ?, ?, ?)
      `, [
        ipAddress,
        actionType,
        JSON.stringify(actionDetails),
        new Date().toISOString()
      ]);
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  }
}

// 全局安全中间件实例
const securityMiddleware = new SecurityMiddleware();

/**
 * 安全检查中间件
 */
export const securityCheck = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const ipAddress = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For') || 
                   c.req.header('X-Real-IP') || 
                   'unknown';

  try {
    // 检查项目状态
    const projectEnabled = await securityMiddleware.checkProjectStatus(c.env);
    if (!projectEnabled) {
      return c.json({
        success: false,
        error: '系统维护中，请稍后再试',
        code: 'SYSTEM_MAINTENANCE'
      }, 503);
    }

    // DDoS检测
    if (securityMiddleware.detectDDoS(ipAddress)) {
      return c.json({
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      }, 429);
    }

    // 暴力破解检测（仅对登录相关接口）
    const path = c.req.path;
    if (path.includes('login') || path.includes('auth')) {
      if (securityMiddleware.detectBruteForce(ipAddress)) {
        return c.json({
          success: false,
          error: '登录尝试过于频繁，请稍后再试',
          code: 'BRUTE_FORCE_DETECTED'
        }, 429);
      }
    }

    // 记录用户行为
    await securityMiddleware.recordUserBehavior(c.env, ipAddress, path, {
      method: c.req.method,
      path: c.req.path,
      user_agent: c.req.header('User-Agent') || ''
    });

    await next();
  } catch (error) {
    console.error('安全检查失败:', error);
    await next(); // 安全检查失败时继续执行，避免影响正常功能
  }
  return;
};

/**
 * 登录失败处理器
 */
export const handleLoginFailure = (ipAddress: string) => {
  securityMiddleware.detectBruteForce(ipAddress, true);
};

export { securityMiddleware };

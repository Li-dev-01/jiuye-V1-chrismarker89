/**
 * 超级管理员API路由
 * 提供项目控制、用户行为分析、安全管理等功能
 */

import { Hono } from 'hono';
import type { Env, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { authMiddleware } from '../middleware/auth';

export function createSuperAdminRoutes() {
  const superAdmin = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  // 中间件：超级管理员认证（支持两种token格式）
  const simpleSuperAdminAuth = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('[SUPER_ADMIN_AUTH] 收到认证请求，token:', token?.substring(0, 20) + '...');

    if (!token) {
      console.log('[SUPER_ADMIN_AUTH] Token缺失');
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '缺少认证token'
      }, 401);
    }

    const db = createDatabaseService(c.env as Env);

    try {
      // 方式1：检查是否是旧的简单token格式 mgmt_token_SUPER_ADMIN_timestamp
      if (token.startsWith('mgmt_token_')) {
        const tokenParts = token.split('_');
        console.log('[SUPER_ADMIN_AUTH] 检测到旧格式token');

        if (tokenParts.length >= 4 && tokenParts[2] === 'SUPER' && tokenParts[3] === 'ADMIN') {
          console.log('[SUPER_ADMIN_AUTH] ✅ 旧格式token验证成功');
          const user = {
            id: 'super_admin',
            username: 'super_admin',
            role: 'super_admin',
            userType: 'SUPER_ADMIN'
          };
          c.set('user', user);
          await next();
          return;
        }
      }

      // 方式2：检查是否是新的会话ID格式（从login_sessions表验证）
      console.log('[SUPER_ADMIN_AUTH] 尝试验证会话ID');
      console.log('[SUPER_ADMIN_AUTH] Token格式检查:', {
        isSessionFormat: /^session_[0-9]+_[a-z0-9]+$/.test(token || ''),
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 30) + '...'
      });

      const session = await db.queryFirst(`
        SELECT
          ls.session_id,
          ls.email,
          ls.role,
          ls.account_id,
          ls.expires_at,
          ls.is_active,
          ra.username,
          ra.display_name
        FROM login_sessions ls
        LEFT JOIN role_accounts ra ON ls.account_id = ra.id
        WHERE ls.session_id = ?
          AND ls.is_active = 1
          AND ls.role = 'super_admin'
          AND datetime(ls.expires_at) > datetime('now')
      `, [token]);

      console.log('[SUPER_ADMIN_AUTH] 会话查询结果:', session ? '找到会话' : '未找到会话');

      if (session) {
        console.log('[SUPER_ADMIN_AUTH] ✅ 会话验证成功');
        console.log('[SUPER_ADMIN_AUTH] 会话详情:', {
          email: session.email,
          role: session.role,
          accountId: session.account_id,
          isActive: session.is_active,
          expiresAt: session.expires_at
        });

        const user = {
          id: session.account_id,
          username: session.username || session.email,
          email: session.email,
          role: 'super_admin',
          userType: 'SUPER_ADMIN',
          displayName: session.display_name
        };
        c.set('user', user);
        await next();
        return;
      }

      // 两种方式都失败 - 提供详细的失败原因
      console.error('[SUPER_ADMIN_AUTH] ❌ Token验证失败');
      console.error('[SUPER_ADMIN_AUTH] 失败原因分析:');

      // 查询会话是否存在（不带条件）
      const rawSession = await db.queryFirst(`
        SELECT session_id, email, role, is_active, expires_at
        FROM login_sessions
        WHERE session_id = ?
      `, [token]);

      if (rawSession) {
        console.error('[SUPER_ADMIN_AUTH] 会话存在但验证失败，原因:');
        console.error('[SUPER_ADMIN_AUTH] - role:', rawSession.role, '(期望: super_admin)');
        console.error('[SUPER_ADMIN_AUTH] - is_active:', rawSession.is_active, '(期望: 1)');
        console.error('[SUPER_ADMIN_AUTH] - expires_at:', rawSession.expires_at);
        console.error('[SUPER_ADMIN_AUTH] - 当前时间:', new Date().toISOString());
      } else {
        console.error('[SUPER_ADMIN_AUTH] 会话不存在于数据库中');
      }

      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '无效的认证token或会话已过期'
      }, 401);

    } catch (error) {
      console.error('[SUPER_ADMIN_AUTH] 认证错误:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '认证失败'
      }, 500);
    }
  };

  /**
   * 获取项目运行状态
   */
  superAdmin.get('/project/status', simpleSuperAdminAuth, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 默认状态
      const status = {
        project_enabled: true,
        maintenance_mode: false,
        emergency_shutdown: false,
        last_updated: null as string | null,
        updated_by: null as string | null
      };

      try {
        // 尝试获取项目状态配置
        const configs = await db.query(`
          SELECT config_key, config_value, updated_at, updated_by
          FROM system_config
          WHERE config_key IN ('project_enabled', 'maintenance_mode', 'emergency_shutdown')
        `);

        for (const config of configs) {
          if (config.config_key === 'project_enabled') {
            status.project_enabled = config.config_value.toLowerCase() === 'true';
          } else if (config.config_key === 'maintenance_mode') {
            status.maintenance_mode = config.config_value.toLowerCase() === 'true';
          } else if (config.config_key === 'emergency_shutdown') {
            status.emergency_shutdown = config.config_value.toLowerCase() === 'true';
          }

          if (config.updated_at) {
            status.last_updated = config.updated_at;
            status.updated_by = config.updated_by;
          }
        }
      } catch (dbError) {
        console.warn('数据库查询失败，使用默认状态:', dbError);
        // 使用默认状态，不抛出错误
      }

      return c.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('获取项目状态失败:', error);
      // 返回默认状态而不是错误
      return c.json({
        success: true,
        data: {
          project_enabled: true,
          maintenance_mode: false,
          emergency_shutdown: false,
          last_updated: null,
          updated_by: null
        }
      });
    }
  });

  /**
   * 控制项目状态
   */
  superAdmin.post('/project/control', simpleSuperAdminAuth, async (c) => {
    try {
      const body = await c.req.json();
      const { action, reason } = body;
      
      if (!action) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少操作类型'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user');
      const currentTime = new Date().toISOString();
      
      let configUpdates: Array<{key: string, value: string}> = [];

      switch (action) {
        case 'enable':
          configUpdates = [
            { key: 'project_enabled', value: 'true' },
            { key: 'maintenance_mode', value: 'false' },
            { key: 'emergency_shutdown', value: 'false' }
          ];
          break;
        case 'disable':
          configUpdates = [
            { key: 'project_enabled', value: 'false' },
            { key: 'maintenance_mode', value: 'true' }
          ];
          break;
        case 'emergency_shutdown':
          configUpdates = [
            { key: 'emergency_shutdown', value: 'true' },
            { key: 'project_enabled', value: 'false' }
          ];
          break;
        default:
          return c.json({
            success: false,
            error: 'Validation Error',
            message: '无效的操作类型'
          }, 400);
      }

      // 更新配置
      for (const update of configUpdates) {
        await db.execute(`
          INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
          VALUES (?, ?, ?, ?)
        `, [update.key, update.value, currentTime, user.username]);
      }

      // 记录操作日志
      await db.execute(`
        INSERT INTO admin_operation_logs 
        (operator, operation, target, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.username,
        `project_control_${action}`,
        'system',
        JSON.stringify({ action, reason }),
        c.req.header('CF-Connecting-IP') || 'unknown',
        currentTime
      ]);

      return c.json({
        success: true,
        message: `项目状态已更新: ${action}`
      });

    } catch (error) {
      console.error('控制项目状态失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '控制项目状态失败'
      }, 500);
    }
  });

  /**
   * 获取安全指标
   */
  superAdmin.get('/security/metrics', simpleSuperAdminAuth, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 默认安全指标
      let metrics = {
        threat_level: 'low',
        active_threats: 0,
        blocked_ips: 0,
        failed_logins: 0,
        ddos_attempts: 0,
        system_health: 100
      };

      try {
        // 尝试获取安全指标
        const [activeThreats, blockedIps, failedLogins, ddosAttempts] = await Promise.all([
          db.queryFirst(`
            SELECT COUNT(*) as count
            FROM security_events
            WHERE status = 'active' AND severity IN ('high', 'critical')
          `).catch(() => ({ count: 0 })),

          db.queryFirst(`
            SELECT COUNT(DISTINCT source_ip) as count
            FROM security_events
            WHERE event_type = 'ip_blocked' AND status = 'active'
          `).catch(() => ({ count: 0 })),

          db.queryFirst(`
            SELECT COUNT(*) as count
            FROM security_events
            WHERE event_type = 'login_failure'
            AND created_at >= datetime('now', '-1 hour')
          `).catch(() => ({ count: 0 })),

          db.queryFirst(`
            SELECT COUNT(*) as count
            FROM security_events
            WHERE event_type = 'ddos_detected'
            AND created_at >= datetime('now', '-24 hours')
          `).catch(() => ({ count: 0 }))
        ]);

        // 计算威胁等级
        const totalThreats = (activeThreats?.count || 0) + (ddosAttempts?.count || 0);
        let threatLevel = 'low';
        if (totalThreats > 10) threatLevel = 'critical';
        else if (totalThreats > 5) threatLevel = 'high';
        else if (totalThreats > 2) threatLevel = 'medium';

        // 计算系统健康度
        const systemHealth = Math.max(0, 100 - (totalThreats * 10) - ((failedLogins?.count || 0) * 2));

        metrics = {
          threat_level: threatLevel,
          active_threats: activeThreats?.count || 0,
          blocked_ips: blockedIps?.count || 0,
          failed_logins: failedLogins?.count || 0,
          ddos_attempts: ddosAttempts?.count || 0,
          system_health: systemHealth
        };
      } catch (dbError) {
        console.warn('数据库查询失败，使用默认安全指标:', dbError);
        // 使用默认指标
      }

      return c.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('获取安全指标失败:', error);
      // 返回默认安全指标而不是错误
      return c.json({
        success: true,
        data: {
          threat_level: 'low',
          active_threats: 0,
          blocked_ips: 0,
          failed_logins: 0,
          ddos_attempts: 0,
          system_health: 100
        }
      });
    }
  });

  /**
   * 获取威胁分析数据
   */
  superAdmin.get('/security/threats', simpleSuperAdminAuth, async (c) => {
    try {
      const db = createDatabaseService(c.env as Env);

      // 默认威胁分析数据
      let threatsData = {
        suspicious_ips: [],
        attack_patterns: [],
        security_events: []
      };

      try {
        // 尝试获取威胁分析数据
        const [suspiciousIps, attackPatterns, securityEvents] = await Promise.all([
          db.query(`
            SELECT
              source_ip as ip_address,
              COUNT(*) * 10 +
              CASE
                WHEN MAX(severity) = 'critical' THEN 40
                WHEN MAX(severity) = 'high' THEN 30
                WHEN MAX(severity) = 'medium' THEN 20
                ELSE 10
              END as threat_score,
              COUNT(*) as request_count,
              MAX(created_at) as last_activity,
              GROUP_CONCAT(DISTINCT event_type) as threat_type
            FROM security_events
            WHERE source_ip IS NOT NULL
            AND created_at >= datetime('now', '-7 days')
            GROUP BY source_ip
            HAVING threat_score > 30
            ORDER BY threat_score DESC
            LIMIT 20
          `).catch(() => []),

          db.query(`
            SELECT
              event_type as pattern_type,
              COUNT(*) as frequency,
              MAX(severity) as severity,
              'Detected ' || event_type || ' attempts' as description
            FROM security_events
            WHERE created_at >= datetime('now', '-24 hours')
            GROUP BY event_type
            ORDER BY frequency DESC
            LIMIT 10
          `).catch(() => []),

          db.query(`
            SELECT
              id,
              event_type,
              severity,
              source_ip,
              event_type || ' from ' || COALESCE(source_ip, 'unknown') as description,
              created_at,
              status
            FROM security_events
            ORDER BY created_at DESC
            LIMIT 20
          `).catch(() => [])
        ]);

        threatsData = {
          suspicious_ips: suspiciousIps || [],
          attack_patterns: attackPatterns || [],
          security_events: securityEvents || []
        };
      } catch (dbError) {
        console.warn('数据库查询失败，使用默认威胁分析数据:', dbError);
        // 使用默认空数据
      }

      return c.json({
        success: true,
        data: threatsData
      });

    } catch (error) {
      console.error('获取威胁分析失败:', error);
      // 返回默认空数据而不是错误
      return c.json({
        success: true,
        data: {
          suspicious_ips: [],
          attack_patterns: [],
          security_events: []
        }
      });
    }
  });

  /**
   * 紧急关闭项目
   */
  superAdmin.post('/emergency/shutdown', simpleSuperAdminAuth, async (c) => {
    try {
      const body = await c.req.json();
      const { reason } = body;

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user');
      const currentTime = new Date().toISOString();

      // 设置紧急关闭状态
      await db.execute(`
        INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
      `, ['emergency_shutdown', 'true', currentTime, user.username]);

      await db.execute(`
        INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
      `, ['project_enabled', 'false', currentTime, user.username]);

      // 记录安全事件
      await db.execute(`
        INSERT INTO security_events
        (event_type, severity, source_ip, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'emergency_shutdown',
        'critical',
        c.req.header('CF-Connecting-IP') || 'unknown',
        JSON.stringify({ reason, operator: user.username }),
        currentTime
      ]);

      // 记录操作日志
      await db.execute(`
        INSERT INTO admin_operation_logs
        (operator, operation, target, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.username,
        'emergency_shutdown',
        'system',
        JSON.stringify({ reason }),
        c.req.header('CF-Connecting-IP') || 'unknown',
        currentTime
      ]);

      return c.json({
        success: true,
        message: '项目已紧急关闭'
      });

    } catch (error) {
      console.error('紧急关闭失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '紧急关闭失败'
      }, 500);
    }
  });

  /**
   * 恢复项目运行
   */
  superAdmin.post('/project/restore', simpleSuperAdminAuth, async (c) => {
    try {
      const body = await c.req.json();
      const { reason } = body;

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user');
      const currentTime = new Date().toISOString();

      // 恢复项目运行
      await db.execute(`
        INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
      `, ['project_enabled', 'true', currentTime, user.username]);

      await db.execute(`
        INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
      `, ['emergency_shutdown', 'false', currentTime, user.username]);

      await db.execute(`
        INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
      `, ['maintenance_mode', 'false', currentTime, user.username]);

      // 记录安全事件
      await db.execute(`
        INSERT INTO security_events
        (event_type, severity, source_ip, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'project_restored',
        'medium',
        c.req.header('CF-Connecting-IP') || 'unknown',
        JSON.stringify({ reason, operator: user.username }),
        currentTime
      ]);

      // 记录操作日志
      await db.execute(`
        INSERT INTO admin_operation_logs
        (operator, operation, target, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.username,
        'project_restore',
        'system',
        JSON.stringify({ reason }),
        c.req.header('CF-Connecting-IP') || 'unknown',
        currentTime
      ]);

      return c.json({
        success: true,
        message: '项目已恢复运行'
      });

    } catch (error) {
      console.error('恢复项目失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '恢复项目失败'
      }, 500);
    }
  });

  /**
   * 封禁威胁IP
   */
  superAdmin.post('/security/block-ip', simpleSuperAdminAuth, async (c) => {
    try {
      const body = await c.req.json();
      const { ip_address, reason } = body;

      if (!ip_address) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '缺少IP地址'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);
      const user = c.get('user');
      const currentTime = new Date().toISOString();

      // 记录IP封禁事件
      await db.execute(`
        INSERT INTO security_events
        (event_type, severity, source_ip, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'ip_blocked',
        'high',
        ip_address,
        JSON.stringify({ reason, operator: user.username }),
        currentTime
      ]);

      // 记录操作日志
      await db.execute(`
        INSERT INTO admin_operation_logs
        (operator, operation, target, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        user.username,
        'block_ip',
        ip_address,
        JSON.stringify({ reason }),
        c.req.header('CF-Connecting-IP') || 'unknown',
        currentTime
      ]);

      return c.json({
        success: true,
        message: `IP ${ip_address} 已被封禁`
      });

    } catch (error) {
      console.error('封禁IP失败:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '封禁IP失败'
      }, 500);
    }
  });

  /**
   * 获取系统日志
   */
  superAdmin.get('/system/logs', simpleSuperAdminAuth, async (c) => {
    try {
      // 获取查询参数
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const level = c.req.query('level');
      const category = c.req.query('category');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');
      const search = c.req.query('search');

      const db = createDatabaseService(c.env as Env);

      let allLogs: any[] = [];

      try {
        // 1. 查询管理员审计日志
        try {
          const adminAuditLogs = await db.query(`
            SELECT
              id,
              operator_email as username,
              operator_role,
              action,
              target_email,
              details,
              success,
              error_message,
              ip_address,
              user_agent,
              created_at as timestamp
            FROM admin_audit_logs
            ORDER BY created_at DESC
            LIMIT 100
          `);

          const formattedAdminLogs = adminAuditLogs.map((log: any) => ({
            id: `admin_audit_${log.id}`,
            source: 'admin_audit',
            username: log.username || 'unknown',
            action: log.action || 'unknown',
            category: '用户管理',
            level: log.success ? 'success' : 'error',
            message: `${log.action} - ${log.target_email || 'system'}`,
            ip_address: log.ip_address || 'unknown',
            user_agent: log.user_agent || 'unknown',
            timestamp: log.timestamp,
            details: log.details
          }));

          allLogs = [...allLogs, ...formattedAdminLogs];
        } catch (adminError) {
          console.warn('查询管理员审计日志失败:', adminError);
        }

        // 2. 查询系统日志
        try {
          const systemLogs = await db.query(`
            SELECT
              id,
              user_id,
              action,
              resource_type,
              resource_id,
              details,
              ip_address,
              user_agent,
              created_at as timestamp
            FROM system_logs
            ORDER BY created_at DESC
            LIMIT 100
          `);

          const formattedSystemLogs = systemLogs.map((log: any) => ({
            id: `system_${log.id}`,
            source: 'system',
            username: log.user_id || 'system',
            action: log.action || 'unknown',
            category: '系统操作',
            level: 'info',
            message: `${log.action} ${log.resource_type || ''} ${log.resource_id || ''}`,
            ip_address: log.ip_address || 'unknown',
            user_agent: log.user_agent || 'unknown',
            timestamp: log.timestamp,
            details: log.details
          }));

          allLogs = [...allLogs, ...formattedSystemLogs];
        } catch (systemError) {
          console.warn('查询系统日志失败:', systemError);
        }

        // 3. 查询认证日志
        try {
          const authLogs = await db.query(`
            SELECT
              id,
              user_uuid,
              user_type,
              action,
              ip_address,
              user_agent,
              success,
              error_message,
              created_at as timestamp
            FROM auth_logs
            ORDER BY created_at DESC
            LIMIT 100
          `);

          const formattedAuthLogs = authLogs.map((log: any) => ({
            id: `auth_${log.id}`,
            source: 'auth',
            username: log.user_uuid || 'unknown',
            action: log.action || 'unknown',
            category: '登录监控',
            level: log.success ? 'success' : 'warn',
            message: `${log.action} - ${log.user_type || 'unknown'} ${log.success ? '成功' : '失败'}`,
            ip_address: log.ip_address || 'unknown',
            user_agent: log.user_agent || 'unknown',
            timestamp: log.timestamp,
            details: log.error_message
          }));

          allLogs = [...allLogs, ...formattedAuthLogs];
        } catch (authError) {
          console.warn('查询认证日志失败:', authError);
        }

      } catch (dbError) {
        console.warn('数据库查询失败:', dbError);
      }

      // 按时间戳降序排序
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 应用筛选
      if (level && level !== 'all') {
        allLogs = allLogs.filter(log => log.level === level);
      }
      if (category && category !== 'all') {
        allLogs = allLogs.filter(log => log.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        allLogs = allLogs.filter(log =>
          log.message.toLowerCase().includes(searchLower) ||
          log.username.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.ip_address.toLowerCase().includes(searchLower)
        );
      }

      // 分页
      const total = allLogs.length;
      const offset = (page - 1) * pageSize;
      const paginatedLogs = allLogs.slice(offset, offset + pageSize);

      return c.json({
        success: true,
        data: {
          items: paginatedLogs,
          total,
          page,
          pageSize
        }
      });

    } catch (error) {
      console.error('获取系统日志失败:', error);
      // 返回空数据而不是错误
      return c.json({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20
        }
      });
    }
  });

  /**
   * 获取操作记录
   */
  superAdmin.get('/operation/logs', simpleSuperAdminAuth, async (c) => {
    try {
      // 获取查询参数
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const username = c.req.query('username');
      const operation = c.req.query('operation');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');
      const search = c.req.query('search');

      const db = createDatabaseService(c.env as Env);

      let allOperations: any[] = [];

      try {
        // 查询管理员审计日志作为操作记录
        const adminAuditLogs = await db.query(`
          SELECT
            id,
            operator_email as username,
            operator_role as userType,
            action as operation,
            target_email as target,
            CASE WHEN success = 1 THEN 'success' ELSE 'failed' END as result,
            ip_address as ip,
            user_agent as userAgent,
            details,
            created_at as timestamp,
            1000 as duration
          FROM admin_audit_logs
          ORDER BY created_at DESC
          LIMIT 200
        `);

        allOperations = adminAuditLogs;

        // 应用筛选
        if (username && username !== 'all') {
          allOperations = allOperations.filter((op: any) =>
            op.username && op.username.toLowerCase().includes(username.toLowerCase())
          );
        }

        if (operation && operation !== 'all') {
          allOperations = allOperations.filter((op: any) =>
            op.operation && op.operation.toLowerCase().includes(operation.toLowerCase())
          );
        }

        if (search) {
          const searchLower = search.toLowerCase();
          allOperations = allOperations.filter((op: any) =>
            (op.username && op.username.toLowerCase().includes(searchLower)) ||
            (op.operation && op.operation.toLowerCase().includes(searchLower)) ||
            (op.target && op.target.toLowerCase().includes(searchLower)) ||
            (op.details && op.details.toLowerCase().includes(searchLower))
          );
        }

      } catch (dbError) {
        console.warn('查询操作记录失败:', dbError);
        allOperations = [];
      }

      // 分页
      const total = allOperations.length;
      const offset = (page - 1) * pageSize;
      const paginatedOperations = allOperations.slice(offset, offset + pageSize);

      return c.json({
        success: true,
        data: {
          items: paginatedOperations,
          total,
          page,
          pageSize
        }
      });

    } catch (error) {
      console.error('获取操作记录失败:', error);
      return c.json({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20
        }
      });
    }
  });

  return superAdmin;
}

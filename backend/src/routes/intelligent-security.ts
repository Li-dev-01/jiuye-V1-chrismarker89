/**
 * 智能安全API路由
 * 处理机器学习异常检测、威胁情报、设备指纹等智能安全功能
 */

import { Hono } from 'hono';
import type { Env } from '../types/api';
import { createDatabaseService } from '../db';
import { AnomalyDetectionService } from '../services/anomalyDetectionService';
import { ThreatIntelligenceService } from '../services/threatIntelligenceService';
import { AdvancedFingerprintService } from '../services/advancedFingerprintService';
import { AutomatedResponseService } from '../services/automatedResponseService';
import { ComplianceReportService } from '../services/complianceReportService';
import { authMiddleware } from '../middleware/auth';

const intelligentSecurity = new Hono<{ Bindings: Env }>();

// 应用认证中间件
intelligentSecurity.use('*', authMiddleware);

// 管理员权限检查中间件
const adminOnly = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return c.json({
      success: false,
      error: 'Forbidden',
      message: '仅管理员可以访问此功能'
    }, 403);
  }
  
  await next();
};

intelligentSecurity.use('*', adminOnly);

/**
 * 获取智能安全统计数据
 */
intelligentSecurity.get('/stats', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    
    // 异常检测统计
    const anomalyStats = await db.queryFirst(`
      SELECT 
        COUNT(*) as totalAnomalies,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as highSeverityAnomalies
      FROM anomaly_detections 
      WHERE created_at > datetime('now', '-30 days')
    `);

    // 威胁情报统计
    const threatStats = await db.queryFirst(`
      SELECT COUNT(*) as activeThreatIndicators
      FROM threat_intelligence 
      WHERE is_active = 1
    `);

    // 设备指纹统计
    const fingerprintStats = await db.queryFirst(`
      SELECT COUNT(*) as suspiciousFingerprints
      FROM advanced_device_fingerprints 
      WHERE is_suspicious = 1
    `);

    // 自动响应统计
    const responseStats = await db.queryFirst(`
      SELECT 
        COUNT(*) as automatedResponses,
        AVG(successful_actions * 1.0 / total_actions) as responseSuccessRate
      FROM automated_responses 
      WHERE created_at > datetime('now', '-30 days')
    `);

    const stats = {
      totalAnomalies: anomalyStats?.totalAnomalies || 0,
      highSeverityAnomalies: anomalyStats?.highSeverityAnomalies || 0,
      activeThreatIndicators: threatStats?.activeThreatIndicators || 0,
      suspiciousFingerprints: fingerprintStats?.suspiciousFingerprints || 0,
      automatedResponses: responseStats?.automatedResponses || 0,
      responseSuccessRate: Math.round((responseStats?.responseSuccessRate || 0) * 100),
      mlModelAccuracy: 92, // 模拟数据
      threatIntelligenceCoverage: 85 // 模拟数据
    };

    return c.json({
      success: true,
      data: stats,
      message: '获取智能安全统计成功'
    });

  } catch (error: any) {
    console.error('Get intelligent security stats error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取统计数据失败'
    }, 500);
  }
});

/**
 * 获取异常检测记录
 */
intelligentSecurity.get('/anomalies', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const severity = c.req.query('severity');
    
    const db = createDatabaseService(c.env as Env);
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (severity) {
      whereClause += ' AND severity = ?';
      params.push(severity);
    }
    
    const anomalies = await db.queryAll(`
      SELECT 
        id, user_uuid as userUuid, anomaly_type as anomalyType,
        anomaly_score as anomalyScore, confidence_level as confidenceLevel,
        severity, status, detected_features as detectedFeatures,
        ip_address as ipAddress, created_at as createdAt
      FROM anomaly_detections 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // 解析JSON字段
    const formattedAnomalies = anomalies.map(anomaly => ({
      ...anomaly,
      detectedFeatures: JSON.parse(anomaly.detectedFeatures || '{}'),
      description: this.generateAnomalyDescription(anomaly)
    }));

    return c.json({
      success: true,
      data: formattedAnomalies,
      message: '获取异常检测记录成功'
    });

  } catch (error: any) {
    console.error('Get anomalies error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取异常检测记录失败'
    }, 500);
  }
});

/**
 * 获取威胁情报数据
 */
intelligentSecurity.get('/threats', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const threatType = c.req.query('threatType');
    
    const db = createDatabaseService(c.env as Env);
    
    let whereClause = 'is_active = 1';
    const params: any[] = [];
    
    if (threatType) {
      whereClause += ' AND threat_type = ?';
      params.push(threatType);
    }
    
    const threats = await db.queryAll(`
      SELECT 
        id, indicator_value as indicatorValue, indicator_type as indicatorType,
        threat_type as threatType, threat_level as threatLevel,
        confidence_score as confidenceScore, source_name as sourceName,
        description, last_seen as lastSeen
      FROM threat_intelligence 
      WHERE ${whereClause}
      ORDER BY confidence_score DESC, last_seen DESC 
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return c.json({
      success: true,
      data: threats,
      message: '获取威胁情报数据成功'
    });

  } catch (error: any) {
    console.error('Get threats error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取威胁情报数据失败'
    }, 500);
  }
});

/**
 * 获取设备指纹数据
 */
intelligentSecurity.get('/fingerprints', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const db = createDatabaseService(c.env as Env);
    
    const fingerprints = await db.queryAll(`
      SELECT 
        id, user_uuid as userUuid, basic_fingerprint as basicFingerprint,
        risk_score as riskScore, is_suspicious as isSuspicious,
        anomaly_flags as anomalyFlags, last_seen as lastSeen
      FROM advanced_device_fingerprints 
      ORDER BY risk_score DESC, last_seen DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // 解析JSON字段
    const formattedFingerprints = fingerprints.map(fp => ({
      ...fp,
      anomalyFlags: JSON.parse(fp.anomalyFlags || '[]')
    }));

    return c.json({
      success: true,
      data: formattedFingerprints,
      message: '获取设备指纹数据成功'
    });

  } catch (error: any) {
    console.error('Get fingerprints error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取设备指纹数据失败'
    }, 500);
  }
});

/**
 * 获取自动响应记录
 */
intelligentSecurity.get('/responses', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const db = createDatabaseService(c.env as Env);
    
    const responses = await db.queryAll(`
      SELECT 
        id, event_id as eventId, rule_id as ruleId,
        total_actions as totalActions, successful_actions as successfulActions,
        failed_actions as failedActions, execution_time as executionTime,
        escalated, manual_review_required as manualReviewRequired,
        created_at as createdAt
      FROM automated_responses 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return c.json({
      success: true,
      data: responses,
      message: '获取自动响应记录成功'
    });

  } catch (error: any) {
    console.error('Get responses error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取自动响应记录失败'
    }, 500);
  }
});

/**
 * 执行威胁检查
 */
intelligentSecurity.post('/check-threat', async (c) => {
  try {
    const body = await c.req.json();
    const { indicator, type } = body;

    if (!indicator || !type) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const threatService = new ThreatIntelligenceService(db);
    
    let result;
    switch (type) {
      case 'ip':
        result = await threatService.checkIPThreat(indicator);
        break;
      case 'domain':
        result = await threatService.checkDomainThreat(indicator);
        break;
      default:
        return c.json({
          success: false,
          error: 'Invalid Request',
          message: '不支持的指标类型'
        }, 400);
    }

    return c.json({
      success: true,
      data: result,
      message: '威胁检查完成'
    });

  } catch (error: any) {
    console.error('Check threat error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '威胁检查失败'
    }, 500);
  }
});

/**
 * 分析设备指纹
 */
intelligentSecurity.post('/analyze-fingerprint', async (c) => {
  try {
    const body = await c.req.json();
    const { userUuid, sessionId, fingerprintData } = body;

    if (!userUuid || !sessionId || !fingerprintData) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const fingerprintService = new AdvancedFingerprintService(db);
    
    const result = await fingerprintService.analyzeFingerprint(
      userUuid,
      sessionId,
      fingerprintData
    );

    return c.json({
      success: true,
      data: result,
      message: '设备指纹分析完成'
    });

  } catch (error: any) {
    console.error('Analyze fingerprint error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '设备指纹分析失败'
    }, 500);
  }
});

/**
 * 生成合规报告
 */
intelligentSecurity.post('/generate-compliance-report', async (c) => {
  try {
    const body = await c.req.json();
    const { reportType, startDate, endDate } = body;
    const user = c.get('user');

    if (!reportType || !startDate || !endDate) {
      return c.json({
        success: false,
        error: 'Invalid Request',
        message: '缺少必要参数'
      }, 400);
    }

    const db = createDatabaseService(c.env as Env);
    const complianceService = new ComplianceReportService(db);
    
    let reportId;
    switch (reportType) {
      case 'security_audit':
        reportId = await complianceService.generateSecurityAuditReport(
          startDate, endDate, user.id
        );
        break;
      case 'access_review':
        reportId = await complianceService.generateAccessReviewReport(
          startDate, endDate, user.id
        );
        break;
      case 'incident_summary':
        reportId = await complianceService.generateIncidentSummaryReport(
          startDate, endDate, user.id
        );
        break;
      default:
        return c.json({
          success: false,
          error: 'Invalid Request',
          message: '不支持的报告类型'
        }, 400);
    }

    return c.json({
      success: true,
      data: { reportId },
      message: '合规报告生成成功'
    });

  } catch (error: any) {
    console.error('Generate compliance report error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '合规报告生成失败'
    }, 500);
  }
});

/**
 * 更新威胁情报
 */
intelligentSecurity.post('/update-threat-intelligence', async (c) => {
  try {
    const db = createDatabaseService(c.env as Env);
    const threatService = new ThreatIntelligenceService(db);
    
    // 异步更新威胁情报
    threatService.updateThreatIntelligence().catch(error => {
      console.error('Background threat intelligence update error:', error);
    });

    return c.json({
      success: true,
      message: '威胁情报更新已启动'
    });

  } catch (error: any) {
    console.error('Update threat intelligence error:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '威胁情报更新失败'
    }, 500);
  }
});

/**
 * 辅助函数
 */
function generateAnomalyDescription(anomaly: any): string {
  const typeDescriptions: Record<string, string> = {
    'unusual_login_time': '在非常规时间登录',
    'unusual_location': '从异常位置登录',
    'unusual_device': '使用异常设备登录',
    'velocity_anomaly': '检测到不可能的旅行速度',
    'suspicious_behavior': '检测到可疑行为模式'
  };
  
  return typeDescriptions[anomaly.anomalyType] || '检测到异常行为';
}

export { intelligentSecurity };

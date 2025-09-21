#!/usr/bin/env node

/**
 * 问题跟踪与告警系统
 * 建立问题发现、记录、跟踪和解决的完整流程
 */

const fs = require('fs');
const path = require('path');

// 问题跟踪配置
const TRACKER_CONFIG = {
  issuesFile: 'issues-tracker.json',
  alertsFile: 'alerts-history.json',
  reportsDir: 'reports',
  maxIssueHistory: 1000,
  alertLevels: {
    LOW: { emoji: '🟡', priority: 1 },
    MEDIUM: { emoji: '🟠', priority: 2 },
    HIGH: { emoji: '🔴', priority: 3 },
    CRITICAL: { emoji: '🚨', priority: 4 }
  }
};

// 问题状态
const ISSUE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// 问题类型
const ISSUE_TYPES = {
  DATA_SYNC: 'data_sync',
  CACHE_FAILURE: 'cache_failure',
  API_ERROR: 'api_error',
  PERFORMANCE: 'performance',
  DATA_QUALITY: 'data_quality',
  SYSTEM_ERROR: 'system_error'
};

/**
 * 问题跟踪器类
 */
class IssueTracker {
  constructor() {
    this.issues = this.loadIssues();
    this.alerts = this.loadAlerts();
    this.ensureReportsDir();
  }

  /**
   * 确保报告目录存在
   */
  ensureReportsDir() {
    if (!fs.existsSync(TRACKER_CONFIG.reportsDir)) {
      fs.mkdirSync(TRACKER_CONFIG.reportsDir, { recursive: true });
    }
  }

  /**
   * 加载问题记录
   */
  loadIssues() {
    try {
      if (fs.existsSync(TRACKER_CONFIG.issuesFile)) {
        const data = fs.readFileSync(TRACKER_CONFIG.issuesFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载问题记录失败:', error.message);
    }
    return [];
  }

  /**
   * 加载告警历史
   */
  loadAlerts() {
    try {
      if (fs.existsSync(TRACKER_CONFIG.alertsFile)) {
        const data = fs.readFileSync(TRACKER_CONFIG.alertsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载告警历史失败:', error.message);
    }
    return [];
  }

  /**
   * 保存问题记录
   */
  saveIssues() {
    try {
      fs.writeFileSync(TRACKER_CONFIG.issuesFile, JSON.stringify(this.issues, null, 2));
    } catch (error) {
      console.error('保存问题记录失败:', error.message);
    }
  }

  /**
   * 保存告警历史
   */
  saveAlerts() {
    try {
      // 保持最近的告警记录
      if (this.alerts.length > TRACKER_CONFIG.maxIssueHistory) {
        this.alerts = this.alerts.slice(-TRACKER_CONFIG.maxIssueHistory);
      }
      fs.writeFileSync(TRACKER_CONFIG.alertsFile, JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      console.error('保存告警历史失败:', error.message);
    }
  }

  /**
   * 创建新问题
   */
  createIssue(title, description, type, severity = 'MEDIUM', metadata = {}) {
    const issue = {
      id: `issue-${Date.now()}`,
      title,
      description,
      type,
      severity,
      status: ISSUE_STATUS.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      metadata,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          action: 'created',
          description: '问题已创建',
          user: 'system'
        }
      ]
    };

    this.issues.push(issue);
    this.saveIssues();

    const levelInfo = TRACKER_CONFIG.alertLevels[severity];
    console.log(`${levelInfo.emoji} [问题跟踪] 新问题创建: ${title}`);
    console.log(`   类型: ${type}, 严重程度: ${severity}`);
    console.log(`   描述: ${description}`);

    return issue;
  }

  /**
   * 更新问题状态
   */
  updateIssueStatus(issueId, newStatus, comment = '') {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) {
      console.error(`问题不存在: ${issueId}`);
      return null;
    }

    const oldStatus = issue.status;
    issue.status = newStatus;
    issue.updatedAt = new Date().toISOString();

    if (newStatus === ISSUE_STATUS.RESOLVED) {
      issue.resolvedAt = new Date().toISOString();
    }

    issue.timeline.push({
      timestamp: new Date().toISOString(),
      action: 'status_changed',
      description: `状态从 ${oldStatus} 变更为 ${newStatus}${comment ? ': ' + comment : ''}`,
      user: 'system'
    });

    this.saveIssues();

    console.log(`✅ [问题跟踪] 问题状态更新: ${issue.title}`);
    console.log(`   ${oldStatus} → ${newStatus}`);

    return issue;
  }

  /**
   * 添加问题评论
   */
  addIssueComment(issueId, comment, user = 'system') {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) {
      console.error(`问题不存在: ${issueId}`);
      return null;
    }

    issue.timeline.push({
      timestamp: new Date().toISOString(),
      action: 'comment',
      description: comment,
      user
    });

    issue.updatedAt = new Date().toISOString();
    this.saveIssues();

    console.log(`💬 [问题跟踪] 添加评论: ${issue.title}`);
    console.log(`   评论: ${comment}`);

    return issue;
  }

  /**
   * 记录告警
   */
  recordAlert(type, message, severity, data = null) {
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      severity,
      data,
      acknowledged: false
    };

    this.alerts.push(alert);
    this.saveAlerts();

    const levelInfo = TRACKER_CONFIG.alertLevels[severity];
    console.log(`${levelInfo.emoji} [告警系统] ${message}`);

    // 高严重程度的告警自动创建问题
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      this.createIssue(
        `告警: ${message}`,
        `系统告警触发，需要立即处理`,
        ISSUE_TYPES.SYSTEM_ERROR,
        severity,
        { alertId: alert.id, alertData: data }
      );
    }

    return alert;
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveAlerts();
      console.log(`✅ [告警系统] 告警已确认: ${alert.message}`);
    }
  }

  /**
   * 获取活跃问题
   */
  getActiveIssues() {
    return this.issues.filter(issue => 
      issue.status === ISSUE_STATUS.OPEN || issue.status === ISSUE_STATUS.IN_PROGRESS
    );
  }

  /**
   * 获取未确认告警
   */
  getUnacknowledgedAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * 生成问题报告
   */
  generateIssueReport() {
    const now = new Date();
    const reportDate = now.toISOString().split('T')[0];
    
    const report = {
      generatedAt: now.toISOString(),
      summary: {
        totalIssues: this.issues.length,
        openIssues: this.issues.filter(i => i.status === ISSUE_STATUS.OPEN).length,
        inProgressIssues: this.issues.filter(i => i.status === ISSUE_STATUS.IN_PROGRESS).length,
        resolvedIssues: this.issues.filter(i => i.status === ISSUE_STATUS.RESOLVED).length,
        closedIssues: this.issues.filter(i => i.status === ISSUE_STATUS.CLOSED).length,
        totalAlerts: this.alerts.length,
        unacknowledgedAlerts: this.getUnacknowledgedAlerts().length
      },
      issuesByType: {},
      issuesBySeverity: {},
      recentIssues: this.issues.slice(-10),
      recentAlerts: this.alerts.slice(-20)
    };

    // 按类型统计
    Object.values(ISSUE_TYPES).forEach(type => {
      report.issuesByType[type] = this.issues.filter(i => i.type === type).length;
    });

    // 按严重程度统计
    Object.keys(TRACKER_CONFIG.alertLevels).forEach(severity => {
      report.issuesBySeverity[severity] = this.issues.filter(i => i.severity === severity).length;
    });

    // 保存报告
    const reportFile = path.join(TRACKER_CONFIG.reportsDir, `issue-report-${reportDate}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📊 [问题跟踪] 问题报告已生成: ${reportFile}`);
    return report;
  }

  /**
   * 显示问题概览
   */
  showOverview() {
    const activeIssues = this.getActiveIssues();
    const unacknowledgedAlerts = this.getUnacknowledgedAlerts();

    console.log('\n📋 问题跟踪概览');
    console.log('=' * 50);
    
    console.log(`📊 问题统计:`);
    console.log(`  总问题数: ${this.issues.length}`);
    console.log(`  活跃问题: ${activeIssues.length}`);
    console.log(`  未确认告警: ${unacknowledgedAlerts.length}`);

    if (activeIssues.length > 0) {
      console.log(`\n🔥 活跃问题:`);
      activeIssues.slice(0, 5).forEach(issue => {
        const levelInfo = TRACKER_CONFIG.alertLevels[issue.severity];
        console.log(`  ${levelInfo.emoji} ${issue.title} (${issue.status})`);
        console.log(`     创建时间: ${new Date(issue.createdAt).toLocaleString()}`);
      });
    }

    if (unacknowledgedAlerts.length > 0) {
      console.log(`\n🚨 未确认告警:`);
      unacknowledgedAlerts.slice(0, 5).forEach(alert => {
        const levelInfo = TRACKER_CONFIG.alertLevels[alert.severity];
        console.log(`  ${levelInfo.emoji} ${alert.message}`);
        console.log(`     时间: ${new Date(alert.timestamp).toLocaleString()}`);
      });
    }

    console.log('\n' + '=' * 50);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'overview';

  const tracker = new IssueTracker();

  switch (command) {
    case 'overview':
      tracker.showOverview();
      break;

    case 'create':
      const title = args[1] || '新问题';
      const description = args[2] || '问题描述';
      const type = args[3] || ISSUE_TYPES.SYSTEM_ERROR;
      const severity = args[4] || 'MEDIUM';
      
      tracker.createIssue(title, description, type, severity);
      break;

    case 'update':
      const issueId = args[1];
      const newStatus = args[2];
      const comment = args[3] || '';
      
      if (!issueId || !newStatus) {
        console.error('用法: node issue-tracker.cjs update <issueId> <status> [comment]');
        process.exit(1);
      }
      
      tracker.updateIssueStatus(issueId, newStatus, comment);
      break;

    case 'alert':
      const alertType = args[1] || 'system';
      const alertMessage = args[2] || '系统告警';
      const alertSeverity = args[3] || 'MEDIUM';
      
      tracker.recordAlert(alertType, alertMessage, alertSeverity);
      break;

    case 'report':
      const report = tracker.generateIssueReport();
      console.log('\n📊 问题报告摘要:');
      console.log(JSON.stringify(report.summary, null, 2));
      break;

    case 'list':
      const activeIssues = tracker.getActiveIssues();
      console.log(`\n📋 活跃问题列表 (${activeIssues.length}个):`);
      activeIssues.forEach(issue => {
        const levelInfo = TRACKER_CONFIG.alertLevels[issue.severity];
        console.log(`\n${levelInfo.emoji} ${issue.title}`);
        console.log(`  ID: ${issue.id}`);
        console.log(`  状态: ${issue.status}`);
        console.log(`  类型: ${issue.type}`);
        console.log(`  严重程度: ${issue.severity}`);
        console.log(`  创建时间: ${new Date(issue.createdAt).toLocaleString()}`);
        console.log(`  描述: ${issue.description}`);
      });
      break;

    default:
      console.log('用法: node issue-tracker.cjs [command] [args...]');
      console.log('命令:');
      console.log('  overview              - 显示问题概览');
      console.log('  create <title> <desc> <type> <severity> - 创建新问题');
      console.log('  update <id> <status> [comment] - 更新问题状态');
      console.log('  alert <type> <message> <severity> - 记录告警');
      console.log('  report                - 生成问题报告');
      console.log('  list                  - 列出活跃问题');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('问题跟踪系统错误:', error.message);
    process.exit(1);
  });
}

module.exports = {
  IssueTracker,
  ISSUE_STATUS,
  ISSUE_TYPES,
  TRACKER_CONFIG
};

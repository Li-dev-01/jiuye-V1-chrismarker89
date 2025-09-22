#!/usr/bin/env node

/**
 * 数据同步监控系统
 * 定时5分钟检查数据同步状态，异常时记录错误日志
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

// 监控配置
const MONITOR_CONFIG = {
  checkInterval: 5 * 60 * 1000, // 5分钟
  alertThresholds: {
    dataLag: 10 * 60 * 1000, // 数据延迟超过10分钟告警
    syncFailure: 3, // 连续3次同步失败告警
    lowDataVolume: 50 // 数据量低于50条告警
  },
  logFile: 'data-sync-monitor.log',
  alertFile: 'data-sync-alerts.json'
};

// 监控状态
let monitorState = {
  isRunning: false,
  lastCheck: null,
  consecutiveFailures: 0,
  alerts: [],
  metrics: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    alertsGenerated: 0
  }
};

/**
 * 记录日志
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  // 控制台输出
  const emoji = {
    'INFO': 'ℹ️',
    'WARN': '⚠️',
    'ERROR': '❌',
    'SUCCESS': '✅'
  };
  
  console.log(`${emoji[level] || '📝'} [${timestamp}] ${message}`);
  if (data) {
    console.log('   数据:', JSON.stringify(data, null, 2));
  }
  
  // 写入日志文件
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(MONITOR_CONFIG.logFile, logLine);
  } catch (error) {
    console.error('写入日志文件失败:', error.message);
  }
}

/**
 * 生成告警
 */
function generateAlert(type, message, severity = 'MEDIUM', data = null) {
  const alert = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type,
    message,
    severity,
    data,
    resolved: false
  };
  
  monitorState.alerts.push(alert);
  monitorState.metrics.alertsGenerated++;
  
  log('WARN', `🚨 告警生成: ${message}`, { type, severity, data });
  
  // 保存告警到文件
  try {
    fs.writeFileSync(MONITOR_CONFIG.alertFile, JSON.stringify(monitorState.alerts, null, 2));
  } catch (error) {
    log('ERROR', '保存告警文件失败', { error: error.message });
  }
  
  return alert;
}

/**
 * 检查数据同步状态
 */
async function checkDataSyncStatus() {
  log('INFO', '开始检查数据同步状态');
  
  try {
    // 1. 获取统计数据
    const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
    const statsData = await statsResponse.json();
    
    if (!statsData.success) {
      throw new Error(`获取统计数据失败: ${statsData.message || statsData.error}`);
    }
    
    const statistics = statsData.data.statistics;
    const lastUpdated = statsData.data.lastUpdated;
    
    // 2. 检查数据延迟
    const dataLag = Date.now() - new Date(lastUpdated).getTime();
    log('INFO', `数据延迟: ${Math.round(dataLag / 1000 / 60)} 分钟`);
    
    if (dataLag > MONITOR_CONFIG.alertThresholds.dataLag) {
      generateAlert(
        'DATA_LAG',
        `数据延迟过大: ${Math.round(dataLag / 1000 / 60)} 分钟`,
        'HIGH',
        { dataLag, lastUpdated }
      );
    }
    
    // 3. 检查关键字段数据量
    const keyFields = ['age-range', 'gender', 'work-location-preference', 'education-level'];
    const fieldStats = {};
    
    for (const field of keyFields) {
      const fieldData = statistics[field];
      if (fieldData) {
        fieldStats[field] = fieldData.totalResponses;
        
        // 检查数据量是否过低
        if (fieldData.totalResponses < MONITOR_CONFIG.alertThresholds.lowDataVolume) {
          generateAlert(
            'LOW_DATA_VOLUME',
            `字段 ${field} 数据量过低: ${fieldData.totalResponses} 条`,
            'MEDIUM',
            { field, totalResponses: fieldData.totalResponses }
          );
        }
      } else {
        fieldStats[field] = 0;
        generateAlert(
          'MISSING_FIELD_DATA',
          `字段 ${field} 缺少统计数据`,
          'HIGH',
          { field }
        );
      }
    }
    
    // 4. 检查数据一致性
    const responseCounts = Object.values(fieldStats);
    const maxCount = Math.max(...responseCounts);
    const minCount = Math.min(...responseCounts);
    const variance = maxCount - minCount;
    
    if (variance > 50) {
      generateAlert(
        'DATA_INCONSISTENCY',
        `关键字段数据量差异过大: 最大${maxCount}, 最小${minCount}, 差异${variance}`,
        'HIGH',
        { fieldStats, variance }
      );
    }
    
    // 5. 检查缓存状态
    const cacheSource = statsData.data.dataSource;
    if (cacheSource !== 'cache') {
      generateAlert(
        'CACHE_UNAVAILABLE',
        `统计缓存不可用，使用${cacheSource}数据源`,
        'MEDIUM',
        { dataSource: cacheSource }
      );
    }
    
    // 重置连续失败计数
    monitorState.consecutiveFailures = 0;
    monitorState.metrics.successfulChecks++;
    
    log('SUCCESS', '数据同步状态检查完成', {
      fieldStats,
      dataLag: Math.round(dataLag / 1000 / 60),
      cacheSource,
      variance
    });
    
    return {
      success: true,
      fieldStats,
      dataLag,
      cacheSource,
      variance
    };
    
  } catch (error) {
    monitorState.consecutiveFailures++;
    monitorState.metrics.failedChecks++;
    
    log('ERROR', '数据同步状态检查失败', { 
      error: error.message,
      consecutiveFailures: monitorState.consecutiveFailures
    });
    
    // 连续失败告警
    if (monitorState.consecutiveFailures >= MONITOR_CONFIG.alertThresholds.syncFailure) {
      generateAlert(
        'SYNC_FAILURE',
        `连续 ${monitorState.consecutiveFailures} 次同步检查失败`,
        'CRITICAL',
        { error: error.message, consecutiveFailures: monitorState.consecutiveFailures }
      );
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 尝试修复同步问题
 */
async function attemptSyncRepair() {
  log('INFO', '尝试修复同步问题');
  
  try {
    // 1. 尝试手动触发统计缓存更新
    const refreshResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
      }
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      log('SUCCESS', '统计缓存手动刷新成功', refreshData);
      return { success: true, action: 'cache_refresh' };
    } else {
      log('WARN', '统计缓存手动刷新失败', { 
        status: refreshResponse.status, 
        statusText: refreshResponse.statusText 
      });
    }
    
    // 2. 尝试使用缓存管理接口
    const cacheRefreshResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/cache/refresh/employment-survey-2024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
      }
    });
    
    if (cacheRefreshResponse.ok) {
      const cacheRefreshData = await cacheRefreshResponse.json();
      log('SUCCESS', '缓存管理接口刷新成功', cacheRefreshData);
      return { success: true, action: 'cache_management_refresh' };
    }
    
    return { success: false, error: '所有修复尝试都失败了' };
    
  } catch (error) {
    log('ERROR', '修复同步问题失败', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * 监控主循环
 */
async function monitorLoop() {
  if (!monitorState.isRunning) {
    return;
  }
  
  monitorState.lastCheck = new Date().toISOString();
  monitorState.metrics.totalChecks++;
  
  // 执行检查
  const checkResult = await checkDataSyncStatus();
  
  // 如果检查失败且连续失败次数达到阈值，尝试修复
  if (!checkResult.success && monitorState.consecutiveFailures >= MONITOR_CONFIG.alertThresholds.syncFailure) {
    log('INFO', '达到失败阈值，尝试自动修复');
    await attemptSyncRepair();
  }
  
  // 调度下次检查
  setTimeout(monitorLoop, MONITOR_CONFIG.checkInterval);
}

/**
 * 启动监控
 */
function startMonitoring() {
  if (monitorState.isRunning) {
    log('WARN', '监控已在运行中');
    return;
  }
  
  monitorState.isRunning = true;
  log('INFO', '启动数据同步监控系统', {
    checkInterval: MONITOR_CONFIG.checkInterval / 1000 / 60,
    alertThresholds: MONITOR_CONFIG.alertThresholds
  });
  
  // 立即执行一次检查
  monitorLoop();
}

/**
 * 停止监控
 */
function stopMonitoring() {
  monitorState.isRunning = false;
  log('INFO', '停止数据同步监控系统');
}

/**
 * 获取监控状态
 */
function getMonitorStatus() {
  return {
    ...monitorState,
    config: MONITOR_CONFIG
  };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  switch (command) {
    case 'start':
      startMonitoring();
      
      // 保持进程运行
      process.on('SIGINT', () => {
        log('INFO', '收到停止信号，正在关闭监控系统');
        stopMonitoring();
        process.exit(0);
      });
      
      // 防止进程退出
      setInterval(() => {}, 1000);
      break;
      
    case 'check':
      // 单次检查
      const result = await checkDataSyncStatus();
      console.log('\n检查结果:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
      
    case 'status':
      // 显示状态
      console.log(JSON.stringify(getMonitorStatus(), null, 2));
      break;
      
    case 'repair':
      // 尝试修复
      const repairResult = await attemptSyncRepair();
      console.log('\n修复结果:', JSON.stringify(repairResult, null, 2));
      process.exit(repairResult.success ? 0 : 1);
      break;
      
    default:
      console.log('用法: node data-sync-monitor.cjs [start|check|status|repair]');
      console.log('  start  - 启动持续监控');
      console.log('  check  - 执行单次检查');
      console.log('  status - 显示监控状态');
      console.log('  repair - 尝试修复同步问题');
      process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    log('ERROR', '监控系统启动失败', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  checkDataSyncStatus,
  attemptSyncRepair,
  getMonitorStatus,
  generateAlert,
  MONITOR_CONFIG,
  monitorState
};

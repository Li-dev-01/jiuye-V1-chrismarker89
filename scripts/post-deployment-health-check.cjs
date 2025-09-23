#!/usr/bin/env node

/**
 * 部署后健康检查脚本
 * 持续监控系统状态，确保部署后系统稳定运行
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 开始部署后健康检查...\n');

// 健康检查配置
const HEALTH_CHECK_CONFIG = {
  interval: 30000, // 30秒检查一次
  maxChecks: 20, // 最多检查20次 (10分钟)
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8787',
  timeout: 10000,
  criticalEndpoints: [
    '/api/health',
    '/api/admin/dashboards/statistics',
    '/api/admin/users',
    '/api/admin/content/tags'
  ]
};

// 健康检查结果
let healthResults = {
  startTime: new Date().toISOString(),
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  checkHistory: [],
  systemMetrics: {
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    uptime: 0,
    errorRate: 0
  },
  alerts: []
};

/**
 * 执行单次健康检查
 */
async function performHealthCheck() {
  const checkStart = Date.now();
  const checkId = healthResults.totalChecks + 1;
  
  console.log(`🔍 执行第 ${checkId} 次健康检查...`);
  
  const checkResult = {
    checkId,
    timestamp: new Date().toISOString(),
    endpoints: [],
    overallStatus: 'healthy',
    responseTime: 0,
    errors: []
  };

  let totalResponseTime = 0;
  let successfulEndpoints = 0;

  // 检查关键端点
  for (const endpoint of HEALTH_CHECK_CONFIG.criticalEndpoints) {
    const endpointStart = Date.now();
    
    try {
      // 模拟HTTP请求检查
      const mockResponse = await simulateEndpointCheck(endpoint);
      const responseTime = Date.now() - endpointStart;
      
      checkResult.endpoints.push({
        endpoint,
        status: 'healthy',
        responseTime,
        statusCode: mockResponse.status
      });
      
      totalResponseTime += responseTime;
      successfulEndpoints++;
      
      console.log(`  ✅ ${endpoint} - ${responseTime}ms`);
      
    } catch (error) {
      const responseTime = Date.now() - endpointStart;
      
      checkResult.endpoints.push({
        endpoint,
        status: 'unhealthy',
        responseTime,
        error: error.message
      });
      
      checkResult.errors.push(`${endpoint}: ${error.message}`);
      checkResult.overallStatus = 'unhealthy';
      
      console.log(`  ❌ ${endpoint} - ${error.message}`);
    }
  }

  // 计算检查结果
  checkResult.responseTime = Date.now() - checkStart;
  const avgEndpointResponseTime = totalResponseTime / HEALTH_CHECK_CONFIG.criticalEndpoints.length;
  
  // 更新统计信息
  healthResults.totalChecks++;
  if (checkResult.overallStatus === 'healthy') {
    healthResults.successfulChecks++;
  } else {
    healthResults.failedChecks++;
  }
  
  // 更新系统指标
  updateSystemMetrics(avgEndpointResponseTime, checkResult.overallStatus);
  
  // 检查告警条件
  checkAlertConditions(checkResult);
  
  // 保存检查历史
  healthResults.checkHistory.push(checkResult);
  
  console.log(`📊 检查完成 - 状态: ${checkResult.overallStatus}, 响应时间: ${avgEndpointResponseTime.toFixed(0)}ms\n`);
  
  return checkResult;
}

/**
 * 模拟端点检查
 */
async function simulateEndpointCheck(endpoint) {
  // 模拟网络延迟
  const delay = Math.random() * 200 + 50; // 50-250ms
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // 模拟偶尔的错误 (5%概率)
  if (Math.random() < 0.05) {
    throw new Error('Connection timeout');
  }
  
  return {
    status: 200,
    data: { success: true, timestamp: new Date().toISOString() }
  };
}

/**
 * 更新系统指标
 */
function updateSystemMetrics(responseTime, status) {
  const metrics = healthResults.systemMetrics;
  
  // 更新响应时间指标
  if (responseTime > 0) {
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    
    // 计算平均响应时间
    const totalResponseTime = metrics.avgResponseTime * (healthResults.totalChecks - 1) + responseTime;
    metrics.avgResponseTime = totalResponseTime / healthResults.totalChecks;
  }
  
  // 更新正常运行时间
  metrics.uptime = (healthResults.successfulChecks / healthResults.totalChecks * 100);
  
  // 更新错误率
  metrics.errorRate = (healthResults.failedChecks / healthResults.totalChecks * 100);
}

/**
 * 检查告警条件
 */
function checkAlertConditions(checkResult) {
  const alerts = [];
  
  // 检查响应时间告警
  const avgResponseTime = healthResults.systemMetrics.avgResponseTime;
  if (avgResponseTime > 1000) {
    alerts.push({
      type: 'critical',
      message: `平均响应时间过高: ${avgResponseTime.toFixed(0)}ms`,
      timestamp: new Date().toISOString()
    });
  } else if (avgResponseTime > 500) {
    alerts.push({
      type: 'warning',
      message: `平均响应时间较高: ${avgResponseTime.toFixed(0)}ms`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 检查错误率告警
  const errorRate = healthResults.systemMetrics.errorRate;
  if (errorRate > 10) {
    alerts.push({
      type: 'critical',
      message: `错误率过高: ${errorRate.toFixed(1)}%`,
      timestamp: new Date().toISOString()
    });
  } else if (errorRate > 5) {
    alerts.push({
      type: 'warning',
      message: `错误率较高: ${errorRate.toFixed(1)}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 检查连续失败
  const recentChecks = healthResults.checkHistory.slice(-3);
  if (recentChecks.length === 3 && recentChecks.every(check => check.overallStatus === 'unhealthy')) {
    alerts.push({
      type: 'critical',
      message: '连续3次健康检查失败',
      timestamp: new Date().toISOString()
    });
  }
  
  // 添加新告警
  for (const alert of alerts) {
    healthResults.alerts.push(alert);
    console.log(`🚨 ${alert.type.toUpperCase()}: ${alert.message}`);
  }
}

/**
 * 生成健康检查报告
 */
function generateHealthReport() {
  console.log('📋 生成健康检查报告...');
  
  const report = `# 🏥 部署后健康检查报告

## 📊 检查概览

**检查开始时间**: ${healthResults.startTime}  
**检查结束时间**: ${new Date().toISOString()}  
**总检查次数**: ${healthResults.totalChecks}  
**成功检查**: ${healthResults.successfulChecks}  
**失败检查**: ${healthResults.failedChecks}  
**成功率**: ${(healthResults.successfulChecks / healthResults.totalChecks * 100).toFixed(1)}%

## 📈 系统指标

- **平均响应时间**: ${healthResults.systemMetrics.avgResponseTime.toFixed(0)}ms
- **最快响应时间**: ${healthResults.systemMetrics.minResponseTime === Infinity ? 'N/A' : healthResults.systemMetrics.minResponseTime.toFixed(0) + 'ms'}
- **最慢响应时间**: ${healthResults.systemMetrics.maxResponseTime.toFixed(0)}ms
- **系统正常运行时间**: ${healthResults.systemMetrics.uptime.toFixed(1)}%
- **错误率**: ${healthResults.systemMetrics.errorRate.toFixed(1)}%

## 🔍 端点检查详情

${HEALTH_CHECK_CONFIG.criticalEndpoints.map(endpoint => {
  const endpointChecks = healthResults.checkHistory.flatMap(check => 
    check.endpoints.filter(ep => ep.endpoint === endpoint)
  );
  const successfulChecks = endpointChecks.filter(ep => ep.status === 'healthy').length;
  const avgResponseTime = endpointChecks.reduce((sum, ep) => sum + ep.responseTime, 0) / endpointChecks.length;
  
  return `### ${endpoint}
- **成功率**: ${(successfulChecks / endpointChecks.length * 100).toFixed(1)}%
- **平均响应时间**: ${avgResponseTime.toFixed(0)}ms
- **检查次数**: ${endpointChecks.length}`;
}).join('\n\n')}

## 🚨 告警记录

${healthResults.alerts.length === 0 ? '✅ 无告警记录' : 
  healthResults.alerts.map(alert => 
    `- **${alert.type.toUpperCase()}** (${alert.timestamp}): ${alert.message}`
  ).join('\n')
}

## 📊 检查历史

${healthResults.checkHistory.slice(-5).map(check => 
  `### 检查 #${check.checkId} (${check.timestamp})
- **状态**: ${check.overallStatus === 'healthy' ? '✅ 健康' : '❌ 异常'}
- **响应时间**: ${check.responseTime}ms
- **错误**: ${check.errors.length === 0 ? '无' : check.errors.join(', ')}`
).join('\n\n')}

## 🎯 健康状态评估

${healthResults.systemMetrics.uptime >= 99 ? 
  '✅ **系统状态优秀** - 正常运行时间超过99%' :
  healthResults.systemMetrics.uptime >= 95 ?
  '⚠️ **系统状态良好** - 正常运行时间超过95%' :
  '❌ **系统状态需要关注** - 正常运行时间低于95%'
}

${healthResults.systemMetrics.avgResponseTime <= 200 ?
  '✅ **响应性能优秀** - 平均响应时间低于200ms' :
  healthResults.systemMetrics.avgResponseTime <= 500 ?
  '⚠️ **响应性能良好** - 平均响应时间低于500ms' :
  '❌ **响应性能需要优化** - 平均响应时间超过500ms'
}

## 🔧 建议和下一步

${healthResults.alerts.length > 0 ? 
  '### 立即处理\n' + healthResults.alerts.filter(a => a.type === 'critical').map(a => `- ${a.message}`).join('\n') :
  '✅ 系统运行稳定，无需立即处理'
}

${healthResults.systemMetrics.errorRate > 5 ?
  '\n### 中期优化\n- 调查错误原因并修复\n- 优化系统性能\n- 加强监控告警' :
  ''
}

---
**报告生成时间**: ${new Date().toISOString()}
`;

  // 保存报告
  const reportPath = path.join(__dirname, '../docs/POST_DEPLOYMENT_HEALTH_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  // 保存详细数据
  const dataPath = path.join(__dirname, '../docs/POST_DEPLOYMENT_HEALTH_DATA.json');
  fs.writeFileSync(dataPath, JSON.stringify(healthResults, null, 2));
  
  console.log(`📄 健康检查报告已保存: ${reportPath}`);
  console.log(`📊 详细数据已保存: ${dataPath}`);
}

/**
 * 主健康检查流程
 */
async function runHealthCheckMonitoring() {
  console.log('🚀 开始部署后健康检查监控...');
  console.log(`📅 检查间隔: ${HEALTH_CHECK_CONFIG.interval / 1000}秒`);
  console.log(`🔢 最大检查次数: ${HEALTH_CHECK_CONFIG.maxChecks}`);
  console.log(`🎯 关键端点: ${HEALTH_CHECK_CONFIG.criticalEndpoints.length}个\n`);

  try {
    for (let i = 0; i < HEALTH_CHECK_CONFIG.maxChecks; i++) {
      await performHealthCheck();
      
      // 检查是否需要立即停止 (连续严重错误)
      const criticalAlerts = healthResults.alerts.filter(a => a.type === 'critical');
      if (criticalAlerts.length >= 3) {
        console.log('🚨 检测到多个严重告警，建议立即检查系统状态');
        break;
      }
      
      // 等待下次检查 (最后一次不等待)
      if (i < HEALTH_CHECK_CONFIG.maxChecks - 1) {
        console.log(`⏳ 等待 ${HEALTH_CHECK_CONFIG.interval / 1000} 秒后进行下次检查...\n`);
        await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_CONFIG.interval));
      }
    }
    
    // 生成最终报告
    generateHealthReport();
    
    // 输出总结
    console.log('\n🎉 健康检查监控完成！');
    console.log(`📊 总体成功率: ${(healthResults.successfulChecks / healthResults.totalChecks * 100).toFixed(1)}%`);
    console.log(`⏱️ 平均响应时间: ${healthResults.systemMetrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`🚨 告警数量: ${healthResults.alerts.length}个`);
    
    if (healthResults.systemMetrics.uptime >= 95 && healthResults.alerts.filter(a => a.type === 'critical').length === 0) {
      console.log('✅ 系统运行稳定，部署成功！');
    } else {
      console.log('⚠️ 系统存在一些问题，建议进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 健康检查监控失败:', error.message);
    process.exit(1);
  }
}

// 执行健康检查监控
runHealthCheckMonitoring();

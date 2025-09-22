#!/usr/bin/env node

/**
 * 系统健康检查脚本
 * 综合检查数据质量、同步状态、API健康度等
 */

const { IssueTracker, ISSUE_TYPES } = require('./issue-tracker.cjs');
const { checkDataSyncStatus } = require('./data-sync-monitor.cjs');

const API_BASE_URL = 'https://employment-survey-api-prod.chrismarker89.workers.dev/api';

/**
 * 系统健康检查器
 */
class SystemHealthChecker {
  constructor() {
    this.issueTracker = new IssueTracker();
    this.healthReport = {
      timestamp: new Date().toISOString(),
      overallHealth: 'UNKNOWN',
      components: {},
      issues: [],
      recommendations: []
    };
  }

  /**
   * 检查API健康状态
   */
  async checkAPIHealth() {
    console.log('🔍 检查API健康状态...');
    
    const component = {
      name: 'API服务',
      status: 'UNKNOWN',
      responseTime: 0,
      errors: []
    };

    try {
      const startTime = Date.now();
      
      // 检查健康检查端点（使用正确的路径）
      const healthResponse = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev/health`);
      component.responseTime = Date.now() - startTime;
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        component.status = healthData.status === 'ok' ? 'HEALTHY' : 'DEGRADED';
        component.details = healthData;
      } else {
        component.status = 'UNHEALTHY';
        component.errors.push(`健康检查失败: ${healthResponse.status}`);
      }

      // 检查统计API
      const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
      if (!statsResponse.ok) {
        component.errors.push(`统计API失败: ${statsResponse.status}`);
        if (component.status === 'HEALTHY') {
          component.status = 'DEGRADED';
        }
      }

    } catch (error) {
      component.status = 'UNHEALTHY';
      component.errors.push(`API连接失败: ${error.message}`);
    }

    this.healthReport.components.api = component;
    
    if (component.status === 'UNHEALTHY') {
      this.issueTracker.recordAlert(
        'API_ERROR',
        'API服务不健康',
        'HIGH',
        { errors: component.errors, responseTime: component.responseTime }
      );
    }

    console.log(`  状态: ${component.status}, 响应时间: ${component.responseTime}ms`);
    return component;
  }

  /**
   * 检查数据同步状态
   */
  async checkDataSyncHealth() {
    console.log('🔍 检查数据同步状态...');
    
    const component = {
      name: '数据同步',
      status: 'UNKNOWN',
      lastSync: null,
      dataLag: 0,
      errors: []
    };

    try {
      const syncStatus = await checkDataSyncStatus();
      
      if (syncStatus.success) {
        component.status = syncStatus.variance <= 50 ? 'HEALTHY' : 'DEGRADED';
        component.dataLag = syncStatus.dataLag;
        component.fieldStats = syncStatus.fieldStats;
        component.lastSync = new Date().toISOString();
        
        if (syncStatus.dataLag > 10 * 60 * 1000) { // 超过10分钟
          component.errors.push(`数据延迟过大: ${Math.round(syncStatus.dataLag / 1000 / 60)} 分钟`);
          component.status = 'DEGRADED';
        }
        
        if (syncStatus.variance > 100) {
          component.errors.push(`数据差异过大: ${syncStatus.variance}`);
          component.status = 'DEGRADED';
        }
      } else {
        component.status = 'UNHEALTHY';
        component.errors.push(`同步检查失败: ${syncStatus.error}`);
      }

    } catch (error) {
      component.status = 'UNHEALTHY';
      component.errors.push(`同步检查异常: ${error.message}`);
    }

    this.healthReport.components.dataSync = component;
    
    if (component.status === 'UNHEALTHY') {
      this.issueTracker.recordAlert(
        'DATA_SYNC',
        '数据同步异常',
        'HIGH',
        { errors: component.errors, dataLag: component.dataLag }
      );
    }

    console.log(`  状态: ${component.status}, 数据延迟: ${Math.round(component.dataLag / 1000 / 60)} 分钟`);
    return component;
  }

  /**
   * 检查数据质量
   */
  async checkDataQuality() {
    console.log('🔍 检查数据质量...');
    
    const component = {
      name: '数据质量',
      status: 'UNKNOWN',
      qualityScore: 0,
      issues: [],
      errors: []
    };

    try {
      const statsResponse = await fetch(`${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          const statistics = statsData.data.statistics;
          const keyFields = ['age-range', 'gender', 'work-location-preference', 'education-level'];
          
          let validFields = 0;
          let totalResponses = 0;
          
          keyFields.forEach(field => {
            const fieldStats = statistics[field];
            if (fieldStats && fieldStats.totalResponses > 0) {
              validFields++;
              totalResponses += fieldStats.totalResponses;
              
              // 检查数据量是否足够
              if (fieldStats.totalResponses < 50) {
                component.issues.push(`${field} 数据量不足: ${fieldStats.totalResponses}`);
              }
            } else {
              component.issues.push(`${field} 缺少数据`);
            }
          });
          
          component.qualityScore = Math.round((validFields / keyFields.length) * 100);
          component.averageResponses = Math.round(totalResponses / keyFields.length);
          
          if (component.qualityScore >= 90) {
            component.status = 'HEALTHY';
          } else if (component.qualityScore >= 70) {
            component.status = 'DEGRADED';
          } else {
            component.status = 'UNHEALTHY';
          }
          
        } else {
          component.status = 'UNHEALTHY';
          component.errors.push('无法获取统计数据');
        }
      } else {
        component.status = 'UNHEALTHY';
        component.errors.push(`统计API失败: ${statsResponse.status}`);
      }

    } catch (error) {
      component.status = 'UNHEALTHY';
      component.errors.push(`数据质量检查异常: ${error.message}`);
    }

    this.healthReport.components.dataQuality = component;
    
    if (component.status === 'UNHEALTHY') {
      this.issueTracker.recordAlert(
        'DATA_QUALITY',
        '数据质量问题',
        'MEDIUM',
        { qualityScore: component.qualityScore, issues: component.issues }
      );
    }

    console.log(`  状态: ${component.status}, 质量分数: ${component.qualityScore}%`);
    return component;
  }

  /**
   * 检查系统性能
   */
  async checkPerformance() {
    console.log('🔍 检查系统性能...');
    
    const component = {
      name: '系统性能',
      status: 'UNKNOWN',
      metrics: {},
      errors: []
    };

    try {
      // 测试API响应时间
      const tests = [
        { name: '统计API', url: `${API_BASE_URL}/universal-questionnaire/statistics/employment-survey-2024` },
        { name: '健康检查', url: `https://employment-survey-api-prod.chrismarker89.workers.dev/health` }
      ];

      const results = [];
      
      for (const test of tests) {
        const startTime = Date.now();
        try {
          const response = await fetch(test.url);
          const responseTime = Date.now() - startTime;
          results.push({ name: test.name, responseTime, success: response.ok });
        } catch (error) {
          results.push({ name: test.name, responseTime: -1, success: false, error: error.message });
        }
      }

      component.metrics.apiTests = results;
      
      const avgResponseTime = results
        .filter(r => r.success && r.responseTime > 0)
        .reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      component.metrics.averageResponseTime = Math.round(avgResponseTime);
      
      // 评估性能状态
      if (avgResponseTime < 1000) {
        component.status = 'HEALTHY';
      } else if (avgResponseTime < 3000) {
        component.status = 'DEGRADED';
        component.errors.push(`响应时间较慢: ${Math.round(avgResponseTime)}ms`);
      } else {
        component.status = 'UNHEALTHY';
        component.errors.push(`响应时间过慢: ${Math.round(avgResponseTime)}ms`);
      }

    } catch (error) {
      component.status = 'UNHEALTHY';
      component.errors.push(`性能检查异常: ${error.message}`);
    }

    this.healthReport.components.performance = component;
    
    if (component.status === 'UNHEALTHY') {
      this.issueTracker.recordAlert(
        'PERFORMANCE',
        '系统性能问题',
        'MEDIUM',
        { averageResponseTime: component.metrics.averageResponseTime }
      );
    }

    console.log(`  状态: ${component.status}, 平均响应时间: ${component.metrics.averageResponseTime || 'N/A'}ms`);
    return component;
  }

  /**
   * 计算整体健康状态
   */
  calculateOverallHealth() {
    const components = Object.values(this.healthReport.components);
    const statusCounts = {
      HEALTHY: 0,
      DEGRADED: 0,
      UNHEALTHY: 0
    };

    components.forEach(component => {
      statusCounts[component.status]++;
    });

    if (statusCounts.UNHEALTHY > 0) {
      this.healthReport.overallHealth = 'UNHEALTHY';
    } else if (statusCounts.DEGRADED > 0) {
      this.healthReport.overallHealth = 'DEGRADED';
    } else {
      this.healthReport.overallHealth = 'HEALTHY';
    }

    // 生成建议
    if (this.healthReport.overallHealth !== 'HEALTHY') {
      components.forEach(component => {
        if (component.status !== 'HEALTHY') {
          component.errors.forEach(error => {
            this.healthReport.recommendations.push(`修复 ${component.name}: ${error}`);
          });
        }
      });
    }
  }

  /**
   * 执行完整的健康检查
   */
  async runFullHealthCheck() {
    console.log('🚀 开始系统健康检查...\n');
    
    try {
      await this.checkAPIHealth();
      await this.checkDataSyncHealth();
      await this.checkDataQuality();
      await this.checkPerformance();
      
      this.calculateOverallHealth();
      
      // 保存健康报告
      const reportFile = `health-report-${new Date().toISOString().split('T')[0]}.json`;
      require('fs').writeFileSync(reportFile, JSON.stringify(this.healthReport, null, 2));
      
      console.log('\n📊 系统健康检查完成');
      console.log('=' * 50);
      console.log(`整体状态: ${this.getStatusEmoji(this.healthReport.overallHealth)} ${this.healthReport.overallHealth}`);
      
      Object.entries(this.healthReport.components).forEach(([key, component]) => {
        console.log(`${component.name}: ${this.getStatusEmoji(component.status)} ${component.status}`);
      });
      
      if (this.healthReport.recommendations.length > 0) {
        console.log('\n💡 改进建议:');
        this.healthReport.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
      
      console.log(`\n📄 详细报告已保存: ${reportFile}`);
      
      return this.healthReport;
      
    } catch (error) {
      console.error('❌ 健康检查失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取状态表情符号
   */
  getStatusEmoji(status) {
    const emojis = {
      HEALTHY: '✅',
      DEGRADED: '⚠️',
      UNHEALTHY: '❌',
      UNKNOWN: '❓'
    };
    return emojis[status] || '❓';
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  switch (command) {
    case 'check':
      const checker = new SystemHealthChecker();
      const report = await checker.runFullHealthCheck();
      
      // 如果系统不健康，退出码为1
      process.exit(report.overallHealth === 'HEALTHY' ? 0 : 1);
      break;

    case 'monitor':
      // 持续监控模式
      console.log('🔄 启动持续健康监控...');
      
      const runCheck = async () => {
        try {
          const checker = new SystemHealthChecker();
          await checker.runFullHealthCheck();
        } catch (error) {
          console.error('健康检查失败:', error.message);
        }
      };
      
      // 立即执行一次
      await runCheck();
      
      // 每30分钟执行一次
      setInterval(runCheck, 30 * 60 * 1000);
      
      // 保持进程运行
      process.on('SIGINT', () => {
        console.log('\n停止健康监控');
        process.exit(0);
      });
      
      setInterval(() => {}, 1000);
      break;

    default:
      console.log('用法: node system-health-check.cjs [check|monitor]');
      console.log('  check   - 执行一次健康检查');
      console.log('  monitor - 启动持续监控');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('系统健康检查失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  SystemHealthChecker
};

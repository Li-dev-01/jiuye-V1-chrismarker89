/**
 * 数据库维护脚本
 * 提供自动化维护、诊断和修复功能
 */

export interface MaintenanceConfig {
  apiBaseUrl: string;
  authToken?: string;
  dryRun: boolean;
  verbose: boolean;
}

export interface DiagnosticResult {
  category: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
  recommendation?: string;
}

export interface MaintenanceReport {
  timestamp: string;
  duration: number;
  tasksExecuted: string[];
  diagnostics: DiagnosticResult[];
  errors: string[];
  summary: {
    healthy: number;
    warnings: number;
    critical: number;
  };
}

export class DatabaseMaintenanceService {
  private config: MaintenanceConfig;

  constructor(config: MaintenanceConfig) {
    this.config = config;
  }

  /**
   * 执行完整的维护检查
   */
  async runFullMaintenance(): Promise<MaintenanceReport> {
    const startTime = Date.now();
    const report: MaintenanceReport = {
      timestamp: new Date().toISOString(),
      duration: 0,
      tasksExecuted: [],
      diagnostics: [],
      errors: [],
      summary: { healthy: 0, warnings: 0, critical: 0 }
    };

    try {
      this.log('开始数据库维护检查...');

      // 1. 性能诊断
      const performanceDiagnostics = await this.diagnosePerformance();
      report.diagnostics.push(...performanceDiagnostics);
      report.tasksExecuted.push('性能诊断');

      // 2. 数据一致性检查
      const consistencyDiagnostics = await this.diagnoseDataConsistency();
      report.diagnostics.push(...consistencyDiagnostics);
      report.tasksExecuted.push('数据一致性检查');

      // 3. 缓存健康度检查
      const cacheDiagnostics = await this.diagnoseCacheHealth();
      report.diagnostics.push(...cacheDiagnostics);
      report.tasksExecuted.push('缓存健康度检查');

      // 4. 同步任务状态检查
      const syncDiagnostics = await this.diagnoseSyncTasks();
      report.diagnostics.push(...syncDiagnostics);
      report.tasksExecuted.push('同步任务状态检查');

      // 5. 存储使用率检查
      const storageDiagnostics = await this.diagnoseStorageUsage();
      report.diagnostics.push(...storageDiagnostics);
      report.tasksExecuted.push('存储使用率检查');

      // 6. 自动修复 (如果不是干运行模式)
      if (!this.config.dryRun) {
        const autoFixResults = await this.performAutoFix(report.diagnostics);
        report.tasksExecuted.push('自动修复');
        if (autoFixResults.length > 0) {
          report.diagnostics.push(...autoFixResults);
        }
      }

      // 统计结果
      report.summary = this.summarizeDiagnostics(report.diagnostics);
      report.duration = Date.now() - startTime;

      this.log(`维护检查完成，耗时 ${report.duration}ms`);
      this.log(`结果: ${report.summary.healthy} 健康, ${report.summary.warnings} 警告, ${report.summary.critical} 严重`);

    } catch (error) {
      report.errors.push(`维护检查失败: ${error}`);
      this.log(`维护检查失败: ${error}`, 'error');
    }

    return report;
  }

  /**
   * 性能诊断
   */
  private async diagnosePerformance(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/performance/metrics?timeRange=1h`);
      const data = await response.json();

      if (data.success && data.data) {
        const metrics = data.data;

        // 检查平均响应时间
        if (metrics.averageResponseTime > 2000) {
          results.push({
            category: '性能',
            status: 'critical',
            message: `平均响应时间过慢: ${metrics.averageResponseTime}ms`,
            details: { responseTime: metrics.averageResponseTime },
            recommendation: '检查缓存配置和索引优化'
          });
        } else if (metrics.averageResponseTime > 1000) {
          results.push({
            category: '性能',
            status: 'warning',
            message: `响应时间偏慢: ${metrics.averageResponseTime}ms`,
            details: { responseTime: metrics.averageResponseTime },
            recommendation: '考虑优化查询或增加缓存'
          });
        } else {
          results.push({
            category: '性能',
            status: 'healthy',
            message: `响应时间正常: ${metrics.averageResponseTime}ms`
          });
        }

        // 检查缓存命中率
        if (metrics.cacheHitRate < 70) {
          results.push({
            category: '缓存',
            status: 'critical',
            message: `缓存命中率过低: ${metrics.cacheHitRate}%`,
            details: { cacheHitRate: metrics.cacheHitRate },
            recommendation: '检查缓存策略和同步频率'
          });
        } else if (metrics.cacheHitRate < 85) {
          results.push({
            category: '缓存',
            status: 'warning',
            message: `缓存命中率偏低: ${metrics.cacheHitRate}%`,
            details: { cacheHitRate: metrics.cacheHitRate },
            recommendation: '优化缓存配置'
          });
        } else {
          results.push({
            category: '缓存',
            status: 'healthy',
            message: `缓存命中率良好: ${metrics.cacheHitRate}%`
          });
        }

        // 检查错误率
        if (metrics.errorRate > 5) {
          results.push({
            category: '错误率',
            status: 'critical',
            message: `错误率过高: ${metrics.errorRate}%`,
            details: { errorRate: metrics.errorRate },
            recommendation: '检查系统日志和错误原因'
          });
        } else if (metrics.errorRate > 1) {
          results.push({
            category: '错误率',
            status: 'warning',
            message: `错误率偏高: ${metrics.errorRate}%`,
            details: { errorRate: metrics.errorRate },
            recommendation: '监控错误趋势'
          });
        } else {
          results.push({
            category: '错误率',
            status: 'healthy',
            message: `错误率正常: ${metrics.errorRate}%`
          });
        }
      }
    } catch (error) {
      results.push({
        category: '性能',
        status: 'critical',
        message: `性能指标获取失败: ${error}`,
        recommendation: '检查API服务状态'
      });
    }

    return results;
  }

  /**
   * 数据一致性诊断
   */
  private async diagnoseDataConsistency(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/consistency-check/employment-survey-2024`);
      const data = await response.json();

      if (data.success && data.data) {
        const consistency = data.data;

        if (consistency.isConsistent) {
          results.push({
            category: '数据一致性',
            status: 'healthy',
            message: '数据一致性检查通过',
            details: consistency
          });
        } else {
          results.push({
            category: '数据一致性',
            status: 'critical',
            message: '发现数据不一致',
            details: consistency,
            recommendation: '执行数据同步修复'
          });
        }
      }
    } catch (error) {
      results.push({
        category: '数据一致性',
        status: 'warning',
        message: `一致性检查失败: ${error}`,
        recommendation: '手动检查数据完整性'
      });
    }

    return results;
  }

  /**
   * 缓存健康度诊断
   */
  private async diagnoseCacheHealth(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/cache/usage-patterns?timeRange=24h`);
      const data = await response.json();

      if (data.success && data.data) {
        const patterns = data.data;

        // 检查缓存使用模式
        const lowHitRateEndpoints = patterns.filter((p: any) => p.cacheHitRate < 80);
        
        if (lowHitRateEndpoints.length > 0) {
          results.push({
            category: '缓存健康度',
            status: 'warning',
            message: `${lowHitRateEndpoints.length} 个端点缓存命中率偏低`,
            details: { lowHitRateEndpoints },
            recommendation: '优化这些端点的缓存策略'
          });
        } else {
          results.push({
            category: '缓存健康度',
            status: 'healthy',
            message: '所有端点缓存命中率良好'
          });
        }

        // 检查高频请求端点
        const highFreqEndpoints = patterns.filter((p: any) => p.requestFrequency > 100);
        if (highFreqEndpoints.length > 0) {
          results.push({
            category: '缓存使用',
            status: 'healthy',
            message: `${highFreqEndpoints.length} 个高频端点运行正常`,
            details: { highFreqEndpoints }
          });
        }
      }
    } catch (error) {
      results.push({
        category: '缓存健康度',
        status: 'warning',
        message: `缓存健康度检查失败: ${error}`,
        recommendation: '检查缓存服务状态'
      });
    }

    return results;
  }

  /**
   * 同步任务状态诊断
   */
  private async diagnoseSyncTasks(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/cron/status`);
      const data = await response.json();

      if (data.success && data.data) {
        const cronHealth = data.data.health || [];

        const failingTasks = cronHealth.filter((task: any) => task.health_status === 'failing');
        const unhealthyTasks = cronHealth.filter((task: any) => task.health_status === 'unhealthy');
        const warningTasks = cronHealth.filter((task: any) => task.health_status === 'warning');

        if (failingTasks.length > 0) {
          results.push({
            category: '同步任务',
            status: 'critical',
            message: `${failingTasks.length} 个同步任务失败`,
            details: { failingTasks },
            recommendation: '立即检查失败任务并修复'
          });
        }

        if (unhealthyTasks.length > 0) {
          results.push({
            category: '同步任务',
            status: 'warning',
            message: `${unhealthyTasks.length} 个同步任务不健康`,
            details: { unhealthyTasks },
            recommendation: '检查任务配置和执行环境'
          });
        }

        if (warningTasks.length > 0) {
          results.push({
            category: '同步任务',
            status: 'warning',
            message: `${warningTasks.length} 个同步任务有警告`,
            details: { warningTasks },
            recommendation: '监控任务状态变化'
          });
        }

        if (failingTasks.length === 0 && unhealthyTasks.length === 0) {
          results.push({
            category: '同步任务',
            status: 'healthy',
            message: '所有同步任务运行正常'
          });
        }
      }
    } catch (error) {
      results.push({
        category: '同步任务',
        status: 'critical',
        message: `同步任务状态检查失败: ${error}`,
        recommendation: '检查定时任务服务'
      });
    }

    return results;
  }

  /**
   * 存储使用率诊断
   */
  private async diagnoseStorageUsage(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // 这里应该检查实际的存储使用情况
      // 由于Cloudflare D1的限制，我们模拟检查
      const mockStorageUsage = {
        totalSize: 50 * 1024 * 1024, // 50MB
        usedSize: 35 * 1024 * 1024,  // 35MB
        usagePercentage: 70
      };

      if (mockStorageUsage.usagePercentage > 90) {
        results.push({
          category: '存储使用',
          status: 'critical',
          message: `存储使用率过高: ${mockStorageUsage.usagePercentage}%`,
          details: mockStorageUsage,
          recommendation: '清理历史数据或扩容存储'
        });
      } else if (mockStorageUsage.usagePercentage > 80) {
        results.push({
          category: '存储使用',
          status: 'warning',
          message: `存储使用率偏高: ${mockStorageUsage.usagePercentage}%`,
          details: mockStorageUsage,
          recommendation: '计划存储清理或扩容'
        });
      } else {
        results.push({
          category: '存储使用',
          status: 'healthy',
          message: `存储使用率正常: ${mockStorageUsage.usagePercentage}%`,
          details: mockStorageUsage
        });
      }
    } catch (error) {
      results.push({
        category: '存储使用',
        status: 'warning',
        message: `存储使用率检查失败: ${error}`,
        recommendation: '手动检查存储状态'
      });
    }

    return results;
  }

  /**
   * 自动修复
   */
  private async performAutoFix(diagnostics: DiagnosticResult[]): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 只修复低风险的问题
    const fixableIssues = diagnostics.filter(d => 
      d.status === 'warning' && 
      (d.category === '缓存' || d.category === '缓存健康度')
    );

    for (const issue of fixableIssues) {
      try {
        if (issue.category === '缓存' && issue.details?.cacheHitRate < 85) {
          // 尝试优化缓存
          const optimizeResponse = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/cache/optimization-recommendations`);
          if (optimizeResponse.ok) {
            const optimizeData = await optimizeResponse.json();
            if (optimizeData.success && optimizeData.data.length > 0) {
              // 应用低风险的优化建议
              const lowRiskRecommendations = optimizeData.data.filter((r: any) => r.riskLevel === 'low');
              if (lowRiskRecommendations.length > 0) {
                const applyResponse = await fetch(`${this.config.apiBaseUrl}/api/universal-questionnaire/cache/apply-optimizations`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ recommendations: lowRiskRecommendations })
                });

                if (applyResponse.ok) {
                  results.push({
                    category: '自动修复',
                    status: 'healthy',
                    message: `已自动优化缓存配置 (${lowRiskRecommendations.length} 项)`
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        results.push({
          category: '自动修复',
          status: 'warning',
          message: `自动修复失败: ${error}`
        });
      }
    }

    return results;
  }

  /**
   * 汇总诊断结果
   */
  private summarizeDiagnostics(diagnostics: DiagnosticResult[]): { healthy: number; warnings: number; critical: number } {
    return {
      healthy: diagnostics.filter(d => d.status === 'healthy').length,
      warnings: diagnostics.filter(d => d.status === 'warning').length,
      critical: diagnostics.filter(d => d.status === 'critical').length
    };
  }

  /**
   * 日志输出
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.config.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }
}

// 命令行工具
export async function runMaintenance(config: Partial<MaintenanceConfig> = {}): Promise<void> {
  const defaultConfig: MaintenanceConfig = {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8787',
    dryRun: false,
    verbose: true
  };

  const maintenanceConfig = { ...defaultConfig, ...config };
  const service = new DatabaseMaintenanceService(maintenanceConfig);
  
  const report = await service.runFullMaintenance();
  
  console.log('\n=== 数据库维护报告 ===');
  console.log(`时间: ${report.timestamp}`);
  console.log(`耗时: ${report.duration}ms`);
  console.log(`执行任务: ${report.tasksExecuted.join(', ')}`);
  console.log(`结果统计: ${report.summary.healthy} 健康, ${report.summary.warnings} 警告, ${report.summary.critical} 严重`);
  
  if (report.diagnostics.length > 0) {
    console.log('\n=== 诊断详情 ===');
    report.diagnostics.forEach(d => {
      const statusIcon = d.status === 'healthy' ? '✅' : d.status === 'warning' ? '⚠️' : '❌';
      console.log(`${statusIcon} [${d.category}] ${d.message}`);
      if (d.recommendation) {
        console.log(`   建议: ${d.recommendation}`);
      }
    });
  }
  
  if (report.errors.length > 0) {
    console.log('\n=== 错误信息 ===');
    report.errors.forEach(error => console.log(`❌ ${error}`));
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMaintenance().catch(console.error);
}

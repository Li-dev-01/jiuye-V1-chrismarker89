#!/usr/bin/env node

/**
 * API运维监控建议工具
 * 提供API性能监控、安全策略和SLA指标建议
 */

const fs = require('fs');
const path = require('path');

class APIMonitoringAdvisor {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportPath = path.join(this.projectRoot, 'docs/API_ANALYSIS_REPORT.json');
    this.compliancePath = path.join(this.projectRoot, 'docs/API_COMPLIANCE_REPORT.json');
    
    // 监控建议配置
    this.monitoringConfig = {
      sla: {
        responseTime: {
          p95: 500, // 95%请求在500ms内响应
          p99: 1000, // 99%请求在1000ms内响应
          average: 200 // 平均响应时间200ms
        },
        availability: 99.9, // 99.9%可用性
        errorRate: 0.1 // 错误率低于0.1%
      },
      security: {
        rateLimiting: {
          anonymous: 100, // 匿名用户每小时100请求
          authenticated: 1000, // 认证用户每小时1000请求
          admin: 10000 // 管理员每小时10000请求
        },
        authentication: {
          tokenExpiry: 3600, // JWT令牌1小时过期
          refreshTokenExpiry: 604800, // 刷新令牌7天过期
          maxLoginAttempts: 5 // 最大登录尝试次数
        }
      },
      performance: {
        caching: {
          staticContent: 86400, // 静态内容缓存24小时
          apiResponse: 300, // API响应缓存5分钟
          userSession: 1800 // 用户会话缓存30分钟
        },
        database: {
          connectionPool: 20, // 数据库连接池大小
          queryTimeout: 30000, // 查询超时30秒
          slowQueryThreshold: 1000 // 慢查询阈值1秒
        }
      }
    };
  }

  /**
   * 加载分析报告
   */
  loadReports() {
    const reports = {};
    
    if (fs.existsSync(this.reportPath)) {
      reports.analysis = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
    }
    
    if (fs.existsSync(this.compliancePath)) {
      reports.compliance = JSON.parse(fs.readFileSync(this.compliancePath, 'utf8'));
    }
    
    return reports;
  }

  /**
   * 生成SLA指标建议
   */
  generateSLARecommendations(reports) {
    console.log('📊 生成SLA指标建议...');
    
    const slaRecommendations = {
      responseTime: {
        targets: this.monitoringConfig.sla.responseTime,
        monitoring: [
          {
            metric: 'http_request_duration_seconds',
            description: 'HTTP请求响应时间',
            alerting: {
              warning: 'p95 > 500ms',
              critical: 'p99 > 1000ms'
            }
          },
          {
            metric: 'http_request_duration_average',
            description: '平均响应时间',
            alerting: {
              warning: 'average > 200ms',
              critical: 'average > 500ms'
            }
          }
        ]
      },
      availability: {
        target: this.monitoringConfig.sla.availability,
        monitoring: [
          {
            metric: 'up',
            description: '服务可用性',
            alerting: {
              critical: 'availability < 99.9%'
            }
          },
          {
            metric: 'http_requests_total',
            description: 'HTTP请求总数',
            alerting: {
              warning: 'error_rate > 0.05%',
              critical: 'error_rate > 0.1%'
            }
          }
        ]
      },
      throughput: {
        monitoring: [
          {
            metric: 'http_requests_per_second',
            description: '每秒请求数',
            alerting: {
              warning: 'rps > 1000',
              critical: 'rps > 2000'
            }
          }
        ]
      }
    };

    return slaRecommendations;
  }

  /**
   * 生成安全策略建议
   */
  generateSecurityRecommendations(reports) {
    console.log('🔒 生成安全策略建议...');
    
    const securityRecommendations = {
      rateLimiting: {
        strategy: 'Token Bucket',
        implementation: {
          redis: 'Redis作为限流存储',
          algorithm: 'Sliding Window',
          rules: this.monitoringConfig.security.rateLimiting
        },
        monitoring: [
          {
            metric: 'rate_limit_exceeded_total',
            description: '限流触发次数',
            alerting: {
              warning: 'rate > 100/hour',
              critical: 'rate > 1000/hour'
            }
          }
        ]
      },
      authentication: {
        jwt: {
          algorithm: 'RS256',
          expiry: this.monitoringConfig.security.authentication.tokenExpiry,
          refreshStrategy: 'Sliding Session'
        },
        bruteForce: {
          maxAttempts: this.monitoringConfig.security.authentication.maxLoginAttempts,
          lockoutDuration: 900, // 15分钟锁定
          monitoring: [
            {
              metric: 'failed_login_attempts_total',
              description: '登录失败次数',
              alerting: {
                warning: 'attempts > 10/minute',
                critical: 'attempts > 50/minute'
              }
            }
          ]
        }
      },
      dataProtection: {
        encryption: {
          atRest: 'AES-256',
          inTransit: 'TLS 1.3',
          keys: 'AWS KMS / HashiCorp Vault'
        },
        privacy: {
          dataRetention: '2 years',
          anonymization: 'PII scrubbing',
          gdprCompliance: true
        }
      },
      apiSecurity: {
        cors: {
          allowedOrigins: ['https://college-employment-survey-frontend-l84.pages.dev'],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Authorization', 'Content-Type']
        },
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
      }
    };

    // 基于合规性报告添加特定建议
    if (reports.compliance && reports.compliance.security.violations.length > 0) {
      securityRecommendations.urgentActions = reports.compliance.security.violations.map(violation => ({
        api: violation.api,
        issue: violation.issue,
        priority: 'high',
        action: violation.suggestion
      }));
    }

    return securityRecommendations;
  }

  /**
   * 生成性能监控建议
   */
  generatePerformanceRecommendations(reports) {
    console.log('⚡ 生成性能监控建议...');
    
    const performanceRecommendations = {
      caching: {
        strategy: 'Multi-layer Caching',
        layers: {
          cdn: {
            provider: 'Cloudflare',
            ttl: this.monitoringConfig.performance.caching.staticContent,
            rules: [
              'Cache static assets for 24 hours',
              'Cache API responses for 5 minutes',
              'Bypass cache for authenticated requests'
            ]
          },
          application: {
            provider: 'Redis',
            ttl: this.monitoringConfig.performance.caching.apiResponse,
            strategies: [
              'Cache-aside for read operations',
              'Write-through for critical data',
              'Time-based invalidation'
            ]
          }
        },
        monitoring: [
          {
            metric: 'cache_hit_ratio',
            description: '缓存命中率',
            target: '> 80%',
            alerting: {
              warning: 'hit_ratio < 70%',
              critical: 'hit_ratio < 50%'
            }
          }
        ]
      },
      database: {
        optimization: {
          connectionPool: this.monitoringConfig.performance.database.connectionPool,
          queryOptimization: [
            'Add indexes for frequently queried columns',
            'Use prepared statements',
            'Implement query result caching',
            'Monitor slow queries'
          ]
        },
        monitoring: [
          {
            metric: 'database_connections_active',
            description: '活跃数据库连接数',
            alerting: {
              warning: 'connections > 15',
              critical: 'connections > 18'
            }
          },
          {
            metric: 'database_query_duration_seconds',
            description: '数据库查询时间',
            alerting: {
              warning: 'p95 > 500ms',
              critical: 'p99 > 1000ms'
            }
          }
        ]
      },
      scaling: {
        horizontal: {
          strategy: 'Auto-scaling based on metrics',
          triggers: [
            'CPU usage > 70%',
            'Memory usage > 80%',
            'Request queue length > 100'
          ]
        },
        vertical: {
          recommendations: [
            'Monitor resource utilization',
            'Scale up during peak hours',
            'Use spot instances for cost optimization'
          ]
        }
      }
    };

    return performanceRecommendations;
  }

  /**
   * 生成监控工具配置
   */
  generateMonitoringToolsConfig() {
    console.log('🛠️ 生成监控工具配置...');
    
    const toolsConfig = {
      prometheus: {
        scrapeInterval: '15s',
        evaluationInterval: '15s',
        targets: [
          'localhost:8000', // API服务器
          'localhost:8001', // Python微服务1
          'localhost:8003', // Python微服务2
          'localhost:8004'  // Python微服务3
        ],
        rules: [
          {
            name: 'api_alerts',
            rules: [
              {
                alert: 'HighResponseTime',
                expr: 'histogram_quantile(0.95, http_request_duration_seconds_bucket) > 0.5',
                for: '2m',
                labels: { severity: 'warning' },
                annotations: {
                  summary: 'High response time detected',
                  description: '95th percentile response time is above 500ms'
                }
              },
              {
                alert: 'HighErrorRate',
                expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.01',
                for: '1m',
                labels: { severity: 'critical' },
                annotations: {
                  summary: 'High error rate detected',
                  description: 'Error rate is above 1%'
                }
              }
            ]
          }
        ]
      },
      grafana: {
        dashboards: [
          {
            name: 'API Overview',
            panels: [
              'Request Rate',
              'Response Time',
              'Error Rate',
              'Active Users'
            ]
          },
          {
            name: 'System Health',
            panels: [
              'CPU Usage',
              'Memory Usage',
              'Disk I/O',
              'Network Traffic'
            ]
          },
          {
            name: 'Business Metrics',
            panels: [
              'Questionnaire Submissions',
              'Story Publications',
              'User Registrations',
              'Admin Actions'
            ]
          }
        ]
      },
      alertmanager: {
        routes: [
          {
            match: { severity: 'critical' },
            receiver: 'critical-alerts',
            group_wait: '10s',
            group_interval: '10s',
            repeat_interval: '1h'
          },
          {
            match: { severity: 'warning' },
            receiver: 'warning-alerts',
            group_wait: '30s',
            group_interval: '5m',
            repeat_interval: '12h'
          }
        ],
        receivers: [
          {
            name: 'critical-alerts',
            webhook_configs: [
              {
                url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
                channel: '#alerts-critical'
              }
            ]
          },
          {
            name: 'warning-alerts',
            email_configs: [
              {
                to: 'admin@example.com',
                subject: 'API Warning Alert'
              }
            ]
          }
        ]
      }
    };

    return toolsConfig;
  }

  /**
   * 生成部署建议
   */
  generateDeploymentRecommendations() {
    console.log('🚀 生成部署建议...');
    
    const deploymentRecommendations = {
      infrastructure: {
        cloudProvider: 'Cloudflare Workers + AWS',
        architecture: 'Serverless + Microservices',
        components: [
          {
            service: 'Frontend',
            platform: 'Cloudflare Pages',
            scaling: 'Global CDN',
            monitoring: 'Real User Monitoring'
          },
          {
            service: 'API Gateway',
            platform: 'Cloudflare Workers',
            scaling: 'Auto-scaling',
            monitoring: 'Request/Response metrics'
          },
          {
            service: 'Microservices',
            platform: 'AWS Lambda / ECS',
            scaling: 'Auto-scaling groups',
            monitoring: 'Container metrics'
          },
          {
            service: 'Database',
            platform: 'Cloudflare D1 + AWS RDS',
            scaling: 'Read replicas',
            monitoring: 'Query performance'
          }
        ]
      },
      cicd: {
        pipeline: [
          'Code commit triggers build',
          'Run automated tests',
          'Security scanning',
          'Deploy to staging',
          'Integration tests',
          'Deploy to production',
          'Health checks',
          'Rollback on failure'
        ],
        tools: [
          'GitHub Actions',
          'Jest for testing',
          'SonarQube for code quality',
          'Snyk for security scanning'
        ]
      },
      backup: {
        strategy: '3-2-1 Backup Rule',
        implementation: [
          'Daily automated backups',
          'Cross-region replication',
          'Point-in-time recovery',
          'Backup verification tests'
        ]
      }
    };

    return deploymentRecommendations;
  }

  /**
   * 生成完整的监控建议报告
   */
  generateMonitoringReport(reports) {
    console.log('📋 生成监控建议报告...');
    
    const slaRecommendations = this.generateSLARecommendations(reports);
    const securityRecommendations = this.generateSecurityRecommendations(reports);
    const performanceRecommendations = this.generatePerformanceRecommendations(reports);
    const toolsConfig = this.generateMonitoringToolsConfig();
    const deploymentRecommendations = this.generateDeploymentRecommendations();
    
    const monitoringReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalApis: reports.analysis ? reports.analysis.summary.total_backend_routes : 0,
        securityIssues: reports.compliance ? reports.compliance.security.violations.length : 0,
        complianceScore: reports.compliance ? reports.compliance.overall.score : 0
      },
      sla: slaRecommendations,
      security: securityRecommendations,
      performance: performanceRecommendations,
      tools: toolsConfig,
      deployment: deploymentRecommendations,
      actionItems: this.generateActionItems(reports)
    };
    
    return monitoringReport;
  }

  /**
   * 生成行动项目
   */
  generateActionItems(reports) {
    const actionItems = [];
    
    // 基于合规性报告生成行动项目
    if (reports.compliance) {
      const compliance = reports.compliance;
      
      if (compliance.security.violations.length > 0) {
        actionItems.push({
          priority: 'high',
          category: 'security',
          title: '修复安全漏洞',
          description: `发现${compliance.security.violations.length}个安全问题需要立即处理`,
          estimatedEffort: '2-3 days',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      if (compliance.redundancy.duplicates.length > 0) {
        actionItems.push({
          priority: 'medium',
          category: 'optimization',
          title: '清理重复API',
          description: `发现${compliance.redundancy.duplicates.length}个重复API端点`,
          estimatedEffort: '1-2 days',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      if (compliance.overall.score < 70) {
        actionItems.push({
          priority: 'medium',
          category: 'compliance',
          title: '提升API规范性',
          description: `当前合规性得分${compliance.overall.score.toFixed(1)}，需要改进`,
          estimatedEffort: '3-5 days',
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    // 添加监控相关行动项目
    actionItems.push(
      {
        priority: 'high',
        category: 'monitoring',
        title: '部署监控系统',
        description: '设置Prometheus + Grafana监控栈',
        estimatedEffort: '2-3 days',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        priority: 'medium',
        category: 'testing',
        title: '实施API测试',
        description: '运行生成的测试套件并修复发现的问题',
        estimatedEffort: '1-2 days',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        priority: 'low',
        category: 'documentation',
        title: '完善API文档',
        description: '基于生成的文档进行人工审核和完善',
        estimatedEffort: '1 day',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
    
    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(monitoringReport) {
    const markdown = `# API运维监控建议报告

生成时间: ${new Date().toLocaleString()}

## 概览

- **API端点总数**: ${monitoringReport.summary.totalApis}
- **安全问题**: ${monitoringReport.summary.securityIssues}个
- **合规性得分**: ${monitoringReport.summary.complianceScore.toFixed(1)}分

## SLA指标建议

### 响应时间目标
- **P95**: ${monitoringReport.sla.responseTime.targets.p95}ms
- **P99**: ${monitoringReport.sla.responseTime.targets.p99}ms
- **平均**: ${monitoringReport.sla.responseTime.targets.average}ms

### 可用性目标
- **目标可用性**: ${monitoringReport.sla.availability.target}%
- **最大错误率**: ${this.monitoringConfig.sla.errorRate}%

## 安全策略建议

### 限流策略
- **匿名用户**: ${monitoringReport.security.rateLimiting.implementation.rules.anonymous} 请求/小时
- **认证用户**: ${monitoringReport.security.rateLimiting.implementation.rules.authenticated} 请求/小时
- **管理员**: ${monitoringReport.security.rateLimiting.implementation.rules.admin} 请求/小时

### 认证安全
- **JWT过期时间**: ${monitoringReport.security.authentication.jwt.expiry}秒
- **最大登录尝试**: ${monitoringReport.security.authentication.bruteForce.maxAttempts}次
- **锁定时间**: ${monitoringReport.security.authentication.bruteForce.lockoutDuration}秒

## 性能监控建议

### 缓存策略
- **静态内容**: ${this.monitoringConfig.performance.caching.staticContent}秒
- **API响应**: ${this.monitoringConfig.performance.caching.apiResponse}秒
- **用户会话**: ${this.monitoringConfig.performance.caching.userSession}秒

### 数据库优化
- **连接池大小**: ${this.monitoringConfig.performance.database.connectionPool}
- **查询超时**: ${this.monitoringConfig.performance.database.queryTimeout}ms
- **慢查询阈值**: ${this.monitoringConfig.performance.database.slowQueryThreshold}ms

## 监控工具配置

### Prometheus配置
\`\`\`yaml
global:
  scrape_interval: ${monitoringReport.tools.prometheus.scrapeInterval}
  evaluation_interval: ${monitoringReport.tools.prometheus.evaluationInterval}

scrape_configs:
  - job_name: 'api-servers'
    static_configs:
      - targets: ${JSON.stringify(monitoringReport.tools.prometheus.targets)}
\`\`\`

### Grafana仪表板
${monitoringReport.tools.grafana.dashboards.map(dashboard => 
  `- **${dashboard.name}**: ${dashboard.panels.join(', ')}`
).join('\n')}

## 部署建议

### 基础设施
- **云服务商**: ${monitoringReport.deployment.infrastructure.cloudProvider}
- **架构模式**: ${monitoringReport.deployment.infrastructure.architecture}

### CI/CD流程
${monitoringReport.deployment.cicd.pipeline.map((step, index) => 
  `${index + 1}. ${step}`
).join('\n')}

## 行动项目

${monitoringReport.actionItems.map(item => 
  `### ${item.title} (${item.priority.toUpperCase()})
- **类别**: ${item.category}
- **描述**: ${item.description}
- **预估工作量**: ${item.estimatedEffort}
- **截止日期**: ${new Date(item.deadline).toLocaleDateString()}
`
).join('\n')}

## 实施路线图

### 第一阶段 (1-2周)
1. 修复高优先级安全问题
2. 部署基础监控系统
3. 实施API测试

### 第二阶段 (3-4周)
1. 优化API性能
2. 完善监控告警
3. 清理重复API

### 第三阶段 (5-6周)
1. 完善文档
2. 优化部署流程
3. 性能调优

## 成本估算

### 监控工具
- **Prometheus + Grafana**: 自托管免费
- **Cloudflare Analytics**: 包含在现有计划中
- **第三方监控服务**: $50-200/月

### 基础设施
- **Cloudflare Workers**: $5/月 (10M请求)
- **AWS Lambda**: $0.20/1M请求
- **数据库**: $20-100/月

### 人力成本
- **初始设置**: 40-60小时
- **日常维护**: 4-8小时/周
`;

    return markdown;
  }

  /**
   * 保存监控建议报告
   */
  saveMonitoringReport(monitoringReport) {
    console.log('💾 保存监控建议报告...');
    
    // 保存JSON报告
    const jsonPath = path.join(this.projectRoot, 'docs/API_MONITORING_RECOMMENDATIONS.json');
    fs.writeFileSync(jsonPath, JSON.stringify(monitoringReport, null, 2));
    console.log(`📄 JSON报告已保存到: ${jsonPath}`);
    
    // 保存Markdown报告
    const markdown = this.generateMarkdownReport(monitoringReport);
    const markdownPath = path.join(this.projectRoot, 'docs/API_MONITORING_RECOMMENDATIONS.md');
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Markdown报告已保存到: ${markdownPath}`);
    
    return { jsonPath, markdownPath };
  }

  /**
   * 运行监控建议生成
   */
  async run() {
    console.log('🚀 开始生成API运维监控建议...\n');
    
    try {
      const reports = this.loadReports();
      const monitoringReport = this.generateMonitoringReport(reports);
      const savedPaths = this.saveMonitoringReport(monitoringReport);
      
      console.log('\n✅ API运维监控建议生成完成!');
      console.log(`📊 生成了 ${monitoringReport.actionItems.length} 个行动项目`);
      console.log(`🔒 识别了 ${monitoringReport.summary.securityIssues} 个安全问题`);
      console.log(`⚡ 提供了完整的性能监控方案`);
      
      console.log('\n📋 下一步操作:');
      console.log('1. 审查行动项目并制定实施计划');
      console.log('2. 部署监控工具 (Prometheus + Grafana)');
      console.log('3. 实施安全策略和限流机制');
      console.log('4. 运行API测试并修复发现的问题');
      
      return monitoringReport;
    } catch (error) {
      console.error('❌ 监控建议生成失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const advisor = new APIMonitoringAdvisor();
  advisor.run().catch(console.error);
}

module.exports = APIMonitoringAdvisor;

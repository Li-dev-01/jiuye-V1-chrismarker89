/**
 * 数据质量检查器
 * 验证数据一致性、完整性和质量
 */

export interface QualityCheckRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  checker: (data: any) => QualityCheckResult;
}

export interface QualityCheckResult {
  passed: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

export interface QualityReport {
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  results: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    result: QualityCheckResult;
  }>;
  overallScore: number; // 0-100
  recommendations: string[];
}

export class DataQualityChecker {
  private rules: Map<string, QualityCheckRule> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * 初始化质量检查规则
   */
  private initializeRules() {
    // 数据完整性检查
    this.addRule({
      id: 'data-completeness',
      name: '数据完整性检查',
      description: '检查必填字段是否完整',
      severity: 'error',
      checker: (data: any) => {
        const requiredFields = ['education-level', 'major-field', 'current-status'];
        const missingFields = [];

        if (data.sectionResponses) {
          // 新格式数据
          const allResponses = data.sectionResponses.flatMap((section: any) => 
            section.questionResponses || []
          );
          const responseIds = allResponses.map((r: any) => r.questionId);

          for (const field of requiredFields) {
            if (!responseIds.includes(field)) {
              missingFields.push(field);
            }
          }
        } else {
          // 旧格式数据
          const fieldMapping = {
            'education-level': 'education',
            'major-field': 'major',
            'current-status': 'employment_status'
          };

          for (const field of requiredFields) {
            const oldField = fieldMapping[field as keyof typeof fieldMapping];
            if (!data[oldField]) {
              missingFields.push(field);
            }
          }
        }

        return {
          passed: missingFields.length === 0,
          message: missingFields.length === 0 
            ? '所有必填字段都已填写' 
            : `缺少必填字段: ${missingFields.join(', ')}`,
          details: { missingFields },
          suggestions: missingFields.length > 0 
            ? ['请确保所有必填字段都有值', '检查数据收集流程是否完整']
            : []
        };
      }
    });

    // 数据格式一致性检查
    this.addRule({
      id: 'format-consistency',
      name: '数据格式一致性',
      description: '检查数据格式是否一致',
      severity: 'warning',
      checker: (data: any) => {
        const issues = [];

        // 检查时间格式
        if (data.submittedAt && !this.isValidISODate(data.submittedAt)) {
          issues.push('提交时间格式不正确');
        }

        // 检查布尔值格式
        if (data.isCompleted !== undefined && typeof data.isCompleted !== 'boolean') {
          issues.push('完成状态应为布尔值');
        }

        // 检查数字格式
        if (data.timeSpent !== undefined && (typeof data.timeSpent !== 'number' || data.timeSpent < 0)) {
          issues.push('用时应为正数');
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? '数据格式一致' 
            : `格式问题: ${issues.join(', ')}`,
          details: { issues },
          suggestions: issues.length > 0 
            ? ['统一数据格式标准', '添加数据验证规则']
            : []
        };
      }
    });

    // 数据逻辑一致性检查
    this.addRule({
      id: 'logical-consistency',
      name: '逻辑一致性检查',
      description: '检查数据逻辑是否合理',
      severity: 'warning',
      checker: (data: any) => {
        const issues = [];

        if (data.sectionResponses) {
          const allResponses = data.sectionResponses.flatMap((section: any) => 
            section.questionResponses || []
          );
          
          const responseMap = new Map();
          allResponses.forEach((r: any) => {
            responseMap.set(r.questionId, r.value);
          });

          // 检查学历与年龄的逻辑关系
          const education = responseMap.get('education-level');
          const age = responseMap.get('age-range');
          
          if (education === 'phd' && (age === 'under-20' || age === '20-22')) {
            issues.push('博士学历与年龄不匹配');
          }

          // 检查就业状态与薪资的逻辑关系
          const status = responseMap.get('current-status');
          const salary = responseMap.get('current-salary');
          
          if (status === 'unemployed' && salary) {
            issues.push('失业状态不应有当前薪资');
          }

          if (status === 'student' && salary) {
            issues.push('学生状态不应有正式薪资');
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? '数据逻辑一致' 
            : `逻辑问题: ${issues.join(', ')}`,
          details: { issues },
          suggestions: issues.length > 0 
            ? ['检查数据收集逻辑', '添加条件验证规则']
            : []
        };
      }
    });

    // 数据质量评分
    this.addRule({
      id: 'data-richness',
      name: '数据丰富度检查',
      description: '评估数据的丰富程度',
      severity: 'info',
      checker: (data: any) => {
        let totalFields = 0;
        let filledFields = 0;

        if (data.sectionResponses) {
          const allResponses = data.sectionResponses.flatMap((section: any) => 
            section.questionResponses || []
          );
          
          totalFields = 12; // 预期的总字段数
          filledFields = allResponses.filter((r: any) => 
            r.value !== null && r.value !== undefined && r.value !== ''
          ).length;
        } else {
          const fields = ['education', 'major', 'employment_status', 'salary_expectation', 'job_location'];
          totalFields = fields.length;
          filledFields = fields.filter(field => 
            data[field] !== null && data[field] !== undefined && data[field] !== ''
          ).length;
        }

        const richness = Math.round((filledFields / totalFields) * 100);

        return {
          passed: richness >= 70,
          message: `数据丰富度: ${richness}% (${filledFields}/${totalFields})`,
          details: { richness, filledFields, totalFields },
          suggestions: richness < 70 
            ? ['鼓励用户填写更多字段', '优化问卷设计提高完成率']
            : ['数据质量良好']
        };
      }
    });

    // 异常值检测
    this.addRule({
      id: 'outlier-detection',
      name: '异常值检测',
      description: '检测可能的异常数据',
      severity: 'warning',
      checker: (data: any) => {
        const issues = [];

        // 检查用时异常
        if (data.timeSpent !== undefined) {
          if (data.timeSpent < 30) {
            issues.push('完成时间过短，可能为无效提交');
          } else if (data.timeSpent > 3600) {
            issues.push('完成时间过长，可能存在中断');
          }
        }

        // 检查提交时间异常
        if (data.submittedAt) {
          const submitTime = new Date(data.submittedAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - submitTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 0) {
            issues.push('提交时间在未来，可能存在时区问题');
          } else if (hoursDiff > 24 * 365) {
            issues.push('提交时间过于久远，可能为测试数据');
          }
        }

        return {
          passed: issues.length === 0,
          message: issues.length === 0 
            ? '未发现异常值' 
            : `发现异常: ${issues.join(', ')}`,
          details: { issues },
          suggestions: issues.length > 0 
            ? ['检查数据收集环境', '验证时间设置', '过滤无效数据']
            : []
        };
      }
    });
  }

  /**
   * 添加检查规则
   */
  addRule(rule: QualityCheckRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 移除检查规则
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * 检查单条数据
   */
  checkData(data: any, ruleIds?: string[]): QualityReport {
    const rulesToCheck = ruleIds 
      ? ruleIds.map(id => this.rules.get(id)).filter(Boolean) as QualityCheckRule[]
      : Array.from(this.rules.values());

    const results = [];
    let passed = 0;
    let warnings = 0;
    let errors = 0;

    for (const rule of rulesToCheck) {
      try {
        const result = rule.checker(data);
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          result
        });

        if (result.passed) {
          passed++;
        } else {
          if (rule.severity === 'error') {
            errors++;
          } else if (rule.severity === 'warning') {
            warnings++;
          }
        }
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          result: {
            passed: false,
            message: `检查失败: ${error}`,
            suggestions: ['检查规则实现', '验证数据格式']
          }
        });
        errors++;
      }
    }

    const totalChecks = results.length;
    const overallScore = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    // 生成建议
    const recommendations = [];
    if (errors > 0) {
      recommendations.push('修复所有错误级别的问题');
    }
    if (warnings > 0) {
      recommendations.push('关注警告级别的问题，提升数据质量');
    }
    if (overallScore < 80) {
      recommendations.push('数据质量有待提升，建议优化数据收集流程');
    }

    return {
      totalChecks,
      passed,
      warnings,
      errors,
      results,
      overallScore,
      recommendations
    };
  }

  /**
   * 批量检查数据
   */
  checkDataBatch(dataArray: any[], ruleIds?: string[]): {
    totalRecords: number;
    reports: QualityReport[];
    summary: {
      averageScore: number;
      totalErrors: number;
      totalWarnings: number;
      commonIssues: Array<{ issue: string; count: number }>;
    };
  } {
    const reports = dataArray.map(data => this.checkData(data, ruleIds));
    
    const totalRecords = reports.length;
    const averageScore = reports.reduce((sum, report) => sum + report.overallScore, 0) / totalRecords;
    const totalErrors = reports.reduce((sum, report) => sum + report.errors, 0);
    const totalWarnings = reports.reduce((sum, report) => sum + report.warnings, 0);

    // 统计常见问题
    const issueCount = new Map<string, number>();
    reports.forEach(report => {
      report.results.forEach(result => {
        if (!result.result.passed) {
          const issue = result.result.message;
          issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
        }
      });
    });

    const commonIssues = Array.from(issueCount.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRecords,
      reports,
      summary: {
        averageScore: Math.round(averageScore),
        totalErrors,
        totalWarnings,
        commonIssues
      }
    };
  }

  /**
   * 获取所有规则
   */
  getRules(): QualityCheckRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 验证ISO日期格式
   */
  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
  }
}

// 全局实例
export const dataQualityChecker = new DataQualityChecker();

/**
 * 数据完整性验证器
 * 全局监控和验证数据流的完整性
 */

import { UNIFIED_DIMENSION_MAPPING, getAllApiDataFields } from '../config/unifiedDataMapping';
import type { ApiCompleteData } from '../services/unifiedDataTransformService';

// ===== 1. 验证规则定义 =====

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validator: (data: any) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: any;
}

export interface ValidationReport {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationResult[];
  warnings: ValidationResult[];
  infos: ValidationResult[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
  };
  timestamp: string;
}

// ===== 2. 验证规则集合 =====

export const DATA_VALIDATION_RULES: ValidationRule[] = [
  {
    name: 'totalResponses',
    description: '验证总响应数是否为有效数字',
    severity: 'error',
    validator: (data: ApiCompleteData) => {
      const isValid = typeof data.totalResponses === 'number' && data.totalResponses >= 0;
      return {
        isValid,
        message: isValid ? '总响应数有效' : '总响应数无效或缺失',
        details: { totalResponses: data.totalResponses }
      };
    }
  },
  {
    name: 'percentageSum',
    description: '验证每个分布的百分比总和是否为100%',
    severity: 'error',
    validator: (data: ApiCompleteData) => {
      const fields = getAllApiDataFields();
      const results: any = {};
      let allValid = true;

      for (const field of fields) {
        const fieldData = (data as any)[field];
        if (Array.isArray(fieldData)) {
          const sum = fieldData.reduce((acc, item) => acc + (item.percentage || 0), 0);
          const isValid = Math.abs(sum - 100) < 0.1; // 允许0.1%的误差
          results[field] = { sum, isValid };
          if (!isValid) allValid = false;
        }
      }

      return {
        isValid: allValid,
        message: allValid ? '所有百分比总和正确' : '存在百分比总和不为100%的字段',
        details: results
      };
    }
  },
  {
    name: 'dataStructure',
    description: '验证数据结构是否符合预期格式',
    severity: 'error',
    validator: (data: ApiCompleteData) => {
      const requiredFields = getAllApiDataFields();
      const missingFields: string[] = [];
      const invalidFields: string[] = [];

      for (const field of requiredFields) {
        const fieldData = (data as any)[field];
        if (fieldData === undefined) {
          missingFields.push(field);
        } else if (!Array.isArray(fieldData)) {
          invalidFields.push(field);
        } else {
          // 检查数组元素结构
          for (const item of fieldData) {
            if (!item.name || typeof item.value !== 'number' || typeof item.percentage !== 'number') {
              invalidFields.push(field);
              break;
            }
          }
        }
      }

      const isValid = missingFields.length === 0 && invalidFields.length === 0;
      return {
        isValid,
        message: isValid ? '数据结构正确' : '数据结构存在问题',
        details: { missingFields, invalidFields }
      };
    }
  },
  {
    name: 'dataCompleteness',
    description: '验证数据完整性',
    severity: 'warning',
    validator: (data: ApiCompleteData) => {
      const fields = getAllApiDataFields();
      const emptyFields: string[] = [];
      let totalDataPoints = 0;

      for (const field of fields) {
        const fieldData = (data as any)[field];
        if (Array.isArray(fieldData)) {
          if (fieldData.length === 0) {
            emptyFields.push(field);
          } else {
            totalDataPoints += fieldData.length;
          }
        }
      }

      const completeness = ((fields.length - emptyFields.length) / fields.length) * 100;
      const isValid = completeness >= 80; // 80%以上认为完整

      return {
        isValid,
        message: `数据完整性: ${completeness.toFixed(1)}%`,
        details: { completeness, emptyFields, totalDataPoints }
      };
    }
  },
  {
    name: 'cacheInfo',
    description: '验证缓存信息',
    severity: 'info',
    validator: (data: ApiCompleteData) => {
      const hasCache = !!data.cacheInfo;
      const hasLastUpdated = hasCache && !!data.cacheInfo?.lastUpdated;
      
      return {
        isValid: hasCache,
        message: hasCache ? '缓存信息完整' : '缺少缓存信息',
        details: { 
          hasCache, 
          hasLastUpdated,
          lastUpdated: data.cacheInfo?.lastUpdated,
          source: data.cacheInfo?.source
        }
      };
    }
  },
  {
    name: 'dataFreshness',
    description: '验证数据新鲜度',
    severity: 'warning',
    validator: (data: ApiCompleteData) => {
      if (!data.cacheInfo?.lastUpdated) {
        return {
          isValid: false,
          message: '无法验证数据新鲜度：缺少更新时间',
          details: { reason: 'missing_timestamp' }
        };
      }

      const lastUpdated = new Date(data.cacheInfo.lastUpdated);
      const now = new Date();
      const ageHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      const isValid = ageHours <= 24; // 24小时内认为新鲜

      return {
        isValid,
        message: `数据年龄: ${ageHours.toFixed(1)}小时`,
        details: { ageHours, lastUpdated: lastUpdated.toISOString() }
      };
    }
  }
];

// ===== 3. 验证器类 =====

export class DataIntegrityValidator {
  private rules: ValidationRule[];

  constructor(customRules?: ValidationRule[]) {
    this.rules = customRules || DATA_VALIDATION_RULES;
  }

  /**
   * 验证API数据
   */
  public validateApiData(data: ApiCompleteData): ValidationReport {
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const infos: ValidationResult[] = [];

    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;

    for (const rule of this.rules) {
      try {
        const result = rule.validator(data);
        
        if (result.isValid) {
          passedChecks++;
          if (rule.severity === 'info') {
            infos.push(result);
          }
        } else {
          switch (rule.severity) {
            case 'error':
              errors.push(result);
              failedChecks++;
              break;
            case 'warning':
              warnings.push(result);
              warningChecks++;
              break;
            case 'info':
              infos.push(result);
              break;
          }
        }
      } catch (error) {
        errors.push({
          isValid: false,
          message: `验证规则 ${rule.name} 执行失败: ${error}`,
          details: { error: error.toString() }
        });
        failedChecks++;
      }
    }

    const totalChecks = this.rules.length;
    const isValid = errors.length === 0;
    const score = Math.round(((passedChecks + warningChecks * 0.5) / totalChecks) * 100);

    return {
      isValid,
      score,
      errors,
      warnings,
      infos,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成验证报告摘要
   */
  public generateReportSummary(report: ValidationReport): string {
    const { summary, score, errors, warnings } = report;
    
    let summary_text = `数据质量评分: ${score}/100\n`;
    summary_text += `检查项目: ${summary.totalChecks} 项\n`;
    summary_text += `✅ 通过: ${summary.passedChecks} 项\n`;
    
    if (summary.failedChecks > 0) {
      summary_text += `❌ 失败: ${summary.failedChecks} 项\n`;
    }
    
    if (summary.warningChecks > 0) {
      summary_text += `⚠️ 警告: ${summary.warningChecks} 项\n`;
    }

    if (errors.length > 0) {
      summary_text += `\n主要问题:\n`;
      errors.slice(0, 3).forEach(error => {
        summary_text += `• ${error.message}\n`;
      });
    }

    return summary_text;
  }

  /**
   * 添加自定义验证规则
   */
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除验证规则
   */
  public removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  /**
   * 获取所有规则
   */
  public getRules(): ValidationRule[] {
    return [...this.rules];
  }
}

// ===== 4. 导出实例和工具函数 =====

export const dataIntegrityValidator = new DataIntegrityValidator();

/**
 * 快速验证API数据
 */
export function quickValidateApiData(data: ApiCompleteData): {
  isValid: boolean;
  score: number;
  summary: string;
} {
  const report = dataIntegrityValidator.validateApiData(data);
  return {
    isValid: report.isValid,
    score: report.score,
    summary: dataIntegrityValidator.generateReportSummary(report)
  };
}

/**
 * 监控数据质量变化
 */
export class DataQualityMonitor {
  private history: ValidationReport[] = [];
  private maxHistorySize = 50;

  public addReport(report: ValidationReport): void {
    this.history.push(report);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  public getQualityTrend(): {
    current: number;
    average: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    if (this.history.length === 0) {
      return { current: 0, average: 0, trend: 'stable' };
    }

    const scores = this.history.map(report => report.score);
    const current = scores[scores.length - 1];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (scores.length >= 2) {
      const recent = scores.slice(-5); // 最近5次
      const earlier = scores.slice(-10, -5); // 之前5次
      
      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length;
        
        if (recentAvg > earlierAvg + 5) trend = 'improving';
        else if (recentAvg < earlierAvg - 5) trend = 'declining';
      }
    }

    return { current, average, trend };
  }

  public getHistory(): ValidationReport[] {
    return [...this.history];
  }
}

export const dataQualityMonitor = new DataQualityMonitor();

export default dataIntegrityValidator;

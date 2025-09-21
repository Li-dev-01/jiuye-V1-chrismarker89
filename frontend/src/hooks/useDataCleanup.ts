/**
 * 数据清理 Hook
 * 基于分支逻辑的智能数据清理和质量保证
 * 
 * 功能：
 * - 自动数据清理
 * - 数据质量验证
 * - 一致性检查
 * - 隐私保护
 */

import { useCallback, useMemo, useRef } from 'react';
import type { QuestionnaireData, BranchState } from './useBranchLogic';

// 数据清理规则接口
export interface CleanupRule {
  id: string;
  name: string;
  condition: (data: QuestionnaireData, branchState: BranchState) => boolean;
  action: (data: QuestionnaireData) => QuestionnaireData;
  reason: string;
  priority: number;
}

// 数据质量问题接口
export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

// 清理历史记录接口
export interface CleanupHistory {
  timestamp: number;
  ruleId: string;
  ruleName: string;
  fieldsAffected: string[];
  reason: string;
}

/**
 * 数据清理 Hook
 */
export const useDataCleanup = () => {
  const cleanupHistoryRef = useRef<CleanupHistory[]>([]);

  // 定义清理规则
  const cleanupRules = useMemo<CleanupRule[]>(() => [
    {
      id: 'unemployed-student-conflict',
      name: '失业学生冲突清理',
      condition: (data, branchState) => 
        data['primary-identity'] === 'current-student' && 
        (data['unemployment-duration'] || data['unemployment-reason']),
      action: (data) => {
        const cleaned = { ...data };
        delete cleaned['unemployment-duration'];
        delete cleaned['unemployment-reason'];
        delete cleaned['previous-work-experience'];
        return cleaned;
      },
      reason: '在校学生不应该有失业相关信息',
      priority: 1
    },
    
    {
      id: 'employed-unemployment-conflict',
      name: '在职失业冲突清理',
      condition: (data, branchState) => 
        data['current-activity'] === 'working-fulltime' && 
        (data['unemployment-duration'] || data['job-search-intensity']),
      action: (data) => {
        const cleaned = { ...data };
        delete cleaned['unemployment-duration'];
        delete cleaned['unemployment-reason'];
        delete cleaned['job-search-intensity'];
        delete cleaned['financial-pressure'];
        return cleaned;
      },
      reason: '全职工作人员不应该有失业或求职相关信息',
      priority: 1
    },
    
    {
      id: 'non-tier1-city-costs',
      name: '非一线城市成本清理',
      condition: (data, branchState) => 
        data['location-tier'] !== 'tier1' && 
        (data['monthly-housing-cost'] || data['life-pressure-tier1']),
      action: (data) => {
        const cleaned = { ...data };
        delete cleaned['monthly-housing-cost'];
        delete cleaned['life-pressure-tier1'];
        return cleaned;
      },
      reason: '非一线城市用户不需要一线城市生活成本信息',
      priority: 2
    },
    
    {
      id: 'non-job-seeking-details',
      name: '非求职状态清理',
      condition: (data, branchState) => 
        data['current-activity'] !== 'job-seeking' && 
        (data['job-search-intensity'] || data['financial-pressure']),
      action: (data) => {
        const cleaned = { ...data };
        delete cleaned['job-search-intensity'];
        delete cleaned['financial-pressure'];
        return cleaned;
      },
      reason: '非求职状态用户不需要求职详情信息',
      priority: 2
    },
    
    {
      id: 'student-work-experience-conflict',
      name: '学生工作经验冲突清理',
      condition: (data, branchState) => 
        data['primary-identity'] === 'current-student' && 
        data['academic-year'] === 'year-1' && 
        data['previous-work-experience'] === 'over-10years',
      action: (data) => {
        const cleaned = { ...data };
        // 将不合理的工作经验重置为合理范围
        if (cleaned['previous-work-experience'] === 'over-10years') {
          cleaned['previous-work-experience'] = 'no-experience';
        }
        return cleaned;
      },
      reason: '大一学生不太可能有超过10年的工作经验',
      priority: 3
    }
  ], []);

  // 执行数据清理
  const cleanupData = useCallback((
    data: QuestionnaireData, 
    branchState: BranchState
  ): { cleanedData: QuestionnaireData; appliedRules: CleanupHistory[] } => {
    let cleanedData = { ...data };
    const appliedRules: CleanupHistory[] = [];

    // 按优先级排序规则
    const sortedRules = [...cleanupRules].sort((a, b) => a.priority - b.priority);

    sortedRules.forEach(rule => {
      if (rule.condition(cleanedData, branchState)) {
        const beforeCleanup = { ...cleanedData };
        cleanedData = rule.action(cleanedData);
        
        // 记录清理历史
        const affectedFields = Object.keys(beforeCleanup).filter(
          key => beforeCleanup[key] !== cleanedData[key] || !(key in cleanedData)
        );
        
        if (affectedFields.length > 0) {
          const historyEntry: CleanupHistory = {
            timestamp: Date.now(),
            ruleId: rule.id,
            ruleName: rule.name,
            fieldsAffected: affectedFields,
            reason: rule.reason
          };
          
          appliedRules.push(historyEntry);
          cleanupHistoryRef.current.push(historyEntry);
        }
      }
    });

    return { cleanedData, appliedRules };
  }, [cleanupRules]);

  // 验证数据质量
  const validateDataQuality = useCallback((
    data: QuestionnaireData,
    branchState: BranchState
  ): DataQualityIssue[] => {
    const issues: DataQualityIssue[] = [];

    // 检查逻辑一致性
    if (data['primary-identity'] === 'unemployed-person' && 
        data['current-activity'] === 'working-fulltime') {
      issues.push({
        field: 'current-activity',
        issue: '身份与当前活动状态矛盾',
        severity: 'high',
        suggestion: '请检查身份选择或当前活动状态是否正确'
      });
    }

    // 检查年龄与经验的合理性
    if (data['age-group'] === '18-22' && 
        data['previous-work-experience'] === 'over-10years') {
      issues.push({
        field: 'previous-work-experience',
        issue: '年龄与工作经验不匹配',
        severity: 'medium',
        suggestion: '18-22岁通常不会有超过10年的工作经验'
      });
    }

    // 检查学生身份与年级的合理性
    if (data['primary-identity'] === 'current-student' && 
        data['age-group'] === 'over-40' && 
        data['academic-year'] === 'year-1') {
      issues.push({
        field: 'academic-year',
        issue: '年龄与年级可能不匹配',
        severity: 'low',
        suggestion: '40岁以上的一年级学生较为少见，请确认信息准确性'
      });
    }

    // 检查地区与生活成本的合理性
    if (data['location-tier'] === 'tier1' && 
        data['monthly-housing-cost'] === 'below-2k') {
      issues.push({
        field: 'monthly-housing-cost',
        issue: '一线城市住房成本可能偏低',
        severity: 'low',
        suggestion: '一线城市2000元以下的住房成本较为少见'
      });
    }

    // 检查失业时长与求职强度的合理性
    if (data['unemployment-duration'] === 'over-2years' && 
        data['job-search-intensity'] === 'passive') {
      issues.push({
        field: 'job-search-intensity',
        issue: '长期失业但求职不积极',
        severity: 'medium',
        suggestion: '失业超过2年通常需要更积极的求职行为'
      });
    }

    return issues;
  }, []);

  // 敏感数据处理
  const sanitizeSensitiveData = useCallback((data: QuestionnaireData): QuestionnaireData => {
    const sanitized = { ...data };

    // 对敏感字段进行处理
    const sensitiveFields = [
      'monthly-housing-cost',
      'financial-pressure',
      'unemployment-reason'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        // 添加敏感数据标记，用于后续处理
        sanitized[`${field}_is_sensitive`] = true;
      }
    });

    return sanitized;
  }, []);

  // 数据完整性检查
  const checkDataCompleteness = useCallback((
    data: QuestionnaireData,
    requiredFields: string[]
  ): { isComplete: boolean; missingFields: string[] } => {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }, []);

  // 获取清理历史
  const getCleanupHistory = useCallback((): CleanupHistory[] => {
    return [...cleanupHistoryRef.current];
  }, []);

  // 清除清理历史
  const clearCleanupHistory = useCallback(() => {
    cleanupHistoryRef.current = [];
  }, []);

  // 生成数据质量报告
  const generateQualityReport = useCallback((
    data: QuestionnaireData,
    branchState: BranchState
  ) => {
    const issues = validateDataQuality(data, branchState);
    const { cleanedData, appliedRules } = cleanupData(data, branchState);
    const history = getCleanupHistory();

    return {
      originalData: data,
      cleanedData,
      qualityIssues: issues,
      appliedRules,
      cleanupHistory: history,
      qualityScore: calculateQualityScore(issues),
      recommendations: generateRecommendations(issues)
    };
  }, [validateDataQuality, cleanupData, getCleanupHistory]);

  // 计算数据质量分数
  const calculateQualityScore = useCallback((issues: DataQualityIssue[]): number => {
    if (issues.length === 0) return 100;

    const severityWeights = { low: 1, medium: 3, high: 5 };
    const totalWeight = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    const maxPossibleWeight = issues.length * 5; // 假设所有问题都是高严重性

    return Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);
  }, []);

  // 生成改进建议
  const generateRecommendations = useCallback((issues: DataQualityIssue[]): string[] => {
    const recommendations: string[] = [];

    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    if (highSeverityIssues.length > 0) {
      recommendations.push('请优先解决高严重性的数据一致性问题');
    }

    const mediumSeverityIssues = issues.filter(issue => issue.severity === 'medium');
    if (mediumSeverityIssues.length > 0) {
      recommendations.push('建议检查中等严重性的数据合理性问题');
    }

    if (issues.length > 5) {
      recommendations.push('数据质量问题较多，建议重新检查填写内容');
    }

    return recommendations;
  }, []);

  return {
    // 核心功能
    cleanupData,
    validateDataQuality,
    sanitizeSensitiveData,
    checkDataCompleteness,
    
    // 历史管理
    getCleanupHistory,
    clearCleanupHistory,
    
    // 报告生成
    generateQualityReport,
    calculateQualityScore,
    generateRecommendations,
    
    // 规则管理
    cleanupRules
  };
};

export default useDataCleanup;

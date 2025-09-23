/**
 * 分支逻辑管理 Hook
 * 基于优秀问卷设计原则的分支状态管理
 * 
 * 功能：
 * - 分支状态计算
 * - 数据清理
 * - 路径追踪
 * - 性能优化
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { UniversalQuestionnaire } from '../types/universal-questionnaire';

// 分支状态接口
export interface BranchState {
  [sectionId: string]: boolean;
}

// 分支路径记录接口
export interface BranchPath {
  identity: string;
  status: string;
  location: string;
  timestamp: number;
  completedSections: string[];
  activeSections: string[];
}

// 数据清理配置接口
export interface DataCleanupRule {
  condition: string;
  fieldsToClean: string[];
  reason: string;
}

// 分支配置接口
export interface BranchConfig {
  [sectionId: string]: {
    condition: (data: any) => boolean;
    fields: string[];
    dependencies: string[];
    cleanupRules: DataCleanupRule[];
  };
}

// 问卷数据接口
export interface QuestionnaireData {
  [key: string]: any;
}

/**
 * 分支逻辑管理 Hook
 */
export const useBranchLogic = (
  questionnaire: UniversalQuestionnaire,
  formData: QuestionnaireData
) => {
  const branchPathRef = useRef<BranchPath>({
    identity: '',
    status: '',
    location: '',
    timestamp: Date.now(),
    completedSections: [],
    activeSections: []
  });

  // 构建分支配置
  const branchConfig = useMemo(() => {
    const config: BranchConfig = {};

    questionnaire.sections.forEach(section => {
      if (section.condition) {
        config[section.id] = {
          condition: (data: QuestionnaireData) => {
            return evaluateCondition(section.condition!, data);
          },
          fields: section.questions.map(q => q.id),
          dependencies: getDependencies(section.condition),
          cleanupRules: []
        };
      }
    });

    return config;
  }, [questionnaire]);

  // 计算当前分支状态
  const branchState = useMemo(() => {
    const state: BranchState = {};

    Object.entries(branchConfig).forEach(([sectionId, config]) => {
      state[sectionId] = config.condition(formData);
    });

    // 更新分支路径
    branchPathRef.current = {
      ...branchPathRef.current,
      identity: formData['primary-identity'] || '',
      status: formData['current-activity'] || '',
      location: formData['location-tier'] || '',
      activeSections: Object.entries(state)
        .filter(([_, active]) => active)
        .map(([sectionId]) => sectionId)
    };

    return state;
  }, [formData, branchConfig]);

  // 获取当前应该显示的字段
  const activeFields = useMemo(() => {
    const fields: string[] = [];

    // 添加基础字段（无条件显示的section）
    questionnaire.sections.forEach(section => {
      if (!section.condition) {
        fields.push(...section.questions.map(q => q.id));
      }
    });

    // 添加条件字段
    Object.entries(branchConfig).forEach(([sectionId, config]) => {
      if (branchState[sectionId]) {
        fields.push(...config.fields);
      }
    });

    return fields;
  }, [branchState, branchConfig, questionnaire]);

  // 数据清理函数
  const cleanupData = useCallback((data: QuestionnaireData): QuestionnaireData => {
    const cleanedData = { ...data };

    Object.entries(branchConfig).forEach(([sectionId, config]) => {
      if (!branchState[sectionId]) {
        // 清理不活跃分支的数据
        config.fields.forEach(field => {
          delete cleanedData[field];
        });
      }
    });

    return cleanedData;
  }, [branchState, branchConfig]);

  // 验证数据一致性
  const validateConsistency = useCallback((data: QuestionnaireData): string[] => {
    const issues: string[] = [];

    // 检查必填字段
    activeFields.forEach(fieldId => {
      const section = questionnaire.sections.find(s => 
        s.questions.some(q => q.id === fieldId)
      );
      const question = section?.questions.find(q => q.id === fieldId);
      
      if (question?.required && !data[fieldId]) {
        issues.push(`字段 ${fieldId} 是必填的但未填写`);
      }
    });

    // 检查逻辑一致性
    if (data['primary-identity'] === 'unemployed-person' && data['current-activity'] === 'working-fulltime') {
      issues.push('身份为失业人员但状态为全职工作，存在逻辑矛盾');
    }

    if (data['primary-identity'] === 'current-student' && data['unemployment-duration']) {
      issues.push('在校学生不应该有失业时长信息');
    }

    return issues;
  }, [activeFields, questionnaire]);

  // 获取分支路径
  const getBranchPath = useCallback((): BranchPath => {
    return { ...branchPathRef.current };
  }, []);

  // 计算问卷完成度
  const calculateProgress = useCallback((data: QuestionnaireData): number => {
    const totalFields = activeFields.length;
    const completedFields = activeFields.filter(field => data[field]).length;
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [activeFields]);

  // 预测剩余时间
  const estimateRemainingTime = useCallback((data: QuestionnaireData): number => {
    const progress = calculateProgress(data);
    const remainingProgress = 100 - progress;
    
    // 基于问卷元数据的预估时间
    const totalEstimatedTime = questionnaire.metadata?.estimatedTime || 5;
    const remainingTime = (remainingProgress / 100) * totalEstimatedTime;
    
    return Math.max(0, remainingTime);
  }, [calculateProgress, questionnaire]);

  // 获取下一个应该填写的字段
  const getNextField = useCallback((data: QuestionnaireData): string | null => {
    for (const fieldId of activeFields) {
      if (!data[fieldId]) {
        return fieldId;
      }
    }
    return null;
  }, [activeFields]);

  // 检查字段是否活跃
  const isFieldActive = useCallback((fieldId: string): boolean => {
    return activeFields.includes(fieldId);
  }, [activeFields]);

  // 获取分支统计信息
  const getBranchStats = useCallback(() => {
    const totalSections = questionnaire.sections.length;
    const activeSections = Object.values(branchState).filter(Boolean).length;
    const conditionalSections = Object.keys(branchConfig).length;
    
    return {
      totalSections,
      activeSections,
      conditionalSections,
      branchingRate: conditionalSections / totalSections,
      activationRate: activeSections / totalSections
    };
  }, [branchState, branchConfig, questionnaire]);

  // 性能监控
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (executionTime > 100) {
        console.warn(`分支逻辑计算耗时过长: ${executionTime.toFixed(2)}ms`);
      }
    };
  }, [branchState]);

  return {
    // 状态
    branchState,
    activeFields,
    branchPath: getBranchPath(),
    
    // 方法
    cleanupData,
    validateConsistency,
    calculateProgress,
    estimateRemainingTime,
    getNextField,
    isFieldActive,
    getBranchStats,
    
    // 元数据
    stats: getBranchStats()
  };
};

/**
 * 条件评估函数
 */
function evaluateCondition(condition: any, data: QuestionnaireData): boolean {
  if (!condition) return true;

  if (condition.dependsOn && condition.operator && condition.value) {
    // 简单条件
    const fieldValue = data[condition.dependsOn];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not-equals':
        return fieldValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not-in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  if (condition.dependsOn && condition.operator === 'and' && condition.conditions) {
    // 复合条件 (AND)
    return condition.conditions.every((cond: any) => {
      const fieldValue = data[cond.field];
      
      switch (cond.operator) {
        case 'equals':
          return fieldValue === cond.value;
        case 'not-equals':
          return fieldValue !== cond.value;
        default:
          return false;
      }
    });
  }

  if (condition.dependsOn && condition.operator === 'or' && condition.conditions) {
    // 复合条件 (OR)
    return condition.conditions.some((cond: any) => {
      const fieldValue = data[cond.field];
      
      switch (cond.operator) {
        case 'equals':
          return fieldValue === cond.value;
        case 'not-equals':
          return fieldValue !== cond.value;
        default:
          return false;
      }
    });
  }

  return false;
}

/**
 * 获取条件依赖的字段
 */
function getDependencies(condition: any): string[] {
  const dependencies: string[] = [];

  if (condition.dependsOn) {
    if (typeof condition.dependsOn === 'string') {
      dependencies.push(condition.dependsOn);
    } else if (Array.isArray(condition.dependsOn)) {
      dependencies.push(...condition.dependsOn);
    }
  }

  if (condition.conditions) {
    condition.conditions.forEach((cond: any) => {
      if (cond.field) {
        dependencies.push(cond.field);
      }
    });
  }

  return [...new Set(dependencies)]; // 去重
}

export default useBranchLogic;

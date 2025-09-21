/**
 * 条件逻辑Hook
 * 处理问卷中的条件显示和动态选项
 */

import { useCallback, useMemo } from 'react';
import {
  shouldShowQuestion,
  getAvailableOptions,
  cleanupFormData,
  getFormValidationErrors,
  getQuestionHint,
  validateEducationSchoolCombination
} from '../utils/questionnaireLogic';

export interface UseConditionalLogicProps {
  formData: Record<string, any>;
  onFormDataChange: (newData: Record<string, any>) => void;
}

export interface UseConditionalLogicReturn {
  // 问题显示控制
  shouldShowQuestion: (questionId: string) => boolean;
  
  // 选项过滤
  getAvailableOptions: (
    questionId: string,
    originalOptions: Array<{ value: string; label: string }>
  ) => Array<{ value: string; label: string }>;
  
  // 表单数据处理
  handleFieldChange: (questionId: string, value: any) => void;
  
  // 验证
  getValidationErrors: () => Record<string, string>;
  getFieldError: (questionId: string) => string | null;
  
  // 提示信息
  getQuestionHint: (questionId: string) => string | null;
  
  // 特定验证
  validateEducationSchool: (educationLevel?: string, schoolType?: string) => {
    valid: boolean;
    message?: string;
  };
}

/**
 * 条件逻辑Hook
 */
export function useConditionalLogic({
  formData,
  onFormDataChange
}: UseConditionalLogicProps): UseConditionalLogicReturn {
  
  // 检查问题是否应该显示
  const checkShouldShowQuestion = useCallback((questionId: string): boolean => {
    return shouldShowQuestion(questionId, formData);
  }, [formData]);
  
  // 获取可用选项
  const getFilteredOptions = useCallback((
    questionId: string,
    originalOptions: Array<{ value: string; label: string }>
  ): Array<{ value: string; label: string }> => {
    return getAvailableOptions(questionId, formData, originalOptions);
  }, [formData]);
  
  // 处理字段变更
  const handleFieldChange = useCallback((questionId: string, value: any) => {
    const cleanedData = cleanupFormData(questionId, value, formData);
    onFormDataChange(cleanedData);
  }, [formData, onFormDataChange]);
  
  // 获取验证错误
  const validationErrors = useMemo(() => {
    return getFormValidationErrors(formData);
  }, [formData]);
  
  // 获取单个字段错误
  const getFieldError = useCallback((questionId: string): string | null => {
    return validationErrors[questionId] || null;
  }, [validationErrors]);
  
  // 获取问题提示
  const getHint = useCallback((questionId: string): string | null => {
    return getQuestionHint(questionId, formData);
  }, [formData]);
  
  // 验证学历-院校组合
  const validateEducationSchool = useCallback((
    educationLevel?: string,
    schoolType?: string
  ) => {
    const education = educationLevel || formData['education-level'];
    const school = schoolType || formData['university-tier'];
    return validateEducationSchoolCombination(education, school);
  }, [formData]);
  
  return {
    shouldShowQuestion: checkShouldShowQuestion,
    getAvailableOptions: getFilteredOptions,
    handleFieldChange,
    getValidationErrors: () => validationErrors,
    getFieldError,
    getQuestionHint: getHint,
    validateEducationSchool
  };
}

/**
 * 简化版Hook，仅用于验证
 */
export function useQuestionnaireValidation(formData: Record<string, any>) {
  const validationErrors = useMemo(() => {
    return getFormValidationErrors(formData);
  }, [formData]);
  
  const hasErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);
  
  const getFieldError = useCallback((questionId: string): string | null => {
    return validationErrors[questionId] || null;
  }, [validationErrors]);
  
  return {
    validationErrors,
    hasErrors,
    getFieldError
  };
}

/**
 * 选项过滤Hook
 */
export function useOptionFilter(
  questionId: string,
  originalOptions: Array<{ value: string; label: string }>,
  formData: Record<string, any>
) {
  const filteredOptions = useMemo(() => {
    return getAvailableOptions(questionId, formData, originalOptions);
  }, [questionId, originalOptions, formData]);
  
  const isDisabled = useMemo(() => {
    // 如果是院校类型问题，且没有选择学历，则禁用
    if (questionId === 'university-tier') {
      return !formData['education-level'];
    }
    return false;
  }, [questionId, formData]);
  
  const placeholder = useMemo(() => {
    if (questionId === 'university-tier' && !formData['education-level']) {
      return '请先选择学历层次';
    }
    return '请选择';
  }, [questionId, formData]);
  
  return {
    options: filteredOptions,
    isDisabled,
    placeholder
  };
}

/**
 * 表单清理Hook
 */
export function useFormCleaner(
  formData: Record<string, any>,
  onFormDataChange: (newData: Record<string, any>) => void
) {
  const cleanField = useCallback((questionId: string, value: any) => {
    const cleanedData = cleanupFormData(questionId, value, formData);
    onFormDataChange(cleanedData);
  }, [formData, onFormDataChange]);
  
  const cleanAllFields = useCallback(() => {
    let cleanedData = { ...formData };
    
    // 清理所有可能的不匹配数据
    Object.keys(cleanedData).forEach(questionId => {
      cleanedData = cleanupFormData(questionId, cleanedData[questionId], cleanedData);
    });
    
    onFormDataChange(cleanedData);
  }, [formData, onFormDataChange]);
  
  return {
    cleanField,
    cleanAllFields
  };
}

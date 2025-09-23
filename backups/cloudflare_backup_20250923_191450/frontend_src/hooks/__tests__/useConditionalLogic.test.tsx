/**
 * 条件逻辑Hook测试
 * 测试Hook的行为和状态管理
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import {
  useConditionalLogic,
  useQuestionnaireValidation,
  useOptionFilter,
  useFormCleaner
} from '../useConditionalLogic';

describe('useConditionalLogic Hook测试', () => {
  const mockOnFormDataChange = vi.fn();

  beforeEach(() => {
    mockOnFormDataChange.mockClear();
  });

  describe('useConditionalLogic', () => {
    test('应该正确检查问题显示条件', () => {
      const formData = { 'education-level': 'bachelor' };
      const { result } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      // 院校类型应该显示（有学历）
      expect(result.current.shouldShowQuestion('university-tier')).toBe(true);

      // 工作满意度不应该显示（没有就业状态）
      expect(result.current.shouldShowQuestion('job-satisfaction')).toBe(false);
    });

    test('应该正确过滤可用选项', () => {
      const formData = { 'education-level': 'bachelor' };
      const originalOptions = [
        { value: '985', label: '985高校' },
        { value: 'vocational', label: '专科院校' }
      ];

      const { result } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      const filteredOptions = result.current.getAvailableOptions('university-tier', originalOptions);
      expect(filteredOptions.map(o => o.value)).toContain('985');
      expect(filteredOptions.map(o => o.value)).not.toContain('vocational');
    });

    test('应该正确处理字段变更', () => {
      const formData = { 'education-level': 'bachelor', 'university-tier': '985' };
      const { result } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      act(() => {
        result.current.handleFieldChange('education-level', 'junior-college');
      });

      expect(mockOnFormDataChange).toHaveBeenCalledWith({
        'education-level': 'junior-college',
        'university-tier': null // 985被清空
      });
    });

    test('应该正确获取验证错误', () => {
      const formData = { 'education-level': 'junior-college', 'university-tier': '985' };
      const { result } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      const errors = result.current.getValidationErrors();
      expect(errors['university-tier']).toContain('不匹配');

      const fieldError = result.current.getFieldError('university-tier');
      expect(fieldError).toContain('不匹配');
    });

    test('应该正确验证学历-院校组合', () => {
      const formData = {};
      const { result } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      // 有效组合
      let validation = result.current.validateEducationSchool('bachelor', '985');
      expect(validation.valid).toBe(true);

      // 无效组合
      validation = result.current.validateEducationSchool('junior-college', '985');
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('不匹配');
    });

    test('formData变更时应该重新计算', () => {
      let formData = {};
      const { result, rerender } = renderHook(
        ({ formData }) => useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange }),
        { initialProps: { formData } }
      );

      // 初始状态：院校类型不显示
      expect(result.current.shouldShowQuestion('university-tier')).toBe(false);

      // 更新formData
      formData = { 'education-level': 'bachelor' };
      rerender({ formData });

      // 现在院校类型应该显示
      expect(result.current.shouldShowQuestion('university-tier')).toBe(true);
    });
  });

  describe('useQuestionnaireValidation', () => {
    test('应该正确检测验证错误', () => {
      const formData = { 'education-level': 'junior-college', 'university-tier': '985' };
      const { result } = renderHook(() => useQuestionnaireValidation(formData));

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.validationErrors['university-tier']).toContain('不匹配');
      expect(result.current.getFieldError('university-tier')).toContain('不匹配');
    });

    test('有效数据应该没有错误', () => {
      const formData = { 'education-level': 'bachelor', 'university-tier': '985' };
      const { result } = renderHook(() => useQuestionnaireValidation(formData));

      expect(result.current.hasErrors).toBe(false);
      expect(Object.keys(result.current.validationErrors)).toHaveLength(0);
      expect(result.current.getFieldError('university-tier')).toBeNull();
    });

    test('formData变更时应该重新验证', () => {
      let formData = { 'education-level': 'bachelor', 'university-tier': '985' };
      const { result, rerender } = renderHook(
        ({ formData }) => useQuestionnaireValidation(formData),
        { initialProps: { formData } }
      );

      // 初始状态：无错误
      expect(result.current.hasErrors).toBe(false);

      // 更新为无效组合
      formData = { 'education-level': 'junior-college', 'university-tier': '985' };
      rerender({ formData });

      // 现在应该有错误
      expect(result.current.hasErrors).toBe(true);
    });
  });

  describe('useOptionFilter', () => {
    const originalOptions = [
      { value: '985', label: '985高校' },
      { value: 'vocational', label: '专科院校' },
      { value: 'other', label: '其他' }
    ];

    test('应该正确过滤院校类型选项', () => {
      const formData = { 'education-level': 'bachelor' };
      const { result } = renderHook(() =>
        useOptionFilter('university-tier', originalOptions, formData)
      );

      expect(result.current.options.map(o => o.value)).toContain('985');
      expect(result.current.options.map(o => o.value)).not.toContain('vocational');
      expect(result.current.isDisabled).toBe(false);
      expect(result.current.placeholder).toBe('请选择');
    });

    test('没有学历时应该禁用院校选择', () => {
      const formData = {};
      const { result } = renderHook(() =>
        useOptionFilter('university-tier', originalOptions, formData)
      );

      expect(result.current.options).toEqual([]);
      expect(result.current.isDisabled).toBe(true);
      expect(result.current.placeholder).toBe('请先选择学历层次');
    });

    test('其他问题不应该被禁用', () => {
      const formData = {};
      const { result } = renderHook(() =>
        useOptionFilter('other-question', originalOptions, formData)
      );

      expect(result.current.options).toEqual(originalOptions);
      expect(result.current.isDisabled).toBe(false);
      expect(result.current.placeholder).toBe('请选择');
    });

    test('formData变更时应该重新过滤', () => {
      let formData = {};
      const { result, rerender } = renderHook(
        ({ formData }) => useOptionFilter('university-tier', originalOptions, formData),
        { initialProps: { formData } }
      );

      // 初始状态：禁用
      expect(result.current.isDisabled).toBe(true);

      // 选择学历后启用
      formData = { 'education-level': 'bachelor' };
      rerender({ formData });

      expect(result.current.isDisabled).toBe(false);
      expect(result.current.options.length).toBeGreaterThan(0);
    });
  });

  describe('useFormCleaner', () => {
    test('应该正确清理单个字段', () => {
      const formData = { 'education-level': 'bachelor', 'university-tier': '985' };
      const { result } = renderHook(() =>
        useFormCleaner(formData, mockOnFormDataChange)
      );

      act(() => {
        result.current.cleanField('education-level', 'junior-college');
      });

      expect(mockOnFormDataChange).toHaveBeenCalledWith({
        'education-level': 'junior-college',
        'university-tier': null
      });
    });

    test('应该正确清理所有字段', () => {
      const formData = { 
        'education-level': 'junior-college', 
        'university-tier': '985',
        'other-field': 'value'
      };
      const { result } = renderHook(() =>
        useFormCleaner(formData, mockOnFormDataChange)
      );

      act(() => {
        result.current.cleanAllFields();
      });

      expect(mockOnFormDataChange).toHaveBeenCalledWith({
        'education-level': 'junior-college',
        'university-tier': null, // 被清理
        'other-field': 'value'
      });
    });

    test('formData变更时应该使用新数据', () => {
      let formData = { 'education-level': 'bachelor', 'university-tier': '985' };
      const { result, rerender } = renderHook(
        ({ formData }) => useFormCleaner(formData, mockOnFormDataChange),
        { initialProps: { formData } }
      );

      // 更新formData
      formData = { 'education-level': 'master', 'university-tier': '985' };
      rerender({ formData });

      act(() => {
        result.current.cleanField('education-level', 'junior-college');
      });

      // 应该基于新的formData进行清理
      expect(mockOnFormDataChange).toHaveBeenCalledWith({
        'education-level': 'junior-college',
        'university-tier': null
      });
    });
  });

  describe('Hook集成测试', () => {
    test('多个Hook协同工作', () => {
      const formData = { 'education-level': 'bachelor' };
      
      // 使用条件逻辑Hook
      const { result: logicResult } = renderHook(() =>
        useConditionalLogic({ formData, onFormDataChange: mockOnFormDataChange })
      );

      // 使用验证Hook
      const { result: validationResult } = renderHook(() =>
        useQuestionnaireValidation(formData)
      );

      // 使用选项过滤Hook
      const originalOptions = [
        { value: '985', label: '985高校' },
        { value: 'vocational', label: '专科院校' }
      ];
      const { result: filterResult } = renderHook(() =>
        useOptionFilter('university-tier', originalOptions, formData)
      );

      // 验证协同效果
      expect(logicResult.current.shouldShowQuestion('university-tier')).toBe(true);
      expect(validationResult.current.hasErrors).toBe(false);
      expect(filterResult.current.isDisabled).toBe(false);
      expect(filterResult.current.options.map(o => o.value)).toContain('985');
    });
  });
});

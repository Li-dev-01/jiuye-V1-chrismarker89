/**
 * ConditionalSelect组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { ConditionalSelect, ConditionalRadio } from '../questionnaire/ConditionalSelect';

// Mock useOptionFilter hook
vi.mock('../../hooks/useConditionalLogic', () => ({
  useOptionFilter: vi.fn()
}));

import { useOptionFilter } from '../../hooks/useConditionalLogic';

describe('ConditionalSelect组件', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { value: '985', label: '985高校' },
    { value: '211', label: '211高校（非985）' },
    { value: 'vocational', label: '专科院校' }
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.mocked(useOptionFilter).mockReturnValue({
      options: mockOptions,
      isDisabled: false,
      placeholder: '请选择'
    });
  });

  test('应该正确渲染选择组件', () => {
    render(
      <ConditionalSelect
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('共 3 个选项可选')).toBeInTheDocument();
  });

  test('应该在禁用时显示提示信息', () => {
    vi.mocked(useOptionFilter).mockReturnValue({
      options: [],
      isDisabled: true,
      placeholder: '请先选择学历层次'
    });

    render(
      <ConditionalSelect
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{}}
      />
    );

    expect(screen.getByText('请先选择您的学历层次，然后选择对应的院校类型')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('应该在选项变化时清空无效值', () => {
    const { rerender } = render(
      <ConditionalSelect
        questionId="university-tier"
        value="985"
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    // 模拟选项变化，985不再可用
    vi.mocked(useOptionFilter).mockReturnValue({
      options: [{ value: 'vocational', label: '专科院校' }],
      isDisabled: false,
      placeholder: '请选择'
    });

    rerender(
      <ConditionalSelect
        questionId="university-tier"
        value="985"
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'junior-college' }}
      />
    );

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  test('应该支持搜索功能', async () => {
    render(
      <ConditionalSelect
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    // 输入搜索文本
    fireEvent.change(select, { target: { value: '985' } });

    await waitFor(() => {
      expect(screen.getByText('985高校')).toBeInTheDocument();
    });
  });
});

describe('ConditionalRadio组件', () => {
  const mockOnChange = vi.fn();
  const mockOptions = [
    { value: '985', label: '985高校' },
    { value: '211', label: '211高校（非985）' }
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.mocked(useOptionFilter).mockReturnValue({
      options: mockOptions,
      isDisabled: false,
      placeholder: '请选择'
    });
  });

  test('应该正确渲染单选组件', () => {
    render(
      <ConditionalRadio
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    expect(screen.getByLabelText('985高校')).toBeInTheDocument();
    expect(screen.getByLabelText('211高校（非985）')).toBeInTheDocument();
  });

  test('应该正确处理选择变更', () => {
    render(
      <ConditionalRadio
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    const radio985 = screen.getByLabelText('985高校');
    fireEvent.click(radio985);

    expect(mockOnChange).toHaveBeenCalledWith('985');
  });

  test('应该正确显示选中状态', () => {
    render(
      <ConditionalRadio
        questionId="university-tier"
        value="985"
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    const radio985 = screen.getByLabelText('985高校') as HTMLInputElement;
    expect(radio985.checked).toBe(true);

    const radio211 = screen.getByLabelText('211高校（非985）') as HTMLInputElement;
    expect(radio211.checked).toBe(false);
  });

  test('应该在禁用时显示提示', () => {
    vi.mocked(useOptionFilter).mockReturnValue({
      options: [],
      isDisabled: true,
      placeholder: '请先选择学历层次'
    });

    render(
      <ConditionalRadio
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{}}
      />
    );

    expect(screen.getByText('请先选择您的学历层次')).toBeInTheDocument();
    expect(screen.getByText('暂无可选项')).toBeInTheDocument();
  });

  test('应该在选项变化时清空无效值', () => {
    const { rerender } = render(
      <ConditionalRadio
        questionId="university-tier"
        value="985"
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
      />
    );

    // 模拟选项变化
    vi.mocked(useOptionFilter).mockReturnValue({
      options: [{ value: 'vocational', label: '专科院校' }],
      isDisabled: false,
      placeholder: '请选择'
    });

    rerender(
      <ConditionalRadio
        questionId="university-tier"
        value="985"
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'junior-college' }}
      />
    );

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('应该支持禁用状态', () => {
    render(
      <ConditionalRadio
        questionId="university-tier"
        value=""
        onChange={mockOnChange}
        options={mockOptions}
        formData={{ 'education-level': 'bachelor' }}
        disabled={true}
      />
    );

    const radio985 = screen.getByLabelText('985高校') as HTMLInputElement;
    expect(radio985.disabled).toBe(true);
  });
});

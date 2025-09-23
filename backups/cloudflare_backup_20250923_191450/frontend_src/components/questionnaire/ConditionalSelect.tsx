/**
 * 条件选择组件
 * 支持基于其他字段值的动态选项过滤
 */

import React, { useEffect, useMemo } from 'react';
import { Select, Alert } from 'antd';
import { useOptionFilter } from '../../hooks/useConditionalLogic';

const { Option } = Select;

export interface ConditionalSelectProps {
  questionId: string;
  value?: string;
  onChange: (value: string | null) => void;
  options: Array<{ value: string; label: string }>;
  formData: Record<string, any>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 条件选择组件
 */
export const ConditionalSelect: React.FC<ConditionalSelectProps> = ({
  questionId,
  value,
  onChange,
  options,
  formData,
  placeholder,
  required = false,
  disabled = false,
  size = 'middle',
  style,
  className
}) => {
  const {
    options: filteredOptions,
    isDisabled,
    placeholder: dynamicPlaceholder
  } = useOptionFilter(questionId, options, formData);

  // 当选项变化时，检查当前值是否仍然有效
  useEffect(() => {
    if (value && filteredOptions.length > 0) {
      const isCurrentValueValid = filteredOptions.some(option => option.value === value);
      if (!isCurrentValueValid) {
        onChange(null); // 清空无效值
      }
    }
  }, [value, filteredOptions, onChange]);

  // 显示提示信息
  const showHint = useMemo(() => {
    if (questionId === 'university-tier' && !formData['education-level']) {
      return true;
    }
    return false;
  }, [questionId, formData]);

  const hintMessage = useMemo(() => {
    if (questionId === 'university-tier' && !formData['education-level']) {
      return '请先选择您的学历层次，然后选择对应的院校类型';
    }
    return '';
  }, [questionId, formData]);

  return (
    <div className="conditional-select">
      {showHint && (
        <Alert
          message={hintMessage}
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
          size="small"
        />
      )}
      
      <Select
        value={value}
        onChange={onChange}
        placeholder={dynamicPlaceholder || placeholder}
        disabled={disabled || isDisabled}
        size={size}
        style={{ width: '100%', ...style }}
        className={className}
        allowClear
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
        }
      >
        {filteredOptions.map(option => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      
      {/* 显示可用选项数量 */}
      {filteredOptions.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          共 {filteredOptions.length} 个选项可选
        </div>
      )}
    </div>
  );
};

/**
 * 条件单选组件
 */
export interface ConditionalRadioProps {
  questionId: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  formData: Record<string, any>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ConditionalRadio: React.FC<ConditionalRadioProps> = ({
  questionId,
  value,
  onChange,
  options,
  formData,
  required = false,
  disabled = false,
  className
}) => {
  const {
    options: filteredOptions,
    isDisabled
  } = useOptionFilter(questionId, options, formData);

  // 当选项变化时，检查当前值是否仍然有效
  useEffect(() => {
    if (value && filteredOptions.length > 0) {
      const isCurrentValueValid = filteredOptions.some(option => option.value === value);
      if (!isCurrentValueValid) {
        onChange(''); // 清空无效值
      }
    }
  }, [value, filteredOptions, onChange]);

  // 显示提示信息
  const showHint = useMemo(() => {
    if (questionId === 'university-tier' && !formData['education-level']) {
      return true;
    }
    return false;
  }, [questionId, formData]);

  const hintMessage = useMemo(() => {
    if (questionId === 'university-tier' && !formData['education-level']) {
      return '请先选择您的学历层次';
    }
    return '';
  }, [questionId, formData]);

  if (showHint) {
    return (
      <div className="conditional-radio">
        <Alert
          message={hintMessage}
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
        />
        <div className="text-gray-400">
          {filteredOptions.length === 0 ? '暂无可选项' : `${filteredOptions.length} 个选项待选择`}
        </div>
      </div>
    );
  }

  return (
    <div className={`conditional-radio space-y-2 ${className || ''}`}>
      {filteredOptions.map(option => (
        <label
          key={option.value}
          className={`flex items-center space-x-2 cursor-pointer p-2 rounded border transition-colors ${
            value === option.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${disabled || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={questionId}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isDisabled}
            className="text-blue-600"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default ConditionalSelect;

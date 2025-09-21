/**
 * 验证提示组件
 * 显示表单验证错误和提示信息
 */

import React from 'react';
import { Alert, Space } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

export interface ValidationAlertProps {
  errors: Record<string, string>;
  hints?: Record<string, string>;
  showSummary?: boolean;
  className?: string;
}

/**
 * 验证提示组件
 */
export const ValidationAlert: React.FC<ValidationAlertProps> = ({
  errors,
  hints = {},
  showSummary = true,
  className
}) => {
  const hasErrors = Object.keys(errors).length > 0;
  const hasHints = Object.keys(hints).length > 0;

  if (!hasErrors && !hasHints) {
    return null;
  }

  return (
    <div className={`validation-alert ${className || ''}`}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 错误信息 */}
        {hasErrors && (
          <Alert
            message="请检查以下问题"
            description={
              <ul className="mb-0 pl-4">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field} className="text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            }
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
            closable={false}
          />
        )}

        {/* 提示信息 */}
        {hasHints && (
          <Alert
            message="温馨提示"
            description={
              <ul className="mb-0 pl-4">
                {Object.entries(hints).map(([field, message]) => (
                  <li key={field} className="text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            closable
          />
        )}
      </Space>
    </div>
  );
};

/**
 * 字段级验证提示组件
 */
export interface FieldValidationProps {
  error?: string;
  hint?: string;
  showError?: boolean;
  showHint?: boolean;
  className?: string;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  error,
  hint,
  showError = true,
  showHint = true,
  className
}) => {
  if (!error && !hint) {
    return null;
  }

  return (
    <div className={`field-validation mt-1 ${className || ''}`}>
      {error && showError && (
        <div className="text-red-500 text-xs flex items-center">
          <ExclamationCircleOutlined className="mr-1" />
          {error}
        </div>
      )}
      
      {hint && showHint && !error && (
        <div className="text-blue-500 text-xs flex items-center">
          <InfoCircleOutlined className="mr-1" />
          {hint}
        </div>
      )}
    </div>
  );
};

/**
 * 实时验证状态组件
 */
export interface ValidationStatusProps {
  isValid: boolean;
  isValidating?: boolean;
  message?: string;
  size?: 'small' | 'default';
}

export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isValid,
  isValidating = false,
  message,
  size = 'default'
}) => {
  if (isValidating) {
    return (
      <div className={`validation-status ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        <span className="text-blue-500">验证中...</span>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className={`validation-status ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
      <span className={isValid ? 'text-green-500' : 'text-red-500'}>
        {message}
      </span>
    </div>
  );
};

/**
 * 表单验证摘要组件
 */
export interface ValidationSummaryProps {
  errors: Record<string, string>;
  totalFields: number;
  validFields: number;
  showProgress?: boolean;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  totalFields,
  validFields,
  showProgress = true,
  className
}) => {
  const errorCount = Object.keys(errors).length;
  const progressPercentage = totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0;

  return (
    <div className={`validation-summary p-3 bg-gray-50 rounded ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">表单验证状态</span>
        {showProgress && (
          <span className="text-xs text-gray-500">
            {validFields}/{totalFields} 项已完成
          </span>
        )}
      </div>

      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className="flex justify-between text-xs">
        <span className="text-green-600">
          ✓ {validFields} 项有效
        </span>
        {errorCount > 0 && (
          <span className="text-red-600">
            ✗ {errorCount} 项需要修正
          </span>
        )}
      </div>

      {errorCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-red-600">
            需要修正的问题：
          </div>
          <ul className="text-xs text-red-500 mt-1 pl-4">
            {Object.entries(errors).slice(0, 3).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
            {errorCount > 3 && (
              <li>还有 {errorCount - 3} 个问题...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationAlert;

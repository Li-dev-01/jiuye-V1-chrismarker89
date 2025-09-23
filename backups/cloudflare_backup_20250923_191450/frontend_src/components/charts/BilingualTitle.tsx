/**
 * 双语标题组件
 * 支持中英文上下结构显示
 */

import React from 'react';
import { getBilingualTitle } from '../../config/bilingualTitleMapping';

export interface BilingualTitleProps {
  title: string;
  level?: 1 | 2 | 3 | 4 | 5;
  style?: React.CSSProperties;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const BilingualTitle: React.FC<BilingualTitleProps> = ({
  title,
  level = 4,
  style = {},
  className = '',
  align = 'left'
}) => {
  const bilingual = getBilingualTitle(title);
  
  const titleStyle: React.CSSProperties = {
    margin: 0,
    lineHeight: 1.2,
    textAlign: align,
    ...style
  };

  const chineseStyle: React.CSSProperties = {
    fontSize: level === 1 ? '24px' : level === 2 ? '20px' : level === 3 ? '18px' : level === 4 ? '16px' : '14px',
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: '2px'
  };

  const englishStyle: React.CSSProperties = {
    fontSize: level === 1 ? '16px' : level === 2 ? '14px' : level === 3 ? '13px' : level === 4 ? '12px' : '11px',
    fontWeight: 'normal',
    color: '#8c8c8c',
    fontStyle: 'italic'
  };

  return (
    <div style={titleStyle} className={className}>
      <div style={chineseStyle}>
        {bilingual.chinese}
      </div>
      <div style={englishStyle}>
        {bilingual.english}
      </div>
    </div>
  );
};

/**
 * 双语数据标签组件（用于图表内部）
 */
export interface BilingualDataLabelProps {
  label: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
  compact?: boolean;
}

export const BilingualDataLabel: React.FC<BilingualDataLabelProps> = ({
  label,
  style = {},
  align = 'center',
  compact = false
}) => {
  const bilingual = getBilingualTitle(label);
  
  const containerStyle: React.CSSProperties = {
    textAlign: align,
    lineHeight: compact ? 1.1 : 1.2,
    ...style
  };

  const chineseStyle: React.CSSProperties = {
    fontSize: compact ? '11px' : '12px',
    fontWeight: 'normal',
    color: '#262626',
    marginBottom: compact ? '1px' : '2px'
  };

  const englishStyle: React.CSSProperties = {
    fontSize: compact ? '9px' : '10px',
    fontWeight: 'normal',
    color: '#8c8c8c',
    fontStyle: 'italic'
  };

  return (
    <div style={containerStyle}>
      <div style={chineseStyle}>
        {bilingual.chinese}
      </div>
      <div style={englishStyle}>
        ({bilingual.english})
      </div>
    </div>
  );
};

import React from 'react';
import { Tag, Tooltip, Badge } from 'antd';
import { DatabaseOutlined, CloudOutlined, ExperimentOutlined } from '@ant-design/icons';
import { 
  getCurrentDataSource, 
  getDataSourceDisplayName, 
  getDataSourceColor, 
  getDataSourceDescription 
} from '../config/dataSourceConfig';

interface DataSourceIndicatorProps {
  style?: React.CSSProperties;
  size?: 'small' | 'default';
  showDescription?: boolean;
}

/**
 * 数据源指示器组件
 * 显示当前使用的数据源类型（模拟数据 vs 真实数据）
 */
export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  style,
  size = 'default',
  showDescription = false
}) => {
  const dataSource = getCurrentDataSource();
  const displayName = getDataSourceDisplayName();
  const color = getDataSourceColor();
  const description = getDataSourceDescription();

  const getIcon = () => {
    switch (dataSource) {
      case 'api':
        return <DatabaseOutlined />;
      case 'mock':
        return <ExperimentOutlined />;
      default:
        return <CloudOutlined />;
    }
  };

  const getStatusDot = () => {
    return dataSource === 'api' ? 'success' : 'warning';
  };

  if (showDescription) {
    return (
      <div style={style}>
        <Badge status={getStatusDot()} />
        <span style={{ marginLeft: 8 }}>
          {getIcon()} {displayName}
        </span>
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: 4,
          marginLeft: 16 
        }}>
          {description}
        </div>
      </div>
    );
  }

  return (
    <Tooltip title={description}>
      <Tag 
        icon={getIcon()} 
        color={color} 
        style={style}
        size={size}
      >
        {displayName}
      </Tag>
    </Tooltip>
  );
};

export default DataSourceIndicator;

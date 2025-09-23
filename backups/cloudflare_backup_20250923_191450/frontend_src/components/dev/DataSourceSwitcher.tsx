/**
 * 数据源切换器组件（仅开发环境）
 * 允许开发者在模拟数据和真实API之间切换
 */

import React from 'react';
import { Button, Space, Tag, Tooltip, Modal } from 'antd';
import { SwapOutlined, DatabaseOutlined, CloudOutlined } from '@ant-design/icons';
import { 
  getDataSourceStatus, 
  switchDataSource, 
  type DataSourceType 
} from '../../config/dataSourceConfig';

interface DataSourceSwitcherProps {
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
}

const DataSourceSwitcher: React.FC<DataSourceSwitcherProps> = ({ 
  style, 
  size = 'small' 
}) => {
  // 只在开发环境显示
  if (!import.meta.env.DEV) {
    return null;
  }

  const status = getDataSourceStatus();

  const handleSwitch = () => {
    const newSource: DataSourceType = status.type === 'mock' ? 'api' : 'mock';
    
    Modal.confirm({
      title: '切换数据源',
      content: `确定要切换到${newSource === 'mock' ? '模拟数据' : '真实API'}吗？页面将会刷新。`,
      onOk: () => {
        switchDataSource(newSource);
      },
      okText: '确定',
      cancelText: '取消'
    });
  };

  const getIcon = () => {
    return status.type === 'mock' ? <DatabaseOutlined /> : <CloudOutlined />;
  };

  const getTooltipContent = () => {
    return (
      <div>
        <div><strong>当前数据源:</strong> {status.displayName}</div>
        <div><strong>描述:</strong> {status.description}</div>
        <div><strong>可切换:</strong> {status.canSwitch ? '是' : '否'}</div>
      </div>
    );
  };

  return (
    <div style={style}>
      <Space size="small">
        <Tag 
          color={status.color}
          icon={getIcon()}
        >
          {status.displayName}
        </Tag>
        
        {status.canSwitch && (
          <Tooltip title={getTooltipContent()} placement="bottom">
            <Button
              type="text"
              size={size}
              icon={<SwapOutlined />}
              onClick={handleSwitch}
            >
              切换
            </Button>
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default DataSourceSwitcher;

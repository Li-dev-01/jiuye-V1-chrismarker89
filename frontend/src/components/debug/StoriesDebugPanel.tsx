import React from 'react';
import { Card, Descriptions, Tag, Space, Button } from 'antd';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';

interface StoriesDebugPanelProps {
  stories: any[];
  featuredStories: any[];
  loading: boolean;
  featuredLoading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  selectedCategory: string;
  selectedTags: string[];
  sortBy: string;
  onReload: () => void;
}

export const StoriesDebugPanel: React.FC<StoriesDebugPanelProps> = ({
  stories,
  featuredStories,
  loading,
  featuredLoading,
  total,
  currentPage,
  pageSize,
  selectedCategory,
  selectedTags,
  sortBy,
  onReload
}) => {
  const debugInfo = {
    '故事数据': {
      '普通故事数量': stories.length,
      '精选故事数量': featuredStories.length,
      '总数': total,
      '当前页': currentPage,
      '每页大小': pageSize
    },
    '加载状态': {
      '普通故事加载中': loading ? '是' : '否',
      '精选故事加载中': featuredLoading ? '是' : '否'
    },
    '筛选条件': {
      '选中分类': selectedCategory || '无',
      '选中标签': selectedTags.length > 0 ? selectedTags.join(', ') : '无',
      '排序方式': sortBy
    },
    '渲染条件': {
      '显示精选区域': featuredStories.length > 0 ? '是' : '否',
      '显示故事列表': stories.length > 0 ? '是' : '否',
      '显示空状态': stories.length === 0 && !loading ? '是' : '否'
    }
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          故事页面调试信息
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={onReload}
          >
            重新加载
          </Button>
        </Space>
      }
      style={{ 
        marginBottom: 16,
        border: '2px solid #ff4d4f',
        backgroundColor: '#fff2f0'
      }}
    >
      {Object.entries(debugInfo).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Tag color="blue" style={{ marginBottom: 8 }}>{category}</Tag>
          <Descriptions size="small" column={2}>
            {Object.entries(items).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                <Tag color={
                  typeof value === 'string' && value.includes('是') ? 'green' :
                  typeof value === 'string' && value.includes('否') ? 'red' :
                  typeof value === 'number' && value > 0 ? 'green' :
                  typeof value === 'number' && value === 0 ? 'orange' :
                  'default'
                }>
                  {String(value)}
                </Tag>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      ))}
      
      {/* 故事数据预览 */}
      {stories.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Tag color="purple">故事数据预览</Tag>
          <pre style={{ 
            fontSize: 12, 
            backgroundColor: '#f5f5f5', 
            padding: 8, 
            borderRadius: 4,
            maxHeight: 200,
            overflow: 'auto'
          }}>
            {JSON.stringify(stories.slice(0, 2), null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};

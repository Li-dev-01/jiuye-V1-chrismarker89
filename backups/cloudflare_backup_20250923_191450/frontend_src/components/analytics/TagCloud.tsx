/**
 * 标签云组件
 * 可视化展示标签使用情况
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin, Empty, Select, Space, Typography } from 'antd';
import { TagOutlined, FireOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface TagData {
  id: string;
  tag_name: string;
  usage_count: number;
  color: string;
  content_type: string;
}

interface TagCloudProps {
  tags: TagData[];
  loading?: boolean;
  onTagClick?: (tag: TagData) => void;
  height?: number;
  contentType?: string;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  loading = false,
  onTagClick,
  height = 400,
  contentType = 'all'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filteredTags, setFilteredTags] = useState<TagData[]>([]);
  const [sortBy, setSortBy] = useState<'usage' | 'name'>('usage');

  // 过滤和排序标签
  useEffect(() => {
    let filtered = tags;
    
    // 按内容类型过滤
    if (contentType !== 'all') {
      filtered = tags.filter(tag => 
        tag.content_type === contentType || tag.content_type === 'all'
      );
    }
    
    // 排序
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'usage') {
        return b.usage_count - a.usage_count;
      } else {
        return a.tag_name.localeCompare(b.tag_name);
      }
    });
    
    setFilteredTags(filtered);
  }, [tags, contentType, sortBy]);

  // 计算标签大小
  const getTagSize = (usage: number, maxUsage: number, minUsage: number) => {
    const minSize = 12;
    const maxSize = 32;
    const range = maxUsage - minUsage;
    
    if (range === 0) return minSize;
    
    const ratio = (usage - minUsage) / range;
    return minSize + (maxSize - minSize) * ratio;
  };

  // 获取标签透明度
  const getTagOpacity = (usage: number, maxUsage: number) => {
    const minOpacity = 0.6;
    const maxOpacity = 1.0;
    const ratio = usage / maxUsage;
    return minOpacity + (maxOpacity - minOpacity) * ratio;
  };

  // 渲染标签云
  const renderTagCloud = () => {
    if (filteredTags.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无标签数据"
        />
      );
    }

    const maxUsage = Math.max(...filteredTags.map(tag => tag.usage_count));
    const minUsage = Math.min(...filteredTags.map(tag => tag.usage_count));

    return (
      <div
        ref={containerRef}
        style={{
          height: height,
          overflow: 'auto',
          padding: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '8px'
        }}
      >
        {filteredTags.map((tag) => {
          const fontSize = getTagSize(tag.usage_count, maxUsage, minUsage);
          const opacity = getTagOpacity(tag.usage_count, maxUsage);
          
          return (
            <span
              key={tag.id}
              style={{
                fontSize: `${fontSize}px`,
                color: tag.color,
                opacity: opacity,
                cursor: onTagClick ? 'pointer' : 'default',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${tag.color}20`,
                transition: 'all 0.3s ease',
                fontWeight: tag.usage_count > maxUsage * 0.7 ? 'bold' : 'normal',
                textShadow: tag.usage_count > maxUsage * 0.8 ? '1px 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
              onClick={() => onTagClick?.(tag)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={`${tag.tag_name} (使用 ${tag.usage_count} 次)`}
            >
              {tag.usage_count > maxUsage * 0.8 && (
                <FireOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
              )}
              {tag.tag_name}
              <span style={{ 
                fontSize: '10px', 
                marginLeft: '4px',
                opacity: 0.7
              }}>
                {tag.usage_count}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title={
        <Space>
          <TagOutlined />
          <span>标签云</span>
          <Text type="secondary">({filteredTags.length} 个标签)</Text>
        </Space>
      }
      extra={
        <Space>
          <Select
            value={sortBy}
            onChange={setSortBy}
            size="small"
            style={{ width: 100 }}
          >
            <Option value="usage">按热度</Option>
            <Option value="name">按名称</Option>
          </Select>
        </Space>
      }
      bodyStyle={{ padding: 0 }}
    >
      {loading ? (
        <div style={{ 
          height: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Spin size="large" />
        </div>
      ) : (
        renderTagCloud()
      )}
    </Card>
  );
};

export default TagCloud;

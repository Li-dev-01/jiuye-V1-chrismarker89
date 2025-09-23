/**
 * 智能标签选择器组件
 * 提供智能推荐、分类筛选、自定义标签等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import {
  TagsOutlined,
  PlusOutlined,
  BulbOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface TagCategory {
  name: string;
  tags: string[];
}

interface SmartTagSelectorProps {
  categories?: { [key: string]: TagCategory };
  popularTags?: string[];
  selectedTags: string[];
  maxTags?: number;
  onTagsChange: (tags: string[]) => void;
  contentForRecommendation?: string;
  selectedCategory?: string;
  placeholder?: string;
}

export const SmartTagSelector: React.FC<SmartTagSelectorProps> = ({
  categories = {},
  popularTags = [],
  selectedTags,
  maxTags = 5,
  onTagsChange,
  contentForRecommendation = '',
  selectedCategory = '',
  placeholder = '输入自定义标签...'
}) => {
  const [customTag, setCustomTag] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(true);

  // 获取智能推荐标签
  const getSmartRecommendations = (): string[] => {
    if (!selectedCategory || !contentForRecommendation) return [];
    
    const categoryTags = categories[selectedCategory]?.tags || [];
    const content = contentForRecommendation.toLowerCase();
    
    // 基于内容关键词匹配
    const contentBasedTags = categoryTags.filter(tag => {
      const tagLower = tag.toLowerCase();
      return content.includes(tagLower) || 
             content.split(' ').some(word => word.includes(tagLower.split('')[0]));
    });
    
    // 结合热门标签
    const popularMatches = popularTags.filter(tag => 
      content.includes(tag.toLowerCase())
    );
    
    // 合并推荐，排除已选择的标签
    const recommendations = [...new Set([...contentBasedTags, ...popularMatches])]
      .filter(tag => !selectedTags.includes(tag))
      .slice(0, 6);
    
    return recommendations;
  };

  // 处理标签选择
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (!trimmedTag) return;
    
    if (selectedTags.includes(trimmedTag)) {
      setCustomTag('');
      return;
    }
    
    if (selectedTags.length >= maxTags) {
      return;
    }
    
    onTagsChange([...selectedTags, trimmedTag]);
    setCustomTag('');
  };

  // 获取当前分类的标签
  const getCurrentCategoryTags = (): string[] => {
    if (!selectedCategory) return [];
    return categories[selectedCategory]?.tags || [];
  };

  const smartRecommendations = getSmartRecommendations();
  const categoryTags = getCurrentCategoryTags();

  return (
    <div className="smart-tag-selector">
      {/* 已选择的标签 */}
      <Card size="small" title={
        <Space>
          <TagsOutlined />
          <span>已选择标签 ({selectedTags.length}/{maxTags})</span>
        </Space>
      }>
        {selectedTags.length > 0 ? (
          <Space wrap>
            {selectedTags.map(tag => (
              <Tag
                key={tag}
                closable
                color="blue"
                onClose={() => handleTagSelect(tag)}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">暂未选择标签</Text>
        )}
      </Card>

      {/* 智能推荐 */}
      {smartRecommendations.length > 0 && (
        <Card 
          size="small" 
          title={
            <Space>
              <BulbOutlined style={{ color: '#faad14' }} />
              <span>智能推荐</span>
              <Tooltip title="基于您的内容和分类智能推荐">
                <StarOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            </Space>
          }
          style={{ marginTop: 12 }}
        >
          <Space wrap>
            {smartRecommendations.map(tag => (
              <Tag.CheckableTag
                key={tag}
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagSelect(tag)}
                style={{
                  border: '1px solid #faad14',
                  color: selectedTags.includes(tag) ? '#fff' : '#faad14',
                  backgroundColor: selectedTags.includes(tag) ? '#faad14' : '#fff'
                }}
              >
                {tag}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Card>
      )}

      {/* 热门标签 */}
      {popularTags.length > 0 && (
        <Card 
          size="small" 
          title={
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>热门标签</span>
            </Space>
          }
          style={{ marginTop: 12 }}
        >
          <Space wrap>
            {popularTags.slice(0, 8).map(tag => (
              <Tag.CheckableTag
                key={tag}
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagSelect(tag)}
              >
                {tag}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Card>
      )}

      {/* 分类标签 */}
      {categoryTags.length > 0 && (
        <Card 
          size="small" 
          title={
            <Space>
              <TagsOutlined />
              <span>{categories[selectedCategory]?.name || '分类标签'}</span>
            </Space>
          }
          style={{ marginTop: 12 }}
        >
          <Space wrap>
            {categoryTags.map(tag => (
              <Tag.CheckableTag
                key={tag}
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagSelect(tag)}
              >
                {tag}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Card>
      )}

      {/* 自定义标签输入 */}
      <Card 
        size="small" 
        title={
          <Space>
            <PlusOutlined />
            <span>自定义标签</span>
          </Space>
        }
        style={{ marginTop: 12 }}
      >
        <Row gutter={8}>
          <Col flex="auto">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder={placeholder}
              onPressEnter={handleAddCustomTag}
              maxLength={20}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomTag}
              disabled={!customTag.trim() || selectedTags.length >= maxTags}
            >
              添加
            </Button>
          </Col>
        </Row>
        
        {selectedTags.length >= maxTags && (
          <Alert
            message={`最多只能选择 ${maxTags} 个标签`}
            type="warning"
            size="small"
            style={{ marginTop: 8 }}
          />
        )}
      </Card>
    </div>
  );
};

export default SmartTagSelector;

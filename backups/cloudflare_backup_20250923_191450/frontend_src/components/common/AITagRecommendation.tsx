/**
 * AI标签推荐组件
 * 基于内容分析推荐相关标签
 */

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Space, Spin, message, Tooltip } from 'antd';
import { RobotOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ManagementAdminService } from '../../services/ManagementAdminService';

interface TagRecommendation {
  tag_key: string;
  tag_name: string;
  confidence: number;
  reason: string;
}

interface AITagRecommendationProps {
  content: string;
  title?: string;
  contentType?: 'story' | 'heart_voice';
  selectedTags: string[];
  onTagSelect: (tagKey: string) => void;
  onTagDeselect: (tagKey: string) => void;
  disabled?: boolean;
}

export const AITagRecommendation: React.FC<AITagRecommendationProps> = ({
  content,
  title,
  contentType = 'story',
  selectedTags,
  onTagSelect,
  onTagDeselect,
  disabled = false
}) => {
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // 获取AI推荐
  const getRecommendations = async () => {
    if (!content.trim() || content.length < 10) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/content/tags/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title,
          content_type: contentType
        })
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data || []);
        setVisible(data.data?.length > 0);
      }
    } catch (error) {
      console.error('获取AI推荐失败:', error);
      message.error('AI推荐服务暂时不可用');
    } finally {
      setLoading(false);
    }
  };

  // 当内容变化时自动获取推荐
  useEffect(() => {
    const timer = setTimeout(() => {
      getRecommendations();
    }, 1000); // 防抖1秒

    return () => clearTimeout(timer);
  }, [content, title]);

  // 处理标签选择
  const handleTagClick = (recommendation: TagRecommendation) => {
    const isSelected = selectedTags.includes(recommendation.tag_key);
    
    if (isSelected) {
      onTagDeselect(recommendation.tag_key);
    } else {
      onTagSelect(recommendation.tag_key);
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#52c41a'; // 绿色 - 高置信度
    if (confidence >= 0.6) return '#faad14'; // 橙色 - 中等置信度
    return '#1890ff'; // 蓝色 - 低置信度
  };

  // 获取置信度文本
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return '高度匹配';
    if (confidence >= 0.6) return '较好匹配';
    return '可能匹配';
  };

  if (!visible && !loading) {
    return (
      <Button
        type="dashed"
        icon={<RobotOutlined />}
        onClick={getRecommendations}
        loading={loading}
        disabled={disabled || !content.trim()}
        style={{ width: '100%', marginBottom: 16 }}
      >
        AI智能推荐标签
      </Button>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>AI推荐标签</span>
          {loading && <Spin size="small" />}
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={() => setVisible(false)}
        />
      }
      style={{ marginBottom: 16 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
          <div style={{ marginTop: 8, color: '#666' }}>
            AI正在分析内容...
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <div>
          <div style={{ marginBottom: 12, fontSize: '12px', color: '#666' }}>
            基于内容分析，为您推荐以下标签：
          </div>
          <Space wrap>
            {recommendations.map((rec) => {
              const isSelected = selectedTags.includes(rec.tag_key);
              return (
                <Tooltip
                  key={rec.tag_key}
                  title={
                    <div>
                      <div>匹配度: {getConfidenceText(rec.confidence)}</div>
                      <div>原因: {rec.reason}</div>
                    </div>
                  }
                >
                  <Tag
                    color={isSelected ? 'blue' : getConfidenceColor(rec.confidence)}
                    style={{
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: isSelected ? '2px solid #1890ff' : 'none',
                      opacity: disabled ? 0.6 : 1
                    }}
                    onClick={() => !disabled && handleTagClick(rec)}
                  >
                    {isSelected && <CheckOutlined style={{ marginRight: 4 }} />}
                    {rec.tag_name}
                    <span style={{ 
                      marginLeft: 4, 
                      fontSize: '10px', 
                      opacity: 0.8 
                    }}>
                      {Math.round(rec.confidence * 100)}%
                    </span>
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
          <div style={{ 
            marginTop: 12, 
            fontSize: '11px', 
            color: '#999',
            textAlign: 'center'
          }}>
            点击标签添加到内容，再次点击取消选择
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 0',
          color: '#666'
        }}>
          <RobotOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>暂无推荐标签</div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>
            请输入更多内容以获得更好的推荐
          </div>
        </div>
      )}
    </Card>
  );
};

export default AITagRecommendation;

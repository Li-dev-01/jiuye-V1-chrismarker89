/**
 * 统一卡片组件 - 适用于心声和故事
 * 提供一致的视觉风格和交互体验
 */

import React from 'react';
import { Card, Typography, Space, Tag, Rate, Button, Avatar } from 'antd';
import {
  HeartOutlined,
  FrownOutlined,
  SmileOutlined,
  MehOutlined,
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { LikeDislikeDownload } from './LikeDislikeDownload';
import styles from './UnifiedCard.module.css';

const { Title, Paragraph, Text } = Typography;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [reflection]、[gratitude]、[suggestion] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

// 通用卡片数据接口
export interface UnifiedCardData {
  id: number;
  type: 'heart_voice' | 'story';
  
  // 通用字段
  content?: string;
  title?: string;
  summary?: string;
  category: string;
  tags?: string[];
  likeCount: number;
  dislikeCount?: number;
  createdAt: string;
  authorName?: string;
  isAnonymous?: boolean;
  isFeatured?: boolean;
  
  // 心声特有字段
  emotionScore?: number;
  emotionCategory?: string;
  
  // 故事特有字段
  publishedAt?: string;
  readingTime?: number;
}

interface UnifiedCardProps {
  data: UnifiedCardData;
  featured?: boolean;
  onClick?: (data: UnifiedCardData) => void;
  onLike?: (id: number) => void;
  onDislike?: (id: number) => void;
  categories?: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  className?: string;
}

export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  data,
  featured = false,
  onClick,
  onLike,
  onDislike,
  categories = [],
  className = ''
}) => {
  
  // 获取分类信息
  const getCategoryInfo = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo || { value: category, label: category };
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'job-hunting': 'blue',
      'career-change': 'green', 
      'entrepreneurship': 'orange',
      'internship': 'purple',
      'workplace': 'cyan',
      'growth': 'pink',
      'academic': 'geekblue',
      'life': 'magenta',
      'emotion': 'red',
      'suggestion': 'lime'
    };
    return colors[category] || 'default';
  };

  // 获取情感图标
  const getEmotionIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 4) return <SmileOutlined style={{ color: '#52c41a' }} />;
    if (score >= 3) return <MehOutlined style={{ color: '#faad14' }} />;
    return <FrownOutlined style={{ color: '#ff4d4f' }} />;
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const categoryInfo = getCategoryInfo(data.category);

  return (
    <Card
      className={`${styles.unifiedCard} ${featured ? styles.featuredCard : ''} ${onClick ? styles.clickableCard : ''} ${className}`}
      hoverable
      onClick={() => onClick?.(data)}
      cover={featured && (
        <div className={styles.featuredBadge}>
          <StarOutlined /> 精选{data.type === 'heart_voice' ? '心声' : '故事'}
        </div>
      )}
      actions={[
        <div key="like-dislike-download" onClick={(e) => e.stopPropagation()}>
          <LikeDislikeDownload
            contentType={data.type}
            contentId={data.id}
            initialLikeCount={data.likeCount}
            initialDislikeCount={data.dislikeCount || 0}
            theme="minimal"
            size="small"
            showCounts={true}
          />
        </div>
      ]}
    >
      <div className={styles.cardBody}>
        {/* 卡片头部 - 用户信息和时间 */}
        <div className={styles.cardHeader}>
          <div className={styles.authorInfo}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text type="secondary" className={styles.authorName}>
              {data.isAnonymous ? '匿名用户' : (data.authorName || '匿名用户')}
            </Text>
          </div>

          <div className={styles.timeInfo}>
            <ClockCircleOutlined />
            <Text type="secondary" className={styles.timeText}>
              {formatDate(data.publishedAt || data.createdAt)}
            </Text>
          </div>
        </div>

        {/* 分类和评分区域 */}
        <div className={styles.categorySection}>
          <div className={styles.categoryTags}>
            <Tag color={getCategoryColor(data.category)} size="small">
              {categoryInfo.icon}
              {categoryInfo.label}
            </Tag>
            {data.isFeatured && !featured && (
              <Tag color="gold" size="small">精选</Tag>
            )}
          </div>

          {/* 心声特有：情感评分 */}
          {data.type === 'heart_voice' && data.emotionScore && (
            <div className={styles.emotionRating}>
              {getEmotionIcon(data.emotionScore)}
              <Rate disabled value={data.emotionScore} count={5} style={{ fontSize: 10 }} />
            </div>
          )}
        </div>

        {/* 卡片内容 */}
        <div className={styles.cardContent}>
          {/* 故事标题 */}
          {data.type === 'story' && data.title && (
            <div className={styles.contentTitle}>
              <Title level={4} ellipsis={{ rows: 2 }}>
                {data.title}
              </Title>
            </div>
          )}

          {/* 内容文本 */}
          <div className={data.type === 'story' ? styles.contentSummary : styles.contentText}>
            <Paragraph ellipsis={{ rows: data.type === 'story' ? 3 : 4, expandable: false }}>
              {data.type === 'story' ? cleanContent(data.summary || '') : cleanContent(data.content || '')}
            </Paragraph>
          </div>
        </div>

        {/* 标签 */}
        {data.tags && data.tags.length > 0 && (
          <div className={styles.tagsSection}>
            <Space wrap>
              {data.tags.slice(0, 4).map(tag => (
                <Tag key={tag} size="small" className={styles.contentTag}>{tag}</Tag>
              ))}
              {data.tags.length > 4 && (
                <Tag size="small" className={styles.moreTag}>+{data.tags.length - 4}</Tag>
              )}
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UnifiedCard;

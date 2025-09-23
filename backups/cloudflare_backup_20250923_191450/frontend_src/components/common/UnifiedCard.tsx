/**
 * 统一卡片组件 - 适用于故事
 * 提供一致的视觉风格和交互体验
 */

import React from 'react';
import { Card, Typography, Space, Tag, Rate, Button, Avatar } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  FrownOutlined,
  SmileOutlined,
  MehOutlined,
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { LikeDislikeDownload } from './LikeDislikeDownload';
import { QuickReportButton } from '../stories/ReportContent';
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
  type: 'story';

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

  // 故事字段
  publishedAt?: string;
  readingTime?: number;
}

interface UnifiedCardProps {
  data: UnifiedCardData;
  featured?: boolean;
  onClick?: (data: UnifiedCardData) => void;
  onLike?: (id: number) => void;
  onDislike?: (id: number) => void;
  onFavorite?: (data: UnifiedCardData) => void;
  isFavorited?: boolean;
  categories?: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  className?: string;
}

export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  data,
  featured = false,
  onClick,
  onLike,
  onDislike,
  onFavorite,
  isFavorited = false,
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categoryInfo = getCategoryInfo(data.category);

  return (
    <Card
      className={`${styles.unifiedCard} ${featured ? styles.featuredCard : ''} ${onClick ? styles.clickableCard : ''} ${className}`}
      hoverable
      onClick={() => onClick?.(data)}
      cover={featured && (
        <div className={styles.featuredBadge}>
          <StarOutlined /> 精选故事
        </div>
      )}
      actions={[
        // 踩按钮
        <Button
          key="dislike"
          type="text"
          size="small"
          icon={<FrownOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDislike?.(data.id);
          }}
          className={styles.actionButton}
        >
          {data.dislikeCount || 0}
        </Button>,
        // 下载按钮
        <Button
          key="download"
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 实现下载功能
          }}
          className={styles.actionButton}
        >
          下载
        </Button>,
        // 赞按钮
        <Button
          key="like"
          type="text"
          size="small"
          icon={<HeartOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(data.id);
          }}
          className={styles.actionButton}
        >
          {data.likeCount}
        </Button>,
        // 收藏按钮
        ...(onFavorite ? [
          <Button
            key="favorite"
            type="text"
            size="small"
            icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <StarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(data);
            }}
            className={styles.actionButton}
          >
            {isFavorited ? '已收藏' : '收藏'}
          </Button>
        ] : [])
      ]}
    >
      <div className={styles.cardBody}>
        {/* 卡片头部 - 用户信息和日期时间 */}
        <div className={styles.cardHeader}>
          <div className={styles.authorSection}>
            <div className={styles.authorInfo}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text type="secondary" className={styles.authorName}>
                {data.isAnonymous ? '匿名用户' : (data.authorName || '匿名用户')}
              </Text>
            </div>
            {/* 分类标签移到用户名下方 */}
            <div className={styles.categoryTags}>
              <Tag color={getCategoryColor(data.category)} size="small">
                {categoryInfo.icon}
                {categoryInfo.label}
              </Tag>
              {data.isFeatured && !featured && (
                <Tag color="gold" size="small">精选</Tag>
              )}
            </div>
          </div>

          <div className={styles.timeSection}>
            <div className={styles.dateInfo}>
              <Text type="secondary" className={styles.dateText}>
                {formatDate(data.publishedAt || data.createdAt)}
              </Text>
            </div>
            {/* 时间移到日期下方 */}
            <div className={styles.timeInfo}>
              <ClockCircleOutlined />
              <Text type="secondary" className={styles.timeText}>
                {formatTime(data.publishedAt || data.createdAt)}
              </Text>
            </div>
          </div>
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
              {data.tags.slice(0, 4).map((tag, index) => {
                const tagText = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || 'Unknown');
                const tagKey = typeof tag === 'string' ? tag : (tag?.id || tag?.key || index);
                return (
                  <Tag key={tagKey} size="small" className={styles.contentTag}>{tagText}</Tag>
                );
              })}
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

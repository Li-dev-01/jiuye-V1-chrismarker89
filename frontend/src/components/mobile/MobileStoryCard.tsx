/**
 * 移动端专用故事卡片组件
 * 针对移动端优化的故事展示卡片
 */

import React, { useState } from 'react';
import { Button, Typography, Space, Tag, Tooltip } from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { Story } from '../../types/story';
import { getUserDisplayName } from '../../utils/userDisplayUtils';
import styles from './MobileStoryCard.module.css';

const { Text, Paragraph } = Typography;

interface MobileStoryCardProps {
  story: Story;
  onLike?: (storyId: number) => void;
  onDislike?: (storyId: number) => void;
  onFavorite?: (storyId: number) => void;
  onShare?: (story: Story) => void;
  onClick?: (story: Story) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  isFavorited?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export const MobileStoryCard: React.FC<MobileStoryCardProps> = ({
  story,
  onLike,
  onDislike,
  onFavorite,
  onShare,
  onClick,
  isLiked = false,
  isDisliked = false,
  isFavorited = false,
  showActions = true,
  compact = false
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 处理操作反馈
  const handleActionWithFeedback = (action: () => void, feedbackText: string) => {
    action();
    setActionFeedback(feedbackText);
    
    // 触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    // 清除反馈
    setTimeout(() => {
      setActionFeedback(null);
    }, 1000);
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'employment-feedback': '#52c41a',
      'interview-experience': '#1890ff',
      'workplace-adaptation': '#722ed1',
      'career-planning': '#fa8c16',
      'internship-experience': '#13c2c2',
      'campus-life': '#eb2f96'
    };
    return colorMap[category] || '#666';
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    const labelMap: Record<string, string> = {
      'employment-feedback': '就业反馈',
      'interview-experience': '面试经历',
      'workplace-adaptation': '职场适应',
      'career-planning': '职业规划',
      'internship-experience': '实习体验',
      'campus-life': '校园生活'
    };
    return labelMap[category] || category;
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // 截断文本
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className={`${styles.storyCard} ${compact ? styles.compact : ''}`}
      onClick={() => onClick?.(story)}
    >
      {/* 卡片头部 */}
      <div className={styles.cardHeader}>
        <div className={styles.categoryInfo}>
          <Tag 
            color={getCategoryColor(story.category)}
            className={styles.categoryTag}
          >
            {getCategoryLabel(story.category)}
          </Tag>
          {story.isFeatured && (
            <Tag color="gold" className={styles.featuredTag}>
              精选
            </Tag>
          )}
        </div>
        
        <div className={styles.authorInfo}>
          <Text className={styles.authorName}>
            {getUserDisplayName({ displayName: story.authorName })}
          </Text>
        </div>
      </div>

      {/* 故事标题 */}
      <h3 className={styles.storyTitle}>
        {compact ? truncateText(story.title, 50) : story.title}
      </h3>

      {/* 故事内容 */}
      <div className={styles.storyContent}>
        <Paragraph 
          className={styles.contentText}
          ellipsis={{ 
            rows: compact ? 2 : 3, 
            expandable: false 
          }}
        >
          {story.summary || story.content}
        </Paragraph>
      </div>

      {/* 标签列表 */}
      {story.tags && story.tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {story.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <Tag 
              key={tag.id} 
              className={styles.storyTag}
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Tag>
          ))}
          {story.tags.length > (compact ? 2 : 3) && (
            <Text className={styles.moreTags}>
              +{story.tags.length - (compact ? 2 : 3)}
            </Text>
          )}
        </div>
      )}

      {/* 统计信息 */}
      <div className={styles.statsContainer}>
        <Space size="large" className={styles.stats}>
          <span className={styles.statItem}>
            <EyeOutlined className={styles.statIcon} />
            <Text className={styles.statText}>
              {formatNumber(story.viewCount || 0)}
            </Text>
          </span>
          
          <span className={styles.statItem}>
            <LikeOutlined className={styles.statIcon} />
            <Text className={styles.statText}>
              {formatNumber(story.likeCount || 0)}
            </Text>
          </span>
          
          <Text className={styles.timeText}>
            {new Date(story.publishedAt || story.createdAt).toLocaleDateString()}
          </Text>
        </Space>
      </div>

      {/* 操作按钮 */}
      {showActions && (
        <div className={styles.actionsContainer}>
          <div className={styles.actionButtons}>
            <Button
              type="text"
              size="small"
              icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleActionWithFeedback(
                  () => onLike?.(story.id),
                  isLiked ? '取消点赞' : '已点赞'
                );
              }}
            >
              {story.likeCount || 0}
            </Button>

            <Button
              type="text"
              size="small"
              icon={isDisliked ? <DislikeFilled /> : <DislikeOutlined />}
              className={`${styles.actionButton} ${isDisliked ? styles.disliked : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleActionWithFeedback(
                  () => onDislike?.(story.id),
                  isDisliked ? '取消踩' : '已踩'
                );
              }}
            />

            <Button
              type="text"
              size="small"
              icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
              className={`${styles.actionButton} ${isFavorited ? styles.favorited : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleActionWithFeedback(
                  () => onFavorite?.(story.id),
                  isFavorited ? '取消收藏' : '已收藏'
                );
              }}
            />

            <Button
              type="text"
              size="small"
              icon={<ShareAltOutlined />}
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                handleActionWithFeedback(
                  () => onShare?.(story),
                  '已复制链接'
                );
              }}
            />
          </div>
        </div>
      )}

      {/* 操作反馈 */}
      {actionFeedback && (
        <div className={styles.actionFeedback}>
          <Text className={styles.feedbackText}>{actionFeedback}</Text>
        </div>
      )}
    </div>
  );
};

export default MobileStoryCard;

/**
 * 故事内容组件
 * 在滑动浏览器中显示故事详情
 */

import React from 'react';
import { Card, Typography, Space, Tag, Avatar, Divider } from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Story } from '../../services/storyService';
import styles from './StoryContent.module.css';

const { Title, Text, Paragraph } = Typography;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [growth]、[interview]、[career_change] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

interface StoryContentProps {
  story: Story;
}

export const StoryContent: React.FC<StoryContentProps> = ({ story }) => {
  // 获取分类标签颜色和图标
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { color: string; icon: string; label: string }> = {
      'job-hunting': { color: 'blue', icon: '🔍', label: '求职经历' },
      'career-change': { color: 'green', icon: '🔄', label: '转行经历' },
      'entrepreneurship': { color: 'orange', icon: '🚀', label: '创业故事' },
      'internship': { color: 'purple', icon: '📚', label: '实习经历' },
      'workplace': { color: 'cyan', icon: '🏢', label: '职场故事' },
      'growth': { color: 'pink', icon: '🌱', label: '成长经历' }
    };
    return categoryMap[category] || { color: 'default', icon: '📖', label: category };
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
  };

  // 估算阅读时间
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200; // 中文阅读速度
    const wordCount = content.length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const categoryInfo = getCategoryInfo(story.category);
  const readingTime = getReadingTime(story.content);

  return (
    <div className={styles.storyContent}>
      <Card className={styles.contentCard} bordered={false}>
        {/* 头部信息 */}
        <div className={styles.header}>
          <div className={styles.authorInfo}>
            <Avatar 
              icon={<UserOutlined />} 
              className={styles.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div className={styles.authorDetails}>
              <Text className={styles.authorName}>
                {story.isAnonymous ? '匿名用户' : story.authorName}
              </Text>
              <Space size="small" className={styles.metaInfo}>
                <Text className={styles.publishTime} type="secondary">
                  <ClockCircleOutlined /> {formatDate(story.publishedAt || story.createdAt)}
                </Text>
                <Text className={styles.readingTime} type="secondary">
                  📖 约{readingTime}分钟阅读
                </Text>
              </Space>
            </div>
          </div>

          <div className={styles.metadata}>
            <Space direction="vertical" align="end" size="small">
              <Tag color={categoryInfo.color} className={styles.categoryTag}>
                {categoryInfo.icon} {categoryInfo.label}
              </Tag>
              {story.isFeatured && (
                <Tag color="gold" className={styles.featuredTag}>
                  <StarOutlined /> 精选故事
                </Tag>
              )}
            </Space>
          </div>
        </div>

        {/* 故事标题 */}
        <div className={styles.titleSection}>
          <Title level={3} className={styles.storyTitle}>
            {cleanContent(story.title)}
          </Title>
          {story.summary && (
            <Paragraph className={styles.storySummary} type="secondary">
              {cleanContent(story.summary)}
            </Paragraph>
          )}
        </div>

        <Divider className={styles.divider} />

        {/* 主要内容 */}
        <div className={styles.mainContent}>
          <Paragraph className={styles.contentText}>
            {cleanContent(story.content)}
          </Paragraph>
        </div>

        {/* 标签 */}
        {story.tags && story.tags.length > 0 && (
          <>
            <Divider className={styles.divider} />
            <div className={styles.tagsSection}>
              <Text className={styles.tagsLabel} type="secondary">相关标签：</Text>
              <Space wrap>
                {story.tags.map((tag, index) => {
                  const tagText = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || 'Unknown');
                  const tagKey = typeof tag === 'string' ? tag : (tag?.id || tag?.key || index);
                  return (
                    <Tag key={tagKey} className={styles.contentTag}>
                      #{tagText}
                    </Tag>
                  );
                })}
              </Space>
            </div>
          </>
        )}

        {/* 底部统计 */}
        <Divider className={styles.divider} />
        <div className={styles.stats}>
          <Space size="large">
            <Text type="secondary" className={styles.statItem}>
              <EyeOutlined /> {story.viewCount} 次浏览
            </Text>
            <Text type="secondary" className={styles.statItem}>
              💝 {story.likeCount} 人点赞
            </Text>
            {story.industry && (
              <Text type="secondary" className={styles.statItem}>
                🏭 {story.industry}
              </Text>
            )}
            {story.position && (
              <Text type="secondary" className={styles.statItem}>
                💼 {story.position}
              </Text>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default StoryContent;

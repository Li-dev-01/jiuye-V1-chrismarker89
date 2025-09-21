/**
 * 问卷心声内容组件
 * 在滑动浏览器中显示心声详情
 */

import React from 'react';
import { Card, Typography, Space, Tag, Rate, Avatar } from 'antd';
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  UserOutlined
} from '@ant-design/icons';
import { HeartVoice } from '../../services/heartVoiceService';
import styles from './VoiceContent.module.css';

const { Title, Text, Paragraph } = Typography;

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [reflection]、[gratitude]、[suggestion] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

interface VoiceContentProps {
  voice: HeartVoice;
}

export const VoiceContent: React.FC<VoiceContentProps> = ({ voice }) => {
  // 获取情感图标
  const getEmotionIcon = (score: number) => {
    if (score >= 4) return <SmileOutlined style={{ color: '#52c41a' }} />;
    if (score >= 3) return <MehOutlined style={{ color: '#faad14' }} />;
    return <FrownOutlined style={{ color: '#ff4d4f' }} />;
  };

  // 获取分类标签颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      experience: 'blue',
      advice: 'green',
      encouragement: 'orange',
      reflection: 'purple',
      gratitude: 'pink',
      challenge: 'red'
    };
    return colors[category] || 'default';
  };

  // 获取分类标签文本
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      experience: '经验分享',
      advice: '建议指导',
      encouragement: '鼓励支持',
      reflection: '反思总结',
      gratitude: '感谢感恩',
      challenge: '挑战困难'
    };
    return labels[category] || category;
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

  return (
    <div className={styles.voiceContent}>
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
                {voice.isAnonymous ? '匿名用户' : voice.authorName}
              </Text>
              <Text className={styles.publishTime} type="secondary">
                {formatDate(voice.publishedAt || voice.createdAt)}
              </Text>
            </div>
          </div>

          <div className={styles.metadata}>
            <Space direction="vertical" align="end" size="small">
              <Tag color={getCategoryColor(voice.category)} className={styles.categoryTag}>
                {getCategoryLabel(voice.category)}
              </Tag>
              {voice.isFeatured && (
                <Tag color="gold" className={styles.featuredTag}>
                  ✨ 精选
                </Tag>
              )}
            </Space>
          </div>
        </div>

        {/* 情感评分 */}
        <div className={styles.emotionSection}>
          <Space align="center">
            <Text className={styles.emotionLabel}>心情指数：</Text>
            {getEmotionIcon(voice.emotionScore)}
            <Rate 
              disabled 
              value={voice.emotionScore} 
              count={5} 
              className={styles.emotionRating}
            />
            <Text className={styles.emotionScore} type="secondary">
              {voice.emotionScore}/5
            </Text>
          </Space>
        </div>

        {/* 主要内容 */}
        <div className={styles.mainContent}>
          <Paragraph className={styles.contentText}>
            {cleanContent(voice.content)}
          </Paragraph>
        </div>

        {/* 标签 */}
        {voice.tags && voice.tags.length > 0 && (
          <div className={styles.tagsSection}>
            <Text className={styles.tagsLabel} type="secondary">标签：</Text>
            <Space wrap>
              {voice.tags.map(tag => (
                <Tag key={tag} className={styles.contentTag}>
                  #{tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 底部统计 */}
        <div className={styles.stats}>
          <Space>
            <Text type="secondary" className={styles.statItem}>
              💝 {voice.likeCount} 人点赞
            </Text>
            {voice.questionnaireId && (
              <Text type="secondary" className={styles.statItem}>
                📝 来自问卷调查
              </Text>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default VoiceContent;

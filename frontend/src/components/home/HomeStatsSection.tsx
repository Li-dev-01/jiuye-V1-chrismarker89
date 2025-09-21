/**
 * 首页统计展示组件
 * 显示问卷、故事、心声的总体参与统计
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Spin, Button } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  MessageOutlined,
  UserOutlined,
  ReloadOutlined,
  BookOutlined
} from '@ant-design/icons';
import { participationStatsService } from '../../services/participationStatsService';
import styles from './HomeStatsSection.module.css';

const { Title, Text } = Typography;

interface HomeStatsSectionProps {
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const HomeStatsSection: React.FC<HomeStatsSectionProps> = ({
  showRefreshButton = false,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 默认5分钟
}) => {
  const [stats, setStats] = useState<ParticipationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 加载统计数据
  const loadStats = async (useCache: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      // 尝试获取真实API数据
      const data = await participationStatsService.getParticipationStats(useCache);
      if (data) {
        setStats(data);
        setLastRefresh(new Date());
        // Removed console.log: console.log('成功加载真实统计数据:', data);
      } else {
        throw new Error('API返回空数据');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('加载首页统计失败:', error);
      setError(error instanceof Error ? error.message : '加载统计数据失败');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新
  const handleRefresh = () => {
    loadStats(false);
  };

  // 初始加载
  useEffect(() => {
    loadStats();
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 加载状态
  if (loading && !stats) {
    return (
      <div className={styles.statsSection}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text type="secondary" className={styles.loadingText}>
            加载统计数据...
          </Text>
        </div>
      </div>
    );
  }

  // 准备显示数据 - 如果API失败则使用默认值
  const displayStats = stats || {
    questionnaire: { participantCount: 0, totalResponses: 0 },
    stories: { publishedCount: 0, authorCount: 0 },
    voices: { publishedCount: 0, authorCount: 0 },
    lastUpdated: new Date().toISOString()
  };

  return (
    <div className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.statsHeader}>
          <Title level={3} className={styles.statsTitle}>
            <UserOutlined />
            项目参与统计
          </Title>
          <Text className={styles.statsSubtitle}>
            大家都在积极参与，一起构建更好的数据平台
          </Text>
          {showRefreshButton && (
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              className={styles.refreshButton}
              size="small"
            />
          )}
        </div>

        {/* 错误提示 */},
    {error && (
          <div className={styles.errorBanner}>
            <Text type="danger" className={styles.errorText}>
              ⚠️ 加载统计数据失败: {error}
            </Text>
            <Button
              type="link"
              onClick={handleRefresh}
              size="small"
              className={styles.retryButton}
            >
              重试
            </Button>
          </div>
        )}

        <Row gutter={[24, 16]} className={styles.statsGrid}>
          {/* 参与问卷者 */}
          <Col xs={24} sm={8} md={8}>
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrapper} ${styles.questionnaire}`}>
                <UserOutlined />
              </div>
              <div className={styles.statNumber}>
                {participationStatsService.formatNumber(displayStats.questionnaire.participantCount)}人
              </div>
              <div className={styles.statLabel}>参与问卷者</div>
              <div className={styles.statDescription}>
                已有 {displayStats.questionnaire.participantCount} 位同学参与
              </div>
            </div>
          </Col>

          {/* 故事分享 */}
          <Col xs={24} sm={8} md={8}>
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrapper} ${styles.stories}`}>
                <BookOutlined />
              </div>
              <div className={styles.statNumber}>
                {participationStatsService.formatNumber(displayStats.stories.publishedCount)}篇
              </div>
              <div className={styles.statLabel}>故事分享</div>
              <div className={styles.statDescription}>
                来自 {displayStats.stories.authorCount} 位同学的真实故事
              </div>
            </div>
          </Col>

          {/* 提交问卷心声 */}
          <Col xs={24} sm={8} md={8}>
            <div className={styles.statCard}>
              <div className={`${styles.statIconWrapper} ${styles.voices}`}>
                <MessageOutlined />
              </div>
              <div className={styles.statNumber}>
                {participationStatsService.formatNumber(displayStats.voices.publishedCount)}份
              </div>
              <div className={styles.statLabel}>提交问卷心声</div>
              <div className={styles.statDescription}>
                来自 {displayStats.voices.authorCount} 位同学的真实感悟
              </div>
            </div>
          </Col>
        </Row>

        {/* 更新时间 */}
        <div className={styles.lastUpdated}>
          <Text type="secondary" className={styles.updateTimeText}>
            数据更新时间: {participationStatsService.getLastUpdatedText(displayStats.lastUpdated)},
    {error && <span className={styles.errorNote}>（当前显示默认数据）</span>}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default HomeStatsSection;

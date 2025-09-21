/**
 * 页面参与统计显示组件
 * 在问卷、故事、心声页面顶部显示参与数量统计
 */

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, Spin, Tooltip, Button } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined, 
  ReloadOutlined,
  TeamOutlined,
  EditOutlined
} from '@ant-design/icons';
import { participationStatsService, type ParticipationStats } from '../../services/participationStatsService';

const { Text } = Typography;

interface ParticipationStatsProps {
  pageType: 'questionnaire' | 'stories' | 'voices';
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
  compact?: boolean; // 紧凑模式
  style?: React.CSSProperties;
  className?: string;
}

export const ParticipationStatsComponent: React.FC<ParticipationStatsProps> = ({
  pageType,
  showRefreshButton = false,
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 默认5分钟
  compact = false,
  style,
  className
}) => {
  const [stats, setStats] = useState<ParticipationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 加载统计数据
  const loadStats = async (useCache: boolean = true) => {
    setLoading(true);
    try {
      const data = await participationStatsService.getParticipationStats(useCache);
      setStats(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('加载参与统计失败:', error);
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

  // 获取页面对应的图标
  const getPageIcon = () => {
    switch (pageType) {
      case 'questionnaire':
        return <FileTextOutlined />;
      case 'stories':
        return <EditOutlined />;
      case 'voices':
        return <MessageOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  // 获取页面标题
  const getPageTitle = () => {
    switch (pageType) {
      case 'questionnaire':
        return '问卷参与统计';
      case 'stories':
        return '故事发表统计';
      case 'voices':
        return '心声分享统计';
      default:
        return '参与统计';
    }
  };

  // 渲染紧凑模式
  const renderCompactMode = () => {
    if (!stats) return null;

    const mainNumber = participationStatsService.getMainNumberByPageType(stats, pageType);
    const statsText = participationStatsService.getStatsTextByPageType(stats, pageType);

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
        ...style 
      }} className={className}>
        {getPageIcon()}
        <Text strong style={{ color: '#1890ff' }}>
          {participationStatsService.formatNumber(mainNumber)}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {statsText}
        </Text>
        {showRefreshButton && (
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          />
        )}
      </div>
    );
  };

  // 渲染完整模式
  const renderFullMode = () => {
    if (!stats) return null;

    const getStatsCards = () => {
      switch (pageType) {
        case 'questionnaire':
          return (
            <>
              <Col span={12}>
                <Statistic
                  title="参与人数"
                  value={stats.questionnaire.participantCount}
                  prefix={<UserOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="问卷份数"
                  value={stats.questionnaire.totalResponses}
                  prefix={<FileTextOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
            </>
          );
        case 'stories':
          return (
            <>
              <Col span={12}>
                <Statistic
                  title="发表故事"
                  value={stats.stories.publishedCount}
                  prefix={<EditOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="故事作者"
                  value={stats.stories.authorCount}
                  prefix={<TeamOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
            </>
          );
        case 'voices':
          return (
            <>
              <Col span={12}>
                <Statistic
                  title="心声数量"
                  value={stats.voices.publishedCount}
                  prefix={<MessageOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="分享用户"
                  value={stats.voices.authorCount}
                  prefix={<TeamOutlined />}
                  formatter={(value) => participationStatsService.formatNumber(Number(value))}
                />
              </Col>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Card 
        title={getPageTitle()}
        extra={
          showRefreshButton && (
            <Tooltip title={`最后更新: ${participationStatsService.getLastUpdatedText(stats.lastUpdated)}`}>
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Tooltip>
          )
        }
        style={style}
        className={className}
      >
        <Row gutter={16}>
          {getStatsCards()}
        </Row>
        {stats.lastUpdated && (
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {participationStatsService.getLastUpdatedText(stats.lastUpdated)}
          </Text>
        )}
      </Card>
    );
  };

  // 加载状态
  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', ...style }} className={className}>
        <Spin size="small" />
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          加载统计数据...
        </Text>
      </div>
    );
  }

  // 无数据状态
  if (!stats || !participationStatsService.isStatsValid(stats)) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '12px',
        backgroundColor: '#fafafa',
        borderRadius: '6px',
        ...style 
      }} className={className}>
        <Text type="secondary">
          {getPageIcon()} 暂无参与数据
        </Text>
      </div>
    );
  }

  return compact ? renderCompactMode() : renderFullMode();
};

export default ParticipationStatsComponent;

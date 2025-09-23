/**
 * 故事统计面板 - 轻量级数据展示
 * 与问卷调查数据联动，显示关键统计信息
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Space, Typography, Spin } from 'antd';
import {
  BookOutlined, UserOutlined, TrophyOutlined, FireOutlined,
  RiseOutlined, HeartOutlined, EyeOutlined, CalendarOutlined
} from '@ant-design/icons';
import { 
  employmentStatusCategories, 
  majorFieldCategories, 
  regionCategories,
  storyTypeCategories 
} from '../../config/storyCategories';
import './StoryStatsPanel.css';

const { Title, Text } = Typography;

interface StoryStats {
  totalStories: number;
  totalViews: number;
  totalLikes: number;
  monthlyStories: number;
  categoriesStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    count: number;
  }>;
}

interface StoryStatsPanelProps {
  className?: string;
  showDetailed?: boolean;
}

export const StoryStatsPanel: React.FC<StoryStatsPanelProps> = ({
  className = '',
  showDetailed = true
}) => {
  const [stats, setStats] = useState<StoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<'employmentStatus' | 'majorField' | 'region' | 'storyType'>('employmentStatus');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      const mockStats: StoryStats = {
        totalStories: 156,
        totalViews: 12450,
        totalLikes: 2340,
        monthlyStories: 23,
        categoriesStats: [
          { category: 'employed', count: 45, percentage: 28.8 },
          { category: 'job-seeking', count: 38, percentage: 24.4 },
          { category: 'further-study', count: 32, percentage: 20.5 },
          { category: 'entrepreneurship', count: 25, percentage: 16.0 },
          { category: 'undecided', count: 16, percentage: 10.3 }
        ],
        recentTrends: [
          { date: '2024-01', count: 12 },
          { date: '2024-02', count: 18 },
          { date: '2024-03', count: 23 }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDimensionCategories = () => {
    switch (selectedDimension) {
      case 'employmentStatus':
        return employmentStatusCategories;
      case 'majorField':
        return majorFieldCategories;
      case 'region':
        return regionCategories;
      case 'storyType':
        return storyTypeCategories;
      default:
        return employmentStatusCategories;
    }
  };

  const getDimensionLabel = () => {
    switch (selectedDimension) {
      case 'employmentStatus':
        return '就业状态分布';
      case 'majorField':
        return '专业领域分布';
      case 'region':
        return '地域分布';
      case 'storyType':
        return '故事类型分布';
      default:
        return '分类分布';
    }
  };

  if (loading) {
    return (
      <Card className={`story-stats-panel ${className}`}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">加载统计数据中...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`story-stats-panel ${className}`}>
      {/* 核心统计数据 */}
      <Card className="stats-overview">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="总故事数"
              value={stats.totalStories}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="总浏览量"
              value={stats.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="总点赞数"
              value={stats.totalLikes}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="本月新增"
              value={stats.monthlyStories}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="篇"
            />
          </Col>
        </Row>
      </Card>

      {showDetailed && (
        <>
          {/* 分类统计 */}
          <Card className="category-stats">
            <div className="stats-header">
              <Title level={4}>{getDimensionLabel()}</Title>
              <Space wrap>
                <Tag 
                  color={selectedDimension === 'employmentStatus' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDimension('employmentStatus')}
                >
                  就业状态
                </Tag>
                <Tag 
                  color={selectedDimension === 'majorField' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDimension('majorField')}
                >
                  专业领域
                </Tag>
                <Tag 
                  color={selectedDimension === 'storyType' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDimension('storyType')}
                >
                  故事类型
                </Tag>
                <Tag 
                  color={selectedDimension === 'region' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDimension('region')}
                >
                  地域分布
                </Tag>
              </Space>
            </div>

            <div className="category-breakdown">
              {stats.categoriesStats.map((stat, index) => {
                const categoryInfo = getDimensionCategories().find(cat => cat.value === stat.category);
                if (!categoryInfo) return null;

                return (
                  <div key={stat.category} className="category-item">
                    <div className="category-header">
                      <Space>
                        <span className="category-icon">{categoryInfo.icon}</span>
                        <Text strong>{categoryInfo.label}</Text>
                        <Text type="secondary">({stat.count}篇)</Text>
                      </Space>
                      <Text strong>{stat.percentage}%</Text>
                    </div>
                    <Progress 
                      percent={stat.percentage} 
                      strokeColor={categoryInfo.color}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 趋势统计 */}
          <Card className="trend-stats">
            <Title level={4}>
              <RiseOutlined /> 发布趋势
            </Title>
            <div className="trend-items">
              {stats.recentTrends.map((trend, index) => (
                <div key={trend.date} className="trend-item">
                  <Text type="secondary">{trend.date}</Text>
                  <div className="trend-bar">
                    <div 
                      className="trend-fill"
                      style={{ 
                        width: `${(trend.count / Math.max(...stats.recentTrends.map(t => t.count))) * 100}%`,
                        backgroundColor: '#1890ff'
                      }}
                    />
                    <Text strong>{trend.count}篇</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 热门标签 */}
          <Card className="popular-tags">
            <Title level={4}>
              <FireOutlined /> 热门话题
            </Title>
            <Space wrap>
              {['求职心得', '面试技巧', '职业规划', '实习经验', '校园生活', '技能提升', '职场适应', '创业故事'].map(tag => (
                <Tag key={tag} color="blue" style={{ margin: '4px 0' }}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>
        </>
      )}
    </div>
  );
};

export default StoryStatsPanel;

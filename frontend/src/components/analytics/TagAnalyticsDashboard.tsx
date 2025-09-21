/**
 * 标签分析仪表板
 * 展示标签使用统计和趋势分析
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Space,
  Select, DatePicker, Spin, Empty, Typography, Tooltip
} from 'antd';
import {
  TagOutlined, TrendingUpOutlined, FireOutlined,
  BarChartOutlined, PieChartOutlined, LineChartOutlined
} from '@ant-design/icons';
import { ManagementAdminService } from '../../services/ManagementAdminService';
import TagCloud from './TagCloud';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TagStats {
  tagStats: any[];
  contentTypeStats: any[];
  recentTags: any[];
}

export const TagAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await ManagementAdminService.getContentTagStats();
      setStats(data);
    } catch (error) {
      console.error('加载标签统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  // 计算总体统计
  const getTotalStats = () => {
    if (!stats) return { total: 0, active: 0, usage: 0 };
    
    return {
      total: stats.tagStats.length,
      active: stats.tagStats.filter(tag => tag.is_active).length,
      usage: stats.tagStats.reduce((sum, tag) => sum + tag.actual_usage, 0)
    };
  };

  // 获取热门标签
  const getHotTags = () => {
    if (!stats) return [];
    return stats.tagStats
      .filter(tag => tag.actual_usage > 0)
      .sort((a, b) => b.actual_usage - a.actual_usage)
      .slice(0, 10);
  };

  // 获取标签分布数据
  const getTagDistribution = () => {
    if (!stats) return [];
    
    const distribution = {
      hot: stats.tagStats.filter(tag => tag.popularity_level === 'hot').length,
      popular: stats.tagStats.filter(tag => tag.popularity_level === 'popular').length,
      normal: stats.tagStats.filter(tag => tag.popularity_level === 'normal').length,
      cold: stats.tagStats.filter(tag => tag.popularity_level === 'cold').length
    };
    
    return [
      { name: '热门标签', value: distribution.hot, color: '#ff4d4f' },
      { name: '流行标签', value: distribution.popular, color: '#faad14' },
      { name: '普通标签', value: distribution.normal, color: '#1890ff' },
      { name: '冷门标签', value: distribution.cold, color: '#d9d9d9' }
    ];
  };

  // 热门标签表格列
  const hotTagsColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span style={{ 
          fontWeight: 'bold',
          color: index < 3 ? '#faad14' : '#666'
        }}>
          #{index + 1}
        </span>
      )
    },
    {
      title: '标签',
      dataIndex: 'tag_name',
      key: 'tag_name',
      render: (name: string, record: any) => (
        <Tag color={record.color}>
          {record.actual_usage > 50 && <FireOutlined style={{ marginRight: 4 }} />}
          {name}
        </Tag>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'actual_usage',
      key: 'actual_usage',
      width: 100,
      render: (usage: number) => (
        <Statistic
          value={usage}
          valueStyle={{ fontSize: '14px' }}
        />
      )
    },
    {
      title: '热度等级',
      dataIndex: 'popularity_level',
      key: 'popularity_level',
      width: 100,
      render: (level: string) => {
        const levelConfig = {
          hot: { color: '#ff4d4f', text: '🔥 热门' },
          popular: { color: '#faad14', text: '⭐ 流行' },
          normal: { color: '#1890ff', text: '📊 普通' },
          cold: { color: '#d9d9d9', text: '❄️ 冷门' }
        };
        const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.normal;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          story: { color: 'blue', text: '故事' },
          heart_voice: { color: 'green', text: '心声' },
          all: { color: 'purple', text: '通用' }
        };
        const config = typeMap[type as keyof typeof typeMap] || typeMap.all;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  const totalStats = getTotalStats();
  const hotTags = getHotTags();
  const distribution = getTagDistribution();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载标签统计中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          标签数据分析
        </Title>
        <Text type="secondary">
          深入了解标签使用情况和趋势变化
        </Text>
      </div>

      {/* 控制面板 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <span>内容类型:</span>
          <Select
            value={selectedContentType}
            onChange={setSelectedContentType}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="story">故事墙</Option>
            <Option value="heart_voice">心声</Option>
          </Select>
          
          <span>时间范围:</span>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="7d">最近7天</Option>
            <Option value="30d">最近30天</Option>
            <Option value="90d">最近90天</Option>
          </Select>
        </Space>
      </Card>

      {/* 总体统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="标签总数"
              value={totalStats.total}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="活跃标签"
              value={totalStats.active}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${totalStats.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总使用次数"
              value={totalStats.usage}
              prefix={<TrendingUpOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="标签热度分布">
            <Space direction="vertical" style={{ width: '100%' }}>
              {distribution.map(item => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.name}</span>
                    <span>{item.value} 个</span>
                  </div>
                  <Progress
                    percent={totalStats.total > 0 ? (item.value / totalStats.total) * 100 : 0}
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="内容类型分布">
            {stats?.contentTypeStats.length ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {stats.contentTypeStats.map((item: any) => (
                  <div key={item.content_type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{item.content_type === 'story' ? '故事墙' : '心声'}</span>
                      <span>{item.content_count} 个内容</span>
                    </div>
                    <Progress
                      percent={Math.min((item.content_count / 100) * 100, 100)}
                      strokeColor={item.content_type === 'story' ? '#1890ff' : '#52c41a'}
                      showInfo={false}
                    />
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 标签云和热门标签 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <TagCloud
            tags={stats?.tagStats || []}
            loading={loading}
            height={400}
            contentType={selectedContentType}
          />
        </Col>
        
        <Col xs={24} lg={10}>
          <Card title="热门标签排行" style={{ height: 448 }}>
            <Table
              columns={hotTagsColumns}
              dataSource={hotTags}
              pagination={false}
              size="small"
              scroll={{ y: 350 }}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TagAnalyticsDashboard;

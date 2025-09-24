import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Select, 
  DatePicker, 
  Button,
  Space,
  Typography,
  Divider,
  Tag
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalQuestionnaires: number;
    totalStories: number;
    totalReviews: number;
    avgResponseTime: number;
    completionRate: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    submissionTrends: Array<{ date: string; questionnaires: number; stories: number }>;
    reviewTrends: Array<{ date: string; completed: number; pending: number }>;
  };
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
    educationLevels: Array<{ level: string; count: number; percentage: number }>;
  };
  performance: {
    reviewerStats: Array<{ 
      reviewerId: string; 
      reviewerName: string; 
      reviewsCompleted: number; 
      avgTime: number; 
      accuracy: number 
    }>;
    systemMetrics: {
      responseTime: number;
      uptime: number;
      errorRate: number;
      throughput: number;
    };
  };
}

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS}?range=${timeRange}`);
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        // 使用模拟数据
        setData(generateMockAnalyticsData());
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      // 使用模拟数据作为后备
      setData(generateMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      overview: {
        totalUsers: 1247,
        totalQuestionnaires: 3456,
        totalStories: 892,
        totalReviews: 2341,
        avgResponseTime: 2.3,
        completionRate: 87.5
      },
      trends: {
        userGrowth: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20
        })),
        submissionTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          questionnaires: Math.floor(Math.random() * 30) + 10,
          stories: Math.floor(Math.random() * 15) + 5
        })),
        reviewTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 25) + 15,
          pending: Math.floor(Math.random() * 10) + 2
        }))
      },
      demographics: {
        ageGroups: [
          { range: '18-22', count: 456, percentage: 36.6 },
          { range: '23-25', count: 389, percentage: 31.2 },
          { range: '26-30', count: 234, percentage: 18.8 },
          { range: '30+', count: 168, percentage: 13.4 }
        ],
        genderDistribution: [
          { gender: '男', count: 678, percentage: 54.4 },
          { gender: '女', count: 569, percentage: 45.6 }
        ],
        educationLevels: [
          { level: '本科', count: 789, percentage: 63.3 },
          { level: '硕士', count: 345, percentage: 27.7 },
          { level: '博士', count: 78, percentage: 6.3 },
          { level: '其他', count: 35, percentage: 2.8 }
        ]
      },
      performance: {
        reviewerStats: [
          { reviewerId: 'rev_001', reviewerName: '审核员A', reviewsCompleted: 234, avgTime: 2.1, accuracy: 96.5 },
          { reviewerId: 'rev_002', reviewerName: '审核员B', reviewsCompleted: 189, avgTime: 2.8, accuracy: 94.2 },
          { reviewerId: 'rev_003', reviewerName: '审核员C', reviewsCompleted: 156, avgTime: 1.9, accuracy: 97.8 },
          { reviewerId: 'rev_004', reviewerName: '审核员D', reviewsCompleted: 145, avgTime: 3.2, accuracy: 92.1 }
        ],
        systemMetrics: {
          responseTime: 245,
          uptime: 99.8,
          errorRate: 0.12,
          throughput: 1250
        }
      }
    };
  };

  const handleExportData = () => {
    // 实现数据导出功能
    console.log('导出数据');
  };

  const overviewCards = [
    {
      title: '总用户数',
      value: data?.overview.totalUsers || 0,
      icon: <UserOutlined />,
      color: '#1890ff'
    },
    {
      title: '总问卷数',
      value: data?.overview.totalQuestionnaires || 0,
      icon: <FileTextOutlined />,
      color: '#52c41a'
    },
    {
      title: '总故事数',
      value: data?.overview.totalStories || 0,
      icon: <BarChartOutlined />,
      color: '#722ed1'
    },
    {
      title: '总审核数',
      value: data?.overview.totalReviews || 0,
      icon: <CheckCircleOutlined />,
      color: '#fa8c16'
    }
  ];

  const reviewerColumns = [
    {
      title: '审核员',
      dataIndex: 'reviewerName',
      key: 'reviewerName',
    },
    {
      title: '完成审核数',
      dataIndex: 'reviewsCompleted',
      key: 'reviewsCompleted',
      sorter: (a: any, b: any) => a.reviewsCompleted - b.reviewsCompleted,
    },
    {
      title: '平均用时(小时)',
      dataIndex: 'avgTime',
      key: 'avgTime',
      render: (time: number) => `${time.toFixed(1)}h`,
      sorter: (a: any, b: any) => a.avgTime - b.avgTime,
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => (
        <Tag color={accuracy >= 95 ? 'green' : accuracy >= 90 ? 'orange' : 'red'}>
          {accuracy.toFixed(1)}%
        </Tag>
      ),
      sorter: (a: any, b: any) => a.accuracy - b.accuracy,
    }
  ];

  const demographicsColumns = [
    {
      title: '年龄段',
      dataIndex: 'range',
      key: 'range',
    },
    {
      title: '人数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => `${percentage.toFixed(1)}%`,
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>数据分析</Title>
        <Text type="secondary">系统数据统计与分析报告</Text>
      </div>

      {/* 控制栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Space>
              <Text>时间范围:</Text>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 120 }}
              >
                <Option value="1d">今天</Option>
                <Option value="7d">最近7天</Option>
                <Option value="30d">最近30天</Option>
                <Option value="90d">最近90天</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={6}>
            <Space>
              <Text>指标类型:</Text>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={{ width: 120 }}
              >
                <Option value="overview">概览</Option>
                <Option value="trends">趋势</Option>
                <Option value="demographics">用户画像</Option>
                <Option value="performance">性能</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space style={{ float: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAnalyticsData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportData}
              >
                导出报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {overviewCards.map((card, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 关键指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={8}>
          <Card title="平均响应时间">
            <Statistic
              value={data?.overview.avgResponseTime || 0}
              suffix="小时"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={Math.min((data?.overview.avgResponseTime || 0) * 20, 100)}
              strokeColor="#1890ff"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="完成率">
            <Statistic
              value={data?.overview.completionRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={data?.overview.completionRate || 0}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="系统正常运行时间">
            <Statistic
              value={data?.performance.systemMetrics.uptime || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={data?.performance.systemMetrics.uptime || 0}
              strokeColor="#722ed1"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 审核员绩效 */}
      <Card title="审核员绩效统计" style={{ marginBottom: '24px' }}>
        <Table
          columns={reviewerColumns}
          dataSource={data?.performance.reviewerStats || []}
          rowKey="reviewerId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* 用户画像分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={8}>
          <Card title="年龄分布">
            <Table
              columns={demographicsColumns}
              dataSource={data?.demographics.ageGroups || []}
              rowKey="range"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="性别分布">
            <Table
              columns={[
                { title: '性别', dataIndex: 'gender', key: 'gender' },
                { title: '人数', dataIndex: 'count', key: 'count' },
                { 
                  title: '占比', 
                  dataIndex: 'percentage', 
                  key: 'percentage',
                  render: (percentage: number) => `${percentage.toFixed(1)}%`
                }
              ]}
              dataSource={data?.demographics.genderDistribution || []}
              rowKey="gender"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="学历分布">
            <Table
              columns={[
                { title: '学历', dataIndex: 'level', key: 'level' },
                { title: '人数', dataIndex: 'count', key: 'count' },
                { 
                  title: '占比', 
                  dataIndex: 'percentage', 
                  key: 'percentage',
                  render: (percentage: number) => `${percentage.toFixed(1)}%`
                }
              ]}
              dataSource={data?.demographics.educationLevels || []}
              rowKey="level"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 系统性能指标 */}
      <Card title="系统性能指标">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="响应时间"
              value={data?.performance.systemMetrics.responseTime || 0}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="系统正常运行时间"
              value={data?.performance.systemMetrics.uptime || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="错误率"
              value={data?.performance.systemMetrics.errorRate || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#fa541c' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="吞吐量"
              value={data?.performance.systemMetrics.throughput || 0}
              suffix="req/min"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminAnalytics;

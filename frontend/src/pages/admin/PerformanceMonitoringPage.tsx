import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Tag,
  Space,
  Button,
  Select,
  Alert,
  Spin,
  Typography,
  Tabs,
  Timeline,
  Badge
} from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestQueries: Array<{
    endpoint: string;
    responseTime: number;
    timestamp: string;
  }>;
  dataSourceDistribution: Record<string, number>;
  hourlyStats: Array<{
    hour: string;
    requests: number;
    avgResponseTime: number;
    cacheHitRate: number;
  }>;
}

interface CacheUsagePattern {
  endpoint: string;
  requestFrequency: number;
  cacheHitRate: number;
  averageResponseTime: number;
  dataFreshness: number;
  userConcurrency: number;
  peakHours: string[];
}

interface CronStatus {
  cron_pattern: string;
  task_name: string;
  health_status: string;
  execution_status: string;
  success_count: number;
  error_count: number;
  last_execution_at: string;
  success_rate: number;
}

export const PerformanceMonitoringPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [cachePatterns, setCachePatterns] = useState<CacheUsagePattern[]>([]);
  const [cronStatus, setCronStatus] = useState<CronStatus[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any[]>([]);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadRealtimeData, 30000); // 每30秒更新实时数据
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // 加载性能指标
      const metricsResponse = await fetch(`${apiBaseUrl}/api/universal-questionnaire/performance/metrics?timeRange=${timeRange}`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setPerformanceMetrics(metricsData.data);
      }

      // 加载缓存使用模式
      const patternsResponse = await fetch(`${apiBaseUrl}/api/universal-questionnaire/cache/usage-patterns?timeRange=${timeRange}`);
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setCachePatterns(patternsData.data);
      }

      // 加载定时任务状态
      const cronResponse = await fetch(`${apiBaseUrl}/api/admin/cron/status`);
      if (cronResponse.ok) {
        const cronData = await cronResponse.json();
        setCronStatus(cronData.data || []);
      }

    } catch (error) {
      console.error('加载性能数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/universal-questionnaire/performance/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealtimeMetrics(data.data || []);
      }
    } catch (error) {
      console.error('加载实时数据失败:', error);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'orange';
      case 'unhealthy': return 'red';
      case 'failing': return 'red';
      case 'disabled': return 'gray';
      default: return 'blue';
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'recent': return 'green';
      case 'stale': return 'orange';
      case 'never_executed': return 'red';
      default: return 'blue';
    }
  };

  const cronColumns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Cron表达式',
      dataIndex: 'cron_pattern',
      key: 'cron_pattern',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '健康状态',
      dataIndex: 'health_status',
      key: 'health_status',
      render: (status: string) => (
        <Tag color={getHealthColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '执行状态',
      dataIndex: 'execution_status',
      key: 'execution_status',
      render: (status: string) => (
        <Tag color={getExecutionStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      render: (rate: number) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate >= 95 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: '最后执行',
      dataIndex: 'last_execution_at',
      key: 'last_execution_at',
      render: (time: string) => time ? new Date(time).toLocaleString() : '从未执行'
    }
  ];

  const cacheColumns = [
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '请求频率',
      dataIndex: 'requestFrequency',
      key: 'requestFrequency',
      render: (freq: number) => `${freq.toFixed(1)}/小时`
    },
    {
      title: '缓存命中率',
      dataIndex: 'cacheHitRate',
      key: 'cacheHitRate',
      render: (rate: number) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate >= 90 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: '平均响应时间',
      dataIndex: 'averageResponseTime',
      key: 'averageResponseTime',
      render: (time: number) => `${time.toFixed(0)}ms`
    },
    {
      title: '并发用户',
      dataIndex: 'userConcurrency',
      key: 'userConcurrency'
    }
  ];

  if (loading && !performanceMetrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Title level={2} style={{ margin: 0 }}>
            <DashboardOutlined /> 性能监控仪表板
          </Title>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Select.Option value="1h">1小时</Select.Option>
            <Select.Option value="6h">6小时</Select.Option>
            <Select.Option value="24h">24小时</Select.Option>
            <Select.Option value="7d">7天</Select.Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadPerformanceData}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {performanceMetrics && (
        <>
          {/* 核心指标卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总请求数"
                  value={performanceMetrics.totalRequests}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={performanceMetrics.averageResponseTime}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ 
                    color: performanceMetrics.averageResponseTime > 1000 ? '#cf1322' : 
                           performanceMetrics.averageResponseTime > 500 ? '#fa8c16' : '#3f8600' 
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="缓存命中率"
                  value={performanceMetrics.cacheHitRate}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ 
                    color: performanceMetrics.cacheHitRate >= 90 ? '#3f8600' : 
                           performanceMetrics.cacheHitRate >= 70 ? '#fa8c16' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="错误率"
                  value={performanceMetrics.errorRate}
                  suffix="%"
                  prefix={<WarningOutlined />}
                  valueStyle={{ 
                    color: performanceMetrics.errorRate <= 1 ? '#3f8600' : 
                           performanceMetrics.errorRate <= 5 ? '#fa8c16' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* 详细监控标签页 */}
          <Tabs defaultActiveKey="performance">
            <TabPane tab="性能趋势" key="performance">
              <Card title="响应时间趋势">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceMetrics.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="avgResponseTime" 
                      stroke="#1890ff" 
                      fill="#1890ff" 
                      fillOpacity={0.3}
                      name="平均响应时间(ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </TabPane>

            <TabPane tab="缓存分析" key="cache">
              <Card title="缓存使用模式">
                <Table
                  dataSource={cachePatterns}
                  columns={cacheColumns}
                  rowKey="endpoint"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </TabPane>

            <TabPane tab="定时任务" key="cron">
              <Card title="定时任务状态">
                <Table
                  dataSource={cronStatus}
                  columns={cronColumns}
                  rowKey="cron_pattern"
                  pagination={false}
                />
              </Card>
            </TabPane>

            <TabPane tab="实时监控" key="realtime">
              <Card title="实时性能指标">
                <Timeline>
                  {realtimeMetrics.slice(0, 10).map((metric, index) => (
                    <Timeline.Item
                      key={index}
                      color={metric.responseTime > 1000 ? 'red' : metric.responseTime > 500 ? 'orange' : 'green'}
                    >
                      <Space>
                        <Text strong>{metric.endpoint}</Text>
                        <Tag color={metric.cacheHit ? 'green' : 'orange'}>
                          {metric.cacheHit ? '缓存命中' : '缓存未命中'}
                        </Tag>
                        <Text>{metric.responseTime}ms</Text>
                        <Text type="secondary">{new Date(metric.timestamp).toLocaleTimeString()}</Text>
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PerformanceMonitoringPage;

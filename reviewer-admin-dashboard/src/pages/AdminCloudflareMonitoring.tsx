import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Typography,
  Tooltip,
  Badge
} from 'antd';
import { 
  CloudOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  RocketOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// Cloudflare Analytics 数据接口
interface CloudflareAnalytics {
  requests: {
    total: number;
    cached: number;
    uncached: number;
    cacheHitRate: number;
  };
  bandwidth: {
    total: number;
    cached: number;
    uncached: number;
  };
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  statusCodes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  geography: {
    country: string;
    requests: number;
    bandwidth: number;
  }[];
  threats: {
    total: number;
    blocked: number;
    challenged: number;
    passed: number;
  };
}

interface WorkerMetrics {
  invocations: number;
  errors: number;
  errorRate: number;
  cpuTime: number;
  duration: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

interface D1Metrics {
  queries: number;
  reads: number;
  writes: number;
  avgDuration: number;
  errors: number;
}

const AdminCloudflareMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CloudflareAnalytics | null>(null);
  const [workerMetrics, setWorkerMetrics] = useState<WorkerMetrics | null>(null);
  const [d1Metrics, setD1Metrics] = useState<D1Metrics | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadCloudflareAnalytics();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadCloudflareAnalytics();
      }, 60000); // 每分钟刷新一次

      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadCloudflareAnalytics = async () => {
    setLoading(true);
    try {
      // 模拟 Cloudflare Analytics 数据
      // 实际应用中，这里应该调用 Cloudflare Analytics API
      const mockAnalytics: CloudflareAnalytics = {
        requests: {
          total: 125340,
          cached: 98765,
          uncached: 26575,
          cacheHitRate: 78.8
        },
        bandwidth: {
          total: 45.6, // GB
          cached: 38.2,
          uncached: 7.4
        },
        responseTime: {
          avg: 125,
          p50: 98,
          p95: 245,
          p99: 380
        },
        statusCodes: {
          '2xx': 118234,
          '3xx': 5432,
          '4xx': 1234,
          '5xx': 440
        },
        geography: [
          { country: '中国', requests: 65432, bandwidth: 23.4 },
          { country: '美国', requests: 32145, bandwidth: 12.8 },
          { country: '日本', requests: 15234, bandwidth: 5.6 },
          { country: '新加坡', requests: 8765, bandwidth: 2.9 },
          { country: '其他', requests: 3764, bandwidth: 0.9 }
        ],
        threats: {
          total: 2340,
          blocked: 1876,
          challenged: 345,
          passed: 119
        }
      };

      const mockWorkerMetrics: WorkerMetrics = {
        invocations: 125340,
        errors: 440,
        errorRate: 0.35,
        cpuTime: 12.5, // seconds
        duration: {
          avg: 45,
          p50: 38,
          p95: 125,
          p99: 245
        }
      };

      const mockD1Metrics: D1Metrics = {
        queries: 45678,
        reads: 38234,
        writes: 7444,
        avgDuration: 12.5,
        errors: 23
      };

      setAnalytics(mockAnalytics);
      setWorkerMetrics(mockWorkerMetrics);
      setD1Metrics(mockD1Metrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('加载 Cloudflare Analytics 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  };

  const formatBytes = (bytes: number): string => {
    return `${bytes.toFixed(2)} GB`;
  };

  const geographyColumns = [
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      render: (text: string) => (
        <Space>
          <GlobalOutlined />
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: '请求数',
      dataIndex: 'requests',
      key: 'requests',
      render: (num: number) => formatNumber(num),
      sorter: (a: any, b: any) => a.requests - b.requests
    },
    {
      title: '流量 (GB)',
      dataIndex: 'bandwidth',
      key: 'bandwidth',
      render: (num: number) => num.toFixed(2),
      sorter: (a: any, b: any) => a.bandwidth - b.bandwidth
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card loading={true}>
          <div style={{ height: '400px' }} />
        </Card>
      </div>
    );
  }

  if (!analytics || !workerMetrics || !d1Metrics) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Text type="danger">无法加载 Cloudflare Analytics 数据</Text>
        </Card>
      </div>
    );
  }

  const successRate = ((analytics.statusCodes['2xx'] + analytics.statusCodes['3xx']) / analytics.requests.total * 100).toFixed(2);
  const errorRate = ((analytics.statusCodes['4xx'] + analytics.statusCodes['5xx']) / analytics.requests.total * 100).toFixed(2);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <CloudOutlined /> Cloudflare 流量与性能监控
        </Title>
        <Space>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="1h">最近 1 小时</Option>
            <Option value="6h">最近 6 小时</Option>
            <Option value="24h">最近 24 小时</Option>
            <Option value="7d">最近 7 天</Option>
            <Option value="30d">最近 30 天</Option>
          </Select>
          <Button 
            icon={<SyncOutlined spin={loading} />} 
            onClick={loadCloudflareAnalytics}
            loading={loading}
          >
            刷新
          </Button>
          <Tooltip title={autoRefresh ? '自动刷新已开启' : '自动刷新已关闭'}>
            <Button 
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '自动刷新' : '手动刷新'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
        最后更新: {lastUpdate.toLocaleString('zh-CN')}
      </Text>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总请求数"
              value={analytics.requests.total}
              formatter={(value) => formatNumber(value as number)}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="缓存命中率"
              value={analytics.requests.cacheHitRate}
              suffix="%"
              prefix={<RocketOutlined />}
              valueStyle={{ color: analytics.requests.cacheHitRate > 70 ? '#52c41a' : '#faad14' }}
            />
            <Progress 
              percent={analytics.requests.cacheHitRate} 
              strokeColor={analytics.requests.cacheHitRate > 70 ? '#52c41a' : '#faad14'}
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={analytics.responseTime.avg}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: analytics.responseTime.avg < 200 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功率"
              value={successRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: parseFloat(successRate) > 95 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Worker 性能指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title={<><RocketOutlined /> Cloudflare Workers 性能</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="调用次数"
                  value={workerMetrics.invocations}
                  formatter={(value) => formatNumber(value as number)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="错误率"
                  value={workerMetrics.errorRate}
                  suffix="%"
                  valueStyle={{ color: workerMetrics.errorRate < 1 ? '#52c41a' : '#f5222d' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="平均执行时间"
                  value={workerMetrics.duration.avg}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="CPU 时间"
                  value={workerMetrics.cpuTime}
                  suffix="s"
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">P50: {workerMetrics.duration.p50}ms | P95: {workerMetrics.duration.p95}ms | P99: {workerMetrics.duration.p99}ms</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><DatabaseOutlined /> D1 数据库性能</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总查询数"
                  value={d1Metrics.queries}
                  formatter={(value) => formatNumber(value as number)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均查询时间"
                  value={d1Metrics.avgDuration}
                  suffix="ms"
                  valueStyle={{ color: d1Metrics.avgDuration < 20 ? '#52c41a' : '#faad14' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={8}>
                <Statistic
                  title="读操作"
                  value={d1Metrics.reads}
                  formatter={(value) => formatNumber(value as number)}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="写操作"
                  value={d1Metrics.writes}
                  formatter={(value) => formatNumber(value as number)}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="错误数"
                  value={d1Metrics.errors}
                  valueStyle={{ color: d1Metrics.errors > 50 ? '#f5222d' : '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* HTTP 状态码分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title={<><LineChartOutlined /> HTTP 状态码分布</>}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>2xx (成功)</Text>
                  <Text strong>{formatNumber(analytics.statusCodes['2xx'])}</Text>
                </div>
                <Progress
                  percent={(analytics.statusCodes['2xx'] / analytics.requests.total * 100)}
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>3xx (重定向)</Text>
                  <Text strong>{formatNumber(analytics.statusCodes['3xx'])}</Text>
                </div>
                <Progress
                  percent={(analytics.statusCodes['3xx'] / analytics.requests.total * 100)}
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>4xx (客户端错误)</Text>
                  <Text strong>{formatNumber(analytics.statusCodes['4xx'])}</Text>
                </div>
                <Progress
                  percent={(analytics.statusCodes['4xx'] / analytics.requests.total * 100)}
                  strokeColor="#faad14"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>5xx (服务器错误)</Text>
                  <Text strong>{formatNumber(analytics.statusCodes['5xx'])}</Text>
                </div>
                <Progress
                  percent={(analytics.statusCodes['5xx'] / analytics.requests.total * 100)}
                  strokeColor="#f5222d"
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><SafetyOutlined /> 安全威胁防护</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总威胁数"
                  value={analytics.threats.total}
                  formatter={(value) => formatNumber(value as number)}
                  prefix={<Badge status="warning" />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="拦截率"
                  value={((analytics.threats.blocked / analytics.threats.total) * 100).toFixed(2)}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="red">已拦截</Tag>
                    <Text>{formatNumber(analytics.threats.blocked)}</Text>
                  </Space>
                  <Text type="secondary">{((analytics.threats.blocked / analytics.threats.total) * 100).toFixed(1)}%</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="orange">已挑战</Tag>
                    <Text>{formatNumber(analytics.threats.challenged)}</Text>
                  </Space>
                  <Text type="secondary">{((analytics.threats.challenged / analytics.threats.total) * 100).toFixed(1)}%</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Space>
                    <Tag color="green">已通过</Tag>
                    <Text>{formatNumber(analytics.threats.passed)}</Text>
                  </Space>
                  <Text type="secondary">{((analytics.threats.passed / analytics.threats.total) * 100).toFixed(1)}%</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 地理分布 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={<><GlobalOutlined /> 流量地理分布</>}>
            <Table
              columns={geographyColumns}
              dataSource={analytics.geography}
              rowKey="country"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 响应时间分布 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Card title={<><ThunderboltOutlined /> 响应时间分布</>}>
            <Row gutter={16}>
              <Col xs={24} sm={6}>
                <Statistic
                  title="平均响应时间"
                  value={analytics.responseTime.avg}
                  suffix="ms"
                  valueStyle={{ color: analytics.responseTime.avg < 200 ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="P50 (中位数)"
                  value={analytics.responseTime.p50}
                  suffix="ms"
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="P95"
                  value={analytics.responseTime.p95}
                  suffix="ms"
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="P99"
                  value={analytics.responseTime.p99}
                  suffix="ms"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 带宽使用 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Card title="📊 带宽使用情况">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="总带宽"
                  value={analytics.bandwidth.total}
                  suffix="GB"
                  prefix={<CloudOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="缓存带宽"
                  value={analytics.bandwidth.cached}
                  suffix="GB"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="未缓存带宽"
                  value={analytics.bandwidth.uncached}
                  suffix="GB"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                缓存节省: {((analytics.bandwidth.cached / analytics.bandwidth.total) * 100).toFixed(2)}%
                ({formatBytes(analytics.bandwidth.cached)} / {formatBytes(analytics.bandwidth.total)})
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminCloudflareMonitoring;


import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Progress,
  Tabs
} from 'antd';
import {
  ReloadOutlined,
  BugOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { LineChart, BarChart } from '../../components/charts';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { errorMonitor } from '../../utils/errorMonitor';
import { cacheManager } from '../../utils/cacheManager';
import styles from './PerformanceMonitorPage.module.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const PerformanceMonitorPage: React.FC = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // 获取性能指标
    const metrics = performanceMonitor.getMetrics();
    const resources = performanceMonitor.getResourceTimings();
    const memory = performanceMonitor.getMemoryUsage();
    
    setPerformanceMetrics({
      ...metrics,
      resources,
      memory
    });

    // 获取错误统计
    const errors = errorMonitor.getErrorStats();
    setErrorStats(errors);

    // 获取缓存统计
    const memoryCache = cacheManager.getStats('memory');
    const localCache = cacheManager.getStats('localStorage');
    const sessionCache = cacheManager.getStats('sessionStorage');
    
    setCacheStats({
      memory: memoryCache,
      localStorage: localCache,
      sessionStorage: sessionCache
    });

    setLoading(false);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleClearCache = () => {
    cacheManager.clear('memory');
    cacheManager.clear('localStorage');
    cacheManager.clear('sessionStorage');
    loadData();
  };

  const handleClearErrors = () => {
    errorMonitor.clearErrors();
    loadData();
  };

  const getPerformanceScore = (metrics: any) => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // FCP 评分 (First Contentful Paint)
    if (metrics.firstContentfulPaint > 3000) score -= 20;
    else if (metrics.firstContentfulPaint > 1800) score -= 10;
    
    // LCP 评分 (Largest Contentful Paint)
    if (metrics.largestContentfulPaint > 4000) score -= 20;
    else if (metrics.largestContentfulPaint > 2500) score -= 10;
    
    // FID 评分 (First Input Delay)
    if (metrics.firstInputDelay > 300) score -= 20;
    else if (metrics.firstInputDelay > 100) score -= 10;
    
    // CLS 评分 (Cumulative Layout Shift)
    if (metrics.cumulativeLayoutShift > 0.25) score -= 20;
    else if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    
    return Math.max(0, score);
  };

  const resourceColumns = [
    {
      title: '资源',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        const fileName = name.split('/').pop() || name;
        return <Text ellipsis title={name}>{fileName}</Text>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          script: 'blue',
          stylesheet: 'green',
          image: 'orange',
          font: 'purple',
          other: 'default'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '加载时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration.toFixed(2)}ms`
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => {
        if (size === 0) return '-';
        if (size < 1024) return `${size}B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
        return `${(size / (1024 * 1024)).toFixed(1)}MB`;
      }
    }
  ];

  const errorColumns = [
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => <Text ellipsis title={message}>{message}</Text>
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colors: Record<string, string> = {
          error: 'red',
          warning: 'orange',
          info: 'blue'
        };
        return <Tag color={colors[level]}>{level}</Tag>;
      }
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    }
  ];

  const performanceScore = getPerformanceScore(performanceMetrics);

  return (
    <Layout className="min-h-screen">
      <Content className={styles.content}>
        <div className={styles.header}>
          <Title level={2}>性能监控</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新数据
            </Button>
          </Space>
        </div>

        {/* 性能概览 */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="性能评分"
                value={performanceScore}
                suffix="/100"
                valueStyle={{ 
                  color: performanceScore >= 80 ? '#52c41a' : 
                         performanceScore >= 60 ? '#fa8c16' : '#f5222d' 
                }}
                prefix={<ThunderboltOutlined />}
              />
              <Progress 
                percent={performanceScore} 
                strokeColor={
                  performanceScore >= 80 ? '#52c41a' : 
                  performanceScore >= 60 ? '#fa8c16' : '#f5222d'
                }
                size="small"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="页面加载时间"
                value={performanceMetrics?.loadTime || 0}
                precision={0}
                suffix="ms"
                valueStyle={{ color: '#1890ff' }}
                prefix={<GlobalOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="错误数量"
                value={errorStats?.totalErrors || 0}
                valueStyle={{ color: '#f5222d' }}
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="缓存命中"
                value={cacheStats?.memory?.size || 0}
                suffix="项"
                valueStyle={{ color: '#52c41a' }}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 详细监控数据 */}
        <Tabs defaultActiveKey="performance">
          <TabPane tab="性能指标" key="performance">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="核心性能指标">
                  {performanceMetrics && (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>首次内容绘制 (FCP): </Text>
                        <Text>{performanceMetrics.firstContentfulPaint?.toFixed(2) || 'N/A'}ms</Text>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>最大内容绘制 (LCP): </Text>
                        <Text>{performanceMetrics.largestContentfulPaint?.toFixed(2) || 'N/A'}ms</Text>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>首次输入延迟 (FID): </Text>
                        <Text>{performanceMetrics.firstInputDelay?.toFixed(2) || 'N/A'}ms</Text>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>累积布局偏移 (CLS): </Text>
                        <Text>{performanceMetrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}</Text>
                      </div>
                      <div>
                        <Text strong>DOM 内容加载: </Text>
                        <Text>{performanceMetrics.domContentLoaded?.toFixed(2) || 'N/A'}ms</Text>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="内存使用情况">
                  {performanceMetrics?.memory && (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>已使用内存: </Text>
                        <Text>{(performanceMetrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</Text>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>总内存: </Text>
                        <Text>{(performanceMetrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</Text>
                      </div>
                      <div>
                        <Text strong>内存限制: </Text>
                        <Text>{(performanceMetrics.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</Text>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
            
            <Card title="资源加载详情" style={{ marginTop: 16 }}>
              <Table
                columns={resourceColumns}
                dataSource={performanceMetrics?.resources || []}
                rowKey="name"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab="错误监控" key="errors">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card 
                  title="错误统计" 
                  extra={
                    <Button danger onClick={handleClearErrors}>
                      清空错误
                    </Button>
                  }
                >
                  {errorStats?.totalErrors > 0 && (
                    <Alert
                      message={`检测到 ${errorStats.totalErrors} 个错误`}
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  
                  <Table
                    columns={errorColumns}
                    dataSource={errorStats?.recentErrors || []}
                    rowKey="timestamp"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="缓存管理" key="cache">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card title="内存缓存">
                  <Statistic
                    title="缓存项数"
                    value={cacheStats?.memory?.size || 0}
                    suffix="项"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card title="本地存储缓存">
                  <Statistic
                    title="缓存项数"
                    value={cacheStats?.localStorage?.size || 0}
                    suffix="项"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card title="会话存储缓存">
                  <Statistic
                    title="缓存项数"
                    value={cacheStats?.sessionStorage?.size || 0}
                    suffix="项"
                  />
                </Card>
              </Col>
            </Row>
            
            <Card 
              title="缓存管理" 
              style={{ marginTop: 16 }}
              extra={
                <Button danger onClick={handleClearCache}>
                  清空所有缓存
                </Button>
              }
            >
              <Alert
                message="缓存管理"
                description="缓存可以提高应用性能，但过多的缓存可能占用内存。建议定期清理不必要的缓存。"
                type="info"
                showIcon
              />
            </Card>
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

/**
 * AI监控面板页面
 * 
 * 实时监控AI服务的性能、健康状态和使用情况
 */

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
  Typography,
  Alert,
  Timeline,
  Tooltip
} from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  LineChartOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../../components/layout/RoleBasedLayout';
// import { realAIService } from '../../../services/realAIService'; // 已移动到归档目录

// 模拟 AI 监控服务
const mockRealAIService = {
  getSystemMetrics: async () => ({
    overview: {
      totalRequests: 12450,
      successRate: 98.5,
      totalCost: 245.67,
      systemHealth: 95,
      averageResponseTime: 120
    },
    performance: {
      requestsPerMinute: 45,
      errorRate: 1.5,
      averageLatency: 120,
      throughput: 850
    },
    resources: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      diskUsage: 34.1,
      networkIO: 125.6
    },
    costs: {
      hourly: 10.25,
      daily: 245.67,
      monthly: 7370.10,
      projected: 8500.00
    }
  })
};
import type { SystemMetrics } from '../../../types/ai-water-management';

const { Title, Text } = Typography;

export const AIMonitorPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 加载系统指标
  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await mockRealAIService.getSystemMetrics();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('加载系统指标失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadMetrics();
    
    // 设置定时刷新
    const interval = setInterval(loadMetrics, 30000); // 30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);

  // 获取健康状态颜色
  const getHealthColor = (health: number) => {
    if (health >= 95) return '#52c41a';
    if (health >= 80) return '#faad14';
    return '#ff4d4f';
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusConfig = {
      active: { color: 'green', icon: <CheckCircleOutlined />, text: '运行中' },
      inactive: { color: 'default', text: '已停用' },
      error: { color: 'red', icon: <CloseCircleOutlined />, text: '错误' },
      maintenance: { color: 'orange', icon: <ExclamationCircleOutlined />, text: '维护中' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  if (!metrics) {
    return (
      <AdminLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <ThunderboltOutlined spin style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={3}>正在加载监控数据...</Title>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8 }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={2}>
                <DashboardOutlined /> AI监控面板
              </Title>
              <Text type="secondary">
                实时监控AI服务的性能、健康状态和使用情况
              </Text>
            </div>
            <Space>
              <Text type="secondary">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </Text>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadMetrics}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Space>
        </div>

        {/* 系统概览 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总水源数"
                value={metrics.overview.totalSources}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="运行中"
                value={metrics.overview.activeSources}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总请求数"
                value={metrics.overview.totalRequests}
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总成本"
                value={metrics.overview.totalCost}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 系统健康状态 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="系统健康度" extra={<CheckCircleOutlined style={{ color: getHealthColor(metrics.overview.systemHealth) }} />}>
              <Progress
                type="circle"
                percent={metrics.overview.systemHealth}
                strokeColor={getHealthColor(metrics.overview.systemHealth)}
                format={(percent) => `${percent}%`}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">
                  平均响应时间: {metrics.overview.averageResponseTime}ms
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="性能指标">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>请求/分钟</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={(metrics.performance.requestsPerMinute / 100) * 100}
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                    <Text style={{ float: 'right' }}>{metrics.performance.requestsPerMinute}</Text>
                  </div>
                </div>
                <div>
                  <Text>错误率</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={metrics.performance.errorRate * 100}
                      showInfo={false}
                      strokeColor="#ff4d4f"
                    />
                    <Text style={{ float: 'right' }}>{(metrics.performance.errorRate * 100).toFixed(2)}%</Text>
                  </div>
                </div>
                <div>
                  <Text>系统正常运行时间</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={metrics.performance.uptime}
                      showInfo={false}
                      strokeColor="#52c41a"
                    />
                    <Text style={{ float: 'right' }}>{metrics.performance.uptime.toFixed(2)}%</Text>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 水源状态详情 */}
        <Card title="水源状态详情" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {Object.entries(metrics.sources).map(([sourceId, source]) => (
              <Col span={8} key={sourceId} style={{ marginBottom: 16 }}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{sourceId.toUpperCase()}</Text>
                      {getStatusTag(source.status)}
                    </div>
                    
                    <div>
                      <Text type="secondary">健康度</Text>
                      <Progress
                        percent={source.health}
                        size="small"
                        strokeColor={getHealthColor(source.health)}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                    
                    <Row gutter={8}>
                      <Col span={12}>
                        <Statistic
                          title="请求数"
                          value={source.requestCount}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="成本"
                          value={source.cost}
                          precision={2}
                          prefix="$"
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    </Row>
                    
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          响应: {source.responseTime}ms
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          错误率: {(source.errorRate * 100).toFixed(1)}%
                        </Text>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 成本分析 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="成本分析">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>今日成本</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Progress
                      percent={metrics.costs.budgetUtilization.daily * 100}
                      showInfo={false}
                      strokeColor={metrics.costs.budgetUtilization.daily > 0.8 ? '#ff4d4f' : '#1890ff'}
                      style={{ flex: 1, marginRight: 16 }}
                    />
                    <Text>${metrics.costs.today.toFixed(2)}</Text>
                  </div>
                </div>
                
                <div>
                  <Text>本月成本</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Progress
                      percent={metrics.costs.budgetUtilization.monthly * 100}
                      showInfo={false}
                      strokeColor={metrics.costs.budgetUtilization.monthly > 0.8 ? '#ff4d4f' : '#1890ff'}
                      style={{ flex: 1, marginRight: 16 }}
                    />
                    <Text>${metrics.costs.thisMonth.toFixed(2)}</Text>
                  </div>
                </div>

                {(metrics.costs.budgetUtilization.daily > 0.8 || metrics.costs.budgetUtilization.monthly > 0.8) && (
                  <Alert
                    message="预算预警"
                    description="当前成本使用已超过预算的80%，请注意控制使用量"
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="成本分布">
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(metrics.costs.breakdown).map(([provider, cost]) => (
                  <div key={provider} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{provider.toUpperCase()}</Text>
                    <Space>
                      <Progress
                        percent={(cost / metrics.costs.thisMonth) * 100}
                        showInfo={false}
                        strokeColor="#1890ff"
                        style={{ width: 100 }}
                      />
                      <Text>${cost.toFixed(2)}</Text>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

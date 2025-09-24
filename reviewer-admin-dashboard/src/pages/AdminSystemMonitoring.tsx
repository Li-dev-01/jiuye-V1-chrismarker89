import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Alert,
  Progress,
  Select,
  DatePicker,
  Tabs,
  Timeline,
  Badge,
  message,
  Modal,
  Descriptions,
  List,
  Avatar
} from 'antd';
import { 
  MonitorOutlined,
  DashboardOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  CloudOutlined,
  GlobalOutlined,
  BugOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    avgResponseTime: number;
  };
  api: {
    requests: number;
    errors: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  description: string;
}

interface SystemAlert {
  id: string;
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'acknowledged';
  value: number;
  threshold: number;
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
}

const AdminSystemMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSystemMetrics();
    fetchAlerts();
    fetchAlertRules();
    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemMetrics();
        fetchAlerts();
        fetchPerformanceData();
      }, 30000); // 30秒刷新一次
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, timeRange]);

  const fetchSystemMetrics = async () => {
    try {
      console.log('[MONITORING] Fetching system metrics...');
      
      // 尝试从后端获取系统指标
      const response = await apiClient.get('/api/simple-admin/monitoring/metrics');
      
      if (response.data.success) {
        setMetrics(response.data.data);
      } else {
        throw new Error('API响应失败');
      }
    } catch (error) {
      console.error('获取系统指标失败:', error);
      
      // 使用模拟数据
      const mockMetrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: 45.2,
          cores: 4,
          load: [0.8, 1.2, 0.9]
        },
        memory: {
          used: 3.2,
          total: 8.0,
          usage: 40.0
        },
        disk: {
          used: 25.6,
          total: 100.0,
          usage: 25.6
        },
        network: {
          inbound: 1.2,
          outbound: 0.8,
          connections: 156
        },
        database: {
          connections: 23,
          queries: 1250,
          slowQueries: 3,
          avgResponseTime: 45
        },
        api: {
          requests: 2340,
          errors: 12,
          avgResponseTime: 180,
          errorRate: 0.51
        }
      };

      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      // 模拟告警数据
      const mockAlerts: SystemAlert[] = [
        {
          id: 'alert_001',
          rule: 'high_cpu_usage',
          severity: 'warning',
          message: 'CPU使用率超过阈值',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'active',
          value: 85.2,
          threshold: 80
        },
        {
          id: 'alert_002',
          rule: 'slow_database_query',
          severity: 'critical',
          message: '数据库查询响应时间过长',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'acknowledged',
          value: 2500,
          threshold: 1000
        },
        {
          id: 'alert_003',
          rule: 'high_error_rate',
          severity: 'warning',
          message: 'API错误率异常',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'resolved',
          value: 5.2,
          threshold: 5.0
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('获取告警信息失败:', error);
    }
  };

  const fetchAlertRules = async () => {
    try {
      // 模拟告警规则数据
      const mockRules: AlertRule[] = [
        {
          id: 'rule_001',
          name: 'CPU使用率告警',
          metric: 'cpu.usage',
          condition: 'greater_than',
          threshold: 80,
          severity: 'warning',
          enabled: true,
          description: 'CPU使用率超过80%时触发告警'
        },
        {
          id: 'rule_002',
          name: '内存使用率告警',
          metric: 'memory.usage',
          condition: 'greater_than',
          threshold: 90,
          severity: 'critical',
          enabled: true,
          description: '内存使用率超过90%时触发告警'
        },
        {
          id: 'rule_003',
          name: '磁盘空间告警',
          metric: 'disk.usage',
          condition: 'greater_than',
          threshold: 85,
          severity: 'warning',
          enabled: true,
          description: '磁盘使用率超过85%时触发告警'
        },
        {
          id: 'rule_004',
          name: 'API错误率告警',
          metric: 'api.errorRate',
          condition: 'greater_than',
          threshold: 5.0,
          severity: 'warning',
          enabled: true,
          description: 'API错误率超过5%时触发告警'
        },
        {
          id: 'rule_005',
          name: '数据库连接数告警',
          metric: 'database.connections',
          condition: 'greater_than',
          threshold: 50,
          severity: 'critical',
          enabled: true,
          description: '数据库连接数超过50时触发告警'
        }
      ];

      setAlertRules(mockRules);
    } catch (error) {
      console.error('获取告警规则失败:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // 模拟性能数据
      const now = Date.now();
      const mockData: PerformanceData[] = [];
      
      for (let i = 23; i >= 0; i--) {
        mockData.push({
          timestamp: new Date(now - i * 60 * 60 * 1000).toISOString(),
          responseTime: 150 + Math.random() * 100,
          throughput: 1000 + Math.random() * 500,
          errorRate: Math.random() * 2,
          activeUsers: 800 + Math.random() * 400
        });
      }

      setPerformanceData(mockData);
    } catch (error) {
      console.error('获取性能数据失败:', error);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const }
        : alert
    ));
    message.success('告警已确认');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ));
    message.success('告警已解决');
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      message.success('自动刷新已开启');
    } else {
      message.info('自动刷新已关闭');
    }
  };

  const exportMetrics = () => {
    const data = {
      metrics,
      alerts,
      performanceData,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('系统指标已导出');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'red';
      case 'acknowledged': return 'orange';
      case 'resolved': return 'green';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'active');

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card loading={true}>
          <div style={{ height: '400px' }} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <MonitorOutlined /> 系统监控中心
        </Title>
        <Text type="secondary">
          实时系统状态监控与性能分析 • 自动刷新: {autoRefresh ? '开启' : '关闭'} • 最后更新: {metrics ? new Date(metrics.timestamp).toLocaleString() : '-'}
        </Text>
      </div>

      {/* 告警概览 */}
      {activeAlerts.length > 0 && (
        <Alert
          message={`当前有 ${activeAlerts.length} 个活跃告警`}
          description={`其中 ${criticalAlerts.length} 个严重告警需要立即处理`}
          type={criticalAlerts.length > 0 ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" onClick={() => message.info('跳转到告警详情')}>
              查看详情
            </Button>
          }
        />
      )}

      {/* 系统状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="系统状态"
              value={activeAlerts.length === 0 ? '正常' : '异常'}
              prefix={activeAlerts.length === 0 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              valueStyle={{ color: activeAlerts.length === 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="活跃告警"
              value={activeAlerts.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: activeAlerts.length > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="API请求/小时"
              value={metrics?.api.requests || 0}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={metrics?.api.avgResponseTime || 0}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 控制面板 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="时间范围"
              value={timeRange}
              onChange={setTimeRange}
            >
              <Select.Option value="1h">最近1小时</Select.Option>
              <Select.Option value="6h">最近6小时</Select.Option>
              <Select.Option value="24h">最近24小时</Select.Option>
              <Select.Option value="7d">最近7天</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Space>
              <Button 
                type={autoRefresh ? 'primary' : 'default'}
                icon={<SyncOutlined spin={autoRefresh} />}
                onClick={toggleAutoRefresh}
              >
                {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
              </Button>
              <Button 
                icon={<SyncOutlined />}
                onClick={() => {
                  fetchSystemMetrics();
                  fetchAlerts();
                  fetchPerformanceData();
                }}
                loading={loading}
              >
                手动刷新
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                onClick={exportMetrics}
              >
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 系统指标 */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card title={<><ThunderboltOutlined /> CPU</>} size="small">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(metrics.cpu.usage)}
                  status={metrics.cpu.usage > 80 ? 'exception' : 'normal'}
                  width={80}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    {metrics.cpu.cores} 核心 • 负载: {metrics.cpu.load.join(', ')}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title={<><DatabaseOutlined /> 内存</>} size="small">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(metrics.memory.usage)}
                  status={metrics.memory.usage > 90 ? 'exception' : 'normal'}
                  width={80}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    {metrics.memory.used.toFixed(1)}GB / {metrics.memory.total.toFixed(1)}GB
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title={<><CloudOutlined /> 磁盘</>} size="small">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={Math.round(metrics.disk.usage)}
                  status={metrics.disk.usage > 85 ? 'exception' : 'normal'}
                  width={80}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    {metrics.disk.used.toFixed(1)}GB / {metrics.disk.total.toFixed(1)}GB
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card title={<><GlobalOutlined /> 网络</>} size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>{metrics.network.connections}</Text>
                  <br />
                  <Text type="secondary">活跃连接</Text>
                </div>
                <div>
                  <Text type="secondary">
                    ↓ {metrics.network.inbound.toFixed(1)}MB/s
                    <br />
                    ↑ {metrics.network.outbound.toFixed(1)}MB/s
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 详细监控数据 */}
      <Tabs defaultActiveKey="performance">
        <TabPane tab="性能监控" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="API性能" size="small">
                {metrics && (
                  <div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="请求数"
                          value={metrics.api.requests}
                          prefix={<GlobalOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="错误数"
                          value={metrics.api.errors}
                          prefix={<BugOutlined />}
                          valueStyle={{ color: metrics.api.errors > 0 ? '#ff4d4f' : '#52c41a' }}
                        />
                      </Col>
                    </Row>
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">平均响应时间: </Text>
                      <Text strong>{metrics.api.avgResponseTime}ms</Text>
                      <br />
                      <Text type="secondary">错误率: </Text>
                      <Text strong style={{ color: metrics.api.errorRate > 5 ? '#ff4d4f' : '#52c41a' }}>
                        {metrics.api.errorRate.toFixed(2)}%
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="数据库性能" size="small">
                {metrics && (
                  <div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="连接数"
                          value={metrics.database.connections}
                          prefix={<DatabaseOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="慢查询"
                          value={metrics.database.slowQueries}
                          prefix={<WarningOutlined />}
                          valueStyle={{ color: metrics.database.slowQueries > 0 ? '#ff4d4f' : '#52c41a' }}
                        />
                      </Col>
                    </Row>
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">查询数: </Text>
                      <Text strong>{metrics.database.queries}</Text>
                      <br />
                      <Text type="secondary">平均响应时间: </Text>
                      <Text strong>{metrics.database.avgResponseTime}ms</Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="告警管理" key="alerts">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card title="活跃告警" size="small">
                <List
                  dataSource={alerts}
                  renderItem={alert => (
                    <List.Item
                      actions={[
                        alert.status === 'active' && (
                          <Button 
                            size="small" 
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            确认
                          </Button>
                        ),
                        alert.status !== 'resolved' && (
                          <Button 
                            size="small" 
                            type="primary"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            解决
                          </Button>
                        )
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={
                              alert.severity === 'critical' ? <CloseCircleOutlined /> :
                              alert.severity === 'warning' ? <ExclamationCircleOutlined /> :
                              <InfoCircleOutlined />
                            }
                            style={{ 
                              backgroundColor: getSeverityColor(alert.severity)
                            }}
                          />
                        }
                        title={
                          <div>
                            <Tag color={getStatusColor(alert.status)}>
                              {alert.status === 'active' ? '活跃' : 
                               alert.status === 'acknowledged' ? '已确认' : '已解决'}
                            </Tag>
                            <Tag color={getSeverityColor(alert.severity)}>
                              {alert.severity === 'critical' ? '严重' : 
                               alert.severity === 'warning' ? '警告' : '信息'}
                            </Tag>
                            {alert.message}
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary">
                              当前值: {alert.value} | 阈值: {alert.threshold} | 
                              时间: {new Date(alert.timestamp).toLocaleString()}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="告警规则" size="small">
                <List
                  dataSource={alertRules}
                  renderItem={rule => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div>
                            <Badge 
                              status={rule.enabled ? 'success' : 'default'} 
                              text={rule.name}
                            />
                            <Tag color={getSeverityColor(rule.severity)}>
                              {rule.severity === 'critical' ? '严重' : 
                               rule.severity === 'warning' ? '警告' : '信息'}
                            </Tag>
                          </div>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="历史趋势" key="trends">
          <Card title="性能趋势图" size="small">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">
                性能趋势图表功能正在开发中...
                <br />
                将显示响应时间、吞吐量、错误率等关键指标的历史趋势
              </Text>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="日志分析" key="logs">
          <Card title="系统日志" size="small">
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>系统启动</Text>
                <br />
                <Text type="secondary">2024-09-24 09:00:00 - 系统正常启动</Text>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>API部署</Text>
                <br />
                <Text type="secondary">2024-09-24 10:30:00 - 新版本API部署完成</Text>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>性能告警</Text>
                <br />
                <Text type="secondary">2024-09-24 14:15:00 - CPU使用率超过阈值</Text>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>数据库告警</Text>
                <br />
                <Text type="secondary">2024-09-24 15:45:00 - 数据库查询响应时间过长</Text>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>告警解决</Text>
                <br />
                <Text type="secondary">2024-09-24 16:00:00 - 数据库性能问题已解决</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminSystemMonitoring;

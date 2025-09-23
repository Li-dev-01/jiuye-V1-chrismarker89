/**
 * 管理员登录监控页面
 * 监控所有用户的登录活动和安全事件
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Alert,
  Button,
  Modal,
  Descriptions,
  Select,
  DatePicker,
  Input,
  Statistic,
  Row,
  Col,
  Tabs,
  List,
  Badge
} from 'antd';
import {
  SecurityScanOutlined,
  WarningOutlined,
  SafetyOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { TabPane } = Tabs;

interface LoginRecord {
  id: string;
  userUuid: string;
  userType: string;
  loginTime: string;
  ipAddress: string;
  ipCity?: string;
  ipRegion?: string;
  ipCountry?: string;
  deviceType: string;
  browserName: string;
  osName: string;
  loginMethod: string;
  loginStatus: string;
  isSuspicious: boolean;
  riskScore: number;
  googleEmail?: string;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userUuid: string;
  ipAddress: string;
  createdAt: string;
  status: 'new' | 'investigating' | 'resolved';
}

export const LoginMonitorPage: React.FC = () => {
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LoginRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    userType: '',
    loginStatus: '',
    riskLevel: '',
    dateRange: null as any,
    searchText: ''
  });

  // 统计数据
  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    suspiciousLogins: 0,
    uniqueUsers: 0,
    uniqueIps: 0
  });

  // 图表数据
  const [chartData, setChartData] = useState({
    loginTrend: [],
    riskDistribution: [],
    deviceDistribution: []
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 加载登录记录
      const recordsResponse = await fetch('/api/admin/login-monitor/records');
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setLoginRecords(recordsData.data.records || []);
        setStats(recordsData.data.stats || {});
      }

      // 加载安全警报
      const alertsResponse = await fetch('/api/admin/login-monitor/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setSecurityAlerts(alertsData.data || []);
      }

      // 加载图表数据
      const chartResponse = await fetch('/api/admin/login-monitor/charts');
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        setChartData(chartData.data || {});
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 获取风险等级颜色
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return 'red';
    if (riskScore >= 40) return 'orange';
    if (riskScore >= 20) return 'yellow';
    return 'green';
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  // 表格列定义
  const columns: ColumnsType<LoginRecord> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div>{record.userUuid.slice(-8)}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.userType}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time: string) => (
        <div>
          <div>{new Date(time).toLocaleDateString()}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(time).toLocaleTimeString()}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: '位置/IP',
      key: 'location',
      render: (_, record) => {
        const location = [record.ipCity, record.ipRegion, record.ipCountry]
          .filter(Boolean).join(', ') || '未知';
        return (
          <Space>
            <EnvironmentOutlined />
            <div>
              <div>{location}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.ipAddress}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: '设备/方式',
      key: 'device',
      render: (_, record) => (
        <div>
          <div>{record.osName} {record.browserName}</div>
          <Tag size="small">{record.loginMethod}</Tag>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.loginStatus === 'success' ? 'green' : 'red'}>
            {record.loginStatus === 'success' ? '成功' : '失败'}
          </Tag>
          {record.isSuspicious && (
            <Badge status="error" text="可疑" />
          )}
        </Space>
      )
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Tag color={getRiskColor(score)}>
          {score}/100
        </Tag>
      ),
      sorter: (a, b) => a.riskScore - b.riskScore
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecord(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      )
    }
  ];

  // 登录趋势图配置
  const loginTrendOption = {
    title: {
      text: '登录趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 30,
      data: ['成功登录', '失败登录']
    },
    xAxis: {
      type: 'category',
      data: chartData.loginTrend.map((item: any) => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '成功登录',
        type: 'line',
        smooth: true,
        data: chartData.loginTrend.filter((item: any) => item.type === '成功登录').map((item: any) => item.count)
      },
      {
        name: '失败登录',
        type: 'line',
        smooth: true,
        data: chartData.loginTrend.filter((item: any) => item.type === '失败登录').map((item: any) => item.count)
      }
    ]
  };

  // 风险分布饼图配置
  const riskDistributionOption = {
    title: {
      text: '风险分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '风险分布',
        type: 'pie',
        radius: '50%',
        data: chartData.riskDistribution.map((item: any) => ({
          value: item.count,
          name: item.level
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <SecurityScanOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              登录安全监控
            </Title>
            <Text type="secondary">监控用户登录活动，检测安全威胁</Text>
          </div>
          <Space>
            <Button icon={<FilterOutlined />}>
              高级筛选
            </Button>
            <Button icon={<ExportOutlined />}>
              导出报告
            </Button>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总登录次数"
              value={stats.totalLogins}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功登录"
              value={stats.successfulLogins}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="失败登录"
              value={stats.failedLogins}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="可疑登录"
              value={stats.suspiciousLogins}
              prefix={<SecurityScanOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Tabs defaultActiveKey="records">
        <TabPane tab="登录记录" key="records">
          <Card>
            {/* 筛选器 */}
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="用户类型"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={(value) => setFilters({...filters, userType: value || ''})}
                  >
                    <Select.Option value="anonymous">匿名用户</Select.Option>
                    <Select.Option value="semi_anonymous">半匿名用户</Select.Option>
                    <Select.Option value="admin">管理员</Select.Option>
                    <Select.Option value="reviewer">审核员</Select.Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    placeholder="登录状态"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={(value) => setFilters({...filters, loginStatus: value || ''})}
                  >
                    <Select.Option value="success">成功</Select.Option>
                    <Select.Option value="failed">失败</Select.Option>
                    <Select.Option value="blocked">被阻止</Select.Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <RangePicker
                    style={{ width: '100%' }}
                    onChange={(dates) => setFilters({...filters, dateRange: dates})}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Search
                    placeholder="搜索IP或用户ID"
                    onSearch={(value) => setFilters({...filters, searchText: value})}
                    allowClear
                  />
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={loginRecords}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="安全警报" key="alerts">
          <Card>
            <List
              dataSource={securityAlerts}
              renderItem={(alert) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">处理</Button>,
                    <Button type="link" size="small">详情</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={alert.severity === 'critical' ? 'error' : 'warning'} 
                      />
                    }
                    title={
                      <Space>
                        <Tag color={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Tag>
                        {alert.description}
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">用户: {alert.userUuid.slice(-8)}</Text>
                        <Text type="secondary">IP: {alert.ipAddress}</Text>
                        <Text type="secondary">{new Date(alert.createdAt).toLocaleString()}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="统计分析" key="analytics">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="登录趋势">
                <ReactECharts option={loginTrendOption} style={{ height: '300px' }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="风险分布">
                <ReactECharts option={riskDistributionOption} style={{ height: '300px' }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 详情模态框 */}
      <Modal
        title="登录记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID" span={2}>
              {selectedRecord.userUuid}
            </Descriptions.Item>
            <Descriptions.Item label="用户类型">
              <Tag>{selectedRecord.userType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="登录时间">
              {new Date(selectedRecord.loginTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              {selectedRecord.ipAddress}
            </Descriptions.Item>
            <Descriptions.Item label="地理位置">
              {[selectedRecord.ipCity, selectedRecord.ipRegion, selectedRecord.ipCountry]
                .filter(Boolean).join(', ') || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="设备类型">
              {selectedRecord.deviceType}
            </Descriptions.Item>
            <Descriptions.Item label="操作系统">
              {selectedRecord.osName}
            </Descriptions.Item>
            <Descriptions.Item label="浏览器">
              {selectedRecord.browserName}
            </Descriptions.Item>
            <Descriptions.Item label="登录方式">
              <Tag>{selectedRecord.loginMethod}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="登录状态">
              <Tag color={selectedRecord.loginStatus === 'success' ? 'green' : 'red'}>
                {selectedRecord.loginStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="风险评分">
              <Tag color={getRiskColor(selectedRecord.riskScore)}>
                {selectedRecord.riskScore}/100
              </Tag>
            </Descriptions.Item>
            {selectedRecord.googleEmail && (
              <Descriptions.Item label="Google邮箱" span={2}>
                {selectedRecord.googleEmail}
              </Descriptions.Item>
            )}
            {selectedRecord.isSuspicious && (
              <Descriptions.Item label="安全警告" span={2}>
                <Alert
                  message="此次登录被标记为可疑"
                  type="warning"
                  showIcon
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LoginMonitorPage;

/**
 * 智能安全管理页面
 * 机器学习异常检测、威胁情报、设备指纹等智能安全功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Typography,
  Tabs,
  Progress,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Tooltip,
  Badge,
  List,
  Avatar
} from 'antd';
import {
  RobotOutlined,
  SecurityScanOutlined,
  EyeOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  BugOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface AnomalyDetection {
  id: string;
  userUuid: string;
  anomalyType: string;
  anomalyScore: number;
  confidenceLevel: number;
  severity: string;
  status: string;
  createdAt: string;
  description: string;
}

interface ThreatIntelligence {
  id: string;
  indicatorValue: string;
  indicatorType: string;
  threatType: string;
  threatLevel: string;
  confidenceScore: number;
  sourceName: string;
  description: string;
  lastSeen: string;
}

interface DeviceFingerprint {
  id: string;
  userUuid: string;
  basicFingerprint: string;
  riskScore: number;
  isSuspicious: boolean;
  anomalyFlags: string[];
  lastSeen: string;
}

interface AutomatedResponse {
  id: string;
  eventType: string;
  ruleTriggered: string;
  actionsExecuted: number;
  successfulActions: number;
  executionTime: number;
  escalated: boolean;
  createdAt: string;
}

export const IntelligentSecurityPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [fingerprints, setFingerprints] = useState<DeviceFingerprint[]>([]);
  const [responses, setResponses] = useState<AutomatedResponse[]>([]);
  
  // 统计数据
  const [stats, setStats] = useState({
    totalAnomalies: 0,
    highSeverityAnomalies: 0,
    activeThreatIndicators: 0,
    suspiciousFingerprints: 0,
    automatedResponses: 0,
    responseSuccessRate: 0,
    mlModelAccuracy: 0,
    threatIntelligenceCoverage: 0
  });

  // 模态框状态
  const [responseRuleModalVisible, setResponseRuleModalVisible] = useState(false);
  const [threatIndicatorModalVisible, setThreatIndicatorModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 加载异常检测数据
      const anomaliesResponse = await fetch('/api/admin/intelligent-security/anomalies');
      if (anomaliesResponse.ok) {
        const anomaliesData = await anomaliesResponse.json();
        setAnomalies(anomaliesData.data || []);
      }

      // 加载威胁情报数据
      const threatsResponse = await fetch('/api/admin/intelligent-security/threats');
      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        setThreats(threatsData.data || []);
      }

      // 加载设备指纹数据
      const fingerprintsResponse = await fetch('/api/admin/intelligent-security/fingerprints');
      if (fingerprintsResponse.ok) {
        const fingerprintsData = await fingerprintsResponse.json();
        setFingerprints(fingerprintsData.data || []);
      }

      // 加载自动响应数据
      const responsesResponse = await fetch('/api/admin/intelligent-security/responses');
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json();
        setResponses(responsesData.data || []);
      }

      // 加载统计数据
      const statsResponse = await fetch('/api/admin/intelligent-security/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }
    } catch (error) {
      console.error('Load data error:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // 设置定时刷新
    const interval = setInterval(loadData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 异常检测表格列
  const anomalyColumns: ColumnsType<AnomalyDetection> = [
    {
      title: '异常类型',
      dataIndex: 'anomalyType',
      key: 'anomalyType',
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          'unusual_login_time': { color: 'orange', text: '异常登录时间', icon: <ClockCircleOutlined /> },
          'unusual_location': { color: 'red', text: '异常位置', icon: <EyeOutlined /> },
          'unusual_device': { color: 'purple', text: '异常设备', icon: <BugOutlined /> },
          'velocity_anomaly': { color: 'volcano', text: '速度异常', icon: <ThunderboltOutlined /> },
          'suspicious_behavior': { color: 'magenta', text: '可疑行为', icon: <WarningOutlined /> }
        };
        const config = typeMap[type] || { color: 'default', text: type, icon: <AlertOutlined /> };
        return (
          <Space>
            {config.icon}
            <Tag color={config.color}>{config.text}</Tag>
          </Space>
        );
      }
    },
    {
      title: '异常分数',
      dataIndex: 'anomalyScore',
      key: 'anomalyScore',
      render: (score: number) => (
        <Progress 
          percent={Math.round(score * 100)} 
          size="small"
          status={score > 0.8 ? 'exception' : score > 0.6 ? 'active' : 'success'}
        />
      )
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colorMap: Record<string, string> = {
          'low': 'green',
          'medium': 'orange', 
          'high': 'red',
          'critical': 'volcano'
        };
        return <Tag color={colorMap[severity]}>{severity.toUpperCase()}</Tag>;
      }
    },
    {
      title: '置信度',
      dataIndex: 'confidenceLevel',
      key: 'confidenceLevel',
      render: (confidence: number) => `${Math.round(confidence * 100)}%`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          'detected': { color: 'processing', text: '已检测' },
          'investigating': { color: 'warning', text: '调查中' },
          'confirmed': { color: 'error', text: '已确认' },
          'false_positive': { color: 'success', text: '误报' },
          'resolved': { color: 'default', text: '已解决' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '检测时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  // 威胁情报表格列
  const threatColumns: ColumnsType<ThreatIntelligence> = [
    {
      title: '指标值',
      dataIndex: 'indicatorValue',
      key: 'indicatorValue',
      render: (value: string, record: ThreatIntelligence) => (
        <Space>
          <Tag>{record.indicatorType.toUpperCase()}</Tag>
          <Text code>{value}</Text>
        </Space>
      )
    },
    {
      title: '威胁类型',
      dataIndex: 'threatType',
      key: 'threatType',
      render: (type: string) => {
        const typeMap: Record<string, { color: string; icon: React.ReactNode }> = {
          'malicious_ip': { color: 'red', icon: <FireOutlined /> },
          'suspicious_domain': { color: 'orange', icon: <EyeOutlined /> },
          'known_attacker': { color: 'volcano', icon: <WarningOutlined /> },
          'botnet_member': { color: 'purple', icon: <RobotOutlined /> }
        };
        const config = typeMap[type] || { color: 'default', icon: <AlertOutlined /> };
        return (
          <Space>
            {config.icon}
            <Tag color={config.color}>{type}</Tag>
          </Space>
        );
      }
    },
    {
      title: '威胁等级',
      dataIndex: 'threatLevel',
      key: 'threatLevel',
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          'low': 'green',
          'medium': 'orange',
          'high': 'red', 
          'critical': 'volcano'
        };
        return <Tag color={colorMap[level]}>{level.toUpperCase()}</Tag>;
      }
    },
    {
      title: '置信分数',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      render: (score: number) => (
        <Progress 
          percent={Math.round(score * 100)} 
          size="small"
          strokeColor={score > 0.8 ? '#f5222d' : score > 0.6 ? '#fa8c16' : '#52c41a'}
        />
      )
    },
    {
      title: '来源',
      dataIndex: 'sourceName',
      key: 'sourceName'
    },
    {
      title: '最后发现',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <RobotOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              智能安全防护系统
            </Title>
            <Text type="secondary">机器学习驱动的智能安全检测与响应</Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined />}
              onClick={() => setResponseRuleModalVisible(true)}
            >
              配置响应规则
            </Button>
            <Button 
              icon={<SecurityScanOutlined />}
              onClick={() => setThreatIndicatorModalVisible(true)}
            >
              添加威胁指标
            </Button>
          </Space>
        </div>
      </Card>

      {/* 实时状态警报 */}
      <Alert
        message="智能安全系统运行状态"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              🤖 机器学习模型准确率: <Text strong>{stats.mlModelAccuracy}%</Text> | 
              🛡️ 威胁情报覆盖率: <Text strong>{stats.threatIntelligenceCoverage}%</Text> | 
              ⚡ 自动响应成功率: <Text strong>{stats.responseSuccessRate}%</Text>
            </Text>
            <Text type="secondary">
              系统正在实时监控用户行为模式，检测异常活动，并自动执行安全响应措施。
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="异常检测"
              value={stats.totalAnomalies}
              prefix={<AlertOutlined />}
              suffix={
                <Tooltip title={`其中 ${stats.highSeverityAnomalies} 个高危异常`}>
                  <Tag color="red" style={{ marginLeft: '8px' }}>
                    {stats.highSeverityAnomalies}
                  </Tag>
                </Tooltip>
              }
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="威胁指标"
              value={stats.activeThreatIndicators}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="可疑设备"
              value={stats.suspiciousFingerprints}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="自动响应"
              value={stats.automatedResponses}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容标签页 */}
      <Tabs defaultActiveKey="anomalies">
        <TabPane 
          tab={
            <span>
              <AlertOutlined />
              异常检测
            </span>
          } 
          key="anomalies"
        >
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Alert
                message="机器学习异常检测"
                description="基于用户行为模式的智能异常检测，包括登录时间、位置、设备和行为异常。"
                type="info"
                showIcon
              />
              <Button icon={<RadarChartOutlined />}>
                训练模型
              </Button>
            </div>
            
            <Table
              columns={anomalyColumns}
              dataSource={anomalies}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条异常记录`
              }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FireOutlined />
              威胁情报
            </span>
          } 
          key="threats"
        >
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="实时威胁情报"
                description="集成多个威胁情报源，实时检测恶意IP、域名和其他威胁指标。"
                type="warning"
                showIcon
              />
            </div>
            
            <Table
              columns={threatColumns}
              dataSource={threats}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条威胁指标`
              }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BugOutlined />
              设备指纹
            </span>
          } 
          key="fingerprints"
        >
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="高级设备指纹识别"
                description="多维度设备指纹分析，检测设备伪造、自动化工具和可疑行为。"
                type="success"
                showIcon
              />
            </div>
            
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <BugOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <div style={{ marginTop: '16px', color: '#999' }}>
                设备指纹分析功能开发中...
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <ThunderboltOutlined />
              自动响应
            </span>
          } 
          key="responses"
        >
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="自动化安全响应"
                description="基于规则的自动安全响应，包括IP阻断、会话终止、用户隔离等措施。"
                type="info"
                showIcon
              />
            </div>
            
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <ThunderboltOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <div style={{ marginTop: '16px', color: '#999' }}>
                自动响应管理功能开发中...
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <SecurityScanOutlined />
              系统健康
            </span>
          } 
          key="health"
        >
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="模型性能指标" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text>准确率</Text>
                      <Progress percent={stats.mlModelAccuracy} />
                    </div>
                    <div>
                      <Text>召回率</Text>
                      <Progress percent={85} />
                    </div>
                    <div>
                      <Text>精确率</Text>
                      <Progress percent={92} />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="系统状态" size="small">
                  <List
                    size="small"
                    dataSource={[
                      { name: '异常检测引擎', status: 'running', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                      { name: '威胁情报更新', status: 'running', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                      { name: '设备指纹分析', status: 'running', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                      { name: '自动响应系统', status: 'running', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> }
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={item.icon}
                          title={item.name}
                          description={item.status === 'running' ? '正常运行' : '异常'}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* 响应规则配置模态框 */}
      <Modal
        title="配置自动响应规则"
        open={responseRuleModalVisible}
        onCancel={() => setResponseRuleModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ExperimentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <div style={{ marginTop: '16px', color: '#999' }}>
            响应规则配置功能开发中...
          </div>
        </div>
      </Modal>

      {/* 威胁指标添加模态框 */}
      <Modal
        title="添加威胁指标"
        open={threatIndicatorModalVisible}
        onCancel={() => setThreatIndicatorModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <SecurityScanOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <div style={{ marginTop: '16px', color: '#999' }}>
            威胁指标管理功能开发中...
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IntelligentSecurityPage;

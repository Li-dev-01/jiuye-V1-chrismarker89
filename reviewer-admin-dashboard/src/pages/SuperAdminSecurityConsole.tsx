/**
 * 超级管理员安全控制台
 * 威胁检测、IP封禁、安全事件处理
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  List,
  Avatar,
  Progress,
  Alert,
  Timeline
} from 'antd';
import {
  SecurityScanOutlined,
  WarningOutlined,
  BugOutlined,
  FireOutlined,
  SafetyOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SettingOutlined,
  PoweroffOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { superAdminApiService, ProjectStatus, SecurityMetrics, ThreatAnalysisData } from '../services/superAdminApiService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 使用从API服务导入的ProjectStatus和SecurityMetrics接口

// 本地安全事件接口，扩展API服务的接口
interface LocalSecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  description: string;
  created_at: string;
  status: 'active' | 'resolved' | 'ignored';
}

// 本地ThreatIP接口，扩展API服务的接口
interface LocalThreatIP {
  ip_address: string;
  threat_score: number;
  request_count: number;
  last_activity: string;
  threat_type: string;
}

const SuperAdminSecurityConsole: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 状态管理
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({
    project_enabled: true,
    maintenance_mode: false,
    emergency_shutdown: false,
    last_updated: null,
    updated_by: null
  });

  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    threat_level: 'low',
    active_threats: 2,
    blocked_ips: 15,
    failed_logins: 8,
    ddos_attempts: 3,
    system_health: 95
  });

  const [securityEvents, setSecurityEvents] = useState<LocalSecurityEvent[]>([
    {
      id: '1',
      event_type: 'DDoS攻击',
      severity: 'high',
      source_ip: '192.168.1.100',
      description: '检测到来自该IP的大量请求',
      created_at: '2025-09-25 16:30:00',
      status: 'active'
    },
    {
      id: '2',
      event_type: '暴力破解',
      severity: 'medium',
      source_ip: '10.0.0.50',
      description: '多次登录失败尝试',
      created_at: '2025-09-25 15:45:00',
      status: 'resolved'
    }
  ]);

  const [threatIPs, setThreatIPs] = useState<LocalThreatIP[]>([
    {
      ip_address: '192.168.1.100',
      threat_score: 85,
      request_count: 1250,
      last_activity: '2025-09-25 16:30:00',
      threat_type: 'DDoS攻击'
    },
    {
      ip_address: '10.0.0.50',
      threat_score: 65,
      request_count: 45,
      last_activity: '2025-09-25 15:45:00',
      threat_type: '暴力破解'
    }
  ]);

  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [blockIPModalVisible, setBlockIPModalVisible] = useState(false);
  const [controlReason, setControlReason] = useState('');

  // 加载项目状态
  const loadProjectStatus = async () => {
    try {
      const status = await superAdminApiService.getProjectStatus();
      setProjectStatus(status);
    } catch (error) {
      console.error('加载项目状态失败:', error);
      message.error('加载项目状态失败');
    }
  };

  // 加载安全指标
  const loadSecurityMetrics = async () => {
    try {
      const metrics = await superAdminApiService.getSecurityMetrics();
      setSecurityMetrics(metrics);
    } catch (error) {
      console.error('加载安全指标失败:', error);
      message.error('加载安全指标失败');
    }
  };

  // 加载威胁分析数据
  const loadThreatAnalysis = async () => {
    try {
      const data = await superAdminApiService.getThreatAnalysis();

      // 转换API数据格式到本地格式
      const localThreatIPs: LocalThreatIP[] = data.suspicious_ips.map(ip => ({
        ip_address: ip.ip_address,
        threat_score: ip.threat_score,
        request_count: ip.attack_count,
        last_activity: ip.last_attack,
        threat_type: ip.location || '未知威胁'
      }));

      setThreatIPs(localThreatIPs);

      // 转换安全事件数据格式
      const localSecurityEvents: LocalSecurityEvent[] = data.security_events.map(event => ({
        id: event.id,
        event_type: event.type,
        severity: event.severity,
        source_ip: event.ip_address || '未知',
        description: event.description,
        created_at: event.timestamp,
        status: event.handled ? 'resolved' : 'active'
      }));

      setSecurityEvents(localSecurityEvents);
    } catch (error) {
      console.error('加载威胁分析失败:', error);
      message.error('加载威胁分析失败');
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadProjectStatus();
    loadSecurityMetrics();
    loadThreatAnalysis();
  }, []);

  // 威胁等级颜色映射
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'purple';
      default: return 'gray';
    }
  };

  // 严重程度颜色映射
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'purple';
      default: return 'gray';
    }
  };

  // 紧急关闭项目
  const handleEmergencyShutdown = async () => {
    if (!controlReason.trim()) {
      message.error('请填写紧急关闭原因');
      return;
    }

    try {
      setLoading(true);
      await superAdminApiService.emergencyShutdown(controlReason);

      // 重新加载项目状态
      await loadProjectStatus();

      message.success('项目已紧急关闭');
      setEmergencyModalVisible(false);
      setControlReason('');
    } catch (error) {
      console.error('紧急关闭失败:', error);
      message.error('紧急关闭失败');
    } finally {
      setLoading(false);
    }
  };

  // 恢复项目运行
  const handleProjectRestore = async () => {
    if (!controlReason.trim()) {
      message.error('请填写恢复原因');
      return;
    }

    try {
      setLoading(true);
      await superAdminApiService.restoreProject(controlReason);

      // 重新加载项目状态
      await loadProjectStatus();

      message.success('项目已恢复运行');
      setEmergencyModalVisible(false);
      setControlReason('');
    } catch (error) {
      console.error('项目恢复失败:', error);
      message.error('项目恢复失败');
    } finally {
      setLoading(false);
    }
  };

  // 封禁威胁IP
  const handleBlockIP = async (ip: string, reason: string) => {
    try {
      setLoading(true);
      await superAdminApiService.blockIP(ip, reason);

      // 重新加载威胁分析数据和安全指标
      await loadThreatAnalysis();
      await loadSecurityMetrics();

      message.success(`IP ${ip} 已被封禁`);
      setBlockIPModalVisible(false);
    } catch (error) {
      message.error('IP封禁失败');
    } finally {
      setLoading(false);
    }
  };

  // 安全事件表格列定义
  const securityEventColumns: ColumnsType<LocalSecurityEvent> = [
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '来源IP',
      dataIndex: 'source_ip',
      key: 'source_ip',
      render: (ip) => <Text code>{ip}</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '发生时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'red' : status === 'resolved' ? 'green' : 'gray'}>
          {status === 'active' ? '活跃' : status === 'resolved' ? '已解决' : '已忽略'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>详情</Button>
          {record.status === 'active' && (
            <Button 
              size="small" 
              danger 
              icon={<LockOutlined />}
              onClick={() => handleBlockIP(record.source_ip, `安全事件: ${record.event_type}`)}
            >
              封禁IP
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <SecurityScanOutlined /> 安全控制台
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            刷新数据
          </Button>
          {projectStatus.emergency_shutdown ? (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setEmergencyModalVisible(true)}
            >
              恢复项目
            </Button>
          ) : (
            <Button
              danger
              icon={<PoweroffOutlined />}
              onClick={() => setEmergencyModalVisible(true)}
            >
              紧急关闭
            </Button>
          )}
        </Space>
      </div>

      <Alert
        message="安全控制台"
        description="监控系统安全状态，处理威胁事件，执行紧急控制操作。所有操作都会记录详细日志。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 项目状态警告 */}
      {projectStatus.emergency_shutdown && (
        <Alert
          message="项目处于紧急关闭状态"
          description="所有服务已停止，请尽快处理安全威胁并恢复项目运行。"
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 安全概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="威胁等级"
              value={securityMetrics.threat_level.toUpperCase()}
              valueStyle={{ color: getThreatLevelColor(securityMetrics.threat_level) }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃威胁"
              value={securityMetrics.active_threats}
              valueStyle={{ color: securityMetrics.active_threats > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统健康度"
              value={securityMetrics.system_health}
              suffix="%"
              valueStyle={{ color: securityMetrics.system_health >= 90 ? '#3f8600' : '#cf1322' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="封禁IP数"
              value={securityMetrics.blocked_ips}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><FireOutlined />威胁分析</span>} key="threats">
            <Table
              columns={securityEventColumns}
              dataSource={securityEvents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          
          <TabPane tab={<span><BugOutlined />可疑IP</span>} key="suspicious-ips">
            <List
              dataSource={threatIPs}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      danger 
                      icon={<LockOutlined />}
                      onClick={() => handleBlockIP(item.ip_address, `威胁评分: ${item.threat_score}`)}
                    >
                      封禁
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BugOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
                    title={
                      <Space>
                        <Text code>{item.ip_address}</Text>
                        <Tag color="red">威胁评分: {item.threat_score}</Tag>
                        <Tag color="orange">{item.threat_type}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>请求次数: {item.request_count}</Text>
                        <Text>最后活动: {item.last_activity}</Text>
                        <Progress 
                          percent={item.threat_score} 
                          size="small" 
                          status={item.threat_score > 80 ? 'exception' : 'normal'}
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 紧急控制模态框 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            {projectStatus.emergency_shutdown ? '恢复项目运行' : '紧急关闭项目'}
          </Space>
        }
        open={emergencyModalVisible}
        onOk={projectStatus.emergency_shutdown ? handleProjectRestore : handleEmergencyShutdown}
        onCancel={() => {
          setEmergencyModalVisible(false);
          setControlReason('');
        }}
        confirmLoading={loading}
        okText={projectStatus.emergency_shutdown ? '恢复运行' : '确认关闭'}
        cancelText="取消"
        okButtonProps={{ danger: !projectStatus.emergency_shutdown }}
      >
        <Alert
          message={projectStatus.emergency_shutdown ? '恢复项目运行' : '紧急关闭警告'}
          description={
            projectStatus.emergency_shutdown 
              ? '恢复后所有服务将重新启动，请确保安全威胁已处理。'
              : '此操作将立即停止所有服务，仅在紧急情况下使用。'
          }
          type={projectStatus.emergency_shutdown ? 'info' : 'warning'}
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Input.TextArea
          placeholder={`请详细说明${projectStatus.emergency_shutdown ? '恢复' : '关闭'}原因...`}
          value={controlReason}
          onChange={(e) => setControlReason(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default SuperAdminSecurityConsole;

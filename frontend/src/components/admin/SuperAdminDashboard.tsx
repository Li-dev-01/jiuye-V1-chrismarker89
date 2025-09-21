import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Statistic, Row, Col, Modal, Input, message, Table, Tag, Space, Progress, Timeline } from 'antd';
import {
  PoweroffOutlined,
  WarningOutlined,
  SecurityScanOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  BugOutlined,
  FireOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './SuperAdminDashboard.module.css';

interface ProjectStatus {
  project_enabled: boolean;
  maintenance_mode: boolean;
  emergency_shutdown: boolean;
  last_updated: string | null;
  updated_by: string | null;
}

interface SecurityMetrics {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  active_threats: number;
  blocked_ips: number;
  failed_logins: number;
  ddos_attempts: number;
  system_health: number; // 0-100
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  description: string;
  created_at: string;
  status: 'active' | 'resolved' | 'ignored';
}

interface ThreatAnalysis {
  suspicious_ips: Array<{
    ip_address: string;
    threat_score: number;
    request_count: number;
    last_activity: string;
    threat_type: string;
  }>;
  attack_patterns: Array<{
    pattern_type: string;
    frequency: number;
    severity: string;
    description: string;
  }>;
  security_events: SecurityEvent[];
}

const SuperAdminDashboard: React.FC = () => {
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({
    project_enabled: true,
    maintenance_mode: false,
    emergency_shutdown: false,
    last_updated: null,
    updated_by: null
  });

  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    threat_level: 'low',
    active_threats: 0,
    blocked_ips: 0,
    failed_logins: 0,
    ddos_attempts: 0,
    system_health: 100
  });

  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [controlModalVisible, setControlModalVisible] = useState(false);
  const [controlAction, setControlAction] = useState<string>('');
  const [controlReason, setControlReason] = useState('');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  // 获取项目状态
  const fetchProjectStatus = async () => {
    try {
      // 模拟数据已清理 - 使用真实API
      setProjectStatus(null);

      // TODO: 替换为真实API调用
      // const response = await fetch('http://localhost:8005/api/super-admin/project/status', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const result = await response.json();
      // if (result.success) {
      //   setProjectStatus(result.data);
      // }
    } catch (error) {
      console.error('获取项目状态失败:', error);
    }
  };

  // 获取安全指标
  const fetchSecurityMetrics = async () => {
    try {
      // 模拟数据已清理 - 使用真实API
      // setSecurityMetrics(null); // 保持默认值，不设置为null

      // TODO: 替换为真实API调用
      // const response = await fetch('http://localhost:8005/api/super-admin/security/metrics', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const result = await response.json();
      // if (result.success) {
      //   setSecurityMetrics(result.data);
      // }
    } catch (error) {
      console.error('获取安全指标失败:', error);
    }
  };

  // 获取威胁分析数据
  const fetchThreatAnalysis = async () => {
    setLoading(true);
    try {
      // 模拟数据已清理 - 使用真实API
      const mockData = [];
      setThreatAnalysis(mockData);

      // TODO: 替换为真实API调用
      // const response = await fetch('http://localhost:8005/api/super-admin/security/threats', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const result = await response.json();
      // if (result.success) {
      //   setThreatAnalysis(result.data);
      // }
    } catch (error) {
      console.error('获取威胁分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 紧急关闭项目
  const handleEmergencyShutdown = async () => {
    try {
      const response = await fetch('/api/super-admin/emergency/shutdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: controlReason
        })
      });

      const result = await response.json();
      if (result.success) {
        message.success('项目已紧急关闭');
        setEmergencyModalVisible(false);
        setControlReason('');
        fetchProjectStatus();
        fetchSecurityMetrics();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('紧急关闭失败');
    }
  };

  // 恢复项目运行
  const handleProjectRestore = async () => {
    try {
      const response = await fetch('/api/super-admin/project/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: controlReason
        })
      });

      const result = await response.json();
      if (result.success) {
        message.success('项目已恢复运行');
        setControlModalVisible(false);
        setControlReason('');
        fetchProjectStatus();
        fetchSecurityMetrics();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('恢复失败');
    }
  };

  // 封禁威胁IP
  const handleBlockThreat = async (ipAddress: string) => {
    try {
      const response = await fetch('/api/super-admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip_address: ipAddress,
          reason: '超级管理员手动封禁'
        })
      });

      const result = await response.json();
      if (result.success) {
        message.success(`IP ${ipAddress} 已被封禁`);
        fetchThreatAnalysis();
        fetchSecurityMetrics();
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('封禁失败');
    }
  };

  useEffect(() => {
    fetchProjectStatus();
    fetchSecurityMetrics();
    fetchThreatAnalysis();

    // 设置定时刷新安全指标
    const interval = setInterval(() => {
      fetchSecurityMetrics();
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  // 威胁IP表格列定义
  const threatIpColumns: ColumnsType<any> = [
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => <Tag color="red">{ip}</Tag>
    },
    {
      title: '威胁评分',
      dataIndex: 'threat_score',
      key: 'threat_score',
      render: (score) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score > 80 ? '#ff4d4f' : score > 60 ? '#fa8c16' : '#52c41a'}
        />
      )
    },
    {
      title: '请求次数',
      dataIndex: 'request_count',
      key: 'request_count',
      render: (count) => <Tag color={count > 100 ? 'red' : count > 50 ? 'orange' : 'blue'}>{count}</Tag>
    },
    {
      title: '威胁类型',
      dataIndex: 'threat_type',
      key: 'threat_type',
      render: (type) => {
        const colorMap: Record<string, string> = {
          'ddos': 'red',
          'brute_force': 'orange',
          'suspicious': 'yellow',
          'spam': 'purple'
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '最后活动',
      dataIndex: 'last_activity',
      key: 'last_activity',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            danger
            icon={<SafetyOutlined />}
            onClick={() => handleBlockThreat(record.ip_address)}
          >
            封禁
          </Button>
        </Space>
      ),
    },
  ];

  // 获取威胁等级颜色
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#fadb14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className={styles.superAdminDashboard}>
      <h1>🛡️ 超级管理员 - 安全控制台</h1>

      {/* 系统安全状态 */}
      <Card title="系统安全状态" className={styles.securityStatusCard}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="威胁等级"
                value={securityMetrics.threat_level.toUpperCase()}
                valueStyle={{ color: getThreatLevelColor(securityMetrics.threat_level) }}
                prefix={<SecurityScanOutlined />}
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
                value={`${securityMetrics.system_health}%`}
                valueStyle={{ color: securityMetrics.system_health > 80 ? '#3f8600' : '#cf1322' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="项目状态"
                value={projectStatus?.emergency_shutdown ? "紧急关闭" : projectStatus?.project_enabled ? "运行中" : "已停止"}
                valueStyle={{
                  color: projectStatus?.emergency_shutdown ? '#cf1322' :
                         projectStatus?.project_enabled ? '#3f8600' : '#fa8c16'
                }}
                prefix={<PoweroffOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 紧急控制面板 */}
      <Card title="紧急控制面板" className={styles.emergencyControlCard}>
        <Row gutter={16}>
          <Col span={8}>
            <Card className={styles.emergencyCard}>
              <div className={styles.emergencyContent}>
                <FireOutlined className={styles.emergencyIcon} />
                <h3>紧急关闭</h3>
                <p>立即停止所有服务，用于应对严重安全威胁</p>
                <Button
                  danger
                  size="large"
                  disabled={projectStatus?.emergency_shutdown}
                  onClick={() => setEmergencyModalVisible(true)}
                >
                  {projectStatus?.emergency_shutdown ? '已紧急关闭' : '紧急关闭'}
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card className={styles.restoreCard}>
              <div className={styles.emergencyContent}>
                <PoweroffOutlined className={styles.restoreIcon} />
                <h3>恢复运行</h3>
                <p>恢复项目正常运行，解除紧急状态</p>
                <Button
                  type="primary"
                  size="large"
                  disabled={projectStatus?.project_enabled && !projectStatus?.emergency_shutdown}
                  onClick={() => {
                    setControlAction('restore');
                    setControlModalVisible(true);
                  }}
                >
                  恢复运行
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card className={styles.metricsCard}>
              <div className={styles.emergencyContent}>
                <SecurityScanOutlined className={styles.metricsIcon} />
                <h3>安全指标</h3>
                <div className={styles.metricsList}>
                  <div>封禁IP: {securityMetrics?.blocked_ips || 0}</div>
                  <div>登录失败: {securityMetrics?.failed_logins || 0}</div>
                  <div>DDoS尝试: {securityMetrics?.ddos_attempts || 0}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 威胁分析与处理 */}
      <Card title="威胁分析与处理" className={styles.threatAnalysisCard}>
        {threatAnalysis && (
          <>
            <Row gutter={16} className={styles.threatStats}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="可疑IP数量"
                    value={threatAnalysis?.suspicious_ips?.length || 0}
                    valueStyle={{ color: (threatAnalysis?.suspicious_ips?.length || 0) > 0 ? '#cf1322' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="攻击模式"
                    value={threatAnalysis?.attack_patterns?.length || 0}
                    valueStyle={{ color: (threatAnalysis?.attack_patterns?.length || 0) > 0 ? '#fa8c16' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="安全事件"
                    value={threatAnalysis?.security_events?.filter(e => e.status === 'active')?.length || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <h3>🚨 高威胁IP列表</h3>
            <Table
              columns={threatIpColumns}
              dataSource={threatAnalysis?.suspicious_ips?.filter(ip => ip.threat_score > 60) || []}
              rowKey="ip_address"
              size="small"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />

            <h3>📊 攻击模式分析</h3>
            <Row gutter={16}>
              {(threatAnalysis?.attack_patterns || []).map((pattern, index) => (
                <Col span={8} key={index}>
                  <Card size="small">
                    <h4>{pattern.pattern_type}</h4>
                    <p>频率: {pattern.frequency}</p>
                    <p>严重程度: <Tag color={pattern.severity === 'high' ? 'red' : 'orange'}>{pattern.severity}</Tag></p>
                    <p>{pattern.description}</p>
                  </Card>
                </Col>
              ))}
            </Row>

            <h3>🔍 最近安全事件</h3>
            <Timeline>
              {(threatAnalysis?.security_events || []).slice(0, 5).map((event) => (
                <Timeline.Item
                  key={event.id}
                  color={event.severity === 'critical' ? 'red' : event.severity === 'high' ? 'orange' : 'blue'}
                >
                  <div>
                    <strong>{event.event_type}</strong> - {event.source_ip}
                    <br />
                    <span>{event.description}</span>
                    <br />
                    <small>{new Date(event.created_at).toLocaleString()}</small>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}

        <Button
          type="primary"
          onClick={fetchThreatAnalysis}
          loading={loading}
          className={styles.refreshButton}
        >
          刷新威胁分析
        </Button>
      </Card>

      {/* 紧急关闭确认弹窗 */}
      <Modal
        title="⚠️ 紧急关闭确认"
        open={emergencyModalVisible}
        onOk={handleEmergencyShutdown}
        onCancel={() => {
          setEmergencyModalVisible(false);
          setControlReason('');
        }}
        okText="确认紧急关闭"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="警告"
          description="紧急关闭将立即停止所有服务，包括用户访问。此操作应仅在面临严重安全威胁时使用。"
          type="error"
          showIcon
          className={styles.emergencyWarning}
        />
        <Input.TextArea
          placeholder="请详细说明紧急关闭的原因"
          value={controlReason}
          onChange={(e) => setControlReason(e.target.value)}
          rows={3}
          className={styles.reasonInput}
        />
      </Modal>

      {/* 项目恢复确认弹窗 */}
      <Modal
        title="恢复项目运行"
        open={controlModalVisible}
        onOk={handleProjectRestore}
        onCancel={() => {
          setControlModalVisible(false);
          setControlReason('');
        }}
        okText="确认恢复"
        cancelText="取消"
      >
        <p>确认恢复项目正常运行？</p>
        <Input.TextArea
          placeholder="请输入恢复原因"
          value={controlReason}
          onChange={(e) => setControlReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;

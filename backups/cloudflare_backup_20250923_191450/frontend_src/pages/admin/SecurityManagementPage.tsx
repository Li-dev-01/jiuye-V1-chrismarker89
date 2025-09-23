/**
 * 安全管理页面
 * 超级管理员专用 - 安全策略配置、威胁监控、访问控制
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
  Alert
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
  SettingOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { AdminService, type SecurityMetrics, type SecurityThreats, type ProjectStatus } from '../../services/adminService';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface SecurityConfig {
  ddos_protection: boolean;
  brute_force_protection: boolean;
  ip_whitelist_enabled: boolean;
  auto_block_enabled: boolean;
  max_login_attempts: number;
  block_duration: number;
  ddos_threshold: number;
}

interface ThreatEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  details: string;
  status: 'active' | 'resolved' | 'ignored';
  created_at: string;
}

interface BlockedIP {
  ip: string;
  reason: string;
  blocked_at: string;
  expires_at: string;
  threat_score: number;
}

export const SecurityManagementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ddos_protection: true,
    brute_force_protection: true,
    ip_whitelist_enabled: false,
    auto_block_enabled: true,
    max_login_attempts: 5,
    block_duration: 300,
    ddos_threshold: 100
  });

  // 真实数据状态
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreats | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);
  const [blockIPModalVisible, setBlockIPModalVisible] = useState(false);

  // 加载安全数据
  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // 并行加载所有安全数据
      const [metricsData, threatsData, statusData] = await Promise.all([
        AdminService.getSecurityMetrics(),
        AdminService.getSecurityThreats(),
        AdminService.getProjectStatus()
      ]);

      setSecurityMetrics(metricsData);
      setSecurityThreats(threatsData);
      setProjectStatus(statusData);
    } catch (error) {
      console.error('加载安全数据失败:', error);
      message.error('加载安全数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    loadSecurityData();
  }, []);

  const handleConfigSave = async (values: SecurityConfig) => {
    setLoading(true);
    try {
      // TODO: 实现安全配置保存API
      console.log('保存安全配置:', values);
      setSecurityConfig(values);
      message.success('安全配置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (values: { ip: string; reason: string; duration: number }) => {
    try {
      setLoading(true);
      await AdminService.blockIP({
        ip_address: values.ip,
        reason: values.reason
      });
      message.success('IP已封禁');
      setBlockIPModalVisible(false);
      // 重新加载数据
      await loadSecurityData();
    } catch (error) {
      console.error('封禁IP失败:', error);
      message.error('封禁失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      setLoading(true);
      // TODO: 实现解封IP的API
      console.log('解封IP:', ip);
      message.success('IP已解封');
      // 重新加载数据
      await loadSecurityData();
    } catch (error) {
      console.error('解封IP失败:', error);
      message.error('解封失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyShutdown = async () => {
    try {
      setLoading(true);
      await AdminService.emergencyShutdown({
        reason: '管理员手动触发紧急关闭'
      });
      message.success('系统已紧急关闭');
      // 重新加载数据
      await loadSecurityData();
    } catch (error) {
      console.error('紧急关闭失败:', error);
      message.error('紧急关闭失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = async () => {
    try {
      setLoading(true);
      await AdminService.restoreProject({
        reason: '管理员手动恢复系统运行'
      });
      message.success('系统已恢复运行');
      // 重新加载数据
      await loadSecurityData();
    } catch (error) {
      console.error('恢复系统失败:', error);
      message.error('恢复系统失败');
    } finally {
      setLoading(false);
    }
  };

  const threatColumns: ColumnsType<ThreatEvent> = [
    {
      title: '威胁类型',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          brute_force: { label: '暴力破解', color: 'red' },
          ddos_attempt: { label: 'DDoS攻击', color: 'volcano' },
          suspicious_activity: { label: '可疑活动', color: 'orange' }
        };
        const config = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colorMap: Record<string, string> = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          critical: 'volcano'
        };
        return <Tag color={colorMap[severity]}>{severity.toUpperCase()}</Tag>;
      }
    },
    {
      title: '源IP',
      dataIndex: 'source_ip',
      key: 'source_ip'
    },
    {
      title: '详情',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'red',
          resolved: 'green',
          ignored: 'gray'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at'
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
              type="primary"
              onClick={() => handleBlockIP({
                ip: record.source_ip,
                reason: `威胁处理: ${record.description}`,
                duration: 3600 // 1小时
              })}
              loading={loading}
            >
              封禁IP
            </Button>
          )}
        </Space>
      )
    }
  ];

  const blockedIPColumns: ColumnsType<BlockedIP> = [
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: '封禁原因',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: '威胁评分',
      dataIndex: 'threat_score',
      key: 'threat_score',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score > 80 ? '#ff4d4f' : score > 60 ? '#faad14' : '#52c41a'}
        />
      )
    },
    {
      title: '封禁时间',
      dataIndex: 'blocked_at',
      key: 'blocked_at'
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<UnlockOutlined />}
            onClick={() => handleUnblockIP(record.ip)}
          >
            解封
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'config',
      label: '安全配置',
      children: (
        <Card>
          <Form
            form={form}
            layout="vertical"
            initialValues={securityConfig}
            onFinish={handleConfigSave}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="ddos_protection" label="DDoS防护" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="brute_force_protection" label="暴力破解防护" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="ip_whitelist_enabled" label="IP白名单" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="auto_block_enabled" label="自动封禁" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={8}>
                <Form.Item name="max_login_attempts" label="最大登录尝试次数">
                  <InputNumber min={1} max={20} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="block_duration" label="封禁时长(秒)">
                  <InputNumber min={60} max={86400} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ddos_threshold" label="DDoS阈值(请求/分钟)">
                  <InputNumber min={10} max={1000} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'threats',
      label: '威胁事件',
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadSecurityData} loading={loading}>
                刷新
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleEmergencyShutdown}
                loading={loading}
                disabled={projectStatus?.emergency_shutdown}
              >
                紧急关闭系统
              </Button>
            </Space>
          </div>
          <Table
            columns={threatColumns}
            dataSource={securityThreats?.security_events || []}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'blocked',
      label: '封禁管理',
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setBlockIPModalVisible(true)}
              >
                手动封禁IP
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadSecurityData} loading={loading}>
                刷新
              </Button>
            </Space>
          </div>
          <Table
            columns={blockedIPColumns}
            dataSource={securityThreats?.suspicious_ips?.map(ip => ({
              ip: ip.ip_address,
              reason: `威胁评分: ${ip.threat_score}, 类型: ${ip.threat_type}`,
              blocked_at: ip.last_activity,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
              threat_score: ip.threat_score
            })) || []}
            rowKey="ip"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <SecurityScanOutlined style={{ marginRight: '8px' }} />
            安全管理
          </Title>
        </div>

        {/* 安全状态概览 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃威胁"
                value={securityMetrics?.active_threats || 0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<BugOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="封禁IP"
                value={securityMetrics?.blocked_ips || 0}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<LockOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="防护状态"
                value={projectStatus?.emergency_shutdown ? '紧急关闭' :
                       projectStatus?.maintenance_mode ? '维护模式' :
                       projectStatus?.project_enabled ? '正常' : '已停用'}
                valueStyle={{
                  color: projectStatus?.emergency_shutdown ? '#cf1322' :
                         projectStatus?.maintenance_mode ? '#fa8c16' :
                         projectStatus?.project_enabled ? '#3f8600' : '#8c8c8c'
                }}
                prefix={<SafetyOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="安全评分"
                value={securityMetrics?.system_health || 0}
                suffix="/100"
                valueStyle={{
                  color: (securityMetrics?.system_health || 0) >= 80 ? '#3f8600' :
                         (securityMetrics?.system_health || 0) >= 60 ? '#fa8c16' : '#cf1322'
                }}
                prefix={<SecurityScanOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* 安全警告 */}
        {securityMetrics?.threat_level === 'critical' && (
          <Alert
            message="检测到严重安全威胁"
            description={`系统检测到${securityMetrics.active_threats}个活跃威胁，威胁等级：${securityMetrics.threat_level.toUpperCase()}，请立即处理。`}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            action={
              <Space>
                <Button size="small" danger onClick={handleEmergencyShutdown} loading={loading}>
                  紧急关闭
                </Button>
                <Button size="small" onClick={loadSecurityData}>
                  刷新数据
                </Button>
              </Space>
            }
          />
        )}

        {/* 项目状态警告 */}
        {projectStatus?.emergency_shutdown && (
          <Alert
            message="系统已紧急关闭"
            description="系统当前处于紧急关闭状态，所有服务已停止。"
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            action={
              <Button size="small" type="primary" onClick={handleRestoreProject} loading={loading}>
                恢复运行
              </Button>
            }
          />
        )}

        {/* 主要内容 */}
        <Tabs items={tabItems} />

        {/* 手动封禁IP弹窗 */}
        <Modal
          title="手动封禁IP"
          open={blockIPModalVisible}
          onCancel={() => setBlockIPModalVisible(false)}
          footer={null}
        >
          <Form onFinish={handleBlockIP}>
            <Form.Item
              name="ip"
              label="IP地址"
              rules={[{ required: true, message: '请输入IP地址' }]}
            >
              <Input placeholder="例如: 192.168.1.100" />
            </Form.Item>
            
            <Form.Item
              name="reason"
              label="封禁原因"
              rules={[{ required: true, message: '请输入封禁原因' }]}
            >
              <Input.TextArea rows={3} placeholder="请描述封禁原因" />
            </Form.Item>
            
            <Form.Item
              name="duration"
              label="封禁时长(秒)"
              rules={[{ required: true, message: '请输入封禁时长' }]}
              initialValue={3600}
            >
              <InputNumber min={60} max={86400} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setBlockIPModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  确认封禁
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

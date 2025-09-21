/**
 * IP访问控制管理页面
 * 管理IP白名单、黑名单和访问时间限制
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Tag,
  message,
  Popconfirm,
  Typography,
  Alert,
  Tabs,
  TimePicker,
  Checkbox,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = TimePicker;

interface IPAccessRule {
  id: string;
  ruleType: 'whitelist' | 'blacklist' | 'greylist';
  ipAddress?: string;
  ipRange?: string;
  countryCode?: string;
  region?: string;
  description: string;
  rulePriority: number;
  isActive: boolean;
  appliesToUserTypes: string[];
  appliesToFunctions: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  hitCount: number;
  lastHitAt?: string;
}

interface TimePolicy {
  id: string;
  policyName: string;
  description: string;
  userTypes: string[];
  allowedHours: Record<string, string[]>;
  timezone: string;
  violationAction: string;
  isActive: boolean;
  createdAt: string;
}

export const IPAccessControlPage: React.FC = () => {
  const [ipRules, setIPRules] = useState<IPAccessRule[]>([]);
  const [timePolicies, setTimePolicies] = useState<TimePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [timePolicyModalVisible, setTimePolicyModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<IPAccessRule | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<TimePolicy | null>(null);
  const [form] = Form.useForm();
  const [timePolicyForm] = Form.useForm();

  // 统计数据
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    whitelistRules: 0,
    blacklistRules: 0,
    recentViolations: 0
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 加载IP规则
      const rulesResponse = await fetch('/api/admin/ip-access-control/rules');
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setIPRules(rulesData.data || []);
      }

      // 加载时间策略
      const policiesResponse = await fetch('/api/admin/ip-access-control/time-policies');
      if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        setTimePolicies(policiesData.data || []);
      }

      // 加载统计数据
      const statsResponse = await fetch('/api/admin/ip-access-control/stats');
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
  }, []);

  // IP规则表格列定义
  const ipRuleColumns: ColumnsType<IPAccessRule> = [
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: (type: string) => {
        const config = {
          whitelist: { color: 'green', text: '白名单' },
          blacklist: { color: 'red', text: '黑名单' },
          greylist: { color: 'orange', text: '灰名单' }
        };
        const { color, text } = config[type as keyof typeof config] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'IP地址/范围',
      key: 'target',
      render: (_, record) => (
        <div>
          {record.ipAddress && <div>{record.ipAddress}</div>}
          {record.ipRange && <div>{record.ipRange}</div>}
          {record.countryCode && <div>国家: {record.countryCode}</div>}
          {record.region && <div>地区: {record.region}</div>}
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '优先级',
      dataIndex: 'rulePriority',
      key: 'rulePriority',
      sorter: (a, b) => a.rulePriority - b.rulePriority
    },
    {
      title: '适用对象',
      key: 'applies',
      render: (_, record) => (
        <div>
          <div>用户: {record.appliesToUserTypes.join(', ') || '全部'}</div>
          <div>功能: {record.appliesToFunctions.join(', ') || '全部'}</div>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            命中: {record.hitCount}次
          </Text>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDeleteRule(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 处理添加/编辑IP规则
  const handleSubmitRule = async (values: any) => {
    try {
      const url = editingRule 
        ? `/api/admin/ip-access-control/rules/${editingRule.id}`
        : '/api/admin/ip-access-control/rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(editingRule ? '更新成功' : '添加成功');
        setModalVisible(false);
        setEditingRule(null);
        form.resetFields();
        loadData();
      } else {
        const error = await response.json();
        message.error(error.message || '操作失败');
      }
    } catch (error) {
      console.error('Submit rule error:', error);
      message.error('操作失败');
    }
  };

  // 处理编辑规则
  const handleEditRule = (rule: IPAccessRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ruleType: rule.ruleType,
      ipAddress: rule.ipAddress,
      ipRange: rule.ipRange,
      countryCode: rule.countryCode,
      region: rule.region,
      description: rule.description,
      rulePriority: rule.rulePriority,
      isActive: rule.isActive,
      appliesToUserTypes: rule.appliesToUserTypes,
      appliesToFunctions: rule.appliesToFunctions
    });
    setModalVisible(true);
  };

  // 处理删除规则
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/ip-access-control/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        message.success('删除成功');
        loadData();
      } else {
        const error = await response.json();
        message.error(error.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete rule error:', error);
      message.error('删除失败');
    }
  };

  // 处理模态框关闭
  const handleModalClose = () => {
    setModalVisible(false);
    setEditingRule(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <SecurityScanOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              IP访问控制管理
            </Title>
            <Text type="secondary">管理IP白名单、黑名单和访问时间限制</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            添加规则
          </Button>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总规则数"
              value={stats.totalRules}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃规则"
              value={stats.activeRules}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="白名单规则"
              value={stats.whitelistRules}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="近期违规"
              value={stats.recentViolations}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Tabs defaultActiveKey="ip-rules">
        <TabPane tab="IP访问规则" key="ip-rules">
          <Card>
            <Alert
              message="安全提醒"
              description="IP访问控制规则按优先级执行，数字越小优先级越高。白名单规则允许访问，黑名单规则阻止访问，灰名单规则记录警告。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Table
              columns={ipRuleColumns}
              dataSource={ipRules}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条规则`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="访问时间策略" key="time-policies">
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Alert
                message="时间限制说明"
                description="访问时间策略限制用户只能在指定时间段内登录和使用系统功能。"
                type="info"
                showIcon
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setTimePolicyModalVisible(true)}
              >
                添加时间策略
              </Button>
            </div>
            
            {/* 这里可以添加时间策略表格 */}
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <ClockCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <div style={{ marginTop: '16px', color: '#999' }}>
                时间策略功能开发中...
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* IP规则添加/编辑模态框 */}
      <Modal
        title={editingRule ? '编辑IP访问规则' : '添加IP访问规则'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRule}
        >
          <Form.Item
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="选择规则类型">
              <Option value="whitelist">白名单（允许访问）</Option>
              <Option value="blacklist">黑名单（阻止访问）</Option>
              <Option value="greylist">灰名单（记录警告）</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ipAddress"
                label="IP地址"
              >
                <Input placeholder="如: 192.168.1.100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ipRange"
                label="IP范围 (CIDR)"
              >
                <Input placeholder="如: 192.168.1.0/24" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="countryCode"
                label="国家代码"
              >
                <Input placeholder="如: CN, US" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="地区"
              >
                <Input placeholder="如: Beijing, California" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea placeholder="描述这个规则的用途" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rulePriority"
                label="优先级"
                rules={[{ required: true, message: '请输入优先级' }]}
                initialValue={100}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="启用规则"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="appliesToUserTypes"
            label="适用用户类型"
          >
            <Select mode="multiple" placeholder="选择用户类型（空表示全部）">
              <Option value="admin">管理员</Option>
              <Option value="reviewer">审核员</Option>
              <Option value="super_admin">超级管理员</Option>
              <Option value="semi_anonymous">半匿名用户</Option>
              <Option value="anonymous">匿名用户</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="appliesToFunctions"
            label="适用功能"
          >
            <Select mode="multiple" placeholder="选择功能（空表示全部）">
              <Option value="login">登录</Option>
              <Option value="api_access">API访问</Option>
              <Option value="admin_action">管理操作</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRule ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IPAccessControlPage;

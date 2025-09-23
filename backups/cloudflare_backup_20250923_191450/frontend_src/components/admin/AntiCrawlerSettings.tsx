/**
 * 防爬虫设置组件
 * 用于超级管理员配置防爬虫参数和监控
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Space,
  Divider,
  Alert,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Modal,
  message,
  Tooltip,
  Typography
} from 'antd';
import {
  ShieldCheckOutlined,
  RobotOutlined,
  UserOutlined,
  WarningOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  BugOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AntiCrawlerConfig {
  enabled: boolean;
  minMouseMovements: number;
  minScrollEvents: number;
  minSessionTime: number;
  minHumanScore: number;
  recheckInterval: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  blockSuspiciousUA: boolean;
  enableBehaviorAnalysis: boolean;
  enableCloudflareIntegration: boolean;
}

interface SystemStats {
  totalRequests: number;
  blockedRequests: number;
  humanVerified: number;
  botDetected: number;
  averageHumanScore: number;
  blockRate: number;
  falsePositiveRate: number;
}

interface SuspiciousActivity {
  id: string;
  timestamp: number;
  ip: string;
  userAgent: string;
  reason: string[];
  humanScore: number;
  blocked: boolean;
}

export const AntiCrawlerSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AntiCrawlerConfig>({
    enabled: true,
    minMouseMovements: 5,
    minScrollEvents: 2,
    minSessionTime: 3000,
    minHumanScore: 0.3,
    recheckInterval: 30000,
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    blockSuspiciousUA: true,
    enableBehaviorAnalysis: true,
    enableCloudflareIntegration: true
  });

  const [stats, setStats] = useState<SystemStats>({
    totalRequests: 12450,
    blockedRequests: 234,
    humanVerified: 11890,
    botDetected: 326,
    averageHumanScore: 0.78,
    blockRate: 1.88,
    falsePositiveRate: 0.12
  });

  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([
    {
      id: '1',
      timestamp: Date.now() - 300000,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      reason: ['用户代理包含爬虫关键词', '无鼠标移动'],
      humanScore: 0.1,
      blocked: true
    },
    {
      id: '2',
      timestamp: Date.now() - 600000,
      ip: '10.0.0.50',
      userAgent: 'HeadlessChrome/91.0.4472.124',
      reason: ['检测到WebDriver', '请求频率过高'],
      humanScore: 0.05,
      blocked: true
    }
  ]);

  const [testModalVisible, setTestModalVisible] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadStats();
    loadSuspiciousActivities();
  }, []);

  const loadConfig = async () => {
    try {
      // 模拟API调用
      // const response = await api.getAntiCrawlerConfig();
      // setConfig(response.data);
      form.setFieldsValue(config);
    } catch (error) {
      message.error('加载配置失败');
    }
  };

  const loadStats = async () => {
    try {
      // 模拟API调用
      // const response = await api.getAntiCrawlerStats();
      // setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadSuspiciousActivities = async () => {
    try {
      // 模拟API调用
      // const response = await api.getSuspiciousActivities();
      // setSuspiciousActivities(response.data);
    } catch (error) {
      console.error('加载可疑活动失败:', error);
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 模拟API调用
      // await api.updateAntiCrawlerConfig(values);
      
      setConfig(values);
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置配置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置为默认配置吗？',
      onOk: () => {
        const defaultConfig: AntiCrawlerConfig = {
          enabled: true,
          minMouseMovements: 5,
          minScrollEvents: 2,
          minSessionTime: 3000,
          minHumanScore: 0.3,
          recheckInterval: 30000,
          maxRequestsPerMinute: 60,
          maxRequestsPerHour: 1000,
          blockSuspiciousUA: true,
          enableBehaviorAnalysis: true,
          enableCloudflareIntegration: true
        };
        setConfig(defaultConfig);
        form.setFieldsValue(defaultConfig);
        message.success('已重置为默认配置');
      }
    });
  };

  // 测试防爬虫功能
  const handleTest = () => {
    setTestModalVisible(true);
  };

  // 可疑活动表格列
  const suspiciousColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: '用户代理',
      dataIndex: 'userAgent',
      key: 'userAgent',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '检测原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reasons: string[]) => (
        <Space direction="vertical" size="small">
          {reasons.map((reason, index) => (
            <Tag key={index} color="orange" size="small">
              {reason}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '人类得分',
      dataIndex: 'humanScore',
      key: 'humanScore',
      render: (score: number) => (
        <Progress
          percent={score * 100}
          size="small"
          status={score < 0.3 ? 'exception' : score < 0.6 ? 'active' : 'success'}
          format={(percent) => `${percent?.toFixed(0)}%`}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'blocked',
      key: 'blocked',
      render: (blocked: boolean) => (
        <Tag color={blocked ? 'red' : 'green'}>
          {blocked ? '已阻止' : '已通过'}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>
        <ShieldCheckOutlined /> 防爬虫设置
      </Title>
      <Paragraph type="secondary">
        配置防爬虫参数，监控系统安全状态，确保内容不被恶意爬取
      </Paragraph>

      {/* 系统状态概览 */}
      <Card title="系统状态概览" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总请求数"
              value={stats.totalRequests}
              prefix={<EyeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已阻止请求"
              value={stats.blockedRequests}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="人类验证通过"
              value={stats.humanVerified}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均人类得分"
              value={stats.averageHumanScore}
              precision={2}
              suffix="%"
              formatter={(value) => `${((value as number) * 100).toFixed(1)}%`}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="拦截率"
                value={stats.blockRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.blockRate > 5 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="误判率"
                value={stats.falsePositiveRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.falsePositiveRate > 1 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="检测到的机器人"
                value={stats.botDetected}
                prefix={<BugOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 配置设置 */}
      <Card 
        title="防爬虫配置" 
        extra={
          <Space>
            <Button icon={<BugOutlined />} onClick={handleTest}>
              测试功能
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadStats}>
              刷新数据
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="启用防爬虫保护"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="minMouseMovements"
                label="最少鼠标移动次数"
                tooltip="用户必须产生的最少鼠标移动次数才被认为是人类"
              >
                <InputNumber min={1} max={50} />
              </Form.Item>

              <Form.Item
                name="minScrollEvents"
                label="最少滚动事件次数"
                tooltip="用户必须产生的最少滚动事件次数"
              >
                <InputNumber min={1} max={20} />
              </Form.Item>

              <Form.Item
                name="minSessionTime"
                label="最少会话时间(毫秒)"
                tooltip="用户必须在页面停留的最少时间"
              >
                <InputNumber min={1000} max={60000} step={1000} />
              </Form.Item>

              <Form.Item
                name="minHumanScore"
                label="最低人类得分"
                tooltip="人类行为得分阈值，低于此值将被认为是机器人"
              >
                <InputNumber min={0.1} max={1} step={0.1} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="recheckInterval"
                label="重新检查间隔(毫秒)"
                tooltip="多久重新检查一次用户行为"
              >
                <InputNumber min={10000} max={300000} step={5000} />
              </Form.Item>

              <Form.Item
                name="maxRequestsPerMinute"
                label="每分钟最大请求数"
                tooltip="单个用户每分钟允许的最大请求数"
              >
                <InputNumber min={10} max={200} />
              </Form.Item>

              <Form.Item
                name="maxRequestsPerHour"
                label="每小时最大请求数"
                tooltip="单个用户每小时允许的最大请求数"
              >
                <InputNumber min={100} max={5000} />
              </Form.Item>

              <Form.Item
                name="blockSuspiciousUA"
                label="阻止可疑用户代理"
                valuePropName="checked"
                tooltip="自动阻止包含爬虫关键词的用户代理"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableBehaviorAnalysis"
                label="启用行为分析"
                valuePropName="checked"
                tooltip="分析用户行为模式以识别机器人"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="enableCloudflareIntegration"
                label="启用Cloudflare集成"
                valuePropName="checked"
                tooltip="与Cloudflare Bot Management集成"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button type="primary" loading={loading} onClick={handleSave}>
              <SettingOutlined /> 保存配置
            </Button>
            <Button onClick={handleReset}>
              重置默认
            </Button>
          </Space>
        </Form>
      </Card>

      {/* 可疑活动监控 */}
      <Card title="可疑活动监控" style={{ marginBottom: 24 }}>
        <Alert
          message="实时监控"
          description="系统正在实时监控可疑访问行为，以下是最近检测到的异常活动"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={suspiciousColumns}
          dataSource={suspiciousActivities}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 测试模态框 */}
      <Modal
        title="防爬虫功能测试"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTestModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Alert
          message="测试说明"
          description="此功能将模拟各种访问场景来测试防爬虫系统的有效性"
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block>测试正常用户访问</Button>
          <Button block>测试机器人访问</Button>
          <Button block>测试高频请求</Button>
          <Button block>测试可疑用户代理</Button>
        </Space>
      </Modal>
    </div>
  );
};

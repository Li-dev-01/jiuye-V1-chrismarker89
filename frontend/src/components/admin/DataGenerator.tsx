/**
 * 数据生成器组件
 * 管理员页面的数据生成工具
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Select,
  InputNumber,
  Button,
  Progress,
  Table,
  Space,
  Statistic,
  Row,
  Col,
  Alert,
  Tag,
  Modal,
  Typography,
  Divider,
  Switch,
  Tooltip,
  Slider,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  RobotOutlined
} from '@ant-design/icons';
import {
  dataGeneratorService,
  type GenerationConfig,
  type GenerationProgress,
  type GenerationStats
} from '../../services/dataGeneratorService';
import SmartDataGenerator from './SmartDataGenerator';
import styles from './DataGenerator.module.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

export const DataGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
  const [activeGenerations, setActiveGenerations] = useState<GenerationProgress[]>([]);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  useEffect(() => {
    loadGenerationStats();
    const interval = setInterval(() => {
      updateActiveGenerations();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadGenerationStats = async () => {
    const stats = await dataGeneratorService.getGenerationStats();
    if (stats) {
      setGenerationStats(stats);
    }
  };

  const updateActiveGenerations = () => {
    const generations = dataGeneratorService.getActiveGenerations();
    setActiveGenerations(generations);
  };

  const handleManualTrigger = async () => {
    setLoading(true);
    try {
      const response = await dataGeneratorService.triggerScheduledGeneration();
      if (response.success) {
        message.success('定时任务已手动触发');
        loadGenerationStats();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('触发定时任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const status = await dataGeneratorService.getSchedulerStatus();
      if (status) {
        message.success('调度器状态已刷新');
        // 这里可以更新状态显示
      }
    } catch (error) {
      message.error('获取调度器状态失败');
    }
  };

  const handleStartGeneration = async (values: any) => {
    setLoading(true);
    try {
      const config: GenerationConfig = {
        type: values.type,
        count: values.count,
        quality: values.quality,
        batchSize: values.batchSize,
        template: values.template,
        options: {
          includeVoices: values.includeVoices,
          diversity: values.diversity / 100,
          realism: values.realism / 100,
          creativity: values.creativity / 100
        }
      };

      const result = values.useLocal 
        ? await dataGeneratorService.generateLocalTestData(config)
        : await dataGeneratorService.startGeneration(config);

      if (result.success) {
        message.success(result.message);
        updateActiveGenerations();
        loadGenerationStats();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('启动生成失败:', error);
      message.error('启动生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGeneration = async (generationId: string) => {
    const success = await dataGeneratorService.cancelGeneration(generationId);
    if (success) {
      message.success('生成任务已取消');
      updateActiveGenerations();
    } else {
      message.error('取消任务失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'pending': return '等待中';
      default: return status;
    }
  };

  const generationColumns = [
    {
      title: '生成ID',
      dataIndex: 'generationId',
      key: 'generationId',
      render: (id: string) => <Text code>{id.slice(-8)}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '进度',
      key: 'progress',
      render: (record: GenerationProgress) => (
        <div>
          <Progress 
            percent={Math.round((record.completed / record.total) * 100)}
            size="small"
            status={record.status === 'failed' ? 'exception' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.completed}/{record.total} ({record.currentBatch}/{record.totalBatches} 批次)
          </Text>
        </div>
      )
    },
    {
      title: '剩余时间',
      dataIndex: 'estimatedTimeRemaining',
      key: 'estimatedTimeRemaining',
      render: (time: number) => (
        <Text type="secondary">
          {time > 0 ? `${Math.round(time / 1000)}秒` : '-'}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: GenerationProgress) => (
        <Space>
          {record.status === 'running' && (
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleCancelGeneration(record.generationId)}
            >
              取消
            </Button>
          )}
          {record.status === 'completed' && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              type="primary"
            >
              下载
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className={styles.dataGenerator}>
      <div className={styles.header}>
        <Title level={3}>数据生成器</Title>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigModalVisible(true)}
          >
            配置
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadGenerationStats();
              updateActiveGenerations();
            }}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="智能生成器" key="smart-generator">
          <SmartDataGenerator />
        </TabPane>

        <TabPane tab="仪表板" key="dashboard">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日生成"
                  value={generationStats?.todayGenerated || 0}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待审核"
                  value={generationStats?.pendingReview || 0}
                  prefix={<InfoCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="通过率"
                  value={generationStats?.passRate || 0}
                  suffix="%"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功率"
                  value={generationStats?.successRate || 0}
                  suffix="%"
                  precision={1}
                />
              </Card>
            </Col>
          </Row>

          <Card title="活跃生成任务" style={{ marginTop: 16 }}>
            <Table
              dataSource={activeGenerations}
              columns={generationColumns}
              rowKey="generationId"
              pagination={false}
              locale={{ emptyText: '暂无活跃的生成任务' }}
            />
          </Card>
        </TabPane>

        <TabPane tab="快速生成" key="generate">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="生成配置">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleStartGeneration}
                  initialValues={{
                    type: 'universal-questionnaire',
                    count: 10,
                    quality: 'standard',
                    batchSize: 5,
                    template: 'basic',
                    includeVoices: true,
                    diversity: 70,
                    realism: 80,
                    creativity: 60,
                    useLocal: true,
                    enableScheduled: false,
                    scheduledInterval: 60 // 60分钟
                  }}
                >
                  <Form.Item
                    name="type"
                    label="数据类型"
                    rules={[{ required: true, message: '请选择数据类型' }]}
                  >
                    <Select>
                      <Option value="universal-questionnaire">通用问卷数据 (推荐)</Option>
                      <Option value="questionnaire">传统问卷数据</Option>
                      <Option value="story">故事内容</Option>
                      <Option value="voice">心声数据</Option>
                      <Option value="semi-anonymous-user">半匿名用户</Option>
                      <Option value="user">用户数据</Option>
                      <Option value="audit">审核记录</Option>
                    </Select>
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="count"
                        label="生成数量"
                        rules={[{ required: true, message: '请输入生成数量' }]}
                      >
                        <InputNumber min={1} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="batchSize"
                        label="批次大小"
                      >
                        <InputNumber min={1} max={20} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="quality"
                    label="质量等级"
                  >
                    <Select>
                      <Option value="basic">基础质量</Option>
                      <Option value="standard">标准质量</Option>
                      <Option value="premium">高级质量</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="template"
                    label="数据模板"
                  >
                    <Select>
                      <Option value="basic">基础模板</Option>
                      <Option value="detailed">详细模板</Option>
                      <Option value="custom">自定义模板</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="includeVoices" valuePropName="checked">
                    <Switch /> 包含语音数据
                  </Form.Item>

                  <Form.Item name="useLocal" valuePropName="checked">
                    <Switch /> 使用本地生成（测试模式）
                  </Form.Item>

                  <Form.Item name="enableScheduled" valuePropName="checked">
                    <Switch /> 启用定时生成
                  </Form.Item>

                  <Form.Item
                    name="scheduledInterval"
                    label="定时间隔（分钟）"
                    tooltip="设置自动生成数据的时间间隔，建议60分钟"
                  >
                    <Slider
                      min={10}
                      max={240}
                      step={10}
                      marks={{
                        10: '10分钟',
                        60: '1小时',
                        120: '2小时',
                        240: '4小时'
                      }}
                    />
                  </Form.Item>

                  <Divider />

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<PlayCircleOutlined />}
                      size="large"
                      block
                    >
                      开始生成
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="生成预览">
                <Alert
                  message="数据生成说明"
                  description="数据生成器将根据配置创建符合问卷结构的测试数据，包括个人信息、教育背景、就业状况等。生成的数据可用于功能测试和数据流转验证。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div className={styles.previewSection}>
                  <Title level={5}>生成内容预览</Title>
                  <Paragraph>
                    <Text strong>问卷数据：</Text>包含完整的个人信息、教育背景、就业状况、求职信息等字段
                  </Paragraph>
                  <Paragraph>
                    <Text strong>故事内容：</Text>求职经历、转行经验、职场感悟等真实性故事
                  </Paragraph>
                  <Paragraph>
                    <Text strong>心声数据：</Text>给学弟学妹的建议、经验分享、鼓励话语等
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="定时任务" key="scheduler">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="定时生成配置">
                <Form layout="vertical">
                  <Form.Item label="定时任务状态">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch defaultChecked />
                      <Text>每小时自动生成数据</Text>
                    </div>
                  </Form.Item>

                  <Form.Item label="每小时生成配置">
                    <Row gutter={8}>
                      <Col span={8}>
                        <InputNumber
                          min={1}
                          max={100}
                          defaultValue={20}
                          addonBefore="用户"
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col span={8}>
                        <InputNumber
                          min={1}
                          max={100}
                          defaultValue={20}
                          addonBefore="问卷"
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col span={8}>
                        <InputNumber
                          min={1}
                          max={100}
                          defaultValue={20}
                          addonBefore="故事"
                          style={{ width: '100%' }}
                        />
                      </Col>
                    </Row>
                  </Form.Item>

                  <Form.Item label="下次执行时间">
                    <Text code>{new Date(Date.now() + 3600000).toLocaleString()}</Text>
                  </Form.Item>

                  <Divider />

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleManualTrigger()}
                      >
                        立即执行
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => loadSchedulerStatus()}
                      >
                        刷新状态
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="执行统计">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="今日执行次数"
                      value={24}
                      prefix={<ThunderboltOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="成功率"
                      value={95.8}
                      suffix="%"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>

                <Divider />

                <div>
                  <Title level={5}>最近执行记录</Title>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>{new Date(Date.now() - i * 3600000).toLocaleString()}</Text>
                          <Tag color="green">成功</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          生成：用户20个，问卷20份，故事20个
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 配置模态框 */}
      <Modal
        title="数据生成器配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfigModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={() => {
            message.success('配置已保存');
            setConfigModalVisible(false);
          }}>
            保存配置
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="默认生成数量">
                <InputNumber min={1} max={10000} defaultValue={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="默认质量等级">
                <Select defaultValue="medium" style={{ width: '100%' }}>
                  <Option value="low">低质量（快速）</Option>
                  <Option value="medium">中等质量</Option>
                  <Option value="high">高质量（慢速）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="批处理大小">
                <InputNumber min={10} max={1000} defaultValue={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="并发线程数">
                <InputNumber min={1} max={10} defaultValue={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="数据存储设置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Switch defaultChecked /> 自动清理过期数据
              <Switch defaultChecked /> 启用数据压缩
              <Switch /> 生成完成后自动备份
            </Space>
          </Form.Item>

          <Form.Item label="AI生成设置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>创意度: </Text>
                <Slider defaultValue={70} style={{ width: 200, marginLeft: 8 }} />
              </div>
              <div>
                <Text>多样性: </Text>
                <Slider defaultValue={80} style={{ width: 200, marginLeft: 8 }} />
              </div>
              <Switch defaultChecked /> 启用智能去重
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

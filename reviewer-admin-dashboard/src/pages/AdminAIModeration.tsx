import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Slider,
  Button,
  Row,
  Col,
  Typography,
  Statistic,
  Progress,
  Alert,
  Space,
  Divider,
  Select,
  Input,
  message,
  Tabs,
  Table,
  Tag
} from 'antd';
import type { TabsProps } from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import AIGatewayConfigPanel from '../components/AIGatewayConfigPanel';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AIConfig {
  enabled: boolean;
  models: {
    textClassification: string;
    contentSafety: string;
    sentimentAnalysis: string;
    semanticAnalysis?: string;
  };
  thresholds: {
    autoApprove: number;
    humanReview: number;
    autoReject: number;
  };
  features: {
    parallelAnalysis: boolean;
    semanticAnalysis: boolean;
    caching: boolean;
    batchProcessing: boolean;
  };
}

interface AIStats {
  totalAnalyses: number;
  successRate: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  modelPerformance: {
    classification: number;
    sentiment: number;
    safety: number;
  };
  recentAnalyses: Array<{
    id: string;
    content: string;
    riskScore: number;
    recommendation: string;
    processingTime: number;
    timestamp: string;
  }>;
}

interface AuditStatistics {
  story_status_distribution: Array<{
    status: string;
    count: number;
    avg_processing_time_ms: number;
  }>;
  batch_ai_stats: {
    total_batches: number;
    total_stories_processed: number;
    total_approved: number;
    total_rejected: number;
    total_manual_review: number;
    avg_processing_time: number;
    queue_length: number;
    is_processing: boolean;
    last_batch_time: string;
  };
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  total_manual_review: number;
}

interface ViolationRecord {
  id: number;
  user_id: number;
  violation_type: string;
  detected_by: string;
  risk_score: number;
  confidence: number;
  created_at: string;
  content_preview: string;
}

interface ManualReviewItem {
  id: number;
  pending_story_id: number;
  priority: number;
  status: string;
  user_id: number;
  content_preview: string;
  ai_audit_result: any;
  created_at: string;
}

const AdminAIModeration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [auditStats, setAuditStats] = useState<AuditStatistics | null>(null);
  const [violationRecords, setViolationRecords] = useState<ViolationRecord[]>([]);
  const [manualReviewQueue, setManualReviewQueue] = useState<ManualReviewItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    enabled: true,
    models: {
      textClassification: '@cf/huggingface/distilbert-sst-2-int8',
      contentSafety: '@cf/meta/llama-guard-3-8b',
      sentimentAnalysis: '@cf/meta/llama-3-8b-instruct',
      semanticAnalysis: '@cf/baai/bge-base-en-v1.5'
    },
    thresholds: {
      autoApprove: 0.2,
      humanReview: 0.5,
      autoReject: 0.8
    },
    features: {
      parallelAnalysis: true,
      semanticAnalysis: true,
      caching: true,
      batchProcessing: false
    }
  });
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadAIConfig();
    loadAIStats();
    loadAuditStatistics();
    loadManualReviewQueue();
  }, []);

  const loadAIConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/simple-admin/ai-moderation/config');
      if (response.data.success) {
        setAiConfig(response.data.data);
      }
    } catch (error) {
      console.error('加载AI配置失败:', error);
      message.error('加载AI配置失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAIStats = async () => {
    try {
      const response = await apiClient.get('/api/simple-admin/ai-moderation/stats');
      if (response.data.success) {
        setAiStats(response.data.data);
      }
    } catch (error) {
      console.error('加载AI统计失败:', error);
    }
  };

  const loadAuditStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await apiClient.get('/api/simple-admin/audit/statistics');
      if (response.data.success) {
        setAuditStats(response.data.data);
      }
    } catch (error) {
      console.error('加载审核统计失败:', error);
      message.error('加载审核统计失败');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadManualReviewQueue = async () => {
    try {
      const response = await apiClient.get('/api/simple-admin/manual-review-queue');
      if (response.data.success) {
        setManualReviewQueue(response.data.data.queue || []);
      }
    } catch (error) {
      console.error('加载人工审核队列失败:', error);
      // 不显示错误消息，因为这不是关键功能
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post('/api/simple-admin/ai-moderation/config', aiConfig);
      if (response.data.success) {
        message.success('AI配置保存成功');
      } else {
        message.error('保存失败: ' + response.data.message);
      }
    } catch (error) {
      console.error('保存AI配置失败:', error);
      message.error('保存AI配置失败');
    } finally {
      setSaving(false);
    }
  };

  const testAIModeration = async () => {
    if (!testContent.trim()) {
      message.warning('请输入测试内容');
      return;
    }

    setTesting(true);
    try {
      console.log('[AI_MODERATION] 开始AI测试，内容:', testContent);

      // 检查认证状态
      const token = localStorage.getItem('ADMIN_TOKEN') ||
                   localStorage.getItem('SUPER_ADMIN_TOKEN') ||
                   localStorage.getItem('REVIEWER_TOKEN');

      console.log('[AI_MODERATION] 使用的token:', token ? `${token.substring(0, 20)}...` : 'None');

      const response = await apiClient.post('/api/simple-admin/ai-moderation/test', {
        content: testContent,
        contentType: 'story'
      });

      console.log('[AI_MODERATION] API响应:', response.data);

      if (response.data.success) {
        setTestResult(response.data.data);
        message.success('AI测试完成');
      } else {
        message.error('测试失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('AI测试失败:', error);

      // 详细错误信息
      if (error.response) {
        console.error('错误状态:', error.response.status);
        console.error('错误数据:', error.response.data);

        if (error.response.status === 401) {
          message.error('认证失败，请重新登录');
        } else if (error.response.status === 403) {
          message.error('权限不足，无法访问AI功能');
        } else {
          message.error(`AI测试失败: ${error.response.data?.message || '未知错误'}`);
        }
      } else {
        message.error('网络错误，请检查连接');
      }
    } finally {
      setTesting(false);
    }
  };

  const updateThreshold = (key: keyof AIConfig['thresholds'], value: number) => {
    setAiConfig(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value
      }
    }));
  };

  const updateFeature = (key: keyof AIConfig['features'], value: boolean) => {
    setAiConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };

  const updateModel = (key: keyof AIConfig['models'], value: string) => {
    setAiConfig(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [key]: value
      }
    }));
  };

  const availableModels = {
    textClassification: [
      '@cf/huggingface/distilbert-sst-2-int8',
      '@cf/microsoft/resnet-50'
    ],
    contentSafety: [
      '@cf/meta/llama-guard-3-8b',
      '@cf/meta/llama-3-8b-instruct'
    ],
    sentimentAnalysis: [
      '@cf/meta/llama-3-8b-instruct',
      '@cf/meta/llama-3.1-8b-instruct'
    ],
    semanticAnalysis: [
      '@cf/baai/bge-base-en-v1.5',
      '@cf/baai/bge-small-en-v1.5'
    ]
  };

  const recentAnalysesColumns = [
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200,
      render: (text: string) => text.substring(0, 50) + (text.length > 50 ? '...' : '')
    },
    {
      title: '风险分数',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={Math.round(score * 100)}
          size="small"
          status={score > 0.7 ? 'exception' : score > 0.4 ? 'active' : 'success'}
        />
      )
    },
    {
      title: '推荐',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 80,
      render: (rec: string) => (
        <Tag color={rec === 'approve' ? 'green' : rec === 'reject' ? 'red' : 'orange'}>
          {rec === 'approve' ? '通过' : rec === 'reject' ? '拒绝' : '审核'}
        </Tag>
      )
    },
    {
      title: '处理时间',
      dataIndex: 'processingTime',
      key: 'processingTime',
      width: 100,
      render: (time: number) => `${time}ms`
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'config',
      label: <span><SettingOutlined />配置管理</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="基础配置">
              <Form layout="vertical">
                <Form.Item label="启用AI审核">
                  <Switch
                    checked={aiConfig.enabled}
                    onChange={(checked) => setAiConfig({...aiConfig, enabled: checked})}
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    关闭后将仅使用规则审核
                  </Text>
                </Form.Item>

                <Divider />

                <Form.Item label="AI模型配置">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>文本分类模型</Text>
                      <Select
                        value={aiConfig.models.textClassification}
                        onChange={(value) => updateModel('textClassification', value)}
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        {availableModels.textClassification.map(model => (
                          <Option key={model} value={model}>{model}</Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={12}>
                      <Text strong>内容安全模型</Text>
                      <Select
                        value={aiConfig.models.contentSafety}
                        onChange={(value) => updateModel('contentSafety', value)}
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        {availableModels.contentSafety.map(model => (
                          <Option key={model} value={model}>{model}</Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                </Form.Item>

                <Divider />

                <Form.Item label="风险阈值设置">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Text strong>自动通过阈值</Text>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={aiConfig.thresholds.autoApprove}
                        onChange={(value) => updateThreshold('autoApprove', value)}
                        marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                      />
                      <Text type="secondary">当前值: {aiConfig.thresholds.autoApprove}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>人工审核阈值</Text>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={aiConfig.thresholds.humanReview}
                        onChange={(value) => updateThreshold('humanReview', value)}
                        marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                      />
                      <Text type="secondary">当前值: {aiConfig.thresholds.humanReview}</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>自动拒绝阈值</Text>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={aiConfig.thresholds.autoReject}
                        onChange={(value) => updateThreshold('autoReject', value)}
                        marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
                      />
                      <Text type="secondary">当前值: {aiConfig.thresholds.autoReject}</Text>
                    </Col>
                  </Row>
                </Form.Item>

                <Divider />

                <Form.Item label="功能特性">
                  <Row gutter={[16, 16]}>
                    <Col span={6}>
                      <Switch
                        checked={aiConfig.features.parallelAnalysis}
                        onChange={(checked) => updateFeature('parallelAnalysis', checked)}
                      />
                      <Text style={{ marginLeft: 8 }}>并行分析</Text>
                    </Col>
                    <Col span={6}>
                      <Switch
                        checked={aiConfig.features.semanticAnalysis}
                        onChange={(checked) => updateFeature('semanticAnalysis', checked)}
                      />
                      <Text style={{ marginLeft: 8 }}>语义分析</Text>
                    </Col>
                    <Col span={6}>
                      <Switch
                        checked={aiConfig.features.caching}
                        onChange={(checked) => updateFeature('caching', checked)}
                      />
                      <Text style={{ marginLeft: 8 }}>结果缓存</Text>
                    </Col>
                    <Col span={6}>
                      <Switch
                        checked={aiConfig.features.batchProcessing}
                        onChange={(checked) => updateFeature('batchProcessing', checked)}
                      />
                      <Text style={{ marginLeft: 8 }}>批量处理</Text>
                    </Col>
                  </Row>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'stats',
      label: <span><BarChartOutlined />性能统计</span>,
      children: aiStats ? (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总分析次数"
                value={aiStats.totalAnalyses}
                prefix={<RobotOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功率"
                value={aiStats.successRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: aiStats.successRate > 95 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均处理时间"
                value={aiStats.averageProcessingTime}
                suffix="ms"
                precision={0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="缓存命中率"
                value={aiStats.cacheHitRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="最近分析记录">
              <Table
                columns={recentAnalysesColumns}
                dataSource={aiStats.recentAnalyses}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        <Alert message="暂无统计数据" type="info" />
      )
    },
    {
      key: 'test',
      label: <span><ExperimentOutlined />测试工具</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="内容测试">
              <Form layout="vertical">
                <Form.Item label="测试内容">
                  <Input.TextArea
                    rows={6}
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    placeholder="输入要测试的内容..."
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    onClick={testAIModeration}
                    loading={testing}
                    disabled={!testContent.trim()}
                  >
                    开始AI分析
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="分析结果">
              {testResult ? (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="风险分数"
                        value={testResult.riskScore}
                        precision={3}
                        valueStyle={{
                          color: testResult.riskScore > 0.7 ? '#cf1322' :
                                 testResult.riskScore > 0.4 ? '#fa8c16' : '#3f8600'
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="置信度"
                        value={testResult.confidence}
                        precision={3}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <div>
                    <Text strong>推荐操作: </Text>
                    <Tag color={
                      testResult.recommendation === 'approve' ? 'green' :
                      testResult.recommendation === 'reject' ? 'red' : 'orange'
                    }>
                      {testResult.recommendation === 'approve' ? '通过' :
                       testResult.recommendation === 'reject' ? '拒绝' : '人工审核'}
                    </Tag>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Text strong>处理时间: </Text>
                    <Text>{testResult.processingTime}ms</Text>
                  </div>
                </div>
              ) : (
                <Alert
                  message="暂无测试结果"
                  description="请在左侧输入内容并点击分析按钮"
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'audit-stats',
      label: <span><BarChartOutlined />审核统计</span>,
      children: auditStats ? (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核故事"
                value={auditStats.total_pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已通过"
                value={auditStats.total_approved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已拒绝"
                value={auditStats.total_rejected}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="人工审核"
                value={auditStats.total_manual_review}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card title="批量AI审核状态">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="处理批次"
                    value={auditStats.batch_ai_stats.total_batches}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="队列长度"
                    value={auditStats.batch_ai_stats.queue_length}
                    valueStyle={{
                      color: auditStats.batch_ai_stats.queue_length > 5 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均处理时间"
                    value={Math.round(auditStats.batch_ai_stats.avg_processing_time)}
                    suffix="ms"
                  />
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>处理状态: </Text>
                    <Tag color={auditStats.batch_ai_stats.is_processing ? 'processing' : 'success'}>
                      {auditStats.batch_ai_stats.is_processing ? '处理中' : '空闲'}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="状态分布">
              <div className="space-y-2">
                {auditStats.story_status_distribution.map((item) => (
                  <div key={item.status} className="flex justify-between items-center">
                    <span>{item.status}</span>
                    <div>
                      <Tag color="blue">{item.count}</Tag>
                      <Text type="secondary">
                        {item.avg_processing_time_ms ? `${Math.round(item.avg_processing_time_ms)}ms` : '-'}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      ) : statsLoading ? (
        <div className="text-center py-8">
          <Text>加载统计数据中...</Text>
        </div>
      ) : (
        <Alert message="暂无审核统计数据" type="info" />
      )
    },
    {
      key: 'manual-review',
      label: <span><RobotOutlined />人工审核</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="人工审核队列"
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadManualReviewQueue}
                >
                  刷新
                </Button>
              }
            >
              <Table
                dataSource={manualReviewQueue}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'ID',
                    dataIndex: 'pending_story_id',
                    key: 'pending_story_id',
                    width: 80,
                  },
                  {
                    title: '用户ID',
                    dataIndex: 'user_id',
                    key: 'user_id',
                    width: 80,
                  },
                  {
                    title: '内容预览',
                    dataIndex: 'content_preview',
                    key: 'content_preview',
                    ellipsis: true,
                    render: (text: string) => (
                      <Text ellipsis={{ tooltip: text }}>
                        {text}
                      </Text>
                    ),
                  },
                  {
                    title: '优先级',
                    dataIndex: 'priority',
                    key: 'priority',
                    width: 80,
                    render: (priority: number) => (
                      <Tag color={priority <= 3 ? 'red' : priority <= 6 ? 'orange' : 'green'}>
                        {priority}
                      </Tag>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    width: 100,
                    render: (status: string) => (
                      <Tag color={
                        status === 'waiting' ? 'orange' :
                        status === 'assigned' ? 'blue' :
                        status === 'reviewing' ? 'processing' : 'success'
                      }>
                        {status === 'waiting' ? '等待中' :
                         status === 'assigned' ? '已分配' :
                         status === 'reviewing' ? '审核中' : '已完成'}
                      </Tag>
                    ),
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    width: 150,
                    render: (time: string) => new Date(time).toLocaleString(),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 120,
                    render: (_, record) => (
                      <Space>
                        <Button size="small" type="primary">
                          审核
                        </Button>
                        <Button size="small">
                          详情
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'gateway',
      label: <span><ThunderboltOutlined />Gateway 优化</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <AIGatewayConfigPanel />
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2}>
                  <RobotOutlined /> AI辅助内容审核
                </Title>
                <Paragraph>
                  基于Cloudflare Workers AI的智能内容审核系统，提供实时内容安全检测和风险评估。
                </Paragraph>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => { loadAIConfig(); loadAIStats(); }}
                    loading={loading}
                  >
                    刷新
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveConfig}
                    loading={saving}
                  >
                    保存配置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Tabs defaultActiveKey="config" items={tabItems} />
        </Col>
      </Row>
    </div>
  );
};

export default AdminAIModeration;

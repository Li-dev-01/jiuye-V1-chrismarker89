/**
 * 审核规则管理页面
 * 管理三层审核机制：本地规则、AI审核、人工审核
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Radio,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Alert,
  Descriptions,
  Divider,
  Row,
  Col,
  Spin,
  message,
  Typography,
  Tag,
  Table,
  Tabs,
  Input,
  List,
  Modal,
  Progress,
  Tooltip,
  Badge,
  Popconfirm,
  Upload,
  notification
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  RobotOutlined,
  UserOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 审核模式配置
const AUDIT_MODES = [
  {
    value: 'disabled',
    label: '关闭审核',
    description: '所有内容直接通过，无任何审核',
    icon: '🚫',
    color: 'default'
  },
  {
    value: 'local_only',
    label: '仅本地规则',
    description: '使用内置规则进行基础过滤',
    icon: '🔧',
    color: 'blue'
  },
  {
    value: 'ai_only',
    label: '仅AI审核',
    description: '使用AI进行智能内容审核',
    icon: '🤖',
    color: 'purple'
  },
  {
    value: 'human_only',
    label: '仅人工审核',
    description: '所有内容需要人工审核',
    icon: '👥',
    color: 'orange'
  },
  {
    value: 'local_ai',
    label: '本地规则 + AI审核',
    description: '推荐模式：本地过滤 + AI智能审核',
    icon: '⚡',
    color: 'green'
  },
  {
    value: 'local_human',
    label: '本地规则 + 人工审核',
    description: '过渡模式：本地过滤 + 人工审核',
    icon: '🔄',
    color: 'gold'
  }
];

interface AuditConfig {
  id: number;
  audit_mode: string;
  local_confidence_threshold: number;
  local_max_content_length: number;
  local_sensitive_level: string;
  ai_confidence_threshold: number;
  ai_timeout_seconds: number;
  ai_fallback_to_human: boolean;
  ai_provider: string;
  human_timeout_hours: number;
  human_auto_approve_on_timeout: boolean;
  trigger_on_uncertain: boolean;
  trigger_on_edge_content: boolean;
  trigger_on_length_exceed: boolean;
  trigger_on_user_appeal: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

// 敏感词接口
interface SensitiveWord {
  id: number;
  word: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
  created_at: string;
}

// 本地规则接口
interface LocalRule {
  id: number;
  name: string;
  type: 'length' | 'format' | 'keyword' | 'pattern';
  config: any;
  enabled: boolean;
  priority: number;
  description: string;
}

// AI模型配置接口
interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  api_key: string;
  model_name: string;
  confidence_threshold: number;
  enabled: boolean;
}

// 测试结果接口
interface TestResult {
  id: string;
  content: string;
  result: 'approved' | 'rejected' | 'flagged';
  score: number;
  reasons: string[];
  layer: number;
  processing_time: number;
  timestamp: string;
}

export const AuditRulesPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AuditConfig | null>(null);
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [localRules, setLocalRules] = useState<any[]>([]);

  // 新增状态
  const [activeTab, setActiveTab] = useState('basic');
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]);
  const [aiModels, setAiModels] = useState<AIModelConfig[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testContent, setTestContent] = useState('');
  const [testing, setTesting] = useState(false);
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<LocalRule | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
    loadSensitiveWords();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, providersData, rulesData] = await Promise.all([
        ManagementAdminService.getAuditConfig(),
        ManagementAdminService.getAiProviders(),
        ManagementAdminService.getLocalRules()
      ]);
      
      setConfig(configData);
      setAiProviders(providersData);
      setLocalRules(rulesData);
      
      // 设置表单初始值
      form.setFieldsValue(configData);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const updatedConfig = await ManagementAdminService.updateAuditConfig({
        ...values,
        admin_id: 'admin' // 临时使用，后续从认证中获取
      });
      
      setConfig(updatedConfig);
      message.success('审核配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentModeConfig = () => {
    const currentMode = form.getFieldValue('audit_mode') || config?.audit_mode;
    return AUDIT_MODES.find(mode => mode.value === currentMode);
  };

  // 加载敏感词列表
  const loadSensitiveWords = async () => {
    try {
      // 模拟数据，实际应该调用API
      const mockWords: SensitiveWord[] = [
        { id: 1, word: '色情', category: '色情内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 2, word: '暴力', category: '暴力内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 3, word: '政治', category: '政治敏感', severity: 'medium', enabled: true, created_at: '2024-01-01' },
        { id: 4, word: '赌博', category: '违法内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
        { id: 5, word: '毒品', category: '违法内容', severity: 'high', enabled: true, created_at: '2024-01-01' },
      ];
      setSensitiveWords(mockWords);
    } catch (error) {
      message.error('加载敏感词失败');
    }
  };

  // 测试内容审核
  const handleTestContent = async () => {
    if (!testContent.trim()) {
      message.warning('请输入测试内容');
      return;
    }

    setTesting(true);
    try {
      // 模拟审核测试
      const mockResult: TestResult = {
        id: Date.now().toString(),
        content: testContent,
        result: testContent.includes('色情') || testContent.includes('暴力') ? 'rejected' : 'approved',
        score: Math.random() * 100,
        reasons: testContent.includes('色情') ? ['包含敏感词: 色情'] :
                testContent.includes('暴力') ? ['包含敏感词: 暴力'] : ['内容正常'],
        layer: 1,
        processing_time: Math.random() * 1000,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [mockResult, ...prev.slice(0, 9)]);
      message.success('测试完成');
    } catch (error) {
      message.error('测试失败');
    } finally {
      setTesting(false);
    }
  };

  // 添加敏感词
  const handleAddWord = async (values: any) => {
    try {
      const newWord: SensitiveWord = {
        id: Date.now(),
        word: values.word,
        category: values.category,
        severity: values.severity,
        enabled: true,
        created_at: new Date().toISOString()
      };
      setSensitiveWords(prev => [newWord, ...prev]);
      setWordModalVisible(false);
      message.success('敏感词添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 删除敏感词
  const handleDeleteWord = async (id: number) => {
    try {
      setSensitiveWords(prev => prev.filter(word => word.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const aiProviderColumns = [
    {
      title: '供应商',
      dataIndex: 'provider_name',
      key: 'provider_name',
    },
    {
      title: '类型',
      dataIndex: 'provider_type',
      key: 'provider_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: '成本',
      dataIndex: 'cost_per_1k_tokens',
      key: 'cost_per_1k_tokens',
      render: (cost: string) => `$${cost}/1K tokens`
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    }
  ];

  const localRulesColumns = [
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
    },
    {
      title: '类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      render: (type: string) => <Tag color="orange">{type}</Tag>
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colorMap = { approve: 'green', reject: 'red', flag: 'orange' };
        return <Tag color={colorMap[action as keyof typeof colorMap]}>{action}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>正在加载审核规则配置...</div>
        </div>
      </AdminLayout>
    );
  }

  const currentModeConfig = getCurrentModeConfig();

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <SettingOutlined style={{ marginRight: '8px' }} />
            审核规则管理
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={loadData}
              loading={loading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            配置三层审核机制：本地规则、AI审核、人工审核
          </div>
        </div>

        {/* 当前状态概览 */}
        {config && (
          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                当前审核状态
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Descriptions title="审核模式" size="small" column={1}>
                  <Descriptions.Item label="当前模式">
                    <Space>
                      <span style={{ fontSize: '18px' }}>{currentModeConfig?.icon}</span>
                      <Tag color={currentModeConfig?.color}>{currentModeConfig?.label}</Tag>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="描述">
                    {currentModeConfig?.description}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <Descriptions title="配置参数" size="small" column={1}>
                  <Descriptions.Item label="本地规则阈值">
                    {config.local_confidence_threshold}%
                  </Descriptions.Item>
                  <Descriptions.Item label="AI审核阈值">
                    {config.ai_confidence_threshold}%
                  </Descriptions.Item>
                  <Descriptions.Item label="AI供应商">
                    {config.ai_provider}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <Descriptions title="超时设置" size="small" column={1}>
                  <Descriptions.Item label="AI超时">
                    {config.ai_timeout_seconds}秒
                  </Descriptions.Item>
                  <Descriptions.Item label="人工审核超时">
                    {config.human_timeout_hours}小时
                  </Descriptions.Item>
                  <Descriptions.Item label="最后更新">
                    {new Date(config.updated_at).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        )}

        {/* 选项卡界面 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
        >
          {/* 基础配置选项卡 */}
          <TabPane
            tab={
              <Space>
                <SettingOutlined />
                基础配置
              </Space>
            }
            key="basic"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={config || {}}
            >
              <Card
                title="审核模式配置"
                style={{ marginBottom: '24px' }}
              >
                <Form.Item
                  name="audit_mode"
                  label="选择审核模式"
                  rules={[{ required: true, message: '请选择审核模式' }]}
                >
                  <Radio.Group>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {AUDIT_MODES.map(mode => (
                        <Radio key={mode.value} value={mode.value}>
                          <Space>
                            <span style={{ fontSize: '16px' }}>{mode.icon}</span>
                            <strong>{mode.label}</strong>
                            <Text type="secondary">- {mode.description}</Text>
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Alert
                  message="审核模式说明"
                  description={
                    <div>
                      <p><strong>推荐配置：</strong>本地规则 + AI审核，可实现7×24小时自动审核，无人工成本。</p>
                      <p><strong>过渡配置：</strong>本地规则 + 人工审核，在AI功能完善前使用。</p>
                      <p><strong>注意：</strong>人工审核无法7×24小时配置，会形成审核积压。</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Card>

              <Card>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    size="large"
                  >
                    保存配置
                  </Button>
                  <Button onClick={loadData} disabled={saving}>
                    重置
                  </Button>
                </Space>
              </Card>
            </Form>
          </TabPane>

          {/* 敏感词管理选项卡 */}
          <TabPane
            tab={
              <Space>
                <FilterOutlined />
                敏感词管理
              </Space>
            }
            key="sensitive-words"
          >
            <Card
              title="敏感词库管理"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setWordModalVisible(true)}
                >
                  添加敏感词
                </Button>
              }
            >
              <Table
                dataSource={sensitiveWords}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: '敏感词',
                    dataIndex: 'word',
                    key: 'word',
                    render: (text: string) => <strong>{text}</strong>
                  },
                  {
                    title: '分类',
                    dataIndex: 'category',
                    key: 'category',
                    render: (category: string) => <Tag color="blue">{category}</Tag>
                  },
                  {
                    title: '严重程度',
                    dataIndex: 'severity',
                    key: 'severity',
                    render: (severity: string) => {
                      const colors = { low: 'green', medium: 'orange', high: 'red' };
                      return <Tag color={colors[severity as keyof typeof colors]}>{severity}</Tag>;
                    }
                  },
                  {
                    title: '状态',
                    dataIndex: 'enabled',
                    key: 'enabled',
                    render: (enabled: boolean) => (
                      <Badge
                        status={enabled ? 'success' : 'default'}
                        text={enabled ? '启用' : '禁用'}
                      />
                    )
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (date: string) => new Date(date).toLocaleDateString()
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record: SensitiveWord) => (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingWord(record);
                            setWordModalVisible(true);
                          }}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确定删除这个敏感词吗？"
                          onConfirm={() => handleDeleteWord(record.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
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
                ]}
              />
            </Card>
          </TabPane>

          {/* 测试功能选项卡 */}
          <TabPane
            tab={
              <Space>
                <ExperimentOutlined />
                审核测试
              </Space>
            }
            key="test"
          >
            <Row gutter={24}>
              <Col span={12}>
                <Card title="内容测试">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <TextArea
                      placeholder="请输入要测试的内容..."
                      value={testContent}
                      onChange={(e) => setTestContent(e.target.value)}
                      rows={6}
                    />
                    <Button
                      type="primary"
                      icon={<ToolOutlined />}
                      loading={testing}
                      onClick={handleTestContent}
                      block
                    >
                      开始测试
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="测试结果">
                  <List
                    dataSource={testResults}
                    renderItem={(result) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            result.result === 'approved' ?
                            <CheckCircleOutlined style={{ color: 'green' }} /> :
                            result.result === 'rejected' ?
                            <CloseCircleOutlined style={{ color: 'red' }} /> :
                            <ExclamationCircleOutlined style={{ color: 'orange' }} />
                          }
                          title={
                            <Space>
                              <Tag color={
                                result.result === 'approved' ? 'green' :
                                result.result === 'rejected' ? 'red' : 'orange'
                              }>
                                {result.result === 'approved' ? '通过' :
                                 result.result === 'rejected' ? '拒绝' : '标记'}
                              </Tag>
                              <Text type="secondary">
                                评分: {result.score.toFixed(1)}
                              </Text>
                            </Space>
                          }
                          description={
                            <div>
                              <div>内容: {result.content.substring(0, 50)}...</div>
                              <div>原因: {result.reasons.join(', ')}</div>
                              <div>处理时间: {result.processing_time.toFixed(0)}ms</div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        {/* 敏感词添加/编辑模态框 */}
        <Modal
          title={editingWord ? '编辑敏感词' : '添加敏感词'}
          open={wordModalVisible}
          onCancel={() => {
            setWordModalVisible(false);
            setEditingWord(null);
          }}
          footer={null}
        >
          <Form
            layout="vertical"
            onFinish={handleAddWord}
            initialValues={editingWord || {}}
          >
            <Form.Item
              name="word"
              label="敏感词"
              rules={[{ required: true, message: '请输入敏感词' }]}
            >
              <Input placeholder="请输入敏感词" />
            </Form.Item>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类">
                <Option value="色情内容">色情内容</Option>
                <Option value="暴力内容">暴力内容</Option>
                <Option value="政治敏感">政治敏感</Option>
                <Option value="违法内容">违法内容</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="severity"
              label="严重程度"
              rules={[{ required: true, message: '请选择严重程度' }]}
            >
              <Select placeholder="请选择严重程度">
                <Option value="low">低</Option>
                <Option value="medium">中</Option>
                <Option value="high">高</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingWord ? '更新' : '添加'}
                </Button>
                <Button onClick={() => {
                  setWordModalVisible(false);
                  setEditingWord(null);
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AuditRulesPage;

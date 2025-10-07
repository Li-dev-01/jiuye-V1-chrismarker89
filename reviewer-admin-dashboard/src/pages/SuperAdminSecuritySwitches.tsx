/**
 * 超级管理员安全开关控制页面
 * 提供Turnstile和其他安全功能的开关控制
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  Form,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Divider,
  Tag,
  Modal,
  message,
  Tooltip,
  Statistic,
  Timeline,
  Tabs,
  Spin
} from 'antd';
import {
  SecurityScanOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  HistoryOutlined,
  BugOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 安全配置接口
interface SecuritySwitchConfig {
  turnstile: {
    enabled: boolean;
    questionnaire: boolean;
    story: boolean;
    registration: boolean;
    login: boolean;
    bypassInDev: boolean;
  };
  rateLimit: {
    enabled: boolean;
    shortTerm: boolean;
    mediumTerm: boolean;
    longTerm: boolean;
    ipReputation: boolean;
    suspiciousDetection: boolean;
  };
  contentQuality: {
    enabled: boolean;
    duplicateCheck: boolean;
    spamDetection: boolean;
    qualityScore: boolean;
  };
  behaviorAnalysis: {
    enabled: boolean;
    mouseTracking: boolean;
    scrollTracking: boolean;
    timingAnalysis: boolean;
  };
  emergency: {
    enabled: boolean;
    blockAllSubmissions: boolean;
    strictMode: boolean;
    maintenanceMode: boolean;
  };
  debug: {
    enabled: boolean;
    logAllRequests: boolean;
    bypassAllChecks: boolean;
    verboseLogging: boolean;
  };
}

// 配置历史记录接口
interface ConfigHistory {
  timestamp: number;
  config: SecuritySwitchConfig;
  operator: string;
}

const SuperAdminSecuritySwitches: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SecuritySwitchConfig | null>(null);
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [activeTab, setActiveTab] = useState('turnstile');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // 获取当前配置
  const fetchConfig = async () => {
    setLoading(true);
    try {
      // 模拟API调用 - 实际应该调用真实API
      const mockConfig: SecuritySwitchConfig = {
        turnstile: {
          enabled: true,
          questionnaire: true,
          story: true,
          registration: true,
          login: false,
          bypassInDev: true
        },
        rateLimit: {
          enabled: true,
          shortTerm: true,
          mediumTerm: true,
          longTerm: true,
          ipReputation: true,
          suspiciousDetection: true
        },
        contentQuality: {
          enabled: true,
          duplicateCheck: true,
          spamDetection: true,
          qualityScore: true
        },
        behaviorAnalysis: {
          enabled: false,
          mouseTracking: false,
          scrollTracking: false,
          timingAnalysis: false
        },
        emergency: {
          enabled: false,
          blockAllSubmissions: false,
          strictMode: false,
          maintenanceMode: false
        },
        debug: {
          enabled: false,
          logAllRequests: false,
          bypassAllChecks: false,
          verboseLogging: false
        }
      };

      setConfig(mockConfig);
      form.setFieldsValue(mockConfig);
      message.success('配置加载成功');
    } catch (error) {
      console.error('获取配置失败:', error);
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async (values: SecuritySwitchConfig) => {
    setLoading(true);
    try {
      // 模拟API调用 - 实际应该调用真实API
      console.log('保存配置:', values);
      
      setConfig(values);
      message.success('配置保存成功');
      
      // 添加到历史记录
      const newHistory: ConfigHistory = {
        timestamp: Date.now(),
        config: values,
        operator: 'super_admin'
      };
      setHistory(prev => [newHistory, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 紧急停止所有防护
  const emergencyStop = async () => {
    if (!config) {
      message.error('配置未加载，无法执行紧急停止');
      return;
    }

    setLoading(true);
    try {
      const emergencyConfig: SecuritySwitchConfig = {
        ...config,
        turnstile: { ...config.turnstile, enabled: false },
        rateLimit: { ...config.rateLimit, enabled: false },
        contentQuality: { ...config.contentQuality, enabled: false },
        behaviorAnalysis: { ...config.behaviorAnalysis, enabled: false },
        emergency: { ...config.emergency, enabled: true },
        debug: { ...config.debug, bypassAllChecks: true }
      };

      await saveConfig(emergencyConfig);
      form.setFieldsValue(emergencyConfig);
      setEmergencyModalVisible(false);
      message.warning('已紧急停止所有安全防护');
    } catch (error) {
      message.error('紧急停止失败');
    } finally {
      setLoading(false);
    }
  };

  // 启用严格模式
  const enableStrictMode = async () => {
    if (!config) {
      message.error('配置未加载，无法启用严格模式');
      return;
    }

    setLoading(true);
    try {
      const strictConfig: SecuritySwitchConfig = {
        ...config,
        turnstile: {
          enabled: true,
          questionnaire: true,
          story: true,
          registration: true,
          login: true,
          bypassInDev: false
        },
        rateLimit: {
          enabled: true,
          shortTerm: true,
          mediumTerm: true,
          longTerm: true,
          ipReputation: true,
          suspiciousDetection: true
        },
        contentQuality: {
          enabled: true,
          duplicateCheck: true,
          spamDetection: true,
          qualityScore: true
        },
        emergency: { ...config.emergency, strictMode: true },
        debug: { ...config.debug, bypassAllChecks: false }
      };

      await saveConfig(strictConfig);
      form.setFieldsValue(strictConfig);
      message.success('已启用严格安全模式');
    } catch (error) {
      message.error('启用严格模式失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (!config) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载安全配置中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SecurityScanOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          安全开关控制台
        </Title>
        <Text type="secondary">管理Turnstile和其他安全功能的开关配置</Text>
      </div>

      {/* 紧急控制区域 */}
      <Alert
        message="紧急控制"
        description="在遇到问题时，可以快速关闭所有安全防护或启用严格模式"
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
        action={
          <Space>
            <Button
              size="small"
              danger
              icon={<WarningOutlined />}
              onClick={() => setEmergencyModalVisible(true)}
            >
              紧急停止
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SafetyOutlined />}
              onClick={enableStrictMode}
            >
              严格模式
            </Button>
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryModalVisible(true)}
            >
              配置历史
            </Button>
          </Space>
        }
      />

      {/* 配置概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Turnstile状态"
              value={config?.turnstile?.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config?.turnstile?.enabled ? '#3f8600' : '#cf1322' }}
              prefix={config?.turnstile?.enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="频率限制"
              value={config?.rateLimit?.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config?.rateLimit?.enabled ? '#3f8600' : '#cf1322' }}
              prefix={config?.rateLimit?.enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="内容质量检测"
              value={config?.contentQuality?.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config?.contentQuality?.enabled ? '#3f8600' : '#cf1322' }}
              prefix={config?.contentQuality?.enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="紧急模式"
              value={config?.emergency?.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config?.emergency?.enabled ? '#cf1322' : '#3f8600' }}
              prefix={config?.emergency?.enabled ? <WarningOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细配置 */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <SettingOutlined /> 详细配置
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfig}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
            >
              保存配置
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={saveConfig}
          initialValues={config}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Turnstile配置 */}
            <TabPane tab={<span><SecurityScanOutlined />Turnstile验证</span>} key="turnstile">
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Alert
                    message="Cloudflare Turnstile人机验证"
                    description="基于Cloudflare全球威胁情报的无感人机验证系统"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>启用Turnstile验证</Text>
                      <br />
                      <Text type="secondary">全局开关，控制所有Turnstile功能</Text>
                    </div>
                    <Form.Item name={['turnstile', 'enabled']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>开发环境绕过</Text>
                      <br />
                      <Text type="secondary">开发环境自动禁用验证</Text>
                    </div>
                    <Form.Item name={['turnstile', 'bypassInDev']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>问卷提交验证</Text>
                      <br />
                      <Text type="secondary">问卷提交时进行人机验证</Text>
                    </div>
                    <Form.Item name={['turnstile', 'questionnaire']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>故事发布验证</Text>
                      <br />
                      <Text type="secondary">故事发布时进行人机验证</Text>
                    </div>
                    <Form.Item name={['turnstile', 'story']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>用户注册验证</Text>
                      <br />
                      <Text type="secondary">用户注册时进行人机验证</Text>
                    </div>
                    <Form.Item name={['turnstile', 'registration']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>登录验证</Text>
                      <br />
                      <Text type="secondary">用户登录时进行人机验证</Text>
                    </div>
                    <Form.Item name={['turnstile', 'login']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </TabPane>

            {/* 频率限制配置 */}
            <TabPane tab={<span><ThunderboltOutlined />频率限制</span>} key="rateLimit">
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Alert
                    message="IP时效频率限制"
                    description="多级时间窗口的频率控制，防止恶意刷量和滥用"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>启用频率限制</Text>
                      <br />
                      <Text type="secondary">全局频率限制开关</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'enabled']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>IP信誉评分</Text>
                      <br />
                      <Text type="secondary">基于历史行为的IP信誉系统</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'ipReputation']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>短期限制</Text>
                      <br />
                      <Text type="secondary">1分钟窗口</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'shortTerm']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>中期限制</Text>
                      <br />
                      <Text type="secondary">1小时窗口</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'mediumTerm']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>长期限制</Text>
                      <br />
                      <Text type="secondary">24小时窗口</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'longTerm']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>可疑行为检测</Text>
                      <br />
                      <Text type="secondary">自动检测和处理可疑行为</Text>
                    </div>
                    <Form.Item name={['rateLimit', 'suspiciousDetection']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </TabPane>

            {/* 紧急控制 */}
            <TabPane tab={<span><WarningOutlined />紧急控制</span>} key="emergency">
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Alert
                    message="紧急控制功能"
                    description="在遇到安全威胁或系统问题时的紧急响应措施"
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>启用紧急模式</Text>
                      <br />
                      <Text type="secondary">激活紧急响应机制</Text>
                    </div>
                    <Form.Item name={['emergency', 'enabled']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>维护模式</Text>
                      <br />
                      <Text type="secondary">系统维护时禁用所有功能</Text>
                    </div>
                    <Form.Item name={['emergency', 'maintenanceMode']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>阻止所有提交</Text>
                      <br />
                      <Text type="secondary">紧急情况下阻止所有用户提交</Text>
                    </div>
                    <Form.Item name={['emergency', 'blockAllSubmissions']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>严格模式</Text>
                      <br />
                      <Text type="secondary">启用最严格的安全检查</Text>
                    </div>
                    <Form.Item name={['emergency', 'strictMode']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </TabPane>

            {/* 调试模式 */}
            <TabPane tab={<span><BugOutlined />调试模式</span>} key="debug">
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Alert
                    message="调试和开发功能"
                    description="仅在开发和调试时使用，生产环境请谨慎启用"
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>启用调试模式</Text>
                      <br />
                      <Text type="secondary">开启调试功能</Text>
                    </div>
                    <Form.Item name={['debug', 'enabled']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>详细日志</Text>
                      <br />
                      <Text type="secondary">记录详细的调试信息</Text>
                    </div>
                    <Form.Item name={['debug', 'verboseLogging']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong>记录所有请求</Text>
                      <br />
                      <Text type="secondary">记录所有API请求</Text>
                    </div>
                    <Form.Item name={['debug', 'logAllRequests']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <Text strong style={{ color: '#cf1322' }}>绕过所有检查</Text>
                      <br />
                      <Text type="secondary">⚠️ 危险：禁用所有安全检查</Text>
                    </div>
                    <Form.Item name={['debug', 'bypassAllChecks']} valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Form>
      </Card>

      {/* 紧急停止确认模态框 */}
      <Modal
        title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> 紧急停止确认</span>}
        open={emergencyModalVisible}
        onCancel={() => setEmergencyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmergencyModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" danger onClick={emergencyStop} loading={loading}>
            确认紧急停止
          </Button>
        ]}
      >
        <Alert
          message="警告"
          description="此操作将立即停止所有安全防护功能，包括Turnstile验证、频率限制等。请确认您了解此操作的后果。"
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Paragraph>
          <Text strong>将要执行的操作：</Text>
          <ul>
            <li>禁用Turnstile人机验证</li>
            <li>禁用所有频率限制</li>
            <li>禁用内容质量检测</li>
            <li>启用调试模式绕过检查</li>
          </ul>
        </Paragraph>
      </Modal>

      {/* 配置历史模态框 */}
      <Modal
        title={<span><HistoryOutlined /> 配置历史</span>}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Timeline>
          {history.map((item, index) => {
            if (!item || !item.config) {
              return null;
            }

            return (
              <Timeline.Item
                key={index}
                color={index === 0 ? 'green' : 'blue'}
                dot={index === 0 ? <CheckCircleOutlined /> : <EyeOutlined />}
              >
                <div>
                  <Text strong>{new Date(item.timestamp).toLocaleString()}</Text>
                  <br />
                  <Text type="secondary">操作者: {item.operator || '未知'}</Text>
                  <br />
                  <Space wrap style={{ marginTop: '8px' }}>
                    <Tag color={item.config?.turnstile?.enabled ? 'green' : 'red'}>
                      Turnstile: {item.config?.turnstile?.enabled ? '启用' : '禁用'}
                    </Tag>
                    <Tag color={item.config?.rateLimit?.enabled ? 'green' : 'red'}>
                      频率限制: {item.config?.rateLimit?.enabled ? '启用' : '禁用'}
                    </Tag>
                    <Tag color={item.config?.emergency?.enabled ? 'orange' : 'green'}>
                      紧急模式: {item.config?.emergency?.enabled ? '启用' : '禁用'}
                    </Tag>
                  </Space>
                </div>
              </Timeline.Item>
            );
          }).filter(Boolean)}
        </Timeline>
      </Modal>
    </div>
  );
};

export default SuperAdminSecuritySwitches;

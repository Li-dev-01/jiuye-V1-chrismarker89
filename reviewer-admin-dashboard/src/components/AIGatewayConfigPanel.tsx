/**
 * AI Gateway 配置面板
 * 管理缓存、速率限制、提示词和告警配置
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Tabs,
  Space,
  message,
  Statistic,
  Row,
  Col,
  Alert,
  Divider,
  Tag,
  Timeline,
  Modal
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  BellOutlined,
  BarChartOutlined,
  ClearOutlined,
  HistoryOutlined,
  SaveOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { apiClient } from '../services/apiClient';

const { TextArea } = Input;
const { Option } = Select;

interface AIGatewayConfig {
  cache: any;
  rateLimit: any;
  prompts: any;
  alerts: any;
  performance: any;
  monitoring: any;
}

const AIGatewayConfigPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AIGatewayConfig | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // 加载配置
  const loadConfig = async () => {
    try {
      const response = await apiClient.get('/api/simple-admin/ai-moderation/gateway/config');
      if (response.data.success) {
        setConfig(response.data.data);
        form.setFieldsValue(response.data.data);
      }
    } catch (error) {
      message.error('加载配置失败');
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await apiClient.get('/api/simple-admin/ai-moderation/gateway/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 加载配置历史
  const loadHistory = async () => {
    try {
      const response = await apiClient.get('/api/simple-admin/ai-moderation/gateway/config/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('加载配置历史失败:', error);
    }
  };

  useEffect(() => {
    loadConfig();
    loadStats();
    loadHistory();
    
    // 每30秒刷新统计信息
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const response = await apiClient.post('/api/simple-admin/ai-moderation/gateway/config', values);
      
      if (response.data.success) {
        message.success('配置保存成功');
        loadConfig();
        loadHistory();
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        message.error(`配置验证失败: ${error.response.data.errors.join(', ')}`);
      } else {
        message.error('保存配置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 清空缓存
  const handleClearCache = async () => {
    Modal.confirm({
      title: '确认清空缓存',
      content: '这将清空所有 AI 分析结果缓存，确定要继续吗？',
      onOk: async () => {
        try {
          const response = await apiClient.post('/api/simple-admin/ai-moderation/gateway/cache/clear');
          if (response.data.success) {
            message.success('缓存已清空');
            loadStats();
          }
        } catch (error) {
          message.error('清空缓存失败');
        }
      }
    });
  };

  // Tab 1: 缓存配置
  const CacheConfigTab = () => (
    <Card title="缓存策略配置" extra={
      <Button icon={<ClearOutlined />} onClick={handleClearCache}>清空缓存</Button>
    }>
      <Form.Item name={['cache', 'enabled']} label="启用缓存" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['cache', 'ttl']} label="缓存时间 (秒)">
        <InputNumber min={60} max={86400} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['cache', 'maxSize']} label="最大缓存条目数">
        <InputNumber min={100} max={100000} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['cache', 'strategy']} label="缓存策略">
        <Select>
          <Option value="lru">LRU (最近最少使用)</Option>
          <Option value="lfu">LFU (最不经常使用)</Option>
          <Option value="fifo">FIFO (先进先出)</Option>
        </Select>
      </Form.Item>
      
      <Form.Item name={['cache', 'confidenceThreshold']} label="置信度阈值">
        <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
      </Form.Item>

      {stats?.cache && (
        <>
          <Divider>缓存统计</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="缓存大小" value={stats.cache.size} />
            </Col>
            <Col span={6}>
              <Statistic title="命中次数" value={stats.cache.hits} />
            </Col>
            <Col span={6}>
              <Statistic title="未命中次数" value={stats.cache.misses} />
            </Col>
            <Col span={6}>
              <Statistic title="命中率" value={stats.cache.hitRate} />
            </Col>
          </Row>
        </>
      )}
    </Card>
  );

  // Tab 2: 速率限制配置
  const RateLimitConfigTab = () => (
    <Card title="速率限制配置">
      <Form.Item name={['rateLimit', 'enabled']} label="启用速率限制" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'perMinute']} label="每分钟请求数">
        <InputNumber min={1} max={1000} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'perHour']} label="每小时请求数">
        <InputNumber min={10} max={10000} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'perDay']} label="每天请求数">
        <InputNumber min={100} max={100000} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'burstSize']} label="突发请求大小">
        <InputNumber min={1} max={100} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'costBudget']} label="每日成本预算 ($)">
        <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
      </Form.Item>
      
      <Form.Item name={['rateLimit', 'alertThreshold']} label="告警阈值 (%)">
        <InputNumber min={50} max={100} style={{ width: '100%' }} />
      </Form.Item>

      {stats?.rateLimit && (
        <>
          <Divider>当前使用情况</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="每分钟" value={stats.rateLimit.perMinute} suffix={`/ ${config?.rateLimit.perMinute}`} />
            </Col>
            <Col span={6}>
              <Statistic title="每小时" value={stats.rateLimit.perHour} suffix={`/ ${config?.rateLimit.perHour}`} />
            </Col>
            <Col span={6}>
              <Statistic title="每天" value={stats.rateLimit.perDay} suffix={`/ ${config?.rateLimit.perDay}`} />
            </Col>
            <Col span={6}>
              <Statistic title="今日成本" value={stats.rateLimit.dailyCost} prefix="$" precision={4} />
            </Col>
          </Row>
        </>
      )}
    </Card>
  );

  // Tab 3: 提示词管理
  const PromptsConfigTab = () => (
    <Card title="提示词管理">
      <Form.Item name={['prompts', 'enabled']} label="启用提示词管理" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['prompts', 'version']} label="版本号">
        <Input placeholder="例如: 1.0.0" />
      </Form.Item>
      
      <Divider>提示词模板</Divider>
      
      <Form.Item name={['prompts', 'templates', 'sentimentAnalysis']} label="情感分析">
        <TextArea rows={4} placeholder="情感分析提示词模板" />
      </Form.Item>
      
      <Form.Item name={['prompts', 'templates', 'contentSafety']} label="内容安全">
        <TextArea rows={4} placeholder="内容安全检测提示词模板" />
      </Form.Item>
      
      <Form.Item name={['prompts', 'templates', 'employmentClassification']} label="就业分类">
        <TextArea rows={4} placeholder="就业内容分类提示词模板" />
      </Form.Item>
      
      <Form.Item name={['prompts', 'templates', 'riskAssessment']} label="风险评估">
        <TextArea rows={4} placeholder="风险评估提示词模板" />
      </Form.Item>
      
      <Divider>优化选项</Divider>
      
      <Form.Item name={['prompts', 'optimization', 'autoOptimize']} label="自动优化" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['prompts', 'optimization', 'abTesting']} label="A/B 测试" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['prompts', 'optimization', 'performanceTracking']} label="性能追踪" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Card>
  );

  // Tab 4: 告警配置
  const AlertsConfigTab = () => (
    <Card title="告警配置">
      <Form.Item name={['alerts', 'enabled']} label="启用告警" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Divider>告警渠道</Divider>
      
      <Form.Item name={['alerts', 'channels', 'email']} label="邮件通知" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['alerts', 'channels', 'webhook']} label="Webhook" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item name={['alerts', 'channels', 'dashboard']} label="控制台" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Divider>告警规则</Divider>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Form.Item name={['alerts', 'rules', 'highErrorRate', 'enabled']} label="高错误率告警" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name={['alerts', 'rules', 'highErrorRate', 'threshold']} label="错误率阈值 (%)">
          <InputNumber min={1} max={50} style={{ width: '100%' }} />
        </Form.Item>
      </Space>

      {stats?.alerts && stats.alerts.length > 0 && (
        <>
          <Divider>最近告警</Divider>
          <Timeline>
            {stats.alerts.slice(0, 5).map((alert: any, index: number) => (
              <Timeline.Item key={index} color={
                alert.severity === 'critical' ? 'red' :
                alert.severity === 'high' ? 'orange' :
                alert.severity === 'medium' ? 'blue' : 'green'
              }>
                <Tag color={alert.severity === 'critical' ? 'red' : 'orange'}>
                  {alert.severity.toUpperCase()}
                </Tag>
                {alert.message}
                <br />
                <small>{new Date(alert.timestamp).toLocaleString()}</small>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}
    </Card>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'cache',
      label: <span><ThunderboltOutlined />缓存策略</span>,
      children: <CacheConfigTab />
    },
    {
      key: 'rateLimit',
      label: <span><BarChartOutlined />速率限制</span>,
      children: <RateLimitConfigTab />
    },
    {
      key: 'prompts',
      label: <span><FileTextOutlined />提示词管理</span>,
      children: <PromptsConfigTab />
    },
    {
      key: 'alerts',
      label: <span><BellOutlined />告警配置</span>,
      children: <AlertsConfigTab />
    }
  ];

  return (
    <div>
      <Alert
        message="AI Gateway 优化配置"
        description="配置缓存策略、速率限制、提示词和告警规则，优化 AI 服务性能和成本"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Tabs items={tabItems} />
        
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => form.resetFields()}>重置</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
              保存配置
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default AIGatewayConfigPanel;


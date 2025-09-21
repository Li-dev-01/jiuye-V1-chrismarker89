/**
 * AI审核助手页面
 * 
 * 配置和管理AI审核助手功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Switch,
  Form,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Table,
  Tag,
  Progress,
  Statistic,
  message,
  Divider
} from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  SaveOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../../components/layout/RoleBasedLayout';

const { Title, Text } = Typography;
const { Option } = Select;

export const AIReviewAssistantPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 模拟配置数据
  const [config, setConfig] = useState({
    enabled: true,
    autoPrescreen: true,
    confidenceThreshold: 0.8,
    qualityThreshold: 0.7,
    toxicityThreshold: 0.3,
    enabledFeatures: {
      qualityAnalysis: true,
      sentimentAnalysis: true,
      toxicityDetection: true,
      relevanceCheck: true,
      readabilityCheck: false
    },
    contentTypes: {
      questionnaire: true,
      story: true,
      voice: true
    }
  });

  // 模拟统计数据
  const [stats] = useState({
    totalAnalyzed: 1250,
    autoApproved: 856,
    flaggedForReview: 394,
    accuracy: 94.2,
    timesSaved: 15.6,
    costSavings: 234.50
  });

  // 保存配置
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfig({
        ...config,
        ...values
      });
      
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 组件挂载时设置表单值
  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  // 分析结果示例数据
  const analysisResults = [
    {
      id: '1',
      contentType: 'questionnaire',
      title: '计算机专业毕业生就业调查',
      qualityScore: 92,
      sentimentScore: 0.6,
      toxicityScore: 0.1,
      recommendation: 'approve',
      confidence: 0.95,
      flags: []
    },
    {
      id: '2',
      contentType: 'story',
      title: '从实习生到正式员工的心路历程',
      qualityScore: 88,
      sentimentScore: 0.8,
      toxicityScore: 0.05,
      recommendation: 'approve',
      confidence: 0.92,
      flags: []
    },
    {
      id: '3',
      contentType: 'voice',
      title: '希望能找到心仪的工作...',
      qualityScore: 65,
      sentimentScore: -0.2,
      toxicityScore: 0.4,
      recommendation: 'review_required',
      confidence: 0.78,
      flags: ['low_quality', 'negative_sentiment']
    }
  ];

  // 获取推荐标签
  const getRecommendationTag = (recommendation: string, confidence: number) => {
    const config = {
      approve: { color: 'green', text: '建议通过' },
      reject: { color: 'red', text: '建议拒绝' },
      review_required: { color: 'orange', text: '需要审核' }
    };
    
    const rec = config[recommendation as keyof typeof config];
    return (
      <Space>
        <Tag color={rec.color}>{rec.text}</Tag>
        <Text type="secondary">({(confidence * 100).toFixed(0)}%)</Text>
      </Space>
    );
  };

  // 获取分数颜色
  const getScoreColor = (score: number, isReverse = false) => {
    if (isReverse) {
      if (score <= 0.3) return '#52c41a';
      if (score <= 0.6) return '#faad14';
      return '#ff4d4f';
    } else {
      if (score >= 80) return '#52c41a';
      if (score >= 60) return '#faad14';
      return '#ff4d4f';
    }
  };

  const columns = [
    {
      title: '内容',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space>
          <Tag color="blue">{record.contentType}</Tag>
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: '质量评分',
      dataIndex: 'qualityScore',
      key: 'qualityScore',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={getScoreColor(score)}
          format={() => `${score}`}
        />
      )
    },
    {
      title: '情感分析',
      dataIndex: 'sentimentScore',
      key: 'sentimentScore',
      render: (score: number) => {
        const sentiment = score > 0.3 ? '积极' : score < -0.3 ? '消极' : '中性';
        const color = score > 0.3 ? '#52c41a' : score < -0.3 ? '#ff4d4f' : '#faad14';
        return <Tag color={color}>{sentiment}</Tag>;
      }
    },
    {
      title: '有害内容',
      dataIndex: 'toxicityScore',
      key: 'toxicityScore',
      render: (score: number) => (
        <Progress
          percent={score * 100}
          size="small"
          strokeColor={getScoreColor(score, true)}
          format={() => `${(score * 100).toFixed(0)}%`}
        />
      )
    },
    {
      title: 'AI建议',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (recommendation: string, record: any) => 
        getRecommendationTag(recommendation, record.confidence)
    },
    {
      title: '标记',
      dataIndex: 'flags',
      key: 'flags',
      render: (flags: string[]) => (
        <Space>
          {flags.map(flag => (
            <Tag key={flag} color="red" size="small">
              {flag === 'low_quality' ? '低质量' : 
               flag === 'negative_sentiment' ? '消极情绪' : flag}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Button type="text" icon={<EyeOutlined />} size="small">
          查看详情
        </Button>
      )
    }
  ];

  return (
    <AdminLayout>
      <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 8 }}>
          <Title level={2}>
            <RobotOutlined /> AI审核助手
          </Title>
          <Text type="secondary">
            配置和管理AI审核助手功能，提升审核效率和质量
          </Text>
        </div>

        {/* 统计概览 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总分析数"
                value={stats.totalAnalyzed}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="自动通过"
                value={stats.autoApproved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="准确率"
                value={stats.accuracy}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="节省时间"
                value={stats.timesSaved}
                suffix="小时"
                precision={1}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 配置设置 */}
        <Card title="AI助手配置" extra={<SettingOutlined />} style={{ marginBottom: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Title level={4}>基础设置</Title>
                
                <Form.Item
                  name="enabled"
                  label="启用AI审核助手"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="autoPrescreen"
                  label="自动预筛选"
                  valuePropName="checked"
                  tooltip="自动标记高质量内容和问题内容"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="confidenceThreshold"
                  label="置信度阈值"
                  tooltip="AI建议的最低置信度要求"
                >
                  <InputNumber
                    min={0.5}
                    max={1}
                    step={0.1}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item
                  name="qualityThreshold"
                  label="质量阈值"
                  tooltip="内容质量的最低要求"
                >
                  <InputNumber
                    min={0.5}
                    max={1}
                    step={0.1}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item
                  name="toxicityThreshold"
                  label="有害内容阈值"
                  tooltip="有害内容检测的敏感度"
                >
                  <InputNumber
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Title level={4}>功能模块</Title>
                
                <Form.Item
                  name={['enabledFeatures', 'qualityAnalysis']}
                  label="内容质量分析"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['enabledFeatures', 'sentimentAnalysis']}
                  label="情感分析"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['enabledFeatures', 'toxicityDetection']}
                  label="有害内容检测"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['enabledFeatures', 'relevanceCheck']}
                  label="相关性检查"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['enabledFeatures', 'readabilityCheck']}
                  label="可读性检查"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Divider />
                
                <Title level={5}>适用内容类型</Title>
                
                <Form.Item
                  name={['contentTypes', 'questionnaire']}
                  label="问卷调查"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['contentTypes', 'story']}
                  label="故事分享"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name={['contentTypes', 'voice']}
                  label="心声留言"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
              >
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 最近分析结果 */}
        <Card title="最近分析结果" extra={<Text type="secondary">实时更新</Text>}>
          <Table
            columns={columns}
            dataSource={analysisResults}
            rowKey="id"
            pagination={false}
            size="small"
          />
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="link">查看更多分析结果</Button>
          </div>
        </Card>

        {/* 性能指标 */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={12}>
            <Card title="效率提升">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>自动处理率</Text>
                  <Progress
                    percent={(stats.autoApproved / stats.totalAnalyzed) * 100}
                    strokeColor="#52c41a"
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </div>
                <div>
                  <Text>准确率</Text>
                  <Progress
                    percent={stats.accuracy}
                    strokeColor="#1890ff"
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </div>
                <div>
                  <Text>时间节省</Text>
                  <Progress
                    percent={75}
                    strokeColor="#722ed1"
                    format={() => `${stats.timesSaved}小时`}
                  />
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="成本效益">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic
                  title="成本节省"
                  value={stats.costSavings}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="平均处理时间"
                  value={2.3}
                  suffix="秒"
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic
                  title="人工审核减少"
                  value={68.5}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

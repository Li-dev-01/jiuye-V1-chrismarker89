/**
 * 智能数据生成器组件
 * 支持基于新分类和标签系统的数据生成
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Form,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Progress,
  Modal,
  message,
  Divider,
  Statistic,
  Tag
} from 'antd';
import {
  DeleteOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  HeartOutlined,
  BookOutlined
} from '@ant-design/icons';
import { dataGeneratorService, type SmartGenerationConfig } from '../../services/dataGeneratorService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { confirm } = Modal;

export const SmartDataGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<any>(null);

  // 心声分类配置
  const voiceCategories = [
    { key: 'gratitude', label: '感谢', description: '对问卷设计、平台功能的感谢', color: '#52c41a' },
    { key: 'suggestion', label: '建议', description: '对问卷改进、功能优化的建议', color: '#1890ff' },
    { key: 'reflection', label: '感悟', description: '填写问卷后的思考和感悟', color: '#722ed1' },
    { key: 'experience', label: '经验', description: '就业相关的经验分享', color: '#fa8c16' },
    { key: 'other', label: '其他', description: '其他想要分享的内容', color: '#8c8c8c' }
  ];

  // 故事分类配置
  const storyCategories = [
    { key: 'job_search', label: '求职经历', description: '求职过程中的经历和感悟', color: '#13c2c2' },
    { key: 'interview', label: '面试经验', description: '面试技巧和经验分享', color: '#eb2f96' },
    { key: 'career_change', label: '转行故事', description: '职业转换的心路历程', color: '#f5222d' },
    { key: 'internship', label: '实习感悟', description: '实习期间的学习和成长', color: '#faad14' },
    { key: 'workplace', label: '职场生活', description: '工作环境和职场体验', color: '#52c41a' },
    { key: 'growth', label: '成长感悟', description: '个人成长和职业发展感悟', color: '#722ed1' },
    { key: 'advice', label: '经验分享', description: '给学弟学妹的建议和经验', color: '#fa8c16' }
  ];

  // 清除现有数据
  const handleClearData = (dataType: 'all' | 'voice' | 'story') => {
    const typeNames = {
      all: '所有数据',
      voice: '心声数据',
      story: '故事数据'
    };

    confirm({
      title: `确认清除${typeNames[dataType]}？`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Alert
            message="警告"
            description={`此操作将永久删除${typeNames[dataType]}，无法恢复！请确认您要继续。`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary">
            清除数据后，您需要重新生成新的数据来测试分类和标签功能。
          </Text>
        </div>
      ),
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        setClearingData(true);
        try {
          const result = await dataGeneratorService.clearExistingData(dataType);
          if (result.success) {
            message.success(result.message);
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error('清除数据失败');
        } finally {
          setClearingData(false);
        }
      }
    });
  };

  // 生成智能心声数据
  const handleGenerateVoices = async (values: any) => {
    setLoading(true);
    try {
      const config: SmartGenerationConfig = {
        type: 'voice',
        count: values.voiceCount,
        quality: values.quality,
        batchSize: values.batchSize,
        options: {
          clearExistingData: values.clearExisting,
          tagStrategy: 'smart',
          diversity: values.diversity / 100,
          realism: values.realism / 100
        },
        voiceConfig: {
          categories: {
            gratitude: values.gratitudePercent || 20,
            suggestion: values.suggestionPercent || 25,
            reflection: values.reflectionPercent || 30,
            experience: values.experiencePercent || 20,
            other: values.otherPercent || 5
          },
          emotionScoreRange: [values.minEmotion || 1, values.maxEmotion || 5]
        }
      };

      const result = await dataGeneratorService.generateSmartVoiceData(config);
      if (result.success) {
        message.success('智能心声数据生成已启动');
        setGenerationProgress(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成智能故事数据
  const handleGenerateStories = async (values: any) => {
    setLoading(true);
    try {
      const config: SmartGenerationConfig = {
        type: 'story',
        count: values.storyCount,
        quality: values.quality,
        batchSize: values.batchSize,
        options: {
          clearExistingData: values.clearExisting,
          tagStrategy: 'smart',
          diversity: values.diversity / 100,
          realism: values.realism / 100
        },
        storyConfig: {
          categories: {
            job_search: values.jobSearchPercent || 25,
            interview: values.interviewPercent || 20,
            career_change: values.careerChangePercent || 15,
            internship: values.internshipPercent || 15,
            workplace: values.workplacePercent || 15,
            growth: values.growthPercent || 5,
            advice: values.advicePercent || 5
          },
          lengthRange: [values.minLength || 200, values.maxLength || 1000]
        }
      };

      const result = await dataGeneratorService.generateSmartStoryData(config);
      if (result.success) {
        message.success('智能故事数据生成已启动');
        setGenerationProgress(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-data-generator">
      <Title level={3}>
        <ThunderboltOutlined /> 智能数据生成器
      </Title>
      
      <Alert
        message="数据重置说明"
        description="由于现有数据缺乏新的分类和标签字段，建议清除现有数据并重新生成，以充分体验新的筛选和排序功能。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 数据清理区域 */}
      <Card title="数据清理" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="心声数据" value="清除并重新生成" />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleClearData('voice')}
                loading={clearingData}
                style={{ marginTop: 8 }}
              >
                清除心声数据
              </Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="故事数据" value="清除并重新生成" />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleClearData('story')}
                loading={clearingData}
                style={{ marginTop: 8 }}
              >
                清除故事数据
              </Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="所有数据" value="完全重置" />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleClearData('all')}
                loading={clearingData}
                style={{ marginTop: 8 }}
              >
                清除所有数据
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 智能生成配置 */}
      <Row gutter={24}>
        {/* 心声数据生成 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <HeartOutlined style={{ color: '#ff4d4f' }} />
                <span>智能心声生成</span>
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerateVoices}
              initialValues={{
                voiceCount: 50,
                quality: 'standard',
                batchSize: 10,
                clearExisting: true,
                diversity: 80,
                realism: 85,
                gratitudePercent: 20,
                suggestionPercent: 25,
                reflectionPercent: 30,
                experiencePercent: 20,
                otherPercent: 5,
                minEmotion: 1,
                maxEmotion: 5
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="voiceCount" label="生成数量">
                    <InputNumber min={10} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quality" label="质量等级">
                    <Select>
                      <Option value="basic">基础</Option>
                      <Option value="standard">标准</Option>
                      <Option value="premium">高级</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="clearExisting" valuePropName="checked">
                <Switch /> 清除现有心声数据
              </Form.Item>

              <Divider>分类分布配置</Divider>
              <Row gutter={8}>
                {voiceCategories.map(cat => (
                  <Col span={12} key={cat.key}>
                    <Form.Item 
                      name={`${cat.key}Percent`} 
                      label={
                        <Space>
                          <Tag color={cat.color}>{cat.label}</Tag>
                        </Space>
                      }
                    >
                      <InputNumber 
                        min={0} 
                        max={100} 
                        formatter={value => `${value}%`}
                        parser={value => value!.replace('%', '')}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<RocketOutlined />}
                  block
                >
                  生成智能心声数据
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 故事数据生成 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <span>智能故事生成</span>
              </Space>
            }
          >
            <Form
              layout="vertical"
              onFinish={handleGenerateStories}
              initialValues={{
                storyCount: 30,
                quality: 'standard',
                batchSize: 5,
                clearExisting: true,
                diversity: 85,
                realism: 90,
                jobSearchPercent: 25,
                interviewPercent: 20,
                careerChangePercent: 15,
                internshipPercent: 15,
                workplacePercent: 15,
                growthPercent: 5,
                advicePercent: 5,
                minLength: 200,
                maxLength: 1000
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="storyCount" label="生成数量">
                    <InputNumber min={5} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quality" label="质量等级">
                    <Select>
                      <Option value="basic">基础</Option>
                      <Option value="standard">标准</Option>
                      <Option value="premium">高级</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="clearExisting" valuePropName="checked">
                <Switch /> 清除现有故事数据
              </Form.Item>

              <Divider>分类分布配置</Divider>
              <Row gutter={8}>
                {storyCategories.slice(0, 4).map(cat => (
                  <Col span={12} key={cat.key}>
                    <Form.Item 
                      name={`${cat.key}Percent`} 
                      label={
                        <Space>
                          <Tag color={cat.color}>{cat.label}</Tag>
                        </Space>
                      }
                    >
                      <InputNumber 
                        min={0} 
                        max={100} 
                        formatter={value => `${value}%`}
                        parser={value => value!.replace('%', '')}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<RocketOutlined />}
                  block
                >
                  生成智能故事数据
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 生成进度 */}
      {generationProgress && (
        <Card title="生成进度" style={{ marginTop: 24 }}>
          <Progress 
            percent={Math.round((generationProgress.completed || 0) / (generationProgress.total || 1) * 100)}
            status={generationProgress.status === 'failed' ? 'exception' : 'active'}
          />
          <Text type="secondary">
            {generationProgress.completed || 0} / {generationProgress.total || 0} 已完成
          </Text>
        </Card>
      )}
    </div>
  );
};

export default SmartDataGenerator;

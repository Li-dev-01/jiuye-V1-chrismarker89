/**
 * QuestionnaireAnalyticsPage - 基于真实问卷数据的独立可视化页面
 * 专门展示问卷调查的统计分析结果
 */

import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Progress, Alert, Statistic,
  Space, Button, Tag, Divider, Spin, Empty
} from 'antd';
import {
  UserOutlined, BookOutlined, DollarOutlined, ExclamationCircleOutlined,
  BarChartOutlined, PieChartOutlined, ReloadOutlined, DownloadOutlined,
  FileTextOutlined, TrophyOutlined
} from '@ant-design/icons';
import { SafeChart } from '../../components/charts/SafeChart';
import styles from './QuestionnaireAnalyticsPage.module.css';

const { Title, Paragraph, Text } = Typography;

interface QuestionnaireData {
  totalResponses: number;
  hasData: boolean;
  educationDistribution: Array<{ label: string; value: number; percentage: number }>;
  majorDistribution: Array<{ label: string; value: number; percentage: number }>;
  employmentStatusDistribution: Array<{ label: string; value: number; percentage: number }>;
  lastUpdated: string;
}

export const QuestionnaireAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionnaireData();
  }, []);

  const loadQuestionnaireData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
      const response = await fetch(`${apiBaseUrl}/api/analytics/real-data`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取问卷数据失败:', error);
      setError(error instanceof Error ? error.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染分布图表
  const renderDistributionChart = (title: string, data: Array<{ label: string; value: number; percentage: number }>, icon: React.ReactNode) => {
    if (!data || data.length === 0) {
      return (
        <Card title={<><span style={{ marginRight: 8 }}>{icon}</span>{title}</>}>
          <Empty description="暂无数据" />
        </Card>
      );
    }

    // 转换为图表数据格式
    const chartData = data.map(item => ({
      name: item.label,
      value: item.value,
      percentage: item.percentage
    }));

    return (
      <Card title={<><span style={{ marginRight: 8 }}>{icon}</span>{title}</>}>
        <SafeChart
          data={chartData}
          title={title}
          chartType="pie"
          height={300}
        />
        <Divider />
        <div style={{ marginTop: 16 }}>
          {data.slice(0, 5).map((item, index) => (
            <div key={item.label} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 8,
              padding: '4px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'default'}>
                  {index + 1}
                </Tag>
                <Text>{item.label}</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text strong>{item.value}人</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {item.percentage}%
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>正在加载问卷数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadQuestionnaireData}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className={styles.header}>
          <Title level={1}>
            <FileTextOutlined /> 问卷数据分析
          </Title>
          <Paragraph>
            基于真实问卷调查的就业现状分析
          </Paragraph>
        </div>

        <Card style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ padding: '40px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
            <Title level={3}>暂无问卷数据</Title>
            <Paragraph>
              还没有用户提交问卷，请等待用户参与或生成测试数据
            </Paragraph>
            <Button type="primary" onClick={loadQuestionnaireData}>
              重新检查数据
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Title level={1} className={styles.title}>
              <FileTextOutlined /> 问卷数据分析
            </Title>
            <Paragraph className={styles.subtitle}>
              基于 {data.totalResponses} 份真实问卷的就业现状分析
            </Paragraph>
          </div>

          <div className={styles.controls}>
            <Space size="middle">
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                真实数据: {data.totalResponses} 份问卷
              </Tag>
              <Button icon={<ReloadOutlined />} onClick={loadQuestionnaireData}>
                刷新数据
              </Button>
              <Button icon={<DownloadOutlined />} type="primary">
                导出数据
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 数据概览统计 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="问卷总数"
              value={data.totalResponses}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="教育水平类型"
              value={data.educationDistribution.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="专业类型"
              value={data.majorDistribution.length}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分布统计图表 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          {renderDistributionChart('教育水平分布', data.educationDistribution, <BookOutlined />)}
        </Col>
        <Col xs={24} lg={8}>
          {renderDistributionChart('专业分布', data.majorDistribution, <UserOutlined />)}
        </Col>
        <Col xs={24} lg={8}>
          {renderDistributionChart('就业状态分布', data.employmentStatusDistribution, <DollarOutlined />)}
        </Col>
      </Row>

      {/* 数据更新时间 */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
        <Text type="secondary">
          数据更新时间: {new Date(data.lastUpdated).toLocaleString('zh-CN')}
        </Text>
      </div>
    </div>
  );
};

export default QuestionnaireAnalyticsPage;

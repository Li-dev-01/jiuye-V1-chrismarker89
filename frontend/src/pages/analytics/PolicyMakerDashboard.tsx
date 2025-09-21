/**
 * PolicyMakerDashboard - 政策制定者仪表板
 * 面向政府决策者，提供宏观就业数据和政策效果评估
 */

import React, { useState } from 'react';
import { 
  Typography, Card, Row, Col, Statistic, Progress, Alert,
  Space, Button, Select, DatePicker, Divider
} from 'antd';
import {
  RiseOutlined, FallOutlined, UserOutlined,
  EnvironmentOutlined, BookOutlined, ExclamationCircleOutlined,
  DownloadOutlined, ReloadOutlined
} from '@ant-design/icons';
import styles from './PolicyMakerDashboard.module.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const PolicyMakerDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('12months');
  const [region, setRegion] = useState('national');

  // 核心KPI数据
  const coreKPIs = {
    employmentRate: { value: 51.2, change: 2.3, trend: 'up' },
    unemploymentRate: { value: 19.9, change: -1.8, trend: 'down' },
    avgJobSearchTime: { value: 4.2, change: 0.3, trend: 'up' },
    policySatisfaction: { value: 67.8, change: 5.2, trend: 'up' }
  };

  // 就业率趋势数据（近12个月）
  const employmentTrends = [
    { month: '2023-06', total: 48.9, undergraduate: 45.2, graduate: 67.8, doctoral: 78.9 },
    { month: '2023-07', total: 49.2, undergraduate: 45.8, graduate: 68.1, doctoral: 79.2 },
    { month: '2023-08', total: 49.8, undergraduate: 46.5, graduate: 68.9, doctoral: 79.8 },
    { month: '2023-09', total: 50.1, undergraduate: 47.1, graduate: 69.2, doctoral: 80.1 },
    { month: '2023-10', total: 50.5, undergraduate: 47.8, graduate: 69.8, doctoral: 80.5 },
    { month: '2023-11', total: 50.8, undergraduate: 48.2, graduate: 70.1, doctoral: 80.8 },
    { month: '2023-12', total: 51.0, undergraduate: 48.6, graduate: 70.5, doctoral: 81.2 },
    { month: '2024-01', total: 50.7, undergraduate: 48.1, graduate: 70.2, doctoral: 80.9 },
    { month: '2024-02', total: 50.9, undergraduate: 48.4, graduate: 70.6, doctoral: 81.1 },
    { month: '2024-03', total: 51.1, undergraduate: 48.7, graduate: 70.9, doctoral: 81.4 },
    { month: '2024-04', total: 51.0, undergraduate: 48.5, graduate: 70.7, doctoral: 81.2 },
    { month: '2024-05', total: 51.2, undergraduate: 48.8, graduate: 71.1, doctoral: 81.6 }
  ];

  // 失业原因分析（政策干预重点）
  const unemploymentReasons = [
    { reason: '市场竞争激烈，岗位供不应求', count: 1234, percentage: 43.4, policyRelevance: 'high' },
    { reason: '专业与岗位需求不匹配', count: 987, percentage: 34.7, policyRelevance: 'high' },
    { reason: '缺乏相关工作经验', count: 876, percentage: 30.8, policyRelevance: 'medium' },
    { reason: '专业技能不够扎实', count: 654, percentage: 23.0, policyRelevance: 'high' },
    { reason: '地域选择限制了就业机会', count: 543, percentage: 19.1, policyRelevance: 'medium' },
    { reason: '薪资期望与市场不符', count: 432, percentage: 15.2, policyRelevance: 'low' },
    { reason: '求职焦虑和心理压力大', count: 321, percentage: 11.3, policyRelevance: 'medium' }
  ];

  // 地区就业数据
  const regionalData = [
    { region: '北京', employmentRate: 68.9, population: 156789, policyScore: 85 },
    { region: '上海', employmentRate: 67.2, population: 134567, policyScore: 83 },
    { region: '深圳', employmentRate: 65.8, population: 98765, policyScore: 81 },
    { region: '广州', employmentRate: 62.4, population: 87654, policyScore: 78 },
    { region: '杭州', employmentRate: 59.7, population: 76543, policyScore: 76 },
    { region: '成都', employmentRate: 54.3, population: 65432, policyScore: 72 },
    { region: '武汉', employmentRate: 52.1, population: 54321, policyScore: 70 },
    { region: '西安', employmentRate: 48.9, population: 43210, policyScore: 68 }
  ];

  // 学历就业对比
  const educationComparison = [
    { 
      education: '博士研究生', 
      employmentRate: 81.6, 
      avgSalary: 15800, 
      satisfaction: 78.9,
      policyPriority: 'low'
    },
    { 
      education: '硕士研究生', 
      employmentRate: 71.1, 
      avgSalary: 11200, 
      satisfaction: 72.3,
      policyPriority: 'medium'
    },
    { 
      education: '本科', 
      employmentRate: 48.8, 
      avgSalary: 7800, 
      satisfaction: 65.7,
      policyPriority: 'high'
    },
    { 
      education: '大专', 
      employmentRate: 42.3, 
      avgSalary: 5600, 
      satisfaction: 58.9,
      policyPriority: 'high'
    }
  ];

  const renderKPICard = (title: string, data: any, icon: any, color: string) => (
    <Card className={styles.kpiCard}>
      <Statistic
        title={title}
        value={data.value}
        suffix={title.includes('时长') ? '个月' : '%'}
        prefix={icon}
        valueStyle={{ color }}
      />
      <div className={styles.kpiTrend}>
        {data.trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
        <Text type={data.trend === 'up' ? 'success' : 'danger'}>
          {data.change > 0 ? '+' : ''}{data.change}%
        </Text>
        <Text type="secondary">较上月</Text>
      </div>
    </Card>
  );

  const renderUnemploymentReasons = () => (
    <Card title="失业原因分析 - 政策干预重点" className={styles.analysisCard}>
      <div className={styles.reasonsList}>
        {unemploymentReasons.map((item, index) => (
          <div key={index} className={styles.reasonItem}>
            <div className={styles.reasonHeader}>
              <Text strong>{item.reason}</Text>
              <Space>
                <Text type="secondary">{item.count}人</Text>
                <Text 
                  className={`${styles.policyTag} ${styles[item.policyRelevance]}`}
                >
                  {item.policyRelevance === 'high' ? '高优先级' : 
                   item.policyRelevance === 'medium' ? '中优先级' : '低优先级'}
                </Text>
              </Space>
            </div>
            <Progress 
              percent={item.percentage} 
              strokeColor={
                item.policyRelevance === 'high' ? '#ff4d4f' :
                item.policyRelevance === 'medium' ? '#faad14' : '#52c41a'
              }
              format={(percent) => `${percent}%`}
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderRegionalData = () => (
    <Card title="地区就业热力分析" className={styles.analysisCard}>
      <div className={styles.regionalGrid}>
        {regionalData.map((item, index) => (
          <div key={index} className={styles.regionalItem}>
            <div className={styles.regionalHeader}>
              <Text strong>{item.region}</Text>
              <Text type="secondary">{item.population.toLocaleString()}人</Text>
            </div>
            <div className={styles.regionalMetrics}>
              <div className={styles.metric}>
                <Text type="secondary">就业率</Text>
                <Text strong style={{ color: '#1890ff' }}>{item.employmentRate}%</Text>
              </div>
              <div className={styles.metric}>
                <Text type="secondary">政策评分</Text>
                <Text strong style={{ color: '#52c41a' }}>{item.policyScore}分</Text>
              </div>
            </div>
            <Progress 
              percent={item.employmentRate} 
              strokeColor="#1890ff"
              size="small"
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderEducationComparison = () => (
    <Card title="学历就业对比 - 教育政策参考" className={styles.analysisCard}>
      <div className={styles.educationGrid}>
        {educationComparison.map((item, index) => (
          <div key={index} className={styles.educationItem}>
            <div className={styles.educationHeader}>
              <Text strong>{item.education}</Text>
              <Text 
                className={`${styles.priorityTag} ${styles[item.policyPriority]}`}
              >
                {item.policyPriority === 'high' ? '重点关注' : 
                 item.policyPriority === 'medium' ? '适度关注' : '维持现状'}
              </Text>
            </div>
            <div className={styles.educationMetrics}>
              <div className={styles.metricRow}>
                <Text type="secondary">就业率:</Text>
                <Text strong>{item.employmentRate}%</Text>
              </div>
              <div className={styles.metricRow}>
                <Text type="secondary">平均薪资:</Text>
                <Text strong>¥{item.avgSalary}</Text>
              </div>
              <div className={styles.metricRow}>
                <Text type="secondary">满意度:</Text>
                <Text strong>{item.satisfaction}%</Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Title level={1} className={styles.title}>
              政策制定者仪表板
            </Title>
            <Paragraph className={styles.subtitle}>
              基于{employmentTrends.length * 237}份问卷数据的宏观就业分析，为政策制定提供数据支撑
            </Paragraph>
          </div>
          
          <div className={styles.controls}>
            <Space size="middle">
              <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
                <Option value="6months">近6个月</Option>
                <Option value="12months">近12个月</Option>
                <Option value="24months">近24个月</Option>
              </Select>
              <Select value={region} onChange={setRegion} style={{ width: 120 }}>
                <Option value="national">全国</Option>
                <Option value="eastern">东部地区</Option>
                <Option value="central">中部地区</Option>
                <Option value="western">西部地区</Option>
              </Select>
              <Button icon={<ReloadOutlined />}>刷新</Button>
              <Button icon={<DownloadOutlined />} type="primary">政策报告</Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 核心KPI */}
      <div className={styles.kpiSection}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            {renderKPICard('整体就业率', coreKPIs.employmentRate, <UserOutlined />, '#1890ff')}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderKPICard('失业率', coreKPIs.unemploymentRate, <ExclamationCircleOutlined />, '#f5222d')}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderKPICard('平均求职时长', coreKPIs.avgJobSearchTime, <BookOutlined />, '#faad14')}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderKPICard('政策满意度', coreKPIs.policySatisfaction, <RiseOutlined />, '#52c41a')}
          </Col>
        </Row>
      </div>

      {/* 政策重点分析 */}
      <div className={styles.analysisSection}>
        <Alert
          message="政策制定建议"
          description="基于数据分析，建议重点关注：1) 加强职业技能培训，解决技能不匹配问题；2) 优化产业布局，增加就业岗位供给；3) 完善就业服务体系，提高匹配效率。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            {renderUnemploymentReasons()}
          </Col>
          <Col xs={24} lg={12}>
            {renderRegionalData()}
          </Col>
          <Col xs={24}>
            {renderEducationComparison()}
          </Col>
        </Row>
      </div>
    </div>
  );
};

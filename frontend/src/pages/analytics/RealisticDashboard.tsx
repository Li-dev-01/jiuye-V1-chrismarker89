/**
 * RealisticDashboard - 基于真实问卷数据的仪表板
 * 只展示问卷中实际存在的数据维度，避免过度理想化
 */

import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Progress, Alert, Statistic,
  Space, Button, Select, Tag, Divider, Spin
} from 'antd';
import {
  UserOutlined, BookOutlined, DollarOutlined, ExclamationCircleOutlined,
  BarChartOutlined, PieChartOutlined, ReloadOutlined, DownloadOutlined
} from '@ant-design/icons';
// 直接定义数据类型和模拟数据
interface AnalyticsData {
  totalResponses: number;
  lastUpdated: string;
  educationDistribution: Array<{ label: string; value: number; percentage: number }>;
  majorDistribution: Array<{ label: string; value: number; percentage: number }>;
  employmentStatusDistribution: Array<{ label: string; value: number; percentage: number }>;
  salaryDistribution: Array<{ label: string; value: number; percentage: number }>;
  industryDistribution: Array<{ label: string; value: number; percentage: number }>;
  employmentByEducation: Array<{
    education: string;
    employed: number;
    unemployed: number;
    total: number;
    employmentRate: number;
  }>;
  employmentByGender: Array<{
    gender: string;
    employed: number;
    unemployed: number;
    total: number;
    employmentRate: number;
    avgSatisfaction: number;
  }>;
  universityTypeAnalysis: Array<{
    universityType: string;
    totalStudents: number;
    employmentRate: number;
    topSalaryRange: string;
    avgSatisfaction: number;
    topIndustries: string[];
  }>;
  jobDifficulties: Array<{
    difficulty: string;
    count: number;
    percentage: number;
  }>;
}
import styles from './RealisticDashboard.module.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export const RealisticDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [realDataCount, setRealDataCount] = useState(0);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);

    try {
      // 调用真实数据API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
      const response = await fetch(`${apiBaseUrl}/api/analytics/real-data`);

      if (!response.ok) {
        throw new Error('Failed to fetch real data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // 确保数据结构完整，填充缺失的字段
        const completeData = {
          totalResponses: result.data.totalResponses || 0,
          lastUpdated: result.data.lastUpdated || new Date().toISOString(),
          educationDistribution: result.data.educationDistribution || [],
          majorDistribution: result.data.majorDistribution || [],
          employmentStatusDistribution: result.data.employmentStatusDistribution || [],
          salaryDistribution: result.data.salaryDistribution || [],
          industryDistribution: result.data.industryDistribution || [],
          employmentByEducation: result.data.employmentByEducation || [],
          employmentByGender: result.data.employmentByGender || [],
          universityTypeAnalysis: result.data.universityTypeAnalysis || [],
          jobDifficulties: result.data.jobDifficulties || []
        };
        setData(completeData);
        setRealDataCount(completeData.totalResponses);
      } else {
        // 如果没有真实数据，显示空状态
        setData({
          totalResponses: 0,
          lastUpdated: new Date().toISOString(),
          educationDistribution: [],
          majorDistribution: [],
          employmentStatusDistribution: [],
          salaryDistribution: [],
          industryDistribution: [],
          employmentByEducation: [],
          employmentByGender: [],
          universityTypeAnalysis: [],
          jobDifficulties: []
        });
        setRealDataCount(0);
      }
    } catch (error) {
      console.error('生成数据失败:', error);
      setData(null);
      setRealDataCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getEmploymentRate = () => {
    if (!data || !data.employmentStatusDistribution) return 0;
    // 查找就业相关的状态
    const employedItem = data.employmentStatusDistribution.find(item =>
      item.label === '已就业' ||
      item.label === 'employed' ||
      item.label === '全职工作' ||
      item.label === '实习'
    );
    return employedItem ? employedItem.percentage : 0;
  };

  const getUnemploymentRate = () => {
    if (!data || !data.employmentStatusDistribution) return 0;
    // 查找求职相关的状态
    const unemployedItem = data.employmentStatusDistribution.find(item =>
      item.label === '待就业' ||
      item.label === 'seeking' ||
      item.label === '求职中'
    );
    return unemployedItem ? unemployedItem.percentage : 0;
  };

  const getTopSalaryRange = () => {
    if (!data || !data.salaryDistribution || data.salaryDistribution.length === 0) return '暂无数据';
    const topSalary = data.salaryDistribution
      .sort((a, b) => b.value - a.value)[0];
    return topSalary?.label || '暂无数据';
  };

  const getTopIndustry = () => {
    if (!data || !data.industryDistribution || data.industryDistribution.length === 0) return '暂无数据';
    const topIndustry = data.industryDistribution
      .sort((a, b) => b.value - a.value)[0];
    return topIndustry?.label || '暂无数据';
  };

  const renderBasicStats = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} md={6}>
        <Card className={styles.statCard}>
          <Statistic
            title="样本总数"
            value={data?.totalResponses || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={styles.statCard}>
          <Statistic
            title="就业率"
            value={getEmploymentRate()}
            suffix="%"
            prefix={<BookOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={styles.statCard}>
          <Statistic
            title="失业率"
            value={getUnemploymentRate()}
            suffix="%"
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card className={styles.statCard}>
          <Statistic
            title="主要薪资区间"
            value={getTopSalaryRange()}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderDistributionChart = (
    title: string, 
    data: Array<{ label: string; value: number; percentage: number }>,
    icon: React.ReactNode
  ) => (
    <Card title={
      <Space>
        {icon}
        {title}
      </Space>
    } className={styles.chartCard}>
      <div className={styles.distributionList}>
        {data.slice(0, 8).map((item, index) => (
          <div key={index} className={styles.distributionItem}>
            <div className={styles.itemHeader}>
              <Text strong>{item.label}</Text>
              <Space>
                <Text type="secondary">{item.value}人</Text>
                <Text strong style={{ color: '#1890ff' }}>{item.percentage}%</Text>
              </Space>
            </div>
            <Progress 
              percent={item.percentage} 
              strokeColor={`hsl(${200 + index * 20}, 70%, 50%)`}
              size="small"
              showInfo={false}
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderEmploymentByEducation = () => {
    if (!data) return null;
    
    return (
      <Card title="不同学历就业状况对比" className={styles.chartCard}>
        <div className={styles.comparisonList}>
          {data.employmentByEducation.map((item, index) => (
            <div key={index} className={styles.comparisonItem}>
              <div className={styles.comparisonHeader}>
                <Text strong>{item.education}</Text>
                <Space>
                  <Text type="secondary">样本: {item.total}人</Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    就业率: {item.employmentRate}%
                  </Text>
                </Space>
              </div>
              <div className={styles.comparisonBars}>
                <div className={styles.barRow}>
                  <Text type="secondary">已就业: {item.employed}人</Text>
                  <Progress 
                    percent={(item.employed / item.total) * 100} 
                    strokeColor="#52c41a"
                    size="small"
                    format={() => `${item.employed}人`}
                  />
                </div>
                <div className={styles.barRow}>
                  <Text type="secondary">失业: {item.unemployed}人</Text>
                  <Progress 
                    percent={(item.unemployed / item.total) * 100} 
                    strokeColor="#ff4d4f"
                    size="small"
                    format={() => `${item.unemployed}人`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderJobDifficulties = () => {
    if (!data) return null;

    return (
      <Card title="求职主要困难分析" className={styles.chartCard}>
        <div className={styles.difficultiesList}>
          {data.jobDifficulties.slice(0, 6).map((item, index) => (
            <div key={index} className={styles.difficultyItem}>
              <div className={styles.difficultyHeader}>
                <Text strong>{item.difficulty}</Text>
                <Space>
                  <Text type="secondary">{item.count}次提及</Text>
                  <Text strong style={{ color: '#ff4d4f' }}>{item.percentage}%</Text>
                </Space>
              </div>
              <Progress
                percent={item.percentage}
                strokeColor="#ff4d4f"
                size="small"
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderGenderAnalysis = () => {
    if (!data) return null;

    return (
      <Card title="性别就业状况分析" className={styles.chartCard}>
        <div className={styles.genderList}>
          {data.employmentByGender.map((item, index) => (
            <div key={index} className={styles.genderItem}>
              <div className={styles.genderHeader}>
                <Text strong>{item.gender === 'male' ? '男性' : item.gender === 'female' ? '女性' : '其他'}</Text>
                <Space>
                  <Text type="secondary">样本: {item.total}人</Text>
                  <Text strong style={{ color: '#1890ff' }}>
                    就业率: {item.employmentRate}%
                  </Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    满意度: {item.avgSatisfaction}/5
                  </Text>
                </Space>
              </div>
              <Progress
                percent={item.employmentRate}
                strokeColor={item.gender === 'male' ? '#1890ff' : '#ff85c0'}
                size="small"
                format={(percent) => `${item.employed}/${item.total}人`}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderUniversityAnalysis = () => {
    if (!data) return null;

    return (
      <Card title="院校类型详细分析" className={styles.chartCard}>
        <div className={styles.universityList}>
          {data.universityTypeAnalysis.map((item, index) => (
            <div key={index} className={styles.universityItem}>
              <div className={styles.universityHeader}>
                <Text strong>{item.universityType}</Text>
                <Space>
                  <Text type="secondary">{item.totalStudents}人</Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    就业率: {item.employmentRate}%
                  </Text>
                </Space>
              </div>
              <div className={styles.universityDetails}>
                <Text type="secondary">主要薪资: {item.topSalaryRange}</Text>
                <Text type="secondary">满意度: {item.avgSatisfaction}/5</Text>
                <Text type="secondary">热门行业: {item.topIndustries.join(', ')}</Text>
              </div>
              <Progress
                percent={item.employmentRate}
                strokeColor={`hsl(${120 + index * 30}, 70%, 50%)`}
                size="small"
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>正在分析问卷数据...</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>正在分析问卷数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Title level={1} className={styles.title}>
              真实问卷数据分析
            </Title>
            <Paragraph className={styles.subtitle}>
              基于{realDataCount}份真实问卷的就业现状分析
            </Paragraph>
          </div>

          <div className={styles.controls}>
            <Space size="middle">
              <Text>
                真实数据: {realDataCount} 份问卷
              </Text>
              <Button icon={<ReloadOutlined />} onClick={loadRealData}>
                刷新数据
              </Button>
              {realDataCount > 0 && (
                <Button icon={<DownloadOutlined />} type="primary">
                  导出数据
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className={styles.contentSection}>
        <Alert
          message="数据开放说明"
          description="基于匿名问卷数据，无隐私风险。展示完整统计分析，包括详细交叉分析和精确数据。所有数据均可公开使用和引用。"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        {/* 基础统计 */}
        <div className={styles.statsSection}>
          {renderBasicStats()}
        </div>
        
        {/* 数据概览 */}
        {realDataCount === 0 ? (
          <Card style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ padding: '40px' }}>
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={3}>暂无问卷数据</Title>
              <Paragraph>
                还没有用户提交问卷，请等待用户参与或生成测试数据
              </Paragraph>
              <Button type="primary" onClick={loadRealData}>
                重新检查数据
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* 分布统计图表 */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                {renderDistributionChart('教育水平分布', data.educationDistribution, <BookOutlined />)}
              </Col>
              <Col xs={24} lg={12}>
                {renderDistributionChart('专业分布', data.majorDistribution, <UserOutlined />)}
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                {renderDistributionChart('就业状态分布', data.employmentStatusDistribution, <BarChartOutlined />)}
              </Col>
              <Col xs={24} lg={12}>
                {renderDistributionChart('薪资分布', data.salaryDistribution, <DollarOutlined />)}
              </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                {renderDistributionChart('行业分布', data.industryDistribution, <PieChartOutlined />)}
              </Col>
              <Col xs={24} lg={12}>
                {renderJobDifficulties()}
              </Col>
            </Row>

            {/* 交叉分析 */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                {renderEmploymentByEducation()}
              </Col>
              <Col xs={24} lg={12}>
                {renderGenderAnalysis()}
              </Col>
            </Row>

            {/* 院校类型分析 */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col span={24}>
                <Card title="院校类型就业分析" className={styles.chartCard}>
                  <Row gutter={[16, 16]}>
                    {data.universityTypeAnalysis.map((item, index) => (
                      <Col xs={24} sm={12} lg={8} key={index}>
                        <Card size="small" style={{ height: '100%' }}>
                          <Statistic
                            title={item.universityType}
                            value={item.employmentRate}
                            suffix="%"
                            valueStyle={{ color: '#1890ff' }}
                          />
                          <div style={{ marginTop: 12 }}>
                            <Text type="secondary">样本: {item.totalStudents}人</Text><br />
                            <Text type="secondary">热门薪资: {item.topSalaryRange}</Text><br />
                            <Text type="secondary">满意度: {item.avgSatisfaction}/10</Text><br />
                            <Text type="secondary">热门行业: {item.topIndustries.join(', ')}</Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

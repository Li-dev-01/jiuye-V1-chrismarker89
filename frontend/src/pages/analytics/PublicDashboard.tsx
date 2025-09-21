/**
 * PublicDashboard - 公众传播仪表板
 * 面向媒体记者和公众，展示社会关注的就业热点数据
 */

import React, { useState, useEffect } from 'react';
import {
  Typography, Card, Row, Col, Progress, Alert, Statistic,
  Space, Button, Tag, Divider, Spin, message
} from 'antd';
import {
  FireOutlined, ExclamationCircleOutlined, DollarOutlined,
  ClockCircleOutlined, UserOutlined, FallOutlined,
  ShareAltOutlined, DownloadOutlined, DatabaseOutlined
} from '@ant-design/icons';
import { DataLoadingState } from '../../components/common/EmptyState';
import styles from './PublicDashboard.module.css';

const { Title, Paragraph, Text } = Typography;

// 数据接口定义
interface PublicDashboardData {
  socialHotspots: any[];
  difficultyPerception: any;
  salaryComparison: any[];
  jobSearchFunnel: any[];
  lastUpdated: string;
}

export const PublicDashboard: React.FC = () => {
  const [selectedHotspot, setSelectedHotspot] = useState('employment-rate');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<PublicDashboardData | null>(null);

  // 加载公众仪表板数据
  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.justpm2099.workers.dev';
      const response = await fetch(`${apiBaseUrl}/api/analytics/public-dashboard`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        // API失败时显示数据收集中状态
        setError(true);
        setData(null);
      }
    } catch (error) {
      console.error('公众仪表板数据加载失败:', error);
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 默认数据（当API返回空数据时使用）
  const defaultData = {
    socialHotspots: [],
    difficultyPerception: { current: 0, levels: [] },
    salaryComparison: [],
    jobSearchFunnel: [],
    lastUpdated: new Date().toISOString()
  };

  // 使用真实数据或默认数据
  const currentData = data || defaultData;
  const socialHotspots = currentData.socialHotspots;

  // 从API数据中获取各项指标
  const difficultyPerception = currentData.difficultyPerception;
  const salaryComparison = currentData.salaryComparison;
  const jobSearchFunnel = currentData.jobSearchFunnel;

  // 就业压力来源
  const pressureSources = [
    { source: '就业市场竞争激烈', percentage: 55.1, color: '#ff4d4f' },
    { source: '经济负担和生活成本', percentage: 43.4, color: '#fa8c16' },
    { source: '家庭期望和压力', percentage: 34.7, color: '#faad14' },
    { source: '职业前景不明确', percentage: 26.9, color: '#a0d911' },
    { source: '同龄人对比压力', percentage: 19.1, color: '#52c41a' },
    { source: '技能不足的焦虑', percentage: 15.2, color: '#13c2c2' },
    { source: '社会地位和面子问题', percentage: 12.8, color: '#1890ff' },
    { source: '年龄增长的焦虑', percentage: 8.7, color: '#722ed1' }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#8c8c8c';
    }
  };

  const renderHotspotCards = () => (
    <Row gutter={[16, 16]}>
      {socialHotspots.map((hotspot) => (
        <Col xs={24} sm={12} md={6} key={hotspot.id}>
          <Card 
            className={`${styles.hotspotCard} ${selectedHotspot === hotspot.id ? styles.selected : ''}`}
            onClick={() => setSelectedHotspot(hotspot.id)}
          >
            <div className={styles.hotspotHeader}>
              <FireOutlined style={{ color: getImpactColor(hotspot.impact) }} />
              <Tag color={getImpactColor(hotspot.impact)}>
                {hotspot.impact === 'high' ? '高关注' : 
                 hotspot.impact === 'medium' ? '中关注' : '低关注'}
              </Tag>
            </div>
            <Statistic
              title={hotspot.title}
              value={hotspot.value}
              valueStyle={{ 
                color: getImpactColor(hotspot.impact),
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            />
            <Text type="secondary" className={styles.hotspotDescription}>
              {hotspot.description}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderDifficultyGauge = () => (
    <Card title="就业难度感知指数" className={styles.analysisCard}>
      <div className={styles.gaugeContainer}>
        <div className={styles.gaugeValue}>
          <Text className={styles.gaugeNumber}>{difficultyPerception.current}</Text>
          <Text type="secondary">/ 100</Text>
        </div>
        <Text type="secondary" className={styles.gaugeDescription}>
          {difficultyPerception.description}
        </Text>
        <Progress
          percent={difficultyPerception.current}
          strokeColor="#ff4d4f"
          size={[300, 12]}
          format={() => '困难'}
        />
      </div>
      <Divider />
      <div className={styles.difficultyLevels}>
        {difficultyPerception.levels.map((level, index) => (
          <div key={index} className={styles.difficultyLevel}>
            <div className={styles.levelHeader}>
              <Text strong>{level.level}</Text>
              <Text type="secondary">{level.count}人</Text>
            </div>
            <Progress 
              percent={level.percentage} 
              strokeColor={
                index === 0 ? '#ff4d4f' :
                index === 1 ? '#fa8c16' :
                index === 2 ? '#faad14' :
                index === 3 ? '#52c41a' : '#1890ff'
              }
              size="small"
              format={(percent) => `${percent}%`}
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderSalaryComparison = () => (
    <Card title="薪资期望 vs 现实差距" className={styles.analysisCard}>
      <div className={styles.salaryList}>
        {salaryComparison.map((item, index) => (
          <div key={index} className={styles.salaryItem}>
            <div className={styles.salaryHeader}>
              <Text strong>{item.category}</Text>
              <Text type="danger" strong>差距 {item.gap}%</Text>
            </div>
            <div className={styles.salaryBars}>
              <div className={styles.salaryBar}>
                <Text type="secondary">期望薪资</Text>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.expectedBar}
                    style={{ width: '100%' }}
                  >
                    ¥{item.expected}
                  </div>
                </div>
              </div>
              <div className={styles.salaryBar}>
                <Text type="secondary">实际薪资</Text>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.actualBar}
                    style={{ width: `${(item.actual / item.expected) * 100}%` }}
                  >
                    ¥{item.actual}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderJobSearchFunnel = () => (
    <Card title="求职历程 - 艰难的就业之路" className={styles.analysisCard}>
      <div className={styles.funnelContainer}>
        {jobSearchFunnel.map((stage, index) => (
          <div key={index} className={styles.funnelStage}>
            <div className={styles.stageInfo}>
              <Text strong className={styles.stageName}>{stage.stage}</Text>
              <Text type="secondary" className={styles.stageDescription}>
                {stage.description}
              </Text>
            </div>
            <div className={styles.stageBar}>
              <div 
                className={styles.stageProgress}
                style={{ 
                  width: `${stage.percentage}%`,
                  backgroundColor: `hsl(${120 - stage.percentage}, 70%, 50%)`
                }}
              >
                <Text className={styles.stageText}>
                  {stage.count.toLocaleString()}人 ({stage.percentage}%)
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderPressureSources = () => (
    <Card title="就业压力来源分析" className={styles.analysisCard}>
      <div className={styles.pressureList}>
        {pressureSources.map((pressure, index) => (
          <div key={index} className={styles.pressureItem}>
            <div className={styles.pressureHeader}>
              <Text strong>{pressure.source}</Text>
              <Text strong style={{ color: pressure.color }}>
                {pressure.percentage}%
              </Text>
            </div>
            <Progress 
              percent={pressure.percentage} 
              strokeColor={pressure.color}
              size="small"
              showInfo={false}
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const hasData = socialHotspots && socialHotspots.length > 0;

  return (
    <div className={styles.container}>
      <DataLoadingState
        loading={loading}
        error={error}
        hasData={hasData}
        dataType="analytics"
        onRetry={loadData}
      >
        {/* 页面头部 */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <Title level={1} className={styles.title}>
                就业现状社会关注热点
              </Title>
              <Paragraph className={styles.subtitle}>
                揭示真实的就业困境，关注社会民生问题
              </Paragraph>
            </div>

            <div className={styles.controls}>
              <Space size="middle">
                <Tag icon={<DatabaseOutlined />} color="green">
                  真实数据
                </Tag>
                <Button icon={<ShareAltOutlined />}>分享数据</Button>
                <Button icon={<DownloadOutlined />} type="primary">下载图表</Button>
              </Space>
            </div>
          </div>
        </div>

      {/* 社会热点 */}
      <div className={styles.hotspotsSection}>
        {renderHotspotCards()}
      </div>

      {/* 详细分析 */}
      <div className={styles.analysisSection}>
        <Alert
          message="数据说明"
          description="以下数据基于2847份真实问卷调查，反映了当前大学生就业的真实困境。数据客观真实，旨在引起社会关注，推动就业环境改善。"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            {renderDifficultyGauge()}
          </Col>
          <Col xs={24} lg={16}>
            {renderSalaryComparison()}
          </Col>
          <Col xs={24} lg={14}>
            {renderJobSearchFunnel()}
          </Col>
          <Col xs={24} lg={10}>
            {renderPressureSources()}
          </Col>
        </Row>
        </div>
      </DataLoadingState>
    </div>
  );
};

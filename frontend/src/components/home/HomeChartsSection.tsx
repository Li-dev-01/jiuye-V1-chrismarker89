/**
 * 首页图表展示组件
 * 用可视化图表替代传统的数字统计，提供更强的视觉冲击力
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Spin, Card } from 'antd';
import { questionnaireVisualizationService } from '../../services/questionnaireVisualizationService';
import { UniversalChart } from '../charts/UniversalChart';
import styles from './HomeChartsSection.module.css';

const { Title, Text } = Typography;

interface HomeChartsSectionProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const HomeChartsSection: React.FC<HomeChartsSectionProps> = ({
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 默认5分钟
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatusData, setCurrentStatusData] = useState<any[]>([]);
  const [difficultyData, setDifficultyData] = useState<any[]>([]);

  // 加载图表数据
  const loadChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取就业形势总览数据
      const dimensionData = await questionnaireVisualizationService.getDimensionData('employment-overview');
      
      if (dimensionData && dimensionData.charts) {
        // 查找当前身份状态分布数据
        const statusChart = dimensionData.charts.find(chart => 
          chart.questionId === 'current-status'
        );
        if (statusChart) {
          setCurrentStatusData(statusChart.data);
        }

        // 查找就业难度感知数据
        const difficultyChart = dimensionData.charts.find(chart => 
          chart.questionId === 'employment-difficulty-perception'
        );
        if (difficultyChart) {
          setDifficultyData(difficultyChart.data);
        }
      }
    } catch (error) {
      console.error('加载首页图表数据失败:', error);
      setError(error instanceof Error ? error.message : '加载图表数据失败');
      
      // 使用模拟数据作为后备
      setCurrentStatusData([
        { label: '全职工作', value: 45, percentage: 45.2, color: '#52C41A' },
        { label: '在校学生', value: 28, percentage: 28.1, color: '#1890FF' },
        { label: '求职中', value: 15, percentage: 15.3, color: '#FA8C16' },
        { label: '实习中', value: 8, percentage: 8.1, color: '#722ED1' },
        { label: '自由职业', value: 4, percentage: 3.3, color: '#13C2C2' }
      ]);
      
      setDifficultyData([
        { label: '比较困难', value: 35, percentage: 35.2, color: '#FA8C16' },
        { label: '一般', value: 32, percentage: 32.6, color: '#FADB14' },
        { label: '非常困难', value: 18, percentage: 18.1, color: '#FF4D4F' },
        { label: '比较容易', value: 12, percentage: 12.3, color: '#73D13D' },
        { label: '非常容易', value: 3, percentage: 2.8, color: '#52C41A' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadChartData();
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadChartData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 加载状态
  if (loading) {
    return (
      <div className={styles.chartsSection}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text type="secondary" className={styles.loadingText}>
            加载数据可视化...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartsSection}>
      <div className={styles.chartsContainer}>
        <div className={styles.chartsHeader}>
          <Title level={3} className={styles.chartsTitle}>
            📊 实时数据洞察
          </Title>
          <Text className={styles.chartsSubtitle}>
            通过数据可视化，直观了解当前就业形势和市场感知
          </Text>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className={styles.errorBanner}>
            <Text type="warning" className={styles.errorText}>
              ⚠️ 使用模拟数据展示: {error}
            </Text>
          </div>
        )}

        <Row gutter={[32, 24]} className={styles.chartsGrid}>
          {/* 当前身份状态分布 */}
          <Col xs={24} md={12}>
            <Card className={styles.chartCard} hoverable>
              <div className={styles.chartHeader}>
                <Title level={4} className={styles.chartTitle}>
                  🎓 当前身份状态分布
                </Title>
                <Text type="secondary" className={styles.chartDescription}>
                  了解参与者的身份构成和就业状况
                </Text>
              </div>
              <div className={styles.chartWrapper}>
                <UniversalChart
                  type="donut"
                  data={currentStatusData}
                  height={280}
                  showLegend={true}
                  showTooltip={true}
                />
              </div>
              <div className={styles.chartInsight}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 <strong>关键洞察：</strong>
                  {currentStatusData.length > 0 && 
                    `${currentStatusData[0]?.label}占比最高(${currentStatusData[0]?.percentage}%)，反映当前就业市场的主要构成`
                  }
                </Text>
              </div>
            </Card>
          </Col>

          {/* 就业难度感知 */}
          <Col xs={24} md={12}>
            <Card className={styles.chartCard} hoverable>
              <div className={styles.chartHeader}>
                <Title level={4} className={styles.chartTitle}>
                  📈 就业难度感知
                </Title>
                <Text type="secondary" className={styles.chartDescription}>
                  反映社会对当前就业环境的整体感知
                </Text>
              </div>
              <div className={styles.chartWrapper}>
                <UniversalChart
                  type="bar"
                  data={difficultyData}
                  height={280}
                  showLegend={false}
                  showTooltip={true}
                />
              </div>
              <div className={styles.chartInsight}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 <strong>关键洞察：</strong>
                  {difficultyData.length > 0 && 
                    `${difficultyData[0]?.percentage + difficultyData[1]?.percentage || 0}%的受访者认为就业有一定难度，反映当前就业市场竞争状况`
                  }
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 数据说明 */}
        <div className={styles.dataNote}>
          <Text type="secondary" className={styles.noteText}>
            📊 数据每5分钟自动更新 | 基于真实问卷调查结果 | 
            {error ? '当前显示模拟数据' : '实时数据展示'}
          </Text>
        </div>
      </div>
    </div>
  );
};

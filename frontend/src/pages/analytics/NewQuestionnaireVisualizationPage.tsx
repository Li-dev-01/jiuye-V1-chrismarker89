/**
 * 新问卷可视化页面
 * 基于真实问卷数据的6维度可视化系统
 */

import React, { useState, useEffect } from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { 
  Card, 
  Typography, 
  Tabs, 
  Row, 
  Col, 
  Statistic, 
  Space, 
  Button, 
  Tag, 
  Spin,
  Alert,
  Tooltip,
  Progress,
  Divider
} from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DotChartOutlined,
  FundOutlined,
  TeamOutlined,
  BankOutlined,
  BookOutlined,
  HomeOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

import {
  VISUALIZATION_DIMENSIONS,
  type VisualizationDimension
} from '../../config/questionnaireVisualizationMapping';
import {
  questionnaireVisualizationService,
  type VisualizationSummary,
  type DimensionData
} from '../../services/questionnaireVisualizationService';
import { getDataSourceStatus } from '../../config/dataSourceConfig';
import { UNIFIED_DIMENSION_MAPPING } from '../../config/unifiedDataMapping';
import { dataIntegrityValidator, dataQualityMonitor, quickValidateApiData } from '../../utils/dataIntegrityValidator';
import { getCompatibilityReport, getSupportedDimensionIds } from '../../services/dimensionCompatibilityAdapter';
import DataSourceSwitcher from '../../components/dev/DataSourceSwitcher';
import DataSourceIndicator from '../../components/DataSourceIndicator';
import { UniversalChart } from '../../components/charts/UniversalChart';

import { BilingualTitle } from '../../components/charts/BilingualTitle';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// 维度图标映射
const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  'employment-overview': <FundOutlined />,
  'demographics': <TeamOutlined />,
  'employment-market': <BankOutlined />,
  'student-preparation': <BookOutlined />,
  'living-costs': <HomeOutlined />,
  'policy-insights': <SettingOutlined />
};

// 获取真实图表数据的函数
const getRealChartData = (question: any, dimensionData: DimensionData | null) => {
  try {
    if (!dimensionData || !dimensionData.charts) {
      console.warn('No dimension data available for question:', question.questionId);
      return generateFallbackData(question);
    }

    // 查找对应问题的图表数据
    const chartData = dimensionData.charts.find(chart => chart.questionId === question.questionId);

    if (!chartData || !chartData.data) {
      console.warn('No chart data found for question:', question.questionId);
      return generateFallbackData(question);
    }

    // 转换为图表组件所需的格式
    return chartData.data.map((item: any) => ({
      name: item.label,
      value: item.value,
      percentage: item.percentage,
      color: item.color || getColorForOption(item.label, question)
    }));
  } catch (error) {
    console.error('Error getting real chart data:', error);
    return generateFallbackData(question);
  }
};

// 生成回退数据（当真实数据不可用时）
const generateFallbackData = (question: any) => {
  if (!question || !question.options || !Array.isArray(question.options)) {
    return [];
  }

  return question.options.map((option: any, index: number) => ({
    name: option.label || `选项${index + 1}`,
    value: 0,
    percentage: 0,
    color: option.color || `hsl(${(index * 360) / question.options.length}, 70%, 50%)`
  }));
};

// 根据选项获取颜色
const getColorForOption = (label: string, question: any) => {
  if (question.options) {
    const option = question.options.find((opt: any) => opt.label === label);
    if (option && option.color) {
      return option.color;
    }
  }
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
};

export const NewQuestionnaireVisualizationPage: React.FC = () => {
  const { isMobile, isTablet } = useMobileDetection();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState<VisualizationSummary | null>(null);
  const [dimensionData, setDimensionData] = useState<Record<string, DimensionData>>({});
  const [error, setError] = useState<string | null>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [compatibilityReport, setCompatibilityReport] = useState<any>(null);

  // 加载数据
  useEffect(() => {
    loadVisualizationData();
  }, []);

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取兼容性报告
      const compatReport = getCompatibilityReport();
      setCompatibilityReport(compatReport);
      console.log('📊 维度兼容性报告:', compatReport);

      // 获取数据源信息和质量报告
      const dataSourceInfo = await questionnaireVisualizationService.getDataSourceInfo();
      setDataQuality(dataSourceInfo.dataQuality);

      // 加载摘要数据
      const summaryData = await questionnaireVisualizationService.getVisualizationSummary();
      setSummary(summaryData);

      // 使用新的批量获取方法加载所有维度数据
      const allDimensionsData = await questionnaireVisualizationService.getAllDimensionsData();
      setDimensionData(allDimensionsData);

      // 记录数据质量监控
      if (dataSourceInfo.dataQuality) {
        const validationReport = dataIntegrityValidator.validateApiData({
          totalResponses: dataSourceInfo.totalResponses,
          genderDistribution: [],
          ageDistribution: [],
          employmentStatus: [],
          educationLevel: [],
          cacheInfo: {
            lastUpdated: dataSourceInfo.lastUpdated,
            source: dataSourceInfo.source
          }
        });
        dataQualityMonitor.addReport(validationReport);
      }

      console.log('📊 数据加载完成:', {
        totalResponses: dataSourceInfo.totalResponses,
        dataQuality: dataSourceInfo.dataQuality,
        dimensionsLoaded: Object.keys(allDimensionsData).length,
        availableDimensions: dataSourceInfo.availableDimensions,
        compatibilityReport: compatReport
      });

    } catch (error) {
      console.error('Failed to load visualization data:', error);
      setError('加载可视化数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染概览页面
  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总参与人数"
              value={summary?.totalResponses || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="完成率"
              value={summary?.completionRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="数据维度"
              value={VISUALIZATION_DIMENSIONS.length}
              prefix={<DotChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="分析图表"
              value={VISUALIZATION_DIMENSIONS.reduce((sum, dim) => sum + dim.questions.length, 0)}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 关键洞察 */}
      <Card title="关键洞察" style={{ marginBottom: 24 }}>
        {summary?.keyInsights && summary.keyInsights.length > 0 ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {summary.keyInsights.map((insight, index) => (
              <Alert
                key={index}
                message={insight}
                type="info"
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </Space>
        ) : (
          <Alert
            message="数据分析中"
            description="正在生成基于真实问卷数据的关键洞察，敬请期待..."
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* 维度概览 */}
      <Card title="分析维度概览">
        <Row gutter={[16, 16]}>
          {VISUALIZATION_DIMENSIONS.map((dimension) => (
            <Col xs={24} sm={12} md={8} key={dimension.id}>
              <Card
                size="small"
                hoverable
                onClick={() => setActiveTab(dimension.id)}
                style={{ cursor: 'pointer' }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <span style={{ fontSize: '24px' }}>{dimension.icon}</span>
                    <Text strong>{dimension.title}</Text>
                  </Space>
                  <Paragraph 
                    type="secondary" 
                    style={{ margin: 0, fontSize: '12px' }}
                  >
                    {dimension.description}
                  </Paragraph>
                  <Tag color="blue">{dimension.questions.length} 个图表</Tag>

                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );

  // 渲染维度页面
  const renderDimension = (dimension: VisualizationDimension) => {
    const data = dimensionData[dimension.id];

    return (
      <div>
        {/* 维度标题和描述 */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <span style={{ fontSize: '32px' }}>{dimension.icon}</span>
              <Title level={3} style={{ margin: 0 }}>{dimension.title}</Title>
            </Space>
            <Paragraph>{dimension.description}</Paragraph>

          </Space>
        </Card>

        {/* 图表网格 */}
        <Row gutter={[16, 16]}>
          {dimension.questions.map((question) => {
            try {
              return (
                <Col xs={24} sm={24} md={24} lg={12} key={question.questionId}>
                  <Card
                    title={isMobile ? (
                      <BilingualTitle
                        title={question.questionTitle}
                        level={5}
                        align="left"
                      />
                    ) : (
                      <Space>
                        <BilingualTitle
                          title={question.questionTitle}
                          level={4}
                          align="left"
                        />
                      </Space>
                    )}
                    extra={!isMobile && <Tag color="blue">{question.chartType}</Tag>}
                    bodyStyle={isMobile ? { padding: '8px' } : undefined}
                    headStyle={isMobile ? { padding: '8px 12px', minHeight: 'auto' } : undefined}
                  >
                    <UniversalChart
                      type={question.chartType as any}
                      data={getRealChartData(question, dimensionData[dimension.id])}
                      height={isMobile ? 320 : (isTablet ? 300 : 350)}
                      showLegend={!isMobile}
                      showTooltip={true}
                    />
                    {!isMobile && <Divider />}

                    {!isMobile && (
                      <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
                        <strong>描述：</strong>{question.description}
                      </Paragraph>
                    )}
                  </Card>
                </Col>
              );
            } catch (error) {
              console.error(`Error rendering chart for question ${question.questionId}:`, error);
              return (
                <Col xs={24} lg={12} key={question.questionId}>
                  <Card
                    title={question.questionTitle}
                    extra={<Tag color="red">错误</Tag>}
                  >
                    <Alert
                      message="图表渲染错误"
                      description={`无法渲染 ${question.chartType} 类型的图表`}
                      type="error"
                      showIcon
                    />
                  </Card>
                </Col>
              );
            }
          })}
        </Row>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" tip="加载可视化数据中..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadVisualizationData}>
            重试
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: isMobile ? '8px' : '24px' }}>

      {/* 主要内容 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size={isMobile ? 'small' : 'large'}
      >
        <TabPane
          tab={
            isMobile ? (
              <span>📊</span>
            ) : (
              <Space>
                <BarChartOutlined />
                总览
              </Space>
            )
          }
          key="overview"
        >
          {renderOverview()}
        </TabPane>

        {VISUALIZATION_DIMENSIONS.map((dimension) => (
          <TabPane
            tab={
              isMobile ? (
                <span>{DIMENSION_ICONS[dimension.id]}</span>
              ) : (
                <Space>
                  {DIMENSION_ICONS[dimension.id]}
                  {dimension.title}
                </Space>
              )
            }
            key={dimension.id}
          >
            {renderDimension(dimension)}
          </TabPane>
        ))}


      </Tabs>
    </div>
  );
};

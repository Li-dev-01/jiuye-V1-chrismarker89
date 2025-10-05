/**
 * 问卷2七维度可视化页面
 * 融合式7个Tab可视化系统
 * 基于1000条真实测试数据
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Button,
  Space,
  Tag,
  Divider,
  Tooltip,
  Progress
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChartOutlined,
  PieChartOutlined,
  UserOutlined,
  DollarOutlined,
  LineChartOutlined,
  TeamOutlined,
  HeartOutlined,
  SafetyOutlined,
  RiseOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UniversalChart } from '../components/charts/UniversalChart';
import questionnaire2DataService, { type Questionnaire2Statistics } from '../services/questionnaire2DataService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 7个维度配置
const SEVEN_DIMENSIONS = [
  {
    key: 'demographics',
    title: '人口结构与就业画像',
    icon: <UserOutlined />,
    color: '#1890ff',
    description: '性别、年龄、学历、婚姻、城市、户籍等基础维度分析'
  },
  {
    key: 'economic',
    title: '经济压力与生活成本',
    icon: <DollarOutlined />,
    color: '#52c41a',
    description: '负债、生活开支、收入来源、父母支援、收支平衡分析'
  },
  {
    key: 'employment',
    title: '就业状态与收入水平',
    icon: <TeamOutlined />,
    color: '#faad14',
    description: '就业状态、月薪、薪资负债比、求职时长分析'
  },
  {
    key: 'discrimination',
    title: '求职歧视与公平性',
    icon: <SafetyOutlined />,
    color: '#f5222d',
    description: '歧视类型、严重程度、发生渠道分析'
  },
  {
    key: 'confidence',
    title: '就业信心与未来预期',
    icon: <RiseOutlined />,
    color: '#722ed1',
    description: '信心指数、影响因素、未来规划、支持需求分析'
  },
  {
    key: 'fertility',
    title: '生育意愿与婚育压力',
    icon: <HeartOutlined />,
    color: '#eb2f96',
    description: '生育计划、婚育歧视分析'
  },
  {
    key: 'cross',
    title: '交叉分析与洞察',
    icon: <BarChartOutlined />,
    color: '#13c2c2',
    description: '多维度交叉分析，发现深层关联'
  }
];

// 页面状态接口
interface PageState {
  loading: boolean;
  error: string | null;
  activeTab: string;
  statistics: Questionnaire2Statistics | null;
}

const Questionnaire2SevenDimensionPage: React.FC = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    activeTab: 'demographics',
    statistics: null
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔍 开始加载问卷2数据...');

      // 使用数据服务加载统计数据
      const statistics = await questionnaire2DataService.getStatistics();

      console.log('✅ 数据加载成功:', statistics);

      setState(prev => ({
        ...prev,
        loading: false,
        statistics
      }));
    } catch (error: any) {
      console.error('❌ 数据加载失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '数据加载失败'
      }));
    }
  };

  // 渲染概述卡片
  const renderOverview = () => {
    const totalResponses = state.statistics?.totalResponses || 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overview-card" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="总参与人数"
                value={totalResponses}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="数据维度"
                value={7}
                suffix="个"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="问题总数"
                value={40}
                suffix="题"
                prefix={<PieChartOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="数据完整度"
                value={100}
                suffix="%"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>

          <Divider />

          <Space wrap>
            {SEVEN_DIMENSIONS.map(dim => (
              <Tag
                key={dim.key}
                color={dim.color}
                icon={dim.icon}
                style={{ padding: '4px 12px', fontSize: '14px' }}
              >
                {dim.title}
              </Tag>
            ))}
          </Space>
        </Card>
      </motion.div>
    );
  };

  // 渲染维度内容
  const renderDimensionContent = (dimensionKey: string) => {
    const dimension = SEVEN_DIMENSIONS.find(d => d.key === dimensionKey);

    if (!dimension || !state.statistics) return null;

    // 根据不同维度渲染不同内容
    switch (dimensionKey) {
      case 'demographics':
        return renderDemographicsContent(dimension);
      case 'economic':
        return renderEconomicContent(dimension);
      case 'employment':
        return renderEmploymentContent(dimension);
      case 'discrimination':
        return renderDiscriminationContent(dimension);
      case 'confidence':
        return renderConfidenceContent(dimension);
      case 'fertility':
        return renderFertilityContent(dimension);
      case 'cross':
        return renderCrossAnalysisContent(dimension);
      default:
        return null;
    }
  };

  // 渲染人口结构维度
  const renderDemographicsContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.demographics;

    return (
      <motion.div
        key="demographics"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>

          <Divider />

          {/* 性别分布 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="性别分布">
                <UniversalChart
                  type="pie"
                  data={stats.gender.data.map(item => ({
                    name: item.name === 'male' ? '男' : item.name === 'female' ? '女' : '其他',
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>

            {/* 年龄分布 */}
            <Col xs={24} lg={12}>
              <Card type="inner" title="年龄分布">
                <UniversalChart
                  type="bar"
                  data={stats.ageRange.data.map(item => ({
                    name: item.name,
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 学历分布 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="学历分布">
                <UniversalChart
                  type="pie"
                  data={stats.educationLevel.data.map(item => ({
                    name: item.name,
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>

            {/* 婚姻状况分布 */}
            <Col xs={24} lg={12}>
              <Card type="inner" title="婚姻状况分布">
                <UniversalChart
                  type="pie"
                  data={stats.maritalStatus.data.map(item => ({
                    name: item.name === 'single' ? '单身' : item.name === 'married' ? '已婚' : '离异',
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 城市层级和户籍类型 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="城市层级分布">
                <UniversalChart
                  type="bar"
                  data={stats.cityTier.data.map(item => ({
                    name: item.name,
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="户籍类型分布">
                <UniversalChart
                  type="pie"
                  data={stats.hukouType.data.map(item => ({
                    name: item.name === 'urban' ? '城镇' : '农村',
                    value: item.value
                  }))}
                  height={300}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </motion.div>
    );
  };

  // 其他维度的占位符（后续实现）
  const renderEconomicContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="economic"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="经济压力与生活成本维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderEmploymentContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="employment"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="就业状态与收入水平维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderDiscriminationContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="discrimination"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="求职歧视与公平性维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderConfidenceContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="confidence"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="就业信心与未来预期维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderFertilityContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="fertility"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="生育意愿与婚育压力维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderCrossAnalysisContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    return (
      <motion.div
        key="cross"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <Space>
              {dimension.icon}
              <span>{dimension.title}</span>
            </Space>
          }
          extra={
            <Tag color={dimension.color}>
              {state.statistics!.totalResponses} 份数据
            </Tag>
          }
        >
          <Paragraph type="secondary">{dimension.description}</Paragraph>
          <Alert
            message="开发中"
            description="交叉分析与洞察维度的图表正在开发中..."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  // 加载状态
  if (state.loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" tip="加载问卷2可视化数据..." />
      </div>
    );
  }

  // 错误状态
  if (state.error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="数据加载失败"
          description={state.error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadData}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title level={2}>
          <BarChartOutlined /> 问卷2数据可视化 - 七维度分析
        </Title>
        <Paragraph type="secondary">
          基于1000条真实测试数据的多维度社会洞察分析系统
        </Paragraph>
      </motion.div>

      {/* 概述卡片 */}
      {renderOverview()}

      {/* 7个Tab维度 */}
      <Card>
        <Tabs
          activeKey={state.activeTab}
          onChange={(key) => setState(prev => ({ ...prev, activeTab: key }))}
          type="card"
          size="large"
        >
          {SEVEN_DIMENSIONS.map(dimension => (
            <TabPane
              tab={
                <span>
                  {dimension.icon}
                  <span style={{ marginLeft: 8 }}>{dimension.title}</span>
                </span>
              }
              key={dimension.key}
            >
              <AnimatePresence mode="wait">
                {renderDimensionContent(dimension.key)}
              </AnimatePresence>
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新数据
          </Button>
          <Button icon={<DownloadOutlined />}>
            导出报告
          </Button>
          <Button icon={<InfoCircleOutlined />} onClick={() => navigate('/second-questionnaire')}>
            返回问卷
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Questionnaire2SevenDimensionPage;


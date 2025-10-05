/**
 * 问卷2七维度可视化页面
 * 融合式7个Tab可视化系统
 * 基于1000条真实测试数据
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Row,
  Col,
  Alert,
  Spin,
  Button,
  Space,
  Tag,
  Divider,
  Typography,
  Statistic
} from 'antd';

const { Paragraph } = Typography;
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChartOutlined,
  PieChartOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  HeartOutlined,
  SafetyOutlined,
  RiseOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UniversalChart } from '../components/charts/UniversalChart';
import questionnaire2DataService, { type Questionnaire2Statistics } from '../services/questionnaire2DataService';

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
                  data={stats.gender.data}
                  height={300}
                />
              </Card>
            </Col>

            {/* 年龄分布 */}
            <Col xs={24} lg={12}>
              <Card type="inner" title="年龄分布">
                <UniversalChart
                  type="bar"
                  data={stats.ageRange.data}
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
                  data={stats.educationLevel.data}
                  height={300}
                />
              </Card>
            </Col>

            {/* 婚姻状况分布 */}
            <Col xs={24} lg={12}>
              <Card type="inner" title="婚姻状况分布">
                <UniversalChart
                  type="pie"
                  data={stats.maritalStatus.data}
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
                  data={stats.cityTier.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="户籍类型分布">
                <UniversalChart
                  type="pie"
                  data={stats.hukouType.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </motion.div>
    );
  };

  // 渲染经济压力维度
  const renderEconomicContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.economic;

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

          <Divider />

          {/* 负债情况和每月生活开支 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="负债情况分布">
                <UniversalChart
                  type="bar"
                  data={stats.debtSituation.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="每月生活开支分布">
                <UniversalChart
                  type="bar"
                  data={stats.monthlyLivingCost.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 收入来源和父母支援 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="收入来源分布（多选）">
                <UniversalChart
                  type="bar"
                  data={stats.incomeSources.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="父母支援金额分布">
                <UniversalChart
                  type="bar"
                  data={stats.parentalSupport.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 收支平衡和经济压力 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="收支平衡状况">
                <UniversalChart
                  type="pie"
                  data={stats.incomeExpenseBalance.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="经济压力程度">
                <UniversalChart
                  type="pie"
                  data={stats.economicPressure.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </motion.div>
    );
  };

  const renderEmploymentContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.employment;

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

          <Divider />

          {/* 就业状态和月薪分布 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="就业状态分布">
                <UniversalChart
                  type="pie"
                  data={stats.currentStatus.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="月薪分布">
                <UniversalChart
                  type="bar"
                  data={stats.salary.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 提示信息 */}
          <Alert
            message="数据说明"
            description="就业状态和月薪数据基于1000份真实问卷响应"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderDiscriminationContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.discrimination;

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

          <Divider />

          {/* 歧视类型和严重程度 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="歧视类型分布（多选）">
                <UniversalChart
                  type="bar"
                  data={stats.types.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="歧视严重程度">
                <UniversalChart
                  type="pie"
                  data={stats.severity.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 歧视渠道 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="歧视发生渠道（多选）">
                <UniversalChart
                  type="bar"
                  data={stats.channels.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Alert
                message="数据洞察"
                description="求职歧视是影响就业公平性的重要因素，需要社会各界共同关注"
                type="warning"
                showIcon
                style={{ height: '100%', display: 'flex', alignItems: 'center' }}
              />
            </Col>
          </Row>
        </Card>
      </motion.div>
    );
  };

  const renderConfidenceContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.confidence;

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

          <Divider />

          {/* 就业信心指数和影响因素 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="就业信心指数分布">
                <UniversalChart
                  type="bar"
                  data={stats.level.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card type="inner" title="信心影响因素（多选）">
                <UniversalChart
                  type="bar"
                  data={stats.factors.data}
                  height={300}
                />
              </Card>
            </Col>
          </Row>

          {/* 提示信息 */}
          <Alert
            message="数据说明"
            description="就业信心指数反映了求职者对未来就业前景的预期，影响因素包括个人技能、市场环境等"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </motion.div>
    );
  };

  const renderFertilityContent = (dimension: typeof SEVEN_DIMENSIONS[0]) => {
    const stats = state.statistics!.fertility;

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

          <Divider />

          {/* 生育意愿 */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="生育计划分布">
                <UniversalChart
                  type="pie"
                  data={stats.intent.data}
                  height={300}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Alert
                message="数据洞察"
                description="生育意愿受经济压力、就业状况、婚育歧视等多重因素影响"
                type="info"
                showIcon
                style={{ height: '100%', display: 'flex', alignItems: 'center' }}
              />
            </Col>
          </Row>
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
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
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
          <Button icon={<InfoCircleOutlined />} onClick={() => navigate('/second-questionnaire')}>
            返回问卷
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Questionnaire2SevenDimensionPage;


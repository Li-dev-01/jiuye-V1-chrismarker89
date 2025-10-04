/**
 * 第二问卷数据分析页面 - 混合可视化系统
 * 集成问卷2的3维度专业分析和问卷1的6维度全面分析
 * 采用Tab子页面样式统一展示
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
  Layout,
  Tag,
  Divider,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  message
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChartOutlined,
  PieChartOutlined,
  UserOutlined,
  RiseOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  DollarOutlined,
  LineChartOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  FundOutlined,
  ClearOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { hybridVisualizationService } from '../services/hybridVisualizationService';
import { exportService, type ExportOptions, type ShareOptions } from '../services/exportService';
import { useMockData, getCurrentDataSource } from '../config/dataSourceConfig';
import { UniversalChart } from '../components/charts/UniversalChart';
import type {
  HybridVisualizationData,
  TabType,
  UniversalDimensionData,
  UniversalChartData
} from '../types/hybridVisualization';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

// 页面状态接口
interface PageState {
  hybridData: HybridVisualizationData | null;
  loading: boolean;
  error: string | null;
  activeTab: TabType;
  selectedDimension: string | null;
  tabSwitching: boolean; // 新增：Tab切换状态
}
// 主组件
const SecondQuestionnaireAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [state, setState] = useState<PageState>({
    hybridData: null,
    loading: true,
    error: null,
    activeTab: 'q2-specialized',
    selectedDimension: null,
    tabSwitching: false
  });

  // 数据加载
  useEffect(() => {
    loadHybridData();
  }, []);

  const loadHybridData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // 调试信息
      console.log('🔍 开始加载混合数据...');
      console.log('📊 数据源配置:', {
        useMockData: useMockData(),
        getCurrentDataSource: getCurrentDataSource()
      });

      const response = await hybridVisualizationService.getHybridVisualizationData();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          hybridData: response.data!,
          loading: false
        }));
        console.log('✅ 混合可视化数据加载成功');
      } else {
        throw new Error(response.error?.message || '数据加载失败');
      }
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '未知错误'
      }));
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    await hybridVisualizationService.refreshData();
    await loadHybridData();
  };

  // Tab切换（性能优化版本）
  const handleTabChange = async (activeKey: string) => {
    // 如果切换到相同Tab，直接返回
    if (activeKey === state.activeTab) return;

    // 开始切换动画
    setState(prev => ({ ...prev, tabSwitching: true }));

    // 使用requestAnimationFrame优化动画性能
    requestAnimationFrame(() => {
      // 更新Tab状态
      setState(prev => ({
        ...prev,
        activeTab: activeKey as TabType,
        selectedDimension: null,
        tabSwitching: false
      }));
    });
  };

  // 维度选择
  const handleDimensionSelect = (dimensionId: string) => {
    setState(prev => ({
      ...prev,
      selectedDimension: prev.selectedDimension === dimensionId ? null : dimensionId
    }));
  };

  // 导出数据
  const handleExport = async (format: 'pdf' | 'excel' | 'png' | 'json') => {
    if (!state.hybridData) return;

    try {
      const options: ExportOptions = {
        format,
        includeCharts: true,
        includeInsights: true,
        customTitle: `问卷2数据可视化报告 - ${state.activeTab === 'q2-specialized' ? '专业分析' : '全面分析'}`
      };

      const result = await exportService.exportData(state.hybridData, options);

      // 下载文件
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questionnaire2-report-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // JSON格式直接下载
        const blob = new Blob([result], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questionnaire2-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      console.log(`✅ ${format.toUpperCase()}导出成功`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
    }
  };

  // 分享数据
  const handleShare = async (platform: 'email' | 'wechat' | 'link' | 'qr') => {
    if (!state.hybridData) return;

    try {
      const options: ShareOptions = {
        platform,
        message: `问卷2数据可视化分析报告，包含${state.hybridData.tabs.length}个分析维度，总响应数${state.hybridData.totalResponses}人。`
      };

      await exportService.shareData(state.hybridData, options);
      console.log(`✅ ${platform}分享成功`);
    } catch (error) {
      console.error('❌ 分享失败:', error);
    }
  };

  // 渲染加载状态
  const renderLoading = () => (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <Spin size="large" />
      <p style={{ marginTop: 16, color: '#666' }}>正在加载混合可视化数据...</p>
    </div>
  );

  // 渲染错误状态 - 增强版本
  const renderError = () => (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <Alert
        message="数据加载失败"
        description={
          <div>
            <p>{state.error}</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
              请检查网络连接或稍后重试。如果问题持续存在，请联系技术支持。
            </p>
          </div>
        }
        type="error"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      <Space>
        <Button
          type="primary"
          onClick={loadHybridData}
          loading={state.loading}
          icon={<ReloadOutlined />}
        >
          重新加载
        </Button>
        <Button onClick={handleRefresh} icon={<ClearOutlined />}>
          清除缓存
        </Button>
        <Button onClick={() => window.location.reload()} icon={<SyncOutlined />}>
          刷新页面
        </Button>
      </Space>
    </div>
  );

  // 渲染页面头部
  const renderHeader = () => {
    if (!state.hybridData) return null;

    return (
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {state.hybridData.title}
            </Title>
            <Text type="secondary">
              数据更新时间: {new Date(state.hybridData.lastUpdated).toLocaleString()}
            </Text>
          </Col>
          <Col>
            <Space>
              <Statistic
                title="总响应数"
                value={state.hybridData.totalResponses}
                prefix={<UserOutlined />}
              />
              <Statistic
                title="完成率"
                value={state.hybridData.completionRate}
                suffix="%"
                prefix={<TrophyOutlined />}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                type="primary"
              >
                刷新数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染维度卡片（增强交互版本）
  const renderDimensionCard = (dimension: UniversalDimensionData) => {
    const isExpanded = state.selectedDimension === dimension.dimensionId;

    // 卡片动画变体
    const cardVariants = {
      collapsed: {
        height: 'auto',
        transition: { duration: 0.3, ease: 'easeInOut' }
      },
      expanded: {
        height: 'auto',
        transition: { duration: 0.3, ease: 'easeInOut' }
      }
    };

    // 图表区域动画变体
    const chartsVariants = {
      hidden: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.2 }
      },
      visible: {
        opacity: 1,
        height: 'auto',
        transition: {
          duration: 0.3,
          staggerChildren: 0.1
        }
      }
    };

    const chartItemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };

    return (
      <motion.div
        variants={cardVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
      >
        <Card
          key={dimension.dimensionId}
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <span style={{ fontSize: '20px' }}>{dimension.icon}</span>
              <span>{dimension.dimensionTitle}</span>
              <Badge count={dimension.charts.length} color="blue" />
              {isExpanded && <Tag color="green">已展开</Tag>}
            </Space>
          }
          extra={
            <Space>
              <Tooltip title={dimension.description}>
                <InfoCircleOutlined />
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <FundOutlined /> : <BarChartOutlined />}
                onClick={() => handleDimensionSelect(dimension.dimensionId)}
              >
                {isExpanded ? '收起' : '展开图表'}
              </Button>
            </Space>
          }
          hoverable
          className={isExpanded ? 'dimension-card-expanded' : 'dimension-card-collapsed'}
        >
          <Row gutter={[16, 16]}>
            {/* 基础信息 */}
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">{dimension.description}</Text>

                {/* 统计信息 */}
                <Row gutter={16}>
                  <Col>
                    <Statistic
                      title="响应数"
                      value={dimension.totalResponses}
                      prefix={<UserOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title="完成率"
                      value={dimension.completionRate}
                      suffix="%"
                      prefix={<RiseOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title="图表数"
                      value={dimension.charts.length}
                      prefix={<PieChartOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </Space>
            </Col>

            {/* 洞察信息 */}
            {dimension.insights && dimension.insights.length > 0 && (
              <Col span={24}>
                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  <Text strong>💡 关键洞察</Text>
                </Divider>
                <Space wrap>
                  {dimension.insights.map((insight, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ marginBottom: 4, cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 可以添加洞察详情弹窗
                      }}
                    >
                      {insight}
                    </Tag>
                  ))}
                </Space>
              </Col>
            )}

            {/* 图表展示区域 */}
            <AnimatePresence>
              {isExpanded && (
                <Col span={24}>
                  <motion.div
                    variants={chartsVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Divider orientation="left" style={{ margin: '12px 0' }}>
                      <Text strong>📊 数据图表</Text>
                    </Divider>
                    <Row gutter={[16, 16]}>
                      {dimension.charts.map((chart, index) => (
                        <Col xs={24} lg={12} key={chart.questionId}>
                          <motion.div
                            variants={chartItemVariants}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card
                              size="small"
                              title={
                                <Space>
                                  <span>{chart.questionTitle}</span>
                                  <Tag color="green">{chart.chartType}</Tag>
                                </Space>
                              }
                              extra={
                                <Tooltip title="点击查看详细数据">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<LineChartOutlined />}
                                  />
                                </Tooltip>
                              }
                              hoverable
                            >
                              <UniversalChart
                                type={chart.chartType as any}
                                data={chart.data}
                                height={300}
                                showLegend={true}
                                showTooltip={true}
                                hybridMode={true}
                                insightText={chart.insight}
                              />
                            </Card>
                          </motion.div>
                        </Col>
                      ))}
                    </Row>
                  </motion.div>
                </Col>
              )}
            </AnimatePresence>
          </Row>
        </Card>
      </motion.div>
    );
  };

  // 渲染Tab内容
  const renderTabContent = (tabKey: TabType) => {
    if (!state.hybridData) return null;

    const tab = state.hybridData.tabs.find(t => t.key === tabKey);
    if (!tab) return null;

    // 动画变体
    const tabContentVariants = {
      hidden: {
        opacity: 0,
        y: 20,
        transition: { duration: 0.2 }
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          staggerChildren: 0.1
        }
      }
    };

    const dimensionVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={tabKey}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Tab描述卡片 */}
          <motion.div variants={dimensionVariants}>
            <Row style={{ marginBottom: 16 }}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Card size="small" className="tab-info-card">
                  <Space size="large" wrap>
                    <span className="tab-icon">{tab.icon}</span>
                    <div className="tab-content">
                      <Title level={4} className="tab-title">{tab.label}</Title>
                      <Text type="secondary" className="tab-description">{tab.description}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </motion.div>

          {/* 维度卡片列表 */}
          <Row gutter={[16, 16]}>
            {tab.dimensions.map((dimension, index) => (
              <Col span={24} key={dimension.dimensionId}>
                <motion.div
                  variants={dimensionVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderDimensionCard(dimension)}
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </AnimatePresence>
    );
  };

  // 主要渲染逻辑
  if (state.loading) {
    return renderLoading();
  }

  if (state.error) {
    return renderError();
  }

  if (!state.hybridData) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
      {/* 页面头部 */}
      {renderHeader()}

        {/* Tab式可视化内容 */}
        <Card>
          <Tabs
            activeKey={state.activeTab}
            onChange={handleTabChange}
            size="large"
            type="card"
            tabBarExtraContent={
              <Space>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'pdf',
                        label: 'PDF报告',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('pdf')
                      },
                      {
                        key: 'excel',
                        label: 'Excel数据',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('excel')
                      },
                      {
                        key: 'png',
                        label: 'PNG图片',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('png')
                      },
                      {
                        key: 'json',
                        label: 'JSON数据',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('json')
                      }
                    ]
                  }}
                  placement="bottomRight"
                >
                  <Button
                    icon={<DownloadOutlined />}
                    type="default"
                  >
                    导出数据
                  </Button>
                </Dropdown>

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'link',
                        label: '复制链接',
                        icon: <ShareAltOutlined />,
                        onClick: () => handleShare('link')
                      },
                      {
                        key: 'email',
                        label: '邮件分享',
                        icon: <ShareAltOutlined />,
                        onClick: () => handleShare('email')
                      },
                      {
                        key: 'wechat',
                        label: '微信分享',
                        icon: <ShareAltOutlined />,
                        onClick: () => handleShare('wechat')
                      },
                      {
                        key: 'qr',
                        label: '二维码',
                        icon: <ShareAltOutlined />,
                        onClick: () => handleShare('qr')
                      }
                    ]
                  }}
                  placement="bottomRight"
                >
                  <Button
                    icon={<ShareAltOutlined />}
                    type="default"
                  >
                    分享报告
                  </Button>
                </Dropdown>
              </Space>
            }
          >
            {state.hybridData.tabs.map((tab) => (
              <TabPane
                tab={
                  <Space>
                    <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <Badge count={tab.dimensions.length} color="blue" />
                  </Space>
                }
                key={tab.key}
              >
                {state.tabSwitching ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16, color: '#666' }}>正在切换分析模式...</p>
                  </div>
                ) : (
                  renderTabContent(tab.key)
                )}
              </TabPane>
            ))}
          </Tabs>
        </Card>
    </div>
  );
};

export default SecondQuestionnaireAnalyticsPage;

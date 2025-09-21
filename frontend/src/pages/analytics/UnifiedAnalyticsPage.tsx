/**
 * UnifiedAnalyticsPage - 统一可视化页面
 * 将不同社会角色视角整合到一个页面中，使用Tab切换
 */

import React, { useState, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Typography,
  Space,
  Button,
  Alert,
  Spin
} from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  BankOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PieChartOutlined
} from '@ant-design/icons';
// import { DataLoadingState } from '../../components/common/EmptyState'; // 暂时移除
import styles from './UnifiedAnalyticsPage.module.css';

// 导入各个角色的Dashboard组件
import { PublicDashboard } from './PublicDashboard';
import { EducationDashboard } from './EducationDashboard';
import { StudentParentDashboard } from './StudentParentDashboard';
import { PolicyMakerDashboard } from './PolicyMakerDashboard';
import { RealisticDashboard } from './RealisticDashboard';
import { QuestionnaireVisualizationPage } from './QuestionnaireVisualizationPage';

const { Title, Paragraph } = Typography;

// Dashboard组件将在后续版本中集成

// Tab配置
const tabConfig = [
  {
    key: 'overview',
    label: '综合概览',
    icon: <BarChartOutlined />,
    description: '整体数据概览和核心指标'
  },
  {
    key: 'public',
    label: '公众视角',
    icon: <TeamOutlined />,
    description: '面向媒体记者和公众的社会关注数据'
  },
  {
    key: 'education',
    label: '教育部门',
    icon: <BookOutlined />,
    description: '面向教育管理者的专业就业数据'
  },
  {
    key: 'student',
    label: '学生家长',
    icon: <UserOutlined />,
    description: '面向学生和家长的专业选择指导'
  },
  {
    key: 'policy',
    label: '政策制定',
    icon: <BankOutlined />,
    description: '面向政策制定者的决策支持数据'
  },
  {
    key: 'realistic',
    label: '现实分析',
    icon: <ExperimentOutlined />,
    description: '基于真实数据的深度分析'
  },
  {
    key: 'visualization',
    label: '问卷可视化',
    icon: <PieChartOutlined />,
    description: '温和有趣的问卷数据可视化展示'
  }
];

export const UnifiedAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 根据URL参数设置初始Tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && tabConfig.some(tab => tab.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 更新URL参数，但不刷新页面
    const searchParams = new URLSearchParams(location.search);
    if (key === 'overview') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', key);
    }
    const newSearch = searchParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    navigate(newUrl, { replace: true });
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // 渲染综合概览Tab内容
  const renderOverviewTab = () => (
    <div className={styles.overviewContent}>
      <Alert
        message="数据可视化中心"
        description="选择不同的视角查看针对性的数据分析。每个视角都为特定用户群体提供定制化的数据展示和分析。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <div className={styles.tabGrid}>
        {tabConfig.slice(1).map(tab => (
          <Card
            key={tab.key}
            hoverable
            className={styles.tabCard}
            onClick={() => setActiveTab(tab.key)}
          >
            <div className={styles.tabCardContent}>
              <div className={styles.tabIcon}>
                {tab.icon}
              </div>
              <Title level={4}>{tab.label}</Title>
              <Paragraph type="secondary">
                {tab.description}
              </Paragraph>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // 渲染Tab内容
  const renderTabContent = () => {
    const LoadingWrapper = ({ children }: { children: React.ReactNode }) => (
      <Suspense fallback={
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>加载中...</p>
        </div>
      }>
        {children}
      </Suspense>
    );

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'public':
        return (
          <LoadingWrapper>
            <PublicDashboard />
          </LoadingWrapper>
        );
      case 'education':
        return (
          <LoadingWrapper>
            <EducationDashboard />
          </LoadingWrapper>
        );
      case 'student':
        return (
          <LoadingWrapper>
            <StudentParentDashboard />
          </LoadingWrapper>
        );
      case 'policy':
        return (
          <LoadingWrapper>
            <PolicyMakerDashboard />
          </LoadingWrapper>
        );
      case 'realistic':
        return (
          <LoadingWrapper>
            <RealisticDashboard />
          </LoadingWrapper>
        );
      case 'visualization':
        return (
          <LoadingWrapper>
            <QuestionnaireVisualizationPage />
          </LoadingWrapper>
        );
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className={styles.unifiedAnalytics}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Title level={2}>
            <BarChartOutlined /> 数据可视化中心
          </Title>
          <Paragraph>
            多角度数据分析，为不同用户群体提供专业的就业数据洞察
          </Paragraph>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            刷新数据
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
          >
            导出报告
          </Button>
        </Space>
      </div>

      <Card className={styles.mainCard}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          className={styles.mainTabs}
          items={tabConfig.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.icon}
                {tab.label}
              </span>
            )
          }))}
        />

        <div className={styles.tabContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <p>加载中...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </Card>
    </div>
  );
};

export default UnifiedAnalyticsPage;

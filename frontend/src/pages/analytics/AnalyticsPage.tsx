import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Alert,
  Tag
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { SafeChart } from '../../components/charts/SafeChart';
// import { ExportModal } from '../../components/analytics/ExportModal'; // 暂时移除 - 调试用
import { DataLoadingState } from '../../components/common/EmptyState';
import { useUniversalAuthStore } from '../../stores/universalAuthStore';
import styles from './AnalyticsPage.module.css';

const { Title } = Typography;
const { Option } = Select;

// 数据接口
interface AnalyticsData {
  totalResponses: number;
  totalHeartVoices: number;
  totalStories: number;
  completionRate: number;
  averageTime: number;
  educationDistribution: Array<{ name: string; value: number }>;
  salaryExpectation: Array<{ name: string; value: number }>;
  employmentStatus: Array<{ name: string; value: number }>;
  monthlyTrend: {
    months: string[];
    responses: number[];
    completions: number[];
  };
  regionDistribution: Array<{ name: string; value: number }>;
  ageDistribution: Array<{ name: string; value: number }>;
  skillsHeatmap: {
    skills: string[];
    levels: string[];
    data: Array<{ x: number; y: number; value: number }>;
  };
}

export const AnalyticsPage: React.FC = () => {
  const { currentUser } = useUniversalAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('last30days');
  const [chartType, setChartType] = useState<string>('bar');
  // const [exportModalVisible, setExportModalVisible] = useState(false); // 暂时移除 - 调试用
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      // 使用模拟数据进行测试 - 验证问题是否在API数据处理上
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟

      // 模拟数据已清理 - 显示空状态
      setData(null);
      setIsRealData(false);
    } catch (error) {
      console.error('数据加载失败:', error);
      // 网络错误时显示错误状态
      setError(true);
      setData(null);
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  };

  // const handleExport = () => {
  //   setExportModalVisible(true);
  // }; // 暂时移除 - 调试用

  const handleRefresh = () => {
    loadData();
  };

  const hasData = data && (
    data.totalResponses > 0 ||
    data.totalHeartVoices > 0 ||
    data.totalStories > 0
  );

  return (
    <div className={styles.content}>
      <DataLoadingState
        loading={loading}
        error={error}
        hasData={!!hasData}
        dataType="analytics"
        onRetry={loadData}
      >
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>数据分析</Title>
            <Tag
              icon={<DatabaseOutlined />}
              color="orange"
            >
              模拟数据
            </Tag>
          </div>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="last7days">最近7天</Option>
            <Option value="last30days">最近30天</Option>
            <Option value="last90days">最近90天</Option>
            <Option value="custom">自定义</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Link to="/analytics/advanced">
            <Button icon={<SettingOutlined />}>
              高级分析
            </Button>
          </Link>
          {/* <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button> */}
        </Space>
      </div>

      {/* 数据来源说明 */}
      <Alert
        message="数据来源"
        description={`当前显示的是模拟数据（用于测试）。总计：${data?.totalResponses || 0}份问卷回复，${data?.totalHeartVoices || 0}条心声，${data?.totalStories || 0}个故事。`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="问卷回复"
                value={data?.totalResponses}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="问卷心声"
                value={data?.totalHeartVoices}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="用户故事"
                value={data?.totalStories}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="完成率"
                value={data?.completionRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 - 暂时移除所有图表进行调试 */}
        {/* <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={12}>
            <Card
              title="学历分布"
              extra={
                <Select value={chartType} onChange={setChartType} size="small">
                  <Option value="bar"><BarChartOutlined /> 柱状图</Option>
                  <Option value="pie"><PieChartOutlined /> 饼图</Option>
                </Select>
              }
            >
              <div data-chart="education-chart">
                {chartType === 'bar' ? (
                  <SafeChart
                    data={data?.educationDistribution || []}
                    title="学历分布"
                    chartType="bar"
                    height={300}
                  />
                ) : (
                  <SafeChart
                    data={data?.educationDistribution || []}
                    title="学历分布"
                    chartType="pie"
                    height={300}
                  />
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="薪资期望分布">
              <div data-chart="salary-chart">
                <SafeChart
                  data={data?.salaryExpectation || []}
                  title="薪资期望分布"
                  chartType="bar"
                  height={300}
                />
              </div>
            </Card>
          </Col>
        </Row> */}

        {/* 调试信息 */}
        <Card title="调试信息" style={{ marginTop: 16 }}>
          <p>当前版本：最小化版本 - 只包含统计卡片</p>
          <p>如果这个版本正常工作，问题就在图表组件中</p>
          <p>数据加载状态：{loading ? '加载中' : '已完成'}</p>
          <p>是否有数据：{hasData ? '是' : '否'}</p>
        </Card>

        <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={12}>
            <Card title="就业状态分布">
              <SafeChart
                data={data?.employmentStatus || []}
                title="就业状态分布"
                chartType="pie"
                height={300}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="月度趋势" extra={<LineChartOutlined />}>
              <SafeChart
                data={data?.monthlyTrend?.responses || []}
                title="月度趋势"
                chartType="line"
                height={300}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24} lg={12}>
            <Card title="地区分布">
              <SafeChart
                data={data?.regionDistribution || []}
                title="地区分布"
                chartType="bar"
                height={300}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="年龄分布">
              <SafeChart
                data={data?.ageDistribution || []}
                title="年龄分布"
                chartType="pie"
                height={300}
              />
            </Card>
          </Col>
        </Row>

        {/* 技能水平热力图暂时移除 - 调试用 */}
        {/* <Row gutter={[16, 16]} className={styles.chartsRow}>
          <Col xs={24}>
            <Card title="技能水平热力图">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>热力图功能开发中，暂时显示原始数据</p>
              </div>
            </Card>
          </Col>
        </Row> */}

        {/* ExportModal暂时移除 - 调试用 */}
        {/* <ExportModal
          visible={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          data={data}
        /> */}
      </DataLoadingState>
    </div>
  );
};

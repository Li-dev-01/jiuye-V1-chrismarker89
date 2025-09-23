/**
 * 统计缓存监控页面
 * 用于管理员监控和管理问卷统计缓存
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Space, 
  Alert, 
  Statistic, 
  Row, 
  Col,
  Tag,
  message,
  Spin
} from 'antd';
import { 
  ReloadOutlined, 
  ClockCircleOutlined, 
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface CacheStatus {
  questionnaireId: string;
  hasCache: boolean;
  lastUpdated: string | null;
  questionsCount: number;
  totalOptions: number;
  cacheAge: number | null;
}

interface StatsData {
  questionId: string;
  optionValue: string;
  count: number;
  percentage: number;
  totalResponses: number;
  lastUpdated: string;
}

export const StatsCacheMonitor: React.FC = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 获取缓存状态
  const fetchCacheStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024/cache-status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCacheStatus(data.data);
      } else {
        message.error('获取缓存状态失败');
      }
    } catch (error) {
      console.error('获取缓存状态失败:', error);
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatsData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024`
      );

      if (response.ok) {
        const data = await response.json();
        const flatData: StatsData[] = [];
        
        Object.entries(data.data.statistics).forEach(([questionId, stats]: [string, any]) => {
          stats.options.forEach((option: any) => {
            flatData.push({
              questionId,
              optionValue: option.value,
              count: option.count,
              percentage: option.percentage,
              totalResponses: stats.totalResponses,
              lastUpdated: stats.lastUpdated
            });
          });
        });

        setStatsData(flatData);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 手动刷新缓存
  const refreshCache = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/universal-questionnaire/statistics/employment-survey-2024/refresh`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      if (response.ok) {
        message.success('缓存刷新成功');
        await fetchCacheStatus();
        await fetchStatsData();
      } else {
        message.error('缓存刷新失败');
      }
    } catch (error) {
      console.error('缓存刷新失败:', error);
      message.error('网络错误');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
    fetchStatsData();

    // 每30秒自动刷新状态
    const interval = setInterval(() => {
      fetchCacheStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 计算缓存年龄显示
  const getCacheAgeDisplay = (cacheAge: number | null) => {
    if (!cacheAge) return '未知';
    
    const minutes = Math.floor(cacheAge / (1000 * 60));
    const seconds = Math.floor((cacheAge % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒前`;
    }
    return `${seconds}秒前`;
  };

  // 获取状态标签
  const getStatusTag = (hasCache: boolean, cacheAge: number | null) => {
    if (!hasCache) {
      return <Tag color="red" icon={<WarningOutlined />}>无缓存</Tag>;
    }
    
    if (cacheAge && cacheAge > 2 * 60 * 1000) { // 超过2分钟
      return <Tag color="orange" icon={<ClockCircleOutlined />}>缓存过期</Tag>;
    }
    
    return <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>;
  };

  const columns = [
    {
      title: '问题ID',
      dataIndex: 'questionId',
      key: 'questionId',
      width: 150,
    },
    {
      title: '选项值',
      dataIndex: 'optionValue',
      key: 'optionValue',
      width: 120,
    },
    {
      title: '选择次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a: StatsData, b: StatsData) => a.count - b.count,
    },
    {
      title: '百分比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (percentage: number) => `${percentage}%`,
      sorter: (a: StatsData, b: StatsData) => a.percentage - b.percentage,
    },
    {
      title: '总响应数',
      dataIndex: 'totalResponses',
      key: 'totalResponses',
      width: 100,
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>统计缓存监控</Title>
      
      {/* 缓存状态概览 */}
      <Card title="缓存状态概览" style={{ marginBottom: '24px' }}>
        {loading ? (
          <Spin size="large" />
        ) : cacheStatus ? (
          <>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Statistic
                  title="缓存状态"
                  value={cacheStatus.hasCache ? '正常' : '无缓存'}
                  prefix={getStatusTag(cacheStatus.hasCache, cacheStatus.cacheAge)}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="问题数量"
                  value={cacheStatus.questionsCount}
                  suffix="个"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="选项总数"
                  value={cacheStatus.totalOptions}
                  suffix="个"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="缓存年龄"
                  value={getCacheAgeDisplay(cacheStatus.cacheAge)}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
            
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={refreshCache}
              >
                手动刷新缓存
              </Button>
              <Button 
                icon={<DatabaseOutlined />}
                onClick={() => {
                  fetchCacheStatus();
                  fetchStatsData();
                }}
              >
                刷新状态
              </Button>
            </Space>
          </>
        ) : (
          <Alert message="无法获取缓存状态" type="error" />
        )}
      </Card>

      {/* 统计数据详情 */}
      <Card title="统计数据详情">
        <Table
          columns={columns}
          dataSource={statsData}
          rowKey={(record) => `${record.questionId}-${record.optionValue}`}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

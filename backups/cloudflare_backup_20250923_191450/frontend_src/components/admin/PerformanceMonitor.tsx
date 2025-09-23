/**
 * 性能监控组件
 * 用于监控数据同步和API性能
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Button, Space, Spin, Alert, Tabs,
  Progress, Badge, Typography, Tooltip, Divider, Tag, Timeline
} from 'antd';
import {
  SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  DatabaseOutlined, ApiOutlined, LineChartOutlined, WarningOutlined,
  ReloadOutlined, ClearOutlined, SettingOutlined, InfoCircleOutlined
} from '@ant-design/icons';
// import { optimizedAnalyticsAPI, SyncTask, SyncStatus, PerformanceMetrics, HealthStatus } from '../../services/optimizedAnalyticsAPI'; // 已移动到归档目录

// 临时类型定义
interface SyncTask {
  id: string;
  name: string;
  status: string;
  progress: number;
  lastRun?: string;
  nextRun?: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSync: string;
  nextSync: string;
  tasks: SyncTask[];
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

interface HealthStatus {
  status: string;
  checks: Array<{
    name: string;
    status: string;
    message?: string;
  }>;
}

// 模拟 API 服务
const mockOptimizedAnalyticsAPI = {
  getSyncStatus: async (): Promise<SyncStatus> => ({
    isRunning: false,
    lastSync: new Date().toISOString(),
    nextSync: new Date(Date.now() + 3600000).toISOString(),
    tasks: [
      { id: '1', name: '数据同步', status: 'completed', progress: 100, lastRun: new Date().toISOString() },
      { id: '2', name: '统计更新', status: 'running', progress: 75 }
    ]
  }),
  getPerformanceMetrics: async (): Promise<PerformanceMetrics> => ({
    responseTime: 120,
    throughput: 850,
    errorRate: 0.5,
    uptime: 99.8
  }),
  healthCheck: async (): Promise<HealthStatus> => ({
    status: 'healthy',
    checks: [
      { name: '数据库连接', status: 'healthy' },
      { name: 'API响应', status: 'healthy' },
      { name: '缓存服务', status: 'warning', message: '缓存使用率较高' }
    ]
  }),
  triggerSync: async (force?: boolean): Promise<void> => {
    console.log('触发同步', force);
  },
  invalidateCache: async (): Promise<void> => {
    console.log('清除缓存');
  }
};

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 同步状态颜色映射
const statusColors = {
  pending: 'blue',
  running: 'processing',
  completed: 'success',
  failed: 'error'
};

// 同步状态图标映射
const statusIcons = {
  pending: <ClockCircleOutlined />,
  running: <SyncOutlined spin />,
  completed: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />
};

interface PerformanceMonitorProps {
  refreshInterval?: number; // 刷新间隔（毫秒）
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  refreshInterval = 30000 // 默认30秒刷新一次
}) => {
  // 状态
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [cacheLoading, setCacheLoading] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 并行请求所有数据
      const [syncStatusData, performanceData, healthData] = await Promise.all([
        mockOptimizedAnalyticsAPI.getSyncStatus(),
        mockOptimizedAnalyticsAPI.getPerformanceMetrics(),
        mockOptimizedAnalyticsAPI.healthCheck()
      ]);
      
      setSyncStatus(syncStatusData);
      setPerformanceMetrics(performanceData);
      setHealthStatus(healthData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };
  
  // 触发同步
  const triggerSync = async (force: boolean = false) => {
    setSyncLoading(true);
    
    try {
      await mockOptimizedAnalyticsAPI.triggerSync(force);
      // 重新加载数据
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync');
    } finally {
      setSyncLoading(false);
    }
  };
  
  // 清除缓存
  const clearCache = async () => {
    setCacheLoading(true);
    
    try {
      await mockOptimizedAnalyticsAPI.invalidateCache();
      // 重新加载数据
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setCacheLoading(false);
    }
  };
  
  // 初始加载和定时刷新
  useEffect(() => {
    loadData();
    
    // 设置定时刷新
    const intervalId = setInterval(() => {
      loadData();
    }, refreshInterval);
    
    // 清理
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // 同步任务表格列
  const syncTaskColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">
          {type.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={statusColors[status as keyof typeof statusColors] as any} text={
          <Space>
            {statusIcons[status as keyof typeof statusIcons]}
            <span style={{ textTransform: 'capitalize' }}>{status}</span>
          </Space>
        } />
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '用时(秒)',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration.toFixed(2)}s` : '-'
    },
    {
      title: '影响行数',
      dataIndex: 'affectedRows',
      key: 'affectedRows',
      render: (rows: number) => rows ? rows.toLocaleString() : '-'
    }
  ];
  
  // 性能指标表格列
  const syncMetricsColumns = [
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type: string) => (
        <Tag color="blue">
          {type.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: '平均用时(秒)',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      render: (duration: number) => `${duration.toFixed(2)}s`
    },
    {
      title: '最大用时(秒)',
      dataIndex: 'maxDuration',
      key: 'maxDuration',
      render: (duration: number) => `${duration.toFixed(2)}s`
    },
    {
      title: '平均影响行数',
      dataIndex: 'avgAffectedRows',
      key: 'avgAffectedRows',
      render: (rows: number) => Math.round(rows).toLocaleString()
    },
    {
      title: '运行次数',
      dataIndex: 'totalRuns',
      key: 'totalRuns'
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Tooltip title={`${rate}%`}>
          <Progress percent={rate} size="small" status={rate < 90 ? 'exception' : 'success'} />
        </Tooltip>
      )
    }
  ];
  
  // 渲染健康状态
  const renderHealthStatus = () => {
    if (!healthStatus) return null;
    
    const { status, database, redis, totalRecords, lastSync, syncScheduler } = healthStatus;
    
    return (
      <Card title="系统健康状态" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="系统状态"
              value={status === 'healthy' ? '健康' : '异常'}
              valueStyle={{ color: status === 'healthy' ? '#52c41a' : '#f5222d' }}
              prefix={status === 'healthy' ? <CheckCircleOutlined /> : <WarningOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="数据库连接"
              value={database === 'connected' ? '已连接' : '断开'}
              valueStyle={{ color: database === 'connected' ? '#52c41a' : '#f5222d' }}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Redis缓存"
              value={redis === 'connected' ? '已连接' : redis === 'disconnected' ? '断开' : '未配置'}
              valueStyle={{ 
                color: redis === 'connected' ? '#52c41a' : 
                       redis === 'disconnected' ? '#f5222d' : '#faad14' 
              }}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总记录数"
              value={totalRecords}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="同步调度器"
              value={syncScheduler === 'running' ? '运行中' : '已停止'}
              valueStyle={{ color: syncScheduler === 'running' ? '#52c41a' : '#f5222d' }}
              prefix={syncScheduler === 'running' ? <SyncOutlined spin /> : <CloseCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="最后同步时间"
              value={lastSync ? new Date(lastSync).toLocaleString() : '无数据'}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>
    );
  };
  
  // 渲染缓存指标
  const renderCacheMetrics = () => {
    if (!performanceMetrics || !performanceMetrics.cacheMetrics) return null;
    
    const { hits, misses, hitRate } = performanceMetrics.cacheMetrics;
    const total = hits + misses;
    
    return (
      <Card title="缓存性能" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="缓存命中率"
              value={hitRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: hitRate > 80 ? '#52c41a' : hitRate > 50 ? '#faad14' : '#f5222d' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="命中次数"
              value={hits}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="未命中次数"
              value={misses}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={24}>
            <Tooltip title={`命中率: ${hitRate}%`}>
              <Progress 
                percent={hitRate} 
                status={hitRate > 80 ? 'success' : hitRate > 50 ? 'normal' : 'exception'}
                format={percent => `${percent?.toFixed(2)}%`}
              />
            </Tooltip>
            <Text type="secondary">
              总请求数: {total.toLocaleString()} | 命中: {hits.toLocaleString()} | 未命中: {misses.toLocaleString()}
            </Text>
          </Col>
        </Row>
      </Card>
    );
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>
        <LineChartOutlined /> 性能监控中心
      </Title>
      
      <Paragraph>
        监控数据同步、API性能和系统健康状态。数据每 {refreshInterval / 1000} 秒自动刷新一次。
        <Text type="secondary" style={{ marginLeft: 8 }}>
          最后更新: {lastRefresh.toLocaleString()}
        </Text>
      </Paragraph>
      
      {error && (
        <Alert
          message="加载错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={() => loadData()}
          loading={loading}
        >
          刷新数据
        </Button>
        <Button 
          icon={<SyncOutlined />} 
          onClick={() => triggerSync(false)}
          loading={syncLoading}
        >
          触发同步
        </Button>
        <Button 
          icon={<SyncOutlined />} 
          onClick={() => triggerSync(true)}
          loading={syncLoading}
          danger
        >
          强制同步
        </Button>
        <Button 
          icon={<ClearOutlined />} 
          onClick={clearCache}
          loading={cacheLoading}
        >
          清除缓存
        </Button>
      </Space>
      
      <Spin spinning={loading}>
        <Tabs defaultActiveKey="health">
          <TabPane tab="系统健康" key="health">
            {renderHealthStatus()}
          </TabPane>
          
          <TabPane tab="同步状态" key="sync">
            <Card title="数据同步状态" bordered={false}>
              {syncStatus && (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Statistic
                        title="最后同步时间"
                        value={syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : '无数据'}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="下次计划同步"
                        value={syncStatus.nextScheduledSync ? new Date(syncStatus.nextScheduledSync).toLocaleString() : '无数据'}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                  </Row>
                  
                  <Table
                    columns={syncTaskColumns}
                    dataSource={syncStatus.tasks}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="middle"
                  />
                </>
              )}
            </Card>
          </TabPane>
          
          <TabPane tab="性能指标" key="performance">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                {renderCacheMetrics()}
              </Col>
              
              <Col span={24}>
                <Card title="同步性能指标" bordered={false}>
                  {performanceMetrics && performanceMetrics.syncMetrics && (
                    <Table
                      columns={syncMetricsColumns}
                      dataSource={performanceMetrics.syncMetrics}
                      rowKey="taskType"
                      pagination={false}
                      size="middle"
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default PerformanceMonitor;

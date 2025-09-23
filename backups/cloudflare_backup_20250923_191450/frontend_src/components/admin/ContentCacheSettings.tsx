/**
 * 内容缓存设置组件
 * 用于超级管理员配置内容预加载和缓存策略
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Space,
  Divider,
  Alert,
  Statistic,
  Row,
  Col,
  Progress,
  Table,
  Tag,
  Modal,
  message,
  Typography,
  Select,
  Tooltip
} from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  MemoryOutlined,
  ReloadOutlined,
  ClearOutlined,
  SettingOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface CacheConfig {
  enabled: boolean;
  listPageSize: number;
  swipeViewerInitialSize: number;
  swipeViewerBatchSize: number;
  preloadThreshold: number;
  maxItemsPerCategory: number;
  maxTotalItems: number;
  cacheDuration: number;
  enablePreload: boolean;
  enableDeduplication: boolean;
  autoCleanup: boolean;
  cleanupInterval: number;
}

interface CacheStats {
  totalCategories: number;
  totalItems: number;
  memoryUsage: string;
  hitRate: number;
  missRate: number;
  averageLoadTime: number;
  preloadEfficiency: number;
}

interface CategoryCacheInfo {
  category: string;
  itemCount: number;
  memoryUsage: string;
  hitRate: number;
  lastAccess: number;
  isActive: boolean;
}

export const ContentCacheSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CacheConfig>({
    enabled: true,
    listPageSize: 10,
    swipeViewerInitialSize: 50,
    swipeViewerBatchSize: 30,
    preloadThreshold: 10,
    maxItemsPerCategory: 500,
    maxTotalItems: 2000,
    cacheDuration: 30 * 60 * 1000,
    enablePreload: true,
    enableDeduplication: true,
    autoCleanup: true,
    cleanupInterval: 60 * 60 * 1000
  });

  const [stats, setStats] = useState<CacheStats>({
    totalCategories: 5,
    totalItems: 1250,
    memoryUsage: '45.2MB',
    hitRate: 78.5,
    missRate: 21.5,
    averageLoadTime: 245,
    preloadEfficiency: 85.3
  });

  const [categoryCache, setCategoryCache] = useState<CategoryCacheInfo[]>([
    {
      category: '全部',
      itemCount: 500,
      memoryUsage: '18.5MB',
      hitRate: 82.3,
      lastAccess: Date.now() - 120000,
      isActive: true
    },
    {
      category: '求职经验',
      itemCount: 280,
      memoryUsage: '10.2MB',
      hitRate: 75.8,
      lastAccess: Date.now() - 300000,
      isActive: true
    },
    {
      category: '转行经历',
      itemCount: 195,
      memoryUsage: '7.1MB',
      hitRate: 68.9,
      lastAccess: Date.now() - 600000,
      isActive: false
    },
    {
      category: '就业感悟',
      itemCount: 165,
      memoryUsage: '6.0MB',
      hitRate: 71.2,
      lastAccess: Date.now() - 900000,
      isActive: false
    },
    {
      category: '职场生活',
      itemCount: 110,
      memoryUsage: '3.4MB',
      hitRate: 65.5,
      lastAccess: Date.now() - 1200000,
      isActive: false
    }
  ]);

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadStats();
    loadCategoryCache();
  }, []);

  const loadConfig = async () => {
    try {
      // 模拟API调用
      form.setFieldsValue(config);
    } catch (error) {
      message.error('加载配置失败');
    }
  };

  const loadStats = async () => {
    try {
      // 模拟API调用
      // const response = await api.getCacheStats();
      // setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadCategoryCache = async () => {
    try {
      // 模拟API调用
      // const response = await api.getCategoryCacheInfo();
      // setCategoryCache(response.data);
    } catch (error) {
      console.error('加载分类缓存信息失败:', error);
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 模拟API调用
      // await api.updateCacheConfig(values);
      
      setConfig(values);
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 清理缓存
  const handleClearCache = (category?: string) => {
    Modal.confirm({
      title: '确认清理缓存',
      content: category ? `确定要清理"${category}"分类的缓存吗？` : '确定要清理所有缓存吗？',
      onOk: async () => {
        try {
          // 模拟API调用
          // await api.clearCache(category);
          message.success('缓存清理成功');
          loadStats();
          loadCategoryCache();
        } catch (error) {
          message.error('缓存清理失败');
        }
      }
    });
  };

  // 预热缓存
  const handleWarmupCache = async () => {
    try {
      setLoading(true);
      // 模拟API调用
      // await api.warmupCache();
      message.success('缓存预热完成');
      loadStats();
      loadCategoryCache();
    } catch (error) {
      message.error('缓存预热失败');
    } finally {
      setLoading(false);
    }
  };

  // 分类缓存表格列
  const cacheColumns = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string, record: CategoryCacheInfo) => (
        <Space>
          <Text strong>{category}</Text>
          {record.isActive && <Tag color="green">活跃</Tag>}
        </Space>
      )
    },
    {
      title: '缓存项目数',
      dataIndex: 'itemCount',
      key: 'itemCount',
      render: (count: number) => (
        <Statistic value={count} />
      )
    },
    {
      title: '内存使用',
      dataIndex: 'memoryUsage',
      key: 'memoryUsage'
    },
    {
      title: '命中率',
      dataIndex: 'hitRate',
      key: 'hitRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate > 80 ? 'success' : rate > 60 ? 'active' : 'exception'}
          format={(percent) => `${percent?.toFixed(1)}%`}
        />
      )
    },
    {
      title: '最后访问',
      dataIndex: 'lastAccess',
      key: 'lastAccess',
      render: (timestamp: number) => {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        return `${minutes}分钟前`;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: CategoryCacheInfo) => (
        <Space>
          <Button 
            size="small" 
            onClick={() => handleClearCache(record.category)}
          >
            清理
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>
        <DatabaseOutlined /> 内容缓存设置
      </Title>
      <Paragraph type="secondary">
        配置内容预加载和缓存策略，优化用户浏览体验和系统性能
      </Paragraph>

      {/* 缓存状态概览 */}
      <Card title="缓存状态概览" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="缓存分类数"
              value={stats.totalCategories}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="缓存项目数"
              value={stats.totalItems}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="内存使用"
              value={stats.memoryUsage}
              prefix={<MemoryOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均加载时间"
              value={stats.averageLoadTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="缓存命中率"
                value={stats.hitRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: stats.hitRate > 80 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="缓存未命中率"
                value={stats.missRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: stats.missRate < 20 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="预加载效率"
                value={stats.preloadEfficiency}
                precision={1}
                suffix="%"
                valueStyle={{ color: stats.preloadEfficiency > 80 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 缓存配置 */}
      <Card 
        title="缓存配置" 
        extra={
          <Space>
            <Button 
              icon={<ThunderboltOutlined />} 
              onClick={handleWarmupCache}
              loading={loading}
            >
              预热缓存
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              danger 
              onClick={() => handleClearCache()}
            >
              清理所有缓存
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadStats}>
              刷新数据
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="启用内容缓存"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="listPageSize"
                label="列表页大小"
                tooltip="每页显示的内容数量"
              >
                <InputNumber min={5} max={50} />
              </Form.Item>

              <Form.Item
                name="swipeViewerInitialSize"
                label="SwipeViewer初始加载数量"
                tooltip="SwipeViewer首次加载的内容数量"
              >
                <InputNumber min={20} max={100} />
              </Form.Item>

              <Form.Item
                name="swipeViewerBatchSize"
                label="SwipeViewer批次加载数量"
                tooltip="SwipeViewer每批预加载的内容数量"
              >
                <InputNumber min={10} max={50} />
              </Form.Item>

              <Form.Item
                name="preloadThreshold"
                label="预加载触发阈值"
                tooltip="剩余多少条内容时触发预加载"
              >
                <InputNumber min={5} max={30} />
              </Form.Item>

              <Form.Item
                name="enablePreload"
                label="启用预加载"
                valuePropName="checked"
                tooltip="自动预加载下一批内容"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxItemsPerCategory"
                label="每分类最大缓存数量"
                tooltip="单个分类最多缓存的内容数量"
              >
                <InputNumber min={100} max={1000} />
              </Form.Item>

              <Form.Item
                name="maxTotalItems"
                label="总最大缓存数量"
                tooltip="所有分类总共最多缓存的内容数量"
              >
                <InputNumber min={500} max={5000} />
              </Form.Item>

              <Form.Item
                name="cacheDuration"
                label="缓存有效期(分钟)"
                tooltip="缓存数据的有效时间"
              >
                <InputNumber 
                  min={5} 
                  max={120} 
                  formatter={(value) => `${value} 分钟`}
                  parser={(value) => value?.replace(' 分钟', '') as any}
                />
              </Form.Item>

              <Form.Item
                name="enableDeduplication"
                label="启用去重"
                valuePropName="checked"
                tooltip="自动去除重复内容"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="autoCleanup"
                label="自动清理过期缓存"
                valuePropName="checked"
                tooltip="定期自动清理过期的缓存数据"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="cleanupInterval"
                label="清理间隔(小时)"
                tooltip="自动清理的时间间隔"
              >
                <InputNumber 
                  min={1} 
                  max={24} 
                  formatter={(value) => `${value} 小时`}
                  parser={(value) => value?.replace(' 小时', '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button type="primary" loading={loading} onClick={handleSave}>
              <SettingOutlined /> 保存配置
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form>
      </Card>

      {/* 分类缓存详情 */}
      <Card title="分类缓存详情" style={{ marginBottom: 24 }}>
        <Alert
          message="缓存监控"
          description="实时监控各分类的缓存使用情况，可以针对性地进行缓存管理"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={cacheColumns}
          dataSource={categoryCache}
          rowKey="category"
          size="small"
          pagination={false}
        />
      </Card>

      {/* 性能建议 */}
      <Card title="性能优化建议">
        <Space direction="vertical" style={{ width: '100%' }}>
          {stats.hitRate < 70 && (
            <Alert
              message="缓存命中率偏低"
              description="建议增加缓存大小或调整预加载策略以提高命中率"
              type="warning"
              showIcon
            />
          )}
          
          {stats.averageLoadTime > 500 && (
            <Alert
              message="加载时间较长"
              description="建议启用预加载功能或增加预加载数量以减少等待时间"
              type="warning"
              showIcon
            />
          )}
          
          {parseFloat(stats.memoryUsage) > 80 && (
            <Alert
              message="内存使用较高"
              description="建议减少缓存大小或启用自动清理功能"
              type="warning"
              showIcon
            />
          )}
          
          {stats.preloadEfficiency > 90 && (
            <Alert
              message="预加载效率优秀"
              description="当前预加载策略运行良好，用户体验较佳"
              type="success"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

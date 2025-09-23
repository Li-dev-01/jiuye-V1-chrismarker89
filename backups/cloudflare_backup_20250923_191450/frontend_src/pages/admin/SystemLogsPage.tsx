import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Tag, 
  Typography, 
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Input,
  Modal,
  Tooltip
} from 'antd';
import { 
  FileTextOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import styles from './AdminPages.module.css';
import dayjs from 'dayjs';
import { AdminService } from '../../services/adminService';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: string;
  action: string;
  userId?: string;
  username?: string;
  ip: string;
  userAgent: string;
  message: string;
  details?: any;
}

export const SystemLogsPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');

  // 加载系统日志数据
  const loadSystemLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        pageSize: 100
      };

      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      if (levelFilter !== 'all') {
        params.level = levelFilter;
      }

      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      if (searchText) {
        params.search = searchText;
      }

      const response = await AdminService.getSystemLogs(params);
      const formattedLogs = response.items.map((item: any) => ({
        id: item.id.toString(),
        timestamp: item.timestamp,
        level: item.level,
        category: item.category,
        action: item.action,
        userId: item.source === 'admin_operation' ? 'admin' : 'system',
        username: item.username,
        ip: item.ip_address || 'unknown',
        userAgent: item.user_agent || 'unknown',
        message: item.message,
        details: { source: item.source }
      }));

      setLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
    } catch (error) {
      console.error('加载系统日志失败:', error);
      // 模拟数据已清理 - 显示空状态
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadSystemLogs();
  }, []);

  // 当筛选条件改变时重新加载数据
  useEffect(() => {
    loadSystemLogs();
  }, [dateRange, levelFilter, categoryFilter, searchText]);

  const getLevelTag = (level: string) => {
    switch (level) {
      case 'info':
        return <Tag className={styles.levelInfo} icon={<InfoCircleOutlined />}>信息</Tag>;
      case 'warn':
        return <Tag className={styles.levelWarn} icon={<ExclamationCircleOutlined />}>警告</Tag>;
      case 'error':
        return <Tag className={styles.levelError} icon={<CloseCircleOutlined />}>错误</Tag>;
      case 'success':
        return <Tag className={styles.levelSuccess} icon={<CheckCircleOutlined />}>成功</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'auth': '认证',
      'review': '审核',
      'admin': '管理',
      'security': '安全',
      'system': '系统',
      'api': 'API',
      'data': '数据'
    };
    return categoryMap[category] || category;
  };

  const handleViewDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleRefresh = () => {
    loadSystemLogs();
  };

  const handleExport = () => {
    // 模拟导出功能
    console.log('导出日志:', filteredLogs);
  };

  const resetFilters = () => {
    setDateRange(null);
    setLevelFilter('all');
    setCategoryFilter('all');
    setSearchText('');
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      sorter: (a: LogEntry, b: LogEntry) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend' as const
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => getLevelTag(level)
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category: string) => (
        <Tag color="blue">{getCategoryName(category)}</Tag>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      ellipsis: true
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_, record: LogEntry) => (
        record.username ? (
          <Space>
            <UserOutlined />
            <Text>{record.username}</Text>
          </Space>
        ) : (
          <Text type="secondary">系统</Text>
        )
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <Tooltip title={message}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {message}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record: LogEntry) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          size="small"
        >
          详情
        </Button>
      )
    }
  ];

  // 统计数据
  const stats = {
    total: filteredLogs.length,
    info: filteredLogs.filter(log => log.level === 'info').length,
    warn: filteredLogs.filter(log => log.level === 'warn').length,
    error: filteredLogs.filter(log => log.level === 'error').length,
    success: filteredLogs.filter(log => log.level === 'success').length
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <FileTextOutlined /> 系统日志
          </Title>
          <Paragraph>
            查看系统运行日志，监控用户操作和系统状态。
          </Paragraph>
        </div>

        {/* 筛选器 */}
        <Card title="筛选条件" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>日期范围</Text>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>日志级别</Text>
                <Select
                  value={levelFilter}
                  onChange={setLevelFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部级别</Option>
                  <Option value="info">信息</Option>
                  <Option value="success">成功</Option>
                  <Option value="warn">警告</Option>
                  <Option value="error">错误</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>分类</Text>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部分类</Option>
                  <Option value="auth">认证</Option>
                  <Option value="review">审核</Option>
                  <Option value="admin">管理</Option>
                  <Option value="security">安全</Option>
                  <Option value="system">系统</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>搜索</Text>
                <Search
                  placeholder="搜索消息、操作或用户"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Space style={{ marginTop: 24 }}>
                <Button onClick={resetFilters}>重置</Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总日志数"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="错误日志"
                value={stats.error}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="警告日志"
                value={stats.warn}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="成功日志"
                value={stats.success}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 日志列表 */}
        <Card 
          title="系统日志"
          extra={
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出日志
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
          />
        </Card>

        {/* 日志详情弹窗 */}
        <Modal
          title="日志详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={700}
          destroyOnHidden
        >
          {selectedLog && (
            <div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>时间：</Text>
                    <Text>{selectedLog.timestamp}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>级别：</Text>
                    {getLevelTag(selectedLog.level)}
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>分类：</Text>
                    <Tag color="blue">{getCategoryName(selectedLog.category)}</Tag>
                  </Col>
                  <Col span={12}>
                    <Text strong>操作：</Text>
                    <Text>{selectedLog.action}</Text>
                  </Col>
                </Row>

                {selectedLog.username && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>用户：</Text>
                      <Text>{selectedLog.username}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>用户ID：</Text>
                      <Text code>{selectedLog.userId}</Text>
                    </Col>
                  </Row>
                )}

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>IP地址：</Text>
                    <Text code>{selectedLog.ip}</Text>
                  </Col>
                </Row>

                <div>
                  <Text strong>消息：</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                    {selectedLog.message}
                  </div>
                </div>

                <div>
                  <Text strong>User Agent：</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4, fontSize: '12px' }}>
                    {selectedLog.userAgent}
                  </div>
                </div>

                {selectedLog.details && (
                  <div>
                    <Text strong>详细信息：</Text>
                    <div className={styles.logContent}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </div>
                  </div>
                )}
              </Space>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

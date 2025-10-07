/**
 * 超级管理员系统日志页面
 * 系统日志查看、操作记录、安全事件
 */

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
  Tooltip,
  Alert,
  message
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
  ClockCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { superAdminApiService, SystemLog, SystemLogsQuery } from '../services/superAdminApiService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// 使用API服务的SystemLog接口，并添加本地扩展
interface LogEntry extends SystemLog {
  action: string;
  userId?: string;
  details?: any;
}

const SuperAdminSystemLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');

  // 模拟日志数据
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2025-09-25 16:30:15',
      level: 'error',
      category: '安全事件',
      source: 'security_system',
      action: 'IP封禁',
      userId: 'superadmin',
      username: '超级管理员',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...',
      message: '检测到DDoS攻击，自动封禁IP: 192.168.1.100',
      details: { threat_score: 95, request_count: 1250 }
    },
    {
      id: '2',
      timestamp: '2025-09-25 16:25:30',
      level: 'warn',
      category: '登录监控',
      source: 'auth_system',
      action: '登录失败',
      ip_address: '10.0.0.50',
      user_agent: 'curl/7.68.0',
      message: '管理员登录失败，IP: 10.0.0.50',
      details: { attempt_count: 5, reason: '密码错误' }
    },
    {
      id: '3',
      timestamp: '2025-09-25 16:20:45',
      level: 'info',
      category: '系统操作',
      source: 'admin_panel',
      action: '配置更新',
      userId: 'admin1',
      username: '管理员1',
      ip_address: '192.168.1.10',
      user_agent: 'Mozilla/5.0...',
      message: '更新系统配置: 最大登录尝试次数',
      details: { old_value: 3, new_value: 5 }
    },
    {
      id: '4',
      timestamp: '2025-09-25 16:15:20',
      level: 'success',
      category: '用户管理',
      source: 'admin_panel',
      action: '用户创建',
      userId: 'admin1',
      username: '管理员1',
      ip_address: '192.168.1.10',
      user_agent: 'Mozilla/5.0...',
      message: '创建新用户: reviewer2',
      details: { user_role: 'reviewer', created_by: 'admin1' }
    },
    {
      id: '5',
      timestamp: '2025-09-25 16:10:10',
      level: 'error',
      category: '系统错误',
      source: 'api_server',
      action: 'API错误',
      ip_address: '192.168.1.20',
      user_agent: 'axios/0.21.1',
      message: 'API调用失败: /api/admin/users',
      details: { error_code: 500, error_message: '数据库连接超时' }
    }
  ];

  // 加载系统日志数据
  const loadSystemLogs = async () => {
    try {
      setLoading(true);

      const query: SystemLogsQuery = {
        page: 1,
        pageSize: 100,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchText || undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const response = await superAdminApiService.getSystemLogs(query);

      // 转换API数据格式到本地格式
      const localLogs: LogEntry[] = response.items.map(log => ({
        ...log,
        action: log.action || log.message,
        userId: log.username,
        ip: log.ip_address || 'unknown',
        userAgent: log.user_agent || 'unknown'
      }));

      setLogs(localLogs);
      setFilteredLogs(localLogs);
    } catch (error) {
      console.error('加载系统日志失败:', error);
      message.error('加载系统日志失败');
      // 使用模拟数据作为后备
      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadSystemLogs();
  }, []);

  // 筛选条件变化时重新加载数据
  useEffect(() => {
    loadSystemLogs();
  }, [levelFilter, categoryFilter, searchText, dateRange]);

  // 过滤日志
  useEffect(() => {
    let filtered = [...logs];

    // 日期范围过滤
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(log => {
        const logDate = dayjs(log.timestamp);
        return logDate.isAfter(start.startOf('day')) && logDate.isBefore(end.endOf('day'));
      });
    }

    // 级别过滤
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.username?.toLowerCase().includes(searchLower) ||
        log.ip_address?.includes(searchText)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, dateRange, levelFilter, categoryFilter, searchText]);

  // 获取日志级别图标
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warn': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'info': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  // 获取日志级别颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'red';
      case 'warn': return 'orange';
      case 'info': return 'blue';
      case 'success': return 'green';
      default: return 'default';
    }
  };

  // 导出日志
  const handleExport = async () => {
    try {
      setCopyLoading(true);
      const exportData = filteredLogs.map(log => ({
        时间: log.timestamp,
        级别: log.level.toUpperCase(),
        分类: log.category,
        操作: log.action,
        用户: log.username || '系统',
        IP地址: log.ip_address,
        消息: log.message
      }));

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      // 复制到剪贴板
      await navigator.clipboard.writeText(csvContent);
      message.success('日志数据已复制到剪贴板');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setCopyLoading(false);
    }
  };

  // 复制日志详情
  const handleCopyLogDetails = async (log: LogEntry) => {
    try {
      const logDetails = `
系统日志详情
============
时间: ${log.timestamp}
级别: ${log.level.toUpperCase()}
分类: ${log.category}
操作: ${log.action}
用户: ${log.username || '系统'}
用户ID: ${log.userId || 'N/A'}
IP地址: ${log.ip_address}
用户代理: ${log.user_agent}
消息: ${log.message}
详细信息: ${JSON.stringify(log.details, null, 2)}
      `.trim();

      await navigator.clipboard.writeText(logDetails);
      message.success('日志详情已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<LogEntry> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      render: (timestamp) => (
        <Tooltip title={timestamp}>
          <Text code>{dayjs(timestamp).format('MM-DD HH:mm:ss')}</Text>
        </Tooltip>
      )
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      filters: [
        { text: 'ERROR', value: 'error' },
        { text: 'WARN', value: 'warn' },
        { text: 'INFO', value: 'info' },
        { text: 'SUCCESS', value: 'success' }
      ],
      onFilter: (value, record) => record.level === value,
      render: (level) => (
        <Tag color={getLevelColor(level)} icon={getLevelIcon(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      filters: [
        { text: '安全事件', value: '安全事件' },
        { text: '登录监控', value: '登录监控' },
        { text: '系统操作', value: '系统操作' },
        { text: '用户管理', value: '用户管理' },
        { text: '系统错误', value: '系统错误' }
      ],
      onFilter: (value, record) => record.category === value,
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => <Tag>{action}</Tag>
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text>{record.username || '系统'}</Text>
        </Space>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (ip) => <Text code>{ip}</Text>
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: { showTitle: false },
      render: (message) => (
        <Tooltip title={message}>
          <Text>{message}</Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyLogDetails(record)}
          >
            复制
          </Button>
        </Space>
      )
    }
  ];

  // 统计数据
  const logStats = {
    total: filteredLogs.length,
    error: filteredLogs.filter(log => log.level === 'error').length,
    warn: filteredLogs.filter(log => log.level === 'warn').length,
    info: filteredLogs.filter(log => log.level === 'info').length,
    success: filteredLogs.filter(log => log.level === 'success').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined /> 系统日志
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadSystemLogs}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={handleExport}
            loading={copyLoading}
          >
            导出日志
          </Button>
        </Space>
      </div>

      <Alert
        message="系统日志监控"
        description="查看系统操作日志、安全事件记录和错误信息。支持按时间、级别、分类筛选和搜索。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={logStats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误日志"
              value={logStats.error}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告日志"
              value={logStats.warn}
              valueStyle={{ color: '#d48806' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="信息日志"
              value={logStats.info + logStats.success}
              valueStyle={{ color: '#389e0d' }}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选控件 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="日志级别"
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部级别</Option>
              <Option value="error">ERROR</Option>
              <Option value="warn">WARN</Option>
              <Option value="info">INFO</Option>
              <Option value="success">SUCCESS</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="日志分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部分类</Option>
              <Option value="安全事件">安全事件</Option>
              <Option value="登录监控">登录监控</Option>
              <Option value="系统操作">系统操作</Option>
              <Option value="用户管理">用户管理</Option>
              <Option value="系统错误">系统错误</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Search
              placeholder="搜索日志内容、用户、IP..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              enterButton={<SearchOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 日志列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            日志详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => selectedLog && handleCopyLogDetails(selectedLog)}>
            复制详情
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>时间:</Text> {selectedLog.timestamp}
              </Col>
              <Col span={12}>
                <Text strong>级别:</Text> 
                <Tag color={getLevelColor(selectedLog.level)} style={{ marginLeft: 8 }}>
                  {selectedLog.level.toUpperCase()}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>分类:</Text> {selectedLog.category}
              </Col>
              <Col span={12}>
                <Text strong>操作:</Text> {selectedLog.action}
              </Col>
              <Col span={12}>
                <Text strong>用户:</Text> {selectedLog.username || '系统'}
              </Col>
              <Col span={12}>
                <Text strong>IP地址:</Text> <Text code>{selectedLog.ip_address}</Text>
              </Col>
              <Col span={24}>
                <Text strong>用户代理:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text code>{selectedLog.user_agent}</Text>
                </div>
              </Col>
              <Col span={24}>
                <Text strong>消息:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text>{selectedLog.message}</Text>
                </div>
              </Col>
              {selectedLog.details && (
                <Col span={24}>
                  <Text strong>详细信息:</Text>
                  <div style={{ marginTop: 4 }}>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminSystemLogs;

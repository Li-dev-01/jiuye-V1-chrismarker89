/**
 * 用户内容管理页面
 * 用于管理用户提交的问卷、心声、故事等内容
 * 支持IP地址筛选、批量删除、重复检测等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Alert,
  Descriptions,
  Typography,
  Tabs,
  Badge,
  Popconfirm,
  Checkbox,
  Form,
  Divider
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  FlagOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  UserOutlined,
  GlobalOutlined,
  FileTextOutlined,
  HeartOutlined,
  BookOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import userContentManagementService, {
  type UserContentRecord,
  type ContentFilterParams,
  type ContentSearchResult,
  type DuplicateDetectionResult,
  type IpStatistics,
  type ContentStatistics,
  ContentType
} from '../../services/userContentManagementService';
import styles from './UserContentManagementPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { TextArea } = Input;

const UserContentManagementPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [contentRecords, setContentRecords] = useState<UserContentRecord[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState<ContentFilterParams>({
    page: 1,
    pageSize: 20,
    status: 'active'
  });

  // 搜索相关
  const [searchResults, setSearchResults] = useState<ContentSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 重复检测
  const [duplicates, setDuplicates] = useState<DuplicateDetectionResult[]>([]);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  // IP统计
  const [ipStats, setIpStats] = useState<IpStatistics[]>([]);
  const [ipStatsLoading, setIpStatsLoading] = useState(false);

  // 统计数据
  const [statistics, setStatistics] = useState<ContentStatistics | null>(null);

  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserContentRecord | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);

  // 表单
  const [searchForm] = Form.useForm();
  const [batchDeleteForm] = Form.useForm();

  // 当前活动标签
  const [activeTab, setActiveTab] = useState('content-list');

  // 初始化加载
  useEffect(() => {
    loadContentList();
    loadStatistics();
  }, [filters]);

  /**
   * 加载内容列表
   */
  const loadContentList = async () => {
    setLoading(true);
    try {
      const result = await userContentManagementService.getUserContentList(filters);
      setContentRecords(result.records);
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total
      });
    } catch (error) {
      message.error('加载内容列表失败');
      console.error('加载内容列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const stats = await userContentManagementService.getContentStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  /**
   * 处理筛选条件变化
   */
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
  };

  /**
   * 处理分页变化
   */
  const handleTableChange = (pagination: any) => {
    const newFilters = {
      ...filters,
      page: pagination.current,
      pageSize: pagination.pageSize
    };
    setFilters(newFilters);
  };

  /**
   * 处理行选择
   */
  const handleRowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    onSelectAll: (selected: boolean, selectedRows: UserContentRecord[], changeRows: UserContentRecord[]) => {
      console.log('全选状态:', selected, selectedRows, changeRows);
    }
  };

  /**
   * 查看详情
   */
  const handleViewDetail = (record: UserContentRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  /**
   * 复制内容
   */
  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('内容已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  /**
   * 内容搜索
   */
  const handleContentSearch = async (values: any) => {
    setSearchLoading(true);
    try {
      const result = await userContentManagementService.searchUsersByContent(
        values.keyword,
        values.contentType,
        values.exactMatch
      );
      setSearchResults(result.results);
      message.success(`找到 ${result.total} 条相关内容`);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * 重复检测
   */
  const handleDuplicateDetection = async (type: 'ip' | 'user' | 'content', threshold = 2) => {
    setDuplicateLoading(true);
    try {
      const result = await userContentManagementService.detectDuplicates(type, threshold);
      setDuplicates(result.duplicates);
      message.success(`检测到 ${result.total} 组重复数据`);
    } catch (error) {
      message.error('重复检测失败');
      console.error('重复检测失败:', error);
    } finally {
      setDuplicateLoading(false);
    }
  };

  /**
   * 加载IP统计
   */
  const loadIpStatistics = async () => {
    setIpStatsLoading(true);
    try {
      const result = await userContentManagementService.getIpStatistics();
      setIpStats(result.ipStats);
    } catch (error) {
      message.error('加载IP统计失败');
      console.error('加载IP统计失败:', error);
    } finally {
      setIpStatsLoading(false);
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async (values: any) => {
    try {
      const params: any = {
        reason: values.reason || '管理员批量删除'
      };

      if (values.deleteType === 'selected' && selectedRowKeys.length > 0) {
        params.ids = selectedRowKeys;
      } else if (values.deleteType === 'ip' && values.ipAddress) {
        params.ipAddress = values.ipAddress;
      } else if (values.deleteType === 'user' && values.userId) {
        params.userId = values.userId;
      } else {
        message.error('请选择有效的删除条件');
        return;
      }

      const result = await userContentManagementService.batchDeleteContent(params);
      message.success(`批量删除成功，共删除 ${result.deletedCount} 条记录`);
      
      setBatchDeleteModalVisible(false);
      batchDeleteForm.resetFields();
      setSelectedRowKeys([]);
      loadContentList();
      
    } catch (error) {
      message.error('批量删除失败');
      console.error('批量删除失败:', error);
    }
  };

  /**
   * 标记可疑内容
   */
  const handleFlagSuspicious = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要标记的内容');
      return;
    }

    Modal.confirm({
      title: '标记可疑内容',
      content: `确定要标记选中的 ${selectedRowKeys.length} 条内容为可疑吗？`,
      onOk: async () => {
        try {
          const result = await userContentManagementService.flagSuspiciousContent(
            selectedRowKeys as string[],
            '管理员手动标记'
          );
          message.success(`标记成功，共标记 ${result.flaggedCount} 条记录`);
          setSelectedRowKeys([]);
          loadContentList();
        } catch (error) {
          message.error('标记失败');
          console.error('标记失败:', error);
        }
      }
    });
  };

  /**
   * 导出数据
   */
  const handleExportData = async () => {
    try {
      const blob = await userContentManagementService.exportContentData(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-content-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('数据导出成功');
    } catch (error) {
      message.error('数据导出失败');
      console.error('数据导出失败:', error);
    }
  };

  // 获取内容类型标签
  const getContentTypeTag = (type: ContentType) => {
    const typeMap = {
      [ContentType.QUESTIONNAIRE]: { color: 'blue', icon: <FileTextOutlined />, text: '问卷' },
      [ContentType.HEART_VOICE]: { color: 'green', icon: <HeartOutlined />, text: '心声' },
      [ContentType.STORY]: { color: 'orange', icon: <BookOutlined />, text: '故事' }
    };
    const config = typeMap[type];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '正常' },
      deleted: { color: 'red', text: '已删除' },
      flagged: { color: 'orange', text: '已标记' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type: ContentType) => getContentTypeTag(type)
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (record: UserContentRecord) => (
        <div>
          <div>
            <UserOutlined style={{ marginRight: 4 }} />
            <Text code style={{ fontSize: '12px' }}>
              {record.user_id.length > 12 ? `${record.user_id.substring(0, 12)}...` : record.user_id}
            </Text>
          </div>
          {record.ip_address && (
            <div style={{ marginTop: 2 }}>
              <GlobalOutlined style={{ marginRight: 4 }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.ip_address}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: '内容摘要',
      dataIndex: 'content_summary',
      key: 'content_summary',
      ellipsis: {
        showTitle: false
      },
      render: (summary: string, record: UserContentRecord) => (
        <Tooltip title={summary} placement="topLeft">
          <div style={{ maxWidth: 300 }}>
            {summary}
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyContent(record.content)}
              style={{ padding: 0, marginLeft: 8 }}
            />
          </div>
        </Tooltip>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 160,
      render: (time: string) => (
        <div style={{ fontSize: '12px' }}>
          {new Date(time).toLocaleString()}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (record: UserContentRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这条内容吗？',
                onOk: () => handleBatchDelete({ deleteType: 'selected', ids: [record.id], reason: '单条删除' })
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <Title level={2} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            用户内容管理
          </Title>
          <Text type="secondary">
            管理用户提交的问卷、心声、故事等内容，支持IP筛选、批量操作、重复检测
          </Text>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="问卷总数"
                  value={statistics.contentStats.questionnaires}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="心声总数"
                  value={statistics.contentStats.heartVoices}
                  prefix={<HeartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="故事总数"
                  value={statistics.contentStats.stories}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日提交"
                  value={statistics.todayStats.today_submissions}
                  prefix={<GlobalOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 主要内容区域 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="内容列表" key="content-list">
            <Card>
              {/* 筛选工具栏 */}
              <div className={styles.filterBar}>
                <Space wrap>
                  <Select
                    placeholder="内容类型"
                    style={{ width: 120 }}
                    allowClear
                    value={filters.contentType}
                    onChange={(value) => handleFilterChange('contentType', value)}
                  >
                    <Option value={ContentType.QUESTIONNAIRE}>问卷</Option>
                    <Option value={ContentType.HEART_VOICE}>心声</Option>
                    <Option value={ContentType.STORY}>故事</Option>
                  </Select>

                  <Input
                    placeholder="用户ID"
                    style={{ width: 150 }}
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    prefix={<UserOutlined />}
                  />

                  <Input
                    placeholder="IP地址"
                    style={{ width: 150 }}
                    value={filters.ipAddress}
                    onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                    prefix={<GlobalOutlined />}
                  />

                  <Search
                    placeholder="搜索内容关键词"
                    style={{ width: 200 }}
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    onSearch={() => loadContentList()}
                  />

                  <RangePicker
                    onChange={(dates) => {
                      if (dates) {
                        handleFilterChange('startDate', dates[0]?.toISOString());
                        handleFilterChange('endDate', dates[1]?.toISOString());
                      } else {
                        handleFilterChange('startDate', undefined);
                        handleFilterChange('endDate', undefined);
                      }
                    }}
                  />

                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadContentList}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </Space>
              </div>

              {/* 批量操作工具栏 */}
              <div className={styles.batchActions}>
                <Space>
                  <Text>
                    已选择 <Badge count={selectedRowKeys.length} /> 项
                  </Text>
                  
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => setBatchDeleteModalVisible(true)}
                  >
                    批量删除
                  </Button>

                  <Button
                    icon={<FlagOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleFlagSuspicious}
                  >
                    标记可疑
                  </Button>

                  <Button
                    icon={<SearchOutlined />}
                    onClick={() => setSearchModalVisible(true)}
                  >
                    内容搜索
                  </Button>

                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleExportData}
                  >
                    导出数据
                  </Button>
                </Space>
              </div>

              {/* 内容列表表格 */}
              <Table
                columns={columns}
                dataSource={contentRecords}
                rowKey="id"
                loading={loading}
                rowSelection={handleRowSelection}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
                onChange={handleTableChange}
                scroll={{ x: 1200 }}
              />
            </Card>
          </TabPane>

          <TabPane tab="重复检测" key="duplicate-detection">
            <Card title="重复提交检测">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="重复检测说明"
                  description="检测相同IP地址、用户ID或相似内容的重复提交，帮助识别恶意数据污染。"
                  type="info"
                  showIcon
                />

                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleDuplicateDetection('ip')}
                    loading={duplicateLoading}
                  >
                    按IP检测
                  </Button>
                  <Button
                    onClick={() => handleDuplicateDetection('user')}
                    loading={duplicateLoading}
                  >
                    按用户检测
                  </Button>
                  <Button
                    onClick={() => handleDuplicateDetection('content')}
                    loading={duplicateLoading}
                  >
                    按内容检测
                  </Button>
                </Space>

                {duplicates.length > 0 && (
                  <Table
                    dataSource={duplicates}
                    rowKey={(record, index) => `${record.type}-${index}`}
                    columns={[
                      {
                        title: '标识符',
                        dataIndex: 'identifier',
                        key: 'identifier',
                        render: (text: string) => <Text code>{text}</Text>
                      },
                      {
                        title: '重复次数',
                        dataIndex: 'count',
                        key: 'count',
                        render: (count: number) => <Badge count={count} style={{ backgroundColor: '#f50' }} />
                      },
                      {
                        title: '首次提交',
                        dataIndex: 'first_submission',
                        key: 'first_submission',
                        render: (time: string) => new Date(time).toLocaleString()
                      },
                      {
                        title: '最后提交',
                        dataIndex: 'last_submission',
                        key: 'last_submission',
                        render: (time: string) => new Date(time).toLocaleString()
                      },
                      {
                        title: '操作',
                        key: 'actions',
                        render: (record: DuplicateDetectionResult) => (
                          <Space>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => {
                                // 根据标识符筛选内容
                                if (record.type === 'ip') {
                                  handleFilterChange('ipAddress', record.identifier);
                                } else if (record.type === 'user') {
                                  handleFilterChange('userId', record.identifier);
                                }
                                setActiveTab('content-list');
                              }}
                            >
                              查看详情
                            </Button>
                            <Popconfirm
                              title="确定要删除这些重复内容吗？"
                              onConfirm={() => {
                                const ids = record.content_ids.split(',');
                                handleBatchDelete({
                                  deleteType: 'selected',
                                  ids,
                                  reason: `重复内容删除: ${record.identifier}`
                                });
                              }}
                            >
                              <Button type="link" size="small" danger>
                                批量删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                    pagination={false}
                  />
                )}
              </Space>
            </Card>
          </TabPane>

          <TabPane tab="IP统计" key="ip-statistics">
            <Card
              title="IP地址统计"
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadIpStatistics}
                  loading={ipStatsLoading}
                >
                  刷新
                </Button>
              }
            >
              <Table
                dataSource={ipStats}
                rowKey="ip_address"
                loading={ipStatsLoading}
                columns={[
                  {
                    title: 'IP地址',
                    dataIndex: 'ip_address',
                    key: 'ip_address',
                    render: (ip: string) => <Text code>{ip}</Text>
                  },
                  {
                    title: '提交次数',
                    dataIndex: 'submission_count',
                    key: 'submission_count',
                    sorter: (a, b) => a.submission_count - b.submission_count,
                    render: (count: number) => (
                      <Badge
                        count={count}
                        style={{
                          backgroundColor: count > 10 ? '#f50' : count > 5 ? '#fa8c16' : '#52c41a'
                        }}
                      />
                    )
                  },
                  {
                    title: '唯一用户',
                    dataIndex: 'unique_users',
                    key: 'unique_users',
                    sorter: (a, b) => a.unique_users - b.unique_users
                  },
                  {
                    title: '首次提交',
                    dataIndex: 'first_submission',
                    key: 'first_submission',
                    render: (time: string) => new Date(time).toLocaleString()
                  },
                  {
                    title: '最后提交',
                    dataIndex: 'last_submission',
                    key: 'last_submission',
                    render: (time: string) => new Date(time).toLocaleString()
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    render: (record: IpStatistics) => (
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => {
                            handleFilterChange('ipAddress', record.ip_address);
                            setActiveTab('content-list');
                          }}
                        >
                          查看内容
                        </Button>
                        {record.submission_count > 5 && (
                          <Popconfirm
                            title={`确定要删除IP ${record.ip_address} 的所有内容吗？`}
                            onConfirm={() => {
                              handleBatchDelete({
                                deleteType: 'ip',
                                ipAddress: record.ip_address,
                                reason: `高频IP删除: ${record.submission_count}次提交`
                              });
                            }}
                          >
                            <Button type="link" size="small" danger>
                              批量删除
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    )
                  }
                ]}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
              />
            </Card>
          </TabPane>
        </Tabs>

        {/* 详情模态框 */}
        <Modal
          title="内容详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="copy" onClick={() => selectedRecord && handleCopyContent(selectedRecord.content)}>
              复制内容
            </Button>,
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={800}
        >
          {selectedRecord && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="内容类型">
                {getContentTypeTag(selectedRecord.content_type)}
              </Descriptions.Item>
              <Descriptions.Item label="内容ID">
                <Text code>{selectedRecord.content_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                <Text code>{selectedRecord.user_id}</Text>
              </Descriptions.Item>
              {selectedRecord.ip_address && (
                <Descriptions.Item label="IP地址">
                  <Text code>{selectedRecord.ip_address}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="提交时间">
                {new Date(selectedRecord.submitted_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="完整内容">
                <div style={{ maxHeight: 300, overflow: 'auto', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                    {selectedRecord.content}
                  </pre>
                </div>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 内容搜索模态框 */}
        <Modal
          title="内容搜索"
          open={searchModalVisible}
          onCancel={() => setSearchModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={searchForm}
            layout="vertical"
            onFinish={handleContentSearch}
          >
            <Form.Item
              name="keyword"
              label="搜索关键词"
              rules={[{ required: true, message: '请输入搜索关键词' }]}
            >
              <Input placeholder="输入要搜索的内容关键词" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="contentType" label="内容类型">
                  <Select placeholder="选择内容类型" allowClear>
                    <Option value={ContentType.QUESTIONNAIRE}>问卷</Option>
                    <Option value={ContentType.HEART_VOICE}>心声</Option>
                    <Option value={ContentType.STORY}>故事</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="exactMatch" label="匹配方式" valuePropName="checked">
                  <Checkbox>精确匹配</Checkbox>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={searchLoading}>
                  搜索
                </Button>
                <Button onClick={() => searchForm.resetFields()}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {searchResults.length > 0 && (
            <>
              <Divider />
              <Table
                dataSource={searchResults}
                rowKey={(record, index) => `${record.content_type}-${record.content_id}-${index}`}
                columns={[
                  {
                    title: '类型',
                    dataIndex: 'content_type',
                    key: 'content_type',
                    render: (type: ContentType) => getContentTypeTag(type)
                  },
                  {
                    title: '用户ID',
                    dataIndex: 'user_id',
                    key: 'user_id',
                    render: (id: string) => <Text code>{id}</Text>
                  },
                  {
                    title: '内容摘要',
                    dataIndex: 'content',
                    key: 'content',
                    ellipsis: true,
                    render: (content: string) => content.substring(0, 100) + '...'
                  },
                  {
                    title: '提交时间',
                    dataIndex: 'submitted_at',
                    key: 'submitted_at',
                    render: (time: string) => new Date(time).toLocaleString()
                  }
                ]}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </>
          )}
        </Modal>

        {/* 批量删除模态框 */}
        <Modal
          title="批量删除"
          open={batchDeleteModalVisible}
          onCancel={() => setBatchDeleteModalVisible(false)}
          footer={null}
          width={600}
        >
          <Alert
            message="危险操作"
            description="批量删除操作不可撤销，请谨慎操作。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form
            form={batchDeleteForm}
            layout="vertical"
            onFinish={handleBatchDelete}
          >
            <Form.Item
              name="deleteType"
              label="删除方式"
              rules={[{ required: true, message: '请选择删除方式' }]}
            >
              <Select placeholder="选择删除方式">
                <Option value="selected" disabled={selectedRowKeys.length === 0}>
                  删除选中项 ({selectedRowKeys.length} 项)
                </Option>
                <Option value="ip">按IP地址删除</Option>
                <Option value="user">按用户ID删除</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.deleteType !== currentValues.deleteType}
            >
              {({ getFieldValue }) => {
                const deleteType = getFieldValue('deleteType');
                if (deleteType === 'ip') {
                  return (
                    <Form.Item
                      name="ipAddress"
                      label="IP地址"
                      rules={[{ required: true, message: '请输入IP地址' }]}
                    >
                      <Input placeholder="输入要删除的IP地址" />
                    </Form.Item>
                  );
                } else if (deleteType === 'user') {
                  return (
                    <Form.Item
                      name="userId"
                      label="用户ID"
                      rules={[{ required: true, message: '请输入用户ID' }]}
                    >
                      <Input placeholder="输入要删除的用户ID" />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              name="reason"
              label="删除原因"
              rules={[{ required: true, message: '请输入删除原因' }]}
            >
              <TextArea rows={3} placeholder="请说明删除原因，此信息将记录在操作日志中" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" danger htmlType="submit">
                  确认删除
                </Button>
                <Button onClick={() => setBatchDeleteModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default UserContentManagementPage;

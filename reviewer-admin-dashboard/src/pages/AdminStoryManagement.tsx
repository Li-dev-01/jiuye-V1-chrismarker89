import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiClient } from '../services/apiClient';
import { STORAGE_KEYS } from '../config/api';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Story {
  id: number;
  dataUuid: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  auditStatus: string;
  likeCount: number;
  dislikeCount: number;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt: string;
}

const AdminStoryManagement: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 搜索条件
  const [keyword, setKeyword] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // 详情模态框
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    fetchStories();
  }, [pagination.current, pagination.pageSize]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };

      if (keyword) params.keyword = keyword;
      if (username) params.username = username;
      if (category) params.category = category;
      if (status) params.status = status;
      if (dateRange[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');

      const response = await apiClient.get('/api/simple-admin/content/stories', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStories(response.data.data.stories);
        setPagination({
          ...pagination,
          total: response.data.data.pagination.total
        });
      } else {
        message.error('获取故事列表失败');
      }
    } catch (error) {
      console.error('获取故事列表失败:', error);
      message.error('获取故事列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchStories();
  };

  const handleReset = () => {
    setKeyword('');
    setUsername('');
    setCategory('');
    setStatus('');
    setDateRange([null, null]);
    setPagination({ ...pagination, current: 1 });
    setTimeout(() => fetchStories(), 100);
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      
      const response = await apiClient.delete(`/api/simple-admin/content/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        message.success('删除成功');
        fetchStories();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除故事失败:', error);
      message.error('删除故事失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的故事');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 个故事吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
          
          const response = await apiClient.post('/api/simple-admin/content/stories/batch-delete', {
            ids: selectedRowKeys
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.data.success) {
            message.success(`成功删除 ${selectedRowKeys.length} 个故事`);
            setSelectedRowKeys([]);
            fetchStories();
          } else {
            message.error('批量删除失败');
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      }
    });
  };

  const handleViewDetail = (story: Story) => {
    setSelectedStory(story);
    setDetailModalVisible(true);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'approved': { color: 'success', text: '已通过' },
      'pending': { color: 'warning', text: '待审核' },
      'rejected': { color: 'error', text: '已拒绝' },
      'deleted': { color: 'default', text: '已删除' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<Story> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_: any, record: Story) => (
        <Space size={4}>
          <Text style={{ fontSize: 12 }}>👁️ {record.viewCount}</Text>
          <Text style={{ fontSize: 12 }}>👍 {record.likeCount}</Text>
          {record.isFeatured && <Badge status="success" text="精选" />}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 180,
      ellipsis: {
        showTitle: false
      },
      render: (text: string, record: Story) => (
        <Tooltip title={`${text} (${record.userId})`}>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <Text>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              ({record.userId})
            </Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Story) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这个故事吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>故事内容管理</Title>
      <Text type="secondary">管理和查看所有用户提交的故事内容</Text>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 搜索条件 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索标题或内容"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索用户名或ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="选择分类"
                style={{ width: '100%' }}
                value={category || undefined}
                onChange={setCategory}
                allowClear
              >
                <Option value="general">一般</Option>
                <Option value="求职经历">求职经历</Option>
                <Option value="职场故事">职场故事</Option>
                <Option value="成长经历">成长经历</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="选择状态"
                style={{ width: '100%' }}
                value={status || undefined}
                onChange={setStatus}
                allowClear
              >
                <Option value="approved">已通过</Option>
                <Option value="pending">待审核</Option>
                <Option value="rejected">已拒绝</Option>
                <Option value="deleted">已删除</Option>
              </Select>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button icon={<FilterOutlined />} onClick={fetchStories}>
                  刷新
                </Button>
                {selectedRowKeys.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={stories}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="故事详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedStory && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>标题：</Text>
              <Title level={4}>{selectedStory.title}</Title>
            </div>
            <div>
              <Text strong>作者：</Text>
              <Text>{selectedStory.authorName} ({selectedStory.userId})</Text>
            </div>
            <div>
              <Text strong>分类：</Text>
              <Tag>{selectedStory.category}</Tag>
            </div>
            <div>
              <Text strong>状态：</Text>
              {getStatusTag(selectedStory.auditStatus)}
            </div>
            <div>
              <Text strong>标签：</Text>
              <Space>
                {selectedStory.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Space>
            </div>
            <div>
              <Text strong>内容：</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                {selectedStory.content}
              </Paragraph>
            </div>
            <div>
              <Text strong>统计数据：</Text>
              <Space>
                <Tag>浏览 {selectedStory.viewCount}</Tag>
                <Tag>点赞 {selectedStory.likeCount}</Tag>
                <Tag>点踩 {selectedStory.dislikeCount}</Tag>
              </Space>
            </div>
            <div>
              <Text strong>创建时间：</Text>
              <Text>{dayjs(selectedStory.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </div>
            {selectedStory.approvedAt && (
              <div>
                <Text strong>审核通过时间：</Text>
                <Text>{dayjs(selectedStory.approvedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default AdminStoryManagement;


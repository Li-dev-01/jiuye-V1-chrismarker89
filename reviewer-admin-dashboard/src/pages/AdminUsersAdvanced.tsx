import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Input, 
  Select, 
  Modal, 
  Form, 
  message, 
  Typography,
  Row,
  Col,
  Statistic,
  Checkbox,
  Dropdown,
  DatePicker,
  Tooltip,
  Badge,
  Avatar,
  Divider,
  Progress,
  Switch,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  ExportOutlined,
  ImportOutlined,
  FilterOutlined,
  MoreOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { AdminUser } from '../types';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminUsersAdvanced: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    reviewerUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0
  });

  // 筛选选项
  const [filterOptions, setFilterOptions] = useState({
    universities: [] as string[],

    roles: ['student', 'reviewer', 'admin'],
    statuses: ['active', 'inactive', 'suspended', 'pending']
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter, dateRange]);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchText) params.append('search', searchText);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      if (dateRange) {
        params.append('startDate', dateRange[0]);
        params.append('endDate', dateRange[1]);
      }

      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setUsers(data.users || []);
        setTotal(data.total || 0);
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      } else {
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter, dateRange]);

  // 获取用户统计
  const fetchUserStats = async () => {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  // 批量操作
  const handleBatchOperation = async (action: string, data?: any) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的用户');
      return;
    }

    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/batch`, {
        userIds: selectedRowKeys,
        action,
        data
      });

      if (response.data.success) {
        message.success(`批量${action}操作成功`);
        setSelectedRowKeys([]);
        fetchUsers();
        fetchUserStats();
      } else {
        message.error(response.data.message || '批量操作失败');
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      message.error('批量操作失败');
    }
  };

  // 导出用户数据
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'excel',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),

        ...(dateRange && { startDate: dateRange[0], endDate: dateRange[1] })
      });

      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/export?${params}`);
      
      if (response.data.success) {
        message.success('导出任务已创建，请稍后下载');
        // 这里可以添加下载逻辑
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 状态渲染
  const renderStatus = (status: string) => {
    const statusConfig = {
      active: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
      inactive: { color: 'orange', text: '未激活', icon: <ClockCircleOutlined /> },
      suspended: { color: 'red', text: '已禁用', icon: <StopOutlined /> },
      pending: { color: 'blue', text: '待审核', icon: <WarningOutlined /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 角色渲染
  const renderRole = (role: string) => {
    const roleConfig = {
      student: { color: 'blue', text: '学生' },
      reviewer: { color: 'green', text: '审核员' },
      admin: { color: 'red', text: '管理员' },
      super_admin: { color: 'purple', text: '超级管理员' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.student;
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义 - Excel样式
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left' as const,
      sorter: true,
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      fixed: 'left' as const,
      render: (record: AdminUser) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.nickname || record.username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: renderRole,
      filters: filterOptions.roles.map(role => ({ text: role, value: role })),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
      filters: filterOptions.statuses.map(status => ({ text: status, value: status })),
    },
    {
      title: '活跃度',
      key: 'activity',
      width: 150,
      render: (record: AdminUser) => (
        <div>
          <div>问卷: {record.questionnairesCount || 0}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            故事: {record.storiesCount || 0}
          </div>
        </div>
      ),
    },

    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (record: AdminUser) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: '查看详情',
                },
                {
                  key: 'reset',
                  label: '重置密码',
                },
                {
                  key: 'toggle',
                  label: record.status === 'active' ? '禁用' : '启用',
                },
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                },
              ],
              onClick: ({ key }) => handleMenuClick(key, record),
            }}
          >
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleMenuClick = (key: string, user: AdminUser) => {
    switch (key) {
      case 'view':
        // 查看详情逻辑
        break;
      case 'reset':
        // 重置密码逻辑
        break;
      case 'toggle':
        // 切换状态逻辑
        break;
      case 'delete':
        // 删除逻辑
        break;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>用户管理 (高级版)</Title>
        <Text type="secondary">支持10万+用户规模的专业用户管理系统</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.adminUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="审核员"
              value={stats.reviewerUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="未激活"
              value={stats.inactiveUsers}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已禁用"
              value={stats.suspendedUsers}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="搜索用户名、邮箱、姓名、学号、手机号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={fetchUsers}
              enterButton
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.roles.map(role => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {filterOptions.statuses.map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Col>

          <Col span={5}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setAdvancedFilterVisible(!advancedFilterVisible)}
              >
                高级筛选
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {advancedFilterVisible && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <RangePicker
                  placeholder={['开始日期', '结束日期']}
                  onChange={(dates, dateStrings) => setDateRange(dateStrings as [string, string])}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={16}>
                <Space>
                  <Button type="primary" onClick={fetchUsers}>应用筛选</Button>
                  <Button onClick={() => {
                    setSearchText('');
                    setRoleFilter('');
                    setStatusFilter('');
                    setDateRange(null);
                  }}>
                    清除筛选
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: '16px', background: '#e6f7ff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text>已选择 {selectedRowKeys.length} 个用户</Text>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  onClick={() => handleBatchOperation('activate')}
                >
                  批量启用
                </Button>
                <Button 
                  onClick={() => handleBatchOperation('deactivate')}
                >
                  批量禁用
                </Button>
                <Button 
                  onClick={() => handleBatchOperation('delete')}
                  danger
                >
                  批量删除
                </Button>
                <Button onClick={() => setSelectedRowKeys([])}>
                  取消选择
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />}>
                新增用户
              </Button>
              <Button icon={<ImportOutlined />}>
                批量导入
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出Excel
              </Button>
              <Button icon={<DownloadOutlined />}>
                下载模板
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 - Excel样式 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1800, y: 600 }}
          size="small"
          bordered
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['20', '50', '100', '200'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 50);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default AdminUsersAdvanced;

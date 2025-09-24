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
  Tooltip,
  Badge,
  Avatar,
  Divider,
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

const AdminUsersReal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();

  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    reviewerUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter]);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchText) params.append('search', searchText);
      if (roleFilter) params.append('userType', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setUsers(data.users || data.items || []);
        setTotal(data.total || data.pagination?.total || 0);
        console.log(`[ADMIN_USERS] Successfully loaded ${data.users?.length || 0} users`);
      } else {
        console.error('[ADMIN_USERS] API returned error:', response.data.message);
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error: any) {
      console.error('获取用户列表失败:', error);

      // 检查是否是认证错误
      if (error?.response?.status === 401) {
        console.log('[ADMIN_USERS] Authentication error, will be handled by interceptor');
        return; // 让拦截器处理认证错误
      }

      // 对于其他错误，显示错误信息但不重定向
      message.error('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter]);

  // 获取用户统计
  const fetchUserStats = async () => {
    try {
      console.log('[ADMIN_USERS] Fetching user statistics');
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
        console.log('[ADMIN_USERS] User stats loaded:', response.data.data);
      } else {
        console.error('[ADMIN_USERS] Failed to get user stats:', response.data.message);
      }
    } catch (error: any) {
      console.error('获取用户统计失败:', error);

      // 检查是否是认证错误
      if (error?.response?.status === 401) {
        console.log('[ADMIN_USERS] Authentication error in stats, will be handled by interceptor');
        return; // 让拦截器处理认证错误
      }

      // 使用默认统计数据
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        reviewerUsers: 0
      });
    }
  };

  // 批量操作
  const handleBatchOperation = async (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的用户');
      return;
    }

    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/batch`, {
        userIds: selectedRowKeys,
        action
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

  // 状态渲染
  const renderStatus = (status?: string) => {
    const statusConfig = {
      active: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
      inactive: { color: 'orange', text: '未激活', icon: <ClockCircleOutlined /> },
      banned: { color: 'red', text: '已禁用', icon: <StopOutlined /> }
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
      user: { color: 'blue', text: '普通用户' },
      reviewer: { color: 'green', text: '审核员' },
      admin: { color: 'orange', text: '管理员' },
      super_admin: { color: 'red', text: '超级管理员' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义 - 根据真实数据结构
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
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
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
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
      width: 120,
      render: renderRole,
      filters: [
        { text: '普通用户', value: 'user' },
        { text: '审核员', value: 'reviewer' },
        { text: '管理员', value: 'admin' },
        { text: '超级管理员', value: 'super_admin' }
      ],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
      filters: [
        { text: '正常', value: 'active' },
        { text: '未激活', value: 'inactive' },
        { text: '已禁用', value: 'banned' }
      ],
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
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date?: string) => date ? new Date(date).toLocaleDateString() : '从未登录',
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
        <Title level={2}>用户管理 (真实数据)</Title>
        <Text type="secondary">基于真实数据库的用户管理系统</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.adminUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="审核员"
              value={stats.reviewerUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索用户名、邮箱"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={fetchUsers}
              enterButton
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="user">普通用户</Option>
              <Option value="reviewer">审核员</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">正常</Option>
              <Option value="inactive">未激活</Option>
              <Option value="banned">已禁用</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>
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
            <Text type="secondary">
              共 {total} 个用户
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
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
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 20);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default AdminUsersReal;

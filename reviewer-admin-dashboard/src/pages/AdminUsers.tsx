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
  Popconfirm,
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
  Switch
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
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
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import type { AdminUser } from '../types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminUsers: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [universityFilter, setUniversityFilter] = useState<string>('');
  const [graduationYearFilter, setGraduationYearFilter] = useState<number | null>(null);
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
    reviewerUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, pageSize, searchText, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}?${params}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setUsers(data.users || data.items || []);
        setTotal(data.total || data.count || 0);
      } else {
        // 使用模拟数据
        const mockUsers = generateMockUsers();
        setUsers(mockUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        setTotal(mockUsers.length);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
      
      // 使用模拟数据作为后备
      const mockUsers = generateMockUsers();
      setUsers(mockUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize));
      setTotal(mockUsers.length);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        // 模拟统计数据
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          adminUsers: 15,
          reviewerUsers: 23
        });
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 使用模拟数据
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        adminUsers: 15,
        reviewerUsers: 23
      });
    }
  };

  const generateMockUsers = (): AdminUser[] => {
    const roles: ('user' | 'reviewer' | 'admin' | 'super_admin')[] = ['user', 'reviewer', 'admin', 'super_admin'];
    const statuses: ('active' | 'inactive' | 'banned')[] = ['active', 'inactive', 'banned'];
    const mockUsers: AdminUser[] = [];

    for (let i = 1; i <= 50; i++) {
      mockUsers.push({
        id: `user_${i.toString().padStart(3, '0')}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
      });
    }

    return mockUsers;
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`);
      message.success('用户删除成功');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 更新用户
        await apiClient.put(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${editingUser.id}`, values);
        message.success('用户更新成功');
      } else {
        // 创建用户
        await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS, values);
        message.success('用户创建成功');
      }
      
      setIsModalVisible(false);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('保存用户失败:', error);
      message.error('保存用户失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          admin: 'red',
          reviewer: 'blue',
          user: 'green'
        };
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>;
      },
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '审核员', value: 'reviewer' },
        { text: '普通用户', value: 'user' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'green',
          inactive: 'orange',
          suspended: 'red'
        };
        const textMap: Record<string, string> = {
          active: '活跃',
          inactive: '非活跃',
          suspended: '已暂停'
        };
        return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>;
      },
      filters: [
        { text: '活跃', value: 'active' },
        { text: '非活跃', value: 'inactive' },
        { text: '已暂停', value: 'suspended' },
      ],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '从未登录',
    },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      key: 'loginCount',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: AdminUser) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>用户管理</Title>
        <Text type="secondary">管理系统中的所有用户账户</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.adminUsers}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="审核员"
              value={stats.reviewerUsers}
              prefix={<UserDeleteOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索用户名或邮箱"
              allowClear
              onSearch={setSearchText}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="角色筛选"
              allowClear
              onChange={setRoleFilter}
              style={{ width: '100%' }}
            >
              <Option value="admin">管理员</Option>
              <Option value="reviewer">审核员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="状态筛选"
              allowClear
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="suspended">已暂停</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                新增用户
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchUsers();
                  fetchUserStats();
                }}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户编辑模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active', role: 'user' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              <Option value="reviewer">审核员</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="suspended">已暂停</Option>
            </Select>
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;

/**
 * 用户管理页面 - 增强版
 * 支持UUID体系、用户分类、权限管理
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Table,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Descriptions,
  Tooltip,
  Badge,
  Alert
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';
import { useManagementAuthStore } from '../../stores/managementAuthStore';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

interface User {
  id: string;
  username: string;
  nickname?: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'banned';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  questionnairesCount: number;
  storiesCount: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
}

export const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    userType: '',
    status: '',
    search: ''
  });

  // 使用管理系统认证状态
  const { currentUser, isAuthenticated } = useManagementAuthStore();

  // 加载用户数据
  const loadUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);

    try {
      console.log('开始加载用户数据...', { page, pageSize, filters });

      const response = await ManagementAdminService.getUsers(
        page,
        pageSize,
        {
          userType: filters.userType,
          status: filters.status,
          search: filters.search
        }
      );

      console.log('用户数据加载成功:', response);

      setUsers(response.items || []);
      setPagination({
        current: page,
        pageSize,
        total: response.pagination?.total || 0
      });
    } catch (error: any) {
      console.error('加载用户失败:', error);
      setError(error.message || '加载用户失败');
      message.error('加载用户失败');
      // 设置空数据
      setUsers([]);
      setPagination({
        current: page,
        pageSize,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载用户统计
  const loadUserStats = async () => {
    try {
      console.log('开始加载用户统计...');
      const stats = await ManagementAdminService.getDashboardStats();
      setUserStats({
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        newUsersToday: stats.todaySubmissions,
        newUsersWeek: Math.round(stats.weeklyGrowth)
      });
    } catch (error) {
      console.error('加载用户统计失败:', error);
      // 如果API调用失败，使用默认值
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersWeek: 0
      });
    }
  };

  useEffect(() => {
    // 只有在用户已认证时才加载数据
    if (isAuthenticated && currentUser) {
      console.log('用户已认证，开始加载用户管理数据...');
      loadUsers();
      loadUserStats();
    } else {
      console.log('用户未认证，跳过用户管理数据加载');
    }
  }, [isAuthenticated, currentUser, filters]);

  // 用户角色标签
  const getRoleTag = (role: string) => {
    const roleMap = {
      admin: { color: 'red', text: '管理员', icon: '👑' },
      super_admin: { color: 'purple', text: '超级管理员', icon: '🔱' },
      user: { color: 'green', text: '普通用户', icon: '👤' }
    };
    const config = roleMap[role as keyof typeof roleMap] || { color: 'default', text: role, icon: '❓' };
    return (
      <Tag color={config.color}>
        <span style={{ marginRight: '4px' }}>{config.icon}</span>
        {config.text}
      </Tag>
    );
  };

  // 状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '活跃' },
      inactive: { color: 'orange', text: '非活跃' },
      banned: { color: 'red', text: '已禁用' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 更新用户状态
  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      // 这里需要实现真实的API调用
      message.success('用户状态更新成功');
      loadUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => (
        <Tooltip title={`用户ID: ${id}`}>
          <Text code style={{ fontSize: '12px' }}>
            {id.length > 15 ? id.substring(0, 15) + '...' : id}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '用户信息',
      key: 'userInfo',
      render: (record: User) => (
        <div>
          <div><strong>{record.username}</strong></div>
          {record.nickname && <div style={{ fontSize: '12px', color: '#666' }}>昵称: {record.nickname}</div>}
          {record.email && <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>}
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '数据统计',
      key: 'stats',
      render: (record: User) => (
        <div style={{ fontSize: '12px' }}>
          <div>问卷: {record.questionnairesCount || 0}</div>
          <div>故事: {record.storiesCount || 0}</div>
        </div>
      )
    },
    {
      title: '时间信息',
      key: 'timeInfo',
      render: (record: User) => (
        <div style={{ fontSize: '12px' }}>
          <div>创建: {new Date(record.createdAt).toLocaleString()}</div>
          {record.lastLogin && (
            <div>最后登录: {new Date(record.lastLogin).toLocaleString()}</div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => {
              Modal.info({
                title: '用户详情',
                width: 600,
                content: (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="用户ID">{record.id}</Descriptions.Item>
                    <Descriptions.Item label="用户名">{record.username || '未设置'}</Descriptions.Item>
                    <Descriptions.Item label="昵称">{record.nickname || '未设置'}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{record.email || '未设置'}</Descriptions.Item>
                    <Descriptions.Item label="角色">{getRoleTag(record.role)}</Descriptions.Item>
                    <Descriptions.Item label="状态">{getStatusTag(record.status)}</Descriptions.Item>
                    <Descriptions.Item label="问卷数量">{record.questionnairesCount || 0}</Descriptions.Item>
                    <Descriptions.Item label="故事数量">{record.storiesCount || 0}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(record.createdAt).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="最后登录">{record.lastLogin ? new Date(record.lastLogin).toLocaleString() : '从未登录'}</Descriptions.Item>
                  </Descriptions>
                )
              });
            }}
          >
            详情
          </Button>
          {record.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleStatusUpdate(record.id, 'banned')}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusUpdate(record.id, 'active')}
            >
              激活
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Title level={3} type="danger">用户管理页面加载失败</Title>
            <Text type="secondary">{error}</Text>
            <br />
            <Button
              type="primary"
              onClick={() => {
                setError(null);
                loadUsers();
              }}
              style={{ marginTop: '16px' }}
            >
              重新加载
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            用户管理
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadUsers(pagination.current, pagination.pageSize);
                loadUserStats();
              }}
              loading={loading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            管理所有用户类型：管理员、审核员、半匿名用户、全匿名用户
          </div>
        </div>

        {/* 用户统计 */}
        {userStats && (
          <Card title="用户统计" style={{ marginBottom: '24px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="今日新增用户"
                  value={userStats.today_new_users}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="本周新增用户"
                  value={userStats.week_new_users}
                  prefix={<TeamOutlined />}
                />
              </Col>
              {userStats.type_stats.map((stat, index) => (
                <Col span={3} key={stat.user_type}>
                  <Statistic
                    title={getUserTypeTag(stat.user_type)}
                    value={stat.count}
                    suffix={`(${stat.active_count}活跃)`}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 筛选条件 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Search
                placeholder="搜索用户名、邮箱"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onSearch={() => loadUsers(1, pagination.pageSize)}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="用户类型"
                value={filters.userType}
                onChange={(value) => setFilters({ ...filters, userType: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="admin">管理员</Option>
                <Option value="reviewer">审核员</Option>
                <Option value="semi_anonymous">半匿名用户</Option>
                <Option value="full_anonymous">全匿名用户</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="active">活跃</Option>
                <Option value="inactive">非活跃</Option>
                <Option value="suspended">已暂停</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* 用户列表 */}
        <Card title="用户列表">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                loadUsers(page, pageSize);
              }
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage;

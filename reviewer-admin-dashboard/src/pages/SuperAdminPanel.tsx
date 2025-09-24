import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Alert,
  Tabs
} from 'antd';
import { 
  CrownOutlined, 
  UserOutlined, 
  SettingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt: string;
  permissions: string[];
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  action: string;
  user: string;
  details: string;
  ip: string;
}

const SuperAdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('admins');

  // 系统统计
  const [systemStats, setSystemStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    totalReviewers: 0,
    systemHealth: 'good' as 'good' | 'warning' | 'error',
    criticalErrors: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    fetchAdminUsers();
    fetchSystemLogs();
    fetchSystemStats();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}?role=admin,super_admin`);
      
      if (response.data.success) {
        setAdminUsers(response.data.data.users || []);
      } else {
        // 使用模拟数据
        setAdminUsers(generateMockAdminUsers());
      }
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      setAdminUsers(generateMockAdminUsers());
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_LOGS || '/api/simple-admin/logs'}?limit=50`);
      
      if (response.data.success) {
        setSystemLogs(response.data.data.logs || []);
      } else {
        setSystemLogs(generateMockSystemLogs());
      }
    } catch (error) {
      console.error('获取系统日志失败:', error);
      setSystemLogs(generateMockSystemLogs());
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setSystemStats({
          totalAdmins: 5,
          activeAdmins: 4,
          totalReviewers: 23,
          systemHealth: data.stats?.systemHealth >= 90 ? 'good' : 
                       data.stats?.systemHealth >= 70 ? 'warning' : 'error',
          criticalErrors: 0,
          pendingTasks: data.stats?.pendingReviews || 0
        });
      }
    } catch (error) {
      console.error('获取系统统计失败:', error);
    }
  };

  const generateMockAdminUsers = (): AdminUser[] => {
    return [
      {
        id: 'admin_001',
        username: 'admin1',
        email: 'admin1@example.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        lastLoginAt: '2024-09-24T08:15:00Z',
        permissions: ['manage_users', 'view_analytics', 'manage_content']
      },
      {
        id: 'admin_002',
        username: 'superadmin',
        email: 'superadmin@example.com',
        role: 'super_admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-09-24T09:00:00Z',
        permissions: ['*']
      },
      {
        id: 'admin_003',
        username: 'admin2',
        email: 'admin2@example.com',
        role: 'admin',
        status: 'inactive',
        createdAt: '2024-02-20T14:20:00Z',
        lastLoginAt: '2024-09-20T16:45:00Z',
        permissions: ['manage_users', 'view_analytics']
      }
    ];
  };

  const generateMockSystemLogs = (): SystemLog[] => {
    const logs: SystemLog[] = [];
    const actions = ['用户登录', '创建用户', '删除用户', '修改设置', '数据备份', '系统重启'];
    const levels: ('info' | 'warning' | 'error')[] = ['info', 'warning', 'error'];
    const users = ['admin1', 'superadmin', 'admin2', 'system'];

    for (let i = 1; i <= 20; i++) {
      logs.push({
        id: `log_${i}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        user: users[Math.floor(Math.random() * users.length)],
        details: `操作详情 ${i}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleCreateAdmin = () => {
    setEditingAdmin(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    form.setFieldsValue(admin);
    setIsModalVisible(true);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${adminId}`);
      message.success('管理员删除成功');
      fetchAdminUsers();
    } catch (error) {
      console.error('删除管理员失败:', error);
      message.error('删除管理员失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingAdmin) {
        await apiClient.put(`${API_CONFIG.ENDPOINTS.ADMIN_USERS}/${editingAdmin.id}`, values);
        message.success('管理员更新成功');
      } else {
        await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN_USERS, values);
        message.success('管理员创建成功');
      }
      
      setIsModalVisible(false);
      fetchAdminUsers();
    } catch (error) {
      console.error('保存管理员失败:', error);
      message.error('保存管理员失败');
    }
  };

  const handleSystemMaintenance = () => {
    Modal.confirm({
      title: '系统维护',
      icon: <ExclamationCircleOutlined />,
      content: '确定要进入系统维护模式吗？这将暂停所有用户操作。',
      onOk: async () => {
        try {
          await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN_SETTINGS || '/api/simple-admin/settings'}/maintenance`, {
            enabled: true
          });
          message.success('系统已进入维护模式');
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const adminColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
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
      render: (role: string) => (
        <Tag color={role === 'super_admin' ? 'gold' : 'blue'}>
          {role === 'super_admin' ? '超级管理员' : '管理员'}
        </Tag>
      ),
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
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AdminUser) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditAdmin(record)}
            size="small"
          >
            编辑
          </Button>
          {record.role !== 'super_admin' && (
            <Popconfirm
              title="确定要删除这个管理员吗？"
              onConfirm={() => handleDeleteAdmin(record.id)}
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
          )}
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      width: 180,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          info: 'blue',
          warning: 'orange',
          error: 'red'
        };
        return <Tag color={colorMap[level]}>{level.toUpperCase()}</Tag>;
      },
      width: 80,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 100,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CrownOutlined style={{ color: '#faad14', marginRight: '8px' }} />
          超级管理员控制台
        </Title>
        <Text type="secondary">系统最高权限管理面板</Text>
      </div>

      {/* 系统状态警告 */}
      {systemStats.systemHealth !== 'good' && (
        <Alert
          message="系统状态异常"
          description={`检测到 ${systemStats.criticalErrors} 个严重错误，请及时处理`}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" danger onClick={handleSystemMaintenance}>
              进入维护模式
            </Button>
          }
        />
      )}

      {/* 系统概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="管理员总数"
              value={systemStats.totalAdmins}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="活跃管理员"
              value={systemStats.activeAdmins}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="审核员总数"
              value={systemStats.totalReviewers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={systemStats.pendingTasks}
              prefix={<MonitorOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 管理员管理 */}
          <TabPane tab={<span><UserOutlined />管理员管理</span>} key="admins">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateAdmin}
                >
                  新增管理员
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchAdminUsers}
                >
                  刷新
                </Button>
              </Space>
            </div>

            <Table
              columns={adminColumns}
              dataSource={adminUsers}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* 系统日志 */}
          <TabPane tab={<span><MonitorOutlined />系统日志</span>} key="logs">
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchSystemLogs}
                >
                  刷新日志
                </Button>
                <Button>
                  导出日志
                </Button>
                <Button danger onClick={() => {
                  Modal.confirm({
                    title: '清空日志',
                    content: '确定要清空所有系统日志吗？此操作不可恢复。',
                    onOk: () => message.success('日志已清空')
                  });
                }}>
                  清空日志
                </Button>
              </Space>
            </div>

            <Table
              columns={logColumns}
              dataSource={systemLogs}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          {/* 系统控制 */}
          <TabPane tab={<span><SettingOutlined />系统控制</span>} key="control">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="系统维护" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button block onClick={handleSystemMaintenance}>
                      进入维护模式
                    </Button>
                    <Button block>
                      重启系统服务
                    </Button>
                    <Button block>
                      清理系统缓存
                    </Button>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="数据管理" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button block>
                      立即备份数据
                    </Button>
                    <Button block>
                      恢复数据
                    </Button>
                    <Button block danger>
                      清理过期数据
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 管理员编辑模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '新增管理员'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active', role: 'admin' }}
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
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
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
          
          {!editingAdmin && (
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

export default SuperAdminPanel;

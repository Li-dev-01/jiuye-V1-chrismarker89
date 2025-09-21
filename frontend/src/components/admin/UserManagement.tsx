import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Avatar,
  Tooltip,
  Popconfirm,
  message,
  Badge
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'banned';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  questionnairesCount: number;
  storiesCount: number;
}

interface UserManagementProps {
  data: User[];
  loading?: boolean;
  onRefresh: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  data,
  loading = false,
  onRefresh
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const roleColors = {
    user: 'blue',
    admin: 'orange',
    super_admin: 'red'
  };

  const roleLabels = {
    user: '普通用户',
    admin: '管理员',
    super_admin: '超级管理员'
  };

  const statusColors = {
    active: 'green',
    inactive: 'orange',
    banned: 'red'
  };

  const statusLabels = {
    active: '正常',
    inactive: '未激活',
    banned: '已封禁'
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            size="small"
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: keyof typeof roleColors) => (
        <Tag color={roleColors[role]}>
          {roleLabels[role]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusColors) => (
        <Badge
          status={status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'error'}
          text={statusLabels[status]}
        />
      )
    },
    {
      title: '活跃度',
      key: 'activity',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span style={{ fontSize: '12px' }}>
            问卷: {record.questionnairesCount}
          </span>
          <span style={{ fontSize: '12px' }}>
            故事: {record.storiesCount}
          </span>
        </Space>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>{date}</span>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>{date}</span>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑用户">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '禁用用户' : '启用用户'}>
            <Button
              type="text"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              size="small"
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="发送邮件">
            <Button
              type="text"
              icon={<MailOutlined />}
              size="small"
              onClick={() => handleSendEmail(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除用户">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setEditModalVisible(true);
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingUser(null);
    setCreateModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 更新用户
        message.success('用户信息已更新');
        setEditModalVisible(false);
      } else {
        // 创建用户
        message.success('用户创建成功');
        setCreateModalVisible(false);
      }
      
      onRefresh();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';
    
    Modal.confirm({
      title: `${action}用户`,
      content: `确定要${action}用户 ${user.username} 吗？`,
      onOk: () => {
        message.success(`用户已${action}`);
        onRefresh();
      }
    });
  };

  const handleDelete = (userId: string) => {
    message.success('用户已删除');
    onRefresh();
  };

  const handleSendEmail = (user: User) => {
    message.info(`邮件发送功能开发中... (${user.email})`);
  };

  return (
    <Card
      title="用户管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建用户
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
        scroll={{ x: 1000 }}
      />

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">未激活</Option>
              <Option value="banned">已封禁</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建用户模态框 */}
      <Modal
        title="新建用户"
        open={createModalVisible}
        onOk={handleSave}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            initialValue="user"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

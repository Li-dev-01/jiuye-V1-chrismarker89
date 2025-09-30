/**
 * 超级管理员账户管理页面
 * 功能：
 * 1. Gmail白名单管理
 * 2. 角色权限分配
 * 3. 账号密码登录开关
 * 4. 2FA设置
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Alert,
  Divider,
  Checkbox,
  QRCode
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  GoogleOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
  KeyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AdminWhitelistUser {
  id: number;
  email: string;
  role: 'reviewer' | 'admin' | 'super_admin';
  permissions: string[];
  allowPasswordLogin: boolean;
  username?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdBy: string;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

const SuperAdminAccountManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminWhitelistUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminWhitelistUser | null>(null);
  const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQRCode, setTwoFAQRCode] = useState('');
  const [form] = Form.useForm();

  // 权限选项
  const permissionOptions = [
    { label: '审核内容', value: 'review_content' },
    { label: '查看仪表板', value: 'view_dashboard' },
    { label: '管理内容', value: 'manage_content' },
    { label: '查看分析', value: 'view_analytics' },
    { label: '管理用户', value: 'manage_users' },
    { label: 'API管理', value: 'manage_api' },
    { label: '系统设置', value: 'system_settings' },
    { label: '所有权限', value: 'all' }
  ];

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/whitelist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        message.error('加载用户列表失败');
      }
    } catch (error) {
      console.error('Load users error:', error);
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 打开新增/编辑模态框
  const handleOpenModal = (user?: AdminWhitelistUser) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        allowPasswordLogin: user.allowPasswordLogin,
        username: user.username,
        isActive: user.isActive,
        notes: user.notes
      });
    } else {
      setEditingUser(null);
      form.resetFields();
      form.setFieldsValue({
        allowPasswordLogin: false,
        isActive: true,
        permissions: []
      });
    }
    setModalVisible(true);
  };

  // 保存用户
  const handleSaveUser = async (values: any) => {
    setLoading(true);
    try {
      const url = editingUser
        ? `/api/admin/whitelist/${editingUser.id}`
        : '/api/admin/whitelist';
      
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(editingUser ? '更新成功' : '添加成功');
        setModalVisible(false);
        loadUsers();
      } else {
        const error = await response.json();
        message.error(error.message || '操作失败');
      }
    } catch (error) {
      console.error('Save user error:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/whitelist/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        message.success('删除成功');
        loadUsers();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      message.error('删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 启用2FA
  const handleEnable2FA = async (user: AdminWhitelistUser) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/whitelist/${user.id}/enable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFASecret(data.secret);
        setTwoFAQRCode(data.qrCode);
        setTwoFAModalVisible(true);
      } else {
        message.error('启用2FA失败');
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 禁用2FA
  const handleDisable2FA = async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/whitelist/${userId}/disable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        message.success('已禁用2FA');
        loadUsers();
      } else {
        message.error('禁用2FA失败');
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<AdminWhitelistUser> = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <MailOutlined />
          <Text>{email}</Text>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleConfig = {
          reviewer: { color: 'blue', text: '审核员' },
          admin: { color: 'green', text: '管理员' },
          super_admin: { color: 'red', text: '超级管理员' }
        };
        const config = roleConfig[role as keyof typeof roleConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username?: string) => username || <Text type="secondary">-</Text>
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.includes('all') ? (
            <Tag color="gold">所有权限</Tag>
          ) : (
            permissions.map(p => <Tag key={p}>{p}</Tag>)
          )}
        </Space>
      )
    },
    {
      title: '密码登录',
      dataIndex: 'allowPasswordLogin',
      key: 'allowPasswordLogin',
      render: (allow: boolean) => (
        <Tag color={allow ? 'green' : 'default'}>
          {allow ? '允许' : '禁止'}
        </Tag>
      )
    },
    {
      title: '2FA',
      dataIndex: 'twoFactorEnabled',
      key: 'twoFactorEnabled',
      render: (enabled: boolean, record: AdminWhitelistUser) => (
        <Space>
          <Tag color={enabled ? 'green' : 'default'}>
            {enabled ? '已启用' : '未启用'}
          </Tag>
          {enabled ? (
            <Popconfirm
              title="确定要禁用2FA吗？"
              onConfirm={() => handleDisable2FA(record.id)}
            >
              <Button size="small" danger>禁用</Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type="primary"
              onClick={() => handleEnable2FA(record)}
            >
              启用
            </Button>
          )}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? '激活' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (time?: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: AdminWhitelistUser) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <SafetyOutlined /> 账户管理
          </Title>
          <Paragraph type="secondary">
            管理审核员、管理员的Gmail白名单和权限设置
          </Paragraph>
        </div>

        <Alert
          message="安全提示"
          description="通过Gmail白名单严格限制登录权限，防止暴力破解。超级管理员账号建议启用2FA双因素认证。"
          type="info"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: '16px' }}
        />

        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            添加用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新增/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
        >
          <Form.Item
            label="Gmail邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入Gmail邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<GoogleOutlined />}
              placeholder="example@gmail.com"
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Option value="reviewer">审核员</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="权限"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Checkbox.Group options={permissionOptions} />
          </Form.Item>

          <Form.Item
            label="允许账号密码登录"
            name="allowPasswordLogin"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.allowPasswordLogin !== currentValues.allowPasswordLogin
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('allowPasswordLogin') ? (
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="用户名" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="激活" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            label="备注"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2FA设置模态框 */}
      <Modal
        title="启用双因素认证"
        open={twoFAModalVisible}
        onCancel={() => {
          setTwoFAModalVisible(false);
          loadUsers();
        }}
        footer={[
          <Button key="close" onClick={() => {
            setTwoFAModalVisible(false);
            loadUsers();
          }}>
            关闭
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="请使用Google Authenticator或其他TOTP应用扫描二维码"
            type="info"
            showIcon
          />

          <div style={{ textAlign: 'center' }}>
            {twoFAQRCode && <QRCode value={twoFAQRCode} size={200} />}
          </div>

          <div>
            <Text strong>密钥（手动输入）：</Text>
            <Paragraph copyable>{twoFASecret}</Paragraph>
          </div>

          <Alert
            message="请妥善保存密钥，用于恢复访问"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default SuperAdminAccountManagement;


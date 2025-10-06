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

// 角色账号信息
interface RoleAccount {
  id: number;
  role: 'reviewer' | 'admin' | 'super_admin';
  username: string;
  displayName?: string;
  permissions: string[];
  allowPasswordLogin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// 邮箱账号信息（包含多个角色）
interface EmailAccount {
  id: number;
  email: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdBy: string;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
  accounts: RoleAccount[];
}

// 兼容旧的扁平化数据结构（用于表格展示）
interface AdminWhitelistUser extends RoleAccount {
  email: string;
  twoFactorEnabled: boolean;
  createdBy: string;
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
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
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
      const response = await fetch('/api/admin/account-management/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 后端返回的是按邮箱分组的数据，需要转换为扁平化的用户列表
        const flatUsers: AdminWhitelistUser[] = [];

        if (data.data && data.data.emails) {
          data.data.emails.forEach((emailGroup: EmailAccount) => {
            // 为每个角色创建一个扁平化的记录
            emailGroup.accounts.forEach((account: RoleAccount) => {
              flatUsers.push({
                // 角色账号信息
                id: account.id,
                role: account.role,
                username: account.username,
                displayName: account.displayName,
                permissions: account.permissions || [],
                allowPasswordLogin: account.allowPasswordLogin,
                isActive: account.isActive,
                createdAt: account.createdAt,
                lastLoginAt: account.lastLoginAt,
                // 邮箱级别信息
                email: emailGroup.email,
                twoFactorEnabled: emailGroup.twoFactorEnabled,
                createdBy: emailGroup.createdBy,
                notes: emailGroup.notes || ''
              });
            });
          });
        }

        setUsers(flatUsers);
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
        ? `/api/admin/account-management/accounts/${editingUser.id}`
        : '/api/admin/account-management/accounts';

      const method = editingUser ? 'PUT' : 'POST';

      // 转换数据格式以匹配后端 API
      const requestBody = {
        email: values.email,
        role: values.role,
        displayName: values.displayName || `${values.role} User`,
        permissions: values.permissions || [],
        allowPasswordLogin: values.allowPasswordLogin || false,
        username: values.username,
        password: values.password,
        notes: values.notes || ''
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        },
        body: JSON.stringify(requestBody)
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

  // 使用账号（切换到该角色）
  const handleUseAccount = async (user: AdminWhitelistUser) => {
    try {
      // 调用激活角色 API
      const response = await fetch(`/api/admin/account-management/accounts/${user.id}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // 保存新的 token
        if (result.data && result.data.token) {
          localStorage.setItem('super_admin_token', result.data.token);
          message.success(`已切换到 ${user.email} 的 ${user.role} 角色`);

          // 刷新页面或跳转到对应的仪表板
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          message.error('切换角色失败：未返回有效token');
        }
      } else {
        const error = await response.json();
        message.error(error.message || '切换角色失败');
      }
    } catch (error) {
      console.error('Use account error:', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/account-management/accounts/${userId}`, {
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
      const response = await fetch(`/api/admin/account-management/accounts/${user.id}/enable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTwoFASecret(result.data.secret);
        setTwoFAQRCode(result.data.qrCode);
        setTwoFABackupCodes(result.data.backupCodes || []);
        setTwoFAModalVisible(true);
        loadUsers(); // 刷新列表
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
      const response = await fetch(`/api/admin/account-management/accounts/${userId}/disable-2fa`, {
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
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? '已启用' : '未启用'}
        </Tag>
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
      fixed: 'right',
      width: 280,
      render: (_, record: AdminWhitelistUser) => (
        <Space size="small" wrap>
          {/* 使用账号 */}
          <Button
            size="small"
            type="primary"
            icon={<UserOutlined />}
            onClick={() => handleUseAccount(record)}
          >
            使用
          </Button>

          {/* 编辑角色 */}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>

          {/* 2FA 管理（邮箱级别） */}
          {record.twoFactorEnabled ? (
            <Popconfirm
              title="确定要禁用此邮箱的2FA吗？"
              description="这将影响该邮箱下的所有角色账号"
              onConfirm={() => handleDisable2FA(record.id)}
            >
              <Button size="small" danger>
                禁用2FA
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              onClick={() => handleEnable2FA(record)}
            >
              启用2FA
            </Button>
          )}

          {/* 删除角色 */}
          <Popconfirm
            title="确定要删除此角色吗？"
            description={`将删除 ${record.email} 的 ${record.role} 角色`}
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
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
            label="显示名称"
            name="displayName"
          >
            <Input prefix={<UserOutlined />} placeholder="显示名称（可选）" />
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
                <>
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>

                  {!editingUser && (
                    <Form.Item
                      label="密码"
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 8, message: '密码长度至少为8位' }
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="密码（至少8位）" />
                    </Form.Item>
                  )}
                </>
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

          <Divider />

          <div>
            <Text strong>备用代码（请妥善保存）：</Text>
            <Alert
              message="这些备用代码只显示一次，请立即保存！每个代码只能使用一次。"
              type="error"
              showIcon
              style={{ marginTop: '8px', marginBottom: '16px' }}
            />
            <div style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {twoFABackupCodes.map((code, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  {index + 1}. {code}
                </div>
              ))}
            </div>
            <Button
              type="link"
              onClick={() => {
                const text = twoFABackupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');
                navigator.clipboard.writeText(text);
                message.success('备用代码已复制到剪贴板');
              }}
              style={{ marginTop: '8px' }}
            >
              复制所有备用代码
            </Button>
          </div>

          <Alert
            message="请妥善保存密钥和备用代码，用于恢复访问"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default SuperAdminAccountManagement;


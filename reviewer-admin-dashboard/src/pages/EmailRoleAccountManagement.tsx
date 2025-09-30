/**
 * 邮箱与角色账号管理页面
 * 核心概念：一个邮箱可以对应多个角色账号
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
  Collapse,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  UserOutlined,
  SafetyOutlined,
  GoogleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface RoleAccount {
  id: number;
  role: 'reviewer' | 'admin' | 'super_admin';
  username: string;
  displayName: string;
  permissions: string[];
  allowPasswordLogin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface EmailWhitelist {
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

const EmailRoleAccountManagement: React.FC = () => {
  const [emails, setEmails] = useState<EmailWhitelist[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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

  // 加载邮箱和账号列表
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[EmailRoleAccountManagement] API response:', data);

        // 映射数据结构
        const mappedEmails = (data.data.emails || []).map((email: any) => ({
          id: email.id,
          email: email.email,
          isActive: email.is_active === 1,
          twoFactorEnabled: email.two_factor_enabled === 1,
          createdBy: email.created_by,
          createdAt: email.created_at,
          lastLoginAt: email.last_login_at,
          notes: email.notes,
          accounts: email.accounts || []
        }));

        console.log('[EmailRoleAccountManagement] Mapped emails:', mappedEmails);
        setEmails(mappedEmails);
      } else {
        message.error('加载账号列表失败');
      }
    } catch (error) {
      console.error('Load accounts error:', error);
      message.error('加载账号列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 创建角色账号（支持多选角色）
  const handleCreateAccount = async (values: any) => {
    try {
      const roles = Array.isArray(values.roles) ? values.roles : [values.roles];

      if (!roles || roles.length === 0) {
        message.error('请至少选择一个角色');
        return;
      }

      // 检查该邮箱已有哪些角色
      const existingEmail = emails.find(e => e.email === values.email);
      const existingRoles: string[] = existingEmail ? existingEmail.accounts.map(a => a.role) : [];

      // 过滤掉已存在的角色
      const newRoles = roles.filter((role: string) => !existingRoles.includes(role));
      const duplicateRoles = roles.filter((role: string) => existingRoles.includes(role));

      // 如果有重复的角色，显示警告
      if (duplicateRoles.length > 0) {
        const duplicateRoleNames = duplicateRoles.map((r: string) => getRoleDisplayName(r)).join('、');
        message.warning(`该邮箱已有以下角色：${duplicateRoleNames}，将跳过创建`);
      }

      // 如果没有新角色需要创建
      if (newRoles.length === 0) {
        message.error('所选角色已全部存在，无需创建');
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // 为每个新角色创建账号
      for (const role of newRoles) {
        try {
          const response = await fetch('https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
            },
            body: JSON.stringify({
              email: values.email,
              role: role,
              displayName: values.displayName ? `${values.displayName} (${getRoleDisplayName(role)})` : undefined,
              permissions: values.permissions || getDefaultPermissions(role),
              allowPasswordLogin: values.allowPasswordLogin || false,
              username: values.username ? `${role}_${values.username}` : undefined,
              password: values.password,
              notes: values.notes
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            failCount++;
            errors.push(`${getRoleDisplayName(role)}: ${errorData.message}`);
          }
        } catch (error: any) {
          failCount++;
          errors.push(`${getRoleDisplayName(role)}: ${error.message}`);
        }
      }

      // 显示结果
      if (successCount > 0 && failCount === 0) {
        message.success(`成功创建 ${successCount} 个角色账号`);
        setModalVisible(false);
        form.resetFields();
        loadAccounts();
      } else if (successCount > 0 && failCount > 0) {
        message.warning(`成功创建 ${successCount} 个，失败 ${failCount} 个`);
        if (errors.length > 0) {
          Modal.error({
            title: '部分账号创建失败',
            content: (
              <div>
                {errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )
          });
        }
        loadAccounts();
      } else {
        message.error('所有账号创建失败');
        if (errors.length > 0) {
          Modal.error({
            title: '账号创建失败',
            content: (
              <div>
                {errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )
          });
        }
      }
    } catch (error) {
      console.error('Create account error:', error);
      message.error('创建账号失败');
    }
  };

  // 删除角色账号
  // 删除角色账号
  const handleDeleteAccount = async (accountId: number) => {
    try {
      const response = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        message.success('角色账号删除成功');
        loadAccounts();
      } else {
        message.error('删除角色账号失败');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      message.error('删除角色账号失败');
    }
  };

  // 停用/启用角色账号
  const handleToggleAccountStatus = async (accountId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/accounts/${accountId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        message.success(`账号已${currentStatus ? '停用' : '启用'}`);
        loadAccounts();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('Toggle account status error:', error);
      message.error('操作失败');
    }
  };

  // 删除整个邮箱及其所有角色账号
  const handleDeleteEmail = async (emailId: number, email: string) => {
    try {
      const response = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        message.success(`邮箱 ${email} 及其所有角色账号已删除`);
        loadAccounts();
      } else {
        message.error('删除邮箱失败');
      }
    } catch (error) {
      console.error('Delete email error:', error);
      message.error('删除邮箱失败');
    }
  };

  // 停用/启用邮箱
  const handleToggleEmailStatus = async (emailId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`https://employment-survey-api-prod.chrismarker89.workers.dev/api/admin/account-management/emails/${emailId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        message.success(`邮箱已${currentStatus ? '停用' : '启用'}`);
        loadAccounts();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('Toggle email status error:', error);
      message.error('操作失败');
    }
  };

  // 获取默认权限
  const getDefaultPermissions = (role: string): string[] => {
    const permissionMap: Record<string, string[]> = {
      'reviewer': ['review_content', 'view_dashboard'],
      'admin': ['manage_content', 'view_analytics', 'manage_api'],
      'super_admin': ['all']
    };
    return permissionMap[role] || [];
  };

  // 角色标签颜色
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'reviewer': 'blue',
      'admin': 'orange',
      'super_admin': 'red'
    };
    return colorMap[role] || 'default';
  };

  // 角色显示名称
  const getRoleDisplayName = (role: string) => {
    const nameMap: Record<string, string> = {
      'reviewer': '审核员',
      'admin': '管理员',
      'super_admin': '超级管理员'
    };
    return nameMap[role] || role;
  };

  // 表格列定义
  const columns: ColumnsType<EmailWhitelist> = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (email: string) => (
        <Tooltip placement="topLeft" title={email}>
          <Space>
            <MailOutlined />
            <Text strong>{email}</Text>
          </Space>
        </Tooltip>
      )
    },
    {
      title: '角色账号',
      key: 'accounts',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.accounts.length === 0 ? (
            <Text type="secondary">无角色账号</Text>
          ) : (
            record.accounts.map(account => (
              <Tag key={account.id} color={getRoleColor(account.role)}>
                {getRoleDisplayName(account.role)} - {account.username}
              </Tag>
            ))
          )}
        </Space>
      )
    },
    {
      title: '账号数量',
      key: 'accountCount',
      render: (_, record) => (
        <Tag color="blue">{record.accounts.length} 个</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      )
    },
    {
      title: '2FA',
      dataIndex: 'twoFactorEnabled',
      key: 'twoFactorEnabled',
      render: (enabled: boolean) => (
        enabled ? <Tag color="green"><SafetyOutlined /> 已启用</Tag> : <Tag>未启用</Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldsValue({ email: record.email });
              setModalVisible(true);
            }}
          >
            添加角色
          </Button>
          <Button
            type="link"
            onClick={() => handleToggleEmailStatus(record.id, record.isActive)}
          >
            {record.isActive ? '停用' : '启用'}
          </Button>
          <Popconfirm
            title={`确定要删除邮箱 ${record.email} 及其所有角色账号吗？`}
            description="此操作不可恢复，请谨慎操作！"
            onConfirm={() => handleDeleteEmail(record.id, record.email)}
            okText="确定删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger>
              删除邮箱
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 展开的行内容（显示角色账号详情）
  const expandedRowRender = (record: EmailWhitelist) => {
    const accountColumns: ColumnsType<RoleAccount> = [
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        render: (role: string) => (
          <Tag color={getRoleColor(role)}>{getRoleDisplayName(role)}</Tag>
        )
      },
      {
        title: '用户名',
        dataIndex: 'username',
        key: 'username'
      },
      {
        title: '显示名称',
        dataIndex: 'displayName',
        key: 'displayName'
      },
      {
        title: '权限',
        dataIndex: 'permissions',
        key: 'permissions',
        render: (permissions: string[]) => (
          <Space wrap>
            {permissions.map(p => <Tag key={p}>{p}</Tag>)}
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
        title: '状态',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (isActive: boolean) => (
          <Tag color={isActive ? 'success' : 'default'}>
            {isActive ? '激活' : '禁用'}
          </Tag>
        )
      },
      {
        title: '操作',
        key: 'actions',
        width: 200,
        render: (_, account) => (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => handleToggleAccountStatus(account.id, account.isActive)}
            >
              {account.isActive ? '停用' : '启用'}
            </Button>
            <Popconfirm
              title="确定要删除这个角色账号吗？"
              description="此操作不可恢复！"
              onConfirm={() => handleDeleteAccount(account.id)}
              okText="确定删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ];

    return (
      <Table
        columns={accountColumns}
        dataSource={record.accounts}
        pagination={false}
        rowKey="id"
        size="small"
      />
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和说明 */}
          <div>
            <Title level={3}>
              <UserOutlined /> 邮箱与角色账号管理
            </Title>
            <Alert
              message="核心概念"
              description={
                <div>
                  <Paragraph>
                    • <strong>一个邮箱可以对应多个角色账号</strong>（例如：test@gmail.com 可以同时拥有审核员、管理员、超级管理员三个账号）
                  </Paragraph>
                  <Paragraph>
                    • <strong>邮箱用于身份验证</strong>（通过Google OAuth）
                  </Paragraph>
                  <Paragraph>
                    • <strong>角色账号是实际的系统账户</strong>（用户登录时选择角色，然后用邮箱验证）
                  </Paragraph>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          </div>

          {/* 操作按钮 */}
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setModalVisible(true);
              }}
            >
              创建角色账号
            </Button>
          </div>

          {/* 邮箱和账号列表 */}
          <Table
            columns={columns}
            dataSource={emails}
            loading={loading}
            rowKey="id"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.accounts.length > 0
            }}
          />
        </Space>
      </Card>

      {/* 创建角色账号Modal */}
      <Modal
        title="创建角色账号"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Alert
          message="支持多选角色"
          description="您可以为同一个邮箱一次性创建多个角色账号。例如：选择「审核员」和「管理员」，系统将为该邮箱创建两个账号。"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAccount}
        >
          <Form.Item
            label="Gmail邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入Gmail邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="user@gmail.com" />
          </Form.Item>

          <Form.Item
            label="角色（可多选）"
            name="roles"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
            tooltip="可以为同一个邮箱创建多个角色账号"
          >
            <Select
              mode="multiple"
              placeholder="选择一个或多个角色"
              allowClear
            >
              <Option value="reviewer">审核员</Option>
              <Option value="admin">管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="displayName"
          >
            <Input placeholder="例如：张三 (管理员)" />
          </Form.Item>

          <Form.Item
            label="权限"
            name="permissions"
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
                  >
                    <Input prefix={<UserOutlined />} placeholder="自动生成或手动输入" />
                  </Form.Item>

                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="备注"
            name="notes"
          >
            <Input.TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailRoleAccountManagement;


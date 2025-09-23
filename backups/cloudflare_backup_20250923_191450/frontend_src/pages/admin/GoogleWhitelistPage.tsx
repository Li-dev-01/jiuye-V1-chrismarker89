/**
 * Google OAuth白名单管理页面
 * 仅超级管理员可以访问
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Typography,
  Alert,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GoogleOutlined,
  SecurityScanOutlined,
  UserOutlined,
  CrownOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface WhitelistEntry {
  id: string;
  email: string;
  role: 'admin' | 'reviewer' | 'super_admin';
  displayName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastUsed?: string;
  createdBy: string;
}

interface WhitelistFormData {
  email: string;
  role: 'admin' | 'reviewer' | 'super_admin';
  displayName?: string;
}

export const GoogleWhitelistPage: React.FC = () => {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WhitelistEntry | null>(null);
  const [form] = Form.useForm<WhitelistFormData>();

  // 角色配置
  const roleConfig = {
    super_admin: { label: '超级管理员', color: 'red', icon: <CrownOutlined /> },
    admin: { label: '管理员', color: 'blue', icon: <SecurityScanOutlined /> },
    reviewer: { label: '审核员', color: 'green', icon: <UserOutlined /> }
  };

  // 加载白名单数据
  const loadWhitelist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/google-whitelist');
      if (response.ok) {
        const data = await response.json();
        setWhitelist(data.data || []);
      } else {
        message.error('加载白名单失败');
      }
    } catch (error) {
      console.error('Load whitelist error:', error);
      message.error('加载白名单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWhitelist();
  }, []);

  // 表格列定义
  const columns: ColumnsType<WhitelistEntry> = [
    {
      title: '邮箱地址',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <GoogleOutlined style={{ color: '#4285f4' }} />
          <Text copyable>{email}</Text>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: keyof typeof roleConfig) => {
        const config = roleConfig[role];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      }
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (name: string) => name || <Text type="secondary">未设置</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date: string) => date ? new Date(date).toLocaleString() : <Text type="secondary">从未使用</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个白名单条目吗？"
            description="删除后该邮箱将无法通过Google登录"
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

  // 处理添加/编辑
  const handleSubmit = async (values: WhitelistFormData) => {
    try {
      const url = editingEntry 
        ? `/api/admin/google-whitelist/${editingEntry.id}`
        : '/api/admin/google-whitelist';
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(editingEntry ? '更新成功' : '添加成功');
        setModalVisible(false);
        setEditingEntry(null);
        form.resetFields();
        loadWhitelist();
      } else {
        const error = await response.json();
        message.error(error.message || '操作失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      message.error('操作失败');
    }
  };

  // 处理编辑
  const handleEdit = (entry: WhitelistEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      email: entry.email,
      role: entry.role,
      displayName: entry.displayName
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/google-whitelist/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        message.success('删除成功');
        loadWhitelist();
      } else {
        const error = await response.json();
        message.error(error.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('删除失败');
    }
  };

  // 处理模态框关闭
  const handleModalClose = () => {
    setModalVisible(false);
    setEditingEntry(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <GoogleOutlined style={{ color: '#4285f4', marginRight: '8px' }} />
            Google OAuth 白名单管理
          </Title>
          <Text type="secondary">
            管理允许通过Google账号登录的管理员邮箱列表
          </Text>
        </div>

        <Alert
          message="安全提醒"
          description="只有在此白名单中的Google邮箱才能通过Google OAuth登录管理系统。请谨慎管理白名单，避免未授权访问。"
          type="warning"
          showIcon
          icon={<SafetyOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong>白名单条目: {whitelist.length}</Text>
            <Divider type="vertical" />
            <Text type="secondary">
              活跃: {whitelist.filter(item => item.status === 'active').length}
            </Text>
          </Space>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            添加邮箱
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={whitelist}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />

        {/* 添加/编辑模态框 */}
        <Modal
          title={editingEntry ? '编辑白名单条目' : '添加白名单条目'}
          open={modalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="email"
              label="Google邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<GoogleOutlined />}
                placeholder="example@gmail.com"
                disabled={!!editingEntry}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="管理员角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="选择角色">
                <Option value="reviewer">
                  <Space>
                    <UserOutlined />
                    审核员
                  </Space>
                </Option>
                <Option value="admin">
                  <Space>
                    <SecurityScanOutlined />
                    管理员
                  </Space>
                </Option>
                <Option value="super_admin">
                  <Space>
                    <CrownOutlined />
                    超级管理员
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="displayName"
              label="显示名称（可选）"
            >
              <Input placeholder="用于显示的友好名称" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleModalClose}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingEntry ? '更新' : '添加'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default GoogleWhitelistPage;

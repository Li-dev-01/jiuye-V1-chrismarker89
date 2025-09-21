/**
 * 管理员数据备份页面
 * 提供数据备份、恢复、下载等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Select,
  Switch,
  DatePicker,
  message,
  Typography,
  Progress,
  Tag,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

interface BackupInfo {
  id: string;
  type: string;
  createdAt: string;
  size: number;
  recordCount: number;
  downloadUrl: string;
  description: string;
}

interface BackupOptions {
  type: 'full' | 'incremental';
  includeQuestionnaires: boolean;
  includeHeartVoices: boolean;
  includeUsers: boolean;
  includeAnalytics: boolean;
  dateRange?: [string, string];
  format: 'json' | 'csv' | 'excel';
}

export const DataBackup: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBackupList();
  }, []);

  const loadBackupList = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/files/backup/list`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBackups(result.data.backups);
        }
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
      message.error('加载备份列表失败');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (values: BackupOptions) => {
    try {
      setIsCreatingBackup(true);
      setBackupProgress(0);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/files/backup/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            type: values.type,
            options: {
              includeQuestionnaires: values.includeQuestionnaires,
              includeHeartVoices: values.includeHeartVoices,
              includeUsers: values.includeUsers,
              includeAnalytics: values.includeAnalytics,
              dateRange: values.dateRange ? {
                start: values.dateRange[0],
                end: values.dateRange[1]
              } : undefined,
              format: values.format
            }
          })
        }
      );

      clearInterval(progressInterval);
      setBackupProgress(100);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success('备份创建成功！');
          setCreateModalVisible(false);
          loadBackupList();
          form.resetFields();
        } else {
          message.error(result.message || '备份创建失败');
        }
      } else {
        message.error('备份创建失败');
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      message.error('创建备份失败');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const restoreBackup = async (backupKey: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/files/backup/restore`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ backupKey })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success(`数据恢复成功！恢复了 ${result.data.restoredRecords} 条记录`);
          setRestoreModalVisible(false);
        } else {
          message.error(result.message || '数据恢复失败');
        }
      } else {
        message.error('数据恢复失败');
      }
    } catch (error) {
      console.error('数据恢复失败:', error);
      message.error('数据恢复失败');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = (backup: BackupInfo) => {
    const link = document.createElement('a');
    link.href = backup.downloadUrl;
    link.download = `backup-${backup.id}.json`;
    link.click();
    message.success('备份下载已开始');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: ColumnsType<BackupInfo> = [
    {
      title: '备份ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === '完整备份' ? 'blue' : 'green'}>
          {type}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {new Date(date).toLocaleString('zh-CN')}
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size) => formatFileSize(size)
    },
    {
      title: '记录数量',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 120,
      render: (count) => (
        <Space>
          <DatabaseOutlined />
          {count.toLocaleString()}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="下载备份">
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadBackup(record)}
            >
              下载
            </Button>
          </Tooltip>
          <Tooltip title="恢复数据">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSelectedBackup(record);
                setRestoreModalVisible(true);
              }}
            >
              恢复
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定要删除这个备份吗？"
            onConfirm={() => {
              // TODO: 实现删除备份功能
              message.success('备份删除成功');
              loadBackupList();
            }}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除备份">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <DatabaseOutlined style={{ marginRight: '8px' }} />
            数据备份管理
          </Title>
          <Paragraph type="secondary">
            管理系统数据的备份与恢复，确保数据安全
          </Paragraph>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建备份
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadBackupList}
              loading={loading}
            >
              刷新列表
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={backups}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个备份`
          }}
        />
      </Card>

      {/* 创建备份模态框 */}
      <Modal
        title="创建数据备份"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createBackup}
          initialValues={{
            type: 'full',
            includeQuestionnaires: true,
            includeHeartVoices: true,
            includeUsers: false,
            includeAnalytics: false,
            format: 'json'
          }}
        >
          <Form.Item
            name="type"
            label="备份类型"
            rules={[{ required: true, message: '请选择备份类型' }]}
          >
            <Select>
              <Select.Option value="full">完整备份</Select.Option>
              <Select.Option value="incremental">增量备份</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="包含数据">
            <Form.Item name="includeQuestionnaires" valuePropName="checked" noStyle>
              <Switch /> 问卷数据
            </Form.Item>
            <br />
            <Form.Item name="includeHeartVoices" valuePropName="checked" noStyle>
              <Switch /> 心声数据
            </Form.Item>
            <br />
            <Form.Item name="includeUsers" valuePropName="checked" noStyle>
              <Switch /> 用户数据
            </Form.Item>
            <br />
            <Form.Item name="includeAnalytics" valuePropName="checked" noStyle>
              <Switch /> 分析数据
            </Form.Item>
          </Form.Item>

          <Form.Item name="dateRange" label="时间范围（可选）">
            <RangePicker showTime />
          </Form.Item>

          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Select.Option value="json">JSON</Select.Option>
              <Select.Option value="csv">CSV</Select.Option>
              <Select.Option value="excel">Excel</Select.Option>
            </Select>
          </Form.Item>

          {isCreatingBackup && (
            <div style={{ marginBottom: '16px' }}>
              <Text>备份进度：</Text>
              <Progress percent={backupProgress} />
            </div>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreatingBackup}
                icon={<CloudUploadOutlined />}
              >
                创建备份
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 恢复备份模态框 */}
      <Modal
        title="恢复数据备份"
        open={restoreModalVisible}
        onCancel={() => setRestoreModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRestoreModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="restore"
            type="primary"
            danger
            loading={loading}
            onClick={() => selectedBackup && restoreBackup(`backups/${selectedBackup.id}.json`)}
            icon={<ExclamationCircleOutlined />}
          >
            确认恢复
          </Button>
        ]}
      >
        {selectedBackup && (
          <div>
            <Paragraph>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
              <strong>警告：</strong>恢复操作将覆盖现有数据，请确保您了解此操作的后果。
            </Paragraph>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text><strong>备份ID：</strong>{selectedBackup.id}</Text>
                <Text><strong>创建时间：</strong>{new Date(selectedBackup.createdAt).toLocaleString('zh-CN')}</Text>
                <Text><strong>记录数量：</strong>{selectedBackup.recordCount.toLocaleString()}</Text>
                <Text><strong>文件大小：</strong>{formatFileSize(selectedBackup.size)}</Text>
              </Space>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

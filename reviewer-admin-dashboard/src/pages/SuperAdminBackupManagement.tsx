/**
 * 超级管理员 - 数据备份与恢复管理
 * 提供数据库备份、恢复、清理功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  DatabaseOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { API_CONFIG } from '../config/api';

const { Title, Paragraph, Text } = Typography;

interface BackupMetadata {
  backupId: string;
  timestamp: string;
  date: string;
  size: number;
  tableCount: number;
  recordCount: number;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

const SuperAdminBackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // 获取备份列表
  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/super-admin/backup/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setBackups(data.data.backups);
      } else {
        message.error(data.message || '获取备份列表失败');
      }
    } catch (error) {
      console.error('获取备份列表失败:', error);
      message.error('获取备份列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建备份
  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/super-admin/backup/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        message.success('数据库备份创建成功');
        fetchBackups();
      } else {
        message.error(data.message || '创建备份失败');
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      message.error('创建备份失败');
    } finally {
      setCreating(false);
    }
  };

  // 恢复备份
  const handleRestoreBackup = async (backupId: string) => {
    Modal.confirm({
      title: '确认恢复数据库？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Alert
            message="警告：此操作将覆盖当前所有数据！"
            description="恢复操作会删除当前数据库中的所有数据，并用备份数据替换。此操作不可逆，请确保已做好准备。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p>备份ID: <Text code>{backupId}</Text></p>
          <p>请确认您要执行此操作。</p>
        </div>
      ),
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setRestoring(true);
        try {
          const token = localStorage.getItem('super_admin_token');
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/super-admin/backup/restore`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ backupId })
          });

          const data = await response.json();
          if (data.success) {
            message.success(`数据库恢复成功！恢复了 ${data.data.restoredTables} 个表，${data.data.restoredRecords} 条记录`);
          } else {
            message.error(data.message || '恢复备份失败');
          }
        } catch (error) {
          console.error('恢复备份失败:', error);
          message.error('恢复备份失败');
        } finally {
          setRestoring(false);
        }
      }
    });
  };

  // 清理旧备份
  const handleCleanupOldBackups = async () => {
    Modal.confirm({
      title: '确认清理旧备份？',
      content: '此操作将删除7天前的所有备份，是否继续？',
      okText: '确认清理',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('super_admin_token');
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/super-admin/backup/cleanup`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          if (data.success) {
            message.success(data.message);
            fetchBackups();
          } else {
            message.error(data.message || '清理旧备份失败');
          }
        } catch (error) {
          console.error('清理旧备份失败:', error);
          message.error('清理旧备份失败');
        }
      }
    });
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // 表格列定义
  const columns: ColumnsType<BackupMetadata> = [
    {
      title: '备份ID',
      dataIndex: 'backupId',
      key: 'backupId',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: '备份日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: 'descend'
    },
    {
      title: '备份时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${(size / 1024 / 1024).toFixed(2)} MB`
    },
    {
      title: '表数量',
      dataIndex: 'tableCount',
      key: 'tableCount'
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count) => count.toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: '完成' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
          in_progress: { color: 'processing', icon: <ClockCircleOutlined />, text: '进行中' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="从此备份恢复数据库">
            <Button
              type="primary"
              size="small"
              icon={<CloudDownloadOutlined />}
              onClick={() => handleRestoreBackup(record.backupId)}
              disabled={record.status !== 'completed' || restoring}
              loading={restoring}
            >
              恢复
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  // 统计信息
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  const completedBackups = backups.filter(b => b.status === 'completed').length;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <DatabaseOutlined /> 数据备份与恢复
          </Title>
          <Paragraph type="secondary">
            管理数据库备份，支持每日自动备份和手动恢复。备份保留最近7天，自动清理旧备份。
          </Paragraph>
        </div>

        <Alert
          message="备份策略"
          description="系统每天凌晨2点自动创建数据库备份，并清理7天前的旧备份。您也可以手动创建备份。恢复操作会覆盖当前所有数据，请谨慎操作。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="备份总数"
                value={backups.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="成功备份"
                value={completedBackups}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总大小"
                value={(totalSize / 1024 / 1024).toFixed(2)}
                suffix="MB"
                prefix={<CloudUploadOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleCreateBackup}
              loading={creating}
            >
              创建备份
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBackups}
              loading={loading}
            >
              刷新列表
            </Button>
            <Popconfirm
              title="确认清理7天前的旧备份？"
              onConfirm={handleCleanupOldBackups}
              okText="确认"
              cancelText="取消"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
              >
                清理旧备份
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={backups}
          rowKey="backupId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个备份`
          }}
        />
      </Card>
    </div>
  );
};

export default SuperAdminBackupManagement;


import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Progress,
  Alert,
  Modal,
  Form,
  Select,
  DatePicker,
  Statistic,
  Typography,
  List,
  Tag,
  message,
  Popconfirm
} from 'antd';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface BackupRecord {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'manual';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
}

interface DataManagementProps {
  onRefresh: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  onRefresh
}) => {
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [cleanupModalVisible, setCleanupModalVisible] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [form] = Form.useForm();

  // 模拟备份记录
  const backupRecords: BackupRecord[] = [
    {
      id: '1',
      name: '自动备份_20250115',
      type: 'full',
      size: '245.6 MB',
      createdAt: '2025-01-15 02:00:00',
      status: 'completed'
    },
    {
      id: '2',
      name: '手动备份_20250114',
      type: 'manual',
      size: '189.3 MB',
      createdAt: '2025-01-14 16:30:00',
      status: 'completed'
    },
    {
      id: '3',
      name: '增量备份_20250114',
      type: 'incremental',
      size: '23.7 MB',
      createdAt: '2025-01-14 02:00:00',
      status: 'completed'
    },
    {
      id: '4',
      name: '自动备份_20250113',
      type: 'full',
      size: '234.1 MB',
      createdAt: '2025-01-13 02:00:00',
      status: 'failed'
    }
  ];

  const typeColors = {
    full: 'blue',
    incremental: 'green',
    manual: 'orange'
  };

  const typeLabels = {
    full: '完整备份',
    incremental: '增量备份',
    manual: '手动备份'
  };

  const statusColors = {
    completed: 'success',
    failed: 'error',
    in_progress: 'processing'
  };

  const statusLabels = {
    completed: '已完成',
    failed: '失败',
    in_progress: '进行中'
  };

  const handleBackup = async () => {
    try {
      const values = await form.validateFields();
      setIsBackingUp(true);
      setBackupProgress(0);
      
      // 模拟备份进度
      const timer = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsBackingUp(false);
            setBackupModalVisible(false);
            message.success('数据备份完成');
            onRefresh();
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      
    } catch (error) {
      message.error('备份失败，请重试');
    }
  };

  const handleRestore = async () => {
    try {
      const values = await form.validateFields();
      
      Modal.confirm({
        title: '确认恢复数据',
        icon: <ExclamationCircleOutlined />,
        content: '数据恢复将覆盖当前所有数据，此操作不可撤销。确定要继续吗？',
        okType: 'danger',
        onOk: () => {
          message.success('数据恢复已开始，请稍候...');
          setRestoreModalVisible(false);
          onRefresh();
        }
      });
    } catch (error) {
      message.error('恢复失败，请重试');
    }
  };

  const handleCleanup = async () => {
    try {
      const values = await form.validateFields();
      
      Modal.confirm({
        title: '确认清理数据',
        icon: <ExclamationCircleOutlined />,
        content: '数据清理将永久删除选定的数据，此操作不可撤销。确定要继续吗？',
        okType: 'danger',
        onOk: () => {
          message.success('数据清理已完成');
          setCleanupModalVisible(false);
          onRefresh();
        }
      });
    } catch (error) {
      message.error('清理失败，请重试');
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    message.success('备份文件已删除');
    onRefresh();
  };

  const handleDownloadBackup = (backup: BackupRecord) => {
    message.success(`开始下载备份文件: ${backup.name}`);
  };

  return (
    <div>
      {/* 操作按钮区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="数据备份"
              value="自动备份已启用"
              prefix={<CloudDownloadOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={() => setBackupModalVisible(true)}
              >
                立即备份
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="数据恢复"
              value="从备份恢复"
              prefix={<CloudUploadOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
            <Space style={{ marginTop: 16 }}>
              <Button
                icon={<CloudUploadOutlined />}
                onClick={() => setRestoreModalVisible(true)}
              >
                恢复数据
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="数据清理"
              value="清理过期数据"
              prefix={<DeleteOutlined />}
              valueStyle={{ fontSize: '16px' }}
            />
            <Space style={{ marginTop: 16 }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setCleanupModalVisible(true)}
              >
                清理数据
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 备份进度 */}
      {isBackingUp && (
        <Alert
          message="正在备份数据..."
          description={
            <Progress
              percent={backupProgress}
              status="active"
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
            />
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 备份历史 */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            备份历史
          </Space>
        }
      >
        <List
          dataSource={backupRecords}
          renderItem={record => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => handleDownloadBackup(record)}
                >
                  下载
                </Button>,
                <Popconfirm
                  title="确定要删除这个备份吗？"
                  onConfirm={() => handleDeleteBackup(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={
                  record.status === 'completed' ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  ) : record.status === 'failed' ? (
                    <ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: 20 }} />
                  ) : (
                    <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  )
                }
                title={
                  <Space>
                    <Text strong>{record.name}</Text>
                    <Tag color={typeColors[record.type]}>
                      {typeLabels[record.type]}
                    </Tag>
                    <Tag color={statusColors[record.status]}>
                      {statusLabels[record.status]}
                    </Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">大小: {record.size}</Text>
                    <Text type="secondary">时间: {record.createdAt}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 备份模态框 */}
      <Modal
        title="创建数据备份"
        open={backupModalVisible}
        onOk={handleBackup}
        onCancel={() => setBackupModalVisible(false)}
        confirmLoading={isBackingUp}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="备份类型"
            initialValue="full"
            rules={[{ required: true, message: '请选择备份类型' }]}
          >
            <Select>
              <Option value="full">完整备份</Option>
              <Option value="incremental">增量备份</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="备份名称"
            rules={[{ required: true, message: '请输入备份名称' }]}
          >
            <input placeholder="输入备份名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 恢复模态框 */}
      <Modal
        title="恢复数据"
        open={restoreModalVisible}
        onOk={handleRestore}
        onCancel={() => setRestoreModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="backupId"
            label="选择备份"
            rules={[{ required: true, message: '请选择要恢复的备份' }]}
          >
            <Select placeholder="选择备份文件">
              {backupRecords
                .filter(record => record.status === 'completed')
                .map(record => (
                  <Option key={record.id} value={record.id}>
                    {record.name} ({record.size})
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 清理模态框 */}
      <Modal
        title="数据清理"
        open={cleanupModalVisible}
        onOk={handleCleanup}
        onCancel={() => setCleanupModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dataType"
            label="清理类型"
            rules={[{ required: true, message: '请选择清理类型' }]}
          >
            <Select mode="multiple" placeholder="选择要清理的数据类型">
              <Option value="logs">系统日志</Option>
              <Option value="temp">临时文件</Option>
              <Option value="cache">缓存数据</Option>
              <Option value="expired">过期数据</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="时间范围"
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

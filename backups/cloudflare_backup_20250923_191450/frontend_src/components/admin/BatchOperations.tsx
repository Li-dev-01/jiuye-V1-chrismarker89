import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Checkbox,
  Dropdown,
  Modal,
  message,
  Tag,
  Tooltip,
  Progress,
  Typography
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface BatchItem {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  submittedAt: string;
  submittedBy: string;
  type: 'questionnaire' | 'story' | 'comment';
}

interface BatchOperationsProps {
  data: BatchItem[];
  loading?: boolean;
  onRefresh: () => void;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  data,
  loading = false,
  onRefresh
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const statusColors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    draft: 'blue'
  };

  const statusLabels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    draft: '草稿'
  };

  const typeLabels = {
    questionnaire: '问卷',
    story: '故事',
    comment: '评论'
  };

  const columns: ColumnsType<BatchItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: keyof typeof typeLabels) => (
        <Tag>{typeLabels[type]}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '提交者',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 120
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    onSelectAll: (selected: boolean, selectedRows: BatchItem[], changeRows: BatchItem[]) => {
      console.log('Select all:', selected, selectedRows, changeRows);
    }
  };

  const simulateProgress = (callback: () => void) => {
    setProgressVisible(true);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setProgressVisible(false);
          callback();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审核的项目');
      return;
    }

    Modal.confirm({
      title: '批量审核',
      icon: <ExclamationCircleOutlined />,
      content: `确定要批量通过选中的 ${selectedRowKeys.length} 个项目吗？`,
      onOk: () => {
        setOperationLoading(true);
        simulateProgress(() => {
          message.success(`成功审核通过 ${selectedRowKeys.length} 个项目`);
          setSelectedRowKeys([]);
          setOperationLoading(false);
          onRefresh();
        });
      }
    });
  };

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要拒绝的项目');
      return;
    }

    Modal.confirm({
      title: '批量拒绝',
      icon: <ExclamationCircleOutlined />,
      content: `确定要批量拒绝选中的 ${selectedRowKeys.length} 个项目吗？`,
      onOk: () => {
        setOperationLoading(true);
        simulateProgress(() => {
          message.success(`成功拒绝 ${selectedRowKeys.length} 个项目`);
          setSelectedRowKeys([]);
          setOperationLoading(false);
          onRefresh();
        });
      }
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的项目');
      return;
    }

    Modal.confirm({
      title: '批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 个项目吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: () => {
        setOperationLoading(true);
        simulateProgress(() => {
          message.success(`成功删除 ${selectedRowKeys.length} 个项目`);
          setSelectedRowKeys([]);
          setOperationLoading(false);
          onRefresh();
        });
      }
    });
  };

  const handleBatchExport = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的项目');
      return;
    }

    setOperationLoading(true);
    simulateProgress(() => {
      message.success(`成功导出 ${selectedRowKeys.length} 个项目的数据`);
      setOperationLoading(false);
    });
  };

  const moreOperations = [
    {
      key: 'export',
      label: '批量导出',
      icon: <DownloadOutlined />,
      onClick: handleBatchExport
    },
    {
      key: 'archive',
      label: '批量归档',
      icon: <MoreOutlined />,
      onClick: () => message.info('归档功能开发中...')
    }
  ];

  return (
    <Card
      title={
        <Space>
          <span>批量操作</span>
          {selectedRowKeys.length > 0 && (
            <Text type="secondary">已选择 {selectedRowKeys.length} 项</Text>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={operationLoading}
            onClick={handleBatchApprove}
          >
            批量通过
          </Button>
          <Button
            icon={<CloseOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={operationLoading}
            onClick={handleBatchReject}
          >
            批量拒绝
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={operationLoading}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
          <Dropdown
            menu={{
              items: moreOperations.map(op => ({
                key: op.key,
                label: op.label,
                icon: op.icon,
                onClick: op.onClick,
                disabled: selectedRowKeys.length === 0
              }))
            }}
            disabled={selectedRowKeys.length === 0}
          >
            <Button icon={<MoreOutlined />}>
              更多操作
            </Button>
          </Dropdown>
        </Space>
      }
    >
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
      />

      <Modal
        title="操作进度"
        open={progressVisible}
        footer={null}
        closable={false}
        centered
      >
        <Progress percent={progress} status="active" />
        <Text type="secondary">正在处理中，请稍候...</Text>
      </Modal>
    </Card>
  );
};

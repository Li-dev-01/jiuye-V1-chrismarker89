/**
 * 超级管理员审计日志页面
 * 功能：
 * 1. 查看所有账户管理操作日志
 * 2. 筛选和搜索日志
 * 3. 查看日志统计信息
 * 4. 导出日志
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Tag,
  Typography,
  DatePicker,
  Select,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  message,
  Descriptions
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
  id: number;
  operatorEmail: string;
  operatorRole: string;
  action: string;
  targetEmail: string;
  targetRole: string;
  targetAccountId: number;
  details: any;
  success: boolean;
  createdAt: string;
}

interface AuditLogStats {
  actionStats: Array<{ action: string; count: number }>;
  operatorStats: Array<{ operatorEmail: string; count: number }>;
  successStats: Array<{ success: boolean; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

const SuperAdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    action: '',
    targetEmail: '',
    operatorEmail: '',
    dateRange: null as [Dayjs, Dayjs] | null
  });

  // 操作类型映射
  const actionLabels: Record<string, string> = {
    'create_account': '创建账号',
    'update_account': '更新账号',
    'delete_account': '删除账号',
    'enable_2fa': '启用2FA',
    'disable_2fa': '禁用2FA',
    'activate_role': '激活角色',
    'toggle_status': '切换状态',
    'update_permissions': '更新权限'
  };

  // 加载审计日志
  const loadAuditLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString()
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.targetEmail) params.append('targetEmail', filters.targetEmail);
      if (filters.operatorEmail) params.append('operatorEmail', filters.operatorEmail);
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].toISOString());
        params.append('endDate', filters.dateRange[1].toISOString());
      }

      const response = await fetch(`/api/admin/account-management/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data.logs);
        setPagination({
          ...pagination,
          current: page,
          total: data.data.pagination.total
        });
      } else {
        message.error('加载审计日志失败');
      }
    } catch (error) {
      console.error('Load audit logs error:', error);
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/account-management/audit-logs/stats?days=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('super_admin_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadStats();
  }, []);

  // 处理筛选
  const handleFilter = () => {
    loadAuditLogs(1);
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      action: '',
      targetEmail: '',
      operatorEmail: '',
      dateRange: null
    });
    setTimeout(() => loadAuditLogs(1), 0);
  };

  // 导出日志
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 表格列定义
  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN')
    },
    {
      title: '操作者',
      key: 'operator',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <MailOutlined />
            <Text>{record.operatorEmail}</Text>
          </Space>
          <Tag color="blue">{record.operatorRole}</Tag>
        </Space>
      )
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => (
        <Tag color="purple">{actionLabels[action] || action}</Tag>
      )
    },
    {
      title: '目标',
      key: 'target',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <UserOutlined />
            <Text>{record.targetEmail}</Text>
          </Space>
          {record.targetRole && <Tag>{record.targetRole}</Tag>}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      width: 100,
      render: (success: boolean) => (
        success ? (
          <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
        )
      )
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        details ? (
          <Text code>{JSON.stringify(details)}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <FileTextOutlined /> 审计日志
          </Title>
          <Text type="secondary">
            查看所有账户管理操作的详细记录
          </Text>
        </div>

        {/* 统计信息 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总操作数（7天）"
                  value={stats.dailyStats.reduce((sum, s) => sum + s.count, 0)}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="成功操作"
                  value={stats.successStats.find(s => s.success)?.count || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="失败操作"
                  value={stats.successStats.find(s => !s.success)?.count || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃操作者"
                  value={stats.operatorStats.length}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选条件 */}
        <Card style={{ marginBottom: '16px' }} size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Select
                placeholder="选择操作类型"
                value={filters.action || undefined}
                onChange={(value) => setFilters({ ...filters, action: value })}
                style={{ width: '100%' }}
                allowClear
              >
                {Object.entries(actionLabels).map(([key, label]) => (
                  <Option key={key} value={key}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="目标邮箱"
                value={filters.targetEmail}
                onChange={(e) => setFilters({ ...filters, targetEmail: e.target.value })}
                prefix={<MailOutlined />}
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="操作者邮箱"
                value={filters.operatorEmail}
                onChange={(e) => setFilters({ ...filters, operatorEmail: e.target.value })}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] | null })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleFilter}
              >
                筛选
              </Button>
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Col>
            <Col>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 日志表格 */}
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, pageSize });
              loadAuditLogs(page);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default SuperAdminAuditLogs;


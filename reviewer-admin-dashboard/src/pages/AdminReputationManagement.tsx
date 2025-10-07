import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Tabs,
  Badge,
  Tooltip,
  Input,
  Select
} from 'antd';
import {
  WarningOutlined,
  UserOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { adminApiClient } from '../services/adminApiClient';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

interface ReporterReputation {
  user_id: number;
  total_reports: number;
  valid_reports: number;
  invalid_reports: number;
  malicious_reports: number;
  reputation_score: number;
  reputation_level: string;
  is_restricted: boolean;
  restriction_reason: string;
  last_report_at: string;
}

interface UserReport {
  id: number;
  content_type: string;
  content_id: number;
  reporter_user_id: number;
  reported_user_id: number;
  report_type: string;
  report_reason: string;
  status: string;
  review_result: string;
  created_at: string;
  reviewed_at: string;
  priority: number;
  reputation_score: number;
  reputation_level: string;
}

const AdminReputationManagement: React.FC = () => {
  const [maliciousUsers, setMaliciousUsers] = useState<ReporterReputation[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    validReports: 0,
    maliciousReports: 0,
    restrictedUsers: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载恶意用户列表
      const maliciousRes = await adminApiClient.get('/api/simple-admin/reports/admin/malicious-users');
      const maliciousData = maliciousRes.data;
      if (maliciousData.success) {
        setMaliciousUsers(maliciousData.data);
      }

      // 加载举报列表
      const reportsRes = await adminApiClient.get('/api/simple-admin/reports/admin/list?limit=100');
      const reportsData = reportsRes.data;
      if (reportsData.success) {
        setReports(reportsData.data);
      }

      // 计算统计数据
      calculateStats(maliciousData.data, reportsData.data);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (users: ReporterReputation[], reports: UserReport[]) => {
    setStats({
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      validReports: reports.filter(r => r.status === 'valid').length,
      maliciousReports: reports.filter(r => r.status === 'malicious').length,
      restrictedUsers: users.filter(u => u.is_restricted).length
    });
  };

  const getReputationLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      excellent: 'green',
      good: 'blue',
      normal: 'default',
      poor: 'orange',
      bad: 'red'
    };
    return colors[level] || 'default';
  };

  const getReputationLevelText = (level: string) => {
    const texts: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      normal: '正常',
      poor: '较差',
      bad: '恶劣'
    };
    return texts[level] || level;
  };

  const getReportTypeText = (type: string) => {
    const types: Record<string, string> = {
      political: '🚫 政治敏感',
      pornographic: '🔞 色情内容',
      violent: '⚠️ 暴力血腥',
      harassment: '😡 骚扰辱骂',
      spam: '📢 垃圾广告',
      privacy: '🔒 隐私泄露',
      fake_info: '❌ 虚假信息',
      off_topic: '📍 偏离主题',
      other: '❓ 其他'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      reviewing: 'blue',
      valid: 'green',
      invalid: 'default',
      malicious: 'red',
      auto_dismissed: 'purple'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待处理',
      reviewing: '审核中',
      valid: '有效举报',
      invalid: '无效举报',
      malicious: '恶意举报',
      auto_dismissed: '自动驳回'
    };
    return texts[status] || status;
  };

  const maliciousUsersColumns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100
    },
    {
      title: '信誉评分',
      dataIndex: 'reputation_score',
      key: 'reputation_score',
      width: 120,
      render: (score: number) => (
        <span style={{ 
          color: score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red',
          fontWeight: 'bold'
        }}>
          {score.toFixed(1)}
        </span>
      ),
      sorter: (a: ReporterReputation, b: ReporterReputation) => a.reputation_score - b.reputation_score
    },
    {
      title: '信誉等级',
      dataIndex: 'reputation_level',
      key: 'reputation_level',
      width: 100,
      render: (level: string) => (
        <Tag color={getReputationLevelColor(level)}>
          {getReputationLevelText(level)}
        </Tag>
      )
    },
    {
      title: '举报统计',
      key: 'stats',
      width: 200,
      render: (_: any, record: ReporterReputation) => (
        <Space direction="vertical" size="small">
          <span>总计: {record.total_reports}</span>
          <Space size="small">
            <Tag color="green" icon={<CheckCircleOutlined />}>
              有效: {record.valid_reports}
            </Tag>
            <Tag color="orange" icon={<CloseCircleOutlined />}>
              无效: {record.invalid_reports}
            </Tag>
            <Tag color="red" icon={<WarningOutlined />}>
              恶意: {record.malicious_reports}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '限制状态',
      key: 'restriction',
      width: 150,
      render: (_: any, record: ReporterReputation) => (
        record.is_restricted ? (
          <Tooltip title={record.restriction_reason}>
            <Tag color="red" icon={<StopOutlined />}>
              已限制
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="green">正常</Tag>
        )
      )
    },
    {
      title: '最后举报',
      dataIndex: 'last_report_at',
      key: 'last_report_at',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    }
  ];

  const reportsColumns = [
    {
      title: '举报ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => (
        <Badge 
          count={priority} 
          style={{ 
            backgroundColor: priority <= 3 ? '#f5222d' : priority <= 6 ? '#fa8c16' : '#52c41a' 
          }} 
        />
      ),
      sorter: (a: UserReport, b: UserReport) => a.priority - b.priority
    },
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (type: string) => (
        <Tag>{type === 'story' ? '故事' : type}</Tag>
      )
    },
    {
      title: '举报类型',
      dataIndex: 'report_type',
      key: 'report_type',
      width: 150,
      render: (type: string) => getReportTypeText(type)
    },
    {
      title: '举报人',
      dataIndex: 'reporter_user_id',
      key: 'reporter_user_id',
      width: 100
    },
    {
      title: '举报人信誉',
      key: 'reporter_reputation',
      width: 120,
      render: (_: any, record: UserReport) => (
        <Space direction="vertical" size="small">
          <span style={{
            color: record.reputation_score >= 70 ? 'green' :
                   record.reputation_score >= 50 ? 'orange' : 'red',
            fontWeight: 'bold'
          }}>
            {record.reputation_score?.toFixed(1) || 'N/A'}
          </span>
          <Tag color={getReputationLevelColor(record.reputation_level)}>
            {getReputationLevelText(record.reputation_level)}
          </Tag>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '举报时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>
        <FlagOutlined /> 信誉管理 - 恶意举报与内容监控
      </h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总举报数"
              value={stats.totalReports}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pendingReports}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="有效举报"
              value={stats.validReports}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="恶意举报"
              value={stats.maliciousReports}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="被限制用户"
              value={stats.restrictedUsers}
              valueStyle={{ color: '#f5222d' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button type="primary" onClick={loadData} block>
              刷新数据
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 标签页 */}
      <Tabs defaultActiveKey="malicious-users">
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              恶意用户列表 ({maliciousUsers.length})
            </span>
          } 
          key="malicious-users"
        >
          <Card>
            <Table
              columns={maliciousUsersColumns}
              dataSource={maliciousUsers}
              rowKey="user_id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个用户`
              }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FlagOutlined />
              举报记录 ({reports.length})
            </span>
          } 
          key="reports"
        >
          <Card>
            <Table
              columns={reportsColumns}
              dataSource={reports}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条举报`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminReputationManagement;


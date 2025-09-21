import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Tag, 
  Typography, 
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Tooltip
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BookOutlined,
  MessageOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import styles from './ReviewerPages.module.css';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReviewRecord {
  id: string;
  type: 'questionnaire' | 'story' | 'voice';
  title: string;
  submittedBy: string;
  reviewedAt: string;
  decision: 'approved' | 'rejected';
  reviewNotes: string;
  reviewTime: number; // 审核用时（分钟）
}

export const ReviewHistoryPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ReviewRecord[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');

  // 加载审核历史数据
  useEffect(() => {
    const loadReviewHistory = async () => {
      setLoading(true);
      try {
        // TODO: 调用真实API获取审核历史
        // const response = await fetch('http://localhost:8006/api/reviewer/history');
        // const result = await response.json();

        // 暂时设置为空数组，等待API实现
        setRecords([]);
        setFilteredRecords([]);
      } catch (error) {
        console.error('加载审核历史失败:', error);
        setRecords([]);
        setFilteredRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviewHistory();
  }, []);

  // 筛选数据
  useEffect(() => {
    let filtered = [...records];

    // 日期筛选
    if (dateRange) {
      filtered = filtered.filter(record => {
        const reviewDate = dayjs(record.reviewedAt);
        return reviewDate.isAfter(dateRange[0]) && reviewDate.isBefore(dateRange[1]);
      });
    }

    // 类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    // 决定筛选
    if (decisionFilter !== 'all') {
      filtered = filtered.filter(record => record.decision === decisionFilter);
    }

    setFilteredRecords(filtered);
  }, [records, dateRange, typeFilter, decisionFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'questionnaire': return <FileTextOutlined />;
      case 'story': return <BookOutlined />;
      case 'voice': return <MessageOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'questionnaire': return '问卷';
      case 'story': return '故事';
      case 'voice': return '心声';
      default: return '未知';
    }
  };

  const getDecisionTag = (decision: string) => {
    switch (decision) {
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>通过</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          {getTypeName(type)}
        </Space>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text>{title}</Text>
        </Tooltip>
      )
    },
    {
      title: '提交者',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 100,
      render: (submittedBy: string) => (
        <Space>
          <UserOutlined />
          {submittedBy}
        </Space>
      )
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 150,
      sorter: (a: ReviewRecord, b: ReviewRecord) => 
        new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime()
    },
    {
      title: '审核结果',
      dataIndex: 'decision',
      key: 'decision',
      width: 100,
      render: (decision: string) => getDecisionTag(decision)
    },
    {
      title: '用时',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 80,
      render: (time: number) => (
        <Text>{time}分钟</Text>
      ),
      sorter: (a: ReviewRecord, b: ReviewRecord) => a.reviewTime - b.reviewTime
    },
    {
      title: '审核备注',
      dataIndex: 'reviewNotes',
      key: 'reviewNotes',
      ellipsis: true,
      render: (notes: string) => (
        <Tooltip title={notes}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {notes}
          </Text>
        </Tooltip>
      )
    }
  ];

  // 统计数据
  const stats = {
    total: filteredRecords.length,
    approved: filteredRecords.filter(r => r.decision === 'approved').length,
    rejected: filteredRecords.filter(r => r.decision === 'rejected').length,
    avgTime: filteredRecords.length > 0 
      ? (filteredRecords.reduce((sum, r) => sum + r.reviewTime, 0) / filteredRecords.length).toFixed(1)
      : 0,
    questionnaires: filteredRecords.filter(r => r.type === 'questionnaire').length,
    stories: filteredRecords.filter(r => r.type === 'story').length,
    voices: filteredRecords.filter(r => r.type === 'voice').length
  };

  const resetFilters = () => {
    setDateRange(null);
    setTypeFilter('all');
    setDecisionFilter('all');
  };

  return (
    <ReviewerLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <BarChartOutlined /> 审核历史
          </Title>
          <Paragraph>
            查看您的审核历史记录，分析审核效率和质量。
          </Paragraph>
        </div>

        {/* 筛选器 */}
        <Card title="筛选条件" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>日期范围</Text>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>内容类型</Text>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部类型</Option>
                  <Option value="questionnaire">问卷</Option>
                  <Option value="story">故事</Option>
                  <Option value="voice">心声</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>审核结果</Text>
                <Select
                  value={decisionFilter}
                  onChange={setDecisionFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部结果</Option>
                  <Option value="approved">通过</Option>
                  <Option value="rejected">拒绝</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Button onClick={resetFilters} style={{ marginTop: 24 }}>
                重置筛选
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总审核数"
                value={stats.total}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="通过率"
                value={stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均用时"
                value={stats.avgTime}
                suffix="分钟"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="拒绝数量"
                value={stats.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 类型分布统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="问卷审核"
                value={stats.questionnaires}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="故事审核"
                value={stats.stories}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="心声审核"
                value={stats.voices}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 审核记录列表 */}
        <Card title="审核记录">
          <Table
            columns={columns}
            dataSource={filteredRecords}
            rowKey="id"
            loading={loading}
            locale={{
              emptyText: (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>暂无审核记录</div>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    完成审核后，记录将在这里显示
                  </div>
                </div>
              )
            }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
          />
        </Card>
      </div>
    </ReviewerLayout>
  );
};

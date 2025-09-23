import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, message, Spin } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  BookOutlined,
  MessageOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import styles from './ReviewerDashboard.module.css';



export const ReviewerDashboard: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingQuestionnaires: 0,
    pendingStories: 0,
    pendingVoices: 0,
    todayReviewed: 0,
    totalReviewed: 0,
    averageReviewTime: 0,
    approvalRate: 0,
    weeklyProgress: 0,
    weeklyTarget: 0
  });
  const [error, setError] = useState<string | null>(null);

  // 加载审核员统计数据
  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';
      const response = await fetch(`${apiBaseUrl}/api/reviewer/stats`);
      const result = await response.json();

      if (result.success) {
        setStats({
          pendingQuestionnaires: 0, // 问卷不需要人工审核
          pendingStories: result.data.pendingStories || 0,
          pendingVoices: result.data.pendingVoices || 0,
          todayReviewed: result.data.todayReviewed || 0,
          totalReviewed: result.data.totalReviewed || 0,
          averageReviewTime: result.data.averageReviewTime || 0,
          approvalRate: 0, // API暂未提供
          weeklyProgress: 0, // API暂未提供
          weeklyTarget: 0 // API暂未提供
        });
      } else {
        setError(`API错误: ${result.error}`);
        message.error(`加载统计数据失败: ${result.error}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(`网络错误: ${errorMsg}`);
      message.error(`网络连接失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadStats();
  }, []);

  const [recentItems, setRecentItems] = useState([]);

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

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>待审核</Tag>;
      case 'reviewed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已审核</Tag>;
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
      ellipsis: true
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          disabled={record.status === 'reviewed'}
        >
          审核
        </Button>
      )
    }
  ];

  return (
    <ReviewerLayout>
      <div className={styles.container}>
        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>正在加载审核员数据...</div>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
              <h3>数据加载失败</h3>
              <p>{error}</p>
              <Button type="primary" onClick={loadStats}>重新加载</Button>
            </div>
          </Card>
        )}

        {/* 核心审核统计 */}
        {!loading && !error && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待审核总数"
                value={stats.pendingStories + stats.pendingVoices + stats.pendingQuestionnaires}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Link to="/reviewer/quick-review">
                  <Button type="primary" size="small" icon={<ThunderboltOutlined />}>
                    快速审核
                  </Button>
                </Link>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="今日已审核"
                value={stats.todayReviewed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Link to="/reviewer/history">
                  <Button size="small">查看记录</Button>
                </Link>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="通过率"
                value={stats.approvalRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Link to="/reviewer/settings">
                  <Button size="small">个人设置</Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
        )}

        {/* 分类审核区域 */}
        {!loading && !error && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待审核问卷"
                value={stats.pendingQuestionnaires}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Button size="small" disabled={stats.pendingQuestionnaires === 0}>
                  查看问卷
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待审核故事"
                value={stats.pendingStories}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Link to="/reviewer/stories">
                  <Button type="primary" size="small" disabled={stats.pendingStories === 0}>
                    审核故事
                  </Button>
                </Link>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待审核心声"
                value={stats.pendingVoices}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Link to="/reviewer/voices">
                  <Button type="primary" size="small" disabled={stats.pendingVoices === 0}>
                    审核心声
                  </Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
        )}

        {/* 今日统计 */}
        {!loading && !error && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="今日已审核"
                value={stats.todayReviewed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="累计审核"
                value={stats.totalReviewed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="平均审核时间"
                value={stats.averageReviewTime}
                suffix="分钟"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
        )}

        {/* 最近提交的内容 */}
        {!loading && !error && (
        <Card title="最近提交的内容" extra={
          <Link to="/reviewer/history">
            <Button type="link">查看全部</Button>
          </Link>
        }>
          {recentItems.length > 0 ? (
            <Table
              columns={columns}
              dataSource={recentItems}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>暂无最近提交的内容</div>
              <div style={{ marginTop: '8px' }}>
                <Link to="/reviewer/quick-review">
                  <Button type="primary">开始审核</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
        )}
      </div>
    </ReviewerLayout>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Typography, 
  Space,
  Button,
  Alert,
  Divider,
  Timeline,
  Tooltip
} from 'antd';
import { 
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RobotOutlined,
  SafetyOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { enhancedReviewerService } from '../services/enhancedReviewerService';
import type { ReviewerDashboardData } from '../types/auditTypes';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EnhancedReviewerDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ReviewerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await enhancedReviewerService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!dashboardData) {
    return <div>加载中...</div>;
  }

  const { stats, recent_activities, performance_metrics } = dashboardData;

  // 计算完成进度
  const completionRate = stats.total_completed > 0 
    ? Math.round((stats.today_completed / stats.total_completed) * 100) 
    : 0;

  // 最近活动表格列
  const activityColumns = [
    {
      title: '内容类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: '15%',
      render: (type: string) => {
        const typeMap = {
          story: { color: 'blue', text: '故事' },
          questionnaire: { color: 'green', text: '问卷' },
          heart_voice: { color: 'purple', text: '心声' }
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      ellipsis: true
    },
    {
      title: '审核层级',
      dataIndex: 'audit_level',
      key: 'audit_level',
      width: '15%',
      render: (level: string) => {
        const levelMap = {
          rule_based: { color: 'blue', icon: <SafetyOutlined />, text: '规则' },
          ai_assisted: { color: 'orange', icon: <RobotOutlined />, text: 'AI' },
          manual_review: { color: 'red', icon: <UserOutlined />, text: '人工' }
        };
        const config = levelMap[level as keyof typeof levelMap] || levelMap.manual_review;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '结果',
      dataIndex: 'audit_result',
      key: 'audit_result',
      width: '15%',
      render: (result: string) => (
        <Tag color={result === 'approved' ? 'green' : 'red'}>
          {result === 'approved' ? '通过' : '拒绝'}
        </Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '15%',
      render: (time: string) => (
        <Text type="secondary">
          {dayjs(time).format('MM-DD HH:mm')}
        </Text>
      )
    }
  ];

  return (
    <div>
      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle">
          <Col span={18}>
            <Title level={3} style={{ margin: 0 }}>
              <DashboardOutlined /> 审核员工作台
            </Title>
            <Text type="secondary">
              三层审核系统 - 为平台内容安全保驾护航
            </Text>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/pending')}
            >
              开始审核
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 核心统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核总数"
              value={stats.total_pending}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={Math.min(100, (stats.total_pending / 50) * 100)} 
              size="small" 
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日完成"
              value={stats.today_completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">
              平均用时: {stats.average_review_time.toFixed(1)}分钟
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总计完成"
              value={stats.total_completed}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">
              通过率: {Math.round(performance_metrics.approval_rate * 100)}%
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="质量评分"
              value={Math.round(performance_metrics.quality_score * 100)}
              suffix="/100"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Progress 
              percent={Math.round(performance_metrics.quality_score * 100)} 
              size="small" 
              showInfo={false}
              strokeColor="#fa8c16"
            />
          </Card>
        </Col>
      </Row>

      {/* 按层级分类统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="按审核层级分类" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_level.rule_flagged}</Text>
                    <br />
                    <Text type="secondary">规则标记</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <RobotOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_level.ai_flagged}</Text>
                    <br />
                    <Text type="secondary">AI标记</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_level.user_complaints}</Text>
                    <br />
                    <Text type="secondary">用户投诉</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="按内容类型分类" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_type.story}</Text>
                    <br />
                    <Text type="secondary">故事</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_type.questionnaire}</Text>
                    <br />
                    <Text type="secondary">问卷</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{stats.pending_by_type.heart_voice}</Text>
                    <br />
                    <Text type="secondary">心声</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 优先级分布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="优先级分布" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Tooltip title="需要立即处理">
                  <Card size="small" style={{ textAlign: 'center', borderColor: '#ff4d4f' }}>
                    <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ color: '#ff4d4f' }}>{stats.pending_by_priority.urgent}</Text>
                      <br />
                      <Text type="secondary">紧急</Text>
                    </div>
                  </Card>
                </Tooltip>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center', borderColor: '#fa8c16' }}>
                  <ExclamationCircleOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong style={{ color: '#fa8c16' }}>{stats.pending_by_priority.high}</Text>
                    <br />
                    <Text type="secondary">高</Text>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{stats.pending_by_priority.medium}</Text>
                    <br />
                    <Text type="secondary">中</Text>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong>{stats.pending_by_priority.low}</Text>
                    <br />
                    <Text type="secondary">低</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Card 
        title="最近审核活动" 
        extra={
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate('/history')}
          >
            查看全部
          </Button>
        }
      >
        <Table
          columns={activityColumns}
          dataSource={recent_activities}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default EnhancedReviewerDashboard;

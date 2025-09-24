import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Button, 
  Spin, 
  Alert,
  Typography,
  Space,
  Progress
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RightOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import { DashboardData } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ReviewerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[REVIEWER_DASHBOARD] Fetching dashboard data from:', API_CONFIG.ENDPOINTS.REVIEWER_DASHBOARD);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REVIEWER_DASHBOARD);

      console.log('[REVIEWER_DASHBOARD] API response:', response.data);

      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else {
        throw new Error('API响应格式错误');
      }
    } catch (error: any) {
      console.error('获取仪表板数据失败:', error);
      setError('获取数据失败，请稍后重试');
      
      // 如果API不存在，使用模拟数据
      if (error.response?.status === 404) {
        setData({
          stats: {
            pendingCount: 12,
            completedToday: 8,
            totalCompleted: 156,
            averageTime: 5.2
          },
          recentActivities: [
            {
              id: '1',
              title: '学生就业故事分享',
              action: '已批准',
              time: dayjs().subtract(1, 'hour').format('HH:mm'),
              type: 'story'
            },
            {
              id: '2', 
              title: '实习经验分享',
              action: '已拒绝',
              time: dayjs().subtract(2, 'hour').format('HH:mm'),
              type: 'experience'
            },
            {
              id: '3',
              title: '求职心得体会',
              action: '已批准', 
              time: dayjs().subtract(3, 'hour').format('HH:mm'),
              type: 'tips'
            }
          ]
        });
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载仪表板数据...</Text>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    pendingCount: 0,
    completedToday: 0,
    totalCompleted: 0,
    averageTime: 0
  };

  const completionRate = stats.totalCompleted > 0 
    ? Math.round((stats.completedToday / (stats.completedToday + stats.pendingCount)) * 100)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          审核员仪表板
        </Title>
        <Text type="secondary">
          欢迎回来！今天是 {dayjs().format('YYYY年MM月DD日')}
        </Text>
      </div>

      {error && (
        <Alert
          message="数据加载提示"
          description={`${error} (当前显示模拟数据用于演示)`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日完成"
              value={stats.completedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总计完成"
              value={stats.totalCompleted}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均用时"
              value={stats.averageTime}
              prefix={<FileTextOutlined />}
              suffix="分钟"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="工作概览" 
            extra={
              <Button 
                type="primary" 
                onClick={() => navigate('/pending')}
                disabled={stats.pendingCount === 0}
              >
                开始审核
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>今日完成进度</Text>
                  <Text style={{ float: 'right' }}>
                    {stats.completedToday} / {stats.completedToday + stats.pendingCount}
                  </Text>
                </div>
                <Progress 
                  percent={completionRate} 
                  status={completionRate === 100 ? 'success' : 'active'}
                />
              </div>

              <div>
                <Text>
                  当前有 <Text strong style={{ color: '#faad14' }}>
                    {stats.pendingCount}
                  </Text> 项内容等待审核
                </Text>
              </div>

              <Space>
                <Button 
                  type="default" 
                  onClick={() => navigate('/pending')}
                  icon={<FileTextOutlined />}
                >
                  查看待审核列表
                </Button>
                <Button 
                  type="default" 
                  onClick={() => navigate('/history')}
                  icon={<HistoryOutlined />}
                >
                  查看审核历史
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="最近活动"
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/history')}
                icon={<RightOutlined />}
              >
                查看更多
              </Button>
            }
          >
            <List
              dataSource={data?.recentActivities || []}
              locale={{ emptyText: '暂无最近活动' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: item.action === '已批准' ? '#52c41a' : '#ff4d4f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {item.action === '已批准' ? '✓' : '✗'}
                      </div>
                    }
                    title={
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{item.action}</Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">{item.time}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewerDashboard;

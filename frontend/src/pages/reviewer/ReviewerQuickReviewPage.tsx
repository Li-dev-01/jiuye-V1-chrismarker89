/**
 * 快速审核选择页面
 * 让用户选择要进行快速审核的内容类型
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Spin
} from 'antd';
import {
  ThunderboltOutlined,
  MessageOutlined,
  BookOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

interface ReviewStats {
  voice: {
    pending: number;
    estimatedTime: string;
  };
  story: {
    pending: number;
    estimatedTime: string;
  };
}

export const ReviewerQuickReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats>({
    voice: { pending: 0, estimatedTime: '0分钟' },
    story: { pending: 0, estimatedTime: '0分钟' }
  });

  // 获取审核统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://employment-survey-api-prod.chrismarker89.workers.dev';

        // 获取心声待审核数量
        const voiceResponse = await fetch(`${apiBaseUrl}/api/reviewer/pending-reviews?content_type=heart_voice`);
        const voiceResult = await voiceResponse.json();

        // 获取故事待审核数量
        const storyResponse = await fetch(`${apiBaseUrl}/api/reviewer/pending-reviews?content_type=story`);
        const storyResult = await storyResponse.json();

        const voiceCount = voiceResult.success ? (voiceResult.data.reviews?.length || 0) : 0;
        const storyCount = storyResult.success ? (storyResult.data.reviews?.length || 0) : 0;

        // 估算审核时间（每条约30秒）
        const voiceTime = Math.ceil(voiceCount * 0.5);
        const storyTime = Math.ceil(storyCount * 0.8); // 故事内容更长，需要更多时间

        setStats({
          voice: {
            pending: voiceCount,
            estimatedTime: voiceTime > 0 ? `${voiceTime}分钟` : '0分钟'
          },
          story: {
            pending: storyCount,
            estimatedTime: storyTime > 0 ? `${storyTime}分钟` : '0分钟'
          }
        });
      } catch (error) {
        console.error('获取审核统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleStartQuickReview = (contentType: 'voice' | 'story') => {
    navigate(`/reviewer/quick-review/${contentType}`);
  };

  return (
    <ReviewerLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <Title level={2}>
            <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            快速审核
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            选择要审核的内容类型，使用键盘快捷键高效审核
          </Paragraph>
        </div>

        {/* 审核类型选择 */}
        <Row gutter={[24, 24]} justify="center">
          {/* 心声快速审核 */}
          <Col xs={24} sm={12} lg={10}>
            <Card
              hoverable
              style={{ 
                height: '320px',
                border: '2px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <MessageOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#1890ff',
                    marginBottom: '16px'
                  }} 
                />
                <Title level={3} style={{ marginBottom: '12px' }}>
                  心声快速审核
                </Title>
                <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                  快速审核用户提交的心声内容
                </Paragraph>

                {/* 统计信息 */}
                {loading ? (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={12}>
                      <Statistic
                        title="待审核"
                        value={stats.voice.pending}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="预计用时"
                        value={stats.voice.estimatedTime}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                      />
                    </Col>
                  </Row>
                )}
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => handleStartQuickReview('voice')}
                style={{ width: '100%' }}
              >
                开始心声审核
              </Button>
            </Card>
          </Col>

          {/* 故事快速审核 */}
          <Col xs={24} sm={12} lg={10}>
            <Card
              hoverable
              style={{ 
                height: '320px',
                border: '2px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#52c41a';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <BookOutlined 
                  style={{ 
                    fontSize: '48px', 
                    color: '#52c41a',
                    marginBottom: '16px'
                  }} 
                />
                <Title level={3} style={{ marginBottom: '12px' }}>
                  故事快速审核
                </Title>
                <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                  快速审核用户分享的就业故事
                </Paragraph>

                {/* 统计信息 */}
                {loading ? (
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={12}>
                      <Statistic
                        title="待审核"
                        value={stats.story.pending}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="预计用时"
                        value={stats.story.estimatedTime}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                      />
                    </Col>
                  </Row>
                )}
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => handleStartQuickReview('story')}
                style={{ 
                  width: '100%',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                开始故事审核
              </Button>
            </Card>
          </Col>
        </Row>


      </div>
    </ReviewerLayout>
  );
};

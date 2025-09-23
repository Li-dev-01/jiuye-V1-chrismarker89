/**
 * 审核员管理页面
 * 管理审核员账号、工作统计、活动日志
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Tag,
  Modal,
  Descriptions,
  Progress
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { ManagementAdminService } from '../../services/ManagementAdminService';

const { Title } = Typography;

interface Reviewer {
  id: number;
  user_uuid: string;
  username?: string;
  nickname?: string;
  email?: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  last_login_ip?: string;
  today_reviews: number;
  today_approved: number;
  today_rejected: number;
  today_logins: number;
  week_reviews: number;
  week_approved: number;
  week_rejected: number;
  total_reviews: number;
  total_approved: number;
  total_rejected: number;
}

export const ReviewerManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 加载审核员列表
  const loadReviewers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await ManagementAdminService.getReviewers({ page, pageSize });
      setReviewers(response.items);
      setPagination({
        current: page,
        pageSize,
        total: response.pagination.total
      });
    } catch (error) {
      console.error('加载审核员失败:', error);
      message.error('加载审核员失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewers();
  }, []);

  // 计算审核通过率
  const getApprovalRate = (approved: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((approved / total) * 100);
  };

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            <TeamOutlined style={{ marginRight: '8px' }} />
            审核员管理
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={() => loadReviewers(pagination.current, pagination.pageSize)}
              loading={loading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            管理审核员账号、监控工作量、查看活动日志
          </div>
        </div>

        {/* 审核员统计概览 */}
        <Card title="审核员概览" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总审核员数"
                value={pagination.total}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="活跃审核员"
                value={reviewers.filter(r => r.status === 'active').length}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="今日总审核"
                value={reviewers.reduce((sum, r) => sum + r.today_reviews, 0)}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="本周总审核"
                value={reviewers.reduce((sum, r) => sum + r.week_reviews, 0)}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 审核员列表 */}
        <Card title="审核员列表">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>正在加载审核员数据...</div>
            </div>
          ) : reviewers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>暂无审核员数据</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                系统中还没有审核员用户，请先创建审核员账号
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                共找到 {pagination.total} 个审核员
              </div>
              {reviewers.map((reviewer) => (
                <Card 
                  key={reviewer.id} 
                  size="small" 
                  style={{ marginBottom: '16px' }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <UserOutlined style={{ marginRight: '8px' }} />
                        {reviewer.username || reviewer.nickname || '未设置用户名'}
                        <Tag 
                          color={reviewer.status === 'active' ? 'green' : 'red'} 
                          style={{ marginLeft: '8px' }}
                        >
                          {reviewer.status === 'active' ? '活跃' : '非活跃'}
                        </Tag>
                      </div>
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          icon={<InfoCircleOutlined />}
                          onClick={() => {
                            Modal.info({
                              title: '审核员详情',
                              width: 800,
                              content: (
                                <Descriptions column={2} size="small">
                                  <Descriptions.Item label="UUID">{reviewer.user_uuid}</Descriptions.Item>
                                  <Descriptions.Item label="用户名">{reviewer.username || '未设置'}</Descriptions.Item>
                                  <Descriptions.Item label="昵称">{reviewer.nickname || '未设置'}</Descriptions.Item>
                                  <Descriptions.Item label="邮箱">{reviewer.email || '未设置'}</Descriptions.Item>
                                  <Descriptions.Item label="状态">
                                    <Tag color={reviewer.status === 'active' ? 'green' : 'red'}>
                                      {reviewer.status === 'active' ? '活跃' : '非活跃'}
                                    </Tag>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="创建时间">
                                    {new Date(reviewer.created_at).toLocaleString()}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="最后登录">
                                    {reviewer.last_login_at ? new Date(reviewer.last_login_at).toLocaleString() : '从未登录'}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="最后登录IP">
                                    {reviewer.last_login_ip || '未记录'}
                                  </Descriptions.Item>
                                </Descriptions>
                              )
                            });
                          }}
                        >
                          详情
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<BarChartOutlined />}
                          onClick={() => {
                            message.info('活动日志功能开发中...');
                          }}
                        >
                          活动日志
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>今日工作</div>
                        <div>审核: <strong>{reviewer.today_reviews}</strong></div>
                        <div>通过: <span style={{ color: '#52c41a' }}>{reviewer.today_approved}</span></div>
                        <div>拒绝: <span style={{ color: '#f5222d' }}>{reviewer.today_rejected}</span></div>
                        <div>登录: {reviewer.today_logins}次</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>本周统计</div>
                        <div>审核: <strong>{reviewer.week_reviews}</strong></div>
                        <div>通过率: {getApprovalRate(reviewer.week_approved, reviewer.week_reviews)}%</div>
                        <Progress 
                          percent={getApprovalRate(reviewer.week_approved, reviewer.week_reviews)} 
                          size="small" 
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>总计统计</div>
                        <div>总审核: <strong>{reviewer.total_reviews}</strong></div>
                        <div>总通过: <span style={{ color: '#52c41a' }}>{reviewer.total_approved}</span></div>
                        <div>总拒绝: <span style={{ color: '#f5222d' }}>{reviewer.total_rejected}</span></div>
                        <div>通过率: {getApprovalRate(reviewer.total_approved, reviewer.total_reviews)}%</div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReviewerManagementPage;

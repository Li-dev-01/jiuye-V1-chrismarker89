import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography, Tabs, Alert, Spin } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  ApiOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  SettingOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  BookOutlined,
  AuditOutlined,
  WarningOutlined,
  ReloadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/RoleBasedLayout';
import { useAdminStore } from '../../stores/adminStore';
import { useManagementAuthStore } from '../../stores/managementAuthStore';


const { Title } = Typography;
const { TabPane } = Tabs;

export const DashboardPage: React.FC = () => {
  const { currentUser, isAuthenticated } = useManagementAuthStore();
  const {
    dashboardStats,
    dashboardLoading,
    dashboardError,
    questionnaires,
    questionnairesPagination,
    questionnairesLoading,
    questionnairesError,
    fetchDashboardStats,
    fetchQuestionnaires,
    updateQuestionnaireStatus,
    clearDashboardError,
    clearQuestionnairesError
  } = useAdminStore();

  // 使用管理系统的用户信息
  const finalUser = currentUser;

  useEffect(() => {
    // 只有在用户已认证时才加载数据
    if (isAuthenticated && currentUser) {
      console.log('用户已认证，开始加载仪表板数据...');
      fetchDashboardStats();
      fetchQuestionnaires({ page: 1, pageSize: 10 });
    } else {
      console.log('用户未认证，跳过数据加载');
    }
  }, [isAuthenticated, currentUser, fetchDashboardStats, fetchQuestionnaires]);

  const handleRefresh = () => {
    if (isAuthenticated && currentUser) {
      console.log('刷新仪表板数据...');
      fetchDashboardStats();
      fetchQuestionnaires();
    } else {
      console.log('用户未认证，无法刷新数据');
    }
  };

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await updateQuestionnaireStatus(id, status);
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };



  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '会话ID',
      dataIndex: 'session_id',
      key: 'session_id',
      width: 120,
      render: (sessionId: string) => sessionId ? sessionId.substring(0, 8) + '...' : '-'
    },
    {
      title: '完成状态',
      dataIndex: 'is_completed',
      key: 'is_completed',
      width: 100,
      render: (isCompleted: boolean) => (
        <Tag color={isCompleted ? 'green' : 'orange'}>
          {isCompleted ? '已完成' : '未完成'}
        </Tag>
      )
    },
    {
      title: '完成度',
      dataIndex: 'completion_percentage',
      key: 'completion_percentage',
      width: 100,
      render: (percentage: number) => `${percentage || 0}%`
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 100,
      render: (deviceType: string) => deviceType || '-'
    },
    {
      title: '状态',
      dataIndex: 'is_valid',
      key: 'is_valid',
      render: (isValid: boolean, record: any) => {
        if (!record.is_completed) {
          return <Tag color="orange">未完成</Tag>;
        }
        return isValid ?
          <Tag color="green">有效</Tag> :
          <Tag color="red">无效</Tag>;
      }
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
          >
            查看
          </Button>
          {record.is_completed && (
            <>
              <Button
                type="link"
                size="small"
                disabled={record.is_valid}
                onClick={() => handleStatusUpdate(record.id, 'approved')}
              >
                标记有效
              </Button>
              <Button
                type="link"
                danger
                size="small"
                disabled={!record.is_valid}
                onClick={() => handleStatusUpdate(record.id, 'rejected')}
              >
                标记无效
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px', background: '#fff7e6', minHeight: 'calc(100vh - 64px)' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            管理仪表板
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={dashboardLoading}
              style={{ marginLeft: '16px' }}
            >
              刷新
            </Button>
          </Title>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            欢迎，{finalUser?.display_name || finalUser?.username} ({finalUser?.userType})
          </div>
        </div>

        {/* 错误提示 */}
        {(dashboardError || questionnairesError) && (
          <Alert
            message="数据加载失败"
            description={
              <div>
                <p>{dashboardError || questionnairesError}</p>
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  💡 本地开发环境提示：这是正常现象，部署到 Cloudflare 后将连接真实数据库
                </p>
              </div>
            }
            type="warning"
            showIcon
            closable
            onClose={() => {
              clearDashboardError();
              clearQuestionnairesError();
            }}
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 加载状态 */}
        {dashboardLoading && !dashboardStats && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>正在加载仪表板数据...</div>
          </div>
        )}

        {/* 统计卡片 */}
        {(dashboardStats || dashboardError) && (
          <>
            {/* 内容统计 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={8}>
                <Card title="系统统计">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="总用户数"
                        value={dashboardStats?.totalUsers || 0}
                        prefix={<UserOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="活跃用户"
                        value={dashboardStats?.activeUsers || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card title="故事统计">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="原始故事"
                        value={dashboardStats?.stories?.raw_stories || 0}
                        prefix={<BookOutlined />}
                        valueStyle={{ color: '#13c2c2' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="有效故事"
                        value={dashboardStats?.stories?.valid_stories || 0}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card title="审核统计">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="待审核"
                        value={dashboardStats?.audits?.pending_audits || 0}
                        prefix={<AuditOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="人工审核"
                        value={dashboardStats?.audits?.human_reviews || 0}
                        prefix={<UserOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* 快捷导航 */}
        <Card title="管理功能" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/users">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <UserOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                  <div>用户管理</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/content">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <EditOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                  <div>内容管理</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/user-content">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <UserOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
                  <div>用户内容管理</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/audit-rules">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <SettingOutlined style={{ fontSize: '24px', color: '#fa541c', marginBottom: '8px' }} />
                  <div>审核规则</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/database-monitor">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <MonitorOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
                  <div>数据库监测</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/violation-content">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <WarningOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '8px' }} />
                  <div>违规内容</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/api-data">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <ApiOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
                  <div>API与数据</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/analytics">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <BarChartOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '8px' }} />
                  <div>数据可视化</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/data-generator">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <ThunderboltOutlined style={{ fontSize: '24px', color: '#13c2c2', marginBottom: '8px' }} />
                  <div>数据生成器</div>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/architecture">
                <Card hoverable style={{ textAlign: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: '24px', color: '#eb2f96', marginBottom: '8px' }} />
                  <div>项目架构</div>
                </Card>
              </Link>
            </Col>
            {/* 超级管理员专用入口 */}
            {finalUser?.userType === 'SUPER_ADMIN' && (
              <Col xs={24} sm={12} md={6}>
                <Link to="/admin/super-admin">
                  <Card hoverable style={{ textAlign: 'center', border: '2px solid #ff4d4f' }}>
                    <div style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '8px' }}>🛡️</div>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>超级管理员</div>
                  </Card>
                </Link>
              </Col>
            )}
          </Row>
        </Card>

        {/* 问卷列表 */}
        <Card title="最近问卷" className="mb-8">
          <Table
            columns={columns}
            dataSource={questionnaires}
            rowKey="id"
            loading={questionnairesLoading}
            pagination={{
              current: questionnairesPagination.page,
              pageSize: questionnairesPagination.pageSize,
              total: questionnairesPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                fetchQuestionnaires({ page, pageSize });
              }
            }}
          />
        </Card>

        {/* 快速操作 */}
        <Card title="快速操作">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <div className="text-center">
                  <FileTextOutlined className="text-2xl text-blue-600 mb-2" />
                  <div className="font-medium">导出数据</div>
                  <div className="text-sm text-gray-500">导出问卷数据为Excel</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <div className="text-center">
                  <UserOutlined className="text-2xl text-green-600 mb-2" />
                  <div className="font-medium">用户管理</div>
                  <div className="text-sm text-gray-500">管理系统用户</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <div className="text-center">
                  <EditOutlined className="text-2xl text-purple-600 mb-2" />
                  <div className="font-medium">系统设置</div>
                  <div className="text-sm text-gray-500">配置系统参数</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </AdminLayout>
  );
};

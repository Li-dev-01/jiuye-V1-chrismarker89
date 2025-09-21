/**
 * 管理员数据测试页面
 * 用于测试管理员API和数据store的连接
 */

import React, { useEffect } from 'react';
import { Card, Button, Spin, Alert, Descriptions, Table, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';

export const AdminDataTestPage: React.FC = () => {
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
    clearDashboardError,
    clearQuestionnairesError
  } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchQuestionnaires({ page: 1, pageSize: 10 });
  }, [fetchDashboardStats, fetchQuestionnaires]);

  const handleRefresh = () => {
    fetchDashboardStats();
    fetchQuestionnaires();
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
      render: (isCompleted: boolean) => isCompleted ? '已完成' : '未完成'
    },
    {
      title: '完成度',
      dataIndex: 'completion_percentage',
      key: 'completion_percentage',
      width: 100,
      render: (percentage: number) => `${percentage || 0}%`
    },
    {
      title: '有效性',
      dataIndex: 'is_valid',
      key: 'is_valid',
      width: 100,
      render: (isValid: boolean) => isValid ? '有效' : '无效'
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>管理员数据测试页面</h1>
      
      {/* 控制按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={dashboardLoading || questionnairesLoading}
          >
            刷新数据
          </Button>
          <Button onClick={clearDashboardError}>清除仪表板错误</Button>
          <Button onClick={clearQuestionnairesError}>清除问卷错误</Button>
        </Space>
      </Card>

      {/* 错误提示 */}
      {(dashboardError || questionnairesError) && (
        <Alert
          message="数据加载失败"
          description={dashboardError || questionnairesError}
          type="error"
          showIcon
          closable
          onClose={() => {
            clearDashboardError();
            clearQuestionnairesError();
          }}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 仪表板统计 */}
      <Card title="仪表板统计" style={{ marginBottom: '24px' }}>
        {dashboardLoading && !dashboardStats ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>正在加载仪表板数据...</div>
          </div>
        ) : dashboardStats ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="总问卷数">
              {dashboardStats.questionnaires.total_questionnaires}
            </Descriptions.Item>
            <Descriptions.Item label="待审核问卷">
              {dashboardStats.questionnaires.pending_questionnaires}
            </Descriptions.Item>
            <Descriptions.Item label="已通过问卷">
              {dashboardStats.questionnaires.approved_questionnaires}
            </Descriptions.Item>
            <Descriptions.Item label="已拒绝问卷">
              {dashboardStats.questionnaires.rejected_questionnaires}
            </Descriptions.Item>
            <Descriptions.Item label="原始心声">
              {dashboardStats.voices.raw_voices}
            </Descriptions.Item>
            <Descriptions.Item label="有效心声">
              {dashboardStats.voices.valid_voices}
            </Descriptions.Item>
            <Descriptions.Item label="原始故事">
              {dashboardStats.stories.raw_stories}
            </Descriptions.Item>
            <Descriptions.Item label="有效故事">
              {dashboardStats.stories.valid_stories}
            </Descriptions.Item>
            <Descriptions.Item label="总审核数">
              {dashboardStats.audits.total_audits}
            </Descriptions.Item>
            <Descriptions.Item label="待审核">
              {dashboardStats.audits.pending_audits}
            </Descriptions.Item>
            <Descriptions.Item label="已通过审核">
              {dashboardStats.audits.approved_audits}
            </Descriptions.Item>
            <Descriptions.Item label="已拒绝审核">
              {dashboardStats.audits.rejected_audits}
            </Descriptions.Item>
            <Descriptions.Item label="人工审核">
              {dashboardStats.audits.human_reviews}
            </Descriptions.Item>
            <Descriptions.Item label="今日提交">
              {dashboardStats.today.submissions}
            </Descriptions.Item>
            <Descriptions.Item label="今日审核">
              {dashboardStats.today.audits}
            </Descriptions.Item>
            <Descriptions.Item label="总用户数">
              {dashboardStats.users.total_users}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div>暂无数据</div>
        )}
      </Card>

      {/* 问卷列表 */}
      <Card title="问卷列表">
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

      {/* API连接状态 */}
      <Card title="API连接状态" style={{ marginTop: '24px' }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="管理员API地址">
            http://localhost:8007
          </Descriptions.Item>
          <Descriptions.Item label="仪表板API状态">
            {dashboardLoading ? '加载中...' : dashboardError ? '连接失败' : '连接正常'}
          </Descriptions.Item>
          <Descriptions.Item label="问卷API状态">
            {questionnairesLoading ? '加载中...' : questionnairesError ? '连接失败' : '连接正常'}
          </Descriptions.Item>
          <Descriptions.Item label="数据更新时间">
            {new Date().toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default AdminDataTestPage;

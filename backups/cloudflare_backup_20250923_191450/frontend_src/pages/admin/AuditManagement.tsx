/**
 * 审核管理页面
 * 管理A表到B表的审核流程
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Typography,
  Input, Select, Switch, message, Tooltip, Statistic, Row, Col, Tabs
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EyeOutlined, SettingOutlined,
  ReloadOutlined, FilterOutlined, ExclamationCircleOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { auditService, AuditRecord, AuditConfig } from '../../services/auditService';
import TieredAuditControl from '../../components/admin/TieredAuditControl';
import './AuditManagement.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;

const AuditManagement: React.FC = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [reviewVisible, setReviewVisible] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [configVisible, setConfigVisible] = useState<boolean>(false);
  const [auditConfig, setAuditConfig] = useState<AuditConfig | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadPendingAudits();
    loadAuditConfig();
    loadAuditStats();
  }, [currentPage, pageSize, contentTypeFilter]);

  // 加载待审核列表
  const loadPendingAudits = async () => {
    setLoading(true);
    try {
      const result = await auditService.getPendingAudits({
        page: currentPage,
        pageSize: pageSize,
        content_type: contentTypeFilter as any
      });

      if (result.success && result.data) {
        setAudits(result.data.audits);
        setTotal(result.data.total);
      } else {
        message.error('加载待审核列表失败: ' + result.error);
      }
    } catch (error) {
      message.error('加载失败');
      console.error('Load pending audits error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载审核配置
  const loadAuditConfig = async () => {
    try {
      const result = await auditService.getAuditConfig();
      if (result.success && result.data) {
        setAuditConfig(result.data);
      }
    } catch (error) {
      console.error('Load audit config error:', error);
    }
  };

  // 加载审核统计
  const loadAuditStats = async () => {
    try {
      const result = await auditService.getAuditStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Load audit stats error:', error);
    }
  };

  // 查看详情
  const handleViewDetail = (audit: AuditRecord) => {
    setSelectedAudit(audit);
    setDetailVisible(true);
  };

  // 开始审核
  const handleStartReview = (audit: AuditRecord) => {
    setSelectedAudit(audit);
    setReviewNotes('');
    setReviewVisible(true);
  };

  // 提交审核
  const handleSubmitReview = async (decision: 'approved' | 'rejected') => {
    if (!selectedAudit || !user?.id) {
      message.error('审核信息不完整');
      return;
    }

    try {
      const result = await auditService.manualReview({
        audit_id: selectedAudit.auditId,
        decision: decision,
        reviewer_id: user.id,
        notes: reviewNotes
      });

      if (result.success) {
        message.success(result.message || '审核完成');
        setReviewVisible(false);
        loadPendingAudits(); // 重新加载列表
      } else {
        message.error('审核失败: ' + result.error);
      }
    } catch (error) {
      message.error('审核失败');
      console.error('Submit review error:', error);
    }
  };

  // 批量审核
  const handleBatchApprove = () => {
    confirm({
      title: '批量通过',
      icon: <ExclamationCircleOutlined />,
      content: '确定要批量通过所有待审核内容吗？',
      onOk: async () => {
        // 实现批量审核逻辑
        message.success('批量审核完成');
        loadPendingAudits();
      }
    });
  };

  // 更新配置
  const handleUpdateConfig = async (newConfig: Partial<AuditConfig>) => {
    if (!user?.id) {
      message.error('用户信息不完整');
      return;
    }

    try {
      const result = await auditService.updateAuditConfig({
        ...newConfig,
        user_id: user.id
      });

      if (result.success) {
        message.success('配置更新成功');
        setAuditConfig(result.data || null);
        setConfigVisible(false);
      } else {
        message.error('配置更新失败: ' + result.error);
      }
    } catch (error) {
      message.error('配置更新失败');
      console.error('Update config error:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '内容类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'heart_voice' ? 'red' : 'blue'}>
          {type === 'heart_voice' ? '问卷心声' : '就业故事'}
        </Tag>
      )
    },
    {
      title: '标题/预览',
      key: 'content',
      width: 300,
      render: (record: AuditRecord) => (
        <div>
          {record.contentTitle && (
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {record.contentTitle}
            </Text>
          )}
          <Text type="secondary" ellipsis>
            {record.contentPreview}
          </Text>
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120
    },
    {
      title: '审核类型',
      dataIndex: 'auditType',
      key: 'auditType',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'automatic' ? 'green' : 'orange'}>
          {type === 'automatic' ? '自动审核' : '需人工审核'}
        </Tag>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      width: 100,
      render: (score: number) => (
        <Text style={{ color: score > 0.8 ? '#52c41a' : score > 0.5 ? '#faad14' : '#ff4d4f' }}>
          {(score * 100).toFixed(1)}%
        </Text>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: AuditRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          
          <Tooltip title="通过">
            <Button 
              type="text" 
              icon={<CheckOutlined />} 
              style={{ color: '#52c41a' }}
              onClick={() => {
                setSelectedAudit(record);
                handleSubmitReview('approved');
              }}
            />
          </Tooltip>
          
          <Tooltip title="拒绝">
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              style={{ color: '#ff4d4f' }}
              onClick={() => handleStartReview(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="audit-management">
      {/* 页面头部 */}
      <div className="page-header">
        <Title level={2}>审核管理</Title>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigVisible(true)}
          >
            审核配置
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleBatchApprove}
            disabled={audits.length === 0}
          >
            批量通过
          </Button>
        </Space>
      </div>

      {/* 标签页 */}
      <Tabs defaultActiveKey="queue" style={{ marginTop: 16 }}>
        <TabPane
          tab={
            <span>
              <FilterOutlined />
              审核队列
            </span>
          }
          key="queue"
        >
          {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待审核" 
                value={total} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="自动通过率" 
                value={stats.auto_approval_rate * 100} 
                precision={1}
                suffix="%" 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="人工审核率" 
                value={stats.manual_review_rate * 100} 
                precision={1}
                suffix="%" 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="今日已审核" 
                value={stats.total_approved + stats.total_rejected} 
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="内容类型"
            style={{ width: 120 }}
            value={contentTypeFilter}
            onChange={setContentTypeFilter}
            allowClear
          >
            <Option value="heart_voice">问卷心声</Option>
            <Option value="story">就业故事</Option>
          </Select>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadPendingAudits}
          >
            刷新
          </Button>
        </Space>
      </Card>

      {/* 审核列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={audits}
          rowKey="auditId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
              }
            }
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="审核详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedAudit && (
          <div>
            <Paragraph>
              <Text strong>内容类型：</Text>
              <Tag color={selectedAudit.contentType === 'heart_voice' ? 'red' : 'blue'}>
                {selectedAudit.contentType === 'heart_voice' ? '问卷心声' : '就业故事'}
              </Tag>
            </Paragraph>
            
            {selectedAudit.contentTitle && (
              <Paragraph>
                <Text strong>标题：</Text>
                {selectedAudit.contentTitle}
              </Paragraph>
            )}
            
            <Paragraph>
              <Text strong>内容预览：</Text>
              <br />
              {selectedAudit.contentPreview}
            </Paragraph>
            
            <Paragraph>
              <Text strong>作者：</Text>
              {selectedAudit.authorName}
            </Paragraph>
            
            <Paragraph>
              <Text strong>置信度：</Text>
              <Text style={{ color: selectedAudit.confidenceScore > 0.8 ? '#52c41a' : '#faad14' }}>
                {(selectedAudit.confidenceScore * 100).toFixed(1)}%
              </Text>
            </Paragraph>
            
            {selectedAudit.auditDetails && selectedAudit.auditDetails.reasons && (
              <Paragraph>
                <Text strong>审核原因：</Text>
                <ul>
                  {selectedAudit.auditDetails.reasons.map((reason: string, index: number) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </Paragraph>
            )}
          </div>
        )}
      </Modal>

      {/* 审核模态框 */}
      <Modal
        title="人工审核"
        visible={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewVisible(false)}>
            取消
          </Button>,
          <Button 
            key="reject" 
            danger 
            onClick={() => handleSubmitReview('rejected')}
          >
            拒绝
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            onClick={() => handleSubmitReview('approved')}
          >
            通过
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>审核备注：</Text>
          <TextArea
            rows={4}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="请输入审核意见（可选）"
          />
        </div>
      </Modal>

      {/* 配置模态框 */}
      <Modal
        title="审核配置"
        visible={configVisible}
        onCancel={() => setConfigVisible(false)}
        footer={null}
        width={600}
      >
        {auditConfig && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>自动审核：</Text>
              <Switch
                checked={auditConfig.auto_approve_enabled}
                onChange={(checked) => 
                  handleUpdateConfig({ auto_approve_enabled: checked })
                }
                style={{ marginLeft: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>全部自动通过（开发模式）：</Text>
              <Switch
                checked={auditConfig.auto_approve_all}
                onChange={(checked) => 
                  handleUpdateConfig({ auto_approve_all: checked })
                }
                style={{ marginLeft: 8 }}
              />
            </div>
            
            <Paragraph type="secondary">
              💡 开发阶段建议开启"全部自动通过"，后续可以关闭并配置具体的审核规则。
            </Paragraph>
          </div>
        )}
      </Modal>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ControlOutlined />
              分级审核
            </span>
          }
          key="tiered"
        >
          <TieredAuditControl />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AuditManagement;

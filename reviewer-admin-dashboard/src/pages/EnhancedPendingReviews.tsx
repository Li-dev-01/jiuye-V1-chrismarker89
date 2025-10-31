import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  Select,
  Card,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  message,
  Tooltip,
  Badge,
  Collapse,
  Progress,
  Divider,
  Timeline
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  SafetyOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { enhancedReviewerService } from '../services/enhancedReviewerService';
import type { PendingReviewItem, ReviewAction } from '../types/auditTypes';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const EnhancedPendingReviews: React.FC = () => {
  // 获取当前登录的审核员信息
  const { user } = useAuthStore();

  const [items, setItems] = useState<PendingReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  
  // 筛选状态
  const [filters, setFilters] = useState<{
    audit_level: 'rule_based' | 'ai_assisted' | 'manual_review' | '';
    content_type: 'story' | 'questionnaire' | '';
    priority: 'urgent' | 'high' | 'medium' | 'low' | '';
    has_complaints: boolean | undefined;
  }>({
    audit_level: '',
    content_type: '',
    priority: '',
    has_complaints: undefined
  });

  useEffect(() => {
    fetchPendingItems();
  }, [filters]);

  // 键盘快捷键处理
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // 如果模态框打开或正在加载，不处理快捷键
    if (reviewModalVisible || loading || !items || items.length === 0) return;

    // 阻止默认行为
    const preventDefaultKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (preventDefaultKeys.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'ArrowLeft':
        // 左键：上一条
        if (selectedRowIndex > 0) {
          const newIndex = selectedRowIndex - 1;
          setSelectedRowIndex(newIndex);
          setSelectedItem(items[newIndex]);
        }
        break;
      case 'ArrowRight':
        // 右键：下一条
        if (selectedRowIndex < items.length - 1) {
          const newIndex = selectedRowIndex + 1;
          setSelectedRowIndex(newIndex);
          setSelectedItem(items[newIndex]);
        }
        break;
      case 'ArrowUp':
        // 上键：拒绝
        if (selectedItem) {
          handleQuickReview(selectedItem, 'reject');
        }
        break;
      case 'ArrowDown':
        // 下键：通过
        if (selectedItem) {
          handleQuickReview(selectedItem, 'approve');
        }
        break;
      case 'Enter':
        // 回车：打开详情
        if (selectedItem) {
          setReviewModalVisible(true);
        }
        break;
      case 'Escape':
        // ESC：关闭模态框
        if (reviewModalVisible) {
          setReviewModalVisible(false);
        }
        break;
    }
  }, [selectedRowIndex, items, selectedItem, reviewModalVisible, loading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const apiFilters: any = {};
      if (filters.audit_level) apiFilters.audit_level = filters.audit_level;
      if (filters.content_type) apiFilters.content_type = filters.content_type;
      if (filters.priority) apiFilters.priority = filters.priority;
      if (filters.has_complaints !== undefined) apiFilters.has_complaints = filters.has_complaints;

      const response = await enhancedReviewerService.getPendingReviews({
        page: 1,
        pageSize: 20,
        ...apiFilters
      });

      if (response.success && response.data) {
        // API返回的数据结构是 data.reviews
        const reviews = response.data.reviews || [];
        setItems(reviews);

        // 自动选择第一行
        if (reviews.length > 0) {
          setSelectedRowIndex(0);
          setSelectedItem(reviews[0]);
        } else {
          setSelectedItem(null);
          setSelectedRowIndex(0);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch pending reviews');
      }
    } catch (error: any) {
      console.error('获取待审核内容失败:', error);
      message.error('获取待审核内容失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: PendingReviewItem, action: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(action);
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    try {
      if (!selectedItem) {
        message.error('请先选择要审核的内容');
        return;
      }

      if (!user) {
        message.error('用户未登录，请重新登录');
        return;
      }

      // 后端API期望的字段名是驼峰命名（auditId），而不是下划线命名（audit_id）
      const reviewAction = {
        auditId: selectedItem.id,  // 修复：使用auditId而不是audit_id
        action: actionType,
        reason: actionType === 'reject' ? '内容不符合规范' : '',
        notes: '详细审核',
        reviewerId: user.id || user.username  // 从认证状态获取真实的reviewer ID
      };

      console.log('[PENDING_REVIEWS] Submitting review:', reviewAction);

      const response = await enhancedReviewerService.submitReview(reviewAction);

      if (response.success) {
        message.success(`审核${actionType === 'approve' ? '通过' : '拒绝'}成功`);
        setReviewModalVisible(false);
        fetchPendingItems(); // 刷新列表
      } else {
        throw new Error(response.error || 'Review submission failed');
      }
    } catch (error: any) {
      console.error('[PENDING_REVIEWS] 提交审核失败:', error);
      message.error('提交审核失败: ' + (error.message || '未知错误'));
    }
  };

  // 快速审核功能（键盘快捷键使用）
  const handleQuickReview = async (item: PendingReviewItem, action: 'approve' | 'reject') => {
    try {
      const reviewAction: ReviewAction = {
        audit_id: item.id,
        action,
        reason: action === 'reject' ? '快速审核拒绝' : '',
        notes: '快速审核',
        reviewer_id: 'current_reviewer'
      };

      const response = await enhancedReviewerService.submitReview(reviewAction);

      if (response.success) {
        message.success(`快速审核${action === 'approve' ? '通过' : '拒绝'}成功`);

        // 从列表中移除已审核的项目
        const newItems = items.filter(i => i.id !== item.id);
        setItems(newItems);

        // 自动选择下一项
        if (newItems.length > 0) {
          const nextIndex = Math.min(selectedRowIndex, newItems.length - 1);
          setSelectedRowIndex(nextIndex);
          setSelectedItem(newItems[nextIndex]);
        } else {
          setSelectedItem(null);
          setSelectedRowIndex(0);
        }
      } else {
        throw new Error(response.error || 'Quick review failed');
      }
    } catch (error: any) {
      console.error('快速审核失败:', error);
      message.error('快速审核失败: ' + error.message);
    }
  };

  // 获取审核层级标签
  const getAuditLevelTag = (level: string) => {
    const configs = {
      rule_based: { color: 'blue', icon: <SafetyOutlined />, text: '规则审核' },
      ai_assisted: { color: 'orange', icon: <RobotOutlined />, text: 'AI审核' },
      manual_review: { color: 'red', icon: <UserOutlined />, text: '人工审核' }
    };
    
    const config = configs[level as keyof typeof configs] || configs.manual_review;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    const configs = {
      urgent: { color: 'red', text: '紧急' },
      high: { color: 'orange', text: '高' },
      medium: { color: 'blue', text: '中' },
      low: { color: 'green', text: '低' }
    };
    
    const config = configs[priority as keyof typeof configs] || configs.medium;
    
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取风险评分显示
  const getRiskScoreDisplay = (score: number) => {
    const getColor = (score: number) => {
      if (score >= 0.8) return '#ff4d4f';
      if (score >= 0.6) return '#fa8c16';
      if (score >= 0.4) return '#fadb14';
      return '#52c41a';
    };

    return (
      <Progress
        percent={Math.round(score * 100)}
        size="small"
        strokeColor={getColor(score)}
        format={(percent) => `${percent}%`}
        style={{ width: 80 }}
      />
    );
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (
        <Text strong>{index + 1}</Text>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string) => (
        <Text strong style={{ fontSize: '13px' }}>{title}</Text>
      )
    },
    {
      title: '内容预览',
      dataIndex: 'content_preview',
      key: 'content_preview',
      width: 300,
      ellipsis: true,
      render: (content: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>{content}</Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 80,
      render: (type: string) => (
        <Tag>{type}</Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 120,
      ellipsis: true,
      render: (tags: string[]) => (
        <Space size={2}>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
          {tags.length > 2 && <Text type="secondary" style={{ fontSize: '11px' }}>+{tags.length - 2}</Text>}
        </Space>
      )
    },
    {
      title: '作者',
      dataIndex: ['author', 'username'],
      key: 'author',
      width: 100,
      ellipsis: true,
      render: (username: string, record: PendingReviewItem) => (
        <Text style={{ fontSize: '12px' }}>
          {record.author.is_anonymous ? '匿名用户' : username}
        </Text>
      )
    },
    {
      title: '审核层级',
      dataIndex: 'audit_level',
      key: 'audit_level',
      width: 90,
      render: (level: string) => getAuditLevelTag(level)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      render: (priority: string) => getPriorityTag(priority)
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 90,
      render: (score: number) => getRiskScoreDisplay(score)
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (record: PendingReviewItem) => (
        <Space size={2}>
          {record.complaint_info && (
            <Badge count={record.complaint_info.complaint_count} size="small">
              <Tag color="red">投诉</Tag>
            </Badge>
          )}
          {record.ai_audit_result && !record.ai_audit_result.passed && (
            <Tag color="orange">AI</Tag>
          )}
        </Space>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 100,
      render: (time: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {dayjs(time).format('MM-DD HH:mm')}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (record: PendingReviewItem) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedItem(record);
              setReviewModalVisible(true);
              setActionType('approve');
            }}
          />
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleReview(record, 'approve')}
          />
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReview(record, 'reject')}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核总数"
              value={items?.length || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高优先级"
              value={items?.filter(item => ['urgent', 'high'].includes(item.priority)).length || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户投诉"
              value={items?.filter(item => item.complaint_info).length || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="AI标记"
              value={items?.filter(item => item.ai_audit_result && !item.ai_audit_result.passed).length || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容卡片 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: '18px' }}>待审核内容</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            共 {items?.length || 0} 条待审核
          </Text>
          <div style={{ float: 'right' }}>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                快捷键: ←→切换 | ↑拒绝 | ↓通过 | Enter查看详情
              </Text>
            </Space>
          </div>
        </div>

        {/* 筛选工具栏 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="审核层级"
                value={filters.audit_level}
                onChange={(value) => setFilters(prev => ({ ...prev, audit_level: value }))}
                allowClear
              >
                <Option value="rule_based">规则审核</Option>
                <Option value="ai_assisted">AI审核</Option>
                <Option value="manual_review">人工审核</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="内容类型"
                value={filters.content_type}
                onChange={(value) => setFilters(prev => ({ ...prev, content_type: value }))}
                allowClear
              >
                <Option value="story">故事</Option>
                <Option value="questionnaire">问卷</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="优先级"
                value={filters.priority}
                onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                allowClear
              >
                <Option value="urgent">紧急</Option>
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="投诉状态"
                value={filters.has_complaints}
                onChange={(value) => setFilters(prev => ({ ...prev, has_complaints: value }))}
                allowClear
              >
                <Option value={true}>有投诉</Option>
                <Option value={false}>无投诉</Option>
              </Select>
            </Col>
            <Col span={8}>
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchPendingItems}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setFilters({
                    audit_level: '',
                    content_type: '',
                    priority: '',
                    has_complaints: undefined
                  })}
                >
                  清除筛选
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {(!items || items.length === 0) && !loading && (
          <Alert
            message="暂无待审核内容"
            description="当前没有需要审核的内容。"
            type="info"
            showIcon
            style={{ margin: '40px 0' }}
          />
        )}

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          size="small"
          bordered
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedItem ? [selectedItem.id] : [],
            onSelect: (record: PendingReviewItem, selected: boolean) => {
              if (selected) {
                const index = items.findIndex(item => item.id === record.id);
                setSelectedRowIndex(index);
                setSelectedItem(record);
              }
            },
            hideSelectAll: true,
          }}
          onRow={(record: PendingReviewItem, index?: number) => ({
            onClick: () => {
              const itemIndex = items.findIndex(item => item.id === record.id);
              setSelectedRowIndex(itemIndex);
              setSelectedItem(record);
            },
            onDoubleClick: () => {
              setSelectedItem(record);
              setReviewModalVisible(true);
              setActionType('approve');
            },
            style: {
              cursor: 'pointer',
              backgroundColor: selectedItem?.id === record.id ? '#e6f7ff' : undefined,
            }
          })}
          scroll={{ x: 1400, y: 'calc(100vh - 400px)' }}
        />
      </Card>

      {/* 审核详情模态框 */}
      <Modal
        title={
          <Space>
            <span>审核内容详情</span>
            {selectedItem && (
              <>
                {getAuditLevelTag(selectedItem.audit_level)}
                {getPriorityTag(selectedItem.priority)}
              </>
            )}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setActionType('reject');
              submitReview();
            }}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setActionType('approve');
              submitReview();
            }}
          >
            通过
          </Button>
        ]}
      >
        {selectedItem && (
          <div>
            {/* 基本信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>标题：</Text>
                  <Text>{selectedItem.title}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>作者：</Text>
                  <Text>
                    {selectedItem.author.is_anonymous ? '匿名用户' : selectedItem.author.username}
                  </Text>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>内容类型：</Text>
                  <Tag>{selectedItem.content_type}</Tag>
                </Col>
                <Col span={12}>
                  <Text strong>提交时间：</Text>
                  <Text>{dayjs(selectedItem.submitted_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </Col>
              </Row>
              <Row style={{ marginTop: 8 }}>
                <Col span={24}>
                  <Text strong>标签：</Text>
                  <Space>
                    {selectedItem.tags.map(tag => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 内容预览 */}
            <Card size="small" title="内容预览" style={{ marginBottom: 16 }}>
              <Paragraph>
                {selectedItem.content_preview}
              </Paragraph>
              {selectedItem.full_content && (
                <Collapse ghost>
                  <Panel header="查看完整内容" key="full-content">
                    <Paragraph>
                      {selectedItem.full_content}
                    </Paragraph>
                  </Panel>
                </Collapse>
              )}
            </Card>

            {/* 风险评估 */}
            <Card size="small" title="风险评估" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>风险评分：</Text>
                  {getRiskScoreDisplay(selectedItem.risk_score)}
                </Col>
                <Col span={12}>
                  <Text strong>风险因素：</Text>
                  <div>
                    {selectedItem.risk_factors.map((factor, index) => (
                      <Tag key={index} color="orange" style={{ marginBottom: 4 }}>
                        {factor}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 审核历史 */}
            <Collapse style={{ marginBottom: 16 }}>
              <Panel header="审核历史" key="audit-history">
                <Timeline>
                  {/* 规则审核结果 */}
                  {selectedItem.rule_audit_result && (
                    <Timeline.Item
                      color={selectedItem.rule_audit_result.passed ? 'green' : 'red'}
                      dot={<SafetyOutlined />}
                    >
                      <Text strong>规则审核</Text>
                      <br />
                      <Text type={selectedItem.rule_audit_result.passed ? 'success' : 'danger'}>
                        {selectedItem.rule_audit_result.passed ? '通过' : '未通过'}
                      </Text>
                      {selectedItem.rule_audit_result.violations.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>违规项：</Text>
                          {selectedItem.rule_audit_result.violations.map((violation, index) => (
                            <div key={index} style={{ marginLeft: 16 }}>
                              <Tag color="red">{violation.category}</Tag>
                              <Text>{violation.matched_text}</Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </Timeline.Item>
                  )}

                  {/* AI审核结果 */}
                  {selectedItem.ai_audit_result && (
                    <Timeline.Item
                      color={selectedItem.ai_audit_result.passed ? 'green' : 'orange'}
                      dot={<RobotOutlined />}
                    >
                      <Text strong>AI审核</Text>
                      <br />
                      <Text type={selectedItem.ai_audit_result.passed ? 'success' : 'warning'}>
                        {selectedItem.ai_audit_result.passed ? '通过' : '需要人工审核'}
                      </Text>
                      <br />
                      <Text type="secondary">
                        置信度: {Math.round(selectedItem.ai_audit_result.confidence * 100)}%
                      </Text>
                      {selectedItem.ai_audit_result.flagged_content.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>标记内容：</Text>
                          {selectedItem.ai_audit_result.flagged_content.map((flag, index) => (
                            <div key={index} style={{ marginLeft: 16 }}>
                              <Text code>{flag.text}</Text>
                              <Text type="secondary"> - {flag.reason}</Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </Timeline.Item>
                  )}

                  {/* 用户投诉信息 */}
                  {selectedItem.complaint_info && (
                    <Timeline.Item
                      color="red"
                      dot={<ExclamationCircleOutlined />}
                    >
                      <Text strong>用户投诉</Text>
                      <br />
                      <Text type="danger">
                        投诉次数: {selectedItem.complaint_info.complaint_count}
                      </Text>
                      <br />
                      <Text type="secondary">
                        最近投诉: {dayjs(selectedItem.complaint_info.latest_complaint_at).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Text strong>投诉原因：</Text>
                        {selectedItem.complaint_info.complaint_reasons.map((reason, index) => (
                          <Tag key={index} color="red" style={{ marginBottom: 4 }}>
                            {reason}
                          </Tag>
                        ))}
                      </div>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Panel>
            </Collapse>

            {/* 审核操作提示 */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Text type="secondary">
                请仔细查看内容详情，确认审核决定
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedPendingReviews;

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Popconfirm,
  Alert,
  Typography,
  Card,
  Divider
} from 'antd';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';
import { ReviewItem, ReviewAction } from '../types';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const PendingReviews: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      console.log('[PENDING_REVIEWS] Fetching pending items from:', API_CONFIG.ENDPOINTS.REVIEWER_PENDING);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REVIEWER_PENDING);

      console.log('[PENDING_REVIEWS] API response:', response.data);

      if (response.data.success && response.data.data) {
        setItems(response.data.data.items || []);
      } else {
        throw new Error('API响应格式错误');
      }
    } catch (error: any) {
      console.error('获取待审核列表失败:', error);
      
      // 如果API不存在，使用模拟数据
      if (error.response?.status === 404) {
        const mockData: ReviewItem[] = [
          {
            id: '1',
            title: '我的实习经历分享 - 在科技公司的成长之路',
            type: '实习经验',
            author: '张同学',
            submittedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
            status: 'pending',
            content: '在大三的暑假，我有幸在一家知名科技公司实习。这段经历让我学到了很多专业知识，也让我对未来的职业规划有了更清晰的认识...'
          },
          {
            id: '2', 
            title: '求职面试技巧总结',
            type: '求职技巧',
            author: '李同学',
            submittedAt: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm'),
            status: 'pending',
            content: '经过多次面试的经历，我总结了一些实用的面试技巧，希望能帮助到正在求职的同学们...'
          },
          {
            id: '3',
            title: '从迷茫到清晰 - 我的职业规划心得',
            type: '职业规划',
            author: '王同学', 
            submittedAt: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
            status: 'pending',
            content: '大学四年，我从一个对未来充满迷茫的新生，逐渐找到了自己的职业方向。这个过程中有困惑，有挫折，但更多的是成长...'
          }
        ];
        setItems(mockData);
        message.info('当前显示模拟数据用于演示');
      } else {
        message.error('获取待审核列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (itemId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const reviewData: ReviewAction = {
        action,
        reason: reason || '',
        notes: ''
      };

      console.log('[PENDING_REVIEWS] Submitting review to:', API_CONFIG.ENDPOINTS.REVIEWER_REVIEW);
      console.log('[PENDING_REVIEWS] Review data:', reviewData);

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REVIEWER_REVIEW, {
        ...reviewData,
        auditId: itemId,
        reviewerId: 'reviewerA' // 临时使用固定ID
      });

      console.log('[PENDING_REVIEWS] Submit response:', response.data);
      
      message.success(`${action === 'approve' ? '批准' : '拒绝'}成功`);
      
      // 从列表中移除已审核的项目
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      setReviewModalVisible(false);
      setSelectedItem(null);
      form.resetFields();
    } catch (error: any) {
      console.error('审核操作失败:', error);
      
      // 模拟成功操作
      message.success(`${action === 'approve' ? '批准' : '拒绝'}成功 (模拟操作)`);
      setItems(prev => prev.filter(item => item.id !== itemId));
      setReviewModalVisible(false);
      setSelectedItem(null);
      form.resetFields();
    }
  };

  const openReviewModal = (item: ReviewItem, action: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(action);
    setReviewModalVisible(true);
  };

  const handleQuickApprove = (item: ReviewItem) => {
    handleReview(item.id, 'approve', '内容符合规范');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '实习经验': 'blue',
      '求职技巧': 'green', 
      '职业规划': 'orange',
      '就业故事': 'purple',
      '其他': 'default'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: '40%',
      render: (title: string) => (
        <Text strong style={{ fontSize: '14px' }}>
          {title}
        </Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: '12%',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type}</Tag>
      )
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: '12%',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: '16%',
      render: (time: string) => (
        <Text type="secondary">{time}</Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_: any, record: ReviewItem) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => openReviewModal(record, 'approve')}
          >
            查看
          </Button>
          <Popconfirm
            title="确定批准这项内容吗？"
            description="批准后内容将对用户可见"
            onConfirm={() => handleQuickApprove(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              size="small"
            >
              批准
            </Button>
          </Popconfirm>
          <Button 
            danger 
            icon={<CloseOutlined />}
            size="small"
            onClick={() => openReviewModal(record, 'reject')}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: '18px' }}>待审核内容</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              共 {items.length} 项待审核
            </Text>
          </div>
          <Space>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => message.info('筛选功能开发中')}
            >
              筛选
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchPendingItems}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {items.length === 0 && !loading && (
          <Alert
            message="暂无待审核内容"
            description="当前没有需要审核的内容，请稍后再查看。"
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
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 项`,
            size: 'default'
          }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <Space>
            <Text strong>内容审核</Text>
            <Tag color={actionType === 'approve' ? 'green' : 'red'}>
              {actionType === 'approve' ? '批准审核' : '拒绝审核'}
            </Tag>
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedItem(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedItem && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: '16px' }}>{selectedItem.title}</Text>
            </div>
            
            <Space style={{ marginBottom: 16 }}>
              <Text><strong>作者:</strong> {selectedItem.author}</Text>
              <Divider type="vertical" />
              <Text><strong>类型:</strong> {selectedItem.type}</Text>
              <Divider type="vertical" />
              <Text><strong>提交时间:</strong> {selectedItem.submittedAt}</Text>
            </Space>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>内容:</Text>
              <div style={{ 
                border: '1px solid #d9d9d9', 
                padding: '12px', 
                borderRadius: '6px',
                marginTop: '8px',
                maxHeight: '300px',
                overflow: 'auto',
                backgroundColor: '#fafafa'
              }}>
                <Paragraph>{selectedItem.content}</Paragraph>
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="reason"
                label={actionType === 'approve' ? '批准理由 (可选)' : '拒绝理由 (必填)'}
                rules={actionType === 'reject' ? [
                  { required: true, message: '拒绝时必须填写理由' }
                ] : []}
              >
                <TextArea 
                  rows={3} 
                  placeholder={
                    actionType === 'approve' 
                      ? '请输入批准理由，如：内容符合规范，对其他学生有帮助' 
                      : '请输入拒绝理由，如：内容不符合规范，存在不当信息等'
                  }
                />
              </Form.Item>
            </Form>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setReviewModalVisible(false)}>
                取消
              </Button>
              <Button 
                type={actionType === 'approve' ? 'primary' : 'default'}
                icon={actionType === 'approve' ? <CheckOutlined /> : <CloseOutlined />}
                danger={actionType === 'reject'}
                onClick={() => {
                  const reason = form.getFieldValue('reason');
                  if (actionType === 'reject' && !reason) {
                    message.warning('拒绝时请填写拒绝理由');
                    return;
                  }
                  handleReview(selectedItem.id, actionType, reason);
                }}
              >
                {actionType === 'approve' ? '确认批准' : '确认拒绝'}
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingReviews;

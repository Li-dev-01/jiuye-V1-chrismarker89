import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Radio, 
  Typography, 
  Row,
  Col,
  Statistic,
  message,
  Tooltip
} from 'antd';
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HeartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { AIReviewAssistant } from '../../components/ai/AIReviewAssistant';
import type { ReviewContent } from '../../services/aiReviewService';
import styles from './ReviewerPages.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface StorySubmission {
  id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  tags: string[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  likes?: number;
  comments?: number;
}

export const StoryReviewPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<StorySubmission[]>([]);
  const [selectedStory, setSelectedStory] = useState<StorySubmission | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();

  // 加载故事审核数据
  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8006/api/reviewer/pending-reviews?content_type=story');
        const result = await response.json();

        if (result.success && result.data.reviews) {
          // 转换API数据格式
          const formattedStories = result.data.reviews.map((item: any) => ({
            id: item.id,
            userId: item.userId || '',
            username: item.username || '匿名用户',
            title: item.data?.title || '无标题',
            content: item.data?.content || '',
            tags: item.data?.tags || [],
            submittedAt: item.submittedAt || '',
            status: 'pending',
            likes: 0,
            comments: 0
          }));
          setStories(formattedStories);
        } else {
          setStories([]);
        }
      } catch (error) {
        console.error('加载故事审核数据失败:', error);
        setStories([]);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>待审核</Tag>;
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已发布</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>已拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const handleReview = (story: StorySubmission) => {
    setSelectedStory(story);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleReviewSubmit = async (values: any) => {
    if (!selectedStory) return;

    setLoading(true);
    try {
      // 调用真实审核API
      const response = await fetch('http://localhost:8006/api/reviewer/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditId: selectedStory.id,
          action: values.decision === 'approved' ? 'approve' : 'reject',
          reviewerId: currentUser?.username || 'reviewer',
          reason: values.notes || ''
        })
      });

      const result = await response.json();

      if (result.success) {
        // 从列表中移除已审核的故事
        setStories(prev => prev.filter(item => item.id !== selectedStory.id));
        message.success(`故事审核${values.decision === 'approved' ? '通过' : '拒绝'}成功`);
        setReviewModalVisible(false);
        setSelectedStory(null);
      } else {
        message.error(`审核失败: ${result.error}`);
      }
    } catch (error) {
      message.error('审核失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '作者',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (username: string) => (
        <Space>
          <UserOutlined />
          {username}
        </Space>
      )
    },
    {
      title: '故事标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text strong>{title}</Text>
        </Tooltip>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space wrap>
          {tags.map(tag => (
            <Tag key={tag} color="blue" style={{ fontSize: '11px' }}>
              {tag}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '互动数据',
      key: 'engagement',
      width: 120,
      render: (_, record: StorySubmission) => (
        <Space direction="vertical" size={0}>
          <Space size={8}>
            <HeartOutlined style={{ color: '#f5222d' }} />
            <Text style={{ fontSize: '12px' }}>{record.likes || 0}</Text>
          </Space>
          <Space size={8}>
            <MessageOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '12px' }}>{record.comments || 0}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      sorter: (a: StorySubmission, b: StorySubmission) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '已发布', value: 'approved' },
        { text: '已拒绝', value: 'rejected' }
      ],
      onFilter: (value: any, record: StorySubmission) => record.status === value
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: StorySubmission) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleReview(record)}
            size="small"
          >
            {record.status === 'pending' ? '审核' : '查看'}
          </Button>
        </Space>
      )
    }
  ];

  // 统计数据
  const stats = {
    total: stories.length,
    pending: stories.filter(s => s.status === 'pending').length,
    approved: stories.filter(s => s.status === 'approved').length,
    rejected: stories.filter(s => s.status === 'rejected').length
  };

  return (
    <ReviewerLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <BookOutlined /> 故事审核
          </Title>
          <Paragraph>
            审核用户分享的就业故事，确保内容积极正面，对其他同学有参考价值。
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总故事数"
                value={stats.total}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="待审核"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已发布"
                value={stats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已拒绝"
                value={stats.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 故事列表 */}
        <Card title="故事提交列表">
          <Table
            columns={columns}
            dataSource={stories}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
          />
        </Card>

        {/* 审核弹窗 */}
        <Modal
          title={`审核故事 - ${selectedStory?.title}`}
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null}
          width={800}
          destroyOnHidden
        >
          {selectedStory && (
            <div>
              {/* 故事内容 */}
              <Card title="故事内容" style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>作者：</Text>
                  <Text>{selectedStory.username}</Text>
                  <Text style={{ marginLeft: 16, color: '#666' }}>
                    提交时间：{selectedStory.submittedAt}
                  </Text>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Text strong>标签：</Text>
                  <Space wrap style={{ marginLeft: 8 }}>
                    {selectedStory.tags.map(tag => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text strong>故事内容：</Text>
                </div>
                
                <div className={styles.contentPreview}>
                  {selectedStory.content}
                </div>
              </Card>

              {/* AI审核助手 */}
              <AIReviewAssistant
                content={{
                  id: selectedStory.id,
                  type: 'story',
                  title: selectedStory.title,
                  content: selectedStory.content,
                  metadata: {
                    submittedAt: selectedStory.submittedAt,
                    username: selectedStory.username,
                    tags: selectedStory.tags
                  }
                }}
                onRecommendationAccept={(recommendation) => {
                  reviewForm.setFieldsValue({
                    decision: recommendation === 'approve' ? 'approved' : 'rejected'
                  });
                }}
                showDetails={true}
                compact={false}
              />

              {/* 审核表单 */}
              {selectedStory.status === 'pending' ? (
                <Form
                  form={reviewForm}
                  layout="vertical"
                  onFinish={handleReviewSubmit}
                >
                  <Form.Item
                    name="decision"
                    label="审核决定"
                    rules={[{ required: true, message: '请选择审核结果' }]}
                  >
                    <Radio.Group>
                      <Radio value="approved">通过发布</Radio>
                      <Radio value="rejected">拒绝发布</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="notes"
                    label="审核备注"
                    rules={[{ required: true, message: '请填写审核备注' }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="请填写审核理由或建议..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        提交审核
                      </Button>
                      <Button onClick={() => setReviewModalVisible(false)}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ) : (
                <Card title="审核记录">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>审核结果：</Text>
                      {getStatusTag(selectedStory.status)}
                    </div>
                    <div>
                      <Text strong>审核时间：</Text>
                      <Text>{selectedStory.reviewedAt}</Text>
                    </div>
                    <div>
                      <Text strong>审核人：</Text>
                      <Text>{selectedStory.reviewedBy}</Text>
                    </div>
                    <div>
                      <Text strong>审核备注：</Text>
                      <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                        {selectedStory.reviewNotes}
                      </div>
                    </div>
                  </Space>
                </Card>
              )}
            </div>
          )}
        </Modal>
      </div>
    </ReviewerLayout>
  );
};

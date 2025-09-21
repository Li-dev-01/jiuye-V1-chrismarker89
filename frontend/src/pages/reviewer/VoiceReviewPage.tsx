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
  Rate
} from 'antd';
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { AIReviewAssistant } from '../../components/ai/AIReviewAssistant';
import type { ReviewContent } from '../../services/aiReviewService';
import styles from './ReviewerPages.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface VoiceSubmission {
  id: string;
  userId: string;
  username: string;
  content: string;
  mood: 'positive' | 'neutral' | 'negative';
  rating: number;
  category: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  likes?: number;
}

export const VoiceReviewPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState<VoiceSubmission[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceSubmission | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();

  // 加载心声审核数据
  useEffect(() => {
    const loadVoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8006/api/reviewer/pending-reviews?content_type=heart_voice');
        const result = await response.json();

        if (result.success && result.data.reviews) {
          // 转换API数据格式
          const formattedVoices = result.data.reviews.map((item: any) => ({
            id: item.id,
            userId: item.userId || '',
            username: item.username || '匿名用户',
            content: item.data?.content || '',
            mood: item.data?.mood || 'neutral',
            rating: item.data?.rating || 0,
            category: item.data?.category || '未分类',
            submittedAt: item.submittedAt || '',
            status: 'pending',
            likes: 0
          }));
          setVoices(formattedVoices);
        } else {
          setVoices([]);
        }
      } catch (error) {
        console.error('加载心声审核数据失败:', error);
        setVoices([]);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, []);

  const getMoodTag = (mood: string) => {
    switch (mood) {
      case 'positive':
        return <Tag color="green">积极</Tag>;
      case 'neutral':
        return <Tag color="blue">中性</Tag>;
      case 'negative':
        return <Tag color="orange">消极</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

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

  const handleReview = (voice: VoiceSubmission) => {
    setSelectedVoice(voice);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleReviewSubmit = async (values: any) => {
    if (!selectedVoice) return;

    setLoading(true);
    try {
      // 调用真实审核API
      const response = await fetch('http://localhost:8006/api/reviewer/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditId: selectedVoice.id,
          action: values.decision === 'approved' ? 'approve' : 'reject',
          reviewerId: currentUser?.username || 'reviewer',
          reason: values.notes || ''
        })
      });

      const result = await response.json();

      if (result.success) {
        // 从列表中移除已审核的心声
        setVoices(prev => prev.filter(item => item.id !== selectedVoice.id));
        message.success(`心声审核${values.decision === 'approved' ? '通过' : '拒绝'}成功`);
        setReviewModalVisible(false);
        setSelectedVoice(null);
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
      title: '用户',
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
      title: '心声内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <div style={{ maxWidth: 300 }}>
          <Text ellipsis={{ tooltip: content }}>
            {content}
          </Text>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color="purple">{category}</Tag>
      )
    },
    {
      title: '情绪',
      dataIndex: 'mood',
      key: 'mood',
      width: 80,
      render: (mood: string) => getMoodTag(mood),
      filters: [
        { text: '积极', value: 'positive' },
        { text: '中性', value: 'neutral' },
        { text: '消极', value: 'negative' }
      ],
      onFilter: (value: any, record: VoiceSubmission) => record.mood === value
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => (
        <Rate disabled value={rating} style={{ fontSize: '14px' }} />
      )
    },
    {
      title: '点赞',
      dataIndex: 'likes',
      key: 'likes',
      width: 80,
      render: (likes: number) => (
        <Space>
          <HeartOutlined style={{ color: '#f5222d' }} />
          <Text>{likes || 0}</Text>
        </Space>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      sorter: (a: VoiceSubmission, b: VoiceSubmission) => 
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
      onFilter: (value: any, record: VoiceSubmission) => record.status === value
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: VoiceSubmission) => (
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
    total: voices.length,
    pending: voices.filter(v => v.status === 'pending').length,
    approved: voices.filter(v => v.status === 'approved').length,
    rejected: voices.filter(v => v.status === 'rejected').length,
    positive: voices.filter(v => v.mood === 'positive').length,
    negative: voices.filter(v => v.mood === 'negative').length
  };

  return (
    <ReviewerLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <MessageOutlined /> 心声审核
          </Title>
          <Paragraph>
            审核用户发表的问卷心声，关注内容的真实性和情感表达的合理性。
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总心声数"
                value={stats.total}
                prefix={<MessageOutlined />}
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
                title="积极情绪"
                value={stats.positive}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="消极情绪"
                value={stats.negative}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 心声列表 */}
        <Card title="心声提交列表">
          <Table
            columns={columns}
            dataSource={voices}
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
          title={`审核心声 - ${selectedVoice?.username}`}
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null}
          width={700}
          destroyOnHidden
        >
          {selectedVoice && (
            <div>
              {/* 心声内容 */}
              <Card title="心声详情" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>用户：</Text>
                    <Text>{selectedVoice.username}</Text>
                    <Text style={{ marginLeft: 16, color: '#666' }}>
                      提交时间：{selectedVoice.submittedAt}
                    </Text>
                  </div>
                  
                  <div>
                    <Text strong>分类：</Text>
                    <Tag color="purple" style={{ marginLeft: 8 }}>
                      {selectedVoice.category}
                    </Tag>
                    <Text strong style={{ marginLeft: 16 }}>情绪：</Text>
                    {getMoodTag(selectedVoice.mood)}
                  </div>

                  <div>
                    <Text strong>评分：</Text>
                    <Rate disabled value={selectedVoice.rating} style={{ marginLeft: 8 }} />
                  </div>

                  <div>
                    <Text strong>心声内容：</Text>
                  </div>
                  
                  <div className={styles.contentPreview}>
                    {selectedVoice.content}
                  </div>
                </Space>
              </Card>

              {/* AI审核助手 */}
              <AIReviewAssistant
                content={{
                  id: selectedVoice.id,
                  type: 'voice',
                  title: `${selectedVoice.username}的心声`,
                  content: selectedVoice.content,
                  metadata: {
                    submittedAt: selectedVoice.submittedAt,
                    username: selectedVoice.username,
                    category: selectedVoice.category,
                    mood: selectedVoice.mood,
                    rating: selectedVoice.rating
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
              {selectedVoice.status === 'pending' ? (
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
                      {getStatusTag(selectedVoice.status)}
                    </div>
                    <div>
                      <Text strong>审核时间：</Text>
                      <Text>{selectedVoice.reviewedAt}</Text>
                    </div>
                    <div>
                      <Text strong>审核人：</Text>
                      <Text>{selectedVoice.reviewedBy}</Text>
                    </div>
                    <div>
                      <Text strong>审核备注：</Text>
                      <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                        {selectedVoice.reviewNotes}
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

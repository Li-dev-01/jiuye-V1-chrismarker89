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
  Descriptions,
  Row,
  Col,
  Statistic,
  message
} from 'antd';
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ReviewerLayout } from '../../components/layout/RoleBasedLayout';
import { useManagementAuthStore } from '../../stores/managementAuthStore';
import { AIReviewAssistant } from '../../components/ai/AIReviewAssistant';
import type { ReviewContent } from '../../services/aiReviewService';
import { reviewerService } from '../../services/reviewerService';
import { DataLoadingState } from '../../components/common/EmptyState';
import styles from './ReviewerPages.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface QuestionnaireSubmission {
  id: string;
  userId: string;
  username: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  data: {
    age: number;
    gender: string;
    education: string;
    major: string;
    graduationYear: number;
    employmentStatus: string;
    jobTitle?: string;
    company?: string;
    salary?: number;
    location: string;
  };
}

export const QuestionnaireReviewPage: React.FC = () => {
  const { currentUser } = useManagementAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submissions, setSubmissions] = useState<QuestionnaireSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<QuestionnaireSubmission | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();

  // 加载待审核的问卷数据
  const loadPendingReviews = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await reviewerService.getPendingReviews({
        page: 1,
        pageSize: 50,
        content_type: 'questionnaire'
      });

      if (result.success && result.data) {
        // 转换API数据格式为组件需要的格式
        const formattedSubmissions: QuestionnaireSubmission[] = result.data.reviews.map((item: any) => ({
          id: item.auditId.toString(),
          userId: item.userId || '',
          username: item.authorName || '匿名用户',
          submittedAt: item.createdAt || '',
          status: item.auditResult === 'pending' ? 'pending' :
                  item.auditResult === 'approved' ? 'approved' : 'rejected',
          reviewedAt: item.reviewedAt,
          reviewedBy: item.reviewedBy,
          reviewNotes: item.reviewNotes,
          data: {
            age: item.data?.age || 0,
            gender: item.data?.gender || '未知',
            education: item.data?.education || '未知',
            major: item.data?.major || '未知',
            graduationYear: item.data?.graduationYear || new Date().getFullYear(),
            employmentStatus: item.data?.employmentStatus || '未知',
            jobTitle: item.data?.jobTitle,
            company: item.data?.company,
            salary: item.data?.salary,
            location: item.data?.location || '未知'
          }
        }));

        setSubmissions(formattedSubmissions);
      } else {
        setError(true);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('加载待审核问卷失败:', error);
      setError(true);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>待审核</Tag>;
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已通过</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>已拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const handleReview = (submission: QuestionnaireSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleReviewSubmit = async (values: any) => {
    if (!selectedSubmission) return;

    setLoading(true);
    try {
      // 调用真实的审核API
      const result = await reviewerService.submitReview({
        auditId: parseInt(selectedSubmission.id),
        action: values.decision === 'approved' ? 'approve' : 'reject',
        reviewerId: currentUser?.id || 'reviewer',
        reason: values.notes || ''
      });

      if (result.success) {
        // 更新本地状态
        setSubmissions(prev => prev.map(item =>
          item.id === selectedSubmission.id
            ? {
                ...item,
                status: values.decision,
                reviewedAt: new Date().toLocaleString(),
                reviewedBy: currentUser?.username,
                reviewNotes: values.notes
              }
            : item
        ));

        message.success(`问卷审核${values.decision === 'approved' ? '通过' : '拒绝'}成功`);
        setReviewModalVisible(false);
        setSelectedSubmission(null);

        // 重新加载数据以获取最新状态
        loadPendingReviews();
      } else {
        message.error(`审核失败: ${result.error}`);
      }
    } catch (error) {
      console.error('审核提交失败:', error);
      message.error('审核失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '提交者',
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
      title: '专业信息',
      key: 'major',
      width: 200,
      render: (_, record: QuestionnaireSubmission) => (
        <div>
          <div>{record.data.major}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.data.education} · {record.data.graduationYear}年毕业
          </Text>
        </div>
      )
    },
    {
      title: '就业状态',
      key: 'employment',
      width: 150,
      render: (_, record: QuestionnaireSubmission) => (
        <div>
          <Tag color={record.data.employmentStatus === '已就业' ? 'green' : 'orange'}>
            {record.data.employmentStatus}
          </Tag>
          {record.data.jobTitle && (
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {record.data.jobTitle}
            </div>
          )}
        </div>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      sorter: (a: QuestionnaireSubmission, b: QuestionnaireSubmission) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '已通过', value: 'approved' },
        { text: '已拒绝', value: 'rejected' }
      ],
      onFilter: (value: any, record: QuestionnaireSubmission) => record.status === value
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: QuestionnaireSubmission) => (
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
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  };

  const hasData = submissions.length > 0;

  return (
    <ReviewerLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={2}>
            <FileTextOutlined /> 问卷审核
          </Title>
          <Paragraph>
            审核用户提交的就业问卷调查，确保数据的真实性和完整性。
          </Paragraph>
        </div>

        <DataLoadingState
          loading={loading}
          error={error}
          hasData={hasData}
          dataType="reviews"
          onRetry={loadPendingReviews}
        >

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总提交数"
                value={stats.total}
                prefix={<FileTextOutlined />}
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
                title="已通过"
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

        {/* 问卷列表 */}
        <Card title="问卷提交列表">
          <Table
            columns={columns}
            dataSource={submissions}
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
          title={`审核问卷 - ${selectedSubmission?.username}`}
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null}
          width={800}
          destroyOnClose
        >
          {selectedSubmission && (
            <div>
              {/* 问卷详情 */}
              <Card title="问卷详情" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="年龄">{selectedSubmission.data.age}岁</Descriptions.Item>
                  <Descriptions.Item label="性别">{selectedSubmission.data.gender}</Descriptions.Item>
                  <Descriptions.Item label="学历">{selectedSubmission.data.education}</Descriptions.Item>
                  <Descriptions.Item label="专业">{selectedSubmission.data.major}</Descriptions.Item>
                  <Descriptions.Item label="毕业年份">{selectedSubmission.data.graduationYear}年</Descriptions.Item>
                  <Descriptions.Item label="就业状态">{selectedSubmission.data.employmentStatus}</Descriptions.Item>
                  {selectedSubmission.data.jobTitle && (
                    <Descriptions.Item label="职位">{selectedSubmission.data.jobTitle}</Descriptions.Item>
                  )}
                  {selectedSubmission.data.company && (
                    <Descriptions.Item label="公司">{selectedSubmission.data.company}</Descriptions.Item>
                  )}
                  {selectedSubmission.data.salary && (
                    <Descriptions.Item label="薪资">{selectedSubmission.data.salary}元/月</Descriptions.Item>
                  )}
                  <Descriptions.Item label="所在地">{selectedSubmission.data.location}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* AI审核助手 */}
              <AIReviewAssistant
                content={{
                  id: selectedSubmission.id,
                  type: 'questionnaire',
                  title: `${selectedSubmission.username}的问卷调查`,
                  content: JSON.stringify(selectedSubmission.data, null, 2),
                  metadata: {
                    submittedAt: selectedSubmission.submittedAt,
                    username: selectedSubmission.username
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
              {selectedSubmission.status === 'pending' ? (
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
                      <Radio value="approved">通过</Radio>
                      <Radio value="rejected">拒绝</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="notes"
                    label="审核备注"
                    rules={[{ required: true, message: '请填写审核备注' }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="请填写审核理由或备注信息..."
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
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="审核结果">
                      {getStatusTag(selectedSubmission.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="审核时间">
                      {selectedSubmission.reviewedAt}
                    </Descriptions.Item>
                    <Descriptions.Item label="审核人">
                      {selectedSubmission.reviewedBy}
                    </Descriptions.Item>
                    <Descriptions.Item label="审核备注">
                      {selectedSubmission.reviewNotes}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
            </div>
          )}
        </Modal>
        </DataLoadingState>
      </div>
    </ReviewerLayout>
  );
};

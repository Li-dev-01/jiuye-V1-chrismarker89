/**
 * 就业故事发布表单
 * 用户分享完整的就业经历和故事
 */

import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Space, Tag, 
  Select, Upload, message, Modal, Steps, Tooltip
} from 'antd';
import {
  BookOutlined, SendOutlined, EyeOutlined, PlusOutlined,
  UserOutlined, EditOutlined, CheckOutlined
} from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';
import { UserType } from '../../types/uuid-system';
import { storyService } from '../../services/storyService';
import './StoryForm.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface StoryFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  isAnonymous: boolean;
  summary?: string;
}

interface StoryFormProps {
  questionnaireId?: number;
  onSuccess?: (storyId: number) => void;
  onCancel?: () => void;
  visible?: boolean;
  mode?: 'modal' | 'page';
}

const StoryForm: React.FC<StoryFormProps> = ({
  questionnaireId,
  onSuccess,
  onCancel,
  visible = true,
  mode = 'page'
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [form] = Form.useForm<StoryFormData>();
  const [loading, setLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<StoryFormData>>({
    isAnonymous: true,
    tags: []
  });

  // 检查用户权限
  const canPublish = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;

  // 故事分类选项
  const categories = [
    { value: 'job-hunting', label: '求职经历', icon: '🔍', desc: '分享求职过程中的经历和感悟' },
    { value: 'career-change', label: '职业转换', icon: '🔄', desc: '跨行业或跨职能的转换经历' },
    { value: 'entrepreneurship', label: '创业经历', icon: '🚀', desc: '创业过程中的挑战和收获' },
    { value: 'internship', label: '实习体验', icon: '📚', desc: '实习期间的学习和成长经历' },
    { value: 'workplace', label: '职场故事', icon: '🏢', desc: '工作中的有趣经历和感悟' },
    { value: 'growth', label: '成长历程', icon: '🌱', desc: '个人成长和能力提升的故事' }
  ];

  // 常用标签
  const commonTags = [
    '求职经验', '面试故事', '职业规划', '技能提升',
    '人际关系', '工作感悟', '行业分析', '创业心得',
    '实习收获', '转行经历', '成长故事', '职场新人',
    '团队合作', '项目经验', '学习方法', '时间管理'
  ];

  // 表单步骤
  const steps = [
    { title: '基本信息', icon: <EditOutlined /> },
    { title: '故事内容', icon: <BookOutlined /> },
    { title: '完善信息', icon: <CheckOutlined /> }
  ];

  // 处理表单提交
  const handleSubmit = async (values: StoryFormData) => {
    if (!canPublish) {
      message.error('请先登录后再发布故事');
      return;
    }

    setLoading(true);
    try {
      const storyData = {
        title: values.title,
        content: values.content,
        summary: values.summary || values.content.substring(0, 200) + '...',
        category: values.category,
        tags: values.tags,
        author_name: values.isAnonymous ? '匿名用户' : (values.authorName || currentUser!.profile?.displayName || '用户'),
        is_anonymous: values.isAnonymous,
        questionnaire_id: questionnaireId,
        user_id: currentUser!.uuid
      };

      const result = await storyService.createStory(storyData);
      
      if (result.success) {
        message.success('故事发布成功！等待审核后将会展示');
        form.resetFields();
        setCurrentStep(0);
        onSuccess?.(result.data.id);
      } else {
        message.error('发布失败: ' + result.error);
      }
    } catch (error) {
      message.error('发布失败，请稍后重试');
      console.error('Story submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 下一步
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['title', 'category']);
      } else if (currentStep === 1) {
        await form.validateFields(['content']);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error('请完善当前步骤的必填信息');
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 预览故事
  const handlePreview = () => {
    form.validateFields(['title', 'content']).then(() => {
      setPreviewVisible(true);
    }).catch(() => {
      message.error('请先完善标题和内容');
    });
  };

  // 添加标签
  const handleAddTag = (tag: string) => {
    const currentTags = form.getFieldValue('tags') || [];
    if (!currentTags.includes(tag) && currentTags.length < 8) {
      const newTags = [...currentTags, tag];
      form.setFieldsValue({ tags: newTags });
      setFormData(prev => ({ ...prev, tags: newTags }));
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getFieldValue('tags') || [];
    const newTags = currentTags.filter((tag: string) => tag !== tagToRemove);
    form.setFieldsValue({ tags: newTags });
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <Title level={4}>📝 基本信息</Title>
            
            <Form.Item
              name="title"
              label="故事标题"
              rules={[
                { required: true, message: '请输入故事标题' },
                { min: 5, message: '标题至少需要5个字符' },
                { max: 100, message: '标题不能超过100个字符' }
              ]}
            >
              <Input
                placeholder="给你的故事起一个吸引人的标题..."
                showCount
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="故事分类"
              rules={[{ required: true, message: '请选择故事分类' }]}
            >
              <Select placeholder="选择最符合的分类">
                {categories.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    <div>
                      <Space>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Space>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {cat.desc}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <Title level={4}>📖 故事内容</Title>
            
            <Form.Item
              name="content"
              label="故事正文"
              rules={[
                { required: true, message: '请输入故事内容' },
                { min: 50, message: '内容至少需要50个字符' },
                { max: 2000, message: '内容不能超过2000个字符' }
              ]}
            >
              <TextArea
                rows={12}
                placeholder="详细分享你的故事，包括背景、经历、挑战、收获等..."
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item
              name="summary"
              label="故事摘要"
              tooltip="可选，如果不填写将自动生成"
            >
              <TextArea
                rows={3}
                placeholder="简要概括你的故事要点（可选）..."
                showCount
                maxLength={200}
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <Title level={4}>🏷️ 完善信息</Title>
            
            <Form.Item
              name="tags"
              label="相关标签"
              tooltip="最多选择8个标签，帮助其他用户快速找到相关内容"
            >
              <div className="tags-section">
                <div className="selected-tags">
                  {(formData.tags || []).map(tag => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => handleRemoveTag(tag)}
                      color="blue"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
                <div className="common-tags">
                  <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                    常用标签：
                  </Text>
                  <Space wrap>
                    {commonTags.map(tag => (
                      <Tag
                        key={tag}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleAddTag(tag)}
                        color={formData.tags?.includes(tag) ? 'blue' : 'default'}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>
            </Form.Item>

            <Form.Item
              name="isAnonymous"
              label="发布方式"
            >
              <Select>
                <Option value={true}>匿名发布（推荐）</Option>
                <Option value={false}>实名发布</Option>
              </Select>
            </Form.Item>

            {!form.getFieldValue('isAnonymous') && (
              <Form.Item
                name="authorName"
                label="作者署名"
                rules={[{ required: true, message: '请输入作者署名' }]}
              >
                <Input placeholder="输入你希望显示的署名" />
              </Form.Item>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 表单内容
  const formContent = (
    <div className="story-form">
      <div className="form-header">
        <Title level={3}>
          <BookOutlined style={{ color: '#1890ff' }} />
          分享你的就业故事
        </Title>
        <Paragraph type="secondary">
          分享你的求职经历、职业发展故事，为其他同学提供参考和启发
        </Paragraph>
      </div>

      {/* 步骤指示器 */}
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={formData}
        onValuesChange={(_, allValues) => setFormData(allValues)}
      >
        {renderStepContent()}

        {/* 操作按钮 */}
        <Form.Item style={{ marginTop: 32 }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
                disabled={!canPublish}
              >
                {loading ? '发布中...' : '发布故事'}
              </Button>
            )}
            
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
            >
              预览
            </Button>
            
            {onCancel && (
              <Button onClick={onCancel}>
                取消
              </Button>
            )}
          </Space>
        </Form.Item>

        {/* 权限提示 */}
        {!canPublish && (
          <div className="permission-notice">
            <Text type="secondary">
              💡 需要登录后才能发布故事，
              <a href="/login">点击登录</a>
            </Text>
          </div>
        )}
      </Form>

      {/* 预览模态框 */}
      <Modal
        title="故事预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div className="story-preview">
          <Card>
            <div className="preview-header">
              <Title level={4}>{form.getFieldValue('title')}</Title>
              <Space>
                <Tag color="blue">
                  {categories.find(c => c.value === form.getFieldValue('category'))?.label}
                </Tag>
                <Text type="secondary">
                  {form.getFieldValue('isAnonymous') ? '匿名用户' : (form.getFieldValue('authorName') || currentUser?.profile?.displayName || '用户')}
                </Text>
              </Space>
            </div>
            
            {form.getFieldValue('summary') && (
              <div className="preview-summary">
                <Text strong>摘要：</Text>
                <Paragraph>{form.getFieldValue('summary')}</Paragraph>
              </div>
            )}
            
            <div className="preview-content">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {form.getFieldValue('content')}
              </Paragraph>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="preview-tags">
                <Space wrap>
                  {formData.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
            
            <div className="preview-meta">
              <Text type="secondary">
                刚刚发布 • 等待审核
              </Text>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );

  // 根据模式返回不同的包装
  if (mode === 'modal') {
    return (
      <Modal
        title="发布就业故事"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={900}
        destroyOnClose
      >
        {formContent}
      </Modal>
    );
  }

  return (
    <Card className="story-form-card">
      {formContent}
    </Card>
  );
};

export default StoryForm;

/**
 * 问卷心声发布表单
 * 用户分享问卷填写后的心声和感悟
 */

import React, { useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Space, Tag, 
  Select, Rate, message, Modal, Tooltip
} from 'antd';
import {
  HeartOutlined, SendOutlined, EyeOutlined, 
  SmileOutlined, MehOutlined, FrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../../stores/universalAuthStore';
import { UserType } from '../../types/uuid-system';
import { heartVoiceService } from '../../services/heartVoiceService';
import './HeartVoiceForm.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface HeartVoiceFormData {
  content: string;
  category: string;
  emotionScore: number;
  tags: string[];
  isAnonymous: boolean;
}

interface HeartVoiceFormProps {
  questionnaireId?: number;
  onSuccess?: (voiceId: number) => void;
  onCancel?: () => void;
  visible?: boolean;
  mode?: 'modal' | 'page';
}

const HeartVoiceForm: React.FC<HeartVoiceFormProps> = ({
  questionnaireId,
  onSuccess,
  onCancel,
  visible = true,
  mode = 'page'
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [form] = Form.useForm<HeartVoiceFormData>();
  const [loading, setLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<HeartVoiceFormData>>({
    isAnonymous: true,
    emotionScore: 3,
    tags: []
  });

  // 检查用户权限
  const canPublish = isAuthenticated && currentUser?.userType === UserType.SEMI_ANONYMOUS;

  // 心声分类选项
  const categories = [
    { value: 'experience', label: '求职经验', icon: '💼' },
    { value: 'advice', label: '建议分享', icon: '💡' },
    { value: 'encouragement', label: '鼓励话语', icon: '💪' },
    { value: 'reflection', label: '个人感悟', icon: '🤔' },
    { value: 'gratitude', label: '感谢表达', icon: '🙏' },
    { value: 'challenge', label: '困难分享', icon: '⚡' }
  ];

  // 常用标签
  const commonTags = [
    '求职心得', '面试技巧', '简历优化', '职业规划', 
    '实习经验', '校招经验', '社招经验', '行业分析',
    '技能提升', '心态调整', '时间管理', '人际关系'
  ];

  // 情感评分描述
  const emotionDescriptions = {
    1: { text: '很沮丧', icon: <FrownOutlined style={{ color: '#ff4d4f' }} />, color: '#ff4d4f' },
    2: { text: '有些失落', icon: <FrownOutlined style={{ color: '#ff7a45' }} />, color: '#ff7a45' },
    3: { text: '一般般', icon: <MehOutlined style={{ color: '#faad14' }} />, color: '#faad14' },
    4: { text: '比较积极', icon: <SmileOutlined style={{ color: '#52c41a' }} />, color: '#52c41a' },
    5: { text: '非常积极', icon: <SmileOutlined style={{ color: '#1890ff' }} />, color: '#1890ff' }
  };

  // 处理表单提交
  const handleSubmit = async (values: HeartVoiceFormData) => {
    if (!canPublish) {
      message.error('请先登录后再发布心声');
      return;
    }

    setLoading(true);
    try {
      const heartVoiceData = {
        content: values.content,
        category: values.category,
        emotion_score: values.emotionScore,
        tags: values.tags,
        is_anonymous: values.isAnonymous,
        questionnaire_id: questionnaireId,
        user_id: currentUser!.uuid
      };

      const result = await heartVoiceService.createHeartVoice(heartVoiceData);
      
      if (result.success) {
        message.success('心声发布成功！等待审核后将会展示');
        form.resetFields();
        onSuccess?.(result.data.id);
      } else {
        message.error('发布失败: ' + result.error);
      }
    } catch (error) {
      message.error('发布失败，请稍后重试');
      console.error('Heart voice submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 预览心声
  const handlePreview = () => {
    form.validateFields(['content', 'category']).then(() => {
      setPreviewVisible(true);
    }).catch(() => {
      message.error('请先完善必填信息');
    });
  };

  // 添加标签
  const handleAddTag = (tag: string) => {
    const currentTags = form.getFieldValue('tags') || [];
    if (!currentTags.includes(tag) && currentTags.length < 5) {
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

  // 表单内容
  const formContent = (
    <div className="heart-voice-form">
      <div className="form-header">
        <Title level={3}>
          <HeartOutlined style={{ color: '#ff4d4f' }} />
          分享你的问卷心声
        </Title>
        <Paragraph type="secondary">
          分享你在填写问卷过程中的感悟、经验或建议，帮助其他同学更好地了解就业现状
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={formData}
        onValuesChange={(_, allValues) => setFormData(allValues)}
      >
        {/* 心声内容 */}
        <Form.Item
          name="content"
          label="心声内容"
          rules={[
            { required: true, message: '请输入心声内容' },
            { min: 10, message: '内容至少需要10个字符' },
            { max: 500, message: '内容不能超过500个字符' }
          ]}
        >
          <TextArea
            rows={6}
            placeholder="分享你的求职心得、面试经验、职业规划想法，或者对其他同学的建议和鼓励..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* 心声分类 */}
        <Form.Item
          name="category"
          label="心声分类"
          rules={[{ required: true, message: '请选择心声分类' }]}
        >
          <Select placeholder="选择最符合的分类">
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>
                <Space>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 情感评分 */}
        <Form.Item
          name="emotionScore"
          label="当前心情"
          tooltip="分享时的心情状态，帮助其他同学了解不同情况下的心声"
        >
          <div className="emotion-rating">
            <Rate
              count={5}
              value={formData.emotionScore}
              onChange={(value) => {
                form.setFieldsValue({ emotionScore: value });
                setFormData(prev => ({ ...prev, emotionScore: value }));
              }}
            />
            {formData.emotionScore && (
              <Space style={{ marginLeft: 16 }}>
                {emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions]?.icon}
                <Text style={{ 
                  color: emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions]?.color 
                }}>
                  {emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions]?.text}
                </Text>
              </Space>
            )}
          </div>
        </Form.Item>

        {/* 标签选择 */}
        <Form.Item
          name="tags"
          label="相关标签"
          tooltip="最多选择5个标签，帮助其他用户快速找到相关内容"
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

        {/* 匿名发布选项 */}
        <Form.Item
          name="isAnonymous"
          label="发布方式"
        >
          <Select>
            <Option value={true}>匿名发布（推荐）</Option>
            <Option value={false}>实名发布</Option>
          </Select>
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              disabled={!canPublish}
            >
              {loading ? '发布中...' : '发布心声'}
            </Button>
            
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
              💡 需要登录后才能发布心声，
              <a href="/login">点击登录</a>
            </Text>
          </div>
        )}
      </Form>

      {/* 预览模态框 */}
      <Modal
        title="心声预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={600}
      >
        <div className="voice-preview">
          <Card>
            <div className="preview-header">
              <Space>
                <HeartOutlined style={{ color: '#ff4d4f' }} />
                <Text strong>
                  {categories.find(c => c.value === form.getFieldValue('category'))?.label}
                </Text>
                {formData.emotionScore && emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions] && (
                  <>
                    {emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions].icon}
                    <Text type="secondary">
                      {emotionDescriptions[formData.emotionScore as keyof typeof emotionDescriptions].text}
                    </Text>
                  </>
                )}
              </Space>
            </div>
            
            <Paragraph style={{ margin: '16px 0' }}>
              {form.getFieldValue('content')}
            </Paragraph>
            
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
                {form.getFieldValue('isAnonymous') ? '匿名用户' : currentUser?.profile?.displayName || '当前用户'} •
                刚刚发布
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
        title="发布问卷心声"
        visible={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {formContent}
      </Modal>
    );
  }

  return (
    <Card className="heart-voice-form-card">
      {formContent}
    </Card>
  );
};

export default HeartVoiceForm;

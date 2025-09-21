/**
 * 独立故事提交页面
 * 用户登录后可以提交就业故事
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  message,
  Form,
  Row,
  Col
} from 'antd';
import {
  BookOutlined,
  SendOutlined,
  UserOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import styles from './StorySubmitPage.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const STORY_CATEGORIES = [
  { value: 'job_search', label: '求职经历' },
  { value: 'interview', label: '面试经验' },
  { value: 'career_change', label: '转行故事' },
  { value: 'internship', label: '实习感悟' },
  { value: 'workplace', label: '职场生活' },
  { value: 'growth', label: '成长感悟' },
  { value: 'advice', label: '经验分享' }
];

const COMMON_TAGS = [
  '求职', '面试', '简历', '职场', '成长', '经验', '建议', 
  '挫折', '成功', '学习', '技能', '人际关系', '工作生活平衡'
];

export const StorySubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [form] = Form.useForm();
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    // 检查用户登录状态
    if (!isAuthenticated) {
      message.warning('请先登录后再发布故事');
      // 触发全局事件打开半匿名登录
      window.dispatchEvent(new Event('openSemiAnonymousLogin'));
      return;
    }
  }, [isAuthenticated, navigate]);

  // 添加标签
  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      message.warning('最多只能选择5个标签');
    }
  };

  // 提交故事
  const handleSubmit = async (values: any) => {
    if (!currentUser?.id) {
      message.error('用户信息异常，请重新登录');
      return;
    }

    setSubmitting(true);

    try {
      const storyData = {
        title: values.title.trim(),
        content: values.content.trim(),
        category: values.category,
        tags: selectedTags,
        user_id: currentUser.id,
        is_anonymous: false
      };

      // TODO: 调用故事提交API
      // const result = await storyService.createStory(storyData);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success('故事发布成功！');
      
      // 跳转到故事页面
      navigate('/stories', {
        state: {
          showSuccess: true
        }
      });
    } catch (error) {
      console.error('故事提交失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.mainCard}>
          <div className={styles.header}>
            <Space align="center" size="middle">
              <BookOutlined className={styles.icon} />
              <div>
                <Title level={2} style={{ margin: 0 }}>分享您的就业故事</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  您的经历和感悟，将成为他人前行路上的明灯
                </Paragraph>
              </div>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.form}
          >
            <Row gutter={16}>
              <Col xs={24} sm={24} md={14}>
                <Form.Item
                  name="title"
                  label={<Text strong>故事标题 *</Text>}
                  rules={[
                    { required: true, message: '请输入故事标题' },
                    { max: 100, message: '标题不能超过100个字符' }
                  ]}
                >
                  <Input
                    placeholder="请输入一个吸引人的标题..."
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={10}>
                <Form.Item
                  name="category"
                  label={<Text strong>故事分类 *</Text>}
                  rules={[{ required: true, message: '请选择故事分类' }]}
                >
                  <div className={styles.categorySection}>
                    {STORY_CATEGORIES.map(category => (
                      <Tag
                        key={category.value}
                        className={`${styles.categoryTag} ${
                          form.getFieldValue('category') === category.value ? styles.selectedCategoryTag : ''
                        }`}
                        onClick={() => {
                          form.setFieldsValue({ category: category.value });
                        }}
                      >
                        {category.label}
                      </Tag>
                    ))}
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="content"
              label={<Text strong>故事内容 *</Text>}
              rules={[
                { required: true, message: '请输入故事内容' },
                { min: 50, message: '故事内容至少需要50个字符' },
                { max: 2000, message: '故事内容不能超过2000个字符' }
              ]}
            >
              <TextArea
                placeholder="请详细分享您的就业故事，包括遇到的挑战、解决方案、收获的经验等..."
                rows={8}
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>故事标签</Text>}
            >
              <div className={styles.tagSection}>
                <div className={styles.selectedTags}>
                  {selectedTags.map(tag => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => handleTagClick(tag)}
                      color="blue"
                    >
                      {tag}
                    </Tag>
                  ))}
                  {selectedTags.length === 0 && (
                    <Text type="secondary">点击下方标签添加（最多5个）</Text>
                  )}
                </div>
                <div className={styles.availableTags}>
                  {COMMON_TAGS.map(tag => (
                    <Tag
                      key={tag}
                      className={`${styles.clickableTag} ${
                        selectedTags.includes(tag) ? styles.selectedTag : ''
                      }`}
                      onClick={() => handleTagClick(tag)}
                    >
                      <TagsOutlined style={{ marginRight: '4px' }} />
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </Form.Item>

            <div className={styles.userInfo}>
              <UserOutlined style={{ marginRight: '8px' }} />
              <Text type="secondary">
                发布者：{currentUser?.nickname || currentUser?.username || '用户'}
              </Text>
            </div>

            <div className={styles.actions}>
              <Space size="large">
                <Button 
                  size="large" 
                  onClick={() => navigate('/stories')}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<SendOutlined />}
                  loading={submitting}
                  htmlType="submit"
                >
                  发布故事
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default StorySubmitPage;

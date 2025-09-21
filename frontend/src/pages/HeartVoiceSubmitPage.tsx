/**
 * 独立心声提交页面
 * 用户登录后可以提交问卷心声
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Input,
  Rate,
  Tag,
  message,
  Spin,
  Form,
  Row,
  Col,
  Select,
  Divider,
  Tooltip
} from 'antd';
import {
  HeartOutlined,
  SendOutlined,
  EditOutlined,
  UserOutlined,
  TagsOutlined,
  BulbOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { heartVoiceService } from '../services/heartVoiceService';
import SmartCategorySelector from '../components/common/SmartCategorySelector';
import SmartTagSelector from '../components/common/SmartTagSelector';
import styles from './HeartVoiceSubmitPage.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 心声分类配置
const VOICE_CATEGORIES = [
  {
    value: 'gratitude',
    label: '感谢',
    description: '对问卷设计、平台功能的感谢',
    examples: ['问卷设计', '用户体验', '平台功能']
  },
  {
    value: 'suggestion',
    label: '建议',
    description: '对问卷改进、功能优化的建议',
    examples: ['界面优化', '功能改进', '流程简化']
  },
  {
    value: 'reflection',
    label: '感悟',
    description: '填写问卷后的思考和感悟',
    examples: ['就业思考', '职业规划', '成长感悟']
  },
  {
    value: 'experience',
    label: '经验',
    description: '就业相关的经验分享',
    examples: ['求职经验', '面试技巧', '职场经验']
  },
  {
    value: 'other',
    label: '其他',
    description: '其他想要分享的内容',
    examples: ['技术问题', '使用体验', '期望功能']
  }
];

// 智能标签推荐系统
const TAG_CATEGORIES = {
  'gratitude': {
    name: '感谢相关',
    tags: ['问卷设计', '用户体验', '数据收集', '平台功能', '服务质量', '反馈机制']
  },
  'suggestion': {
    name: '建议相关',
    tags: ['界面优化', '功能改进', '流程简化', '数据分析', '用户引导', '操作便捷']
  },
  'reflection': {
    name: '感悟相关',
    tags: ['就业思考', '职业规划', '成长感悟', '人生感悟', '学习收获', '自我认知']
  },
  'experience': {
    name: '经验相关',
    tags: ['求职经验', '面试技巧', '职场经验', '学习方法', '技能提升', '人际关系']
  },
  'other': {
    name: '其他',
    tags: ['技术问题', '使用体验', '期望功能', '改进意见', '创新想法', '合作建议']
  }
};

// 热门标签（基于使用频率）
const POPULAR_TAGS = [
  '问卷体验', '就业指导', '职业规划', '求职建议', '数据分析',
  '用户体验', '功能建议', '学习收获', '感谢平台', '改进意见'
];

export const HeartVoiceSubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [heartVoiceContent, setHeartVoiceContent] = useState('');
  const [emotionScore, setEmotionScore] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [pendingHeartVoice, setPendingHeartVoice] = useState<any>(null);

  useEffect(() => {
    // 检查用户登录状态
    if (!isAuthenticated) {
      message.warning('请先登录后再提交心声');
      // 触发全局事件打开半匿名登录
      window.dispatchEvent(new Event('openSemiAnonymousLogin'));
      return;
    }

    // 加载待提交的心声数据
    const loadPendingHeartVoice = () => {
      try {
        const pending = localStorage.getItem('pending_heart_voice');
        if (pending) {
          const heartVoiceData = JSON.parse(pending);
          setPendingHeartVoice(heartVoiceData);
          setHeartVoiceContent(heartVoiceData.content || '');
        } else {
          // 如果没有待提交的心声，允许用户自由创建
          message.info('您可以在这里分享您的就业心声');
        }
      } catch (error) {
        console.error('加载待提交心声失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingHeartVoice();
  }, [isAuthenticated, navigate]);

  // 智能标签推荐
  const getRecommendedTags = (category: string, content: string): string[] => {
    const categoryTags = TAG_CATEGORIES[category as keyof typeof TAG_CATEGORIES]?.tags || [];
    const contentKeywords = content.toLowerCase();

    // 基于内容关键词推荐标签
    const keywordBasedTags = categoryTags.filter(tag =>
      contentKeywords.includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(contentKeywords.split(' ')[0])
    );

    // 结合热门标签
    const popularRecommendations = POPULAR_TAGS.filter(tag =>
      contentKeywords.includes(tag.toLowerCase())
    );

    // 合并并去重，限制数量
    const recommendations = [...new Set([...keywordBasedTags, ...popularRecommendations])];
    return recommendations.slice(0, 6);
  };

  // 处理分类变化
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);

    // 自动推荐标签
    if (category && heartVoiceContent) {
      const recommended = getRecommendedTags(category, heartVoiceContent);
      // 自动添加前3个推荐标签
      const autoTags = recommended.slice(0, 3).filter(tag => !selectedTags.includes(tag));
      setSelectedTags(prev => [...prev, ...autoTags].slice(0, 5));
    }
  };

  // 处理标签选择
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      message.warning('最多只能选择5个标签');
    }
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;

    if (selectedTags.includes(customTag.trim())) {
      message.warning('标签已存在');
      return;
    }

    if (selectedTags.length >= 5) {
      message.warning('最多只能选择5个标签');
      return;
    }

    setSelectedTags([...selectedTags, customTag.trim()]);
    setCustomTag('');
  };

  // 获取当前分类的推荐标签
  const getCurrentCategoryTags = () => {
    if (!selectedCategory) return [];
    return TAG_CATEGORIES[selectedCategory as keyof typeof TAG_CATEGORIES]?.tags || [];
  };

  // 提交心声
  const handleSubmit = async () => {
    if (!heartVoiceContent.trim()) {
      message.warning('请输入心声内容');
      return;
    }

    if (!selectedCategory) {
      message.warning('请选择心声分类');
      return;
    }

    if (selectedTags.length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }

    if (!currentUser?.id) {
      message.error('用户信息异常，请重新登录');
      return;
    }

    setSubmitting(true);

    try {
      const heartVoiceData = {
        content: heartVoiceContent.trim(),
        category: selectedCategory,
        emotion_score: emotionScore,
        tags: selectedTags,
        is_anonymous: false, // 登录用户，非匿名
        questionnaire_id: pendingHeartVoice?.questionnaireId,
        user_id: currentUser.id
      };

      const result = await heartVoiceService.createHeartVoice(heartVoiceData);

      if (result.success) {
        message.success('心声提交成功！');
        
        // 清除本地存储的待提交心声
        localStorage.removeItem('pending_heart_voice');
        
        // 跳转到心声页面
        navigate('/voices', {
          state: {
            showSuccess: true,
            newVoiceId: result.data?.id
          }
        });
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (error) {
      console.error('心声提交失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 跳过心声提交
  const handleSkip = () => {
    // 清除本地存储的待提交心声
    localStorage.removeItem('pending_heart_voice');
    
    // 跳转到结果页面
    navigate('/results');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.mainCard}>
          <div className={styles.header}>
            <Space align="center" size="middle">
              <HeartOutlined className={styles.icon} />
              <div>
                <Title level={2} style={{ margin: 0 }}>分享您的就业心声</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  您的真实感受和经验分享，将帮助更多求职者
                </Paragraph>
              </div>
            </Space>
          </div>

          {pendingHeartVoice && (
            <Alert
              message="检测到待提交的心声"
              description={`来自问卷：${pendingHeartVoice.questionnaireId || '就业调查'}`}
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          )}

          <Form form={form} className={styles.form} layout="vertical">
            <Form.Item
              name="content"
              label={<Text strong>心声内容 *</Text>}
              rules={[
                { required: true, message: '请输入心声内容' },
                { max: 500, message: '内容不能超过500个字符' }
              ]}
            >
              <TextArea
                value={heartVoiceContent}
                onChange={(e) => setHeartVoiceContent(e.target.value)}
                placeholder="请分享您在求职过程中的真实感受、经验或建议..."
                rows={6}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="emotion"
                  label={<Text strong>情感评分</Text>}
                >
                  <div className={styles.emotionSection}>
                    <Rate
                      value={emotionScore}
                      onChange={setEmotionScore}
                      character={<HeartOutlined />}
                    />
                    <Text type="secondary" className={styles.emotionText}>
                      {emotionScore === 1 && '很沮丧'}
                      {emotionScore === 2 && '有些失落'}
                      {emotionScore === 3 && '一般'}
                      {emotionScore === 4 && '比较积极'}
                      {emotionScore === 5 && '非常乐观'}
                    </Text>
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="tags"
                  label={<Text strong>标签</Text>}
                >
                  <div className={styles.tagsSection}>
                    <Tag color="blue">就业</Tag>
                    <Tag color="green">心声</Tag>
                    <Tag color="orange">问卷</Tag>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <div className={styles.userInfo}>
              <UserOutlined />
              <Text type="secondary">
                发布者：{currentUser?.nickname || currentUser?.username || '用户'}
              </Text>
            </div>
          </Form>

          <div className={styles.actions}>
            <Space size="large">
              <Button 
                size="large" 
                onClick={handleSkip}
                disabled={submitting}
              >
                跳过
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<SendOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                提交心声
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HeartVoiceSubmitPage;

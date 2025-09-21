/**
 * 心声生成页面
 * 独立的心声生成和提交页面，此时用户状态已确定
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Input,
  Alert,
  Spin,
  message,
  Steps,
  Row,
  Col,
  Tag
} from 'antd';
import {
  HeartOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { heartVoiceService } from '../services/heartVoiceService';
import type { CreateHeartVoiceData } from '../services/heartVoiceService';
import styles from './HeartVoiceGeneration.module.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

interface HeartVoiceGenerationProps {}

export const HeartVoiceGeneration: React.FC<HeartVoiceGenerationProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 从路由状态获取数据
  const questionnaireData = location.state?.questionnaireData;
  const userType = location.state?.userType || 'anonymous';

  useEffect(() => {
    // 检查是否有问卷数据
    if (!questionnaireData) {
      message.warning('请先完成问卷填写');
      navigate('/questionnaire');
      return;
    }

    // 设置用户类型
    setIsAnonymous(userType === 'anonymous');

    // 自动开始生成心声
    generateHeartVoice();
  }, [questionnaireData, userType, navigate]);

  // 生成心声内容
  const generateHeartVoice = async () => {
    setGenerating(true);
    setCurrentStep(0);

    try {
      // 调用AI生成心声API
      const aiContent = await heartVoiceService.generateHeartVoice({
        questionnaireData,
        userType: isAnonymous ? 'anonymous' : 'authenticated',
        preferences: {
          style: 'reflective',
          length: 'medium',
          tone: 'sincere'
        }
      });

      setGeneratedContent(aiContent);
      setEditedContent(aiContent);

      setCurrentStep(1);
      message.success('心声内容生成完成！');
    } catch (error) {
      console.error('心声生成失败:', error);
      // AI生成失败时提示用户手动输入
      message.error('AI心声生成服务暂不可用，请手动输入心声内容');
      setCurrentStep(1);
    } finally {
      setGenerating(false);
    }
  };

  // 提交心声
  const handleSubmitHeartVoice = async () => {
    if (!editedContent.trim()) {
      message.warning('请输入心声内容');
      return;
    }

    setSubmitting(true);
    setCurrentStep(2);

    try {
      // 构造心声数据
      const heartVoiceData: CreateHeartVoiceData = {
        content: editedContent,
        category: 'employment_reflection', // 就业反思类别
        emotion_score: 0.7, // 默认情感分数
        tags: ['就业', '问卷', '心声'],
        is_anonymous: isAnonymous,
        questionnaire_id: questionnaireData?.id,
        user_id: isAnonymous ? 0 : (currentUser?.id || 0)
      };

      // 调用心声提交API
      const result = await heartVoiceService.createHeartVoice(heartVoiceData);

      message.success('心声提交成功！');
      setCurrentStep(3);

      // 延迟跳转
      setTimeout(() => {
        navigate('/voices', {
          state: {
            showSuccess: true,
            newVoiceId: result.id
          }
        });
      }, 2000);

    } catch (error) {
      console.error('心声提交失败:', error);
      message.error('提交失败，请重试');
      setCurrentStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    generateHeartVoice();
  };

  // 渲染用户状态
  const renderUserStatus = () => (
    <Card size="small" className={styles.statusCard}>
      <Space>
        <UserOutlined />
        <Text strong>当前状态：</Text>
        <Tag color={isAnonymous ? 'orange' : 'green'}>
          {isAnonymous ? '匿名用户' : `已登录 (${currentUser?.userType || 'user'})`}
        </Tag>
      </Space>
    </Card>
  );

  // 渲染步骤
  const renderSteps = () => (
    <Steps current={currentStep} className={styles.steps}>
      <Step 
        title="生成心声" 
        icon={generating ? <LoadingOutlined /> : <HeartOutlined />}
        description="AI根据问卷生成个性化内容"
      />
      <Step 
        title="编辑内容" 
        icon={<EditOutlined />}
        description="您可以编辑和完善心声内容"
      />
      <Step 
        title="提交发布" 
        icon={submitting ? <LoadingOutlined /> : <SendOutlined />}
        description="发布到心声墙供他人查看"
      />
      <Step 
        title="完成" 
        icon={<CheckCircleOutlined />}
        description="心声发布成功"
      />
    </Steps>
  );

  // 渲染生成阶段
  const renderGenerationStage = () => (
    <Card className={styles.generationCard}>
      <div className={styles.generationContent}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 24 }}>正在生成您的心声...</Title>
        <Paragraph>
          AI正在根据您的问卷回答生成个性化的心声内容，请稍候...
        </Paragraph>
      </div>
    </Card>
  );

  // 渲染编辑阶段
  const renderEditingStage = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card title="AI生成的心声" className={styles.previewCard}>
          <div className={styles.generatedContent}>
            <Paragraph>{generatedContent}</Paragraph>
          </div>
          <Button 
            icon={<HeartOutlined />} 
            onClick={handleRegenerate}
            loading={generating}
          >
            重新生成
          </Button>
        </Card>
      </Col>
      
      <Col xs={24} lg={12}>
        <Card title="编辑您的心声" className={styles.editCard}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="请编辑您的心声内容..."
              rows={8}
              maxLength={500}
              showCount
            />
            
            <Alert
              type="info"
              message="编辑提示"
              description="您可以修改AI生成的内容，让它更符合您的真实想法。"
              showIcon
            />
            
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmitHeartVoice}
              loading={submitting}
              block
            >
              提交心声
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );

  // 渲染提交阶段
  const renderSubmittingStage = () => (
    <Card className={styles.submittingCard}>
      <div className={styles.submittingContent}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 24 }}>正在提交您的心声...</Title>
        <Paragraph>
          正在将您的心声发布到心声墙，请稍候...
        </Paragraph>
      </div>
    </Card>
  );

  // 渲染完成阶段
  const renderCompletionStage = () => (
    <Card className={styles.completionCard}>
      <div className={styles.completionContent}>
        <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
        <Title level={2} style={{ marginTop: 24, color: '#52c41a' }}>
          心声发布成功！
        </Title>
        <Paragraph>
          您的心声已成功发布到心声墙，其他用户可以查看和共鸣。
        </Paragraph>
        <Space>
          <Button type="primary" onClick={() => navigate('/voices')}>
            查看心声墙
          </Button>
          <Button onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Space>
      </div>
    </Card>
  );

  if (!questionnaireData) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 用户状态 */}
        {renderUserStatus()}

        {/* 步骤指示器 */}
        {renderSteps()}

        {/* 主要内容区域 */}
        <div className={styles.mainContent}>
          {currentStep === 0 && renderGenerationStage()}
          {currentStep === 1 && renderEditingStage()}
          {currentStep === 2 && renderSubmittingStage()}
          {currentStep === 3 && renderCompletionStage()}
        </div>

        {/* 底部提示 */}
        {currentStep < 3 && (
          <Alert
            type="info"
            message="关于心声发布"
            description={
              isAnonymous 
                ? "您以匿名方式发布心声，其他用户无法看到您的个人信息。"
                : "您以注册用户身份发布心声，可以在个人中心管理您的心声内容。"
            }
            showIcon
          />
        )}
      </Space>
    </div>
  );
};

export default HeartVoiceGeneration;

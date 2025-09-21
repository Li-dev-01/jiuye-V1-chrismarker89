/**
 * 问卷完成页面
 * 用户完成问卷后的提交方式选择页面
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Divider,
  Row,
  Col,
  Spin,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  UserOutlined,
  LoginOutlined,
  SendOutlined,
  HeartOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { useQuestionnaireCompletion } from '../hooks/useQuestionnaireCompletion';
import { universalQuestionnaireService } from '../services/universalQuestionnaireService';
import styles from './QuestionnaireCompletion.module.css';

const { Title, Paragraph, Text } = Typography;

interface QuestionnaireCompletionProps {
  questionnaireData?: any; // 问卷数据
}

export const QuestionnaireCompletion: React.FC<QuestionnaireCompletionProps> = ({
  questionnaireData
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();
  const {
    isLoggedIn,
    userType,
    detectionResult,
    isDetecting,
    recommendedAction
  } = useQuestionnaireCompletion();

  const [submitting, setSubmitting] = useState(false);
  const [submitChoice, setSubmitChoice] = useState<'anonymous' | 'login' | null>(null);


  // 从路由状态获取问卷数据
  const questionnaire = questionnaireData || location.state?.questionnaireData;

  useEffect(() => {
    // 如果没有问卷数据，重定向到问卷页面
    if (!questionnaire) {
      message.warning('请先完成问卷填写');
      navigate('/questionnaire');
    }


  }, [questionnaire, navigate]);

  // 匿名提交问卷
  const handleAnonymousSubmit = async () => {
    setSubmitting(true);
    setSubmitChoice('anonymous');

    try {
      // 构造通用问卷格式
      const questionnaireResponse = {
        questionnaireId: 'employment-survey-2024',
        sectionResponses: [
          {
            sectionId: 'basic-info',
            responses: questionnaire
          }
        ],
        metadata: {
          userType: 'anonymous',
          submissionSource: 'web',
          completionTime: Date.now()
        }
      };

      // 调用通用问卷提交API
      await universalQuestionnaireService.submitQuestionnaire(questionnaireResponse);

      message.success('问卷提交成功！');

      // 匿名提交完成后，提示用户可以登录后分享心声
      if (hasPendingHeartVoice) {
        message.info('您可以登录后分享您的就业心声');
      }

      // 跳转到结果页面
      navigate('/results', {
        state: {
          questionnaireData: questionnaire,
          submissionType: 'anonymous'
        }
      });
    } catch (error) {
      console.error('问卷提交失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 登录后提交
  const handleLoginSubmit = () => {
    setSubmitChoice('login');
    
    // 保存问卷数据到sessionStorage，登录后继续
    sessionStorage.setItem('pendingQuestionnaire', JSON.stringify(questionnaire));
    
    // 跳转到登录页面
    navigate('/auth/login', {
      state: {
        from: '/questionnaire-completion',
        action: 'submit_questionnaire'
      }
    });
  };

  // 已登录用户直接提交
  const handleAuthenticatedSubmit = async () => {
    setSubmitting(true);

    try {
      // 构造通用问卷格式（已登录用户）
      const questionnaireResponse = {
        questionnaireId: 'employment-survey-2024',
        sectionResponses: [
          {
            sectionId: 'basic-info',
            responses: questionnaire
          }
        ],
        metadata: {
          userType: userType || 'authenticated',
          userId: currentUser?.id,
          submissionSource: 'web',
          completionTime: Date.now()
        }
      };

      // 调用通用问卷提交API
      await universalQuestionnaireService.submitQuestionnaire(questionnaireResponse);

      message.success('问卷提交成功！');

      // 登录用户提交后，检查是否有待提交的心声
      if (hasPendingHeartVoice) {
        // 跳转到心声提交页面
        navigate('/heart-voice-submit', {
          state: {
            questionnaireData: questionnaire,
            userType: userType || 'authenticated'
          }
        });
      } else {
        // 跳转到结果页面
        navigate('/results', {
          state: {
            questionnaireData: questionnaire,
            submissionType: 'authenticated'
          }
        });
      }
    } catch (error) {
      console.error('问卷提交失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染用户状态信息
  const renderUserStatus = () => (
    <Card className={styles.statusCard}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className={styles.statusHeader}>
          <UserOutlined />
          <Text strong>当前状态</Text>
        </div>
        
        {isDetecting ? (
          <div className={styles.detecting}>
            <Spin size="small" />
            <Text>检测登录状态中...</Text>
          </div>
        ) : (
          <div className={styles.statusInfo}>
            <Text>
              {isLoggedIn ? (
                <span className={styles.loggedIn}>
                  已登录 ({userType === 'semi_anonymous' ? '半匿名用户' : '注册用户'})
                </span>
              ) : (
                <span className={styles.anonymous}>匿名状态</span>
              )}
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );

  // 渲染提交选项
  const renderSubmitOptions = () => {
    // 检查用户是否已登录（包括半匿名登录）
    const userIsLoggedIn = isAuthenticated || isLoggedIn || currentUser;

    if (userIsLoggedIn) {
      // 已登录用户直接提交
      return (
        <Card className={styles.optionsCard}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className={styles.optionHeader}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Title level={4}>准备提交问卷</Title>
            </div>

            <Paragraph>
              您已登录（{currentUser?.userType === 'semi-anonymous' ? '半匿名身份' : '已认证身份'}），可以直接提交问卷并生成个性化心声内容。
            </Paragraph>

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleAuthenticatedSubmit}
              block
            >
              提交问卷并生成心声
            </Button>
          </Space>
        </Card>
      );
    }

    // 未登录用户选择提交方式
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className={styles.optionCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.optionHeader}>
                <SendOutlined style={{ color: '#1890ff' }} />
                <Title level={4}>匿名提交</Title>
              </div>
              
              <Paragraph>
                快速提交问卷，无需注册。您可以生成匿名心声内容，但无法保存个人数据。
              </Paragraph>

              <ul className={styles.featureList}>
                <li>✓ 快速提交</li>
                <li>✓ 生成心声内容</li>
                <li>✗ 无法保存数据</li>
                <li>✗ 无法查看历史</li>
              </ul>

              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={submitting && submitChoice === 'anonymous'}
                onClick={handleAnonymousSubmit}
                block
              >
                匿名提交
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className={styles.optionCard}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.optionHeader}>
                <LoginOutlined style={{ color: '#52c41a' }} />
                <Title level={4}>登录后提交</Title>
              </div>
              
              <Paragraph>
                注册或登录后提交，享受完整功能。可以保存数据、查看历史、管理心声内容。
              </Paragraph>

              <ul className={styles.featureList}>
                <li>✓ 保存问卷数据</li>
                <li>✓ 生成个性化心声</li>
                <li>✓ 查看历史记录</li>
                <li>✓ 管理心声内容</li>
              </ul>

              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                loading={submitting && submitChoice === 'login'}
                onClick={handleLoginSubmit}
                block
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                登录后提交
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    );
  };

  if (!questionnaire) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 完成提示 */}
        <Card className={styles.completionCard}>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={2}>问卷填写完成！</Title>
            <Paragraph>
              感谢您完成问卷填写。请选择提交方式，之后您可以生成个性化的心声内容。
            </Paragraph>
          </Space>
        </Card>

        {/* 用户状态 */}
        {renderUserStatus()}

        {/* 提交选项 */}
        {renderSubmitOptions()}

        {/* 提示信息 */}
        <Alert
          type="info"
          message="关于心声生成"
          description="提交问卷后，系统将根据您的回答生成个性化的心声内容，您可以编辑并分享到心声墙。"
          showIcon
        />
      </Space>
    </div>
  );
};

export default QuestionnaireCompletion;

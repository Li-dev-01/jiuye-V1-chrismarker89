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
  GoogleOutlined,
  SafetyOutlined,
  KeyOutlined,
  SendOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../stores/universalAuthStore';
import { useQuestionnaireCompletion } from '../hooks/useQuestionnaireCompletion';
import { universalQuestionnaireService } from '../services/universalQuestionnaireService';
import { questionnaireAuthService } from '../services/questionnaireAuthService';
import GoogleOAuthSecurityPrompt from '../components/auth/GoogleOAuthSecurityPrompt';
import DigitVerification from '../components/auth/DigitVerification';
import ABCredentialsDisplay from '../components/auth/ABCredentialsDisplay';
import { googleOAuthService } from '../services/googleOAuthService';
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

  // 新增状态
  const [showGoogleSecurityPrompt, setShowGoogleSecurityPrompt] = useState(false);
  const [showDigitVerification, setShowDigitVerification] = useState(false);
  const [showABCredentials, setShowABCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    identityA: string;
    identityB: string;
  } | null>(null);


  // 从路由状态或sessionStorage获取问卷数据
  const [questionnaire, setQuestionnaire] = useState(questionnaireData || location.state?.questionnaireData);

  useEffect(() => {
    // 检查sessionStorage中是否有待处理的问卷数据
    const pendingQuestionnaire = sessionStorage.getItem('pendingQuestionnaire');
    if (pendingQuestionnaire && !questionnaire) {
      try {
        const parsedData = JSON.parse(pendingQuestionnaire);
        setQuestionnaire(parsedData);

        // 根据提交方式自动触发相应的登录流程
        if (parsedData.submissionType === 'google-login') {
          console.log('自动触发Google登录流程');
          setTimeout(() => {
            setShowGoogleSecurityPrompt(true);
          }, 500);
        } else if (parsedData.submissionType === 'auto-login') {
          console.log('自动触发自动登录流程');
          setTimeout(() => {
            setShowDigitVerification(true);
          }, 500);
        }
      } catch (error) {
        console.error('解析问卷数据失败:', error);
      }
    }

    // 如果没有问卷数据，重定向到问卷页面
    if (!questionnaire && !pendingQuestionnaire) {
      message.warning('请先完成问卷填写');
      navigate('/questionnaire');
    }

    // 处理登录成功消息
    if (location.state?.loginSuccess && location.state?.message) {
      message.success(location.state.message);
      // 清理状态，避免重复显示
      window.history.replaceState({}, document.title);
    }
  }, [questionnaire, navigate, location.state]);

  // Google一键登录 - 直接跳转
  const handleGoogleLogin = () => {
    setShowGoogleSecurityPrompt(true);
  };

  // Google安全提示确认
  const handleGoogleSecurityConfirm = async () => {
    setShowGoogleSecurityPrompt(false);

    try {
      // 保存问卷数据到sessionStorage，登录后继续
      sessionStorage.setItem('pendingQuestionnaire', JSON.stringify(questionnaire));

      // 启动Google OAuth登录
      await googleOAuthService.signIn('questionnaire');
    } catch (error) {
      console.error('Google登录失败:', error);
      message.error('Google登录失败，请重试');
    }
  };

  // 自动登录 - 弹出数字验证
  const handleAutoLogin = () => {
    setShowDigitVerification(true);
  };

  // 数字验证成功
  const handleDigitVerificationSuccess = async (selectedDigit: number) => {
    setShowDigitVerification(false);
    setSubmitting(true);

    try {
      // 生成A值和B值
      const identityA = generateIdentityA(selectedDigit);
      const identityB = generateIdentityB(selectedDigit);

      setGeneratedCredentials({ identityA, identityB });

      // 保存问卷数据到sessionStorage
      sessionStorage.setItem('pendingQuestionnaire', JSON.stringify(questionnaire));

      // 使用生成的凭证进行认证
      const authResult = await questionnaireAuthService.authenticateWithAPI(identityA, identityB, true);

      if (authResult.success) {
        // 显示AB凭证供用户保存
        setShowABCredentials(true);
        message.success('账户创建成功！请保存您的登录凭证。');
      } else {
        throw new Error(authResult.message || '账户创建失败');
      }
    } catch (error) {
      console.error('自动登录失败:', error);
      message.error('账户创建失败，请重试');
      setSubmitting(false);
    }
  };

  // AB凭证确认，完成登录
  const handleABCredentialsConfirm = async () => {
    setShowABCredentials(false);
    setSubmitting(false);

    // 登录完成，跳转回问卷完成页面
    navigate('/questionnaire-completion', {
      state: {
        loginSuccess: true,
        message: '自动登录成功！现在可以提交问卷了。'
      }
    });
  };

  // 生成A值（11位数字，以选择的数字开头）
  const generateIdentityA = (firstDigit: number): string => {
    const timestamp = Date.now().toString().slice(-6); // 取时间戳后6位
    const random = Math.random().toString().slice(2, 6); // 4位随机数
    return `${firstDigit}${timestamp}${random}`;
  };

  // 生成B值（选择的数字重复6次）
  const generateIdentityB = (digit: number): string => {
    return digit.toString().repeat(6);
  };

  // 认证后提交问卷
  const submitQuestionnaireWithAuth = async () => {
    try {
      let questionnaireResponse;

      // 检查问卷数据格式
      if (questionnaire.responses) {
        // 来自问卷引擎的数据格式
        questionnaireResponse = {
          questionnaireId: questionnaire.questionnaireId || 'employment-survey-2024',
          sectionResponses: [{
            sectionId: 'questionnaire-responses',
            questionResponses: Object.entries(questionnaire.responses).map(([questionId, value]) => ({
              questionId,
              value,
              timestamp: Date.now()
            }))
          }],
          metadata: {
            submittedAt: Date.now(),
            completionTime: 0,
            userAgent: navigator.userAgent,
            version: '1.0',
            submissionType: questionnaire.submissionType || 'authenticated',
            userId: currentUser?.id
          }
        };
      } else {
        // 原有的数据格式
        questionnaireResponse = {
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
      }

      await universalQuestionnaireService.submitQuestionnaire(questionnaireResponse);
      message.success('问卷提交成功！');

      // 清理sessionStorage中的待处理问卷
      sessionStorage.removeItem('pendingQuestionnaire');

      // 跳转到故事墙页面
      navigate('/stories', {
        state: {
          questionnaireData: questionnaire,
          submissionType: 'authenticated',
          fromQuestionnaire: true
        }
      });

      setSubmitting(false);
    } catch (error) {
      console.error('问卷提交失败:', error);
      message.error('问卷提交失败，请重试');
      setSubmitting(false);
    }
  };

  // 已登录用户直接提交
  const handleAuthenticatedSubmit = async () => {
    setSubmitting(true);

    try {
      let questionnaireResponse;

      // 检查问卷数据格式
      if (questionnaire.responses) {
        // 来自问卷引擎的数据格式
        questionnaireResponse = {
          questionnaireId: questionnaire.questionnaireId || 'employment-survey-2024',
          sectionResponses: [{
            sectionId: 'questionnaire-responses',
            questionResponses: Object.entries(questionnaire.responses).map(([questionId, value]) => ({
              questionId,
              value,
              timestamp: Date.now()
            }))
          }],
          metadata: {
            submittedAt: Date.now(),
            completionTime: 0,
            userAgent: navigator.userAgent,
            version: '1.0',
            submissionType: questionnaire.submissionType || 'authenticated',
            userId: currentUser?.id
          }
        };
      } else {
        // 原有的数据格式
        questionnaireResponse = {
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
      }

      // 调用通用问卷提交API
      await universalQuestionnaireService.submitQuestionnaire(questionnaireResponse);

      message.success('问卷提交成功！');

      // 清理sessionStorage中的待处理问卷
      sessionStorage.removeItem('pendingQuestionnaire');

      // 跳转到故事墙页面
      navigate('/stories', {
        state: {
          questionnaireData: questionnaire,
          submissionType: 'authenticated',
          fromQuestionnaire: true
        }
      });
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
              您已登录（{currentUser?.userType === 'semi-anonymous' ? '半匿名身份' : '已认证身份'}），可以直接提交问卷。
            </Paragraph>

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleAuthenticatedSubmit}
              block
            >
              提交问卷
            </Button>
          </Space>
        </Card>
      );
    }

    // 未登录用户选择提交方式
    return (
      <>
        <Alert
          message="安全提示"
          description="为了确保问卷数据的真实性和防止恶意提交，我们要求用户登录后提交问卷。请选择以下任一方式进行注册/登录："
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className={styles.optionCard}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className={styles.optionHeader}>
                  <GoogleOutlined style={{ color: '#4285f4' }} />
                  <Title level={4}>Google一键登录</Title>
                </div>

                <Paragraph>
                  使用Google账号快速登录，安全便捷。会获取您的邮箱地址用于身份验证。
                </Paragraph>

                <ul className={styles.featureList}>
                  <li>✓ 快速安全</li>
                  <li>✓ 无需注册</li>
                  <li>✓ 隐私保护</li>
                  <li>✓ 一键登录</li>
                </ul>

                <Button
                  type="primary"
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={handleGoogleLogin}
                  block
                  style={{ background: '#4285f4', borderColor: '#4285f4' }}
                >
                  Google一键登录
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card className={styles.optionCard}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className={styles.optionHeader}>
                  <KeyOutlined style={{ color: '#52c41a' }} />
                  <Title level={4}>自动登录</Title>
                </div>

                <Paragraph>
                  系统自动创建匿名账户，通过简单验证后即可登录提交。
                </Paragraph>

                <ul className={styles.featureList}>
                  <li>✓ 自动创建账户</li>
                  <li>✓ 完全匿名</li>
                  <li>✓ 防脚本验证</li>
                  <li>✓ 凭证下载</li>
                </ul>

                <Button
                  type="primary"
                  size="large"
                  icon={<SafetyOutlined />}
                  onClick={handleAutoLogin}
                  block
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  自动登录
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </>
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
              感谢您完成问卷填写。请选择提交方式。
            </Paragraph>
          </Space>
        </Card>

        {/* 用户状态 */}
        {renderUserStatus()}

        {/* 提交选项 */}
        {renderSubmitOptions()}
      </Space>

      {/* Google OAuth安全提示弹窗 */}
      <GoogleOAuthSecurityPrompt
        visible={showGoogleSecurityPrompt}
        onAgree={handleGoogleSecurityConfirm}
        onCancel={() => {
          setShowGoogleSecurityPrompt(false);
          setSubmitting(false);
        }}
      />

      {/* 数字验证弹窗 */}
      <DigitVerification
        visible={showDigitVerification}
        onSuccess={handleDigitVerificationSuccess}
        onCancel={() => {
          setShowDigitVerification(false);
          setSubmitting(false);
        }}
        title="防脚本验证"
        description="为了防止恶意提交，请选择正确的数字"
      />

      {/* AB凭证展示弹窗 */}
      {generatedCredentials && (
        <ABCredentialsDisplay
          visible={showABCredentials}
          identityA={generatedCredentials.identityA}
          identityB={generatedCredentials.identityB}
          onConfirm={handleABCredentialsConfirm}
          onCancel={() => {
            setShowABCredentials(false);
            setSubmitting(false);
          }}
        />
      )}
    </div>
  );
};

export default QuestionnaireCompletion;

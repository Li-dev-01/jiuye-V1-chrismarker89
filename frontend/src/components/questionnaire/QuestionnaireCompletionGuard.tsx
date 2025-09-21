/**
 * 问卷完成状态守卫组件
 * 在问卷最后一页检测用户登录状态并提供相应的操作选项
 */

import React from 'react';
import { Card, Button, Space, Typography, Alert, Spin, Modal, Divider } from 'antd';
import {
  UserOutlined,
  LoginOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuestionnaireCompletion, getUserStateDescription, getRecommendedActionDescription } from '../../hooks/useQuestionnaireCompletion';
import { useAuth } from '../../stores/universalAuthStore';
import styles from './QuestionnaireCompletionGuard.module.css';

const { Title, Text, Paragraph } = Typography;

interface QuestionnaireCompletionGuardProps {
  onContinue: () => void;
  onLogin: () => void;
  showCompletionActions?: boolean;
}

export const QuestionnaireCompletionGuard: React.FC<QuestionnaireCompletionGuardProps> = ({
  onContinue,
  onLogin,
  showCompletionActions = true
}) => {
  const { logout } = useAuth();
  const {
    isLoggedIn,
    userType,
    hasValidToken,
    detectionResult,
    isDetecting,
    recommendedAction,
    showLoginPrompt,
    detectUserState,
    proceedWithCurrentState,
    promptLogin
  } = useQuestionnaireCompletion();

  // 渲染用户状态卡片
  const renderUserStatusCard = () => (
    <Card 
      title={
        <Space>
          <UserOutlined />
          <span>当前登录状态</span>
        </Space>
      }
      className={styles.statusCard}
    >
      {isDetecting ? (
        <div className={styles.detecting}>
          <Spin size="small" />
          <Text style={{ marginLeft: 8 }}>正在检测登录状态...</Text>
        </div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className={styles.statusInfo}>
            <Text strong>状态：</Text>
            <Text className={isLoggedIn ? styles.loggedIn : styles.anonymous}>
              {getUserStateDescription(detectionResult)}
            </Text>
          </div>
          
          {isLoggedIn && (
            <div className={styles.tokenInfo}>
              <Text strong>Token状态：</Text>
              <Text className={hasValidToken ? styles.valid : styles.invalid}>
                {hasValidToken ? '有效' : '已过期'}
              </Text>
            </div>
          )}

          {detectionResult?.conflicts && detectionResult.conflicts.length > 0 && (
            <Alert
              type="warning"
              size="small"
              message="检测到状态异常"
              description={detectionResult.conflicts.map(c => c.message).join(', ')}
              showIcon
            />
          )}
        </Space>
      )}
    </Card>
  );

  // 渲染推荐操作卡片
  const renderRecommendationCard = () => {
    if (recommendedAction === 'none') return null;

    return (
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined />
            <span>建议操作</span>
          </Space>
        }
        className={styles.recommendationCard}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            {getRecommendedActionDescription(recommendedAction)}
          </Paragraph>
          
          <Space>
            {recommendedAction === 'login' && (
              <Button 
                type="primary" 
                icon={<LoginOutlined />}
                onClick={onLogin}
              >
                重新登录
              </Button>
            )}
            
            {recommendedAction === 'register' && (
              <Button 
                type="primary" 
                icon={<SafetyOutlined />}
                onClick={onLogin}
              >
                登录/注册
              </Button>
            )}
            
            <Button onClick={proceedWithCurrentState}>
              继续当前状态
            </Button>
          </Space>
        </Space>
      </Card>
    );
  };

  // 渲染完成操作按钮
  const renderCompletionActions = () => {
    if (!showCompletionActions) return null;

    return (
      <Card className={styles.actionsCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span style={{ marginLeft: 8 }}>问卷已完成</span>
          </Title>
          
          <Paragraph>
            感谢您完成问卷！您可以选择以下操作：
          </Paragraph>

          <Space wrap>
            <Button 
              type="primary" 
              size="large"
              onClick={onContinue}
            >
              查看结果
            </Button>
            
            {!isLoggedIn && (
              <Button 
                icon={<LoginOutlined />}
                onClick={promptLogin}
              >
                登录保存数据
              </Button>
            )}
            
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </Space>
        </Space>
      </Card>
    );
  };

  // 登录提示模态框
  const renderLoginPromptModal = () => (
    <Modal
      title="建议登录"
      open={showLoginPrompt}
      onCancel={proceedWithCurrentState}
      footer={[
        <Button key="skip" onClick={proceedWithCurrentState}>
          跳过
        </Button>,
        <Button key="login" type="primary" onClick={onLogin}>
          立即登录
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          type="info"
          message="登录后可以保存您的问卷数据"
          description="登录后您可以查看历史记录、发布心声、下载内容等更多功能。"
          showIcon
        />
        
        <Paragraph>
          <Text strong>登录的好处：</Text>
        </Paragraph>
        <ul>
          <li>保存问卷填写记录</li>
          <li>发布和管理心声内容</li>
          <li>下载个性化内容</li>
          <li>获得更好的用户体验</li>
        </ul>
      </Space>
    </Modal>
  );

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {renderUserStatusCard()}
        {renderRecommendationCard()}
        {renderCompletionActions()}
      </Space>
      
      {renderLoginPromptModal()}
    </div>
  );
};

export default QuestionnaireCompletionGuard;

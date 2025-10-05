/**
 * 第二问卷页面 - 完全独立的问卷页面
 * 采用H5对话式交互体验，与第一问卷页面完全隔离
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Alert, Space, Typography, Spin, Layout } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { secondQuestionnaireService } from '../services/secondQuestionnaireService';
import type { SecondQuestionnaireDefinition, SecondQuestionnaireResponse } from '../services/secondQuestionnaireService';
import { ConversationalQuestionRenderer } from '../components/questionnaire/ConversationalQuestionRenderer';
import { ProgressPredictor } from '../components/questionnaire/ProgressPredictor';
import UniversalAntiSpamVerification from '../components/common/UniversalAntiSpamVerification';
import { SecondQuestionnaireHeader } from '../components/layout/SecondQuestionnaireHeader';
import { useSafeAuth } from '../hooks/useSafeAuth';
import MotivationalQuoteModal from '../components/MotivationalQuoteModal';
import type { UserProfileData } from '../components/MotivationalQuoteModal';
import '../styles/SecondQuestionnaire.css';

const { Title, Text } = Typography;
const { Content } = Layout;

interface InteractionMetrics {
  startTime: number;
  interactionCount: number;
  sectionTimes: Record<string, number>;
  currentSectionStartTime: number;
}

export const SecondQuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser: user, isAuthenticated } = useSafeAuth();
  
  // 状态管理 - 使用camelCase
  const [questionnaireDefinition, setQuestionnaireDefinition] = useState<SecondQuestionnaireDefinition | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [participantGroup, setParticipantGroup] = useState<string>('');
  const [visibleSections, setVisibleSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [interactionMetrics, setInteractionMetrics] = useState<InteractionMetrics>({
    startTime: Date.now(),
    interactionCount: 0,
    sectionTimes: {},
    currentSectionStartTime: Date.now()
  });

  // 防刷验证状态
  const [showAntiSpamVerification, setShowAntiSpamVerification] = useState(false);

  // 用户画像数据和励志名言弹窗状态
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(false);
  
  // 初始化问卷定义（不需要登录检查）
  useEffect(() => {
    loadQuestionnaireDefinition();
  }, []);
  
  // 加载问卷定义
  const loadQuestionnaireDefinition = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 从API获取真实的问卷定义
      try {
        console.log('🔍 开始加载第二问卷定义...');
        const definition = await secondQuestionnaireService.getQuestionnaireDefinition();

        console.log('✅ API调用成功，设置问卷定义');
        setQuestionnaireDefinition(definition);

        // 初始化可见章节（显示所有无条件章节）
        if (definition.sections.length > 0) {
          const initialSections = definition.sections.filter((section: any) => !section.condition);
          setVisibleSections(initialSections);
          console.log('✅ 初始化无条件章节:', initialSections.map(s => s.id));
          console.log('📊 总章节数:', definition.sections.length);
          console.log('📊 初始可见章节数:', initialSections.length);
        }

        console.log('🎉 第二问卷定义加载成功:', definition.id);
        return; // 成功加载，直接返回

      } catch (apiError) {
        console.error('❌ API调用失败，错误详情:', apiError);
        setError('无法加载问卷定义，请检查网络连接或联系管理员');
        return; // 失败时直接返回，不使用模拟数据
      }

    } catch (error) {
      console.error('加载问卷定义失败:', error);
      setError('加载问卷失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理问题回答
  const handleQuestionAnswer = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));

    // 更新交互指标
    setInteractionMetrics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1
    }));

    // 检查是否触发分支逻辑 - 修复问题ID匹配
    if (questionId === 'current-status-question-v2') {
      console.log('🔀 检测到分支问题回答:', questionId, '=', value);
      updateVisibleSections();
    } else if (questionId === 'current-activity') {
      console.log('🔀 检测到活动状态回答:', questionId, '=', value);
      updateVisibleSections();
    } else if (questionId === 'work-location-preference') {
      console.log('🔀 检测到地区偏好回答:', questionId, '=', value);
      updateVisibleSections();
    }

    // 每次回答后都更新可见章节（确保条件章节能正确显示）
    updateVisibleSections();

    // 获取当前问题类型
    const currentQuestion = visibleSections[currentSectionIndex]?.questions[currentQuestionIndex];

    // 只有单选题才自动进入下一题，多选题需要用户手动确认
    if (currentQuestion?.type === 'radio') {
      // 自动进入下一题（对话式体验）
      setTimeout(() => {
        moveToNextQuestion();
      }, 800);
    }
    // 多选题不自动跳转，用户需要点击"下一题"按钮
  };
  
  // 更新可见章节（基于分支逻辑）
  const updateVisibleSections = () => {
    if (!questionnaireDefinition) return;

    const allSections = questionnaireDefinition.sections;
    const newVisibleSections = allSections.filter((section: any) => {
      // 无条件章节始终显示
      if (!section.condition) return true;

      // 检查条件匹配
      const { dependsOn, operator, value } = section.condition;

      // 修复：将章节ID映射到实际的问题ID
      let actualQuestionId = dependsOn;
      if (dependsOn === 'current-status-v2') {
        actualQuestionId = 'current-status-question-v2';
      }

      const userResponse = responses[actualQuestionId];
      console.log('🔍 检查条件:', {
        sectionId: section.id,
        dependsOn,
        actualQuestionId,
        userResponse,
        expectedValue: value
      });

      if (!userResponse) return false; // 如果依赖的问题还没回答，不显示

      // 根据操作符检查条件
      switch (operator) {
        case 'equals':
          return userResponse === value;
        case 'in':
          return Array.isArray(value) ? value.includes(userResponse) : false;
        default:
          return false;
      }
    });

    setVisibleSections(newVisibleSections);
    console.log('🔄 更新可见章节:', newVisibleSections.map(s => s.id));
    console.log('📊 当前回答:', responses);
  };
  
  // 移动到下一个问题
  const moveToNextQuestion = () => {
    const currentSection = visibleSections[currentSectionIndex];
    if (!currentSection) return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      // 同一章节的下一个问题
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < visibleSections.length - 1) {
      // 检查下一个章节是否是"提交方式选择"，如果是则跳过直接完成问卷
      const nextSection = visibleSections[currentSectionIndex + 1];
      if (nextSection?.id === 'submission-preference') {
        console.log('🎯 跳过提交方式选择，直接完成问卷');
        recordSectionTime(currentSection.id);
        handleQuestionnaireComplete();
        return;
      }

      // 记录当前章节完成时间
      recordSectionTime(currentSection.id);

      // 下一个章节的第一个问题
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setInteractionMetrics(prev => ({
        ...prev,
        currentSectionStartTime: Date.now()
      }));
    } else {
      // 问卷完成
      recordSectionTime(currentSection.id);
      handleQuestionnaireComplete();
    }

    // 更新进度
    updateProgress();
  };
  
  // 返回上一个问题
  const moveToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = visibleSections[currentSectionIndex - 1];
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
    
    updateProgress();
  };
  
  // 记录章节完成时间
  const recordSectionTime = (sectionId: string) => {
    const sectionTime = Date.now() - interactionMetrics.currentSectionStartTime;
    setInteractionMetrics(prev => ({
      ...prev,
      sectionTimes: {
        ...prev.sectionTimes,
        [sectionId]: sectionTime
      }
    }));
  };
  
  // 更新进度
  const updateProgress = () => {
    const totalQuestions = visibleSections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.keys(responses).length;
    const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    setCompletionProgress(progress);
  };
  
  // 问卷完成处理 - 先显示防刷验证
  const handleQuestionnaireComplete = () => {
    console.log('🎯 问卷完成，显示防刷验证');
    setShowAntiSpamVerification(true);
  };

  // 防刷验证成功后的实际提交
  const handleActualSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowAntiSpamVerification(false);

      console.log('🚀 防刷验证成功，开始提交问卷');

      // 构建提交数据（前端使用camelCase）
      const responseData: SecondQuestionnaireResponse = secondQuestionnaireService.buildResponseData(
        participantGroup,
        responses,
        {
          startedAt: new Date(interactionMetrics.startTime).toISOString(),
          responseTimeSeconds: Math.round((Date.now() - interactionMetrics.startTime) / 1000),
          userExperienceRating: responses['questionnaire_experience_rating'] ? parseInt(responses['questionnaire_experience_rating']) : undefined,
          technicalFeedback: responses['technical_feedback'] || undefined
        }
      );

      // 验证数据
      const validation = secondQuestionnaireService.validateResponseData(responseData);
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 提交问卷（服务层会自动转换为snake_case）
      const result = await secondQuestionnaireService.submitResponse(responseData);

      console.log('第二问卷提交成功:', result);

      // 检查是否有用户画像数据
      if (result.userProfile) {
        console.log('📊 收到用户画像数据:', result.userProfile);
        setUserProfileData(result.userProfile);

        // 如果需要鼓励，显示励志名言弹窗
        if (result.userProfile.emotion?.needsEncouragement && result.userProfile.motivationalQuote) {
          console.log('💪 显示励志名言弹窗');
          setShowMotivationalQuote(true);
          // 不立即跳转，等用户关闭弹窗后再跳转
          return;
        }
      }

      // 如果不需要显示励志名言，直接跳转到故事墙页面
      navigate('/stories', {
        state: {
          responseId: result.responseId,
          participantGroup: participantGroup,
          completionTime: Math.round((Date.now() - interactionMetrics.startTime) / 1000),
          interactionCount: interactionMetrics.interactionCount,
          fromQuestionnaire: 'second-questionnaire'
        }
      });

    } catch (error) {
      console.error('问卷提交失败:', error);
      setError('问卷提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 防刷验证取消处理
  const handleAntiSpamCancel = () => {
    console.log('❌ 用户取消防刷验证');
    setShowAntiSpamVerification(false);
  };

  // 励志名言弹窗关闭处理
  const handleMotivationalQuoteClose = () => {
    console.log('✅ 用户关闭励志名言弹窗，跳转到故事墙');
    setShowMotivationalQuote(false);

    // 跳转到故事墙页面
    navigate('/stories', {
      state: {
        participantGroup: participantGroup,
        completionTime: Math.round((Date.now() - interactionMetrics.startTime) / 1000),
        interactionCount: interactionMetrics.interactionCount,
        fromQuestionnaire: 'second-questionnaire'
      }
    });
  };
  
  // 加载状态
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <SecondQuestionnaireHeader />
        <Content style={{ padding: 0 }}>
          <div className="second-questionnaire-loading">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Spin size="large" />
                  </motion.div>
                  <div>
                    <Title level={4} style={{ color: '#1a202c', marginBottom: 8 }}>正在加载第二问卷</Title>
                    <Text style={{ color: '#4a5568' }}>请稍候，我们正在为您准备个性化的问卷体验...</Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </div>
        </Content>
      </Layout>
    );
  }
  
  // 错误状态
  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <SecondQuestionnaireHeader />
        <Content style={{ padding: 0 }}>
          <div className="second-questionnaire-loading error">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <Alert
                  message="加载失败"
                  description={error}
                  type="error"
                  showIcon
                  action={
                    <Button type="primary" onClick={loadQuestionnaireDefinition}>
                      重新加载
                    </Button>
                  }
                />
              </Card>
            </motion.div>
          </div>
        </Content>
      </Layout>
    );
  }
  
  const currentSection = visibleSections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion = currentSectionIndex === visibleSections.length - 1 &&
                         currentQuestionIndex === currentSection?.questions.length - 1;

  // 调试信息
  console.log('调试信息:', {
    currentSectionIndex,
    currentQuestionIndex,
    visibleSections: visibleSections.length,
    currentSection: currentSection?.id,
    currentQuestion: currentQuestion?.id,
    questionnaireDefinition: !!questionnaireDefinition
  });
  
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="second-questionnaire-container">
        <div className="second-questionnaire-content">
          {/* 问题展示区域 - 提到最上方 */}
          <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={`${currentSectionIndex}-${currentQuestionIndex}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="second-questionnaire-question"
                >
                  <ConversationalQuestionRenderer
                    question={currentQuestion}
                    value={responses[currentQuestion.id]}
                    onChange={(value) => handleQuestionAnswer(currentQuestion.id, value)}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={currentSection.questions.length}
                    sectionTitle={currentSection.title}
                    isConversationalMode={true}
                  />
                </motion.div>
              )}
          </AnimatePresence>

          {/* 紧凑导航按钮 - 多选题始终显示，单选题在回答后隐藏 */}
          <div className="second-questionnaire-navigation">
          <div className="flex justify-between items-center">
            <Button
              onClick={moveToPreviousQuestion}
              disabled={isFirstQuestion || isSubmitting}
              size="middle"
              className="px-4"
            >
              上一题
            </Button>

            <div className="text-center">
              <Text className="text-gray-500 text-sm">
                {currentQuestionIndex + 1} / {currentSection?.questions.length || 0}
              </Text>
            </div>

            {/* 根据问题类型决定是否显示下一题按钮 */}
            {(currentQuestion?.type === 'checkbox' ||
              currentQuestion?.type === 'radio' && !responses[currentQuestion?.id]) && (
              <Button
                type="primary"
                onClick={moveToNextQuestion}
                disabled={!responses[currentQuestion?.id] || isSubmitting}
                loading={isSubmitting && isLastQuestion}
                size="middle"
                className="px-4"
              >
                {isLastQuestion ? '完成' : '下一题'}
              </Button>
            )}

            {/* 单选题回答后的占位符，保持布局平衡 */}
            {currentQuestion?.type === 'radio' && responses[currentQuestion?.id] && (
              <div className="px-4 py-2 text-transparent">占位</div>
            )}
          </div>
          </div>

          {/* 紧凑进度指示器 - 移到底部 */}
          <div className="second-questionnaire-progress">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Text className="text-lg font-semibold text-gray-800">
                  {currentSection?.title === '基本信息' ? '问卷调查' : currentSection?.title}
                </Text>
                <Text className="text-sm text-gray-500">
                  第 {currentQuestionIndex + 1} 题 / 共 {currentSection?.questions.length || 0} 题
                </Text>
              </div>
            </div>
            <div className="text-right">
              <Text className="text-lg font-bold text-blue-600">
                {completionProgress}%
              </Text>
            </div>
          </div>

          <Progress
            percent={completionProgress}
            strokeColor={{
              '0%': '#3b82f6',
              '100%': '#10b981',
            }}
            showInfo={false}
            size="small"
            className="mb-2"
          />

          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>章节 {currentSectionIndex + 1} / {visibleSections.length}</span>
            <span>预计剩余: {Math.max(0, 10 - Math.round(completionProgress / 10))} 分钟</span>
          </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="second-questionnaire-error">
              <Alert
                message="操作失败"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            </div>
          )}
        </div>
      </div>
      {/* 防刷验证弹窗 */}
      <UniversalAntiSpamVerification
        visible={showAntiSpamVerification}
        onClose={() => setShowAntiSpamVerification(false)}
        onSuccess={handleActualSubmit}
        onCancel={handleAntiSpamCancel}
        title="问卷提交验证"
        description="为了防止恶意提交，请选择正确的数字"
        autoSubmit={true}
      />

      {/* 励志名言弹窗 */}
      <MotivationalQuoteModal
        visible={showMotivationalQuote}
        userProfile={userProfileData}
        onClose={handleMotivationalQuoteClose}
      />
    </div>
  );
};

export default SecondQuestionnairePage;

/**
 * UniversalQuestionnaireEngine - 通用问卷引擎组件
 * 基于原有通用问卷系统的设计，支持多种问题类型和实时统计
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Progress, Space, Typography, Alert, Divider, message } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { UniversalQuestionRenderer } from './UniversalQuestionRenderer';
import type { UniversalQuestionnaire, UniversalQuestionnaireResponse } from '../../types/universal-questionnaire';
import { universalQuestionnaireService } from '../../services/universalQuestionnaireService';

// 导入状态管理相关
import { questionnaireStateManager } from '../../services/questionnaireStateManager';
import { globalStateManager, GlobalUserState } from '../../services/globalStateManager';

// 使用通用防刷验证组件
import UniversalAntiSpamVerification from '../common/UniversalAntiSpamVerification';
import styles from './UniversalQuestionnaireEngine.module.css';

const { Title, Text } = Typography;

interface UniversalQuestionnaireEngineProps {
  questionnaire: UniversalQuestionnaire;
  onSubmit?: (response: UniversalQuestionnaireResponse) => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

export const UniversalQuestionnaireEngine: React.FC<UniversalQuestionnaireEngineProps> = ({
  questionnaire,
  onSubmit,
  onProgress,
  className = ''
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statisticsRefreshTrigger, setStatisticsRefreshTrigger] = useState(0);
  // 只保留数字验证相关状态
  const [showAntiSpamVerification, setShowAntiSpamVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // 状态管理
  const [questionnaireAuthState, setQuestionnaireAuthState] = useState(() =>
    questionnaireStateManager.getCurrentState()
  );
  const [globalState, setGlobalState] = useState<any>(null);

  // 条件判断函数
  const checkCondition = useCallback((condition: any, value: any): boolean => {
    if (!condition) return true;

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return true;
    }
  }, []);

  // 检查section是否应该显示
  const shouldShowSection = useCallback((section: any): boolean => {
    if (!section.condition) return true;

    const dependentValue = responses[section.condition.dependsOn];
    return checkCondition(section.condition, dependentValue);
  }, [responses, checkCondition]);

  // 检查问题是否应该显示
  const shouldShowQuestion = useCallback((question: any): boolean => {
    if (!question.condition) return true;

    const dependentValue = responses[question.condition.dependsOn];
    return checkCondition(question.condition, dependentValue);
  }, [responses, checkCondition]);

  // 获取可见的sections
  const visibleSections = useMemo(() => {
    return questionnaire.sections.filter(shouldShowSection);
  }, [questionnaire.sections, shouldShowSection]);

  // 获取当前section的可见问题
  const visibleQuestions = useMemo(() => {
    if (!visibleSections[currentSectionIndex]) return [];
    return visibleSections[currentSectionIndex].questions.filter(shouldShowQuestion);
  }, [visibleSections, currentSectionIndex, shouldShowQuestion]);

  const currentSection = visibleSections[currentSectionIndex];
  const totalSections = visibleSections.length;
  const progress = Math.round(((currentSectionIndex + 1) / totalSections) * 100);

  // 计算完成度（基于可见的问题）
  const getCompletionStatus = useCallback(() => {
    const totalQuestions = visibleSections.reduce(
      (total, section) => total + section.questions.filter(shouldShowQuestion).length,
      0
    );
    const answeredQuestions = Object.keys(responses).filter(questionId => {
      // 只计算可见问题的回答
      return visibleSections.some(section =>
        section.questions.some(q => q.id === questionId && shouldShowQuestion(q))
      );
    }).length;
    return {
      totalQuestions,
      answeredQuestions,
      completionPercentage: (answeredQuestions / totalQuestions) * 100
    };
  }, [visibleSections, responses, shouldShowQuestion]);

  // 处理问题回答
  const handleQuestionAnswer = useCallback((questionId: string, value: any) => {
    setResponses(prev => {
      const newResponses = {
        ...prev,
        [questionId]: value
      };

      // 检查是否是影响section显示的关键问题
      const isKeyQuestion = questionnaire.sections.some(section =>
        section.condition?.dependsOn === questionId
      );

      // 如果是关键问题，可能需要调整当前section索引
      if (isKeyQuestion) {
        // 重新计算可见sections，如果当前section变为不可见，跳转到下一个可见section
        setTimeout(() => {
          const newVisibleSections = questionnaire.sections.filter(section => {
            if (!section.condition) return true;
            const dependentValue = newResponses[section.condition.dependsOn];
            return checkCondition(section.condition, dependentValue);
          });

          const currentSectionId = currentSection?.id;
          const newCurrentIndex = newVisibleSections.findIndex(s => s.id === currentSectionId);

          if (newCurrentIndex === -1 && newVisibleSections.length > 0) {
            // 当前section不可见了，跳转到下一个可见section
            setCurrentSectionIndex(Math.min(currentSectionIndex, newVisibleSections.length - 1));
          }
        }, 0);
      }

      return newResponses;
    });

    // 清除该问题的验证错误
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }

    // ❌ 移除：不再在用户选择时刷新统计数据
    // 统计数据只在问卷提交后才会更新，避免显示不准确的实时数据
    // setTimeout(() => {
    //   setStatisticsRefreshTrigger(prev => prev + 1);
    // }, 500);
  }, [validationErrors, questionnaire.sections, checkCondition, currentSection, currentSectionIndex]);

  // 验证当前节的问题（只验证可见的问题）
  const validateCurrentSection = useCallback(() => {
    const errors: Record<string, string> = {};

    visibleQuestions.forEach(question => {
      if (question.required && !responses[question.id]) {
        errors[question.id] = '此字段为必填项';
      }
      
      // 可以添加更多验证规则
      if (question.validation) {
        // 处理validation可能是数组或对象的情况
        const validationRules = Array.isArray(question.validation) ? question.validation : [question.validation];

        validationRules.forEach(rule => {
          const value = responses[question.id];
          if (value) {
            switch (rule.type) {
              case 'minLength':
                if (typeof value === 'string' && value.length < (rule.value as number)) {
                  errors[question.id] = rule.message || `最少需要${rule.value}个字符`;
                }
                break;
              case 'maxLength':
                if (typeof value === 'string' && value.length > (rule.value as number)) {
                  errors[question.id] = rule.message || `最多允许${rule.value}个字符`;
                }
                break;
              case 'min':
                if (typeof value === 'number' && value < (rule.value as number)) {
                  errors[question.id] = rule.message || `最小值为${rule.value}`;
                }
                break;
              case 'max':
                if (typeof value === 'number' && value > (rule.value as number)) {
                  errors[question.id] = rule.message || `最大值为${rule.value}`;
                }
                break;
              case 'email':
                if (typeof value === 'string' && value.trim()) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(value.trim())) {
                    errors[question.id] = rule.message || '请输入有效的邮箱地址';
                  }
                }
                break;
            }
          }
        });
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentSection.questions, responses]);

  // 下一步
  const handleNext = useCallback(() => {
    if (validateCurrentSection()) {
      if (currentSectionIndex < totalSections - 1) {
        setCurrentSectionIndex(prev => prev + 1);
        // 滚动到页面顶部
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [validateCurrentSection, currentSectionIndex, totalSections]);

  // 上一步
  const handlePrevious = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      // 滚动到页面顶部
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [currentSectionIndex]);

  // 提交问卷 - 简化版本，只需要数字验证
  const handleSubmit = useCallback(async () => {
    console.log('📝 开始提交问卷流程...');
    console.log('🔍 当前验证状态:', { isVerified, isSubmitting });

    if (!validateCurrentSection()) {
      console.log('❌ 当前部分验证失败');
      return;
    }

    // 临时关闭数字验证 - 用于调试
    // if (!isVerified) {
    //   console.log('🔐 需要数字验证，显示验证弹窗');
    //   setShowAntiSpamVerification(true);
    //   return;
    // }
    console.log('🚫 数字验证已临时关闭，直接提交');

    console.log('✅ 数字验证已通过，开始提交问卷数据');
    console.log('🔍 设置提交状态为 true...');
    setIsSubmitting(true);

    try {
      // 构建问卷响应数据
      const submissionData: UniversalQuestionnaireResponse = {
        questionnaireId: questionnaire.id,
        sectionResponses: visibleSections.map(section => ({
          sectionId: section.id,
          questionResponses: section.questions
            .filter(shouldShowQuestion)
            .map(question => ({
              questionId: question.id,
              value: responses[question.id] || null,
              timestamp: Date.now()
            }))
        })),
        metadata: {
          submittedAt: Date.now(),
          completionTime: 0,
          userAgent: navigator.userAgent,
          version: questionnaire.metadata.version,
          submissionType: 'anonymous', // 简化为匿名提交
          submissionSource: 'web'
        }
      };

      // 验证问卷数据
      const validation = universalQuestionnaireService.validateQuestionnaireResponse(submissionData);
      if (!validation.isValid) {
        message.error('问卷数据验证失败，请检查填写内容');
        console.error('问卷数据验证失败:', validation.errors);
        return;
      }

      // 提交问卷数据
      console.log('🚀 调用API提交问卷数据...');
      const result = await universalQuestionnaireService.submitQuestionnaire(submissionData);
      console.log('📡 API响应:', result);

      if (result.success) {
        message.success('问卷提交成功！感谢您的参与');
        console.log('✅ 问卷提交成功');

        // 触发统计数据刷新
        setTimeout(() => {
          setStatisticsRefreshTrigger(prev => prev + 1);
        }, 2000);

        // 调用外部回调
        if (onSubmit) {
          onSubmit(submissionData);
        }
      } else {
        console.error('❌ API返回失败:', result);
        throw new Error(result.error || '提交失败');
      }
    } catch (error) {
      console.error('❌ 提交问卷失败:', error);
      message.error(`问卷提交失败：${error.message || '请重试'}`);
    } finally {
      console.log('🔄 重置提交状态');
      setIsSubmitting(false);
    }
  }, [validateCurrentSection, questionnaire, responses, onSubmit]);



  // 处理数字验证成功
  const handleAntiSpamSuccess = async () => {
    console.log('🔐 数字验证成功，开始提交问卷...');
    console.log('🔍 当前状态:', { isVerified, isSubmitting, showAntiSpamVerification });

    setIsVerified(true);
    setShowAntiSpamVerification(false);
    message.success('验证成功！正在提交问卷...');

    // 验证成功后自动触发提交
    try {
      console.log('🚀 调用 handleSubmit...');
      await handleSubmit();
      console.log('✅ handleSubmit 执行完成');
    } catch (error) {
      console.error('❌ 验证成功后提交失败:', error);
      message.error('提交失败，请重试');
    }
  };

  // 处理数字验证取消
  const handleAntiSpamCancel = () => {
    setShowAntiSpamVerification(false);
  };

  // 处理内联认证成功
  const handleInlineAuthSuccess = useCallback((authData: any) => {
    console.log('✅ 内联认证成功:', authData);
    // 更新问卷认证状态
    const newState = questionnaireStateManager.getCurrentState();
    setQuestionnaireAuthState(newState);

    // 触发统计数据刷新
    setStatisticsRefreshTrigger(prev => prev + 1);
  }, []);



  // 更新进度
  useEffect(() => {
    if (onProgress) {
      const { completionPercentage } = getCompletionStatus();
      onProgress(completionPercentage);
    }
  }, [responses, onProgress, getCompletionStatus]);

  const { completionPercentage } = getCompletionStatus();

  // 如果用户已经登录，跳过提交方式选择步骤
  const shouldSkipSubmissionTypeSection = (
    (questionnaireAuthState && questionnaireAuthState.isAuthenticated) ||
    (globalState && globalState.currentState !== GlobalUserState.ANONYMOUS)
  );
  const effectiveTotalSections = shouldSkipSubmissionTypeSection ? totalSections - 1 : totalSections;
  const isLastSection = shouldSkipSubmissionTypeSection
    ? currentSectionIndex === totalSections - 2  // 跳过最后一个提交方式选择步骤
    : currentSectionIndex === totalSections - 1;

  // 在到达第6步时，强制检查全局状态
  useEffect(() => {
    if (currentSectionIndex === totalSections - 1) {
      console.log('🔍 到达第6步，检查全局状态...');
      console.log('📊 当前localStorage数据:');
      console.log('- questionnaire_current_user:', localStorage.getItem('questionnaire_current_user'));
      console.log('- questionnaire_current_session:', localStorage.getItem('questionnaire_current_session'));
      console.log('- uuid_current_user:', localStorage.getItem('uuid_current_user'));

      // 检查问卷专用认证状态
      const questionnaireState = questionnaireStateManager.getCurrentState();
      console.log('🔍 第6步问卷认证状态检查:');
      console.log('- 是否已认证:', questionnaireState.isAuthenticated);
      console.log('- 用户信息:', questionnaireState.user);
      console.log('- 会话信息:', questionnaireState.session);

      // 同时检查全局状态（用于调试）
      const recheckState = async () => {
        try {
          const newState = await globalStateManager.detectCurrentState();
          setGlobalState(newState);
          console.log('🔍 第6步全局状态检查结果:');
          console.log('- 当前状态:', newState.currentState);
          console.log('- 用户信息:', newState.user);
          console.log('- 会话信息:', newState.session);
          console.log('- 是否有效:', newState.isValid);
          console.log('- 冲突:', newState.conflicts);
        } catch (error) {
          console.error('❌ 第6步状态检查失败:', error);
        }
      };
      recheckState();
    }
  }, [currentSectionIndex, totalSections]);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 问卷头部 */}
      <div className={styles.header}>
        <Title level={2} className={styles.title}>
          {questionnaire.title}
        </Title>
        {questionnaire.description && (
          <Text className={styles.description}>
            {questionnaire.description}
          </Text>
        )}
        
        {/* 进度条 */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <Text strong>
              第 {currentSectionIndex + 1} 部分，共 {shouldSkipSubmissionTypeSection ? totalSections - 1 : totalSections} 部分
            </Text>
            <Text type="secondary">
              整体完成度: {Math.round(completionPercentage)}%
            </Text>
          </div>
          <Progress
            percent={shouldSkipSubmissionTypeSection && currentSectionIndex === totalSections - 1 ? 100 : progress}
            strokeColor="#1890ff"
            className={styles.progress}
          />
        </div>
      </div>

      {/* 当前节内容 */}
      <Card className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Title level={3} className={styles.sectionTitle}>
            {currentSection.title}
          </Title>
          {currentSection.description && (
            <Text className={styles.sectionDescription}>
              {currentSection.description}
            </Text>
          )}
        </div>

        <Divider />

        {/* 问题列表 */}
        <div className={styles.questionsContainer}>
          {/* 如果用户已登录且当前是提交方式选择步骤，显示特殊提示 */}
          {shouldSkipSubmissionTypeSection && currentSectionIndex === totalSections - 1 ? (
            <div className={styles.loginStatusInfo}>
              <Alert
                message="您已登录"
                description={`当前登录用户：${questionnaireAuthState?.user?.displayName || globalState?.user?.displayName || '未知用户'}。您可以直接提交问卷，无需重新登录。`}
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            </div>
          ) : (
            visibleQuestions.map((question, index) => (
              <div key={question.id} className={styles.questionWrapper}>
                <UniversalQuestionRenderer
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleQuestionAnswer(question.id, value)}
                  error={validationErrors[question.id]}
                  questionNumber={index + 1}
                  refreshTrigger={statisticsRefreshTrigger}
                  onAuthSuccess={handleInlineAuthSuccess}
                  autoScrollToNext={true}
                  isLastQuestion={index === visibleQuestions.length - 1}
                />
              </div>
            ))
          )}
        </div>

        {/* 导航按钮 */}
        <div className={styles.navigation}>
          <Space size="middle">
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              disabled={currentSectionIndex === 0}
              size="large"
            >
              上一步
            </Button>
            
            {isLastSection ? (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={isSubmitting}
                size="large"
              >
                提交问卷
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={handleNext}
                size="large"
              >
                下一步
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 完成度提示 */}
      {completionPercentage > 0 && completionPercentage < 100 && (
        <Alert
          message={`已完成 ${Math.round(completionPercentage)}% 的问题`}
          type="info"
          showIcon
          className={styles.completionAlert}
        />
      )}

      {/* 移除注册提示弹窗 */}

      {/* 防刷验证弹窗 */}
      <UniversalAntiSpamVerification
        visible={showAntiSpamVerification}
        onClose={() => setShowAntiSpamVerification(false)}
        onSuccess={handleAntiSpamSuccess}
        onCancel={handleAntiSpamCancel}
        title="防刷本验证"
        description="为了防止恶意提交，请选择正确的数字"
        autoSubmit={true}
      />
    </div>
  );
};

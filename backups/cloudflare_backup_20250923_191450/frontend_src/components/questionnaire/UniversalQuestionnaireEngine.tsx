/**
 * UniversalQuestionnaireEngine - 通用问卷引擎组件
 * 基于原有通用问卷系统的设计，支持多种问题类型和实时统计
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Progress, Space, Typography, Alert, Divider } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { UniversalQuestionRenderer } from './UniversalQuestionRenderer';
import type { UniversalQuestionnaire, UniversalQuestionnaireResponse } from '../../types/universal-questionnaire';
import { universalQuestionnaireService } from '../../services/universalQuestionnaireService';

import { RegistrationPrompt } from './RegistrationPrompt';
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
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);


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

  // 提交问卷
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentSection()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 检查提交方式
      const submissionType = responses['submission-type'] || 'anonymous';
      const anonymousNickname = responses['anonymous-nickname'];

      // 处理快捷注册
      let userId = null;
      if (submissionType === 'quick-register' && anonymousNickname) {
        try {
          // 创建半匿名用户ID
          userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          // 可以在这里调用用户注册API，暂时使用本地生成的ID
          console.log('创建半匿名用户:', { userId, nickname: anonymousNickname });
        } catch (error) {
          console.warn('创建半匿名用户失败，将使用匿名提交:', error);
        }
      }

      const response: UniversalQuestionnaireResponse = {
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
          completionTime: 0, // 可以计算实际完成时间
          userAgent: navigator.userAgent,
          version: questionnaire.metadata.version,
          submissionType,
          userId,
          anonymousNickname: submissionType === 'quick-register' ? anonymousNickname : undefined
        }
      };

      // 准备问卷数据
      const questionnaireResponses = { ...responses };

      // 重新构建问卷响应（不包含心声数据）
      const cleanResponse: UniversalQuestionnaireResponse = {
        questionnaireId: questionnaire.id,
        sectionResponses: visibleSections.map(section => ({
          sectionId: section.id,
          questionResponses: section.questions
            .filter(shouldShowQuestion)

            .map(question => ({
              questionId: question.id,
              value: questionnaireResponses[question.id] || null,
              timestamp: Date.now()
            }))
        })),
        metadata: {
          submittedAt: Date.now(),
          completionTime: 0,
          userAgent: navigator.userAgent,
          version: questionnaire.metadata.version,
          submissionType,
          userId,
          anonymousNickname: submissionType === 'quick-register' ? anonymousNickname : undefined
        }
      };

      // 验证问卷数据
      const validation = universalQuestionnaireService.validateQuestionnaireResponse(cleanResponse);
      if (!validation.isValid) {
        console.error('问卷数据验证失败:', validation.errors);
        return;
      }

      // 提交问卷数据和心声数据
      try {
        // 1. 先提交问卷数据
        const questionnaireResult = await universalQuestionnaireService.submitQuestionnaire(cleanResponse);
        console.log('✅ 问卷数据已成功提交到服务器');

        // ✅ 问卷提交成功后，触发统计数据刷新
        // 延迟2秒刷新，给后端时间处理数据
        setTimeout(() => {
          setStatisticsRefreshTrigger(prev => prev + 1);
          console.log('📊 触发统计数据刷新 - 问卷提交成功');
        }, 2000);

      } catch (error) {
        console.warn('⚠️ 服务器暂时不可用，数据已保存到本地存储');
        // 保存到本地存储作为备份
        const localData = {
          ...response,
          localSubmittedAt: new Date().toISOString(),
          status: 'pending_upload'
        };
        localStorage.setItem(`questionnaire_${Date.now()}`, JSON.stringify(localData));
      }

      // 调用外部回调
      if (onSubmit) {
        await onSubmit(response);
      }
    } catch (error) {
      console.error('提交问卷失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentSection, questionnaire, responses, onSubmit]);



  // 处理注册提示
  const handleRegistrationPrompt = (action: string) => {
    if (action === 'quick-register') {
      // 触发快捷注册流程
      setResponses(prev => ({ ...prev, 'submission-type': 'quick-register' }));
      setShowRegistrationPrompt(false);
    } else if (action === 'skip') {
      setShowRegistrationPrompt(false);
    }
  };

  // 处理内联认证成功
  const handleInlineAuthSuccess = (authType: 'quick-register' | 'semi-anonymous-login') => {
    // 更新提交方式
    setResponses(prev => ({
      ...prev,
      'submission-type': authType === 'quick-register' ? 'quick-register' : 'login-submit'
    }));
  };



  // 更新进度
  useEffect(() => {
    if (onProgress) {
      const { completionPercentage } = getCompletionStatus();
      onProgress(completionPercentage);
    }
  }, [responses, onProgress, getCompletionStatus]);

  const { completionPercentage } = getCompletionStatus();
  const isLastSection = currentSectionIndex === totalSections - 1;

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
              第 {currentSectionIndex + 1} 部分，共 {totalSections} 部分
            </Text>
            <Text type="secondary">
              整体完成度: {Math.round(completionPercentage)}%
            </Text>
          </div>
          <Progress 
            percent={progress} 
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
          {visibleQuestions.map((question, index) => (
            <div key={question.id} className={styles.questionWrapper}>
              <UniversalQuestionRenderer
                question={question}
                value={responses[question.id]}
                onChange={(value) => handleQuestionAnswer(question.id, value)}
                error={validationErrors[question.id]}
                questionNumber={index + 1}
                refreshTrigger={statisticsRefreshTrigger}
                onAuthSuccess={handleInlineAuthSuccess}

              />
            </div>
          ))}
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

      {/* 注册提示弹窗 */}
      <RegistrationPrompt
        visible={showRegistrationPrompt}
        onClose={() => setShowRegistrationPrompt(false)}
        onQuickRegister={() => handleRegistrationPrompt('quick-register')}
        onSkip={() => handleRegistrationPrompt('skip')}

      />
    </div>
  );
};

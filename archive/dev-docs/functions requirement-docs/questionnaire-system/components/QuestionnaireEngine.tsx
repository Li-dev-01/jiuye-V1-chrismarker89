/**
 * 问卷引擎主组件
 * 
 * 功能特性：
 * - 问卷状态管理
 * - 节导航控制
 * - 数据验证和提交
 * - 进度跟踪
 * - 本地存储和恢复
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

import { QuestionRenderer } from './QuestionRenderer';
import { ProgressTracker } from './ProgressTracker';
import { StatisticsPanel } from './StatisticsPanel';
import { SubmissionHandler } from './SubmissionHandler';
import { ValidationDisplay } from './ValidationDisplay';

import { useQuestionnaire } from '../hooks/useQuestionnaire';
import { useQuestionValidation } from '../hooks/useQuestionValidation';
import { useStatistics } from '../hooks/useStatistics';
import { useProgress } from '../hooks/useProgress';
import { useLocalStorage } from '../hooks/useLocalStorage';

import {
  Questionnaire,
  QuestionnaireConfig,
  QuestionnaireResponse,
  SubmissionResult,
  ProgressInfo,
  ValidationError
} from '../types/questionnaire.types';

interface QuestionnaireEngineProps {
  questionnaire: Questionnaire;
  config?: Partial<QuestionnaireConfig>;
  initialData?: Partial<QuestionnaireResponse>;
  onSubmit?: (data: QuestionnaireResponse) => Promise<SubmissionResult>;
  onProgress?: (progress: ProgressInfo) => void;
  onSectionChange?: (sectionId: string, sectionIndex: number) => void;
  onValidationError?: (errors: ValidationError[]) => void;
  onAutoSave?: (data: Partial<QuestionnaireResponse>) => void;
  className?: string;
}

export const QuestionnaireEngine: React.FC<QuestionnaireEngineProps> = ({
  questionnaire,
  config = {},
  initialData,
  onSubmit,
  onProgress,
  onSectionChange,
  onValidationError,
  onAutoSave,
  className = ''
}) => {
  // 合并默认配置
  const defaultConfig: QuestionnaireConfig = {
    title: questionnaire.title,
    description: questionnaire.description,
    allowAnonymous: true,
    requireEmail: false,
    allowBackward: true,
    showProgress: true,
    autoSave: true,
    autoSaveInterval: 30000,
    validateOnChange: true,
    validateOnBlur: true,
    showValidationSummary: true,
    stopOnFirstError: false,
    showStatistics: true,
    statisticsPosition: 'right',
    updateStatisticsRealtime: true,
    statisticsUpdateInterval: 5000,
    theme: 'default',
    enableLazyLoading: true,
    preloadNextSection: true,
    cacheStatistics: true,
    cacheTimeout: 300000,
    enableCSRFProtection: true,
    enableRateLimit: true,
    locale: 'zh-CN'
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 状态管理
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);

  // 自定义Hooks
  const {
    responses,
    updateResponse,
    clearResponses,
    getResponseData,
    isComplete,
    hasUnsavedChanges
  } = useQuestionnaire(questionnaire, initialData);

  const {
    validateSection,
    validateQuestion,
    getValidationErrors,
    clearValidationErrors
  } = useQuestionValidation(questionnaire);

  const {
    statistics,
    updateStatistics,
    isLoadingStats
  } = useStatistics(questionnaire, finalConfig);

  const {
    progress,
    updateProgress,
    estimatedTimeRemaining
  } = useProgress(questionnaire, responses);

  const {
    saveToStorage,
    loadFromStorage,
    clearStorage
  } = useLocalStorage(`questionnaire_${questionnaire.id}`);

  // 引用
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Toast通知
  const { toast } = useToast();

  // 当前节和问题
  const currentSection = questionnaire.sections[currentSectionIndex];
  const totalSections = questionnaire.sections.length;
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === totalSections - 1;

  // 处理问题回答
  const handleQuestionAnswer = useCallback((questionId: string, value: any) => {
    updateResponse(questionId, value);

    // 实时验证
    if (finalConfig.validateOnChange) {
      validateQuestion(questionId, value);
    }

    // 触发回调
    finalConfig.onQuestionAnswer?.(questionId, value);

    // 更新统计数据
    if (finalConfig.updateStatisticsRealtime) {
      updateStatistics(questionId, value);
    }
  }, [updateResponse, validateQuestion, updateStatistics, finalConfig]);

  // 处理问题失焦
  const handleQuestionBlur = useCallback((questionId: string, value: any) => {
    if (finalConfig.validateOnBlur) {
      validateQuestion(questionId, value);
    }
  }, [validateQuestion, finalConfig]);

  // 节导航
  const handleNextSection = useCallback(async () => {
    // 验证当前节
    const validationResult = await validateSection(currentSection.id);
    
    if (!validationResult.isValid) {
      if (finalConfig.stopOnFirstError) {
        setShowValidationSummary(true);
        onValidationError?.(validationResult.errors);
        return;
      }
    }

    if (currentSectionIndex < totalSections - 1) {
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 触发回调
      const nextSection = questionnaire.sections[nextIndex];
      onSectionChange?.(nextSection.id, nextIndex);
      finalConfig.onSectionChange?.(nextSection.id, progress.percentage);
      
      // 预加载下一节
      if (finalConfig.preloadNextSection && nextIndex < totalSections - 1) {
        // 预加载逻辑
      }
    }
  }, [currentSectionIndex, totalSections, validateSection, currentSection.id, onSectionChange, finalConfig, progress.percentage, questionnaire.sections]);

  const handlePreviousSection = useCallback(() => {
    if (finalConfig.allowBackward && currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIndex);
      
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 触发回调
      const prevSection = questionnaire.sections[prevIndex];
      onSectionChange?.(prevSection.id, prevIndex);
      finalConfig.onSectionChange?.(prevSection.id, progress.percentage);
    }
  }, [finalConfig.allowBackward, currentSectionIndex, onSectionChange, finalConfig, progress.percentage, questionnaire.sections]);

  // 自动保存
  const performAutoSave = useCallback(async () => {
    if (!finalConfig.autoSave || !hasUnsavedChanges) return;

    try {
      const responseData = getResponseData();
      await saveToStorage(responseData);
      setLastAutoSave(Date.now());
      
      onAutoSave?.(responseData);
      
      console.log('自动保存成功');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, [finalConfig.autoSave, hasUnsavedChanges, getResponseData, saveToStorage, onAutoSave]);

  // 手动保存
  const handleManualSave = useCallback(async () => {
    try {
      await performAutoSave();
      
      toast({
        title: '保存成功',
        description: '您的答案已保存',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: '保存失败',
        description: '无法保存您的答案，请重试',
        variant: 'destructive'
      });
    }
  }, [performAutoSave, toast]);

  // 提交问卷
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // 验证所有节
      const allValidationResults = await Promise.all(
        questionnaire.sections.map(section => validateSection(section.id))
      );

      const allErrors = allValidationResults.flatMap(result => result.errors);
      
      if (allErrors.length > 0) {
        setShowValidationSummary(true);
        onValidationError?.(allErrors);
        
        toast({
          title: '提交失败',
          description: `发现 ${allErrors.length} 个验证错误，请检查并修正`,
          variant: 'destructive'
        });
        
        return;
      }

      // 准备提交数据
      const responseData = getResponseData();
      
      // 调用提交处理器
      if (onSubmit) {
        const result = await onSubmit(responseData);
        
        if (result.success) {
          // 清除本地存储
          await clearStorage();
          
          toast({
            title: '提交成功',
            description: '感谢您的参与！',
            duration: 3000
          });
          
          finalConfig.onSubmitSuccess?.(result);
        } else {
          throw new Error(result.message || '提交失败');
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
      
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
      
      finalConfig.onSubmitError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [questionnaire.sections, validateSection, onValidationError, getResponseData, onSubmit, clearStorage, toast, finalConfig]);

  // 设置自动保存定时器
  useEffect(() => {
    if (finalConfig.autoSave && finalConfig.autoSaveInterval) {
      autoSaveTimer.current = setInterval(performAutoSave, finalConfig.autoSaveInterval);
      
      return () => {
        if (autoSaveTimer.current) {
          clearInterval(autoSaveTimer.current);
        }
      };
    }
  }, [finalConfig.autoSave, finalConfig.autoSaveInterval, performAutoSave]);

  // 加载保存的数据
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await loadFromStorage();
        if (savedData) {
          // 恢复数据逻辑
          console.log('已恢复保存的数据');
        }
      } catch (error) {
        console.error('加载保存数据失败:', error);
      }
    };

    loadSavedData();
  }, [loadFromStorage]);

  // 更新进度
  useEffect(() => {
    updateProgress(currentSectionIndex, responses);
    onProgress?.(progress);
  }, [currentSectionIndex, responses, updateProgress, onProgress, progress]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '您有未保存的更改，确定要离开吗？';
        performAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, performAutoSave]);

  return (
    <div className={`questionnaire-engine ${className}`}>
      {/* 头部信息 */}
      <div className="questionnaire-header mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{finalConfig.title}</h1>
                {finalConfig.description && (
                  <p className="text-muted-foreground mt-2">{finalConfig.description}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {finalConfig.autoSave && lastAutoSave > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Save className="h-4 w-4 mr-1" />
                    已保存
                  </div>
                )}
                
                {estimatedTimeRemaining && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    约 {estimatedTimeRemaining} 分钟
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 进度跟踪 */}
      {finalConfig.showProgress && (
        <ProgressTracker
          progress={progress}
          sections={questionnaire.sections}
          currentSectionIndex={currentSectionIndex}
          onSectionClick={(index) => {
            if (finalConfig.allowBackward || index <= currentSectionIndex) {
              setCurrentSectionIndex(index);
            }
          }}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主内容区域 */}
        <div className={`${finalConfig.showStatistics && finalConfig.statisticsPosition === 'right' ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentSection.title}</span>
                <span className="text-sm text-muted-foreground">
                  {currentSectionIndex + 1} / {totalSections}
                </span>
              </CardTitle>
              {currentSection.description && (
                <p className="text-muted-foreground">{currentSection.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              {/* 问题渲染 */}
              <div className="space-y-6">
                {currentSection.questions.map((question, index) => (
                  <QuestionRenderer
                    key={question.id}
                    question={question}
                    value={responses[question.id]}
                    onChange={(value) => handleQuestionAnswer(question.id, value)}
                    onBlur={(value) => handleQuestionBlur(question.id, value)}
                    error={getValidationErrors(question.id)[0]?.message}
                    showStatistics={finalConfig.showStatistics && finalConfig.statisticsPosition !== 'right'}
                    statistics={statistics[question.id]}
                    theme={finalConfig.theme}
                  />
                ))}
              </div>

              {/* 导航按钮 */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousSection}
                  disabled={isFirstSection || !finalConfig.allowBackward}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>上一步</span>
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>保存</span>
                  </Button>

                  {isLastSection ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isComplete}
                      className="flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>提交中...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>提交问卷</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextSection}
                      className="flex items-center space-x-2"
                    >
                      <span>下一步</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 统计面板 */}
        {finalConfig.showStatistics && finalConfig.statisticsPosition === 'right' && (
          <div className="lg:col-span-1">
            <StatisticsPanel
              statistics={statistics}
              currentSection={currentSection}
              isLoading={isLoadingStats}
              config={finalConfig}
            />
          </div>
        )}
      </div>

      {/* 验证错误摘要 */}
      {showValidationSummary && (
        <ValidationDisplay
          errors={getValidationErrors()}
          onClose={() => setShowValidationSummary(false)}
          onNavigateToError={(questionId) => {
            // 导航到错误问题的逻辑
          }}
        />
      )}

      {/* 提交处理器 */}
      <SubmissionHandler
        questionnaire={questionnaire}
        responses={responses}
        config={finalConfig}
        onSubmit={onSubmit}
      />
    </div>
  );
};

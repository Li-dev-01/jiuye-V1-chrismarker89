/**
 * 问卷管理自定义Hook
 * 
 * 功能特性：
 * - 问卷状态管理
 * - 响应数据管理
 * - 数据验证和提交
 * - 本地存储和恢复
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Questionnaire,
  QuestionnaireResponse,
  SectionResponse,
  QuestionResponse,
  ResponseMetadata
} from '../types/questionnaire.types';

interface UseQuestionnaireOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableLocalStorage?: boolean;
  storageKey?: string;
  onResponseChange?: (questionId: string, value: any) => void;
  onSectionComplete?: (sectionId: string) => void;
  onQuestionnaireComplete?: () => void;
}

interface UseQuestionnaireReturn {
  // 响应数据
  responses: Record<string, any>;
  sectionResponses: Record<string, SectionResponse>;
  
  // 状态信息
  isComplete: boolean;
  hasUnsavedChanges: boolean;
  completedQuestions: number;
  totalQuestions: number;
  
  // 操作方法
  updateResponse: (questionId: string, value: any) => void;
  updateSectionResponse: (sectionId: string, response: Partial<SectionResponse>) => void;
  clearResponses: () => void;
  clearSectionResponses: (sectionId: string) => void;
  
  // 数据获取
  getResponseData: () => QuestionnaireResponse;
  getQuestionResponse: (questionId: string) => QuestionResponse | undefined;
  getSectionResponse: (sectionId: string) => SectionResponse | undefined;
  
  // 验证方法
  validateResponses: () => boolean;
  getCompletionStatus: () => {
    totalQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
    missingSections: string[];
    missingQuestions: string[];
  };
  
  // 存储方法
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}

export const useQuestionnaire = (
  questionnaire: Questionnaire,
  initialData?: Partial<QuestionnaireResponse>,
  options: UseQuestionnaireOptions = {}
): UseQuestionnaireReturn => {
  const {
    autoSave = true,
    autoSaveInterval = 30000,
    enableLocalStorage = true,
    storageKey = `questionnaire_${questionnaire.id}`,
    onResponseChange,
    onSectionComplete,
    onQuestionnaireComplete
  } = options;

  // 状态管理
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [sectionResponses, setSectionResponses] = useState<Record<string, SectionResponse>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  // 引用
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const responseMetadata = useRef<ResponseMetadata>({
    responseId: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isAnonymous: questionnaire.config.allowAnonymous,
    startedAt: Date.now(),
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    submissionInfo: {
      ipAddress: 'unknown', // 需要从服务器获取
      referrer: document.referrer
    }
  });

  // 计算总问题数
  const totalQuestions = questionnaire.sections.reduce(
    (total, section) => total + section.questions.length,
    0
  );

  // 计算已完成问题数
  const completedQuestions = Object.keys(responses).filter(
    questionId => responses[questionId] !== undefined && responses[questionId] !== ''
  ).length;

  // 计算是否完成
  const isComplete = questionnaire.sections.every(section =>
    section.questions.every(question => {
      if (!question.required) return true;
      const value = responses[question.id];
      return value !== undefined && value !== '' && value !== null;
    })
  );

  // 更新问题响应
  const updateResponse = useCallback((questionId: string, value: any) => {
    const timestamp = Date.now();
    
    setResponses(prev => {
      const newResponses = { ...prev, [questionId]: value };
      
      // 创建问题响应记录
      const questionResponse: QuestionResponse = {
        questionId,
        value,
        answeredAt: timestamp,
        metadata: {
          userAgent: navigator.userAgent,
          sessionId: responseMetadata.current.responseId
        }
      };

      // 找到问题所属的节
      const section = questionnaire.sections.find(s =>
        s.questions.some(q => q.id === questionId)
      );

      if (section) {
        setSectionResponses(prevSections => {
          const existingSection = prevSections[section.id] || {
            sectionId: section.id,
            questionResponses: [],
            timeSpent: 0
          };

          // 更新或添加问题响应
          const updatedQuestionResponses = existingSection.questionResponses.filter(
            qr => qr.questionId !== questionId
          );
          updatedQuestionResponses.push(questionResponse);

          return {
            ...prevSections,
            [section.id]: {
              ...existingSection,
              questionResponses: updatedQuestionResponses
            }
          };
        });
      }

      return newResponses;
    });

    setHasUnsavedChanges(true);
    onResponseChange?.(questionId, value);

    console.log(`问题 ${questionId} 已更新:`, value);
  }, [questionnaire.sections, onResponseChange]);

  // 更新节响应
  const updateSectionResponse = useCallback((sectionId: string, response: Partial<SectionResponse>) => {
    setSectionResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        ...response
      }
    }));

    setHasUnsavedChanges(true);
  }, []);

  // 清除所有响应
  const clearResponses = useCallback(() => {
    setResponses({});
    setSectionResponses({});
    setHasUnsavedChanges(false);
    
    console.log('所有响应已清除');
  }, []);

  // 清除节响应
  const clearSectionResponses = useCallback((sectionId: string) => {
    // 清除该节的所有问题响应
    const section = questionnaire.sections.find(s => s.id === sectionId);
    if (section) {
      setResponses(prev => {
        const newResponses = { ...prev };
        section.questions.forEach(question => {
          delete newResponses[question.id];
        });
        return newResponses;
      });
    }

    // 清除节响应
    setSectionResponses(prev => {
      const newSectionResponses = { ...prev };
      delete newSectionResponses[sectionId];
      return newSectionResponses;
    });

    setHasUnsavedChanges(true);
    console.log(`节 ${sectionId} 的响应已清除`);
  }, [questionnaire.sections]);

  // 获取完整响应数据
  const getResponseData = useCallback((): QuestionnaireResponse => {
    return {
      questionnaireId: questionnaire.id,
      sectionResponses: Object.values(sectionResponses),
      metadata: {
        ...responseMetadata.current,
        completedAt: isComplete ? Date.now() : undefined,
        totalTimeSpent: Date.now() - responseMetadata.current.startedAt
      }
    };
  }, [questionnaire.id, sectionResponses, isComplete]);

  // 获取问题响应
  const getQuestionResponse = useCallback((questionId: string): QuestionResponse | undefined => {
    for (const sectionResponse of Object.values(sectionResponses)) {
      const questionResponse = sectionResponse.questionResponses.find(
        qr => qr.questionId === questionId
      );
      if (questionResponse) {
        return questionResponse;
      }
    }
    return undefined;
  }, [sectionResponses]);

  // 获取节响应
  const getSectionResponse = useCallback((sectionId: string): SectionResponse | undefined => {
    return sectionResponses[sectionId];
  }, [sectionResponses]);

  // 验证响应
  const validateResponses = useCallback((): boolean => {
    return questionnaire.sections.every(section =>
      section.questions.every(question => {
        if (!question.required) return true;
        
        const value = responses[question.id];
        
        // 基础必填验证
        if (value === undefined || value === '' || value === null) {
          return false;
        }

        // 数组类型验证（多选题）
        if (Array.isArray(value) && value.length === 0) {
          return false;
        }

        return true;
      })
    );
  }, [questionnaire.sections, responses]);

  // 获取完成状态
  const getCompletionStatus = useCallback(() => {
    const answeredQuestions = Object.keys(responses).filter(
      questionId => {
        const value = responses[questionId];
        return value !== undefined && value !== '' && value !== null;
      }
    ).length;

    const missingSections: string[] = [];
    const missingQuestions: string[] = [];

    questionnaire.sections.forEach(section => {
      let sectionComplete = true;
      
      section.questions.forEach(question => {
        if (question.required) {
          const value = responses[question.id];
          if (value === undefined || value === '' || value === null) {
            missingQuestions.push(question.id);
            sectionComplete = false;
          }
        }
      });

      if (!sectionComplete) {
        missingSections.push(section.id);
      }
    });

    return {
      totalQuestions,
      answeredQuestions,
      completionPercentage: Math.round((answeredQuestions / totalQuestions) * 100),
      missingSections,
      missingQuestions
    };
  }, [questionnaire.sections, responses, totalQuestions]);

  // 保存到本地存储
  const saveToStorage = useCallback(async () => {
    if (!enableLocalStorage) return;

    try {
      const data = {
        responses,
        sectionResponses,
        metadata: responseMetadata.current,
        savedAt: Date.now()
      };

      localStorage.setItem(storageKey, JSON.stringify(data));
      setLastSaveTime(Date.now());
      setHasUnsavedChanges(false);
      
      console.log('数据已保存到本地存储');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
      throw error;
    }
  }, [enableLocalStorage, storageKey, responses, sectionResponses]);

  // 从本地存储加载
  const loadFromStorage = useCallback(async () => {
    if (!enableLocalStorage) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return;

      const data = JSON.parse(savedData);
      
      if (data.responses) {
        setResponses(data.responses);
      }
      
      if (data.sectionResponses) {
        setSectionResponses(data.sectionResponses);
      }
      
      if (data.metadata) {
        responseMetadata.current = {
          ...responseMetadata.current,
          ...data.metadata
        };
      }

      setHasUnsavedChanges(false);
      console.log('数据已从本地存储加载');
    } catch (error) {
      console.error('从本地存储加载失败:', error);
      throw error;
    }
  }, [enableLocalStorage, storageKey]);

  // 清除本地存储
  const clearStorage = useCallback(async () => {
    if (!enableLocalStorage) return;

    try {
      localStorage.removeItem(storageKey);
      console.log('本地存储已清除');
    } catch (error) {
      console.error('清除本地存储失败:', error);
      throw error;
    }
  }, [enableLocalStorage, storageKey]);

  // 自动保存
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && autoSaveInterval > 0) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        saveToStorage();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimer.current) {
          clearTimeout(autoSaveTimer.current);
        }
      };
    }
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, saveToStorage]);

  // 初始化数据
  useEffect(() => {
    if (initialData) {
      if (initialData.sectionResponses) {
        const initialResponses: Record<string, any> = {};
        const initialSectionResponses: Record<string, SectionResponse> = {};

        initialData.sectionResponses.forEach(sectionResponse => {
          initialSectionResponses[sectionResponse.sectionId] = sectionResponse;
          
          sectionResponse.questionResponses.forEach(questionResponse => {
            initialResponses[questionResponse.questionId] = questionResponse.value;
          });
        });

        setResponses(initialResponses);
        setSectionResponses(initialSectionResponses);
      }

      if (initialData.metadata) {
        responseMetadata.current = {
          ...responseMetadata.current,
          ...initialData.metadata
        };
      }
    }
  }, [initialData]);

  // 加载保存的数据
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 检查节完成状态
  useEffect(() => {
    questionnaire.sections.forEach(section => {
      const sectionComplete = section.questions.every(question => {
        if (!question.required) return true;
        const value = responses[question.id];
        return value !== undefined && value !== '' && value !== null;
      });

      if (sectionComplete && !sectionResponses[section.id]?.completedAt) {
        updateSectionResponse(section.id, {
          completedAt: Date.now()
        });
        onSectionComplete?.(section.id);
      }
    });
  }, [responses, questionnaire.sections, sectionResponses, updateSectionResponse, onSectionComplete]);

  // 检查问卷完成状态
  useEffect(() => {
    if (isComplete && !responseMetadata.current.completedAt) {
      responseMetadata.current.completedAt = Date.now();
      onQuestionnaireComplete?.();
    }
  }, [isComplete, onQuestionnaireComplete]);

  return {
    // 响应数据
    responses,
    sectionResponses,
    
    // 状态信息
    isComplete,
    hasUnsavedChanges,
    completedQuestions,
    totalQuestions,
    
    // 操作方法
    updateResponse,
    updateSectionResponse,
    clearResponses,
    clearSectionResponses,
    
    // 数据获取
    getResponseData,
    getQuestionResponse,
    getSectionResponse,
    
    // 验证方法
    validateResponses,
    getCompletionStatus,
    
    // 存储方法
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
};

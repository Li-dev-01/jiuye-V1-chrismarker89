/**
 * 快速审核自定义Hook
 * 
 * 功能特性：
 * - 审核状态管理
 * - 审核历史跟踪
 * - 撤销/重做功能
 * - 自动保存进度
 * - 审核结果提交
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReviewItem, ReviewResult, ReviewAction, ReviewHistory } from '../types/review.types';
import { quickReviewService } from '../services/quickReviewService';

interface UseQuickReviewOptions {
  autoSave?: boolean;
  maxHistorySize?: number;
  enableUndo?: boolean;
  onReviewComplete?: (result: ReviewResult) => void;
  onError?: (error: Error) => void;
}

interface UseQuickReviewReturn {
  // 数据状态
  items: ReviewItem[];
  currentItem: ReviewItem | null;
  currentIndex: number;
  
  // 审核历史
  reviewHistory: ReviewHistory[];
  canUndo: boolean;
  canRedo: boolean;
  
  // 操作状态
  isSubmitting: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // 操作方法
  setItems: (items: ReviewItem[]) => void;
  setCurrentIndex: (index: number) => void;
  submitReview: (itemId: string, action: ReviewAction, metadata?: any) => Promise<ReviewResult>;
  undoLastReview: () => Promise<ReviewResult>;
  redoLastReview: () => Promise<ReviewResult>;
  clearHistory: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

export const useQuickReview = (
  contentType: string,
  options: UseQuickReviewOptions = {}
): UseQuickReviewReturn => {
  const {
    autoSave = true,
    maxHistorySize = 50,
    enableUndo = true,
    onReviewComplete,
    onError
  } = options;

  // 状态管理
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [undoStack, setUndoStack] = useState<ReviewHistory[]>([]);
  const [redoStack, setRedoStack] = useState<ReviewHistory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 引用
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const progressKey = `quick-review-progress-${contentType}`;

  // 当前项目
  const currentItem = items[currentIndex] || null;

  // 是否可以撤销/重做
  const canUndo = enableUndo && undoStack.length > 0;
  const canRedo = enableUndo && redoStack.length > 0;

  // 提交审核
  const submitReview = useCallback(async (
    itemId: string,
    action: ReviewAction,
    metadata: any = {}
  ): Promise<ReviewResult> => {
    if (isSubmitting) {
      throw new Error('正在提交中，请稍候');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const reviewData = {
        itemId,
        action,
        contentType,
        timestamp: Date.now(),
        reviewerId: 'current-reviewer', // 实际应用中应该从认证系统获取
        metadata: {
          ...metadata,
          reviewTime: Date.now(),
          userAgent: navigator.userAgent,
          sessionId: sessionStorage.getItem('sessionId') || 'unknown'
        }
      };

      console.log('提交审核:', reviewData);

      // 调用审核服务
      const result = await quickReviewService.submitReview(reviewData);

      if (result.success) {
        // 创建历史记录
        const historyEntry: ReviewHistory = {
          id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId,
          action,
          timestamp: Date.now(),
          metadata: reviewData.metadata,
          result
        };

        // 更新历史记录
        setReviewHistory(prev => {
          const newHistory = [...prev, historyEntry];
          return newHistory.slice(-maxHistorySize);
        });

        // 如果启用撤销功能，添加到撤销栈
        if (enableUndo) {
          setUndoStack(prev => {
            const newStack = [...prev, historyEntry];
            return newStack.slice(-maxHistorySize);
          });
          // 清空重做栈
          setRedoStack([]);
        }

        // 更新项目状态
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: Date.now() }
            : item
        ));

        // 自动保存进度
        if (autoSave) {
          scheduleAutoSave();
        }

        // 触发回调
        onReviewComplete?.(result);

        console.log('审核提交成功:', result);
        return result;

      } else {
        throw new Error(result.message || '审核提交失败');
      }

    } catch (error) {
      const reviewError = error instanceof Error ? error : new Error('未知错误');
      console.error('审核提交失败:', reviewError);
      
      setError(reviewError);
      onError?.(reviewError);
      
      throw reviewError;

    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    contentType,
    maxHistorySize,
    enableUndo,
    autoSave,
    onReviewComplete,
    onError
  ]);

  // 撤销上一个审核
  const undoLastReview = useCallback(async (): Promise<ReviewResult> => {
    if (!canUndo) {
      throw new Error('没有可撤销的操作');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const lastReview = undoStack[undoStack.length - 1];
      
      console.log('撤销审核:', lastReview);

      // 调用撤销服务
      const result = await quickReviewService.undoReview(lastReview.id);

      if (result.success) {
        // 从撤销栈移除
        setUndoStack(prev => prev.slice(0, -1));
        
        // 添加到重做栈
        setRedoStack(prev => [...prev, lastReview]);

        // 更新项目状态
        setItems(prev => prev.map(item => 
          item.id === lastReview.itemId 
            ? { ...item, status: 'pending', reviewedAt: undefined }
            : item
        ));

        // 从历史记录中移除
        setReviewHistory(prev => prev.filter(h => h.id !== lastReview.id));

        console.log('撤销成功:', result);
        return result;

      } else {
        throw new Error(result.message || '撤销失败');
      }

    } catch (error) {
      const undoError = error instanceof Error ? error : new Error('撤销失败');
      console.error('撤销失败:', undoError);
      
      setError(undoError);
      onError?.(undoError);
      
      throw undoError;

    } finally {
      setIsSubmitting(false);
    }
  }, [canUndo, undoStack, onError]);

  // 重做上一个撤销的审核
  const redoLastReview = useCallback(async (): Promise<ReviewResult> => {
    if (!canRedo) {
      throw new Error('没有可重做的操作');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const lastUndone = redoStack[redoStack.length - 1];
      
      console.log('重做审核:', lastUndone);

      // 重新提交审核
      const result = await submitReview(
        lastUndone.itemId,
        lastUndone.action,
        lastUndone.metadata
      );

      if (result.success) {
        // 从重做栈移除
        setRedoStack(prev => prev.slice(0, -1));

        console.log('重做成功:', result);
        return result;

      } else {
        throw new Error(result.message || '重做失败');
      }

    } catch (error) {
      const redoError = error instanceof Error ? error : new Error('重做失败');
      console.error('重做失败:', redoError);
      
      setError(redoError);
      onError?.(redoError);
      
      throw redoError;

    } finally {
      setIsSubmitting(false);
    }
  }, [canRedo, redoStack, submitReview, onError]);

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setReviewHistory([]);
    setUndoStack([]);
    setRedoStack([]);
    console.log('历史记录已清空');
  }, []);

  // 保存进度
  const saveProgress = useCallback(async () => {
    try {
      const progress = {
        contentType,
        currentIndex,
        items: items.map(item => ({
          id: item.id,
          status: item.status,
          reviewedAt: item.reviewedAt
        })),
        reviewHistory: reviewHistory.slice(-20), // 只保存最近20条
        timestamp: Date.now()
      };

      localStorage.setItem(progressKey, JSON.stringify(progress));
      console.log('进度已保存');

    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }, [contentType, currentIndex, items, reviewHistory, progressKey]);

  // 加载进度
  const loadProgress = useCallback(async () => {
    try {
      const savedProgress = localStorage.getItem(progressKey);
      if (!savedProgress) return;

      const progress = JSON.parse(savedProgress);
      
      // 检查是否是同一内容类型
      if (progress.contentType !== contentType) return;

      // 检查是否过期（24小时）
      const isExpired = Date.now() - progress.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(progressKey);
        return;
      }

      // 恢复状态
      if (progress.currentIndex !== undefined) {
        setCurrentIndex(progress.currentIndex);
      }

      if (progress.reviewHistory) {
        setReviewHistory(progress.reviewHistory);
      }

      console.log('进度已加载');

    } catch (error) {
      console.error('加载进度失败:', error);
    }
  }, [contentType, progressKey]);

  // 计划自动保存
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      saveProgress();
    }, 5000); // 5秒后保存
  }, [saveProgress]);

  // 组件挂载时加载进度
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // 当项目或索引变化时，计划自动保存
  useEffect(() => {
    if (autoSave && items.length > 0) {
      scheduleAutoSave();
    }
  }, [items, currentIndex, autoSave, scheduleAutoSave]);

  return {
    // 数据状态
    items,
    currentItem,
    currentIndex,
    
    // 审核历史
    reviewHistory,
    canUndo,
    canRedo,
    
    // 操作状态
    isSubmitting,
    isLoading,
    error,
    
    // 操作方法
    setItems,
    setCurrentIndex,
    submitReview,
    undoLastReview,
    redoLastReview,
    clearHistory,
    saveProgress,
    loadProgress
  };
};

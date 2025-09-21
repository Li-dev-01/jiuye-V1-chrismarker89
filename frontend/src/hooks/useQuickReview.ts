/**
 * 快速审核自定义Hook
 * 专门为问卷心声和故事墙审核设计
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import type {
  QuickReviewItem,
  QuickReviewResult,
  QuickReviewAction,
  QuickReviewContentType,
  QuickReviewHistory,
  QuickReviewStatistics
} from '../types/quickReview.types';

interface UseQuickReviewOptions {
  contentType: QuickReviewContentType;
  batchSize?: number;
  autoSave?: boolean;
  enableUndo?: boolean;
  onReviewComplete?: (result: QuickReviewResult) => void;
  onBatchComplete?: (stats: any) => void;
}

interface UseQuickReviewReturn {
  // 数据状态
  items: QuickReviewItem[];
  currentItem: QuickReviewItem | null;
  currentIndex: number;
  
  // 审核历史
  reviewHistory: QuickReviewHistory[];
  canUndo: boolean;
  
  // 操作状态
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 统计数据
  statistics: QuickReviewStatistics;
  
  // 操作方法
  setItems: (items: QuickReviewItem[]) => void;
  setCurrentIndex: (index: number) => void;
  submitReview: (action: QuickReviewAction, reason?: string, notes?: string) => Promise<QuickReviewResult>;
  undoLastReview: () => Promise<boolean>;
  nextItem: () => void;
  previousItem: () => void;
  requestNewBatch: () => Promise<void>;
  resetStatistics: () => void;
}

export const useQuickReview = (options: UseQuickReviewOptions): UseQuickReviewReturn => {
  const {
    contentType,
    batchSize = 50,
    autoSave = true,
    enableUndo = true,
    onReviewComplete,
    onBatchComplete
  } = options;

  // 状态管理
  const [items, setItems] = useState<QuickReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<QuickReviewHistory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<QuickReviewStatistics>({
    totalReviewed: 0,
    approved: 0,
    rejected: 0,
    skipped: 0,
    averageTimePerItem: 0,
    reviewsPerHour: 0,
    totalTimeSpent: 0,
    sessionStartTime: Date.now(),
    lastReviewTime: 0,
    accuracyRate: 0,
    consistencyScore: 0,
    batchesCompleted: 0,
    currentBatchProgress: 0,
    contentTypeDistribution: { voice: 0, story: 0 },
    rejectionReasons: {}
  });

  // 引用
  const reviewStartTime = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());

  // 当前项目
  const currentItem = items[currentIndex] || null;
  
  // 是否可以撤销
  const canUndo = enableUndo && reviewHistory.length > 0 && reviewHistory[reviewHistory.length - 1]?.canUndo;

  // 提交审核
  const submitReview = useCallback(async (
    action: QuickReviewAction,
    reason?: string,
    notes?: string
  ): Promise<QuickReviewResult> => {
    if (!currentItem || isSubmitting) {
      throw new Error('无法提交审核');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const reviewTime = Date.now() - reviewStartTime.current;
      
      // 模拟API调用 - 实际应用中替换为真实API
      const result: QuickReviewResult = {
        success: true,
        data: {
          itemId: currentItem.id,
          action,
          timestamp: Date.now(),
          reviewerId: 'current-reviewer', // 从认证系统获取
          reviewTime
        }
      };

      // 创建历史记录
      const historyEntry: QuickReviewHistory = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemId: currentItem.id,
        action,
        timestamp: Date.now(),
        reviewerId: 'current-reviewer',
        reviewTime,
        reason,
        notes,
        canUndo: true
      };

      // 更新历史记录
      setReviewHistory(prev => [...prev, historyEntry]);

      // 更新项目状态
      setItems(prev => prev.map(item => 
        item.id === currentItem.id 
          ? { 
              ...item, 
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'skipped',
              reviewedAt: Date.now(),
              reviewedBy: 'current-reviewer',
              reviewNotes: notes
            }
          : item
      ));

      // 更新统计数据
      setStatistics(prev => {
        const newStats = { ...prev };
        newStats.totalReviewed += 1;
        newStats[action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'skipped'] += 1;
        newStats.lastReviewTime = Date.now();
        newStats.totalTimeSpent += reviewTime;
        newStats.averageTimePerItem = newStats.totalTimeSpent / newStats.totalReviewed;
        newStats.reviewsPerHour = (newStats.totalReviewed / ((Date.now() - sessionStartTime.current) / 3600000));
        newStats.currentBatchProgress = ((currentIndex + 1) / items.length) * 100;
        newStats.contentTypeDistribution[contentType] += 1;
        
        if (action === 'reject' && reason) {
          newStats.rejectionReasons[reason] = (newStats.rejectionReasons[reason] || 0) + 1;
        }
        
        return newStats;
      });

      // 触发回调
      onReviewComplete?.(result);

      message.success(`${action === 'approve' ? '批准' : action === 'reject' ? '拒绝' : '跳过'}成功`);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '审核提交失败';
      setError(errorMessage);
      message.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentItem, isSubmitting, currentIndex, items.length, contentType, onReviewComplete]);

  // 撤销上一个审核
  const undoLastReview = useCallback(async (): Promise<boolean> => {
    if (!canUndo) return false;

    try {
      const lastReview = reviewHistory[reviewHistory.length - 1];
      
      // 模拟撤销API调用
      await new Promise(resolve => setTimeout(resolve, 500));

      // 更新项目状态
      setItems(prev => prev.map(item => 
        item.id === lastReview.itemId 
          ? { ...item, status: 'pending', reviewedAt: undefined, reviewedBy: undefined, reviewNotes: undefined }
          : item
      ));

      // 移除历史记录
      setReviewHistory(prev => prev.slice(0, -1));

      // 更新统计数据
      setStatistics(prev => {
        const newStats = { ...prev };
        newStats.totalReviewed = Math.max(0, newStats.totalReviewed - 1);
        const action = lastReview.action;
        newStats[action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'skipped'] = 
          Math.max(0, newStats[action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'skipped'] - 1);
        newStats.totalTimeSpent = Math.max(0, newStats.totalTimeSpent - lastReview.reviewTime);
        if (newStats.totalReviewed > 0) {
          newStats.averageTimePerItem = newStats.totalTimeSpent / newStats.totalReviewed;
        }
        return newStats;
      });

      message.success('已撤销上一个操作');
      return true;

    } catch (error) {
      message.error('撤销失败');
      return false;
    }
  }, [canUndo, reviewHistory]);

  // 下一个项目
  const nextItem = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      reviewStartTime.current = Date.now();
    }
  }, [currentIndex, items.length]);

  // 上一个项目
  const previousItem = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      reviewStartTime.current = Date.now();
    }
  }, [currentIndex]);

  // 申请新批次
  const requestNewBatch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 调用真实API获取待审核内容
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/review/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentType,
          batchSize
        })
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        // API未配置或失败时显示空数据
        setItems([]);
        message.warning('审核API未配置，请联系管理员');
        return;
      }
      setCurrentIndex(0);
      reviewStartTime.current = Date.now();
      
      // 更新批次统计
      setStatistics(prev => ({
        ...prev,
        batchesCompleted: prev.batchesCompleted + 1,
        currentBatchProgress: 0
      }));

      message.success(`已获取 ${items.length} 条${contentType === 'story' ? '故事' : '心声'}待审核`);

    } catch (error) {
      const errorMessage = '获取新批次失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [batchSize, contentType]);

  // 重置统计数据
  const resetStatistics = useCallback(() => {
    setStatistics({
      totalReviewed: 0,
      approved: 0,
      rejected: 0,
      skipped: 0,
      averageTimePerItem: 0,
      reviewsPerHour: 0,
      totalTimeSpent: 0,
      sessionStartTime: Date.now(),
      lastReviewTime: 0,
      accuracyRate: 0,
      consistencyScore: 0,
      batchesCompleted: 0,
      currentBatchProgress: 0,
      contentTypeDistribution: { voice: 0, story: 0 },
      rejectionReasons: {}
    });
    sessionStartTime.current = Date.now();
  }, []);

  // 初始化时设置审核开始时间
  useEffect(() => {
    if (currentItem) {
      reviewStartTime.current = Date.now();
    }
  }, [currentItem]);

  return {
    // 数据状态
    items,
    currentItem,
    currentIndex,
    
    // 审核历史
    reviewHistory,
    canUndo,
    
    // 操作状态
    isSubmitting,
    isLoading,
    error,
    
    // 统计数据
    statistics,
    
    // 操作方法
    setItems,
    setCurrentIndex,
    submitReview,
    undoLastReview,
    nextItem,
    previousItem,
    requestNewBatch,
    resetStatistics
  };
};

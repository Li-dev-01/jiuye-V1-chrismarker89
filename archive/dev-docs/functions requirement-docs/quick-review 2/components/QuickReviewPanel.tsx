/**
 * 快速审核主面板组件
 * 
 * 功能特性：
 * - 批次内容管理
 * - 键盘快捷键支持
 * - 实时统计显示
 * - 自动切换和进度跟踪
 * - 拒绝原因选择
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Keyboard,
  RefreshCw,
  Settings,
  HelpCircle
} from 'lucide-react';

import { BatchRequestManager } from './BatchRequestManager';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ReviewStatistics } from './ReviewStatistics';
import { ContentCard } from './ContentCard';
import { RejectReasonDialog } from './RejectReasonDialog';

import { useQuickReview } from '../hooks/useQuickReview';
import { useBatchRequest } from '../hooks/useBatchRequest';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useReviewStatistics } from '../hooks/useReviewStatistics';

import { ReviewItem, ReviewResult, BatchConfig } from '../types/review.types';
import { KeyboardShortcut } from '../types/keyboard.types';

interface QuickReviewPanelProps {
  contentType: 'story' | 'voice' | 'image' | 'video' | 'comment' | 'tag';
  batchConfig?: Partial<BatchConfig>;
  onReviewComplete?: (result: ReviewResult) => void;
  onBatchComplete?: (stats: any) => void;
  onExit?: () => void;
  className?: string;
}

export const QuickReviewPanel: React.FC<QuickReviewPanelProps> = ({
  contentType,
  batchConfig = {},
  onReviewComplete,
  onBatchComplete,
  onExit,
  className = ''
}) => {
  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [selectedReasonIndex, setSelectedReasonIndex] = useState(0);

  // 自定义Hooks
  const {
    items,
    currentItem,
    reviewHistory,
    submitReview,
    undoLastReview,
    canUndo,
    isSubmitting
  } = useQuickReview(contentType);

  const {
    requestBatch,
    batchStats,
    isBatchLoading,
    batchError
  } = useBatchRequest(contentType, batchConfig);

  const {
    statistics,
    updateStatistics,
    resetStatistics
  } = useReviewStatistics();

  // 键盘快捷键配置
  const shortcuts: KeyboardShortcut[] = [
    { key: 'ArrowUp', action: 'approve', description: '批准当前内容' },
    { key: 'a', action: 'approve', description: '批准当前内容' },
    { key: 'ArrowDown', action: 'reject', description: '拒绝当前内容' },
    { key: 'r', action: 'reject', description: '拒绝当前内容' },
    { key: 'ArrowRight', action: 'next', description: '下一个内容' },
    { key: 'n', action: 'next', description: '下一个内容' },
    { key: 'ArrowLeft', action: 'previous', description: '上一个内容' },
    { key: 'p', action: 'previous', description: '上一个内容' },
    { key: 'Enter', action: 'edit', description: '编辑当前内容' },
    { key: ' ', action: 'toggle-auto', description: '切换自动前进' },
    { key: 'Escape', action: 'exit', description: '退出快速审核' },
    { key: 'F1', action: 'help', description: '显示帮助' },
    { key: 'F5', action: 'refresh', description: '申请新批次' }
  ];

  const { enableShortcuts, disableShortcuts } = useKeyboardShortcuts(shortcuts, {
    onApprove: handleApprove,
    onReject: handleReject,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onEdit: handleEdit,
    onToggleAuto: () => setAutoAdvance(!autoAdvance),
    onExit: onExit,
    onHelp: () => setShowKeyboardHelp(true),
    onRefresh: handleRequestBatch
  });

  // Toast通知
  const { toast } = useToast();

  // 拒绝原因预设
  const rejectReasons = [
    '内容不当',
    '违反社区规范',
    '涉及敏感信息',
    '质量不符合要求',
    '重复内容',
    '其他原因'
  ];

  // 处理批准操作
  const handleApprove = useCallback(async () => {
    if (!currentItem || isSubmitting) return;

    try {
      const result = await submitReview(currentItem.id, 'approve', {
        reviewTime: Date.now(),
        reviewerId: 'current-reviewer'
      });

      if (result.success) {
        updateStatistics({
          approved: statistics.approved + 1,
          totalReviewed: statistics.totalReviewed + 1
        });

        toast({
          title: '审核完成',
          description: '内容已批准',
          duration: 1000
        });

        if (autoAdvance) {
          setTimeout(() => handleNext(), 500);
        }

        onReviewComplete?.(result);
      }
    } catch (error) {
      console.error('批准操作失败:', error);
      toast({
        title: '操作失败',
        description: '批准操作失败，请重试',
        variant: 'destructive'
      });
    }
  }, [currentItem, isSubmitting, submitReview, updateStatistics, statistics, autoAdvance, toast, onReviewComplete]);

  // 处理拒绝操作
  const handleReject = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setShowRejectDialog(true);
    setSelectedReasonIndex(0);
  }, [currentItem, isSubmitting]);

  // 确认拒绝操作
  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!currentItem) return;

    try {
      const result = await submitReview(currentItem.id, 'reject', {
        reason,
        reviewTime: Date.now(),
        reviewerId: 'current-reviewer'
      });

      if (result.success) {
        updateStatistics({
          rejected: statistics.rejected + 1,
          totalReviewed: statistics.totalReviewed + 1
        });

        toast({
          title: '审核完成',
          description: `内容已拒绝：${reason}`,
          duration: 1000
        });

        setShowRejectDialog(false);

        if (autoAdvance) {
          setTimeout(() => handleNext(), 500);
        }

        onReviewComplete?.(result);
      }
    } catch (error) {
      console.error('拒绝操作失败:', error);
      toast({
        title: '操作失败',
        description: '拒绝操作失败，请重试',
        variant: 'destructive'
      });
    }
  }, [currentItem, submitReview, updateStatistics, statistics, autoAdvance, toast, onReviewComplete]);

  // 处理下一个
  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (currentIndex === items.length - 1) {
      // 当前批次已完成，申请新批次
      handleRequestBatch();
    }
  }, [currentIndex, items.length]);

  // 处理上一个
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // 处理编辑
  const handleEdit = useCallback(() => {
    if (!currentItem) return;
    // 实现编辑功能
    console.log('编辑内容:', currentItem);
  }, [currentItem]);

  // 申请新批次
  const handleRequestBatch = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await requestBatch();
      
      if (result.success) {
        setCurrentIndex(0);
        resetStatistics();
        
        toast({
          title: '批次申请成功',
          description: `已获取 ${result.data.items.length} 条待审核内容`,
        });
      }
    } catch (error) {
      console.error('申请批次失败:', error);
      toast({
        title: '申请失败',
        description: '无法获取新的审核批次',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [requestBatch, resetStatistics, toast]);

  // 撤销上一个操作
  const handleUndo = useCallback(async () => {
    if (!canUndo) return;

    try {
      const result = await undoLastReview();
      if (result.success) {
        updateStatistics({
          totalReviewed: Math.max(0, statistics.totalReviewed - 1)
        });

        toast({
          title: '操作已撤销',
          description: '上一个审核操作已撤销',
        });
      }
    } catch (error) {
      console.error('撤销操作失败:', error);
      toast({
        title: '撤销失败',
        description: '无法撤销上一个操作',
        variant: 'destructive'
      });
    }
  }, [canUndo, undoLastReview, updateStatistics, statistics, toast]);

  // 组件挂载时启用快捷键
  useEffect(() => {
    enableShortcuts();
    return () => disableShortcuts();
  }, [enableShortcuts, disableShortcuts]);

  // 检查是否需要申请新批次
  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      handleRequestBatch();
    }
  }, [items.length, isLoading, handleRequestBatch]);

  // 批次完成检查
  useEffect(() => {
    if (currentIndex >= items.length - 1 && items.length > 0) {
      const completedStats = {
        ...statistics,
        batchCompleted: true,
        completionTime: Date.now()
      };
      onBatchComplete?.(completedStats);
    }
  }, [currentIndex, items.length, statistics, onBatchComplete]);

  // 如果没有内容，显示加载状态
  if (items.length === 0) {
    return (
      <div className={`quick-review-panel ${className}`}>
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">正在加载审核内容...</h3>
            <p className="text-muted-foreground text-center">
              {isLoading ? '正在申请新的审核批次' : '准备审核环境'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className={`quick-review-panel ${className}`}>
      {/* 头部工具栏 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-500" />
            快速审核 - {contentType}
          </h1>
          <Badge variant="outline" className="text-sm">
            {currentIndex + 1} / {items.length}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            快捷键
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestBatch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            新批次
          </Button>

          {onExit && (
            <Button variant="outline" size="sm" onClick={onExit}>
              退出
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">批次进度</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主内容区域 */}
        <div className="lg:col-span-3">
          <ContentCard
            item={currentItem}
            index={currentIndex}
            total={items.length}
            onApprove={handleApprove}
            onReject={handleReject}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isSubmitting={isSubmitting}
            canGoNext={currentIndex < items.length - 1}
            canGoPrevious={currentIndex > 0}
          />

          {/* 操作按钮 */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>上一个 (P)</span>
            </Button>

            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>拒绝 (R)</span>
            </Button>

            <Button
              variant="default"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              <span>批准 (A)</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1 && !autoAdvance}
              className="flex items-center space-x-2"
            >
              <span>下一个 (N)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 撤销按钮 */}
          {canUndo && (
            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>撤销上一个操作</span>
              </Button>
            </div>
          )}
        </div>

        {/* 侧边栏统计 */}
        <div className="lg:col-span-1">
          <ReviewStatistics
            statistics={statistics}
            batchStats={batchStats}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={() => setAutoAdvance(!autoAdvance)}
          />
        </div>
      </div>

      {/* 拒绝原因对话框 */}
      <RejectReasonDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        reasons={rejectReasons}
        selectedIndex={selectedReasonIndex}
        onSelectedIndexChange={setSelectedReasonIndex}
      />

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcuts
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};

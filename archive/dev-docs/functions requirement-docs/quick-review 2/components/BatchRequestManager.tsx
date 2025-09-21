/**
 * 批次请求管理器组件
 * 
 * 功能特性：
 * - 批次申请和管理
 * - 自动批次切换
 * - 批次进度跟踪
 * - 批次统计分析
 * - 预加载和缓存
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  RefreshCw,
  Package,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  BarChart3
} from 'lucide-react';

import { BatchConfig, BatchStats, BatchRequest } from '../types/batch.types';
import { ReviewItem } from '../types/review.types';

interface BatchRequestManagerProps {
  contentType: string;
  config: BatchConfig;
  onBatchReceived: (items: ReviewItem[]) => void;
  onBatchComplete: (stats: BatchStats) => void;
  onError: (error: Error) => void;
  className?: string;
}

export const BatchRequestManager: React.FC<BatchRequestManagerProps> = ({
  contentType,
  config,
  onBatchReceived,
  onBatchComplete,
  onError,
  className = ''
}) => {
  // 状态管理
  const [currentBatch, setCurrentBatch] = useState<BatchRequest | null>(null);
  const [batchHistory, setBatchHistory] = useState<BatchRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [nextBatchCache, setNextBatchCache] = useState<ReviewItem[] | null>(null);
  const [stats, setStats] = useState<BatchStats>({
    totalBatches: 0,
    totalItems: 0,
    completedItems: 0,
    averageTimePerBatch: 0,
    successRate: 100,
    lastBatchTime: 0
  });

  const { toast } = useToast();

  // 申请新批次
  const requestNewBatch = useCallback(async (size?: number) => {
    if (isRequesting) return null;

    try {
      setIsRequesting(true);

      const batchSize = size || config.batchSize;
      const requestId = generateBatchId();

      console.log(`申请新批次: ${contentType}, 大小: ${batchSize}`);

      // 模拟API调用
      const response = await fetch('/api/review/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          batchSize,
          requestId,
          filters: config.filters || {},
          priority: config.priority || 'normal'
        })
      });

      if (!response.ok) {
        throw new Error(`批次申请失败: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '批次申请失败');
      }

      const batch: BatchRequest = {
        id: requestId,
        contentType,
        size: batchSize,
        items: data.items || [],
        requestTime: Date.now(),
        status: 'active',
        progress: 0,
        completedItems: 0,
        startTime: Date.now(),
        estimatedEndTime: Date.now() + (batchSize * config.estimatedTimePerItem)
      };

      // 更新当前批次
      setCurrentBatch(batch);
      
      // 添加到历史记录
      setBatchHistory(prev => [...prev, batch].slice(-10)); // 保留最近10个批次

      // 更新统计
      setStats(prev => ({
        ...prev,
        totalBatches: prev.totalBatches + 1,
        totalItems: prev.totalItems + batch.items.length,
        lastBatchTime: Date.now()
      }));

      // 通知父组件
      onBatchReceived(batch.items);

      toast({
        title: '批次申请成功',
        description: `已获取 ${batch.items.length} 条待审核内容`,
      });

      console.log(`批次申请成功: ${batch.id}, 内容数量: ${batch.items.length}`);

      // 如果启用预加载，开始预加载下一批次
      if (config.prefetchNext) {
        setTimeout(() => prefetchNextBatch(), 5000);
      }

      return batch;

    } catch (error) {
      console.error('批次申请失败:', error);
      
      toast({
        title: '批次申请失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });

      onError(error instanceof Error ? error : new Error('批次申请失败'));
      return null;

    } finally {
      setIsRequesting(false);
    }
  }, [contentType, config, isRequesting, onBatchReceived, onError, toast]);

  // 预加载下一批次
  const prefetchNextBatch = useCallback(async () => {
    if (nextBatchCache || isRequesting) return;

    try {
      console.log('开始预加载下一批次...');

      const response = await fetch('/api/review/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          batchSize: config.batchSize,
          requestId: generateBatchId(),
          prefetch: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.items) {
          setNextBatchCache(data.items);
          console.log(`预加载完成: ${data.items.length} 条内容`);
        }
      }
    } catch (error) {
      console.warn('预加载失败:', error);
    }
  }, [contentType, config.batchSize, nextBatchCache, isRequesting]);

  // 使用缓存的批次
  const useNextBatchCache = useCallback(() => {
    if (!nextBatchCache) return null;

    const batch: BatchRequest = {
      id: generateBatchId(),
      contentType,
      size: nextBatchCache.length,
      items: nextBatchCache,
      requestTime: Date.now(),
      status: 'active',
      progress: 0,
      completedItems: 0,
      startTime: Date.now(),
      estimatedEndTime: Date.now() + (nextBatchCache.length * config.estimatedTimePerItem)
    };

    setCurrentBatch(batch);
    setBatchHistory(prev => [...prev, batch].slice(-10));
    setNextBatchCache(null);

    // 更新统计
    setStats(prev => ({
      ...prev,
      totalBatches: prev.totalBatches + 1,
      totalItems: prev.totalItems + batch.items.length,
      lastBatchTime: Date.now()
    }));

    onBatchReceived(batch.items);

    toast({
      title: '批次切换成功',
      description: `已切换到预加载的批次 (${batch.items.length} 条内容)`,
    });

    // 开始预加载下一批次
    if (config.prefetchNext) {
      setTimeout(() => prefetchNextBatch(), 2000);
    }

    return batch;
  }, [nextBatchCache, contentType, config, onBatchReceived, toast, prefetchNextBatch]);

  // 更新批次进度
  const updateBatchProgress = useCallback((completedCount: number) => {
    if (!currentBatch) return;

    const progress = (completedCount / currentBatch.size) * 100;
    const updatedBatch = {
      ...currentBatch,
      progress,
      completedItems: completedCount
    };

    setCurrentBatch(updatedBatch);

    // 更新统计
    setStats(prev => ({
      ...prev,
      completedItems: prev.completedItems + 1
    }));

    // 检查是否完成
    if (completedCount >= currentBatch.size) {
      completeBatch(updatedBatch);
    }
  }, [currentBatch]);

  // 完成批次
  const completeBatch = useCallback((batch: BatchRequest) => {
    const completedBatch = {
      ...batch,
      status: 'completed' as const,
      endTime: Date.now(),
      actualDuration: Date.now() - batch.startTime
    };

    setCurrentBatch(null);

    // 更新历史记录
    setBatchHistory(prev => 
      prev.map(b => b.id === batch.id ? completedBatch : b)
    );

    // 计算统计数据
    const batchStats: BatchStats = {
      ...stats,
      averageTimePerBatch: calculateAverageTime([...batchHistory, completedBatch]),
      successRate: calculateSuccessRate([...batchHistory, completedBatch])
    };

    setStats(batchStats);
    onBatchComplete(batchStats);

    toast({
      title: '批次完成',
      description: `已完成 ${batch.size} 条内容的审核`,
    });

    // 自动申请下一批次
    if (config.autoRequestNext) {
      setTimeout(() => {
        if (nextBatchCache) {
          useNextBatchCache();
        } else {
          requestNewBatch();
        }
      }, 1000);
    }
  }, [stats, batchHistory, onBatchComplete, toast, config.autoRequestNext, nextBatchCache, useNextBatchCache, requestNewBatch]);

  // 取消当前批次
  const cancelCurrentBatch = useCallback(async () => {
    if (!currentBatch) return;

    try {
      // 通知服务器取消批次
      await fetch(`/api/review/batch/${currentBatch.id}/cancel`, {
        method: 'POST'
      });

      const cancelledBatch = {
        ...currentBatch,
        status: 'cancelled' as const,
        endTime: Date.now()
      };

      setCurrentBatch(null);
      setBatchHistory(prev => 
        prev.map(b => b.id === currentBatch.id ? cancelledBatch : b)
      );

      toast({
        title: '批次已取消',
        description: '当前批次已取消，可以申请新的批次',
      });

    } catch (error) {
      console.error('取消批次失败:', error);
      toast({
        title: '取消失败',
        description: '无法取消当前批次',
        variant: 'destructive'
      });
    }
  }, [currentBatch, toast]);

  // 生成批次ID
  const generateBatchId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 计算平均时间
  const calculateAverageTime = (batches: BatchRequest[]) => {
    const completedBatches = batches.filter(b => b.status === 'completed' && b.actualDuration);
    if (completedBatches.length === 0) return 0;
    
    const totalTime = completedBatches.reduce((sum, b) => sum + (b.actualDuration || 0), 0);
    return Math.round(totalTime / completedBatches.length);
  };

  // 计算成功率
  const calculateSuccessRate = (batches: BatchRequest[]) => {
    if (batches.length === 0) return 100;
    
    const successfulBatches = batches.filter(b => b.status === 'completed').length;
    return Math.round((successfulBatches / batches.length) * 100);
  };

  // 格式化时间
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // 组件挂载时申请第一个批次
  useEffect(() => {
    if (!currentBatch && !isRequesting) {
      requestNewBatch();
    }
  }, [currentBatch, isRequesting, requestNewBatch]);

  return (
    <div className={`batch-request-manager ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              批次管理
            </div>
            <div className="flex items-center gap-2">
              {nextBatchCache && (
                <Badge variant="secondary" className="text-xs">
                  已预加载
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestNewBatch()}
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 当前批次信息 */}
          {currentBatch ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    批次 #{currentBatch.id.slice(-8)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentBatch.size} 条内容
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDuration(Date.now() - currentBatch.startTime)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>进度</span>
                  <span>{currentBatch.completedItems}/{currentBatch.size}</span>
                </div>
                <Progress value={currentBatch.progress} className="h-2" />
              </div>

              {currentBatch.estimatedEndTime && (
                <div className="text-xs text-muted-foreground">
                  预计完成时间: {new Date(currentBatch.estimatedEndTime).toLocaleTimeString()}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelCurrentBatch}
                  className="flex-1"
                >
                  取消批次
                </Button>
                {nextBatchCache && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={useNextBatchCache}
                    className="flex-1"
                  >
                    使用预加载
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-2">
                {isRequesting ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">正在申请批次...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">暂无活跃批次</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestNewBatch()}
                    >
                      申请新批次
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 批次统计 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              批次统计
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">总批次数</div>
                <div className="font-medium">{stats.totalBatches}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">总内容数</div>
                <div className="font-medium">{stats.totalItems}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">已完成</div>
                <div className="font-medium">{stats.completedItems}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">成功率</div>
                <div className="font-medium flex items-center gap-1">
                  {stats.successRate}%
                  {stats.successRate >= 95 ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>

            {stats.averageTimePerBatch > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  平均批次时间: {formatDuration(stats.averageTimePerBatch)}
                </div>
              </div>
            )}
          </div>

          {/* 最近批次历史 */}
          {batchHistory.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">最近批次</h4>
              <div className="space-y-2">
                {batchHistory.slice(-3).reverse().map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          batch.status === 'completed' ? 'default' :
                          batch.status === 'cancelled' ? 'destructive' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {batch.status}
                      </Badge>
                      <span>#{batch.id.slice(-8)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {batch.size} 条
                      {batch.actualDuration && (
                        <span className="ml-2">
                          {formatDuration(batch.actualDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

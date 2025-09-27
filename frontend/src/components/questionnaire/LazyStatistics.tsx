/**
 * 懒加载统计组件
 * 实现问卷实时统计数据的渐进式加载和缓存机制
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Skeleton, Alert } from 'antd';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useCachedData } from '../../hooks/useCachedData';
import styles from './LazyStatistics.module.css';

const { Text } = Typography;

interface LazyStatisticsProps {
  questionId: string;
  questionnaireId: string;
  question: {
    id: string;
    options?: Array<{ value: string; label: string }>;
  };
  enabled?: boolean;
  refreshTrigger?: number;
  className?: string;
}

interface StatisticsData {
  totalResponses: number;
  statistics: Record<string, {
    questionId: string;
    totalResponses: number;
    options: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  }>;
  dataSource: 'cache' | 'realtime';
  lastUpdated: string;
  cacheInfo?: {
    message: string;
  };
}

export const LazyStatistics: React.FC<LazyStatisticsProps> = ({
  questionId,
  questionnaireId,
  question,
  enabled = true,
  refreshTrigger,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 检测组件是否进入视口
  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  // 使用缓存数据 Hook
  const {
    data: statisticsData,
    loading,
    error: cacheError,
    refetch
  } = useCachedData<StatisticsData>(
    `statistics-${questionnaireId}`,
    async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/universal-questionnaire/statistics/${questionnaireId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '获取统计数据失败');
      }

      // 调试信息
      console.log('📊 LazyStatistics - API Response:', {
        questionId,
        hasData: !!result.data,
        hasStatistics: !!result.data?.statistics,
        hasQuestionData: !!result.data?.statistics?.[questionId],
        questionData: result.data?.statistics?.[questionId]
      });

      return result.data;
    },
    {
      enabled: enabled && isIntersecting,
      cacheTime: 2 * 60 * 1000, // 2分钟缓存
      staleTime: 1 * 60 * 1000,  // 1分钟内认为数据新鲜
      refetchInterval: 2 * 60 * 1000, // 2分钟自动刷新
      retry: 2
    }
  );

  // 当组件进入视口时标记为可见
  useEffect(() => {
    if (isIntersecting && !isVisible) {
      setIsVisible(true);
    }
  }, [isIntersecting, isVisible]);

  // 响应外部刷新触发器
  useEffect(() => {
    if (refreshTrigger && isVisible) {
      refetch();
    }
  }, [refreshTrigger, isVisible, refetch]);

  // 获取选项统计数据
  const getOptionStats = useCallback((optionValue: string) => {
    if (!statisticsData?.statistics?.[questionId]) {
      return { count: 0, percentage: 0 };
    }

    const questionStats = statisticsData.statistics[questionId];
    const option = questionStats.options?.find(opt => opt.value === optionValue);

    return option ? { count: option.count, percentage: option.percentage } : { count: 0, percentage: 0 };
  }, [statisticsData, questionId]);

  // 如果未启用或组件未进入视口，返回占位符
  if (!enabled) {
    return null;
  }

  if (!isVisible) {
    return (
      <div ref={containerRef} className={`${styles.statisticsPlaceholder} ${className || ''}`}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  // 处理错误状态
  if (error || cacheError) {
    return (
      <div ref={containerRef} className={`${styles.statisticsPanel} ${className || ''}`}>
        <Alert
          message="统计数据加载失败"
          description={error || cacheError?.message || '请稍后重试'}
          type="warning"
          size="small"
          showIcon
        />
      </div>
    );
  }

  // 加载状态
  if (loading) {
    return (
      <div ref={containerRef} className={`${styles.statisticsPanel} ${className || ''}`}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }

  // 无数据状态
  if (!statisticsData?.statistics?.[questionId]) {
    return (
      <div ref={containerRef} className={`${styles.statisticsPanel} ${className || ''}`}>
        <div className={styles.noDataMessage}>
          <Text type="secondary">📊 暂无统计数据，您是第一个回答者</Text>
        </div>
      </div>
    );
  }

  const currentQuestionStats = statisticsData.statistics[questionId];
  const currentQuestionResponses = currentQuestionStats.totalResponses || 0;

  return (
    <div ref={containerRef} className={`${styles.statisticsPanel} ${className || ''}`}>
      <div className={styles.statisticsHeader}>
        <Text type="secondary" className={styles.statisticsTitle}>
          📊 其他用户选择情况 (共{currentQuestionResponses}人参与)
        </Text>
        {statisticsData.dataSource === 'cache' && (
          <Text type="secondary" className={styles.cacheInfo}>
            💾 数据更新于1分钟前
          </Text>
        )}
      </div>
      
      <div className={styles.statisticsContent}>
        {question.options?.map((option) => {
          const stats = getOptionStats(option.value);
          return (
            <div key={option.value} className={styles.statItem}>
              <Text className={styles.statLabel}>{option.label}</Text>
              <div className={styles.statBar}>
                <div
                  className={styles.statBarFill}
                  style={{ 
                    width: `${stats.percentage}%`,
                    transition: 'width 0.6s ease-in-out'
                  }}
                />
              </div>
              <Text className={styles.statPercentage}>{stats.percentage}%</Text>
            </div>
          );
        })}
      </div>
      
      {statisticsData.cacheInfo?.message && (
        <Text type="secondary" className={styles.dataSourceInfo}>
          ℹ️ {statisticsData.cacheInfo.message}
        </Text>
      )}
    </div>
  );
};

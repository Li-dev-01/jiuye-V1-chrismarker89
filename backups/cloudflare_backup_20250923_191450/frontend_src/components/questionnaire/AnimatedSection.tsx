/**
 * 动画过渡组件
 * 为问卷分支切换提供平滑的视觉过渡效果
 * 基于 CSS Transitions 实现（无需外部依赖）
 */

import React, { useState, useEffect } from 'react';

interface AnimatedSectionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  onAnimationComplete?: () => void;
  animationType?: 'fade' | 'slide' | 'scale';
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  show,
  children,
  duration = 300,
  className = '',
  onAnimationComplete,
  animationType = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        onAnimationComplete?.();
      }, duration);
    }
  }, [show, duration, onAnimationComplete]);

  if (!shouldRender) return null;

  const getAnimationStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: `all ${duration}ms ease-in-out`,
      // 移除overflow: 'hidden'，允许内容正常滚动
    };

    switch (animationType) {
      case 'slide':
        return {
          ...baseStyle,
          opacity: isVisible ? 1 : 0,
          // 移除maxHeight限制，允许内容自然高度
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          marginTop: isVisible ? '1.5rem' : '0'
        };

      case 'scale':
        return {
          ...baseStyle,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)'
        };

      default: // fade
        return {
          ...baseStyle,
          opacity: isVisible ? 1 : 0,
          // 移除maxHeight限制，允许内容自然高度
          marginTop: isVisible ? '1.5rem' : '0'
        };
    }
  };

  return (
    <div className={className} style={getAnimationStyle()}>
      {children}
    </div>
  );
};

/**
 * 问题组动画包装器
 * 为问题组的显示/隐藏提供统一的动画效果
 */
interface AnimatedQuestionGroupProps {
  show: boolean;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedQuestionGroup: React.FC<AnimatedQuestionGroupProps> = ({
  show,
  children,
  delay = 0,
  className = ''
}) => {
  const [isDelayComplete, setIsDelayComplete] = useState(false);

  useEffect(() => {
    if (show && delay > 0) {
      const timer = setTimeout(() => setIsDelayComplete(true), delay);
      return () => clearTimeout(timer);
    } else {
      setIsDelayComplete(true);
    }
  }, [show, delay]);

  return (
    <AnimatedSection
      show={show && isDelayComplete}
      duration={400}
      animationType="slide"
      className={className}
    >
      {children}
    </AnimatedSection>
  );
};

/**
 * 进度指示器动画
 * 为进度条变化提供平滑动画
 */
interface AnimatedProgressProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  className = '',
  showPercentage = true
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const progressBarStyle: React.CSSProperties = {
    width: `${currentProgress}%`,
    transition: 'width 0.5s ease-in-out',
    height: '8px',
    backgroundColor: '#1890ff',
    borderRadius: '4px'
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    height: '8px'
  };

  return (
    <div className={`relative ${className}`}>
      <div style={containerStyle}>
        <div style={progressBarStyle} />
      </div>
      {showPercentage && (
        <span
          style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '4px',
            display: 'block',
            opacity: currentProgress > 0 ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {Math.round(currentProgress)}% 完成
        </span>
      )}
    </div>
  );
};

/**
 * 统计数据动画
 * 为统计数据的更新提供动画效果
 */
interface AnimatedStatsProps {
  value: number;
  label: string;
  percentage: number;
  className?: string;
}

export const AnimatedStats: React.FC<AnimatedStatsProps> = ({
  value,
  label,
  percentage,
  className = ''
}) => {
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span style={{ fontSize: '14px', color: '#666' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
          {percentage}%
        </span>
        <div style={{
          width: '64px',
          height: '4px',
          backgroundColor: '#f0f0f0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#1890ff',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
      </div>
    </div>
  );
};

/**
 * 页面切换动画
 * 为问卷页面之间的切换提供动画效果
 */
interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'forward' | 'backward';
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 'forward',
  className = ''
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * 错误提示动画
 * 为错误信息的显示提供注意力吸引动画
 */
interface AnimatedErrorProps {
  show: boolean;
  message: string;
  className?: string;
}

export const AnimatedError: React.FC<AnimatedErrorProps> = ({
  show,
  message,
  className = ''
}) => {
  if (!show) return null;

  return (
    <div className={`text-red-600 text-sm mt-1 ${className}`}>
      {message}
    </div>
  );
};

export default AnimatedSection;

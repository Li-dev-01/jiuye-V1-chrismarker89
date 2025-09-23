/**
 * 滑动浏览组件
 * 支持触摸滑动和键盘导航的全屏内容浏览器
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Progress, Space } from 'antd';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
  DislikeOutlined,
  DislikeFilled,
  DownloadOutlined,
  FlagOutlined,
  StarOutlined
} from '@ant-design/icons';
// 通用内容项接口
interface ContentItem {
  id: number;
  content?: string;
  title?: string;
  likeCount: number;
  [key: string]: any;
}
// import VoiceContent from './VoiceContent';
// import StoryContent from './StoryContent';
import styles from './SwipeViewer.module.css';

// 内容清理函数 - 移除分类标识符
const cleanContent = (content: string): string => {
  if (!content) return '';

  // 移除开头的分类标识符，如 [reflection]、[gratitude]、[suggestion] 等
  const cleaned = content.replace(/^\[[\w_]+\]\s*/, '');

  return cleaned.trim();
};

export interface SwipeViewerProps {
  visible: boolean;
  onClose: () => void;
  items: Array<ContentItem>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onLike: (item: ContentItem) => void;
  onDislike?: (item: ContentItem) => void;
  onDownload?: (item: ContentItem) => void;
  onFavorite?: (item: ContentItem) => void;
  onReport?: (item: ContentItem) => void;
  contentType: 'voice' | 'story';
  hasMore?: boolean;
  onLoadMore?: () => void;
  userLikes?: Set<number>; // 用户已点赞的内容ID集合
  userDislikes?: Set<number>; // 用户已踩的内容ID集合
  userFavorites?: Set<number>; // 用户已收藏的内容ID集合
}

export const SwipeViewer: React.FC<SwipeViewerProps> = ({
  visible,
  onClose,
  items,
  currentIndex,
  onIndexChange,
  onLike,
  onDislike,
  onDownload,
  onFavorite,
  onReport,
  contentType,
  hasMore = false,
  onLoadMore,
  userLikes = new Set(),
  userDislikes = new Set(),
  userFavorites = new Set()
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 最小滑动距离
  const minSwipeDistance = 50;

  // 当前项目
  const currentItem = items[currentIndex];

  // 键盘导航
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!visible) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (isTransitioning || currentIndex <= 0) return;
        setIsTransitioning(true);
        onIndexChange(currentIndex - 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (isTransitioning) return;
        if (currentIndex >= items.length - 1) {
          if (hasMore && onLoadMore) {
            onLoadMore();
          }
          return;
        }
        setIsTransitioning(true);
        onIndexChange(currentIndex + 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }, [visible, isTransitioning, currentIndex, items.length, hasMore, onLoadMore, onIndexChange, onClose]);

  // 上一个
  const handlePrevious = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    onIndexChange(currentIndex - 1);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentIndex, onIndexChange]);

  // 下一个
  const handleNext = useCallback(() => {
    if (isTransitioning) return;

    if (currentIndex >= items.length - 1) {
      if (hasMore && onLoadMore) {
        onLoadMore();
      }
      return;
    }

    setIsTransitioning(true);
    onIndexChange(currentIndex + 1);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentIndex, items.length, hasMore, onLoadMore, onIndexChange]);

  // 绑定键盘事件
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [visible, handleKeyDown]);

  // 触摸开始
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // 触摸移动
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // 触摸结束
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // 点赞处理
  const handleLikeClick = () => {
    if (currentItem) {
      onLike(currentItem);
    }
  };

  // 踩处理
  const handleDislikeClick = () => {
    if (currentItem && onDislike) {
      onDislike(currentItem);
    }
  };

  // 下载处理
  const handleDownloadClick = () => {
    if (currentItem && onDownload) {
      onDownload(currentItem);
    }
  };

  // 收藏处理
  const handleFavoriteClick = () => {
    if (currentItem && onFavorite) {
      onFavorite(currentItem);
    }
  };

  // 举报处理
  const handleReportClick = () => {
    if (currentItem && onReport) {
      onReport(currentItem);
    }
  };

  // 进度计算
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;

  // 检查用户状态
  const isLiked = currentItem ? userLikes.has(currentItem.id) : false;
  const isDisliked = currentItem ? userDislikes.has(currentItem.id) : false;
  const isFavorited = currentItem ? userFavorites.has(currentItem.id) : false;

  if (!visible || !currentItem) {
    return null;
  }

  return (
    <div className={styles.swipeViewer}>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div 
        className={styles.container}
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 顶部控制栏 */}
        <div className={styles.topBar}>
          <div className={styles.progressContainer}>
            <Progress 
              percent={progress} 
              showInfo={false}
              strokeColor="#1890ff"
              trailColor="rgba(255, 255, 255, 0.3)"
            />
            <span className={styles.progressText}>
              {currentIndex + 1} / {items.length}
            </span>
          </div>
          
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className={styles.closeButton}
          />
        </div>

        {/* 内容区域 */}
        <div className={styles.contentArea}>
          {/* 左侧导航按钮 */}
          {currentIndex > 0 && (
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              className={`${styles.navButton} ${styles.prevButton}`}
              disabled={isTransitioning}
            />
          )}

          {/* 主要内容 */}
          <div className={styles.mainContent}>
            <div className={styles.contentDisplay}>
              <div className={styles.contentCard}>
                <h3>{cleanContent(currentItem.title || '内容详情')}</h3>
                <p>{cleanContent(currentItem.content || '')}</p>
                <div className={styles.contentMeta}>
                  <span>💝 {currentItem.likeCount} 人点赞</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧导航按钮 */}
          {(currentIndex < items.length - 1 || hasMore) && (
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={handleNext}
              className={`${styles.navButton} ${styles.nextButton}`}
              disabled={isTransitioning}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className={styles.bottomBar}>
          <Space size="large">
            {/* 点赞按钮 */}
            <Button
              type="text"
              icon={isLiked ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleLikeClick}
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            >
              {currentItem.likeCount || 0}
            </Button>

            {/* 踩按钮 */}
            <Button
              type="text"
              icon={isDisliked ? <DislikeFilled /> : <DislikeOutlined />}
              onClick={handleDislikeClick}
              className={`${styles.actionButton} ${isDisliked ? styles.disliked : ''}`}
            >
              {currentItem.dislikeCount || 0}
            </Button>

            {/* 下载按钮 */}
            {onDownload && (
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownloadClick}
                className={styles.actionButton}
              >
                下载
              </Button>
            )}

            {/* 收藏按钮 */}
            {onFavorite && (
              <Button
                type="text"
                icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <StarOutlined />}
                onClick={handleFavoriteClick}
                className={`${styles.actionButton} ${isFavorited ? styles.favorited : ''}`}
              >
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
            )}

            {/* 举报按钮 */}
            {onReport && (
              <Button
                type="text"
                icon={<FlagOutlined />}
                onClick={handleReportClick}
                className={styles.actionButton}
              >
                举报
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default SwipeViewer;

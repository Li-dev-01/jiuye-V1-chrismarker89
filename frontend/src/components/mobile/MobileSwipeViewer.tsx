/**
 * 移动端专用滑动浏览器
 * 针对移动端优化的故事浏览体验
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Progress, Space, Spin, message } from 'antd';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
  DislikeOutlined,
  DislikeFilled,
  DownloadOutlined,
  StarOutlined,
  StarFilled,
  LoadingOutlined
} from '@ant-design/icons';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import styles from './MobileSwipeViewer.module.css';

interface ContentItem {
  id: number;
  content?: string;
  title?: string;
  likeCount: number;
  [key: string]: any;
}

interface MobileSwipeViewerProps {
  visible: boolean;
  onClose: () => void;
  items: Array<ContentItem>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onLike: (item: ContentItem) => void;
  onDislike?: (item: ContentItem) => void;
  onDownload?: (item: ContentItem) => void;
  onFavorite?: (item: ContentItem) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  userLikes?: Set<number>;
  userDislikes?: Set<number>;
  userFavorites?: Set<number>;
}

export const MobileSwipeViewer: React.FC<MobileSwipeViewerProps> = ({
  visible,
  onClose,
  items,
  currentIndex,
  onIndexChange,
  onLike,
  onDislike,
  onDownload,
  onFavorite,
  hasMore = false,
  onLoadMore,
  userLikes = new Set(),
  userDislikes = new Set(),
  userFavorites = new Set()
}) => {
  const { isMobile, safeAreaInsets } = useMobileDetection();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];
  const isLiked = userLikes.has(currentItem?.id);
  const isDisliked = userDislikes.has(currentItem?.id);
  const isFavorited = userFavorites.has(currentItem?.id);

  // 最小滑动距离
  const minSwipeDistance = 50;

  // 预加载阈值：当浏览到80%位置时触发预加载
  const PRELOAD_THRESHOLD = 0.8;

  // 触摸事件处理
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < items.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
    }
  };

  // 导航处理
  const handlePrevious = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    onIndexChange(currentIndex - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    if (currentIndex >= items.length - 1) {
      if (hasMore && onLoadMore) {
        setIsLoadingMore(true);
        onLoadMore();
      }
      return;
    }
    
    setIsTransitioning(true);
    onIndexChange(currentIndex + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex, items.length, hasMore, onLoadMore, onIndexChange]);

  // 操作处理
  const handleLike = () => {
    onLike(currentItem);
    // 触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDislike = () => {
    if (onDislike) {
      onDislike(currentItem);
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(currentItem);
      message.success(isFavorited ? '已取消收藏' : '已收藏');
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentItem);
      message.success('开始下载');
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!visible) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, handlePrevious, handleNext, onClose]);

  // 自动隐藏操作栏 - 延长显示时间
  useEffect(() => {
    if (!isMobile) return;

    // 延长到8秒，给用户更多时间操作
    const timer = setTimeout(() => {
      setShowActions(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentIndex, isMobile]);

  // 预加载逻辑：当浏览到80%位置时自动加载下一批
  useEffect(() => {
    if (!visible || !hasMore || !onLoadMore || isLoadingMore) return;

    const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;

    // 当浏览进度达到80%时，触发预加载
    if (progress >= PRELOAD_THRESHOLD) {
      console.log(`📱 移动端预加载触发: 当前进度 ${(progress * 100).toFixed(1)}% (${currentIndex + 1}/${items.length})`);
      setIsLoadingMore(true);

      // 调用加载更多
      onLoadMore();

      // 设置一个超时，防止重复触发
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 2000);
    }
  }, [currentIndex, items.length, visible, hasMore, onLoadMore, isLoadingMore, PRELOAD_THRESHOLD]);

  // 点击显示操作栏
  const handleContentClick = () => {
    if (isMobile) {
      setShowActions(true);
      // 重新启动自动隐藏计时器
      setTimeout(() => {
        setShowActions(false);
      }, 8000);
    }
  };

  if (!visible || !currentItem) return null;

  const progress = Math.round(((currentIndex + 1) / items.length) * 100);

  return (
    <div className={styles.overlay}>
      <div
        ref={containerRef}
        className={styles.container}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 顶部状态栏 */}
        <div className={`${styles.topBar} ${showActions ? styles.visible : styles.hidden}`}>
          <div className={styles.progressContainer}>
            <Progress
              percent={progress}
              showInfo={false}
              strokeColor="#1890ff"
              trailColor="rgba(255, 255, 255, 0.3)"
            />
            <span className={styles.progressText}>
              {currentIndex + 1} / {items.length}
              {hasMore && (
                <span className={styles.moreIndicator}>
                  {isLoadingMore ? ' (加载中...)' : ' (还有更多)'}
                </span>
              )}
            </span>
          </div>

          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className={styles.closeButton}
            title="关闭 (ESC)"
          />
        </div>

        {/* 顶部操作栏 */}
        <div className={`${styles.topActionBar} ${showActions ? styles.visible : styles.hidden}`}>
          <Space size="small" className={styles.topActionSpace}>
            {/* 左右导航箭头 */}
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`${styles.topActionButton} ${styles.navButton}`}
              title="上一个 (←)"
            />

            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1 && !hasMore}
              className={`${styles.topActionButton} ${styles.navButton}`}
              title="下一个 (→)"
            />
            <Button
              type="text"
              icon={isLiked ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleLike}
              className={`${styles.topActionButton} ${isLiked ? styles.liked : ''}`}
            >
              {currentItem.likeCount || 0}
            </Button>

            {onDislike && (
              <Button
                type="text"
                icon={isDisliked ? <DislikeFilled /> : <DislikeOutlined />}
                onClick={handleDislike}
                className={`${styles.topActionButton} ${isDisliked ? styles.disliked : ''}`}
              />
            )}

            {onFavorite && (
              <Button
                type="text"
                icon={isFavorited ? <StarFilled /> : <StarOutlined />}
                onClick={handleFavorite}
                className={`${styles.topActionButton} ${isFavorited ? styles.favorited : ''}`}
              />
            )}

            {onDownload && (
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className={styles.topActionButton}
              />
            )}
          </Space>
        </div>

        {/* 内容区域 */}
        <div className={styles.contentArea} onClick={handleContentClick}>
          <div className={styles.contentCard}>
            <h3>{currentItem.title || '内容详情'}</h3>
            <p>{currentItem.content || ''}</p>
            <div className={styles.contentMeta}>
              <span>💝 {currentItem.likeCount} 人点赞</span>
            </div>
          </div>
        </div>



        {/* 加载提示 */}
        {isLoadingMore && (
          <div className={styles.loadingOverlay}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1890ff' }} spin />}
              tip="正在加载更多内容..."
            />
          </div>
        )}

        {/* 操作提示 */}
        <div className={styles.hintText}>
          点击屏幕显示操作 | 左右滑动切换
        </div>
      </div>
    </div>
  );
};

export default MobileSwipeViewer;

/**
 * 移动端检测和适配Hook
 * 提供移动端设备检测、屏幕尺寸监听等功能
 */

import { useState, useEffect, useCallback } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchSupported: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  viewportHeight: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// 断点定义
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
} as const;

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // 初始化时的默认值
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200,
        screenHeight: 800,
        orientation: 'landscape',
        deviceType: 'desktop',
        touchSupported: false,
        isIOS: false,
        isAndroid: false,
        viewportHeight: 800,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
      };
    }

    return getDetectionResult();
  });

  // 获取检测结果
  function getDetectionResult(): MobileDetectionResult {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 设备类型检测
    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.tablet;
    
    // 操作系统检测
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // 触摸支持检测
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 屏幕方向
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // 设备类型
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    
    // 视口高度（考虑移动端浏览器地址栏）
    const viewportHeight = window.visualViewport?.height || height;
    
    // 安全区域（主要用于iPhone X+）
    const safeAreaInsets = {
      top: getSafeAreaInset('top'),
      bottom: getSafeAreaInset('bottom'),
      left: getSafeAreaInset('left'),
      right: getSafeAreaInset('right')
    };

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation,
      deviceType,
      touchSupported,
      isIOS,
      isAndroid,
      viewportHeight,
      safeAreaInsets
    };
  }

  // 获取安全区域边距
  function getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    if (typeof window === 'undefined') return 0;
    
    const style = getComputedStyle(document.documentElement);
    const value = style.getPropertyValue(`env(safe-area-inset-${side})`);
    
    if (value) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
    }
    
    return 0;
  }

  // 更新检测结果
  const updateDetection = useCallback(() => {
    setDetection(getDetectionResult());
  }, []);

  // 防抖的更新函数
  const debouncedUpdate = useCallback(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFn = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(updateDetection, 150);
    };

    return debouncedFn;
  }, [updateDetection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const debouncedUpdateFn = debouncedUpdate();

    // 监听窗口大小变化
    window.addEventListener('resize', debouncedUpdateFn);
    
    // 监听屏幕方向变化
    window.addEventListener('orientationchange', debouncedUpdateFn);
    
    // 监听视口变化（移动端浏览器地址栏显示/隐藏）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdateFn);
    }

    // 初始更新
    updateDetection();

    return () => {
      window.removeEventListener('resize', debouncedUpdateFn);
      window.removeEventListener('orientationchange', debouncedUpdateFn);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdateFn);
      }
    };
  }, [debouncedUpdate, updateDetection]);

  return detection;
};

// 移动端优化Hook
export const useMobileOptimization = () => {
  const detection = useMobileDetection();

  // 禁用移动端缩放
  useEffect(() => {
    if (!detection.isMobile) return;

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    return () => {
      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, viewport-fit=cover'
        );
      }
    };
  }, [detection.isMobile]);

  // 移动端性能优化
  useEffect(() => {
    if (!detection.isMobile) return;

    // 禁用移动端动画以提升性能
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [detection.isMobile]);

  // 移动端触摸优化
  useEffect(() => {
    if (!detection.touchSupported) return;

    // 禁用双击缩放
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, [detection.touchSupported]);

  return {
    ...detection,
    // 工具函数
    isSmallScreen: detection.screenWidth < 375,
    isLargeScreen: detection.screenWidth > 414,
    shouldUseCompactLayout: detection.isMobile && detection.screenWidth < 375,
    shouldShowBottomNav: detection.isMobile,
    shouldUseSingleColumn: detection.isMobile,
    optimalImageSize: detection.isMobile ? 'small' : 'large',
    recommendedPageSize: detection.isMobile ? 10 : 20
  };
};

// 移动端手势Hook
export const useMobileGestures = () => {
  const [gestureState, setGestureState] = useState({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    swipeDistance: 0,
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setGestureState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      isSwipeLeft: false,
      isSwipeRight: false,
      isSwipeUp: false,
      isSwipeDown: false,
      swipeDirection: null
    }));
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - (gestureState as any).startX;
    const deltaY = touch.clientY - (gestureState as any).startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 50) { // 最小滑动距离
      const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI;
      
      if (angle < 45) { // 水平滑动
        if (deltaX > 0) {
          setGestureState(prev => ({ ...prev, isSwipeRight: true, swipeDirection: 'right', swipeDistance: distance }));
        } else {
          setGestureState(prev => ({ ...prev, isSwipeLeft: true, swipeDirection: 'left', swipeDistance: distance }));
        }
      } else { // 垂直滑动
        if (deltaY > 0) {
          setGestureState(prev => ({ ...prev, isSwipeDown: true, swipeDirection: 'down', swipeDistance: distance }));
        } else {
          setGestureState(prev => ({ ...prev, isSwipeUp: true, swipeDirection: 'up', swipeDistance: distance }));
        }
      }
    }
  }, [gestureState]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return gestureState;
};

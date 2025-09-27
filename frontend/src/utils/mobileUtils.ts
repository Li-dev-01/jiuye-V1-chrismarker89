/**
 * 移动端工具函数
 * 提供简单的移动端检测和优化功能，避免复杂的Hook导致的问题
 */

// 简单的移动端检测
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 检查屏幕宽度
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) return true;
  
  // 检查用户代理
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

// 检查是否为触摸设备
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 获取屏幕尺寸信息
export const getScreenInfo = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1200,
      height: 800,
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
};

// 优化移动端输入体验
export const optimizeMobileInput = () => {
  if (typeof document === 'undefined') return;
  
  // 确保输入框字体大小至少16px，防止iOS缩放
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    const element = input as HTMLElement;
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);
    
    if (fontSize < 16) {
      element.style.fontSize = '16px';
    }
  });
};

// 禁用移动端双击缩放
export const disableMobileZoom = () => {
  if (typeof document === 'undefined') return;
  
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
};

// 设置移动端视口
export const setMobileViewport = () => {
  if (typeof document === 'undefined') return;
  
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  if (isMobileDevice()) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  } else {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, viewport-fit=cover'
    );
  }
};

// 添加移动端CSS类
export const addMobileClasses = () => {
  if (typeof document === 'undefined') return;
  
  const { isMobile, isTablet, isDesktop } = getScreenInfo();
  const body = document.body;
  
  // 移除现有的设备类
  body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
  
  // 添加当前设备类
  if (isMobile) {
    body.classList.add('mobile-device');
  } else if (isTablet) {
    body.classList.add('tablet-device');
  } else {
    body.classList.add('desktop-device');
  }
  
  // 添加触摸设备类
  if (isTouchDevice()) {
    body.classList.add('touch-device');
  } else {
    body.classList.add('no-touch-device');
  }
};

// 移动端性能优化
export const optimizeMobilePerformance = () => {
  if (typeof document === 'undefined') return;
  
  if (!isMobileDevice()) return;
  
  // 减少动画以提升性能
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      *, *::before, *::after {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      /* 优化滚动性能 */
      * {
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }
      
      /* 减少重绘 */
      .mobile-optimized {
        transform: translateZ(0);
        will-change: transform;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  return () => {
    document.head.removeChild(style);
  };
};

// 初始化移动端优化
export const initMobileOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // 设置视口
  setMobileViewport();
  
  // 添加设备类
  addMobileClasses();
  
  // 优化输入体验
  optimizeMobileInput();
  
  // 禁用缩放
  const cleanupZoom = disableMobileZoom();
  
  // 性能优化
  const cleanupPerformance = optimizeMobilePerformance();
  
  // 监听窗口大小变化
  const handleResize = () => {
    addMobileClasses();
    optimizeMobileInput();
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // 返回清理函数
  return () => {
    if (cleanupZoom) cleanupZoom();
    if (cleanupPerformance) cleanupPerformance();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
};

// React Hook 简化版本
export const useMobileDetection = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenWidth: 1200,
      screenHeight: 800
    };
  }
  
  const screenInfo = getScreenInfo();
  
  return {
    isMobile: screenInfo.isMobile,
    isTablet: screenInfo.isTablet,
    isDesktop: screenInfo.isDesktop,
    isTouchDevice: isTouchDevice(),
    screenWidth: screenInfo.width,
    screenHeight: screenInfo.height
  };
};

// 移动端样式工具
export const getMobileStyles = () => {
  const { isMobile, isTablet } = getScreenInfo();
  
  return {
    // 按钮样式
    button: {
      minHeight: isMobile ? '48px' : '32px',
      minWidth: isMobile ? '48px' : 'auto',
      fontSize: isMobile ? '16px' : '14px',
      padding: isMobile ? '12px 16px' : '8px 12px'
    },
    
    // 输入框样式
    input: {
      fontSize: isMobile ? '16px' : '14px',
      minHeight: isMobile ? '48px' : '32px',
      padding: isMobile ? '12px 16px' : '8px 12px'
    },
    
    // 卡片样式
    card: {
      padding: isMobile ? '16px' : '24px',
      borderRadius: isMobile ? '12px' : '8px',
      margin: isMobile ? '8px' : '16px'
    },
    
    // 间距
    spacing: {
      small: isMobile ? '8px' : '4px',
      medium: isMobile ? '16px' : '8px',
      large: isMobile ? '24px' : '16px'
    }
  };
};

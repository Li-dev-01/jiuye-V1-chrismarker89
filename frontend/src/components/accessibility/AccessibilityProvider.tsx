import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceToScreenReader: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true
  });

  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // 创建屏幕阅读器公告元素
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    // 检测用户偏好设置
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }

    // 加载保存的设置
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // 键盘导航支持
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab 键导航
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
      
      // Escape 键关闭模态框
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.ant-modal');
        if (modals.length > 0) {
          const closeButton = modals[modals.length - 1].querySelector('.ant-modal-close') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  useEffect(() => {
    // 应用无障碍设置到 DOM
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // 保存设置
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // 通知用户设置已更改
    const settingNames = {
      highContrast: '高对比度',
      largeText: '大字体',
      reducedMotion: '减少动画',
      screenReader: '屏幕阅读器',
      keyboardNavigation: '键盘导航'
    };
    
    message.success(`${settingNames[key]}已${value ? '启用' : '禁用'}`);
  };

  const announceToScreenReader = (text: string) => {
    if (announcer && settings.screenReader) {
      announcer.textContent = text;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announceToScreenReader }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// 无障碍快捷键组件
export const AccessibilityShortcuts: React.FC = () => {
  const { settings, updateSetting } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + H: 切换高对比度
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        updateSetting('highContrast', !settings.highContrast);
      }
      
      // Alt + L: 切换大字体
      if (event.altKey && event.key === 'l') {
        event.preventDefault();
        updateSetting('largeText', !settings.largeText);
      }
      
      // Alt + M: 切换减少动画
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        updateSetting('reducedMotion', !settings.reducedMotion);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings, updateSetting]);

  return null;
};

// 跳转到主内容的链接
export const SkipToContent: React.FC = () => (
  <a
    href="#main-content"
    className="skip-to-content"
    style={{
      position: 'absolute',
      top: '-40px',
      left: '6px',
      background: '#000',
      color: '#fff',
      padding: '8px',
      textDecoration: 'none',
      zIndex: 1000,
      borderRadius: '4px'
    }}
    onFocus={(e) => {
      e.currentTarget.style.top = '6px';
    }}
    onBlur={(e) => {
      e.currentTarget.style.top = '-40px';
    }}
  >
    跳转到主内容
  </a>
);

// 焦点管理 Hook
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const trapFocus = (containerSelector: string) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { focusElement, trapFocus };
};

// ARIA 标签 Hook
export const useAriaLabels = () => {
  const getAriaLabel = (key: string, defaultLabel: string) => {
    // 这里可以集成国际化
    return defaultLabel;
  };

  const getAriaDescription = (key: string, defaultDescription: string) => {
    return defaultDescription;
  };

  return { getAriaLabel, getAriaDescription };
};

export default AccessibilityProvider;

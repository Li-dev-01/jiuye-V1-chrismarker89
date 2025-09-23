/**
 * 键盘快捷键自定义Hook
 * 为快速审核提供全键盘操作支持
 */

import { useEffect, useCallback, useRef } from 'react';
import type { QuickReviewShortcut } from '../types/quickReview.types';

interface KeyboardActions {
  onApprove?: () => void;
  onReject?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onUndo?: () => void;
  onHelp?: () => void;
  onExit?: () => void;
  onRequestBatch?: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

interface UseKeyboardShortcutsReturn {
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  isEnabled: boolean;
}

// 默认快捷键配置
const DEFAULT_SHORTCUTS: QuickReviewShortcut[] = [
  // 审核操作
  { key: 'a', action: 'approve', description: '批准当前内容', category: 'review' },
  { key: 'ArrowUp', action: 'approve', description: '批准当前内容', category: 'review' },
  { key: 'r', action: 'reject', description: '拒绝当前内容', category: 'review' },
  { key: 'ArrowDown', action: 'reject', description: '拒绝当前内容', category: 'review' },
  { key: 's', action: 'skip', description: '跳过当前内容', category: 'review' },
  
  // 导航操作
  { key: 'n', action: 'next', description: '下一个内容', category: 'navigation' },
  { key: 'ArrowRight', action: 'next', description: '下一个内容', category: 'navigation' },
  { key: 'p', action: 'previous', description: '上一个内容', category: 'navigation' },
  { key: 'ArrowLeft', action: 'previous', description: '上一个内容', category: 'navigation' },
  
  // 系统操作
  { key: 'z', action: 'undo', description: '撤销上一个操作', category: 'system' },
  { key: 'h', action: 'help', description: '显示帮助', category: 'system' },
  { key: 'Escape', action: 'exit', description: '退出快速审核', category: 'system' },
  { key: 'F5', action: 'requestBatch', description: '申请新批次', category: 'system' },
];

export const useKeyboardShortcuts = (
  actions: KeyboardActions,
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true
  } = options;

  const isEnabledRef = useRef(enabled);
  const actionsRef = useRef(actions);

  // 更新引用
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabledRef.current) return;

    // 检查是否在输入框中
    const activeElement = document.activeElement;
    const isInInput = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );

    // 在输入框中时，只处理特殊快捷键
    if (isInInput && !['Escape', 'F5'].includes(event.key)) {
      return;
    }

    // 查找匹配的快捷键
    const shortcut = DEFAULT_SHORTCUTS.find(s => s.key === event.key);
    if (!shortcut) return;

    // 阻止默认行为
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }

    // 执行对应的动作
    const currentActions = actionsRef.current;
    switch (shortcut.action) {
      case 'approve':
        currentActions.onApprove?.();
        break;
      case 'reject':
        currentActions.onReject?.();
        break;
      case 'skip':
        currentActions.onSkip?.();
        break;
      case 'next':
        currentActions.onNext?.();
        break;
      case 'previous':
        currentActions.onPrevious?.();
        break;
      case 'undo':
        currentActions.onUndo?.();
        break;
      case 'help':
        currentActions.onHelp?.();
        break;
      case 'exit':
        currentActions.onExit?.();
        break;
      case 'requestBatch':
        currentActions.onRequestBatch?.();
        break;
      default:
        console.warn(`未知的快捷键动作: ${shortcut.action}`);
    }
  }, [preventDefault, stopPropagation]);

  // 启用快捷键
  const enableShortcuts = useCallback(() => {
    isEnabledRef.current = true;
    document.addEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // 禁用快捷键
  const disableShortcuts = useCallback(() => {
    isEnabledRef.current = false;
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // 组件挂载时启用快捷键
  useEffect(() => {
    if (enabled) {
      enableShortcuts();
    }

    // 组件卸载时清理
    return () => {
      disableShortcuts();
    };
  }, [enabled, enableShortcuts, disableShortcuts]);

  return {
    enableShortcuts,
    disableShortcuts,
    isEnabled: isEnabledRef.current
  };
};

// 导出默认快捷键配置供其他组件使用
export { DEFAULT_SHORTCUTS };

// 快捷键帮助信息格式化
export const formatShortcutHelp = (shortcuts: QuickReviewShortcut[] = DEFAULT_SHORTCUTS) => {
  const categories = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, QuickReviewShortcut[]>);

  return categories;
};

// 快捷键显示名称映射
export const getKeyDisplayName = (key: string): string => {
  const keyMap: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    ' ': 'Space'
  };

  return keyMap[key] || key.toUpperCase();
};

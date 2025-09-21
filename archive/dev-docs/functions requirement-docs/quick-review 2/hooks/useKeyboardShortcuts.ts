/**
 * 键盘快捷键自定义Hook
 * 
 * 功能特性：
 * - 全局快捷键监听
 * - 快捷键冲突检测
 * - 上下文感知快捷键
 * - 快捷键统计分析
 * - 自定义快捷键配置
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { KeyboardShortcut, KeyboardStats, KeyboardContext } from '../types/keyboard.types';

interface KeyboardActions {
  [key: string]: () => void | Promise<void>;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  caseSensitive?: boolean;
  context?: KeyboardContext;
  enableStats?: boolean;
  onKeyPress?: (key: string, action: string) => void;
  onError?: (error: Error) => void;
}

interface UseKeyboardShortcutsReturn {
  enableShortcuts: () => void;
  disableShortcuts: () => void;
  isEnabled: boolean;
  stats: KeyboardStats;
  updateShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  addShortcut: (shortcut: KeyboardShortcut, action: () => void) => void;
  removeShortcut: (key: string) => void;
  clearStats: () => void;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  actions: KeyboardActions,
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn => {
  const {
    enabled = true,
    preventDefault = true,
    caseSensitive = false,
    context = 'global',
    enableStats = true,
    onKeyPress,
    onError
  } = options;

  // 状态管理
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [currentShortcuts, setCurrentShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const [stats, setStats] = useState<KeyboardStats>({
    totalKeyPresses: 0,
    keyUsage: {},
    averageResponseTime: 0,
    fastestResponseTime: Infinity,
    slowestResponseTime: 0,
    errorRate: 0,
    keyboardUsageRate: 0,
    sessionStartTime: Date.now(),
    lastKeyPress: 0
  });

  // 引用
  const keyMapRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const actionMapRef = useRef<Map<string, () => void>>(new Map());
  const pressTimeRef = useRef<number>(0);
  const totalActionsRef = useRef<number>(0);
  const keyboardActionsRef = useRef<number>(0);

  // 构建快捷键映射
  const buildKeyMap = useCallback(() => {
    const keyMap = new Map<string, KeyboardShortcut>();
    const actionMap = new Map<string, () => void>();

    currentShortcuts.forEach(shortcut => {
      const normalizedKey = normalizeKey(shortcut.key, caseSensitive);
      keyMap.set(normalizedKey, shortcut);
      
      const action = actions[shortcut.action];
      if (action) {
        actionMap.set(normalizedKey, action);
      }
    });

    keyMapRef.current = keyMap;
    actionMapRef.current = actionMap;

    console.log(`构建快捷键映射: ${keyMap.size} 个快捷键`);
  }, [currentShortcuts, actions, caseSensitive]);

  // 标准化快捷键
  const normalizeKey = useCallback((key: string, caseSensitive: boolean) => {
    let normalized = key;
    
    // 处理特殊键名
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete'
    };

    if (keyMap[key]) {
      normalized = keyMap[key];
    }

    // 处理大小写
    if (!caseSensitive && normalized.length === 1) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }, []);

  // 检查是否为组合键
  const isModifierKey = (event: KeyboardEvent) => {
    return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  };

  // 构建组合键字符串
  const buildComboKey = (event: KeyboardEvent) => {
    const modifiers: string[] = [];
    
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Meta');

    const key = normalizeKey(event.key, caseSensitive);
    
    if (modifiers.length > 0) {
      return `${modifiers.join('+')}+${key}`;
    }
    
    return key;
  };

  // 检查上下文是否匹配
  const isContextMatch = (targetContext: KeyboardContext) => {
    if (context === 'global') return true;
    if (targetContext === 'global') return true;
    return context === targetContext;
  };

  // 更新统计信息
  const updateStats = useCallback((key: string, action: string, responseTime: number, success: boolean) => {
    if (!enableStats) return;

    setStats(prev => {
      const newStats = { ...prev };
      
      // 更新总按键次数
      newStats.totalKeyPresses += 1;
      newStats.lastKeyPress = Date.now();
      
      // 更新按键使用统计
      if (!newStats.keyUsage[action]) {
        newStats.keyUsage[action] = {
          count: 0,
          lastUsed: 0,
          averageTime: 0,
          totalTime: 0
        };
      }
      
      const usage = newStats.keyUsage[action];
      usage.count += 1;
      usage.lastUsed = Date.now();
      usage.totalTime += responseTime;
      usage.averageTime = usage.totalTime / usage.count;
      
      // 更新响应时间统计
      newStats.averageResponseTime = (
        (newStats.averageResponseTime * (newStats.totalKeyPresses - 1) + responseTime) /
        newStats.totalKeyPresses
      );
      
      if (responseTime < newStats.fastestResponseTime) {
        newStats.fastestResponseTime = responseTime;
      }
      
      if (responseTime > newStats.slowestResponseTime) {
        newStats.slowestResponseTime = responseTime;
      }
      
      // 更新错误率
      if (!success) {
        const errorCount = Math.round(newStats.errorRate * newStats.totalKeyPresses);
        newStats.errorRate = (errorCount + 1) / newStats.totalKeyPresses;
      }
      
      // 更新键盘使用率
      keyboardActionsRef.current += 1;
      totalActionsRef.current += 1;
      newStats.keyboardUsageRate = keyboardActionsRef.current / totalActionsRef.current;
      
      return newStats;
    });
  }, [enableStats]);

  // 键盘事件处理器
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!isEnabled) return;

    const startTime = Date.now();
    pressTimeRef.current = startTime;

    try {
      // 构建按键字符串
      const keyString = buildComboKey(event);
      const shortcut = keyMapRef.current.get(keyString);
      
      if (!shortcut) {
        // 记录未匹配的按键（用于统计）
        totalActionsRef.current += 1;
        return;
      }

      // 检查上下文
      if (!isContextMatch(shortcut.context || 'global')) {
        return;
      }

      // 阻止默认行为
      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      // 获取对应的动作
      const action = actionMapRef.current.get(keyString);
      if (!action) {
        console.warn(`快捷键 ${keyString} 没有对应的动作`);
        return;
      }

      // 触发回调
      onKeyPress?.(keyString, shortcut.action);

      // 执行动作
      await action();

      // 更新统计
      const responseTime = Date.now() - startTime;
      updateStats(keyString, shortcut.action, responseTime, true);

      console.log(`快捷键执行: ${keyString} -> ${shortcut.action} (${responseTime}ms)`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error('快捷键执行失败');
      
      console.error('快捷键执行失败:', errorObj);
      
      // 更新错误统计
      updateStats('unknown', 'error', responseTime, false);
      
      // 触发错误回调
      onError?.(errorObj);
    }
  }, [isEnabled, preventDefault, onKeyPress, onError, updateStats, buildComboKey, isContextMatch]);

  // 启用快捷键
  const enableShortcuts = useCallback(() => {
    if (isEnabled) return;
    
    setIsEnabled(true);
    document.addEventListener('keydown', handleKeyDown, true);
    console.log('快捷键已启用');
  }, [isEnabled, handleKeyDown]);

  // 禁用快捷键
  const disableShortcuts = useCallback(() => {
    if (!isEnabled) return;
    
    setIsEnabled(false);
    document.removeEventListener('keydown', handleKeyDown, true);
    console.log('快捷键已禁用');
  }, [isEnabled, handleKeyDown]);

  // 更新快捷键配置
  const updateShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    setCurrentShortcuts(newShortcuts);
    console.log(`快捷键配置已更新: ${newShortcuts.length} 个快捷键`);
  }, []);

  // 添加单个快捷键
  const addShortcut = useCallback((shortcut: KeyboardShortcut, action: () => void) => {
    setCurrentShortcuts(prev => {
      // 检查是否已存在
      const exists = prev.some(s => s.key === shortcut.key);
      if (exists) {
        console.warn(`快捷键 ${shortcut.key} 已存在`);
        return prev;
      }
      
      return [...prev, shortcut];
    });

    // 直接添加到动作映射
    const normalizedKey = normalizeKey(shortcut.key, caseSensitive);
    actionMapRef.current.set(normalizedKey, action);
    
    console.log(`添加快捷键: ${shortcut.key} -> ${shortcut.action}`);
  }, [normalizeKey, caseSensitive]);

  // 移除快捷键
  const removeShortcut = useCallback((key: string) => {
    setCurrentShortcuts(prev => prev.filter(s => s.key !== key));
    
    const normalizedKey = normalizeKey(key, caseSensitive);
    keyMapRef.current.delete(normalizedKey);
    actionMapRef.current.delete(normalizedKey);
    
    console.log(`移除快捷键: ${key}`);
  }, [normalizeKey, caseSensitive]);

  // 清空统计
  const clearStats = useCallback(() => {
    setStats({
      totalKeyPresses: 0,
      keyUsage: {},
      averageResponseTime: 0,
      fastestResponseTime: Infinity,
      slowestResponseTime: 0,
      errorRate: 0,
      keyboardUsageRate: 0,
      sessionStartTime: Date.now(),
      lastKeyPress: 0
    });
    
    keyboardActionsRef.current = 0;
    totalActionsRef.current = 0;
    
    console.log('快捷键统计已清空');
  }, []);

  // 构建快捷键映射
  useEffect(() => {
    buildKeyMap();
  }, [buildKeyMap]);

  // 初始化时启用快捷键
  useEffect(() => {
    if (enabled) {
      enableShortcuts();
    }
    
    return () => {
      disableShortcuts();
    };
  }, [enabled, enableShortcuts, disableShortcuts]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时禁用快捷键
        disableShortcuts();
      } else {
        // 页面显示时重新启用快捷键
        if (enabled) {
          enableShortcuts();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, enableShortcuts, disableShortcuts]);

  return {
    enableShortcuts,
    disableShortcuts,
    isEnabled,
    stats,
    updateShortcuts,
    addShortcut,
    removeShortcut,
    clearStats
  };
};

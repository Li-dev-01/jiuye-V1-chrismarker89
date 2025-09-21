/**
 * 键盘快捷键相关类型定义
 */

// 键盘上下文类型
export type KeyboardContext = 'global' | 'dialog' | 'form' | 'list' | 'editor' | 'review';

// 快捷键动作类型
export type KeyboardAction = 
  | 'approve' 
  | 'reject' 
  | 'skip' 
  | 'flag'
  | 'next' 
  | 'previous' 
  | 'first' 
  | 'last'
  | 'edit' 
  | 'save' 
  | 'cancel'
  | 'undo' 
  | 'redo'
  | 'copy' 
  | 'paste'
  | 'search' 
  | 'filter'
  | 'refresh' 
  | 'reload'
  | 'help' 
  | 'settings'
  | 'exit' 
  | 'close'
  | 'toggle-auto' 
  | 'toggle-theme'
  | 'zoom-in' 
  | 'zoom-out'
  | 'fullscreen'
  | 'custom';

// 快捷键修饰符
export type KeyboardModifier = 'Ctrl' | 'Alt' | 'Shift' | 'Meta';

// 快捷键接口
export interface KeyboardShortcut {
  // 基础属性
  key: string; // 按键组合，如 'a', 'Ctrl+s', 'ArrowUp'
  action: KeyboardAction | string; // 动作标识符
  description: string; // 快捷键描述
  
  // 可选属性
  category?: string; // 快捷键分类
  context?: KeyboardContext; // 生效上下文
  enabled?: boolean; // 是否启用
  preventDefault?: boolean; // 是否阻止默认行为
  stopPropagation?: boolean; // 是否阻止事件冒泡
  
  // 条件属性
  condition?: () => boolean; // 生效条件
  priority?: number; // 优先级（数字越大优先级越高）
  
  // 元数据
  note?: string; // 额外说明
  version?: string; // 版本信息
  deprecated?: boolean; // 是否已废弃
  replacement?: string; // 替代快捷键
  
  // 自定义属性
  isCustom?: boolean; // 是否为用户自定义
  createdAt?: number; // 创建时间
  updatedAt?: number; // 更新时间
}

// 快捷键组合接口
export interface KeyboardCombo {
  modifiers: KeyboardModifier[];
  key: string;
  code: string;
  normalized: string; // 标准化后的组合键字符串
}

// 快捷键使用统计
export interface KeyboardUsage {
  count: number; // 使用次数
  lastUsed: number; // 最后使用时间
  averageTime: number; // 平均响应时间
  totalTime: number; // 总响应时间
  errorCount?: number; // 错误次数
  successRate?: number; // 成功率
}

// 快捷键统计接口
export interface KeyboardStats {
  // 基础统计
  totalKeyPresses: number; // 总按键次数
  keyUsage: Record<string, KeyboardUsage>; // 按动作分组的使用统计
  
  // 性能统计
  averageResponseTime: number; // 平均响应时间（毫秒）
  fastestResponseTime: number; // 最快响应时间
  slowestResponseTime: number; // 最慢响应时间
  
  // 质量统计
  errorRate: number; // 错误率（0-1）
  keyboardUsageRate: number; // 键盘使用率（相对于鼠标操作）
  
  // 时间统计
  sessionStartTime: number; // 会话开始时间
  lastKeyPress: number; // 最后按键时间
  
  // 趋势数据
  hourlyUsage?: number[]; // 每小时使用量
  dailyUsage?: number[]; // 每日使用量
  
  // 热力图数据
  keyHeatmap?: Record<string, number>; // 按键热力图
  timeHeatmap?: Record<string, number>; // 时间热力图
}

// 快捷键配置接口
export interface KeyboardConfig {
  // 全局设置
  enabled: boolean; // 是否启用快捷键
  preventDefault: boolean; // 是否阻止默认行为
  caseSensitive: boolean; // 是否区分大小写
  
  // 上下文设置
  globalContext: boolean; // 是否启用全局上下文
  contextSwitching: boolean; // 是否支持上下文切换
  
  // 冲突处理
  conflictResolution: 'first' | 'last' | 'priority' | 'prompt'; // 冲突解决策略
  allowDuplicates: boolean; // 是否允许重复快捷键
  
  // 学习模式
  learningMode: boolean; // 是否启用学习模式
  showHints: boolean; // 是否显示提示
  trackUsage: boolean; // 是否跟踪使用情况
  
  // 自定义设置
  allowCustomShortcuts: boolean; // 是否允许自定义快捷键
  maxCustomShortcuts: number; // 最大自定义快捷键数量
  
  // 导入导出
  exportFormat: 'json' | 'csv' | 'xml'; // 导出格式
  importValidation: boolean; // 导入时是否验证
  
  // 备份恢复
  autoBackup: boolean; // 是否自动备份
  backupInterval: number; // 备份间隔（毫秒）
  maxBackups: number; // 最大备份数量
}

// 快捷键事件接口
export interface KeyboardEvent {
  // 基础事件信息
  type: 'keydown' | 'keyup' | 'keypress';
  key: string;
  code: string;
  keyCode: number;
  
  // 修饰符状态
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  
  // 事件状态
  repeat: boolean; // 是否为重复按键
  composed: boolean; // 是否为组合事件
  
  // 时间信息
  timestamp: number;
  timeStamp: number; // 原生事件时间戳
  
  // 目标信息
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  
  // 自定义属性
  shortcut?: KeyboardShortcut; // 匹配的快捷键
  action?: string; // 执行的动作
  context?: KeyboardContext; // 当前上下文
  handled?: boolean; // 是否已处理
}

// 快捷键冲突接口
export interface KeyboardConflict {
  key: string; // 冲突的按键组合
  shortcuts: KeyboardShortcut[]; // 冲突的快捷键列表
  severity: 'low' | 'medium' | 'high'; // 冲突严重程度
  resolution?: 'ignore' | 'disable' | 'modify' | 'prompt'; // 解决方案
  resolvedAt?: number; // 解决时间
}

// 快捷键学习数据
export interface KeyboardLearning {
  // 学习状态
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  progress: number; // 学习进度（0-100）
  
  // 推荐数据
  recommendedShortcuts: KeyboardShortcut[]; // 推荐学习的快捷键
  masteredShortcuts: string[]; // 已掌握的快捷键
  strugglingShortcuts: string[]; // 难以掌握的快捷键
  
  // 学习建议
  suggestions: Array<{
    type: 'learn' | 'practice' | 'optimize';
    shortcut: string;
    reason: string;
    priority: number;
  }>;
  
  // 练习数据
  practiceHistory: Array<{
    shortcut: string;
    attempts: number;
    successes: number;
    averageTime: number;
    lastPractice: number;
  }>;
}

// 快捷键主题接口
export interface KeyboardTheme {
  id: string;
  name: string;
  description: string;
  
  // 视觉样式
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  
  // 快捷键样式
  keyStyle: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
  };
  
  // 动画设置
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  
  // 自定义CSS
  customCSS?: string;
}

// 快捷键导出数据
export interface KeyboardExport {
  version: string;
  exportedAt: number;
  exportedBy: string;
  
  // 配置数据
  config: KeyboardConfig;
  shortcuts: KeyboardShortcut[];
  themes: KeyboardTheme[];
  
  // 统计数据（可选）
  stats?: KeyboardStats;
  learning?: KeyboardLearning;
  
  // 元数据
  metadata: {
    appVersion: string;
    platform: string;
    userAgent: string;
    locale: string;
  };
}

// 快捷键验证结果
export interface KeyboardValidation {
  isValid: boolean;
  errors: Array<{
    type: 'duplicate' | 'invalid' | 'conflict' | 'reserved';
    message: string;
    shortcut?: KeyboardShortcut;
    suggestion?: string;
  }>;
  warnings: Array<{
    type: 'performance' | 'usability' | 'accessibility';
    message: string;
    shortcut?: KeyboardShortcut;
    suggestion?: string;
  }>;
}

// 快捷键帮助项
export interface KeyboardHelpItem {
  category: string;
  shortcuts: Array<{
    key: string;
    description: string;
    example?: string;
    note?: string;
  }>;
}

// 快捷键搜索结果
export interface KeyboardSearchResult {
  shortcut: KeyboardShortcut;
  matches: Array<{
    field: 'key' | 'description' | 'category' | 'action';
    value: string;
    highlight: string;
  }>;
  score: number; // 匹配分数
}

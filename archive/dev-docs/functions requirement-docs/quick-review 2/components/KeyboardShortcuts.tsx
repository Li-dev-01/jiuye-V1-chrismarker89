/**
 * 键盘快捷键组件
 * 
 * 功能特性：
 * - 快捷键帮助对话框
 * - 自定义快捷键配置
 * - 快捷键冲突检测
 * - 快捷键学习模式
 * - 快捷键统计分析
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Keyboard,
  Search,
  Settings,
  BarChart3,
  BookOpen,
  Zap,
  AlertTriangle,
  CheckCircle,
  Edit3,
  RotateCcw
} from 'lucide-react';

import { KeyboardShortcut, KeyboardStats } from '../types/keyboard.types';

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  onShortcutChange?: (shortcuts: KeyboardShortcut[]) => void;
  stats?: KeyboardStats;
  className?: string;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  open,
  onClose,
  shortcuts,
  onShortcutChange,
  stats,
  className = ''
}) => {
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [customShortcuts, setCustomShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [learningMode, setLearningMode] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

  // 过滤快捷键
  const filteredShortcuts = customShortcuts.filter(shortcut =>
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 按类别分组快捷键
  const groupedShortcuts = filteredShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  // 类别显示名称映射
  const categoryNames = {
    general: '通用操作',
    review: '审核操作',
    navigation: '导航操作',
    batch: '批次操作',
    dialog: '对话框操作',
    custom: '自定义操作'
  };

  // 检测快捷键冲突
  const detectConflicts = useCallback((shortcuts: KeyboardShortcut[]) => {
    const keyMap = new Map<string, string[]>();
    const conflicts: string[] = [];

    shortcuts.forEach(shortcut => {
      const normalizedKey = normalizeKey(shortcut.key);
      if (!keyMap.has(normalizedKey)) {
        keyMap.set(normalizedKey, []);
      }
      keyMap.get(normalizedKey)!.push(shortcut.action);
    });

    keyMap.forEach((actions, key) => {
      if (actions.length > 1) {
        conflicts.push(`快捷键 "${key}" 被多个操作使用: ${actions.join(', ')}`);
      }
    });

    setConflictWarnings(conflicts);
  }, []);

  // 标准化快捷键
  const normalizeKey = (key: string) => {
    return key.toLowerCase()
      .replace('arrowup', '↑')
      .replace('arrowdown', '↓')
      .replace('arrowleft', '←')
      .replace('arrowright', '→')
      .replace(' ', 'space');
  };

  // 格式化快捷键显示
  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      ' ': 'Space',
      'Enter': '⏎',
      'Escape': 'Esc',
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Alt': 'Alt',
      'Shift': 'Shift'
    };

    // 处理组合键
    const parts = key.split('+').map(part => part.trim());
    return parts.map(part => keyMap[part] || part.toUpperCase()).join(' + ');
  };

  // 获取快捷键颜色
  const getShortcutColor = (action: string) => {
    const colorMap: Record<string, string> = {
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      next: 'bg-blue-100 text-blue-800',
      previous: 'bg-blue-100 text-blue-800',
      edit: 'bg-yellow-100 text-yellow-800',
      exit: 'bg-gray-100 text-gray-800',
      help: 'bg-purple-100 text-purple-800',
      refresh: 'bg-indigo-100 text-indigo-800'
    };

    return colorMap[action] || 'bg-gray-100 text-gray-800';
  };

  // 编辑快捷键
  const handleEditShortcut = (action: string, newKey: string) => {
    const updatedShortcuts = customShortcuts.map(shortcut =>
      shortcut.action === action
        ? { ...shortcut, key: newKey }
        : shortcut
    );

    setCustomShortcuts(updatedShortcuts);
    detectConflicts(updatedShortcuts);
    onShortcutChange?.(updatedShortcuts);
    setEditingShortcut(null);
  };

  // 重置快捷键
  const handleResetShortcuts = () => {
    setCustomShortcuts(shortcuts);
    setConflictWarnings([]);
    onShortcutChange?.(shortcuts);
  };

  // 添加自定义快捷键
  const handleAddCustomShortcut = () => {
    const newShortcut: KeyboardShortcut = {
      key: '',
      action: 'custom_action',
      description: '自定义操作',
      category: 'custom'
    };

    const updatedShortcuts = [...customShortcuts, newShortcut];
    setCustomShortcuts(updatedShortcuts);
    setEditingShortcut('custom_action');
  };

  // 删除快捷键
  const handleDeleteShortcut = (action: string) => {
    const updatedShortcuts = customShortcuts.filter(s => s.action !== action);
    setCustomShortcuts(updatedShortcuts);
    detectConflicts(updatedShortcuts);
    onShortcutChange?.(updatedShortcuts);
  };

  // 快捷键使用统计
  const getUsageStats = (action: string) => {
    if (!stats) return null;
    
    const usage = stats.keyUsage[action];
    if (!usage) return null;

    return {
      count: usage.count,
      lastUsed: usage.lastUsed,
      averageTime: usage.averageTime
    };
  };

  // 检测冲突
  useEffect(() => {
    detectConflicts(customShortcuts);
  }, [customShortcuts, detectConflicts]);

  // 学习模式提示
  const LearningModeHint = ({ shortcut }: { shortcut: KeyboardShortcut }) => {
    const usage = getUsageStats(shortcut.action);
    const isFrequentlyUsed = usage && usage.count > 10;
    const isRecentlyUsed = recentlyUsed.includes(shortcut.action);

    return (
      <div className="flex items-center gap-2">
        {isFrequentlyUsed && (
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            常用
          </Badge>
        )}
        {isRecentlyUsed && (
          <Badge variant="outline" className="text-xs">
            最近使用
          </Badge>
        )}
        {usage && usage.count === 0 && (
          <Badge variant="destructive" className="text-xs">
            未使用
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-hidden ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            查看和自定义键盘快捷键，提升审核效率
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="shortcuts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              快捷键列表
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              统计
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              学习模式
            </TabsTrigger>
          </TabsList>

          {/* 快捷键列表 */}
          <TabsContent value="shortcuts" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索快捷键..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetShortcuts}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>

            {conflictWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">快捷键冲突</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {conflictWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">
                    {categoryNames[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.action}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`text-xs ${getShortcutColor(shortcut.action)}`}
                            >
                              {formatKey(shortcut.key)}
                            </Badge>
                            <span className="font-medium">{shortcut.description}</span>
                            {learningMode && (
                              <LearningModeHint shortcut={shortcut} />
                            )}
                          </div>
                          {shortcut.note && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {shortcut.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingShortcut === shortcut.action ? (
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="按下新的快捷键..."
                                className="w-32 text-xs"
                                onKeyDown={(e) => {
                                  e.preventDefault();
                                  const key = e.key;
                                  const modifiers = [];
                                  if (e.ctrlKey) modifiers.push('Ctrl');
                                  if (e.altKey) modifiers.push('Alt');
                                  if (e.shiftKey) modifiers.push('Shift');
                                  if (e.metaKey) modifiers.push('Meta');
                                  
                                  const fullKey = modifiers.length > 0 
                                    ? `${modifiers.join('+')}+${key}`
                                    : key;
                                  
                                  handleEditShortcut(shortcut.action, fullKey);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingShortcut(null)}
                              >
                                取消
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingShortcut(shortcut.action)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              {shortcut.category === 'custom' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteShortcut(shortcut.action)}
                                >
                                  删除
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleAddCustomShortcut}
              className="w-full"
            >
              添加自定义快捷键
            </Button>
          </TabsContent>

          {/* 设置 */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">启用快捷键</h4>
                  <p className="text-sm text-muted-foreground">
                    全局启用或禁用键盘快捷键
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">阻止默认行为</h4>
                  <p className="text-sm text-muted-foreground">
                    阻止浏览器默认的快捷键行为
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">大小写敏感</h4>
                  <p className="text-sm text-muted-foreground">
                    区分快捷键的大小写
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">学习模式</h4>
                  <p className="text-sm text-muted-foreground">
                    显示快捷键使用提示和统计
                  </p>
                </div>
                <Switch
                  checked={learningMode}
                  onCheckedChange={setLearningMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">快捷键提示</h4>
                  <p className="text-sm text-muted-foreground">
                    在界面上显示快捷键提示
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          {/* 统计 */}
          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{stats.totalKeyPresses}</div>
                    <div className="text-sm text-muted-foreground">总按键次数</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Math.round(stats.keyboardUsageRate * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">键盘使用率</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">最常用快捷键</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.keyUsage)
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 5)
                      .map(([action, usage]) => {
                        const shortcut = customShortcuts.find(s => s.action === action);
                        return (
                          <div key={action} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex items-center gap-3">
                              <Badge className="text-xs">
                                {shortcut ? formatKey(shortcut.key) : action}
                              </Badge>
                              <span className="text-sm">
                                {shortcut?.description || action}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {usage.count} 次
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">效率指标</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>平均响应时间</span>
                      <span>{stats.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最快响应时间</span>
                      <span>{stats.fastestResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>错误按键率</span>
                      <span>{Math.round(stats.errorRate * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无统计数据</p>
              </div>
            )}
          </TabsContent>

          {/* 学习模式 */}
          <TabsContent value="learning" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">学习模式已启用</span>
              </div>
              <p className="text-sm text-blue-700">
                系统将跟踪您的快捷键使用情况，并提供个性化的学习建议。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">学习建议</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">掌握基础操作</div>
                      <div className="text-sm text-green-700">
                        您已经熟练掌握了批准(A)和拒绝(R)操作，继续保持！
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">尝试导航快捷键</div>
                      <div className="text-sm text-yellow-700">
                        使用方向键(←→)或N/P键可以更快地在内容间切换
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800">学习高级功能</div>
                      <div className="text-sm text-blue-700">
                        尝试使用撤销(Ctrl+Z)和批次刷新(F5)功能
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">练习模式</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  通过练习模式熟悉快捷键操作
                </p>
                <Button variant="outline" className="w-full">
                  开始练习
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 快速审核功能类型定义
 * 适配现有的审核系统，专注于问卷心声和故事墙
 */

// 快速审核内容类型
export type QuickReviewContentType = 'voice' | 'story';

// 审核动作
export type QuickReviewAction = 'approve' | 'reject' | 'skip';

// 审核状态
export type QuickReviewStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

// 快速审核项目接口
export interface QuickReviewItem {
  id: string;
  contentType: QuickReviewContentType;
  title?: string;
  content: string;
  metadata: {
    authorId?: string;
    authorName?: string;
    createdAt: number;
    updatedAt?: number;
    tags?: string[];
    wordCount?: number;
    // 问卷心声特有字段
    questionnaireId?: string;
    questionTitle?: string;
    // 故事墙特有字段
    storyCategory?: string;
    jobTitle?: string;
    company?: string;
  };
  status: QuickReviewStatus;
  priority: 'low' | 'normal' | 'high';
  assignedTo?: string;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewNotes?: string;
  aiScore?: number; // AI预评分 0-100
  riskLevel?: 'low' | 'medium' | 'high';
}

// 快速审核结果
export interface QuickReviewResult {
  success: boolean;
  message?: string;
  data?: {
    itemId: string;
    action: QuickReviewAction;
    timestamp: number;
    reviewerId: string;
    reviewTime: number; // 审核用时(毫秒)
  };
  error?: {
    code: string;
    message: string;
  };
}

// 批次请求配置
export interface QuickReviewBatchConfig {
  batchSize: number;
  contentType: QuickReviewContentType;
  autoRequestNext: boolean;
  prefetchNext: boolean;
  maxConcurrentBatches: number;
  priority?: 'low' | 'normal' | 'high';
}

// 批次统计
export interface QuickReviewBatchStats {
  batchId: string;
  contentType: QuickReviewContentType;
  totalItems: number;
  completedItems: number;
  approvedItems: number;
  rejectedItems: number;
  skippedItems: number;
  progress: number; // 0-100
  startTime: number;
  estimatedEndTime?: number;
  averageTimePerItem: number;
}

// 审核统计
export interface QuickReviewStatistics {
  // 基础统计
  totalReviewed: number;
  approved: number;
  rejected: number;
  skipped: number;
  
  // 效率统计
  averageTimePerItem: number; // 毫秒
  reviewsPerHour: number;
  totalTimeSpent: number; // 毫秒
  sessionStartTime: number;
  lastReviewTime: number;
  
  // 质量统计
  accuracyRate: number; // 百分比
  consistencyScore: number; // 0-100
  
  // 批次统计
  batchesCompleted: number;
  currentBatchProgress: number; // 百分比
  
  // 内容类型分布
  contentTypeDistribution: Record<QuickReviewContentType, number>;
  
  // 拒绝原因分布
  rejectionReasons: Record<string, number>;
}

// 键盘快捷键配置
export interface QuickReviewShortcut {
  key: string;
  action: string;
  description: string;
  category?: string;
  enabled?: boolean;
}

// 快速审核配置
export interface QuickReviewConfig {
  // 基础配置
  autoAdvance: boolean;
  autoAdvanceDelay: number; // 毫秒
  showConfirmation: boolean;
  enableUndo: boolean;
  maxUndoSteps: number;
  
  // 键盘配置
  keyboardEnabled: boolean;
  shortcuts: QuickReviewShortcut[];
  
  // 批次配置
  defaultBatchSize: number;
  autoRequestNext: boolean;
  prefetchNext: boolean;
  
  // UI配置
  animations: boolean;
  sounds: boolean;
  notifications: boolean;
  
  // 质量控制
  requireReason: boolean;
  confidenceThreshold: number;
}

// 拒绝原因预设
export interface QuickReviewRejectReason {
  id: string;
  label: string;
  description?: string;
  category: 'content' | 'quality' | 'policy' | 'other';
  contentTypes: QuickReviewContentType[];
  isActive: boolean;
  sortOrder: number;
}

// 审核历史记录
export interface QuickReviewHistory {
  id: string;
  itemId: string;
  action: QuickReviewAction;
  timestamp: number;
  reviewerId: string;
  reviewTime: number;
  reason?: string;
  notes?: string;
  canUndo: boolean;
}

// API响应格式
export interface QuickReviewAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 批次请求响应
export interface QuickReviewBatchResponse {
  batchId: string;
  items: QuickReviewItem[];
  total: number;
  hasMore: boolean;
  estimatedTimeToComplete: number;
}

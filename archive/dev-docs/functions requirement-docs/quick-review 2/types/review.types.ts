/**
 * 审核相关类型定义
 */

// 审核动作类型
export type ReviewAction = 'approve' | 'reject' | 'skip' | 'flag';

// 审核状态类型
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'skipped' | 'flagged';

// 内容类型
export type ContentType = 'story' | 'voice' | 'image' | 'video' | 'comment' | 'tag';

// 审核优先级
export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent';

// 审核项目接口
export interface ReviewItem {
  id: string;
  contentType: ContentType;
  title?: string;
  content: string;
  metadata: {
    authorId?: string;
    authorName?: string;
    createdAt: number;
    updatedAt?: number;
    source?: string;
    tags?: string[];
    category?: string;
    language?: string;
    wordCount?: number;
    mediaUrl?: string;
    thumbnailUrl?: string;
    duration?: number; // 对于音频/视频内容
    dimensions?: { width: number; height: number }; // 对于图片/视频内容
  };
  status: ReviewStatus;
  priority: ReviewPriority;
  assignedTo?: string;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewNotes?: string;
  flags?: string[];
  score?: number; // AI预评分
  confidence?: number; // AI置信度
  riskLevel?: 'low' | 'medium' | 'high';
  previousReviews?: ReviewHistory[];
}

// 审核结果接口
export interface ReviewResult {
  success: boolean;
  message?: string;
  data?: {
    itemId: string;
    action: ReviewAction;
    timestamp: number;
    reviewerId: string;
    confidence?: number;
    autoApproved?: boolean;
    needsSecondReview?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 审核历史记录
export interface ReviewHistory {
  id: string;
  itemId: string;
  action: ReviewAction;
  timestamp: number;
  reviewerId: string;
  metadata: {
    reviewTime: number;
    userAgent?: string;
    sessionId?: string;
    reason?: string;
    notes?: string;
    confidence?: number;
    [key: string]: any;
  };
  result: ReviewResult;
}

// 审核请求数据
export interface ReviewRequestData {
  itemId: string;
  action: ReviewAction;
  contentType: ContentType;
  timestamp: number;
  reviewerId: string;
  metadata: {
    reviewTime: number;
    userAgent?: string;
    sessionId?: string;
    reason?: string;
    notes?: string;
    [key: string]: any;
  };
}

// 审核统计接口
export interface ReviewStatistics {
  // 基础统计
  totalReviewed: number;
  approved: number;
  rejected: number;
  skipped: number;
  flagged: number;
  pending: number;
  
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
  
  // 趋势数据
  hourlyTrend: number[];
  dailyTrend: number[];
  
  // 内容类型分布
  contentTypeDistribution: Record<ContentType, number>;
  
  // 拒绝原因分布
  rejectionReasons: Record<string, number>;
}

// 审核配置接口
export interface ReviewConfig {
  // 基础配置
  autoAdvance: boolean;
  autoAdvanceDelay: number; // 毫秒
  showConfirmation: boolean;
  enableUndo: boolean;
  maxUndoSteps: number;
  
  // 键盘配置
  keyboardEnabled: boolean;
  customShortcuts: boolean;
  preventDefaults: boolean;
  caseSensitive: boolean;
  
  // 批次配置
  batchSize: number;
  autoRequestNext: boolean;
  prefetchNext: boolean;
  maxConcurrentBatches: number;
  
  // UI配置
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  sounds: boolean;
  notifications: boolean;
  
  // 性能配置
  enableMetrics: boolean;
  cacheSize: number;
  preloadImages: boolean;
  lazyLoading: boolean;
  
  // 质量控制
  requireReason: boolean;
  enableSecondReview: boolean;
  confidenceThreshold: number;
  autoApproveThreshold: number;
}

// 审核过滤器
export interface ReviewFilter {
  contentType?: ContentType[];
  status?: ReviewStatus[];
  priority?: ReviewPriority[];
  assignedTo?: string[];
  createdAfter?: number;
  createdBefore?: number;
  tags?: string[];
  category?: string[];
  riskLevel?: ('low' | 'medium' | 'high')[];
  hasFlags?: boolean;
  minScore?: number;
  maxScore?: number;
  minConfidence?: number;
  maxConfidence?: number;
}

// 审核排序选项
export interface ReviewSort {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'score' | 'confidence';
  direction: 'asc' | 'desc';
}

// 审核查询参数
export interface ReviewQuery {
  page?: number;
  pageSize?: number;
  filter?: ReviewFilter;
  sort?: ReviewSort;
  search?: string;
}

// 审核响应数据
export interface ReviewResponse {
  success: boolean;
  data: {
    items: ReviewItem[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 拒绝原因接口
export interface RejectReason {
  id: string;
  label: string;
  description?: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  requiresNote: boolean;
  isActive: boolean;
  sortOrder: number;
}

// 审核模板接口
export interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  config: Partial<ReviewConfig>;
  shortcuts: Array<{
    key: string;
    action: ReviewAction;
    reason?: string;
  }>;
  rejectReasons: RejectReason[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

// 审核会话接口
export interface ReviewSession {
  id: string;
  reviewerId: string;
  contentType: ContentType;
  startTime: number;
  endTime?: number;
  totalItems: number;
  completedItems: number;
  statistics: ReviewStatistics;
  config: ReviewConfig;
  template?: ReviewTemplate;
  isActive: boolean;
}

// 审核员接口
export interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: 'reviewer' | 'senior_reviewer' | 'admin';
  permissions: string[];
  statistics: {
    totalReviewed: number;
    accuracyRate: number;
    averageTimePerItem: number;
    specializations: ContentType[];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    keyboardShortcuts: boolean;
    autoAdvance: boolean;
    notifications: boolean;
  };
  isActive: boolean;
  lastActiveAt: number;
  createdAt: number;
}

// 审核质量评估
export interface QualityAssessment {
  itemId: string;
  reviewerId: string;
  assessorId: string;
  originalAction: ReviewAction;
  correctAction: ReviewAction;
  isCorrect: boolean;
  confidence: number;
  notes?: string;
  timestamp: number;
}

// 审核报告接口
export interface ReviewReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    startDate: number;
    endDate: number;
  };
  statistics: ReviewStatistics;
  reviewers: Array<{
    reviewerId: string;
    name: string;
    statistics: ReviewStatistics;
  }>;
  contentTypes: Array<{
    type: ContentType;
    statistics: ReviewStatistics;
  }>;
  trends: {
    volumeTrend: number[];
    accuracyTrend: number[];
    efficiencyTrend: number[];
  };
  insights: string[];
  recommendations: string[];
  generatedAt: number;
  generatedBy: string;
}

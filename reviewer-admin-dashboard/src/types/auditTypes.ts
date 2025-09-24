// 三层审核系统相关类型定义

export interface AuditRecord {
  id: number;
  content_type: 'story' | 'questionnaire' | 'heart_voice';
  content_id: number;
  raw_id: number;
  
  // 审核层级和状态
  audit_level: 'rule_based' | 'ai_assisted' | 'manual_review';
  audit_result: 'pending' | 'approved' | 'rejected' | 'flagged';
  
  // 审核详情
  rule_audit_result?: RuleAuditResult;
  ai_audit_result?: AIAuditResult;
  manual_audit_result?: ManualAuditResult;
  
  // 审核员信息
  auditor_id?: string;
  auditor_type: 'system' | 'ai' | 'human';
  
  // 时间戳
  created_at: string;
  audited_at?: string;
  
  // 内容信息
  content_preview?: string;
  author_info?: {
    user_id: string;
    username?: string;
    is_anonymous?: boolean;
  };
  
  // 优先级和标签
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  
  // 用户投诉相关
  complaint_count?: number;
  has_user_complaints?: boolean;
  complaint_reasons?: string[];
}

export interface RuleAuditResult {
  passed: boolean;
  violations: Array<{
    rule_id: string;
    category: string;
    matched_text: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
  risk_score: number;
  processing_time_ms: number;
}

export interface AIAuditResult {
  passed: boolean;
  confidence: number;
  risk_categories: string[];
  flagged_content: Array<{
    text: string;
    reason: string;
    confidence: number;
  }>;
  model_version: string;
  processing_time_ms: number;
}

export interface ManualAuditResult {
  decision: 'approved' | 'rejected';
  reviewer_id: string;
  reviewer_name: string;
  reason: string;
  notes?: string;
  reviewed_at: string;
  review_time_minutes: number;
}

// 审核员仪表板数据
export interface ReviewerDashboardData {
  stats: {
    // 基础统计
    total_pending: number;
    today_completed: number;
    total_completed: number;
    average_review_time: number;
    
    // 按层级分类
    pending_by_level: {
      rule_flagged: number;
      ai_flagged: number;
      user_complaints: number;
    };
    
    // 按内容类型分类
    pending_by_type: {
      story: number;
      questionnaire: number;
      heart_voice: number;
    };
    
    // 优先级分布
    pending_by_priority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  
  recent_activities: Array<{
    id: number;
    content_type: string;
    audit_result: string;
    created_at: string;
    title: string;
    audit_level: string;
  }>;
  
  performance_metrics: {
    approval_rate: number;
    average_daily_reviews: number;
    quality_score: number;
  };
}

// 待审核内容项
export interface PendingReviewItem {
  id: number;
  content_type: 'story' | 'questionnaire' | 'heart_voice';
  title: string;
  content_preview: string;
  full_content?: string;
  
  // 作者信息
  author: {
    user_id: string;
    username?: string;
    is_anonymous: boolean;
  };
  
  // 审核信息
  audit_level: 'rule_based' | 'ai_assisted' | 'manual_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_at: string;
  
  // 前置审核结果
  rule_audit_result?: RuleAuditResult;
  ai_audit_result?: AIAuditResult;
  
  // 用户投诉信息
  complaint_info?: {
    complaint_count: number;
    complaint_reasons: string[];
    latest_complaint_at: string;
  };
  
  // 标签和分类
  tags: string[];
  category?: string;
  
  // 风险评估
  risk_score: number;
  risk_factors: string[];
}

// 审核操作
export interface ReviewAction {
  audit_id: number;
  action: 'approve' | 'reject';
  reason: string;
  notes?: string;
  reviewer_id: string;
  
  // 可选的后续操作
  follow_up_actions?: Array<{
    type: 'notify_user' | 'escalate' | 'flag_similar';
    params?: any;
  }>;
}

// 审核历史项
export interface ReviewHistoryItem {
  id: number;
  content_type: string;
  title: string;
  author: string;
  
  // 审核结果
  final_decision: 'approved' | 'rejected';
  audit_path: string[]; // ['rule_based', 'ai_assisted', 'manual_review']
  
  // 审核详情
  rule_result?: RuleAuditResult;
  ai_result?: AIAuditResult;
  manual_result: ManualAuditResult;
  
  // 时间信息
  submitted_at: string;
  completed_at: string;
  total_processing_time: number;
  
  // 质量指标
  review_quality_score?: number;
  user_feedback?: {
    helpful: boolean;
    comment?: string;
  };
}

// API响应类型
export interface PendingReviewsResponse {
  success: boolean;
  data?: {
    reviews: PendingReviewItem[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface ReviewSubmissionResponse {
  success: boolean;
  data?: {
    audit_id: number;
    final_decision: string;
    processing_time: number;
    next_actions?: string[];
  };
  error?: string;
}

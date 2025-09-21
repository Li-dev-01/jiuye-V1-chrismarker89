// 业务实体类型定义

import type { AuditStatus, ContentType } from './api';

// 用户相关
export interface User {
  id: number;
  uuid: string;
  nickname?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 问卷相关
export interface QuestionnaireResponse {
  id: number;
  uuid: string;
  userId?: number;
  userUuid: string;
  isCompleted: boolean;
  completionPercentage: number;
  totalTimeSeconds: number;
  qualityScore: number;
  isValid: boolean;
  startedAt: string;
  completedAt?: string;
  ipAddress: string;
  userAgent: string;
  auditStatus: AuditStatus;
}

export interface QuestionnaireAnswer {
  id: number;
  responseId: number;
  questionId: string;
  answerValue: any; // JSON
  answerText?: string;
  timeSpent: number;
  createdAt: string;
}

// 心声相关
export interface HeartVoice {
  id: number;
  uuid: string;
  userId?: number;
  userUuid: string;
  content: string;
  category: string;
  emotionScore: number;
  tags: string[];
  isAnonymous: boolean;
  isFeatured: boolean;
  likeCount: number;
  auditStatus: AuditStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HeartVoiceCreateRequest {
  content: string;
  category: string;
  emotion_score: number;
  tags?: string[];
  is_anonymous?: boolean;
  user_id: string; // userUuid
  questionnaire_id?: string;
}

// 故事相关
export interface Story {
  id: number;
  uuid: string;
  userId?: number;
  userUuid: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
  isFeatured: boolean;
  likeCount: number;
  readCount: number;
  auditStatus: AuditStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoryCreateRequest {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  is_anonymous?: boolean;
  user_id: string; // userUuid
}

// 审核相关
export interface AuditRecord {
  id: number;
  contentType: ContentType;
  contentId: number;
  contentUuid: string;
  userId?: number;
  userUuid: string;
  auditResult: AuditStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReviewRequest {
  auditId: number;
  action: 'approve' | 'reject';
  reviewerId: string;
  reason?: string;
}

// 分析数据相关
export interface AnalyticsData {
  totalResponses: number;
  totalHeartVoices: number;
  totalStories: number;
  completionRate: number;
  averageTime: number;
  employmentRate?: number;
  unemploymentRate?: number;
  lastUpdated: string;
}

export interface DistributionData {
  label: string;
  value: number;
  percentage: number;
}

export interface MonthlyTrendData {
  months: string[];
  responses: number[];
  completions: number[];
}

// 统计相关
export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface SystemStats {
  totalUsers: number;
  totalSubmissions: number;
  totalReviews: number;
  systemUptime: number;
}

/**
 * UUID用户管理系统类型定义
 */

// 用户类型枚举
export enum UserType {
  ANONYMOUS = 'anonymous',           // 全匿名用户
  SEMI_ANONYMOUS = 'semi_anonymous', // 半匿名用户
  REVIEWER = 'reviewer',             // 审核员
  ADMIN = 'admin',                   // 管理员
  SUPER_ADMIN = 'super_admin'        // 超级管理员
}

// 内容类型枚举
export enum ContentType {
  QUESTIONNAIRE = 'questionnaire',   // 问卷
  STORY = 'story',                   // 故事分享
  VOICE = 'voice',                   // 问卷心声
  COMMENT = 'comment',               // 评论
  DOWNLOAD = 'download',             // 下载记录
  ANALYTICS = 'analytics'            // 分析报告
}

// 内容状态枚举
export enum ContentStatus {
  DRAFT = 'draft',                   // 草稿
  PENDING = 'pending',               // 待审核
  APPROVED = 'approved',             // 已批准
  REJECTED = 'rejected',             // 已拒绝
  PUBLISHED = 'published',           // 已发布
  ARCHIVED = 'archived'              // 已归档
}

// 权限枚举
export enum Permission {
  // 基础权限
  BROWSE_CONTENT = 'browse_content',
  SUBMIT_QUESTIONNAIRE = 'submit_questionnaire',
  
  // 半匿名用户权限
  MANAGE_OWN_CONTENT = 'manage_own_content',
  DOWNLOAD_CONTENT = 'download_content',
  DELETE_OWN_CONTENT = 'delete_own_content',
  
  // 审核员权限
  REVIEW_CONTENT = 'review_content',
  APPROVE_CONTENT = 'approve_content',
  REJECT_CONTENT = 'reject_content',
  VIEW_REVIEW_STATS = 'view_review_stats',
  MANAGE_REVIEW_QUEUE = 'manage_review_queue',
  
  // 管理员权限
  PROJECT_MANAGEMENT = 'project_management',
  CREATE_REVIEWER = 'create_reviewer',
  MANAGE_USERS = 'manage_users',
  VIEW_ALL_CONTENT = 'view_all_content',
  SYSTEM_SETTINGS = 'system_settings',
  VIEW_ALL_STATS = 'view_all_stats',
  
  // 超级管理员权限
  PROJECT_TOGGLE = 'project_toggle',
  MAINTENANCE_MODE = 'maintenance_mode',
  ALL_PERMISSIONS = 'all_permissions'
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserType, Permission[]> = {
  [UserType.ANONYMOUS]: [
    Permission.BROWSE_CONTENT,
    Permission.SUBMIT_QUESTIONNAIRE
  ],
  
  [UserType.SEMI_ANONYMOUS]: [
    Permission.BROWSE_CONTENT,
    Permission.SUBMIT_QUESTIONNAIRE,
    Permission.MANAGE_OWN_CONTENT,
    Permission.DOWNLOAD_CONTENT,
    Permission.DELETE_OWN_CONTENT
  ],
  
  [UserType.REVIEWER]: [
    Permission.BROWSE_CONTENT,
    Permission.REVIEW_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.REJECT_CONTENT,
    Permission.VIEW_REVIEW_STATS,
    Permission.MANAGE_REVIEW_QUEUE
  ],
  
  [UserType.ADMIN]: [
    Permission.BROWSE_CONTENT,
    Permission.PROJECT_MANAGEMENT,
    Permission.CREATE_REVIEWER,
    Permission.MANAGE_USERS,
    Permission.VIEW_ALL_CONTENT,
    Permission.SYSTEM_SETTINGS,
    Permission.VIEW_ALL_STATS,
    Permission.REVIEW_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.REJECT_CONTENT
  ],
  
  [UserType.SUPER_ADMIN]: [
    Permission.ALL_PERMISSIONS
  ]
};

// 会话配置
export const SESSION_CONFIG = {
  [UserType.ANONYMOUS]: 24 * 60 * 60 * 1000,      // 24小时
  [UserType.SEMI_ANONYMOUS]: 24 * 60 * 60 * 1000, // 24小时
  [UserType.REVIEWER]: 8 * 60 * 60 * 1000,        // 8小时
  [UserType.ADMIN]: 8 * 60 * 60 * 1000,           // 8小时
  [UserType.SUPER_ADMIN]: 8 * 60 * 60 * 1000      // 8小时
};

// UUID前缀配置
export const UUID_PREFIXES = {
  [UserType.ANONYMOUS]: (date: Date) => `anon-${formatDate(date)}-`,
  [UserType.SEMI_ANONYMOUS]: (date: Date) => `semi-${formatDate(date)}-`,
  [UserType.REVIEWER]: 'rev-',
  [UserType.ADMIN]: 'admin-',
  [UserType.SUPER_ADMIN]: 'super-'
};

// 用户接口定义
export interface UniversalUser {
  uuid: string;
  userType: UserType;
  identityHash?: string;        // 半匿名用户的身份哈希
  credentials?: UserCredentials;
  profile: UserProfile;
  permissions: Permission[];
  metadata: UserMetadata;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface UserCredentials {
  // 实名用户
  username?: string;
  passwordHash?: string;
  
  // 半匿名用户
  identityAHash?: string;
  identityBHash?: string;
  
  // 全匿名用户
  sessionToken?: string;
  deviceFingerprint?: string;
}

export interface UserProfile {
  displayName?: string;
  role?: UserType;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface PrivacySettings {
  showProfile: boolean;
  allowTracking: boolean;
  dataRetention: number; // 天数
}

export interface UserMetadata {
  loginCount: number;
  lastLoginIP?: string;
  deviceInfo?: DeviceInfo;
  contentStats: ContentStats;
  securityFlags: SecurityFlags;
  reviewStats?: ReviewStats; // 审核员专用
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  fingerprint: string;
}

export interface ContentStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  downloads: number;
  lastSubmissionAt?: string;
}

export interface ReviewStats {
  totalReviewed: number;
  approved: number;
  rejected: number;
  dailyQuota: number;
  todayReviewed: number;
  averageReviewTime: number; // 秒
}

export interface SecurityFlags {
  isSuspicious: boolean;
  failedLoginAttempts: number;
  lastFailedLoginAt?: string;
  twoFactorEnabled: boolean;
  ipWhitelist?: string[];
}

// 会话接口
export interface UserSession {
  sessionId: string;
  userUuid: string;
  sessionToken: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

// 内容关联接口
export interface UserContentMapping {
  id: string;
  userUuid: string;
  contentType: ContentType;
  contentId: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// 统计接口
export interface UserStatistics {
  dailyNewUsers: Record<UserType, number>;
  activeUsers: Record<UserType, number>;
  userTypeDistribution: Record<UserType, number>;
  dailySubmissions: Record<ContentType, number>;
  contentTypeStats: Record<ContentType, number>;
  reviewStats: {
    pending: number;
    approved: number;
    rejected: number;
    averageReviewTime: number;
  };
  downloadStats: {
    totalDownloads: number;
    popularContent: Array<{
      contentId: string;
      contentType: ContentType;
      downloads: number;
    }>;
  };
}

// 认证结果接口
export interface AuthResult {
  success: boolean;
  user?: UniversalUser;
  session?: UserSession;
  error?: string;
  requiresTwoFactor?: boolean;
}

// 身份冲突检查结果
export interface IdentityConflictResult {
  hasConflict: boolean;
  currentUserType?: UserType;
  message?: string;
  requiresConfirmation: boolean;
}

// 工具函数
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function generateUUID(userType: UserType, date?: Date): string {
  const currentDate = date || new Date();
  const prefix = UUID_PREFIXES[userType];
  const prefixStr = typeof prefix === 'function' ? prefix(currentDate) : prefix;
  
  // 生成随机UUID部分
  const randomPart = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  return `${prefixStr}${randomPart}`;
}

export function parseUUIDInfo(uuid: string): { userType: UserType; date?: string } {
  if (uuid.startsWith('anon-')) {
    const datePart = uuid.slice(5, 13);
    return { userType: UserType.ANONYMOUS, date: datePart };
  }
  
  if (uuid.startsWith('semi-')) {
    const datePart = uuid.slice(5, 13);
    return { userType: UserType.SEMI_ANONYMOUS, date: datePart };
  }
  
  if (uuid.startsWith('rev-')) {
    return { userType: UserType.REVIEWER };
  }
  
  if (uuid.startsWith('admin-')) {
    return { userType: UserType.ADMIN };
  }
  
  if (uuid.startsWith('super-')) {
    return { userType: UserType.SUPER_ADMIN };
  }
  
  throw new Error(`Unknown UUID format: ${uuid}`);
}

export function hasPermission(user: UniversalUser, permission: Permission): boolean {
  if (user.userType === UserType.SUPER_ADMIN) {
    return true; // 超级管理员拥有所有权限
  }
  
  return user.permissions.includes(permission);
}

export function canAccessContent(user: UniversalUser, contentUserUuid: string): boolean {
  // 超级管理员和管理员可以访问所有内容
  if (user.userType === UserType.SUPER_ADMIN || user.userType === UserType.ADMIN) {
    return true;
  }
  
  // 审核员可以访问待审核内容
  if (user.userType === UserType.REVIEWER) {
    return hasPermission(user, Permission.REVIEW_CONTENT);
  }
  
  // 半匿名用户只能访问自己的内容
  if (user.userType === UserType.SEMI_ANONYMOUS) {
    return user.uuid === contentUserUuid;
  }
  
  // 全匿名用户不能访问特定用户内容
  return false;
}

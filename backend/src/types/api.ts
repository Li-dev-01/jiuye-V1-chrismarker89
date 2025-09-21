// API 通用类型定义
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

// 用户角色类型
export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

// 用户类型
export interface User {
  id: string | number;
  username: string;
  email: string;
  role: UserRole;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

// 认证上下文
export interface AuthContext {
  user?: User;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

// 就业状态类型
export interface EmploymentStatus {
  currentStatus: string;
  currentCompany?: string;
  currentPosition?: string;
}

// 问卷创建请求
export interface CreateQuestionnaireRequest {
  personalInfo?: any;
  educationInfo?: any;
  employmentInfo?: any;
  jobSearchInfo?: any;
  employmentStatus?: EmploymentStatus;
}

// 问卷响应类型
export interface QuestionnaireResponse {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  search?: string;
}

// 数据库环境变量 - 统一的Env接口
export interface Env {
  // 必需的环境变量
  ENVIRONMENT: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;

  // Cloudflare 相关
  DB: D1Database; // Cloudflare D1
  TEST_DB?: D1Database; // 测试数据库
  R2_BUCKET?: R2Bucket;
  R2_BUCKET_NAME?: string;

  // 传统数据库（可选）
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;

  // 管理员相关
  ADMIN_TOKEN?: string;
}

// 错误类型
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 审核状态
export type AuditStatus = 'pending' | 'approved' | 'rejected';
export type ContentType = 'questionnaire' | 'heart_voice' | 'story';

// 用户权限
export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  review: boolean;
}

// 请求上下文
export interface RequestContext {
  userId?: string;
  userUuid?: string;
  permissions?: UserPermissions;
  ipAddress?: string;
  userAgent?: string;
}

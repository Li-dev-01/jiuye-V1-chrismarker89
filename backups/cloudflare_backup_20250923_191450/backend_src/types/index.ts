// 统一导出所有类型定义
export * from './api';
export * from './entities';
export * from './universal-questionnaire';

// 从根类型文件导出（向后兼容，但排除重复的类型）
// 注意：UserRole, AuthContext, User, LoginRequest, CreateUserRequest 已在 api.ts 中定义

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

// 问卷相关类型
export interface QuestionnaireResponse {
  id: string;
  user_id: string;
  personal_info: string; // JSON string
  education_info: string; // JSON string
  employment_info: string; // JSON string
  job_search_info: string; // JSON string
  employment_status: string; // JSON string
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionnaireRequest {
  personalInfo: PersonalInfo;
  educationInfo: EducationInfo;
  employmentInfo: EmploymentInfo;
  jobSearchInfo: JobSearchInfo;
  employmentStatus: EmploymentStatus;
}

export interface PersonalInfo {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  phone: string;
  email: string;
}

export interface EducationInfo {
  university: string;
  major: string;
  degree: 'bachelor' | 'master' | 'doctor';
  graduationYear: number;
  gpa?: number;
}

export interface EmploymentInfo {
  preferredIndustry: string[];
  preferredPosition: string;
  expectedSalary: number;
  preferredLocation: string[];
  workExperience: string;
}

export interface JobSearchInfo {
  searchChannels: string[];
  interviewCount: number;
  offerCount: number;
  searchDuration: number;
}

export interface EmploymentStatus {
  currentStatus: 'employed' | 'unemployed' | 'continuing_education' | 'other';
  currentCompany?: string;
  currentPosition?: string;
  currentSalary?: number;
  satisfactionLevel?: number;
}

// 审核相关类型
export interface Review {
  id: string;
  questionnaire_id: string;
  reviewer_id: string;
  status: 'approved' | 'rejected';
  comment: string;
  created_at: string;
}

export interface CreateReviewRequest {
  questionnaireId: string;
  status: 'approved' | 'rejected';
  comment: string;
}

// 注意：ApiResponse, PaginationParams, PaginatedResponse 已移动到 api.ts

// JWT载荷类型
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// 中间件上下文类型
export interface AuthContext {
  user: Omit<User, 'password_hash'>;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'reviewer' | 'admin' | 'super_admin';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// 问卷相关类型 - 从 questionnaire.ts 重新导出
export type {
  PersonalInfo,
  EducationInfo,
  EmploymentInfo,
  JobSearchInfo,
  EmploymentStatus,
  QuestionnaireFormData
} from './questionnaire';

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  educationInfo: EducationInfo;
  employmentInfo: EmploymentInfo;
  jobSearchInfo: JobSearchInfo;
  employmentStatus: EmploymentStatus;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// 审核相关类型
export interface Review {
  id: string;
  questionnaireId: string;
  reviewerId: string;
  status: 'approved' | 'rejected';
  comment: string;
  createdAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 图表数据类型
export interface ChartData {
  name: string;
  value: number;
}

export interface AnalyticsData {
  totalResponses: number;
  approvedResponses: number;
  pendingResponses: number;
  rejectedResponses: number;
  genderDistribution: ChartData[];
  majorDistribution: ChartData[];
  employmentStatusDistribution: ChartData[];
  salaryDistribution: ChartData[];
}

// 表单验证类型
export interface FormErrors {
  [key: string]: string | undefined;
}

// 路由类型
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  title: string;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

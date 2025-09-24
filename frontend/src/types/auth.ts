// 用户角色类型定义
export type UserRole = 'guest' | 'user' | 'reviewer' | 'admin' | 'super_admin';

// 权限类型定义
export type Permission = 
  // 基础浏览权限
  | 'view_home'
  | 'view_analytics'
  | 'view_stories'
  | 'view_voices'
  
  // 内容创建权限
  | 'create_questionnaire'
  | 'create_story'
  | 'create_voice'
  
  // 内容管理权限
  | 'edit_own_content'
  | 'delete_own_content'
  | 'view_own_submissions'
  | 'download_reports'
  
  // 审核权限
  | 'review_questionnaires'
  | 'review_stories'
  | 'review_voices'
  | 'view_review_history'
  | 'export_review_reports'
  
  // 管理权限
  | 'manage_users'
  | 'manage_reviewers'
  | 'manage_system'
  | 'view_logs'
  | 'manage_api'
  | 'view_admin_analytics';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  isAnonymous: boolean;
  anonymousId?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'inactive' | 'banned';
}

// 认证状态接口
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  loginType?: 'user' | 'reviewer' | 'admin';
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email?: string;
  password?: string;
  isAnonymous?: boolean;
}

// 快捷注册请求接口
export interface QuickRegisterRequest {
  nickname?: string;
  isAnonymous: true;
}

// 权限检查结果接口
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices'
  ],
  user: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices',
    'create_questionnaire',
    'create_story',
    'create_voice',
    'edit_own_content',
    'delete_own_content',
    'view_own_submissions',
    'download_reports'
  ],
  reviewer: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices',
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'view_review_history',
    'export_review_reports'
  ],
  admin: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices',
    'create_questionnaire',
    'create_story',
    'create_voice',
    'edit_own_content',
    'delete_own_content',
    'view_own_submissions',
    'download_reports',
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'view_review_history',
    'export_review_reports',
    'manage_users',
    'manage_reviewers',
    'manage_system',
    'view_logs',
    'manage_api',
    'view_admin_analytics'
  ],
  super_admin: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices',
    'create_questionnaire',
    'create_story',
    'create_voice',
    'edit_own_content',
    'delete_own_content',
    'view_own_submissions',
    'download_reports',
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'view_review_history',
    'export_review_reports',
    'manage_users',
    'manage_reviewers',
    'manage_system',
    'view_logs',
    'manage_api',
    'view_admin_analytics'
  ]
};

// 路由权限映射
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/': ['view_home'],
  '/analytics': ['view_analytics'],
  '/stories': ['view_stories'],
  '/voices': ['view_voices'],
  '/questionnaire': ['create_questionnaire'],
  '/profile': ['view_own_submissions'],
  '/my-submissions': ['view_own_submissions'],
  '/reviewer': ['review_questionnaires'],
  '/reviewer/dashboard': ['review_questionnaires'],
  '/reviewer/questionnaires': ['review_questionnaires'],
  '/reviewer/stories': ['review_stories'],
  '/reviewer/voices': ['review_voices'],
  '/reviewer/history': ['view_review_history'],
  '/admin': ['manage_users'],
  '/admin/users': ['manage_users'],
  '/admin/reviewers': ['manage_reviewers'],
  '/admin/system': ['manage_system'],
  '/admin/logs': ['view_logs'],
  '/admin/api-data': ['manage_api'],
  '/admin/analytics': ['view_admin_analytics']
};

// 统一登录入口映射
export const LOGIN_ROUTES: Record<UserRole, string> = {
  guest: '/auth/login',
  user: '/auth/login',
  reviewer: '/management',
  admin: '/management',
  super_admin: '/management'
};

// 默认重定向路由
export const DEFAULT_REDIRECTS: Record<UserRole, string> = {
  guest: '/',
  user: '/',
  reviewer: '/reviewer/dashboard',
  admin: '/admin',
  super_admin: '/admin'
};

/**
 * 管理系统认证类型定义
 * 专门用于管理员和审核员的管理功能
 */

// 管理用户类型
export type ManagementUserType = 'REVIEWER' | 'ADMIN' | 'SUPER_ADMIN';

// 管理系统权限
export type ManagementPermission = 
  // 审核权限
  | 'review_questionnaires'
  | 'review_stories'
  | 'review_voices'
  | 'approve_content'
  | 'reject_content'
  | 'view_review_history'
  | 'export_review_reports'
  | 'manage_review_queue'
  
  // 用户管理权限
  | 'manage_users'
  | 'create_reviewer'
  | 'edit_reviewer'
  | 'delete_reviewer'
  | 'view_user_analytics'
  
  // 内容管理权限
  | 'manage_all_content'
  | 'edit_any_content'
  | 'delete_any_content'
  | 'view_all_submissions'
  | 'export_all_data'
  
  // 系统管理权限
  | 'system_settings'
  | 'view_system_logs'
  | 'manage_api_keys'
  | 'database_operations'
  | 'security_management'
  
  // 分析权限
  | 'view_admin_analytics'
  | 'view_detailed_stats'
  | 'generate_reports'
  | 'data_visualization'

  // AI管理权限
  | 'ai_config'           // AI配置权限
  | 'ai_monitor'          // AI监控权限
  | 'ai_cost_control'     // 成本控制权限
  | 'ai_review_assist';   // 审核助手权限

// 管理用户信息
export interface ManagementUser {
  id: string;
  uuid: string;
  username: string;
  email?: string;
  userType: ManagementUserType;
  display_name: string;
  permissions: ManagementPermission[];
  specialties?: string[]; // 审核员的专业领域
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: {
    loginCount?: number;
    lastLoginIP?: string;
    failedLoginAttempts?: number;
    lastFailedLoginAt?: string;
  };
}

// 管理用户会话
export interface ManagementSession {
  sessionId: string;
  userId: string;
  userUuid: string;
  deviceFingerprint: string;
  userAgent?: string;
  ipAddress?: string;
  created_at: string;
  expires_at: string;
  isActive: boolean;
  permissions: ManagementPermission[];
}

// 管理员登录凭据
export interface ManagementCredentials {
  username: string;
  password: string;
  userType?: ManagementUserType;
  remember?: boolean;
}

// 管理认证结果
export interface ManagementAuthResult {
  success: boolean;
  user?: ManagementUser;
  session?: ManagementSession;
  token?: string;
  error?: string;
  message?: string;
}

// 管理权限检查结果
export interface ManagementPermissionResult {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions?: ManagementPermission[];
}

// 用户类型权限映射
export const MANAGEMENT_USER_PERMISSIONS: Record<ManagementUserType, ManagementPermission[]> = {
  REVIEWER: [
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'approve_content',
    'reject_content',
    'view_review_history',
    'export_review_reports',
    'manage_review_queue'
  ],
  ADMIN: [
    // 继承审核员权限
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'approve_content',
    'reject_content',
    'view_review_history',
    'export_review_reports',
    'manage_review_queue',
    
    // 管理权限
    'manage_users',
    'create_reviewer',
    'edit_reviewer',
    'delete_reviewer',
    'view_user_analytics',
    'manage_all_content',
    'edit_any_content',
    'delete_any_content',
    'view_all_submissions',
    'export_all_data',
    'view_admin_analytics',
    'view_detailed_stats',
    'generate_reports',
    'data_visualization'
  ],
  SUPER_ADMIN: [
    // 继承管理员所有权限
    'review_questionnaires',
    'review_stories',
    'review_voices',
    'approve_content',
    'reject_content',
    'view_review_history',
    'export_review_reports',
    'manage_review_queue',
    'manage_users',
    'create_reviewer',
    'edit_reviewer',
    'delete_reviewer',
    'view_user_analytics',
    'manage_all_content',
    'edit_any_content',
    'delete_any_content',
    'view_all_submissions',
    'export_all_data',
    'view_admin_analytics',
    'view_detailed_stats',
    'generate_reports',
    'data_visualization',
    
    // 系统权限
    'system_settings',
    'view_system_logs',
    'manage_api_keys',
    'database_operations',
    'security_management',

    // AI管理权限
    'ai_config',
    'ai_monitor',
    'ai_cost_control',
    'ai_review_assist'
  ]
};

// 管理路由权限映射
export const MANAGEMENT_ROUTE_PERMISSIONS: Record<string, ManagementPermission[]> = {
  // 审核员路由
  '/reviewer': ['review_questionnaires'],
  '/reviewer/dashboard': ['review_questionnaires'],
  '/reviewer/questionnaires': ['review_questionnaires'],
  '/reviewer/stories': ['review_stories'],
  '/reviewer/voices': ['review_voices'],
  '/reviewer/history': ['view_review_history'],
  '/reviewer/reports': ['export_review_reports'],
  
  // 管理员路由
  '/admin': ['manage_users'],
  '/admin/dashboard': ['manage_users'],
  '/admin/users': ['manage_users'],
  '/admin/reviewers': ['manage_users'],
  '/admin/content': ['manage_all_content'],
  '/admin/analytics': ['view_admin_analytics'],
  '/admin/reports': ['generate_reports'],
  '/admin/api-data': ['manage_api_keys'],

  // AI管理路由
  '/admin/ai': ['ai_config'],
  '/admin/ai/sources': ['ai_config'],
  '/admin/ai/monitor': ['ai_monitor'],
  '/admin/ai/cost': ['ai_cost_control'],
  '/admin/ai/review-assistant': ['ai_review_assist'],

  // 超级管理员路由
  '/admin/system': ['system_settings'],
  '/admin/logs': ['view_system_logs'],
  '/admin/security': ['security_management'],
  '/admin/database': ['database_operations']
};

// 会话配置
export const MANAGEMENT_SESSION_CONFIG = {
  REVIEWER: 8 * 60 * 60 * 1000,        // 8小时
  ADMIN: 8 * 60 * 60 * 1000,           // 8小时
  SUPER_ADMIN: 12 * 60 * 60 * 1000     // 12小时
};

// 预置管理账号
export const PRESET_MANAGEMENT_ACCOUNTS = [
  {
    id: 'admin1',
    username: 'admin1',
    password: 'admin123',
    userType: 'ADMIN' as ManagementUserType,
    name: '系统管理员',
    redirectPath: '/admin'
  },
  {
    id: 'superadmin',
    username: 'superadmin',
    password: 'admin123',
    userType: 'SUPER_ADMIN' as ManagementUserType,
    name: '超级管理员',
    redirectPath: '/admin'
  },
  {
    id: 'reviewerA',
    username: 'reviewerA',
    password: 'admin123',
    userType: 'REVIEWER' as ManagementUserType,
    name: '审核员A',
    redirectPath: '/reviewer/dashboard',
    specialties: ['questionnaire', 'story']
  },
  {
    id: 'reviewerB',
    username: 'reviewerB',
    password: 'admin123',
    userType: 'REVIEWER' as ManagementUserType,
    name: '审核员B',
    redirectPath: '/reviewer/dashboard',
    specialties: ['voice', 'content']
  }
];

// 默认重定向路径
export const MANAGEMENT_DEFAULT_REDIRECTS: Record<ManagementUserType, string> = {
  REVIEWER: '/reviewer/dashboard',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin'
};

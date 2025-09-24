/**
 * 统一认证系统类型定义
 * 合并问卷系统和管理系统的权限架构
 */

// 统一用户类型枚举
export enum UnifiedUserType {
  // 问卷系统用户
  ANONYMOUS = 'ANONYMOUS',                    // 匿名浏览用户
  SEMI_ANONYMOUS = 'SEMI_ANONYMOUS',          // 半匿名用户（可填问卷）
  REGISTERED = 'REGISTERED',                  // 注册用户（完整功能）
  
  // 管理系统用户
  REVIEWER = 'REVIEWER',                      // 审核员
  ADMIN = 'ADMIN',                           // 管理员
  SUPER_ADMIN = 'SUPER_ADMIN'                // 超级管理员
}

// 用户域分类
export enum UserDomain {
  QUESTIONNAIRE = 'QUESTIONNAIRE',           // 问卷域
  MANAGEMENT = 'MANAGEMENT'                  // 管理域
}

// 统一权限枚举
export enum UnifiedPermission {
  // === 问卷域权限 ===
  // 基础浏览权限
  VIEW_HOME = 'view_home',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_STORIES = 'view_stories',
  VIEW_VOICES = 'view_voices',
  
  // 问卷相关权限
  SUBMIT_QUESTIONNAIRE = 'submit_questionnaire',
  VIEW_OWN_SUBMISSIONS = 'view_own_submissions',
  EDIT_OWN_SUBMISSIONS = 'edit_own_submissions',
  DELETE_OWN_SUBMISSIONS = 'delete_own_submissions',
  
  // 内容创建权限
  CREATE_STORY = 'create_story',
  CREATE_VOICE = 'create_voice',
  EDIT_OWN_CONTENT = 'edit_own_content',
  DELETE_OWN_CONTENT = 'delete_own_content',
  
  // 下载权限
  DOWNLOAD_REPORTS = 'download_reports',
  EXPORT_OWN_DATA = 'export_own_data',
  
  // === 管理域权限 ===
  // 审核权限
  REVIEW_QUESTIONNAIRES = 'review_questionnaires',
  REVIEW_STORIES = 'review_stories',
  REVIEW_VOICES = 'review_voices',
  APPROVE_CONTENT = 'approve_content',
  REJECT_CONTENT = 'reject_content',
  VIEW_REVIEW_HISTORY = 'view_review_history',
  EXPORT_REVIEW_REPORTS = 'export_review_reports',
  MANAGE_REVIEW_QUEUE = 'manage_review_queue',
  
  // 用户管理权限
  MANAGE_USERS = 'manage_users',
  CREATE_REVIEWER = 'create_reviewer',
  EDIT_REVIEWER = 'edit_reviewer',
  DELETE_REVIEWER = 'delete_reviewer',
  VIEW_USER_ANALYTICS = 'view_user_analytics',
  
  // 内容管理权限
  MANAGE_ALL_CONTENT = 'manage_all_content',
  EDIT_ANY_CONTENT = 'edit_any_content',
  DELETE_ANY_CONTENT = 'delete_any_content',
  VIEW_ALL_SUBMISSIONS = 'view_all_submissions',
  EXPORT_ALL_DATA = 'export_all_data',
  
  // 系统管理权限
  SYSTEM_SETTINGS = 'system_settings',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_API_KEYS = 'manage_api_keys',
  DATABASE_OPERATIONS = 'database_operations',
  SECURITY_MANAGEMENT = 'security_management',
  
  // 分析权限
  VIEW_ADMIN_ANALYTICS = 'view_admin_analytics',
  VIEW_DETAILED_STATS = 'view_detailed_stats',
  GENERATE_REPORTS = 'generate_reports',
  DATA_VISUALIZATION = 'data_visualization',
  
  // AI管理权限
  AI_CONFIG = 'ai_config',
  AI_MONITOR = 'ai_monitor',
  AI_COST_CONTROL = 'ai_cost_control',
  AI_REVIEW_ASSIST = 'ai_review_assist'
}

// 统一用户接口
export interface UnifiedUser {
  // 基础信息
  id: string;
  uuid: string;
  username?: string;
  email?: string;
  displayName?: string;
  
  // 用户分类
  userType: UnifiedUserType;
  domain: UserDomain;
  
  // 权限信息
  permissions: UnifiedPermission[];
  
  // 会话信息
  sessionId?: string;
  deviceFingerprint?: string;
  
  // 元数据
  profile: {
    displayName?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  };
  metadata: {
    loginCount: number;
    lastLoginTime?: string;
    createdAt: string;
    updatedAt: string;
  };
  
  // 管理域特有字段
  specialties?: string[];
  redirectPath?: string;
}

// 统一会话接口
export interface UnifiedSession {
  sessionId: string;
  userId: string;
  userUuid: string;
  userType: UnifiedUserType;
  domain: UserDomain;
  
  // 会话安全
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  
  // 时间信息
  created_at: string;
  expires_at: string;
  last_activity?: string;
  
  // 状态
  isActive: boolean;
  permissions: UnifiedPermission[];
}

// 统一认证结果
export interface UnifiedAuthResult {
  success: boolean;
  user?: UnifiedUser;
  session?: UnifiedSession;
  token?: string;
  message?: string;
  error?: string;
  redirectPath?: string;
}

// 统一登录凭据
export interface UnifiedCredentials {
  // 通用字段
  userType?: UnifiedUserType;
  domain?: UserDomain;
  remember?: boolean;
  deviceInfo?: {
    fingerprint: string;
    userAgent: string;
  };
  
  // 问卷域登录（半匿名）
  displayName?: string;
  
  // 管理域登录（用户名密码）
  username?: string;
  password?: string;
  
  // Google OAuth登录
  googleToken?: string;
  googleUser?: {
    email: string;
    name: string;
    picture?: string;
    id: string;
  };
  email?: string;
}

// 权限检查结果
export interface UnifiedPermissionResult {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions?: UnifiedPermission[];
  userDomain?: UserDomain;
  redirectSuggestion?: string;
}

// 用户类型权限映射
export const UNIFIED_USER_PERMISSIONS: Record<UnifiedUserType, UnifiedPermission[]> = {
  // 问卷域用户权限
  [UnifiedUserType.ANONYMOUS]: [
    UnifiedPermission.VIEW_HOME,
    UnifiedPermission.VIEW_ANALYTICS,
    UnifiedPermission.VIEW_STORIES,
    UnifiedPermission.VIEW_VOICES
  ],

  [UnifiedUserType.SEMI_ANONYMOUS]: [
    // 继承匿名用户权限
    ...UNIFIED_USER_PERMISSIONS[UnifiedUserType.ANONYMOUS],
    // 新增权限
    UnifiedPermission.SUBMIT_QUESTIONNAIRE,
    UnifiedPermission.CREATE_STORY,
    UnifiedPermission.CREATE_VOICE,
    UnifiedPermission.VIEW_OWN_SUBMISSIONS,
    UnifiedPermission.EDIT_OWN_CONTENT,
    UnifiedPermission.DELETE_OWN_CONTENT
  ],

  [UnifiedUserType.REGISTERED]: [
    // 继承半匿名用户权限
    ...UNIFIED_USER_PERMISSIONS[UnifiedUserType.SEMI_ANONYMOUS],
    // 新增权限
    UnifiedPermission.EDIT_OWN_SUBMISSIONS,
    UnifiedPermission.DELETE_OWN_SUBMISSIONS,
    UnifiedPermission.DOWNLOAD_REPORTS,
    UnifiedPermission.EXPORT_OWN_DATA
  ],

  // 管理域用户权限
  [UnifiedUserType.REVIEWER]: [
    // 基础浏览权限
    UnifiedPermission.VIEW_HOME,
    UnifiedPermission.VIEW_ANALYTICS,
    UnifiedPermission.VIEW_STORIES,
    UnifiedPermission.VIEW_VOICES,

    // 审核权限
    UnifiedPermission.REVIEW_QUESTIONNAIRES,
    UnifiedPermission.REVIEW_STORIES,
    UnifiedPermission.REVIEW_VOICES,
    UnifiedPermission.APPROVE_CONTENT,
    UnifiedPermission.REJECT_CONTENT,
    UnifiedPermission.VIEW_REVIEW_HISTORY,
    UnifiedPermission.EXPORT_REVIEW_REPORTS,
    UnifiedPermission.MANAGE_REVIEW_QUEUE,
    UnifiedPermission.AI_REVIEW_ASSIST
  ],

  [UnifiedUserType.ADMIN]: [
    // 继承审核员权限
    ...UNIFIED_USER_PERMISSIONS[UnifiedUserType.REVIEWER],

    // 用户管理权限
    UnifiedPermission.MANAGE_USERS,
    UnifiedPermission.CREATE_REVIEWER,
    UnifiedPermission.EDIT_REVIEWER,
    UnifiedPermission.DELETE_REVIEWER,
    UnifiedPermission.VIEW_USER_ANALYTICS,

    // 内容管理权限
    UnifiedPermission.MANAGE_ALL_CONTENT,
    UnifiedPermission.EDIT_ANY_CONTENT,
    UnifiedPermission.DELETE_ANY_CONTENT,
    UnifiedPermission.VIEW_ALL_SUBMISSIONS,
    UnifiedPermission.EXPORT_ALL_DATA,

    // 分析权限
    UnifiedPermission.VIEW_ADMIN_ANALYTICS,
    UnifiedPermission.VIEW_DETAILED_STATS,
    UnifiedPermission.GENERATE_REPORTS,
    UnifiedPermission.DATA_VISUALIZATION,

    // AI管理权限
    UnifiedPermission.AI_CONFIG,
    UnifiedPermission.AI_MONITOR,
    UnifiedPermission.AI_COST_CONTROL
  ],

  [UnifiedUserType.SUPER_ADMIN]: [
    // 继承管理员权限
    ...UNIFIED_USER_PERMISSIONS[UnifiedUserType.ADMIN],

    // 系统管理权限
    UnifiedPermission.SYSTEM_SETTINGS,
    UnifiedPermission.VIEW_SYSTEM_LOGS,
    UnifiedPermission.MANAGE_API_KEYS,
    UnifiedPermission.DATABASE_OPERATIONS,
    UnifiedPermission.SECURITY_MANAGEMENT
  ]
};

// 路由权限映射
export const UNIFIED_ROUTE_PERMISSIONS: Record<string, UnifiedPermission[]> = {
  // 问卷域路由
  '/': [],
  '/analytics': [UnifiedPermission.VIEW_ANALYTICS],
  '/stories': [UnifiedPermission.VIEW_STORIES],
  '/voices': [UnifiedPermission.VIEW_VOICES],
  '/submit': [UnifiedPermission.SUBMIT_QUESTIONNAIRE],
  '/my-submissions': [UnifiedPermission.VIEW_OWN_SUBMISSIONS],

  // 管理域路由
  '/admin': [UnifiedPermission.VIEW_ADMIN_ANALYTICS],
  '/admin/dashboard': [UnifiedPermission.VIEW_ADMIN_ANALYTICS],
  '/admin/users': [UnifiedPermission.MANAGE_USERS],
  '/admin/content': [UnifiedPermission.MANAGE_ALL_CONTENT],
  '/admin/settings': [UnifiedPermission.SYSTEM_SETTINGS],
  '/admin/logs': [UnifiedPermission.VIEW_SYSTEM_LOGS],

  '/reviewer': [UnifiedPermission.REVIEW_QUESTIONNAIRES],
  '/reviewer/dashboard': [UnifiedPermission.REVIEW_QUESTIONNAIRES],
  '/reviewer/queue': [UnifiedPermission.MANAGE_REVIEW_QUEUE],
  '/reviewer/history': [UnifiedPermission.VIEW_REVIEW_HISTORY]
};

// 用户域检查函数
export const getUserDomain = (userType: UnifiedUserType): UserDomain => {
  switch (userType) {
    case UnifiedUserType.ANONYMOUS:
    case UnifiedUserType.SEMI_ANONYMOUS:
    case UnifiedUserType.REGISTERED:
      return UserDomain.QUESTIONNAIRE;

    case UnifiedUserType.REVIEWER:
    case UnifiedUserType.ADMIN:
    case UnifiedUserType.SUPER_ADMIN:
      return UserDomain.MANAGEMENT;

    default:
      return UserDomain.QUESTIONNAIRE;
  }
};

// 权限继承检查
export const hasPermission = (user: UnifiedUser, permission: UnifiedPermission): boolean => {
  return user.permissions.includes(permission);
};

// 路由访问检查
export const canAccessRoute = (user: UnifiedUser | null, route: string): UnifiedPermissionResult => {
  const requiredPermissions = UNIFIED_ROUTE_PERMISSIONS[route] || [];

  // 如果路由不需要权限，允许访问
  if (requiredPermissions.length === 0) {
    return { hasPermission: true };
  }

  // 如果用户未登录
  if (!user) {
    return {
      hasPermission: false,
      reason: '需要登录才能访问此页面',
      requiredPermissions,
      redirectSuggestion: '/login'
    };
  }

  // 检查是否具有任意一个所需权限
  const hasAccess = requiredPermissions.some(permission =>
    user.permissions.includes(permission)
  );

  if (!hasAccess) {
    const userDomain = getUserDomain(user.userType);
    return {
      hasPermission: false,
      reason: '您没有访问此页面的权限',
      requiredPermissions,
      userDomain,
      redirectSuggestion: userDomain === UserDomain.MANAGEMENT ? '/admin/login' : '/login'
    };
  }

  return { hasPermission: true };
};

/**
 * 角色权限管理工具
 * 用于细粒度的权限控制和验证
 */

import { User } from '../types';

// 定义角色类型
export type UserRole = 'reviewer' | 'admin' | 'super_admin';

// 定义权限类型
export type Permission = 
  // 审核员权限
  | 'review:read'
  | 'review:create'
  | 'review:update'
  | 'review:history'
  
  // 管理员权限
  | 'admin:dashboard'
  | 'admin:users'
  | 'admin:analytics'
  | 'admin:ai_moderation'
  | 'admin:tags'
  | 'admin:settings'
  | 'admin:api_management'
  | 'admin:api_docs'
  | 'admin:database'
  | 'admin:monitoring'
  
  // 超级管理员权限
  | 'super_admin:security_console'
  | 'super_admin:security_management'
  | 'super_admin:system_logs'
  | 'super_admin:system_management'
  | 'super_admin:emergency_control'
  | 'super_admin:project_control'
  | 'super_admin:threat_analysis'
  | 'super_admin:ip_management'
  | 'super_admin:admin_management';

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  reviewer: [
    'review:read',
    'review:create',
    'review:update',
    'review:history'
  ],
  admin: [
    // 继承审核员权限
    'review:read',
    'review:create',
    'review:update',
    'review:history',
    // 管理员专属权限
    'admin:dashboard',
    'admin:users',
    'admin:analytics',
    'admin:ai_moderation',
    'admin:tags',
    'admin:settings',
    'admin:api_management',
    'admin:api_docs',
    'admin:database',
    'admin:monitoring'
  ],
  super_admin: [
    // 继承管理员权限
    'review:read',
    'review:create',
    'review:update',
    'review:history',
    'admin:dashboard',
    'admin:users',
    'admin:analytics',
    'admin:ai_moderation',
    'admin:tags',
    'admin:settings',
    // 超级管理员专属权限（不包括普通管理员的技术功能）
    'super_admin:security_console',
    'super_admin:security_management',
    'super_admin:system_logs',
    'super_admin:system_management',
    'super_admin:emergency_control',
    'super_admin:project_control',
    'super_admin:threat_analysis',
    'super_admin:ip_management',
    'super_admin:admin_management'
  ]
};

// 功能模块权限映射
export const FEATURE_PERMISSIONS: Record<string, Permission[]> = {
  // 审核员功能
  reviewer_dashboard: ['review:read'],
  pending_reviews: ['review:read', 'review:create'],
  review_history: ['review:history'],

  // 共享管理功能
  admin_dashboard: ['admin:dashboard'],
  user_management: ['admin:users'],
  analytics: ['admin:analytics'],
  ai_moderation: ['admin:ai_moderation'],
  tag_management: ['admin:tags'],
  system_settings: ['admin:settings'],

  // 普通管理员专属功能
  api_management: ['admin:api_management'],
  api_documentation: ['admin:api_docs'],
  database_schema: ['admin:database'],
  system_monitoring: ['admin:monitoring'],

  // 超级管理员专属功能
  security_console: ['super_admin:security_console'],
  security_management: ['super_admin:security_management'],
  system_logs: ['super_admin:system_logs'],
  system_management: ['super_admin:system_management'],
  emergency_control: ['super_admin:emergency_control'],
  project_control: ['super_admin:project_control'],
  threat_analysis: ['super_admin:threat_analysis'],
  ip_management: ['super_admin:ip_management'],
  admin_management: ['super_admin:admin_management']
};

/**
 * 获取用户角色
 */
export const getUserRole = (user: User | null): UserRole | null => {
  if (!user) return null;
  return (user.role || user.userType) as UserRole;
};

/**
 * 获取用户权限列表
 */
export const getUserPermissions = (user: User | null): Permission[] => {
  const role = getUserRole(user);
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * 检查用户是否有指定权限
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
};

/**
 * 检查用户是否有任意一个指定权限
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  const userPermissions = getUserPermissions(user);
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * 检查用户是否有所有指定权限
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  const userPermissions = getUserPermissions(user);
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * 检查用户是否可以访问指定功能
 */
export const canAccessFeature = (user: User | null, feature: string): boolean => {
  const requiredPermissions = FEATURE_PERMISSIONS[feature];
  if (!requiredPermissions) return false;
  return hasAnyPermission(user, requiredPermissions);
};

/**
 * 检查用户角色
 */
export const isRole = (user: User | null, role: UserRole): boolean => {
  return getUserRole(user) === role;
};

/**
 * 检查是否为审核员
 */
export const isReviewer = (user: User | null): boolean => {
  return isRole(user, 'reviewer');
};

/**
 * 检查是否为管理员（不包括超级管理员）
 */
export const isAdmin = (user: User | null): boolean => {
  return isRole(user, 'admin');
};

/**
 * 检查是否为超级管理员
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return isRole(user, 'super_admin');
};

/**
 * 检查是否为任意管理员（包括超级管理员）
 */
export const isAnyAdmin = (user: User | null): boolean => {
  const role = getUserRole(user);
  return role === 'admin' || role === 'super_admin';
};

/**
 * 获取权限错误信息
 */
export const getPermissionErrorMessage = (user: User | null, requiredPermissions: Permission[]): string => {
  if (!user) {
    return '请先登录以访问此功能';
  }
  
  const userRole = getUserRole(user);
  const userPermissions = getUserPermissions(user);
  
  return `权限不足。当前角色: ${userRole}, 拥有权限: ${userPermissions.join(', ')}, 需要权限: ${requiredPermissions.join(', ')}`;
};

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}

/**
 * 详细权限检查
 */
export const checkPermissions = (user: User | null, requiredPermissions: Permission[]): PermissionCheckResult => {
  const userPermissions = getUserPermissions(user);
  const hasPermission = hasAnyPermission(user, requiredPermissions);
  
  if (hasPermission) {
    return { hasPermission: true };
  }
  
  return {
    hasPermission: false,
    reason: getPermissionErrorMessage(user, requiredPermissions),
    requiredPermissions,
    userPermissions
  };
};

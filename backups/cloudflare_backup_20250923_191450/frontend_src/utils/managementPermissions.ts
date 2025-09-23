/**
 * 管理系统权限检查工具
 * 专门处理管理员和审核员的权限验证
 */

import type {
  ManagementUser,
  ManagementPermission,
  ManagementPermissionResult,
  ManagementUserType
} from '../types/management-auth';

import {
  MANAGEMENT_USER_PERMISSIONS,
  MANAGEMENT_ROUTE_PERMISSIONS
} from '../types/management-auth';

/**
 * 检查用户是否具有指定权限
 */
export const hasManagementPermission = (
  user: ManagementUser | null,
  permission: ManagementPermission
): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission);
};

/**
 * 检查用户是否具有多个权限中的任意一个
 */
export const hasAnyManagementPermission = (
  user: ManagementUser | null,
  permissions: ManagementPermission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.some(permission => hasManagementPermission(user, permission));
};

/**
 * 检查用户是否具有所有指定权限
 */
export const hasAllManagementPermissions = (
  user: ManagementUser | null,
  permissions: ManagementPermission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.every(permission => hasManagementPermission(user, permission));
};

/**
 * 检查用户类型
 */
export const hasManagementUserType = (
  user: ManagementUser | null,
  userType: ManagementUserType
): boolean => {
  if (!user) return false;
  return user.userType === userType;
};

/**
 * 检查用户是否可以访问指定路由
 */
export const canAccessManagementRoute = (
  user: ManagementUser | null,
  route: string
): ManagementPermissionResult => {
  // 获取路由所需权限
  const requiredPermissions = MANAGEMENT_ROUTE_PERMISSIONS[route];
  
  // 如果路由不需要权限，允许访问
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return { hasPermission: true };
  }
  
  // 如果用户未登录
  if (!user) {
    return {
      hasPermission: false,
      reason: '需要登录才能访问此页面',
      requiredPermissions
    };
  }
  
  // 检查是否具有任意一个所需权限
  const hasAccess = hasAnyManagementPermission(user, requiredPermissions);
  
  if (!hasAccess) {
    return {
      hasPermission: false,
      reason: '您没有访问此页面的权限',
      requiredPermissions
    };
  }
  
  return { hasPermission: true };
};

/**
 * 检查是否为管理员（包括超级管理员）
 */
export const isAdmin = (user: ManagementUser | null): boolean => {
  if (!user) return false;
  return ['ADMIN', 'SUPER_ADMIN'].includes(user.userType);
};

/**
 * 检查是否为超级管理员
 */
export const isSuperAdmin = (user: ManagementUser | null): boolean => {
  return hasManagementUserType(user, 'SUPER_ADMIN');
};

/**
 * 检查是否为审核员（包括管理员）
 */
export const isReviewer = (user: ManagementUser | null): boolean => {
  if (!user) return false;
  return ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(user.userType);
};

/**
 * 检查是否可以审核问卷
 */
export const canReviewQuestionnaires = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'review_questionnaires');
};

/**
 * 检查是否可以审核故事
 */
export const canReviewStories = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'review_stories');
};

/**
 * 检查是否可以审核心声
 */
export const canReviewVoices = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'review_voices');
};

/**
 * 检查是否可以管理用户
 */
export const canManageUsers = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'manage_users');
};

/**
 * 检查是否可以创建审核员
 */
export const canCreateReviewer = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'create_reviewer');
};

/**
 * 检查是否可以查看系统设置
 */
export const canViewSystemSettings = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'system_settings');
};

/**
 * 检查是否可以查看系统日志
 */
export const canViewSystemLogs = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'view_system_logs');
};

/**
 * 检查是否可以管理API密钥
 */
export const canManageApiKeys = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'manage_api_keys');
};

/**
 * 检查是否可以进行数据库操作
 */
export const canPerformDatabaseOperations = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'database_operations');
};

/**
 * 检查是否可以查看管理员分析
 */
export const canViewAdminAnalytics = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'view_admin_analytics');
};

/**
 * 检查是否可以生成报告
 */
export const canGenerateReports = (user: ManagementUser | null): boolean => {
  return hasManagementPermission(user, 'generate_reports');
};

/**
 * 获取用户可访问的菜单项
 * @deprecated 此函数已废弃，请使用 RoleBasedHeader 组件中的菜单逻辑
 * 保留此函数仅为向后兼容，建议迁移到统一的导航组件
 */
export const getManagementAccessibleMenuItems = (user: ManagementUser | null) => {
  console.warn('getManagementAccessibleMenuItems is deprecated. Use RoleBasedHeader component instead.');

  const menuItems = [];

  // 基础权限检查，返回简化的菜单项
  if (canReviewQuestionnaires(user)) {
    menuItems.push({ key: 'reviewer', label: '审核工作台', path: '/reviewer/dashboard' });
  }

  if (canManageUsers(user)) {
    menuItems.push({ key: 'admin', label: '管理控制台', path: '/admin' });
  }

  if (canViewSystemSettings(user)) {
    menuItems.push({ key: 'super-admin', label: '安全控制台', path: '/admin/super-admin' });
  }

  return menuItems;
};

/**
 * 获取权限错误信息
 */
export const getManagementPermissionErrorMessage = (
  user: ManagementUser | null,
  requiredPermissions: ManagementPermission[]
): string => {
  if (!user) {
    return '请先登录管理系统后再访问此功能';
  }
  
  if (user.status !== 'active') {
    return '您的账号状态异常，请联系系统管理员';
  }
  
  return `您没有执行此操作的权限，需要权限：${requiredPermissions.join(', ')}`;
};

/**
 * 检查用户是否活跃
 */
export const isManagementUserActive = (user: ManagementUser | null): boolean => {
  if (!user) return false;
  return user.status === 'active';
};

/**
 * 获取用户权限摘要
 */
export const getManagementUserPermissionSummary = (user: ManagementUser | null) => {
  if (!user) {
    return {
      userType: null,
      permissions: [],
      isAdmin: false,
      isReviewer: false,
      isSuperAdmin: false,
      canManageUsers: false,
      canReviewContent: false,
      canViewSystemSettings: false
    };
  }
  
  return {
    userType: user.userType,
    permissions: user.permissions,
    isAdmin: isAdmin(user),
    isReviewer: isReviewer(user),
    isSuperAdmin: isSuperAdmin(user),
    canManageUsers: canManageUsers(user),
    canReviewContent: canReviewQuestionnaires(user) || canReviewStories(user) || canReviewVoices(user),
    canViewSystemSettings: canViewSystemSettings(user)
  };
};

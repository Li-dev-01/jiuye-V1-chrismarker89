import type {
  User,
  UserRole,
  Permission,
  PermissionCheckResult
} from '../types/auth';

import {
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  DEFAULT_REDIRECTS
} from '../types/auth';

/**
 * 检查用户是否具有指定权限
 */
export const hasPermission = (
  user: User | null, 
  permission: Permission
): boolean => {
  if (!user) return false;
  
  // 检查用户角色是否包含该权限
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(permission)) return true;
  
  // 检查用户自定义权限
  if (user.permissions && user.permissions.includes(permission)) return true;
  
  return false;
};

/**
 * 检查用户是否具有多个权限中的任意一个
 */
export const hasAnyPermission = (
  user: User | null, 
  permissions: Permission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * 检查用户是否具有所有指定权限
 */
export const hasAllPermissions = (
  user: User | null, 
  permissions: Permission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * 检查用户角色
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * 检查用户是否具有指定角色或更高权限
 */
export const hasRoleOrHigher = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  
  const roleHierarchy: UserRole[] = ['guest', 'user', 'reviewer', 'admin', 'super_admin'];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(role);
  
  return userRoleIndex >= requiredRoleIndex;
};

/**
 * 检查用户是否可以访问指定路由
 */
export const canAccessRoute = (user: User | null, route: string): PermissionCheckResult => {
  // 获取路由所需权限
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  
  // 如果路由不需要权限，允许访问
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return { hasPermission: true };
  }
  
  // 如果用户未登录，检查guest角色权限
  if (!user) {
    // 检查guest角色是否有所需权限
    const guestPermissions = ROLE_PERMISSIONS.guest || [];
    const hasGuestAccess = requiredPermissions.some(permission =>
      guestPermissions.includes(permission)
    );

    if (!hasGuestAccess) {
      return {
        hasPermission: false,
        reason: '需要登录才能访问此页面',
        requiredPermissions
      };
    }

    return { hasPermission: true };
  }
  
  // 检查是否具有任意一个所需权限
  const hasAccess = hasAnyPermission(user, requiredPermissions);
  
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
 * 获取用户的默认重定向路由
 */
export const getDefaultRedirect = (user: User | null): string => {
  if (!user) return '/';
  return DEFAULT_REDIRECTS[user.role] || '/';
};

/**
 * 检查是否为匿名用户
 */
export const isAnonymousUser = (user: User | null): boolean => {
  return user?.isAnonymous === true;
};

/**
 * 检查是否为管理员角色
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin') || hasRole(user, 'super_admin');
};

/**
 * 检查是否为审核员角色
 */
export const isReviewer = (user: User | null): boolean => {
  return hasRole(user, 'reviewer') || isAdmin(user);
};

/**
 * 检查是否为注册用户
 */
export const isRegisteredUser = (user: User | null): boolean => {
  return user !== null && !isAnonymousUser(user);
};

/**
 * 获取用户可访问的菜单项
 */
export const getAccessibleMenuItems = (user: User | null) => {
  const menuItems = [];
  
  // 基础菜单项
  if (hasPermission(user, 'view_home')) {
    menuItems.push({ key: 'home', label: '首页', path: '/' });
  }
  
  if (hasPermission(user, 'view_analytics')) {
    menuItems.push({ key: 'analytics', label: '数据可视化', path: '/analytics' });
  }
  
  if (hasPermission(user, 'view_stories')) {
    menuItems.push({ key: 'stories', label: '故事墙', path: '/stories' });
  }
  

  
  // 用户功能菜单
  if (hasPermission(user, 'create_questionnaire')) {
    menuItems.push({ key: 'questionnaire', label: '问卷调查', path: '/questionnaire' });
  }
  
  if (hasPermission(user, 'view_own_submissions')) {
    menuItems.push({ key: 'profile', label: '个人中心', path: '/profile' });
  }
  
  // 审核员菜单
  if (hasRole(user, 'reviewer')) {
    menuItems.push({ key: 'reviewer', label: '审核工作台', path: '/reviewer' });
  }
  
  // 管理员菜单
  if (isAdmin(user)) {
    menuItems.push({ key: 'admin', label: '管理后台', path: '/admin' });
  }
  
  return menuItems;
};

/**
 * 获取角色显示名称
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    guest: '访客',
    user: '用户',
    reviewer: '审核员',
    admin: '管理员',
    super_admin: '超级管理员'
  };
  
  return roleNames[role] || '未知角色';
};

/**
 * 检查用户状态是否正常
 */
export const isUserActive = (user: User | null): boolean => {
  return user?.status === 'active';
};

/**
 * 生成匿名用户ID
 */
export const generateAnonymousId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `anon_${timestamp}_${random}`;
};

/**
 * 检查是否需要重新登录
 */
export const needsReauth = (user: User | null, requiredRole: UserRole): boolean => {
  if (!user) return true;
  
  // 如果当前用户角色不足，需要重新登录
  if (!hasRoleOrHigher(user, requiredRole)) return true;
  
  // 如果用户状态异常，需要重新登录
  if (!isUserActive(user)) return true;
  
  return false;
};

/**
 * 获取权限错误信息
 */
export const getPermissionErrorMessage = (
  user: User | null, 
  requiredPermissions: Permission[]
): string => {
  if (!user) {
    return '请先登录后再访问此功能';
  }
  
  if (!isUserActive(user)) {
    return '您的账号状态异常，请联系管理员';
  }
  
  return `您没有执行此操作的权限，需要权限：${requiredPermissions.join(', ')}`;
};

/**
 * 统一权限系统
 * 定义所有角色和权限
 */

/**
 * 角色定义
 */
export enum Role {
  REVIEWER = 'reviewer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * 权限定义
 */
export enum Permission {
  // 审核员权限
  VIEW_STORIES = 'view_stories',
  REVIEW_STORIES = 'review_stories',
  APPROVE_STORIES = 'approve_stories',
  REJECT_STORIES = 'reject_stories',
  
  // 管理员权限
  MANAGE_REVIEWERS = 'manage_reviewers',
  VIEW_STATISTICS = 'view_statistics',
  EXPORT_DATA = 'export_data',
  MANAGE_SETTINGS = 'manage_settings',
  
  // 超级管理员权限
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_ACCOUNTS = 'manage_accounts',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_DATABASE = 'manage_database'
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.REVIEWER]: [
    Permission.VIEW_STORIES,
    Permission.REVIEW_STORIES,
    Permission.APPROVE_STORIES,
    Permission.REJECT_STORIES
  ],
  
  [Role.ADMIN]: [
    // 继承审核员权限
    Permission.VIEW_STORIES,
    Permission.REVIEW_STORIES,
    Permission.APPROVE_STORIES,
    Permission.REJECT_STORIES,
    // 管理员特有权限
    Permission.MANAGE_REVIEWERS,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SETTINGS
  ],
  
  [Role.SUPER_ADMIN]: [
    // 继承管理员权限
    Permission.VIEW_STORIES,
    Permission.REVIEW_STORIES,
    Permission.APPROVE_STORIES,
    Permission.REJECT_STORIES,
    Permission.MANAGE_REVIEWERS,
    Permission.VIEW_STATISTICS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SETTINGS,
    // 超级管理员特有权限
    Permission.MANAGE_ADMINS,
    Permission.MANAGE_ACCOUNTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM,
    Permission.MANAGE_DATABASE
  ]
};

/**
 * 检查角色是否有指定权限
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * 检查角色是否有任意一个权限
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * 检查角色是否有所有权限
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * 获取角色的所有权限
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 角色层级（用于权限继承）
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.REVIEWER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3
};

/**
 * 检查角色A是否高于角色B
 */
export function isRoleHigherThan(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * 检查角色A是否高于或等于角色B
 */
export function isRoleHigherOrEqual(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * 权限描述（用于UI显示）
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.VIEW_STORIES]: '查看故事',
  [Permission.REVIEW_STORIES]: '审核故事',
  [Permission.APPROVE_STORIES]: '批准故事',
  [Permission.REJECT_STORIES]: '拒绝故事',
  [Permission.MANAGE_REVIEWERS]: '管理审核员',
  [Permission.VIEW_STATISTICS]: '查看统计',
  [Permission.EXPORT_DATA]: '导出数据',
  [Permission.MANAGE_SETTINGS]: '管理设置',
  [Permission.MANAGE_ADMINS]: '管理管理员',
  [Permission.MANAGE_ACCOUNTS]: '管理账户',
  [Permission.VIEW_AUDIT_LOGS]: '查看审计日志',
  [Permission.MANAGE_SYSTEM]: '管理系统',
  [Permission.MANAGE_DATABASE]: '管理数据库'
};

/**
 * 角色描述（用于UI显示）
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.REVIEWER]: '审核员',
  [Role.ADMIN]: '管理员',
  [Role.SUPER_ADMIN]: '超级管理员'
};

/**
 * 将字符串转换为角色枚举
 */
export function stringToRole(roleStr: string): Role | null {
  const normalizedRole = roleStr.toLowerCase();
  
  switch (normalizedRole) {
    case 'reviewer':
      return Role.REVIEWER;
    case 'admin':
      return Role.ADMIN;
    case 'super_admin':
    case 'superadmin':
      return Role.SUPER_ADMIN;
    default:
      return null;
  }
}

/**
 * 将权限字符串转换为权限枚举
 */
export function stringToPermission(permissionStr: string): Permission | null {
  const normalizedPermission = permissionStr.toLowerCase();
  
  for (const [key, value] of Object.entries(Permission)) {
    if (value === normalizedPermission) {
      return value as Permission;
    }
  }
  
  return null;
}

/**
 * 验证权限数组
 */
export function validatePermissions(permissions: string[]): boolean {
  return permissions.every(permission => {
    return Object.values(Permission).includes(permission as Permission);
  });
}

/**
 * 获取角色的默认权限（用于创建账号时）
 */
export function getDefaultPermissions(role: Role): string[] {
  return getRolePermissions(role).map(p => p.toString());
}


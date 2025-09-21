/**
 * 问卷系统权限检查工具
 * 专门处理半匿名用户的权限验证
 */

import type {
  QuestionnaireUser,
  QuestionnairePermission,
  QuestionnairePermissionResult,
  QuestionnaireUserType
} from '../types/questionnaire-auth';

import {
  QUESTIONNAIRE_USER_PERMISSIONS,
  QUESTIONNAIRE_ROUTE_PERMISSIONS
} from '../types/questionnaire-auth';

/**
 * 检查用户是否具有指定权限
 */
export const hasQuestionnairePermission = (
  user: QuestionnaireUser | null,
  permission: QuestionnairePermission
): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission);
};

/**
 * 检查用户是否具有多个权限中的任意一个
 */
export const hasAnyQuestionnairePermission = (
  user: QuestionnaireUser | null,
  permissions: QuestionnairePermission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.some(permission => hasQuestionnairePermission(user, permission));
};

/**
 * 检查用户是否具有所有指定权限
 */
export const hasAllQuestionnairePermissions = (
  user: QuestionnaireUser | null,
  permissions: QuestionnairePermission[]
): boolean => {
  if (!user || !permissions.length) return false;
  return permissions.every(permission => hasQuestionnairePermission(user, permission));
};

/**
 * 检查用户类型
 */
export const hasQuestionnaireUserType = (
  user: QuestionnaireUser | null,
  userType: QuestionnaireUserType
): boolean => {
  if (!user) return false;
  return user.userType === userType;
};

/**
 * 检查用户是否可以访问指定路由
 */
export const canAccessQuestionnaireRoute = (
  user: QuestionnaireUser | null,
  route: string
): QuestionnairePermissionResult => {
  // 获取路由所需权限
  const requiredPermissions = QUESTIONNAIRE_ROUTE_PERMISSIONS[route];
  
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
  const hasAccess = hasAnyQuestionnairePermission(user, requiredPermissions);
  
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
 * 检查用户是否可以提交问卷
 */
export const canSubmitQuestionnaire = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'submit_questionnaire');
};

/**
 * 检查用户是否可以查看自己的提交
 */
export const canViewOwnSubmissions = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'view_own_submissions');
};

/**
 * 检查用户是否可以编辑自己的内容
 */
export const canEditOwnContent = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'edit_own_content');
};

/**
 * 检查用户是否可以删除自己的内容
 */
export const canDeleteOwnContent = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'delete_own_content');
};

/**
 * 检查用户是否可以下载报告
 */
export const canDownloadReports = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'download_reports');
};

/**
 * 检查用户是否可以创建故事
 */
export const canCreateStory = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'create_story');
};

/**
 * 检查用户是否可以创建心声
 */
export const canCreateVoice = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnairePermission(user, 'create_voice');
};

/**
 * 检查用户是否为半匿名用户
 */
export const isSemiAnonymousUser = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnaireUserType(user, 'SEMI_ANONYMOUS');
};

/**
 * 检查用户是否为匿名用户
 */
export const isAnonymousUser = (user: QuestionnaireUser | null): boolean => {
  return hasQuestionnaireUserType(user, 'ANONYMOUS');
};

/**
 * 获取用户可访问的菜单项
 */
export const getQuestionnaireAccessibleMenuItems = (user: QuestionnaireUser | null) => {
  const menuItems = [];
  
  // 基础菜单项
  if (hasQuestionnairePermission(user, 'view_home')) {
    menuItems.push({ key: 'home', label: '首页', path: '/' });
  }
  
  if (hasQuestionnairePermission(user, 'view_analytics')) {
    menuItems.push({ key: 'analytics', label: '数据可视化', path: '/analytics' });
  }
  
  if (hasQuestionnairePermission(user, 'view_stories')) {
    menuItems.push({ key: 'stories', label: '故事墙', path: '/stories' });
  }
  
  if (hasQuestionnairePermission(user, 'view_voices')) {
    menuItems.push({ key: 'voices', label: '问卷心声', path: '/voices' });
  }
  
  // 问卷功能菜单
  if (hasQuestionnairePermission(user, 'submit_questionnaire')) {
    menuItems.push({ key: 'questionnaire', label: '问卷调查', path: '/questionnaire' });
  }
  
  if (hasQuestionnairePermission(user, 'view_own_submissions')) {
    menuItems.push({ key: 'my-submissions', label: '我的提交', path: '/my-submissions' });
  }
  
  // 内容创建菜单
  if (hasQuestionnairePermission(user, 'create_story')) {
    menuItems.push({ key: 'create-story', label: '分享故事', path: '/create-story' });
  }
  
  if (hasQuestionnairePermission(user, 'create_voice')) {
    menuItems.push({ key: 'create-voice', label: '发表心声', path: '/create-voice' });
  }
  
  return menuItems;
};

/**
 * 获取权限错误信息
 */
export const getQuestionnairePermissionErrorMessage = (
  user: QuestionnaireUser | null,
  requiredPermissions: QuestionnairePermission[]
): string => {
  if (!user) {
    return '请先进行身份验证后再访问此功能';
  }
  
  return `您没有执行此操作的权限，需要权限：${requiredPermissions.join(', ')}`;
};

/**
 * 检查用户是否活跃
 */
export const isQuestionnaireUserActive = (user: QuestionnaireUser | null): boolean => {
  if (!user) return false;
  
  // 检查最后活跃时间（例如：7天内）
  const lastActiveTime = new Date(user.last_active_at);
  const now = new Date();
  const daysDiff = (now.getTime() - lastActiveTime.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDiff <= 7;
};

/**
 * 获取用户权限摘要
 */
export const getQuestionnaireUserPermissionSummary = (user: QuestionnaireUser | null) => {
  if (!user) {
    return {
      userType: null,
      permissions: [],
      canSubmitQuestionnaire: false,
      canViewOwnSubmissions: false,
      canCreateContent: false,
      canDownloadReports: false
    };
  }

  return {
    userType: user.userType,
    permissions: user.permissions,
    canSubmitQuestionnaire: canSubmitQuestionnaire(user),
    canViewOwnSubmissions: canViewOwnSubmissions(user),
    canCreateContent: canCreateStory(user) || canCreateVoice(user),
    canDownloadReports: canDownloadReports(user)
  };
};

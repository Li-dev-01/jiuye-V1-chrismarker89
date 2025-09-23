/**
 * 问卷系统认证类型定义
 * 专门用于半匿名用户的问卷相关功能
 */

// 问卷用户类型
export type QuestionnaireUserType = 'ANONYMOUS' | 'SEMI_ANONYMOUS';

// 问卷系统权限
export type QuestionnairePermission = 
  // 基础浏览权限
  | 'view_home'
  | 'view_analytics'
  | 'view_stories'
  | 'view_voices'
  
  // 问卷相关权限
  | 'submit_questionnaire'
  | 'view_own_submissions'
  | 'edit_own_submissions'
  | 'delete_own_submissions'
  
  // 内容创建权限
  | 'create_story'
  | 'create_voice'
  | 'edit_own_content'
  | 'delete_own_content'
  
  // 下载权限
  | 'download_reports'
  | 'export_own_data';

// 问卷用户信息
export interface QuestionnaireUser {
  uuid: string;
  userType: QuestionnaireUserType;
  display_name: string;
  identityHash: string; // A+B组合的哈希值
  permissions: QuestionnairePermission[];
  created_at: string;
  last_active_at: string;
  metadata?: {
    deviceFingerprint?: string;
    loginCount?: number;
    lastLoginIP?: string;
  };
}

// 问卷用户会话
export interface QuestionnaireSession {
  sessionId: string;
  userUuid: string;
  deviceFingerprint: string;
  userAgent?: string;
  ipAddress?: string;
  created_at: string;
  expires_at: string;
  isActive: boolean;
}

// A+B 登录凭据
export interface ABCredentials {
  identityA: string; // 通常是手机号
  identityB: string; // 通常是验证码
  remember?: boolean;
}

// 问卷认证结果
export interface QuestionnaireAuthResult {
  success: boolean;
  user?: QuestionnaireUser;
  session?: QuestionnaireSession;
  error?: string;
  message?: string;
}

// 问卷权限检查结果
export interface QuestionnairePermissionResult {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions?: QuestionnairePermission[];
}

// 用户类型权限映射
export const QUESTIONNAIRE_USER_PERMISSIONS: Record<QuestionnaireUserType, QuestionnairePermission[]> = {
  ANONYMOUS: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices'
  ],
  SEMI_ANONYMOUS: [
    'view_home',
    'view_analytics',
    'view_stories',
    'view_voices',
    'submit_questionnaire',
    'view_own_submissions',
    'edit_own_submissions',
    'delete_own_submissions',
    'create_story',
    'create_voice',
    'edit_own_content',
    'delete_own_content',
    'download_reports',
    'export_own_data'
  ]
};

// 问卷路由权限映射
export const QUESTIONNAIRE_ROUTE_PERMISSIONS: Record<string, QuestionnairePermission[]> = {
  '/': ['view_home'],
  '/analytics': ['view_analytics'],
  '/stories': ['view_stories'],
  '/voices': ['view_voices'],
  '/questionnaire': ['submit_questionnaire'],
  '/questionnaire/new': ['submit_questionnaire'],
  '/questionnaire/edit': ['edit_own_submissions'],
  '/my-submissions': ['view_own_submissions'],
  '/my-content': ['view_own_submissions'],
  '/profile': ['view_own_submissions'],
  '/download': ['download_reports'],
  '/export': ['export_own_data']
};

// 会话配置
export const QUESTIONNAIRE_SESSION_CONFIG = {
  ANONYMOUS: 24 * 60 * 60 * 1000,      // 24小时
  SEMI_ANONYMOUS: 7 * 24 * 60 * 60 * 1000, // 7天
};

// A+B 验证规则
export const AB_VALIDATION_RULES = {
  identityA: {
    pattern: /^\d{11}$/,
    message: 'A值必须是11位数字'
  },
  identityB: {
    pattern: /^\d{4}$|^\d{6}$/,
    message: 'B值必须是4位或6位数字'
  }
};

// 预置测试组合
export const TEST_AB_COMBINATIONS = [
  { a: '13812345678', b: '1234', name: '测试用户1' },
  { a: '13987654321', b: '123456', name: '测试用户2' },
  { a: '15612345678', b: '0000', name: '测试用户3' },
  { a: '18812345678', b: '888888', name: '测试用户4' },
  { a: '13611111111', b: '1111', name: '测试用户5' },
  { a: '13722222222', b: '222222', name: '测试用户6' }
];

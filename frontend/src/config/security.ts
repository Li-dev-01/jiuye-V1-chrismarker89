/**
 * 安全配置 - 统一登录入口策略
 * 
 * 为了提高安全性和简化管理，我们实施统一登录入口策略：
 * 1. 只保留一个项目管理入口：/management
 * 2. 所有其他管理登录路径重定向到统一入口
 * 3. 用户问卷登录保持独立：/auth/login
 */

export const SECURITY_CONFIG = {
  // 统一登录入口
  UNIFIED_MANAGEMENT_ENTRY: '/management',
  
  // 用户问卷登录入口
  QUESTIONNAIRE_LOGIN_ENTRY: '/auth/login',
  
  // 被重定向的旧登录路径（安全考虑）
  DEPRECATED_LOGIN_ROUTES: [
    '/login',
    '/admin/login',
    '/admin/login-old',
    '/admin/login-new',
    '/reviewer/login',
    '/management-portal',
    '/management-login'
  ],
  
  // 允许的认证相关路径
  ALLOWED_AUTH_ROUTES: [
    '/management',                    // 统一管理入口
    '/auth/login',                   // 用户问卷登录
    '/auth/auto-login',              // 自动登录接收
    '/auth/google/callback',         // Google OAuth回调
    '/auth/google/callback/questionnaire',
    '/auth/google/callback/management',
    '/auth/guide'                    // 登录方式引导
  ],
  
  // 安全策略
  SECURITY_POLICIES: {
    // 强制重定向到统一入口
    FORCE_UNIFIED_ENTRY: true,
    
    // 禁用旧的登录页面
    DISABLE_LEGACY_LOGIN_PAGES: true,
    
    // 启用登录路径监控
    ENABLE_LOGIN_PATH_MONITORING: true,
    
    // 记录重定向日志
    LOG_REDIRECTIONS: process.env.NODE_ENV === 'development'
  }
};

/**
 * 检查路径是否为已弃用的登录路径
 */
export function isDeprecatedLoginRoute(path: string): boolean {
  return SECURITY_CONFIG.DEPRECATED_LOGIN_ROUTES.includes(path);
}

/**
 * 检查路径是否为允许的认证路径
 */
export function isAllowedAuthRoute(path: string): boolean {
  return SECURITY_CONFIG.ALLOWED_AUTH_ROUTES.includes(path);
}

/**
 * 获取统一管理入口路径
 */
export function getUnifiedManagementEntry(): string {
  return SECURITY_CONFIG.UNIFIED_MANAGEMENT_ENTRY;
}

/**
 * 获取用户问卷登录入口路径
 */
export function getQuestionnaireLoginEntry(): string {
  return SECURITY_CONFIG.QUESTIONNAIRE_LOGIN_ENTRY;
}

/**
 * 记录登录路径重定向（开发环境）
 */
export function logLoginRedirection(from: string, to: string): void {
  if (SECURITY_CONFIG.SECURITY_POLICIES.LOG_REDIRECTIONS) {
    console.log(`[Security] Login route redirected: ${from} -> ${to}`);
  }
}

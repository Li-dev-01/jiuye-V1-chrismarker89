export const API_CONFIG = {
  BASE_URL: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
  TIMEOUT: 30000, // 增加到 30 秒，用于数据库结构等复杂查询
  ENDPOINTS: {
    // 简化认证相关 (新的简化API)
    LOGIN: '/api/simple-auth/login',
    VERIFY: '/api/simple-auth/verify',
    ME: '/api/simple-auth/me',

    // 简化审核员相关 (新的简化API)
    REVIEWER_DASHBOARD: '/api/simple-reviewer/dashboard',
    REVIEWER_PENDING: '/api/simple-reviewer/pending-reviews',
    REVIEWER_REVIEW: '/api/simple-reviewer/submit-review',
    REVIEWER_HISTORY: '/api/simple-reviewer/history',
    REVIEWER_STATS: '/api/simple-reviewer/stats',

    // 管理员相关 (简化API)
    ADMIN_DASHBOARD: '/api/simple-admin/dashboard',
    ADMIN_DASHBOARD_STATS: '/api/simple-admin/dashboard', // 修复：使用正确的端点
    ADMIN_USERS: '/api/simple-admin/users',
    ADMIN_QUESTIONNAIRES: '/api/simple-admin/questionnaires',
    ADMIN_STORIES: '/api/simple-admin/stories',
    ADMIN_ANALYTICS: '/api/simple-admin/analytics',
    ADMIN_SETTINGS: '/api/simple-admin/settings',
    ADMIN_LOGS: '/api/simple-admin/logs',

    // 新增：项目统计相关
    PROJECT_STATISTICS: '/api/simple-admin/project/statistics',
    REAL_TIME_STATS: '/api/simple-admin/project/real-time-stats',
    DATABASE_SCHEMA: '/api/simple-admin/database/schema',

    // 标签管理相关
    CONTENT_TAGS: '/api/simple-admin/content/tags',
    CONTENT_TAGS_STATS: '/api/simple-admin/content/tags/stats',
    CONTENT_TAGS_CLEANUP: '/api/simple-admin/content/tags/cleanup',

    // 超级管理员相关 (真实API)
    SUPER_ADMIN_PROJECT_STATUS: '/api/super-admin/project/status',
    SUPER_ADMIN_PROJECT_CONTROL: '/api/super-admin/project/control',
    SUPER_ADMIN_SECURITY_METRICS: '/api/super-admin/security/metrics',
    SUPER_ADMIN_SECURITY_THREATS: '/api/super-admin/security/threats',
    SUPER_ADMIN_EMERGENCY_SHUTDOWN: '/api/super-admin/emergency/shutdown',
    SUPER_ADMIN_PROJECT_RESTORE: '/api/super-admin/project/restore',
    SUPER_ADMIN_SYSTEM_LOGS: '/api/super-admin/system/logs',
    SUPER_ADMIN_OPERATION_LOGS: '/api/super-admin/operation/logs',
    SUPER_ADMIN_BLOCK_IP: '/api/super-admin/security/block-ip'
  }
};

export const STORAGE_KEYS = {
  // 审核员存储
  REVIEWER_TOKEN: 'reviewer_token',
  REVIEWER_USER_INFO: 'reviewer_user_info',

  // 管理员存储
  ADMIN_TOKEN: 'admin_token',
  ADMIN_USER_INFO: 'admin_user_info',

  // 超级管理员存储
  SUPER_ADMIN_TOKEN: 'super_admin_token',
  SUPER_ADMIN_USER_INFO: 'super_admin_user_info',

  // 通用存储（向后兼容）
  USER_INFO: 'reviewer_user_info'
};

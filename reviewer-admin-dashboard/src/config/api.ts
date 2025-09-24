export const API_CONFIG = {
  BASE_URL: 'https://employment-survey-api-prod.chrismarker89.workers.dev',
  TIMEOUT: 10000,
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
    CONTENT_TAGS_CLEANUP: '/api/simple-admin/content/tags/cleanup'
  }
};

export const STORAGE_KEYS = {
  REVIEWER_TOKEN: 'reviewer_token',
  USER_INFO: 'reviewer_user_info'
};

-- UUID用户管理系统迁移
-- 添加UUID系统相关表

-- =====================================================
-- 统一用户表 (Universal Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS universal_users (
    uuid TEXT PRIMARY KEY,
    user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin')),
    identity_hash TEXT UNIQUE, -- 半匿名用户的身份哈希
    username TEXT UNIQUE,      -- 实名用户的用户名
    password_hash TEXT,        -- 实名用户的密码哈希
    display_name TEXT,
    role TEXT,
    permissions TEXT,          -- JSON格式
    profile TEXT,              -- JSON格式
    metadata TEXT,             -- JSON格式
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_universal_users_type ON universal_users(user_type);
CREATE INDEX IF NOT EXISTS idx_universal_users_identity_hash ON universal_users(identity_hash);
CREATE INDEX IF NOT EXISTS idx_universal_users_username ON universal_users(username);
CREATE INDEX IF NOT EXISTS idx_universal_users_status ON universal_users(status);
CREATE INDEX IF NOT EXISTS idx_universal_users_created_at ON universal_users(created_at);

-- =====================================================
-- 用户会话表 (User Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,          -- JSON格式
    expires_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_uuid ON user_sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- =====================================================
-- 用户内容关联表 (User Content Mappings)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_content_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('questionnaire', 'story', 'voice', 'comment', 'download', 'analytics')),
    content_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'archived')),
    metadata TEXT,             -- JSON格式
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE,
    UNIQUE(content_type, content_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_content_mappings_user_uuid ON user_content_mappings(user_uuid);
CREATE INDEX IF NOT EXISTS idx_content_mappings_content_type ON user_content_mappings(content_type);
CREATE INDEX IF NOT EXISTS idx_content_mappings_status ON user_content_mappings(status);

-- =====================================================
-- 身份验证日志表 (Authentication Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT,
    user_type TEXT,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'refresh', 'validate', 'conflict_check', 'failed_attempt')),
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    success INTEGER NOT NULL,
    error_message TEXT,
    metadata TEXT,             -- JSON格式
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_uuid ON auth_logs(user_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- =====================================================
-- 用户统计缓存表 (User Statistics Cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_statistics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    user_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,             -- JSON格式
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(stat_date, user_type, metric_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stats_cache_date ON user_statistics_cache(stat_date);
CREATE INDEX IF NOT EXISTS idx_stats_cache_type ON user_statistics_cache(user_type);
CREATE INDEX IF NOT EXISTS idx_stats_cache_metric ON user_statistics_cache(metric_name);

-- =====================================================
-- 插入默认数据
-- =====================================================

-- 默认超级管理员用户
INSERT OR IGNORE INTO universal_users (
    uuid, 
    user_type, 
    username, 
    password_hash, 
    display_name, 
    role, 
    permissions, 
    profile, 
    metadata, 
    status
) VALUES 
(
    'super-550e8400-e29b-41d4-a716-446655440000',
    'super_admin',
    'superadmin',
    '5cb96cf6e18e63ba9e269a78eada4fa6:847fa5475ea0d47bed0a390fcd50db859ce38911db93a71d9df8aca49860f23d', -- password: admin123
    '超级管理员',
    'super_admin',
    '["all_permissions"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": true, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": true, "dataRetention": 365}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}}',
    'active'
),
(
    'admin-550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin1',
    '5cb96cf6e18e63ba9e269a78eada4fa6:847fa5475ea0d47bed0a390fcd50db859ce38911db93a71d9df8aca49860f23d', -- password: admin123
    '管理员',
    'admin',
    '["browse_content", "project_management", "create_reviewer", "manage_users", "view_all_content", "system_settings", "view_all_stats", "review_content", "approve_content", "reject_content"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": true, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": true, "dataRetention": 90}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}}',
    'active'
),
(
    'rev-550e8400-e29b-41d4-a716-446655440002',
    'reviewer',
    'reviewerA',
    '5cb96cf6e18e63ba9e269a78eada4fa6:847fa5475ea0d47bed0a390fcd50db859ce38911db93a71d9df8aca49860f23d', -- password: admin123
    '审核员A',
    'reviewer',
    '["browse_content", "review_content", "approve_content", "reject_content", "view_review_stats", "manage_review_queue"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": false, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": false, "dataRetention": 30}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}, "reviewStats": {"totalReviewed": 0, "approved": 0, "rejected": 0, "dailyQuota": 50, "todayReviewed": 0, "averageReviewTime": 0}}',
    'active'
);

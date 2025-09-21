-- SQLite版本的UUID用户管理系统表结构
-- 适用于Cloudflare D1数据库

-- =====================================================
-- 1. 统一用户表 (Universal Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS universal_users (
    uuid TEXT PRIMARY KEY,
    user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin')),
    identity_hash TEXT UNIQUE, -- 半匿名用户的身份哈希
    username TEXT UNIQUE,       -- 实名用户的用户名
    password_hash TEXT,        -- 实名用户的密码哈希
    display_name TEXT,
    role TEXT,
    permissions TEXT, -- JSON字符串
    profile TEXT,     -- JSON字符串
    metadata TEXT,    -- JSON字符串
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_universal_users_user_type ON universal_users(user_type);
CREATE INDEX IF NOT EXISTS idx_universal_users_identity_hash ON universal_users(identity_hash);
CREATE INDEX IF NOT EXISTS idx_universal_users_username ON universal_users(username);
CREATE INDEX IF NOT EXISTS idx_universal_users_status ON universal_users(status);
CREATE INDEX IF NOT EXISTS idx_universal_users_created_at ON universal_users(created_at);
CREATE INDEX IF NOT EXISTS idx_universal_users_last_active ON universal_users(last_active_at);

-- =====================================================
-- 2. 用户会话表 (User Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT, -- JSON字符串
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_uuid ON user_sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- =====================================================
-- 3. 用户内容关联表 (User Content Mappings)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_content_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('questionnaire', 'story', 'voice', 'comment', 'download', 'analytics')),
    content_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'archived')),
    metadata TEXT, -- JSON字符串
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE,
    UNIQUE(content_type, content_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_content_mappings_user_uuid ON user_content_mappings(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_content_mappings_content_type ON user_content_mappings(content_type);
CREATE INDEX IF NOT EXISTS idx_user_content_mappings_content_id ON user_content_mappings(content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_mappings_status ON user_content_mappings(status);

-- =====================================================
-- 4. 身份验证日志表 (Authentication Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT,
    user_type TEXT CHECK (user_type IN ('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin')),
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'refresh', 'validate', 'conflict_check', 'failed_attempt')),
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    success INTEGER NOT NULL,
    error_message TEXT,
    metadata TEXT, -- JSON字符串
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_uuid ON auth_logs(user_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_type ON auth_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- =====================================================
-- 5. 插入默认管理员用户
-- =====================================================
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
    '审核员A',
    'reviewer',
    '["browse_content", "review_content", "approve_content", "reject_content", "view_review_stats", "manage_review_queue"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": false, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": false, "dataRetention": 30}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}, "reviewStats": {"totalReviewed": 0, "approved": 0, "rejected": 0, "dailyQuota": 50, "todayReviewed": 0, "averageReviewTime": 0}}',
    'active'
);

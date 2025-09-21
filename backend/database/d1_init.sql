-- Cloudflare D1 (SQLite) 数据库初始化脚本
-- 创建所有必要的表结构

-- =====================================================
-- 1. 统一用户表
-- =====================================================
CREATE TABLE IF NOT EXISTS universal_users (
    uuid TEXT PRIMARY KEY,
    user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin')),
    identity_hash TEXT UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT,
    display_name TEXT,
    role TEXT,
    permissions TEXT, -- JSON as TEXT in SQLite
    profile TEXT,     -- JSON as TEXT in SQLite
    metadata TEXT,    -- JSON as TEXT in SQLite
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. 用户会话表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT, -- JSON as TEXT
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- =====================================================
-- 3. 统一问卷回答表
-- =====================================================
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_uuid TEXT UNIQUE NOT NULL,
    user_uuid TEXT NOT NULL,
    session_id TEXT,
    form_data TEXT NOT NULL, -- JSON as TEXT
    completion_status TEXT DEFAULT 'draft' CHECK (completion_status IN ('draft', 'partial', 'completed')),
    completion_percentage REAL DEFAULT 0.0,
    device_type TEXT,
    browser_info TEXT,
    ip_hash TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'pending' CHECK (audit_status IN ('pending', 'approved', 'rejected')),
    audit_notes TEXT,
    reviewer_uuid TEXT,
    reviewed_at DATETIME,
    is_valid INTEGER DEFAULT 1,
    quality_score REAL DEFAULT 1.0,
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- =====================================================
-- 4. 原始心声表
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags TEXT, -- JSON as TEXT
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- =====================================================
-- 5. 有效心声表
-- =====================================================
CREATE TABLE IF NOT EXISTS valid_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5),
    tags TEXT, -- JSON as TEXT
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (raw_id) REFERENCES raw_heart_voices(id)
);

-- =====================================================
-- 6. 原始故事表
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_story_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT, -- JSON as TEXT
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- =====================================================
-- 7. 有效故事表
-- =====================================================
CREATE TABLE IF NOT EXISTS valid_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT, -- JSON as TEXT
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (raw_id) REFERENCES raw_story_submissions(id)
);

-- =====================================================
-- 8. 审核记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL CHECK (content_type IN ('questionnaire', 'heart_voice', 'story')),
    content_id INTEGER NOT NULL,
    content_uuid TEXT,
    user_uuid TEXT,
    audit_result TEXT DEFAULT 'pending' CHECK (audit_result IN ('pending', 'approved', 'rejected')),
    reviewer_id TEXT,
    audit_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. 用户内容关联表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_content_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('questionnaire', 'story', 'voice', 'comment', 'download', 'analytics')),
    content_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'archived')),
    metadata TEXT, -- JSON as TEXT
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE
);

-- =====================================================
-- 10. 认证日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT,
    user_type TEXT,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_attempt', 'token_refresh', 'password_change')),
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 创建索引
-- =====================================================

-- universal_users 索引
CREATE INDEX IF NOT EXISTS idx_universal_users_type ON universal_users(user_type);
CREATE INDEX IF NOT EXISTS idx_universal_users_username ON universal_users(username);
CREATE INDEX IF NOT EXISTS idx_universal_users_status ON universal_users(status);

-- user_sessions 索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_uuid ON user_sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- universal_questionnaire_responses 索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_uuid ON universal_questionnaire_responses(user_uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_status ON universal_questionnaire_responses(audit_status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_submitted ON universal_questionnaire_responses(submitted_at);

-- raw_heart_voices 索引
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_user ON raw_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_status ON raw_heart_voices(raw_status);

-- valid_heart_voices 索引
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_user ON valid_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_status ON valid_heart_voices(audit_status);

-- raw_story_submissions 索引
CREATE INDEX IF NOT EXISTS idx_raw_stories_user ON raw_story_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_stories_status ON raw_story_submissions(raw_status);

-- valid_stories 索引
CREATE INDEX IF NOT EXISTS idx_valid_stories_user ON valid_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_valid_stories_status ON valid_stories(audit_status);

-- audit_records 索引
CREATE INDEX IF NOT EXISTS idx_audit_records_type ON audit_records(content_type);
CREATE INDEX IF NOT EXISTS idx_audit_records_result ON audit_records(audit_result);

-- user_content_mappings 索引
CREATE INDEX IF NOT EXISTS idx_content_mappings_user ON user_content_mappings(user_uuid);
CREATE INDEX IF NOT EXISTS idx_content_mappings_type ON user_content_mappings(content_type);

-- auth_logs 索引
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_logs(created_at);

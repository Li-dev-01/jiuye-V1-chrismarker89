-- SQLite 数据库初始化脚本
-- 适用于 Cloudflare D1

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous', 'admin', 'reviewer')),
    username TEXT,
    nickname TEXT,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 创建原始问卷回答表
CREATE TABLE IF NOT EXISTS raw_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    form_data TEXT NOT NULL, -- JSON as TEXT in SQLite
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 创建有效问卷回答表
CREATE TABLE IF NOT EXISTS valid_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    user_uuid TEXT NOT NULL,
    form_data TEXT NOT NULL,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    FOREIGN KEY (raw_id) REFERENCES raw_questionnaire_responses(id)
);

-- 创建原始心声表
CREATE TABLE IF NOT EXISTS raw_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 创建有效心声表
CREATE TABLE IF NOT EXISTS valid_heart_voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    FOREIGN KEY (raw_id) REFERENCES raw_heart_voices(id)
);

-- 创建原始故事表
CREATE TABLE IF NOT EXISTS raw_story_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'pending' CHECK (raw_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 创建有效故事表
CREATE TABLE IF NOT EXISTS valid_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER NOT NULL,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_status TEXT DEFAULT 'approved' CHECK (audit_status IN ('approved', 'rejected', 'pending')),
    FOREIGN KEY (raw_id) REFERENCES raw_story_submissions(id)
);

-- 创建审核记录表
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

-- 创建系统配置表 (Super Admin)
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

-- 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT NOT NULL,
    operation TEXT NOT NULL,
    target TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建安全事件表
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source_ip TEXT,
    details TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建通用问卷回答表
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_uuid TEXT,
    session_id TEXT,
    responses TEXT NOT NULL, -- JSON as TEXT
    is_completed INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_valid INTEGER DEFAULT 1
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(user_uuid);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_raw_questionnaire_user ON raw_questionnaire_responses(user_uuid);
CREATE INDEX IF NOT EXISTS idx_valid_questionnaire_user ON valid_questionnaire_responses(user_uuid);
CREATE INDEX IF NOT EXISTS idx_raw_heart_voices_user ON raw_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_user ON valid_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_type ON audit_records(content_type);
CREATE INDEX IF NOT EXISTS idx_audit_records_result ON audit_records(audit_result);
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_id ON universal_questionnaire_responses(questionnaire_id);

-- 插入默认系统配置
INSERT OR REPLACE INTO system_config (config_key, config_value, updated_by) VALUES
('project_enabled', 'true', 'system'),
('maintenance_mode', 'false', 'system'),
('emergency_shutdown', 'false', 'system');

-- 插入测试用户
INSERT OR REPLACE INTO users (user_uuid, user_type, username, email) VALUES
('admin-uuid-001', 'admin', 'admin', 'admin@example.com'),
('reviewer-uuid-001', 'reviewer', 'reviewer1', 'reviewer1@example.com');

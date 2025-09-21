-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reviewer', 'admin', 'super_admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 问卷回答表
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    personal_info TEXT NOT NULL, -- JSON格式存储个人信息
    education_info TEXT NOT NULL, -- JSON格式存储教育信息
    employment_info TEXT NOT NULL, -- JSON格式存储就业意向信息
    job_search_info TEXT NOT NULL, -- JSON格式存储求职信息
    employment_status TEXT NOT NULL, -- JSON格式存储就业状态信息
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 审核记录表
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    questionnaire_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 分析数据缓存表
CREATE TABLE IF NOT EXISTS analytics_cache (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cache_key TEXT UNIQUE NOT NULL,
    cache_data TEXT NOT NULL, -- JSON格式存储缓存数据
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT, -- JSON格式存储详细信息
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_status ON questionnaire_responses(status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at ON questionnaire_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_questionnaire_id ON reviews(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON system_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- 创建触发器用于自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_questionnaire_responses_updated_at
    AFTER UPDATE ON questionnaire_responses
    FOR EACH ROW
BEGIN
    UPDATE questionnaire_responses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_analytics_cache_updated_at
    AFTER UPDATE ON analytics_cache
    FOR EACH ROW
BEGIN
    UPDATE analytics_cache SET updated_at = datetime('now') WHERE id = NEW.id;
END;

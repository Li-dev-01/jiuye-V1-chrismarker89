-- Migration: 011_create_google_oauth_whitelist_table
-- Description: 创建Google OAuth白名单表
-- Created: 2025-08-13

-- Google OAuth白名单表
CREATE TABLE IF NOT EXISTS google_oauth_whitelist (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'super_admin')),
    display_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    created_by TEXT NOT NULL,
    notes TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_google_whitelist_email ON google_oauth_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_google_whitelist_role ON google_oauth_whitelist(role);
CREATE INDEX IF NOT EXISTS idx_google_whitelist_status ON google_oauth_whitelist(status);
CREATE INDEX IF NOT EXISTS idx_google_whitelist_created_at ON google_oauth_whitelist(created_at);

-- 插入默认的超级管理员邮箱（示例）
INSERT OR IGNORE INTO google_oauth_whitelist (
    id, 
    email, 
    role, 
    display_name, 
    status, 
    created_by, 
    notes
) VALUES (
    'default_super_admin',
    'admin@example.com',
    'super_admin',
    '默认超级管理员',
    'active',
    'system',
    '系统默认创建的超级管理员账号'
);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_google_whitelist_timestamp 
    AFTER UPDATE ON google_oauth_whitelist
    FOR EACH ROW
BEGIN
    UPDATE google_oauth_whitelist 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

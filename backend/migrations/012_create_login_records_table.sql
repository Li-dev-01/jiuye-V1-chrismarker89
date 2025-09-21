-- Migration: 012_create_login_records_table
-- Description: 创建登录记录表，用于追踪用户登录历史和安全监控
-- Created: 2025-08-13

-- 登录记录表
CREATE TABLE IF NOT EXISTS login_records (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin')),
    login_method TEXT NOT NULL CHECK (login_method IN ('ab_combination', 'google_oauth', 'password', 'google_oauth_admin')),
    login_status TEXT NOT NULL CHECK (login_status IN ('success', 'failed', 'blocked')),
    
    -- IP和位置信息
    ip_address TEXT NOT NULL,
    ip_country TEXT,
    ip_region TEXT,
    ip_city TEXT,
    ip_isp TEXT,
    
    -- 设备信息
    user_agent TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    device_fingerprint TEXT,
    
    -- 时间信息
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_duration INTEGER, -- 会话持续时间（秒）
    logout_time DATETIME,
    
    -- 安全信息
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0, -- 0-100风险评分
    security_flags TEXT, -- JSON格式的安全标记
    
    -- Google OAuth特定信息
    google_email TEXT,
    oauth_scope TEXT,
    
    -- 失败原因（如果登录失败）
    failure_reason TEXT,
    
    -- 元数据
    metadata TEXT, -- JSON格式的额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_login_records_user_uuid ON login_records(user_uuid);
CREATE INDEX IF NOT EXISTS idx_login_records_ip_address ON login_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_records_login_time ON login_records(login_time);
CREATE INDEX IF NOT EXISTS idx_login_records_user_type ON login_records(user_type);
CREATE INDEX IF NOT EXISTS idx_login_records_login_method ON login_records(login_method);
CREATE INDEX IF NOT EXISTS idx_login_records_login_status ON login_records(login_status);
CREATE INDEX IF NOT EXISTS idx_login_records_is_suspicious ON login_records(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_login_records_google_email ON login_records(google_email);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_login_records_user_time ON login_records(user_uuid, login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_records_ip_time ON login_records(ip_address, login_time DESC);

-- 用户最后登录信息表（快速查询）
CREATE TABLE IF NOT EXISTS user_last_login (
    user_uuid TEXT PRIMARY KEY,
    last_login_time DATETIME,
    last_login_ip TEXT,
    last_login_location TEXT,
    last_login_device TEXT,
    last_login_method TEXT,
    login_count INTEGER DEFAULT 0,
    last_suspicious_login DATETIME,
    suspicious_login_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_last_login_time ON user_last_login(last_login_time);
CREATE INDEX IF NOT EXISTS idx_user_last_login_ip ON user_last_login(last_login_ip);

-- IP地址统计表（用于检测异常）
CREATE TABLE IF NOT EXISTS ip_statistics (
    ip_address TEXT PRIMARY KEY,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_attempts INTEGER DEFAULT 0,
    successful_logins INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    block_until DATETIME,
    country TEXT,
    region TEXT,
    city TEXT,
    isp TEXT,
    risk_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_statistics_last_seen ON ip_statistics(last_seen);
CREATE INDEX IF NOT EXISTS idx_ip_statistics_risk_score ON ip_statistics(risk_score);
CREATE INDEX IF NOT EXISTS idx_ip_statistics_is_blocked ON ip_statistics(is_blocked);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_login_records_timestamp 
    AFTER UPDATE ON login_records
    FOR EACH ROW
BEGIN
    UPDATE login_records 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_last_login_timestamp 
    AFTER UPDATE ON user_last_login
    FOR EACH ROW
BEGIN
    UPDATE user_last_login 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE user_uuid = NEW.user_uuid;
END;

CREATE TRIGGER IF NOT EXISTS update_ip_statistics_timestamp 
    AFTER UPDATE ON ip_statistics
    FOR EACH ROW
BEGIN
    UPDATE ip_statistics 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE ip_address = NEW.ip_address;
END;

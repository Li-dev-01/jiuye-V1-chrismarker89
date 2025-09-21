-- Migration: 014_create_ip_access_control_tables
-- Description: 创建IP访问控制相关表，包括白名单、黑名单和访问时间限制
-- Created: 2025-08-13

-- IP访问控制规则表
CREATE TABLE IF NOT EXISTS ip_access_rules (
    id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('whitelist', 'blacklist', 'greylist')),
    ip_address TEXT,
    ip_range TEXT, -- CIDR格式，如 192.168.1.0/24
    country_code TEXT, -- 国家代码，如 CN, US
    region TEXT,
    description TEXT,
    rule_priority INTEGER DEFAULT 100, -- 优先级，数字越小优先级越高
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 适用范围
    applies_to_user_types TEXT, -- JSON数组，如 ["admin", "reviewer"]
    applies_to_functions TEXT, -- JSON数组，如 ["login", "api_access"]
    
    -- 时间限制
    time_restrictions TEXT, -- JSON格式的时间限制规则
    
    -- 创建和管理信息
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- 规则过期时间
    
    -- 统计信息
    hit_count INTEGER DEFAULT 0,
    last_hit_at DATETIME
);

-- 访问时间控制表
CREATE TABLE IF NOT EXISTS access_time_policies (
    id TEXT PRIMARY KEY,
    policy_name TEXT NOT NULL,
    description TEXT,
    
    -- 适用对象
    user_types TEXT, -- JSON数组，适用的用户类型
    specific_users TEXT, -- JSON数组，特定用户UUID
    
    -- 时间规则
    allowed_hours TEXT NOT NULL, -- JSON格式，如 {"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"]}
    timezone TEXT DEFAULT 'Asia/Shanghai',
    
    -- 例外情况
    emergency_override BOOLEAN DEFAULT FALSE,
    emergency_contacts TEXT, -- JSON数组，紧急联系人
    
    -- 违规处理
    violation_action TEXT DEFAULT 'block' CHECK (violation_action IN ('block', 'warn', 'log')),
    max_violations_per_day INTEGER DEFAULT 3,
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 双因素认证设置表
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL UNIQUE,
    
    -- 2FA方法
    method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup_codes')),
    secret_key TEXT, -- TOTP密钥
    phone_number TEXT, -- SMS号码
    email_address TEXT, -- 邮箱地址
    
    -- 备用代码
    backup_codes TEXT, -- JSON数组，一次性备用代码
    backup_codes_used TEXT, -- JSON数组，已使用的备用代码
    
    -- 状态
    is_enabled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- 设置信息
    setup_completed_at DATETIME,
    last_used_at DATETIME,
    
    -- 安全设置
    require_for_login BOOLEAN DEFAULT TRUE,
    require_for_admin_actions BOOLEAN DEFAULT TRUE,
    trusted_devices TEXT, -- JSON数组，信任的设备指纹
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2FA验证记录表
CREATE TABLE IF NOT EXISTS two_factor_verifications (
    id TEXT PRIMARY KEY,
    user_uuid TEXT NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('login', 'admin_action', 'settings_change')),
    method_used TEXT NOT NULL,
    
    -- 验证信息
    code_entered TEXT,
    is_successful BOOLEAN NOT NULL,
    failure_reason TEXT,
    
    -- 上下文信息
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 访问违规记录表
CREATE TABLE IF NOT EXISTS access_violations (
    id TEXT PRIMARY KEY,
    violation_type TEXT NOT NULL CHECK (violation_type IN (
        'ip_blocked', 'time_restricted', 'location_blocked', 
        'too_many_attempts', 'suspicious_activity'
    )),
    
    -- 违规主体
    user_uuid TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    
    -- 违规详情
    description TEXT NOT NULL,
    rule_triggered TEXT, -- 触发的规则ID
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- 处理状态
    action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'warned', 'logged', 'escalated')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by TEXT,
    resolved_at DATETIME,
    resolution_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_access_rules_type ON ip_access_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_ip_access_rules_ip ON ip_access_rules(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_access_rules_active ON ip_access_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_ip_access_rules_priority ON ip_access_rules(rule_priority);

CREATE INDEX IF NOT EXISTS idx_access_time_policies_active ON access_time_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_access_time_policies_user_types ON access_time_policies(user_types);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user ON two_factor_auth(user_uuid);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(is_enabled);

CREATE INDEX IF NOT EXISTS idx_two_factor_verifications_user ON two_factor_verifications(user_uuid);
CREATE INDEX IF NOT EXISTS idx_two_factor_verifications_time ON two_factor_verifications(created_at);

CREATE INDEX IF NOT EXISTS idx_access_violations_type ON access_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_access_violations_ip ON access_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_violations_user ON access_violations(user_uuid);
CREATE INDEX IF NOT EXISTS idx_access_violations_time ON access_violations(created_at);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_ip_access_rules_timestamp 
    AFTER UPDATE ON ip_access_rules
    FOR EACH ROW
BEGIN
    UPDATE ip_access_rules 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_access_time_policies_timestamp 
    AFTER UPDATE ON access_time_policies
    FOR EACH ROW
BEGIN
    UPDATE access_time_policies 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_two_factor_auth_timestamp 
    AFTER UPDATE ON two_factor_auth
    FOR EACH ROW
BEGIN
    UPDATE two_factor_auth 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE user_uuid = NEW.user_uuid;
END;

-- 插入默认的访问时间策略
INSERT OR IGNORE INTO access_time_policies (
    id, 
    policy_name, 
    description, 
    user_types, 
    allowed_hours, 
    created_by
) VALUES (
    'default_admin_hours',
    '管理员工作时间限制',
    '管理员只能在工作时间（9:00-18:00）登录',
    '["admin", "super_admin"]',
    '{"monday": ["09:00-18:00"], "tuesday": ["09:00-18:00"], "wednesday": ["09:00-18:00"], "thursday": ["09:00-18:00"], "friday": ["09:00-18:00"]}',
    'system'
);

-- 插入默认的IP访问规则示例
INSERT OR IGNORE INTO ip_access_rules (
    id,
    rule_type,
    ip_address,
    description,
    applies_to_user_types,
    created_by
) VALUES (
    'localhost_whitelist',
    'whitelist',
    '127.0.0.1',
    '本地开发环境白名单',
    '["admin", "super_admin", "reviewer"]',
    'system'
);

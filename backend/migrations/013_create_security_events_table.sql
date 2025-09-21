-- Migration: 013_create_security_events_table
-- Description: 创建安全事件表，用于记录和追踪安全相关事件
-- Created: 2025-08-13

-- 安全事件表
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'suspicious_login_reported',
        'multiple_failed_attempts',
        'new_device_login',
        'unusual_location_login',
        'admin_privilege_escalation',
        'data_access_violation',
        'brute_force_attempt',
        'account_lockout',
        'password_reset_request',
        'unauthorized_access_attempt'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_uuid TEXT,
    ip_address TEXT,
    user_agent TEXT,
    description TEXT NOT NULL,
    metadata TEXT, -- JSON格式的额外信息
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive')),
    assigned_to TEXT, -- 处理人员
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_uuid ON security_events(user_uuid);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_security_events_status_severity ON security_events(status, severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_time ON security_events(user_uuid, created_at DESC);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_security_events_timestamp 
    AFTER UPDATE ON security_events
    FOR EACH ROW
BEGIN
    UPDATE security_events 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- 超级管理员功能数据库初始化脚本

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator TEXT NOT NULL,
    operation TEXT NOT NULL,
    target TEXT,
    details TEXT, -- JSON格式
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 安全事件记录表
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- 'login_attempt', 'ddos_detected', 'brute_force', etc.
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    source_ip TEXT,
    target_resource TEXT,
    details TEXT, -- JSON格式
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'ignored'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by TEXT
);

-- 用户行为分析表
CREATE TABLE IF NOT EXISTS user_behavior_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT,
    ip_address TEXT,
    session_id TEXT,
    action_type TEXT, -- 'questionnaire_submit', 'voice_submit', 'story_submit'
    action_details TEXT, -- JSON格式
    risk_score INTEGER DEFAULT 0, -- 0-100 风险评分
    is_suspicious INTEGER DEFAULT 0, -- 0=false, 1=true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 数据清理记录表
CREATE TABLE IF NOT EXISTS data_cleanup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cleanup_type TEXT NOT NULL, -- 'ip_cleanup', 'user_cleanup', 'pattern_cleanup'
    target_identifier TEXT NOT NULL,
    affected_tables TEXT, -- JSON格式
    deleted_count INTEGER DEFAULT 0,
    reason TEXT,
    operator TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 项目状态监控表
CREATE TABLE IF NOT EXISTS project_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_type TEXT NOT NULL, -- 'enabled', 'disabled', 'maintenance', 'emergency'
    previous_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    operator TEXT NOT NULL,
    auto_triggered INTEGER DEFAULT 0, -- 0=false, 1=true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_admin_logs_operator ON admin_operation_logs(operator);
CREATE INDEX IF NOT EXISTS idx_admin_logs_operation ON admin_operation_logs(operation);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_uuid ON user_behavior_analysis(user_uuid);
CREATE INDEX IF NOT EXISTS idx_user_behavior_ip_address ON user_behavior_analysis(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action_type ON user_behavior_analysis(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_risk_score ON user_behavior_analysis(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_type ON data_cleanup_logs(cleanup_type);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_operator ON data_cleanup_logs(operator);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_created_at ON data_cleanup_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_project_status_type ON project_status_logs(status_type);
CREATE INDEX IF NOT EXISTS idx_project_status_operator ON project_status_logs(operator);
CREATE INDEX IF NOT EXISTS idx_project_status_created_at ON project_status_logs(created_at);

-- 插入默认系统配置
INSERT OR REPLACE INTO system_config (config_key, config_value, description, updated_by) VALUES
('project_enabled', 'true', '项目是否启用', 'system'),
('maintenance_mode', 'false', '维护模式', 'system'),
('emergency_shutdown', 'false', '紧急关闭状态', 'system'),
('max_submissions_per_ip_per_day', '10', '每个IP每天最大提交数', 'system'),
('max_submissions_per_user_per_day', '5', '每个用户每天最大提交数', 'system'),
('ddos_protection_enabled', 'true', 'DDoS防护是否启用', 'system'),
('brute_force_protection_enabled', 'true', '暴力破解防护是否启用', 'system'),
('auto_emergency_shutdown_threshold', '100', '自动紧急关闭阈值（每分钟请求数）', 'system');

-- 超级管理员功能相关数据表

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    INDEX idx_config_key (config_key)
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operator VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    target VARCHAR(200),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operator (operator),
    INDEX idx_operation (operation),
    INDEX idx_created_at (created_at)
);

-- 安全事件记录表
CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'login_attempt', 'ddos_detected', 'brute_force', etc.
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    source_ip VARCHAR(45),
    target_resource VARCHAR(200),
    details JSON,
    status ENUM('active', 'resolved', 'ignored') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(100),
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_source_ip (source_ip),
    INDEX idx_created_at (created_at)
);

-- 用户行为分析表
CREATE TABLE IF NOT EXISTS user_behavior_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(36),
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    action_type VARCHAR(50), -- 'questionnaire_submit', 'voice_submit', 'story_submit'
    action_details JSON,
    risk_score INT DEFAULT 0, -- 0-100 风险评分
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_ip_address (ip_address),
    INDEX idx_action_type (action_type),
    INDEX idx_risk_score (risk_score),
    INDEX idx_created_at (created_at)
);

-- 数据清理记录表
CREATE TABLE IF NOT EXISTS data_cleanup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cleanup_type VARCHAR(50) NOT NULL, -- 'ip_cleanup', 'user_cleanup', 'pattern_cleanup'
    target_identifier VARCHAR(200) NOT NULL,
    affected_tables JSON,
    deleted_count INT DEFAULT 0,
    reason TEXT,
    operator VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cleanup_type (cleanup_type),
    INDEX idx_operator (operator),
    INDEX idx_created_at (created_at)
);

-- 项目状态监控表
CREATE TABLE IF NOT EXISTS project_status_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_type VARCHAR(50) NOT NULL, -- 'enabled', 'disabled', 'maintenance', 'emergency'
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    operator VARCHAR(100) NOT NULL,
    auto_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_type (status_type),
    INDEX idx_operator (operator),
    INDEX idx_created_at (created_at)
);

-- 插入默认系统配置
INSERT INTO system_config (config_key, config_value, description, updated_by) VALUES
('project_enabled', 'true', '项目是否启用', 'system'),
('maintenance_mode', 'false', '维护模式', 'system'),
('emergency_shutdown', 'false', '紧急关闭状态', 'system'),
('max_submissions_per_ip_per_day', '10', '每个IP每天最大提交数', 'system'),
('max_submissions_per_user_per_day', '5', '每个用户每天最大提交数', 'system'),
('ddos_protection_enabled', 'true', 'DDoS防护是否启用', 'system'),
('brute_force_protection_enabled', 'true', '暴力破解防护是否启用', 'system'),
('auto_emergency_shutdown_threshold', '100', '自动紧急关闭阈值（每分钟请求数）', 'system')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

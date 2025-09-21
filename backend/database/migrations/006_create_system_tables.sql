-- Migration: 006_create_system_tables
-- Description: 创建系统管理表 (审计日志、系统设置、数据同步日志)
-- Created: 2024-01-27

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 操作信息
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- 详细信息
    old_values JSON,
    new_values JSON,
    ip_address INET,
    user_agent TEXT,
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    
    -- 分组
    category VARCHAR(50) DEFAULT 'general',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by UUID,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 数据同步日志表
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 同步信息
    sync_type ENUM('temp_to_valid', 'valid_to_analytics') NOT NULL,
    source_table VARCHAR(100),
    target_table VARCHAR(100),
    
    -- 同步结果
    status ENUM('running', 'success', 'failed', 'partial') DEFAULT 'running',
    records_processed INT DEFAULT 0,
    records_success INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    
    -- 详细信息
    error_message TEXT,
    sync_details JSON,
    
    -- 时间信息
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INT
);

-- 创建索引
-- 审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 系统设置索引
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- 数据同步日志索引
CREATE INDEX idx_sync_logs_type ON data_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON data_sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON data_sync_logs(started_at DESC);

-- 插入默认系统设置
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
('site_name', '大学生就业问卷调查平台', 'string', '网站名称', 'general'),
('max_questionnaire_per_user', '1', 'number', '每个用户最大问卷提交数', 'questionnaire'),
('auto_approve_questionnaire', 'false', 'boolean', '是否自动审核问卷', 'questionnaire'),
('analytics_sync_interval', '24', 'number', '数据同步间隔(小时)', 'analytics'),
('story_moderation_required', 'true', 'boolean', '故事是否需要审核', 'content'),
('voice_moderation_required', 'true', 'boolean', '心声是否需要审核', 'content');

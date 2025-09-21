-- Migration: 010_create_uuid_system_tables
-- Description: 创建UUID用户管理系统相关表
-- Created: 2025-01-27

-- =====================================================
-- 1. 统一用户表 (Universal Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS universal_users (
    uuid VARCHAR(64) PRIMARY KEY,
    user_type ENUM('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin') NOT NULL,
    identity_hash VARCHAR(128) UNIQUE, -- 半匿名用户的身份哈希
    username VARCHAR(50) UNIQUE,       -- 实名用户的用户名
    password_hash VARCHAR(255),        -- 实名用户的密码哈希
    display_name VARCHAR(100),
    role VARCHAR(20),
    permissions JSON,
    profile JSON,
    metadata JSON,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_user_type (user_type),
    INDEX idx_identity_hash (identity_hash),
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_last_active (last_active_at),
    
    -- 复合索引用于统计查询
    INDEX idx_type_date (user_type, created_at),
    INDEX idx_type_status (user_type, status)
);

-- =====================================================
-- 2. 用户会话表 (User Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_uuid VARCHAR(64) NOT NULL,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    device_fingerprint VARCHAR(128),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_session_token (session_token),
    INDEX idx_device_fingerprint (device_fingerprint),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 3. 用户内容关联表 (User Content Mappings)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_content_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(64) NOT NULL,
    content_type ENUM('questionnaire', 'story', 'voice', 'comment', 'download', 'analytics') NOT NULL,
    content_id VARCHAR(64) NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'archived') DEFAULT 'pending',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE CASCADE,
    
    -- 唯一约束：同一内容只能关联一个用户
    UNIQUE KEY unique_content (content_type, content_id),
    
    -- 索引
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_content_type (content_type),
    INDEX idx_content_id (content_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- 复合索引
    INDEX idx_user_content (user_uuid, content_type),
    INDEX idx_user_status (user_uuid, status),
    INDEX idx_type_status (content_type, status)
);

-- =====================================================
-- 4. 身份验证日志表 (Authentication Logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_uuid VARCHAR(64),
    user_type ENUM('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin'),
    action ENUM('login', 'logout', 'refresh', 'validate', 'conflict_check', 'failed_attempt') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(128),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束（可选，因为可能记录失败的认证尝试）
    FOREIGN KEY (user_uuid) REFERENCES universal_users(uuid) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_user_type (user_type),
    INDEX idx_action (action),
    INDEX idx_success (success),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    
    -- 复合索引用于安全分析
    INDEX idx_ip_action (ip_address, action, created_at),
    INDEX idx_user_action (user_uuid, action, created_at)
);

-- =====================================================
-- 5. 用户统计缓存表 (User Statistics Cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_statistics_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL,
    user_type ENUM('anonymous', 'semi_anonymous', 'reviewer', 'admin', 'super_admin') NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value BIGINT NOT NULL DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 唯一约束：每天每种用户类型每个指标只有一条记录
    UNIQUE KEY unique_stat (stat_date, user_type, metric_name),
    
    -- 索引
    INDEX idx_stat_date (stat_date),
    INDEX idx_user_type (user_type),
    INDEX idx_metric_name (metric_name),
    
    -- 复合索引
    INDEX idx_date_type (stat_date, user_type),
    INDEX idx_date_metric (stat_date, metric_name)
);

-- =====================================================
-- 6. 内容审核记录表 (Content Review Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS content_review_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content_mapping_id BIGINT NOT NULL,
    reviewer_uuid VARCHAR(64) NOT NULL,
    action ENUM('approve', 'reject', 'request_changes', 'archive') NOT NULL,
    reason TEXT,
    notes TEXT,
    previous_status ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'archived'),
    new_status ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'archived'),
    review_time_seconds INT, -- 审核耗时（秒）
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (content_mapping_id) REFERENCES user_content_mappings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_uuid) REFERENCES universal_users(uuid) ON DELETE RESTRICT,
    
    -- 索引
    INDEX idx_content_mapping (content_mapping_id),
    INDEX idx_reviewer_uuid (reviewer_uuid),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    
    -- 复合索引
    INDEX idx_reviewer_action (reviewer_uuid, action, created_at),
    INDEX idx_content_action (content_mapping_id, action)
);

-- =====================================================
-- 7. 系统配置表 (System Configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- 8. 插入默认配置数据
-- =====================================================

-- UUID系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES 
('uuid_system.session_timeout', '{"anonymous": 86400, "semi_anonymous": 86400, "reviewer": 3600, "admin": 3600, "super_admin": 3600}', 'UUID系统会话超时配置（秒）'),
('uuid_system.permissions', '{"anonymous": ["browse_content", "submit_questionnaire"], "semi_anonymous": ["browse_content", "submit_questionnaire", "manage_own_content", "download_content", "delete_own_content"], "reviewer": ["browse_content", "review_content", "approve_content", "reject_content", "view_review_stats", "manage_review_queue"], "admin": ["browse_content", "project_management", "create_reviewer", "manage_users", "view_all_content", "system_settings", "view_all_stats", "review_content", "approve_content", "reject_content"], "super_admin": ["all_permissions"]}', 'UUID系统权限配置'),
('uuid_system.security', '{"max_failed_attempts": 5, "lockout_duration": 900, "session_cleanup_interval": 3600, "enable_device_tracking": true}', 'UUID系统安全配置'),
('uuid_system.statistics', '{"enable_daily_stats": true, "enable_real_time_stats": false, "cache_duration": 300, "cleanup_old_logs_days": 90}', 'UUID系统统计配置');

-- 默认管理员用户（使用新的UUID系统）
INSERT INTO universal_users (
    uuid, 
    user_type, 
    username, 
    password_hash, 
    display_name, 
    role, 
    permissions, 
    profile, 
    metadata, 
    status
) VALUES 
(
    'super-550e8400-e29b-41d4-a716-446655440000',
    'super_admin',
    'superadmin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
    '超级管理员',
    'super_admin',
    '["all_permissions"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": true, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": true, "dataRetention": 365}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}}',
    'active'
),
(
    'admin-550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin1',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
    '管理员',
    'admin',
    '["browse_content", "project_management", "create_reviewer", "manage_users", "view_all_content", "system_settings", "view_all_stats", "review_content", "approve_content", "reject_content"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": true, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": true, "dataRetention": 90}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}}',
    'active'
),
(
    'rev-550e8400-e29b-41d4-a716-446655440002',
    'reviewer',
    'reviewerA',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS', -- password: admin123
    '审核员A',
    'reviewer',
    '["browse_content", "review_content", "approve_content", "reject_content", "view_review_stats", "manage_review_queue"]',
    '{"language": "zh-CN", "timezone": "Asia/Shanghai", "notifications": {"email": false, "push": true, "sms": false}, "privacy": {"showProfile": false, "allowTracking": false, "dataRetention": 30}}',
    '{"loginCount": 0, "contentStats": {"totalSubmissions": 0, "approvedSubmissions": 0, "rejectedSubmissions": 0, "downloads": 0}, "securityFlags": {"isSuspicious": false, "failedLoginAttempts": 0, "twoFactorEnabled": false}, "reviewStats": {"totalReviewed": 0, "approved": 0, "rejected": 0, "dailyQuota": 50, "todayReviewed": 0, "averageReviewTime": 0}}',
    'active'
);

-- =====================================================
-- 9. 创建视图用于统计查询
-- =====================================================

-- 每日用户统计视图
CREATE OR REPLACE VIEW daily_user_stats AS
SELECT 
    DATE(created_at) as stat_date,
    user_type,
    COUNT(*) as new_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM universal_users 
GROUP BY DATE(created_at), user_type;

-- 内容统计视图
CREATE OR REPLACE VIEW content_stats AS
SELECT 
    u.user_type,
    c.content_type,
    c.status,
    COUNT(*) as count,
    DATE(c.created_at) as stat_date
FROM user_content_mappings c
JOIN universal_users u ON c.user_uuid = u.uuid
GROUP BY u.user_type, c.content_type, c.status, DATE(c.created_at);

-- 审核统计视图
CREATE OR REPLACE VIEW review_stats AS
SELECT 
    r.reviewer_uuid,
    u.display_name as reviewer_name,
    r.action,
    COUNT(*) as count,
    AVG(r.review_time_seconds) as avg_review_time,
    DATE(r.created_at) as stat_date
FROM content_review_records r
JOIN universal_users u ON r.reviewer_uuid = u.uuid
GROUP BY r.reviewer_uuid, u.display_name, r.action, DATE(r.created_at);

-- =====================================================
-- 10. 创建存储过程用于数据清理
-- =====================================================

DELIMITER //

-- 清理过期会话
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    SELECT ROW_COUNT() as deleted_sessions;
END //

-- 清理旧的认证日志
CREATE PROCEDURE CleanupOldAuthLogs(IN days_to_keep INT)
BEGIN
    DELETE FROM auth_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SELECT ROW_COUNT() as deleted_logs;
END //

-- 更新用户统计缓存
CREATE PROCEDURE UpdateUserStatisticsCache(IN target_date DATE)
BEGIN
    -- 删除当天的旧统计数据
    DELETE FROM user_statistics_cache WHERE stat_date = target_date;
    
    -- 插入新的统计数据
    INSERT INTO user_statistics_cache (stat_date, user_type, metric_name, metric_value)
    SELECT 
        target_date,
        user_type,
        'new_users',
        COUNT(*)
    FROM universal_users 
    WHERE DATE(created_at) = target_date
    GROUP BY user_type;
    
    -- 插入活跃用户统计
    INSERT INTO user_statistics_cache (stat_date, user_type, metric_name, metric_value)
    SELECT 
        target_date,
        user_type,
        'active_users',
        COUNT(*)
    FROM universal_users 
    WHERE DATE(last_active_at) = target_date AND status = 'active'
    GROUP BY user_type;
    
    SELECT 'Statistics cache updated' as result;
END //

DELIMITER ;

-- =====================================================
-- 11. 创建触发器
-- =====================================================

-- 用户更新时自动更新 updated_at
DELIMITER //
CREATE TRIGGER update_universal_users_timestamp 
    BEFORE UPDATE ON universal_users
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- 会话更新时自动更新 updated_at
CREATE TRIGGER update_user_sessions_timestamp 
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- 内容映射更新时自动更新 updated_at
CREATE TRIGGER update_content_mappings_timestamp 
    BEFORE UPDATE ON user_content_mappings
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- 12. 创建定时任务（需要事件调度器支持）
-- =====================================================

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 每小时清理过期会话
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
  CALL CleanupExpiredSessions();

-- 每天凌晨2点清理90天前的认证日志
CREATE EVENT IF NOT EXISTS cleanup_old_auth_logs
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-28 02:00:00'
DO
  CALL CleanupOldAuthLogs(90);

-- 每天凌晨1点更新前一天的统计缓存
CREATE EVENT IF NOT EXISTS update_daily_stats
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-28 01:00:00'
DO
  CALL UpdateUserStatisticsCache(DATE_SUB(CURDATE(), INTERVAL 1 DAY));

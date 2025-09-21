-- 分级审核系统线上部署SQL脚本
-- 适用于线上数据库环境

-- 1. 创建审核级别配置表
CREATE TABLE IF NOT EXISTS audit_level_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    level ENUM('level1', 'level2', 'level3') NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 规则配置
    rule_strictness DECIMAL(2,1) DEFAULT 1.0,
    ai_threshold DECIMAL(3,2) DEFAULT 0.5,
    manual_review_ratio DECIMAL(3,2) DEFAULT 0.1,
    
    -- 规则启用状态
    enabled_categories JSON,
    disabled_rules JSON,
    
    -- 性能配置
    max_processing_time_ms INT DEFAULT 100,
    batch_size INT DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_level_config (level, is_active)
);

-- 2. 创建审核级别历史记录表
CREATE TABLE IF NOT EXISTS audit_level_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    from_level ENUM('level1', 'level2', 'level3'),
    to_level ENUM('level1', 'level2', 'level3') NOT NULL,
    trigger_reason VARCHAR(200),
    trigger_data JSON,
    switched_by ENUM('auto', 'manual') DEFAULT 'auto',
    admin_id VARCHAR(36),
    switched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level_history_time (switched_at),
    INDEX idx_level_history_level (to_level, switched_at)
);

-- 3. 创建实时统计表
CREATE TABLE IF NOT EXISTS audit_realtime_stats (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    time_window TIMESTAMP NOT NULL,
    
    total_submissions INT DEFAULT 0,
    violation_count INT DEFAULT 0,
    violation_rate DECIMAL(4,3) DEFAULT 0.0,
    
    spam_count INT DEFAULT 0,
    coordinated_ips JSON,
    
    manual_review_queue_size INT DEFAULT 0,
    ai_review_count INT DEFAULT 0,
    auto_approved_count INT DEFAULT 0,
    auto_rejected_count INT DEFAULT 0,
    
    current_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_time_window (time_window),
    INDEX idx_stats_time (time_window),
    INDEX idx_stats_level (current_audit_level, time_window)
);

-- 4. 扩展现有audit_records表（如果存在）
-- 检查表是否存在，如果存在则添加新列
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = DATABASE() AND table_name = 'audit_records');

-- 添加分级审核相关列
SET @sql = IF(@table_exists > 0, 
    'ALTER TABLE audit_records 
     ADD COLUMN IF NOT EXISTS violation_categories JSON,
     ADD COLUMN IF NOT EXISTS rule_hits JSON,
     ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,2) DEFAULT 0.0,
     ADD COLUMN IF NOT EXISTS tiered_audit_level ENUM(\'level1\', \'level2\', \'level3\') DEFAULT \'level1\'',
    'SELECT "audit_records table does not exist, skipping column additions" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 插入默认审核级别配置
INSERT IGNORE INTO audit_level_configs 
(level, config_name, description, rule_strictness, ai_threshold, manual_review_ratio, enabled_categories) 
VALUES
('level1', '一级审核 (宽松)', '正常运营期，注重用户体验', 0.8, 0.3, 0.05, '["POL", "POR", "VIO", "PRI"]'),
('level2', '二级审核 (标准)', '内容质量下降，平衡审核', 1.0, 0.5, 0.15, '["POL", "POR", "VIO", "ADV", "PRI", "DIS"]'),
('level3', '三级审核 (严格)', '恶意攻击期，严格把控', 1.2, 0.7, 0.30, '["POL", "POR", "VIO", "ADV", "PRI", "DIS", "OTH"]');

-- 6. 插入初始级别历史记录
INSERT IGNORE INTO audit_level_history 
(from_level, to_level, trigger_reason, switched_by, admin_id)
VALUES (NULL, 'level1', '系统初始化', 'manual', 'system');

-- 7. 创建必要的索引
-- 为audit_records表创建索引（如果表存在）
SET @index_sql = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_audit_records_tiered_level ON audit_records(tiered_audit_level, created_at)',
    'SELECT "Skipping audit_records index creation" as message'
);

PREPARE stmt FROM @index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_sql2 = IF(@table_exists > 0,
    'CREATE INDEX IF NOT EXISTS idx_audit_records_risk ON audit_records(risk_score DESC, created_at)',
    'SELECT "Skipping audit_records risk index creation" as message'
);

PREPARE stmt FROM @index_sql2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为配置表创建索引
CREATE INDEX IF NOT EXISTS idx_level_configs_active ON audit_level_configs(is_active, level);

-- 8. 验证部署结果
SELECT 'audit_level_configs' as table_name, COUNT(*) as record_count FROM audit_level_configs
UNION ALL
SELECT 'audit_level_history' as table_name, COUNT(*) as record_count FROM audit_level_history
UNION ALL
SELECT 'audit_realtime_stats' as table_name, COUNT(*) as record_count FROM audit_realtime_stats;

-- 显示配置信息
SELECT level, config_name, description, rule_strictness, ai_threshold, manual_review_ratio 
FROM audit_level_configs 
ORDER BY level;

-- 完成提示
SELECT '分级审核系统线上部署完成！' as deployment_status,
       NOW() as deployment_time;

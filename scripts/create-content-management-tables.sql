-- 用户内容管理系统数据库表结构
-- 用于支持内容管理、IP追踪、批量操作等功能

-- 1. 内容管理日志表
CREATE TABLE IF NOT EXISTS content_management_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 操作类型: batch_delete, flag_suspicious, search, etc.
    operator_id TEXT NOT NULL,    -- 操作员ID
    target_type TEXT NOT NULL,    -- 目标类型: content, user, ip
    target_ids TEXT,              -- 目标ID列表 (JSON格式)
    reason TEXT,                  -- 操作原因
    details TEXT,                 -- 操作详情 (JSON格式)
    ip_address TEXT,              -- 操作员IP地址
    user_agent TEXT,              -- 操作员用户代理
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_operation_type (operation_type),
    INDEX idx_operator_id (operator_id),
    INDEX idx_created_at (created_at)
);

-- 2. 可疑内容标记表
CREATE TABLE IF NOT EXISTS suspicious_content_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,   -- 内容类型: questionnaire, heart_voice, story
    content_id TEXT NOT NULL,     -- 内容ID
    user_id TEXT,                 -- 用户ID
    ip_address TEXT,              -- IP地址
    flag_reason TEXT NOT NULL,    -- 标记原因
    flag_type TEXT NOT NULL,      -- 标记类型: duplicate, spam, inappropriate, suspicious_ip
    confidence_score REAL,        -- 置信度分数 (0-1)
    auto_detected BOOLEAN DEFAULT 0, -- 是否自动检测
    flagged_by TEXT NOT NULL,     -- 标记人
    flagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- 状态: active, resolved, false_positive
    resolved_by TEXT,             -- 处理人
    resolved_at DATETIME,         -- 处理时间
    resolution_notes TEXT,        -- 处理说明
    
    -- 索引
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_flag_type (flag_type),
    INDEX idx_status (status),
    INDEX idx_flagged_at (flagged_at),
    
    -- 唯一约束：同一内容不能重复标记相同类型
    UNIQUE(content_type, content_id, flag_type)
);

-- 3. IP地址信息表
CREATE TABLE IF NOT EXISTS ip_address_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL UNIQUE,
    country TEXT,                 -- 国家
    region TEXT,                  -- 地区
    city TEXT,                    -- 城市
    isp TEXT,                     -- ISP提供商
    organization TEXT,            -- 组织
    is_proxy BOOLEAN DEFAULT 0,   -- 是否代理
    is_vpn BOOLEAN DEFAULT 0,     -- 是否VPN
    is_tor BOOLEAN DEFAULT 0,     -- 是否Tor
    risk_score REAL DEFAULT 0,    -- 风险评分 (0-1)
    submission_count INTEGER DEFAULT 0, -- 提交次数
    unique_users_count INTEGER DEFAULT 0, -- 唯一用户数
    first_seen DATETIME,          -- 首次出现时间
    last_seen DATETIME,           -- 最后出现时间
    is_blocked BOOLEAN DEFAULT 0, -- 是否被封禁
    blocked_reason TEXT,          -- 封禁原因
    blocked_at DATETIME,          -- 封禁时间
    blocked_by TEXT,              -- 封禁操作员
    notes TEXT,                   -- 备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_ip_address (ip_address),
    INDEX idx_country (country),
    INDEX idx_risk_score (risk_score),
    INDEX idx_submission_count (submission_count),
    INDEX idx_is_blocked (is_blocked),
    INDEX idx_last_seen (last_seen)
);

-- 4. 用户提交统计表
CREATE TABLE IF NOT EXISTS user_submission_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_uuid TEXT,
    ip_address TEXT,
    questionnaire_count INTEGER DEFAULT 0,
    heart_voice_count INTEGER DEFAULT 0,
    story_count INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    first_submission DATETIME,
    last_submission DATETIME,
    avg_content_length REAL,
    flagged_count INTEGER DEFAULT 0,
    deleted_count INTEGER DEFAULT 0,
    risk_score REAL DEFAULT 0,    -- 用户风险评分
    is_suspicious BOOLEAN DEFAULT 0,
    suspicious_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_ip_address (ip_address),
    INDEX idx_total_submissions (total_submissions),
    INDEX idx_risk_score (risk_score),
    INDEX idx_is_suspicious (is_suspicious),
    INDEX idx_last_submission (last_submission),
    
    -- 唯一约束
    UNIQUE(user_id)
);

-- 5. 内容相似度检测表
CREATE TABLE IF NOT EXISTS content_similarity_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id_1 TEXT NOT NULL,
    content_id_2 TEXT NOT NULL,
    similarity_score REAL NOT NULL, -- 相似度分数 (0-1)
    similarity_type TEXT NOT NULL,  -- 相似度类型: exact, high, medium, low
    detection_method TEXT NOT NULL, -- 检测方法: hash, text_similarity, semantic
    user_id_1 TEXT,
    user_id_2 TEXT,
    ip_address_1 TEXT,
    ip_address_2 TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT 0,
    review_result TEXT,             -- 审核结果: duplicate, similar_but_valid, false_positive
    reviewed_by TEXT,
    reviewed_at DATETIME,
    
    -- 索引
    INDEX idx_content_type (content_type),
    INDEX idx_similarity_score (similarity_score),
    INDEX idx_similarity_type (similarity_type),
    INDEX idx_detected_at (detected_at),
    INDEX idx_reviewed (reviewed),
    
    -- 唯一约束：避免重复检测
    UNIQUE(content_type, content_id_1, content_id_2)
);

-- 6. 批量操作记录表
CREATE TABLE IF NOT EXISTS batch_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT NOT NULL UNIQUE, -- 操作唯一标识
    operation_type TEXT NOT NULL,      -- 操作类型: delete, flag, export
    operator_id TEXT NOT NULL,         -- 操作员ID
    target_criteria TEXT NOT NULL,     -- 目标条件 (JSON格式)
    affected_count INTEGER DEFAULT 0,  -- 影响的记录数
    success_count INTEGER DEFAULT 0,   -- 成功处理数
    error_count INTEGER DEFAULT 0,     -- 错误数
    status TEXT DEFAULT 'pending',     -- 状态: pending, running, completed, failed
    progress REAL DEFAULT 0,           -- 进度 (0-1)
    error_details TEXT,                -- 错误详情 (JSON格式)
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_operation_id (operation_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_operator_id (operator_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 7. 内容审核队列表
CREATE TABLE IF NOT EXISTS content_review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    priority INTEGER DEFAULT 5,        -- 优先级 (1-10, 10最高)
    review_reason TEXT NOT NULL,       -- 审核原因
    auto_flagged BOOLEAN DEFAULT 0,    -- 是否自动标记
    flag_details TEXT,                 -- 标记详情 (JSON格式)
    assigned_to TEXT,                  -- 分配给的审核员
    status TEXT DEFAULT 'pending',     -- 状态: pending, in_review, completed, skipped
    review_result TEXT,                -- 审核结果: approved, rejected, needs_modification
    review_notes TEXT,                 -- 审核说明
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at),
    
    -- 唯一约束：同一内容不能重复进入队列
    UNIQUE(content_type, content_id)
);

-- 8. 系统配置表
CREATE TABLE IF NOT EXISTS content_management_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type TEXT NOT NULL,         -- 配置类型: string, number, boolean, json
    description TEXT,
    category TEXT DEFAULT 'general',   -- 配置分类
    is_sensitive BOOLEAN DEFAULT 0,    -- 是否敏感配置
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    
    -- 索引
    INDEX idx_config_key (config_key),
    INDEX idx_category (category)
);

-- 插入默认配置
INSERT OR IGNORE INTO content_management_config (config_key, config_value, config_type, description, category) VALUES
('duplicate_detection_threshold', '0.8', 'number', '重复内容检测阈值', 'detection'),
('ip_submission_limit', '10', 'number', '单IP每日提交限制', 'limits'),
('user_submission_limit', '5', 'number', '单用户每日提交限制', 'limits'),
('auto_flag_enabled', 'true', 'boolean', '是否启用自动标记', 'automation'),
('similarity_check_enabled', 'true', 'boolean', '是否启用相似度检测', 'detection'),
('high_risk_ip_threshold', '0.7', 'number', '高风险IP阈值', 'security'),
('batch_operation_limit', '1000', 'number', '批量操作限制', 'limits'),
('content_retention_days', '365', 'number', '内容保留天数', 'retention');

-- 创建触发器：自动更新统计信息
CREATE TRIGGER IF NOT EXISTS update_ip_stats_on_insert
AFTER INSERT ON valid_heart_voices
WHEN NEW.ip_address IS NOT NULL AND NEW.ip_address != ''
BEGIN
    INSERT OR REPLACE INTO ip_address_info (
        ip_address, 
        submission_count, 
        first_seen, 
        last_seen,
        updated_at
    ) VALUES (
        NEW.ip_address,
        COALESCE((SELECT submission_count FROM ip_address_info WHERE ip_address = NEW.ip_address), 0) + 1,
        COALESCE((SELECT first_seen FROM ip_address_info WHERE ip_address = NEW.ip_address), NEW.created_at),
        NEW.created_at,
        CURRENT_TIMESTAMP
    );
END;

-- 创建触发器：自动更新用户统计
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_heart_voice
AFTER INSERT ON valid_heart_voices
BEGIN
    INSERT OR REPLACE INTO user_submission_stats (
        user_id,
        ip_address,
        heart_voice_count,
        total_submissions,
        first_submission,
        last_submission,
        updated_at
    ) VALUES (
        NEW.user_id,
        NEW.ip_address,
        COALESCE((SELECT heart_voice_count FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT total_submissions FROM user_submission_stats WHERE user_id = NEW.user_id), 0) + 1,
        COALESCE((SELECT first_submission FROM user_submission_stats WHERE user_id = NEW.user_id), NEW.created_at),
        NEW.created_at,
        CURRENT_TIMESTAMP
    );
END;

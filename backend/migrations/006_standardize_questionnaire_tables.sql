-- 标准化问卷系统表结构
-- 目标：统一字段命名，优化查询性能，支持数据生成中心

-- =====================================================
-- 1. 主数据表：universal_questionnaire_responses
-- =====================================================
-- 确保表结构标准化（如果表已存在，这些语句会被忽略）
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_uuid TEXT,
    session_id TEXT,
    responses TEXT NOT NULL, -- JSON格式存储完整响应数据
    is_completed INTEGER DEFAULT 1,
    completion_percentage REAL DEFAULT 100.0,
    total_time_seconds INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_valid INTEGER DEFAULT 1,
    
    -- 元数据字段
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser_info TEXT
);

-- =====================================================
-- 2. 统计缓存表：questionnaire_statistics_cache
-- =====================================================
CREATE TABLE IF NOT EXISTS questionnaire_statistics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    option_value TEXT,
    count INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    UNIQUE(questionnaire_id, question_id, option_value)
);

-- =====================================================
-- 3. 问卷配置表：questionnaire_configs
-- =====================================================
CREATE TABLE IF NOT EXISTS questionnaire_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    config_data TEXT NOT NULL, -- JSON格式存储问卷配置
    version TEXT DEFAULT '1.0.0',
    status TEXT DEFAULT 'published', -- draft, published, archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 数据生成记录表：data_generation_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS data_generation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generation_type TEXT NOT NULL, -- 'questionnaire', 'heart_voice', 'story'
    questionnaire_id TEXT,
    batch_size INTEGER DEFAULT 0,
    generated_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    generation_config TEXT, -- JSON格式存储生成配置
    status TEXT DEFAULT 'pending', -- pending, running, completed, failed
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error_message TEXT
);

-- =====================================================
-- 5. 创建索引以优化查询性能
-- =====================================================

-- 主表索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_questionnaire_id 
ON universal_questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_submitted_at 
ON universal_questionnaire_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_is_valid 
ON universal_questionnaire_responses(is_valid);

-- 统计缓存表索引
CREATE INDEX IF NOT EXISTS idx_statistics_cache_questionnaire_id 
ON questionnaire_statistics_cache(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_statistics_cache_last_updated 
ON questionnaire_statistics_cache(last_updated);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_configs_status 
ON questionnaire_configs(status);

-- 数据生成日志索引
CREATE INDEX IF NOT EXISTS idx_data_generation_logs_type 
ON data_generation_logs(generation_type);

CREATE INDEX IF NOT EXISTS idx_data_generation_logs_status 
ON data_generation_logs(status);

CREATE INDEX IF NOT EXISTS idx_data_generation_logs_started_at 
ON data_generation_logs(started_at);

-- =====================================================
-- 6. 插入默认配置数据
-- =====================================================

-- 插入当前问卷配置
INSERT OR REPLACE INTO questionnaire_configs (
    questionnaire_id,
    title,
    description,
    config_data,
    version,
    status
) VALUES (
    'employment-survey-2024',
    '2025年智能就业调查（升级版）',
    '基于心理学和数据科学原则设计的智能问卷，提供个性化的调研体验',
    '{"version":"2.0.0","type":"enhanced-intelligent","sections_count":8,"questions_count":25}',
    '2.0.0',
    'published'
);

-- =====================================================
-- 7. 数据清理（测试阶段）
-- =====================================================

-- 清理旧的测试数据（仅在测试阶段执行）
-- DELETE FROM universal_questionnaire_responses WHERE questionnaire_id = 'employment-survey-2024';
-- DELETE FROM questionnaire_statistics_cache WHERE questionnaire_id = 'employment-survey-2024';

-- 创建通用问卷系统相关表
-- 支持灵活的问卷数据结构和多种问题类型

-- 通用问卷响应表
CREATE TABLE IF NOT EXISTS universal_questionnaire_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    user_id INTEGER,
    response_data TEXT NOT NULL, -- JSON格式存储完整的响应数据
    submitted_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_questionnaire_id 
ON universal_questionnaire_responses(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_user_id 
ON universal_questionnaire_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_responses_submitted_at 
ON universal_questionnaire_responses(submitted_at);

-- 问卷配置表（可选，用于存储问卷定义）
CREATE TABLE IF NOT EXISTS universal_questionnaire_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    config_data TEXT NOT NULL, -- JSON格式存储问卷配置
    status TEXT DEFAULT 'draft', -- draft, published, archived
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_configs_questionnaire_id 
ON universal_questionnaire_configs(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_configs_status 
ON universal_questionnaire_configs(status);

-- 问卷统计缓存表（用于提高统计查询性能）
CREATE TABLE IF NOT EXISTS universal_questionnaire_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    statistics_data TEXT NOT NULL, -- JSON格式存储统计数据
    last_updated TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- 唯一约束
    UNIQUE(questionnaire_id, question_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_statistics_questionnaire_id 
ON universal_questionnaire_statistics(questionnaire_id);

CREATE INDEX IF NOT EXISTS idx_universal_questionnaire_statistics_last_updated 
ON universal_questionnaire_statistics(last_updated);

-- 插入一些示例配置数据（可选）
INSERT OR IGNORE INTO universal_questionnaire_configs (
    questionnaire_id,
    title,
    description,
    config_data,
    status
) VALUES (
    'universal-employment-survey-2024',
    '2024年大学生就业调查（通用版）',
    '基于通用问卷系统的就业调查，展示丰富的问题类型和实时统计功能',
    '{"version":"2.0.0","sections":[{"id":"personal-info","title":"个人基本信息","questions":[{"id":"education-level","type":"radio","title":"您的最高学历是？","required":true}]}]}',
    'published'
);

-- 更新触发器，自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_universal_questionnaire_responses_updated_at
    AFTER UPDATE ON universal_questionnaire_responses
    FOR EACH ROW
BEGIN
    UPDATE universal_questionnaire_responses 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_universal_questionnaire_configs_updated_at
    AFTER UPDATE ON universal_questionnaire_configs
    FOR EACH ROW
BEGIN
    UPDATE universal_questionnaire_configs 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

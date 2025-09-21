-- 测试数据库简化版本
-- 创建时间: 2025-08-10

-- 测试故事数据表
CREATE TABLE IF NOT EXISTS test_story_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '求职经历',
    tags TEXT,
    author_name TEXT DEFAULT '匿名用户',
    quality_score INTEGER DEFAULT 0,
    content_length INTEGER DEFAULT 0,
    generator_version TEXT DEFAULT 'v1.0',
    generation_template TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    main_story_id INTEGER NULL,
    submission_result TEXT
);

-- 测试问卷数据表
CREATE TABLE IF NOT EXISTS test_questionnaire_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    questionnaire_type TEXT NOT NULL DEFAULT 'universal',
    data_json TEXT NOT NULL,
    quality_score INTEGER DEFAULT 0,
    completeness_score INTEGER DEFAULT 0,
    realism_score INTEGER DEFAULT 0,
    diversity_score INTEGER DEFAULT 0,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    generator_version TEXT DEFAULT 'v1.0',
    generation_config TEXT,
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    submission_result TEXT
);

-- 测试用户数据表
CREATE TABLE IF NOT EXISTS test_user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'semi_anonymous',
    identity_hash TEXT,
    display_name TEXT,
    user_data_json TEXT NOT NULL,
    quality_score INTEGER DEFAULT 0,
    data_completeness INTEGER DEFAULT 0,
    format_correctness INTEGER DEFAULT 0,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    generator_version TEXT DEFAULT 'v1.0',
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    main_user_uuid TEXT NULL,
    submission_result TEXT
);

-- 测试数据生成日志表
CREATE TABLE IF NOT EXISTS test_generation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generation_id TEXT NOT NULL,
    generation_type TEXT NOT NULL,
    total_generated INTEGER DEFAULT 0,
    questionnaires_generated INTEGER DEFAULT 0,
    stories_generated INTEGER DEFAULT 0,
    users_generated INTEGER DEFAULT 0,
    avg_quality_score REAL DEFAULT 0,
    high_quality_count INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_message TEXT,
    generation_config TEXT
);

-- 数据提交日志表
CREATE TABLE IF NOT EXISTS test_submission_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT NOT NULL,
    submission_type TEXT NOT NULL,
    total_submitted INTEGER DEFAULT 0,
    questionnaires_submitted INTEGER DEFAULT 0,
    stories_submitted INTEGER DEFAULT 0,
    users_submitted INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    selection_strategy TEXT,
    min_quality_threshold INTEGER DEFAULT 70
);

-- 数据质量规则表
CREATE TABLE IF NOT EXISTS test_quality_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT UNIQUE NOT NULL,
    rule_type TEXT NOT NULL,
    data_type TEXT NOT NULL,
    rule_config TEXT NOT NULL,
    weight INTEGER DEFAULT 10,
    enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_story_quality ON test_story_data(quality_score);
CREATE INDEX IF NOT EXISTS idx_test_story_submitted ON test_story_data(submitted_to_main);
CREATE INDEX IF NOT EXISTS idx_test_story_generated ON test_story_data(generated_at);

CREATE INDEX IF NOT EXISTS idx_test_questionnaire_quality ON test_questionnaire_data(quality_score);
CREATE INDEX IF NOT EXISTS idx_test_questionnaire_submitted ON test_questionnaire_data(submitted_to_main);

CREATE INDEX IF NOT EXISTS idx_test_user_quality ON test_user_data(quality_score);
CREATE INDEX IF NOT EXISTS idx_test_user_submitted ON test_user_data(submitted_to_main);

CREATE INDEX IF NOT EXISTS idx_test_generation_logs_id ON test_generation_logs(generation_id);
CREATE INDEX IF NOT EXISTS idx_test_submission_logs_id ON test_submission_logs(submission_id);

CREATE INDEX IF NOT EXISTS idx_test_quality_rules_type ON test_quality_rules(data_type);
CREATE INDEX IF NOT EXISTS idx_test_quality_rules_enabled ON test_quality_rules(enabled);

-- 插入默认质量规则
INSERT OR IGNORE INTO test_quality_rules (rule_name, rule_type, data_type, rule_config, weight) VALUES
('story_min_length', 'content', 'story', '{"min_length": 50, "max_length": 2000}', 20),
('story_keyword_match', 'content', 'story', '{"keywords": ["求职", "工作", "面试", "职场", "经历", "经验"]}', 25),
('story_readability', 'content', 'story', '{"min_sentences": 3, "max_sentences": 20}', 15),
('story_uniqueness', 'uniqueness', 'story', '{"similarity_threshold": 0.8}', 20),
('story_completeness', 'completeness', 'story', '{"required_fields": ["title", "content", "category"]}', 20),
('questionnaire_completeness', 'completeness', 'questionnaire', '{"required_sections": 6, "required_fields_per_section": 3}', 30),
('questionnaire_format', 'format', 'questionnaire', '{"valid_formats": ["json"], "required_structure": true}', 25),
('questionnaire_realism', 'content', 'questionnaire', '{"realistic_values": true, "logical_consistency": true}', 25),
('questionnaire_diversity', 'uniqueness', 'questionnaire', '{"value_diversity_threshold": 0.7}', 20),
('user_data_format', 'format', 'user', '{"required_fields": ["uuid", "userType", "displayName"]}', 40),
('user_uuid_validity', 'format', 'user', '{"uuid_format": "valid", "unique": true}', 30),
('user_data_completeness', 'completeness', 'user', '{"all_fields_present": true}', 30);

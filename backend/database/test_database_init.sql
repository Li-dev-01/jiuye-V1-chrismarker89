-- 测试数据库初始化脚本
-- 用于数据生成中心的测试数据隔离存储
-- 创建时间: 2025-08-10

-- =====================================================
-- 1. 测试问卷数据表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_questionnaire_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    questionnaire_type TEXT NOT NULL DEFAULT 'universal', -- universal, basic, detailed
    data_json TEXT NOT NULL, -- 完整的问卷数据JSON
    
    -- 数据质量评估
    quality_score INTEGER DEFAULT 0, -- 0-100分
    completeness_score INTEGER DEFAULT 0, -- 完整性评分
    realism_score INTEGER DEFAULT 0, -- 真实性评分
    diversity_score INTEGER DEFAULT 0, -- 多样性评分
    
    -- 元数据
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    generator_version TEXT DEFAULT 'v1.0',
    generation_config TEXT, -- 生成配置JSON
    
    -- 提交状态
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    submission_result TEXT, -- 提交结果记录
    

);

-- =====================================================
-- 2. 测试故事数据表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_story_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    
    -- 故事内容
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '求职经历',
    tags TEXT, -- JSON数组
    author_name TEXT DEFAULT '匿名用户',
    
    -- 数据质量评估
    quality_score INTEGER DEFAULT 0, -- 综合质量评分
    content_length INTEGER DEFAULT 0, -- 内容长度
    keyword_match_score INTEGER DEFAULT 0, -- 关键词匹配度
    readability_score INTEGER DEFAULT 0, -- 可读性评分
    uniqueness_score INTEGER DEFAULT 0, -- 独特性评分
    
    -- 元数据
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    generator_version TEXT DEFAULT 'v1.0',
    generation_template TEXT, -- 使用的模板类型
    
    -- 提交状态
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    main_story_id INTEGER NULL, -- 主数据库中的ID
    submission_result TEXT,
    

);

-- =====================================================
-- 3. 测试用户数据表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    
    -- 用户信息
    user_type TEXT NOT NULL DEFAULT 'semi_anonymous',
    identity_hash TEXT,
    display_name TEXT,
    user_data_json TEXT NOT NULL, -- 完整用户数据
    
    -- 数据质量评估
    quality_score INTEGER DEFAULT 0,
    data_completeness INTEGER DEFAULT 0, -- 数据完整度
    format_correctness INTEGER DEFAULT 0, -- 格式正确性
    
    -- 元数据
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    generator_version TEXT DEFAULT 'v1.0',
    
    -- 提交状态
    submitted_to_main BOOLEAN DEFAULT FALSE,
    submitted_at DATETIME NULL,
    main_user_uuid TEXT NULL, -- 主数据库中的UUID
    submission_result TEXT,
    

);

-- =====================================================
-- 4. 测试数据生成日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_generation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 生成任务信息
    generation_id TEXT NOT NULL,
    generation_type TEXT NOT NULL, -- scheduled, manual, batch
    
    -- 生成统计
    total_generated INTEGER DEFAULT 0,
    questionnaires_generated INTEGER DEFAULT 0,
    stories_generated INTEGER DEFAULT 0,
    users_generated INTEGER DEFAULT 0,
    
    -- 质量统计
    avg_quality_score REAL DEFAULT 0,
    high_quality_count INTEGER DEFAULT 0, -- 质量分>80的数量
    
    -- 执行信息
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    
    -- 配置信息
    generation_config TEXT, -- JSON配置
    

);

-- =====================================================
-- 5. 数据提交日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_submission_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 提交任务信息
    submission_id TEXT NOT NULL,
    submission_type TEXT NOT NULL, -- auto, manual
    
    -- 提交统计
    total_submitted INTEGER DEFAULT 0,
    questionnaires_submitted INTEGER DEFAULT 0,
    stories_submitted INTEGER DEFAULT 0,
    users_submitted INTEGER DEFAULT 0,
    
    -- 成功率统计
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    
    -- 执行信息
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    execution_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    
    -- 选择策略
    selection_strategy TEXT, -- random, quality_based, time_based
    min_quality_threshold INTEGER DEFAULT 70,
    

);

-- =====================================================
-- 6. 数据质量规则表
-- =====================================================
CREATE TABLE IF NOT EXISTS test_quality_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 规则信息
    rule_name TEXT UNIQUE NOT NULL,
    rule_type TEXT NOT NULL, -- content, format, completeness, uniqueness
    data_type TEXT NOT NULL, -- questionnaire, story, user
    
    -- 规则配置
    rule_config TEXT NOT NULL, -- JSON配置
    weight INTEGER DEFAULT 10, -- 权重 1-100
    enabled BOOLEAN DEFAULT TRUE,
    
    -- 元数据
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    

);

-- =====================================================
-- 7. 插入默认质量规则
-- =====================================================
INSERT OR IGNORE INTO test_quality_rules (rule_name, rule_type, data_type, rule_config, weight) VALUES
-- 故事质量规则
('story_min_length', 'content', 'story', '{"min_length": 50, "max_length": 2000}', 20),
('story_keyword_match', 'content', 'story', '{"keywords": ["求职", "工作", "面试", "职场", "经历", "经验"]}', 25),
('story_readability', 'content', 'story', '{"min_sentences": 3, "max_sentences": 20}', 15),
('story_uniqueness', 'uniqueness', 'story', '{"similarity_threshold": 0.8}', 20),
('story_completeness', 'completeness', 'story', '{"required_fields": ["title", "content", "category"]}', 20),

-- 问卷质量规则
('questionnaire_completeness', 'completeness', 'questionnaire', '{"required_sections": 6, "required_fields_per_section": 3}', 30),
('questionnaire_format', 'format', 'questionnaire', '{"valid_formats": ["json"], "required_structure": true}', 25),
('questionnaire_realism', 'content', 'questionnaire', '{"realistic_values": true, "logical_consistency": true}', 25),
('questionnaire_diversity', 'uniqueness', 'questionnaire', '{"value_diversity_threshold": 0.7}', 20),

-- 用户质量规则
('user_data_format', 'format', 'user', '{"required_fields": ["uuid", "userType", "displayName"]}', 40),
('user_uuid_validity', 'format', 'user', '{"uuid_format": "valid", "unique": true}', 30),
('user_data_completeness', 'completeness', 'user', '{"all_fields_present": true}', 30);

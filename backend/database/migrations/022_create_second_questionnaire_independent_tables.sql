-- 第二问卷独立数据库表结构
-- 完全独立于第一问卷，仅共用用户认证系统
-- 创建时间: 2025-01-03

-- =====================================================
-- 1. 第二问卷响应主表（完全独立）
-- =====================================================
CREATE TABLE IF NOT EXISTS second_questionnaire_responses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    questionnaire_id TEXT NOT NULL DEFAULT 'employment-survey-2024-v2',
    
    -- 共用用户系统（仅此处与原系统有关联）
    user_uuid TEXT,
    session_id TEXT,
    
    -- 参与者分组（基于第二问卷设计文档）
    participant_group TEXT NOT NULL CHECK (
        participant_group IN (
            'fresh_graduate',      -- 应届毕业生
            'junior_professional', -- 职场新人期（往届毕业生）
            'senior_professional'  -- 职业发展期（往届毕业生）
        )
    ),
    
    -- 问卷数据（JSON格式，独立结构）
    basic_demographics TEXT NOT NULL,     -- 基础人口统计
    employment_status TEXT NOT NULL,      -- 就业状态详情
    unemployment_reasons TEXT NOT NULL,   -- 失业原因分析
    job_search_behavior TEXT NOT NULL,    -- 求职行为数据
    psychological_state TEXT NOT NULL,    -- 心理状态评估
    support_needs TEXT NOT NULL,         -- 支持需求分析
    
    -- 第二问卷特有字段
    group_specific_data TEXT,            -- 群体特定数据
    comparative_insights TEXT,           -- 对比洞察数据
    
    -- 质量控制字段
    completion_quality_score REAL DEFAULT 1.0,
    logical_consistency_score REAL DEFAULT 1.0,
    response_time_seconds INTEGER,
    interaction_count INTEGER,
    
    -- 用户体验数据（用于V1/V2对比）
    user_experience_rating INTEGER CHECK (user_experience_rating BETWEEN 1 AND 10),
    interaction_preference TEXT, -- 'traditional' | 'conversational'
    technical_feedback TEXT,
    
    -- 标准时间字段
    started_at DATETIME NOT NULL,
    submitted_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 布尔字段
    is_completed INTEGER DEFAULT 1,
    is_valid INTEGER DEFAULT 1,
    is_test_data INTEGER DEFAULT 0,
    
    -- 外键约束（仅与用户系统关联）
    FOREIGN KEY (user_uuid) REFERENCES questionnaire_users(uuid) ON DELETE SET NULL
);

-- =====================================================
-- 2. 第二问卷统计缓存表（独立）
-- =====================================================
CREATE TABLE IF NOT EXISTS second_questionnaire_analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    questionnaire_id TEXT NOT NULL DEFAULT 'employment-survey-2024-v2',
    
    -- 分析维度（基于第二问卷设计）
    analysis_dimension TEXT NOT NULL CHECK (
        analysis_dimension IN (
            'participant_demographics',    -- 参与者画像
            'unemployment_deep_analysis',  -- 失业原因深度分析
            'job_seeking_patterns',       -- 求职行为模式
            'psychological_states',       -- 心理状态分布
            'support_needs_matrix',       -- 支持需求矩阵
            'group_comparison_analysis'   -- 群体对比分析
        )
    ),
    
    -- 缓存数据
    statistical_data TEXT NOT NULL,
    visualization_config TEXT NOT NULL,
    chart_data TEXT NOT NULL,
    
    -- 缓存管理
    expires_at DATETIME NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. 第二问卷字段映射表（独立）
-- =====================================================
CREATE TABLE IF NOT EXISTS second_questionnaire_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mapping_category TEXT NOT NULL, -- 'question' | 'option' | 'analysis'
    source_key TEXT NOT NULL,       -- 中文键
    target_key TEXT NOT NULL,       -- 英文/系统键
    
    -- 映射内容
    chinese_label TEXT NOT NULL,
    english_label TEXT NOT NULL,
    system_value TEXT NOT NULL,
    
    -- 分组信息
    question_group TEXT,
    participant_group TEXT,
    
    -- 元数据
    description TEXT,
    usage_context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(mapping_category, source_key, target_key)
);

-- =====================================================
-- 4. 问卷对比分析表（独立）
-- =====================================================
CREATE TABLE IF NOT EXISTS questionnaire_comparison_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comparison_id TEXT UNIQUE NOT NULL,
    
    -- 对比类型
    comparison_type TEXT NOT NULL CHECK (
        comparison_type IN (
            'completion_rate',
            'data_quality', 
            'user_experience',
            'insight_depth',
            'technical_performance'
        )
    ),
    
    -- 对比数据
    v1_metrics TEXT NOT NULL,        -- 第一问卷指标
    v2_metrics TEXT NOT NULL,        -- 第二问卷指标
    comparison_results TEXT NOT NULL, -- 对比结果
    statistical_significance TEXT,    -- 统计显著性
    
    -- 结论
    recommendation TEXT,             -- 推荐结论
    decision_factors TEXT,           -- 决策因素
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. 创建索引（性能优化）
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_second_questionnaire_responses_user_uuid 
ON second_questionnaire_responses(user_uuid);

CREATE INDEX IF NOT EXISTS idx_second_questionnaire_responses_participant_group 
ON second_questionnaire_responses(participant_group);

CREATE INDEX IF NOT EXISTS idx_second_questionnaire_responses_submitted_at 
ON second_questionnaire_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_second_questionnaire_analytics_cache_dimension 
ON second_questionnaire_analytics_cache(analysis_dimension);

CREATE INDEX IF NOT EXISTS idx_second_questionnaire_analytics_cache_expires 
ON second_questionnaire_analytics_cache(expires_at);

-- =====================================================
-- 6. 初始化字段映射数据
-- =====================================================
INSERT OR IGNORE INTO second_questionnaire_field_mappings 
(mapping_category, source_key, target_key, chinese_label, english_label, system_value, question_group, participant_group) 
VALUES 
-- 参与者分组映射
('question', '参与者分组', 'participant_group', '请选择您目前的身份类型', 'Please select your current identity type', 'participant_group', 'classification', 'all'),
('option', '应届毕业生', 'fresh_graduate', '应届毕业生', 'Fresh Graduate', 'fresh_graduate', 'participant_group', 'all'),
('option', '职场新人期', 'junior_professional', '职场新人期（往届毕业生）', 'Junior Professional (Previous Graduate)', 'junior_professional', 'participant_group', 'all'),
('option', '职业发展期', 'senior_professional', '职业发展期（往届毕业生）', 'Senior Professional (Previous Graduate)', 'senior_professional', 'participant_group', 'all');

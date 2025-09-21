-- 数据库性能优化：多级专用表创建
-- 第2级：业务专用表

-- 可视化专用表 (analytics_responses)
CREATE TABLE IF NOT EXISTS analytics_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    
    -- 预处理的统计字段 (避免JOIN查询)
    age_range TEXT,
    education_level TEXT,
    employment_status TEXT,
    salary_range TEXT,
    work_location TEXT,
    industry TEXT,
    gender TEXT,
    
    -- 多选字段 (JSON格式，便于统计)
    job_search_channels TEXT, -- JSON array
    difficulties TEXT,        -- JSON array
    skills TEXT,             -- JSON array
    policy_suggestions TEXT, -- JSON array
    
    -- 数值字段 (便于聚合计算)
    salary_expectation INTEGER,
    work_experience_months INTEGER,
    job_search_duration_months INTEGER,
    
    -- 质量控制
    data_quality_score REAL DEFAULT 1.0,
    is_complete INTEGER DEFAULT 1,
    processing_version TEXT DEFAULT 'v1.0',
    is_test_data INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 管理员专用表 (admin_responses)
CREATE TABLE IF NOT EXISTS admin_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_response_id TEXT NOT NULL,
    
    -- 提交元数据
    submission_ip TEXT,
    user_agent TEXT,
    submission_duration INTEGER, -- 秒
    completion_rate REAL DEFAULT 1.0,
    
    -- 数据质量评估
    data_consistency_score REAL DEFAULT 1.0,
    logical_consistency_score REAL DEFAULT 1.0,
    completeness_score REAL DEFAULT 1.0,
    
    -- 审核流程
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'flagged')),
    reviewer_id TEXT,
    review_notes TEXT,
    reviewed_at TEXT,
    
    -- 风险评估
    is_suspicious INTEGER DEFAULT 0,
    quality_flags TEXT, -- JSON: ["duplicate_ip", "too_fast", "inconsistent_data"]
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    fraud_indicators TEXT, -- JSON
    
    -- 用户行为分析
    page_view_count INTEGER DEFAULT 0,
    time_on_page INTEGER DEFAULT 0, -- 秒
    interaction_count INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (original_response_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- AI分析专用表 (social_insights_data)
CREATE TABLE IF NOT EXISTS social_insights_data (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- AI分析维度评分 (0-1)
    employment_trend_score REAL DEFAULT 0.0,
    salary_satisfaction_score REAL DEFAULT 0.0,
    career_stability_score REAL DEFAULT 0.0,
    market_competitiveness_score REAL DEFAULT 0.0,
    skill_match_score REAL DEFAULT 0.0,
    
    -- 文本分析结果
    sentiment_score REAL DEFAULT 0.0, -- -1到1
    key_concerns TEXT, -- JSON array: ["salary", "location", "growth"]
    career_goals TEXT, -- JSON array: ["stability", "growth", "balance"]
    skill_gaps TEXT,   -- JSON array: ["programming", "communication"]
    
    -- 用户画像分类
    user_persona TEXT, -- "ambitious_graduate", "stable_seeker", "career_changer"
    career_stage TEXT, -- "entry", "mid", "senior", "transition"
    risk_category TEXT, -- "low", "medium", "high"
    market_segment TEXT, -- "tech", "finance", "education", "government"
    
    -- 预测分析
    employment_probability REAL DEFAULT 0.0,
    salary_prediction_range TEXT, -- JSON: {"min": 5000, "max": 8000}
    career_success_indicators TEXT, -- JSON array
    
    -- 社会洞察维度
    social_mobility_index REAL DEFAULT 0.0,
    economic_pressure_score REAL DEFAULT 0.0,
    policy_impact_score REAL DEFAULT 0.0,
    
    -- 时间维度
    analysis_date TEXT NOT NULL,
    trend_period TEXT DEFAULT 'current', -- "current", "weekly", "monthly"
    cohort_identifier TEXT, -- 用于同期群分析
    
    -- 数据质量
    confidence_level REAL DEFAULT 0.0,
    analysis_version TEXT DEFAULT 'v1.0',
    is_test_data INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (response_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 导出专用表 (export_responses)
CREATE TABLE IF NOT EXISTS export_responses (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    
    -- 导出格式化数据
    csv_data TEXT,     -- CSV格式的行数据
    json_data TEXT,    -- JSON格式的完整数据
    excel_data TEXT,   -- Excel格式的数据
    
    -- 导出元数据
    export_version TEXT DEFAULT 'v1.0',
    field_mapping TEXT, -- JSON: 字段映射配置
    anonymization_level TEXT DEFAULT 'partial', -- "none", "partial", "full"
    
    -- 数据处理状态
    is_processed INTEGER DEFAULT 0,
    processing_errors TEXT, -- JSON array
    last_exported_at TEXT,
    export_count INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (response_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE
);

-- 第3级：统计缓存表

-- 实时统计表 (realtime_stats)
CREATE TABLE IF NOT EXISTS realtime_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_key TEXT NOT NULL,
    stat_category TEXT NOT NULL, -- 'basic', 'employment', 'education', 'salary', 'demographics'
    
    -- 统计值
    count_value INTEGER DEFAULT 0,
    percentage_value REAL DEFAULT 0.0,
    average_value REAL DEFAULT 0.0,
    median_value REAL DEFAULT 0.0,
    total_sample_size INTEGER DEFAULT 0,
    
    -- 时间窗口
    time_window TEXT NOT NULL, -- '1min', '5min', '1hour', '1day'
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    
    -- 数据来源和质量
    data_source TEXT NOT NULL, -- 'analytics_responses', 'admin_responses'
    confidence_level REAL DEFAULT 1.0,
    margin_of_error REAL DEFAULT 0.0,
    
    -- 元数据
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    update_frequency INTEGER DEFAULT 300, -- 更新频率(秒)
    is_active INTEGER DEFAULT 1,
    
    -- 唯一约束
    UNIQUE(stat_key, time_window, window_start)
);

-- 聚合统计表 (aggregated_stats)
CREATE TABLE IF NOT EXISTS aggregated_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dimension TEXT NOT NULL, -- 'age', 'education', 'employment', 'salary', 'location'
    dimension_value TEXT NOT NULL,
    
    -- 基础统计
    count INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0.0,
    rank_position INTEGER DEFAULT 0,
    percentile REAL DEFAULT 0.0,
    
    -- 交叉统计
    cross_dimension TEXT,
    cross_dimension_value TEXT,
    cross_count INTEGER DEFAULT 0,
    cross_percentage REAL DEFAULT 0.0,
    
    -- 趋势数据
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable', 'unknown')),
    trend_percentage REAL DEFAULT 0.0,
    trend_significance REAL DEFAULT 0.0,
    
    -- 时间维度
    period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'quarterly')),
    period_date TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    
    -- 数据质量
    sample_size INTEGER DEFAULT 0,
    confidence_interval REAL DEFAULT 0.0,
    statistical_significance REAL DEFAULT 0.0,
    
    -- 元数据
    calculation_method TEXT DEFAULT 'standard',
    last_calculated TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    
    -- 唯一约束
    UNIQUE(dimension, dimension_value, cross_dimension, cross_dimension_value, period_type, period_date)
);

-- 第4级：视图缓存表

-- 仪表板缓存表 (dashboard_cache)
CREATE TABLE IF NOT EXISTS dashboard_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    dashboard_type TEXT NOT NULL, -- 'admin', 'public', 'analytics'
    
    -- 缓存内容
    widget_data TEXT NOT NULL, -- JSON: 各个组件的数据
    summary_stats TEXT,        -- JSON: 汇总统计
    chart_configs TEXT,        -- JSON: 图表配置
    
    -- 缓存管理
    cache_size INTEGER DEFAULT 0,
    compression_ratio REAL DEFAULT 1.0,
    generation_time_ms INTEGER DEFAULT 0,
    
    -- 时效性
    expires_at TEXT NOT NULL,
    refresh_interval INTEGER DEFAULT 600, -- 刷新间隔(秒)
    last_accessed TEXT,
    access_count INTEGER DEFAULT 0,
    
    -- 数据源追踪
    source_tables TEXT, -- JSON array: 依赖的源表
    source_version TEXT DEFAULT 'v1.0',
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 可视化缓存表 (enhanced_visualization_cache)
CREATE TABLE IF NOT EXISTS enhanced_visualization_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    visualization_type TEXT NOT NULL, -- 'chart', 'table', 'map', 'treemap'
    page_context TEXT NOT NULL,       -- 'analytics', 'reports', 'export'
    
    -- 缓存数据
    chart_data TEXT NOT NULL,    -- JSON: 图表数据
    chart_config TEXT,           -- JSON: 图表配置
    metadata TEXT,               -- JSON: 元数据
    
    -- 性能指标
    data_points INTEGER DEFAULT 0,
    render_complexity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    estimated_render_time INTEGER DEFAULT 0, -- 毫秒
    
    -- 缓存策略
    cache_strategy TEXT DEFAULT 'time_based', -- 'time_based', 'data_based', 'hybrid'
    invalidation_triggers TEXT, -- JSON array: 失效触发条件
    
    -- 时效性
    expires_at TEXT NOT NULL,
    auto_refresh INTEGER DEFAULT 1,
    refresh_priority INTEGER DEFAULT 5, -- 1-10
    
    -- 访问统计
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit TEXT,
    
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引以提升查询性能

-- analytics_responses 索引
CREATE INDEX IF NOT EXISTS idx_analytics_age ON analytics_responses(age_range);
CREATE INDEX IF NOT EXISTS idx_analytics_education ON analytics_responses(education_level);
CREATE INDEX IF NOT EXISTS idx_analytics_employment ON analytics_responses(employment_status);
CREATE INDEX IF NOT EXISTS idx_analytics_submitted ON analytics_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_analytics_quality ON analytics_responses(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_analytics_test_data ON analytics_responses(is_test_data);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_responses(user_id);

-- admin_responses 索引
CREATE INDEX IF NOT EXISTS idx_admin_status ON admin_responses(review_status);
CREATE INDEX IF NOT EXISTS idx_admin_quality ON admin_responses(data_consistency_score);
CREATE INDEX IF NOT EXISTS idx_admin_risk ON admin_responses(risk_score);
CREATE INDEX IF NOT EXISTS idx_admin_reviewer ON admin_responses(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_admin_suspicious ON admin_responses(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_admin_ip ON admin_responses(submission_ip);

-- social_insights_data 索引
CREATE INDEX IF NOT EXISTS idx_insights_trend ON social_insights_data(employment_trend_score);
CREATE INDEX IF NOT EXISTS idx_insights_sentiment ON social_insights_data(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_insights_persona ON social_insights_data(user_persona);
CREATE INDEX IF NOT EXISTS idx_insights_date ON social_insights_data(analysis_date);
CREATE INDEX IF NOT EXISTS idx_insights_stage ON social_insights_data(career_stage);
CREATE INDEX IF NOT EXISTS idx_insights_segment ON social_insights_data(market_segment);

-- realtime_stats 索引
CREATE INDEX IF NOT EXISTS idx_realtime_category ON realtime_stats(stat_category);
CREATE INDEX IF NOT EXISTS idx_realtime_window ON realtime_stats(time_window);
CREATE INDEX IF NOT EXISTS idx_realtime_updated ON realtime_stats(last_updated);
CREATE INDEX IF NOT EXISTS idx_realtime_key ON realtime_stats(stat_key);
CREATE INDEX IF NOT EXISTS idx_realtime_active ON realtime_stats(is_active);

-- aggregated_stats 索引
CREATE INDEX IF NOT EXISTS idx_aggregated_dimension ON aggregated_stats(dimension);
CREATE INDEX IF NOT EXISTS idx_aggregated_period ON aggregated_stats(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_aggregated_rank ON aggregated_stats(rank_position);
CREATE INDEX IF NOT EXISTS idx_aggregated_cross ON aggregated_stats(cross_dimension, cross_dimension_value);
CREATE INDEX IF NOT EXISTS idx_aggregated_trend ON aggregated_stats(trend_direction);

-- dashboard_cache 索引
CREATE INDEX IF NOT EXISTS idx_dashboard_type ON dashboard_cache(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_expires ON dashboard_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_accessed ON dashboard_cache(last_accessed);

-- enhanced_visualization_cache 索引
CREATE INDEX IF NOT EXISTS idx_viz_cache_type ON enhanced_visualization_cache(visualization_type);
CREATE INDEX IF NOT EXISTS idx_viz_cache_context ON enhanced_visualization_cache(page_context);
CREATE INDEX IF NOT EXISTS idx_viz_cache_expires ON enhanced_visualization_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_viz_cache_priority ON enhanced_visualization_cache(refresh_priority);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_analytics_status_date ON analytics_responses(employment_status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_analytics_age_education ON analytics_responses(age_range, education_level);
CREATE INDEX IF NOT EXISTS idx_realtime_category_window ON realtime_stats(stat_category, time_window, window_start);
CREATE INDEX IF NOT EXISTS idx_aggregated_dimension_period ON aggregated_stats(dimension, period_type, period_date);

-- 注释说明
-- 此迁移文件创建了完整的多级专用表架构
-- 第2级：业务专用表 (analytics_responses, admin_responses, social_insights_data, export_responses)
-- 第3级：统计缓存表 (realtime_stats, aggregated_stats)
-- 第4级：视图缓存表 (dashboard_cache, enhanced_visualization_cache)
-- 包含了完整的索引优化和约束设计

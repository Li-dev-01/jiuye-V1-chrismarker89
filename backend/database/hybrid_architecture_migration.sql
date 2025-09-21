-- 混合架构数据库迁移脚本
-- 目标：结合JSON灵活性和关系型数据库的统计优势
-- 创建时间：2025-08-11

-- =====================================================
-- 1. 核心统计字段表（高频查询字段）
-- =====================================================

-- 问卷核心统计表
CREATE TABLE IF NOT EXISTS questionnaire_core_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL,
    questionnaire_id TEXT NOT NULL,
    
    -- 基础信息字段（无条件显示，数据完整）
    age_range TEXT,
    gender TEXT,
    education_level TEXT,
    major_field TEXT,
    graduation_year TEXT,
    work_location_preference TEXT,
    
    -- 身份分类字段（分支逻辑核心）
    current_status TEXT NOT NULL, -- 决定后续分支的关键字段
    
    -- 就业相关字段（条件显示）
    work_industry TEXT,
    work_experience TEXT,
    position_level TEXT,
    current_salary TEXT,
    job_satisfaction TEXT,
    
    -- 求职相关字段（条件显示）
    job_search_intensity TEXT,
    financial_pressure TEXT,
    job_hunting_difficulties TEXT,
    
    -- 学生相关字段（条件显示）
    academic_performance TEXT,
    internship_experience TEXT,
    career_preparation TEXT,
    
    -- 元数据
    user_path TEXT, -- 记录用户经过的分支路径
    sections_completed TEXT, -- JSON数组，记录完成的section
    completion_percentage REAL DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (response_id) REFERENCES universal_questionnaire_responses(id) ON DELETE CASCADE,
    
    -- 索引优化
    INDEX idx_questionnaire_id (questionnaire_id),
    INDEX idx_current_status (current_status),
    INDEX idx_age_range (age_range),
    INDEX idx_education_level (education_level),
    INDEX idx_work_industry (work_industry),
    INDEX idx_submitted_at (submitted_at)
);

-- =====================================================
-- 2. 用户路径分析表
-- =====================================================

-- 用户分支路径表
CREATE TABLE IF NOT EXISTS questionnaire_user_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL,
    questionnaire_id TEXT NOT NULL,
    
    -- 路径信息
    entry_point TEXT, -- 用户进入的身份选择
    path_sequence TEXT, -- JSON数组，记录section访问顺序
    branch_decisions TEXT, -- JSON对象，记录分支决策点
    
    -- 完成情况
    total_sections INTEGER DEFAULT 0,
    completed_sections INTEGER DEFAULT 0,
    skipped_sections TEXT, -- JSON数组，记录跳过的section
    
    -- 时间分析
    total_time_seconds INTEGER DEFAULT 0,
    section_times TEXT, -- JSON对象，记录每个section的用时
    
    -- 元数据
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (response_id) REFERENCES universal_questionnaire_responses(id) ON DELETE CASCADE,
    INDEX idx_entry_point (entry_point),
    INDEX idx_questionnaire_id (questionnaire_id)
);

-- =====================================================
-- 3. 统计缓存优化表
-- =====================================================

-- 增强版统计缓存表
CREATE TABLE IF NOT EXISTS questionnaire_enhanced_stats_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    
    -- 基础统计
    option_value TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_responses INTEGER NOT NULL DEFAULT 0,
    
    -- 分层统计（按用户路径）
    by_user_path TEXT, -- JSON对象，按用户路径分组的统计
    by_demographics TEXT, -- JSON对象，按人口统计学特征分组
    
    -- 条件统计
    condition_met_count INTEGER DEFAULT 0, -- 满足显示条件的用户数
    condition_total_count INTEGER DEFAULT 0, -- 总用户数
    display_rate DECIMAL(5,2) DEFAULT 0.00, -- 题目显示率
    
    -- 元数据
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_quality_score DECIMAL(3,2) DEFAULT 1.00, -- 数据质量评分
    
    -- 复合索引
    UNIQUE INDEX idx_questionnaire_question_option (questionnaire_id, question_id, option_value),
    INDEX idx_last_updated (last_updated)
);

-- =====================================================
-- 4. 数据质量监控表
-- =====================================================

-- 数据质量监控表
CREATE TABLE IF NOT EXISTS questionnaire_data_quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    
    -- 整体质量指标
    total_responses INTEGER DEFAULT 0,
    complete_responses INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- 分支覆盖率
    branch_coverage TEXT, -- JSON对象，记录各分支的覆盖情况
    section_completion_rates TEXT, -- JSON对象，记录各section的完成率
    
    -- 数据完整性
    core_fields_completeness DECIMAL(5,2) DEFAULT 0.00,
    conditional_fields_completeness DECIMAL(5,2) DEFAULT 0.00,
    
    -- 用户路径分析
    most_common_paths TEXT, -- JSON数组，最常见的用户路径
    dropout_points TEXT, -- JSON数组，用户流失点分析
    
    -- 更新信息
    last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
    calculation_duration_ms INTEGER DEFAULT 0,
    
    INDEX idx_questionnaire_id (questionnaire_id),
    INDEX idx_last_calculated (last_calculated)
);

-- =====================================================
-- 5. 视图定义
-- =====================================================

-- 完整统计视图
CREATE VIEW IF NOT EXISTS v_questionnaire_complete_stats AS
SELECT 
    qcs.questionnaire_id,
    qcs.current_status,
    qcs.age_range,
    qcs.education_level,
    qcs.major_field,
    qcs.work_industry,
    qcs.job_satisfaction,
    qup.entry_point,
    qup.completed_sections,
    qup.total_time_seconds,
    qcs.submitted_at
FROM questionnaire_core_stats qcs
LEFT JOIN questionnaire_user_paths qup ON qcs.response_id = qup.response_id
WHERE qcs.completion_percentage >= 50; -- 只包含完成度50%以上的响应

-- 分支统计视图
CREATE VIEW IF NOT EXISTS v_questionnaire_branch_stats AS
SELECT 
    questionnaire_id,
    current_status as branch_key,
    COUNT(*) as user_count,
    AVG(completion_percentage) as avg_completion,
    COUNT(CASE WHEN work_industry IS NOT NULL THEN 1 END) as employment_data_count,
    COUNT(CASE WHEN job_search_intensity IS NOT NULL THEN 1 END) as job_seeking_data_count,
    COUNT(CASE WHEN academic_performance IS NOT NULL THEN 1 END) as student_data_count
FROM questionnaire_core_stats
GROUP BY questionnaire_id, current_status;

-- =====================================================
-- 6. 触发器（自动维护统计）
-- =====================================================

-- 自动更新统计缓存的触发器
CREATE TRIGGER IF NOT EXISTS tr_update_stats_cache
AFTER INSERT ON questionnaire_core_stats
BEGIN
    -- 更新基础统计
    INSERT OR REPLACE INTO questionnaire_enhanced_stats_cache 
    (questionnaire_id, question_id, option_value, count, total_responses, last_updated)
    SELECT 
        NEW.questionnaire_id,
        'current-status',
        NEW.current_status,
        COUNT(*),
        (SELECT COUNT(*) FROM questionnaire_core_stats WHERE questionnaire_id = NEW.questionnaire_id),
        CURRENT_TIMESTAMP
    FROM questionnaire_core_stats 
    WHERE questionnaire_id = NEW.questionnaire_id 
    AND current_status = NEW.current_status;
    
    -- 更新数据质量监控
    INSERT OR REPLACE INTO questionnaire_data_quality 
    (questionnaire_id, total_responses, complete_responses, completion_rate, last_calculated)
    SELECT 
        NEW.questionnaire_id,
        COUNT(*),
        COUNT(CASE WHEN completion_percentage >= 100 THEN 1 END),
        AVG(completion_percentage),
        CURRENT_TIMESTAMP
    FROM questionnaire_core_stats 
    WHERE questionnaire_id = NEW.questionnaire_id;
END;

-- =====================================================
-- 7. 初始化数据迁移
-- =====================================================

-- 从现有数据迁移到新结构的存储过程
-- 注意：这个脚本需要根据实际数据结构调整

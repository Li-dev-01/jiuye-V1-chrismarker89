-- 创建测试数据专用表结构
-- 与生成的测试数据格式完全匹配

-- 用户表 (扩展版本，支持测试数据)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    nickname TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reviewer', 'admin', 'super_admin')),
    is_test_data INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 问卷回答表 (新结构，支持完整的问卷数据)
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    questionnaire_id TEXT NOT NULL DEFAULT 'universal-employment-survey-2024',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'approved', 'rejected')),
    is_test_data INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    submitted_at TEXT,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 问卷答案表 (存储具体的问题答案)
CREATE TABLE IF NOT EXISTS questionnaire_answers (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_value TEXT NOT NULL,
    is_test_data INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键约束
    FOREIGN KEY (response_id) REFERENCES questionnaire_responses(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_test_data ON users(is_test_data);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_questionnaire_id ON questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_status ON questionnaire_responses(status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_is_test_data ON questionnaire_responses(is_test_data);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_submitted_at ON questionnaire_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_response_id ON questionnaire_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_question_id ON questionnaire_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_is_test_data ON questionnaire_answers(is_test_data);

-- 复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_test_data_status 
ON questionnaire_responses(is_test_data, status);

CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_test_data_question 
ON questionnaire_answers(is_test_data, question_id);

-- 问卷统计缓存表 (用于可视化数据)
CREATE TABLE IF NOT EXISTS questionnaire_statistics_cache (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cache_key TEXT UNIQUE NOT NULL,
    questionnaire_id TEXT NOT NULL,
    dimension TEXT NOT NULL, -- 统计维度 (age, education, employment_status, etc.)
    statistics_data TEXT NOT NULL, -- JSON格式存储统计数据
    include_test_data INTEGER DEFAULT 0, -- 是否包含测试数据
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_key ON questionnaire_statistics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_questionnaire_id ON questionnaire_statistics_cache(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_dimension ON questionnaire_statistics_cache(dimension);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_include_test_data ON questionnaire_statistics_cache(include_test_data);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_expires_at ON questionnaire_statistics_cache(expires_at);



CREATE INDEX IF NOT EXISTS idx_social_insights_cache_date ON social_insights_cache(insight_date);
CREATE INDEX IF NOT EXISTS idx_social_insights_cache_questionnaire_id ON social_insights_cache(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_social_insights_cache_dimension ON social_insights_cache(dimension);
CREATE INDEX IF NOT EXISTS idx_social_insights_cache_include_test_data ON social_insights_cache(include_test_data);

-- 数据质量监控表
CREATE TABLE IF NOT EXISTS data_quality_reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    report_date TEXT NOT NULL,
    questionnaire_id TEXT NOT NULL,
    total_responses INTEGER NOT NULL,
    test_data_responses INTEGER NOT NULL,
    completion_rate REAL NOT NULL,
    quality_score REAL NOT NULL,
    issues_found TEXT, -- JSON格式存储发现的问题
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_data_quality_reports_date ON data_quality_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_data_quality_reports_questionnaire_id ON data_quality_reports(questionnaire_id);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_questionnaire_responses_updated_at
    AFTER UPDATE ON questionnaire_responses
    FOR EACH ROW
BEGIN
    UPDATE questionnaire_responses 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- 数据清理触发器 (可选，用于自动清理过期缓存)
CREATE TRIGGER IF NOT EXISTS cleanup_expired_statistics_cache
    AFTER INSERT ON questionnaire_statistics_cache
    FOR EACH ROW
BEGIN
    DELETE FROM questionnaire_statistics_cache 
    WHERE expires_at < datetime('now');
END;

-- 插入默认的问卷配置 (如果不存在)
INSERT OR IGNORE INTO questionnaire_statistics_cache (
    cache_key,
    questionnaire_id,
    dimension,
    statistics_data,
    include_test_data,
    expires_at
) VALUES (
    'default-config',
    'universal-employment-survey-2024',
    'config',
    '{"initialized": true, "version": "1.0.0"}',
    0,
    datetime('now', '+1 year')
);

-- 创建视图用于常见查询
CREATE VIEW IF NOT EXISTS v_questionnaire_summary AS
SELECT 
    qr.questionnaire_id,
    qr.is_test_data,
    COUNT(*) as total_responses,
    COUNT(CASE WHEN qr.status = 'completed' THEN 1 END) as completed_responses,
    COUNT(CASE WHEN qr.status = 'approved' THEN 1 END) as approved_responses,
    MIN(qr.created_at) as first_response_date,
    MAX(qr.created_at) as last_response_date
FROM questionnaire_responses qr
GROUP BY qr.questionnaire_id, qr.is_test_data;

-- 创建视图用于答案统计
CREATE VIEW IF NOT EXISTS v_answer_statistics AS
SELECT 
    qa.question_id,
    qa.answer_value,
    qa.is_test_data,
    COUNT(*) as answer_count,
    ROUND(COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM questionnaire_answers qa2 
        WHERE qa2.question_id = qa.question_id 
        AND qa2.is_test_data = qa.is_test_data
    ), 2) as percentage
FROM questionnaire_answers qa
GROUP BY qa.question_id, qa.answer_value, qa.is_test_data;

-- 注释说明
-- 此迁移文件创建了完整的测试数据支持结构
-- 包括用户表、问卷回答表、答案表、统计缓存表等
-- 所有表都支持 is_test_data 字段来区分测试数据和生产数据
-- 创建了必要的索引和视图来优化查询性能
-- 支持社会洞察功能的数据存储需求

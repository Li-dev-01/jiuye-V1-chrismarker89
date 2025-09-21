-- 初始化问卷统计缓存表
-- 执行命令: npx wrangler d1 execute college-employment-survey-isolated --file=./scripts/init-stats-cache.sql

-- 创建统计缓存表
CREATE TABLE IF NOT EXISTS questionnaire_stats_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id VARCHAR(100) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    option_value VARCHAR(500) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_responses INTEGER NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 创建索引
    UNIQUE(questionnaire_id, question_id, option_value)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_question ON questionnaire_stats_cache(questionnaire_id, question_id);
CREATE INDEX IF NOT EXISTS idx_last_updated ON questionnaire_stats_cache(last_updated);

-- 插入初始测试数据（基于当前API返回的真实数据）
INSERT OR REPLACE INTO questionnaire_stats_cache 
(questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated) 
VALUES 
-- age-range 问题
('employment-survey-2024', 'age-range', '20-22', 40, 40.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', '23-25', 39, 39.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', '26-28', 13, 13.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', 'under-20', 3, 3.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', '29-35', 4, 4.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', 'over-35', 1, 1.00, 100, datetime('now')),

-- current-status 问题
('employment-survey-2024', 'current-status', 'fulltime', 49, 49.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'internship', 15, 15.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'unemployed', 14, 14.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'student', 10, 10.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'freelance', 5, 5.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'preparing', 5, 5.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'parttime', 2, 2.00, 100, datetime('now')),

-- education-level 问题
('employment-survey-2024', 'education-level', 'bachelor', 50, 50.00, 100, datetime('now')),
('employment-survey-2024', 'education-level', 'master', 22, 22.00, 100, datetime('now')),
('employment-survey-2024', 'education-level', 'junior-college', 21, 21.00, 100, datetime('now')),
('employment-survey-2024', 'education-level', 'phd', 5, 5.00, 100, datetime('now')),
('employment-survey-2024', 'education-level', 'high-school', 2, 2.00, 100, datetime('now')),

-- major-field 问题
('employment-survey-2024', 'major-field', 'engineering', 33, 33.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'management', 15, 15.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'science', 10, 10.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'economics', 9, 9.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'literature', 8, 8.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'medicine', 8, 8.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'law', 7, 7.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'art', 6, 6.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'education', 2, 2.00, 100, datetime('now')),
('employment-survey-2024', 'major-field', 'philosophy', 2, 2.00, 100, datetime('now'));

-- 验证数据插入
SELECT 
    question_id,
    COUNT(*) as option_count,
    SUM(count) as total_responses,
    MAX(last_updated) as last_updated
FROM questionnaire_stats_cache 
WHERE questionnaire_id = 'employment-survey-2024'
GROUP BY question_id
ORDER BY question_id;

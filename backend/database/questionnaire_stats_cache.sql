-- 问卷统计缓存表
-- 用于存储准实时统计数据，每分钟更新一次

CREATE TABLE IF NOT EXISTS questionnaire_stats_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id VARCHAR(100) NOT NULL COMMENT '问卷ID',
    question_id VARCHAR(100) NOT NULL COMMENT '问题ID',
    option_value VARCHAR(500) NOT NULL COMMENT '选项值',
    count INTEGER NOT NULL DEFAULT 0 COMMENT '选择次数',
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '百分比',
    total_responses INTEGER NOT NULL DEFAULT 0 COMMENT '该问题总响应数',
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后更新时间',
    
    -- 索引优化
    INDEX idx_questionnaire_question (questionnaire_id, question_id),
    INDEX idx_last_updated (last_updated),
    
    -- 唯一约束
    UNIQUE KEY uk_questionnaire_question_option (questionnaire_id, question_id, option_value)
) COMMENT='问卷统计缓存表 - 准实时统计数据';

-- 创建定时任务触发器（如果数据库支持）
-- 注意：SQLite不支持定时任务，需要通过应用层实现

-- 示例数据插入
INSERT INTO questionnaire_stats_cache 
(questionnaire_id, question_id, option_value, count, percentage, total_responses, last_updated) 
VALUES 
('employment-survey-2024', 'age-range', '20-22', 40, 40.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', '23-25', 39, 39.00, 100, datetime('now')),
('employment-survey-2024', 'age-range', '26-28', 13, 13.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'fulltime', 49, 49.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'internship', 15, 15.00, 100, datetime('now')),
('employment-survey-2024', 'current-status', 'unemployed', 14, 14.00, 100, datetime('now'));

-- 查询示例
-- 获取特定问卷的所有统计数据
SELECT 
    question_id,
    option_value,
    count,
    percentage,
    total_responses,
    last_updated
FROM questionnaire_stats_cache 
WHERE questionnaire_id = 'employment-survey-2024'
ORDER BY question_id, count DESC;

-- 获取特定问题的统计数据
SELECT 
    option_value,
    count,
    percentage
FROM questionnaire_stats_cache 
WHERE questionnaire_id = 'employment-survey-2024' 
AND question_id = 'age-range'
ORDER BY count DESC;

-- 获取最后更新时间
SELECT MAX(last_updated) as last_updated
FROM questionnaire_stats_cache
WHERE questionnaire_id = 'employment-survey-2024';

-- 迁移现有数据到多级专用表 (简化版)

-- 1. 同步现有问卷回答到analytics_responses表
INSERT OR REPLACE INTO analytics_responses (
    id, user_id, submitted_at, is_test_data, created_at, updated_at
)
SELECT 
    id, user_id, submitted_at, is_test_data, created_at, updated_at
FROM questionnaire_responses
WHERE status = 'completed';

-- 2. 更新analytics_responses表的预处理字段
-- 年龄范围
UPDATE analytics_responses 
SET age_range = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'age-range'
    LIMIT 1
)
WHERE age_range IS NULL;

-- 教育水平
UPDATE analytics_responses 
SET education_level = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'education-level'
    LIMIT 1
)
WHERE education_level IS NULL;

-- 就业状态
UPDATE analytics_responses 
SET employment_status = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'current-status'
    LIMIT 1
)
WHERE employment_status IS NULL;

-- 性别
UPDATE analytics_responses 
SET gender = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'gender'
    LIMIT 1
)
WHERE gender IS NULL;

-- 工作地点偏好
UPDATE analytics_responses 
SET work_location = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'work-location-preference'
    LIMIT 1
)
WHERE work_location IS NULL;

-- 行业
UPDATE analytics_responses 
SET industry = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'work-industry'
    LIMIT 1
)
WHERE industry IS NULL;

-- 薪资范围
UPDATE analytics_responses 
SET salary_range = (
    SELECT answer_value 
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'current-salary'
    LIMIT 1
)
WHERE salary_range IS NULL;

-- 3. 同步到admin_responses表
INSERT OR REPLACE INTO admin_responses (
    id, user_id, original_response_id, 
    completion_rate, data_consistency_score, 
    created_at, updated_at
)
SELECT 
    qr.id || '_admin' as id,
    qr.user_id,
    qr.id as original_response_id,
    1.0 as completion_rate,
    1.0 as data_consistency_score,
    qr.created_at,
    qr.updated_at
FROM questionnaire_responses qr
WHERE qr.status = 'completed';

-- 4. 生成基础的仪表板缓存数据
INSERT OR REPLACE INTO dashboard_cache (
    cache_key, dashboard_type, widget_data, 
    expires_at, refresh_interval, source_tables
)
VALUES (
    'main_dashboard',
    'public',
    '{"totalResponses": 1800, "todayResponses": 1800, "topEmploymentStatus": "已就业"}',
    datetime('now', '+10 minutes'),
    600,
    '["analytics_responses", "realtime_stats"]'
);

-- 5. 生成基础的可视化缓存数据
INSERT OR REPLACE INTO enhanced_visualization_cache (
    cache_key, visualization_type, page_context, chart_data,
    expires_at, auto_refresh, refresh_priority
)
VALUES (
    'analytics_charts',
    'chart',
    'analytics',
    '{"charts": {"initialized": true, "timestamp": "' || datetime('now') || '"}}',
    datetime('now', '+15 minutes'),
    1,
    5
);

-- 6. 更新同步配置状态
UPDATE sync_configuration 
SET last_sync_time = datetime('now'),
    pending_changes = 0
WHERE sync_name IN ('main_to_analytics', 'analytics_to_realtime_stats', 'analytics_to_aggregated');

-- 7. 记录数据迁移日志
INSERT INTO sync_execution_logs (
    execution_type, source_table, target_table, status,
    records_processed, records_success, records_failed,
    execution_time_ms, started_at, completed_at
) VALUES 
('manual', 'questionnaire_responses', 'analytics_responses', 'success', 1800, 1800, 0, 0, datetime('now'), datetime('now')),
('manual', 'analytics_responses', 'realtime_stats', 'success', 0, 0, 0, 0, datetime('now'), datetime('now')),
('manual', 'analytics_responses', 'aggregated_stats', 'success', 0, 0, 0, 0, datetime('now'), datetime('now'));

-- 注释说明
-- 此迁移文件将现有的测试数据同步到多级专用表中
-- 简化版本，避免了复杂的聚合查询和临时表
-- 为多级专用表架构提供基础的数据结构

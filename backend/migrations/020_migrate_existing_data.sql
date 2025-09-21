-- 迁移现有数据到多级专用表

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

-- 3. 处理多选字段 (JSON数组)
-- 求职渠道
UPDATE analytics_responses 
SET job_search_channels = (
    SELECT json_group_array(answer_value)
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'job-search-channels'
)
WHERE job_search_channels IS NULL;

-- 求职困难
UPDATE analytics_responses 
SET difficulties = (
    SELECT json_group_array(answer_value)
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'job-search-difficulties'
)
WHERE difficulties IS NULL;

-- 政策建议
UPDATE analytics_responses 
SET policy_suggestions = (
    SELECT json_group_array(answer_value)
    FROM questionnaire_answers 
    WHERE response_id = analytics_responses.id 
    AND question_id = 'policy-suggestions'
)
WHERE policy_suggestions IS NULL;

-- 4. 同步到admin_responses表
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

-- 5. 生成初始的实时统计数据
-- 年龄分布统计
INSERT OR REPLACE INTO realtime_stats (
    stat_key, stat_category, count_value, percentage_value, 
    time_window, window_start, window_end, total_sample_size,
    last_updated, data_source, confidence_level
)
SELECT 
    'age_distribution_' || age_range as stat_key,
    'demographics' as stat_category,
    COUNT(*) as count_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as total_sample_size,
    datetime('now') as last_updated,
    'analytics_responses' as data_source,
    1.0 as confidence_level
FROM analytics_responses 
WHERE is_test_data = 1 AND age_range IS NOT NULL
GROUP BY age_range;

-- 就业状态统计
INSERT OR REPLACE INTO realtime_stats (
    stat_key, stat_category, count_value, percentage_value, 
    time_window, window_start, window_end, total_sample_size,
    last_updated, data_source, confidence_level
)
SELECT 
    'employment_status_' || employment_status as stat_key,
    'employment' as stat_category,
    COUNT(*) as count_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as total_sample_size,
    datetime('now') as last_updated,
    'analytics_responses' as data_source,
    1.0 as confidence_level
FROM analytics_responses 
WHERE is_test_data = 1 AND employment_status IS NOT NULL
GROUP BY employment_status;

-- 教育水平统计
INSERT OR REPLACE INTO realtime_stats (
    stat_key, stat_category, count_value, percentage_value, 
    time_window, window_start, window_end, total_sample_size,
    last_updated, data_source, confidence_level
)
SELECT 
    'education_level_' || education_level as stat_key,
    'education' as stat_category,
    COUNT(*) as count_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as total_sample_size,
    datetime('now') as last_updated,
    'analytics_responses' as data_source,
    1.0 as confidence_level
FROM analytics_responses 
WHERE is_test_data = 1 AND education_level IS NOT NULL
GROUP BY education_level;

-- 性别分布统计
INSERT OR REPLACE INTO realtime_stats (
    stat_key, stat_category, count_value, percentage_value, 
    time_window, window_start, window_end, total_sample_size,
    last_updated, data_source, confidence_level
)
SELECT 
    'gender_distribution_' || gender as stat_key,
    'demographics' as stat_category,
    COUNT(*) as count_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as total_sample_size,
    datetime('now') as last_updated,
    'analytics_responses' as data_source,
    1.0 as confidence_level
FROM analytics_responses 
WHERE is_test_data = 1 AND gender IS NOT NULL
GROUP BY gender;

-- 6. 生成聚合统计数据
-- 日统计 - 年龄分布
INSERT OR REPLACE INTO aggregated_stats (
    dimension, dimension_value, count, percentage, 
    period_type, period_date, period_start, period_end,
    sample_size, last_calculated, rank_position
)
SELECT 
    'age' as dimension,
    age_range as dimension_value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as sample_size,
    datetime('now') as last_calculated,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position
FROM analytics_responses 
WHERE is_test_data = 1 AND age_range IS NOT NULL
GROUP BY age_range;

-- 日统计 - 就业状态
INSERT OR REPLACE INTO aggregated_stats (
    dimension, dimension_value, count, percentage, 
    period_type, period_date, period_start, period_end,
    sample_size, last_calculated, rank_position
)
SELECT 
    'employment' as dimension,
    employment_status as dimension_value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as sample_size,
    datetime('now') as last_calculated,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position
FROM analytics_responses 
WHERE is_test_data = 1 AND employment_status IS NOT NULL
GROUP BY employment_status;

-- 日统计 - 教育水平
INSERT OR REPLACE INTO aggregated_stats (
    dimension, dimension_value, count, percentage, 
    period_type, period_date, period_start, period_end,
    sample_size, last_calculated, rank_position
)
SELECT 
    'education' as dimension,
    education_level as dimension_value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1) as sample_size,
    datetime('now') as last_calculated,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position
FROM analytics_responses 
WHERE is_test_data = 1 AND education_level IS NOT NULL
GROUP BY education_level;

-- 7. 生成初始的仪表板缓存
INSERT OR REPLACE INTO dashboard_cache (
    cache_key, dashboard_type, widget_data, 
    expires_at, refresh_interval, source_tables
)
SELECT 
    'main_dashboard' as cache_key,
    'public' as dashboard_type,
    json_object(
        'totalResponses', (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1),
        'todayResponses', (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1 AND date(submitted_at) = date('now')),
        'topEmploymentStatus', (
            SELECT employment_status 
            FROM analytics_responses 
            WHERE is_test_data = 1 AND employment_status IS NOT NULL
            GROUP BY employment_status 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'ageDistribution', (
            SELECT json_group_array(
                json_object('age_range', age_range, 'count', COUNT(*))
            )
            FROM analytics_responses 
            WHERE is_test_data = 1 AND age_range IS NOT NULL
            GROUP BY age_range
        )
    ) as widget_data,
    datetime('now', '+10 minutes') as expires_at,
    600 as refresh_interval,
    '["analytics_responses", "realtime_stats"]' as source_tables;

-- 8. 生成初始的可视化缓存
INSERT OR REPLACE INTO enhanced_visualization_cache (
    cache_key, visualization_type, page_context, chart_data,
    expires_at, auto_refresh, refresh_priority
)
SELECT 
    'analytics_charts' as cache_key,
    'chart' as visualization_type,
    'analytics' as page_context,
    json_object(
        'charts', json_object(
            'ageDistribution', (
                SELECT json_group_array(
                    json_object('name', age_range, 'value', COUNT(*))
                )
                FROM analytics_responses 
                WHERE is_test_data = 1 AND age_range IS NOT NULL
                GROUP BY age_range
            ),
            'employmentStatus', (
                SELECT json_group_array(
                    json_object('name', employment_status, 'value', COUNT(*))
                )
                FROM analytics_responses 
                WHERE is_test_data = 1 AND employment_status IS NOT NULL
                GROUP BY employment_status
            ),
            'educationLevel', (
                SELECT json_group_array(
                    json_object('name', education_level, 'value', COUNT(*))
                )
                FROM analytics_responses 
                WHERE is_test_data = 1 AND education_level IS NOT NULL
                GROUP BY education_level
            )
        )
    ) as chart_data,
    datetime('now', '+15 minutes') as expires_at,
    1 as auto_refresh,
    5 as refresh_priority;

-- 9. 更新同步配置状态
UPDATE sync_configuration 
SET last_sync_time = datetime('now'),
    pending_changes = 0
WHERE sync_name IN ('main_to_analytics', 'analytics_to_realtime_stats', 'analytics_to_aggregated');

-- 10. 记录数据迁移日志
INSERT INTO sync_execution_logs (
    execution_type, source_table, target_table, status,
    records_processed, records_success, records_failed,
    execution_time_ms, started_at, completed_at
) VALUES 
('manual', 'questionnaire_responses', 'analytics_responses', 'success', 
 (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 
 (SELECT COUNT(*) FROM analytics_responses WHERE is_test_data = 1), 
 0, 0, datetime('now'), datetime('now')),
('manual', 'analytics_responses', 'realtime_stats', 'success',
 (SELECT COUNT(*) FROM realtime_stats), 
 (SELECT COUNT(*) FROM realtime_stats), 
 0, 0, datetime('now'), datetime('now')),
('manual', 'analytics_responses', 'aggregated_stats', 'success',
 (SELECT COUNT(*) FROM aggregated_stats), 
 (SELECT COUNT(*) FROM aggregated_stats), 
 0, 0, datetime('now'), datetime('now'));

-- 注释说明
-- 此迁移文件将现有的测试数据同步到多级专用表中
-- 包括analytics_responses、admin_responses、realtime_stats、aggregated_stats
-- 以及dashboard_cache和enhanced_visualization_cache的初始数据
-- 为多级专用表架构提供完整的数据基础

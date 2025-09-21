-- 生成统计数据脚本

-- 1. 生成实时统计数据
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    1800 as total_sample_size,
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    1800 as total_sample_size,
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    1800 as total_sample_size,
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage_value,
    '5min' as time_window,
    datetime('now', '-5 minutes') as window_start,
    datetime('now') as window_end,
    1800 as total_sample_size,
    datetime('now') as last_updated,
    'analytics_responses' as data_source,
    1.0 as confidence_level
FROM analytics_responses 
WHERE is_test_data = 1 AND gender IS NOT NULL
GROUP BY gender;

-- 2. 生成聚合统计数据
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    1800 as sample_size,
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    1800 as sample_size,
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
    ROUND(COUNT(*) * 100.0 / 1800, 2) as percentage,
    'daily' as period_type,
    date('now') as period_date,
    date('now') || ' 00:00:00' as period_start,
    date('now') || ' 23:59:59' as period_end,
    1800 as sample_size,
    datetime('now') as last_calculated,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank_position
FROM analytics_responses 
WHERE is_test_data = 1 AND education_level IS NOT NULL
GROUP BY education_level;

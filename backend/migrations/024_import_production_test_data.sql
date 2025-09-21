-- 生产环境测试数据导入
-- 为性能测试提供足够的数据量

-- 1. 插入测试用户
INSERT OR IGNORE INTO universal_users (id, uuid, user_type, username, display_name, role, status, created_at) VALUES
(1, 'user-001', 'semi_anonymous', 'test_user_001', '张三', 'user', 'active', '2024-01-15 10:00:00'),
(2, 'user-002', 'semi_anonymous', 'test_user_002', '李四', 'user', 'active', '2024-01-16 11:00:00'),
(3, 'user-003', 'semi_anonymous', 'test_user_003', '王五', 'user', 'active', '2024-01-17 12:00:00'),
(4, 'user-004', 'anonymous', NULL, '匿名用户A', 'user', 'active', '2024-01-18 13:00:00'),
(5, 'user-005', 'anonymous', NULL, '匿名用户B', 'user', 'active', '2024-01-19 14:00:00');

-- 2. 插入问卷响应数据到主表
INSERT OR IGNORE INTO universal_questionnaire_responses (
    id, questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent, created_at, updated_at
) VALUES
(1, 'employment-survey-2024', 1, '{"age":"23","gender":"male","education":"bachelor","major":"computer-science","employment_status":"employed","salary":"8000-12000","location":"beijing","job_satisfaction":"4"}', '2024-01-15 15:00:00', '192.168.1.1', 'Mozilla/5.0', '2024-01-15 15:00:00', '2024-01-15 15:00:00'),
(2, 'employment-survey-2024', 2, '{"age":"24","gender":"female","education":"master","major":"software-engineering","employment_status":"employed","salary":"12000-18000","location":"shanghai","job_satisfaction":"5"}', '2024-01-16 16:00:00', '192.168.1.2', 'Mozilla/5.0', '2024-01-16 16:00:00', '2024-01-16 16:00:00'),
(3, 'employment-survey-2024', 3, '{"age":"22","gender":"male","education":"bachelor","major":"data-science","employment_status":"unemployed","salary":"","location":"guangzhou","job_satisfaction":"3"}', '2024-01-17 17:00:00', '192.168.1.3', 'Mozilla/5.0', '2024-01-17 17:00:00', '2024-01-17 17:00:00'),
(4, 'employment-survey-2024', 4, '{"age":"25","gender":"female","education":"master","major":"artificial-intelligence","employment_status":"employed","salary":"15000-20000","location":"shenzhen","job_satisfaction":"4"}', '2024-01-18 18:00:00', '192.168.1.4', 'Mozilla/5.0', '2024-01-18 18:00:00', '2024-01-18 18:00:00'),
(5, 'employment-survey-2024', 5, '{"age":"23","gender":"male","education":"bachelor","major":"electronics","employment_status":"student","salary":"","location":"hangzhou","job_satisfaction":"4"}', '2024-01-19 19:00:00', '192.168.1.5', 'Mozilla/5.0', '2024-01-19 19:00:00', '2024-01-19 19:00:00');

-- 3. 同步数据到analytics_responses表
INSERT OR IGNORE INTO analytics_responses (
    id, questionnaire_id, user_id, age_range, education_level, employment_status, 
    gender, major_category, salary_range, location, is_test_data, created_at
) VALUES
(1, 'employment-survey-2024', 1, '23-25', 'bachelor', 'employed', 'male', 'computer-science', '8000-12000', 'beijing', 1, '2024-01-15 15:00:00'),
(2, 'employment-survey-2024', 2, '23-25', 'master', 'employed', 'female', 'software-engineering', '12000-18000', 'shanghai', 1, '2024-01-16 16:00:00'),
(3, 'employment-survey-2024', 3, '18-22', 'bachelor', 'unemployed', 'male', 'data-science', '', 'guangzhou', 1, '2024-01-17 17:00:00'),
(4, 'employment-survey-2024', 4, '23-25', 'master', 'employed', 'female', 'artificial-intelligence', '15000-20000', 'shenzhen', 1, '2024-01-18 18:00:00'),
(5, 'employment-survey-2024', 5, '23-25', 'bachelor', 'student', 'male', 'electronics', '', 'hangzhou', 1, '2024-01-19 19:00:00');

-- 4. 生成实时统计数据
INSERT OR IGNORE INTO realtime_stats (
    id, stat_key, stat_category, count_value, percentage_value, time_window, last_updated
) VALUES
(1, 'employed', 'employment', 3, 60.0, '5min', datetime('now')),
(2, 'unemployed', 'employment', 1, 20.0, '5min', datetime('now')),
(3, 'student', 'employment', 1, 20.0, '5min', datetime('now')),
(4, 'male', 'gender', 3, 60.0, '5min', datetime('now')),
(5, 'female', 'gender', 2, 40.0, '5min', datetime('now')),
(6, '18-22', 'age', 1, 20.0, '5min', datetime('now')),
(7, '23-25', 'age', 4, 80.0, '5min', datetime('now')),
(8, 'bachelor', 'education', 3, 60.0, '5min', datetime('now')),
(9, 'master', 'education', 2, 40.0, '5min', datetime('now'));

-- 5. 生成聚合统计数据
INSERT OR IGNORE INTO aggregated_stats (
    id, aggregation_type, dimension, metric_name, metric_value, period, calculated_at
) VALUES
(1, 'employment_overview', 'total', 'total_responses', 5, 'daily', datetime('now')),
(2, 'employment_overview', 'employed', 'employment_rate', 60.0, 'daily', datetime('now')),
(3, 'education_analysis', 'bachelor', 'bachelor_percentage', 60.0, 'daily', datetime('now')),
(4, 'education_analysis', 'master', 'master_percentage', 40.0, 'daily', datetime('now')),
(5, 'gender_distribution', 'male', 'male_percentage', 60.0, 'daily', datetime('now')),
(6, 'gender_distribution', 'female', 'female_percentage', 40.0, 'daily', datetime('now'));

-- 6. 生成仪表板缓存
INSERT OR IGNORE INTO dashboard_cache (
    id, cache_key, widget_type, widget_data, expires_at, updated_at
) VALUES
(1, 'employment_overview_widget', 'pie_chart', '{"data":[{"name":"employed","value":3,"percentage":60},{"name":"unemployed","value":1,"percentage":20},{"name":"student","value":1,"percentage":20}]}', datetime('now', '+1 hour'), datetime('now')),
(2, 'gender_distribution_widget', 'pie_chart', '{"data":[{"name":"male","value":3,"percentage":60},{"name":"female","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now')),
(3, 'education_level_widget', 'bar_chart', '{"data":[{"name":"bachelor","value":3,"percentage":60},{"name":"master","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now'));

-- 7. 生成可视化缓存
INSERT OR IGNORE INTO enhanced_visualization_cache (
    id, cache_key, visualization_type, page_context, chart_data, expires_at, updated_at
) VALUES
(1, 'employment_survey_2024_overview', 'employment_overview', 'analytics_page', '{"ageDistribution":[{"name":"18-22","value":1,"percentage":20},{"name":"23-25","value":4,"percentage":80}],"employmentStatus":[{"name":"employed","value":3,"percentage":60},{"name":"unemployed","value":1,"percentage":20},{"name":"student","value":1,"percentage":20}],"educationLevel":[{"name":"bachelor","value":3,"percentage":60},{"name":"master","value":2,"percentage":40}],"genderDistribution":[{"name":"male","value":3,"percentage":60},{"name":"female","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now'));

-- 8. 插入同步配置
INSERT OR IGNORE INTO sync_configuration (
    id, sync_name, source_table, target_table, frequency_minutes, last_sync, is_active, description
) VALUES
(1, 'main_to_analytics', 'universal_questionnaire_responses', 'analytics_responses', 0, datetime('now'), 1, '主表到分析表的实时同步'),
(2, 'analytics_to_realtime', 'analytics_responses', 'realtime_stats', 5, datetime('now'), 1, '分析表到实时统计的5分钟同步'),
(3, 'realtime_to_aggregated', 'realtime_stats', 'aggregated_stats', 10, datetime('now'), 1, '实时统计到聚合统计的10分钟同步'),
(4, 'aggregated_to_dashboard', 'aggregated_stats', 'dashboard_cache', 15, datetime('now'), 1, '聚合统计到仪表板缓存的15分钟同步'),
(5, 'dashboard_to_visualization', 'dashboard_cache', 'enhanced_visualization_cache', 15, datetime('now'), 1, '仪表板到可视化缓存的15分钟同步');

-- 9. 插入性能监控基础数据
INSERT OR IGNORE INTO performance_metrics (
    id, endpoint, response_time, cache_hit, data_source, error_count, timestamp
) VALUES
(1, '/api/universal-questionnaire/statistics/employment-survey-2024', 200, 1, 'multi_tier_cache', 0, datetime('now')),
(2, '/api/universal-questionnaire/statistics/employment-survey-2024', 180, 1, 'realtime_stats', 0, datetime('now', '-5 minutes')),
(3, '/api/universal-questionnaire/statistics/employment-survey-2024', 220, 1, 'aggregated_stats', 0, datetime('now', '-10 minutes'));

-- 10. 插入Cron任务配置
INSERT OR IGNORE INTO cron_configuration (
    id, cron_pattern, task_name, description, is_active, created_at
) VALUES
(1, '*/5 * * * *', 'analytics_to_realtime_sync', '每5分钟同步分析数据到实时统计', 1, datetime('now')),
(2, '*/10 * * * *', 'realtime_to_aggregated_sync', '每10分钟同步实时统计到聚合数据', 1, datetime('now')),
(3, '*/15 * * * *', 'dashboard_cache_refresh', '每15分钟刷新仪表板缓存', 1, datetime('now')),
(4, '*/30 * * * *', 'performance_metrics_cleanup', '每30分钟清理性能指标', 1, datetime('now')),
(5, '0 * * * *', 'hourly_data_quality_check', '每小时数据质量检查', 1, datetime('now'));

-- 11. 插入Cron执行日志
INSERT OR IGNORE INTO cron_execution_log (
    id, cron_pattern, status, execution_time_ms, executed_at, details
) VALUES
(1, '*/5 * * * *', 'success', 150, datetime('now'), '{"records_processed": 5, "sync_type": "analytics_to_realtime"}'),
(2, '*/10 * * * *', 'success', 200, datetime('now', '-5 minutes'), '{"records_processed": 9, "sync_type": "realtime_to_aggregated"}'),
(3, '*/15 * * * *', 'success', 100, datetime('now', '-10 minutes'), '{"cache_entries_updated": 3, "sync_type": "dashboard_refresh"}');

-- 12. 更新同步状态
UPDATE sync_configuration SET last_sync = datetime('now') WHERE id IN (1, 2, 3, 4, 5);

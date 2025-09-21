-- 简化的测试数据导入，适配线上数据库结构

-- 1. 插入测试用户（适配现有表结构）
INSERT OR IGNORE INTO universal_users (uuid, user_type, username, display_name, role, status) VALUES
('user-001', 'semi_anonymous', 'test_user_001', '张三', 'user', 'active'),
('user-002', 'semi_anonymous', 'test_user_002', '李四', 'user', 'active'),
('user-003', 'semi_anonymous', 'test_user_003', '王五', 'user', 'active'),
('user-004', 'anonymous', NULL, '匿名用户A', 'user', 'active'),
('user-005', 'anonymous', NULL, '匿名用户B', 'user', 'active');

-- 2. 插入问卷响应数据到主表（适配现有表结构）
INSERT OR IGNORE INTO universal_questionnaire_responses (
    questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent
) VALUES
('employment-survey-2024', 1, '{"age":"23","gender":"male","education":"bachelor","major":"computer-science","employment_status":"employed","salary":"8000-12000","location":"beijing","job_satisfaction":"4"}', '2024-01-15 15:00:00', '192.168.1.1', 'Mozilla/5.0'),
('employment-survey-2024', 2, '{"age":"24","gender":"female","education":"master","major":"software-engineering","employment_status":"employed","salary":"12000-18000","location":"shanghai","job_satisfaction":"5"}', '2024-01-16 16:00:00', '192.168.1.2', 'Mozilla/5.0'),
('employment-survey-2024', 3, '{"age":"22","gender":"male","education":"bachelor","major":"data-science","employment_status":"unemployed","salary":"","location":"guangzhou","job_satisfaction":"3"}', '2024-01-17 17:00:00', '192.168.1.3', 'Mozilla/5.0'),
('employment-survey-2024', 4, '{"age":"25","gender":"female","education":"master","major":"artificial-intelligence","employment_status":"employed","salary":"15000-20000","location":"shenzhen","job_satisfaction":"4"}', '2024-01-18 18:00:00', '192.168.1.4', 'Mozilla/5.0'),
('employment-survey-2024', 5, '{"age":"23","gender":"male","education":"bachelor","major":"electronics","employment_status":"student","salary":"","location":"hangzhou","job_satisfaction":"4"}', '2024-01-19 19:00:00', '192.168.1.5', 'Mozilla/5.0');

-- 3. 同步数据到analytics_responses表
INSERT OR IGNORE INTO analytics_responses (
    questionnaire_id, user_id, age_range, education_level, employment_status, 
    gender, major_category, salary_range, location, is_test_data
) VALUES
('employment-survey-2024', 1, '23-25', 'bachelor', 'employed', 'male', 'computer-science', '8000-12000', 'beijing', 1),
('employment-survey-2024', 2, '23-25', 'master', 'employed', 'female', 'software-engineering', '12000-18000', 'shanghai', 1),
('employment-survey-2024', 3, '18-22', 'bachelor', 'unemployed', 'male', 'data-science', '', 'guangzhou', 1),
('employment-survey-2024', 4, '23-25', 'master', 'employed', 'female', 'artificial-intelligence', '15000-20000', 'shenzhen', 1),
('employment-survey-2024', 5, '23-25', 'bachelor', 'student', 'male', 'electronics', '', 'hangzhou', 1);

-- 4. 生成实时统计数据
INSERT OR IGNORE INTO realtime_stats (
    stat_key, stat_category, count_value, percentage_value, time_window, last_updated
) VALUES
('employed', 'employment', 3, 60.0, '5min', datetime('now')),
('unemployed', 'employment', 1, 20.0, '5min', datetime('now')),
('student', 'employment', 1, 20.0, '5min', datetime('now')),
('male', 'gender', 3, 60.0, '5min', datetime('now')),
('female', 'gender', 2, 40.0, '5min', datetime('now')),
('18-22', 'age', 1, 20.0, '5min', datetime('now')),
('23-25', 'age', 4, 80.0, '5min', datetime('now')),
('bachelor', 'education', 3, 60.0, '5min', datetime('now')),
('master', 'education', 2, 40.0, '5min', datetime('now'));

-- 5. 生成聚合统计数据
INSERT OR IGNORE INTO aggregated_stats (
    aggregation_type, dimension, metric_name, metric_value, period, calculated_at
) VALUES
('employment_overview', 'total', 'total_responses', 5, 'daily', datetime('now')),
('employment_overview', 'employed', 'employment_rate', 60.0, 'daily', datetime('now')),
('education_analysis', 'bachelor', 'bachelor_percentage', 60.0, 'daily', datetime('now')),
('education_analysis', 'master', 'master_percentage', 40.0, 'daily', datetime('now')),
('gender_distribution', 'male', 'male_percentage', 60.0, 'daily', datetime('now')),
('gender_distribution', 'female', 'female_percentage', 40.0, 'daily', datetime('now'));

-- 6. 生成仪表板缓存
INSERT OR IGNORE INTO dashboard_cache (
    cache_key, widget_type, widget_data, expires_at, updated_at
) VALUES
('employment_overview_widget', 'pie_chart', '{"data":[{"name":"employed","value":3,"percentage":60},{"name":"unemployed","value":1,"percentage":20},{"name":"student","value":1,"percentage":20}]}', datetime('now', '+1 hour'), datetime('now')),
('gender_distribution_widget', 'pie_chart', '{"data":[{"name":"male","value":3,"percentage":60},{"name":"female","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now')),
('education_level_widget', 'bar_chart', '{"data":[{"name":"bachelor","value":3,"percentage":60},{"name":"master","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now'));

-- 7. 生成可视化缓存
INSERT OR IGNORE INTO enhanced_visualization_cache (
    cache_key, visualization_type, page_context, chart_data, expires_at, updated_at
) VALUES
('employment_survey_2024_overview', 'employment_overview', 'analytics_page', '{"ageDistribution":[{"name":"18-22","value":1,"percentage":20},{"name":"23-25","value":4,"percentage":80}],"employmentStatus":[{"name":"employed","value":3,"percentage":60},{"name":"unemployed","value":1,"percentage":20},{"name":"student","value":1,"percentage":20}],"educationLevel":[{"name":"bachelor","value":3,"percentage":60},{"name":"master","value":2,"percentage":40}],"genderDistribution":[{"name":"male","value":3,"percentage":60},{"name":"female","value":2,"percentage":40}]}', datetime('now', '+1 hour'), datetime('now'));

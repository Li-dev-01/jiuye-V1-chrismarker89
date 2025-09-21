
-- 📝 标准化测试数据
-- 严格按照外键约束顺序插入

-- 1. 插入用户数据（主表）
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES
  ('std-user-001', 'stduser001', 'std001@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-002', 'stduser002', 'std002@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-003', 'stduser003', 'std003@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-004', 'stduser004', 'std004@example.com', 'hash123', 'user', datetime('now'), datetime('now')),
  ('std-user-005', 'stduser005', 'std005@example.com', 'hash123', 'user', datetime('now'), datetime('now'));

-- 2. 插入问卷数据（依赖用户表）
INSERT OR IGNORE INTO universal_questionnaire_responses 
(questionnaire_id, user_id, response_data, submitted_at, ip_address, user_agent, created_at, updated_at) VALUES
  ('employment-survey-2024', 'std-user-001', '{"age_range":"23-25","gender":"male","education_level":"bachelor","employment_status":"employed","work_location":"beijing","salary_range":"12000-18000","industry":"technology","test_user_identifier":"std-user-001"}', datetime('now'), '192.168.1.1', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-002', '{"age_range":"26-30","gender":"female","education_level":"master","employment_status":"employed","work_location":"shanghai","salary_range":"18000-25000","industry":"finance","test_user_identifier":"std-user-002"}', datetime('now'), '192.168.1.2', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-003', '{"age_range":"18-22","gender":"male","education_level":"bachelor","employment_status":"student","work_location":"guangzhou","salary_range":"","industry":"","test_user_identifier":"std-user-003"}', datetime('now'), '192.168.1.3', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-004', '{"age_range":"23-25","gender":"female","education_level":"bachelor","employment_status":"unemployed","work_location":"shenzhen","salary_range":"","industry":"","test_user_identifier":"std-user-004"}', datetime('now'), '192.168.1.4', 'Test Browser', datetime('now'), datetime('now')),
  ('employment-survey-2024', 'std-user-005', '{"age_range":"26-30","gender":"male","education_level":"master","employment_status":"employed","work_location":"hangzhou","salary_range":"25000-35000","industry":"technology","test_user_identifier":"std-user-005"}', datetime('now'), '192.168.1.5', 'Test Browser', datetime('now'), datetime('now'));

-- 3. 插入分析数据（依赖用户表，外键约束）
INSERT OR IGNORE INTO analytics_responses 
(id, user_id, submitted_at, age_range, education_level, employment_status, salary_range, work_location, industry, gender, job_search_channels, difficulties, skills, policy_suggestions, salary_expectation, work_experience_months, job_search_duration_months, data_quality_score, is_complete, processing_version, is_test_data, created_at, updated_at) VALUES
  ('std-analytics-001', 'std-user-001', datetime('now'), '23-25', 'bachelor', 'employed', '12000-18000', 'beijing', 'technology', 'male', 'online_platforms', 'lack_experience', 'programming', 'more_internships', 15000, 24, 3, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-002', 'std-user-002', datetime('now'), '26-30', 'master', 'employed', '18000-25000', 'shanghai', 'finance', 'female', 'referrals', 'high_competition', 'communication', 'skill_training', 22000, 36, 2, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-003', 'std-user-003', datetime('now'), '18-22', 'bachelor', 'student', NULL, 'guangzhou', NULL, 'male', 'campus_recruitment', 'lack_experience', 'programming', 'more_internships', 8000, 0, 0, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-004', 'std-user-004', datetime('now'), '23-25', 'bachelor', 'unemployed', NULL, 'shenzhen', NULL, 'female', 'online_platforms', 'skill_mismatch', 'communication', 'skill_training', 10000, 12, 8, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now')),
  ('std-analytics-005', 'std-user-005', datetime('now'), '26-30', 'master', 'employed', '25000-35000', 'hangzhou', 'technology', 'male', 'direct_application', 'location_constraints', 'project_management', 'career_guidance', 30000, 48, 1, 1.0, 1, 'v1.0', 1, datetime('now'), datetime('now'));

-- 4. 验证插入结果
SELECT 'Standardized test data inserted' as status;
SELECT 'users' as table_name, COUNT(*) as count FROM users WHERE id LIKE 'std-%'
UNION ALL
SELECT 'questionnaires', COUNT(*) FROM universal_questionnaire_responses WHERE response_data LIKE '%std-user-%'
UNION ALL
SELECT 'analytics', COUNT(*) FROM analytics_responses WHERE user_id LIKE 'std-%';

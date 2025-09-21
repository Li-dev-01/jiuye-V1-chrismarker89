
-- 🧹 数据清理脚本

-- 1. 清理所有测试数据
DELETE FROM analytics_responses WHERE is_test_data = 1;
DELETE FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'employment-survey-2024' 
  AND (user_id IS NULL OR response_data LIKE '%test_user_identifier%');
DELETE FROM users WHERE id LIKE 'test-%';

-- 2. 重置自增ID（如果需要）
-- SQLite不支持重置自增，但可以清理后重新开始

-- 3. 验证清理结果
SELECT 'users after cleanup' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'universal_questionnaire_responses after cleanup', COUNT(*) FROM universal_questionnaire_responses
UNION ALL
SELECT 'analytics_responses after cleanup', COUNT(*) FROM analytics_responses;

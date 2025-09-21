-- 清理现有测试数据
DELETE FROM questionnaire_answers WHERE is_test_data = 1;
DELETE FROM questionnaire_responses WHERE is_test_data = 1;
DELETE FROM users WHERE is_test_data = 1;

-- 重置自增ID (如果需要)
-- DELETE FROM sqlite_sequence WHERE name IN ('users', 'questionnaire_responses', 'questionnaire_answers');
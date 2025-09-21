-- 清理现有测试数据
DELETE FROM analytics_responses WHERE is_test_data = 1;
DELETE FROM universal_questionnaire_responses WHERE questionnaire_id = 'employment-survey-2024' AND user_id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';

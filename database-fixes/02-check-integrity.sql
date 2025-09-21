
-- 📊 数据完整性检查脚本

-- 1. 检查所有表的记录数
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'universal_questionnaire_responses', COUNT(*) FROM universal_questionnaire_responses
UNION ALL
SELECT 'analytics_responses', COUNT(*) FROM analytics_responses;

-- 2. 检查外键完整性
-- analytics_responses -> users
SELECT 
  'analytics_responses -> users' as relationship,
  COUNT(*) as total_records,
  COUNT(u.id) as valid_references,
  COUNT(*) - COUNT(u.id) as orphan_records
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id;

-- universal_questionnaire_responses -> users (允许NULL)
SELECT 
  'universal_questionnaire_responses -> users' as relationship,
  COUNT(*) as total_records,
  COUNT(uqr.user_id) as non_null_user_ids,
  COUNT(u.id) as valid_references,
  COUNT(uqr.user_id) - COUNT(u.id) as orphan_records
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON uqr.user_id = u.id;

-- 3. 检查数据类型一致性
PRAGMA table_info(users);
PRAGMA table_info(analytics_responses);
PRAGMA table_info(universal_questionnaire_responses);

-- 4. 检查外键约束定义
PRAGMA foreign_key_list(analytics_responses);
PRAGMA foreign_key_list(universal_questionnaire_responses);

-- 5. 检查测试数据标识
SELECT 
  'Test data in analytics_responses' as description,
  COUNT(*) as count
FROM analytics_responses 
WHERE is_test_data = 1;

SELECT 
  'Test data in universal_questionnaire_responses' as description,
  COUNT(*) as count
FROM universal_questionnaire_responses 
WHERE response_data LIKE '%test_user_identifier%';

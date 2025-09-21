
-- 🔧 外键约束修复脚本
-- 解决类型不匹配和约束问题

-- 1. 检查当前外键约束状态
PRAGMA foreign_key_list(analytics_responses);
PRAGMA foreign_key_list(universal_questionnaire_responses);

-- 2. 暂时禁用外键约束（仅在修复期间）
PRAGMA foreign_keys = OFF;

-- 3. 创建临时表来重建analytics_responses（如果需要修改结构）
-- 注意：SQLite不支持直接修改外键，需要重建表

-- 4. 数据完整性检查
-- 检查analytics_responses中的孤儿记录
SELECT 
  'analytics_responses orphans' as table_name,
  COUNT(*) as orphan_count
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE u.id IS NULL;

-- 检查universal_questionnaire_responses中的孤儿记录
SELECT 
  'universal_questionnaire_responses orphans' as table_name,
  COUNT(*) as orphan_count
FROM universal_questionnaire_responses uqr
LEFT JOIN users u ON uqr.user_id = u.id
WHERE uqr.user_id IS NOT NULL AND u.id IS NULL;

-- 5. 清理孤儿数据（如果存在）
-- 删除analytics_responses中的孤儿记录
DELETE FROM analytics_responses 
WHERE user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL);

-- 6. 重新启用外键约束
PRAGMA foreign_keys = ON;

-- 7. 验证修复结果
-- 再次检查孤儿记录
SELECT 
  'analytics_responses orphans after fix' as table_name,
  COUNT(*) as orphan_count
FROM analytics_responses ar
LEFT JOIN users u ON ar.user_id = u.id
WHERE u.id IS NULL;

-- 8. 测试外键约束是否正常工作
-- 尝试插入一条无效的外键记录（应该失败）
-- INSERT INTO analytics_responses (id, user_id, is_test_data) 
-- VALUES ('test-constraint', 'non-existent-user', 1);

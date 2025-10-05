-- 清空问卷2的旧测试数据
-- 执行前请确认这是测试环境

-- 1. 删除旧的问卷2数据
DELETE FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';

-- 2. 验证删除结果
SELECT COUNT(*) as remaining_count 
FROM universal_questionnaire_responses 
WHERE questionnaire_id = 'questionnaire-v2-2024';
-- 应返回: 0

-- 3. 清空统计表（可选）
DELETE FROM q2_basic_stats;
DELETE FROM q2_economic_analysis;
DELETE FROM q2_discrimination_analysis;

-- 完成！现在可以导入新数据了


-- 清除测试举报数据脚本
-- 用于清除信誉管理功能的测试数据，确保API返回真实数据

-- 1. 清除测试用户的信誉记录
-- 删除用户ID 1-10 的信誉记录（这些通常是测试用户）
DELETE FROM reporter_reputation 
WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

-- 2. 清除测试举报记录
-- 删除涉及测试用户的举报记录
DELETE FROM user_reports 
WHERE reporter_user_id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
   OR reported_user_id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

-- 3. 清除测试操作日志
-- 删除相关的操作日志记录
DELETE FROM report_action_logs 
WHERE report_id NOT IN (SELECT id FROM user_reports);

-- 4. 清除测试审核队列
-- 删除相关的审核队列记录
DELETE FROM report_review_queue 
WHERE report_id NOT IN (SELECT id FROM user_reports);

-- 5. 清除测试内容审核免疫记录
-- 删除测试内容的审核免疫记录
DELETE FROM content_review_immunity 
WHERE content_type = 'story' AND content_id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

-- 6. 重置自增ID（可选）
-- 如果需要重置表的自增ID，可以执行以下语句
-- DELETE FROM sqlite_sequence WHERE name IN ('user_reports', 'reporter_reputation', 'report_action_logs', 'report_review_queue');

-- 验证清除结果
-- 查询剩余的记录数量
SELECT 'reporter_reputation' as table_name, COUNT(*) as remaining_records FROM reporter_reputation
UNION ALL
SELECT 'user_reports' as table_name, COUNT(*) as remaining_records FROM user_reports
UNION ALL
SELECT 'report_action_logs' as table_name, COUNT(*) as remaining_records FROM report_action_logs
UNION ALL
SELECT 'report_review_queue' as table_name, COUNT(*) as remaining_records FROM report_review_queue
UNION ALL
SELECT 'content_review_immunity' as table_name, COUNT(*) as remaining_records FROM content_review_immunity;

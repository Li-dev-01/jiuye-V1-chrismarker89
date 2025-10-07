-- 验证举报数据清除效果
-- 检查各个表的数据状态

-- 1. 检查信誉记录表
SELECT 'reporter_reputation' as table_name, COUNT(*) as total_records FROM reporter_reputation;

-- 2. 检查举报记录表
SELECT 'user_reports' as table_name, COUNT(*) as total_records FROM user_reports;

-- 3. 检查操作日志表
SELECT 'report_action_logs' as table_name, COUNT(*) as total_records FROM report_action_logs;

-- 4. 检查审核队列表
SELECT 'report_review_queue' as table_name, COUNT(*) as total_records FROM report_review_queue;

-- 5. 检查内容审核免疫表
SELECT 'content_review_immunity' as table_name, COUNT(*) as total_records FROM content_review_immunity;

-- 6. 如果有剩余数据，显示详细信息
SELECT 'Remaining reporter_reputation records:' as info;
SELECT * FROM reporter_reputation LIMIT 10;

SELECT 'Remaining user_reports records:' as info;
SELECT * FROM user_reports LIMIT 10;

-- 7. 检查表结构是否完整
SELECT 'Table structure verification:' as info;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%report%' OR name LIKE '%reputation%';

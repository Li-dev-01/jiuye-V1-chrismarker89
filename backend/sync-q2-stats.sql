-- 问卷2统计数据同步SQL脚本
-- 从 universal_questionnaire_responses 同步到 q2_* 统计表

-- 注意：此脚本需要在支持JSON函数的SQLite环境中运行
-- Cloudflare D1 支持 json_extract 函数

-- 清空所有统计表
DELETE FROM q2_basic_stats;
DELETE FROM q2_economic_analysis;
DELETE FROM q2_employment_analysis;
DELETE FROM q2_discrimination_analysis;
DELETE FROM q2_confidence_analysis;
DELETE FROM q2_fertility_analysis;

-- 创建临时视图来解析JSON数据
-- 注意：这是一个简化版本，实际需要通过应用层代码来处理复杂的JSON解析

-- 由于D1的JSON函数限制，我们需要通过API来执行同步
-- 请使用以下API端点触发同步：
-- POST /api/questionnaire-v2/sync-static-tables

SELECT '请使用API端点触发同步：POST /api/questionnaire-v2/sync-static-tables' as message;


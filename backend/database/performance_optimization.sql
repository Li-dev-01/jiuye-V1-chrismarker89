-- 数据库性能优化脚本
-- 为可视化查询添加必要的索引

-- 问卷响应表的性能优化索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_id_completed 
ON universal_questionnaire_responses(questionnaire_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_submitted 
ON universal_questionnaire_responses(submitted_at) 
WHERE submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_completed_submitted 
ON universal_questionnaire_responses(is_completed, submitted_at) 
WHERE is_completed = 1 AND submitted_at IS NOT NULL;

-- 心声表的索引优化
CREATE INDEX IF NOT EXISTS idx_heart_voices_status 
ON heart_voices(status);

CREATE INDEX IF NOT EXISTS idx_heart_voices_created 
ON heart_voices(created_at);

-- 故事表的索引优化
CREATE INDEX IF NOT EXISTS idx_stories_status 
ON stories(status);

CREATE INDEX IF NOT EXISTS idx_stories_created 
ON stories(created_at);

-- 复合索引用于常见查询模式
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_composite 
ON universal_questionnaire_responses(questionnaire_id, is_completed, submitted_at);

-- 分析查询优化视图
CREATE VIEW IF NOT EXISTS v_completed_questionnaires AS
SELECT 
  id,
  questionnaire_id,
  responses,
  submitted_at,
  created_at
FROM universal_questionnaire_responses
WHERE is_completed = 1 
  AND submitted_at IS NOT NULL
  AND questionnaire_id = 'employment-survey-2024';

-- 实时统计视图
CREATE VIEW IF NOT EXISTS v_realtime_stats AS
SELECT 
  'questionnaire_responses' as stat_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_count,
  MAX(submitted_at) as last_submission
FROM universal_questionnaire_responses
WHERE questionnaire_id = 'employment-survey-2024'
UNION ALL
SELECT 
  'heart_voices' as stat_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  MAX(created_at) as last_created
FROM heart_voices
UNION ALL
SELECT 
  'stories' as stat_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  MAX(created_at) as last_created
FROM stories;

-- 预聚合表用于常用统计
CREATE TABLE IF NOT EXISTS daily_stats_cache (
  stat_date DATE PRIMARY KEY,
  questionnaire_responses INTEGER DEFAULT 0,
  completed_responses INTEGER DEFAULT 0,
  heart_voices INTEGER DEFAULT 0,
  stories INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 触发器：自动更新每日统计
CREATE TRIGGER IF NOT EXISTS update_daily_stats_questionnaire
AFTER INSERT ON universal_questionnaire_responses
WHEN NEW.questionnaire_id = 'employment-survey-2024'
BEGIN
  INSERT OR REPLACE INTO daily_stats_cache (
    stat_date, 
    questionnaire_responses,
    completed_responses,
    last_updated
  )
  SELECT 
    DATE('now') as stat_date,
    COUNT(*) as questionnaire_responses,
    COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_responses,
    datetime('now') as last_updated
  FROM universal_questionnaire_responses
  WHERE questionnaire_id = 'employment-survey-2024'
    AND DATE(created_at) = DATE('now');
END;

-- 清理旧的统计缓存（保留30天）
CREATE TRIGGER IF NOT EXISTS cleanup_old_daily_stats
AFTER INSERT ON daily_stats_cache
BEGIN
  DELETE FROM daily_stats_cache 
  WHERE stat_date < DATE('now', '-30 days');
END;

-- 分析查询性能的辅助函数
-- 注意：SQLite不支持存储过程，这些是示例查询

-- 获取最近7天的趋势数据
-- SELECT 
--   stat_date,
--   questionnaire_responses,
--   completed_responses,
--   (completed_responses * 100.0 / NULLIF(questionnaire_responses, 0)) as completion_rate
-- FROM daily_stats_cache
-- WHERE stat_date >= DATE('now', '-7 days')
-- ORDER BY stat_date;

-- 获取热门问题分布（需要解析JSON）
-- SELECT 
--   json_extract(responses, '$.education-level') as education_level,
--   COUNT(*) as count
-- FROM v_completed_questionnaires
-- WHERE json_extract(responses, '$.education-level') IS NOT NULL
-- GROUP BY json_extract(responses, '$.education-level')
-- ORDER BY count DESC;

-- 性能监控查询
-- EXPLAIN QUERY PLAN 
-- SELECT COUNT(*) 
-- FROM universal_questionnaire_responses 
-- WHERE questionnaire_id = 'employment-survey-2024' 
--   AND is_completed = 1;

-- 数据库统计信息更新
ANALYZE;

-- 创建定期维护任务的标记表
CREATE TABLE IF NOT EXISTS maintenance_log (
  task_name VARCHAR(100) PRIMARY KEY,
  last_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'
);

INSERT OR IGNORE INTO maintenance_log (task_name, status) VALUES
('index_optimization', 'completed'),
('cache_cleanup', 'pending'),
('stats_update', 'pending'),
('analyze_tables', 'completed');

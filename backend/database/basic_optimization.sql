-- 基础性能优化脚本
-- 只包含现有表的索引优化

-- 问卷响应表的性能优化索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_id_completed 
ON universal_questionnaire_responses(questionnaire_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_submitted 
ON universal_questionnaire_responses(submitted_at) 
WHERE submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_completed_submitted 
ON universal_questionnaire_responses(is_completed, submitted_at) 
WHERE is_completed = 1 AND submitted_at IS NOT NULL;

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

-- 预聚合表用于常用统计
CREATE TABLE IF NOT EXISTS daily_stats_cache (
  stat_date DATE PRIMARY KEY,
  questionnaire_responses INTEGER DEFAULT 0,
  completed_responses INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

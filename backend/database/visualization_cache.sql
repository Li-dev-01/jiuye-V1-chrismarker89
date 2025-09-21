-- 可视化专用缓存表
-- 用于提升可视化页面的性能

-- 可视化缓存主表
CREATE TABLE IF NOT EXISTS visualization_cache (
  cache_key VARCHAR(100) PRIMARY KEY,
  data_type VARCHAR(50) NOT NULL,
  cached_data TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 问卷数据聚合表
CREATE TABLE IF NOT EXISTS questionnaire_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id VARCHAR(100) NOT NULL,
  option_value VARCHAR(200) NOT NULL,
  count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_id, option_value)
);

-- 实时统计缓存表
CREATE TABLE IF NOT EXISTS realtime_stats_cache (
  stat_key VARCHAR(100) PRIMARY KEY,
  stat_value TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_visualization_cache_type ON visualization_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_visualization_cache_expires ON visualization_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_questionnaire_aggregates_question ON questionnaire_aggregates(question_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_aggregates_calculated ON questionnaire_aggregates(last_calculated);
CREATE INDEX IF NOT EXISTS idx_realtime_stats_expires ON realtime_stats_cache(expires_at);

-- 插入初始缓存配置
INSERT OR IGNORE INTO visualization_cache (cache_key, data_type, cached_data, expires_at) VALUES
('dashboard_overview', 'dashboard', '{}', datetime('now', '+1 hour')),
('education_distribution', 'distribution', '[]', datetime('now', '+1 hour')),
('employment_status', 'distribution', '[]', datetime('now', '+1 hour')),
('salary_distribution', 'distribution', '[]', datetime('now', '+1 hour'));

-- 清理过期缓存的触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
AFTER INSERT ON visualization_cache
BEGIN
  DELETE FROM visualization_cache WHERE expires_at < datetime('now');
  DELETE FROM realtime_stats_cache WHERE expires_at < datetime('now');
END;

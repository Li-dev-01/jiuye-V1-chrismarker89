-- 删除旧表并重新创建
DROP TABLE IF EXISTS enhanced_visualization_cache;

-- 创建增强的可视化缓存表
CREATE TABLE IF NOT EXISTS enhanced_visualization_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    cache_key TEXT NOT NULL UNIQUE,
    data_type TEXT NOT NULL,
    cached_data TEXT NOT NULL,
    chart_data TEXT, -- 添加chart_data列
    metadata TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_enhanced_visualization_cache_questionnaire_id ON enhanced_visualization_cache(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_visualization_cache_key ON enhanced_visualization_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_enhanced_visualization_cache_expires ON enhanced_visualization_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_enhanced_visualization_cache_type ON enhanced_visualization_cache(data_type);

-- 删除旧表并重新创建
DROP TABLE IF EXISTS performance_metrics;

-- 创建性能监控表
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    cache_hit BOOLEAN DEFAULT FALSE, -- 添加cache_hit列
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- 创建问卷统计缓存表
CREATE TABLE IF NOT EXISTS questionnaire_statistics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    option_value TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    percentage REAL NOT NULL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(questionnaire_id, question_id, option_value)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_questionnaire_id ON questionnaire_statistics_cache(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_question_id ON questionnaire_statistics_cache(question_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_statistics_cache_last_updated ON questionnaire_statistics_cache(last_updated);

-- 创建清理过期缓存的触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_enhanced_cache
AFTER INSERT ON enhanced_visualization_cache
BEGIN
  DELETE FROM enhanced_visualization_cache 
  WHERE expires_at < datetime('now');
END;

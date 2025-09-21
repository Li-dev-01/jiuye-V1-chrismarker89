-- 性能监控表结构
-- 用于记录API性能指标、缓存命中率、查询性能等

-- 性能指标表
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    response_time REAL NOT NULL,
    cache_hit INTEGER NOT NULL DEFAULT 0,
    data_source TEXT NOT NULL,
    query_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    user_agent TEXT,
    client_ip TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 性能指标索引
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_response_time ON performance_metrics(response_time);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_data_source ON performance_metrics(data_source);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_cache_hit ON performance_metrics(cache_hit);

-- 性能告警配置表
CREATE TABLE IF NOT EXISTS performance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_name TEXT NOT NULL UNIQUE,
    metric_type TEXT NOT NULL, -- 'response_time', 'cache_hit_rate', 'error_rate'
    threshold_value REAL NOT NULL,
    comparison_operator TEXT NOT NULL, -- '>', '<', '>=', '<=', '='
    time_window_minutes INTEGER NOT NULL DEFAULT 5,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    notification_channels TEXT, -- JSON array of notification channels
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 性能告警历史表
CREATE TABLE IF NOT EXISTS performance_alert_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL,
    triggered_at TEXT NOT NULL,
    metric_value REAL NOT NULL,
    threshold_value REAL NOT NULL,
    message TEXT,
    resolved_at TEXT,
    FOREIGN KEY (alert_id) REFERENCES performance_alerts(id)
);

-- 性能告警历史索引
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON performance_alert_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON performance_alert_history(alert_id);

-- 性能基准表（用于对比）
CREATE TABLE IF NOT EXISTS performance_baselines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    baseline_response_time REAL NOT NULL,
    baseline_cache_hit_rate REAL NOT NULL,
    baseline_error_rate REAL NOT NULL,
    measurement_period TEXT NOT NULL, -- '1h', '24h', '7d'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 性能基准索引
CREATE INDEX IF NOT EXISTS idx_baselines_endpoint ON performance_baselines(endpoint);
CREATE INDEX IF NOT EXISTS idx_baselines_active ON performance_baselines(is_active);

-- 插入默认性能告警配置
INSERT OR IGNORE INTO performance_alerts (alert_name, metric_type, threshold_value, comparison_operator, time_window_minutes) VALUES
('高响应时间告警', 'response_time', 2000.0, '>', 5),
('低缓存命中率告警', 'cache_hit_rate', 80.0, '<', 10),
('高错误率告警', 'error_rate', 5.0, '>', 5),
('极慢响应告警', 'response_time', 5000.0, '>', 1);

-- 插入默认性能基准
INSERT OR IGNORE INTO performance_baselines (endpoint, baseline_response_time, baseline_cache_hit_rate, baseline_error_rate, measurement_period) VALUES
('/api/universal-questionnaire/statistics/employment-survey-2024', 200.0, 95.0, 1.0, '24h'),
('/api/analytics/visualization/summary', 300.0, 90.0, 2.0, '24h'),
('/api/analytics/visualization/dimension/*', 250.0, 92.0, 1.5, '24h');

-- 创建性能监控视图
CREATE VIEW IF NOT EXISTS v_performance_summary AS
SELECT 
    DATE(timestamp) as date,
    endpoint,
    COUNT(*) as total_requests,
    AVG(response_time) as avg_response_time,
    MIN(response_time) as min_response_time,
    MAX(response_time) as max_response_time,
    AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    AVG(CASE WHEN error_count > 0 THEN 1.0 ELSE 0.0 END) * 100 as error_rate,
    COUNT(DISTINCT client_ip) as unique_clients
FROM performance_metrics 
GROUP BY DATE(timestamp), endpoint
ORDER BY date DESC, total_requests DESC;

-- 创建实时性能视图（最近1小时）
CREATE VIEW IF NOT EXISTS v_realtime_performance AS
SELECT 
    strftime('%Y-%m-%d %H:%M', timestamp) as time_bucket,
    endpoint,
    COUNT(*) as requests,
    AVG(response_time) as avg_response_time,
    AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    SUM(error_count) as total_errors
FROM performance_metrics 
WHERE timestamp >= datetime('now', '-1 hour')
GROUP BY strftime('%Y-%m-%d %H:%M', timestamp), endpoint
ORDER BY time_bucket DESC;

-- 创建性能趋势视图
CREATE VIEW IF NOT EXISTS v_performance_trends AS
SELECT 
    strftime('%Y-%m-%d %H', timestamp) as hour,
    AVG(response_time) as avg_response_time,
    AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    COUNT(*) as total_requests,
    SUM(error_count) as total_errors,
    COUNT(DISTINCT data_source) as data_sources_used
FROM performance_metrics 
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY strftime('%Y-%m-%d %H', timestamp)
ORDER BY hour;

-- 创建慢查询视图
CREATE VIEW IF NOT EXISTS v_slow_queries AS
SELECT 
    endpoint,
    response_time,
    data_source,
    cache_hit,
    timestamp,
    user_agent,
    client_ip
FROM performance_metrics 
WHERE response_time > 1000  -- 超过1秒的查询
ORDER BY response_time DESC
LIMIT 100;

-- 创建缓存效率视图
CREATE VIEW IF NOT EXISTS v_cache_efficiency AS
SELECT 
    endpoint,
    data_source,
    COUNT(*) as total_requests,
    SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
    AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    AVG(CASE WHEN cache_hit = 1 THEN response_time ELSE NULL END) as avg_cache_response_time,
    AVG(CASE WHEN cache_hit = 0 THEN response_time ELSE NULL END) as avg_no_cache_response_time
FROM performance_metrics 
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY endpoint, data_source
HAVING total_requests >= 10  -- 至少10个请求才有统计意义
ORDER BY cache_hit_rate DESC;

-- 创建用户行为分析视图
CREATE VIEW IF NOT EXISTS v_user_behavior AS
SELECT 
    client_ip,
    COUNT(*) as total_requests,
    COUNT(DISTINCT endpoint) as unique_endpoints,
    AVG(response_time) as avg_response_time,
    MIN(timestamp) as first_request,
    MAX(timestamp) as last_request,
    COUNT(DISTINCT DATE(timestamp)) as active_days
FROM performance_metrics 
WHERE client_ip IS NOT NULL
    AND timestamp >= datetime('now', '-7 days')
GROUP BY client_ip
HAVING total_requests >= 5  -- 至少5个请求
ORDER BY total_requests DESC;

-- 创建数据源性能对比视图
CREATE VIEW IF NOT EXISTS v_data_source_performance AS
SELECT 
    data_source,
    COUNT(*) as total_requests,
    AVG(response_time) as avg_response_time,
    MIN(response_time) as min_response_time,
    MAX(response_time) as max_response_time,
    AVG(CASE WHEN cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    SUM(error_count) as total_errors,
    AVG(query_count) as avg_query_count
FROM performance_metrics 
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY data_source
ORDER BY total_requests DESC;

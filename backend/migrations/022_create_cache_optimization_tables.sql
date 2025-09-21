-- 缓存优化相关表结构
-- 用于记录自动优化历史和状态

-- 缓存优化历史表
CREATE TABLE IF NOT EXISTS cache_optimization_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_config_id TEXT NOT NULL,
    old_frequency INTEGER NOT NULL,
    new_frequency INTEGER NOT NULL,
    reason TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    expected_improvement TEXT, -- JSON格式的预期改进
    actual_improvement TEXT, -- JSON格式的实际改进（后续测量）
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 缓存优化历史索引
CREATE INDEX IF NOT EXISTS idx_optimization_history_sync_config ON cache_optimization_history(sync_config_id);
CREATE INDEX IF NOT EXISTS idx_optimization_history_applied_at ON cache_optimization_history(applied_at);

-- 自动优化状态表
CREATE TABLE IF NOT EXISTS auto_optimization_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_run_at TEXT,
    success INTEGER NOT NULL DEFAULT 0,
    recommendations_count INTEGER NOT NULL DEFAULT 0,
    applied_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    next_run_at TEXT,
    config TEXT, -- JSON格式的配置
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 缓存性能基准表（扩展）
CREATE TABLE IF NOT EXISTS cache_performance_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    sync_config_id TEXT NOT NULL,
    benchmark_date TEXT NOT NULL,
    avg_response_time REAL NOT NULL,
    cache_hit_rate REAL NOT NULL,
    request_frequency REAL NOT NULL,
    user_concurrency INTEGER NOT NULL,
    data_freshness_minutes INTEGER NOT NULL,
    performance_score REAL, -- 综合性能评分
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 缓存性能基准索引
CREATE INDEX IF NOT EXISTS idx_benchmarks_endpoint ON cache_performance_benchmarks(endpoint);
CREATE INDEX IF NOT EXISTS idx_benchmarks_sync_config ON cache_performance_benchmarks(sync_config_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_date ON cache_performance_benchmarks(benchmark_date);

-- 优化建议表
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_config_id TEXT NOT NULL,
    recommendation_type TEXT NOT NULL, -- 'frequency', 'strategy', 'priority'
    current_value TEXT NOT NULL,
    recommended_value TEXT NOT NULL,
    confidence_score REAL NOT NULL, -- 0-1的置信度
    priority TEXT NOT NULL, -- 'high', 'medium', 'low'
    reason TEXT NOT NULL,
    expected_improvement TEXT, -- JSON格式
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'rejected', 'expired'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    applied_at TEXT,
    applied_by TEXT
);

-- 优化建议索引
CREATE INDEX IF NOT EXISTS idx_recommendations_sync_config ON optimization_recommendations(sync_config_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON optimization_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON optimization_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON optimization_recommendations(created_at);

-- 创建缓存优化分析视图
CREATE VIEW IF NOT EXISTS v_cache_optimization_analysis AS
SELECT 
    sc.sync_name,
    sc.frequency_minutes as current_frequency,
    sc.last_sync_at,
    sc.is_enabled,
    AVG(pm.response_time) as avg_response_time,
    AVG(CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    COUNT(pm.id) as total_requests,
    COUNT(DISTINCT pm.client_ip) as unique_users,
    MIN(pm.timestamp) as first_request,
    MAX(pm.timestamp) as last_request
FROM sync_configuration sc
LEFT JOIN performance_metrics pm ON (
    (sc.sync_name = 'analytics_to_realtime' AND pm.endpoint LIKE '%statistics%') OR
    (sc.sync_name = 'realtime_to_aggregated' AND pm.endpoint LIKE '%analytics%') OR
    (sc.sync_name = 'dashboard_to_visualization' AND pm.endpoint LIKE '%visualization%')
)
WHERE pm.timestamp >= datetime('now', '-24 hours')
GROUP BY sc.sync_name, sc.frequency_minutes, sc.last_sync_at, sc.is_enabled;

-- 创建优化效果评估视图
CREATE VIEW IF NOT EXISTS v_optimization_effectiveness AS
SELECT 
    oh.sync_config_id,
    oh.applied_at,
    oh.old_frequency,
    oh.new_frequency,
    oh.reason,
    -- 优化前性能（优化前24小时）
    AVG(CASE WHEN pm.timestamp BETWEEN datetime(oh.applied_at, '-48 hours') AND datetime(oh.applied_at, '-24 hours') 
        THEN pm.response_time ELSE NULL END) as before_avg_response_time,
    AVG(CASE WHEN pm.timestamp BETWEEN datetime(oh.applied_at, '-48 hours') AND datetime(oh.applied_at, '-24 hours') 
        THEN CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END ELSE NULL END) * 100 as before_cache_hit_rate,
    -- 优化后性能（优化后24小时）
    AVG(CASE WHEN pm.timestamp BETWEEN oh.applied_at AND datetime(oh.applied_at, '+24 hours') 
        THEN pm.response_time ELSE NULL END) as after_avg_response_time,
    AVG(CASE WHEN pm.timestamp BETWEEN oh.applied_at AND datetime(oh.applied_at, '+24 hours') 
        THEN CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END ELSE NULL END) * 100 as after_cache_hit_rate,
    -- 改进计算
    (AVG(CASE WHEN pm.timestamp BETWEEN datetime(oh.applied_at, '-48 hours') AND datetime(oh.applied_at, '-24 hours') 
        THEN pm.response_time ELSE NULL END) - 
     AVG(CASE WHEN pm.timestamp BETWEEN oh.applied_at AND datetime(oh.applied_at, '+24 hours') 
        THEN pm.response_time ELSE NULL END)) as response_time_improvement,
    (AVG(CASE WHEN pm.timestamp BETWEEN oh.applied_at AND datetime(oh.applied_at, '+24 hours') 
        THEN CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END ELSE NULL END) * 100 -
     AVG(CASE WHEN pm.timestamp BETWEEN datetime(oh.applied_at, '-48 hours') AND datetime(oh.applied_at, '-24 hours') 
        THEN CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END ELSE NULL END) * 100) as cache_hit_rate_improvement
FROM cache_optimization_history oh
LEFT JOIN performance_metrics pm ON (
    pm.timestamp BETWEEN datetime(oh.applied_at, '-48 hours') AND datetime(oh.applied_at, '+24 hours')
)
WHERE oh.applied_at >= datetime('now', '-30 days')
GROUP BY oh.id, oh.sync_config_id, oh.applied_at, oh.old_frequency, oh.new_frequency, oh.reason;

-- 创建缓存健康度评分视图
CREATE VIEW IF NOT EXISTS v_cache_health_score AS
SELECT 
    sc.sync_name,
    sc.frequency_minutes,
    -- 响应时间评分 (0-100, 越低越好)
    CASE 
        WHEN AVG(pm.response_time) <= 100 THEN 100
        WHEN AVG(pm.response_time) <= 500 THEN 90
        WHEN AVG(pm.response_time) <= 1000 THEN 70
        WHEN AVG(pm.response_time) <= 2000 THEN 50
        ELSE 20
    END as response_time_score,
    -- 缓存命中率评分 (0-100)
    AVG(CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_score,
    -- 稳定性评分 (基于错误率)
    CASE 
        WHEN AVG(pm.error_count) = 0 THEN 100
        WHEN AVG(pm.error_count) <= 0.01 THEN 90
        WHEN AVG(pm.error_count) <= 0.05 THEN 70
        ELSE 40
    END as stability_score,
    -- 综合健康度评分
    (
        CASE 
            WHEN AVG(pm.response_time) <= 100 THEN 100
            WHEN AVG(pm.response_time) <= 500 THEN 90
            WHEN AVG(pm.response_time) <= 1000 THEN 70
            WHEN AVG(pm.response_time) <= 2000 THEN 50
            ELSE 20
        END * 0.4 +
        AVG(CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 * 0.4 +
        CASE 
            WHEN AVG(pm.error_count) = 0 THEN 100
            WHEN AVG(pm.error_count) <= 0.01 THEN 90
            WHEN AVG(pm.error_count) <= 0.05 THEN 70
            ELSE 40
        END * 0.2
    ) as overall_health_score,
    COUNT(pm.id) as sample_size,
    AVG(pm.response_time) as avg_response_time,
    AVG(CASE WHEN pm.cache_hit = 1 THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,
    AVG(pm.error_count) as avg_error_rate
FROM sync_configuration sc
LEFT JOIN performance_metrics pm ON pm.timestamp >= datetime('now', '-24 hours')
WHERE sc.is_enabled = 1
GROUP BY sc.sync_name, sc.frequency_minutes
HAVING sample_size >= 10; -- 至少10个样本才有统计意义

-- 智能扩容历史表
CREATE TABLE IF NOT EXISTS scaling_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scaling_type TEXT NOT NULL, -- 'sync_frequency', 'cache_strategy', 'resource_allocation'
    action TEXT NOT NULL,
    current_value TEXT,
    new_value TEXT,
    expected_impact TEXT, -- JSON格式
    actual_impact TEXT, -- JSON格式（后续测量）
    applied_at TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    rollback_at TEXT,
    rollback_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 扩容历史索引
CREATE INDEX IF NOT EXISTS idx_scaling_history_type ON scaling_history(scaling_type);
CREATE INDEX IF NOT EXISTS idx_scaling_history_applied_at ON scaling_history(applied_at);

-- 插入初始优化配置
INSERT OR IGNORE INTO auto_optimization_status (id, config) VALUES (
    1,
    '{"enabled":true,"analysisInterval":6,"applyThreshold":{"minCacheHitRate":85,"maxResponseTime":1000,"minRequestFrequency":5},"safetyLimits":{"maxFrequencyIncrease":2.0,"minFrequencyDecrease":0.5,"maxSyncFrequency":1,"minSyncFrequency":60}}'
);

-- 定时任务执行日志表
-- 用于记录Cloudflare Workers定时任务的执行状态

-- 定时任务执行日志表
CREATE TABLE IF NOT EXISTS cron_execution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cron_pattern TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'timeout'
    execution_time_ms INTEGER,
    error_message TEXT,
    executed_at TEXT NOT NULL,
    details TEXT, -- JSON格式的详细信息
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 定时任务执行日志索引
CREATE INDEX IF NOT EXISTS idx_cron_log_pattern ON cron_execution_log(cron_pattern);
CREATE INDEX IF NOT EXISTS idx_cron_log_status ON cron_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_cron_log_executed_at ON cron_execution_log(executed_at);

-- 定时任务配置表
CREATE TABLE IF NOT EXISTS cron_configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cron_pattern TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    description TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    max_execution_time_ms INTEGER DEFAULT 30000, -- 30秒超时
    retry_count INTEGER DEFAULT 3,
    retry_delay_ms INTEGER DEFAULT 5000, -- 5秒重试延迟
    last_execution_at TEXT,
    next_execution_at TEXT,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 定时任务配置索引
CREATE INDEX IF NOT EXISTS idx_cron_config_pattern ON cron_configuration(cron_pattern);
CREATE INDEX IF NOT EXISTS idx_cron_config_enabled ON cron_configuration(is_enabled);
CREATE INDEX IF NOT EXISTS idx_cron_config_next_execution ON cron_configuration(next_execution_at);

-- 插入定时任务配置
INSERT OR IGNORE INTO cron_configuration (cron_pattern, task_name, description) VALUES
('*/5 * * * *', 'realtime_sync', '实时统计同步 - 每5分钟执行analytics_to_realtime和main_to_analytics同步'),
('*/10 * * * *', 'aggregated_sync', '聚合统计同步 - 每10分钟执行realtime_to_aggregated和analytics_to_admin同步'),
('*/15 * * * *', 'dashboard_sync', '仪表板缓存同步 - 每15分钟执行aggregated_to_dashboard和dashboard_to_visualization同步'),
('*/30 * * * *', 'export_sync', '导出数据同步 - 每30分钟执行analytics_to_export同步'),
('0 * * * *', 'social_insights_sync', '社会洞察数据同步 - 每小时执行analytics_to_social同步'),
('0 */6 * * *', 'cache_optimization', '自动缓存优化 - 每6小时分析使用模式并应用优化建议'),
('0 8 * * *', 'data_consistency_check', '数据一致性检查 - 每天上午8点检查各级表数据一致性'),
('0 2 * * *', 'data_quality_monitoring', '数据质量监控和清理 - 每天凌晨2点清理过期数据'),
('0 0 * * 0', 'weekly_maintenance', '周维护任务 - 每周日凌晨执行性能基准更新和数据库优化');

-- 定时任务统计视图
CREATE VIEW IF NOT EXISTS v_cron_statistics AS
SELECT 
    cc.cron_pattern,
    cc.task_name,
    cc.description,
    cc.is_enabled,
    cc.success_count,
    cc.error_count,
    cc.last_execution_at,
    cc.next_execution_at,
    CASE 
        WHEN cc.success_count + cc.error_count = 0 THEN 0
        ELSE ROUND(cc.success_count * 100.0 / (cc.success_count + cc.error_count), 2)
    END as success_rate,
    -- 最近24小时执行统计
    (SELECT COUNT(*) FROM cron_execution_log cel 
     WHERE cel.cron_pattern = cc.cron_pattern 
     AND cel.executed_at >= datetime('now', '-24 hours')) as executions_24h,
    (SELECT COUNT(*) FROM cron_execution_log cel 
     WHERE cel.cron_pattern = cc.cron_pattern 
     AND cel.status = 'success'
     AND cel.executed_at >= datetime('now', '-24 hours')) as successes_24h,
    (SELECT COUNT(*) FROM cron_execution_log cel 
     WHERE cel.cron_pattern = cc.cron_pattern 
     AND cel.status = 'error'
     AND cel.executed_at >= datetime('now', '-24 hours')) as errors_24h,
    -- 平均执行时间
    (SELECT AVG(execution_time_ms) FROM cron_execution_log cel 
     WHERE cel.cron_pattern = cc.cron_pattern 
     AND cel.status = 'success'
     AND cel.executed_at >= datetime('now', '-7 days')) as avg_execution_time_ms
FROM cron_configuration cc;

-- 定时任务健康度视图
CREATE VIEW IF NOT EXISTS v_cron_health AS
SELECT 
    cron_pattern,
    task_name,
    CASE 
        WHEN is_enabled = 0 THEN 'disabled'
        WHEN error_count = 0 AND success_count > 0 THEN 'healthy'
        WHEN success_count = 0 THEN 'failing'
        WHEN error_count * 100.0 / (success_count + error_count) > 20 THEN 'unhealthy'
        WHEN error_count * 100.0 / (success_count + error_count) > 5 THEN 'warning'
        ELSE 'healthy'
    END as health_status,
    CASE 
        WHEN last_execution_at IS NULL THEN 'never_executed'
        WHEN datetime(last_execution_at) < datetime('now', '-2 hours') THEN 'stale'
        ELSE 'recent'
    END as execution_status,
    success_count,
    error_count,
    last_execution_at
FROM cron_configuration;

-- 定时任务错误分析视图
CREATE VIEW IF NOT EXISTS v_cron_error_analysis AS
SELECT 
    cron_pattern,
    DATE(executed_at) as error_date,
    COUNT(*) as error_count,
    GROUP_CONCAT(DISTINCT SUBSTR(error_message, 1, 100)) as error_samples,
    MIN(executed_at) as first_error,
    MAX(executed_at) as last_error
FROM cron_execution_log 
WHERE status = 'error'
    AND executed_at >= datetime('now', '-30 days')
GROUP BY cron_pattern, DATE(executed_at)
ORDER BY error_date DESC, error_count DESC;

-- 定时任务性能趋势视图
CREATE VIEW IF NOT EXISTS v_cron_performance_trends AS
SELECT 
    cron_pattern,
    DATE(executed_at) as execution_date,
    COUNT(*) as total_executions,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_executions,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_executions,
    AVG(CASE WHEN status = 'success' THEN execution_time_ms ELSE NULL END) as avg_execution_time,
    MIN(CASE WHEN status = 'success' THEN execution_time_ms ELSE NULL END) as min_execution_time,
    MAX(CASE WHEN status = 'success' THEN execution_time_ms ELSE NULL END) as max_execution_time,
    ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM cron_execution_log 
WHERE executed_at >= datetime('now', '-30 days')
GROUP BY cron_pattern, DATE(executed_at)
ORDER BY execution_date DESC, cron_pattern;

-- 创建触发器：自动更新定时任务配置的统计信息
CREATE TRIGGER IF NOT EXISTS update_cron_stats_on_success
AFTER INSERT ON cron_execution_log
WHEN NEW.status = 'success'
BEGIN
    UPDATE cron_configuration 
    SET success_count = success_count + 1,
        last_execution_at = NEW.executed_at,
        updated_at = datetime('now')
    WHERE cron_pattern = NEW.cron_pattern;
END;

CREATE TRIGGER IF NOT EXISTS update_cron_stats_on_error
AFTER INSERT ON cron_execution_log
WHEN NEW.status = 'error'
BEGIN
    UPDATE cron_configuration 
    SET error_count = error_count + 1,
        last_execution_at = NEW.executed_at,
        updated_at = datetime('now')
    WHERE cron_pattern = NEW.cron_pattern;
END;

-- 创建清理过期日志的存储过程（通过定时任务调用）
-- 保留最近30天的日志，删除更早的记录
-- DELETE FROM cron_execution_log WHERE executed_at < datetime('now', '-30 days');

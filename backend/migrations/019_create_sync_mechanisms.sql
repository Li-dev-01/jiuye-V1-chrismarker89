-- 数据同步机制：触发器和同步任务

-- 同步配置表
CREATE TABLE IF NOT EXISTS sync_configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_name TEXT NOT NULL UNIQUE,
    source_table TEXT NOT NULL,
    target_table TEXT NOT NULL,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('realtime', 'scheduled', 'threshold')),
    
    -- 同步策略
    sync_frequency INTEGER DEFAULT 300, -- 秒
    batch_size INTEGER DEFAULT 100,
    change_threshold INTEGER DEFAULT 10, -- 变化条数阈值
    time_threshold INTEGER DEFAULT 300,  -- 时间阈值(秒)
    
    -- 同步状态
    is_enabled INTEGER DEFAULT 1,
    last_sync_time TEXT,
    next_sync_time TEXT,
    pending_changes INTEGER DEFAULT 0,
    
    -- 错误处理
    max_retries INTEGER DEFAULT 3,
    retry_delay INTEGER DEFAULT 60, -- 秒
    error_threshold INTEGER DEFAULT 5, -- 连续错误阈值
    
    -- 元数据
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 同步任务队列
CREATE TABLE IF NOT EXISTS sync_task_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    source_table TEXT NOT NULL,
    target_table TEXT NOT NULL,
    
    -- 任务配置
    sync_config_id INTEGER,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1最高
    batch_size INTEGER DEFAULT 100,
    
    -- 任务状态
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    scheduled_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    
    -- 执行结果
    processed_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- 重试机制
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TEXT,
    
    -- 元数据
    execution_context TEXT, -- JSON: 执行上下文
    performance_metrics TEXT, -- JSON: 性能指标
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (sync_config_id) REFERENCES sync_configuration(id) ON DELETE SET NULL
);

-- 同步日志表
CREATE TABLE IF NOT EXISTS sync_execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    sync_config_id INTEGER,
    
    -- 执行信息
    execution_type TEXT NOT NULL, -- 'trigger', 'scheduled', 'manual'
    source_table TEXT NOT NULL,
    target_table TEXT NOT NULL,
    
    -- 执行结果
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- 性能指标
    execution_time_ms INTEGER DEFAULT 0,
    memory_usage_mb REAL DEFAULT 0.0,
    cpu_usage_percent REAL DEFAULT 0.0,
    
    -- 错误信息
    error_code TEXT,
    error_message TEXT,
    error_details TEXT, -- JSON
    
    -- 数据质量
    data_quality_score REAL DEFAULT 1.0,
    validation_errors TEXT, -- JSON
    
    -- 时间戳
    started_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- 外键
    FOREIGN KEY (task_id) REFERENCES sync_task_queue(id) ON DELETE SET NULL,
    FOREIGN KEY (sync_config_id) REFERENCES sync_configuration(id) ON DELETE SET NULL
);

-- 数据变更追踪表
CREATE TABLE IF NOT EXISTS data_change_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    
    -- 变更信息
    change_type TEXT NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    changed_fields TEXT, -- JSON array
    
    -- 同步状态
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt TEXT,
    sync_error TEXT,
    
    -- 元数据
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- 时间戳
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 缓存失效规则表
CREATE TABLE IF NOT EXISTS cache_invalidation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL UNIQUE,
    
    -- 触发条件
    trigger_table TEXT NOT NULL,
    trigger_condition TEXT, -- SQL条件
    trigger_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'batched', 'scheduled'
    
    -- 失效目标
    target_cache_table TEXT NOT NULL,
    target_cache_keys TEXT, -- JSON array: 特定的缓存键
    invalidation_scope TEXT DEFAULT 'specific', -- 'specific', 'partial', 'full'
    
    -- 失效策略
    invalidation_delay INTEGER DEFAULT 0, -- 延迟秒数
    batch_size INTEGER DEFAULT 100,
    cascade_invalidation INTEGER DEFAULT 0, -- 是否级联失效
    
    -- 规则状态
    is_enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 5,
    
    -- 统计信息
    trigger_count INTEGER DEFAULT 0,
    last_triggered TEXT,
    average_execution_time INTEGER DEFAULT 0,
    
    -- 元数据
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插入默认同步配置
INSERT OR IGNORE INTO sync_configuration (
    sync_name, source_table, target_table, sync_type, sync_frequency, description
) VALUES 
-- 实时同步 (触发器)
('main_to_analytics', 'questionnaire_responses', 'analytics_responses', 'realtime', 0, '主表到分析表的实时同步'),
('main_to_admin', 'questionnaire_responses', 'admin_responses', 'realtime', 0, '主表到管理表的实时同步'),
('main_to_insights', 'questionnaire_responses', 'social_insights_data', 'realtime', 0, '主表到洞察表的实时同步'),

-- 定时同步 (5分钟)
('analytics_to_realtime_stats', 'analytics_responses', 'realtime_stats', 'scheduled', 300, '分析表到实时统计的定时同步'),
('analytics_to_aggregated', 'analytics_responses', 'aggregated_stats', 'scheduled', 600, '分析表到聚合统计的定时同步'),

-- 缓存同步 (10分钟)
('stats_to_dashboard', 'realtime_stats', 'dashboard_cache', 'scheduled', 600, '统计表到仪表板缓存的同步'),
('stats_to_visualization', 'aggregated_stats', 'enhanced_visualization_cache', 'scheduled', 600, '聚合统计到可视化缓存的同步'),

-- 阈值触发同步
('threshold_export_sync', 'analytics_responses', 'export_responses', 'threshold', 0, '达到阈值时的导出数据同步');

-- 插入默认缓存失效规则
INSERT OR IGNORE INTO cache_invalidation_rules (
    rule_name, trigger_table, trigger_condition, target_cache_table, invalidation_scope, description
) VALUES 
('questionnaire_submit_invalidation', 'questionnaire_responses', 'COUNT(*) % 5 = 0', 'realtime_stats', 'partial', '问卷提交时的实时统计失效'),
('daily_stats_invalidation', 'analytics_responses', 'date(submitted_at) = date(''now'')', 'aggregated_stats', 'specific', '日统计数据失效'),
('dashboard_refresh', 'realtime_stats', 'last_updated > datetime(''now'', ''-10 minutes'')', 'dashboard_cache', 'full', '仪表板缓存刷新'),
('visualization_refresh', 'aggregated_stats', 'last_calculated > datetime(''now'', ''-15 minutes'')', 'enhanced_visualization_cache', 'partial', '可视化缓存刷新');

-- 创建触发器：主表到业务专用表的实时同步

-- 1. 主表到分析表的同步触发器
CREATE TRIGGER IF NOT EXISTS sync_to_analytics_responses
AFTER INSERT ON questionnaire_responses
FOR EACH ROW
WHEN NEW.status = 'completed'
BEGIN
    -- 记录变更追踪
    INSERT INTO data_change_tracking (
        table_name, record_id, change_type, new_values
    ) VALUES (
        'questionnaire_responses', NEW.id, 'INSERT', 
        json_object('id', NEW.id, 'user_id', NEW.user_id, 'submitted_at', NEW.submitted_at)
    );
    
    -- 同步到分析表
    INSERT OR REPLACE INTO analytics_responses (
        id, user_id, submitted_at, is_test_data, created_at
    ) VALUES (
        NEW.id, NEW.user_id, NEW.submitted_at, NEW.is_test_data, NEW.created_at
    );
    
    -- 更新同步配置的待处理计数
    UPDATE sync_configuration 
    SET pending_changes = pending_changes + 1,
        last_sync_time = datetime('now')
    WHERE sync_name = 'main_to_analytics';
END;

-- 2. 答案表同步触发器 (更新分析表的预处理字段)
CREATE TRIGGER IF NOT EXISTS sync_answers_to_analytics
AFTER INSERT ON questionnaire_answers
FOR EACH ROW
WHEN NEW.is_test_data = 1 OR EXISTS (
    SELECT 1 FROM questionnaire_responses 
    WHERE id = NEW.response_id AND status = 'completed'
)
BEGIN
    -- 更新分析表的对应字段
    UPDATE analytics_responses 
    SET 
        age_range = CASE WHEN NEW.question_id = 'age-range' THEN NEW.answer_value ELSE age_range END,
        education_level = CASE WHEN NEW.question_id = 'education-level' THEN NEW.answer_value ELSE education_level END,
        employment_status = CASE WHEN NEW.question_id = 'current-status' THEN NEW.answer_value ELSE employment_status END,
        gender = CASE WHEN NEW.question_id = 'gender' THEN NEW.answer_value ELSE gender END,
        work_location = CASE WHEN NEW.question_id = 'work-location-preference' THEN NEW.answer_value ELSE work_location END,
        updated_at = datetime('now')
    WHERE id = NEW.response_id;
    
    -- 处理多选字段 (JSON数组)
    UPDATE analytics_responses 
    SET 
        job_search_channels = CASE 
            WHEN NEW.question_id = 'job-search-channels' THEN 
                json_insert(COALESCE(job_search_channels, '[]'), '$[#]', NEW.answer_value)
            ELSE job_search_channels 
        END,
        difficulties = CASE 
            WHEN NEW.question_id = 'job-search-difficulties' THEN 
                json_insert(COALESCE(difficulties, '[]'), '$[#]', NEW.answer_value)
            ELSE difficulties 
        END,
        policy_suggestions = CASE 
            WHEN NEW.question_id = 'policy-suggestions' THEN 
                json_insert(COALESCE(policy_suggestions, '[]'), '$[#]', NEW.answer_value)
            ELSE policy_suggestions 
        END,
        updated_at = datetime('now')
    WHERE id = NEW.response_id AND NEW.question_id IN ('job-search-channels', 'job-search-difficulties', 'policy-suggestions');
END;

-- 3. 管理员表同步触发器
CREATE TRIGGER IF NOT EXISTS sync_to_admin_responses
AFTER INSERT ON questionnaire_responses
FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO admin_responses (
        id, user_id, original_response_id, 
        completion_rate, data_consistency_score, 
        created_at
    ) VALUES (
        NEW.id || '_admin', NEW.user_id, NEW.id,
        1.0, 1.0, NEW.created_at
    );
END;

-- 4. 缓存失效触发器
CREATE TRIGGER IF NOT EXISTS invalidate_cache_on_insert
AFTER INSERT ON analytics_responses
FOR EACH ROW
BEGIN
    -- 标记相关缓存为过期
    UPDATE realtime_stats 
    SET last_updated = datetime('now', '-1 hour')
    WHERE stat_category IN ('basic', 'employment', 'education') 
    AND time_window = '5min';
    
    -- 记录缓存失效事件
    INSERT INTO sync_execution_logs (
        execution_type, source_table, target_table, status,
        records_processed, started_at, completed_at
    ) VALUES (
        'trigger', 'analytics_responses', 'realtime_stats', 'success',
        1, datetime('now'), datetime('now')
    );
END;

-- 创建索引以提升同步性能
CREATE INDEX IF NOT EXISTS idx_sync_config_enabled ON sync_configuration(is_enabled, sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_task_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_table ON sync_execution_logs(source_table, target_table, started_at);
CREATE INDEX IF NOT EXISTS idx_change_tracking_table ON data_change_tracking(table_name, sync_status, changed_at);
CREATE INDEX IF NOT EXISTS idx_cache_rules_enabled ON cache_invalidation_rules(is_enabled, trigger_table);

-- 创建视图用于监控同步状态
CREATE VIEW IF NOT EXISTS v_sync_status_summary AS
SELECT 
    sc.sync_name,
    sc.source_table,
    sc.target_table,
    sc.sync_type,
    sc.is_enabled,
    sc.last_sync_time,
    sc.pending_changes,
    COUNT(stq.id) as queued_tasks,
    COUNT(CASE WHEN stq.status = 'failed' THEN 1 END) as failed_tasks,
    AVG(sel.execution_time_ms) as avg_execution_time,
    MAX(sel.completed_at) as last_execution
FROM sync_configuration sc
LEFT JOIN sync_task_queue stq ON sc.id = stq.sync_config_id AND stq.status IN ('pending', 'running')
LEFT JOIN sync_execution_logs sel ON sc.id = sel.sync_config_id AND sel.started_at > datetime('now', '-1 day')
GROUP BY sc.id, sc.sync_name, sc.source_table, sc.target_table, sc.sync_type, sc.is_enabled, sc.last_sync_time, sc.pending_changes;

-- 创建视图用于监控数据质量
CREATE VIEW IF NOT EXISTS v_data_quality_summary AS
SELECT 
    date(created_at) as date,
    COUNT(*) as total_records,
    AVG(data_quality_score) as avg_quality_score,
    COUNT(CASE WHEN data_quality_score < 0.8 THEN 1 END) as low_quality_count,
    COUNT(CASE WHEN is_complete = 0 THEN 1 END) as incomplete_count
FROM analytics_responses
WHERE created_at > datetime('now', '-30 days')
GROUP BY date(created_at)
ORDER BY date DESC;

-- 注释说明
-- 此迁移文件创建了完整的数据同步机制
-- 包括同步配置、任务队列、执行日志、变更追踪、缓存失效规则
-- 实现了主表到业务专用表的实时同步触发器
-- 提供了完整的监控和管理视图

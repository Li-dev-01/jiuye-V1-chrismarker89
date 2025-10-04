-- 创建迁移日志表
-- 用于跟踪数据库迁移执行状态

CREATE TABLE IF NOT EXISTS migration_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL,
    executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
    details TEXT,
    execution_time_ms INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_migration_logs_name ON migration_logs(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_logs(status);
CREATE INDEX IF NOT EXISTS idx_migration_logs_executed_at ON migration_logs(executed_at);

-- 插入初始记录
INSERT OR IGNORE INTO migration_logs (migration_name, status, details) 
VALUES ('000_create_migration_logs', 'completed', 'Initial migration logs table creation');

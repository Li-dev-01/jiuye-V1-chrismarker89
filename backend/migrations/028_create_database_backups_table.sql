-- 创建数据库备份元数据表
-- 用于记录所有数据库备份的信息

CREATE TABLE IF NOT EXISTS database_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_id TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD格式，用于7天滚动删除
  size INTEGER NOT NULL, -- 备份文件大小（字节）
  table_count INTEGER NOT NULL, -- 备份的表数量
  record_count INTEGER NOT NULL, -- 备份的总记录数
  status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'in_progress')),
  error TEXT, -- 错误信息（如果失败）
  r2_key TEXT NOT NULL, -- R2存储的key
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_database_backups_date ON database_backups(date);
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON database_backups(status);
CREATE INDEX IF NOT EXISTS idx_database_backups_timestamp ON database_backups(timestamp);

-- 插入迁移记录
INSERT INTO migration_logs (migration_name, executed_at, status, description)
VALUES (
  '028_create_database_backups_table',
  datetime('now'),
  'success',
  '创建数据库备份元数据表，支持7天滚动备份策略'
);


-- 创建可视化缓存表
CREATE TABLE IF NOT EXISTS visualization_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT NOT NULL UNIQUE,
  data_type TEXT NOT NULL,
  cached_data TEXT NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_visualization_cache_key ON visualization_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_visualization_cache_expires ON visualization_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_visualization_cache_type ON visualization_cache(data_type);

-- 创建清理过期缓存的触发器
CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
AFTER INSERT ON visualization_cache
BEGIN
  DELETE FROM visualization_cache 
  WHERE expires_at < datetime('now');
END;

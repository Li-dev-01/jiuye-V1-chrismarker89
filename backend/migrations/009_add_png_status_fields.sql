-- 添加PNG转换状态字段到有效数据表
-- 用于监控和跟踪PNG生成状态

-- 为valid_stories表添加PNG状态字段
ALTER TABLE valid_stories ADD COLUMN png_status TEXT DEFAULT 'pending' CHECK (png_status IN ('pending', 'generating', 'completed', 'failed', 'skipped'));
ALTER TABLE valid_stories ADD COLUMN png_generated_at DATETIME;
ALTER TABLE valid_stories ADD COLUMN png_themes_generated TEXT DEFAULT '[]'; -- JSON数组，记录已生成的主题
ALTER TABLE valid_stories ADD COLUMN png_generation_attempts INTEGER DEFAULT 0;
ALTER TABLE valid_stories ADD COLUMN png_last_error TEXT;

-- 为valid_heart_voices表添加PNG状态字段
ALTER TABLE valid_heart_voices ADD COLUMN png_status TEXT DEFAULT 'pending' CHECK (png_status IN ('pending', 'generating', 'completed', 'failed', 'skipped'));
ALTER TABLE valid_heart_voices ADD COLUMN png_generated_at DATETIME;
ALTER TABLE valid_heart_voices ADD COLUMN png_themes_generated TEXT DEFAULT '[]'; -- JSON数组，记录已生成的主题
ALTER TABLE valid_heart_voices ADD COLUMN png_generation_attempts INTEGER DEFAULT 0;
ALTER TABLE valid_heart_voices ADD COLUMN png_last_error TEXT;

-- 创建PNG状态索引
CREATE INDEX IF NOT EXISTS idx_valid_stories_png_status ON valid_stories(png_status);
CREATE INDEX IF NOT EXISTS idx_valid_stories_png_generated ON valid_stories(png_generated_at);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_png_status ON valid_heart_voices(png_status);
CREATE INDEX IF NOT EXISTS idx_valid_heart_voices_png_generated ON valid_heart_voices(png_generated_at);

-- 创建PNG缓存表
CREATE TABLE IF NOT EXISTS png_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 缓存键
  cache_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('heart_voice', 'story')),
  content_id INTEGER NOT NULL,
  theme TEXT NOT NULL,
  
  -- 缓存内容
  r2_key TEXT NOT NULL,
  download_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  
  -- 缓存元数据
  cache_hit_count INTEGER DEFAULT 0,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  
  -- 生成信息
  generation_time REAL DEFAULT 0,
  quality_score REAL DEFAULT 0, -- 0-1之间，用于缓存优先级
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  UNIQUE(content_type, content_id, theme)
);

-- 创建PNG缓存索引
CREATE INDEX IF NOT EXISTS idx_png_cache_key ON png_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_png_cache_content ON png_cache(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_cache_expires ON png_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_png_cache_accessed ON png_cache(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_png_cache_hits ON png_cache(cache_hit_count);

-- 创建PNG权限验证记录表
CREATE TABLE IF NOT EXISTS png_auth_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 请求信息
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  theme TEXT NOT NULL,
  
  -- 用户信息
  user_id TEXT,
  session_id TEXT,
  identity_hash TEXT, -- A+B身份哈希
  
  -- 权限验证结果
  auth_result TEXT NOT NULL CHECK (auth_result IN ('granted', 'denied', 'error')),
  auth_method TEXT NOT NULL, -- 'semi_anonymous', 'jwt', 'admin'
  denial_reason TEXT,
  
  -- 请求元数据
  ip_address TEXT,
  user_agent TEXT,
  request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 响应信息
  response_time_ms INTEGER DEFAULT 0,
  download_granted BOOLEAN DEFAULT FALSE
);

-- 创建PNG权限日志索引
CREATE INDEX IF NOT EXISTS idx_png_auth_user ON png_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_png_auth_identity ON png_auth_logs(identity_hash);
CREATE INDEX IF NOT EXISTS idx_png_auth_result ON png_auth_logs(auth_result);
CREATE INDEX IF NOT EXISTS idx_png_auth_timestamp ON png_auth_logs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_png_auth_content ON png_auth_logs(content_type, content_id);

-- 创建PNG性能监控表
CREATE TABLE IF NOT EXISTS png_performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 时间维度
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour >= 0 AND metric_hour <= 23),
  
  -- 生成指标
  total_generated INTEGER DEFAULT 0,
  successful_generated INTEGER DEFAULT 0,
  failed_generated INTEGER DEFAULT 0,
  
  -- 性能指标
  avg_generation_time REAL DEFAULT 0,
  max_generation_time REAL DEFAULT 0,
  min_generation_time REAL DEFAULT 0,
  
  -- 缓存指标
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  cache_hit_rate REAL DEFAULT 0,
  
  -- 下载指标
  total_downloads INTEGER DEFAULT 0,
  unique_downloaders INTEGER DEFAULT 0,
  
  -- 权限指标
  auth_granted INTEGER DEFAULT 0,
  auth_denied INTEGER DEFAULT 0,
  auth_errors INTEGER DEFAULT 0,
  
  -- 存储指标
  r2_uploads INTEGER DEFAULT 0,
  r2_upload_failures INTEGER DEFAULT 0,
  total_storage_used INTEGER DEFAULT 0, -- 字节
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(metric_date, metric_hour)
);

-- 创建性能监控索引
CREATE INDEX IF NOT EXISTS idx_png_metrics_date ON png_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_png_metrics_hour ON png_performance_metrics(metric_date, metric_hour);

-- 创建触发器：自动更新缓存访问时间
CREATE TRIGGER IF NOT EXISTS update_png_cache_access 
AFTER UPDATE OF cache_hit_count ON png_cache
BEGIN
  UPDATE png_cache 
  SET last_accessed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- 创建触发器：自动更新性能指标时间戳
CREATE TRIGGER IF NOT EXISTS update_png_metrics_timestamp 
AFTER UPDATE ON png_performance_metrics
BEGIN
  UPDATE png_performance_metrics 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- 创建视图：PNG状态概览
CREATE VIEW IF NOT EXISTS v_png_status_overview AS
SELECT 
  'story' as content_type,
  png_status,
  COUNT(*) as count,
  AVG(png_generation_attempts) as avg_attempts,
  MIN(png_generated_at) as first_generated,
  MAX(png_generated_at) as last_generated
FROM valid_stories 
GROUP BY png_status
UNION ALL
SELECT 
  'heart_voice' as content_type,
  png_status,
  COUNT(*) as count,
  AVG(png_generation_attempts) as avg_attempts,
  MIN(png_generated_at) as first_generated,
  MAX(png_generated_at) as last_generated
FROM valid_heart_voices 
GROUP BY png_status;

-- 创建视图：PNG缓存统计
CREATE VIEW IF NOT EXISTS v_png_cache_stats AS
SELECT 
  content_type,
  theme,
  COUNT(*) as cached_items,
  SUM(cache_hit_count) as total_hits,
  AVG(cache_hit_count) as avg_hits,
  SUM(file_size) as total_size,
  AVG(generation_time) as avg_generation_time,
  COUNT(CASE WHEN expires_at > datetime('now') THEN 1 END) as active_cache_items
FROM png_cache 
GROUP BY content_type, theme;

-- 初始化现有数据的PNG状态
UPDATE valid_stories SET png_status = 'pending' WHERE png_status IS NULL;
UPDATE valid_heart_voices SET png_status = 'pending' WHERE png_status IS NULL;

-- 完成提示
SELECT 'PNG状态字段和监控表创建完成！' as message;

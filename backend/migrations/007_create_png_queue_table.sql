-- PNG生成队列表
-- 管理PNG生成任务的队列处理

-- 创建PNG生成队列表
CREATE TABLE IF NOT EXISTS png_generation_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 内容信息
  content_type TEXT NOT NULL CHECK (content_type IN ('heart_voice', 'story')),
  content_id INTEGER NOT NULL,
  content_uuid TEXT NOT NULL,
  
  -- 队列管理
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1最高优先级
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- 重试机制
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  
  -- 时间管理
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  scheduled_at DATETIME, -- 计划执行时间（用于重试延迟）
  
  -- 索引
  UNIQUE(content_type, content_id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_png_queue_status_priority ON png_generation_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_png_queue_content ON png_generation_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_queue_scheduled ON png_generation_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_png_queue_updated ON png_generation_queue(updated_at);

-- 创建PNG生成统计表
CREATE TABLE IF NOT EXISTS png_generation_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 统计时间
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  
  -- 统计数据
  total_generated INTEGER DEFAULT 0,
  heart_voice_generated INTEGER DEFAULT 0,
  story_generated INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- 性能指标
  avg_processing_time REAL DEFAULT 0, -- 平均处理时间（秒）
  max_processing_time REAL DEFAULT 0, -- 最大处理时间（秒）
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束
  UNIQUE(date, hour)
);

-- 创建PNG生成统计索引
CREATE INDEX IF NOT EXISTS idx_png_stats_date ON png_generation_stats(date);
CREATE INDEX IF NOT EXISTS idx_png_stats_date_hour ON png_generation_stats(date, hour);

-- 创建PNG生成日志表（用于详细跟踪）
CREATE TABLE IF NOT EXISTS png_generation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联信息
  queue_task_id INTEGER,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  
  -- 操作信息
  action TEXT NOT NULL, -- 'started', 'completed', 'failed', 'retried'
  message TEXT,
  
  -- 性能数据
  processing_time REAL, -- 处理时间（秒）
  generated_cards INTEGER DEFAULT 0,
  
  -- 错误信息
  error_details TEXT,
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键
  FOREIGN KEY (queue_task_id) REFERENCES png_generation_queue(id) ON DELETE CASCADE
);

-- 创建PNG生成日志索引
CREATE INDEX IF NOT EXISTS idx_png_logs_task ON png_generation_logs(queue_task_id);
CREATE INDEX IF NOT EXISTS idx_png_logs_content ON png_generation_logs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_logs_action ON png_generation_logs(action, created_at);

-- 插入初始配置数据
INSERT OR IGNORE INTO png_generation_stats (date, hour, total_generated) 
VALUES (date('now'), strftime('%H', 'now'), 0);

-- 创建触发器：自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_png_queue_timestamp 
AFTER UPDATE ON png_generation_queue
BEGIN
  UPDATE png_generation_queue 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_png_stats_timestamp 
AFTER UPDATE ON png_generation_stats
BEGIN
  UPDATE png_generation_stats 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- 创建视图：队列状态概览
CREATE VIEW IF NOT EXISTS v_png_queue_overview AS
SELECT 
  content_type,
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries,
  MIN(created_at) as oldest_task,
  MAX(created_at) as newest_task
FROM png_generation_queue 
GROUP BY content_type, status;

-- 创建视图：每日PNG生成统计
CREATE VIEW IF NOT EXISTS v_daily_png_stats AS
SELECT 
  date,
  SUM(total_generated) as daily_total,
  SUM(heart_voice_generated) as daily_heart_voices,
  SUM(story_generated) as daily_stories,
  SUM(failed_count) as daily_failures,
  AVG(avg_processing_time) as avg_daily_processing_time,
  MAX(max_processing_time) as max_daily_processing_time
FROM png_generation_stats 
GROUP BY date
ORDER BY date DESC;

-- 完成提示
SELECT 'PNG生成队列系统数据库表创建完成！' as message;

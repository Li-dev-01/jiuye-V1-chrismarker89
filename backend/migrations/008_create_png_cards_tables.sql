-- PNG卡片和下载表
-- 创建PNG卡片存储和下载记录表

-- 创建PNG卡片表
CREATE TABLE IF NOT EXISTS png_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 内容关联
  content_type TEXT NOT NULL CHECK (content_type IN ('heart_voice', 'story')),
  content_id INTEGER NOT NULL,
  
  -- 卡片信息
  card_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'gradient' CHECK (theme IN ('gradient', 'light', 'dark', 'minimal')),
  
  -- 存储信息
  r2_key TEXT NOT NULL,
  download_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  
  -- 生成信息
  generated_by TEXT DEFAULT 'auto',
  generation_time REAL DEFAULT 0, -- 生成耗时（秒）
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  UNIQUE(content_type, content_id, theme)
);

-- 创建PNG下载记录表
CREATE TABLE IF NOT EXISTS png_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联信息
  card_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  
  -- 用户信息
  user_id TEXT,
  session_id TEXT,
  
  -- 请求信息
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  
  -- 下载信息
  download_method TEXT DEFAULT 'direct', -- 'direct', 'redirect', 'stream'
  download_status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
  
  -- 时间戳
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键约束
  FOREIGN KEY (card_id) REFERENCES png_cards(card_id) ON DELETE CASCADE
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_png_cards_content ON png_cards(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_cards_theme ON png_cards(theme);
CREATE INDEX IF NOT EXISTS idx_png_cards_created ON png_cards(created_at);

CREATE INDEX IF NOT EXISTS idx_png_downloads_card ON png_downloads(card_id);
CREATE INDEX IF NOT EXISTS idx_png_downloads_content ON png_downloads(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_downloads_user ON png_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_png_downloads_time ON png_downloads(downloaded_at);

-- 创建触发器：自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_png_cards_timestamp 
AFTER UPDATE ON png_cards
BEGIN
  UPDATE png_cards 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- 创建视图：PNG卡片统计
CREATE VIEW IF NOT EXISTS v_png_cards_stats AS
SELECT 
  content_type,
  theme,
  COUNT(*) as total_cards,
  AVG(generation_time) as avg_generation_time,
  SUM(file_size) as total_file_size,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM png_cards 
GROUP BY content_type, theme;

-- 创建视图：PNG下载统计
CREATE VIEW IF NOT EXISTS v_png_downloads_stats AS
SELECT 
  content_type,
  DATE(downloaded_at) as download_date,
  COUNT(*) as total_downloads,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM png_downloads 
GROUP BY content_type, DATE(downloaded_at)
ORDER BY download_date DESC;

-- 插入测试PNG卡片数据
INSERT OR IGNORE INTO png_cards (
  content_type, content_id, card_id, theme, r2_key, download_url, 
  generated_by, generation_time, created_at
) VALUES 
-- 故事PNG卡片
('story', 1, 'story-1-gradient-test', 'gradient', 'png-cards/story-1-gradient.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/story-1-gradient.png', 
 'test', 2.5, datetime('now')),
('story', 1, 'story-1-light-test', 'light', 'png-cards/story-1-light.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/story-1-light.png', 
 'test', 2.3, datetime('now')),
('story', 2, 'story-2-gradient-test', 'gradient', 'png-cards/story-2-gradient.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/story-2-gradient.png', 
 'test', 2.8, datetime('now')),

-- 心声PNG卡片
('heart_voice', 1, 'heart-voice-1-gradient-test', 'gradient', 'png-cards/heart-voice-1-gradient.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/heart-voice-1-gradient.png', 
 'test', 2.1, datetime('now')),
('heart_voice', 1, 'heart-voice-1-light-test', 'light', 'png-cards/heart-voice-1-light.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/heart-voice-1-light.png', 
 'test', 2.0, datetime('now')),
('heart_voice', 2, 'heart-voice-2-gradient-test', 'gradient', 'png-cards/heart-voice-2-gradient.png', 
 'https://employment-survey-storage.r2.cloudflarestorage.com/png-cards/heart-voice-2-gradient.png', 
 'test', 2.4, datetime('now'));

-- 完成提示
SELECT 'PNG卡片和下载表创建完成，已插入测试数据！' as message;

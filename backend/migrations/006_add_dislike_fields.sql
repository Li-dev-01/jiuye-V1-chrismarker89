-- 为有效数据表添加踩功能字段
-- 支持赞/踩/下载三个核心功能

-- 为有效心声表添加踩字段
ALTER TABLE valid_heart_voices ADD COLUMN dislike_count INTEGER DEFAULT 0;

-- 为有效故事表添加踩字段  
ALTER TABLE valid_stories ADD COLUMN dislike_count INTEGER DEFAULT 0;

-- 为问卷心声表添加踩字段（如果使用新的心声表）
ALTER TABLE questionnaire_heart_voices ADD COLUMN dislike_count INTEGER DEFAULT 0;

-- 创建心声踩记录表
CREATE TABLE IF NOT EXISTS heart_voice_dislikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voice_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  
  UNIQUE(voice_id, user_id),
  FOREIGN KEY (voice_id) REFERENCES valid_heart_voices(id) ON DELETE CASCADE
);

-- 创建故事踩记录表
CREATE TABLE IF NOT EXISTS story_dislikes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  
  UNIQUE(story_id, user_id),
  FOREIGN KEY (story_id) REFERENCES valid_stories(id) ON DELETE CASCADE
);

-- 创建PNG卡片记录表
CREATE TABLE IF NOT EXISTS png_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL CHECK (content_type IN ('heart_voice', 'story')),
  content_id INTEGER NOT NULL,
  card_id TEXT UNIQUE NOT NULL,
  r2_key TEXT NOT NULL,
  download_url TEXT NOT NULL,
  theme TEXT DEFAULT 'gradient',
  file_size INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 复合索引
  UNIQUE(content_type, content_id, theme)
);

-- 创建PNG下载记录表
CREATE TABLE IF NOT EXISTS png_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (card_id) REFERENCES png_cards(card_id) ON DELETE CASCADE
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_heart_voice_dislikes_voice_id ON heart_voice_dislikes(voice_id);
CREATE INDEX IF NOT EXISTS idx_heart_voice_dislikes_user_id ON heart_voice_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_dislikes_story_id ON story_dislikes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_dislikes_user_id ON story_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_png_cards_content ON png_cards(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_png_cards_created_at ON png_cards(created_at);
CREATE INDEX IF NOT EXISTS idx_png_downloads_card_id ON png_downloads(card_id);
CREATE INDEX IF NOT EXISTS idx_png_downloads_downloaded_at ON png_downloads(downloaded_at);

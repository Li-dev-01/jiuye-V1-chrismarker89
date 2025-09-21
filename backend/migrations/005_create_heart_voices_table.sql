-- 创建问卷心声表
-- 用于存储用户在问卷中填写的心声内容，与问卷数据分离

CREATE TABLE IF NOT EXISTS questionnaire_heart_voices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联字段
  questionnaire_response_id INTEGER,
  questionnaire_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 心声内容
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  
  -- 分类和标签
  category TEXT DEFAULT 'employment-feedback',
  tags TEXT, -- JSON格式存储标签数组
  
  -- 情感分析（预留）
  emotion_score REAL,
  emotion_category TEXT, -- positive, negative, neutral
  
  -- 状态管理
  is_public BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active', -- active, hidden, deleted
  
  -- 元数据
  submission_type TEXT DEFAULT 'anonymous', -- anonymous, quick-register, login
  anonymous_nickname TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键约束（如果需要）
  FOREIGN KEY (questionnaire_response_id) REFERENCES universal_questionnaire_responses(id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_heart_voices_user_id ON questionnaire_heart_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_heart_voices_questionnaire_id ON questionnaire_heart_voices(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_heart_voices_category ON questionnaire_heart_voices(category);
CREATE INDEX IF NOT EXISTS idx_heart_voices_created_at ON questionnaire_heart_voices(created_at);
CREATE INDEX IF NOT EXISTS idx_heart_voices_status ON questionnaire_heart_voices(status);
CREATE INDEX IF NOT EXISTS idx_heart_voices_is_public ON questionnaire_heart_voices(is_public);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_heart_voices_public_category ON questionnaire_heart_voices(is_public, category, created_at);
CREATE INDEX IF NOT EXISTS idx_heart_voices_user_questionnaire ON questionnaire_heart_voices(user_id, questionnaire_id);

-- 创建全文搜索索引（SQLite FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS heart_voices_fts USING fts5(
  content,
  category,
  tags,
  content_id UNINDEXED
);

-- 创建触发器：自动更新word_count
CREATE TRIGGER IF NOT EXISTS update_heart_voice_word_count
AFTER INSERT ON questionnaire_heart_voices
BEGIN
  UPDATE questionnaire_heart_voices 
  SET word_count = LENGTH(TRIM(NEW.content)) - LENGTH(REPLACE(TRIM(NEW.content), ' ', '')) + 1
  WHERE id = NEW.id;
END;

-- 创建触发器：自动更新updated_at
CREATE TRIGGER IF NOT EXISTS update_heart_voice_timestamp
AFTER UPDATE ON questionnaire_heart_voices
BEGIN
  UPDATE questionnaire_heart_voices 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- 创建触发器：同步到全文搜索表
CREATE TRIGGER IF NOT EXISTS sync_heart_voice_to_fts
AFTER INSERT ON questionnaire_heart_voices
BEGIN
  INSERT INTO heart_voices_fts(content, category, tags, content_id)
  VALUES (NEW.content, NEW.category, NEW.tags, NEW.id);
END;

-- 创建用户-问卷-心声关联表（可选，用于复杂查询优化）
CREATE TABLE IF NOT EXISTS user_questionnaire_heart_voice_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  questionnaire_response_id INTEGER NOT NULL,
  heart_voice_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, questionnaire_response_id, heart_voice_id),
  FOREIGN KEY (questionnaire_response_id) REFERENCES universal_questionnaire_responses(id),
  FOREIGN KEY (heart_voice_id) REFERENCES questionnaire_heart_voices(id)
);

-- 为关联表创建索引
CREATE INDEX IF NOT EXISTS idx_mapping_user_id ON user_questionnaire_heart_voice_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_mapping_questionnaire_id ON user_questionnaire_heart_voice_mapping(questionnaire_response_id);
CREATE INDEX IF NOT EXISTS idx_mapping_heart_voice_id ON user_questionnaire_heart_voice_mapping(heart_voice_id);

-- 为心声表添加缺失的列

-- 为 raw_heart_voices 表添加缺失的列
ALTER TABLE raw_heart_voices ADD COLUMN category TEXT;
ALTER TABLE raw_heart_voices ADD COLUMN emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5);
ALTER TABLE raw_heart_voices ADD COLUMN tags TEXT; -- JSON as TEXT
ALTER TABLE raw_heart_voices ADD COLUMN is_anonymous BOOLEAN DEFAULT 1;
ALTER TABLE raw_heart_voices ADD COLUMN questionnaire_id TEXT;
ALTER TABLE raw_heart_voices ADD COLUMN ip_address TEXT;

-- 为 valid_heart_voices 表添加缺失的列
ALTER TABLE valid_heart_voices ADD COLUMN category TEXT;
ALTER TABLE valid_heart_voices ADD COLUMN emotion_score INTEGER CHECK (emotion_score >= 1 AND emotion_score <= 5);
ALTER TABLE valid_heart_voices ADD COLUMN tags TEXT; -- JSON as TEXT
ALTER TABLE valid_heart_voices ADD COLUMN is_anonymous BOOLEAN DEFAULT 1;
ALTER TABLE valid_heart_voices ADD COLUMN is_featured BOOLEAN DEFAULT 0;
ALTER TABLE valid_heart_voices ADD COLUMN author_name TEXT DEFAULT '匿名用户';
ALTER TABLE valid_heart_voices ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE valid_heart_voices ADD COLUMN dislike_count INTEGER DEFAULT 0;
ALTER TABLE valid_heart_voices ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE valid_heart_voices ADD COLUMN png_status TEXT DEFAULT 'none' CHECK (png_status IN ('none', 'pending', 'completed', 'failed'));

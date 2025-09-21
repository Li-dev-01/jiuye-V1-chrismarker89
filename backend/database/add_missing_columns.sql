-- 添加缺失的列到valid_stories表

-- 添加PNG状态列
ALTER TABLE valid_stories ADD COLUMN png_status TEXT DEFAULT 'pending';

-- 添加浏览次数列
ALTER TABLE valid_stories ADD COLUMN view_count INTEGER DEFAULT 0;

-- 添加点赞次数列
ALTER TABLE valid_stories ADD COLUMN like_count INTEGER DEFAULT 0;

-- 添加发布时间列
ALTER TABLE valid_stories ADD COLUMN published_at DATETIME;

-- 添加是否精选列
ALTER TABLE valid_stories ADD COLUMN is_featured INTEGER DEFAULT 0;

-- 添加分类列
ALTER TABLE valid_stories ADD COLUMN category TEXT DEFAULT 'general';

-- 添加标签列（JSON格式）
ALTER TABLE valid_stories ADD COLUMN tags TEXT DEFAULT '[]';

-- 添加作者名称列
ALTER TABLE valid_stories ADD COLUMN author_name TEXT DEFAULT '匿名用户';

-- 添加不喜欢次数列
ALTER TABLE valid_stories ADD COLUMN dislike_count INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_valid_stories_published_at ON valid_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_featured ON valid_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_valid_stories_category ON valid_stories(category);
CREATE INDEX IF NOT EXISTS idx_valid_stories_view_count ON valid_stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_like_count ON valid_stories(like_count DESC);

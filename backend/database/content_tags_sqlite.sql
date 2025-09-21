-- SQLite 内容标签表初始化脚本
-- 适用于 Cloudflare D1

-- 内容标签管理表
CREATE TABLE IF NOT EXISTS content_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_key TEXT NOT NULL UNIQUE,
    tag_name TEXT NOT NULL,
    tag_name_en TEXT,
    description TEXT,
    tag_type TEXT DEFAULT 'system' CHECK (tag_type IN ('system', 'user', 'auto')),
    color TEXT DEFAULT '#1890ff',
    usage_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    content_type TEXT DEFAULT 'all' CHECK (content_type IN ('story', 'heart_voice', 'questionnaire', 'all')),
    admin_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 内容标签关联表
CREATE TABLE IF NOT EXISTS content_tag_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'heart_voice', 'questionnaire')),
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
    UNIQUE(content_id, content_type, tag_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_content_tags_key ON content_tags(tag_key);
CREATE INDEX IF NOT EXISTS idx_content_tags_type ON content_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_content_tags_content_type ON content_tags(content_type);
CREATE INDEX IF NOT EXISTS idx_content_tags_usage_count ON content_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_tags_active ON content_tags(is_active);

CREATE INDEX IF NOT EXISTS idx_tag_relations_content ON content_tag_relations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON content_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_type ON content_tag_relations(content_type);

-- 插入默认标签数据
INSERT OR REPLACE INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type) VALUES
-- 故事墙标签
('job-hunting', '求职经历', 'Job Hunting', '分享求职过程中的经历和感悟', 'system', '#1890ff', 'story'),
('career-change', '转行经历', 'Career Change', '职业转换和行业跳转的经历', 'system', '#52c41a', 'story'),
('entrepreneurship', '创业故事', 'Entrepreneurship', '创业过程中的故事和经验', 'system', '#fa8c16', 'story'),
('workplace-life', '职场生活', 'Workplace Life', '日常工作和职场生活的分享', 'system', '#722ed1', 'story'),
('skill-growth', '技能成长', 'Skill Growth', '专业技能学习和成长经历', 'system', '#13c2c2', 'story'),

-- 心声标签
('experience', '经验分享', 'Experience', '个人经验和心得体会', 'system', '#1890ff', 'heart_voice'),
('advice', '建议意见', 'Advice', '给他人的建议和意见', 'system', '#52c41a', 'heart_voice'),
('encouragement', '鼓励支持', 'Encouragement', '鼓励和支持他人的话语', 'system', '#fa8c16', 'heart_voice'),
('reflection', '反思感悟', 'Reflection', '对生活和工作的反思', 'system', '#722ed1', 'heart_voice'),
('gratitude', '感谢感恩', 'Gratitude', '表达感谢和感恩的心声', 'system', '#eb2f96', 'heart_voice'),

-- 通用标签
('urgent', '紧急', 'Urgent', '需要紧急关注的内容', 'system', '#ff4d4f', 'all'),
('featured', '精选', 'Featured', '精选推荐内容', 'system', '#fadb14', 'all'),
('popular', '热门', 'Popular', '热门内容', 'system', '#f759ab', 'all');

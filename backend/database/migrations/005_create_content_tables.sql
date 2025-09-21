-- Migration: 005_create_content_tables
-- Description: 创建内容管理表 (故事墙、问卷心声)
-- Created: 2024-01-27

-- 故事墙表
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('job_search', 'career_change', 'success', 'challenge', 'advice') DEFAULT 'job_search',
    tags JSON,
    
    -- 互动数据
    likes_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    
    -- 状态管理
    status ENUM('draft', 'published', 'hidden', 'deleted') DEFAULT 'draft',
    is_anonymous BOOLEAN DEFAULT true,
    
    -- 审核
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderator_id UUID,
    moderation_notes TEXT,
    moderated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 问卷心声表
CREATE TABLE IF NOT EXISTS voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    content TEXT NOT NULL,
    mood ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    
    -- 互动数据
    likes_count INT DEFAULT 0,
    
    -- 状态管理
    status ENUM('published', 'hidden', 'deleted') DEFAULT 'published',
    is_anonymous BOOLEAN DEFAULT true,
    
    -- 审核
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderator_id UUID,
    moderated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
-- 故事墙索引
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_category ON stories(category);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_moderation_status ON stories(moderation_status);
CREATE INDEX idx_stories_published_at ON stories(published_at);
CREATE INDEX idx_stories_likes_count ON stories(likes_count DESC);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- 问卷心声索引
CREATE INDEX idx_voices_user_id ON voices(user_id);
CREATE INDEX idx_voices_mood ON voices(mood);
CREATE INDEX idx_voices_status ON voices(status);
CREATE INDEX idx_voices_moderation_status ON voices(moderation_status);
CREATE INDEX idx_voices_created_at ON voices(created_at DESC);
CREATE INDEX idx_voices_likes_count ON voices(likes_count DESC);

-- 全文搜索索引
CREATE FULLTEXT INDEX idx_stories_content ON stories(title, content);
CREATE FULLTEXT INDEX idx_voices_content ON voices(content);

-- 内容标签管理表
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_key VARCHAR(50) UNIQUE NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_name_en VARCHAR(100),
    description TEXT,
    tag_type ENUM('system', 'user', 'auto') DEFAULT 'system',
    color VARCHAR(20) DEFAULT '#1890ff',
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    content_type ENUM('story', 'heart_voice', 'questionnaire', 'all') DEFAULT 'all',
    admin_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 内容标签关联表
CREATE TABLE IF NOT EXISTS content_tag_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type ENUM('story', 'heart_voice', 'questionnaire') NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_tag (content_id, content_type, tag_id)
);

-- 标签管理索引
CREATE INDEX idx_content_tags_key ON content_tags(tag_key);
CREATE INDEX idx_content_tags_type ON content_tags(tag_type);
CREATE INDEX idx_content_tags_content_type ON content_tags(content_type);
CREATE INDEX idx_content_tags_usage_count ON content_tags(usage_count DESC);
CREATE INDEX idx_content_tags_active ON content_tags(is_active);

-- 标签关联索引
CREATE INDEX idx_tag_relations_content ON content_tag_relations(content_id, content_type);
CREATE INDEX idx_tag_relations_tag ON content_tag_relations(tag_id);
CREATE INDEX idx_tag_relations_type ON content_tag_relations(content_type);

-- 分级审核系统表结构

-- 审核级别配置表
CREATE TABLE IF NOT EXISTS audit_level_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level ENUM('level1', 'level2', 'level3') NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- 规则配置
    rule_strictness DECIMAL(2,1) DEFAULT 1.0,
    ai_threshold DECIMAL(3,2) DEFAULT 0.5,
    manual_review_ratio DECIMAL(3,2) DEFAULT 0.1,

    -- 规则启用状态
    enabled_categories JSON,
    disabled_rules JSON,

    -- 性能配置
    max_processing_time_ms INT DEFAULT 100,
    batch_size INT DEFAULT 10,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_level_config (level, is_active)
);

-- 审核级别历史记录表
CREATE TABLE IF NOT EXISTS audit_level_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_level ENUM('level1', 'level2', 'level3'),
    to_level ENUM('level1', 'level2', 'level3') NOT NULL,
    trigger_reason VARCHAR(200),
    trigger_data JSON,
    switched_by ENUM('auto', 'manual') DEFAULT 'auto',
    admin_id UUID,
    switched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_level_history_time (switched_at),
    INDEX idx_level_history_level (to_level, switched_at)
);

-- 实时统计表
CREATE TABLE IF NOT EXISTS audit_realtime_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_window TIMESTAMP NOT NULL,

    total_submissions INT DEFAULT 0,
    violation_count INT DEFAULT 0,
    violation_rate DECIMAL(4,3) DEFAULT 0.0,

    spam_count INT DEFAULT 0,
    coordinated_ips JSON,

    manual_review_queue_size INT DEFAULT 0,
    ai_review_count INT DEFAULT 0,
    auto_approved_count INT DEFAULT 0,
    auto_rejected_count INT DEFAULT 0,

    current_audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_time_window (time_window),
    INDEX idx_stats_time (time_window),
    INDEX idx_stats_level (current_audit_level, time_window)
);

-- 扩展现有audit_records表
ALTER TABLE audit_records
ADD COLUMN IF NOT EXISTS violation_categories JSON,
ADD COLUMN IF NOT EXISTS rule_hits JSON,
ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS audit_level ENUM('level1', 'level2', 'level3') DEFAULT 'level1';

-- 插入默认审核级别配置
INSERT INTO audit_level_configs (level, config_name, description, rule_strictness, ai_threshold, manual_review_ratio, enabled_categories) VALUES
('level1', '一级审核 (宽松)', '正常运营期，注重用户体验', 0.8, 0.3, 0.05, '["POL", "POR", "VIO", "PRI"]'),
('level2', '二级审核 (标准)', '内容质量下降，平衡审核', 1.0, 0.5, 0.15, '["POL", "POR", "VIO", "ADV", "PRI", "DIS"]'),
('level3', '三级审核 (严格)', '恶意攻击期，严格把控', 1.2, 0.7, 0.30, '["POL", "POR", "VIO", "ADV", "PRI", "DIS", "OTH"]');

-- 插入默认标签数据
INSERT INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type) VALUES
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

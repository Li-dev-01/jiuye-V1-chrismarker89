-- 修复故事表结构和数据
-- 创建时间: 2025-09-21
-- 目的: 解决前端故事页面500错误问题

-- =====================================================
-- 1. 创建原始故事提交表
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_story_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]', -- JSON数组
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_status TEXT DEFAULT 'completed',
    ip_address TEXT,
    user_agent TEXT
);

-- =====================================================
-- 2. 创建有效故事表
-- =====================================================
CREATE TABLE IF NOT EXISTS valid_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id INTEGER,
    data_uuid TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]', -- JSON数组
    author_name TEXT DEFAULT '匿名用户',
    
    -- 审核状态
    audit_status TEXT DEFAULT 'approved',
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 互动数据
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- 发布状态
    is_featured INTEGER DEFAULT 0,
    published_at DATETIME,
    
    -- PNG状态
    png_status TEXT DEFAULT 'pending',
    png_generated_at DATETIME,
    png_themes_generated TEXT DEFAULT '[]',
    png_generation_attempts INTEGER DEFAULT 0,
    png_last_error TEXT,
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (raw_id) REFERENCES raw_story_submissions(id)
);

-- =====================================================
-- 3. 创建索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_valid_stories_audit_status ON valid_stories(audit_status);
CREATE INDEX IF NOT EXISTS idx_valid_stories_approved_at ON valid_stories(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_like_count ON valid_stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_view_count ON valid_stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_valid_stories_category ON valid_stories(category);
CREATE INDEX IF NOT EXISTS idx_valid_stories_featured ON valid_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_valid_stories_published_at ON valid_stories(published_at DESC);

-- =====================================================
-- 4. 插入测试数据
-- =====================================================

-- 插入原始故事数据
INSERT OR REPLACE INTO raw_story_submissions (id, data_uuid, user_id, title, content, category, tags, submitted_at, raw_status) VALUES
(1, 'story-uuid-001', 'user-001', '我的第一份工作经历', '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。', 'job_search', '["求职经历", "新手"]', datetime('now', '-29 days'), 'completed'),
(2, 'story-uuid-002', 'user-002', '转行程序员的心路历程', '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。', 'career_change', '["转行", "程序员"]', datetime('now', '-24 days'), 'completed'),
(3, 'story-uuid-003', 'user-003', '创业失败后的反思', '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。', 'entrepreneurship', '["创业", "反思"]', datetime('now', '-19 days'), 'completed'),
(4, 'story-uuid-004', 'user-004', '职场新人的成长之路', '刚进入职场时，我什么都不懂，经常犯错。但是在同事和领导的帮助下，我逐渐适应了工作节奏，学会了很多实用的技能。现在回想起来，那段迷茫的时光也是很宝贵的成长经历。', 'workplace_life', '["职场新人", "成长"]', datetime('now', '-14 days'), 'completed'),
(5, 'story-uuid-005', 'user-005', '远程工作的利与弊', '疫情期间开始远程工作，一开始觉得很自由，但后来发现也有很多挑战。比如沟通效率降低、工作与生活界限模糊等。不过总的来说，远程工作让我学会了更好地管理时间和自我驱动。', 'workplace_life', '["远程工作", "经验分享"]', datetime('now', '-9 days'), 'completed'),
(6, 'story-uuid-006', 'user-006', '考研还是工作的选择', '大四时面临考研还是直接工作的选择，经过深思熟虑，我选择了先工作积累经验。虽然有时会想如果考研会怎样，但我不后悔自己的选择，因为工作让我更快地了解了社会和自己。', 'career_planning', '["考研", "工作选择"]', datetime('now', '-4 days'), 'completed');

-- 插入有效故事数据
INSERT OR REPLACE INTO valid_stories (
    id, raw_id, data_uuid, user_id, title, content, category, tags, author_name,
    audit_status, approved_at, like_count, dislike_count, view_count, is_featured, published_at
) VALUES
(1, 1, 'story-uuid-001', 'user-001', '我的第一份工作经历', '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。', 'job_search', '["求职经历", "新手"]', '小李同学', 'approved', datetime('now', '-29 days'), 156, 3, 1245, 1, datetime('now', '-29 days')),
(2, 2, 'story-uuid-002', 'user-002', '转行程序员的心路历程', '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。', 'career_change', '["转行", "程序员"]', '转行小王', 'approved', datetime('now', '-24 days'), 234, 5, 1876, 0, datetime('now', '-24 days')),
(3, 3, 'story-uuid-003', 'user-003', '创业失败后的反思', '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。', 'entrepreneurship', '["创业", "反思"]', '创业者张三', 'approved', datetime('now', '-19 days'), 189, 8, 1432, 0, datetime('now', '-19 days')),
(4, 4, 'story-uuid-004', 'user-004', '职场新人的成长之路', '刚进入职场时，我什么都不懂，经常犯错。但是在同事和领导的帮助下，我逐渐适应了工作节奏，学会了很多实用的技能。现在回想起来，那段迷茫的时光也是很宝贵的成长经历。', 'workplace_life', '["职场新人", "成长"]', '职场萌新', 'approved', datetime('now', '-14 days'), 98, 2, 876, 0, datetime('now', '-14 days')),
(5, 5, 'story-uuid-005', 'user-005', '远程工作的利与弊', '疫情期间开始远程工作，一开始觉得很自由，但后来发现也有很多挑战。比如沟通效率降低、工作与生活界限模糊等。不过总的来说，远程工作让我学会了更好地管理时间和自我驱动。', 'workplace_life', '["远程工作", "经验分享"]', '远程工作者', 'approved', datetime('now', '-9 days'), 267, 4, 2103, 1, datetime('now', '-9 days')),
(6, 6, 'story-uuid-006', 'user-006', '考研还是工作的选择', '大四时面临考研还是直接工作的选择，经过深思熟虑，我选择了先工作积累经验。虽然有时会想如果考研会怎样，但我不后悔自己的选择，因为工作让我更快地了解了社会和自己。', 'career_planning', '["考研", "工作选择"]', '选择困难户', 'approved', datetime('now', '-4 days'), 145, 1, 987, 0, datetime('now', '-4 days'));

-- =====================================================
-- 5. 创建管理员内容标签表（如果不存在）
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_content_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name TEXT UNIQUE NOT NULL,
    tag_category TEXT DEFAULT 'general',
    tag_color TEXT DEFAULT '#1890ff',
    usage_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些默认标签
INSERT OR REPLACE INTO admin_content_tags (tag_name, tag_category, tag_color, usage_count) VALUES
('求职经历', 'job_search', '#52c41a', 15),
('面试技巧', 'job_search', '#1890ff', 8),
('简历制作', 'job_search', '#722ed1', 6),
('转行', 'career_change', '#fa8c16', 12),
('程序员', 'career_change', '#13c2c2', 10),
('创业', 'entrepreneurship', '#eb2f96', 7),
('反思', 'personal_growth', '#f5222d', 9),
('职场新人', 'workplace_life', '#52c41a', 11),
('成长', 'personal_growth', '#faad14', 14),
('远程工作', 'workplace_life', '#1890ff', 5),
('经验分享', 'general', '#722ed1', 18),
('考研', 'education', '#fa541c', 4),
('工作选择', 'career_planning', '#13c2c2', 6);

-- 完成提示
SELECT '故事表结构修复完成！已插入测试数据。' as message;

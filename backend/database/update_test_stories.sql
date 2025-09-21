-- 更新测试故事数据，添加缺失字段

-- 更新现有故事的缺失字段
UPDATE valid_stories SET 
    published_at = datetime('now', '-29 days'),
    view_count = 156,
    like_count = 23,
    is_featured = 1,
    category = 'job_search',
    tags = '["求职经历", "新手"]',
    author_name = '小李同学'
WHERE id = 1;

UPDATE valid_stories SET 
    published_at = datetime('now', '-24 days'),
    view_count = 234,
    like_count = 45,
    is_featured = 0,
    category = 'career_change',
    tags = '["转行", "程序员"]',
    author_name = '转行小王'
WHERE id = 2;

UPDATE valid_stories SET 
    published_at = datetime('now', '-19 days'),
    view_count = 189,
    like_count = 32,
    is_featured = 0,
    category = 'entrepreneurship',
    tags = '["创业", "反思"]',
    author_name = '创业者张三'
WHERE id = 3;

UPDATE valid_stories SET 
    published_at = datetime('now', '-14 days'),
    view_count = 98,
    like_count = 18,
    is_featured = 0,
    category = 'workplace_life',
    tags = '["职场新人", "成长"]',
    author_name = '职场萌新'
WHERE id = 4;

UPDATE valid_stories SET 
    published_at = datetime('now', '-9 days'),
    view_count = 267,
    like_count = 56,
    is_featured = 1,
    category = 'workplace_life',
    tags = '["远程工作", "经验分享"]',
    author_name = '远程工作者'
WHERE id = 5;

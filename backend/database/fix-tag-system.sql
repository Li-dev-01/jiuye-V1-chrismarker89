-- 修复标签系统的完整SQL脚本
-- 目标：建立正确的标签关联系统，支持前端筛选功能

-- 1. 创建标签关联表（如果不存在）
CREATE TABLE IF NOT EXISTS content_tag_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'heart_voice', 'questionnaire')),
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
  UNIQUE(content_id, content_type, tag_id)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_tag_relations_content ON content_tag_relations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON content_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_type ON content_tag_relations(content_type);

-- 3. 更新现有标签数据，增加更多标签
INSERT OR IGNORE INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type, usage_count) VALUES
-- 就业状态标签
('employed', '已就业', 'Employed', '已经找到工作的毕业生', 'system', '#52c41a', 'story', 0),
('job_seeking', '求职中', 'Job Seeking', '正在寻找工作的毕业生', 'system', '#1890ff', 'story', 0),
('further_study', '继续深造', 'Further Study', '选择继续学习深造', 'system', '#722ed1', 'story', 0),
('startup', '创业中', 'Startup', '选择自主创业', 'system', '#fa8c16', 'story', 0),
('undecided', '待定中', 'Undecided', '还在考虑中的毕业生', 'system', '#faad14', 'story', 0),

-- 专业领域标签
('computer_science', '计算机类', 'Computer Science', '计算机相关专业', 'system', '#13c2c2', 'story', 0),
('economics_management', '经济管理', 'Economics & Management', '经济管理类专业', 'system', '#eb2f96', 'story', 0),
('engineering', '工程技术', 'Engineering', '工程技术类专业', 'system', '#f5222d', 'story', 0),
('liberal_arts', '文科类', 'Liberal Arts', '文科类专业', 'system', '#a0d911', 'story', 0),
('science', '理科类', 'Science', '理科类专业', 'system', '#2f54eb', 'story', 0),
('medicine', '医学类', 'Medicine', '医学相关专业', 'system', '#ff7a45', 'story', 0),
('education', '教育类', 'Education', '教育相关专业', 'system', '#36cfc9', 'story', 0),
('arts', '艺术类', 'Arts', '艺术相关专业', 'system', '#b37feb', 'story', 0),

-- 地区标签
('tier1_city', '一线城市', 'Tier 1 City', '北上广深等一线城市', 'system', '#ff4d4f', 'story', 0),
('tier2_city', '二线城市', 'Tier 2 City', '省会城市等二线城市', 'system', '#1890ff', 'story', 0),
('tier3_city', '三四线城市', 'Tier 3/4 City', '三四线城市', 'system', '#52c41a', 'story', 0),
('hometown', '回乡就业', 'Hometown Employment', '回到家乡工作', 'system', '#faad14', 'story', 0),
('overseas', '海外发展', 'Overseas', '海外工作或发展', 'system', '#722ed1', 'story', 0),

-- 故事类型标签
('interview_exp', '面试经历', 'Interview Experience', '面试相关经历', 'system', '#fa541c', 'story', 0),
('internship_exp', '实习体验', 'Internship Experience', '实习相关体验', 'system', '#13c2c2', 'story', 0),
('career_planning', '职业规划', 'Career Planning', '职业规划相关', 'system', '#722ed1', 'story', 0),
('workplace_adapt', '职场适应', 'Workplace Adaptation', '职场适应相关', 'system', '#52c41a', 'story', 0),
('skill_improve', '技能提升', 'Skill Improvement', '技能学习和提升', 'system', '#1890ff', 'story', 0),
('campus_life', '校园生活', 'Campus Life', '校园生活回忆', 'system', '#faad14', 'story', 0),

-- 经验分享标签
('experience_share', '经验分享', 'Experience Sharing', '经验分享类故事', 'system', '#fa8c16', 'story', 0),
('job_tips', '求职心得', 'Job Hunting Tips', '求职心得和技巧', 'system', '#1890ff', 'story', 0),
('work_insights', '职场感悟', 'Work Insights', '职场感悟和体会', 'system', '#722ed1', 'story', 0),
('learning_growth', '学习成长', 'Learning & Growth', '学习成长经历', 'system', '#52c41a', 'story', 0),
('life_insights', '人生感悟', 'Life Insights', '人生感悟和思考', 'system', '#eb2f96', 'story', 0);

-- 4. 基于现有故事的标签和分类，创建标签关联
-- 首先，为每个故事根据其JSON标签创建关联关系

-- 处理"已就业"标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'employed'
WHERE vs.tags LIKE '%已就业%';

-- 处理"求职中"标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'job_seeking'
WHERE vs.tags LIKE '%求职中%';

-- 处理"继续深造"标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'further_study'
WHERE vs.tags LIKE '%继续深造%';

-- 处理"创业中"标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'startup'
WHERE vs.tags LIKE '%创业中%';

-- 处理专业领域标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'computer_science'
WHERE vs.tags LIKE '%计算机类%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'economics_management'
WHERE vs.tags LIKE '%经济管理%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'engineering'
WHERE vs.tags LIKE '%工程技术%';

-- 处理地区标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'tier1_city'
WHERE vs.tags LIKE '%一线城市%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'tier2_city'
WHERE vs.tags LIKE '%二线城市%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'hometown'
WHERE vs.tags LIKE '%回乡就业%';

-- 处理故事类型标签
INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'interview_exp'
WHERE vs.tags LIKE '%面试经历%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'internship_exp'
WHERE vs.tags LIKE '%实习体验%';

INSERT OR IGNORE INTO content_tag_relations (content_id, content_type, tag_id)
SELECT 
  vs.data_uuid,
  'story',
  ct.id
FROM valid_stories vs
JOIN content_tags ct ON ct.tag_key = 'skill_improve'
WHERE vs.tags LIKE '%技能提升%';

-- 5. 更新标签使用计数
UPDATE content_tags 
SET usage_count = (
  SELECT COUNT(*) 
  FROM content_tag_relations 
  WHERE tag_id = content_tags.id
);

-- 6. 验证标签关联结果
SELECT 
  'Tag Relations Summary' as info,
  COUNT(*) as total_relations,
  COUNT(DISTINCT content_id) as stories_with_tags,
  COUNT(DISTINCT tag_id) as tags_used
FROM content_tag_relations 
WHERE content_type = 'story';

-- 按标签统计使用情况
SELECT 
  ct.tag_name,
  ct.tag_key,
  COUNT(ctr.id) as usage_count,
  ct.color
FROM content_tags ct
LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id AND ctr.content_type = 'story'
WHERE ct.content_type IN ('story', 'all')
GROUP BY ct.id, ct.tag_name, ct.tag_key, ct.color
ORDER BY usage_count DESC, ct.tag_name;

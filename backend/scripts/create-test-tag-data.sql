-- 创建测试标签数据
-- 用于验证标签系统功能

-- 插入额外的测试标签
INSERT INTO content_tags (tag_key, tag_name, tag_name_en, description, tag_type, color, content_type) VALUES
-- 行业相关标签
('tech-industry', '科技行业', 'Technology', 'IT和科技相关工作', 'system', '#1890ff', 'story'),
('finance-industry', '金融行业', 'Finance', '银行、证券、保险等金融领域', 'system', '#52c41a', 'story'),
('education-industry', '教育行业', 'Education', '教育培训相关工作', 'system', '#fa8c16', 'story'),
('healthcare-industry', '医疗行业', 'Healthcare', '医疗健康相关工作', 'system', '#722ed1', 'story'),

-- 技能相关标签
('programming', '编程开发', 'Programming', '软件开发和编程技能', 'system', '#13c2c2', 'story'),
('design', '设计创意', 'Design', '视觉设计和创意工作', 'system', '#eb2f96', 'story'),
('marketing', '市场营销', 'Marketing', '市场推广和营销工作', 'system', '#fadb14', 'story'),
('management', '管理岗位', 'Management', '团队管理和项目管理', 'system', '#f759ab', 'story'),

-- 心声情感标签
('anxiety', '焦虑困惑', 'Anxiety', '表达焦虑和困惑的心声', 'system', '#ff7875', 'heart_voice'),
('hope', '希望憧憬', 'Hope', '对未来的希望和憧憬', 'system', '#95de64', 'heart_voice'),
('struggle', '奋斗拼搏', 'Struggle', '努力奋斗的经历', 'system', '#ffc069', 'heart_voice'),
('success', '成功喜悦', 'Success', '成功和喜悦的分享', 'system', '#87e8de', 'heart_voice'),

-- 地区相关标签
('beijing', '北京', 'Beijing', '北京地区相关', 'system', '#1890ff', 'all'),
('shanghai', '上海', 'Shanghai', '上海地区相关', 'system', '#52c41a', 'all'),
('guangzhou', '广州', 'Guangzhou', '广州地区相关', 'system', '#fa8c16', 'all'),
('shenzhen', '深圳', 'Shenzhen', '深圳地区相关', 'system', '#722ed1', 'all');

-- 创建一些测试关联数据（假设已有story和heart_voice数据）
-- 注意：这里需要根据实际的content_id来调整

-- 模拟为故事添加标签关联
-- INSERT INTO content_tag_relations (id, content_id, content_type, tag_id)
-- SELECT 
--     gen_random_uuid(),
--     s.id,
--     'story',
--     ct.id
-- FROM stories s
-- CROSS JOIN content_tags ct
-- WHERE ct.content_type IN ('story', 'all')
-- AND RANDOM() % 3 = 0  -- 随机为1/3的故事添加标签
-- LIMIT 100;

-- 更新标签使用次数
UPDATE content_tags SET usage_count = (
    SELECT COUNT(*) 
    FROM content_tag_relations 
    WHERE tag_id = content_tags.id
);

-- 验证测试数据
SELECT 
    ct.tag_name,
    ct.content_type,
    ct.usage_count,
    COUNT(ctr.id) as actual_relations
FROM content_tags ct
LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
GROUP BY ct.id
ORDER BY ct.content_type, ct.tag_name;

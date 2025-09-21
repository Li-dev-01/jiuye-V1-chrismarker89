-- 测试故事数据
-- 为Stories页面添加测试数据

-- 插入测试原始故事
INSERT OR REPLACE INTO raw_story_submissions (data_uuid, user_id, title, content, submitted_at) VALUES
('story-uuid-001', 'user-001', '我的第一份工作经历', '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。', datetime('now', '-30 days')),
('story-uuid-002', 'user-002', '转行程序员的心路历程', '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。', datetime('now', '-25 days')),
('story-uuid-003', 'user-003', '创业失败后的反思', '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。', datetime('now', '-20 days')),
('story-uuid-004', 'user-004', '职场新人的成长故事', '刚入职时什么都不懂，经常犯错误，感觉压力很大。幸好有同事和领导的耐心指导，慢慢地我开始适应工作节奏，技能也在不断提升。现在已经能够独当一面了。', datetime('now', '-15 days')),
('story-uuid-005', 'user-005', '远程工作的体验分享', '疫情期间开始远程工作，一开始很不适应，缺乏面对面的交流。但慢慢发现远程工作也有很多优势，比如节省通勤时间、工作环境更舒适等。关键是要有良好的自律性和沟通能力。', datetime('now', '-10 days'));

-- 插入对应的有效故事
INSERT OR REPLACE INTO valid_stories (raw_id, data_uuid, user_id, title, content, approved_at, audit_status) VALUES
(1, 'story-uuid-001', 'user-001', '我的第一份工作经历', '刚毕业时找工作真的很困难，投了上百份简历才收到几个面试邀请。但是通过这个过程，我学会了如何更好地展示自己，也明白了坚持的重要性。现在回想起来，那段经历虽然艰难，但让我成长了很多。', datetime('now', '-29 days'), 'approved'),
(2, 'story-uuid-002', 'user-002', '转行程序员的心路历程', '从传统行业转到IT行业并不容易，需要重新学习很多技术知识。我花了一年时间自学编程，参加了培训班，最终成功转行。虽然起薪不高，但我相信通过努力可以获得更好的发展。', datetime('now', '-24 days'), 'approved'),
(3, 'story-uuid-003', 'user-003', '创业失败后的反思', '第一次创业失败了，损失了所有积蓄。但这次经历让我学到了很多宝贵的经验，包括市场调研的重要性、团队管理的技巧等。现在我在一家公司工作，积累经验，为下次创业做准备。', datetime('now', '-19 days'), 'approved'),
(4, 'story-uuid-004', 'user-004', '职场新人的成长故事', '刚入职时什么都不懂，经常犯错误，感觉压力很大。幸好有同事和领导的耐心指导，慢慢地我开始适应工作节奏，技能也在不断提升。现在已经能够独当一面了。', datetime('now', '-14 days'), 'approved'),
(5, 'story-uuid-005', 'user-005', '远程工作的体验分享', '疫情期间开始远程工作，一开始很不适应，缺乏面对面的交流。但慢慢发现远程工作也有很多优势，比如节省通勤时间、工作环境更舒适等。关键是要有良好的自律性和沟通能力。', datetime('now', '-9 days'), 'approved');

-- 插入审核记录
INSERT OR REPLACE INTO audit_records (content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at) VALUES
('story', 1, 'story-uuid-001', 'user-001', 'approved', 'reviewer-001', '内容积极正面，符合平台规范', datetime('now', '-29 days')),
('story', 2, 'story-uuid-002', 'user-002', 'approved', 'reviewer-001', '转行经历分享，对其他用户有参考价值', datetime('now', '-24 days')),
('story', 3, 'story-uuid-003', 'user-003', 'approved', 'reviewer-001', '创业反思，内容真实有价值', datetime('now', '-19 days')),
('story', 4, 'story-uuid-004', 'user-004', 'approved', 'reviewer-001', '职场成长故事，内容健康', datetime('now', '-14 days')),
('story', 5, 'story-uuid-005', 'user-005', 'approved', 'reviewer-001', '远程工作经验分享，内容有用', datetime('now', '-9 days'));

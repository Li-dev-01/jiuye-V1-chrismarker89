-- 测试数据插入脚本
-- 为前端页面提供可见的测试数据

-- =====================================================
-- 1. 插入测试用户
-- =====================================================
INSERT OR REPLACE INTO universal_users (uuid, user_type, username, display_name, role, status, created_at) VALUES
('user-001', 'semi_anonymous', 'test_user_001', '张三', 'user', 'active', '2024-01-15 10:00:00'),
('user-002', 'semi_anonymous', 'test_user_002', '李四', 'user', 'active', '2024-01-16 11:00:00'),
('user-003', 'semi_anonymous', 'test_user_003', '王五', 'user', 'active', '2024-01-17 12:00:00'),
('user-004', 'anonymous', NULL, '匿名用户A', 'user', 'active', '2024-01-18 13:00:00'),
('user-005', 'anonymous', NULL, '匿名用户B', 'user', 'active', '2024-01-19 14:00:00'),
('admin-001', 'admin', 'admin', '系统管理员', 'admin', 'active', '2024-01-01 09:00:00'),
('reviewer-001', 'reviewer', 'reviewer', '内容审核员', 'reviewer', 'active', '2024-01-01 09:00:00');

-- =====================================================
-- 2. 插入问卷回答数据
-- =====================================================
INSERT OR REPLACE INTO universal_questionnaire_responses (
    response_uuid, user_uuid, form_data, completion_status, submitted_at, audit_status
) VALUES
('resp-001', 'user-001', '{"university":"北京大学","major":"计算机科学","graduation_year":"2024","employment_status":"已就业","salary_range":"8000-12000","job_satisfaction":4}', 'completed', '2024-01-15 15:00:00', 'approved'),
('resp-002', 'user-002', '{"university":"清华大学","major":"软件工程","graduation_year":"2024","employment_status":"已就业","salary_range":"12000-18000","job_satisfaction":5}', 'completed', '2024-01-16 16:00:00', 'approved'),
('resp-003', 'user-003', '{"university":"复旦大学","major":"数据科学","graduation_year":"2024","employment_status":"求职中","salary_range":"","job_satisfaction":3}', 'completed', '2024-01-17 17:00:00', 'approved'),
('resp-004', 'user-004', '{"university":"上海交通大学","major":"人工智能","graduation_year":"2024","employment_status":"已就业","salary_range":"15000-20000","job_satisfaction":4}', 'completed', '2024-01-18 18:00:00', 'approved'),
('resp-005', 'user-005', '{"university":"浙江大学","major":"电子信息","graduation_year":"2024","employment_status":"继续深造","salary_range":"","job_satisfaction":4}', 'completed', '2024-01-19 19:00:00', 'approved');

-- =====================================================
-- 3. 插入心声数据
-- =====================================================
INSERT OR REPLACE INTO raw_heart_voices (
    data_uuid, user_id, content, category, emotion_score, submitted_at, raw_status
) VALUES
('voice-001', 'user-001', '找工作真的太难了，投了100多份简历才收到几个面试邀请。希望学弟学妹们早做准备！', '求职感悟', 3, '2024-01-15 20:00:00', 'completed'),
('voice-002', 'user-002', '感谢学校的就业指导中心，老师们给了我很多帮助，最终拿到了心仪的offer！', '感谢分享', 5, '2024-01-16 21:00:00', 'completed'),
('voice-003', 'user-003', '现在的就业市场竞争太激烈了，不仅要有技术能力，还要有项目经验和实习经历。', '市场观察', 3, '2024-01-17 22:00:00', 'completed'),
('voice-004', 'user-004', '选择了一家创业公司，虽然薪资不是最高的，但是成长空间很大，很期待未来的发展！', '职业选择', 4, '2024-01-18 23:00:00', 'completed'),
('voice-005', 'user-005', '决定继续读研深造，希望能在学术道路上有所建树，为社会做出更大贡献。', '学术追求', 4, '2024-01-19 20:30:00', 'completed');

INSERT OR REPLACE INTO valid_heart_voices (
    raw_id, data_uuid, user_id, content, category, emotion_score, approved_at, audit_status
) VALUES
(1, 'voice-001', 'user-001', '找工作真的太难了，投了100多份简历才收到几个面试邀请。希望学弟学妹们早做准备！', '求职感悟', 3, '2024-01-15 20:05:00', 'approved'),
(2, 'voice-002', 'user-002', '感谢学校的就业指导中心，老师们给了我很多帮助，最终拿到了心仪的offer！', '感谢分享', 5, '2024-01-16 21:05:00', 'approved'),
(3, 'voice-003', 'user-003', '现在的就业市场竞争太激烈了，不仅要有技术能力，还要有项目经验和实习经历。', '市场观察', 3, '2024-01-17 22:05:00', 'approved'),
(4, 'voice-004', 'user-004', '选择了一家创业公司，虽然薪资不是最高的，但是成长空间很大，很期待未来的发展！', '职业选择', 4, '2024-01-18 23:05:00', 'approved'),
(5, 'voice-005', 'user-005', '决定继续读研深造，希望能在学术道路上有所建树，为社会做出更大贡献。', '学术追求', 4, '2024-01-19 20:35:00', 'approved');

-- =====================================================
-- 4. 插入故事数据
-- =====================================================
INSERT OR REPLACE INTO raw_story_submissions (
    data_uuid, user_id, title, content, category, submitted_at, raw_status
) VALUES
('story-001', 'user-001', '我的求职之路：从迷茫到清晰', '大四上学期，我还在为自己的未来感到迷茫。是继续深造还是直接就业？经过深思熟虑和与导师、家人的多次沟通，我最终选择了就业这条路。求职过程虽然艰辛，但每一次面试都是成长的机会。最终，我在一家互联网公司找到了适合自己的岗位，开始了职业生涯的新篇章。', '求职经历', '2024-01-15 21:00:00', 'completed'),
('story-002', 'user-002', '实习经历如何改变了我的职业规划', '大三暑假的实习经历彻底改变了我对职业的认知。在实习过程中，我不仅学到了专业技能，更重要的是了解了行业的真实情况和发展趋势。这段经历让我明确了自己的职业方向，也为后来的求职打下了坚实的基础。我想告诉学弟学妹们，实习真的很重要！', '实习感悟', '2024-01-16 22:00:00', 'completed'),
('story-003', 'user-003', '面试失败教会我的那些事', '求职路上，我经历了无数次面试失败。每一次失败都让我反思自己的不足，不断改进和提升。从技术能力到沟通表达，从简历制作到面试技巧，每一个细节都需要精心准备。虽然过程痛苦，但这些失败最终成就了更好的自己。', '成长感悟', '2024-01-17 23:00:00', 'completed'),
('story-004', 'user-004', '选择创业公司的理由', '在众多offer中，我最终选择了一家创业公司。很多人不理解，为什么不选择大厂的高薪offer？我的理由很简单：在创业公司，我可以接触到更多的业务领域，承担更多的责任，获得更快的成长。虽然风险更大，但我相信这个选择会让我的职业生涯更加精彩。', '职业选择', '2024-01-18 20:00:00', 'completed'),
('story-005', 'user-005', '为什么我选择继续深造', '在就业和深造之间，我选择了后者。这个决定并不容易，需要考虑很多因素：家庭经济状况、个人兴趣、职业规划等。最终，我决定在学术道路上继续探索，希望能够在自己感兴趣的领域做出一些贡献。虽然道路可能更加漫长，但我相信这是正确的选择。', '学术追求', '2024-01-19 21:00:00', 'completed');

INSERT OR REPLACE INTO valid_stories (
    raw_id, data_uuid, user_id, title, content, category, approved_at, audit_status
) VALUES
(1, 'story-001', 'user-001', '我的求职之路：从迷茫到清晰', '大四上学期，我还在为自己的未来感到迷茫。是继续深造还是直接就业？经过深思熟虑和与导师、家人的多次沟通，我最终选择了就业这条路。求职过程虽然艰辛，但每一次面试都是成长的机会。最终，我在一家互联网公司找到了适合自己的岗位，开始了职业生涯的新篇章。', '求职经历', '2024-01-15 21:05:00', 'approved'),
(2, 'story-002', 'user-002', '实习经历如何改变了我的职业规划', '大三暑假的实习经历彻底改变了我对职业的认知。在实习过程中，我不仅学到了专业技能，更重要的是了解了行业的真实情况和发展趋势。这段经历让我明确了自己的职业方向，也为后来的求职打下了坚实的基础。我想告诉学弟学妹们，实习真的很重要！', '实习感悟', '2024-01-16 22:05:00', 'approved'),
(3, 'story-003', 'user-003', '面试失败教会我的那些事', '求职路上，我经历了无数次面试失败。每一次失败都让我反思自己的不足，不断改进和提升。从技术能力到沟通表达，从简历制作到面试技巧，每一个细节都需要精心准备。虽然过程痛苦，但这些失败最终成就了更好的自己。', '成长感悟', '2024-01-17 23:05:00', 'approved'),
(4, 'story-004', 'user-004', '选择创业公司的理由', '在众多offer中，我最终选择了一家创业公司。很多人不理解，为什么不选择大厂的高薪offer？我的理由很简单：在创业公司，我可以接触到更多的业务领域，承担更多的责任，获得更快的成长。虽然风险更大，但我相信这个选择会让我的职业生涯更加精彩。', '职业选择', '2024-01-18 20:05:00', 'approved'),
(5, 'story-005', 'user-005', '为什么我选择继续深造', '在就业和深造之间，我选择了后者。这个决定并不容易，需要考虑很多因素：家庭经济状况、个人兴趣、职业规划等。最终，我决定在学术道路上继续探索，希望能够在自己感兴趣的领域做出一些贡献。虽然道路可能更加漫长，但我相信这是正确的选择。', '学术追求', '2024-01-19 21:05:00', 'approved');

-- =====================================================
-- 5. 插入审核记录
-- =====================================================
INSERT OR REPLACE INTO audit_records (
    content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at
) VALUES
('questionnaire', 1, 'resp-001', 'user-001', 'approved', 'reviewer-001', '内容真实有效', '2024-01-15 15:05:00'),
('questionnaire', 2, 'resp-002', 'user-002', 'approved', 'reviewer-001', '数据完整准确', '2024-01-16 16:05:00'),
('questionnaire', 3, 'resp-003', 'user-003', 'approved', 'reviewer-001', '符合要求', '2024-01-17 17:05:00'),
('heart_voice', 1, 'voice-001', 'user-001', 'approved', 'reviewer-001', '内容积极正面', '2024-01-15 20:05:00'),
('heart_voice', 2, 'voice-002', 'user-002', 'approved', 'reviewer-001', '感谢分享', '2024-01-16 21:05:00'),
('story', 1, 'story-001', 'user-001', 'approved', 'reviewer-001', '故事真实感人', '2024-01-15 21:05:00'),
('story', 2, 'story-002', 'user-002', 'approved', 'reviewer-001', '经验分享有价值', '2024-01-16 22:05:00');

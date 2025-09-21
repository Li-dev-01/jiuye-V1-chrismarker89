-- 测试数据初始化脚本
-- 创建10个半匿名用户，每个用户对应问卷、心声、故事数据

-- 清理现有测试数据
DELETE FROM valid_stories WHERE user_id LIKE 'test-user-%';
DELETE FROM raw_story_submissions WHERE user_id LIKE 'test-user-%';
DELETE FROM valid_heart_voices WHERE user_id LIKE 'test-user-%';
DELETE FROM raw_heart_voices WHERE user_id LIKE 'test-user-%';
DELETE FROM valid_questionnaire_responses WHERE user_uuid LIKE 'test-user-%';
DELETE FROM raw_questionnaire_responses WHERE user_uuid LIKE 'test-user-%';
DELETE FROM universal_questionnaire_responses WHERE user_uuid LIKE 'test-user-%';
DELETE FROM users WHERE user_uuid LIKE 'test-user-%';

-- 插入10个测试用户
INSERT INTO users (user_uuid, user_type, username, nickname, email, status, created_at) VALUES
('test-user-001', 'semi_anonymous', 'testuser001', '小明', 'testuser001@example.com', 'active', '2024-12-01 10:00:00'),
('test-user-002', 'semi_anonymous', 'testuser002', '小红', 'testuser002@example.com', 'active', '2024-12-01 10:05:00'),
('test-user-003', 'semi_anonymous', 'testuser003', '小李', 'testuser003@example.com', 'active', '2024-12-01 10:10:00'),
('test-user-004', 'semi_anonymous', 'testuser004', '小王', 'testuser004@example.com', 'active', '2024-12-01 10:15:00'),
('test-user-005', 'semi_anonymous', 'testuser005', '小张', 'testuser005@example.com', 'active', '2024-12-01 10:20:00'),
('test-user-006', 'semi_anonymous', 'testuser006', '小刘', 'testuser006@example.com', 'active', '2024-12-01 10:25:00'),
('test-user-007', 'semi_anonymous', 'testuser007', '小陈', 'testuser007@example.com', 'active', '2024-12-01 10:30:00'),
('test-user-008', 'semi_anonymous', 'testuser008', '小杨', 'testuser008@example.com', 'active', '2024-12-01 10:35:00'),
('test-user-009', 'semi_anonymous', 'testuser009', '小赵', 'testuser009@example.com', 'active', '2024-12-01 10:40:00'),
('test-user-010', 'semi_anonymous', 'testuser010', '小周', 'testuser010@example.com', 'active', '2024-12-01 10:45:00');

-- 插入通用问卷回答数据
INSERT INTO universal_questionnaire_responses (questionnaire_id, user_uuid, session_id, responses, is_completed, completion_percentage, total_time_seconds, submitted_at, is_valid) VALUES
('employment-survey-2024', 'test-user-001', 'session-001', '{"education":"本科","major":"计算机科学","employment_status":"已就业","salary_expectation":"8000-12000","job_location":"北京"}', 1, 100, 480, '2024-12-01 10:30:00', 1),
('employment-survey-2024', 'test-user-002', 'session-002', '{"education":"硕士","major":"软件工程","employment_status":"求职中","salary_expectation":"12000-20000","job_location":"上海"}', 1, 100, 520, '2024-12-01 10:35:00', 1),
('employment-survey-2024', 'test-user-003', 'session-003', '{"education":"本科","major":"电子信息","employment_status":"已就业","salary_expectation":"6000-8000","job_location":"深圳"}', 1, 100, 450, '2024-12-01 10:40:00', 1),
('employment-survey-2024', 'test-user-004', 'session-004', '{"education":"专科","major":"机械制造","employment_status":"求职中","salary_expectation":"5000-8000","job_location":"广州"}', 1, 100, 380, '2024-12-01 10:45:00', 1),
('employment-survey-2024', 'test-user-005', 'session-005', '{"education":"博士","major":"人工智能","employment_status":"继续深造","salary_expectation":"20000+","job_location":"北京"}', 1, 100, 600, '2024-12-01 10:50:00', 1),
('employment-survey-2024', 'test-user-006', 'session-006', '{"education":"本科","major":"市场营销","employment_status":"已就业","salary_expectation":"6000-10000","job_location":"杭州"}', 1, 100, 420, '2024-12-01 10:55:00', 1),
('employment-survey-2024', 'test-user-007', 'session-007', '{"education":"硕士","major":"金融学","employment_status":"已就业","salary_expectation":"15000-25000","job_location":"上海"}', 1, 100, 550, '2024-12-01 11:00:00', 1),
('employment-survey-2024', 'test-user-008', 'session-008', '{"education":"本科","major":"英语","employment_status":"求职中","salary_expectation":"5000-8000","job_location":"成都"}', 1, 100, 400, '2024-12-01 11:05:00', 1),
('employment-survey-2024', 'test-user-009', 'session-009', '{"education":"本科","major":"土木工程","employment_status":"已就业","salary_expectation":"8000-12000","job_location":"武汉"}', 1, 100, 480, '2024-12-01 11:10:00', 1),
('employment-survey-2024', 'test-user-010', 'session-010', '{"education":"硕士","major":"医学","employment_status":"继续深造","salary_expectation":"12000-18000","job_location":"西安"}', 1, 100, 520, '2024-12-01 11:15:00', 1);

-- 插入原始心声数据
INSERT INTO raw_heart_voices (data_uuid, user_id, content, submitted_at, raw_status) VALUES
('heart-voice-001', 'test-user-001', '作为计算机专业的毕业生，我很幸运能在北京找到一份满意的工作。虽然竞争激烈，但扎实的技术基础让我在面试中脱颖而出。', '2024-12-01 11:00:00', 'completed'),
('heart-voice-002', 'test-user-002', '硕士毕业后求职路并不容易，上海的互联网公司要求很高。我正在努力提升自己，相信很快就能找到理想的工作。', '2024-12-01 11:05:00', 'completed'),
('heart-voice-003', 'test-user-003', '在深圳的电子行业工作很有挑战性，薪资虽然不是最高，但这里的发展机会很多，我很满意现在的工作状态。', '2024-12-01 11:10:00', 'completed'),
('heart-voice-004', 'test-user-004', '专科毕业找工作确实有些困难，但我相信只要努力，总会有机会的。广州的制造业还是有很多岗位的。', '2024-12-01 11:15:00', 'completed'),
('heart-voice-005', 'test-user-005', '博士阶段的学习让我对AI领域有了更深的理解，我选择继续深造是为了在这个快速发展的领域中保持竞争力。', '2024-12-01 11:20:00', 'completed'),
('heart-voice-006', 'test-user-006', '市场营销工作需要很强的沟通能力，杭州的互联网氛围很好，给了我很多学习和成长的机会。', '2024-12-01 11:25:00', 'completed'),
('heart-voice-007', 'test-user-007', '金融行业在上海发展得很好，硕士学历让我在求职中有一定优势，现在的工作薪资和发展前景都不错。', '2024-12-01 11:30:00', 'completed'),
('heart-voice-008', 'test-user-008', '英语专业的就业面比较广，但也意味着竞争激烈。成都的教育行业发展不错，我正在寻找合适的机会。', '2024-12-01 11:35:00', 'completed'),
('heart-voice-009', 'test-user-009', '土木工程专业在武汉有很好的发展前景，基础设施建设需要大量人才，我很看好这个行业的未来。', '2024-12-01 11:40:00', 'completed'),
('heart-voice-010', 'test-user-010', '医学专业需要不断学习，我选择继续深造是为了将来能更好地服务患者，西安的医疗资源很丰富。', '2024-12-01 11:45:00', 'completed');

-- 插入有效心声数据（审核通过）
INSERT INTO valid_heart_voices (raw_id, data_uuid, user_id, content, approved_at, audit_status) VALUES
(1, 'heart-voice-001', 'test-user-001', '作为计算机专业的毕业生，我很幸运能在北京找到一份满意的工作。虽然竞争激烈，但扎实的技术基础让我在面试中脱颖而出。', '2024-12-01 12:00:00', 'approved'),
(2, 'heart-voice-002', 'test-user-002', '硕士毕业后求职路并不容易，上海的互联网公司要求很高。我正在努力提升自己，相信很快就能找到理想的工作。', '2024-12-01 12:05:00', 'approved'),
(3, 'heart-voice-003', 'test-user-003', '在深圳的电子行业工作很有挑战性，薪资虽然不是最高，但这里的发展机会很多，我很满意现在的工作状态。', '2024-12-01 12:10:00', 'approved'),
(4, 'heart-voice-004', 'test-user-004', '专科毕业找工作确实有些困难，但我相信只要努力，总会有机会的。广州的制造业还是有很多岗位的。', '2024-12-01 12:15:00', 'approved'),
(5, 'heart-voice-005', 'test-user-005', '博士阶段的学习让我对AI领域有了更深的理解，我选择继续深造是为了在这个快速发展的领域中保持竞争力。', '2024-12-01 12:20:00', 'approved'),
(6, 'heart-voice-006', 'test-user-006', '市场营销工作需要很强的沟通能力，杭州的互联网氛围很好，给了我很多学习和成长的机会。', '2024-12-01 12:25:00', 'approved'),
(7, 'heart-voice-007', 'test-user-007', '金融行业在上海发展得很好，硕士学历让我在求职中有一定优势，现在的工作薪资和发展前景都不错。', '2024-12-01 12:30:00', 'approved'),
(8, 'heart-voice-008', 'test-user-008', '英语专业的就业面比较广，但也意味着竞争激烈。成都的教育行业发展不错，我正在寻找合适的机会。', '2024-12-01 12:35:00', 'approved'),
(9, 'heart-voice-009', 'test-user-009', '土木工程专业在武汉有很好的发展前景，基础设施建设需要大量人才，我很看好这个行业的未来。', '2024-12-01 12:40:00', 'approved'),
(10, 'heart-voice-010', 'test-user-010', '医学专业需要不断学习，我选择继续深造是为了将来能更好地服务患者，西安的医疗资源很丰富。', '2024-12-01 12:45:00', 'approved');

-- 插入原始故事数据
INSERT INTO raw_story_submissions (data_uuid, user_id, title, content, submitted_at, raw_status) VALUES
('story-001', 'test-user-001', '我的第一份工作', '刚毕业时，我投了上百份简历，经历了无数次面试失败。但我没有放弃，每次失败后都总结经验，最终在一家互联网公司找到了心仪的工作。这段经历让我明白，坚持和努力总会有回报。', '2024-12-01 13:00:00', 'completed'),
('story-002', 'test-user-002', '求职路上的挫折与成长', '硕士毕业后，我以为凭借学历优势很容易找到工作，但现实给了我当头一棒。经过几个月的求职，我学会了如何更好地展示自己，也更加明确了职业方向。', '2024-12-01 13:05:00', 'completed'),
('story-003', 'test-user-003', '从校园到职场的转变', '刚进入职场时，我发现学校学的知识和实际工作有很大差距。通过不断学习和请教同事，我逐渐适应了工作节奏，也找到了自己的职业定位。', '2024-12-01 13:10:00', 'completed'),
('story-004', 'test-user-004', '专科生的逆袭之路', '虽然只是专科学历，但我通过自学和实践，掌握了很多实用技能。在面试中，我用项目经验证明了自己的能力，最终获得了心仪的工作机会。', '2024-12-01 13:15:00', 'completed'),
('story-005', 'test-user-005', '学术路上的坚持', '选择读博是一个艰难的决定，但我对AI领域的热爱让我坚持下来。虽然路途艰辛，但每一个小的突破都让我感到无比兴奋和满足。', '2024-12-01 13:20:00', 'completed'),
('story-006', 'test-user-006', '市场营销的魅力', '刚开始做市场营销时，我对这个行业一无所知。通过不断学习和实践，我发现了这个行业的魅力，也找到了自己的职业激情。', '2024-12-01 13:25:00', 'completed'),
('story-007', 'test-user-007', '金融行业的机遇与挑战', '进入金融行业后，我发现这里既有巨大的机遇，也面临着激烈的竞争。通过不断提升专业能力，我在这个行业中找到了自己的位置。', '2024-12-01 13:30:00', 'completed'),
('story-008', 'test-user-008', '语言的力量', '作为英语专业的学生，我一直在思考如何发挥专业优势。通过参与国际项目和跨文化交流，我发现了语言的巨大力量和价值。', '2024-12-01 13:35:00', 'completed'),
('story-009', 'test-user-009', '建设美好家园', '土木工程让我有机会参与城市建设，每当看到自己参与的项目竣工，心中都充满了成就感。这个专业让我觉得自己在为社会做贡献。', '2024-12-01 13:40:00', 'completed'),
('story-010', 'test-user-010', '医者仁心', '选择医学专业是因为想要帮助他人，虽然学习过程很辛苦，但每当想到将来能够救死扶伤，所有的努力都是值得的。', '2024-12-01 13:45:00', 'completed');

-- 插入有效故事数据（审核通过）
INSERT INTO valid_stories (raw_id, data_uuid, user_id, title, content, approved_at, audit_status) VALUES
(1, 'story-001', 'test-user-001', '我的第一份工作', '刚毕业时，我投了上百份简历，经历了无数次面试失败。但我没有放弃，每次失败后都总结经验，最终在一家互联网公司找到了心仪的工作。这段经历让我明白，坚持和努力总会有回报。', '2024-12-01 14:00:00', 'approved'),
(2, 'story-002', 'test-user-002', '求职路上的挫折与成长', '硕士毕业后，我以为凭借学历优势很容易找到工作，但现实给了我当头一棒。经过几个月的求职，我学会了如何更好地展示自己，也更加明确了职业方向。', '2024-12-01 14:05:00', 'approved'),
(3, 'story-003', 'test-user-003', '从校园到职场的转变', '刚进入职场时，我发现学校学的知识和实际工作有很大差距。通过不断学习和请教同事，我逐渐适应了工作节奏，也找到了自己的职业定位。', '2024-12-01 14:10:00', 'approved'),
(4, 'story-004', 'test-user-004', '专科生的逆袭之路', '虽然只是专科学历，但我通过自学和实践，掌握了很多实用技能。在面试中，我用项目经验证明了自己的能力，最终获得了心仪的工作机会。', '2024-12-01 14:15:00', 'approved'),
(5, 'story-005', 'test-user-005', '学术路上的坚持', '选择读博是一个艰难的决定，但我对AI领域的热爱让我坚持下来。虽然路途艰辛，但每一个小的突破都让我感到无比兴奋和满足。', '2024-12-01 14:20:00', 'approved'),
(6, 'story-006', 'test-user-006', '市场营销的魅力', '刚开始做市场营销时，我对这个行业一无所知。通过不断学习和实践，我发现了这个行业的魅力，也找到了自己的职业激情。', '2024-12-01 14:25:00', 'approved'),
(7, 'story-007', 'test-user-007', '金融行业的机遇与挑战', '进入金融行业后，我发现这里既有巨大的机遇，也面临着激烈的竞争。通过不断提升专业能力，我在这个行业中找到了自己的位置。', '2024-12-01 14:30:00', 'approved'),
(8, 'story-008', 'test-user-008', '语言的力量', '作为英语专业的学生，我一直在思考如何发挥专业优势。通过参与国际项目和跨文化交流，我发现了语言的巨大力量和价值。', '2024-12-01 14:35:00', 'approved'),
(9, 'story-009', 'test-user-009', '建设美好家园', '土木工程让我有机会参与城市建设，每当看到自己参与的项目竣工，心中都充满了成就感。这个专业让我觉得自己在为社会做贡献。', '2024-12-01 14:40:00', 'approved'),
(10, 'story-010', 'test-user-010', '医者仁心', '选择医学专业是因为想要帮助他人，虽然学习过程很辛苦，但每当想到将来能够救死扶伤，所有的努力都是值得的。', '2024-12-01 14:45:00', 'approved');

-- 插入审核记录
INSERT INTO audit_records (content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at, updated_at) VALUES
('heart_voice', 1, 'heart-voice-001', 'test-user-001', 'approved', 'reviewer-001', '内容积极正面，符合要求', '2024-12-01 12:00:00', '2024-12-01 12:00:00'),
('heart_voice', 2, 'heart-voice-002', 'test-user-002', 'approved', 'reviewer-001', '内容真实可信，通过审核', '2024-12-01 12:05:00', '2024-12-01 12:05:00'),
('heart_voice', 3, 'heart-voice-003', 'test-user-003', 'approved', 'reviewer-002', '内容质量良好，审核通过', '2024-12-01 12:10:00', '2024-12-01 12:10:00'),
('heart_voice', 4, 'heart-voice-004', 'test-user-004', 'approved', 'reviewer-002', '内容积极向上，符合标准', '2024-12-01 12:15:00', '2024-12-01 12:15:00'),
('heart_voice', 5, 'heart-voice-005', 'test-user-005', 'approved', 'reviewer-001', '学术内容专业，通过审核', '2024-12-01 12:20:00', '2024-12-01 12:20:00'),
('story', 1, 'story-001', 'test-user-001', 'approved', 'reviewer-001', '故事内容励志，审核通过', '2024-12-01 14:00:00', '2024-12-01 14:00:00'),
('story', 2, 'story-002', 'test-user-002', 'approved', 'reviewer-002', '内容真实感人，符合要求', '2024-12-01 14:05:00', '2024-12-01 14:05:00'),
('story', 3, 'story-003', 'test-user-003', 'approved', 'reviewer-001', '职场经验分享，质量良好', '2024-12-01 14:10:00', '2024-12-01 14:10:00'),
('story', 4, 'story-004', 'test-user-004', 'approved', 'reviewer-002', '励志故事，正能量满满', '2024-12-01 14:15:00', '2024-12-01 14:15:00'),
('story', 5, 'story-005', 'test-user-005', 'approved', 'reviewer-001', '学术分享，内容专业', '2024-12-01 14:20:00', '2024-12-01 14:20:00');

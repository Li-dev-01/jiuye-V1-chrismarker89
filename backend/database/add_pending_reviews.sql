-- 添加待审核的数据
-- 这些数据将用于测试快速审核功能

-- 添加待审核的心声数据
INSERT INTO audit_records (content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at, updated_at) VALUES
('heart_voice', 6, 'heart-voice-006', 'test-user-006', 'pending', NULL, NULL, '2024-12-01 15:00:00', '2024-12-01 15:00:00'),
('heart_voice', 7, 'heart-voice-007', 'test-user-007', 'pending', NULL, NULL, '2024-12-01 15:05:00', '2024-12-01 15:05:00'),
('heart_voice', 8, 'heart-voice-008', 'test-user-008', 'pending', NULL, NULL, '2024-12-01 15:10:00', '2024-12-01 15:10:00'),
('heart_voice', 9, 'heart-voice-009', 'test-user-009', 'pending', NULL, NULL, '2024-12-01 15:15:00', '2024-12-01 15:15:00'),
('heart_voice', 10, 'heart-voice-010', 'test-user-010', 'pending', NULL, NULL, '2024-12-01 15:20:00', '2024-12-01 15:20:00');

-- 添加待审核的故事数据
INSERT INTO audit_records (content_type, content_id, content_uuid, user_uuid, audit_result, reviewer_id, audit_notes, created_at, updated_at) VALUES
('story', 6, 'story-006', 'test-user-006', 'pending', NULL, NULL, '2024-12-01 16:00:00', '2024-12-01 16:00:00'),
('story', 7, 'story-007', 'test-user-007', 'pending', NULL, NULL, '2024-12-01 16:05:00', '2024-12-01 16:05:00'),
('story', 8, 'story-008', 'test-user-008', 'pending', NULL, NULL, '2024-12-01 16:10:00', '2024-12-01 16:10:00'),
('story', 9, 'story-009', 'test-user-009', 'pending', NULL, NULL, '2024-12-01 16:15:00', '2024-12-01 16:15:00'),
('story', 10, 'story-010', 'test-user-010', 'pending', NULL, NULL, '2024-12-01 16:20:00', '2024-12-01 16:20:00');

-- 添加对应的心声内容（如果不存在）
INSERT OR IGNORE INTO raw_heart_voices (id, user_id, content, category, emotion_score, submitted_at, raw_status) VALUES
(6, 6, '找工作真的太难了，投了几十份简历都没有回音，感觉很迷茫。', '求职困惑', 2, '2024-12-01 15:00:00', 'pending'),
(7, 7, '刚毕业就要面对房租、生活费等各种压力，工资又不高，真的很焦虑。', '生活压力', 2, '2024-12-01 15:05:00', 'pending'),
(8, 8, '面试了好几家公司，都说我经验不足，但是不给机会怎么积累经验呢？', '求职困惑', 2, '2024-12-01 15:10:00', 'pending'),
(9, 9, '看到同学们都找到了不错的工作，而我还在家里待业，压力山大。', '就业焦虑', 1, '2024-12-01 15:15:00', 'pending'),
(10, 10, '专业对口的工作很少，考虑转行但又担心从零开始，很纠结。', '职业规划', 3, '2024-12-01 15:20:00', 'pending');

-- 添加对应的故事内容（如果不存在）
INSERT OR IGNORE INTO raw_story_submissions (id, user_id, title, content, category, submitted_at, raw_status) VALUES
(6, 6, '求职路上的挫折与成长', '毕业后的求职路比想象中更加艰难。连续几个月的投简历、面试、被拒绝，让我一度怀疑自己的能力。但是每一次的失败都让我更加了解自己，也让我明白了什么是真正适合自己的工作。', '2024-12-01 16:00:00', 'pending'),
(7, 7, '第一份工作的酸甜苦辣', '刚入职场的时候什么都不懂，经常加班到很晚，工资也不高。但是同事们都很友善，领导也很耐心地教导我。虽然辛苦，但是每天都能学到新东西，感觉自己在不断成长。', '2024-12-01 16:05:00', 'pending'),
(8, 8, '转行的勇气与代价', '工作了两年后发现这个行业并不适合自己，决定转行学习编程。虽然要从零开始，收入也会减少，但是为了追求自己真正喜欢的事业，我觉得这些代价都是值得的。', '2024-12-01 16:10:00', 'pending'),
(9, 9, '创业失败后的反思', '和朋友一起创业做了一个小项目，但是由于经验不足和市场判断错误，最终失败了。虽然损失了一些钱，但是这次经历让我学到了很多书本上学不到的东西。', '2024-12-01 16:15:00', 'pending'),
(10, 10, '考研还是工作的选择', '面临毕业时最大的困惑就是考研还是直接工作。经过深思熟虑，我选择了先工作积累经验，将来有机会再继续深造。现在看来这个选择是正确的。', '2024-12-01 16:20:00', 'pending');

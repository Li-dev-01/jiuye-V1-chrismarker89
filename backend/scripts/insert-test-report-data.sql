-- 插入测试举报数据
-- 用于测试信誉管理功能

-- 插入一些测试用户的信誉记录
INSERT OR IGNORE INTO reporter_reputation (
  user_id, total_reports, valid_reports, invalid_reports, malicious_reports,
  reputation_score, reputation_level, is_restricted, last_report_at
) VALUES 
  (1, 10, 8, 2, 0, 110.0, 'excellent', 0, datetime('now', '-1 day')),
  (2, 15, 5, 8, 2, 45.0, 'poor', 0, datetime('now', '-2 days')),
  (3, 20, 2, 5, 13, 10.0, 'bad', 1, datetime('now', '-1 hour')),
  (4, 5, 5, 0, 0, 150.0, 'excellent', 0, datetime('now', '-3 days')),
  (5, 8, 3, 4, 1, 65.0, 'normal', 0, datetime('now', '-5 hours'));

-- 插入一些测试举报记录
INSERT OR IGNORE INTO user_reports (
  content_type, content_id, content_uuid,
  reporter_user_id, reported_user_id,
  report_type, report_reason, status,
  created_at
) VALUES 
  -- 待处理的举报
  ('story', 1, 'story-uuid-1', 1, 10, 'spam', '内容涉嫌垃圾广告', 'pending', datetime('now', '-1 hour')),
  ('story', 2, 'story-uuid-2', 2, 11, 'harassment', '内容包含辱骂性语言', 'pending', datetime('now', '-2 hours')),
  ('comment', 1, 'comment-uuid-1', 3, 12, 'off_topic', '评论偏离主题', 'pending', datetime('now', '-30 minutes')),
  
  -- 已审核的举报
  ('story', 3, 'story-uuid-3', 1, 13, 'fake_info', '虚假信息', 'valid', datetime('now', '-1 day')),
  ('story', 4, 'story-uuid-4', 2, 14, 'political', '政治敏感内容', 'invalid', datetime('now', '-2 days')),
  ('story', 5, 'story-uuid-5', 3, 15, 'spam', '恶意举报', 'malicious', datetime('now', '-3 days')),
  
  -- 更多测试数据
  ('questionnaire', 1, 'q-uuid-1', 4, 16, 'privacy', '泄露个人隐私', 'pending', datetime('now', '-4 hours')),
  ('story', 6, 'story-uuid-6', 5, 17, 'violent', '暴力内容', 'reviewing', datetime('now', '-6 hours')),
  ('comment', 2, 'comment-uuid-2', 1, 18, 'pornographic', '色情内容', 'valid', datetime('now', '-1 week')),
  ('story', 7, 'story-uuid-7', 2, 19, 'other', '其他问题', 'invalid', datetime('now', '-2 weeks'));

-- 更新一些举报的审核信息
UPDATE user_reports 
SET review_result = 'content_removed',
    review_notes = '内容确实违规，已删除',
    reviewed_by = 'admin_chris',
    reviewed_at = datetime('now', '-23 hours')
WHERE id = 4;

UPDATE user_reports 
SET review_result = 'content_approved',
    review_notes = '内容无问题，举报无效',
    reviewed_by = 'admin_chris',
    reviewed_at = datetime('now', '-47 hours')
WHERE id = 5;

UPDATE user_reports 
SET review_result = 'reporter_warned',
    review_notes = '恶意举报，已警告举报人',
    reviewed_by = 'admin_chris',
    reviewed_at = datetime('now', '-71 hours')
WHERE id = 6;

-- 插入一些操作日志
INSERT INTO report_action_logs (report_id, action_type, action_by, action_details, created_at)
VALUES 
  (1, 'created', 'system', '{"source": "user_report"}', datetime('now', '-1 hour')),
  (2, 'created', 'system', '{"source": "user_report"}', datetime('now', '-2 hours')),
  (4, 'created', 'system', '{"source": "user_report"}', datetime('now', '-1 day')),
  (4, 'reviewed', 'admin_chris', '{"status": "valid", "action": "content_removed"}', datetime('now', '-23 hours')),
  (5, 'created', 'system', '{"source": "user_report"}', datetime('now', '-2 days')),
  (5, 'reviewed', 'admin_chris', '{"status": "invalid", "action": "content_approved"}', datetime('now', '-47 hours')),
  (6, 'created', 'system', '{"source": "user_report"}', datetime('now', '-3 days')),
  (6, 'reviewed', 'admin_chris', '{"status": "malicious", "action": "reporter_warned"}', datetime('now', '-71 hours'));


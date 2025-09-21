-- 插入默认管理员用户
-- 密码: Admin123! (实际使用时应该通过API创建，这里仅用于开发测试)
INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES 
('admin-user-id-001', 'admin', 'admin@example.com', 'placeholder-hash', 'super_admin');

-- 插入测试审核员用户
INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES 
('reviewer-user-id-001', 'reviewer1', 'reviewer1@example.com', 'placeholder-hash', 'reviewer');

-- 插入测试普通用户
INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES 
('normal-user-id-001', 'user1', 'user1@example.com', 'placeholder-hash', 'user'),
('normal-user-id-002', 'user2', 'user2@example.com', 'placeholder-hash', 'user');

-- 插入测试问卷数据
INSERT OR IGNORE INTO questionnaire_responses (
    id, 
    user_id, 
    personal_info, 
    education_info, 
    employment_info, 
    job_search_info, 
    employment_status,
    status
) VALUES 
(
    'questionnaire-001',
    'normal-user-id-001',
    '{"name":"张三","gender":"male","age":22,"phone":"13800138001","email":"zhangsan@example.com"}',
    '{"university":"北京大学","major":"计算机科学与技术","degree":"bachelor","graduationYear":2024,"gpa":3.8}',
    '{"preferredIndustry":["互联网","软件开发"],"preferredPosition":"前端开发工程师","expectedSalary":12000,"preferredLocation":["北京","上海"],"workExperience":"有1年实习经验"}',
    '{"searchChannels":["校园招聘","网络招聘","朋友推荐"],"interviewCount":5,"offerCount":2,"searchDuration":3}',
    '{"currentStatus":"employed","currentCompany":"某科技公司","currentPosition":"前端开发工程师","currentSalary":11000,"satisfactionLevel":4}',
    'approved'
),
(
    'questionnaire-002',
    'normal-user-id-002',
    '{"name":"李四","gender":"female","age":23,"phone":"13800138002","email":"lisi@example.com"}',
    '{"university":"清华大学","major":"软件工程","degree":"master","graduationYear":2024,"gpa":3.9}',
    '{"preferredIndustry":["金融","咨询"],"preferredPosition":"产品经理","expectedSalary":15000,"preferredLocation":["北京","深圳"],"workExperience":"有多个项目经验"}',
    '{"searchChannels":["校园招聘","内推"],"interviewCount":8,"offerCount":3,"searchDuration":2}',
    '{"currentStatus":"employed","currentCompany":"某金融公司","currentPosition":"产品经理助理","currentSalary":14000,"satisfactionLevel":5}',
    'pending'
);

-- 插入测试审核记录
INSERT OR IGNORE INTO reviews (
    id,
    questionnaire_id,
    reviewer_id,
    status,
    comment
) VALUES 
(
    'review-001',
    'questionnaire-001',
    'reviewer-user-id-001',
    'approved',
    '信息完整，数据真实可信'
);

-- 插入测试分析缓存数据
INSERT OR IGNORE INTO analytics_cache (
    id,
    cache_key,
    cache_data,
    expires_at
) VALUES 
(
    'cache-001',
    'summary_stats',
    '{"totalResponses":2,"approvedResponses":1,"pendingResponses":1,"rejectedResponses":0}',
    datetime('now', '+1 hour')
);

-- 插入测试系统日志
INSERT OR IGNORE INTO system_logs (
    id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
) VALUES 
(
    'log-001',
    'normal-user-id-001',
    'CREATE',
    'questionnaire',
    'questionnaire-001',
    '{"action":"submit_questionnaire","timestamp":"2024-07-27T10:00:00Z"}',
    '127.0.0.1',
    'Mozilla/5.0 (Test Browser)'
),
(
    'log-002',
    'reviewer-user-id-001',
    'UPDATE',
    'questionnaire',
    'questionnaire-001',
    '{"action":"approve_questionnaire","timestamp":"2024-07-27T11:00:00Z"}',
    '127.0.0.1',
    'Mozilla/5.0 (Test Browser)'
);

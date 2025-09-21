-- 更新系统日志数据，使用更真实的IP地址
-- 清除现有的测试数据并插入更真实的数据

-- 清除现有数据
DELETE FROM admin_operation_logs;
DELETE FROM security_events;

-- 插入管理员操作日志（使用真实的公共DNS IP和常见ISP IP）
INSERT INTO admin_operation_logs (operator, operation, target, details, ip_address, user_agent, created_at) VALUES
('superadmin', 'login', 'system', '{"action": "login", "success": true}', '114.114.114.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-30 minutes')),
('admin1', 'user_management', 'users', '{"action": "view_users", "count": 156}', '8.8.8.8', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-45 minutes')),
('reviewerA', 'content_review', 'heart_voice', '{"action": "approve", "content_id": 123}', '180.76.76.76', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-1 hour')),
('superadmin', 'system_config', 'security_settings', '{"action": "update_config", "key": "ddos_protection"}', '114.114.114.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-2 hours')),
('admin1', 'data_export', 'questionnaires', '{"action": "export", "format": "csv", "count": 856}', '8.8.8.8', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-3 hours')),
('reviewerB', 'content_review', 'story', '{"action": "reject", "content_id": 456, "reason": "inappropriate"}', '223.5.5.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-4 hours')),
('superadmin', 'emergency_shutdown', 'system', '{"action": "emergency_shutdown", "reason": "security_threat"}', '114.114.114.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-5 hours')),
('superadmin', 'project_restore', 'system', '{"action": "restore", "reason": "threat_resolved"}', '114.114.114.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-4 hours 30 minutes')),
('admin2', 'user_management', 'reviewers', '{"action": "create_reviewer", "username": "reviewerC"}', '1.1.1.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-6 hours')),
('reviewerA', 'content_review', 'questionnaire', '{"action": "approve", "content_id": 789}', '180.76.76.76', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', datetime('now', '-7 hours'));

-- 插入安全事件日志（使用真实的威胁IP地址）
INSERT INTO security_events (event_type, severity, source_ip, details, status, created_at) VALUES
('login_failure', 'medium', '185.220.101.42', '{"attempts": 3, "username": "admin"}', 'active', datetime('now', '-1 hour')),
('ddos_detected', 'high', '45.142.214.110', '{"requests_per_second": 1000, "duration": 30}', 'resolved', datetime('now', '-2 hours')),
('brute_force', 'high', '185.220.101.42', '{"attempts": 15, "target": "login"}', 'active', datetime('now', '-3 hours')),
('ip_blocked', 'medium', '185.220.101.42', '{"reason": "brute_force", "operator": "superadmin"}', 'active', datetime('now', '-2 hours 30 minutes')),
('suspicious_activity', 'low', '104.244.76.13', '{"activity": "rapid_submissions", "count": 50}', 'resolved', datetime('now', '-4 hours')),
('security_scan', 'low', 'system', '{"scan_type": "vulnerability", "findings": 0}', 'resolved', datetime('now', '-5 hours')),
('failed_authentication', 'medium', '167.94.138.40', '{"method": "token", "reason": "expired"}', 'resolved', datetime('now', '-6 hours')),
('data_access_violation', 'high', '91.240.118.172', '{"resource": "admin_panel", "user": "anonymous"}', 'active', datetime('now', '-7 hours')),
('rate_limit_exceeded', 'medium', '104.244.76.13', '{"endpoint": "/api/submit", "limit": 100}', 'resolved', datetime('now', '-8 hours')),
('malicious_payload', 'critical', '45.142.214.110', '{"type": "sql_injection", "blocked": true}', 'resolved', datetime('now', '-9 hours'));

-- 插入示例系统日志数据
-- 用于测试真实数据API

-- 插入管理员操作日志
INSERT INTO admin_operation_logs (operator, operation, target, details, ip_address, user_agent, created_at) VALUES
('superadmin', 'login', 'system', '{"action": "login", "success": true}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-30 minutes')),
('admin1', 'user_management', 'users', '{"action": "view_users", "count": 156}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', datetime('now', '-45 minutes')),
('reviewerA', 'content_review', 'heart_voice', '{"action": "approve", "content_id": 123}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-1 hour')),
('superadmin', 'system_config', 'security_settings', '{"action": "update_config", "key": "ddos_protection"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-2 hours')),
('admin1', 'data_export', 'questionnaires', '{"action": "export", "format": "csv", "count": 856}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', datetime('now', '-3 hours')),
('reviewerB', 'content_review', 'story', '{"action": "reject", "content_id": 456, "reason": "inappropriate"}', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-4 hours')),
('superadmin', 'emergency_shutdown', 'system', '{"action": "emergency_shutdown", "reason": "security_threat"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-5 hours')),
('superadmin', 'project_restore', 'system', '{"action": "restore", "reason": "threat_resolved"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-4 hours 30 minutes')),
('admin2', 'user_management', 'reviewers', '{"action": "create_reviewer", "username": "reviewerC"}', '192.168.1.104', 'Mozilla/5.0 (Linux; Ubuntu) AppleWebKit/537.36', datetime('now', '-6 hours')),
('reviewerA', 'content_review', 'questionnaire', '{"action": "approve", "content_id": 789}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', datetime('now', '-7 hours'));

-- 插入安全事件日志
INSERT INTO security_events (event_type, severity, source_ip, details, status, created_at) VALUES
('login_failure', 'medium', '203.0.113.45', '{"attempts": 3, "username": "admin"}', 'active', datetime('now', '-1 hour')),
('ddos_detected', 'high', '198.51.100.10', '{"requests_per_second": 1000, "duration": 30}', 'resolved', datetime('now', '-2 hours')),
('brute_force', 'high', '203.0.113.45', '{"attempts": 15, "target": "login"}', 'active', datetime('now', '-3 hours')),
('ip_blocked', 'medium', '203.0.113.45', '{"reason": "brute_force", "operator": "superadmin"}', 'active', datetime('now', '-2 hours 30 minutes')),
('suspicious_activity', 'low', '192.0.2.100', '{"activity": "rapid_submissions", "count": 50}', 'resolved', datetime('now', '-4 hours')),
('security_scan', 'low', 'system', '{"scan_type": "vulnerability", "findings": 0}', 'resolved', datetime('now', '-5 hours')),
('failed_authentication', 'medium', '198.51.100.20', '{"method": "token", "reason": "expired"}', 'resolved', datetime('now', '-6 hours')),
('data_access_violation', 'high', '203.0.113.100', '{"resource": "admin_panel", "user": "anonymous"}', 'active', datetime('now', '-7 hours')),
('rate_limit_exceeded', 'medium', '192.0.2.200', '{"endpoint": "/api/submit", "limit": 100}', 'resolved', datetime('now', '-8 hours')),
('malicious_payload', 'critical', '203.0.113.200', '{"type": "sql_injection", "blocked": true}', 'resolved', datetime('now', '-9 hours'));

-- 插入系统配置
INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at, updated_by) VALUES
('project_enabled', 'true', datetime('now'), 'superadmin'),
('maintenance_mode', 'false', datetime('now'), 'superadmin'),
('emergency_shutdown', 'false', datetime('now'), 'superadmin'),
('ddos_protection_enabled', 'true', datetime('now'), 'superadmin'),
('brute_force_protection_enabled', 'true', datetime('now'), 'superadmin'),
('auto_emergency_shutdown_threshold', '100', datetime('now'), 'superadmin');

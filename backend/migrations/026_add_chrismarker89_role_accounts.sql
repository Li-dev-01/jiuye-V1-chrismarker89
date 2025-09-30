-- Migration: 026_add_chrismarker89_role_accounts
-- Description: 为 chrismarker89@gmail.com 添加 admin 和 reviewer 角色账号
-- Created: 2025-09-30

-- 1. 确保邮箱在白名单中（应该已经存在，但以防万一）
INSERT OR IGNORE INTO email_whitelist (
  email, is_super_admin, is_admin, is_reviewer, is_active, is_verified, created_by, notes
) VALUES 
  ('chrismarker89@gmail.com', TRUE, TRUE, TRUE, TRUE, TRUE, 'system', '系统初始超级管理员');

-- 2. 添加 admin 角色账号
INSERT OR IGNORE INTO role_accounts (
  email, role, username, display_name, permissions, 
  allow_password_login, is_active, created_by, notes
) VALUES 
  ('chrismarker89@gmail.com', 'admin', 'admin_chris', 'Chris (Admin)', '["manage_content", "view_analytics", "manage_api"]', TRUE, TRUE, 'system', '管理员账号');

-- 3. 添加 reviewer 角色账号
INSERT OR IGNORE INTO role_accounts (
  email, role, username, display_name, permissions, 
  allow_password_login, is_active, created_by, notes
) VALUES 
  ('chrismarker89@gmail.com', 'reviewer', 'reviewer_chris', 'Chris (Reviewer)', '["review_content", "view_dashboard"]', TRUE, TRUE, 'system', '审核员账号');

-- 4. 验证插入结果
-- SELECT email, role, username, display_name, is_active 
-- FROM role_accounts 
-- WHERE email = 'chrismarker89@gmail.com'
-- ORDER BY role;


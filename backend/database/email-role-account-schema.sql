-- 邮箱与角色账号管理系统
-- 核心概念：一个邮箱可以对应多个角色账号
-- 邮箱用于身份验证，角色账号是实际的系统账户

-- ============================================
-- 1. 邮箱白名单表（身份验证）
-- ============================================
CREATE TABLE IF NOT EXISTS email_whitelist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- 2FA设置（邮箱级别）
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT, -- JSON数组
  
  -- 创建信息
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  
  -- 备注
  notes TEXT
);

-- ============================================
-- 2. 角色账号表（实际账户）
-- ============================================
CREATE TABLE IF NOT EXISTS role_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联邮箱
  email TEXT NOT NULL,
  
  -- 角色信息
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'admin', 'super_admin')),
  username TEXT UNIQUE, -- 自动生成或手动设置
  display_name TEXT,
  
  -- 权限设置
  permissions TEXT DEFAULT '[]', -- JSON数组
  
  -- 账号密码（可选）
  allow_password_login BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 创建和更新信息
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  
  -- 备注
  notes TEXT,
  
  -- 约束：一个邮箱+角色组合唯一
  UNIQUE(email, role),
  FOREIGN KEY (email) REFERENCES email_whitelist(email) ON DELETE CASCADE
);

-- ============================================
-- 3. 登录会话表
-- ============================================
CREATE TABLE IF NOT EXISTS login_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  
  -- 用户信息
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  account_id INTEGER NOT NULL, -- 关联role_accounts表
  
  -- 登录方式
  login_method TEXT NOT NULL CHECK (login_method IN ('password', 'google_oauth', '2fa')),
  
  -- 会话信息
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT, -- JSON
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (email) REFERENCES email_whitelist(email),
  FOREIGN KEY (account_id) REFERENCES role_accounts(id)
);

-- ============================================
-- 4. 登录尝试记录表（防暴力破解）
-- ============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 尝试信息
  email TEXT,
  role TEXT, -- 尝试登录的角色
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  
  -- 尝试结果
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- 登录方式
  login_method TEXT NOT NULL,
  
  -- 时间
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 2FA验证记录表
-- ============================================
CREATE TABLE IF NOT EXISTS two_factor_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 用户信息
  email TEXT NOT NULL,
  
  -- 验证信息
  code TEXT NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('totp', 'backup_code')),
  
  -- 验证结果
  verified BOOLEAN NOT NULL,
  
  -- 时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  
  FOREIGN KEY (email) REFERENCES email_whitelist(email)
);

-- ============================================
-- 6. 审计日志表（管理员操作记录）
-- ============================================
CREATE TABLE IF NOT EXISTS account_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 操作者信息
  operator_email TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  operator_account_id INTEGER,
  
  -- 操作信息
  action TEXT NOT NULL, -- 'create_account', 'update_permissions', 'enable_2fa', etc.
  target_email TEXT,
  target_role TEXT,
  target_account_id INTEGER,
  
  -- 操作详情
  details TEXT, -- JSON
  
  -- 结果
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- 时间和环境
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 创建索引优化查询性能
-- ============================================

-- email_whitelist索引
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);

-- role_accounts索引
CREATE INDEX IF NOT EXISTS idx_role_accounts_email ON role_accounts(email);
CREATE INDEX IF NOT EXISTS idx_role_accounts_role ON role_accounts(role);
CREATE INDEX IF NOT EXISTS idx_role_accounts_username ON role_accounts(username);
CREATE INDEX IF NOT EXISTS idx_role_accounts_active ON role_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_role_accounts_email_role ON role_accounts(email, role);

-- login_sessions索引
CREATE INDEX IF NOT EXISTS idx_login_sessions_session_id ON login_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_email ON login_sessions(email);
CREATE INDEX IF NOT EXISTS idx_login_sessions_account_id ON login_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_login_sessions_expires ON login_sessions(expires_at);

-- login_attempts索引
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- two_factor_verifications索引
CREATE INDEX IF NOT EXISTS idx_two_factor_email ON two_factor_verifications(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_time ON two_factor_verifications(created_at);

-- account_audit_logs索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON account_audit_logs(operator_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON account_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON account_audit_logs(created_at);

-- ============================================
-- 插入初始数据
-- ============================================

-- 1. 添加超级管理员邮箱到白名单
INSERT OR IGNORE INTO email_whitelist (
  email, is_active, is_verified, two_factor_enabled, created_by, notes
) VALUES 
  ('chrismarker89@gmail.com', TRUE, TRUE, FALSE, 'system', '系统初始超级管理员'),
  ('aibook2099@gmail.com', TRUE, TRUE, FALSE, 'system', '超级管理员'),
  ('justpm2099@gmail.com', TRUE, TRUE, FALSE, 'system', '超级管理员');

-- 2. 为每个超级管理员邮箱创建super_admin角色账号
INSERT OR IGNORE INTO role_accounts (
  email, role, username, display_name, permissions,
  allow_password_login, is_active, created_by, notes
) VALUES
  -- chrismarker89@gmail.com 的超级管理员账号
  ('chrismarker89@gmail.com', 'super_admin', 'superadmin_chris', 'Chris (Super Admin)', '["all"]', TRUE, TRUE, 'system', '超级管理员账号'),

  -- chrismarker89@gmail.com 的管理员账号
  ('chrismarker89@gmail.com', 'admin', 'admin_chris', 'Chris (Admin)', '["manage_content", "view_analytics", "manage_api"]', TRUE, TRUE, 'system', '管理员账号'),

  -- chrismarker89@gmail.com 的审核员账号
  ('chrismarker89@gmail.com', 'reviewer', 'reviewer_chris', 'Chris (Reviewer)', '["review_content", "view_dashboard"]', TRUE, TRUE, 'system', '审核员账号'),

  -- aibook2099@gmail.com 的超级管理员账号
  ('aibook2099@gmail.com', 'super_admin', 'superadmin_aibook', 'AIBook (Super Admin)', '["all"]', FALSE, TRUE, 'system', '超级管理员账号'),

  -- justpm2099@gmail.com 的超级管理员账号
  ('justpm2099@gmail.com', 'super_admin', 'superadmin_justpm', 'JustPM (Super Admin)', '["all"]', FALSE, TRUE, 'system', '超级管理员账号');

-- 3. 添加测试邮箱
INSERT OR IGNORE INTO email_whitelist (
  email, is_active, is_verified, created_by, notes
) VALUES 
  ('test@gmail.com', TRUE, TRUE, 'chrismarker89@gmail.com', '测试账号');

-- 4. 为测试邮箱创建多个角色账号（演示一个邮箱多个角色）
INSERT OR IGNORE INTO role_accounts (
  email, role, username, display_name, permissions, 
  allow_password_login, password_hash, is_active, created_by, notes
) VALUES 
  -- test@gmail.com 的超级管理员账号
  ('test@gmail.com', 'super_admin', 'test_superadmin', 'Test (Super Admin)', '["all"]', TRUE, NULL, TRUE, 'chrismarker89@gmail.com', '测试超级管理员'),
  
  -- test@gmail.com 的管理员账号
  ('test@gmail.com', 'admin', 'test_admin', 'Test (Admin)', '["manage_content", "view_analytics", "manage_api"]', TRUE, NULL, TRUE, 'chrismarker89@gmail.com', '测试管理员'),
  
  -- test@gmail.com 的审核员账号
  ('test@gmail.com', 'reviewer', 'test_reviewer', 'Test (Reviewer)', '["review_content", "view_dashboard"]', TRUE, NULL, TRUE, 'chrismarker89@gmail.com', '测试审核员');

-- 5. 添加独立的审核员和管理员测试账号
INSERT OR IGNORE INTO email_whitelist (
  email, is_active, is_verified, created_by, notes
) VALUES 
  ('reviewer@test.com', TRUE, TRUE, 'chrismarker89@gmail.com', '审核员测试账号'),
  ('admin@test.com', TRUE, TRUE, 'chrismarker89@gmail.com', '管理员测试账号');

INSERT OR IGNORE INTO role_accounts (
  email, role, username, display_name, permissions, 
  allow_password_login, password_hash, is_active, created_by, notes
) VALUES 
  ('reviewer@test.com', 'reviewer', 'reviewerA', 'Reviewer A', '["review_content", "view_dashboard"]', TRUE, NULL, TRUE, 'chrismarker89@gmail.com', '审核员账号'),
  ('admin@test.com', 'admin', 'admin', 'Admin User', '["manage_content", "view_analytics", "manage_api"]', TRUE, NULL, TRUE, 'chrismarker89@gmail.com', '管理员账号');


-- 管理员账户管理系统数据库设计
-- 支持Gmail白名单、角色权限管理、2FA认证

-- 1. 管理员白名单表
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'admin', 'super_admin')),
  
  -- 权限设置
  permissions TEXT DEFAULT '[]', -- JSON数组，存储具体权限
  allow_password_login BOOLEAN DEFAULT FALSE, -- 是否允许账号密码登录
  
  -- 账号密码（如果允许密码登录）
  username TEXT UNIQUE,
  password_hash TEXT,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  
  -- 2FA设置
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- TOTP密钥
  backup_codes TEXT, -- JSON数组，备用恢复码
  
  -- 创建和更新信息
  created_by TEXT, -- 创建者邮箱
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  
  -- 备注
  notes TEXT
);

-- 2. 登录会话表（增强版）
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  
  -- 用户信息
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  
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
  
  FOREIGN KEY (email) REFERENCES admin_whitelist(email)
);

-- 3. 登录尝试记录表（防暴力破解）
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 尝试信息
  email TEXT,
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

-- 4. 2FA验证记录表
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
  
  FOREIGN KEY (email) REFERENCES admin_whitelist(email)
);

-- 5. 审计日志表（管理员操作记录）
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 操作者信息
  operator_email TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  
  -- 操作信息
  action TEXT NOT NULL, -- 'create_user', 'update_permissions', 'enable_2fa', etc.
  target_email TEXT, -- 被操作的用户邮箱
  
  -- 操作详情
  details TEXT, -- JSON，详细信息
  
  -- 结果
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- 时间和环境
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_email ON admin_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_role ON admin_whitelist(role);
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_active ON admin_whitelist(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_id ON admin_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email ON admin_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON admin_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_time ON admin_login_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_two_factor_email ON two_factor_verifications(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_time ON two_factor_verifications(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON admin_audit_logs(operator_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON admin_audit_logs(created_at);

-- 插入初始超级管理员白名单
INSERT OR IGNORE INTO admin_whitelist (
  email, role, permissions, allow_password_login, 
  username, is_active, two_factor_enabled, created_by, notes
) VALUES 
  ('chrismarker89@gmail.com', 'super_admin', '["all"]', TRUE, 'superadmin', TRUE, FALSE, 'system', '系统初始超级管理员'),
  ('aibook2099@gmail.com', 'super_admin', '["all"]', TRUE, NULL, TRUE, FALSE, 'system', '超级管理员'),
  ('justpm2099@gmail.com', 'super_admin', '["all"]', TRUE, NULL, TRUE, FALSE, 'system', '超级管理员');

-- 插入测试管理员和审核员（开发环境）
INSERT OR IGNORE INTO admin_whitelist (
  email, role, permissions, allow_password_login, 
  username, is_active, created_by, notes
) VALUES 
  ('admin@test.com', 'admin', '["manage_content", "view_analytics"]', TRUE, 'admin1', TRUE, 'chrismarker89@gmail.com', '测试管理员账号'),
  ('reviewer@test.com', 'reviewer', '["review_content", "view_dashboard"]', TRUE, 'reviewerA', TRUE, 'chrismarker89@gmail.com', '测试审核员账号');


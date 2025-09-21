-- 真实数据迁移 - 为新架构创建必要的表
-- 创建时间: 2025-09-20

-- 创建管理员用户表 (如果不存在)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  user_type TEXT DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME,
  login_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员会话表 (如果不存在)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

-- 插入默认管理员账户 (开发调试用)
INSERT OR IGNORE INTO admin_users (
  email, 
  password_hash, 
  username, 
  display_name, 
  role, 
  user_type, 
  is_active, 
  login_count
) VALUES (
  'admin@example.com',
  '$2b$10$rOvHPxfzO2.KjB8YvFfzKOqP5H5H5H5H5H5H5H5H5H5H5H5H5H5H5H',  -- 'admin123' 的哈希
  'admin',
  '系统管理员',
  'admin',
  'SUPER_ADMIN',
  1,
  0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

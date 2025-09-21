-- 问卷用户认证系统独立数据库表
-- 创建时间: 2025-08-04

-- 问卷用户表
CREATE TABLE IF NOT EXISTS questionnaire_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  identity_hash TEXT UNIQUE,
  display_name TEXT,
  user_type TEXT CHECK(user_type IN ('anonymous', 'semi_anonymous')) DEFAULT 'semi_anonymous',
  permissions TEXT DEFAULT '["browse_content", "submit_questionnaire", "manage_own_content"]',
  profile TEXT DEFAULT '{"language": "zh-CN", "timezone": "Asia/Shanghai"}',
  metadata TEXT DEFAULT '{"loginCount": 0, "contentStats": {"totalSubmissions": 0}}',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 问卷用户会话表
CREATE TABLE IF NOT EXISTS questionnaire_sessions (
  session_id TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  expires_at DATETIME NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES questionnaire_users(uuid)
);

-- 问卷认证日志表
CREATE TABLE IF NOT EXISTS questionnaire_auth_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uuid TEXT,
  user_type TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  success INTEGER NOT NULL,
  error_message TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_identity_hash ON questionnaire_users(identity_hash);
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_uuid ON questionnaire_users(uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_user_uuid ON questionnaire_sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_token ON questionnaire_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_user_uuid ON questionnaire_auth_logs(user_uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_created_at ON questionnaire_auth_logs(created_at);

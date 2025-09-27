-- 创建问卷认证系统所需的数据库表

-- 问卷用户表
CREATE TABLE IF NOT EXISTS questionnaire_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  identity_hash TEXT UNIQUE,
  display_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('anonymous', 'semi_anonymous')),
  permissions TEXT NOT NULL DEFAULT '[]',
  profile TEXT NOT NULL DEFAULT '{}',
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 问卷会话表
CREATE TABLE IF NOT EXISTS questionnaire_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  user_uuid TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_uuid) REFERENCES questionnaire_users(uuid) ON DELETE CASCADE
);

-- 问卷认证日志表
CREATE TABLE IF NOT EXISTS questionnaire_auth_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uuid TEXT,
  user_type TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_uuid) REFERENCES questionnaire_users(uuid) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_uuid ON questionnaire_users(uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_identity_hash ON questionnaire_users(identity_hash);
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_user_type ON questionnaire_users(user_type);
CREATE INDEX IF NOT EXISTS idx_questionnaire_users_status ON questionnaire_users(status);

CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_session_id ON questionnaire_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_user_uuid ON questionnaire_sessions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_session_token ON questionnaire_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_expires_at ON questionnaire_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_questionnaire_sessions_is_active ON questionnaire_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_user_uuid ON questionnaire_auth_logs(user_uuid);
CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_action ON questionnaire_auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_created_at ON questionnaire_auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_questionnaire_auth_logs_success ON questionnaire_auth_logs(success);

-- 创建触发器以自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_questionnaire_users_updated_at
  AFTER UPDATE ON questionnaire_users
  FOR EACH ROW
  BEGIN
    UPDATE questionnaire_users SET updated_at = datetime('now') WHERE uuid = NEW.uuid;
  END;

-- 创建触发器以清理过期会话
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
  AFTER INSERT ON questionnaire_sessions
  FOR EACH ROW
  BEGIN
    DELETE FROM questionnaire_sessions 
    WHERE expires_at < datetime('now') AND is_active = 0;
  END;

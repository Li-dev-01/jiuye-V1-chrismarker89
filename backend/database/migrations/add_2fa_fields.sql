-- ============================================
-- 2FA 功能增强迁移脚本
-- 添加日期：2025-10-06
-- ============================================

-- 1. 为 login_sessions 表添加 requires_2fa 字段
ALTER TABLE login_sessions ADD COLUMN requires_2fa BOOLEAN DEFAULT FALSE;

-- 2. 更新 login_method 的检查约束，添加新的登录方式
-- SQLite 不支持直接修改约束，需要重建表
-- 但为了简化，我们先添加注释说明新的登录方式

-- 新的 login_method 值：
-- - 'password': 密码登录
-- - 'google_oauth': Google OAuth 登录
-- - 'google_oauth_2fa': Google OAuth + 2FA 登录
-- - '2fa': 仅 2FA 验证

-- 3. 为 two_factor_verifications 表添加索引（如果还没有）
CREATE INDEX IF NOT EXISTS idx_two_factor_email ON two_factor_verifications(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_time ON two_factor_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_two_factor_success ON two_factor_verifications(is_successful);

-- 4. 为 account_audit_logs 表添加更多索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON account_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON account_audit_logs(success);

-- 5. 创建 2FA 备用代码表（如果不存在）
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- 备用代码的哈希值
  is_used BOOLEAN DEFAULT FALSE,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (email) REFERENCES email_whitelist(email)
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_email ON two_factor_backup_codes(email);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON two_factor_backup_codes(is_used);

-- 6. 创建信任设备表
CREATE TABLE IF NOT EXISTS trusted_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_fingerprint TEXT, -- 设备指纹
  ip_address TEXT,
  user_agent TEXT,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- 信任过期时间（例如30天）
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (email) REFERENCES email_whitelist(email)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_email ON trusted_devices(email);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_id ON trusted_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);


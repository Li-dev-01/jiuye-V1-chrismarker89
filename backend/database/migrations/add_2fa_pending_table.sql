-- ============================================
-- 2FA 待验证表
-- 添加日期：2025-10-06
-- 用途：临时存储待验证的 2FA 设置
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_pending (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL, -- JSON 数组
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL, -- 过期时间（10分钟）
  
  FOREIGN KEY (email_id) REFERENCES email_whitelist(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_2fa_pending_email_id ON two_factor_pending(email_id);
CREATE INDEX IF NOT EXISTS idx_2fa_pending_expires ON two_factor_pending(expires_at);


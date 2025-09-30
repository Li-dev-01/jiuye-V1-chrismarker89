-- 用户举报审核系统数据库设计
-- 支持举报管理、恶意举报检测、审核免疫机制

-- 1. 用户举报记录表
CREATE TABLE IF NOT EXISTS user_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 举报内容信息
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'questionnaire', 'comment')),
  content_id INTEGER NOT NULL,
  content_uuid TEXT,
  
  -- 举报人信息
  reporter_user_id INTEGER NOT NULL,
  reporter_ip TEXT,
  reporter_user_agent TEXT,
  
  -- 被举报内容作者
  reported_user_id INTEGER NOT NULL,
  
  -- 举报详情
  report_type TEXT NOT NULL CHECK (report_type IN (
    'political',      -- 政治敏感
    'pornographic',   -- 色情内容
    'violent',        -- 暴力血腥
    'harassment',     -- 骚扰辱骂
    'spam',           -- 垃圾广告
    'privacy',        -- 隐私泄露
    'fake_info',      -- 虚假信息
    'off_topic',      -- 偏离主题
    'other'           -- 其他
  )),
  report_reason TEXT,           -- 举报理由
  report_evidence JSON,         -- 举报证据 (截图URL等)
  
  -- 举报状态
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- 待处理
    'reviewing',      -- 审核中
    'valid',          -- 举报有效
    'invalid',        -- 举报无效
    'malicious',      -- 恶意举报
    'auto_dismissed'  -- 自动驳回 (内容已审核通过)
  )),
  
  -- 处理结果
  review_result TEXT CHECK (review_result IN (
    'content_removed',      -- 内容已删除
    'content_approved',     -- 内容无问题
    'reporter_warned',      -- 举报人被警告
    'reporter_blocked',     -- 举报人被封禁
    NULL
  )),
  review_notes TEXT,
  reviewed_by TEXT,         -- 审核员ID
  reviewed_at DATETIME,
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id)
);

-- 2. 内容审核免疫记录表
CREATE TABLE IF NOT EXISTS content_review_immunity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 内容信息
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'questionnaire', 'comment')),
  content_id INTEGER NOT NULL,
  content_uuid TEXT,
  
  -- 免疫信息
  immunity_type TEXT NOT NULL CHECK (immunity_type IN (
    'manual_approved',    -- 人工审核通过
    'ai_high_confidence', -- AI高置信度通过
    'multiple_reviews',   -- 多次审核通过
    'admin_whitelist'     -- 管理员白名单
  )),
  
  -- 审核详情
  review_count INTEGER DEFAULT 1,        -- 审核次数
  last_review_result TEXT,               -- 最后审核结果
  last_reviewer TEXT,                    -- 最后审核员
  immunity_granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  immunity_granted_by TEXT,              -- 授予免疫的审核员
  
  -- 免疫有效期
  expires_at DATETIME,                   -- 过期时间 (NULL表示永久)
  is_active BOOLEAN DEFAULT TRUE,        -- 是否激活
  
  -- 备注
  notes TEXT,
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束：同一内容只能有一条激活的免疫记录
  UNIQUE(content_type, content_id, is_active)
);

-- 3. 举报人信誉分析表
CREATE TABLE IF NOT EXISTS reporter_reputation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- 举报统计
  total_reports INTEGER DEFAULT 0,           -- 总举报次数
  valid_reports INTEGER DEFAULT 0,           -- 有效举报次数
  invalid_reports INTEGER DEFAULT 0,         -- 无效举报次数
  malicious_reports INTEGER DEFAULT 0,       -- 恶意举报次数
  
  -- 信誉评分 (0-100)
  reputation_score REAL DEFAULT 100.0,
  
  -- 信誉等级
  reputation_level TEXT DEFAULT 'normal' CHECK (reputation_level IN (
    'excellent',   -- 优秀 (90-100)
    'good',        -- 良好 (70-89)
    'normal',      -- 正常 (50-69)
    'poor',        -- 较差 (30-49)
    'bad'          -- 恶劣 (0-29)
  )),
  
  -- 时间统计
  reports_last_24h INTEGER DEFAULT 0,
  reports_last_7d INTEGER DEFAULT 0,
  reports_last_30d INTEGER DEFAULT 0,
  
  -- 限制状态
  is_restricted BOOLEAN DEFAULT FALSE,       -- 是否被限制举报
  restriction_reason TEXT,
  restricted_until DATETIME,
  
  -- 时间信息
  first_report_at DATETIME,
  last_report_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 举报审核队列表
CREATE TABLE IF NOT EXISTS report_review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL UNIQUE,
  
  -- 优先级计算
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1最高，10最低
  priority_factors JSON,             -- 优先级计算因素
  
  -- 分配信息
  assigned_to TEXT,
  assigned_at DATETIME,
  
  -- 处理状态
  status TEXT DEFAULT 'waiting' CHECK (status IN (
    'waiting',    -- 等待处理
    'assigned',   -- 已分配
    'reviewing',  -- 审核中
    'completed'   -- 已完成
  )),
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  
  FOREIGN KEY (report_id) REFERENCES user_reports(id)
);

-- 5. 举报处理日志表
CREATE TABLE IF NOT EXISTS report_action_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  
  -- 操作信息
  action_type TEXT NOT NULL CHECK (action_type IN (
    'created',           -- 举报创建
    'assigned',          -- 分配审核员
    'reviewed',          -- 审核完成
    'content_removed',   -- 内容删除
    'content_approved',  -- 内容通过
    'reporter_warned',   -- 举报人警告
    'auto_dismissed'     -- 自动驳回
  )),
  
  action_by TEXT,                    -- 操作人
  action_details JSON,               -- 操作详情
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (report_id) REFERENCES user_reports(id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_reports_content ON user_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_immunity_content ON content_review_immunity(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_immunity_active ON content_review_immunity(is_active);

CREATE INDEX IF NOT EXISTS idx_report_queue_status ON report_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_report_queue_priority ON report_review_queue(priority);

CREATE INDEX IF NOT EXISTS idx_action_logs_report ON report_action_logs(report_id);

-- 创建触发器自动更新举报人信誉
CREATE TRIGGER IF NOT EXISTS update_reporter_reputation
AFTER UPDATE OF status ON user_reports
WHEN NEW.status IN ('valid', 'invalid', 'malicious')
BEGIN
  INSERT OR REPLACE INTO reporter_reputation (
    user_id,
    total_reports,
    valid_reports,
    invalid_reports,
    malicious_reports,
    reputation_score,
    last_report_at,
    updated_at
  )
  SELECT 
    NEW.reporter_user_id,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) as valid,
    SUM(CASE WHEN status = 'invalid' THEN 1 ELSE 0 END) as invalid,
    SUM(CASE WHEN status = 'malicious' THEN 1 ELSE 0 END) as malicious,
    -- 信誉评分计算：有效举报+10分，无效-5分，恶意-20分
    100.0 + 
      (SUM(CASE WHEN status = 'valid' THEN 1 ELSE 0 END) * 10) -
      (SUM(CASE WHEN status = 'invalid' THEN 1 ELSE 0 END) * 5) -
      (SUM(CASE WHEN status = 'malicious' THEN 1 ELSE 0 END) * 20) as score,
    MAX(created_at) as last_report,
    CURRENT_TIMESTAMP
  FROM user_reports 
  WHERE reporter_user_id = NEW.reporter_user_id;
END;

-- 创建视图：举报统计
CREATE VIEW IF NOT EXISTS v_report_statistics AS
SELECT 
  content_type,
  report_type,
  status,
  COUNT(*) as report_count,
  COUNT(DISTINCT reporter_user_id) as unique_reporters,
  COUNT(DISTINCT content_id) as unique_contents,
  AVG(CASE 
    WHEN reviewed_at IS NOT NULL AND created_at IS NOT NULL 
    THEN (julianday(reviewed_at) - julianday(created_at)) * 24 * 60 
    ELSE NULL 
  END) as avg_review_time_minutes
FROM user_reports
GROUP BY content_type, report_type, status;

-- 创建视图：高风险内容 (多次被举报)
CREATE VIEW IF NOT EXISTS v_high_risk_contents AS
SELECT 
  content_type,
  content_id,
  content_uuid,
  COUNT(*) as report_count,
  COUNT(DISTINCT reporter_user_id) as unique_reporters,
  GROUP_CONCAT(DISTINCT report_type) as report_types,
  MAX(created_at) as latest_report_at
FROM user_reports
WHERE status IN ('pending', 'reviewing')
GROUP BY content_type, content_id
HAVING report_count >= 3
ORDER BY report_count DESC, latest_report_at DESC;


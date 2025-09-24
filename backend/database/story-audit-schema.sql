-- 故事审核系统数据库设计
-- 支持三层审核 + 违规内容管理 + 批量恶意检测

-- 1. 待审核故事表
CREATE TABLE IF NOT EXISTS pending_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  
  -- 审核状态管理
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- 待审核
    'rule_checking',  -- 规则审核中
    'rule_passed',    -- 规则审核通过
    'ai_checking',    -- AI审核中
    'ai_passed',      -- AI审核通过
    'manual_review',  -- 需人工审核
    'approved',       -- 最终通过
    'rejected'        -- 最终拒绝
  )),
  
  -- 审核层级
  audit_level INTEGER DEFAULT 1, -- 1:规则 2:AI 3:人工
  
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  rule_audit_at DATETIME,
  ai_audit_at DATETIME,
  manual_audit_at DATETIME,
  approved_at DATETIME,
  
  -- 审核结果详情
  rule_audit_result JSON,  -- 规则审核详细结果
  ai_audit_result JSON,    -- AI审核详细结果
  manual_audit_result JSON, -- 人工审核结果
  
  -- 批量处理
  ai_batch_id TEXT,        -- AI批量审核批次ID
  
  -- 用户信息
  user_ip TEXT,
  user_agent TEXT,
  
  -- 索引优化
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. 违规内容记录表
CREATE TABLE IF NOT EXISTS violation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 关联信息
  pending_story_id INTEGER,
  user_id INTEGER NOT NULL,
  
  -- 违规内容
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- SHA-256哈希，用于重复检测
  
  -- 违规分类
  violation_type TEXT NOT NULL CHECK (violation_type IN (
    'profanity',      -- 辱骂/粗口
    'adult_content',  -- 色情/成人内容
    'political',      -- 政治敏感
    'harassment',     -- 骚扰/威胁
    'spam',           -- 垃圾信息
    'off_topic',      -- 偏离主题
    'malicious',      -- 恶意内容
    'other'           -- 其他
  )),
  
  -- 检测来源
  detected_by TEXT NOT NULL CHECK (detected_by IN (
    'frontend_rule',  -- 前端规则检测
    'backend_rule',   -- 后端规则检测
    'ai_analysis',    -- AI分析检测
    'manual_review'   -- 人工审核检测
  )),
  
  -- 违规详情
  violation_details JSON, -- 具体违规信息
  risk_score REAL,        -- 风险评分 0-1
  confidence REAL,        -- 检测置信度 0-1
  
  -- 用户行为分析
  user_ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 处理状态
  is_analyzed BOOLEAN DEFAULT FALSE,    -- 是否已分析
  is_pattern BOOLEAN DEFAULT FALSE,     -- 是否为模式化违规
  pattern_group_id TEXT,                -- 模式组ID
  
  -- 索引
  FOREIGN KEY (pending_story_id) REFERENCES pending_stories(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 用户违规行为分析表
CREATE TABLE IF NOT EXISTS user_violation_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- 违规统计
  total_violations INTEGER DEFAULT 0,
  violation_types JSON,              -- 各类型违规次数统计
  
  -- 时间分析
  first_violation_at DATETIME,
  last_violation_at DATETIME,
  violations_last_24h INTEGER DEFAULT 0,
  violations_last_7d INTEGER DEFAULT 0,
  violations_last_30d INTEGER DEFAULT 0,
  
  -- 行为模式
  is_suspicious BOOLEAN DEFAULT FALSE,   -- 是否可疑用户
  is_malicious BOOLEAN DEFAULT FALSE,    -- 是否恶意用户
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- 批量行为检测
  rapid_submission_count INTEGER DEFAULT 0,  -- 快速提交次数
  similar_content_count INTEGER DEFAULT 0,   -- 相似内容次数
  
  -- 处理状态
  is_blocked BOOLEAN DEFAULT FALSE,      -- 是否已封禁
  block_reason TEXT,
  blocked_at DATETIME,
  
  -- 更新时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. AI批量审核批次表
CREATE TABLE IF NOT EXISTS ai_audit_batches (
  id TEXT PRIMARY KEY,               -- 批次ID
  
  -- 批次信息
  story_count INTEGER NOT NULL,     -- 故事数量
  batch_type TEXT DEFAULT 'scheduled' CHECK (batch_type IN ('scheduled', 'manual', 'emergency')),
  
  -- 处理状态
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- 待处理
    'processing', -- 处理中
    'completed',  -- 已完成
    'failed'      -- 处理失败
  )),
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  
  -- 处理结果
  processing_time_ms INTEGER,       -- 处理耗时(毫秒)
  success_count INTEGER DEFAULT 0,  -- 成功处理数量
  error_count INTEGER DEFAULT 0,    -- 错误数量
  
  -- AI分析结果统计
  approved_count INTEGER DEFAULT 0,     -- AI通过数量
  rejected_count INTEGER DEFAULT 0,     -- AI拒绝数量
  manual_review_count INTEGER DEFAULT 0, -- 需人工审核数量
  
  -- 详细结果
  batch_result JSON,                -- 批次处理详细结果
  error_details JSON                -- 错误详情
);

-- 5. 人工审核队列表
CREATE TABLE IF NOT EXISTS manual_review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pending_story_id INTEGER NOT NULL UNIQUE,
  
  -- 优先级
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1最高，10最低
  
  -- 分配信息
  assigned_to TEXT,                 -- 分配给的审核员
  assigned_at DATETIME,
  
  -- 处理状态
  status TEXT DEFAULT 'waiting' CHECK (status IN (
    'waiting',    -- 等待审核
    'assigned',   -- 已分配
    'reviewing',  -- 审核中
    'completed'   -- 已完成
  )),
  
  -- 审核结果
  review_result TEXT CHECK (review_result IN ('approve', 'reject', NULL)),
  review_reason TEXT,
  review_notes TEXT,
  
  -- 时间信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  
  FOREIGN KEY (pending_story_id) REFERENCES pending_stories(id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_pending_stories_status ON pending_stories(status);
CREATE INDEX IF NOT EXISTS idx_pending_stories_user_id ON pending_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_stories_created_at ON pending_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_stories_ai_batch ON pending_stories(ai_batch_id);

CREATE INDEX IF NOT EXISTS idx_violation_records_user_id ON violation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_violation_records_type ON violation_records(violation_type);
CREATE INDEX IF NOT EXISTS idx_violation_records_hash ON violation_records(content_hash);
CREATE INDEX IF NOT EXISTS idx_violation_records_created_at ON violation_records(created_at);

CREATE INDEX IF NOT EXISTS idx_manual_review_status ON manual_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_manual_review_priority ON manual_review_queue(priority);
CREATE INDEX IF NOT EXISTS idx_manual_review_assigned ON manual_review_queue(assigned_to);

-- 创建触发器自动更新统计
CREATE TRIGGER IF NOT EXISTS update_violation_analysis
AFTER INSERT ON violation_records
BEGIN
  INSERT OR REPLACE INTO user_violation_analysis (
    user_id, 
    total_violations,
    first_violation_at,
    last_violation_at,
    violations_last_24h,
    updated_at
  )
  SELECT 
    NEW.user_id,
    COUNT(*) as total,
    MIN(created_at) as first_time,
    MAX(created_at) as last_time,
    COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_24h,
    CURRENT_TIMESTAMP
  FROM violation_records 
  WHERE user_id = NEW.user_id;
END;

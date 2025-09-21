# 数据库设计规范 V1

## 🎯 设计原则

- **规范化**: 遵循第三范式，避免数据冗余
- **性能优化**: 合理使用索引和分区
- **扩展性**: 支持未来功能扩展
- **安全性**: 数据脱敏和权限控制
- **一致性**: 统一的命名规范和数据类型

## 📋 核心表结构

### 1. 用户管理

#### users (用户表)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  email TEXT UNIQUE,                      -- 邮箱
  username TEXT UNIQUE,                   -- 用户名
  password_hash TEXT,                     -- 密码哈希
  role TEXT DEFAULT 'user',               -- 角色: user/reviewer/admin/superadmin
  status TEXT DEFAULT 'active',           -- 状态: active/inactive/banned
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### anonymous_users (匿名用户表)
```sql
CREATE TABLE anonymous_users (
  id TEXT PRIMARY KEY,                    -- UUID
  session_token TEXT UNIQUE,              -- 会话令牌
  ip_address TEXT,                        -- IP地址
  user_agent TEXT,                        -- 用户代理
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anonymous_session ON anonymous_users(session_token);
CREATE INDEX idx_anonymous_created ON anonymous_users(created_at);
```

### 2. 问卷系统

#### questionnaire_responses (问卷响应表)
```sql
CREATE TABLE questionnaire_responses (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT,                          -- 关联用户ID (可为空)
  anonymous_id TEXT,                     -- 匿名用户ID (可为空)
  
  -- 基本信息
  education_level TEXT NOT NULL,          -- 学历层次
  major TEXT,                            -- 专业
  graduation_year INTEGER,               -- 毕业年份
  region TEXT,                           -- 地区
  
  -- 就业状况
  employment_status TEXT,                -- 就业状态
  job_search_duration TEXT,              -- 求职时长
  job_satisfaction INTEGER,              -- 工作满意度 (1-10)
  salary_range TEXT,                     -- 薪资范围
  
  -- 开放性问题
  advice_for_students TEXT,              -- 给学弟学妹的建议
  observation_on_employment TEXT,        -- 对就业形势的观察
  
  -- 元数据
  status TEXT DEFAULT 'pending',         -- 状态: pending/approved/rejected
  source TEXT DEFAULT 'web',             -- 来源: web/api/import
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 审核信息
  reviewer_id TEXT,                      -- 审核员ID
  reviewed_at DATETIME,                  -- 审核时间
  review_notes TEXT                      -- 审核备注
);

CREATE INDEX idx_questionnaire_education ON questionnaire_responses(education_level);
CREATE INDEX idx_questionnaire_status ON questionnaire_responses(status);
CREATE INDEX idx_questionnaire_created ON questionnaire_responses(created_at);
```

#### questionnaire_voices (问卷心声表)
```sql
CREATE TABLE questionnaire_voices (
  id TEXT PRIMARY KEY,                    -- UUID
  questionnaire_id TEXT,                 -- 关联问卷ID
  title TEXT,                            -- 标题
  content TEXT NOT NULL,                 -- 内容
  type TEXT DEFAULT 'advice',            -- 类型: advice/observation
  
  -- 状态管理
  status TEXT DEFAULT 'pending',         -- 状态: pending/approved/rejected/published
  quality_score REAL DEFAULT 0.0,       -- 质量评分
  
  -- 发布信息
  published_at DATETIME,                 -- 发布时间
  featured BOOLEAN DEFAULT FALSE,        -- 是否精选
  view_count INTEGER DEFAULT 0,          -- 浏览次数
  like_count INTEGER DEFAULT 0,          -- 点赞次数
  
  -- 审核信息
  reviewer_id TEXT,                      -- 审核员ID
  reviewed_at DATETIME,                  -- 审核时间
  review_notes TEXT,                     -- 审核备注
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voices_status ON questionnaire_voices(status);
CREATE INDEX idx_voices_published ON questionnaire_voices(published_at);
CREATE INDEX idx_voices_featured ON questionnaire_voices(featured);
```

### 3. 内容管理

#### stories (故事表)
```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT,                          -- 用户ID
  title TEXT NOT NULL,                   -- 标题
  content TEXT NOT NULL,                 -- 内容
  summary TEXT,                          -- 摘要
  tags TEXT DEFAULT '[]',                -- 标签 (JSON数组)
  
  -- 状态管理
  status TEXT DEFAULT 'pending',         -- 状态
  quality_score REAL DEFAULT 0.0,       -- 质量评分
  
  -- 发布信息
  published_at DATETIME,                 -- 发布时间
  featured BOOLEAN DEFAULT FALSE,        -- 是否精选
  view_count INTEGER DEFAULT 0,          -- 浏览次数
  like_count INTEGER DEFAULT 0,          -- 点赞次数
  
  -- 审核信息
  reviewer_id TEXT,                      -- 审核员ID
  reviewed_at DATETIME,                  -- 审核时间
  review_notes TEXT,                     -- 审核备注
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_published ON stories(published_at);
CREATE INDEX idx_stories_featured ON stories(featured);
```

### 4. 系统管理

#### review_logs (审核日志表)
```sql
CREATE TABLE review_logs (
  id TEXT PRIMARY KEY,                    -- UUID
  reviewer_id TEXT NOT NULL,             -- 审核员ID
  content_type TEXT NOT NULL,            -- 内容类型: questionnaire/voice/story
  content_id TEXT NOT NULL,              -- 内容ID
  action TEXT NOT NULL,                  -- 操作: approve/reject/edit
  reason TEXT,                           -- 原因
  notes TEXT,                            -- 备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_logs_reviewer ON review_logs(reviewer_id);
CREATE INDEX idx_review_logs_content ON review_logs(content_type, content_id);
CREATE INDEX idx_review_logs_created ON review_logs(created_at);
```

#### system_stats (系统统计表)
```sql
CREATE TABLE system_stats (
  id TEXT PRIMARY KEY,                    -- UUID
  metric_name TEXT NOT NULL,             -- 指标名称
  metric_value REAL NOT NULL,            -- 指标值
  metric_type TEXT DEFAULT 'counter',    -- 指标类型: counter/gauge/histogram
  tags TEXT DEFAULT '{}',                -- 标签 (JSON对象)
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stats_name ON system_stats(metric_name);
CREATE INDEX idx_stats_recorded ON system_stats(recorded_at);
```

## 🔧 数据库配置

### 连接配置
```typescript
interface DatabaseConfig {
  database: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  retryAttempts: number;
}
```

### 迁移策略
- 使用版本化迁移脚本
- 支持回滚操作
- 自动备份机制
- 零停机部署

### 性能优化
- 合理使用索引
- 查询优化
- 连接池管理
- 缓存策略

## 📊 数据关系图

```
users ──┐
        ├── questionnaire_responses
        ├── questionnaire_voices
        └── stories

anonymous_users ── questionnaire_responses

questionnaire_responses ── questionnaire_voices

review_logs ──┐
              ├── questionnaire_responses
              ├── questionnaire_voices
              └── stories
```

## 🛡️ 安全考虑

- 敏感数据加密存储
- SQL注入防护
- 访问权限控制
- 数据备份和恢复
- 审计日志记录

---

*此设计基于现有项目分析，优化了数据结构和性能，确保系统的稳定性和扩展性。*

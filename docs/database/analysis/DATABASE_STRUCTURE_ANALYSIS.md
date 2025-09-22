# 线上数据库结构完整分析

## 📊 **核心表结构分析**

### 1. **用户系统 (双表结构)**

#### **users表** (传统用户表)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT datetime('now'),
  updated_at TEXT NOT NULL DEFAULT datetime('now')
);
```

**现有数据示例**:
- `admin-user-id-001` | `admin` | `admin@example.com` | `super_admin`
- `reviewer-user-id-001` | `reviewer1` | `reviewer1@example.com` | `reviewer`
- `normal-user-id-001` | `user1` | `user1@example.com` | `user`

#### **universal_users表** (新用户系统)
```sql
CREATE TABLE universal_users (
  uuid TEXT PRIMARY KEY,
  user_type TEXT NOT NULL,  -- 'super_admin', 'admin', 'reviewer', 'semi_anonymous', 'anonymous'
  identity_hash TEXT,
  username TEXT,
  password_hash TEXT,
  display_name TEXT,
  role TEXT,
  permissions TEXT,  -- JSON数组
  profile TEXT,      -- JSON对象
  metadata TEXT,     -- JSON对象
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT datetime('now'),
  updated_at TEXT NOT NULL DEFAULT datetime('now'),
  last_active_at TEXT NOT NULL DEFAULT datetime('now')
);
```

**现有数据特点**:
- 支持多种用户类型 (super_admin, admin, reviewer)
- JSON格式的权限和配置信息
- 复杂的用户元数据结构

### 2. **问卷系统 (双表结构)**

#### **questionnaire_responses表** (传统问卷)
```sql
CREATE TABLE questionnaire_responses (
  id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
  user_id TEXT,
  personal_info TEXT NOT NULL,    -- JSON
  education_info TEXT NOT NULL,   -- JSON
  employment_info TEXT NOT NULL,  -- JSON
  job_search_info TEXT NOT NULL,  -- JSON
  employment_status TEXT NOT NULL, -- JSON
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT datetime('now'),
  updated_at TEXT NOT NULL DEFAULT datetime('now')
);
```

**数据格式示例**:
```json
{
  "personal_info": {"name":"张三","gender":"male","age":22,"phone":"13800138001"},
  "education_info": {"university":"北京大学","major":"计算机科学与技术","degree":"bachelor"},
  "employment_info": {"preferredIndustry":["互联网"],"expectedSalary":12000},
  "job_search_info": {"searchChannels":["校园招聘"],"interviewCount":5},
  "employment_status": {"currentStatus":"employed","currentSalary":11000}
}
```

#### **universal_questionnaire_responses表** (新问卷系统)
```sql
CREATE TABLE universal_questionnaire_responses (
  id INTEGER PRIMARY KEY,
  questionnaire_id TEXT NOT NULL,
  user_id INTEGER,  -- 外键到users.id (但users.id是TEXT类型!)
  response_data TEXT NOT NULL,  -- JSON
  submitted_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**⚠️ 关键问题**: user_id字段是INTEGER类型，但users表的id字段是TEXT类型，存在类型不匹配！

### 3. **分析数据表**

#### **analytics_responses表** (核心分析表)
```sql
CREATE TABLE analytics_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- 外键到users.id
  submitted_at TEXT NOT NULL,
  age_range TEXT,
  education_level TEXT,
  employment_status TEXT,
  salary_range TEXT,
  work_location TEXT,
  industry TEXT,
  gender TEXT,
  job_search_channels TEXT,
  difficulties TEXT,
  skills TEXT,
  policy_suggestions TEXT,
  salary_expectation INTEGER,
  work_experience_months INTEGER,
  job_search_duration_months INTEGER,
  data_quality_score REAL DEFAULT 1.0,
  is_complete INTEGER DEFAULT 1,
  processing_version TEXT DEFAULT 'v1.0',
  is_test_data INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT datetime('now'),
  updated_at TEXT NOT NULL DEFAULT datetime('now'),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**外键约束**: `analytics_responses.user_id` → `users.id`

## 🔗 **数据流转关系**

### **主要数据流**:
1. **用户注册** → `users` 表
2. **问卷提交** → `universal_questionnaire_responses` 表
3. **数据处理** → `analytics_responses` 表 (用于统计分析)
4. **缓存优化** → `realtime_stats`, `aggregated_stats`, `dashboard_cache`

### **外键关系**:
- `analytics_responses.user_id` → `users.id` (CASCADE)
- `universal_questionnaire_responses.user_id` → `users.id` (SET NULL)

## 📋 **测试数据要求**

### **必须满足的约束**:
1. **外键约束**: 必须先在`users`表中创建用户，再创建相关数据
2. **数据格式**: JSON字段必须是有效的JSON格式
3. **字段类型**: 严格按照表结构的数据类型
4. **必填字段**: 所有NOT NULL字段必须有值

### **推荐的测试数据结构**:
1. **用户数据**: 50-100个测试用户
2. **问卷数据**: 200-500份完整问卷
3. **分析数据**: 与问卷数据一一对应
4. **多样性**: 覆盖所有枚举值和边界情况

## 🎯 **下一步行动计划**

1. **创建兼容的测试数据生成器**
2. **按正确顺序导入数据** (users → questionnaire → analytics)
3. **验证数据完整性和外键约束**
4. **测试API数据流转**
5. **验证缓存和同步机制**

# 大学生就业问卷调查平台 - 数据库设计

## 总体架构

本项目采用3层数据结构设计，确保数据完整性、审核流程和性能优化：

1. **临时存储表A** - 用户提交的原始问卷数据
2. **有效数据表B** - 经过审核的有效问卷数据  
3. **可视化副表** - 用于数据可视化的静态统计表

## 核心设计原则

- **数据隔离**：原始数据与有效数据分离
- **审核流程**：所有数据必须经过审核才能用于统计
- **性能优化**：可视化数据预计算，避免实时查询
- **数据完整性**：完整的外键约束和数据验证

---

## 1. 用户管理相关表

### users - 用户表
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    avatar_url VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

---

## 2. 问卷数据表 - 3层结构

### questionnaire_submissions_temp (表A) - 临时存储表
用户提交的原始问卷数据，等待审核
```sql
CREATE TABLE questionnaire_submissions_temp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    -- 基本信息
    age INT,
    gender ENUM('male', 'female', 'other'),
    education_level ENUM('high_school', 'associate', 'bachelor', 'master', 'phd'),
    major VARCHAR(100),
    graduation_year INT,
    location_province VARCHAR(50),
    location_city VARCHAR(50),
    
    -- 就业状况
    employment_status ENUM('employed', 'unemployed', 'student', 'freelance'),
    job_title VARCHAR(100),
    company_name VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    industry VARCHAR(100),
    work_experience_years INT,
    
    -- 薪资信息
    current_salary INT,
    expected_salary INT,
    salary_satisfaction ENUM('very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied'),
    
    -- 求职经历
    job_search_duration_months INT,
    job_applications_count INT,
    interviews_count INT,
    job_offers_count INT,
    job_search_channels JSON, -- ['online', 'referral', 'campus', 'agency']
    
    -- 技能与培训
    technical_skills JSON, -- ['programming', 'design', 'marketing', ...]
    soft_skills JSON, -- ['communication', 'leadership', 'teamwork', ...]
    certifications JSON, -- 证书列表
    training_programs JSON, -- 培训经历
    
    -- 职业发展
    career_goals TEXT,
    industry_preference JSON,
    work_location_preference JSON,
    work_mode_preference ENUM('onsite', 'remote', 'hybrid'),
    
    -- 挑战与困难
    job_search_challenges JSON, -- 求职遇到的困难
    skill_gaps JSON, -- 技能缺口
    market_concerns TEXT, -- 对就业市场的担忧
    
    -- 元数据
    submission_source VARCHAR(50) DEFAULT 'web', -- 提交来源
    ip_address INET,
    user_agent TEXT,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 审核状态
    review_status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    reviewer_id UUID,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_review_status (review_status),
    INDEX idx_submission_time (submission_time),
    INDEX idx_reviewer_id (reviewer_id)
);
```

### questionnaire_submissions (表B) - 有效数据表
经过审核的有效问卷数据，用于统计分析
```sql
CREATE TABLE questionnaire_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temp_submission_id UUID UNIQUE NOT NULL, -- 关联临时表
    user_id UUID,
    
    -- 数据字段与临时表相同，但去掉审核相关字段
    age INT,
    gender ENUM('male', 'female', 'other'),
    education_level ENUM('high_school', 'associate', 'bachelor', 'master', 'phd'),
    major VARCHAR(100),
    graduation_year INT,
    location_province VARCHAR(50),
    location_city VARCHAR(50),
    
    employment_status ENUM('employed', 'unemployed', 'student', 'freelance'),
    job_title VARCHAR(100),
    company_name VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    industry VARCHAR(100),
    work_experience_years INT,
    
    current_salary INT,
    expected_salary INT,
    salary_satisfaction ENUM('very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied'),
    
    job_search_duration_months INT,
    job_applications_count INT,
    interviews_count INT,
    job_offers_count INT,
    job_search_channels JSON,
    
    technical_skills JSON,
    soft_skills JSON,
    certifications JSON,
    training_programs JSON,
    
    career_goals TEXT,
    industry_preference JSON,
    work_location_preference JSON,
    work_mode_preference ENUM('onsite', 'remote', 'hybrid'),
    
    job_search_challenges JSON,
    skill_gaps JSON,
    market_concerns TEXT,
    
    -- 元数据
    original_submission_time TIMESTAMP,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID,
    
    FOREIGN KEY (temp_submission_id) REFERENCES questionnaire_submissions_temp(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 统计查询优化索引
    INDEX idx_age (age),
    INDEX idx_gender (gender),
    INDEX idx_education_level (education_level),
    INDEX idx_employment_status (employment_status),
    INDEX idx_location_province (location_province),
    INDEX idx_industry (industry),
    INDEX idx_graduation_year (graduation_year),
    INDEX idx_approved_at (approved_at)
);
```

---

## 3. 可视化数据表 (静态统计表)

### analytics_summary - 总体统计摘要
```sql
CREATE TABLE analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基础统计
    total_submissions INT DEFAULT 0,
    total_users INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    average_completion_time INT DEFAULT 0, -- 秒

    -- 就业统计
    employment_rate DECIMAL(5,2) DEFAULT 0,
    average_salary INT DEFAULT 0,
    median_salary INT DEFAULT 0,
    salary_satisfaction_avg DECIMAL(3,2) DEFAULT 0,

    -- 求职统计
    avg_job_search_duration DECIMAL(5,2) DEFAULT 0,
    avg_applications_count DECIMAL(5,2) DEFAULT 0,
    avg_interview_success_rate DECIMAL(5,2) DEFAULT 0,

    -- 时间范围
    period_type ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT 'daily',
    period_start DATE,
    period_end DATE,

    -- 元数据
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_version INT DEFAULT 1,

    INDEX idx_period (period_type, period_start, period_end),
    INDEX idx_last_updated (last_updated)
);
```

### analytics_demographics - 人口统计数据
```sql
CREATE TABLE analytics_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 维度
    dimension_type ENUM('age', 'gender', 'education', 'location', 'graduation_year'),
    dimension_value VARCHAR(100),

    -- 统计数据
    count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    avg_salary INT DEFAULT 0,
    employment_rate DECIMAL(5,2) DEFAULT 0,

    -- 时间范围
    period_start DATE,
    period_end DATE,

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_dimension (dimension_type, dimension_value),
    INDEX idx_period (period_start, period_end),
    UNIQUE KEY unique_dimension_period (dimension_type, dimension_value, period_start, period_end)
);
```

### analytics_employment - 就业状况统计
```sql
CREATE TABLE analytics_employment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 就业维度
    employment_status ENUM('employed', 'unemployed', 'student', 'freelance'),
    industry VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    work_mode ENUM('onsite', 'remote', 'hybrid'),

    -- 统计数据
    count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    avg_salary INT DEFAULT 0,
    median_salary INT DEFAULT 0,
    salary_range_min INT DEFAULT 0,
    salary_range_max INT DEFAULT 0,

    -- 时间范围
    period_start DATE,
    period_end DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_employment_status (employment_status),
    INDEX idx_industry (industry),
    INDEX idx_company_size (company_size),
    INDEX idx_period (period_start, period_end)
);
```

### analytics_skills - 技能统计
```sql
CREATE TABLE analytics_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 技能信息
    skill_type ENUM('technical', 'soft'),
    skill_name VARCHAR(100),

    -- 统计数据
    mention_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    avg_salary_with_skill INT DEFAULT 0,
    employment_rate_with_skill DECIMAL(5,2) DEFAULT 0,

    -- 关联数据
    top_industries JSON, -- 该技能最常见的行业
    top_job_titles JSON, -- 该技能最常见的职位

    -- 时间范围
    period_start DATE,
    period_end DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_skill (skill_type, skill_name),
    INDEX idx_mention_count (mention_count DESC),
    INDEX idx_period (period_start, period_end)
);
```

---

## 4. 内容管理表

### stories - 故事墙
```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('job_search', 'career_change', 'success', 'challenge', 'advice') DEFAULT 'job_search',
    tags JSON, -- 标签数组

    -- 互动数据
    likes_count INT DEFAULT 0,
    views_count INT DEFAULT 0,

    -- 状态管理
    status ENUM('draft', 'published', 'hidden', 'deleted') DEFAULT 'draft',
    is_anonymous BOOLEAN DEFAULT true,

    -- 审核
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderator_id UUID,
    moderation_notes TEXT,
    moderated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_moderation_status (moderation_status),
    INDEX idx_published_at (published_at),
    INDEX idx_likes_count (likes_count DESC)
);
```

### voices - 问卷心声
```sql
CREATE TABLE voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,

    content TEXT NOT NULL,
    mood ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',

    -- 互动数据
    likes_count INT DEFAULT 0,

    -- 状态管理
    status ENUM('published', 'hidden', 'deleted') DEFAULT 'published',
    is_anonymous BOOLEAN DEFAULT true,

    -- 审核
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderator_id UUID,
    moderated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_mood (mood),
    INDEX idx_status (status),
    INDEX idx_moderation_status (moderation_status),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_likes_count (likes_count DESC)
);
```

---

## 5. 系统管理表

### audit_logs - 审计日志
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 操作信息
    user_id UUID,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
    resource_type VARCHAR(50) NOT NULL, -- 'questionnaire', 'story', 'voice', 'user'
    resource_id UUID,

    -- 详细信息
    old_values JSON, -- 操作前的数据
    new_values JSON, -- 操作后的数据
    ip_address INET,
    user_agent TEXT,

    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at DESC)
);
```

### system_settings - 系统设置
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,

    -- 分组
    category VARCHAR(50) DEFAULT 'general',

    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by UUID,

    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_category (category),
    INDEX idx_setting_key (setting_key)
);
```

### data_sync_logs - 数据同步日志
```sql
CREATE TABLE data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 同步信息
    sync_type ENUM('temp_to_valid', 'valid_to_analytics') NOT NULL,
    source_table VARCHAR(100),
    target_table VARCHAR(100),

    -- 同步结果
    status ENUM('running', 'success', 'failed', 'partial') DEFAULT 'running',
    records_processed INT DEFAULT 0,
    records_success INT DEFAULT 0,
    records_failed INT DEFAULT 0,

    -- 详细信息
    error_message TEXT,
    sync_details JSON, -- 详细的同步信息

    -- 时间信息
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INT,

    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at DESC)
);
```

---

## 6. 数据字典和枚举值

### 教育水平 (education_level)
- `high_school`: 高中/中专
- `associate`: 大专
- `bachelor`: 本科
- `master`: 硕士
- `phd`: 博士

### 就业状态 (employment_status)
- `employed`: 已就业
- `unemployed`: 待就业
- `student`: 在校学生
- `freelance`: 自由职业

### 公司规模 (company_size)
- `startup`: 创业公司 (1-20人)
- `small`: 小型企业 (21-100人)
- `medium`: 中型企业 (101-500人)
- `large`: 大型企业 (501-2000人)
- `enterprise`: 超大型企业 (2000人以上)

### 工作模式 (work_mode_preference)
- `onsite`: 现场办公
- `remote`: 远程办公
- `hybrid`: 混合办公

### 薪资满意度 (salary_satisfaction)
- `very_dissatisfied`: 非常不满意
- `dissatisfied`: 不满意
- `neutral`: 一般
- `satisfied`: 满意
- `very_satisfied`: 非常满意

---

## 7. 索引策略

### 查询优化索引
```sql
-- 复合索引用于常见查询组合
CREATE INDEX idx_submissions_demographics ON questionnaire_submissions
    (education_level, gender, age, location_province);

CREATE INDEX idx_submissions_employment ON questionnaire_submissions
    (employment_status, industry, company_size);

CREATE INDEX idx_submissions_salary ON questionnaire_submissions
    (current_salary, expected_salary, employment_status);

-- 时间范围查询索引
CREATE INDEX idx_submissions_time_range ON questionnaire_submissions
    (approved_at, employment_status);

-- 全文搜索索引
CREATE FULLTEXT INDEX idx_stories_content ON stories (title, content);
CREATE FULLTEXT INDEX idx_voices_content ON voices (content);
```

---

## 8. 数据同步策略

### A表到B表的审核流程
1. 管理员在审核界面查看待审核数据
2. 审核通过后，数据从临时表复制到有效数据表
3. 更新临时表的审核状态
4. 记录审核日志

### B表到可视化表的定时同步
1. 每日凌晨2点执行数据统计任务
2. 计算各维度的统计数据
3. 更新可视化副表
4. 记录同步日志

### 数据一致性保证
- 使用事务确保数据一致性
- 定期数据校验任务
- 异常情况回滚机制

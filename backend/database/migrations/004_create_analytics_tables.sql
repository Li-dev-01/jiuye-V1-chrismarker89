-- Migration: 004_create_analytics_tables
-- Description: 创建可视化数据表 (静态统计表)
-- Created: 2024-01-27

-- 总体统计摘要表
CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基础统计
    total_submissions INT DEFAULT 0,
    total_users INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    average_completion_time INT DEFAULT 0,
    
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
    data_version INT DEFAULT 1
);

-- 人口统计数据表
CREATE TABLE IF NOT EXISTS analytics_demographics (
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
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 就业状况统计表
CREATE TABLE IF NOT EXISTS analytics_employment (
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
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技能统计表
CREATE TABLE IF NOT EXISTS analytics_skills (
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
    top_industries JSON,
    top_job_titles JSON,
    
    -- 时间范围
    period_start DATE,
    period_end DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_analytics_summary_period ON analytics_summary(period_type, period_start, period_end);
CREATE INDEX idx_analytics_summary_updated ON analytics_summary(last_updated);

CREATE INDEX idx_demographics_dimension ON analytics_demographics(dimension_type, dimension_value);
CREATE INDEX idx_demographics_period ON analytics_demographics(period_start, period_end);
CREATE UNIQUE INDEX idx_demographics_unique ON analytics_demographics(dimension_type, dimension_value, period_start, period_end);

CREATE INDEX idx_employment_status ON analytics_employment(employment_status);
CREATE INDEX idx_employment_industry ON analytics_employment(industry);
CREATE INDEX idx_employment_company_size ON analytics_employment(company_size);
CREATE INDEX idx_employment_period ON analytics_employment(period_start, period_end);

CREATE INDEX idx_skills_type_name ON analytics_skills(skill_type, skill_name);
CREATE INDEX idx_skills_mention_count ON analytics_skills(mention_count DESC);
CREATE INDEX idx_skills_period ON analytics_skills(period_start, period_end);

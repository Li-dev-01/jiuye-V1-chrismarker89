-- Migration: 003_create_questionnaire_valid_table
-- Description: 创建问卷有效数据表 (表B)
-- Created: 2024-01-27

CREATE TABLE IF NOT EXISTS questionnaire_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temp_submission_id UUID UNIQUE NOT NULL,
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
    job_search_channels JSON,
    
    -- 技能与培训
    technical_skills JSON,
    soft_skills JSON,
    certifications JSON,
    training_programs JSON,
    
    -- 职业发展
    career_goals TEXT,
    industry_preference JSON,
    work_location_preference JSON,
    work_mode_preference ENUM('onsite', 'remote', 'hybrid'),
    
    -- 挑战与困难
    job_search_challenges JSON,
    skill_gaps JSON,
    market_concerns TEXT,
    
    -- 元数据
    original_submission_time TIMESTAMP,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID,
    
    FOREIGN KEY (temp_submission_id) REFERENCES questionnaire_submissions_temp(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建统计查询优化索引
CREATE INDEX idx_valid_age ON questionnaire_submissions(age);
CREATE INDEX idx_valid_gender ON questionnaire_submissions(gender);
CREATE INDEX idx_valid_education_level ON questionnaire_submissions(education_level);
CREATE INDEX idx_valid_employment_status ON questionnaire_submissions(employment_status);
CREATE INDEX idx_valid_location_province ON questionnaire_submissions(location_province);
CREATE INDEX idx_valid_industry ON questionnaire_submissions(industry);
CREATE INDEX idx_valid_graduation_year ON questionnaire_submissions(graduation_year);
CREATE INDEX idx_valid_approved_at ON questionnaire_submissions(approved_at);
CREATE INDEX idx_valid_company_size ON questionnaire_submissions(company_size);
CREATE INDEX idx_valid_work_mode ON questionnaire_submissions(work_mode_preference);

-- 复合索引用于常见查询组合
CREATE INDEX idx_valid_demographics ON questionnaire_submissions(education_level, gender, age, location_province);
CREATE INDEX idx_valid_employment ON questionnaire_submissions(employment_status, industry, company_size);
CREATE INDEX idx_valid_salary ON questionnaire_submissions(current_salary, expected_salary, employment_status);
